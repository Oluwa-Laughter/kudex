'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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

  const totalPayroll = recipientCount * avgDisbursement;
  const privacyFactor = '100% Zero Leakage';
  const estimatedGasPot = (recipientCount * 0.00012).toFixed(5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-6">
        <Link href="/" className="hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-[#00E599]">Solutions</span>
        <span>/</span>
        <span className="text-neutral-200">Enterprise Payroll</span>
      </div>

      {/* Hero Header */}
      <div className="max-w-4xl space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E121B] border border-[#21293D] text-xs font-mono text-[#00E599]">
          <FiLock className="w-3.5 h-3.5" />
          <span>A2B PRIVATE GLOBAL SETTLEMENT</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-100 tracking-tight leading-tight">
          Confidential Corporate Payroll & Contractor Disbursements
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
          Disburse executive compensation, engineering salaries, and global supplier invoices
          with complete confidentiality. Competitors and mempool trackers cannot inspect wallet
          balances, compensation tiers, or sensitive payment intervals.
        </p>
      </div>

      {/* The Core Challenge & Kudex Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="p-8 rounded-2xl border border-rose-900/40 bg-[#0E121B] space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold">
            The Public Ledger Exposure Problem
          </div>
          <h3 className="text-xl font-bold text-neutral-100">
            Transparent Blockchains Expose Executive Data
          </h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Every standard token transfer broadcasts the sender, recipient, and amount to the entire world.
            When companies pay salaries on public blockchains, employees can see everyone else&apos;s pay,
            competitors can identify key hires and poach talent, and malicious actors can track individual net worth.
          </p>
          <ul className="space-y-2 text-sm text-rose-300/90 pt-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Public salary and bonus tier scraping</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Corporate cash-flow surveillance by adversaries</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Vendor payment terms leaked to industry rivals</span>
            </li>
          </ul>
        </div>

        <div className="p-8 rounded-2xl border border-[#00E599]/40 bg-[#0E121B] space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-[#00E599] font-semibold">
            The Kudex Shielded Solution
          </div>
          <h3 className="text-xl font-bold text-neutral-100">
            Encrypted Notes with Selective Auditor Viewing
          </h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Kudex decouples asset transfers from public addresses. Funds settle as encrypted commitment notes
            that only the intended recipient can nullify and spend. Treasury departments maintain comprehensive
            reporting via cryptographic viewing keys for accounting compliance.
          </p>
          <ul className="space-y-2 text-sm text-neutral-300 pt-2">
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
              <span>Zero mempool metadata on salary amounts</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
              <span>One-click batch payroll execution</span>
            </li>
            <li className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
              <span>Granular viewing keys for tax & auditing authorities</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive Batch Payroll Calculator */}
      <div className="rounded-2xl border border-[#21293D] bg-[#0E121B] p-8 mb-16 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#21293D] gap-4">
          <div>
            <h3 className="text-xl font-bold text-neutral-100">
              Interactive Shielded Payroll Simulator
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Estimate batch disbursement volume and confidential settlement gas requirements
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#161C2B] border border-[#21293D] text-xs font-mono text-[#00E599]">
            <RiShieldCheckLine className="w-4 h-4" />
            <span>Pre-Flight Privacy Shield: Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-medium text-neutral-300 mb-2">
                <span>Number of Recipients / Contractors:</span>
                <span className="font-mono text-[#00E599] font-bold">{recipientCount} Members</span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={recipientCount}
                onChange={(e) => setRecipientCount(Number(e.target.value))}
                className="w-full accent-[#00E599] bg-[#161C2B] rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium text-neutral-300 mb-2">
                <span>Average Monthly Compensation:</span>
                <span className="font-mono text-[#00E599] font-bold">${avgDisbursement.toLocaleString()} pUSD</span>
              </div>
              <input
                type="range"
                min="1000"
                max="25000"
                step="500"
                value={avgDisbursement}
                onChange={(e) => setAvgDisbursement(Number(e.target.value))}
                className="w-full accent-[#00E599] bg-[#161C2B] rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#161C2B] border border-[#21293D] flex flex-col justify-between space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-neutral-400 block">Total Monthly Disbursement</span>
                <span className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
                  ${totalPayroll.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-neutral-400 block">Privacy Guarantee</span>
                <span className="text-lg font-bold font-mono text-[#00E599]">
                  {privacyFactor}
                </span>
              </div>
              <div>
                <span className="text-xs text-neutral-400 block">Batch Gas Estimate</span>
                <span className="text-base font-bold font-mono text-neutral-100 tabular-nums">
                  {estimatedGasPot} POT
                </span>
              </div>
              <div>
                <span className="text-xs text-neutral-400 block">Settlement Time</span>
                <span className="text-base font-bold font-mono text-[#00E599]">
                  1 Block (~400ms)
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/app/settlement"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition"
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
        <h3 className="text-2xl font-bold text-neutral-100 mb-8">
          Enterprise Payroll Lifecycle
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#00E599]/10 text-[#00E599] font-mono font-bold flex items-center justify-center text-sm border border-[#00E599]/20">
              01
            </div>
            <h4 className="text-base font-semibold text-neutral-100">Deposit & Shield</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Corporate treasury deposits stablecoin or native assets into the shielded pool, converting balance to private commitment notes.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#00E599]/10 text-[#00E599] font-mono font-bold flex items-center justify-center text-sm border border-[#00E599]/20">
              02
            </div>
            <h4 className="text-base font-semibold text-neutral-100">Disburse Commitments</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Disburse notes to employee or contractor public keys. Amounts and individual associations remain completely shielded.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#00E599]/10 text-[#00E599] font-mono font-bold flex items-center justify-center text-sm border border-[#00E599]/20">
              03
            </div>
            <h4 className="text-base font-semibold text-neutral-100">Private Redemption</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Recipients redeem notes to any external wallet or withdraw to corporate accounts without linking back to employer treasury.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-3">
            <div className="w-8 h-8 rounded-lg bg-[#00E599]/10 text-[#00E599] font-mono font-bold flex items-center justify-center text-sm border border-[#00E599]/20">
              04
            </div>
            <h4 className="text-base font-semibold text-neutral-100">Auditor Export</h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Generate asymmetric viewing keys to export cryptographically verified reports for internal compliance officers and tax auditors.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="p-10 rounded-3xl border border-[#21293D] bg-gradient-to-r from-[#0E121B] to-[#161C2B] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-2xl font-bold text-neutral-100">Ready to Upgrade Your Corporate Payroll?</h3>
          <p className="text-sm text-neutral-400 mt-1 max-w-xl">
            Integrate confidential settlement into your enterprise finance workflow today.
          </p>
        </div>
        <Link
          href="/app/settlement"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition flex-shrink-0"
        >
          <span>Open Settlement App</span>
          <FiArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
