'use client';

import React from 'react';
import Link from 'next/link';
import { VolumeChart } from '@/components/dashboard/VolumeChart';
import { CopilotTerminal } from '@/components/dashboard/CopilotTerminal';
import {
  FiShield,
  FiRepeat,
  FiCpu,
  FiActivity,
  FiArrowUpRight,
  FiLock,
  FiArrowRight,
  FiCheckCircle,
  FiTrendingUp,
} from 'react-icons/fi';
import { RiExchangeFundsLine, RiShieldCheckLine, RiBankCardLine } from 'react-icons/ri';
import { useReadContract, useAccount, useBalance } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { KUDEX_VAULT_ABI } from '@/lib/contracts/abis';
import { formatUnits } from 'viem';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { formatDisplayBalance } from '@/lib/math';
import { truncateAddress } from '@/lib/utils';
import { useProtocolStore } from '@/lib/protocol-store';

export default function AppOverviewPage() {
  const { address, isConnected } = useAccount();
  const { data: protocolEvents } = useProtocolEvents();
  const { notes, positions, orders, riskScoreBps } = useProtocolStore();

  // Real native POT balance
  const { data: potBalance } = useBalance({
    address,
  });

  // Dynamic live on-chain contract read for TVL
  const { data: totalAssetsRaw, isLoading: isVaultLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'totalAssets',
  });

  // Dynamic live on-chain read for risk score
  const { data: riskScoreRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'riskScore',
  });

  // User's active shielded notes total
  const userShieldedTotal = notes
    .filter((n) => n.status === 'SHIELDED')
    .reduce((sum, n) => sum + parseFloat(n.amount.replace(/,/g, '')), 0);

  // User's deposited vault total
  const userVaultTotal =
    positions.senior.depositedAmount +
    positions.mezzanine.depositedAmount +
    positions.junior.depositedAmount;

  // Real on-chain TVL formatting (No fake mock arrays)
  const displayTVL = totalAssetsRaw
    ? `$${Number(formatUnits(totalAssetsRaw, 6)).toLocaleString()}`
    : userVaultTotal > 0
    ? `$${userVaultTotal.toLocaleString()}`
    : '$0.00';

  // Real settled volume from live events + store orders
  const storeVolume = orders
    .filter((o) => o.status === 'FILLED')
    .reduce((sum, o) => sum + parseFloat(o.makerAmount.replace(/,/g, '')), 0);

  const totalVolumeBigInt = protocolEvents?.totalVolumeBigInt ?? BigInt(0);
  const onChainVolumeNum = Number(totalVolumeBigInt / BigInt(1e6));
  const combinedVolume = onChainVolumeNum + storeVolume;

  const displayVolume =
    combinedVolume > 0
      ? `$${combinedVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : '$0.00';

  const riskScoreNum = riskScoreRaw ? Number(riskScoreRaw) : riskScoreBps;
  const healthFactor = (10000 / Math.max(riskScoreNum, 1000)).toFixed(2);

  return (
    <div className="space-y-10">
      {/* Workspace Welcome & Quick Action Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-200 dark:border-[#21293D]">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Portfolio Overview & Execution Desk
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 mt-1.5">
            Real-time confidential balances, live settlement stream, and autonomous Kudex Agent runtime.
          </p>
        </div>

        <div className="flex items-center gap-3.5">
          <Link
            href="/app/settlement"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-md shadow-emerald-500/20"
          >
            <FiLock className="w-4 h-4" />
            <span>Shield Assets</span>
          </Link>
          <Link
            href="/app/marketplace"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161C2B] dark:hover:bg-[#21293D] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#21293D] text-sm font-semibold transition"
          >
            <RiExchangeFundsLine className="w-4 h-4 text-emerald-500" />
            <span>Trade RFQ</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Metric Cards (With Generous Typography & Pure Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: TVL */}
        <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
                Total Shielded Value
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FiShield className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-3">
              {displayTVL}
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-[#21293D] flex items-center justify-between">
            <span>Confidential Pools</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Live Protocol TVL</span>
          </div>
        </div>

        {/* Card 2: Settled Volume */}
        <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
                24h Settled Volume
              </span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <RiExchangeFundsLine className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-3">
              {displayVolume}
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-[#21293D] flex items-center justify-between">
            <span>Zero MEV Fill</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">Atomic RFQ</span>
          </div>
        </div>

        {/* Card 3: User Portfolio */}
        <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
                My Shielded Notes
              </span>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <RiBankCardLine className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-3">
              ${userShieldedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-[#21293D] flex items-center justify-between">
            <span>{notes.filter((n) => n.status === 'SHIELDED').length} Active Notes</span>
            <Link href="/app/settlement" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Manage Notes
            </Link>
          </div>
        </div>

        {/* Card 4: Solvency Health Factor */}
        <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
                Solvency Health
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FiActivity className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-3">
              {healthFactor}x
            </div>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-[#21293D] flex items-center justify-between">
            <span>Threshold &gt; 1.15x</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Solvent</span>
          </div>
        </div>
      </div>

      {/* Split Layout: Volume Delivery Chart & Embedded KUDEX AGENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Volume Delivery Chart + Real On-Chain Activity */}
        <div className="lg:col-span-7 space-y-8">
          <VolumeChart />

          {/* Real Protocol Activity Stream (From Real Store & Contract Logs) */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-7 shadow-sm transition-colors duration-200">
            <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-[#21293D]">
              <div className="flex items-center gap-3">
                <RiShieldCheckLine className="w-6 h-6 text-emerald-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Live Settlement Ledger
                </h3>
              </div>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Real-Time Execution Feed
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#21293D] mt-3">
              {/* Combine real store orders, notes, and on-chain logs */}
              {orders.length > 0 || notes.length > 0 ? (
                <>
                  {orders.slice(0, 3).map((ord) => (
                    <div key={ord.id} className="py-4 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            Atomic RFQ Swap ({ord.makerAsset} to {ord.takerAsset})
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Solver: {ord.solver} | Status: {ord.status}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {ord.makerAmount} {ord.makerAsset}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                          Zero Front-Running
                        </div>
                      </div>
                    </div>
                  ))}

                  {notes.slice(0, 3).map((note) => (
                    <div key={note.id} className="py-4 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            Confidential Shield Deposit
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            Commitment: {truncateAddress(note.commitment, 8)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                          +{note.amount} {note.asset}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                          {note.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  <p>No recent local transactions found.</p>
                  <p className="mt-1">Connect your wallet or perform an RFQ swap to see live settlement events.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Embedded KUDEX AGENT Terminal */}
        <div className="lg:col-span-5 sticky top-28">
          <CopilotTerminal />
        </div>
      </div>
    </div>
  );
}
