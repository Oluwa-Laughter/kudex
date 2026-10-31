'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient, useSignMessage, useWriteContract } from 'wagmi';
import { erc20Abi, formatUnits, type Address, type Hash, type Hex } from 'viem';
import { FiLock, FiArrowDownLeft, FiTrendingUp } from 'react-icons/fi';
import {
  buildNoteSyncDomainMessage,
  createPrivateNoteMetadata,
  deriveNoteEncryptionKey,
  encryptNoteMetadata,
  usePrivateNotesStore,
} from '@/lib/crypto/noteSync';
import {
  CONTRACT_ADDRESSES,
  isVaultConfigured,
  isVaultProvenanceConfigured,
  VAULT_CODE_HASH,
  COLLATERAL_CODE_HASH,
} from '@/lib/contracts/addresses';
import { kudexVaultAbi } from '@/lib/contracts/abis';
import {
  exactAmount,
  assertVaultProvenance,
  readVault,
  receiptFinality,
  verifyVaultReceipt,
} from '@/lib/contracts/vault-client';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { getReadableErrorMessage } from '@/lib/utils';
import {
  decodePendingVault,
  encodePendingVault,
  type VaultReview as Review,
  type PendingVaultTransaction as Pending,
} from '@/lib/contracts/pending-vault';

const { vault, usdc: asset } = CONTRACT_ADDRESSES;

export function PublicVault({
  selectedVaultTitle = 'Short-Term Treasury Vault',
}: {
  selectedVaultTitle?: string;
}) {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const privateNotes = usePrivateNotesStore();
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState<'deposit' | 'redeem'>('deposit');
  const [stealthDeposit, setStealthDeposit] = useState(false);
  const [review, setReview] = useState<Review>();
  const [pending, setPending] = useState<Pending>();
  const [evidence, setEvidence] = useState<{
    hash: Hash;
    owner: Address;
    text: string;
  }>();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [restored, setRestored] = useState(false);
  const pendingKey = `kudex-pending-vault-420420777-${vault.toLowerCase()}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(pendingKey);
      if (raw) setPending(decodePendingVault(raw, vault, asset));
    } catch {
      setError(
        'A previous vault transaction could not be restored automatically. Check your wallet activity before trying again.',
      );
    }
    setRestored(true);
  }, [pendingKey]);

  useEffect(() => {
    if (!restored) return;
    try {
      if (pending)
        localStorage.setItem(pendingKey, encodePendingVault(pending, vault, asset));
      else localStorage.removeItem(pendingKey);
    } catch {
      setError(
        'Browser recovery storage is unavailable. Keep this tab open until your transaction confirms.',
      );
    }
  }, [pending, pendingKey, restored]);

  const state = useQuery({
    queryKey: ['public-vault', portaldotTestnet.id, vault, asset, address],
    enabled: isVaultConfigured && Boolean(client && address),
    retry: 0,
    staleTime: 10_000,
    refetchInterval: 30_000,
    queryFn: () => readVault(client!, vault, asset, address!),
  });

  const data = state.data;
  const usableReview =
    review?.owner.toLowerCase() === address?.toLowerCase() ? review : undefined;
  const connected = Boolean(address && chainId === portaldotTestnet.id);

  async function guarded(work: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setStatus('');
    try {
      await work();
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function inspect() {
    await guarded(async () => {
      setReview(undefined);
      if (!client || !address || !connected || pending)
        throw new Error(
          'Connect your wallet on the active network and wait for any pending transaction first.',
        );
      const fresh = await readVault(client, vault, asset, address);
      const input = exactAmount(
        amount,
        operation === 'deposit' ? fresh.decimals : fresh.shareDecimals,
      );
      if (
        operation === 'deposit'
          ? input > fresh.balance || input > fresh.maxDeposit
          : input > fresh.maxRedeem
      )
        throw new Error('Amount exceeds your available wallet or vault balance.');
      const preview =
        operation === 'deposit'
          ? await client.readContract({
              address: vault,
              abi: kudexVaultAbi,
              functionName: 'previewDeposit',
              args: [input],
              blockNumber: fresh.block,
            })
          : await client.readContract({
              address: vault,
              abi: kudexVaultAbi,
              functionName: 'previewRedeem',
              args: [input],
              blockNumber: fresh.block,
            });
      const minimum = (preview * 9950n) / 10000n;
      if (minimum <= 0n)
        throw new Error('Enter a slightly larger amount to receive a protected output.');
      setReview({
        owner: address,
        operation,
        input,
        minimum,
        preview,
        deadline: fresh.timestamp + 600n,
      });
    });
  }

  async function reconcile(tx: Pending, wait: boolean) {
    if (!client) throw new Error('Network client unavailable.');
    const receipt = wait
      ? await client.waitForTransactionReceipt({
          hash: tx.hash,
          timeout: 120_000,
          onReplaced: ({ transactionReceipt }) =>
            setPending({ ...tx, hash: transactionReceipt.transactionHash }),
        })
      : await client.getTransactionReceipt({ hash: tx.hash });
    if (receipt.status !== 'success') {
      setPending(undefined);
      throw new Error('Transaction did not complete. Your funds were not moved.');
    }
    if (tx.review)
      verifyVaultReceipt(
        receipt,
        vault,
        tx.owner,
        tx.review.operation,
        tx.review.input,
        tx.review.minimum,
      );
    else {
      if (
        receipt.from.toLowerCase() !== tx.owner.toLowerCase() ||
        receipt.to?.toLowerCase() !== asset.toLowerCase()
      )
        throw new Error('Approval receipt did not match your wallet.');
      const allowance = await client.readContract({
        address: asset,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [tx.owner, vault],
        blockNumber: receipt.blockNumber,
      });
      if (allowance !== tx.approval)
        throw new Error('Exact spending approval did not match.');
    }
    const finality = await receiptFinality(client, receipt);
    if (finality === 'unknown')
      throw new Error('Receipt block changed. Refresh your balance before continuing.');
    setPending(undefined);
    setReview(undefined);
    setEvidence({
      hash: receipt.transactionHash,
      owner: tx.owner,
      text: `${tx.review ? (tx.review.operation === 'deposit' ? 'Deposit' : 'Withdrawal') : 'Spending approval'} ${finality}. Your updated vault balance is verified.`,
    });
    const refreshed = await state.refetch();
    if (refreshed.error)
      setStatus(
        'Transaction confirmed; click Refresh balance before starting another action.',
      );
    else setStatus('Vault balance updated from live network.');
  }

  async function transact(approval?: bigint) {
    await guarded(async () => {
      if (!client || !address || !connected || pending)
        throw new Error(
          'Connect your wallet on the active network and finish any pending transaction first.',
        );
      if (approval !== 0n)
        await assertVaultProvenance(
          client,
          vault,
          asset,
          VAULT_CODE_HASH,
          COLLATERAL_CODE_HASH,
        );
      const fresh = await readVault(client, vault, asset, address);
      let hash: Hash;
      if (approval !== undefined) {
        if (
          approval !== 0n &&
          (!usableReview ||
            usableReview.operation !== 'deposit' ||
            approval !== usableReview.input ||
            fresh.allowance !== 0n)
        )
          throw new Error(
            'Review your deposit first and clear any previous spending approval before approving a new amount.',
          );
        setStatus('Confirm the exact deposit approval in your wallet.');
        const simulation = await client.simulateContract({
          address: asset,
          abi: erc20Abi,
          functionName: 'approve',
          args: [vault, approval],
          account: address,
        });
        hash = await writeContractAsync({
          ...simulation.request,
          account: address,
          chainId: portaldotTestnet.id,
        });
      } else {
        const r = usableReview;
        if (!r || fresh.timestamp > r.deadline)
          throw new Error('Your quote expired. Click Review Vault Transaction again.');
        if (
          r.operation === 'deposit' &&
          (fresh.allowance < r.input ||
            fresh.balance < r.input ||
            fresh.maxDeposit < r.input)
        )
          throw new Error('Your wallet balance or approval changed. Review again.');
        if (r.operation === 'redeem' && fresh.maxRedeem < r.input)
          throw new Error('Your withdrawable vault shares changed. Review again.');

        if (r.operation === 'deposit' && stealthDeposit) {
          setStatus('Sign key derivation message to back up your Stealth Mode note…');
          const keySig = await signMessageAsync({
            message: buildNoteSyncDomainMessage(address),
          });
          const aesKey = await deriveNoteEncryptionKey(keySig);
          const note = await createPrivateNoteMetadata({
            owner: address,
            recipient: address,
            value: formatUnits(r.input, fresh.decimals),
            decimals: fresh.decimals,
            assetSymbol: fresh.symbol,
            memo: `${selectedVaultTitle} Stealth Deposit`,
          });
          const encryptedMemo = await encryptNoteMetadata(aesKey, note);

          setStatus('Confirm your Stealth Mode vault deposit in your wallet.');
          const simulation = await client.simulateContract({
            address: vault,
            abi: kudexVaultAbi,
            functionName: 'shieldDeposit',
            args: [r.input, note.commitment as Hex, address, encryptedMemo],
            account: address,
          });
          hash = await writeContractAsync({
            ...simulation.request,
            account: address,
            chainId: portaldotTestnet.id,
          });
          await client.waitForTransactionReceipt({ hash });
          privateNotes.recordLocalNote(note, hash);
          setReview(undefined);
          setAmount('');
          setEvidence({
            hash,
            owner: address,
            text: 'Deposit confirmed in Stealth Mode with encrypted cross-device backup.',
          });
          await state.refetch();
          setStatus('Vault balance updated in Stealth Mode.');
          return;
        }

        setStatus('Confirm your vault transaction in your wallet.');
        const simulation = await client.simulateContract({
          address: vault,
          abi: kudexVaultAbi,
          functionName:
            r.operation === 'deposit' ? 'depositWithMinimum' : 'redeemWithMinimum',
          args: [r.input, address, r.minimum, r.deadline],
          account: address,
        });
        hash = await writeContractAsync({
          ...simulation.request,
          account: address,
          chainId: portaldotTestnet.id,
        });
      }
      const tx = {
        hash,
        owner: address,
        ...(approval !== undefined ? { approval } : { review: usableReview }),
      };
      setPending(tx);
      setStatus('Transaction submitted. Verifying confirmation…');
      await reconcile(tx, true);
    });
  }

  const disabled = !restored || busy || Boolean(pending);

  return (
    <div className="space-y-6">
      {/* Simple Deposit / Withdraw Box */}
      <section className="panel space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Deposit or Withdraw Funds</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selected vault: <strong className="text-foreground">{selectedVaultTitle}</strong>
            </p>
          </div>

          <div
            role="group"
            aria-label="Choose deposit or withdraw"
            className="inline-flex flex-wrap gap-2 rounded-xl border border-border bg-secondary p-1"
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setOperation('deposit');
                setReview(undefined);
              }}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                operation === 'deposit'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FiLock aria-hidden="true" />
              <span>Deposit &amp; Hide Balance</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                setOperation('redeem');
                setReview(undefined);
              }}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${
                operation === 'redeem'
                  ? 'bg-card text-accent shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FiArrowDownLeft aria-hidden="true" />
              <span>Withdraw to Wallet</span>
            </button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="vault-amount-input" className="mb-2 block text-sm font-medium">
              {operation === 'deposit' ? 'Deposit Amount' : 'Vault Shares to Withdraw'}
            </label>
            <input
              id="vault-amount-input"
              className="field-input font-bold tabular-nums"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              disabled={disabled}
              onChange={(e) => {
                setAmount(e.target.value);
                setReview(undefined);
              }}
            />
          </div>

          <div className="flex flex-col justify-end">
            {operation === 'deposit' ? (
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={stealthDeposit}
                  onChange={(e) => setStealthDeposit(e.target.checked)}
                  disabled={disabled}
                  className="h-4 w-4 rounded accent-primary"
                />
                <span>Record deposit in Private Balances (Stealth Mode)</span>
              </label>
            ) : (
              <div className="flex min-h-12 items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
                <FiTrendingUp className="text-primary" aria-hidden="true" />
                <span>0.5% minimum-output protection applied automatically</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="action-link disabled:opacity-40"
            disabled={
              disabled ||
              !isVaultProvenanceConfigured ||
              !connected ||
              !amount ||
              state.isError
            }
            onClick={() => void inspect()}
          >
            Review Vault Transaction
          </button>

          {!address && (
            <span className="text-sm text-muted-foreground">
              Connect your wallet in the top bar to deposit or withdraw.
            </span>
          )}
          {address && !connected && (
            <span role="alert" className="text-sm text-destructive">
              Switch your wallet to the active network before confirming.
            </span>
          )}
          {!isVaultConfigured && (
            <span role="status" className="text-sm text-muted-foreground">
              Business vault contract is awaiting configuration on this deployment.
            </span>
          )}
        </div>

        {usableReview && data && (
          <div className="space-y-4 rounded-xl border border-border bg-secondary p-5">
            <p className="text-base font-bold tabular-nums">
              Estimated Receive:{' '}
              {formatUnits(
                usableReview.preview,
                operation === 'deposit' ? data.shareDecimals : data.decimals,
              )}{' '}
              {operation === 'deposit' ? 'vault shares' : data.symbol}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              Guaranteed Minimum:{' '}
              {formatUnits(
                usableReview.minimum,
                operation === 'deposit' ? data.shareDecimals : data.decimals,
              )}{' '}
              · Quote valid until{' '}
              {new Date(Number(usableReview.deadline) * 1000).toLocaleTimeString()}
            </p>
            <div className="flex flex-wrap gap-3">
              {operation === 'deposit' && data.allowance < usableReview.input && (
                <button
                  type="button"
                  className="quiet-link"
                  disabled={disabled || data.allowance > 0n || !connected}
                  onClick={() => void transact(usableReview.input)}
                >
                  Approve Exact Deposit Amount
                </button>
              )}
              <button
                type="button"
                className="action-link disabled:opacity-40"
                disabled={
                  disabled ||
                  !connected ||
                  (operation === 'deposit' && data.allowance < usableReview.input)
                }
                onClick={() => void transact()}
              >
                {operation === 'deposit'
                  ? 'Confirm Deposit in Wallet'
                  : 'Confirm Withdrawal in Wallet'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Live Vault Balance Summary when connected */}
      {data && (
        <section className="panel space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Your Vault Balance</h2>
            <span className="emerald-badge tabular-nums">
              {data.frozen ? 'New Deposits Paused' : 'Active & Protected'}
            </span>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Available in Wallet</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">
                {formatUnits(data.balance, data.decimals)} {data.symbol}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Your Vault Value</dt>
              <dd className="mt-1 text-xl font-bold text-primary tabular-nums">
                {formatUnits(data.assets, data.decimals)} {data.symbol}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Your Vault Shares</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">
                {formatUnits(data.shares, data.shareDecimals)}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Withdrawable Now</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">
                {formatUnits(data.maxWithdraw, data.decimals)} {data.symbol}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="quiet-link text-sm"
              disabled={disabled || state.isFetching}
              onClick={() => void state.refetch()}
            >
              Refresh Balance
            </button>
            {data.allowance > 0n && (
              <button
                type="button"
                className="quiet-link text-sm"
                disabled={disabled || !connected}
                onClick={() => void transact(0n)}
              >
                Clear Unused Approval
              </button>
            )}
          </div>
        </section>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          Vault balance could not be loaded: {getReadableErrorMessage(state.error)}
        </p>
      )}
      {busy && (
        <p role="status" className="text-sm text-muted-foreground">
          Waiting for wallet confirmation…
        </p>
      )}
      {status && (
        <p role="status" className="text-sm font-medium text-primary">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="break-words text-sm text-destructive">
          {error}
        </p>
      )}
      {pending && (
        <section className="panel space-y-3">
          <p className="break-all font-mono text-sm">
            Pending transaction: {pending.hash}
          </p>
          <button
            type="button"
            className="quiet-link"
            disabled={busy}
            onClick={() => void guarded(() => reconcile(pending, false))}
          >
            Check Transaction Receipt
          </button>
        </section>
      )}
      {evidence && evidence.owner.toLowerCase() === address?.toLowerCase() && (
        <p className="panel break-words text-sm">
          {evidence.text}
          <br />
          <span className="font-mono text-muted-foreground">
            Receipt: {evidence.hash}
          </span>
        </p>
      )}
    </div>
  );
}
