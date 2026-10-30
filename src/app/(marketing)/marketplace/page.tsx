'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatUnits } from 'viem';
import { FiArrowRight, FiRepeat, FiFilter, FiShield } from 'react-icons/fi';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';

const DESKS = [
  {
    category: 'Short-Term Commercial Debt',
    settlement: 'Atomic Full-Fill RFQ',
    fee: '0.10%',
    summary:
      'Negotiate bilateral corporate commercial paper quotes with verified institutional makers.',
  },
  {
    category: 'Tokenized Treasuries',
    settlement: 'Limit RFQ & Dutch Auction',
    fee: '0.10%',
    summary:
      'Settle sovereign T-bill backed collateral swaps with zero AMM price impact.',
  },
  {
    category: 'Invoice Factoring',
    settlement: 'Fill-or-Kill Private Swap',
    fee: '0.10%',
    summary:
      'Discount verified corporate receivables against instant stablecoin liquidity.',
  },
  {
    category: 'Structured Yield Tranches',
    settlement: 'Senior / Mezzanine / Junior',
    fee: '0.10%',
    summary:
      'Rebalance tranche positions across DaaS-monitored institutional liquidity pools.',
  },
] as const;

export default function PublicMarketplaceDiscoveryPage() {
  const [filter, setFilter] = useState<string>('All');
  const events = useProtocolEvents();

  const filtered =
    filter === 'All' ? DESKS : DESKS.filter((desk) => desk.category === filter);

  return (
    <div className="space-y-12">
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-4">
          <p className="eyebrow">Public Asset & Tranche Discovery</p>
          <h1 className="page-title">Institutional RFQ Marketplace</h1>
          <p className="page-description">
            Explore negotiated liquidity desks across commercial debt, tokenized
            treasuries, invoice factoring, and structured credit tranches.
          </p>
        </div>
        <Link href="/app/marketplace" className="action-link text-sm">
          <span>Open Trading Orderbook</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </header>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-3">
        <div>
          <span className="text-sm text-muted-foreground">Indexed RFQ Settlements</span>
          <p className="mt-1 font-mono text-2xl font-bold text-primary tabular-nums">
            {events.data ? `${events.data.totalSettlements} Fills` : 'Live Router'}
          </p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Window Pool Volume</span>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
            {events.data
              ? `${formatUnits(events.data.totalVolumeBigInt, events.data.decimals)} units`
              : '0.00 units'}
          </p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Protocol Trade Fee</span>
          <p className="mt-1 font-mono text-2xl font-bold text-accent tabular-nums">
            0.10% Flat
          </p>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <FiFilter className="text-primary" aria-hidden="true" />
          {['All', ...DESKS.map((d) => d.category)].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`min-h-10 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                filter === cat
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((desk) => (
            <article
              key={desk.category}
              className="panel flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <FiRepeat aria-hidden="true" />
                    <span>{desk.settlement}</span>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 font-mono text-sm tabular-nums">
                    Fee {desk.fee}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{desk.category}</h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {desk.summary}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <FiShield className="text-primary" aria-hidden="true" />
                  <span>Full-Fill Atomic Router</span>
                </span>
                <Link
                  href="/app/marketplace"
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                >
                  <span>Request Quote</span>
                  <FiArrowRight aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
