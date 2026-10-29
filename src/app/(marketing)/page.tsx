import Link from 'next/link';
import { FiArrowRight, FiLayers, FiRepeat, FiCpu, FiShield } from 'react-icons/fi';
const capabilities = [
  {
    title: 'Confidential settlement',
    icon: FiShield,
    text: 'Protect commercial details with reviewed proof systems, note ownership and scoped disclosure. Public custody is the current foundation; private transfers remain disabled.',
    href: '/app/settlement',
    status: 'Privacy protocol in development',
  },
  {
    title: 'Institutional RFQ markets',
    icon: FiRepeat,
    text: 'Negotiate exact commercial terms with counterparties. Sign and review full-fill quotes before public atomic token settlement.',
    href: '/app/marketplace',
    status: 'Signed settlement implemented · deployment required',
  },
  {
    title: 'Bounded financial agents',
    icon: FiCpu,
    text: 'Separate assistance from authority. Owner-reviewed token-unit policies limit deposit execution; trading mandates require separately reviewed contracts.',
    href: '/app/agents',
    status: 'Policy foundation · hosted execution unavailable',
  },
  {
    title: 'Structured credit & default',
    icon: FiLayers,
    text: 'Build from verified origination through repayment and recovery. Custody alone does not create credit rights or off-chain recovery powers.',
    href: '/app/credit',
    status: 'Credit markets in development',
  },
];
export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-2xl space-y-20 px-5 py-12 sm:px-10 lg:px-16">
      <section className="mx-auto max-w-4xl space-y-8 py-12 text-center sm:py-20">
        <p className="eyebrow justify-center">
          Portaldot V3 Testnet · Revive EVM & Substrate
        </p>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Kudex — The Autonomous Confidential Economy
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
          Private settlement, institutional RFQ markets, and bounded financial agents,
          engineered for Portaldot. Build commercial workflows without granting
          unrestricted custody.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link className="action-link" href="/app/overview">
            Launch App <FiArrowRight aria-hidden="true" />
          </Link>
          <Link className="quiet-link" href="/how-it-works">
            How It Works
          </Link>
        </div>
        <p className="rounded-2xl border border-border bg-card p-5 text-sm leading-6 text-muted-foreground">
          Testnet software. No live financial metrics or investment returns are claimed.
          Public-testnet custody journeys require verified contracts, funded signing
          accounts and confirmed receipts.
        </p>
      </section>
      <section className="grid gap-6 md:grid-cols-2">
        {capabilities.map((item) => (
          <article key={item.title} className="panel flex flex-col gap-5">
            <item.icon className="text-primary" size={28} aria-hidden="true" />
            <p className="text-xs font-mono text-primary">{item.status}</p>
            <h2 className="text-2xl font-semibold">{item.title}</h2>
            <p className="flex-1 leading-7 text-muted-foreground">{item.text}</p>
            <Link href={item.href} className="quiet-link">
              Explore workflow <FiArrowRight aria-hidden="true" />
            </Link>
          </article>
        ))}
      </section>
      <section className="panel grid gap-8 md:grid-cols-2">
        <div>
          <p className="eyebrow">A staged foundation</p>
          <h2 className="mt-4 text-3xl font-semibold">
            Build trust before expanding custody.
          </h2>
        </div>
        <div className="space-y-4 leading-7 text-muted-foreground">
          <p>
            Public financial rails reveal amounts and relationships. Kudex is building
            toward selective commercial confidentiality, with explicit cryptographic and
            deployment gates.
          </p>
          <p>
            Portaldot V3 supplies native Substrate identities and Revive execution.
            Current vault shares and token transfers are public. No principal protection,
            APY, private settlement or automated profits are promised.
          </p>
          <Link className="action-link" href="/app/overview">
            Inspect testnet readiness <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
