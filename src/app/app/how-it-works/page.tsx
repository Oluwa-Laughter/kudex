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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1E2638]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
            How Kudex Works
          </h2>
          <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1">
            Complete walkthrough of private trading, institutional yield vaults, and autonomous agent execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/overview"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <span>Go to Dashboard</span>
            <FiArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Modular Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-[#1E2638] pb-3">
        <button
          onClick={() => setActiveTab('quickstart')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === 'quickstart'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#131826]'
          }`}
        >
          <FiCheckCircle className="w-4 h-4" />
          <span>4-Step Quickstart</span>
        </button>

        <button
          onClick={() => setActiveTab('yield')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === 'yield'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#131826]'
          }`}
        >
          <FiTrendingUp className="w-4 h-4" />
          <span>Interactive Yield Calculator</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === 'privacy'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#131826]'
          }`}
        >
          <FiShield className="w-4 h-4" />
          <span>Privacy & Solvency</span>
        </button>
      </div>

      {/* Tab 1: 4-Step Quickstart */}
      {activeTab === 'quickstart' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">
                Connect Wallet
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                Connect your preferred Web3 wallet using the button in the top right corner. Kudex works with all standard browser extensions and mobile wallets.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1E2638] text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Non-custodial, no email or password needed
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">
                Fund Your Wallet
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                Obtain testnet POT and pUSDC tokens from the community faucet or transfer assets across from other chains using the built-in Cross-Chain Bridge.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1E2638]">
                <Link
                  href="/app/bridge"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Bridge Gateway</span>
                  <FiArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">
                Shield Balances or Earn Yield
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                Deposit into protected credit tranches to earn up to 22.8% APY, or send confidential transfers to any address with zero public mempool leakage.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1E2638]">
                <Link
                  href="/app/vaults"
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>View Earn Vaults</span>
                  <FiArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm mb-4">
                4
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">
                Automate with Kudex Agent
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                Configure bounded session limits and instruct Kudex Agent to execute trades, rebalance yields, and monitor solvency 24/7 without exposing your master keys.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1E2638]">
                <Link
                  href="/app/agents"
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Configure Agent</span>
                  <FiArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Yield Calculator */}
      {activeTab === 'yield' && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-neutral-100">
              Interactive Yield Simulator
            </h3>
            <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1">
              Select or slide your deposit amount to see projected 1-year earnings across our 3 risk tiers.
            </p>

            {/* Slider and Presets */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-neutral-300">
                  Simulated Deposit Amount
                </span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ${depositAmount.toLocaleString()} pUSD
                </span>
              </div>

              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />

              <div className="flex flex-wrap gap-2 pt-1">
                {[1000, 5000, 10000, 25000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setDepositAmount(amt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      depositAmount === amt
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-100 dark:bg-[#1B2232] text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-[#252E42]'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Tranches Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-200 dark:border-[#1E2638]">
              {/* Senior */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-[#1E2638] bg-slate-50 dark:bg-[#0A0D14]">
                <div className="text-xs uppercase font-semibold text-slate-500 dark:text-neutral-400">
                  Senior Tranche
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1">
                  8.5% APY
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  Capital Protected
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#1E2638]">
                  <div className="text-xs text-slate-500">Projected 1-Yr Profit:</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +${Number(seniorReturn).toLocaleString()}
                  </div>
                </div>
                <Link
                  href="/app/vaults"
                  className="mt-4 block w-full py-2 text-center rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Deposit Senior
                </Link>
              </div>

              {/* Mezzanine */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-[#1E2638] bg-slate-50 dark:bg-[#0A0D14]">
                <div className="text-xs uppercase font-semibold text-slate-500 dark:text-neutral-400">
                  Mezzanine Tranche
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1">
                  14.2% APY
                </div>
                <div className="text-xs text-blue-500 font-semibold mt-1">
                  Balanced Risk / Return
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#1E2638]">
                  <div className="text-xs text-slate-500">Projected 1-Yr Profit:</div>
                  <div className="text-xl font-bold text-blue-500 tabular-nums">
                    +${Number(mezzanineReturn).toLocaleString()}
                  </div>
                </div>
                <Link
                  href="/app/vaults"
                  className="mt-4 block w-full py-2 text-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                >
                  Deposit Mezzanine
                </Link>
              </div>

              {/* Junior */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-[#1E2638] bg-slate-50 dark:bg-[#0A0D14]">
                <div className="text-xs uppercase font-semibold text-slate-500 dark:text-neutral-400">
                  Junior Tranche
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-neutral-100 mt-1">
                  22.8% APY
                </div>
                <div className="text-xs text-purple-500 font-semibold mt-1">
                  First-Loss Max Return
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#1E2638]">
                  <div className="text-xs text-slate-500">Projected 1-Yr Profit:</div>
                  <div className="text-xl font-bold text-purple-500 tabular-nums">
                    +${Number(juniorReturn).toLocaleString()}
                  </div>
                </div>
                <Link
                  href="/app/vaults"
                  className="mt-4 block w-full py-2 text-center rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
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
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826]">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <FiLock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">
                Confidential Note Commitments
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                When you execute transfers or deposits, your device computes a mathematical commitment.
                The public blockchain records only the cryptographic proof that your balance is valid without revealing how much you own or who you sent it to.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-700 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Public mempool bots see zero plain data</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Prevents front-running and copy-trading</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826]">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <FiShield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">
                Asymmetric Viewing Keys
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                Institutional entities require verifiable audits for tax authorities and fund compliance.
                Kudex allows you to export read-only viewing keys for specific accounts without granting spend permissions.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-slate-700 dark:text-neutral-300">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-3.5 h-3.5 text-blue-500" />
                  <span>Full regulatory compliance on demand</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-3.5 h-3.5 text-blue-500" />
                  <span>Auditors can verify without withdrawing funds</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Accordion FAQ */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-neutral-100 mb-4">
          Common Questions
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 dark:border-[#1E2638] rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-900 dark:text-neutral-100"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <FiChevronUp className="w-4 h-4 flex-shrink-0" /> : <FiChevronDown className="w-4 h-4 flex-shrink-0" />}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed border-t border-slate-100 dark:border-[#1E2638] mt-2">
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
