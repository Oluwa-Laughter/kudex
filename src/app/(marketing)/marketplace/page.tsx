'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  FiSearch,
  FiFilter,
  FiArrowRight,
  FiShield,
  FiTrendingUp,
  FiClock,
  FiLayers,
  FiCheckCircle,
  FiExternalLink,
  FiZap,
  FiLock,
  FiDollarSign,
} from 'react-icons/fi';
import { RiExchangeFundsLine, RiShieldCheckLine } from 'react-icons/ri';

export default function PublicMarketplacePage() {
  const [filterGrade, setFilterGrade] = useState<'ALL' | 'AAA' | 'BBB' | 'EQUITY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const tranches = [
    {
      id: 'tranche-1',
      name: 'Global Supply Chain Invoice Pool',
      asset: 'pUSD',
      grade: 'AAA',
      trancheType: 'Senior Debt',
      apy: '8.50%',
      tvl: '$6,200,000',
      duration: '90 Days',
      riskScore: '1,200 bps',
      health: '1.45x',
      shielded: true,
    },
    {
      id: 'tranche-2',
      name: 'Trade Receivables & Logistics Facility',
      asset: 'pUSD',
      grade: 'BBB',
      trancheType: 'Mezzanine',
      apy: '14.20%',
      tvl: '$4,800,000',
      duration: '180 Days',
      riskScore: '2,400 bps',
      health: '1.30x',
      shielded: true,
    },
    {
      id: 'tranche-3',
      name: 'Hardware & Compute Infrastructure Credit',
      asset: 'pUSD',
      grade: 'EQUITY',
      trancheType: 'Junior First-Loss',
      apy: '22.80%',
      tvl: '$3,250,000',
      duration: '360 Days',
      riskScore: '4,100 bps',
      health: '1.18x',
      shielded: true,
    },
    {
      id: 'tranche-4',
      name: 'Cross-Border SaaS Cash Flow Facility',
      asset: 'pUSD',
      grade: 'AAA',
      trancheType: 'Senior Debt',
      apy: '9.10%',
      tvl: '$5,100,000',
      duration: '120 Days',
      riskScore: '1,450 bps',
      health: '1.40x',
      shielded: true,
    },
  ];

  const filteredTranches = tranches.filter((t) => {
    const matchesGrade = filterGrade === 'ALL' || t.grade === filterGrade;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.trancheType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (containerRef.current) {
        gsap.from(containerRef.current.querySelectorAll('.market-anim'), {
          opacity: 0,
          y: 24,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-16">
      {/* Breadcrumb Header */}
      <div className="market-anim flex items-center gap-2 text-sm font-mono text-slate-500 dark:text-neutral-400 mb-6">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-neutral-200 font-semibold">Marketplace Discovery</span>
      </div>

      {/* Hero Header */}
      <div className="market-anim max-w-4xl space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-sm font-semibold text-[#00E599]">
          <RiExchangeFundsLine className="w-4 h-4" />
          <span>TRANCHE & LIQUIDITY DISCOVERY</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Institutional Credit Facilities & RFQ Discovery
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
          Explore tokenized real-world credit tranches, verified overcollateralization ratios,
          and institutional RFQ spreads settled on our confidential settlement layer.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-neutral-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility name, tranche type, or duration..."
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#00E599]/40"
          />
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 sm:pb-0">
          {(['ALL', 'AAA', 'BBB', 'EQUITY'] as const).map((grade) => (
            <button
              key={grade}
              onClick={() => setFilterGrade(grade)}
              className={`px-5 py-3 rounded-xl text-sm font-semibold transition whitespace-nowrap border ${
                filterGrade === grade
                  ? 'bg-[#00E599] text-[#06080D] border-[#00E599] font-bold shadow-md shadow-[#00E599]/15'
                  : 'bg-white dark:bg-[#0E121B] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#21293D] hover:bg-slate-100 dark:hover:bg-[#161C2B]'
              }`}
            >
              {grade === 'ALL' ? 'All Tranches' : `Grade ${grade}`}
            </button>
          ))}
        </div>
      </div>

      {/* Tranches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {filteredTranches.map((t) => (
          <div
            key={t.id}
            className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#00E599]/40 hover:bg-slate-50/50 dark:hover:bg-[#161C2B]/50 transition flex flex-col justify-between space-y-6 shadow-sm group"
          >
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-[#21293D]">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-3 py-1 rounded-md text-xs font-mono font-bold ${
                      t.grade === 'AAA'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20'
                        : t.grade === 'BBB'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    Grade {t.grade}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-neutral-400 font-mono">{t.trancheType}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-[#00E599] font-semibold">
                  <FiShield className="w-4 h-4" />
                  <span>Confidential Pool</span>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#00E599] transition">
                  {t.name}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-5">
                <div>
                  <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">Annual Yield</span>
                  <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-[#00E599] tabular-nums mt-1 block">
                    {t.apy}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">Facility TVL</span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-1 block">
                    {t.tvl}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">Duration</span>
                  <span className="text-lg font-bold font-mono text-slate-700 dark:text-neutral-200 mt-1 block">
                    {t.duration}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-[#21293D] flex items-center justify-between">
              <div className="text-sm font-mono text-slate-500 dark:text-neutral-400">
                Solvency Factor: <span className="text-slate-900 dark:text-neutral-200 font-bold">{t.health}</span>
              </div>
              <Link
                href="/app/marketplace"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-[#161C2B] hover:bg-slate-200 dark:hover:bg-[#21293D] text-sm font-bold text-slate-900 dark:text-neutral-200 border border-slate-200 dark:border-[#21293D] hover:border-[#00E599]/40 transition"
              >
                <span>Deposit / Trade</span>
                <FiArrowRight className="w-4 h-4 text-[#00E599]" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Institutional RFQ Pairs Overview */}
      <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] mb-16 shadow-sm">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Live RFQ Pair Execution Rates
        </h3>
        <p className="text-base text-slate-600 dark:text-neutral-400 mb-6">
          Institutional solvers provide continuous, block-atomic execution without public mempool slippage
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-base">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#21293D] text-sm text-slate-500 dark:text-neutral-400">
                <th className="pb-3.5 font-semibold">PAIR</th>
                <th className="pb-3.5 font-semibold">SPREAD</th>
                <th className="pb-3.5 font-semibold">24H VOLUME</th>
                <th className="pb-3.5 font-semibold">AVG FILL TIME</th>
                <th className="pb-3.5 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#21293D] text-slate-800 dark:text-neutral-300">
              <tr>
                <td className="py-4 font-bold text-slate-900 dark:text-white">pUSD / wPOT</td>
                <td className="py-4 text-emerald-600 dark:text-[#00E599] font-bold tabular-nums">0.04%</td>
                <td className="py-4 tabular-nums font-semibold">$940,250</td>
                <td className="py-4 text-slate-500 dark:text-neutral-400">180ms (Atomic)</td>
                <td className="py-4 text-right">
                  <Link
                    href="/app/marketplace"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-[#00E599] hover:underline"
                  >
                    <span>Request Quote</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-slate-900 dark:text-white">pUSD / ETH</td>
                <td className="py-4 text-emerald-600 dark:text-[#00E599] font-bold tabular-nums">0.05%</td>
                <td className="py-4 tabular-nums font-semibold">$620,000</td>
                <td className="py-4 text-slate-500 dark:text-neutral-400">220ms (Solver)</td>
                <td className="py-4 text-right">
                  <Link
                    href="/app/marketplace"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-[#00E599] hover:underline"
                  >
                    <span>Request Quote</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-slate-900 dark:text-white">pUSD / USDC</td>
                <td className="py-4 text-emerald-600 dark:text-[#00E599] font-bold tabular-nums">0.01%</td>
                <td className="py-4 tabular-nums font-semibold">$1,280,000</td>
                <td className="py-4 text-slate-500 dark:text-neutral-400">150ms (Atomic)</td>
                <td className="py-4 text-right">
                  <Link
                    href="/app/marketplace"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-[#00E599] hover:underline"
                  >
                    <span>Request Quote</span>
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Waterfall Capital Structure Section */}
      <div className="market-anim mb-16">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#161C2B] text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <FiLayers className="w-3.5 h-3.5" />
            <span>TRANCHE CAPITAL WATERFALL</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Algorithmic Protection Across Three Tranche Tiers
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2">
            Capital flows through a strict liquidation waterfall. Senior principal is shielded by subordinated tranches, ensuring stable institutions and aggressive yield seekers are accurately incentivized.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-2xl border border-emerald-500/30 bg-white dark:bg-[#0E121B] space-y-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                Grade AAA
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">First-Priority Claim</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Senior Protected Tranche</h3>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Legal and cryptographic claim priority on all underlying real-world assets. Protected from the first 25% of any facility loss.
            </p>
            <div className="pt-3 border-t border-slate-200 dark:border-[#21293D] flex justify-between items-baseline">
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400 uppercase">Target APY</span>
              <span className="text-xl font-mono font-bold text-emerald-600 dark:text-[#00E599]">8.00% – 9.50%</span>
            </div>
          </div>

          <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] hover:border-[#00E599]/40 bg-white dark:bg-[#0E121B] space-y-4 shadow-sm relative overflow-hidden transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#00E599]/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] border border-[#00E599]/20">
                Grade BBB
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">Subordinated Buffer</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Mezzanine Growth Tranche</h3>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Provides an intermediate cushion between junior first-loss and senior lenders. Balances high recurring interest with subordinate risk.
            </p>
            <div className="pt-3 border-t border-slate-200 dark:border-[#21293D] flex justify-between items-baseline">
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400 uppercase">Target APY</span>
              <span className="text-xl font-mono font-bold text-slate-900 dark:text-white">13.50% – 16.00%</span>
            </div>
          </div>

          <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] hover:border-[#00E599]/40 bg-white dark:bg-[#0E121B] space-y-4 shadow-sm relative overflow-hidden transition">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#00E599]/5 rounded-full blur-2xl" />
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] border border-[#00E599]/20">
                Grade EQUITY
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">First-Loss Absorption</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Junior First-Loss Tranche</h3>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Captures maximum facility yield and residual protocol profits in exchange for absorbing any initial default volatility.
            </p>
            <div className="pt-3 border-t border-slate-200 dark:border-[#21293D] flex justify-between items-baseline">
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400 uppercase">Target APY</span>
              <span className="text-xl font-mono font-bold text-emerald-600 dark:text-[#00E599]">20.00% – 25.00%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confidential RFQ Protocol Section */}
      <div className="market-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 sm:p-10 mb-16 shadow-sm">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E599]/10 text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <FiZap className="w-3.5 h-3.5" />
            <span>OFF-CHAIN RFQ SOLVER ENGINE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Why RFQ Outperforms Automated Market Makers
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            Standard AMMs force traders to broadcast intents into public mempools where front-running bots steal basis points. Kudex uses private cryptographic RFQs matched atomically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-semibold">01 / ENCRYPTED INTENT</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">Zero Pre-Trade Leakage</div>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Order size and price limit stay completely private from public mempool sniffers.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-semibold">02 / SOLVER AUCTION</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">Competitive Tight Quotes</div>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Solvers bid aggressively to fill trades, offering spreads as low as 1 to 4 basis points.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-semibold">03 / ATOMIC SETTLEMENT</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">Guaranteed Execution</div>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Trade executes in a single block with 100% price guarantee or reverts with zero penalty.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-semibold">04 / SHIELDED RECEIPT</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">Confidential Balances</div>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Settled tokens are held in private notes, preventing wallet address tracking.
            </p>
          </div>
        </div>
      </div>

      {/* NEW SECTION 1: SECONDARY MARKET LIQUIDITY & INSTANT EXIT */}
      <div className="market-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 sm:p-10 mb-16 shadow-sm">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E599]/10 text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <RiExchangeFundsLine className="w-3.5 h-3.5" />
            <span>SECONDARY TRANCHE LIQUIDITY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Instant Secondary Exit Routes & Orderbook Depth
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            Institutional allocators do not need to lock capital until facility maturity. Kudex supports liquid secondary trading: swap yield notes (kUSDp) on the private RFQ orderbook or redeem instantly via continuous buffer pools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold">
              01
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Private Limit Orderbooks</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Place limit or market orders for tokenized credit notes with zero mempool footprint. Other institutions fill size atomically.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold">
              02
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Reserve Buffer Redemptions</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Each facility maintains an audited 10-15% liquid buffer, enabling immediate redemptions back to base stablecoins.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold">
              03
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Zero Lockup Penalties</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Accrued interest is calculated continuous per block. Exit anytime and retain 100% of earned yield.
            </p>
          </div>
        </div>
      </div>

      {/* NEW SECTION 2: UNDERWRITING STANDARDS & ORIGINATOR REGISTRY */}
      <div className="market-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 sm:p-10 mb-16 shadow-sm">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E599]/10 text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <RiShieldCheckLine className="w-3.5 h-3.5" />
            <span>ORIGINATOR VERIFICATION STANDARD</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Audited Originators & Bankruptcy-Remote Legal Security
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            Every credit facility listed on Kudex is vetted against institutional credit standards. Real-world assets are held in ring-fenced legal structures with daily oracle validation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">LEGAL ENFORCEABILITY</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">Bankruptcy-Remote SPVs</div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">Isolated from originator corporate liabilities.</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">OVERCOLLATERALIZATION</div>
            <div className="text-base font-bold text-emerald-600 dark:text-[#00E599]">125% – 150% Baseline</div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">Buffer cushion protecting Senior principal.</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">VALUATION ORACLES</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">Continuous Verification</div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">Independent third-party asset audits verified on-chain.</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">SOLVENCY CEILING</div>
            <div className="text-base font-bold text-emerald-600 dark:text-[#00E599]">Automated Haircuts</div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">Zero flash liquidations; junior equity absorbs shocks first.</p>
          </div>
        </div>
      </div>


      {/* CTA Box */}
      <div className="p-10 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-slate-100 dark:bg-gradient-to-r dark:from-[#0E121B] dark:to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Access Full Institutional Orderbook</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 max-w-xl leading-relaxed">
            Place limit RFQ orders, negotiate with solvers, and participate in shielded tranches.
          </p>
        </div>
        <Link
          href="/app/marketplace"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/15 flex-shrink-0"
        >
          <span>Open Marketplace App</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
