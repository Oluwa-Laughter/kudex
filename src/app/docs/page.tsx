'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navigation/Navbar';
import {
  FiBook,
  FiLock,
  FiActivity,
  FiLayers,
  FiKey,
  FiShield,
  FiCode,
  FiCheckCircle,
  FiTerminal,
  FiArrowRight,
  FiDollarSign,
} from 'react-icons/fi';

const LIFECYCLE_STEPS = [
  {
    step: '01',
    title: 'RWA Tokenization & Senior Debt Structuring',
    icon: FiDollarSign,
    details:
      'Real-world debt claims—including supply-chain invoices, trade receivables, and fractionalized commercial real estate—are originated and tokenized under ERC-4626 standard vaults. Overcollateralization ratios are verified on-chain at 120% to 150%.',
  },
  {
    step: '02',
    title: 'Client-Side Groth16 Zero-Knowledge Note Commitments',
    icon: FiLock,
    details:
      'Depositors generate cryptographic commitments and nullifier pairs entirely within the client browser. No plain balance or identity metadata touches the public mempool. The on-chain Groth16 verifier evaluates elliptic curve pairings via EVM precompile address 0x08.',
  },
  {
    step: '03',
    title: 'Default-as-a-Service (DaaS) Surveillance',
    icon: FiActivity,
    details:
      'Autonomous Sentinel bots continuously compute credit health factors using on-chain risk scores. If vault risk breaches the 8,500 bps (85%) critical ceiling, the DaaS hook triggers an algorithmic liquidation cascade to restructure debt and preserve protocol solvency.',
  },
  {
    step: '04',
    title: 'Selective Disclosure & Viewing Key Auditing',
    icon: FiKey,
    details:
      'Commercial enterprises, payroll processors, and institutions can share selective viewing keys with regulators, tax authorities, or internal auditors. Auditors mathematically verify balance accuracy without exposing sensitive corporate payroll or counterparty trade secrets.',
  },
];

export function DocsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16">
        {/* Docs Header */}
        <div className="border-b border-neutral-200 dark:border-neutral-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-xs font-mono text-emerald-700 dark:text-emerald-400 mb-4">
            <FiBook className="w-3.5 h-3.5" />
            <span>Kudex Protocol Technical Specification v3.0</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-mono text-neutral-900 dark:text-white tracking-tight">
            Institutional Confidential Settlement & Architecture
          </h1>
          <p className="mt-4 text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-sans max-w-3xl leading-relaxed">
            Comprehensive reference manual for Kudex on Portaldot Network V3.0 EVM (Chain ID 8890). Learn how Zero-Knowledge note commitments, automated Default-as-a-Service debt restructuring, and selective viewing keys protect enterprise capital.
          </p>
        </div>

        {/* Section 1: Product Lifecycle */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FiLayers className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
              Complete Protocol Product Lifecycle
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {LIFECYCLE_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      PHASE {step.step}
                    </span>
                    <Icon className="w-5 h-5 text-neutral-500" />
                  </div>
                  <h3 className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                    {step.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans">
                    {step.details}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Enterprise Privacy vs Public Auditability */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FiShield className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
              Enterprise Privacy & Regulatory Auditability
            </h2>
          </div>

          <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
              Confidential Payroll & Invoice Shielding
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Public blockchain networks present severe operational risks for commercial operations: competitors can monitor vendor invoices, counterparty discounts, and executive payroll distributions simply by watching wallet addresses.
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Kudex solves this dual mandate by decoupling on-chain value transfer from identifying addresses. With client-side Groth16 commitments, payroll and invoice amounts settle as shielded notes. At the same time, institutions can generate asymmetric viewing keys to export cryptographically verified reports for compliance officers, auditors, or legal counsel.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  <span>Confidential Payroll</span>
                </div>
                <p className="text-neutral-500 text-[11px]">Salary flows shielded from public mempool surveillance.</p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  <span>Hidden Trade Terms</span>
                </div>
                <p className="text-neutral-500 text-[11px]">Vendor discounts and invoice values remain proprietary.</p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  <span>Audit On Demand</span>
                </div>
                <p className="text-neutral-500 text-[11px]">Export viewing keys for tax agencies with zero leakage.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Technical Specifications & Portaldot V3.0 EVM */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FiCode className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
              Portaldot Network V3.0 EVM Parameters
            </h2>
          </div>

          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden font-mono text-xs">
            <table className="w-full text-left">
              <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-neutral-500">
                <tr>
                  <th className="p-4">Parameter</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Enforcement Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                <tr>
                  <td className="p-4 font-semibold text-neutral-900 dark:text-white">Network Chain ID</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400">8890</td>
                  <td className="p-4 text-neutral-500">Strict Viem Chain Specification</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-neutral-900 dark:text-white">Native POT Precision</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400">14 Decimals (10^14 base units)</td>
                  <td className="p-4 text-neutral-500">Strict BigInt Math Engine</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-neutral-900 dark:text-white">Stablecoin Precision</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400">6 Decimals (pUSD)</td>
                  <td className="p-4 text-neutral-500">ERC-20 Standard Interface</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-neutral-900 dark:text-white">ZK Pairing Precompile</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400">address(0x08) [bn128]</td>
                  <td className="p-4 text-neutral-500">On-Chain Cryptographic Verifier</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-neutral-900 dark:text-white">DaaS Default Ceiling</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400">8,500 bps (85.00% Risk)</td>
                  <td className="p-4 text-neutral-500">Automated Algorithmic Cascades</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Call to Action Bar */}
        <div className="p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-emerald-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold font-mono text-neutral-900 dark:text-white">
              Ready to interact with Kudex on Portaldot V3.0?
            </h3>
            <p className="text-xs text-neutral-500 font-sans mt-0.5">
              Launch the live terminal to simulate deposits, execute RFQ swaps, and audit solvency.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs font-mono transition shadow-sm flex-shrink-0"
          >
            <FiTerminal className="w-4 h-4" />
            <span>Launch Sentinel Terminal</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default DocsPage;
