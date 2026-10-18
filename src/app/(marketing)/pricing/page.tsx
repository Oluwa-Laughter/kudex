import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';

const proposals = [
  {
    title: 'Settlement',
    rate: '0.10%',
    basis: 'Proposed fee on confidential trade volume',
    detail:
      'Depends on a reviewed confidential settlement implementation and fee collection contracts.',
  },
  {
    title: 'Capital routing',
    rate: '0.05%',
    basis: 'Proposed bridge routing fee',
    detail:
      'Depends on a selected routing provider, executable quotes, and tested settlement and refund handling.',
  },
  {
    title: 'Debt origination',
    rate: '0.25%',
    basis: 'Proposed fee on a new debt facility',
    detail:
      'Depends on implemented asset origination, credit accounting, servicing, and loss allocation.',
  },
];

export default function PricingPage() {
  return (
    <article className="mx-auto max-w-screen-2xl px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
      <p className="eyebrow">Protocol economics</p>
      <h1 className="max-w-3xl text-4xl font-semibold sm:text-5xl">
        Pricing as the product develops.
      </h1>
      <p className="page-description">
        The rates below describe Kudex’s proposed business model. Current testnet vault
        and RFQ contracts do not collect these fees. Network transaction fees still apply.
      </p>
      <p className="mt-7 rounded-xl border border-border bg-secondary p-5 leading-7">
        Planning terms only. Paid plans, enterprise billing, and fee collection are not
        activated. No subscription or payment is requested here.
      </p>
      <section
        aria-label="Proposed protocol fees"
        className="mt-10 grid gap-5 lg:grid-cols-3"
      >
        {proposals.map((proposal) => (
          <article key={proposal.title} className="panel">
            <h2 className="text-xl font-semibold">{proposal.title}</h2>
            <p className="my-5 text-4xl font-semibold tabular-nums">{proposal.rate}</p>
            <p className="font-medium">{proposal.basis}</p>
            <p className="mt-3 leading-7 text-muted-foreground">{proposal.detail}</p>
          </article>
        ))}
      </section>
      <section className="mt-6 grid gap-6 rounded-2xl border border-border p-6 sm:p-9 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Enterprise audit services</h2>
          <p className="mt-4 text-3xl font-semibold tabular-nums">
            $799{' '}
            <span className="text-base font-normal text-muted-foreground">
              per month, proposed
            </span>
          </p>
        </div>
        <p className="leading-7 text-muted-foreground">
          The planned subscription covers organization viewing-key administration and
          reporting exports. The disclosure system and reporting service must be
          implemented and reviewed before this plan can be offered.
        </p>
      </section>
      <div className="mt-9 flex flex-wrap gap-3">
        <Link href="/app/overview" className="action-link">
          Explore current workflows <FiArrowRight aria-hidden="true" />
        </Link>
        <Link href="/how-it-works" className="quiet-link">
          Read the product guide
        </Link>
      </div>
    </article>
  );
}
