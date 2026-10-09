'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FiCpu,
  FiZap,
  FiShield,
  FiLock,
  FiCheckCircle,
  FiArrowRight,
  FiClock,
  FiDollarSign,
  FiAlertOctagon,
  FiCode,
} from 'react-icons/fi';
import { RiRobot2Line, RiExchangeFundsLine } from 'react-icons/ri';

export default function AutonomousAgentsPage() {
  const [maxSpend, setMaxSpend] = useState(2500);
  const [ttlHours, setTtlHours] = useState(12);
  const [whitelistedRouter, setWhitelistedRouter] = useState('Kudex RFQ Solver Router');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-sm font-mono text-slate-500 dark:text-neutral-400 mb-6">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#00E599] font-semibold">Solutions</span>
        <span>/</span>
        <span className="text-slate-900 dark:text-neutral-200 font-semibold">Autonomous Agents</span>
      </div>

      {/* Hero Header */}
      <div className="max-w-4xl space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-sm font-semibold text-[#00E599]">
          <RiRobot2Line className="w-4 h-4" />
          <span>A2A & A2H EXECUTION INFRASTRUCTURE</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Autonomous Agent Settlement & Zero-Popup Session Policies
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
          Unleash autonomous AI agents and programmatic solvers to negotiate RFQ quotes, rebalance
          credit vaults, and execute arbitrage. Bounded by strict cryptographic spend limits
          and time-to-live restrictions so your treasury remains 100% secure.
        </p>
      </div>

      {/* 3 Core Execution Advantages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-emerald-500/20">
            <FiZap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Zero-Popup Execution</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Eliminate repetitive wallet signature prompts. Delegate bounded authority to your Kudex Agent,
            enabling seamless algorithmic execution without human latency or missed market fills.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300 pt-3 border-t border-slate-200 dark:border-[#21293D]">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Sub-second execution speeds</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Zero manual signing dialogs</span>
            </li>
          </ul>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-[#2E68FF] flex items-center justify-center border border-blue-500/20">
            <FiShield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cryptographic Spend Ceilings</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Smart contract-enforced limits ensure an agent cannot exceed its authorized capital ceiling.
            Even if an agent encounters aberrant market conditions, your primary treasury cannot be drained.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300 pt-3 border-t border-slate-200 dark:border-[#21293D]">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-blue-600 dark:text-[#2E68FF]" />
              <span>Granular token spend caps</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-blue-600 dark:text-[#2E68FF]" />
              <span>Contract-level whitelist validation</span>
            </li>
          </ul>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <FiAlertOctagon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Instant Kill Switch</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Maintain total sovereign authority over running agents. Terminate sessions, revoke execution rights,
            and recall delegated capital with a single on-chain transaction at any moment.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300 pt-3 border-t border-slate-200 dark:border-[#21293D]">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-rose-500" />
              <span>Instant cryptographic revocation</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-rose-500" />
              <span>Zero residual authority risk</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive Session Policy Builder */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 mb-16 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-[#21293D] gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Interactive Session Policy Architect
            </h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 mt-1.5">
              Configure parameters to see how Kudex enforces session boundaries on-chain
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-sm font-mono text-emerald-600 dark:text-[#00E599] font-semibold">
            <FiCode className="w-4 h-4" />
            <span>Policy Compiler: Ready</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-base font-semibold text-slate-800 dark:text-neutral-200 mb-3">
                <span>Maximum Allowed Spend Cap:</span>
                <span className="font-mono text-emerald-600 dark:text-[#00E599] font-bold">${maxSpend.toLocaleString()} pUSD</span>
              </div>
              <input
                type="range"
                min="500"
                max="25000"
                step="500"
                value={maxSpend}
                onChange={(e) => setMaxSpend(Number(e.target.value))}
                className="w-full accent-[#00E599] bg-slate-200 dark:bg-[#161C2B] rounded-lg cursor-pointer h-2.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-base font-semibold text-slate-800 dark:text-neutral-200 mb-3">
                <span>Session Expiration (Time-To-Live):</span>
                <span className="font-mono text-blue-600 dark:text-[#2E68FF] font-bold">{ttlHours} Hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="72"
                step="1"
                value={ttlHours}
                onChange={(e) => setTtlHours(Number(e.target.value))}
                className="w-full accent-[#2E68FF] bg-slate-200 dark:bg-[#161C2B] rounded-lg cursor-pointer h-2.5"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-slate-800 dark:text-neutral-200 mb-3">
                Permitted Contract Target:
              </label>
              <select
                value={whitelistedRouter}
                onChange={(e) => setWhitelistedRouter(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-base text-slate-900 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#00E599]/40"
              >
                <option value="Kudex RFQ Solver Router">Kudex RFQ Solver Router (Atomic Fill)</option>
                <option value="Kudex Shielded Vault Pool">Kudex Shielded Vault Pool (Rebalancer)</option>
                <option value="Cross-Chain Bridge Gateway">Cross-Chain Bridge Gateway (Fast Solver)</option>
              </select>
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] flex flex-col justify-between space-y-5">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-3 font-semibold">
                Generated On-Chain Policy Payload
              </div>
              <div className="p-5 rounded-xl bg-white dark:bg-[#06080D] font-mono text-sm text-slate-800 dark:text-neutral-300 space-y-2 border border-slate-200 dark:border-[#21293D]">
                <div><span className="text-slate-400 dark:text-neutral-500">&#47;&#47; Bounded Session Key Policy</span></div>
                <div><span className="text-emerald-600 dark:text-[#00E599] font-bold">targetContract:</span> &ldquo;{whitelistedRouter}&rdquo;</div>
                <div><span className="text-emerald-600 dark:text-[#00E599] font-bold">spendCeiling:</span> {maxSpend}000000 <span className="text-slate-400 dark:text-neutral-500">&#47;&#47; Exact BigInt</span></div>
                <div><span className="text-emerald-600 dark:text-[#00E599] font-bold">validUntil:</span> block.timestamp + {ttlHours * 3600}</div>
                <div><span className="text-emerald-600 dark:text-[#00E599] font-bold">revocationKey:</span> msg.sender</div>
              </div>
            </div>

            <div className="pt-3">
              <Link
                href="/app/agents"
                className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/20"
              >
                <span>Deploy Agent Session</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-10 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-slate-100 dark:bg-gradient-to-r dark:from-[#0E121B] dark:to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Ready to Automate Execution?</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 max-w-xl leading-relaxed">
            Configure bounded policies and delegate trading operations to the Kudex Agent fleet.
          </p>
        </div>
        <Link
          href="/app/agents"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/15 flex-shrink-0"
        >
          <span>Launch Agent Fleet</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
