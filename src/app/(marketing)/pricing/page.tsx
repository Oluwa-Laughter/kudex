'use client';

import React from 'react';
import Link from 'next/link';
import {
  FiCheckCircle,
  FiArrowRight,
  FiShield,
  FiLock,
  FiLayers,
  FiCpu,
  FiHelpCircle,
} from 'react-icons/fi';
import { RiExchangeFundsLine } from 'react-icons/ri';

export default function PricingPage() {
  const faqs = [
    {
      q: 'Is Kudex non-custodial?',
      a: 'Yes. Kudex never takes custody of your funds. All deposits are governed entirely by autonomous smart contracts, and encrypted commitment notes are controlled solely by your private nullifiers.',
    },
    {
      q: 'Who can view my transaction history?',
      a: 'Only you. Public ledger observers and mempool trackers see only cryptographic commitments. You can selectively generate asymmetric viewing keys to grant read-only access to certified tax auditors or compliance officers.',
    },
    {
      q: 'What are the gas fees for confidential transfers?',
      a: 'Gas costs are calculated in native base units with sub-second finality. Typical confidential transfers and RFQ settlements consume less than $0.005 in network fees.',
    },
    {
      q: 'How does Default-as-a-Service (DaaS) generate protocol fees?',
      a: 'DaaS charges a 15 bps restructuring fee on debt positions undergoing algorithmic haircut recovery, which is distributed to protocol reserve pools and senior tranche depositors.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-6">
        <Link href="/" className="hover:text-white transition">
          Home
        </Link>
        <span>/</span>
        <span className="text-neutral-200">Pricing & Protocol Fee Schedule</span>
      </div>

      {/* Hero Header */}
      <div className="max-w-4xl space-y-4 mb-16 text-center mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E121B] border border-[#21293D] text-xs font-mono text-[#00E599]">
          <RiExchangeFundsLine className="w-3.5 h-3.5" />
          <span>TRANSPARENT INSTITUTIONAL SCHEDULE</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-100 tracking-tight leading-tight">
          Protocol Fee Schedules & Auditor SaaS Tiers
        </h1>
        <p className="text-base sm:text-lg text-neutral-400 leading-relaxed max-w-2xl mx-auto">
          Completely free open-source core contracts with low basis-point settlement fees.
          Optional enterprise compliance suites for institutional auditing.
        </p>
      </div>

      {/* Protocol Base Fee Schedule Grid */}
      <div className="mb-20">
        <h3 className="text-xl font-bold text-neutral-100 mb-6 text-center font-mono uppercase tracking-wider">
          On-Chain Protocol Base Fees
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] text-center space-y-2">
            <span className="text-xs font-mono text-neutral-400 uppercase">Shield Deposit</span>
            <div className="text-3xl font-extrabold font-mono text-[#00E599]">0 bps</div>
            <p className="text-xs text-neutral-400">100% Free deposit into confidential pools</p>
          </div>

          <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] text-center space-y-2">
            <span className="text-xs font-mono text-neutral-400 uppercase">RFQ Solver Settlement</span>
            <div className="text-3xl font-extrabold font-mono text-neutral-100">4 bps</div>
            <p className="text-xs text-neutral-400">0.04% solver fill and atomic execution fee</p>
          </div>

          <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] text-center space-y-2">
            <span className="text-xs font-mono text-neutral-400 uppercase">DaaS Debt Restructuring</span>
            <div className="text-3xl font-extrabold font-mono text-neutral-100">15 bps</div>
            <p className="text-xs text-neutral-400">Fee on algorithmic debt recovery cascades</p>
          </div>

          <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] text-center space-y-2">
            <span className="text-xs font-mono text-neutral-400 uppercase">Confidential Redemption</span>
            <div className="text-3xl font-extrabold font-mono text-neutral-100">2 bps</div>
            <p className="text-xs text-neutral-400">0.02% base network protocol maintenance</p>
          </div>
        </div>
      </div>

      {/* Auditor SaaS Tiers */}
      <div className="mb-20">
        <h3 className="text-xl font-bold text-neutral-100 mb-8 text-center font-mono uppercase tracking-wider">
          Auditor & Compliance SaaS Plans
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Tier 1: Community */}
          <div className="p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold">
                COMMUNITY DESK
              </span>
              <div className="text-4xl font-extrabold font-mono text-neutral-100">
                $0 <span className="text-sm font-sans font-normal text-neutral-400">/ forever</span>
              </div>
              <p className="text-xs text-neutral-400">
                Ideal for individual users and independent algorithmic traders
              </p>
              <ul className="space-y-3 text-xs text-neutral-300 pt-4 border-t border-[#21293D]">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
                  <span>Full access to open-source contracts</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
                  <span>Client-side note encryption</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
                  <span>Public RPC endpoints</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
                  <span>1 Active Kudex Agent session</span>
                </li>
              </ul>
            </div>
            <Link
              href="/app/overview"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#161C2B] hover:bg-[#21293D] text-xs font-semibold text-neutral-200 border border-[#21293D] transition"
            >
              <span>Get Started Free</span>
            </Link>
          </div>

          {/* Tier 2: Professional Desk */}
          <div className="p-8 rounded-2xl border border-[#00E599] bg-[#0E121B] flex flex-col justify-between space-y-6 relative shadow-2xl shadow-[#00E599]/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#00E599] text-[#06080D] font-mono font-bold text-xs">
              MOST POPULAR
            </div>
            <div className="space-y-4">
              <span className="text-xs font-mono text-[#00E599] uppercase tracking-wider font-semibold">
                PROFESSIONAL DESK
              </span>
              <div className="text-4xl font-extrabold font-mono text-neutral-100">
                $499 <span className="text-sm font-sans font-normal text-neutral-400">/ month</span>
              </div>
              <p className="text-xs text-neutral-400">
                Engineered for Web3 finance teams, hedge funds, and DAO treasuries
              </p>
              <ul className="space-y-3 text-xs text-neutral-300 pt-4 border-t border-[#21293D]">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
                  <span>Unlimited Kudex Agent sessions</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
                  <span>Automated viewing key audit exports</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
                  <span>Batch CSV payroll disbursement tooling</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
                  <span>Dedicated high-speed RPC node</span>
                </li>
              </ul>
            </div>
            <Link
              href="/app/compliance"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-xs transition"
            >
              <span>Start Pro Desk Trial</span>
            </Link>
          </div>

          {/* Tier 3: Enterprise */}
          <div className="p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold">
                ENTERPRISE INSTITUTIONAL
              </span>
              <div className="text-4xl font-extrabold font-mono text-neutral-100">
                $2,499 <span className="text-sm font-sans font-normal text-neutral-400">/ month</span>
              </div>
              <p className="text-xs text-neutral-400">
                Tailored for regulated financial institutions and multi-national payrolls
              </p>
              <ul className="space-y-3 text-xs text-neutral-300 pt-4 border-t border-[#21293D]">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#2E68FF]" />
                  <span>Custom DaaS reserve fund provisioning</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#2E68FF]" />
                  <span>White-glove auditor integration & sign-off</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#2E68FF]" />
                  <span>Custom private RPC cluster & SLA guarantees</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-[#2E68FF]" />
                  <span>24/7 dedicated engineering support</span>
                </li>
              </ul>
            </div>
            <Link
              href="/docs"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#161C2B] hover:bg-[#21293D] text-xs font-semibold text-neutral-200 border border-[#21293D] transition"
            >
              <span>Contact Institutional Sales</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-3xl mx-auto mb-16">
        <h3 className="text-2xl font-bold text-neutral-100 mb-8 text-center">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-2">
              <div className="flex items-center gap-2 text-base font-semibold text-neutral-100">
                <FiHelpCircle className="w-4 h-4 text-[#00E599]" />
                <span>{faq.q}</span>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
