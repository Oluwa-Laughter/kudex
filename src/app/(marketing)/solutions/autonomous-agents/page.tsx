import Link from 'next/link';
import { FiArrowRight, FiCpu, FiRepeat, FiShield, FiSliders } from 'react-icons/fi';

export default function AutonomousAgentsSolutionPage() {
  return (
    <div className="space-y-14">
      <header className="space-y-5">
        <p className="eyebrow">Auto-Pilot Rules &amp; Plain-English AI</p>
        <h1 className="page-title">Put Routine Business Finance on Auto-Pilot</h1>
        <p className="page-description">
          Give your Kudex Agent a budget and a time limit. It handles trades and payments
          in the background without asking you to click &apos;Approve&apos; on every step.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/app/agent" className="action-link text-sm">
            <span>Open Kudex Agent</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
          <Link href="/docs" className="quiet-link text-sm">
            <span>Read Docs</span>
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {[
          {
            icon: FiCpu,
            title: 'Plain-English Instructions',
            body: 'Ask your Kudex Agent to move idle cash into Fixed-Yield Business Vaults, swap assets privately, or check vault protection in seconds.',
          },
          {
            icon: FiSliders,
            title: 'Auto-Pilot Rules (Spending Limits)',
            body: 'Set clear spending budgets ($100, $500, or $2,500 max) and exact time limits (2 Hours, 24 Hours, or 7 Days) that your agent can never exceed.',
          },
          {
            icon: FiRepeat,
            title: 'Best-Price Auto-Routing',
            body: 'Swap assets or move money across networks in one click. Background bots compete to give you the lowest fee and fastest settlement.',
          },
          {
            icon: FiShield,
            title: '1-Click Instant Shutoff',
            body: 'Click Turn Off Auto-Pilot Immediately at any moment to pause background actions with zero delay.',
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
