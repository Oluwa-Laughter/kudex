import Link from 'next/link';
import { FiArrowRight, FiLayers, FiRepeat, FiCpu } from 'react-icons/fi';
const capabilities = [
  {
    title: 'Public vault',
    icon: FiLayers,
    text: 'ERC-4626 collateral custody with exact shares, bounded deposits and redemption. Availability depends on verified deployment.',
    href: '/app/vaults',
    status: 'Implemented · deployment required',
  },
  {
    title: 'Trading',
    icon: FiRepeat,
    text: 'Signed RFQ offers preserve exact counterparty terms. AMM swaps and liquidity await verified pool infrastructure.',
    href: '/app/marketplace',
    status: 'RFQ implemented · AMM unavailable',
  },
  {
    title: 'Bounded agents',
    icon: FiCpu,
    text: 'Deposit-only contract policies separate owner authorization from delegate execution. The assistant explains observed data.',
    href: '/app/agents',
    status: 'Policy contracts implemented · worker unavailable',
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
          Financial infrastructure.
          <br />
          <span className="text-primary">Verifiable on-chain.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground">
          Kudex connects public vaults, signed trading and bounded agent permissions.
          Review actual accounts and deployment readiness before signing a testnet
          transaction.
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
      <section className="grid gap-6 md:grid-cols-3">
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
            Structured tokenized credit, reviewed AMM liquidity, cross-chain settlement
            and confidential transfers remain development workstreams.
          </p>
          <p>
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
