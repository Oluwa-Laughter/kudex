'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FiLayers,
  FiShield,
  FiTrendingUp,
  FiArrowRight,
  FiCheckCircle,
  FiAlertTriangle,
  FiActivity,
  FiPieChart,
} from 'react-icons/fi';
import { RiExchangeFundsLine } from 'react-icons/ri';

export default function CreditTranchesPage() {
  const [allocationSenior, setAllocationSenior] = useState(60);
  const [allocationMezz, setAllocationMezz] = useState(30);
  const allocationJunior = Math.max(0, 100 - allocationSenior - allocationMezz);

  const seniorApy = 8.5;
  const mezzApy = 14.2;
  const juniorApy = 22.8;

  const blendedYield = (
    (allocationSenior * seniorApy +
      allocationMezz * mezzApy +
      allocationJunior * juniorApy) /
    100
  ).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-sm font-mono text-slate-500 dark:text-neutral-400 mb-6">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#2E68FF] font-semibold">Solutions</span>
        <span>/</span>
        <span className="text-slate-900 dark:text-neutral-200 font-semibold">Credit Tranches & Solvency</span>
      </div>

      {/* Hero Header */}
      <div className="max-w-4xl space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-sm font-semibold text-[#2E68FF]">
          <FiLayers className="w-4 h-4" />
          <span>INSTITUTIONAL DEBT SOLVENCY ENGINE</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Structured Credit Tranches & Algorithmic Debt Restructuring
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
          Access high-grade real-world debt facilities categorized by risk tolerance.
          Protected by automated solvency surveillance that replaces predatory flash
          liquidations with orderly, algorithmic debt haircut cascades.
        </p>
      </div>

      {/* Tranche Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Senior Tranche */}
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#00E599]/40 transition space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold border border-emerald-500/20">
              SENIOR TRANCHE (AAA)
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">First Priority</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
              8.50% <span className="text-base font-sans font-normal text-slate-500 dark:text-neutral-400">Fixed APY</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-neutral-400">Targeted for corporate treasuries & conservative capital</p>
          </div>
          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300 border-t border-slate-200 dark:border-[#21293D] pt-4">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Full principal protection waterfall</span>
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
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#2E68FF]/40 transition space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-[#2E68FF] text-xs font-mono font-bold border border-blue-500/20">
              MEZZANINE TRANCHE (BBB)
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">Balanced Risk</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
              14.20% <span className="text-base font-sans font-normal text-slate-500 dark:text-neutral-400">Target APY</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-neutral-400">Targeted for institutional yield allocators</p>
          </div>
          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300 border-t border-slate-200 dark:border-[#21293D] pt-4">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-blue-600 dark:text-[#2E68FF]" />
              <span>Secondary liquidation payout hierarchy</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-blue-600 dark:text-[#2E68FF]" />
              <span>Enhanced risk-adjusted yield spread</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-blue-600 dark:text-[#2E68FF]" />
              <span>Automated debt haircut cushioning</span>
            </li>
          </ul>
        </div>

        {/* Junior Tranche */}
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-amber-500/40 transition space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold border border-amber-500/20">
              JUNIOR TRANCHE (EQUITY)
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">First Loss</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
              22.80% <span className="text-base font-sans font-normal text-slate-500 dark:text-neutral-400">Max APY</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-neutral-400">Targeted for high-upside hedge funds & alpha desks</p>
          </div>
          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300 border-t border-slate-200 dark:border-[#21293D] pt-4">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Maximized performance spread capture</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>First-loss absorption capital</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Governance voting weighting</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive Tranche Allocation Simulator */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 mb-16 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-[#21293D] gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Portfolio Blended Yield Calculator
            </h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 mt-1.5">
              Simulate blended yield outcomes across Senior, Mezzanine, and Junior tranches
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-sm font-mono text-emerald-600 dark:text-[#00E599] font-semibold">
            <FiActivity className="w-4 h-4" />
            <span>Solvency Engine Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-base font-semibold text-slate-800 dark:text-neutral-200 mb-3">
                <span>Senior Tranche Allocation (Low Risk):</span>
                <span className="font-mono text-emerald-600 dark:text-[#00E599] font-bold">{allocationSenior}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={allocationSenior}
                onChange={(e) => setAllocationSenior(Number(e.target.value))}
                className="w-full accent-[#00E599] bg-slate-200 dark:bg-[#161C2B] rounded-lg cursor-pointer h-2.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-base font-semibold text-slate-800 dark:text-neutral-200 mb-3">
                <span>Mezzanine Tranche Allocation (Medium Risk):</span>
                <span className="font-mono text-blue-600 dark:text-[#2E68FF] font-bold">{allocationMezz}%</span>
              </div>
              <input
                type="range"
                min="0"
                max={100 - allocationSenior}
                step="5"
                value={allocationMezz}
                onChange={(e) => setAllocationMezz(Number(e.target.value))}
                className="w-full accent-[#2E68FF] bg-slate-200 dark:bg-[#161C2B] rounded-lg cursor-pointer h-2.5"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-sm text-slate-600 dark:text-neutral-400 flex justify-between items-center">
              <span>Junior Tranche Allocation (High Risk):</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-base">{allocationJunior}%</span>
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] flex flex-col justify-between space-y-5">
            <div>
              <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block mb-1 font-semibold">Blended Annualized Portfolio APY</span>
              <div className="text-5xl font-extrabold font-mono text-emerald-600 dark:text-[#00E599] tabular-nums">
                {blendedYield}%
              </div>
              <p className="text-sm text-slate-600 dark:text-neutral-400 mt-3 leading-relaxed">
                Weighted by smart contract risk tranches. Automatically safeguarded by protocol solvency surveillance.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-[#21293D]">
              <Link
                href="/app/vaults"
                className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl bg-[#2E68FF] hover:bg-[#2557d6] text-white font-bold text-base transition shadow-md shadow-[#2E68FF]/20"
              >
                <span>Deposit into Credit Vaults</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How Risk Restructuring Protects Against Flash Liquidations */}
      <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] mb-16 space-y-6 shadow-sm">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          How Algorithmic Restructuring Safeguards Capital
        </h3>
        <p className="text-base text-slate-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          Traditional decentralized credit protocols suffer from predatory MEV bots that trigger catastrophic flash liquidations
          at the first sign of price dislocation, destroying borrower collateral and wiping out pool reserves. Kudex
          replaces this with algorithmic debt restructuring:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-base font-bold text-slate-900 dark:text-white">1. On-Chain Risk Indexing</div>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              The protocol continuously tracks collateral health factors in basis points, detecting distress before insolvency occurs.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-base font-bold text-slate-900 dark:text-white">2. Algorithmic Haircuts</div>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Junior tranches absorb initial shortfalls smoothly, allowing borrowers time to cure obligations without sudden death liquidations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-base font-bold text-slate-900 dark:text-white">3. Solvency Recovery Reserves</div>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Protocol reserves backstop senior depositors, ensuring principal stability remains inviolable across market cycles.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-10 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-slate-100 dark:bg-gradient-to-r dark:from-[#0E121B] dark:to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Deploy Capital into Structured Credit</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 max-w-xl leading-relaxed">
            Choose your risk profile and earn verified real-world asset yields on Kudex.
          </p>
        </div>
        <Link
          href="/app/vaults"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/15 flex-shrink-0"
        >
          <span>View Active Vaults</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
