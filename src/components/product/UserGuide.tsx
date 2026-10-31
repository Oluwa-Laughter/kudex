import Link from 'next/link';
import { FiArrowRight, FiCpu, FiLayers, FiRepeat, FiSend, FiShield } from 'react-icons/fi';

const WORKFLOWS = [
  {
    step: '01',
    title: 'Send & Invoice Privately',
    icon: FiSend,
    body: 'Your wallet balance and payment amounts are hidden from the public. Only you and the person you pay can see the numbers.',
    href: '/app/pay',
    cta: 'Open Send & Invoice',
  },
  {
    step: '02',
    title: 'Earn in Fixed-Yield Business Vaults',
    icon: FiLayers,
    body: 'Earn steady, predictable returns backed by real-world business invoices and short-term treasuries with Built-In Payment Protection.',
    href: '/app/earn',
    cta: 'Open Earn',
  },
  {
    step: '03',
    title: 'Swap & Bridge with Best-Price Auto-Routing',
    icon: FiRepeat,
    body: 'Swap assets or move money across networks in one click. Background bots compete to give you the lowest fee and fastest settlement.',
    href: '/app/trade',
    cta: 'Open Trade & Bridge',
  },
  {
    step: '04',
    title: 'Put Routine Finance on Auto-Pilot',
    icon: FiCpu,
    body: "Give your Kudex Agent a budget and a time limit. It handles trades and payments in the background without asking you to click 'Approve' on every step.",
    href: '/app/agent',
    cta: 'Open Kudex Agent',
  },
];

export function UserGuide() {
  return (
    <article className="space-y-10">
      <header className="space-y-4">
        <p className="eyebrow">Step-by-Step Guide</p>
        <h1 className="page-title">How Kudex Works</h1>
        <p className="page-description">
          Kudex brings private business payments, Fixed-Yield Business Vaults, Best-Price
          Auto-Routing, and your Kudex Agent together into five simple tabs.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link className="action-link text-sm" href="/app/overview">
            <span>Open App</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
          <Link className="quiet-link text-sm" href="/docs">
            <span>Read Docs</span>
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
            <h2 className="text-lg font-bold">1-Click Auditor Pass</h2>
            <p className="mt-1 text-base leading-relaxed text-muted-foreground">
              Share a read-only pass with your accountant or tax auditor so they can
              verify your payments without having access to spend your money.
            </p>
          </div>
        </div>
        <Link className="action-link text-sm" href="/app/pay">
          <span>Create Auditor Pass</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </section>
    </article>
  );
}
