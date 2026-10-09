'use client';

import React, { useState, useRef } from 'react';
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
} from 'react-icons/fi';
import { RiShieldCheckLine } from 'react-icons/ri';

export default function EnterprisePayrollPage() {
  const [recipientCount, setRecipientCount] = useState(25);
  const [avgDisbursement, setAvgDisbursement] = useState(4500);
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

  const totalPayroll = recipientCount * avgDisbursement;
  const privacyFactor = '100% Zero Leakage';
  const estimatedGasPot = (recipientCount * 0.00012).toFixed(5);

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
      <div className="max-w-4xl space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-sm font-semibold text-[#00E599]">
          <FiLock className="w-4 h-4" />
          <span>A2B PRIVATE GLOBAL SETTLEMENT</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Confidential Corporate Payroll & Contractor Disbursements
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-neutral-400 leading-relaxed">
          Disburse executive compensation, engineering salaries, and global supplier invoices
          with complete confidentiality. Competitors and mempool trackers cannot inspect wallet
          balances, compensation tiers, or sensitive payment intervals.
        </p>
      </div>

      {/* The Core Challenge & Kudex Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="text-xs font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">
            The Public Ledger Exposure Problem
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Transparent Blockchains Expose Executive Data
          </h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Every standard token transfer broadcasts the sender, recipient, and amount to the entire world.
            When companies pay salaries on public blockchains, employees can see everyone else&apos;s pay,
            competitors can identify key hires and poach talent, and malicious actors can track individual net worth.
          </p>
          <ul className="space-y-2.5 text-base text-rose-700 dark:text-rose-300/90 pt-3">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Public salary and bonus tier scraping</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Corporate cash-flow surveillance by adversaries</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Vendor payment terms leaked to industry rivals</span>
            </li>
          </ul>
        </div>

        <div className="p-8 rounded-2xl border border-emerald-200 dark:border-[#00E599]/40 bg-white dark:bg-[#0E121B] space-y-4 shadow-sm">
          <div className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-[#00E599] font-bold">
            The Kudex Shielded Solution
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            Encrypted Notes with Selective Auditor Viewing
          </h3>
          <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
            Kudex decouples asset transfers from public addresses. Funds settle as encrypted commitment notes
            that only the intended recipient can nullify and spend. Treasury departments maintain comprehensive
            reporting via cryptographic viewing keys for accounting compliance.
          </p>
          <ul className="space-y-2.5 text-base text-slate-700 dark:text-neutral-300 pt-3">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Zero mempool metadata on salary amounts</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>One-click batch payroll execution</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-[#00E599]" />
              <span>Granular viewing keys for tax & auditing authorities</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive Batch Payroll Calculator */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-8 mb-16 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-[#21293D] gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              Interactive Shielded Payroll Simulator
            </h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 mt-1.5">
              Estimate batch disbursement volume and confidential settlement gas requirements
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-sm font-mono text-emerald-600 dark:text-[#00E599] font-semibold">
            <RiShieldCheckLine className="w-4 h-4" />
            <span>Pre-Flight Privacy Shield: Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-base font-semibold text-slate-800 dark:text-neutral-200 mb-3">
                <span>Number of Recipients / Contractors:</span>
                <span className="font-mono text-emerald-600 dark:text-[#00E599] font-bold">{recipientCount} Members</span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={recipientCount}
                onChange={(e) => setRecipientCount(Number(e.target.value))}
                className="w-full accent-[#00E599] bg-slate-200 dark:bg-[#161C2B] rounded-lg cursor-pointer h-2.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-base font-semibold text-slate-800 dark:text-neutral-200 mb-3">
                <span>Average Monthly Compensation:</span>
                <span className="font-mono text-emerald-600 dark:text-[#00E599] font-bold">${avgDisbursement.toLocaleString()} pUSD</span>
              </div>
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={avgDisbursement}
                onChange={(e) => setAvgDisbursement(Number(e.target.value))}
                className="w-full accent-[#00E599] bg-slate-200 dark:bg-[#161C2B] rounded-lg cursor-pointer h-2.5"
              />
            </div>
          </div>

          <div className="p-7 rounded-2xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] flex flex-col justify-between space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">Total Monthly Disbursement</span>
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-1 block">
                  ${totalPayroll.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">Privacy Guarantee</span>
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-[#00E599] mt-1 block">
                  {privacyFactor}
                </span>
              </div>
              <div>
                <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">Batch Gas Estimate</span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-1 block">
                  {estimatedGasPot} POT
                </span>
              </div>
              <div>
                <span className="text-xs uppercase font-mono text-slate-500 dark:text-neutral-400 block font-semibold">Settlement Time</span>
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-[#00E599] mt-1 block">
                  1 Block (~400ms)
                </span>
              </div>
            </div>

            <div className="pt-3">
              <Link
                href="/app/settlement"
                className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/20"
              >
                <span>Launch Shielded Settlement</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Step-by-Step */}
      <div className="mb-16">
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
      <div className="p-10 rounded-3xl border border-slate-200 dark:border-[#21293D] bg-slate-100 dark:bg-gradient-to-r dark:from-[#0E121B] dark:to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
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
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
