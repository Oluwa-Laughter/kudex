'use client';

import { useQuery } from '@tanstack/react-query';
import { useReadContract } from 'wagmi';
import { z } from 'zod';
import { formatUnits, zeroAddress } from 'viem';
import {
  FiRefreshCw,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
} from 'react-icons/fi';
import { isVaultConfigured, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { kudexDaaSAdapterAbi } from '@/lib/contracts/abis';
import { portaldotTestnet } from '@/lib/chains/portaldot';

const snapshotSchema = z.object({
  status: z.literal('observed'),
  vault: z.string(),
  symbol: z.string(),
  totalAssets: z.string(),
  depositFrozen: z.boolean(),
  riskScoreBps: z
    .string()
    .regex(/^\d+$/)
    .refine((value) => BigInt(value) <= 10_000n),
  block: z.string().regex(/^\d+$/),
  observedAt: z.string().datetime(),
});

export function RiskPanel() {
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
      enabled:
        CONTRACT_ADDRESSES.daasAdapter !== zeroAddress &&
        CONTRACT_ADDRESSES.vault !== zeroAddress,
      staleTime: 15_000,
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

  const protectionStatus = !data
    ? 'Protected — Safety Reserve Ready'
    : data.depositFrozen || riskPercent >= 85
      ? 'Pool Paused — Recovery Active'
      : 'Protected — 100% Solvency Reserve';

  return (
    <section className="panel space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <FiShield className="text-primary" size={22} aria-hidden="true" />
            <h2 className="text-xl font-bold">Built-In Payment Protection</h2>
          </div>
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            If a borrower fails to pay an invoice on time, Kudex automatically freezes the
            pool and recovers your funds from the safety reserve. Existing depositors keep
            first-priority withdrawal rights while new deposits stay paused until full
            reserve health returns.
          </p>
        </div>

        <button
          type="button"
          disabled={!isVaultConfigured || snapshot.isFetching}
          onClick={() => void snapshot.refetch()}
          className="quiet-link text-sm disabled:opacity-50"
        >
          <FiRefreshCw
            className={snapshot.isFetching ? 'animate-spin' : ''}
            aria-hidden="true"
          />
          <span>{snapshot.isFetching ? 'Checking…' : 'Check Live Health'}</span>
        </button>
      </div>

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

      {snapshot.error && (
        <p role="alert" className="text-sm text-destructive">
          Live health check temporarily unavailable. Try refreshing in a moment.
        </p>
      )}
    </section>
  );
}
