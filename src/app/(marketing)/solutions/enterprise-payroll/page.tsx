'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  FiLock,
  FiShield,
  FiCheckCircle,
  FiArrowRight,
  FiEye,
  FiKey,
  FiDollarSign,
  FiFileText,
  FiUsers,
  FiActivity,
  FiGlobe,
  FiLayers,
} from 'react-icons/fi';
import { RiShieldCheckLine, RiBankCardLine, RiExchangeFundsLine } from 'react-icons/ri';

export default function EnterprisePayrollPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (containerRef.current) {
        gsap.from(containerRef.current.querySelectorAll('.sol-anim'), {
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
      <div className="sol-anim flex items-center gap-2 text-sm font-mono text-slate-500 dark:text-neutral-400 mb-6">
        <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#00E599] font-semibold">Solutions</span>
        <span>/</span>
        <span className="text-slate-900 dark:text-neutral-200 font-semibold">Enterprise Payroll</span>
      </div>

      {/* Hero Header */}
      <div className="sol-anim max-w-4xl space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-sm font-semibold text-[#00E599]">
          <RiShieldCheckLine className="w-4 h-4" />
          <span>CONFIDENTIAL GLOBAL SETTLEMENT</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Confidential Corporate Payroll & Contractor Disbursements
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
          Disburse executive compensation, engineering salaries, and global supplier invoices with complete confidentiality.
          Competitors and mempool trackers cannot inspect wallet balances, compensation tiers, or sensitive payment intervals.
        </p>
        <div className="pt-2 flex flex-wrap items-center gap-4">
          <Link
            href="/app/settlement"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/20"
          >
            <span>Launch Settlement Workspace</span>
            <RiExchangeFundsLine className="w-4 h-4" />
          </Link>
          <Link
            href="/app/compliance"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 dark:bg-[#0E121B] hover:bg-slate-200 dark:hover:bg-[#161C2B] text-slate-900 dark:text-white font-semibold text-base border border-slate-200 dark:border-[#21293D] transition"
          >
            <span>Generate Auditor Viewing Keys</span>
          </Link>
        </div>
      </div>

      {/* The Core Challenge & Kudex Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="sol-anim p-8 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="text-xs font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">
            The Public Ledger Exposure Problem
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Transparency Ruins Competitive Advantage
          </h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Standard blockchain transactions broadcast sender addresses, recipient addresses, and transfer amounts
            to public explorers. Anyone can monitor your salary tiers, head count expansions, contractor rates,
            and vendor payment schedules in real time.
          </p>
          <ul className="space-y-2.5 text-base text-rose-700 dark:text-rose-300 pt-3 font-medium">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Public scrutiny of key executive compensation packages</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Competitors poach talent by analyzing on-chain pay frequencies</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Supplier pricing strategies exposed to rival bidding firms</span>
            </li>
          </ul>
        </div>

        <div className="sol-anim p-8 rounded-2xl border border-emerald-200 dark:border-[#00E599]/40 bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-[#00E599] font-bold">
            The Kudex Confidential Solution
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Client-Side Encrypted Commitment Notes
          </h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Kudex decouples asset transfers from public addresses. Funds settle as encrypted commitment notes
            that only the intended recipient can nullify and spend. Treasury departments maintain comprehensive
            reporting via cryptographic viewing keys for accounting compliance.
          </p>
          <ul className="space-y-2.5 text-base text-slate-700 dark:text-neutral-300 pt-3">
            <li className="flex items-center gap-2">
              <RiShieldCheckLine className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Zero mempool metadata on salary amounts</span>
            </li>
            <li className="flex items-center gap-2">
              <RiShieldCheckLine className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>One-click batch payroll execution</span>
            </li>
            <li className="flex items-center gap-2">
              <RiShieldCheckLine className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Granular viewing keys for tax & auditing authorities</span>
            </li>
          </ul>
        </div>
      </div>

      {/* NEW SECTION 1: REGULATORY VIEWING KEY ARCHITECTURE */}
      <div className="sol-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 sm:p-10 mb-16 shadow-sm">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E599]/10 text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <RiShieldCheckLine className="w-3.5 h-3.5" />
            <span>AUDIT & TAX COMPLIANCE FRAMEWORK</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Selective Compliance via Asymmetric Viewing Keys
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            Confidentiality does not mean compromising compliance. Corporate finance teams can export verifiable,
            read-only audit trails for internal controllers, CPA partners, and tax authorities without exposing data to the public.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-bold">
              01
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Read-Only Permission Scope</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Viewing keys carry strictly zero spend authority. Auditors can decrypt and verify transaction integrity but cannot initiate transfers.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-bold">
              02
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Granular Time Windows</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Generate viewing keys scoped strictly to specific accounting periods (e.g. Q1 2026 Payroll) with pre-set expiration limits.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-bold">
              03
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Instant Cryptographic Revocation</h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Revoke active viewing keys instantly with a single transaction once an audit cycle concludes.
            </p>
          </div>
        </div>
      </div>

      {/* NEW SECTION 2: GLOBAL MULTI-CURRENCY SETTLEMENT RAILS */}
      <div className="sol-anim rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 sm:p-10 mb-16 shadow-sm">
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E599]/10 text-xs font-mono font-bold text-emerald-600 dark:text-[#00E599] mb-3">
            <RiBankCardLine className="w-3.5 h-3.5" />
            <span>GLOBAL DISBURSEMENT RAILS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            High-Throughput Batch Settlement Architecture
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 leading-relaxed">
            Execute single-block batch payouts to hundreds of international team members simultaneously. Settle in pUSD, USDC, or native protocol assets with predictable basis-point gas fees.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">FINALITY SPEED</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">&lt; 400ms</div>
            <p className="text-xs text-slate-600 dark:text-neutral-400">Atomic single-block confirmation for entire batch batches.</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">PRIVACY GUARANTEE</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-[#00E599]">Zero Leakage</div>
            <p className="text-xs text-slate-600 dark:text-neutral-400">Total confidentiality of individual recipient amounts.</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">BATCH SCALABILITY</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">500+ Recipient</div>
            <p className="text-xs text-slate-600 dark:text-neutral-400">Consolidated into a single efficient on-chain payload.</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400 font-semibold">MEV IMMUNITY</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-[#00E599]">100% Protected</div>
            <p className="text-xs text-slate-600 dark:text-neutral-400">Encrypted transfer packets immune to searcher reordering.</p>
          </div>
        </div>
      </div>

      {/* Workflow Step-by-Step */}
      <div className="sol-anim mb-16">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-8">
          Enterprise Payroll Lifecycle
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] font-mono font-bold flex items-center justify-center text-base border border-[#00E599]/20">
              01
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Deposit & Shield</h4>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Corporate treasury deposits stablecoin or native assets into the shielded pool, converting balance to private commitment notes.
            </p>
          </div>

          <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] font-mono font-bold flex items-center justify-center text-base border border-[#00E599]/20">
              02
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Disburse Commitments</h4>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Disburse notes to employee or contractor public keys. Amounts and individual associations remain completely shielded.
            </p>
          </div>

          <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] font-mono font-bold flex items-center justify-center text-base border border-[#00E599]/20">
              03
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Private Redemption</h4>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Recipients redeem notes to any external wallet or withdraw to corporate accounts without linking back to employer treasury.
            </p>
          </div>

          <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-3.5 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#00E599]/10 text-emerald-600 dark:text-[#00E599] font-mono font-bold flex items-center justify-center text-base border border-[#00E599]/20">
              04
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Auditor Export</h4>
            <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
              Generate asymmetric viewing keys to export cryptographically verified reports for internal compliance officers and tax auditors.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="sol-anim p-10 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-slate-100 dark:bg-gradient-to-r dark:from-[#0E121B] dark:to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Ready to Upgrade Your Corporate Payroll?</h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-2 max-w-xl leading-relaxed">
            Integrate confidential settlement into your enterprise finance workflow today.
          </p>
        </div>
        <Link
          href="/app/settlement"
          className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/15 flex-shrink-0"
        >
          <span>Open Settlement App</span>
          <RiExchangeFundsLine className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
