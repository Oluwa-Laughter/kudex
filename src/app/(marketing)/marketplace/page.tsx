'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
} from 'react-icons/fi';
import { RiExchangeFundsLine } from 'react-icons/ri';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-sm font-mono text-slate-500 dark:text-neutral-400 mb-6">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-neutral-200 font-semibold">Marketplace Discovery</span>
      </div>

      {/* Hero Header */}
      <div className="max-w-4xl space-y-4 mb-12">
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
                        ? 'bg-blue-500/10 text-blue-600 dark:text-[#2E68FF] border border-blue-500/20'
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
