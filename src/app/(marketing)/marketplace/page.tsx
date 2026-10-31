'use client';

import Link from 'next/link';
import { formatUnits } from 'viem';
import { FiArrowRight, FiRepeat, FiShield } from 'react-icons/fi';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';

const ROUTES = [
  {
    category: 'Digital Dollar Swaps (USDC / USDT)',
    settlement: 'Best-Price Auto-Routing',
    fee: '0.03%',
    summary:
      'Exchange corporate stablecoins with zero price slippage and optional delivery directly into your Private Balance.',
  },
  {
    category: 'Short-Term Treasury Assets',
    settlement: 'Zero-Slippage Direct Quote',
    fee: '0.03%',
    summary:
      'Move smoothly between liquid digital dollars and yield-bearing business vault positions in one click.',
  },
  {
    category: 'Cross-Network Business Transfers',
    settlement: 'Move Across Networks (< 45s)',
    fee: '0.05%',
    summary:
      'Transfer funds from Ethereum, Arbitrum, Base, and Optimism straight into your Kudex account.',
  },
] as const;

export default function PublicExchangeOverviewPage() {
  const events = useProtocolEvents();

  return (
    <div className="space-y-12">
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-4">
          <p className="eyebrow">Best-Price Auto-Routing</p>
          <h1 className="page-title">Zero-Slippage Business Exchange</h1>
          <p className="page-description">
            Swap assets or move money across networks in one click. Background bots
            compete to give you the lowest fee and fastest settlement.
          </p>
        </div>
        <Link href="/app/trade" className="action-link text-sm">
          <span>Open Trade &amp; Bridge</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </header>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-3">
        <div>
          <span className="text-sm text-muted-foreground">Completed Swaps</span>
          <p className="mt-1 font-mono text-2xl font-bold text-primary tabular-nums">
            {events.data ? `${events.data.totalSettlements} Settled` : 'Live Routing'}
          </p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Recent Settled Volume</span>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
            {events.data
              ? `${formatUnits(events.data.totalVolumeBigInt, events.data.decimals)} units`
              : '0.00 units'}
          </p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Price Slippage</span>
          <p className="mt-1 font-mono text-2xl font-bold text-accent tabular-nums">
            0.00% Locked
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {ROUTES.map((route) => (
          <article
            key={route.category}
            className="panel flex flex-col justify-between space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <FiRepeat aria-hidden="true" />
                  <span>{route.settlement}</span>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 font-mono text-sm font-bold tabular-nums">
                  Fee {route.fee}
                </span>
              </div>
              <h2 className="text-xl font-bold">{route.category}</h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                {route.summary}
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <FiShield className="text-primary" aria-hidden="true" />
                <span>Private Balance Ready</span>
              </span>
              <Link
                href="/app/trade"
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                <span>Swap Now</span>
                <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
