import Link from 'next/link';
import { FiArrowRight, FiRepeat, FiSend, FiLayers, FiCpu, FiShield } from 'react-icons/fi';

const WORKFLOWS = [
  {
    step: '01',
    title: 'Negotiate & Settle Institutional RFQs',
    icon: FiRepeat,
    body: 'Create signed peer-to-solver invitations or firm full-fill quotes in the Marketplace. Settle atomically with zero public orderbook slippage.',
    href: '/app/marketplace',
    cta: 'Open Marketplace',
  },
  {
    step: '02',
    title: 'Bridge & Shield Corporate Liquidity',
    icon: FiSend,
    body: 'Route capital from Ethereum, Arbitrum, Base, and Optimism with <45s target completion, or mint one-time recipient notes and encrypted invoices.',
    href: '/app/bridge',
    cta: 'Open Bridge',
  },
  {
    step: '03',
    title: 'Allocate Across Structured Yield Pools',
    icon: FiLayers,
    body: 'Supply collateral into Senior, Mezzanine, or Junior pools with slippage-bounded share minting and automated 85% solvency safeguards.',
    href: '/app/vaults',
    cta: 'Open Vaults',
  },
  {
    step: '04',
    title: 'Delegate Bounded Sessions to KUDEX AGENT',
    icon: FiCpu,
    body: 'Authorize function-whitelisted session keys with 2h, 24h, or 7d expirations, cumulative spend caps, and instant one-click owner revocation.',
    href: '/app/agents',
    cta: 'Open KUDEX AGENT',
  },
];

export function UserGuide() {
  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <p className="eyebrow">Operational Architecture</p>
        <h1 className="page-title">How Kudex Works</h1>
        <p className="page-description">
          Kudex unifies confidential corporate settlement, negotiated institutional RFQ
          execution, structured yield pools, and bounded autonomous agents.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link className="action-link text-sm" href="/app/overview">
            <span>Launch App</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
          <Link className="quiet-link text-sm" href="/docs">
            <span>Developer Reference</span>
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {WORKFLOWS.map((item) => (
          <div key={item.step} className="panel flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-primary tabular-nums">
                  STEP {item.step}
                </span>
                <item.icon className="text-primary" size={20} aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold">{item.title}</h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
            <Link
              href={item.href}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <span>{item.cta}</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        ))}
      </section>

      <section className="panel flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <FiShield className="mt-1 shrink-0 text-primary" size={22} aria-hidden="true" />
          <div>
            <h2 className="text-lg font-bold">Built-In Auditor Selective Disclosure</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate scoped read-only viewing keys and settlement compliance
              certificates at any time without exposing private balances.
            </p>
          </div>
        </div>
        <Link className="cobalt-action text-sm" href="/app/compliance">
          <span>Compliance Workspace</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </section>
    </article>
  );
}
