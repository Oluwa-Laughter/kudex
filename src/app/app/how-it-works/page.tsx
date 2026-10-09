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
  FiDollarSign,
  FiTrendingUp,
  FiChevronDown,
  FiChevronUp,
  FiPlay,
  FiSliders,
} from 'react-icons/fi';
import { RiExchangeFundsLine, RiShieldCheckLine, RiRobot2Line, RiBankCardLine } from 'react-icons/ri';

export default function AppHowItWorksPage() {
  const [depositAmount, setDepositAmount] = useState(5000);
  const [activeTab, setActiveTab] = useState<'quickstart' | 'yield' | 'privacy'>('quickstart');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Yield calculations
  const seniorReturn = (depositAmount * 0.085).toFixed(2);
  const mezzanineReturn = (depositAmount * 0.142).toFixed(2);
  const juniorReturn = (depositAmount * 0.228).toFixed(2);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'How do I start trading or depositing assets on Kudex?',
      a: 'First, connect your Web3 wallet using the Connect Wallet button at the top right. Once connected, you can fund your wallet with testnet tokens, deposit into shielded yield vaults, or perform zero-slippage RFQ swaps directly.',
    },
    {
      q: 'How does client-side note shielding protect my balance?',
      a: 'When you shield assets, your browser generates a private cryptographic commitment note. Public observers and mempool tracking bots see only an encrypted transaction hash with zero plaintext balance or recipient details.',
    },
    {
      q: 'Can I withdraw my vault deposits at any time?',
      a: 'Yes. Senior and Mezzanine vaults maintain continuous liquidity reserves, allowing you to redeem your deposit and accrued interest back to your wallet at any time with no lockup penalties.',
    },
    {
      q: 'How does Kudex Agent work safely without stealing my keys?',
      a: 'Kudex Agent uses bounded delegation session keys. You define a maximum daily spending cap, permitted actions, and an expiration timestamp. The agent cannot withdraw funds outside of your whitelist, and you can revoke its permissions instantly with one click.',
    },
  ];

  return (
    <div className="space-y-8 w-full max-w-[1700px] mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#21293D]">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            How Kudex Works
          </h2>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-1.5">
            Complete walkthrough of private trading, institutional yield vaults, and autonomous agent execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/overview"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition shadow-sm"
          >
            <span>Go to Dashboard</span>
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Modular Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-[#21293D] pb-3">
        <button
          onClick={() => setActiveTab('quickstart')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'quickstart'
              ? 'bg-[#00E599] text-[#06080D] font-bold shadow-sm'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B]'
          }`}
        >
          <FiCheckCircle className="w-4 h-4" />
          <span>4-Step Quickstart</span>
        </button>

        <button
          onClick={() => setActiveTab('yield')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'yield'
              ? 'bg-[#00E599] text-[#06080D] font-bold shadow-sm'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B]'
          }`}
        >
          <FiTrendingUp className="w-4 h-4" />
          <span>Interactive Yield Calculator</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'privacy'
              ? 'bg-[#00E599] text-[#06080D] font-bold shadow-sm'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B]'
          }`}
        >
          <FiShield className="w-4 h-4" />
          <span>Privacy & Solvency</span>
        </button>
      </div>

      {/* Tab 1: 4-Step Quickstart */}
      {activeTab === 'quickstart' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-bold text-base mb-4 border border-emerald-500/20">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Connect Wallet
              </h3>
              <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
                Connect your preferred Web3 wallet using the button in the top right corner. Kudex works with all standard browser extensions and mobile wallets.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#21293D] text-sm font-semibold text-emerald-600 dark:text-[#00E599]">
                Non-custodial, no email or password needed
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-[#2E68FF] flex items-center justify-center font-bold text-base mb-4 border border-blue-500/20">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Fund Your Wallet
              </h3>
              <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
                Obtain testnet POT and pUSDC tokens from the community faucet or transfer assets across from other chains using the built-in Cross-Chain Bridge.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#21293D]">
                <Link
                  href="/app/bridge"
                  className="text-sm font-semibold text-blue-600 dark:text-[#2E68FF] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Open Bridge Gateway</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-bold text-base mb-4 border border-emerald-500/20">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Shield Balances or Earn Yield
              </h3>
              <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
                Deposit into protected credit tranches to earn up to 22.8% APY, or send confidential transfers to any address with zero public mempool leakage.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#21293D]">
                <Link
                  href="/app/vaults"
                  className="text-sm font-semibold text-emerald-600 dark:text-[#00E599] hover:underline inline-flex items-center gap-1.5"
                >
                  <span>View Earn Vaults</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-base mb-4 border border-purple-500/20">
                4
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Automate with Kudex Agent
              </h3>
              <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
                Configure bounded session limits and instruct Kudex Agent to execute trades, rebalance yields, and monitor solvency 24/7 without exposing your master keys.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#21293D]">
                <Link
                  href="/app/agents"
                  className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1.5"
                >
                  <span>Configure Agent</span>
                  <FiArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Yield Calculator */}
      {activeTab === 'yield' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Interactive Yield Simulator
            </h3>
            <p className="text-base text-slate-600 dark:text-neutral-400 mt-1.5">
              Select or slide your deposit amount to see projected 1-year earnings across our 3 risk tiers.
            </p>

            {/* Input and Presets */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-700 dark:text-neutral-300">
                  Simulated Deposit Amount
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                  Min: $500 | Max: $50,000
                </span>
              </div>

              <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] overflow-hidden focus-within:border-[#00E599] transition">
                <span className="pl-4 text-xl font-bold text-slate-500 dark:text-neutral-400 font-mono">$</span>
                <input
                  type="number"
                  min="500"
                  max="50000"
                  step="500"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2 py-4 bg-transparent font-bold text-2xl font-mono text-slate-900 dark:text-white outline-none tabular-nums"
                  placeholder="5000"
                />
                <span className="pr-4 text-sm font-mono font-bold text-emerald-600 dark:text-[#00E599]">pUSD</span>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {[1000, 5000, 10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      depositAmount === amt
                        ? 'bg-[#00E599] text-[#06080D] font-bold'
                        : 'bg-slate-100 dark:bg-[#161C2B] text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-[#21293D]'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Tranches Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-8 pt-6 border-t border-slate-200 dark:border-[#21293D]">
              {/* Senior */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]/50 flex flex-col justify-between">
                <div>
                  <div className="text-xs uppercase font-mono font-semibold text-slate-500 dark:text-neutral-400">
                    Senior Tranche (AAA)
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-2">
                    8.50% APY
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-[#00E599] font-semibold mt-1">
                    Capital Protected
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-[#21293D]">
                    <div className="text-xs font-mono text-slate-500 dark:text-neutral-400">Projected 1-Yr Profit:</div>
                    <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-[#00E599] tabular-nums mt-0.5">
                      +${Number(seniorReturn).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Link
                  href="/app/vaults"
                  className="mt-6 block w-full py-3 text-center rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition shadow-sm"
                >
                  Deposit Senior
                </Link>
              </div>

              {/* Mezzanine */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]/50 flex flex-col justify-between">
                <div>
                  <div className="text-xs uppercase font-mono font-semibold text-slate-500 dark:text-neutral-400">
                    Mezzanine Tranche (BBB)
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-2">
                    14.20% APY
                  </div>
                  <div className="text-sm text-blue-600 dark:text-[#2E68FF] font-semibold mt-1">
                    Balanced Risk / Return
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-[#21293D]">
                    <div className="text-xs font-mono text-slate-500 dark:text-neutral-400">Projected 1-Yr Profit:</div>
                    <div className="text-2xl font-bold font-mono text-blue-600 dark:text-[#2E68FF] tabular-nums mt-0.5">
                      +${Number(mezzanineReturn).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Link
                  href="/app/vaults"
                  className="mt-6 block w-full py-3 text-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition shadow-sm"
                >
                  Deposit Mezzanine
                </Link>
              </div>

              {/* Junior */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]/50 flex flex-col justify-between">
                <div>
                  <div className="text-xs uppercase font-mono font-semibold text-slate-500 dark:text-neutral-400">
                    Junior Tranche (Equity)
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white mt-2">
                    22.80% APY
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400 font-semibold mt-1">
                    First-Loss Max Return
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-[#21293D]">
                    <div className="text-xs font-mono text-slate-500 dark:text-neutral-400">Projected 1-Yr Profit:</div>
                    <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 tabular-nums mt-0.5">
                      +${Number(juniorReturn).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Link
                  href="/app/vaults"
                  className="mt-6 block w-full py-3 text-center rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition shadow-sm"
                >
                  Deposit Junior
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Privacy & Solvency Demystified */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center mb-4 border border-emerald-500/20">
                <FiLock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Confidential Note Commitments
              </h3>
              <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
                When you execute transfers or deposits, your device computes a mathematical commitment.
                The public blockchain records only the cryptographic proof that your balance is valid without revealing how much you own or who you sent it to.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-700 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Public mempool bots see zero plaintext data</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Prevents front-running and copy-trading</span>
                </li>
              </ul>
            </div>

            <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-[#2E68FF] flex items-center justify-center mb-4 border border-blue-500/20">
                <FiShield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Asymmetric Viewing Keys
              </h3>
              <p className="mt-2 text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
                Institutional entities require verifiable audits for tax authorities and fund compliance.
                Kudex allows you to export read-only viewing keys for specific accounts without granting spend permissions.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-slate-700 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Full regulatory compliance on demand</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-blue-500" />
                  <span>Auditors can verify without withdrawing funds</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Accordion FAQ */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-6 sm:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Common Questions
        </h3>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 dark:border-[#21293D] rounded-xl overflow-hidden bg-slate-50/50 dark:bg-[#161C2B]/30"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-base text-slate-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <FiChevronUp className="w-5 h-5 flex-shrink-0 text-slate-500" /> : <FiChevronDown className="w-5 h-5 flex-shrink-0 text-slate-500" />}
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-base text-slate-600 dark:text-neutral-400 leading-relaxed border-t border-slate-200/60 dark:border-[#21293D] mt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
