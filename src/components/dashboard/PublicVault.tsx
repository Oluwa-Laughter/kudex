'use client';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { erc20Abi, formatUnits, type Address, type Hash } from 'viem';
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
export function PublicVault() {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState<'deposit' | 'redeem'>('deposit');
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
        'Pending transaction reference could not be restored. Inspect wallet activity before retrying.',
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
        'Transaction recovery storage is unavailable. Keep this page open and retain the transaction hash.',
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
          'Connect the owner EVM wallet on Portaldot and reconcile pending transactions first.',
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
        throw new Error('Amount exceeds available balance or the vault operation limit.');
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
        throw new Error('Amount is too small for a positive protected output.');
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
      throw new Error('Transaction reverted. No financial success reported.');
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
        throw new Error('Approval receipt identity mismatch. Requires reconciliation.');
      const allowance = await client.readContract({
        address: asset,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [tx.owner, vault],
        blockNumber: receipt.blockNumber,
      });
      if (allowance !== tx.approval)
        throw new Error(
          'Expected exact allowance not observed. Requires reconciliation.',
        );
    }
    const finality = await receiptFinality(client, receipt);
    if (finality === 'unknown')
      throw new Error('Receipt block is no longer canonical. Requires reconciliation.');
    setPending(undefined);
    setReview(undefined);
    setEvidence({
      hash: receipt.transactionHash,
      owner: tx.owner,
      text: `${tx.review ? (tx.review.operation === 'deposit' ? 'Deposit' : 'Redemption') : 'Allowance update'} ${finality}. Matching receipt and chain state verified.`,
    });
    const refreshed = await state.refetch();
    if (refreshed.error)
      setStatus(
        'Receipt verified; position refresh unavailable. Refresh before another action.',
      );
    else setStatus('Position refreshed from chain.');
  }
  async function transact(approval?: bigint) {
    await guarded(async () => {
      if (!client || !address || !connected || pending)
        throw new Error(
          'Correct EVM signer and network required; reconcile pending transactions first.',
        );
      // Allowance removal remains available even when provenance changed.
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
            'Review the deposit and remove any existing allowance before approving its exact amount.',
          );
        setStatus(
          'Simulating exact allowance. Review the separate token approval in your wallet.',
        );
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
          throw new Error('Review expired or account changed. Review again.');
        if (
          r.operation === 'deposit' &&
          (fresh.allowance < r.input ||
            fresh.balance < r.input ||
            fresh.maxDeposit < r.input)
        )
          throw new Error('Deposit allowance, balance, or limit changed.');
        if (r.operation === 'redeem' && fresh.maxRedeem < r.input)
          throw new Error('Redeemable shares changed.');
        setStatus(
          'Simulating bounded execution. Review the vault transaction in your wallet.',
        );
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
      setStatus('Submitted. Awaiting receipt verification. Do not submit again.');
      await reconcile(tx, true);
    });
  }
  const disabled = !restored || busy || Boolean(pending);
  return (
    <div className="space-y-7">
      <header>
        <p className="eyebrow">Portaldot testnet · public ERC-4626 custody</p>
        <h1 className="page-title">Public vault</h1>
        <p className="page-description">
          Deposit collateral for vault shares or redeem your shares for available assets.
          No APY, principal guarantee, credit tranches, or confidentiality is provided.
        </p>
      </header>
      {!isVaultConfigured && (
        <p role="status" className="panel">
          Vault deployment pending. Verified vault and collateral addresses are required.
          No transaction is available.
        </p>
      )}
      {isVaultConfigured && !isVaultProvenanceConfigured && (
        <p role="status" className="panel">
          Deployment provenance pending. Import finalized receipts and compiled creation
          artifacts to configure runtime code hashes before spending.
        </p>
      )}
      {!address && (
        <p className="panel">
          Connect an EVM wallet to inspect your actual position. Native account mapping
          does not grant EVM signing authority.
        </p>
      )}
      {address && !connected && (
        <p role="alert">Switch your wallet to Portaldot V3 Testnet before signing.</p>
      )}
      {state.error && (
        <p role="alert">
          Vault data unavailable. {getReadableErrorMessage(state.error)}{' '}
          {data ? 'The displayed observation is stale.' : ''}
        </p>
      )}
      {data && (
        <section className="panel space-y-5">
          <h2 className="text-xl font-semibold">On-chain position</h2>
          <p className="break-all text-xs">
            Vault: {vault}
            <br />
            Collateral: {asset}
          </p>
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt>Wallet collateral</dt>
              <dd>
                {formatUnits(data.balance, data.decimals)} {data.symbol}
              </dd>
            </div>
            <div>
              <dt>Vault shares</dt>
              <dd>{formatUnits(data.shares, data.shareDecimals)}</dd>
            </div>
            <div>
              <dt>Position assets (conversion)</dt>
              <dd>
                {formatUnits(data.assets, data.decimals)} {data.symbol}
              </dd>
            </div>
            <div>
              <dt>Total vault assets</dt>
              <dd>
                {formatUnits(data.totalAssets, data.decimals)} {data.symbol}
              </dd>
            </div>
            <div>
              <dt>Maximum withdrawal</dt>
              <dd>
                {formatUnits(data.maxWithdraw, data.decimals)} {data.symbol}
              </dd>
            </div>
            <div>
              <dt>Token allowance to vault</dt>
              <dd>
                {formatUnits(data.allowance, data.decimals)} {data.symbol}
              </dd>
            </div>
          </dl>
          <p className="text-sm">
            Observed block {data.block.toString()} ·{' '}
            {data.frozen ? 'Deposits frozen' : 'Deposits not frozen'}
          </p>
          <button
            className="quiet-link"
            disabled={disabled || state.isFetching}
            onClick={() => void state.refetch()}
          >
            Refresh position
          </button>
          {data.allowance > 0n && (
            <button
              className="quiet-link"
              disabled={disabled || !connected}
              onClick={() => void transact(0n)}
            >
              Remove vault allowance
            </button>
          )}
        </section>
      )}
      <section className="panel space-y-5">
        <h2 className="text-xl font-semibold">Review a transaction</h2>
        <label className="block">
          Operation
          <select
            aria-label="Operation"
            className="mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-3"
            disabled={disabled}
            value={operation}
            onChange={(e) => {
              setOperation(e.target.value as 'deposit' | 'redeem');
              setReview(undefined);
            }}
          >
            <option value="deposit">Deposit assets</option>
            <option value="redeem">Redeem shares</option>
          </select>
        </label>
        <label className="block">
          {operation === 'deposit' ? 'Collateral amount' : 'Shares to redeem'}
          <input
            className="mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-3"
            inputMode="decimal"
            value={amount}
            disabled={disabled}
            onChange={(e) => {
              setAmount(e.target.value);
              setReview(undefined);
            }}
          />
        </label>
        <button
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
          Review vault transaction
        </button>
        {usableReview && data && (
          <div className="space-y-4 rounded-xl border border-border p-4">
            <p>
              Expected output:{' '}
              {formatUnits(
                usableReview.preview,
                operation === 'deposit' ? data.shareDecimals : data.decimals,
              )}{' '}
              {operation === 'deposit' ? 'shares' : data.symbol}
            </p>
            <p>
              Minimum output (0.5% tolerance):{' '}
              {formatUnits(
                usableReview.minimum,
                operation === 'deposit' ? data.shareDecimals : data.decimals,
              )}
              . Deadline: {new Date(Number(usableReview.deadline) * 1000).toISOString()}.
              Gas is additional.
            </p>
            {operation === 'deposit' && data.allowance < usableReview.input && (
              <button
                className="quiet-link"
                disabled={disabled || data.allowance > 0n || !connected}
                onClick={() => void transact(usableReview.input)}
              >
                Approve exact deposit amount
              </button>
            )}
            <button
              className="action-link disabled:opacity-40"
              disabled={
                disabled ||
                !connected ||
                (operation === 'deposit' && data.allowance < usableReview.input)
              }
              onClick={() => void transact()}
            >
              Confirm {operation} in wallet
            </button>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Approvals and execution are separate signatures. Review the minimum output,
          expiry and gas in your wallet. If receipt history is unavailable, retain the
          transaction hash and reconcile before submitting again.
        </p>
      </section>
      {busy && <p role="status">Waiting for wallet or chain…</p>}
      {status && <p role="status">{status}</p>}
      {error && (
        <p role="alert" className="break-words text-destructive">
          {error}
        </p>
      )}
      {pending && (
        <section className="panel space-y-4">
          <p className="break-all">Submitted / requires reconciliation: {pending.hash}</p>
          <p>
            A submitted hash is not success. Actions remain locked until a receipt is
            verified.
          </p>
          <button
            className="quiet-link"
            disabled={busy}
            onClick={() => void guarded(() => reconcile(pending, false))}
          >
            Reconcile receipt
          </button>
        </section>
      )}
      {evidence && evidence.owner.toLowerCase() === address?.toLowerCase() && (
        <p className="panel break-words">
          {evidence.text}
          <br />
          Transaction: {evidence.hash}
        </p>
      )}
    </div>
  );
}
