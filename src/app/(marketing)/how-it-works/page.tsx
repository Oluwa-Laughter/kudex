'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiShield,
  FiRepeat,
  FiCpu,
  FiLock,
  FiCheckCircle,
  FiActivity,
  FiChevronDown,
  FiChevronUp,
  FiZap,
  FiDollarSign,
  FiTrendingUp,
  FiPlay,
} from 'react-icons/fi';
import { RiExchangeFundsLine, RiShieldCheckLine, RiRobot2Line, RiBankCardLine } from 'react-icons/ri';

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<'trading' | 'vaults' | 'transfers' | 'agent'>('trading');
  const [simStep, setSimStep] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const stepsData = {
    trading: [
      {
        step: 1,
        title: 'Submit Encrypted Intent',
        desc: 'You specify the asset pair and quantity you wish to trade. Your trade intent is shielded off-chain, ensuring public mempool bots cannot see your order size or target price.',
        action: 'Creating shielded order packet...',
      },
      {
        step: 2,
        title: 'Institutional Solvers Compete',
        desc: 'Approved liquidity solvers receive your encrypted RFQ. They compete off-chain to offer the tightest spread and lowest slippage without front-running your order.',
        action: '3 solvers submitted verified price quotes',
      },
      {
        step: 3,
        title: 'Atomic On-Chain Settlement',
        desc: 'The best quote is matched and settled in a single atomic transaction. You receive your new tokens directly with zero sandwich attacks and zero slippage.',
        action: 'Trade settled with 0% slippage in 180ms',
      },
    ],
    vaults: [
      {
        step: 1,
        title: 'Select Your Risk Tier',
        desc: 'Choose between Senior (capital-protected, steady 8.5% APY), Mezzanine (balanced 14.2% APY), or Junior (first-loss high yield 22.8% APY) tranches based on your risk tolerance.',
        action: 'Selected Senior Protected Tranche (8.5% APY)',
      },
      {
        step: 2,
        title: 'Deposit Assets to Shielded Vault',
        desc: 'Your capital is pooled into the audited treasury vault. You receive yield-bearing token receipts that continuously accrue automated interest.',
        action: 'Minting kUSDp yield receipts...',
      },
      {
        step: 3,
        title: 'Automated Solvency Defense',
        desc: 'If protocol risk telemetry detects market fluctuations, our automated restructuring algorithm safeguards senior principal before any losses occur.',
        action: 'Solvency Health Factor: 1.42x (Safe)',
      },
    ],
    transfers: [
      {
        step: 1,
        title: 'Generate Client-Side Shield',
        desc: 'When sending funds, your device computes a cryptographic balance commitment. Public blockchain explorers only see encrypted ciphertext.',
        action: 'Computing cryptographic note commitment...',
      },
      {
        step: 2,
        title: 'Relay Transaction Confidentially',
        desc: 'The transaction moves through the settlement network without linking your sender address to the recipient address in plaintext.',
        action: 'Shielded note confirmed on-chain',
      },
      {
        step: 3,
        title: 'Recipient Claims Instantly',
        desc: 'The recipient receives the funds immediately. If regulatory audits are required, you can generate a read-only compliance viewing key at any time.',
        action: 'Funds unlocked by recipient viewing key',
      },
    ],
    agent: [
      {
        step: 1,
        title: 'Set Your Execution Rules',
        desc: 'Define simple boundaries for Kudex Agent: maximum daily spending limit, acceptable slippage threshold, and expiration timeline.',
        action: 'Policy set: Max $1,000/day, stop-loss at -5%',
      },
      {
        step: 2,
        title: 'Delegate Bounded Session Key',
        desc: 'Grant temporary execution rights without revealing your master private keys. The agent can only execute trades that strictly adhere to your rules.',
        action: 'Session key initialized with 24h expiration',
      },
      {
        step: 3,
        title: 'Autonomous Monitoring & Action',
        desc: 'Kudex Agent monitors yields and liquidity 24/7, rebalancing your positions automatically while respecting your strict safety guardrails.',
        action: 'Agent rebalanced portfolio for +1.4% yield gain',
      },
    ],
  };

  const faqs = [
    {
      q: 'Do I need to undergo complex KYC to trade or earn on Kudex?',
      a: 'No. Kudex is completely non-custodial and decentralized. You simply connect your web3 wallet to trade, earn yield, and send transfers immediately. If you represent an institutional entity needing compliance reports, you can generate viewing keys on demand.',
    },
    {
      q: 'How does Kudex protect trades from MEV and front-running?',
      a: 'Traditional decentralized exchanges publish all pending swaps in a transparent public mempool, allowing predatory bots to front-run and sandwich your trades. Kudex routes swaps through off-chain competitive solvers using encrypted RFQs, guaranteeing the exact price quoted.',
    },
    {
      q: 'What makes the credit tranches safe during market downturns?',
      a: 'Kudex vaults utilize a waterfall tranche structure. Senior tranches have legal and cryptographic priority on all collateral and returns. Junior tranches absorb initial volatility in exchange for elevated returns, while our automated solvency module executes proactive debt restructuring if risk thresholds are approached.',
    },
    {
      q: 'Can I withdraw my deposited capital at any time?',
      a: 'Yes. Senior and Mezzanine vaults feature continuous liquidity reserves allowing instant redemptions back to your base stablecoin or token with zero lockup penalties.',
    },
    {
      q: 'Are my private transactions compliant with financial regulations?',
      a: 'Yes. Kudex incorporates opt-in asymmetric viewing keys. You maintain total privacy from competitors and public mempool surveillance, while retaining the cryptographic ability to generate read-only audit trails for tax authorities and auditors.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-[#131826] border border-slate-200 dark:border-[#1E2638] text-xs font-medium text-slate-700 dark:text-neutral-300 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Interactive Protocol Guide</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight max-w-4xl mx-auto leading-tight">
          How Kudex Settles Global Capital with Complete Privacy & Solvency
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
          From zero-slippage trading to protected institutional yield and autonomous agents,
          discover how Kudex keeps your transactions private while guaranteeing mathematical solvency.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/app/overview"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20"
          >
            <span>Launch Application</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#simulator"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-[#131826] hover:bg-slate-100 dark:hover:bg-[#1B2232] text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-[#1E2638] font-semibold text-sm transition"
          >
            <FiPlay className="w-4 h-4 text-emerald-500" />
            <span>Interactive Simulator</span>
          </a>
        </div>
      </section>

      {/* 4 Core Pillars Modular Tabs */}
      <section id="simulator" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
            Explore Kudex Core Capabilities
          </h2>
          <p className="mt-2 text-base text-slate-600 dark:text-neutral-400">
            Click through each flow below to inspect how every operation executes under the hood.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-[#131826] border border-slate-200 dark:border-[#1E2638] max-w-2xl mx-auto mb-12">
          <button
            onClick={() => { setActiveTab('trading'); setSimStep(1); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'trading'
                ? 'bg-white dark:bg-[#1B2232] text-slate-900 dark:text-neutral-100 shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RiExchangeFundsLine className="w-4 h-4 text-emerald-500" />
            <span>Private Trading</span>
          </button>

          <button
            onClick={() => { setActiveTab('vaults'); setSimStep(1); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'vaults'
                ? 'bg-white dark:bg-[#1B2232] text-slate-900 dark:text-neutral-100 shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiShield className="w-4 h-4 text-blue-500" />
            <span>Protected Yield</span>
          </button>

          <button
            onClick={() => { setActiveTab('transfers'); setSimStep(1); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'transfers'
                ? 'bg-white dark:bg-[#1B2232] text-slate-900 dark:text-neutral-100 shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RiBankCardLine className="w-4 h-4 text-emerald-500" />
            <span>Shielded Transfers</span>
          </button>

          <button
            onClick={() => { setActiveTab('agent'); setSimStep(1); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === 'agent'
                ? 'bg-white dark:bg-[#1B2232] text-slate-900 dark:text-neutral-100 shadow-sm'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RiRobot2Line className="w-4 h-4 text-purple-500" />
            <span>Kudex Agent</span>
          </button>
        </div>

        {/* Step-by-Step Interactive Workflow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 3 Step Cards */}
          <div className="lg:col-span-7 space-y-4">
            {stepsData[activeTab].map((item) => {
              const isSelected = simStep === item.step;
              return (
                <div
                  key={item.step}
                  onClick={() => setSimStep(item.step)}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white dark:bg-[#131826] border-emerald-500 shadow-md'
                      : 'bg-white/60 dark:bg-[#131826]/40 border-slate-200 dark:border-[#1E2638] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-100 dark:bg-[#1B2232] text-slate-600 dark:text-neutral-400'
                      }`}
                    >
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-neutral-100">
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                        {item.desc}
                      </p>
                      {isSelected && (
                        <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <FiCheckCircle className="w-3.5 h-3.5" />
                          <span>{item.action}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Live Interactive Sandbox Terminal */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#1E2638]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-500 dark:text-neutral-400 ml-2">
                    interactive-verifier
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  STEP {simStep} OF 3
                </span>
              </div>

              <div className="py-6 space-y-4">
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-neutral-500">
                  Current Execution State
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0D14] border border-slate-200 dark:border-[#1E2638] font-mono text-xs space-y-2 text-slate-700 dark:text-neutral-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Flow:</span>
                    <span className="text-slate-900 dark:text-neutral-100 font-semibold uppercase">{activeTab}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stage:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stepsData[activeTab][simStep - 1].title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Privacy Status:</span>
                    <span className="text-blue-500 font-semibold">Zero Mempool Leakage</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Solvency Invariant:</span>
                    <span className="text-emerald-500 font-semibold">Verified Safe (1.42x)</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-800 dark:text-neutral-200 leading-relaxed">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Key Benefit: </span>
                  {activeTab === 'trading' && 'No sandwich attacks or front-running can extract value from your swap.'}
                  {activeTab === 'vaults' && 'Your capital is backed by verifiable on-chain debt protection mechanics.'}
                  {activeTab === 'transfers' && 'Balance transfers happen without disclosing balances to blockchain surveillance tools.'}
                  {activeTab === 'agent' && 'Your master wallet keys remain safe in your hardware device or extension.'}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setSimStep((prev) => (prev % 3) + 1)}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-md"
                >
                  Advance to Step {(simStep % 3) + 1}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Grid: Kudex vs Traditional DeFi vs CeFi */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-200 dark:border-[#1E2638]">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
            How Kudex Compares
          </h2>
          <p className="mt-2 text-base text-slate-600 dark:text-neutral-400">
            See how confidential execution and solvency protection set Kudex apart from legacy platforms.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse rounded-2xl overflow-hidden border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1E2638] bg-slate-50 dark:bg-[#0A0D14] text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="p-4 sm:p-5">Feature</th>
                <th className="p-4 sm:p-5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10">Kudex Protocol</th>
                <th className="p-4 sm:p-5">Traditional AMMs</th>
                <th className="p-4 sm:p-5">Centralized Exchanges</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2638] text-sm text-slate-700 dark:text-neutral-300">
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-slate-900 dark:text-neutral-100">Trade Privacy</td>
                <td className="p-4 sm:p-5 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">Encrypted Off-Chain RFQ</td>
                <td className="p-4 sm:p-5 text-slate-500">Public Mempool (Front-run risk)</td>
                <td className="p-4 sm:p-5 text-slate-500">Internal database (Opaque)</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-slate-900 dark:text-neutral-100">Custody of Assets</td>
                <td className="p-4 sm:p-5 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">100% Non-Custodial</td>
                <td className="p-4 sm:p-5 text-slate-500">Non-Custodial</td>
                <td className="p-4 sm:p-5 text-rose-500 font-semibold">Full Custodial Risk (FTX/Celsius)</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-slate-900 dark:text-neutral-100">Solvency Guarantees</td>
                <td className="p-4 sm:p-5 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">Automated Debt Solvency Floor</td>
                <td className="p-4 sm:p-5 text-slate-500">None (Cascade liquidations)</td>
                <td className="p-4 sm:p-5 text-slate-500">Unverified / Self-reported</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-slate-900 dark:text-neutral-100">Automated Agent Execution</td>
                <td className="p-4 sm:p-5 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">Bounded Session Delegation</td>
                <td className="p-4 sm:p-5 text-slate-500">Requires Full Private Key Exposure</td>
                <td className="p-4 sm:p-5 text-slate-500">API keys with withdrawal risk</td>
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-semibold text-slate-900 dark:text-neutral-100">Regulatory Audit Keys</td>
                <td className="p-4 sm:p-5 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">Asymmetric Read-Only Viewing Keys</td>
                <td className="p-4 sm:p-5 text-slate-500">All data public to anyone</td>
                <td className="p-4 sm:p-5 text-slate-500">Manual CSV export requests</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-200 dark:border-[#1E2638]">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-base text-slate-600 dark:text-neutral-400">
            Common questions about using Kudex for institutional trading and private settlements.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] overflow-hidden transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4"
                >
                  <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-neutral-100">
                    {faq.q}
                  </span>
                  <div className="p-1 rounded-lg bg-slate-100 dark:bg-[#1B2232] text-slate-600 dark:text-neutral-400">
                    {isOpen ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-sm sm:text-base text-slate-600 dark:text-neutral-400 leading-relaxed border-t border-slate-100 dark:border-[#1E2638] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-3xl border border-slate-200 dark:border-[#1E2638] bg-slate-900 text-white p-10 sm:p-14 text-center relative overflow-hidden">
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Ready to Experience Confidential Web3 Finance?
          </h3>
          <p className="mt-4 text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Connect your wallet to start trading with zero MEV, deposit into protected yield tranches,
            or automate your workflow with Kudex Agent.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app/overview"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20"
            >
              <span>Enter Kudex App</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-neutral-200 border border-slate-700 font-semibold text-sm transition"
            >
              <span>Explore Marketplace</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
