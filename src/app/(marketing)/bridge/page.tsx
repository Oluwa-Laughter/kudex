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
          <p className="eyebrow">Best-Price Auto-Routing</p>
          <h1 className="page-title">Move Money Across Networks in One Click</h1>
          <p className="page-description">
            Transfer business funds from Ethereum, Arbitrum, Base, and Optimism straight
            into your Kudex account—or directly into your Private Balance—in under 45
            seconds.
          </p>
        </div>
        <Link href="/app/trade" className="action-link text-sm">
          <span>Open Trade &amp; Bridge</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            icon: FiZap,
            title: 'Under 45 Seconds',
            body: 'Background bots compete to complete your cross-network transfer as soon as your origin deposit confirms.',
          },
          {
            icon: FiShield,
            title: 'Receive into Private Balance',
            body: 'Check one box to hide incoming amounts immediately inside Private Balances (Stealth Mode).',
          },
          {
            icon: FiGlobe,
            title: '0.05% Transparent Fee',
            body: 'Predictable routing cost with zero hidden exchange-rate markups.',
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
        <h2 className="text-xl font-bold">Supported Networks</h2>
        <div className="table-region rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary text-muted-foreground">
              <tr>
                <th className="px-4 py-3">From Network</th>
                <th className="px-4 py-3">To Account</th>
                <th className="px-4 py-3">Supported Assets</th>
                <th className="px-4 py-3">Estimated Time</th>
                <th className="px-4 py-3">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CORRIDORS.map((row) => (
                <tr key={row.source}>
                  <td className="px-4 py-3 font-semibold">{row.source}</td>
                  <td className="px-4 py-3 font-medium text-primary">
                    Kudex Business Account
                  </td>
                  <td className="px-4 py-3 font-mono">{row.assets}</td>
                  <td className="px-4 py-3 font-mono font-bold tabular-nums">{row.eta}</td>
                  <td className="px-4 py-3 font-mono font-bold text-accent tabular-nums">
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
