import Link from 'next/link';
import { FiArrowRight, FiCheck, FiFileText, FiLayers, FiShield } from 'react-icons/fi';

const TIERS = [
  {
    name: 'Pay-As-You-Go Business',
    price: '0.03%',
    unit: 'per instant swap · 0.05% network transfer',
    icon: FiShield,
    accent: false,
    description:
      'Simple, predictable transaction pricing across Private Balances (Stealth Mode), Best-Price Auto-Routing, and supplier invoices.',
    features: [
      '0.03% fee on Best-Price Auto-Routing instant swaps',
      '0.05% fee to move funds across Ethereum, Arbitrum, Base, and Optimism',
      'Free Private Balances (Stealth Mode) and supplier invoicing',
      'Included Kudex Agent with Auto-Pilot Rules (Spending Limits)',
    ],
    cta: 'Start Using Kudex',
    href: '/app/trade',
  },
  {
    name: 'Growth & Accounting Suite',
    price: '$499',
    unit: '/ month per company',
    icon: FiFileText,
    accent: true,
    description:
      'Designed for finance teams managing recurring global payroll, multi-vendor billing, and external CPAs or tax auditors.',
    features: [
      'Unlimited 1-Click Auditor Passes for accountants and tax reviewers',
      'Downloadable payment verification summaries with 1-click revocation',
      'Priority Best-Price Auto-Routing across all connected networks',
      'Custom Auto-Pilot spending rules per department or workflow',
    ],
    cta: 'Open Send & Invoice',
    href: '/app/pay',
  },
  {
    name: 'Corporate Treasury',
    price: 'Custom',
    unit: 'dedicated business vaults',
    icon: FiLayers,
    accent: false,
    description:
      'Tailored Fixed-Yield Business Vaults and dedicated Built-In Payment Protection reserves for larger corporate cash balances.',
    features: [
      'Dedicated Short-Term Treasury & Business Invoice Vaults',
      'Custom Built-In Payment Protection reserve thresholds',
      'Direct treasury partner swap quotes with zero price slippage',
      'Dedicated onboarding for CFOs and treasury controllers',
    ],
    cta: 'Explore Earn Vaults',
    href: '/app/earn',
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-14">
      <header className="space-y-4">
        <p className="eyebrow">Simple, Transparent Pricing</p>
        <h1 className="page-title">Clear Pricing Built for Growing Businesses</h1>
        <p className="page-description">
          No hidden spreads, no surprise monthly minimums, and zero fees to keep your
          operating cash private.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <article
            key={tier.name}
            className={`panel flex flex-col justify-between space-y-6 ${
              tier.accent ? 'border-primary' : ''
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <tier.icon size={20} aria-hidden="true" />
                </div>
                {tier.accent && <span className="emerald-badge">Most Popular</span>}
              </div>

              <div>
                <h2 className="text-xl font-bold">{tier.name}</h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-4xl font-bold text-foreground tabular-nums">
                    {tier.price}
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {tier.unit}
                  </span>
                </div>
              </div>

              <p className="text-base leading-relaxed text-muted-foreground">
                {tier.description}
              </p>

              <ul className="space-y-3 border-t border-border pt-4 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <FiCheck
                      className="mt-1 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="tabular-nums">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link href={tier.href} className="action-link w-full text-sm">
              <span>{tier.cta}</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
