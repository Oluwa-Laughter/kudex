import Link from 'next/link';
import {
  FiArrowRight,
  FiCpu,
  FiFileText,
  FiLayers,
  FiLock,
  FiRepeat,
  FiShield,
} from 'react-icons/fi';

const GUIDES = [
  {
    icon: FiLock,
    title: '1. Private Balances (Stealth Mode)',
    summary:
      'Your wallet balance and payment amounts are hidden from the public. Only you and the person you pay can see the numbers.',
    highlight: 'Used in: Send & Invoice · Earn · Trade & Bridge',
    href: '/app/pay',
    cta: 'Open Send & Invoice',
  },
  {
    icon: FiCpu,
    title: '2. Auto-Pilot Rules (Spending Limits)',
    summary:
      "Give your Kudex Agent a budget and a time limit. It handles trades and payments in the background without asking you to click 'Approve' on every step.",
    highlight: 'Controls: Spending Budget · Time Limit · 1-Click Shutoff',
    href: '/app/agent',
    cta: 'Open Kudex Agent',
  },
  {
    icon: FiLayers,
    title: '3. Fixed-Yield Business Vaults',
    summary:
      'Earn steady, predictable returns backed by real-world business invoices and short-term treasuries.',
    highlight: 'Options: Short-Term Treasury Vault · Verified Business Invoice Pool',
    href: '/app/earn',
    cta: 'Open Earn',
  },
  {
    icon: FiShield,
    title: '4. Built-In Payment Protection',
    summary:
      'If a borrower fails to pay an invoice on time, Kudex automatically freezes the pool and recovers your funds from the safety reserve.',
    highlight: 'Protection: Automatic Pool Freeze & Safety Reserve Recovery',
    href: '/app/earn',
    cta: 'Inspect Vault Protection',
  },
  {
    icon: FiRepeat,
    title: '5. Best-Price Auto-Routing',
    summary:
      'Swap assets or move money across networks in one click. Background bots compete to give you the lowest fee and fastest settlement.',
    highlight: 'Modes: Instant Swap · Move Across Networks (< 45s)',
    href: '/app/trade',
    cta: 'Open Trade & Bridge',
  },
  {
    icon: FiFileText,
    title: '6. 1-Click Auditor Pass',
    summary:
      'Share a read-only pass with your accountant or tax auditor so they can verify your payments without having access to spend your money.',
    highlight: 'Access: Read-Only Verification · Instant Revoke Access',
    href: '/app/pay',
    cta: 'Generate Auditor Pass',
  },
];

export default function DocsPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <p className="eyebrow">Plain-English Product Guide</p>
        <h1 className="page-title">Kudex Documentation</h1>
        <p className="page-description">
          Everything your business owner, CFO, or accountant needs to know about private
          payments, protected business vaults, and Auto-Pilot spending rules.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/app/overview" className="action-link text-sm">
            <span>Open App</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
          <Link href="/pricing" className="quiet-link text-sm">
            <span>View Pricing</span>
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {GUIDES.map((mod) => (
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
              <p className="rounded-xl bg-secondary px-3.5 py-2.5 text-sm font-semibold text-foreground">
                {mod.highlight}
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
