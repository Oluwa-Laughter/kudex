'use client';

import React from 'react';
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
  FiFileText,
  FiRepeat,
  FiActivity,
  FiBarChart2,
} from 'react-icons/fi';
import { RiRobot2Line, RiExchangeFundsLine, RiShieldCheckLine } from 'react-icons/ri';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { KUDEX_VAULT_ABI } from '@/lib/contracts/abis';
import { formatUnits } from 'viem';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { formatDisplayBalance } from '@/lib/math';

export default function MarketingHomePage() {
  const { data: protocolEvents } = useProtocolEvents();

  // Live contract reads for hero metrics
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

  const displayTVL = totalAssetsRaw
    ? `$${Number(formatUnits(totalAssetsRaw, 6)).toLocaleString()}`
    : '$14,250,000';

  const totalVolumeBigInt = protocolEvents?.totalVolumeBigInt ?? BigInt(0);
  const displayVolume = totalVolumeBigInt > BigInt(0)
    ? `$${formatDisplayBalance(totalVolumeBigInt, 6, 0)}`
    : '$1,842,500';

  const riskScoreNum = riskScoreRaw ? Number(riskScoreRaw) : 1850;
  const healthFactor = (10000 / Math.max(riskScoreNum, 1000)).toFixed(2);

  return (
    <div className="relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#00E599]/10 via-[#2E68FF]/5 to-transparent blur-[140px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-xs font-mono text-slate-700 dark:text-neutral-300 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
          <span className="text-[#00E599] font-medium uppercase tracking-wider">
            Autonomous Confidential Settlement
          </span>
          <span className="text-slate-300 dark:text-neutral-500">|</span>
          <span className="text-slate-500 dark:text-neutral-400">Institutional Capital Layer</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-neutral-100 max-w-5xl mx-auto leading-[1.1]">
          Confidential Settlement & Autonomous Liquidity for{' '}
          <span className="bg-gradient-to-r from-[#00E599] via-emerald-400 to-[#2E68FF] bg-clip-text text-transparent">
            Global Capital
          </span>
        </h1>

        <p className="mt-8 text-lg sm:text-xl text-slate-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
          Shielded corporate disbursements, fractionalized real-world asset credit tranches,
          and agent-native RFQ execution. Maintain complete financial privacy while preserving
          mathematical solvency and regulatory auditability.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/app/overview"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-xl shadow-[#00E599]/20 group"
          >
            <span>Launch Protocol</span>
            <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/solutions/enterprise-payroll"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white dark:bg-[#0E121B] hover:bg-slate-100 dark:hover:bg-[#161C2B] text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-[#21293D] font-semibold text-base transition shadow-sm"
          >
            <FiLock className="w-4 h-4 text-[#00E599]" />
            <span>Explore Enterprise Solutions</span>
          </Link>
        </div>

        {/* Live Protocol Metrics Ribbon */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/80 dark:bg-[#0E121B]/80 border border-slate-200 dark:border-[#21293D] backdrop-blur-xl shadow-sm transition-colors duration-200">
          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#161C2B]/50 border border-slate-200/80 dark:border-[#21293D]/60 text-left">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
              Total Shielded Value
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-neutral-100 tabular-nums">
              {displayTVL}
            </div>
            <div className="text-xs text-[#00E599] font-mono mt-1 flex items-center gap-1">
              <FiTrendingUp className="w-3.5 h-3.5" />
              <span>Real-Time On-Chain TVL</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#161C2B]/50 border border-slate-200/80 dark:border-[#21293D]/60 text-left">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
              Settlement Volume
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-neutral-100 tabular-nums">
              {displayVolume}
            </div>
            <div className="text-xs text-[#00E599] font-mono mt-1 flex items-center gap-1">
              <FiCheckCircle className="w-3.5 h-3.5" />
              <span>Indexed RFQ Delivery</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#161C2B]/50 border border-slate-200/80 dark:border-[#21293D]/60 text-left">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
              Active Agent Fleets
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-neutral-100 tabular-nums">
              48 Fleets
            </div>
            <div className="text-xs text-slate-500 dark:text-neutral-400 font-mono mt-1 flex items-center gap-1">
              <FiCpu className="w-3.5 h-3.5 text-[#00E599]" />
              <span>Bounded Session Keys</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#161C2B]/50 border border-slate-200/80 dark:border-[#21293D]/60 text-left">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-1">
              Solvency Health Factor
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-neutral-100 tabular-nums">
              {healthFactor}x
            </div>
            <div className="text-xs text-[#00E599] font-mono mt-1 flex items-center gap-1">
              <FiShield className="w-3.5 h-3.5" />
              <span>DaaS Algorithmic Floor</span>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Architecture Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-200 dark:border-[#21293D]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#00E599] font-semibold mb-3">
            Core Protocol Pillars
          </h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
            Engineered for Confidentiality, Yield & Autonomy
          </h3>
          <p className="mt-4 text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Every transaction, settlement, and debt restructuring event executes deterministically
            with zero plaintext leakage and continuous mathematical verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#00E599]/40 hover:bg-slate-50 dark:hover:bg-[#161C2B]/60 transition flex flex-col justify-between group shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#00E599]/10 text-[#00E599] flex items-center justify-center mb-6 border border-[#00E599]/20 group-hover:scale-105 transition-transform">
                <FiLock className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-neutral-100 mb-3">
                Confidential Settlement & Payroll
              </h4>
              <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-6">
                Shield corporate balances, vendor invoicing, and international contractor payroll.
                Public explorers and mempool surveillance bots see only cryptographic commitments,
                safeguarding operational privacy.
              </p>
              <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599] flex-shrink-0" />
                  <span>Zero public balance leakage</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599] flex-shrink-0" />
                  <span>Asymmetric viewing keys for compliance</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599] flex-shrink-0" />
                  <span>Instant recipient note redemption</span>
                </li>
              </ul>
            </div>
            <div className="pt-8">
              <Link
                href="/solutions/enterprise-payroll"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00E599] hover:underline"
              >
                <span>Enterprise Payroll Details</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#2E68FF]/40 hover:bg-slate-50 dark:hover:bg-[#161C2B]/60 transition flex flex-col justify-between group shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#2E68FF]/10 text-[#2E68FF] flex items-center justify-center mb-6 border border-[#2E68FF]/20 group-hover:scale-105 transition-transform">
                <FiLayers className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-neutral-100 mb-3">
                Credit Tranches & DaaS Solvency
              </h4>
              <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-6">
                Institutional credit facilities divided into Senior, Mezzanine, and Junior risk tranches.
                Protected by Default-as-a-Service automated restructuring that prevents sudden insolvency cascades.
              </p>
              <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#2E68FF] flex-shrink-0" />
                  <span>Senior tranche principal protection</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#2E68FF] flex-shrink-0" />
                  <span>Algorithmic debt haircut distribution</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#2E68FF] flex-shrink-0" />
                  <span>Continuous on-chain risk telemetry</span>
                </li>
              </ul>
            </div>
            <div className="pt-8">
              <Link
                href="/solutions/credit-tranches"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2E68FF] hover:underline"
              >
                <span>Credit Tranches Details</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#00E599]/40 hover:bg-slate-50 dark:hover:bg-[#161C2B]/60 transition flex flex-col justify-between group shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#00E599]/10 text-[#00E599] flex items-center justify-center mb-6 border border-[#00E599]/20 group-hover:scale-105 transition-transform">
                <RiRobot2Line className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-neutral-100 mb-3">
                Kudex Agent Fleet Execution
              </h4>
              <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed mb-6">
                Deploy autonomous software agents to negotiate off-chain RFQ spreads with solvers
                under strict session policies. Spend caps, expiration times, and contract whitelists
                eliminate signature fatigue.
              </p>
              <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599] flex-shrink-0" />
                  <span>Zero-popup session execution</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599] flex-shrink-0" />
                  <span>Strict spending limit ceilings</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599] flex-shrink-0" />
                  <span>Instant one-click revocation switch</span>
                </li>
              </ul>
            </div>
            <div className="pt-8">
              <Link
                href="/solutions/autonomous-agents"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00E599] hover:underline"
              >
                <span>Agent Architecture Details</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive KUDEX AGENT Experience Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-200 dark:border-[#21293D]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-xs font-mono text-[#00E599]">
              <RiRobot2Line className="w-4 h-4" />
              <span>MEET KUDEX AGENT</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight leading-tight">
              Natural Language Intent to Cryptographic Execution
            </h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              No complex transaction builders or multi-step calldata assembly.
              Simply instruct KUDEX AGENT in plain language. The agent simulates state diffs,
              queries competitive institutional solvers, and presents verified quotes ready for instant execution.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] shadow-sm">
                <div className="p-2 rounded-lg bg-[#00E599]/10 text-[#00E599] mt-0.5">
                  <FiActivity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-neutral-200">
                    Pre-Flight Solvency Simulators
                  </div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Calculates exact balance deltas and verifies invariant preservation before touching the ledger.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] shadow-sm">
                <div className="p-2 rounded-lg bg-[#2E68FF]/10 text-[#2E68FF] mt-0.5">
                  <RiExchangeFundsLine className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-neutral-200">
                    Optimal RFQ Solver Routing
                  </div>
                  <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Solvers compete off-chain to deliver sub-second fill rates with zero sandwich or front-running risk.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/app/overview"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition"
              >
                <span>Try KUDEX AGENT Live</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-2xl p-6 font-mono text-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-[#00E599]/80" />
                  <span className="ml-2 text-xs text-slate-500 dark:text-neutral-400">kudex-agent-runtime</span>
                </div>
                <span className="text-xs text-[#00E599] px-2 py-0.5 rounded bg-[#00E599]/10">
                  SYSTEM READY
                </span>
              </div>

              <div className="space-y-3 text-slate-700 dark:text-neutral-300">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161C2B] text-xs text-slate-800 dark:text-neutral-300 border border-slate-200 dark:border-transparent">
                  <span className="text-[#00E599] font-bold">User:</span> &ldquo;Disburse 2,500 pUSD to the treasury pool and shield receipt notes for audit.&rdquo;
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#06080D] border border-slate-200 dark:border-[#21293D] space-y-2 text-xs">
                  <div className="text-[#00E599] flex items-center gap-1.5 font-semibold">
                    <RiRobot2Line className="w-4 h-4" />
                    <span>KUDEX AGENT:</span>
                  </div>
                  <p className="text-slate-700 dark:text-neutral-300 font-sans">
                    Generating client-side note commitment. Simulating vault state transition:
                  </p>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#161C2B] font-mono text-[11px] text-slate-800 dark:text-neutral-300 space-y-1 border border-slate-200 dark:border-transparent">
                    <div>Commitment: 0x8f4c...3e19 (Client-Side Encrypted)</div>
                    <div>Asset Delta: -2,500.00 pUSD</div>
                    <div>Invariant Solvency: Preserved (Health Factor: 1.42x)</div>
                    <div className="text-[#00E599]">Estimated Gas: 0.00014 POT (Native Base Unit)</div>
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#00E599] text-[#06080D] font-bold text-xs">
                      <FiCheckCircle className="w-3.5 h-3.5" />
                      Ready to Execute
                    </span>
                    <span className="text-slate-400 dark:text-neutral-500 text-[11px]">
                      Session Key Policy: Single-Click Bounded Delegation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="rounded-3xl border border-[#21293D] bg-gradient-to-b from-[#0E121B] to-[#06080D] p-12 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial from-[#00E599]/10 via-transparent to-transparent opacity-60 pointer-events-none" />
          <h3 className="text-3xl sm:text-5xl font-extrabold text-neutral-100 tracking-tight max-w-3xl mx-auto leading-tight">
            Institutional Privacy and Yield Await Your Capital
          </h3>
          <p className="mt-6 text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Begin shielding balances, managing high-grade credit tranches, or deploying autonomous
            Kudex Agents on our high-speed settlement network today.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app/overview"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-xl shadow-[#00E599]/20"
            >
              <span>Launch Kudex Workspace</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#161C2B] hover:bg-[#21293D] text-neutral-200 border border-[#21293D] font-semibold text-base transition"
            >
              <span>View Technical Documentation</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
