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

export function PublicVault({ hideHeader = false }: { hideHeader?: boolean }) {
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
          'Connect the owner transaction wallet on the settlement network and reconcile pending transactions first.',
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
          'Correct transaction signer and network required; reconcile pending transactions first.',
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
    <div className="space-y-6">
      {!hideHeader && (
        <header>
          <p className="eyebrow">Institutional Liquidity</p>
          <h1 className="page-title">Yield Pools & Custody</h1>
          <p className="page-description">
            Supply collateral to mint pool shares or redeem shares for underlying assets
            with slippage-protected execution.
          </p>
        </header>
      )}

      {!isVaultConfigured && (
        <p role="status" className="panel text-sm text-muted-foreground">
          Pool contract address awaiting configuration. Connect your wallet to prepare
          treasury operations once active.
        </p>
      )}

      {isVaultConfigured && !isVaultProvenanceConfigured && (
        <p role="status" className="panel text-sm text-muted-foreground">
          Contract code provenance verification required before submitting deposits.
        </p>
      )}

      {!address && (
        <p className="panel text-sm text-muted-foreground">
          Connect your transaction wallet to view live pool balances, shares, and
          withdrawal limits.
        </p>
      )}

      {address && !connected && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Switch your wallet to the active settlement network before signing.
        </p>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          Pool state unavailable: {getReadableErrorMessage(state.error)}{' '}
          {data ? 'Showing previous verified read.' : ''}
        </p>
      )}

      {data && (
        <section className="panel space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">On-chain position</h2>
            <span className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-primary tabular-nums">
              Block #{data.block.toString()} · {data.frozen ? 'Deposits Paused' : 'Active'}
            </span>
          </div>

          <p className="break-all font-mono text-sm text-muted-foreground">
            Pool: {vault} · Asset: {asset}
          </p>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Wallet collateral</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">
                {formatUnits(data.balance, data.decimals)} {data.symbol}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Vault shares</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">
                {formatUnits(data.shares, data.shareDecimals)}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Position value</dt>
              <dd className="mt-1 text-xl font-bold text-primary tabular-nums">
                {formatUnits(data.assets, data.decimals)} {data.symbol}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Total vault assets</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">
                {formatUnits(data.totalAssets, data.decimals)} {data.symbol}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Maximum withdrawal</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">
                {formatUnits(data.maxWithdraw, data.decimals)} {data.symbol}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Approved allowance</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums">
                {formatUnits(data.allowance, data.decimals)} {data.symbol}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3">
            <button
              className="quiet-link text-sm"
              disabled={disabled || state.isFetching}
              onClick={() => void state.refetch()}
            >
              Refresh position
            </button>
            {data.allowance > 0n && (
              <button
                className="quiet-link text-sm"
                disabled={disabled || !connected}
                onClick={() => void transact(0n)}
              >
                Remove vault allowance
              </button>
            )}
          </div>
        </section>
      )}

      <section className="panel space-y-5">
        <h2 className="text-xl font-bold">Execute Pool Operation</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Operation
            <select
              aria-label="Operation"
              className="mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-3 text-base"
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
          <label className="block text-sm font-medium">
            {operation === 'deposit' ? 'Collateral amount' : 'Shares to redeem'}
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-3 text-base tabular-nums"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              disabled={disabled}
              onChange={(e) => {
                setAmount(e.target.value);
                setReview(undefined);
              }}
            />
          </label>
        </div>

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
          <div className="space-y-4 rounded-xl border border-border bg-secondary p-5">
            <p className="text-base font-semibold tabular-nums">
              Expected output:{' '}
              {formatUnits(
                usableReview.preview,
                operation === 'deposit' ? data.shareDecimals : data.decimals,
              )}{' '}
              {operation === 'deposit' ? 'shares' : data.symbol}
            </p>
            <p className="text-sm text-muted-foreground tabular-nums">
              Protected minimum (0.5% max slippage):{' '}
              {formatUnits(
                usableReview.minimum,
                operation === 'deposit' ? data.shareDecimals : data.decimals,
              )}{' '}
              · Valid until {new Date(Number(usableReview.deadline) * 1000).toLocaleTimeString()}
            </p>
            <div className="flex flex-wrap gap-3">
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
          </div>
        )}
      </section>

      {busy && <p role="status" className="text-sm text-muted-foreground">Waiting for wallet or chain confirmation…</p>}
      {status && <p role="status" className="text-sm font-medium text-primary">{status}</p>}
      {error && (
        <p role="alert" className="break-words text-sm text-destructive">
          {error}
        </p>
      )}
      {pending && (
        <section className="panel space-y-3">
          <p className="break-all font-mono text-sm">
            Submitted transaction: {pending.hash}
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
        <p className="panel break-words text-sm">
          {evidence.text}
          <br />
          <span className="font-mono text-muted-foreground">
            Transaction: {evidence.hash}
          </span>
        </p>
      )}
    </div>
  );
}
