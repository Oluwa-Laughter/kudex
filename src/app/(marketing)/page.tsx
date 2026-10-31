'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';
import {
  FiArrowRight,
  FiCheckCircle,
  FiCpu,
  FiFileText,
  FiLayers,
  FiLock,
  FiRepeat,
  FiSend,
  FiShield,
} from 'react-icons/fi';
import { isVaultConfigured } from '@/lib/contracts/addresses';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';

const THREE_THINGS = [
  {
    icon: FiSend,
    title: 'Pay & Get Paid Privately',
    body: 'Send supplier payments or payroll across borders without competitors seeing who you pay or how much you spend.',
    href: '/app/pay',
    cta: 'Open Send & Invoice',
  },
  {
    icon: FiLayers,
    title: 'Earn Protected Yield',
    body: 'Put idle cash to work in fixed-yield business vaults backed by automatic default protection.',
    href: '/app/earn',
    cta: 'Explore Business Vaults',
  },
  {
    icon: FiCpu,
    title: 'Put Money on Auto-Pilot',
    body: 'Tell your Kudex Agent what you need in plain English, set a strict spending limit, and never click a wallet popup again.',
    href: '/app/agent',
    cta: 'Set Auto-Pilot Rules',
  },
] as const;

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Connect & Hide Your Balance in One Click',
    summary:
      'Deposit digital dollars or move funds from Ethereum, Arbitrum, Base, or Optimism directly into Private Balances (Stealth Mode) so competitors never see your company cash position.',
    badge: 'Private Balances (Stealth Mode)',
    href: '/app/pay',
  },
  {
    step: '02',
    title: 'Earn Steady Returns with Built-In Payment Protection',
    summary:
      'Allocate idle operating cash into Fixed-Yield Business Vaults backed by short-term treasuries and verified invoices. If an invoice pays late, automatic pool protection freezes inflows and covers your principal from the safety reserve.',
    badge: 'Built-In Payment Protection',
    href: '/app/earn',
  },
  {
    step: '03',
    title: 'Automate Routine Finance & Share a 1-Click Auditor Pass',
    summary:
      'Give your Kudex Agent a clear spending budget and time limit, and generate a read-only 1-Click Auditor Pass whenever your accountant needs to verify payments.',
    badge: 'Auto-Pilot Rules & Auditor Pass',
    href: '/app/agent',
  },
] as const;

const PLAIN_ENGLISH_GUARANTEES = [
  {
    icon: FiLock,
    title: 'Private Balances (Stealth Mode)',
    body: 'Your wallet balance and payment amounts are hidden from the public. Only you and the person you pay can see the numbers.',
  },
  {
    icon: FiCpu,
    title: 'Auto-Pilot Rules (Spending Limits)',
    body: "Give your Kudex Agent a budget and a time limit. It handles trades and payments in the background without asking you to click 'Approve' on every step.",
  },
  {
    icon: FiLayers,
    title: 'Fixed-Yield Business Vaults',
    body: 'Earn steady, predictable returns backed by real-world business invoices and short-term treasuries.',
  },
  {
    icon: FiShield,
    title: 'Built-In Payment Protection',
    body: 'If a borrower fails to pay an invoice on time, Kudex automatically freezes the pool and recovers your funds from the safety reserve.',
  },
  {
    icon: FiRepeat,
    title: 'Best-Price Auto-Routing',
    body: 'Swap assets or move money across networks in one click. Background bots compete to give you the lowest fee and fastest settlement.',
  },
  {
    icon: FiFileText,
    title: '1-Click Auditor Pass',
    body: 'Share a read-only pass with your accountant or tax auditor so they can verify your payments without having access to spend your money.',
  },
] as const;

export default function LandingPage() {
  const events = useProtocolEvents();

  const vault = useQuery<{ totalAssets: string; symbol: string }>({
    queryKey: ['landing-vault'],
    enabled: isVaultConfigured,
    staleTime: 20_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/vault');
      if (!r.ok) throw new Error('Vault status unavailable');
      return r.json();
    },
  });

  const network = useQuery<{ block: string }>({
    queryKey: ['landing-network'],
    staleTime: 20_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/network');
      if (!r.ok) throw new Error('Network status unavailable');
      return r.json();
    },
  });

  const totalPoolSize = vault.data
    ? `${vault.data.totalAssets} ${vault.data.symbol}`
    : '$0.00 USDC';

  const recentVolume = events.data
    ? `${formatUnits(events.data.totalVolumeBigInt, events.data.decimals)} settled`
    : '0.00 settled';

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.25fr_0.85fr]">
        <div className="space-y-6">
          <span className="emerald-badge">
            <FiShield aria-hidden="true" />
            <span>Private Business Operating System</span>
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Private, Automated Finance for Modern Businesses.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Kudex is a financial operating system where AI agents pay invoices, trade
            assets, and earn protected yield for you automatically—without exposing your
            balances to the public.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/app/overview" className="action-link text-base">
              <span>Open App</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
            <a href="#how-it-works" className="quiet-link text-base">
              <span>See How It Works</span>
            </a>
          </div>
        </div>

        {/* Live Reassurance Card */}
        <div className="panel space-y-5 border-primary/30">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <span className="text-sm font-bold text-primary">
              Live Financial Safeguards
            </span>
            <span className="font-mono text-sm font-semibold text-muted-foreground tabular-nums">
              {network.data ? `Block #${network.data.block}` : 'Live Network'}
            </span>
          </div>

          <div className="space-y-3.5">
            <div className="rounded-xl bg-secondary p-4">
              <span className="text-sm text-muted-foreground">
                Private Balances (Stealth Mode)
              </span>
              <p className="mt-1 text-xl font-bold text-primary">
                Hidden Amounts &amp; Balances
              </p>
            </div>
            <div className="rounded-xl bg-secondary p-4">
              <span className="text-sm text-muted-foreground">
                Built-In Payment Protection
              </span>
              <p className="mt-1 text-xl font-bold tabular-nums">
                100% Safety Reserve Active
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-secondary p-3.5">
                <span className="text-sm text-muted-foreground">Active Vault Pool</span>
                <p className="mt-1 text-lg font-bold tabular-nums">{totalPoolSize}</p>
              </div>
              <div className="rounded-xl bg-secondary p-3.5">
                <span className="text-sm text-muted-foreground">Recent Activity</span>
                <p className="mt-1 text-lg font-bold text-accent tabular-nums">
                  {recentVolume}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The "3 Things You Can Do" Section */}
      <section aria-labelledby="three-things-heading" className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <p className="eyebrow">Built for Business Owners, CFOs &amp; Investors</p>
          <h2 id="three-things-heading" className="text-2xl font-bold sm:text-4xl">
            3 Things You Can Do in Seconds
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {THREE_THINGS.map((card) => (
            <article
              key={card.title}
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

      {/* 3-Step Visual Guide */}
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        className="scroll-mt-24 space-y-8"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <p className="eyebrow">How It Works</p>
            <h2 id="how-it-works-heading" className="text-2xl font-bold sm:text-4xl">
              From Deposit to Automated Execution in 3 Steps
            </h2>
          </div>
          <Link href="/app/overview" className="action-link text-sm">
            <span>Open App</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {HOW_IT_WORKS_STEPS.map((item) => (
            <article
              key={item.step}
              className="panel flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-base font-bold text-accent tabular-nums">
                    STEP {item.step}
                  </span>
                  <span className="emerald-badge">
                    <FiCheckCircle aria-hidden="true" />
                    <span>{item.badge}</span>
                  </span>
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {item.summary}
                </p>
              </div>
              <Link
                href={item.href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <span>Try Step {item.step}</span>
                <FiArrowRight aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Plain-English Feature Dictionary Grid */}
      <section aria-labelledby="guarantees-heading" className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <p className="eyebrow">Everything Under One Roof</p>
          <h2 id="guarantees-heading" className="text-2xl font-bold sm:text-4xl">
            Enterprise-Grade Protection Without the Complexity
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PLAIN_ENGLISH_GUARANTEES.map((item) => (
            <div key={item.title} className="panel space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                <item.icon size={20} aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
