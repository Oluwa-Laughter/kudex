import Link from 'next/link';
import { FiCheck, FiArrowRight, FiShield, FiFileText, FiLayers } from 'react-icons/fi';

const TIERS = [
  {
    name: 'Protocol Settlement Tier',
    price: '0.10%',
    unit: 'per private trade · 0.05% bridge routing',
    icon: FiShield,
    accent: false,
    description:
      'Transparent pay-as-you-settle execution across RFQ orderbooks, cross-chain solver routes, and shielded transfers.',
    features: [
      '0.10% settlement fee on private RFQ trades',
      '0.05% cross-chain solver bridge routing fee',
      'One-time shielded recipient notes & corporate invoicing',
      'Bounded KUDEX AGENT session key delegation',
    ],
    cta: 'Start Settling',
    href: '/app/marketplace',
  },
  {
    name: 'Enterprise Compliance Tier',
    price: '$799',
    unit: '/ month per organization',
    icon: FiFileText,
    accent: true,
    description:
      'Dedicated selective disclosure tooling, multi-auditor viewing key lifecycle management, and priority solver routing.',
    features: [
      'Unlimited scoped read-only viewing keys for external auditors',
      'Automated tax & regulatory compliance certificate exports',
      'Priority cross-chain solver quote execution (< 45s target)',
      'Multi-entity counterparty disclosure audit logs',
    ],
    cta: 'Open Compliance Workspace',
    href: '/app/compliance',
  },
  {
    name: 'Institutional Credit Tier',
    price: 'Custom',
    unit: 'bespoke facility architecture',
    icon: FiLayers,
    accent: false,
    description:
      'Tailored private debt issuance, custom Senior/Mezzanine/Junior tranche waterfalls, and automated DaaS restructuring.',
    features: [
      'Custom structured credit pool & tranche deployment',
      'Dedicated Default-as-a-Service (DaaS) risk sentinel thresholds',
      'Whitelisted institutional counterparty RFQ desks',
      'Dedicated KUDEX AGENT mandate engineering support',
    ],
    cta: 'Inspect Credit Pools',
    href: '/app/vaults',
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-14">
      <header className="space-y-4">
        <p className="eyebrow">Transparent Institutional Monetization</p>
        <h1 className="page-title">Protocol Fee Schedules & Compliance Tiers</h1>
        <p className="page-description">
          Predictable basis-point settlement fees paired with enterprise selective
          disclosure and bespoke structured credit facilities.
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
                {tier.accent && (
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
                    Enterprise Standard
                  </span>
                )}
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

              <p className="text-sm leading-relaxed text-muted-foreground">
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

            <Link
              href={tier.href}
              className={tier.accent ? 'action-link w-full text-sm' : 'cobalt-action w-full text-sm'}
            >
              <span>{tier.cta}</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
