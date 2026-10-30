import Link from 'next/link';
import {
  FiArrowRight,
  FiRepeat,
  FiGlobe,
  FiSend,
  FiCpu,
  FiFileText,
  FiShield,
} from 'react-icons/fi';

const MODULES = [
  {
    icon: FiRepeat,
    title: '1. Negotiated RFQ Settlement Router',
    summary:
      'Bilateral typed-data invitations and maker-signed full-fill offers with strict nonce replay protection and exact allowance verification.',
    spec: 'Contracts: KudexRFQMarket · KudexRfqExecutor | Fee Tier: 0.10% private trades',
    href: '/app/marketplace',
    cta: 'Open Marketplace',
  },
  {
    icon: FiGlobe,
    title: '2. Cross-Chain Solver Gateway',
    summary:
      'Intent-based liquidity routing from Ethereum, Arbitrum, Base, and Optimism with Direct Deposit or immediate Shield-on-Arrival commitment minting.',
    spec: 'Completion Target: < 45 seconds | Routing Fee: 0.05%',
    href: '/app/bridge',
    cta: 'Open Bridge',
  },
  {
    icon: FiSend,
    title: '3. Confidential Notes & Corporate Invoicing',
    summary:
      'One-time blinded recipient commitments and corporate vendor invoices bound to SHA-256 encrypted payment references.',
    spec: 'Operations: shieldDeposit(assets, commitment) · redeemWithMinimum',
    href: '/app/settlement',
    cta: 'Open Settlement',
  },
  {
    icon: FiCpu,
    title: '4. KUDEX AGENT & Bounded Session Policies',
    summary:
      'Delegate execution keys constrained on-chain by time expiration (2h, 24h, 7d), per-action/UTC-day/lifetime caps, and function whitelisting.',
    spec: 'Contracts: KudexAgentExecutor · KudexPolicyRegistry | Instant Owner Revocation',
    href: '/app/agents',
    cta: 'Open KUDEX AGENT',
  },
  {
    icon: FiFileText,
    title: '5. Selective Disclosure & Viewing Keys',
    summary:
      'Deterministic read-only viewing keys and downloadable settlement compliance certificates proving legitimacy without revealing private balances.',
    spec: 'Scopes: Accounting · Tax Reporting · Auditor Verification',
    href: '/app/compliance',
    cta: 'Open Compliance',
  },
  {
    icon: FiShield,
    title: '6. Default-as-a-Service (DaaS) Solvency Engine',
    summary:
      'Continuous credit risk telemetry (0–100%) with automated deposit circuit breakers at the 85% threshold and structured tranche waterfalls.',
    spec: 'Contracts: KudexVault · KudexDaaSAdapter | Threshold: 8,500 bps (85%)',
    href: '/app/protection',
    cta: 'Open Protection',
  },
];

export default function EnterpriseDocsPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <p className="eyebrow">Enterprise Developer & Operator Reference</p>
        <h1 className="page-title">Kudex Protocol Documentation</h1>
        <p className="page-description">
          Architecture specifications, contract execution boundaries, and operational
          guides for treasuries, liquidity solvers, and compliance auditors.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/app/overview" className="action-link text-sm">
            <span>Launch Application</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
          <Link href="/pricing" className="quiet-link text-sm">
            <span>View Fee Schedule</span>
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {MODULES.map((mod) => (
          <article
            key={mod.title}
            className="panel flex flex-col justify-between space-y-5"
          >
            <div className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <mod.icon size={20} aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold">{mod.title}</h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                {mod.summary}
              </p>
              <p className="rounded-xl bg-secondary px-3.5 py-2.5 font-mono text-sm text-foreground tabular-nums">
                {mod.spec}
              </p>
            </div>
            <Link
              href={mod.href}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <span>{mod.cta}</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
