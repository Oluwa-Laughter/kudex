import Link from 'next/link';
import { FiArrowRight, FiGlobe, FiShield, FiZap } from 'react-icons/fi';

const CORRIDORS = [
  {
    source: 'Ethereum Mainnet',
    assets: 'USDC · USDT · WETH',
    eta: '< 45s',
    fee: '0.05%',
  },
  {
    source: 'Arbitrum One',
    assets: 'USDC · USDT · WETH',
    eta: '< 45s',
    fee: '0.05%',
  },
  {
    source: 'Base',
    assets: 'USDC · WETH',
    eta: '< 45s',
    fee: '0.05%',
  },
  {
    source: 'Optimism',
    assets: 'USDC · USDT · WETH',
    eta: '< 45s',
    fee: '0.05%',
  },
];

export default function PublicBridgeGatewayPage() {
  return (
    <div className="space-y-14">
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-4">
          <p className="eyebrow">Cross-Chain Capital Gateway</p>
          <h1 className="page-title">
            Instant Solver Routing with Shield-on-Arrival
          </h1>
          <p className="page-description">
            Move treasury liquidity from Ethereum, Arbitrum, Base, and Optimism directly
            into Kudex accounts or private settlement commitments in under 45 seconds.
          </p>
        </div>
        <Link href="/app/bridge" className="cobalt-action text-sm">
          <span>Open Bridge Workspace</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            icon: FiZap,
            title: '< 45s Solver Completion',
            body: 'Competitive liquidity solvers fulfill signed intents immediately upon origin confirmation.',
          },
          {
            icon: FiShield,
            title: 'Shield on Arrival',
            body: 'Optionally mint a confidential recipient commitment on arrival so bridged liquidity enters private settlement directly.',
          },
          {
            icon: FiGlobe,
            title: '0.05% Flat Routing Fee',
            body: 'Predictable institutional routing cost with real-time destination gas refund estimates.',
          },
        ].map((card) => (
          <article key={card.title} className="panel space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-accent">
              <card.icon size={20} aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold">{card.title}</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {card.body}
            </p>
          </article>
        ))}
      </section>

      <section className="panel space-y-4">
        <h2 className="text-xl font-bold">Supported Liquidity Corridors</h2>
        <div className="table-region rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Origin Network</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Supported Assets</th>
                <th className="px-4 py-3">Target ETA</th>
                <th className="px-4 py-3">Solver Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CORRIDORS.map((row) => (
                <tr key={row.source}>
                  <td className="px-4 py-3 font-semibold">{row.source}</td>
                  <td className="px-4 py-3 text-primary">
                    Kudex Confidential Settlement
                  </td>
                  <td className="px-4 py-3 font-mono">{row.assets}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{row.eta}</td>
                  <td className="px-4 py-3 font-mono text-accent tabular-nums">
                    {row.fee}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
