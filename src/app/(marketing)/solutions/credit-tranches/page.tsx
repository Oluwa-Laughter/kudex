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
      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-6">
        <Link href="/" className="hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#2E68FF]">Solutions</span>
        <span>/</span>
        <span className="text-neutral-200">Credit Tranches & DaaS</span>
      </div>

      {/* Hero Header */}
      <div className="max-w-4xl space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E121B] border border-[#21293D] text-xs font-mono text-[#2E68FF]">
          <FiLayers className="w-3.5 h-3.5" />
          <span>INSTITUTIONAL DEBT SOLVENCY ENGINE</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-100 tracking-tight leading-tight">
          Structured Credit Tranches & Algorithmic Debt Restructuring
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
          Access high-grade real-world debt facilities categorized by risk tolerance.
          Protected by Default-as-a-Service (DaaS) surveillance that replaces predatory flash
          liquidations with orderly, algorithmic debt haircut cascades.
        </p>
      </div>

      {/* Tranche Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Senior Tranche */}
        <div className="p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] hover:border-[#00E599]/40 transition space-y-5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-[#00E599]/10 text-[#00E599] text-xs font-mono font-bold">
              SENIOR TRANCHE (AAA)
            </span>
            <span className="text-xs font-mono text-neutral-400">First Priority</span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold font-mono text-neutral-100 tabular-nums">
              8.50% <span className="text-sm font-sans font-normal text-neutral-400">Fixed APY</span>
            </div>
            <p className="text-xs text-neutral-400">Targeted for corporate treasuries & conservative capital</p>
          </div>
          <ul className="space-y-2.5 text-xs text-neutral-300 border-t border-[#21293D] pt-4">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
              <span>Full principal protection waterfall</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
              <span>Junior loss absorption buffer</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
              <span>Zero-loss liquidation immunization</span>
            </li>
          </ul>
        </div>

        {/* Mezzanine Tranche */}
        <div className="p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] hover:border-[#2E68FF]/40 transition space-y-5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-[#2E68FF]/10 text-[#2E68FF] text-xs font-mono font-bold">
              MEZZANINE TRANCHE (BBB)
            </span>
            <span className="text-xs font-mono text-neutral-400">Balanced Risk</span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold font-mono text-neutral-100 tabular-nums">
              14.20% <span className="text-sm font-sans font-normal text-neutral-400">Target APY</span>
            </div>
            <p className="text-xs text-neutral-400">Targeted for institutional yield allocators</p>
          </div>
          <ul className="space-y-2.5 text-xs text-neutral-300 border-t border-[#21293D] pt-4">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-[#2E68FF]" />
              <span>Secondary liquidation payout hierarchy</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-[#2E68FF]" />
              <span>Enhanced risk-adjusted yield spread</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-[#2E68FF]" />
              <span>Automated DaaS haircut cushioning</span>
            </li>
          </ul>
        </div>

        {/* Junior Tranche */}
        <div className="p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] hover:border-amber-500/40 transition space-y-5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-mono font-bold">
              JUNIOR TRANCHE (EQUITY)
            </span>
            <span className="text-xs font-mono text-neutral-400">First Loss</span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-extrabold font-mono text-neutral-100 tabular-nums">
              22.80% <span className="text-sm font-sans font-normal text-neutral-400">Max APY</span>
            </div>
            <p className="text-xs text-neutral-400">Targeted for high-upside hedge funds & alpha desks</p>
          </div>
          <ul className="space-y-2.5 text-xs text-neutral-300 border-t border-[#21293D] pt-4">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-amber-400" />
              <span>Maximized performance spread capture</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-amber-400" />
              <span>First-loss absorption capital</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-amber-400" />
              <span>Governance voting weighting</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive Tranche Allocation Simulator */}
      <div className="rounded-2xl border border-[#21293D] bg-[#0E121B] p-8 mb-16 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#21293D] gap-4">
          <div>
            <h3 className="text-xl font-bold text-neutral-100">
              Portfolio Blended Yield Calculator
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Simulate blended yield outcomes across Senior, Mezzanine, and Junior tranches
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#161C2B] border border-[#21293D] text-xs font-mono text-[#00E599]">
            <FiActivity className="w-4 h-4" />
            <span>Solvency Engine Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-medium text-neutral-300 mb-2">
                <span>Senior Tranche Allocation (Low Risk):</span>
                <span className="font-mono text-[#00E599] font-bold">{allocationSenior}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={allocationSenior}
                onChange={(e) => setAllocationSenior(Number(e.target.value))}
                className="w-full accent-[#00E599] bg-[#161C2B] rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium text-neutral-300 mb-2">
                <span>Mezzanine Tranche Allocation (Medium Risk):</span>
                <span className="font-mono text-[#2E68FF] font-bold">{allocationMezz}%</span>
              </div>
              <input
                type="range"
                min="0"
                max={100 - allocationSenior}
                step="5"
                value={allocationMezz}
                onChange={(e) => setAllocationMezz(Number(e.target.value))}
                className="w-full accent-[#2E68FF] bg-[#161C2B] rounded-lg cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#161C2B] border border-[#21293D] text-xs text-neutral-400 flex justify-between">
              <span>Junior Tranche Allocation (High Risk):</span>
              <span className="font-mono text-amber-400 font-bold">{allocationJunior}%</span>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#161C2B] border border-[#21293D] flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs text-neutral-400 block mb-1">Blended Annualized Portfolio APY</span>
              <div className="text-4xl font-extrabold font-mono text-[#00E599] tabular-nums">
                {blendedYield}%
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                Weighted by smart contract risk tranches. Automatically safeguarded by DaaS protocol surveillance.
              </p>
            </div>

            <div className="pt-4 border-t border-[#21293D]">
              <Link
                href="/app/vaults"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2E68FF] hover:bg-[#2557d6] text-white font-bold text-sm transition"
              >
                <span>Deposit into Credit Vaults</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How DaaS Protects Against Flash Liquidations */}
      <div className="p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] mb-16 space-y-6">
        <h3 className="text-2xl font-bold text-neutral-100">
          How Default-as-a-Service (DaaS) Safeguards Capital
        </h3>
        <p className="text-sm text-neutral-400 max-w-3xl leading-relaxed">
          Traditional decentralized credit protocols suffer from predatory MEV bots that trigger catastrophic flash liquidations
          at the first sign of price dislocation, destroying borrower collateral and wiping out pool reserves. Kudex DaaS
          replaces this with algorithmic debt restructuring:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-5 rounded-xl bg-[#161C2B] border border-[#21293D] space-y-2">
            <div className="text-sm font-semibold text-neutral-200">1. On-Chain Risk Indexing</div>
            <p className="text-xs text-neutral-400">
              The protocol continuously tracks collateral health factors in basis points, detecting distress before insolvency occurs.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#161C2B] border border-[#21293D] space-y-2">
            <div className="text-sm font-semibold text-neutral-200">2. Algorithmic Haircuts</div>
            <p className="text-xs text-neutral-400">
              Junior tranches absorb initial shortfalls smoothly, allowing borrowers time to cure obligations without sudden death liquidations.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#161C2B] border border-[#21293D] space-y-2">
            <div className="text-sm font-semibold text-neutral-200">3. Solvency Recovery Reserves</div>
            <p className="text-xs text-neutral-400">
              Protocol reserves backstop senior depositors, ensuring principal stability remains inviolable across market cycles.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-10 rounded-3xl border border-[#21293D] bg-gradient-to-r from-[#0E121B] to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-bold text-neutral-100">Deploy Capital into Structured Credit</h3>
          <p className="text-sm text-neutral-400 mt-1 max-w-xl">
            Choose your risk profile and earn verified real-world asset yields on Kudex.
          </p>
        </div>
        <Link
          href="/app/vaults"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition flex-shrink-0"
        >
          <span>View Active Vaults</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
