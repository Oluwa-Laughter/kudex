import Link from 'next/link';
import { FiArrowRight, FiFileText, FiKey, FiSend, FiShield } from 'react-icons/fi';

export default function EnterprisePayrollSolutionPage() {
  return (
    <div className="space-y-14">
      <header className="space-y-5">
        <p className="eyebrow">Business Pay &amp; Global Invoicing</p>
        <h1 className="page-title">Pay Suppliers &amp; Teams Without Exposing Balances</h1>
        <p className="page-description">
          Send supplier payments or payroll across borders without competitors seeing who
          you pay or how much you spend.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/app/pay" className="action-link text-sm">
            <span>Open Send &amp; Invoice</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
          <Link href="/app/overview" className="quiet-link text-sm">
            <span>Open App</span>
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {[
          {
            icon: FiSend,
            title: 'Private Balances (Stealth Mode)',
            body: 'Your wallet balance and payment amounts are hidden from the public. Only you and the person you pay can see the numbers.',
          },
          {
            icon: FiFileText,
            title: '1-Click Supplier Invoices',
            body: 'Create clean business invoices with vendor names, amounts, and due dates, or settle incoming vendor bills in one click.',
          },
          {
            icon: FiKey,
            title: '1-Click Auditor Pass',
            body: 'Share a read-only pass with your accountant or tax auditor so they can verify your payments without having access to spend your money.',
          },
          {
            icon: FiShield,
            title: 'Full Control of Company Cash',
            body: 'Move funds smoothly between your standard operating wallet and your Private Balance whenever your business needs.',
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
