'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiRepeat,
  FiShield,
  FiZap,
  FiCheckCircle,
  FiGlobe,
  FiDollarSign,
  FiLock,
  FiClock,
} from 'react-icons/fi';
import { RiExchangeFundsLine } from 'react-icons/ri';

export default function PublicBridgePage() {
  const [sourceChain, setSourceChain] = useState<'Ethereum' | 'Base' | 'Arbitrum'>('Base');
  const [shieldOnArrival, setShieldOnArrival] = useState(true);
  const [amount, setAmount] = useState(5000);

  const solverFeeBps = 8; // 0.08%
  const feeAmount = (amount * 0.0008).toFixed(2);
  const receiveAmount = (amount - Number(feeAmount)).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-sm font-mono text-slate-500 dark:text-neutral-400 mb-6">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#2E68FF] font-semibold">Cross-Chain Gateway</span>
      </div>

      {/* Hero Header */}
      <div className="max-w-4xl space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-sm font-semibold text-[#2E68FF]">
          <FiRepeat className="w-4 h-4" />
          <span>CROSS-CHAIN CAPITAL GATEWAY</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Instant Solver Bridging & Shield on Arrival
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
          Move institutional capital between major EVM networks and the Kudex Settlement Layer
          in seconds. Select &ldquo;Shield on Arrival&rdquo; to mint confidential commitment notes
          directly as the transfer completes.
        </p>
      </div>

      {/* 3 Core Bridging Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#2E68FF]/10 text-[#2E68FF] flex items-center justify-center border border-[#2E68FF]/20">
            <FiZap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Zero-Delay Solver Fills</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Institutional solvers front native liquidity immediately on destination.
            Never wait for multi-hour optimistic dispute windows or slow multi-sig validation.
          </p>
          <div className="pt-3 text-sm font-mono text-emerald-600 dark:text-[#00E599] flex items-center gap-2 font-semibold">
            <FiClock className="w-4 h-4" />
            <span>Average Finality: ~12 Seconds</span>
          </div>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20">
            <FiLock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Shield on Arrival</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Prevent cross-chain address association. Funds routed into Kudex are immediately converted
            into client-side encrypted notes, breaking public wallet tracking across chains.
          </p>
          <div className="pt-3 text-sm font-mono text-emerald-600 dark:text-[#00E599] flex items-center gap-2 font-semibold">
            <FiShield className="w-4 h-4" />
            <span>Zero Cross-Chain Address Linkage</span>
          </div>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Negligible Solver Fees</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Competitive solver markets drive liquidity costs down to near zero.
            Execute large enterprise transfers with predictable basis-point fee structures.
          </p>
          <div className="pt-3 text-sm font-mono text-slate-700 dark:text-neutral-300 flex items-center gap-2 font-semibold">
            <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
            <span>As low as 8 bps (0.08%)</span>
          </div>
        </div>
      </div>

      {/* Interactive Gateway Simulator */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 mb-16 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-[#21293D] gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Interactive Cross-Chain Route Simulator
            </h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 mt-1.5">
              Select origin network and arrival configuration to calculate solver quotes
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-sm font-mono text-[#2E68FF]">
            <FiGlobe className="w-4 h-4" />
            <span>Multi-Chain Router Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
          <div className="space-y-6">
            <div>
              <label className="block text-base font-semibold text-slate-800 dark:text-neutral-200 mb-3">
                Origin Network:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['Ethereum', 'Base', 'Arbitrum'] as const).map((chain) => (
                  <button
                    key={chain}
                    onClick={() => setSourceChain(chain)}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold transition border ${
                      sourceChain === chain
                        ? 'bg-[#2E68FF] text-white border-[#2E68FF] font-bold shadow-md shadow-[#2E68FF]/20'
                        : 'bg-slate-100 dark:bg-[#161C2B] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#21293D] hover:bg-slate-200 dark:hover:bg-[#21293D]'
                    }`}
                  >
                    {chain}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-base font-semibold text-slate-800 dark:text-neutral-200 mb-3">
                <span>Transfer Volume (USDC):</span>
                <span className="font-mono text-emerald-600 dark:text-[#00E599] font-bold">${amount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-[#00E599] bg-slate-200 dark:bg-[#161C2B] rounded-lg cursor-pointer h-2.5"
              />
            </div>

            <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-white">Shield on Arrival</div>
                <div className="text-sm text-slate-600 dark:text-neutral-400 mt-1">
                  Convert immediately into private encrypted vault note
                </div>
              </div>
              <button
                onClick={() => setShieldOnArrival(!shieldOnArrival)}
                className={`w-14 h-7 flex items-center rounded-full p-1 transition duration-300 ${
                  shieldOnArrival ? 'bg-[#00E599]' : 'bg-slate-300 dark:bg-neutral-700'
                }`}
              >
                <div
                  className={`bg-white dark:bg-[#06080D] w-5 h-5 rounded-full shadow-md transform transition duration-300 ${
                    shieldOnArrival ? 'translate-x-7' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-slate-600 dark:text-neutral-400">
                <span>Routing:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{sourceChain} → Kudex Settlement</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-neutral-400">
                <span>Solver Liquidity Fee:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">${feeAmount} (8 bps)</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600 dark:text-neutral-400">
                <span>Arrival Mode:</span>
                <span className={`font-mono font-bold ${shieldOnArrival ? 'text-emerald-600 dark:text-[#00E599]' : 'text-slate-900 dark:text-white'}`}>
                  {shieldOnArrival ? 'Confidential Shield Note' : 'Public Token Balance'}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-[#21293D] pt-4 flex justify-between items-baseline">
                <span className="text-base font-bold text-slate-900 dark:text-white">Total Arriving:</span>
                <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-[#00E599] tabular-nums">
                  ${Number(receiveAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-3">
              <Link
                href="/app/bridge"
                className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl bg-[#2E68FF] hover:bg-[#2557d6] text-white font-bold text-base transition shadow-md shadow-[#2E68FF]/20"
              >
                <span>Launch Bridge App</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-10 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-slate-100 dark:bg-gradient-to-r dark:from-[#0E121B] dark:to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Ready to Bridge Liquidity?</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 max-w-xl leading-relaxed">
            Bridge assets into Kudex and access confidential settlement immediately.
          </p>
        </div>
        <Link
          href="/app/bridge"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/15 flex-shrink-0"
        >
          <span>Open Bridge App</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
