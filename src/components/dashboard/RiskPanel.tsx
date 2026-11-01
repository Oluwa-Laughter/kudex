'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from 'wagmi';
import { z } from 'zod';
import { formatUnits, parseUnits, zeroAddress } from 'viem';
import {
  FiRefreshCw,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiUnlock,
} from 'react-icons/fi';
import { isVaultConfigured, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { kudexDaaSAdapterAbi, kudexVaultAbi } from '@/lib/contracts/abis';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { LIVE_ACTIVITY_QUERY_KEY } from '@/lib/hooks/useLiveActivity';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';

const snapshotSchema = z.object({
  status: z.literal('observed'),
  vault: z.string(),
  symbol: z.string(),
  decimals: z.number().optional(),
  totalAssets: z.string(),
  depositFrozen: z.boolean(),
  riskScoreBps: z
    .string()
    .regex(/^\d+$/)
    .refine((value) => BigInt(value) <= 10_000n),
  block: z.string().regex(/^\d+$/),
  observedAt: z.string().datetime(),
});

const PROTECTION_STAGES = [
  {
    stage: 1,
    title: 'Triggered',
    detail: 'Late invoice obligation or risk threshold detected on-chain.',
  },
  {
    stage: 2,
    title: 'Validated',
    detail: 'Automated obligation verification confirmed against pool rules.',
  },
  {
    stage: 3,
    title: 'Deposits Paused',
    detail: 'New deposits frozen while remaining collateral is locked for depositors.',
  },
  {
    stage: 4,
    title: 'Reserve Merged',
    detail: 'Payment Protection Reserve funds committed to cover pool shortfalls.',
  },
  {
    stage: 5,
    title: 'Recovery Active',
    detail: 'Vault depositors claim their pro-rata collateral plus reserve payout.',
  },
] as const;

export function RiskPanel() {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();

  const [claimSharesInput, setClaimSharesInput] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState('');
  const [claimError, setClaimError] = useState('');

  const connected = Boolean(address && chainId === portaldotTestnet.id);
  const adapterConfigured =
    CONTRACT_ADDRESSES.daasAdapter !== zeroAddress &&
    CONTRACT_ADDRESSES.vault !== zeroAddress;

  const snapshot = useQuery({
    queryKey: ['vault-protection', CONTRACT_ADDRESSES.vault],
    enabled: isVaultConfigured,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: 0,
    queryFn: async ({ signal }) => {
      const response = await fetch('/api/protocol/vault', { signal });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || 'Vault protection status could not be loaded.');
      return snapshotSchema.parse(body);
    },
  });

  const healthFactorRead = useReadContract({
    address: CONTRACT_ADDRESSES.daasAdapter,
    abi: kudexDaaSAdapterAbi,
    functionName: 'calculateHealthFactor',
    args: [CONTRACT_ADDRESSES.vault],
    chainId: portaldotTestnet.id,
    query: {
      enabled: adapterConfigured,
      staleTime: 12_000,
    },
  });

  const recoveryStateRead = useReadContract({
    address: CONTRACT_ADDRESSES.daasAdapter,
    abi: kudexDaaSAdapterAbi,
    functionName: 'getDaaSRecoveryState',
    args: [CONTRACT_ADDRESSES.vault],
    chainId: portaldotTestnet.id,
    query: {
      enabled: adapterConfigured,
      staleTime: 10_000,
    },
  });

  const userVaultSharesRead = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: kudexVaultAbi,
    functionName: 'balanceOf',
    args: [address ?? zeroAddress],
    chainId: portaldotTestnet.id,
    query: {
      enabled: isVaultConfigured && Boolean(address),
      staleTime: 10_000,
    },
  });

  const vaultDecimalsRead = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: kudexVaultAbi,
    functionName: 'decimals',
    chainId: portaldotTestnet.id,
    query: {
      enabled: isVaultConfigured,
      staleTime: 60_000,
    },
  });

  const shareDecimals =
    typeof vaultDecimalsRead.data === 'number'
      ? vaultDecimalsRead.data
      : (snapshot.data?.decimals ?? 6);
  const tokenSymbol = snapshot.data?.symbol ?? 'USDC';

  const currentStage = recoveryStateRead.data ? Number(recoveryStateRead.data.stage) : 0;
  const reserveCommitted = recoveryStateRead.data?.reserveCommitted ?? 0n;
  const userShares =
    typeof userVaultSharesRead.data === 'bigint' ? userVaultSharesRead.data : 0n;

  const previewClaimRead = useReadContract({
    address: CONTRACT_ADDRESSES.daasAdapter,
    abi: kudexDaaSAdapterAbi,
    functionName: 'previewRecoveryClaim',
    args: [CONTRACT_ADDRESSES.vault, userShares],
    chainId: portaldotTestnet.id,
    query: {
      enabled: adapterConfigured && currentStage === 5 && userShares > 0n,
      staleTime: 10_000,
    },
  });

  const data = snapshot.data;
  const riskPercent = data
    ? Number(formatUnits(BigInt(data.riskScoreBps), 2))
    : 0;

  const healthPercent =
    typeof healthFactorRead.data === 'bigint'
      ? Math.min(100, Number(formatUnits(healthFactorRead.data, 2)))
      : Math.max(0, 100 - riskPercent);

  const protectionStatus =
    currentStage === 5
      ? 'Stage 5 Active — Pro-Rata Recovery Open'
      : currentStage > 0
        ? `Protection Stage ${currentStage} of 5 Active`
        : !data
          ? 'Protected — Safety Reserve Ready'
          : data.depositFrozen || riskPercent >= 85
            ? 'Pool Paused — Recovery Active'
            : 'Protected — 100% Solvency Reserve';

  async function handleRefreshProtection() {
    await Promise.all([
      snapshot.refetch(),
      healthFactorRead.refetch(),
      recoveryStateRead.refetch(),
      userVaultSharesRead.refetch(),
    ]);
  }

  async function handleClaimRecoveryShare(event: React.FormEvent) {
    event.preventDefault();
    setClaiming(true);
    setClaimError('');
    setClaimStatus('');
    try {
      if (!address || !connected || !client || !adapterConfigured) {
        throw new Error(
          'Connect your wallet on the active network to claim your recovery share.',
        );
      }
      if (currentStage !== 5) {
        throw new Error(
          'Recovery withdrawals open automatically once Stage 5 (Recovery Active) is reached.',
        );
      }
      const sharesToClaim = claimSharesInput.trim()
        ? parseUnits(claimSharesInput.trim(), shareDecimals)
        : userShares;
      if (sharesToClaim <= 0n || sharesToClaim > userShares) {
        throw new Error('Enter a valid vault share balance to recover.');
      }

      const allowance = await client.readContract({
        address: CONTRACT_ADDRESSES.vault,
        abi: kudexVaultAbi,
        functionName: 'allowance',
        args: [address, CONTRACT_ADDRESSES.daasAdapter],
      });
      if (allowance < sharesToClaim) {
        setClaimStatus('Step 1 of 2: Approve vault shares for protected recovery…');
        const approveSim = await client.simulateContract({
          address: CONTRACT_ADDRESSES.vault,
          abi: kudexVaultAbi,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES.daasAdapter, sharesToClaim],
          account: address,
        });
        const approveHash = await writeContractAsync({
          ...approveSim.request,
          account: address,
          chainId: portaldotTestnet.id,
        });
        await client.waitForTransactionReceipt({ hash: approveHash });
      }

      setClaimStatus(
        'Step 2 of 2: Withdrawing pro-rata vault collateral & reserve payout…',
      );
      const claimSim = await client.simulateContract({
        address: CONTRACT_ADDRESSES.daasAdapter,
        abi: kudexDaaSAdapterAbi,
        functionName: 'claimRecoveryShare',
        args: [CONTRACT_ADDRESSES.vault, sharesToClaim],
        account: address,
      });
      const txHash = await writeContractAsync({
        ...claimSim.request,
        account: address,
        chainId: portaldotTestnet.id,
      });
      await client.waitForTransactionReceipt({ hash: txHash });

      await Promise.all([
        handleRefreshProtection(),
        queryClient.invalidateQueries({ queryKey: [LIVE_ACTIVITY_QUERY_KEY] }),
      ]);
      setClaimSharesInput('');
      setClaimStatus(
        `Protected recovery funds withdrawn to your wallet (${truncateAddress(txHash)}).`,
      );
    } catch (cause) {
      setClaimError(getReadableErrorMessage(cause));
    } finally {
      setClaiming(false);
    }
  }

  return (
    <section className="panel space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <FiShield className="text-primary" size={22} aria-hidden="true" />
            <h2 className="text-xl font-bold">
              5-Step Built-In Payment Protection Tracker
            </h2>
          </div>
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            If a borrower fails to pay an invoice on time, Kudex automatically advances
            through a 5-stage protection lifecycle—pausing new deposits, merging the
            Payment Protection Reserve, and letting depositors withdraw pro-rata protected
            funds.
          </p>
        </div>

        <button
          type="button"
          disabled={(!isVaultConfigured && !adapterConfigured) || snapshot.isFetching}
          onClick={() => void handleRefreshProtection()}
          className="quiet-link text-sm disabled:opacity-50"
        >
          <FiRefreshCw
            className={snapshot.isFetching ? 'animate-spin' : ''}
            aria-hidden="true"
          />
          <span>{snapshot.isFetching ? 'Checking…' : 'Check Live Health'}</span>
        </button>
      </div>

      {/* Live Pool Health Meter */}
      <div className="space-y-3 rounded-2xl border border-border bg-secondary p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="block text-sm font-medium text-muted-foreground">
              Live Pool Health Meter
            </span>
            <span className="text-3xl font-bold text-foreground tabular-nums">
              {healthPercent.toFixed(1)}% Healthy
            </span>
          </div>

          <span
            className={
              protectionStatus.startsWith('Protected')
                ? 'emerald-badge'
                : 'inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-3.5 py-1 text-sm font-semibold text-destructive'
            }
          >
            {protectionStatus.startsWith('Protected') ? (
              <FiCheckCircle aria-hidden="true" />
            ) : (
              <FiAlertTriangle aria-hidden="true" />
            )}
            <span>{protectionStatus}</span>
          </span>
        </div>

        <div
          className="h-4 w-full overflow-hidden rounded-full bg-card"
          role="progressbar"
          aria-valuenow={Math.round(healthPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Live pool health meter"
        >
          <div
            className={`h-full transition-all duration-300 ${
              healthPercent <= 15
                ? 'bg-destructive'
                : healthPercent <= 50
                  ? 'bg-accent'
                  : 'bg-primary'
            }`}
            style={{ width: `${Math.max(4, Math.min(100, healthPercent))}%` }}
          />
        </div>

        <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground tabular-nums">
          <span>Automatic Pause Threshold: 15% Health Floor</span>
          <span>
            {data
              ? `Verified Pool Size: ${data.totalAssets} ${data.symbol} · Block #${data.block}`
              : 'Safety reserve rules enforced directly on-chain'}
          </span>
        </div>
      </div>

      {/* 5-Stage Lifecycle Stepper */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-foreground">
            Live 5-Stage Recovery Pipeline
          </h3>
          <span className="text-sm font-semibold text-muted-foreground tabular-nums">
            {currentStage === 0
              ? 'Stage 0 · Normal Operation (100% Solvency)'
              : `Current Stage: ${currentStage} of 5`}
          </span>
        </div>

        <ol className="grid gap-3 md:grid-cols-5">
          {PROTECTION_STAGES.map((step) => {
            const reached = currentStage >= step.stage;
            const isCurrent = currentStage === step.stage;
            return (
              <li
                key={step.stage}
                className={`min-w-0 rounded-xl border p-4 space-y-1.5 ${
                  isCurrent
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : reached
                      ? 'border-primary/40 bg-secondary'
                      : 'border-border bg-secondary/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-bold text-primary tabular-nums">
                    Stage {step.stage}
                  </span>
                  {reached && (
                    <FiCheckCircle className="text-primary shrink-0" aria-hidden="true" />
                  )}
                </div>
                <p className="font-bold text-foreground">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.detail}</p>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Stage 5 Recovery Claim Box */}
      {currentStage === 5 && (
        <form
          onSubmit={(e) => void handleClaimRecoveryShare(e)}
          className="rounded-2xl border border-primary bg-primary/10 p-5 space-y-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                Stage 5 Recovery Open: Withdraw Your Protected Share
              </h3>
              <p className="text-sm text-muted-foreground">
                Reserve Committed:{' '}
                <strong className="font-mono text-foreground tabular-nums">
                  {Number(formatUnits(reserveCommitted, shareDecimals)).toLocaleString(
                    'en-US',
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                  )}{' '}
                  {tokenSymbol}
                </strong>{' '}
                · Your Vault Shares:{' '}
                <strong className="font-mono text-foreground tabular-nums">
                  {formatUnits(userShares, shareDecimals)}
                </strong>
              </p>
              {previewClaimRead.data && (
                <p className="text-sm font-semibold text-primary tabular-nums">
                  Estimated Pro-Rata Payout:{' '}
                  {Number(
                    formatUnits(previewClaimRead.data[2], shareDecimals),
                  ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 4,
                  })}{' '}
                  {tokenSymbol}
                </p>
              )}
            </div>
          </div>

          <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="recovery-shares-input" className="text-sm font-medium">
                  Vault Shares to Recover
                </label>
                {userShares > 0n && (
                  <button
                    type="button"
                    onClick={() =>
                      setClaimSharesInput(formatUnits(userShares, shareDecimals))
                    }
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Use Full Balance
                  </button>
                )}
              </div>
              <input
                id="recovery-shares-input"
                type="number"
                min="0"
                step="any"
                value={claimSharesInput}
                onChange={(e) => setClaimSharesInput(e.target.value)}
                placeholder={
                  userShares > 0n ? formatUnits(userShares, shareDecimals) : '0.00'
                }
                disabled={claiming}
                className="field-input font-bold tabular-nums"
              />
            </div>

            <button
              type="submit"
              disabled={claiming || userShares === 0n}
              className="action-link disabled:opacity-40"
            >
              <FiUnlock aria-hidden="true" />
              <span>
                {claiming ? 'Claiming Protected Share…' : 'Claim Protected Recovery Share'}
              </span>
            </button>
          </div>

          {claimStatus && (
            <p role="status" className="text-sm font-semibold text-primary">
              {claimStatus}
            </p>
          )}
          {claimError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {claimError}
            </p>
          )}
        </form>
      )}

      {snapshot.error && (
        <p role="alert" className="text-sm text-destructive">
          Live health check temporarily unavailable. Try refreshing in a moment.
        </p>
      )}
    </section>
  );
}
