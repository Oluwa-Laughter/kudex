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
    : '$0.00';

  const totalVolumeBigInt = protocolEvents?.totalVolumeBigInt ?? BigInt(0);
  const displayVolume = totalVolumeBigInt > BigInt(0)
    ? `$${formatDisplayBalance(totalVolumeBigInt, 6, 2)}`
    : '$0.00';

  const riskScoreNum = riskScoreRaw ? Number(riskScoreRaw) : 1850;
  const healthFactor = (10000 / Math.max(riskScoreNum, 1000)).toFixed(2);

  // Live Quote Calculator
  const [calcAmount, setCalcAmount] = useState('1000');
  const [calcPair, setCalcPair] = useState<'pUSD_wPOT' | 'wPOT_pUSD'>('pUSD_wPOT');
  const rate = calcPair === 'pUSD_wPOT' ? 1.034 : 0.967;
  const receiveEst = (parseFloat(calcAmount || '0') * rate).toFixed(4);

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-[#131826] border border-slate-200 dark:border-[#1E2638] text-sm font-semibold text-slate-700 dark:text-slate-300 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Decentralized Confidential Settlement</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            Confidential Settlement for Global Capital
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Execute private corporate disbursements, earn protected yield across fractionalized credit tranches,
            and trade without public mempool front-running.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/app/overview"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition shadow-lg shadow-emerald-500/20"
            >
              <span>Launch Application</span>
              <RiExchangeFundsLine className="w-5 h-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white dark:bg-[#131826] hover:bg-slate-100 dark:hover:bg-[#1B2232] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#1E2638] font-bold text-base transition"
            >
              <span>How It Works</span>
            </Link>
          </div>
        </div>

        {/* Live Instant Quote Calculator Widget */}
        <div className="mt-14 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] p-7 sm:p-9 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-[#1E2638]">
              <div>
                <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  Instant RFQ Liquidity Gateway
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Zero-Slippage Atomic Settlement
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Live Testnet Solvers Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0D14] border border-slate-200 dark:border-[#1E2638]">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">
                  You Offer
                </label>
                <div className="flex items-center justify-between mt-2">
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    className="bg-transparent font-bold text-2xl text-slate-900 dark:text-white outline-none w-36 tabular-nums"
                  />
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-200 dark:bg-[#1B2232] text-slate-800 dark:text-slate-200">
                    {calcPair === 'pUSD_wPOT' ? 'pUSD' : 'wPOT'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0D14] border border-slate-200 dark:border-[#1E2638]">
                <label className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">
                  Guaranteed Receive
                </label>
                <div className="flex items-center justify-between mt-2">
                  <div className="font-bold text-2xl text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {receiveEst}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {calcPair === 'pUSD_wPOT' ? 'wPOT' : 'pUSD'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-slate-100 dark:bg-[#0A0D14] text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-200 dark:border-[#1E2638]">
              <div>
                Privacy Commitment: <span className="text-slate-900 dark:text-slate-200 font-semibold">Zero Mempool Leakage</span>
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Slippage: 0.00% | Front-run Risk: 0%
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => setCalcPair(calcPair === 'pUSD_wPOT' ? 'wPOT_pUSD' : 'pUSD_wPOT')}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition"
              >
                Switch Token Direction &rarr;
              </button>
              <Link
                href="/app/marketplace"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-md shadow-emerald-500/20"
              >
                Execute Trade on Solver Desk
              </Link>
            </div>
          </div>
        </div>

        {/* Live Protocol Metrics */}
        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-5 p-6 rounded-2xl bg-white dark:bg-[#131826] border border-slate-200 dark:border-[#1E2638] shadow-sm">
          <div className="p-4 text-left">
            <div className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              Total Shielded Value
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-1">
              {displayTVL}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              On-Chain Capital Pools
            </div>
          </div>

          <div className="p-4 text-left">
            <div className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              24h Settled Volume
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-1">
              {displayVolume}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Zero Front-Running
            </div>
          </div>

          <div className="p-4 text-left">
            <div className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              Solvency Health
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-1">
              {healthFactor}x
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              Automated Solvency Floor
            </div>
          </div>

          <div className="p-4 text-left">
            <div className="text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              Active Agents
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-1">
              Bounded Policies
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Zero Key Exposure
            </div>
          </div>
        </div>
      </section>

      {/* Modular Capabilities */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200 dark:border-[#1E2638]">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Institutional Infrastructure Built for Scale
          </h2>
          <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
            Three dedicated modules engineered for privacy, risk mitigation, and algorithmic execution.
          </p>
        </div>

        {/* Feature Module 1: Enterprise Payroll */}
        <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] shadow-sm mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <span>Confidential Disbursements</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Enterprise Payroll with Zero Public Balance Leaks
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Pay global contractors, vendor invoices, and cross-border teams without disclosing company treasury
                balances or salary figures on transparent public explorers.
              </p>
              <div className="pt-4">
                <Link
                  href="/solutions/enterprise-payroll"
                  className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Explore Enterprise Payroll &rarr;</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0A0D14] border border-slate-200 dark:border-[#1E2638] space-y-3 text-sm">
                <div className="text-xs uppercase font-semibold text-slate-500 pb-2 border-b border-slate-200 dark:border-[#1E2638]">
                  Shielded Disbursement Breakdown
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#1E2638]">
                  <span className="text-slate-500">Sender Balance:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Encrypted</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#1E2638]">
                  <span className="text-slate-500">Recipients:</span>
                  <span className="text-slate-900 dark:text-white font-semibold">Shielded Note Receipts</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Public Explorer View:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">Zero Data Leaks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Split Modules 2 & 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Institutional Credit Tranches & Solvency Floor
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Deposit into Senior, Mezzanine, or Junior risk tiers. Automated solvency monitoring triggers proactive
                debt restructuring before liquidations cascade.
              </p>
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0A0D14] border border-slate-200 dark:border-[#1E2638] space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Senior Tranche:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">8.5% APY (Protected)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Mezzanine Tranche:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">14.2% APY (Balanced)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Junior Tranche:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">22.8% APY (Max Return)</span>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <Link
                href="/solutions/credit-tranches"
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Explore Credit Tranches &rarr;</span>
              </Link>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#131826] shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Kudex Agent with Bounded Session Keys
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Automate RFQ execution, stop-losses, and yield rebalancing. Grant temporary execution permissions
                with daily spend caps and instant revocation switches.
              </p>
              <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0A0D14] border border-slate-200 dark:border-[#1E2638] space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Delegation Model:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Bounded Session Policy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Max Spend Limit:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Strict Daily Ceiling</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Master Key Exposure:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">Zero (Keys Never Stored)</span>
                </div>
              </div>
            </div>
            <div className="pt-6">
              <Link
                href="/solutions/autonomous-agents"
                className="inline-flex items-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline"
              >
                <span>Explore Agent Architecture &rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pure Themed Call to Action Banner (Responsive in Both Light & Dark) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-3xl border border-slate-200 dark:border-[#21293D] bg-slate-100 dark:bg-[#0E121B] text-slate-900 dark:text-white p-10 sm:p-14 text-center relative overflow-hidden shadow-sm">
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Experience Confidential Decentralized Settlement
          </h3>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            Shield your first balance, deposit into audited yield vaults, or test Kudex Agent on our high-speed network.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app/overview"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition shadow-lg shadow-emerald-500/20"
            >
              <span>Launch Kudex Workspace</span>
              <RiExchangeFundsLine className="w-5 h-5" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white dark:bg-[#161C2B] hover:bg-slate-50 dark:hover:bg-[#21293D] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#21293D] font-bold text-base transition"
            >
              <span>Read How It Works</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
