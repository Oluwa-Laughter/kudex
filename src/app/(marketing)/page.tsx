'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiShield,
  FiZap,
  FiLock,
  FiLayers,
  FiCpu,
  FiTrendingUp,
  FiCheckCircle,
  FiRepeat,
  FiActivity,
  FiKey,
  FiGlobe,
  FiDollarSign,
  FiPieChart,
  FiUsers,
  FiSliders,
  FiExternalLink,
} from 'react-icons/fi';
import {
  RiRobot2Line,
  RiExchangeFundsLine,
  RiShieldCheckLine,
  RiBankCardLine,
  RiRouteLine,
} from 'react-icons/ri';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { KUDEX_VAULT_ABI } from '@/lib/contracts/abis';
import { formatUnits } from 'viem';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { formatDisplayBalance } from '@/lib/math';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export default function MarketingHomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const { data: protocolEvents } = useProtocolEvents();

  // Live contract reads for hero telemetry
  const { data: totalAssetsRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'totalAssets',
  });

  const { data: riskScoreRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'riskScore',
  });

  const displayTVL = totalAssetsRaw && totalAssetsRaw > BigInt(0)
    ? `$${Number(formatUnits(totalAssetsRaw, 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '$0.00';

  const totalVolumeBigInt = protocolEvents?.totalVolumeBigInt ?? BigInt(0);
  const displayVolume = totalVolumeBigInt > BigInt(0)
    ? `$${formatDisplayBalance(totalVolumeBigInt, 6, 2)}`
    : '$0.00';

  const riskScoreNum = riskScoreRaw ? Number(riskScoreRaw) : 1200;
  const healthFactor = (10000 / Math.max(riskScoreNum, 1000)).toFixed(2);

  // GSAP Animations
  useGSAP(
    () => {
      // Hero elements entrance with clearProps: 'all' to ensure no stuck opacity: 0
      gsap.fromTo(
        '.gsap-hero-badge',
        { opacity: 0, y: -15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'all' }
      );

      gsap.fromTo(
        '.gsap-hero-title',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.1, ease: 'power3.out', clearProps: 'all' }
      );

      gsap.fromTo(
        '.gsap-hero-desc',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: 'power3.out', clearProps: 'all' }
      );

      gsap.fromTo(
        '.gsap-hero-cta',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.3, stagger: 0.1, ease: 'power3.out', clearProps: 'all' }
      );

      gsap.fromTo(
        '.gsap-stat-card',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.4, stagger: 0.08, ease: 'power2.out', clearProps: 'all' }
      );

      gsap.fromTo(
        '.gsap-feature-card',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.4, stagger: 0.08, ease: 'power2.out', clearProps: 'all' }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      {/* SECTION 1: HERO SECTION & LIVE TELEMETRY */}
      <section ref={heroRef} className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 pt-20 pb-24 text-center">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="gsap-hero-badge inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-sm font-semibold text-slate-800 dark:text-neutral-200 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E599] animate-pulse" />
            <span>INSTITUTIONAL SETTLEMENT LAYER & AGENT-NATIVE RWA LIQUIDITY</span>
          </div>

          <h1 className="gsap-hero-title text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.08]">
            Confidential Settlement for Global Institutions & Autonomous Agents
          </h1>

          <p className="gsap-hero-desc text-lg sm:text-2xl text-slate-600 dark:text-neutral-300 max-w-4xl mx-auto leading-relaxed pt-2">
            Atomic zero-slippage settlement, tokenized real-world credit tranches, client-side encrypted commitments,
            and bounded agent execution. Engineered for total confidentiality and mathematical solvency.
          </p>

          {/* Action CTAs */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/app/overview"
              className="gsap-hero-cta inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-xl shadow-[#00E599]/20"
            >
              <span>Launch Application</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/marketplace"
              className="gsap-hero-cta inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-white dark:bg-[#0E121B] hover:bg-slate-100 dark:hover:bg-[#161C2B] text-slate-900 dark:text-white border border-slate-200 dark:border-[#21293D] font-bold text-base transition shadow-sm"
            >
              <RiExchangeFundsLine className="w-5 h-5 text-[#00E599]" />
              <span>Explore RWA Tranches</span>
            </Link>
            <Link
              href="/how-it-works"
              className="gsap-hero-cta inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-slate-100 dark:bg-[#161C2B] hover:bg-slate-200 dark:hover:bg-[#21293D] text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-[#21293D] font-bold text-base transition"
            >
              <span>How It Works</span>
            </Link>
          </div>
        </div>

        {/* Live Protocol Stats Strip */}
        <div ref={statsRef} className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          <div className="gsap-stat-card p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] text-left shadow-sm">
            <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">
              Total Shielded Capital
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums mt-1.5">
              {displayTVL}
            </div>
            <div className="text-sm text-emerald-600 dark:text-[#00E599] font-semibold mt-1">
              Active Institutional Pools
            </div>
          </div>

          <div className="gsap-stat-card p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] text-left shadow-sm">
            <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">
              24h Settled Volume
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums mt-1.5">
              {displayVolume}
            </div>
            <div className="text-sm text-emerald-600 dark:text-[#00E599] font-semibold mt-1">
              Zero Front-Running
            </div>
          </div>

          <div className="gsap-stat-card p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] text-left shadow-sm">
            <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">
              Solvency Health Factor
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-[#00E599] tabular-nums mt-1.5">
              {healthFactor}x
            </div>
            <div className="text-sm text-emerald-600 dark:text-[#00E599] font-semibold mt-1">
              Automated Solvency Defense
            </div>
          </div>

          <div className="gsap-stat-card p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] text-left shadow-sm">
            <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">
              Kudex Agent Fleet
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums mt-1.5">
              Bounded Policies
            </div>
            <div className="text-sm text-slate-500 dark:text-neutral-400 font-semibold mt-1">
              Zero Master Key Exposure
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: 4 CORE ARCHITECTURAL PILLARS (BENTO GRID) */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-[#21293D]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold mb-3">
            ARCHITECTURAL ADVANTAGES
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Four Core Pillars of Kudex
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-neutral-400">
            Engineered to overcome transparency leaks, flash liquidations, and manual trading friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="gsap-feature-card p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition group">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <FiLock className="w-7 h-7" />
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                01
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Confidential Settlement
            </h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Client-side balance commitments decouple addresses from asset values. Public blockchain explorers
              record only encrypted proofs with zero plaintext metadata.
            </p>
            <div className="pt-2 text-sm font-semibold text-emerald-600 dark:text-[#00E599] flex items-center gap-1.5">
              <span>Zero Mempool Leakage</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="gsap-feature-card p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition group">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <FiLayers className="w-7 h-7" />
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                02
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Algorithmic Solvency
            </h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Structured credit tranches absorb losses smoothly. If market drawdowns occur, our automated debt
              restructuring safeguards senior principal instead of triggering flash liquidations.
            </p>
            <div className="pt-2 text-sm font-semibold text-emerald-600 dark:text-[#00E599] flex items-center gap-1.5">
              <span>Waterfall Capital Protection</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="gsap-feature-card p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition group">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <RiRobot2Line className="w-7 h-7" />
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                03
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Kudex Agent Fleet
            </h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Programmatic agents and solvers negotiate RFQ trades, rebalance yield, and optimize routing 24/7
              under cryptographic spend ceilings with zero wallet popups.
            </p>
            <div className="pt-2 text-sm font-semibold text-emerald-600 dark:text-[#00E599] flex items-center gap-1.5">
              <span>Bounded Session Keys</span>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="gsap-feature-card p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition group">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <RiRouteLine className="w-7 h-7" />
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                04
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Cross-Chain Solver Gateway
            </h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Move assets from Ethereum, Base, and Arbitrum in seconds. Select &ldquo;Shield on Arrival&rdquo; to mint
              private settlement notes instantly as funds bridge.
            </p>
            <div className="pt-2 text-sm font-semibold text-emerald-600 dark:text-[#00E599] flex items-center gap-1.5">
              <span>Instant Cross-Chain Fills</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: REAL-WORLD ASSET (RWA) TOKENIZED MARKETS */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-[#21293D]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold mb-3">
              TOKENIZED RWA FACILITIES
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Real-World Asset Credit Facilities
            </h2>
            <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 max-w-2xl">
              Access institutional real-world cash flows categorized by waterfall risk priority and backed by on-chain solvency proofs.
            </p>
          </div>

          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-[#00E599] hover:underline"
          >
            <span>View All RWA Tranches in Marketplace</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-7 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-5 shadow-sm hover:border-[#00E599]/40 transition">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#21293D]">
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                GRADE AAA
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">Senior Debt</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Global Supply Chain Invoice Pool
            </h3>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-neutral-400 block">Annualized Return</span>
              <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-[#00E599] tabular-nums">
                8.50%
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-[#21293D] flex justify-between text-sm text-slate-600 dark:text-neutral-400">
              <span>Facility TVL:</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">$6,200,000</span>
            </div>
          </div>

          <div className="p-7 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-5 shadow-sm hover:border-[#00E599]/40 transition">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#21293D]">
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                GRADE BBB
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">Mezzanine</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Trade Receivables & Logistics Facility
            </h3>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-neutral-400 block">Annualized Return</span>
              <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-[#00E599] tabular-nums">
                14.20%
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-[#21293D] flex justify-between text-sm text-slate-600 dark:text-neutral-400">
              <span>Facility TVL:</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">$4,800,000</span>
            </div>
          </div>

          <div className="p-7 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-5 shadow-sm hover:border-[#00E599]/40 transition">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#21293D]">
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                EQUITY
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">Junior First-Loss</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Hardware & Compute Infrastructure
            </h3>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-neutral-400 block">Annualized Return</span>
              <div className="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                22.80%
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-[#21293D] flex justify-between text-sm text-slate-600 dark:text-neutral-400">
              <span>Facility TVL:</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">$3,250,000</span>
            </div>
          </div>

          <div className="p-7 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-5 shadow-sm hover:border-[#00E599]/40 transition">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#21293D]">
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                GRADE AAA
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">Senior Debt</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Cross-Border SaaS Cash Flow Facility
            </h3>
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-neutral-400 block">Annualized Return</span>
              <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-[#00E599] tabular-nums">
                9.10%
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-[#21293D] flex justify-between text-sm text-slate-600 dark:text-neutral-400">
              <span>Facility TVL:</span>
              <span className="font-bold font-mono text-slate-900 dark:text-white">$5,100,000</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: THE KUDEX AGENT ECONOMY */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-[#21293D]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold">
              PROGRAMMATIC AGENTS & SOLVERS
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              The Autonomous Kudex Agent Economy
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-300 leading-relaxed">
              Eliminate manual human latency and recurring signing dialogs. Kudex empowers you to delegate
              bounded execution policies to autonomous agents that negotiate trades, route cross-chain liquidity,
              and rebalance credit tranches 24/7.
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] mt-0.5">
                  <FiCheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">Bounded Session Spend Caps</h4>
                  <p className="text-sm text-slate-600 dark:text-neutral-400">Enforce maximum daily spend limits and whitelist contracts on-chain.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] mt-0.5">
                  <FiCheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">Zero Master Key Exposure</h4>
                  <p className="text-sm text-slate-600 dark:text-neutral-400">Temporary cryptographic session keys expire automatically after duration.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] mt-0.5">
                  <FiCheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">One-Click Instant Revocation</h4>
                  <p className="text-sm text-slate-600 dark:text-neutral-400">Instantly terminate running agents and recall delegated permissions with one click.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link
                href="/solutions/autonomous-agents"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition shadow-lg shadow-[#00E599]/20"
              >
                <span>Explore Agent Architecture</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
                <div className="flex items-center gap-2.5">
                  <RiRobot2Line className="w-5 h-5 text-emerald-600 dark:text-[#00E599]" />
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Active Agent Session Policy</span>
                </div>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599]">
                  ENFORCED
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] font-mono text-sm space-y-2.5 text-slate-800 dark:text-neutral-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Agent Role:</span>
                  <span className="font-bold text-emerald-600 dark:text-[#00E599]">RFQ Solver Negotiator</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Daily Spend Cap:</span>
                  <span className="font-bold text-slate-900 dark:text-white">$5,000.00 pUSD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Allowed Target:</span>
                  <span className="font-semibold text-emerald-600 dark:text-[#00E599]">Kudex RFQ Solver Router</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Session TTL:</span>
                  <span className="font-semibold text-emerald-600 dark:text-[#00E599]">12 Hours Remaining</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wallet Popups:</span>
                  <span className="font-bold text-emerald-600 dark:text-[#00E599]">Zero Dialogs</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-slate-800 dark:text-neutral-200">
                <span className="font-bold text-emerald-600 dark:text-[#00E599]">Security Invariant: </span>
                Agent operates purely within authorized bounds. Even if market conditions swing wildly, your main wallet treasury cannot be depleted.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: SOLVENCY DEFENSE & RESTRUCTURING VS FLASH LIQUIDATIONS */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-[#21293D]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold mb-3">
            DEFAULT-AS-A-SERVICE
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How Solvency Defense Replaces Cascade Liquidations
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-neutral-400">
            Traditional decentralized finance wipes out borrowers and pools during volatility. Kudex engineers mathematical resilience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Legacy Problem Card */}
          <div className="p-8 sm:p-10 rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
            <div className="text-xs uppercase font-mono font-bold text-rose-600 dark:text-rose-400">
              Legacy DeFi Flaw
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Predatory Flash Liquidations
            </h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Arbitrage bots constantly monitor price oracles. At the slightest margin dip, predatory liquidations
              seize borrower collateral at massive discounts, draining pool reserves and causing catastrophic contagion.
            </p>
            <ul className="space-y-2.5 text-base text-rose-700 dark:text-rose-300 pt-3">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Immediate 100% loss of borrower position</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>MEV searchers extract value from the protocol</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Cascading insolvencies across dependent pools</span>
              </li>
            </ul>
          </div>

          {/* Kudex Solution Card */}
          <div className="p-8 sm:p-10 rounded-3xl border border-emerald-200 dark:border-[#00E599]/40 bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
            <div className="text-xs uppercase font-mono font-bold text-emerald-600 dark:text-[#00E599]">
              The Kudex Mechanism
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Algorithmic Tranche Restructuring
            </h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Kudex implements a waterfall priority structure. Junior equity buffers absorb initial volatility,
              allowing the protocol to execute smooth, orderly debt haircuts while preserving 100% of Senior depositor principal.
            </p>
            <ul className="space-y-2.5 text-base text-slate-700 dark:text-neutral-300 pt-3">
              <li className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
                <span>Senior Tranche (AAA) principal mathematically protected</span>
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
                <span>Proactive health scoring detects distress before default</span>
              </li>
              <li className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
                <span>Zero sudden-death liquidation cascades</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 6: INSTITUTIONAL COMPLIANCE & ASYMMETRIC VIEWING KEYS */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-[#21293D]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold">
              REGULATORY AUDITING
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Confidentiality with On-Demand Compliance
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-300 leading-relaxed">
              Institutional entities and corporate treasuries cannot use completely dark pools that violate anti-money
              laundering frameworks. Kudex resolves this with opt-in asymmetric viewing keys: you enjoy complete
              privacy from public blockchain surveillance while maintaining the ability to generate read-only audit exports.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-white dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D]">
                <FiKey className="w-6 h-6 text-[#00E599] mb-2" />
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Read-Only Access</h4>
                <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1">Auditors can decrypt transaction proofs without obtaining spend authority.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D]">
                <FiShield className="w-6 h-6 text-[#00E599] mb-2" />
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Tax & LP Reporting</h4>
                <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1">Export cryptographically verified JSON ledger reports for compliance officers.</p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/app/compliance"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-[#00E599] hover:underline"
              >
                <span>View Compliance & Key Generator &rarr;</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#21293D]">
                <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 font-semibold">
                  Auditor Viewing Key Payload
                </span>
                <span className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">
                  READ-ONLY EXPORT
                </span>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#06080D] font-mono text-sm text-slate-800 dark:text-neutral-300 space-y-2 border border-slate-200 dark:border-[#21293D]">
                <div><span className="text-slate-400">&#47;&#47; Cryptographic Viewing Permission</span></div>
                <div><span className="text-emerald-600 dark:text-[#00E599] font-bold">viewingKey:</span> &ldquo;vk_pub_0x9924...b4f1&rdquo;</div>
                <div><span className="text-emerald-600 dark:text-[#00E599] font-bold">permission:</span> AUDIT_READ_ONLY</div>
                <div><span className="text-emerald-600 dark:text-[#00E599] font-bold">canSpend:</span> false</div>
                <div><span className="text-emerald-600 dark:text-[#00E599] font-bold">settledRecords:</span> Verified Invariant Passed</div>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Guarantees privacy from competitors and public mempool surveillance while maintaining flawless institutional regulatory auditability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: PROTOCOL COMPARISON MATRIX */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-[#21293D]">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Comprehensive Protocol Comparison
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-neutral-400">
            See how confidential execution and solvency defense set Kudex apart from legacy platforms.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse rounded-3xl overflow-hidden border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] text-sm font-semibold text-slate-600 dark:text-neutral-400 uppercase tracking-wider">
                <th className="p-5 sm:p-6">Feature</th>
                <th className="p-5 sm:p-6 text-emerald-600 dark:text-[#00E599] font-bold bg-[#00E599]/10">Kudex Protocol</th>
                <th className="p-5 sm:p-6">Traditional AMMs</th>
                <th className="p-5 sm:p-6">Centralized Exchanges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#21293D] text-base text-slate-700 dark:text-neutral-300">
              <tr>
                <td className="p-5 sm:p-6 font-bold text-slate-900 dark:text-white">Transaction Privacy</td>
                <td className="p-5 sm:p-6 font-bold text-emerald-600 dark:text-[#00E599] bg-[#00E599]/5">Encrypted Off-Chain RFQ</td>
                <td className="p-5 sm:p-6 text-slate-500 dark:text-neutral-400">Public Mempool (Front-run risk)</td>
                <td className="p-5 sm:p-6 text-slate-500 dark:text-neutral-400">Internal database (Opaque)</td>
              </tr>
              <tr>
                <td className="p-5 sm:p-6 font-bold text-slate-900 dark:text-white">Custody of Assets</td>
                <td className="p-5 sm:p-6 font-bold text-emerald-600 dark:text-[#00E599] bg-[#00E599]/5">100% Non-Custodial</td>
                <td className="p-5 sm:p-6 text-slate-500 dark:text-neutral-400">Non-Custodial</td>
                <td className="p-5 sm:p-6 text-rose-500 font-semibold">Full Custodial Risk (FTX/Celsius)</td>
              </tr>
              <tr>
                <td className="p-5 sm:p-6 font-bold text-slate-900 dark:text-white">Solvency Guarantees</td>
                <td className="p-5 sm:p-6 font-bold text-emerald-600 dark:text-[#00E599] bg-[#00E599]/5">Automated Solvency Floor</td>
                <td className="p-5 sm:p-6 text-slate-500 dark:text-neutral-400">None (Cascade liquidations)</td>
                <td className="p-5 sm:p-6 text-slate-500 dark:text-neutral-400">Unverified / Self-reported</td>
              </tr>
              <tr>
                <td className="p-5 sm:p-6 font-bold text-slate-900 dark:text-white">Automated Agent Execution</td>
                <td className="p-5 sm:p-6 font-bold text-emerald-600 dark:text-[#00E599] bg-[#00E599]/5">Bounded Session Delegation</td>
                <td className="p-5 sm:p-6 text-slate-500 dark:text-neutral-400">Requires Full Private Key Exposure</td>
                <td className="p-5 sm:p-6 text-slate-500 dark:text-neutral-400">API keys with withdrawal risk</td>
              </tr>
              <tr>
                <td className="p-5 sm:p-6 font-bold text-slate-900 dark:text-white">Regulatory Audit Keys</td>
                <td className="p-5 sm:p-6 font-bold text-emerald-600 dark:text-[#00E599] bg-[#00E599]/5">Asymmetric Read-Only Viewing Keys</td>
                <td className="p-5 sm:p-6 text-slate-500 dark:text-neutral-400">All data public to anyone</td>
                <td className="p-5 sm:p-6 text-slate-500 dark:text-neutral-400">Manual CSV export requests</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 8: ENTERPRISE SOLUTIONS SUITE */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-[#21293D]">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold mb-3">
            ENTERPRISE SOLUTIONS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tailored Solutions for Every Financial Entity
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-neutral-400">
            Select a solution path to inspect the complete operational framework.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Link
            href="/solutions/enterprise-payroll"
            className="p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#00E599]/40 transition group flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20">
                <FiLock className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-[#00E599] transition">
                Enterprise Payroll
              </h3>
              <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
                Private global disbursements with zero balance leakage. Shield executive salaries, contractor compensations, and supplier invoices.
              </p>
            </div>
            <div className="pt-6 text-sm font-bold text-emerald-600 dark:text-[#00E599] flex items-center gap-2">
              <span>Read Solution Brief</span>
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/solutions/credit-tranches"
            className="p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#00E599]/40 transition group flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20">
                <FiLayers className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-[#00E599] transition">
                Credit Tranches & Solvency
              </h3>
              <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
                Deploy treasury capital across Senior, Mezzanine, or Junior risk tiers with algorithmic debt restructuring protection.
              </p>
            </div>
            <div className="pt-6 text-sm font-bold text-emerald-600 dark:text-[#00E599] flex items-center gap-2">
              <span>Read Solution Brief</span>
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/solutions/autonomous-agents"
            className="p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#00E599]/40 transition group flex flex-col justify-between shadow-sm"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20">
                <RiRobot2Line className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-[#00E599] transition">
                Autonomous Agents
              </h3>
              <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
                Empower programmatic solvers and AI copilots to execute RFQs and rebalance positions with bounded cryptographic session keys.
              </p>
            </div>
            <div className="pt-6 text-sm font-bold text-emerald-600 dark:text-[#00E599] flex items-center gap-2">
              <span>Read Solution Brief</span>
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION 9: HIGH-THROUGHPUT SETTLEMENT ENGINE & SUB-SECOND FINALITY */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-[#21293D]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold mb-3">
            HIGH-THROUGHPUT EXECUTION
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sub-Second Finality & Private RFQ Matching Engine
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-neutral-400">
            Off-chain order formulation meets block-atomic on-chain finality. Engineered for high-frequency institutional volume.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <FiZap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Deterministic 380ms Quotes</h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Institutional market makers and solver fleets formulate guaranteed executable pricing off-chain in under 400 milliseconds.
            </p>
            <div className="pt-2 text-sm font-semibold text-emerald-600 dark:text-[#00E599] flex items-center gap-1.5">
              <span>Sub-Second Latency</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <FiCheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Block-Atomic Finality</h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Quotes resolve as an indivisible state change on-chain. Fills either execute 100% at the agreed clearing price or abort cleanly.
            </p>
            <div className="pt-2 text-sm font-semibold text-emerald-600 dark:text-[#00E599] flex items-center gap-1.5">
              <span>Zero Partial Fill Risk</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <FiShield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">MEV Searcher Immunization</h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Orders bypass public mempools entirely. Arbitrage bots cannot observe trades ahead of execution, eliminating predatory sandwiching.
            </p>
            <div className="pt-2 text-sm font-semibold text-emerald-600 dark:text-[#00E599] flex items-center gap-1.5">
              <span>Zero Slippage Degradation</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: FORMAL CRYPTOGRAPHIC VERIFICATION & SOLVENCY INVARIANTS */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-[#21293D]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold mb-3">
            MATHEMATICAL SOLVENCY PROOFS
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Formal Invariant Verification & Solvency Telemetry
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-neutral-400">
            Smart contract accounting is bound by mathematical invariant formulas continuously evaluated on-chain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <FiLock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Conservation Invariant</h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Every balance commitment respects the fundamental law: Total Vault Assets must strictly equal or exceed senior plus mezzanine claims.
            </p>
            <div className="pt-2 text-sm font-semibold text-emerald-600 dark:text-[#00E599] flex items-center gap-1.5">
              <span>Mathematically Proven</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <FiActivity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Continuous Health Auditing</h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Autonomous on-chain telemetry measures collateralization ratios in real time, detecting liquidity deviations before distress occurs.
            </p>
            <div className="pt-2 text-sm font-semibold text-emerald-600 dark:text-[#00E599] flex items-center gap-1.5">
              <span>12-Second Oracle Cadence</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <FiLayers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bankruptcy-Remote Enclaves</h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Credit facilities operate in isolated pools. Default in one originator or facility cannot contaminate the solvency of another.
            </p>
            <div className="pt-2 text-sm font-semibold text-emerald-600 dark:text-[#00E599] flex items-center gap-1.5">
              <span>Zero Cross-Facility Contagion</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11: PORTALDOT 3.0 ARCHITECTURE & DUAL EXECUTION COEXISTENCE */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-20 border-t border-slate-200 dark:border-[#21293D]">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold mb-3 border border-emerald-500/20">
            PORTALDOT 3.0 DUAL-EXECUTION ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            EVM & ink! Coexistence on Portaldot
          </h2>
          <p className="mt-4 text-base sm:text-xl text-slate-600 dark:text-neutral-400 leading-relaxed max-w-3xl mx-auto">
            EVM compatibility does not require replacing the underlying network architecture.
            Portaldot 3.0 introduces EVM-compatible execution through the <span className="text-slate-900 dark:text-white font-semibold">revive module</span>,
            extending smart contract execution capabilities while running in parallel with native <span className="text-slate-900 dark:text-white font-semibold">ink!</span> contracts on the same sovereign network environment.
          </p>
        </div>

        {/* 2-Column Architectural Contrast Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Card 1: Revive Module (EVM Execution) */}
          <div className="p-8 sm:p-10 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-transparent dark:bg-[#0E121B] space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20 font-mono font-bold text-lg">
                EVM
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                via Revive Module
              </span>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Solidity Contracts & Standard Web3 Tooling
            </h3>

            <p className="text-base text-slate-600 dark:text-neutral-300 leading-relaxed">
              Provides a familiar, battle-tested path for deploying and interacting with Solidity contracts. Developers interact using standard Ethereum tooling—viem, wagmi, MetaMask, Rabby, Hardhat, and Foundry—while continuing to operate seamlessly within Portaldot’s existing network environment.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-neutral-200">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Zero RPC friction with existing EVM wallets and libraries</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-neutral-200">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Deploy Kudex Solvency Vaults and Orderbooks via standard bytecode</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-neutral-200">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Sub-second execution speeds backed by Portaldot consensus</span>
              </div>
            </div>
          </div>

          {/* Card 2: Native ink! Contracts (Substrate Execution) */}
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#161C2B] text-slate-900 dark:text-white flex items-center justify-center border border-slate-200 dark:border-[#21293D] font-mono font-bold text-lg">
                ink!
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-[#161C2B] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-[#21293D]">
                Native Substrate Layer
              </span>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Wasm Execution & Portaldot Native Extrinsics
            </h3>

            <p className="text-base text-slate-600 dark:text-neutral-300 leading-relaxed">
              For existing Portaldot developers, ink! remains completely available rather than being replaced by the EVM execution path. The network expands its execution surface at the protocol level without redefining itself around a single virtual machine.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-neutral-200">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>WebAssembly execution with memory safety and deterministic proofs</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-neutral-200">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Direct interoperability with substrate pallets and extrinsics</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800 dark:text-neutral-200">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Dual runtime coexistence without fragmenting protocol security</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Ecosystem & Developer Grounding Strip */}
        <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#0E121B] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-[#21293D]">
            <div>
              <div className="text-xs font-mono uppercase text-emerald-600 dark:text-[#00E599] font-bold">
                CANONICAL PROTOCOL TELEMETRY
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                Portaldot Network Infrastructure & Explorers
              </h4>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://portalscan.portaldot.io"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] hover:bg-emerald-500/20 text-xs font-mono font-bold transition border border-emerald-500/20"
              >
                <span>PortalScan Live</span>
                <FiExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
            <a
              href="https://portalscan.portaldot.io"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl bg-white dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] hover:border-emerald-500 transition group"
            >
              <div className="text-xs font-mono text-slate-500 dark:text-neutral-400">Block Explorer</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-emerald-500 flex items-center justify-between">
                <span>PortalScan</span>
                <FiExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
              </div>
              <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1 truncate">
                portalscan.portaldot.io
              </div>
            </a>

            <a
              href="https://portaldot-dev.readthedocs.io/en/latest/index.html"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl bg-white dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] hover:border-emerald-500 transition group"
            >
              <div className="text-xs font-mono text-slate-500 dark:text-neutral-400">Developer Docs</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-emerald-500 flex items-center justify-between">
                <span>Portaldot Dev</span>
                <FiExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
              </div>
              <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1 truncate">
                ReadTheDocs Spec
              </div>
            </a>

            <a
              href="https://www.portaldot.world/protocol/modules/application-engines"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl bg-white dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] hover:border-emerald-500 transition group"
            >
              <div className="text-xs font-mono text-slate-500 dark:text-neutral-400">Protocol Spec</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-emerald-500 flex items-center justify-between">
                <span>Application Engines</span>
                <FiExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
              </div>
              <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1 truncate">
                portaldot.world/protocol
              </div>
            </a>

            <a
              href="https://www.portaldot.world/ecosystem#projects"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl bg-white dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] hover:border-emerald-500 transition group"
            >
              <div className="text-xs font-mono text-slate-500 dark:text-neutral-400">Ecosystem</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 group-hover:text-emerald-500 flex items-center justify-between">
                <span>Verified Projects</span>
                <FiExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
              </div>
              <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1 truncate">
                portaldot.world/ecosystem
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 12: BOTTOM ENTERPRISE CTA */}
      <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-24">
        <div className="rounded-3xl border border-slate-200 dark:border-[#21293D] bg-slate-100 dark:bg-gradient-to-r dark:from-[#0E121B] dark:to-[#161C2B] p-10 sm:p-16 text-center shadow-lg relative overflow-hidden">
          <div className="max-w-3xl mx-auto space-y-5">
            <h3 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Ready to Upgrade to Confidential Settlement?
            </h3>
            <p className="text-base sm:text-xl text-slate-600 dark:text-neutral-300 leading-relaxed">
              Connect your Web3 wallet to trade without MEV, deposit into protected yield tranches,
              or deploy autonomous execution policies with Kudex Agent.
            </p>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/app/overview"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-xl shadow-[#00E599]/20"
              >
                <span>Launch Kudex Application</span>
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white dark:bg-[#161C2B] hover:bg-slate-200 dark:hover:bg-[#21293D] text-slate-900 dark:text-neutral-200 border border-slate-200 dark:border-[#21293D] font-bold text-base transition shadow-sm"
              >
                <span>Read Interactive Guide</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
