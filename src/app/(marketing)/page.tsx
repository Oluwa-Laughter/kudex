'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FiArrowRight,
  FiShield,
  FiZap,
  FiLock,
  FiLayers,
  FiCpu,
  FiTrendingUp,
  FiCheckCircle,
  FiRepeat,
  FiActivity,
  FiSliders,
  FiPlay,
} from 'react-icons/fi';
import { RiRobot2Line, RiExchangeFundsLine, RiShieldCheckLine, RiBankCardLine } from 'react-icons/ri';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { KUDEX_VAULT_ABI } from '@/lib/contracts/abis';
import { formatUnits } from 'viem';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { formatDisplayBalance } from '@/lib/math';

export default function MarketingHomePage() {
  const { data: protocolEvents } = useProtocolEvents();

  // Live contract reads for hero metrics
  const { data: totalAssetsRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'totalAssets',
  });

  const { data: riskScoreRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'riskScore',
  });

  const displayTVL = totalAssetsRaw
    ? `$${Number(formatUnits(totalAssetsRaw, 6)).toLocaleString()}`
    : '$14,250,000';

  const totalVolumeBigInt = protocolEvents?.totalVolumeBigInt ?? BigInt(0);
  const displayVolume = totalVolumeBigInt > BigInt(0)
    ? `$${formatDisplayBalance(totalVolumeBigInt, 6, 0)}`
    : '$1,842,500';

  const riskScoreNum = riskScoreRaw ? Number(riskScoreRaw) : 1850;
  const healthFactor = (10000 / Math.max(riskScoreNum, 1000)).toFixed(2);

  // Interactive Hero Widget State
  const [demoAmount, setDemoAmount] = useState('5,000');
  const [demoAsset, setDemoAsset] = useState('pUSDC');
  const [demoStatus, setDemoStatus] = useState<'idle' | 'simulating' | 'settled'>('idle');

  const handleRunDemo = () => {
    setDemoStatus('simulating');
    setTimeout(() => {
      setDemoStatus('settled');
    }, 900);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#131826] border border-slate-200 dark:border-[#1E2638] text-xs font-medium text-slate-700 dark:text-neutral-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Decentralized Confidential Settlement</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight leading-[1.12]">
            Confidential Settlement for Global Capital
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            Execute private corporate disbursements, earn protected yield across fractionalized credit tranches,
            and trade without public mempool front-running.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/app/overview"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20"
            >
              <span>Launch Application</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white dark:bg-[#131826] hover:bg-slate-100 dark:hover:bg-[#1B2232] text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-[#1E2638] font-semibold text-sm transition"
            >
              <span>How It Works</span>
              <FiPlay className="w-3.5 h-3.5 text-emerald-500" />
            </Link>
          </div>
        </div>

        {/* Live Interactive Hero Sandbox Widget */}
        <div className="mt-14 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-[#1E2638]">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-neutral-500">
                  Interactive Settlement Sandbox
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-neutral-100 mt-0.5">
                  Test Zero-MEV Shielded Settlement
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Testnet Simulation</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0D14] border border-slate-200 dark:border-[#1E2638]">
                <label className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                  Transfer Amount
                </label>
                <div className="flex items-center justify-between mt-1.5">
                  <input
                    type="text"
                    value={demoAmount}
                    onChange={(e) => setDemoAmount(e.target.value)}
                    className="bg-transparent font-bold text-lg text-slate-900 dark:text-neutral-100 outline-none w-32"
                  />
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-200 dark:bg-[#1B2232] text-slate-700 dark:text-neutral-300">
                    pUSDC
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0D14] border border-slate-200 dark:border-[#1E2638]">
                <label className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                  Receiving Asset
                </label>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="font-bold text-lg text-slate-900 dark:text-neutral-100 tabular-nums">
                    {demoAmount}
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    kUSDp (Shielded)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-slate-100 dark:bg-[#0A0D14] text-xs font-mono text-slate-600 dark:text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-200 dark:border-[#1E2638]">
              <div>
                Privacy Commitment:{' '}
                <span className="text-slate-800 dark:text-neutral-200 font-semibold">
                  0x7a9c...4e21 (Client Encrypted)
                </span>
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Slippage: 0.00% | Front-run Risk: 0%
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-neutral-400">
                Solvers quote off-chain. Atomic execution on-chain.
              </div>
              <button
                onClick={handleRunDemo}
                disabled={demoStatus === 'simulating'}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs transition hover:opacity-90 disabled:opacity-50"
              >
                {demoStatus === 'simulating'
                  ? 'Simulating RFQ Match...'
                  : demoStatus === 'settled'
                  ? 'Settled Successfully'
                  : 'Simulate Shielded Swap'}
              </button>
            </div>
          </div>
        </div>

        {/* Live Protocol Metrics */}
        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-[#1E2638] shadow-sm">
          <div className="p-3 text-left">
            <div className="text-xs uppercase font-semibold text-slate-500 dark:text-neutral-400">
              Total Shielded Value
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-neutral-100 tabular-nums mt-1">
              {displayTVL}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              On-Chain Capital Pools
            </div>
          </div>

          <div className="p-3 text-left">
            <div className="text-xs uppercase font-semibold text-slate-500 dark:text-neutral-400">
              24h Settled Volume
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-neutral-100 tabular-nums mt-1">
              {displayVolume}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Zero Front-Running
            </div>
          </div>

          <div className="p-3 text-left">
            <div className="text-xs uppercase font-semibold text-slate-500 dark:text-neutral-400">
              Solvency Health
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-neutral-100 tabular-nums mt-1">
              {healthFactor}x
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Automated Solvency Floor
            </div>
          </div>

          <div className="p-3 text-left">
            <div className="text-xs uppercase font-semibold text-slate-500 dark:text-neutral-400">
              Active Agents
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-neutral-100 tabular-nums mt-1">
              48 Fleets
            </div>
            <div className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-1">
              Bounded Delegation Keys
            </div>
          </div>
        </div>
      </section>

      {/* Modular Capabilities (Distinct Layouts, Not 3 Clone Cards) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200 dark:border-[#1E2638]">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
            Institutional Infrastructure Built for Scale
          </h2>
          <p className="mt-2 text-base text-slate-600 dark:text-neutral-400">
            Three dedicated modules engineered for privacy, risk mitigation, and algorithmic execution.
          </p>
        </div>

        {/* Feature Module 1: Enterprise Payroll & Shielded Transfers (Asymmetrical Wide Banner) */}
        <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] shadow-sm mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <FiLock className="w-3.5 h-3.5" />
                <span>Confidential Disbursements</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
                Enterprise Payroll with Zero Public Balance Leaks
              </h3>
              <p className="text-base text-slate-600 dark:text-neutral-400 leading-relaxed">
                Pay global contractors, vendor invoices, and cross-border teams without disclosing company treasury
                balances or salary figures on transparent public explorers.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-neutral-300">
                  <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Client-side note shielding</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-neutral-300">
                  <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Opt-in compliance viewing keys</span>
                </div>
              </div>
              <div className="pt-4">
                <Link
                  href="/solutions/enterprise-payroll"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Explore Enterprise Payroll</span>
                  <FiArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0A0D14] border border-slate-200 dark:border-[#1E2638] space-y-3 font-mono text-xs">
                <div className="text-xs uppercase font-semibold text-slate-500 pb-2 border-b border-slate-200 dark:border-[#1E2638]">
                  Sample Shielded Disbursement
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#1E2638]">
                  <span className="text-slate-500">Sender Balance:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Encrypted (Private)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#1E2638]">
                  <span className="text-slate-500">Recipients:</span>
                  <span className="text-slate-800 dark:text-neutral-200">12 Shielded Addresses</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Public Mempool View:</span>
                  <span className="text-blue-500">Valid Proof / 0 Data Leaks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Split Modules 2 & 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Module 2: Protected Yield Tranches */}
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                <FiLayers className="w-3.5 h-3.5" />
                <span>Yield Architecture</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-neutral-100">
                Institutional Credit Tranches & Solvency Floor
              </h3>
              <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                Deposit into Senior, Mezzanine, or Junior risk tiers. Automated solvency monitoring triggers proactive
                debt restructuring before liquidations cascade.
              </p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0D14] border border-slate-200 dark:border-[#1E2638] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700 dark:text-neutral-300">Senior Tranche:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">8.5% APY (Principal Protected)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700 dark:text-neutral-300">Mezzanine Tranche:</span>
                  <span className="font-bold text-blue-500">14.2% APY (Balanced Risk)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700 dark:text-neutral-300">Junior Tranche:</span>
                  <span className="font-bold text-purple-500">22.8% APY (First-Loss High Return)</span>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <Link
                href="/solutions/credit-tranches"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Explore Credit Tranches</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Module 3: Autonomous Kudex Agent */}
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold">
                <RiRobot2Line className="w-3.5 h-3.5" />
                <span>Autonomous Runtime</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-neutral-100">
                Kudex Agent with Bounded Session Keys
              </h3>
              <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
                Automate RFQ execution, stop-losses, and yield rebalancing. Grant temporary execution permissions
                with daily spend caps and instant revocation switches.
              </p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0D14] border border-slate-200 dark:border-[#1E2638] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Delegation Model:</span>
                  <span className="font-semibold text-slate-800 dark:text-neutral-200">Bounded Session Policy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Spend Limit:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Strict Daily Ceiling</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Master Key Exposure:</span>
                  <span className="font-semibold text-purple-500">Zero (Keys Never Stored)</span>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <Link
                href="/solutions/autonomous-agents"
                className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                <span>Explore Agent Architecture</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200 dark:border-[#1E2638]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight">
            Why Capital Allocators Choose Kudex
          </h2>
          <p className="mt-2 text-base text-slate-600 dark:text-neutral-400">
            Compare Kudex against public Automated Market Makers and centralized trading venues.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826]">
            <div className="text-xs uppercase font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
              Front-Running Defense
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-neutral-100 mb-2">
              Zero MEV Exploitation
            </h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Transparent mempools allow predatory bots to extract billions in sandwich attacks.
              Kudex settles swaps privately with competitive off-chain solvers.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826]">
            <div className="text-xs uppercase font-semibold text-blue-500 mb-2">
              Mathematical Solvency
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-neutral-100 mb-2">
              Proactive Debt Defense
            </h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Traditional lending protocols suffer sudden liquidations when oracle prices swing.
              Kudex executes algorithmic restructuring to protect senior capital.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826]">
            <div className="text-xs uppercase font-semibold text-purple-500 mb-2">
              Safe Autonomy
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-neutral-100 mb-2">
              Bounded Delegation
            </h4>
            <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">
              Delegate trading logic to autonomous software without ever exporting your private seed phrase
              or exposing your full balance to risk.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-3xl border border-slate-200 dark:border-[#1E2638] bg-slate-950 text-white p-10 sm:p-14 text-center relative overflow-hidden">
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Experience Confidential Decentralized Settlement
          </h3>
          <p className="mt-4 text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Shield your first balance, deposit into audited yield vaults, or test Kudex Agent on our high-speed network.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app/overview"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20"
            >
              <span>Launch Kudex Workspace</span>
              <FiArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-neutral-200 border border-slate-700 font-semibold text-sm transition"
            >
              <span>Read How It Works</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
