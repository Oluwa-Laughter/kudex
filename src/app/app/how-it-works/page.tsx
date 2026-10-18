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
  FiExternalLink,
} from 'react-icons/fi';
import { RiExchangeFundsLine, RiShieldCheckLine, RiRobot2Line, RiBankCardLine } from 'react-icons/ri';

export default function AppHowItWorksPage() {
  const [depositAmount, setDepositAmount] = useState(5000);
  const [activeTab, setActiveTab] = useState<'quickstart' | 'yield' | 'privacy' | 'architecture'>('quickstart');
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
    {
      q: 'Does EVM compatibility require replacing Portaldot’s underlying network architecture?',
      a: 'No. EVM compatibility does not require replacing the underlying network architecture. Portaldot 3.0 introduces EVM-compatible execution through the revive module, extending smart contract execution capabilities while keeping Portaldot as the underlying Substrate protocol environment. EVM Solidity execution and native ink! contracts run in parallel on the same Portaldot network without requiring the network itself to become an EVM chain.',
    },
    {
      q: 'Where can I inspect contract execution and block state?',
      a: 'All blocks, extrinsics, and state transitions are verified on-chain via the Portaldot network. Kudex smart contracts emit standard EVM events and zero-knowledge state updates, allowing complete institutional audibility without plaintext leakage.',
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

        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'architecture'
              ? 'bg-[#00E599] text-[#06080D] font-bold shadow-sm'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B]'
          }`}
        >
          <FiCpu className="w-4 h-4" />
          <span>Portaldot 3.0 Architecture</span>
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
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-bold text-base mb-4 border border-emerald-500/20">
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
                  className="text-sm font-semibold text-emerald-600 dark:text-[#00E599] hover:underline inline-flex items-center gap-1.5"
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
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-bold text-base mb-4 border border-emerald-500/20">
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
                  className="text-sm font-semibold text-emerald-600 dark:text-[#00E599] hover:underline inline-flex items-center gap-1.5"
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
                  <div className="text-sm text-emerald-600 dark:text-[#00E599] font-semibold mt-1">
                    Balanced Risk / Return
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-[#21293D]">
                    <div className="text-xs font-mono text-slate-500 dark:text-neutral-400">Projected 1-Yr Profit:</div>
                    <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5">
                      +${Number(mezzanineReturn).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Link
                  href="/app/vaults"
                  className="mt-6 block w-full py-3 text-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#21293D] dark:hover:bg-[#2c364f] text-slate-900 dark:text-white font-bold text-sm transition shadow-sm"
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
                  <div className="text-sm text-emerald-600 dark:text-[#00E599] font-semibold mt-1">
                    First-Loss Max Return
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-[#21293D]">
                    <div className="text-xs font-mono text-slate-500 dark:text-neutral-400">Projected 1-Yr Profit:</div>
                    <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5">
                      +${Number(juniorReturn).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Link
                  href="/app/vaults"
                  className="mt-6 block w-full py-3 text-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#21293D] dark:hover:bg-[#2c364f] text-slate-900 dark:text-white font-bold text-sm transition shadow-sm"
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
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center mb-4 border border-emerald-500/20">
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
                  <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Full regulatory compliance on demand</span>
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Auditors can verify without withdrawing funds</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Portaldot 3.0 Architecture & Coexistence */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm space-y-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] text-xs font-mono font-bold mb-3 border border-emerald-500/20">
                PORTALDOT 3.0 DUAL EXECUTION
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                EVM & ink! Parallel Coexistence
              </h3>
              <p className="mt-3 text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
                EVM compatibility does not require replacing the underlying network architecture.
                Portaldot 3.0 introduces EVM-compatible execution through the <span className="font-semibold text-slate-900 dark:text-white">revive module</span>,
                extending smart contract execution capabilities while maintaining Portaldot as the underlying Substrate protocol environment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-[#161C2B]/60 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-[#00E599] flex items-center justify-center font-mono font-bold text-sm">
                  EVM
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Revive Module EVM Execution
                </h4>
                <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                  Solidity contracts deployable using standard Ethereum tooling (viem, wagmi, MetaMask, Rabby, Hardhat, Foundry). Provides a seamless path for EVM developers without forcing the network to become an EVM chain.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]/60 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-[#21293D] text-slate-900 dark:text-white flex items-center justify-center font-mono font-bold text-sm">
                  ink!
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Native Substrate Execution
                </h4>
                <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                  For existing Portaldot developers, ink! remains available rather than being phased out. Different execution models operate concurrently on the same protocol, allowing protocols to choose their ideal execution environment.
                </p>
              </div>
            </div>

            {/* Official Portaldot 3.0 Architecture Capabilities */}
            <div className="pt-4 border-t border-slate-100 dark:border-[#21293D]">
              <div className="text-xs font-mono uppercase text-slate-500 dark:text-neutral-400 font-semibold mb-4">
                Portaldot 3.0 Architecture Capabilities
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]">
                  <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">Revive Module</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">EVM Execution</div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    Solidity runtime running in parallel with ink! contracts.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]">
                  <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">DHSA Sharding</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">256 Shards • 10k TPS</div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    Dynamic heterogeneous sharding for sub-second confirmation.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]">
                  <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">Asset Engine Layer</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">Physical RWA Engine</div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    Direct on-chain standardization of real-world collateral.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]">
                  <div className="text-xs font-mono text-emerald-600 dark:text-[#00E599] font-bold">LAO NPoS Consensus</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">Deterministic Finality</div>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                    Linear attenuation offset staking with dynamic inflation reduction.
                  </p>
                </div>
              </div>
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
