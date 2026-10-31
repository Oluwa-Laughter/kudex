import Link from 'next/link';
import { FiActivity, FiArrowRight, FiLayers, FiShield } from 'react-icons/fi';

export default function ProtectedYieldSolutionPage() {
  return (
    <div className="space-y-14">
      <header className="space-y-5">
        <p className="eyebrow">Protected Business Yield</p>
        <h1 className="page-title">
          Fixed-Yield Business Vaults with Built-In Payment Protection
        </h1>
        <p className="page-description">
          Earn steady, predictable returns backed by real-world business invoices and
          short-term treasuries—protected automatically by an on-chain safety reserve.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/app/earn" className="action-link text-sm">
            <span>Open Earn</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
          <Link href="/app/overview" className="quiet-link text-sm">
            <span>Open App</span>
          </Link>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            icon: FiLayers,
            title: 'Short-Term Treasury Vault',
            meta: '5.40% Annual Yield (APY)',
            body: 'Designed for operating cash that needs steady, predictable daily returns with same-day liquidity.',
          },
          {
            icon: FiActivity,
            title: 'Verified Business Invoice Pool',
            meta: '8.20% Annual Yield (APY)',
            body: 'Earn higher fixed returns by funding vetted 30-to-60-day corporate receivables with priority repayment.',
          },
          {
            icon: FiShield,
            title: 'Built-In Payment Protection',
            meta: '100% Solvency Reserve Active',
            body: 'If a borrower fails to pay an invoice on time, Kudex automatically freezes the pool and recovers your funds from the safety reserve.',
          },
        ].map((item) => (
          <article key={item.title} className="panel space-y-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <item.icon size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="mt-1 text-sm font-bold text-primary tabular-nums">
                {item.meta}
              </p>
            </div>
            <p className="text-base leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
