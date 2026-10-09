'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  FiLayers,
  FiShield,
  FiTrendingUp,
  FiArrowRight,
  FiCheckCircle,
  FiAlertTriangle,
  FiActivity,
  FiPieChart,
  FiDollarSign,
  FiLock,
} from 'react-icons/fi';
import { RiExchangeFundsLine, RiShieldCheckLine } from 'react-icons/ri';

export default function CreditTranchesPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (containerRef.current) {
        gsap.from(containerRef.current.querySelectorAll('.tranche-anim'), {
          opacity: 0,
          y: 24,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-16">
      {/* Breadcrumb Header */}
      <div className="tranche-anim flex items-center gap-2 text-sm font-mono text-slate-500 dark:text-neutral-400 mb-6">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#00E599] font-semibold">Solutions</span>
        <span>/</span>
        <span className="text-slate-900 dark:text-neutral-200 font-semibold">Credit Tranches & Solvency</span>
      </div>

      {/* Hero Header */}
      <div className="tranche-anim max-w-4xl space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-sm font-semibold text-[#00E599]">
          <FiLayers className="w-4 h-4" />
          <span>INSTITUTIONAL DEBT SOLVENCY ENGINE</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Structured Credit Tranches & Algorithmic Solvency
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
          Access institutional-grade real-world credit structured into Senior, Mezzanine, and Junior risk tiers.
          Protected by algorithmic solvency surveillance that replaces abrupt liquidations with automated debt restructuring.
        </p>
        <div className="pt-2 flex flex-wrap items-center gap-4">
          <Link
            href="/app/vaults"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/20"
          >
            <span>Open Vaults Workspace</span>
            <RiExchangeFundsLine className="w-4 h-4" />
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 dark:bg-[#0E121B] hover:bg-slate-200 dark:hover:bg-[#161C2B] text-slate-900 dark:text-white font-semibold text-base border border-slate-200 dark:border-[#21293D] transition"
          >
            <span>Explore Active Tranches</span>
          </Link>
        </div>
      </div>

      {/* 3 Core Tranche Tiers Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Senior Tranche */}
        <div className="tranche-anim p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#00E599]/40 transition space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-md bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold border border-[#00E599]/20">
              SENIOR TRANCHE (AAA)
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">First-Priority Claim</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-[#00E599] tabular-nums">
              8.50% <span className="text-base font-sans font-normal text-slate-500 dark:text-neutral-400">Target APY</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-neutral-400">Targeted for corporate treasuries & stable funds</p>
          </div>
          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300 border-t border-slate-200 dark:border-[#21293D] pt-4">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Full legal & cryptographic principal priority</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Junior loss absorption buffer</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Zero-loss liquidation immunization</span>
            </li>
          </ul>
        </div>

        {/* Mezzanine Tranche */}
        <div className="tranche-anim p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#00E599]/40 transition space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-md bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold border border-[#00E599]/20">
              MEZZANINE TRANCHE (BBB)
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">Subordinated Cushion</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
              14.20% <span className="text-base font-sans font-normal text-slate-500 dark:text-neutral-400">Target APY</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-neutral-400">Targeted for institutional yield allocators</p>
          </div>
          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300 border-t border-slate-200 dark:border-[#21293D] pt-4">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Secondary liquidation payout hierarchy</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Enhanced risk-adjusted yield spread</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Automated debt haircut cushioning</span>
            </li>
          </ul>
        </div>

        {/* Junior Tranche */}
        <div className="tranche-anim p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#00E599]/40 transition space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-md bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold border border-[#00E599]/20">
              JUNIOR TRANCHE (EQUITY)
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">First-Loss Alpha</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
              22.80% <span className="text-base font-sans font-normal text-slate-500 dark:text-neutral-400">Max APY</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-neutral-400">Targeted for high-upside hedge funds & alpha desks</p>
          </div>
          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300 border-t border-slate-200 dark:border-[#21293D] pt-4">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Maximized performance spread capture</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>First-loss absorption capital</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Governance voting weighting</span>
            </li>
          </ul>
        </div>
      </div>

      {/* NEW SECTION 1: CONTINUOUS SOLVENCY TELEMETRY & WATERFALL PROOFS */}
      <div className="tranche-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 sm:p-10 mb-16 shadow-sm">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E599]/10 text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <FiActivity className="w-3.5 h-3.5" />
            <span>CONTINUOUS ON-CHAIN SURVEILLANCE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Algorithmic Restructuring Over Flash Liquidations
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            In standard lending protocols, collateral is abruptly seized by liquidation bots at steep discounts.
            Kudex implements on-chain solvency amortization: the protocol tracks real-time debt ratios and
            initiates orderly repayment restructurings that protect Senior capital with zero cascade contagion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">1. Solvency Index Scoring</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Every facility maintains a live risk index bounded between 0 and 10,000 basis points. Health Factors &gt; 1.15x confirm flawless capital coverage.
            </p>
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">
              Baseline Target: &gt; 1.40x Health Factor
            </div>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">2. Junior First-Loss Shield</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              If an originator experiences payment delays, junior tranche yields absorb the initial deficit, leaving senior capital 100% intact.
            </p>
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">
              First 25% Deficit Fully Absorbed
            </div>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">3. Smooth Debt Amortization</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Rather than sudden liquidation firesales, facility cashflows are redirected toward senior tranche redemption before junior payouts resume.
            </p>
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">
              Zero Contagion Risk
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION 2: UNDERWRITING STANDARDS & LEGAL SPV BACKING */}
      <div className="tranche-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 sm:p-10 mb-16 shadow-sm">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E599]/10 text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <FiShield className="w-3.5 h-3.5" />
            <span>ORIGINATOR DUE DILIGENCE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Institutional Underwriting & Bankruptcy-Remote Structure
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            Every tokenized credit facility listed on Kudex undergoes institutional credit underwriting.
            Underlying receivables and treasury instruments are ring-fenced within bankruptcy-remote Special Purpose Vehicles (SPVs).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">LEGAL FRAMEWORK</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">Bankruptcy-Remote SPVs</div>
            <p className="text-xs text-slate-600 dark:text-neutral-400">Assets are isolated from originator operating liabilities.</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">COLLATERAL RATIO</div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-[#00E599]">&gt; 125% Overcollateralized</div>
            <p className="text-xs text-slate-600 dark:text-neutral-400">Strict margin cushions verified by real-time proof-of-reserve oracles.</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">AUDITING CADENCE</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">Continuous Attestation</div>
            <p className="text-xs text-slate-600 dark:text-neutral-400">Third-party accounting partners attest collateral values monthly.</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">LIQUIDITY REDEMPTION</div>
            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-[#00E599]">Instant kUSDp Exit</div>
            <p className="text-xs text-slate-600 dark:text-neutral-400">Continuous buffer reserves enable instant redemptions back to stablecoins.</p>
          </div>
        </div>
      </div>

      {/* Comparison Grid: Kudex vs Traditional DeFi vs CeFi */}
      <div className="tranche-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 mb-16 shadow-sm">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          How Kudex Solvency Outperforms Legacy Lending Pools
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#21293D] text-slate-500 dark:text-neutral-400">
                <th className="pb-3.5 font-semibold">METRIC</th>
                <th className="pb-3.5 font-semibold text-emerald-600 dark:text-[#00E599]">KUDEX TRANCHES</th>
                <th className="pb-3.5 font-semibold">LEGACY LENDING (AAVE/COMPOUND)</th>
                <th className="pb-3.5 font-semibold">OFF-CHAIN PRIVATE CREDIT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#21293D] text-slate-800 dark:text-neutral-300">
              <tr>
                <td className="py-4 font-bold text-slate-900 dark:text-white">Liquidation Model</td>
                <td className="py-4 text-emerald-600 dark:text-[#00E599] font-bold">Algorithmic Restructuring</td>
                <td className="py-4 text-rose-500">Flash Liquidation Firesales</td>
                <td className="py-4 text-slate-500">Multi-Month Court Insolvency</td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-slate-900 dark:text-white">Senior Capital Protection</td>
                <td className="py-4 text-emerald-600 dark:text-[#00E599] font-bold">Subordinated Junior Absorption</td>
                <td className="py-4 text-rose-500">Socialized Bad Debt Losses</td>
                <td className="py-4 text-slate-500">Legal Recourse Only</td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-slate-900 dark:text-white">Yield Predictability</td>
                <td className="py-4 text-emerald-600 dark:text-[#00E599] font-bold">Fixed Tranche Spread (8.5% - 22.8%)</td>
                <td className="py-4 text-slate-500">Volatile Utilization Fluctuation</td>
                <td className="py-4 text-slate-500">Opaque Quarterly Discretion</td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-slate-900 dark:text-white">Mempool Confidentiality</td>
                <td className="py-4 text-emerald-600 dark:text-[#00E599] font-bold">100% Shielded Balances</td>
                <td className="py-4 text-rose-500">Zero (Full Public Wallet Tracking)</td>
                <td className="py-4 text-slate-500">Private but Centralized</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Box */}
      <div className="tranche-anim p-10 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-slate-100 dark:bg-gradient-to-r dark:from-[#0E121B] dark:to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Ready to Deploy Institutional Capital?</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 max-w-xl leading-relaxed">
            Choose your risk profile and earn protected yield backed by verifiable real-world assets.
          </p>
        </div>
        <Link
          href="/app/vaults"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/15 flex-shrink-0"
        >
          <span>Open Vaults Workspace</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
