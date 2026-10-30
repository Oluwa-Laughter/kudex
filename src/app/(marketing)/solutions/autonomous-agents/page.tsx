import Link from 'next/link';
import { FiArrowRight, FiCpu, FiSliders, FiShield, FiRepeat } from 'react-icons/fi';

export default function AutonomousAgentsSolutionPage() {
  return (
    <div className="space-y-14">
      <header className="space-y-5">
        <p className="eyebrow">A2A & A2H Execution Infrastructure</p>
        <h1 className="page-title">
          KUDEX AGENT & Bounded Session Key Economies
        </h1>
        <p className="page-description">
          Automate pool deposits and RFQ quote execution without ever handing custody of
          your treasury keys to an unconstrained external service.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/app/agents" className="action-link text-sm">
            <span>Open KUDEX AGENT Workspace</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
          <Link href="/docs" className="quiet-link text-sm">
            <span>Session Policy Spec</span>
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {[
          {
            icon: FiCpu,
            title: 'KUDEX AGENT Live Telemetry',
            body: 'Inspect live pool reserves, finalized account balances, and RFQ terms in plain language while retaining complete owner signing control.',
          },
          {
            icon: FiSliders,
            title: 'Time-Bounded Spend Caps',
            body: 'Enforce 2-hour, 24-hour, or 7-day session expirations alongside strict per-transaction, UTC-daily, and lifetime token budgets.',
          },
          {
            icon: FiRepeat,
            title: 'Multi-Agent RFQ Mandates',
            body: 'Lock permitted makers, token pairs, and minimum exchange ratios on-chain so solver delegates can only execute favorable quotes.',
          },
          {
            icon: FiShield,
            title: 'One-Click Emergency Shutdown',
            body: 'Revoke any active session policy or RFQ mandate immediately on-chain from your owner wallet with zero delay.',
          },
        ].map((card) => (
          <article key={card.title} className="panel space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <card.icon size={20} aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold">{card.title}</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {card.body}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
