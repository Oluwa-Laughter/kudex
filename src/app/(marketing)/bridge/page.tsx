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
      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-6">
        <Link href="/" className="hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#2E68FF]">Cross-Chain Gateway</span>
      </div>

      {/* Hero Header */}
      <div className="max-w-4xl space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E121B] border border-[#21293D] text-xs font-mono text-[#2E68FF]">
          <FiRepeat className="w-3.5 h-3.5" />
          <span>CROSS-CHAIN CAPITAL GATEWAY</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-100 tracking-tight leading-tight">
          Instant Solver Bridging & Shield on Arrival
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
          Move institutional capital between major EVM networks and the Kudex Settlement Layer
          in seconds. Select &ldquo;Shield on Arrival&rdquo; to mint confidential commitment notes
          directly as the transfer completes.
        </p>
      </div>

      {/* 3 Core Bridging Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#2E68FF]/10 text-[#2E68FF] flex items-center justify-center border border-[#2E68FF]/20">
            <FiZap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-neutral-100">Zero-Delay Solver Fills</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Institutional solvers front native liquidity immediately on destination.
            Never wait for multi-hour optimistic dispute windows or slow multi-sig validation.
          </p>
          <div className="pt-2 text-xs font-mono text-[#00E599] flex items-center gap-1.5">
            <FiClock className="w-4 h-4" />
            <span>Average Finality: ~12 Seconds</span>
          </div>
        </div>

        <div className="p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#00E599]/10 text-[#00E599] flex items-center justify-center border border-[#00E599]/20">
            <FiLock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-neutral-100">Shield on Arrival</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Prevent cross-chain address association. Funds routed into Kudex are immediately converted
            into client-side encrypted notes, breaking public wallet tracking across chains.
          </p>
          <div className="pt-2 text-xs font-mono text-[#00E599] flex items-center gap-1.5">
            <FiShield className="w-4 h-4" />
            <span>Zero Cross-Chain Address Linkage</span>
          </div>
        </div>

        <div className="p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#00E599]/10 text-[#00E599] flex items-center justify-center border border-[#00E599]/20">
            <FiDollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-neutral-100">Negligible Solver Fees</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Competitive solver markets drive liquidity costs down to near zero.
            Execute large enterprise transfers with predictable basis-point fee structures.
          </p>
          <div className="pt-2 text-xs font-mono text-neutral-300 flex items-center gap-1.5">
            <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
            <span>As low as 8 bps (0.08%)</span>
          </div>
        </div>
      </div>

      {/* Interactive Gateway Simulator */}
      <div className="rounded-2xl border border-[#21293D] bg-[#0E121B] p-8 mb-16 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#21293D] gap-4">
          <div>
            <h3 className="text-xl font-bold text-neutral-100">
              Interactive Cross-Chain Route Simulator
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Select origin network and arrival configuration to calculate solver quotes
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#161C2B] border border-[#21293D] text-xs font-mono text-[#2E68FF]">
            <FiGlobe className="w-4 h-4" />
            <span>Multi-Chain Router Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Origin Network:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Ethereum', 'Base', 'Arbitrum'] as const).map((chain) => (
                  <button
                    key={chain}
                    onClick={() => setSourceChain(chain)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-medium transition border ${
                      sourceChain === chain
                        ? 'bg-[#2E68FF] text-white border-[#2E68FF] font-bold shadow-md shadow-[#2E68FF]/20'
                        : 'bg-[#161C2B] text-neutral-300 border-[#21293D] hover:border-neutral-600'
                    }`}
                  >
                    {chain}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium text-neutral-300 mb-2">
                <span>Transfer Volume (USDC):</span>
                <span className="font-mono text-[#00E599] font-bold">${amount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full accent-[#00E599] bg-[#161C2B] rounded-lg cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#161C2B] border border-[#21293D] flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-neutral-200">Shield on Arrival</div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Convert immediately into private encrypted vault note
                </div>
              </div>
              <button
                onClick={() => setShieldOnArrival(!shieldOnArrival)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                  shieldOnArrival ? 'bg-[#00E599]' : 'bg-neutral-700'
                }`}
              >
                <div
                  className={`bg-[#06080D] w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                    shieldOnArrival ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#161C2B] border border-[#21293D] flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Routing:</span>
                <span className="font-mono text-neutral-200">{sourceChain} → Kudex Settlement</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Solver Liquidity Fee:</span>
                <span className="font-mono text-neutral-200">${feeAmount} (8 bps)</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Arrival Mode:</span>
                <span className={`font-mono font-bold ${shieldOnArrival ? 'text-[#00E599]' : 'text-neutral-200'}`}>
                  {shieldOnArrival ? 'Confidential Shield Note' : 'Public Token Balance'}
                </span>
              </div>
              <div className="border-t border-[#21293D] pt-3 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-neutral-200">Total Arriving:</span>
                <span className="text-2xl font-bold font-mono text-[#00E599] tabular-nums">
                  ${Number(receiveAmount).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/app/bridge"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2E68FF] hover:bg-[#2557d6] text-white font-bold text-sm transition"
              >
                <span>Launch Bridge App</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-10 rounded-3xl border border-[#21293D] bg-gradient-to-r from-[#0E121B] to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-bold text-neutral-100">Ready to Bridge Liquidity?</h3>
          <p className="text-sm text-neutral-400 mt-1 max-w-xl">
            Bridge assets into Kudex and access confidential settlement immediately.
          </p>
        </div>
        <Link
          href="/app/bridge"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition flex-shrink-0"
        >
          <span>Open Bridge App</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
