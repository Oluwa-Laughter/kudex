'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import {
  FiArrowRight,
  FiSend,
  FiLayers,
  FiCpu,
  FiShield,
  FiGlobe,
  FiRepeat,
  FiFileText,
} from 'react-icons/fi';
import { isVaultConfigured } from '@/lib/contracts/addresses';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';

const PROTOCOL_MODES = {
  A2A: {
    badge: 'Agent-to-Agent Execution',
    title: 'Bounded Multi-Solver RFQ Settlement',
    description:
      'KUDEX AGENT delegates negotiate firm full-fill quotes directly with institutional liquidity solvers inside strict per-trade, daily, and pair-specific mandates.',
    steps: [
      'Owner signs an on-chain RFQ mandate locking token pair, maker, and payment cap.',
      'KUDEX AGENT verifies solver quote signatures and exchange ratios in real time.',
      'Atomic router settles 100% of the order or reverts with zero partial exposure.',
    ],
    ctaLabel: 'Explore Agent Fleet',
    ctaHref: '/app/agents',
  },
  A2B: {
    badge: 'Agent-to-Business Operations',
    title: 'Confidential Global Payroll & Corporate Invoicing',
    description:
      'Disburse multi-jurisdiction vendor invoices and treasury transfers using one-time recipient commitments while preserving read-only viewing keys for auditors.',
    steps: [
      'Generate cryptographic vendor invoices with SHA-256 encrypted payment references.',
      'Shield corporate liquidity on arrival or dispatch one-time recipient claim notes.',
      'Export selective disclosure certificates for tax and regulatory verification.',
    ],
    ctaLabel: 'Open Private Settlement',
    ctaHref: '/app/settlement',
  },
  A2H: {
    badge: 'Agent-to-Human Control',
    title: 'Telemetry-Guided Treasury & Yield Allocation',
    description:
      'Treasury operators inspect live pool solvency, bridge routes, and counterparty quotes through KUDEX AGENT while keeping final signing keys in hardware or browser wallets.',
    steps: [
      'Query live pool collateral, risk gauges, and gas estimates in plain language.',
      'Review slippage-bounded vault deposits or cross-chain solver bridge intents.',
      'Revoke any active delegate session key in one click at any block.',
    ],
    ctaLabel: 'Launch Portfolio Overview',
    ctaHref: '/app/overview',
  },
} as const;

export default function EnterpriseLandingPage() {
  const [mode, setMode] = useState<keyof typeof PROTOCOL_MODES>('A2A');
  const events = useProtocolEvents();

  const vault = useQuery<{ totalAssets: string; symbol: string }>({
    queryKey: ['landing-vault'],
    enabled: isVaultConfigured,
    staleTime: 20_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/vault');
      if (!r.ok) throw new Error('Pool telemetry unavailable');
      return r.json();
    },
  });

  const network = useQuery<{ block: string }>({
    queryKey: ['landing-network'],
    staleTime: 20_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/network');
      if (!r.ok) throw new Error('Network unavailable');
      return r.json();
    },
  });

  const tvlDisplay = vault.data
    ? `${vault.data.totalAssets} ${vault.data.symbol}`
    : '0.00 USDC';

  const volumeDisplay = events.data
    ? `${formatUnits(events.data.totalVolumeBigInt, events.data.decimals)} units`
    : '0.00 units';

  const activeWorkflow = PROTOCOL_MODES[mode];

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.25fr_0.85fr]">
        <div className="space-y-6">
          <p className="eyebrow">Institutional Settlement Network</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            The Autonomous Confidential Settlement Layer.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Move cross-chain capital, settle negotiated institutional RFQs, run private
            corporate invoicing, and delegate bounded treasury execution to KUDEX AGENT
            with built-in solvency protection.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/app/overview" className="action-link text-base">
              <span>Launch App</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
            <Link href="/docs" className="quiet-link text-base">
              <span>Explore Docs</span>
            </Link>
          </div>
        </div>

        {/* Hero Telemetry Card */}
        <div className="panel space-y-5 border-primary/30">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <span className="text-sm font-semibold text-primary">
              Live Settlement Telemetry
            </span>
            <span className="font-mono text-sm text-muted-foreground tabular-nums">
              {network.data ? `Block #${network.data.block}` : 'Live RPC'}
            </span>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl bg-secondary p-4">
              <span className="text-sm text-muted-foreground">
                Cross-Chain Solver Target
              </span>
              <p className="mt-1 font-mono text-2xl font-bold text-accent tabular-nums">
                &lt; 45s · 0.05% Fee
              </p>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <span className="text-sm text-muted-foreground">
                Automated Solvency Circuit Breaker
              </span>
              <p className="mt-1 font-mono text-2xl font-bold text-primary tabular-nums">
                85.00% Risk Threshold
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Ribbon */}
      <section
        aria-label="Live protocol statistics"
        className="grid gap-4 rounded-2xl border border-border bg-card p-6 sm:grid-cols-3 sm:p-8"
      >
        <div>
          <span className="text-sm text-muted-foreground">On-Chain Pool TVL</span>
          <p className="mt-1 font-mono text-2xl font-bold text-primary tabular-nums sm:text-3xl">
            {tvlDisplay}
          </p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">
            Recent Settlement Window Volume
          </span>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums sm:text-3xl">
            {volumeDisplay}
          </p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">
            Autonomous Agent Profiles
          </span>
          <p className="mt-1 font-mono text-2xl font-bold text-accent tabular-nums sm:text-3xl">
            3 Bounded Modules
          </p>
        </div>
      </section>

      {/* Interactive A2A / A2B / A2H Protocol Explorer */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Execution Topology</p>
            <h2 className="text-2xl font-bold sm:text-4xl">
              Interactive Protocol Explorer
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['A2A', 'A2B', 'A2H'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`min-h-11 rounded-xl border px-5 py-2.5 text-sm font-bold transition ${
                  mode === key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {key} Workflow
              </button>
            ))}
          </div>
        </div>

        <div className="panel grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
              {activeWorkflow.badge}
            </span>
            <h3 className="text-2xl font-bold">{activeWorkflow.title}</h3>
            <p className="text-base leading-relaxed text-muted-foreground">
              {activeWorkflow.description}
            </p>
            <div className="pt-2">
              <Link href={activeWorkflow.ctaHref} className="action-link text-sm">
                <span>{activeWorkflow.ctaLabel}</span>
                <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>

          <ol className="space-y-3">
            {activeWorkflow.steps.map((step, index) => (
              <li
                key={step}
                className="flex gap-3.5 rounded-xl border border-border bg-secondary p-4 text-sm leading-relaxed"
              >
                <span className="font-mono font-bold text-primary tabular-nums">
                  0{index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Solutions Showcase */}
      <section className="space-y-6">
        <div>
          <p className="eyebrow">Enterprise Solutions</p>
          <h2 className="text-2xl font-bold sm:text-4xl">
            Purpose-Built Financial Infrastructure
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              icon: FiSend,
              title: 'Enterprise Payroll & Invoicing',
              body: 'Settle global contractor payroll and corporate vendor invoices with one-time shielded commitments and selective auditor viewing keys.',
              href: '/solutions/enterprise-payroll',
              cta: 'Explore Payroll Solution',
            },
            {
              icon: FiLayers,
              title: 'Institutional Credit Tranches',
              body: 'Allocate capital across Senior, Mezzanine, and Junior pools backed by automated 85% risk circuit breakers and DaaS reserve waterfalls.',
              href: '/solutions/credit-tranches',
              cta: 'Explore Credit Tranches',
            },
            {
              icon: FiCpu,
              title: 'Autonomous Agent Solvers',
              body: 'Authorize KUDEX AGENT session keys with strict time expirations, cumulative token spend caps, and whitelisted contract functions.',
              href: '/solutions/autonomous-agents',
              cta: 'Explore KUDEX AGENT',
            },
          ].map((card) => (
            <article
              key={card.href}
              className="panel flex flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                  <card.icon size={22} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold">{card.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {card.body}
                </p>
              </div>
              <Link
                href={card.href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <span>{card.cta}</span>
                <FiArrowRight aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Capabilities Strip */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: FiRepeat,
            title: 'Zero-Slippage RFQ',
            desc: 'Signed bilateral quotes settled atomically in full.',
          },
          {
            icon: FiGlobe,
            title: 'Cross-Chain Solvers',
            desc: 'Direct & Shield-on-Arrival routing from major L1/L2s.',
          },
          {
            icon: FiFileText,
            title: 'Auditor Viewing Keys',
            desc: 'Read-only tax and compliance proofs without balance leaks.',
          },
          {
            icon: FiShield,
            title: 'DaaS Risk Guardrails',
            desc: 'Real-time pool risk gauges and automated deposit freezes.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-border bg-card p-5">
            <item.icon className="text-primary" size={20} aria-hidden="true" />
            <h3 className="mt-3 text-base font-bold">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
