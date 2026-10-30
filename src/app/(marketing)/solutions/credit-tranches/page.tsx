import Link from 'next/link';
import { FiArrowRight, FiLayers, FiShield, FiActivity } from 'react-icons/fi';

export default function CreditTranchesSolutionPage() {
  return (
    <div className="space-y-14">
      <header className="space-y-5">
        <p className="eyebrow">Institutional Yield & Solvency Safeguards</p>
        <h1 className="page-title">
          Structured Credit Tranches & Automated DaaS Protection
        </h1>
        <p className="page-description">
          Allocate capital across Senior, Mezzanine, and Junior pools protected by
          slippage-bounded share execution and automated Default-as-a-Service circuit
          breakers.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/app/vaults" className="action-link text-sm">
            <span>Open Yield Pools</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
          <Link href="/app/protection" className="quiet-link text-sm">
            <span>Monitor Risk Engine</span>
          </Link>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            icon: FiLayers,
            title: 'Senior Capital Pool',
            meta: 'First-Priority Redemption Waterfall',
            body: 'Engineered for conservative institutional treasuries requiring priority claim over pool collateral and automated inflow circuit breakers.',
          },
          {
            icon: FiActivity,
            title: 'Mezzanine Credit Pool',
            meta: 'Balanced Commercial Debt Exposure',
            body: 'Captures middle-tier structured credit spreads while buffered by subordinated junior first-loss reserves.',
          },
          {
            icon: FiShield,
            title: 'Automated 85% DaaS Safety Net',
            meta: '8,500 bps Risk Threshold',
            body: 'When pool credit risk reaches 85%, new deposits freeze automatically on-chain while reserve waterfalls protect senior redemptions.',
          },
        ].map((item) => (
          <article key={item.title} className="panel space-y-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <item.icon size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="mt-1 text-sm font-semibold text-primary tabular-nums">
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
