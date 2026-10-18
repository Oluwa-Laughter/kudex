import Link from 'next/link';
import { FiArrowRight, FiLayers, FiCpu, FiBookOpen, FiRepeat } from 'react-icons/fi';
import { NetworkReadiness } from '@/components/dashboard/NetworkReadiness';
import { NativeAccountCard } from '@/components/dashboard/NativeAccountCard';
import { VolumeChart } from '@/components/dashboard/VolumeChart';

const workflows = [
  {
    title: 'Manage vault capital',
    description:
      'Review collateral, deposit an exact amount, or withdraw available assets.',
    detail: 'Public transactions · Deployment required',
    href: '/app/vaults',
    action: 'Open vault',
    icon: FiLayers,
  },
  {
    title: 'Trade a signed offer',
    description:
      'Create an offer or review its exact terms before an atomic token exchange.',
    detail: 'Signed RFQ settlement',
    href: '/app/marketplace',
    action: 'Open marketplace',
    icon: FiRepeat,
  },
  {
    title: 'Work with Kudex Agent',
    description: 'Understand a workflow and set explicit limits for a deposit delegate.',
    detail: 'Product guidance · Bounded permissions',
    href: '/app/agents',
    action: 'Open agent workspace',
    icon: FiCpu,
  },
];

export default function OverviewPage() {
  return (
    <div className="space-y-9">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="eyebrow">Kudex workspace</p>
          <h1 className="page-title">Capital, settlement, and agents.</h1>
          <p className="page-description">
            Choose a vault, review a trade, or define agent permissions. Kudex is building
            toward confidential credit settlement; the current transaction paths use
            public assets and explicit wallet authorization.
          </p>
        </div>
        <Link className="quiet-link" href="/app/how-it-works">
          <FiBookOpen aria-hidden="true" />
          Read the product guide
        </Link>
      </header>

      <section aria-label="Capital workflows" className="grid gap-4 xl:grid-cols-3">
        {workflows.map((workflow) => (
          <Link
            key={workflow.href}
            className="panel flex flex-col transition-colors hover:border-primary"
            href={workflow.href}
          >
            <workflow.icon className="text-primary" size={25} aria-hidden="true" />
            <h2 className="mt-6 text-xl font-semibold">{workflow.title}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{workflow.description}</p>
            <p className="mb-7 mt-4 text-sm text-muted-foreground">{workflow.detail}</p>
            <span className="mt-auto inline-flex min-h-11 items-center gap-2 font-semibold text-primary">
              {workflow.action} <FiArrowRight aria-hidden="true" />
            </span>
          </Link>
        ))}
      </section>

      <VolumeChart />

      <details className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <summary className="min-h-12 cursor-pointer text-lg font-semibold">
          Network and wallet readiness
        </summary>
        <p className="mt-2 max-w-prose leading-7 text-muted-foreground">
          Transactions run on Portaldot testnet. Open these checks if you need to confirm
          funding, account mapping, or contract availability.
        </p>
        <div className="mt-6 space-y-6">
          <NativeAccountCard />
          <NetworkReadiness />
        </div>
      </details>
    </div>
  );
}
