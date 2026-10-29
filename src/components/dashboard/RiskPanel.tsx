'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { formatUnits } from 'viem';
import { FiArrowRight, FiRefreshCw, FiShield } from 'react-icons/fi';
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
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">
          <FiShield aria-hidden="true" /> Risk & DaaS
        </p>
        <h1 className="page-title">Read the risk. Know the controls.</h1>
        <p className="page-description">
          Review the configured vault’s reported risk score and deposit status. The
          current control is a deposit freeze; debt restructuring and asset recovery
          require further implementation.
        </p>
      </header>
      <section className="panel space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Configured vault</h2>
          <button
            disabled={!isVaultConfigured || snapshot.isFetching}
            onClick={() => void snapshot.refetch()}
            className="quiet-link disabled:opacity-50"
          >
            <FiRefreshCw aria-hidden="true" />
            {snapshot.isFetching ? 'Refreshing…' : 'Refresh state'}
          </button>
        </div>
        {!isVaultConfigured && (
          <p role="status">
            Vault deployment is pending. No risk score or healthy state is being inferred.
            Once configured, this view reads the same vault used by the deposit workspace.
          </p>
        )}
        {snapshot.error && (
          <p role="alert" className="text-destructive">
            Risk data is unavailable. Try refreshing shortly.{' '}
            {data ? 'The observation below is the last successful read.' : ''}
          </p>
        )}
        {isVaultConfigured && snapshot.isPending && (
          <p role="status">Reading the vault’s current state…</p>
        )}
        {data && (
          <>
            <p className="break-all text-sm text-muted-foreground">{data.vault}</p>
            <dl className="grid gap-6 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-muted-foreground">
                  Owner-reported risk score
                </dt>
                <dd className="mt-2 text-3xl font-semibold tabular-nums">
                  {formatUnits(BigInt(data.riskScoreBps), 2)}%
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">New deposits</dt>
                <dd className="mt-2 text-xl font-semibold">
                  {data.depositFrozen ? 'Frozen' : 'Not frozen'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Vault collateral</dt>
                <dd className="mt-2 break-words text-xl font-semibold tabular-nums">
                  {data.totalAssets} {data.symbol}
                </dd>
              </div>
            </dl>
            <p className="border-t border-border pt-5 text-sm text-muted-foreground tabular-nums">
              Observed block {data.block} · {new Date(data.observedAt).toLocaleString()}
              {snapshot.error ? ' · Previous observation' : ''}
            </p>
          </>
        )}
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="panel">
          <h2 className="text-xl font-semibold">What a freeze changes</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            An authorized sentinel can evaluate the owner-supplied score. At the adapter’s
            85% threshold, it can freeze new deposits if registered and authorized by the
            vault. Existing withdrawals remain subject to asset availability.
          </p>
        </div>
        <div className="panel">
          <h2 className="text-xl font-semibold">What this score represents</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            This is an administrative risk input, not an independently measured default
            probability, solvency proof, or principal guarantee. No continuous sentinel
            operation or liquidation recovery is being reported here.
          </p>
        </div>
      </section>
      <Link className="action-link" href="/app/vaults">
        Review vault capital <FiArrowRight aria-hidden="true" />
      </Link>
    </div>
  );
}
