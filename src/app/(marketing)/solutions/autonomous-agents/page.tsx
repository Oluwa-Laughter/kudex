'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
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
  FiActivity,
  FiLayers,
} from 'react-icons/fi';
import { RiRobot2Line, RiExchangeFundsLine, RiShieldCheckLine } from 'react-icons/ri';

export default function AutonomousAgentsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (containerRef.current) {
        gsap.from(containerRef.current.querySelectorAll('.agent-anim'), {
          opacity: 0,
          y: 24,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power3.out',
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-12 py-16">
      {/* Breadcrumb Header */}
      <div className="agent-anim flex items-center gap-2 text-sm font-mono text-slate-500 dark:text-neutral-400 mb-6">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#00E599] font-semibold">Solutions</span>
        <span>/</span>
        <span className="text-slate-900 dark:text-neutral-200 font-semibold">Autonomous Agents</span>
      </div>

      {/* Hero Header */}
      <div className="agent-anim max-w-4xl space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-sm font-semibold text-[#00E599]">
          <RiRobot2Line className="w-4 h-4" />
          <span>AUTONOMOUS EXECUTION INFRASTRUCTURE</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Autonomous Agent Settlement & Zero-Popup Session Policies
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
          Unleash autonomous AI agents and programmatic solvers to negotiate RFQ quotes, rebalance
          credit vaults, and execute arbitrage. Bounded by strict cryptographic spend limits
          and time-to-live restrictions so your treasury remains 100% secure.
        </p>
        <div className="pt-2 flex flex-wrap items-center gap-4">
          <Link
            href="/app/agents"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/20"
          >
            <span>Launch Kudex Agent Workspace</span>
            <RiRobot2Line className="w-4 h-4" />
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 dark:bg-[#0E121B] hover:bg-slate-200 dark:hover:bg-[#161C2B] text-slate-900 dark:text-white font-semibold text-base border border-slate-200 dark:border-[#21293D] transition"
          >
            <span>Read Agent Guide</span>
          </Link>
        </div>
      </div>

      {/* 3 Core Pillars Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="agent-anim p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition">
          <div className="w-12 h-12 rounded-xl bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-[#00E599]/20">
            <FiZap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Zero-Popup Execution</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Eliminate repetitive wallet confirmations. Programmatic agents trade and rebalance within pre-signed
            session boundaries, enabling high-frequency execution without human intervention.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300 pt-3 border-t border-slate-200 dark:border-[#21293D]">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Block-atomic execution</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Zero manual signature fatigue</span>
            </li>
          </ul>
        </div>

        <div className="agent-anim p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition">
          <div className="w-12 h-12 rounded-xl bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-[#00E599]/20">
            <FiShield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cryptographic Spend Ceilings</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Smart contract-enforced limits ensure an agent cannot exceed its authorized capital ceiling.
            Even if an agent encounters aberrant market conditions, your primary treasury cannot be drained.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300 pt-3 border-t border-slate-200 dark:border-[#21293D]">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Granular token spend caps</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Contract-level whitelist validation</span>
            </li>
          </ul>
        </div>

        <div className="agent-anim p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 shadow-sm hover:border-[#00E599]/40 transition">
          <div className="w-12 h-12 rounded-xl bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center border border-[#00E599]/20">
            <FiAlertOctagon className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Instant Kill Switch</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Maintain total sovereign authority over running agents. Terminate sessions, revoke execution rights,
            and recall delegated capital with a single on-chain transaction at any moment.
          </p>
          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-neutral-300 pt-3 border-t border-slate-200 dark:border-[#21293D]">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Instant cryptographic revocation</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Zero residual authority risk</span>
            </li>
          </ul>
        </div>
      </div>

      {/* NEW SECTION 1: BOUNDED CRYPTOGRAPHIC POLICY SPECIFICATION */}
      <div className="agent-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 sm:p-10 mb-16 shadow-sm">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E599]/10 text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <FiLock className="w-3.5 h-3.5" />
            <span>SESSION KEY SPECIFICATION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Cryptographic Policy Boundary Framework
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            Kudex Agent policies are cryptographically signed rule sets verified on-chain before any transaction completes.
            Agents never hold your private keys—they operate within temporary, isolated execution sandboxes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">01 / SPEND CEILING</div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Hard Capital Caps</h4>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Enforce a strict maximum dollar or token expenditure per 24 hours. Transactions exceeding the threshold revert atomically.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">02 / CALL WHITELIST</div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Selector Restrictions</h4>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Agents can only interact with authorized smart contracts (e.g. Kudex RFQ Router, Kudex Vault). External transfers are barred.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">03 / TIME-TO-LIVE</div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Automated Expiration</h4>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Session keys expire on-chain at block timestamp boundaries. Even abandoned agents automatically deactivate safely.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">04 / AUDIT TRAILS</div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Full On-Chain Log</h4>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Every trade and vault rebalance executed by Kudex Agent emits signed audit events with verifiable execution receipts.
            </p>
          </div>
        </div>
      </div>

      {/* NEW SECTION 2: A2A SWARM & SOLVER SETTLEMENT ORCHESTRATION */}
      <div className="agent-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 sm:p-10 mb-16 shadow-sm">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E599]/10 text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <RiRobot2Line className="w-3.5 h-3.5" />
            <span>AGENT-TO-AGENT LIQUIDITY</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Off-Chain Negotiation with Block-Atomic Settlement
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            Kudex Agents communicate directly with institutional liquidity solvers off-chain.
            They negotiate optimal RFQ quotes, simulate execution viability, and submit atomic multi-call batches
            with zero pre-trade front-running risk.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">01 / SIGNAL DETECTION</div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Yield & Arb Surveillance</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Kudex Agent monitors cross-vault spreads, collateral health factors, and secondary market tranche discounts 24/7.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">02 / PRIVATE RFQ BIDDING</div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Solver Competition</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              The agent broadcasts encrypted trade intents to bonded solvers. Solvers bid the tightest quotes with zero mempool exposure.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">03 / ATOMIC REBALANCE</div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Single-Block Finality</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              The winning solver fill is accepted and settled atomically on the Kudex Confidential Settlement Layer with zero slippage.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="agent-anim p-10 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-slate-100 dark:bg-gradient-to-r dark:from-[#0E121B] dark:to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Deploy Your First Kudex Agent Policy</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 max-w-xl leading-relaxed">
            Automate trading, yield compounding, and risk surveillance with institutional spend boundaries.
          </p>
        </div>
        <Link
          href="/app/agents"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/15 flex-shrink-0"
        >
          <span>Open Agent Workspace</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
