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
      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-6">
        <Link href="/" className="hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-neutral-200">Marketplace Discovery</span>
      </div>

      {/* Hero Header */}
      <div className="max-w-4xl space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E121B] border border-[#21293D] text-xs font-mono text-[#00E599]">
          <RiExchangeFundsLine className="w-3.5 h-3.5" />
          <span>TRANCHE & LIQUIDITY DISCOVERY</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-100 tracking-tight leading-tight">
          Institutional Credit Facilities & RFQ Discovery
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
          Explore tokenized real-world credit tranches, verified overcollateralization ratios,
          and institutional RFQ spreads settled on our confidential settlement layer.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search facility name, tranche type, or duration..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#21293D] bg-[#0E121B] text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#00E599]/40"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {(['ALL', 'AAA', 'BBB', 'EQUITY'] as const).map((grade) => (
            <button
              key={grade}
              onClick={() => setFilterGrade(grade)}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono font-medium transition whitespace-nowrap border ${
                filterGrade === grade
                  ? 'bg-[#00E599] text-[#06080D] border-[#00E599] font-bold shadow-md shadow-[#00E599]/15'
                  : 'bg-[#0E121B] text-neutral-300 border-[#21293D] hover:border-neutral-600'
              }`}
            >
              {grade === 'ALL' ? 'All Tranches' : `Grade ${grade}`}
            </button>
          ))}
        </div>
      </div>

      {/* Tranches Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {filteredTranches.map((t) => (
          <div
            key={t.id}
            className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] hover:border-[#00E599]/40 hover:bg-[#161C2B]/50 transition flex flex-col justify-between space-y-6 shadow-sm group"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#21293D]">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      t.grade === 'AAA'
                        ? 'bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/20'
                        : t.grade === 'BBB'
                        ? 'bg-[#2E68FF]/10 text-[#2E68FF] border border-[#2E68FF]/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    Grade {t.grade}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">{t.trancheType}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#00E599] font-mono">
                  <FiShield className="w-3.5 h-3.5" />
                  <span>Confidential Pool</span>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-lg font-bold text-neutral-100 group-hover:text-[#00E599] transition">
                  {t.name}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div>
                  <span className="text-xs text-neutral-400 block">Annual Yield</span>
                  <span className="text-xl font-bold font-mono text-[#00E599] tabular-nums">
                    {t.apy}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 block">Facility TVL</span>
                  <span className="text-base font-bold font-mono text-neutral-100 tabular-nums">
                    {t.tvl}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-neutral-400 block">Duration</span>
                  <span className="text-base font-bold font-mono text-neutral-200">
                    {t.duration}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#21293D] flex items-center justify-between">
              <div className="text-xs font-mono text-neutral-400">
                Solvency Factor: <span className="text-neutral-200 font-semibold">{t.health}</span>
              </div>
              <Link
                href="/app/marketplace"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#161C2B] hover:bg-[#21293D] text-xs font-semibold text-neutral-200 border border-[#21293D] hover:border-[#00E599]/40 transition"
              >
                <span>Deposit / Trade</span>
                <FiArrowRight className="w-3.5 h-3.5 text-[#00E599]" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Institutional RFQ Pairs Overview */}
      <div className="p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] mb-16">
        <h3 className="text-xl font-bold text-neutral-100 mb-2">
          Live RFQ Pair Execution Rates
        </h3>
        <p className="text-xs text-neutral-400 mb-6">
          Institutional solvers provide continuous, block-atomic execution without public mempool slippage
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="border-b border-[#21293D] text-xs text-neutral-400">
                <th className="pb-3 font-medium">PAIR</th>
                <th className="pb-3 font-medium">SPREAD</th>
                <th className="pb-3 font-medium">24H VOLUME</th>
                <th className="pb-3 font-medium">AVG FILL TIME</th>
                <th className="pb-3 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#21293D] text-neutral-300">
              <tr>
                <td className="py-4 font-bold text-neutral-100">pUSD / wPOT</td>
                <td className="py-4 text-[#00E599] tabular-nums">0.04%</td>
                <td className="py-4 tabular-nums">$940,250</td>
                <td className="py-4 text-neutral-400">180ms (Atomic)</td>
                <td className="py-4 text-right">
                  <Link
                    href="/app/marketplace"
                    className="inline-flex items-center gap-1 text-xs text-[#00E599] hover:underline"
                  >
                    <span>Request Quote</span>
                    <FiArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-neutral-100">pUSD / ETH</td>
                <td className="py-4 text-[#00E599] tabular-nums">0.05%</td>
                <td className="py-4 tabular-nums">$620,000</td>
                <td className="py-4 text-neutral-400">220ms (Solver)</td>
                <td className="py-4 text-right">
                  <Link
                    href="/app/marketplace"
                    className="inline-flex items-center gap-1 text-xs text-[#00E599] hover:underline"
                  >
                    <span>Request Quote</span>
                    <FiArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
              <tr>
                <td className="py-4 font-bold text-neutral-100">pUSD / USDC</td>
                <td className="py-4 text-[#00E599] tabular-nums">0.01%</td>
                <td className="py-4 tabular-nums">$1,280,000</td>
                <td className="py-4 text-neutral-400">150ms (Atomic)</td>
                <td className="py-4 text-right">
                  <Link
                    href="/app/marketplace"
                    className="inline-flex items-center gap-1 text-xs text-[#00E599] hover:underline"
                  >
                    <span>Request Quote</span>
                    <FiArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-10 rounded-3xl border border-[#21293D] bg-gradient-to-r from-[#0E121B] to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-bold text-neutral-100">Access Full Institutional Orderbook</h3>
          <p className="text-sm text-neutral-400 mt-1 max-w-xl">
            Place limit RFQ orders, negotiate with solvers, and participate in shielded tranches.
          </p>
        </div>
        <Link
          href="/app/marketplace"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition flex-shrink-0"
        >
          <span>Open Marketplace App</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
