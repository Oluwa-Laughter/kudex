import Link from 'next/link';
import { FiArrowRight, FiSend, FiFileText, FiShield, FiKey } from 'react-icons/fi';

export default function EnterprisePayrollSolutionPage() {
  return (
    <div className="space-y-14">
      <header className="space-y-5">
        <p className="eyebrow">A2B Private Global Settlement</p>
        <h1 className="page-title">
          Confidential Corporate Payroll & Vendor Invoicing
        </h1>
        <p className="page-description">
          Pay international teams and supply-chain vendors without broadcasting salary
          tables, treasury reserves, or commercial terms on a public ledger.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/app/settlement" className="action-link text-sm">
            <span>Open Settlement Workspace</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
          <Link href="/app/compliance" className="quiet-link text-sm">
            <span>Issue Auditor Viewing Key</span>
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {[
          {
            icon: FiSend,
            title: 'One-Time Recipient Commitments',
            body: 'Each disbursement creates a fresh blinded recipient commitment, preventing competitors from linking vendor payouts back to your primary treasury wallet.',
          },
          {
            icon: FiFileText,
            title: 'Encrypted Invoice References',
            body: 'Bind purchase orders and due dates via SHA-256 payment references settled in a single click with deterministic receipt verification.',
          },
          {
            icon: FiKey,
            title: 'Scoped Auditor Viewing Keys',
            body: 'Grant external CPAs and tax authorities read-only verification keys without surrendering custody or revealing unrelated account balances.',
          },
          {
            icon: FiShield,
            title: 'Shield / Unshield Treasury Control',
            body: 'Move seamlessly between transparent operating accounts and confidential settlement pools whenever corporate liquidity requires.',
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
