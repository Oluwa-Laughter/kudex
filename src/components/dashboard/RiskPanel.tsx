'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { formatUnits } from 'viem';
import {
  FiArrowRight,
  FiRefreshCw,
  FiShield,
  FiCheckCircle,
  FiAlertTriangle,
  FiActivity,
} from 'react-icons/fi';
import { isVaultConfigured, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';

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
  const [simulatedShockPct, setSimulatedShockPct] = useState('15');

  const snapshot = useQuery({
    queryKey: ['vault-risk', CONTRACT_ADDRESSES.vault],
    enabled: isVaultConfigured,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: 0,
    queryFn: async ({ signal }) => {
      const response = await fetch('/api/protocol/vault', { signal });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error || 'The vault state could not be read.');
      return snapshotSchema.parse(body);
    },
  });

  const data = snapshot.data;
  const riskPercent = data
    ? Number(formatUnits(BigInt(data.riskScoreBps), 2))
    : 0;

  const restructuringState = !data
    ? 'Awaiting Pool Telemetry'
    : data.depositFrozen || riskPercent >= 85
      ? 'Restructuring Active'
      : riskPercent >= 50
        ? 'Flagged for Monitoring'
        : 'Healthy';

  const shockNum = Math.min(100, Math.max(0, Number(simulatedShockPct) || 0));
  const projectedScore = Math.min(100, riskPercent + shockNum);

  return (
    <div className="space-y-8">
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">Default-as-a-Service (DaaS) Engine</p>
          <h1 className="page-title">Solvency & Automated Debt Restructuring</h1>
          <p className="page-description">
            Monitor real-time pool credit risk gauges, automated 85% deposit circuit
            breakers, and protocol reserve coverage across structured credit tranches.
          </p>
        </div>
        <Link className="action-link text-sm" href="/app/vaults">
          <span>Manage Pool Liquidity</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </header>

      {/* Pool Risk Score Gauge & Automated Restructuring Status */}
      <section className="panel space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <FiShield className="text-primary" size={22} aria-hidden="true" />
            <h2 className="text-xl font-bold">Pool Risk Score Gauge (0–100%)</h2>
          </div>
          <button
            disabled={!isVaultConfigured || snapshot.isFetching}
            onClick={() => void snapshot.refetch()}
            className="quiet-link text-sm disabled:opacity-50"
          >
            <FiRefreshCw
              className={snapshot.isFetching ? 'animate-spin' : ''}
              aria-hidden="true"
            />
            <span>{snapshot.isFetching ? 'Refreshing…' : 'Refresh Telemetry'}</span>
          </button>
        </div>

        {!isVaultConfigured && (
          <p role="status" className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
            Pool contract address awaiting configuration. Live risk gauge and reserve
            telemetry stream automatically once deployed.
          </p>
        )}

        {snapshot.error && (
          <p role="alert" className="text-sm text-destructive">
            Risk telemetry unavailable. Try refreshing shortly.
          </p>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-4xl font-bold tabular-nums">
              {data ? `${riskPercent.toFixed(2)}%` : '0.00%'}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-semibold ${
                restructuringState === 'Healthy'
                  ? 'bg-primary/15 text-primary'
                  : restructuringState === 'Restructuring Active'
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-secondary text-foreground'
              }`}
            >
              {restructuringState === 'Healthy' ? (
                <FiCheckCircle aria-hidden="true" />
              ) : (
                <FiAlertTriangle aria-hidden="true" />
              )}
              <span>{restructuringState}</span>
            </span>
          </div>

          <div
            className="h-4 w-full overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuenow={Math.round(riskPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Pool credit risk score"
          >
            <div
              className={`h-full transition-all duration-300 ${
                riskPercent >= 85
                  ? 'bg-destructive'
                  : riskPercent >= 50
                    ? 'bg-accent'
                    : 'bg-primary'
              }`}
              style={{ width: `${Math.max(2, Math.min(100, riskPercent))}%` }}
            />
          </div>

          <div className="flex justify-between text-sm text-muted-foreground tabular-nums">
            <span>0% Healthy Floor</span>
            <span>50% Monitoring Watchlist</span>
            <span>85% Automated Freeze Trigger</span>
          </div>
        </div>

        {data && (
          <dl className="grid gap-4 border-t border-border pt-5 sm:grid-cols-3">
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Restructuring Status</dt>
              <dd className="mt-1 text-lg font-bold">
                {data.depositFrozen ? 'Deposits Paused' : 'Normal Operations'}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Reserve Collateral</dt>
              <dd className="mt-1 text-lg font-bold text-primary tabular-nums">
                {data.totalAssets} {data.symbol}
              </dd>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <dt className="text-sm text-muted-foreground">Observed Block</dt>
              <dd className="mt-1 font-mono text-lg font-bold tabular-nums">
                #{data.block}
              </dd>
            </div>
          </dl>
        )}
      </section>

      {/* Recovery Fund Telemetry & Solvency Stress Simulator */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel space-y-4">
          <div className="flex items-center gap-2">
            <FiActivity className="text-primary" size={20} aria-hidden="true" />
            <h2 className="text-xl font-bold">Recovery Fund Telemetry</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            When the DaaS sentinel observes a risk score at or above 85% (8,500 bps), new
            pool inflows pause automatically while junior first-loss buffers protect
            senior tranche redemptions.
          </p>
          <dl className="space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Active Pool Reserve</dt>
              <dd className="font-mono font-bold text-primary tabular-nums">
                {data ? `${data.totalAssets} ${data.symbol}` : 'Awaiting pool read'}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Circuit Breaker Threshold</dt>
              <dd className="font-mono font-semibold tabular-nums">85.00% (8,500 bps)</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Waterfall Priority</dt>
              <dd className="font-semibold">Senior → Mezzanine → Junior</dd>
            </div>
          </dl>
        </section>

        <section className="panel space-y-4">
          <h2 className="text-xl font-bold">Solvency Stress Simulator</h2>
          <p className="text-sm text-muted-foreground">
            Test how an incremental credit variance shock affects automated restructuring
            triggers.
          </p>
          <label className="block text-sm font-medium">
            Simulated Credit Variance Shock (+%)
            <input
              type="range"
              min="0"
              max="100"
              value={simulatedShockPct}
              onChange={(e) => setSimulatedShockPct(e.target.value)}
              className="mt-3 w-full accent-primary"
            />
          </label>
          <div className="flex items-center justify-between rounded-xl bg-secondary p-4 text-sm">
            <div>
              <span className="block text-muted-foreground">Projected Risk Score</span>
              <span className="font-mono text-xl font-bold tabular-nums">
                {projectedScore.toFixed(2)}%
              </span>
            </div>
            <div className="text-right">
              <span className="block text-muted-foreground">DaaS Engine Response</span>
              <span
                className={`font-bold ${
                  projectedScore >= 85 ? 'text-destructive' : 'text-primary'
                }`}
              >
                {projectedScore >= 85
                  ? 'Freeze New Inflows & Trigger Restructuring'
                  : 'Maintain Pool Operations'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
