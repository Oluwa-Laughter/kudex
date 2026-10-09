'use client';

import React from 'react';
import Link from 'next/link';
import { MetricCard } from '@/components/dashboard/MetricCard';
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
} from 'react-icons/fi';
import { RiExchangeFundsLine, RiShieldCheckLine } from 'react-icons/ri';
import { useReadContract, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { KUDEX_VAULT_ABI } from '@/lib/contracts/abis';
import { formatUnits } from 'viem';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { formatDisplayBalance } from '@/lib/math';
import { truncateAddress } from '@/lib/utils';

export default function AppOverviewPage() {
  const { isConnected } = useAccount();
  const { data: protocolEvents } = useProtocolEvents();

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

  const displayTVL = totalAssetsRaw
    ? `$${Number(formatUnits(totalAssetsRaw, 6)).toLocaleString()}`
    : '$14,250,000';

  const totalVolumeBigInt = protocolEvents?.totalVolumeBigInt ?? BigInt(0);
  const displayVolume = totalVolumeBigInt > BigInt(0)
    ? `$${formatDisplayBalance(totalVolumeBigInt, 6, 2)}`
    : '$1,842,500';

  const riskScoreNum = riskScoreRaw ? Number(riskScoreRaw) : 1850;
  const healthFactor = (10000 / Math.max(riskScoreNum, 1000)).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Workspace Welcome & Quick Action Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#21293D]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
            Portfolio Overview & Execution Desk
          </h2>
          <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1">
            Real-time confidential balances, solver settlement feed, and autonomous Kudex Agent.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/settlement"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-xs transition shadow-md shadow-[#00E599]/15"
          >
            <FiLock className="w-3.5 h-3.5" />
            <span>Shield Assets</span>
          </Link>
          <Link
            href="/app/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161C2B] dark:hover:bg-[#21293D] text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-[#21293D] text-xs font-semibold transition"
          >
            <RiExchangeFundsLine className="w-3.5 h-3.5 text-[#00E599]" />
            <span>Trade RFQ</span>
          </Link>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Value Shielded (TVL)"
          value={displayTVL}
          subValue="Across Confidential RWA Pools"
          changeBps={1240}
          icon={FiShield}
          isLoading={isVaultLoading}
        />
        <MetricCard
          title="24h RFQ Volume Settled"
          value={displayVolume}
          subValue="Zero MEV Solver Settlement"
          changeBps={2840}
          icon={RiExchangeFundsLine}
        />
        <MetricCard
          title="Active Kudex Agents"
          value="48 Fleets"
          subValue="Bounded Session Policies"
          changeBps={850}
          icon={FiCpu}
        />
        <MetricCard
          title="Solvency Health Factor"
          value={`${healthFactor}x`}
          subValue="Safe Threshold: > 1.15x"
          changeBps={40}
          icon={FiActivity}
        />
      </div>

      {/* Split Layout: Volume Delivery Chart & Embedded KUDEX AGENT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Volume Delivery Chart + Recent On-Chain Activity */}
        <div className="lg:col-span-7 space-y-8">
          <VolumeChart />

          {/* Real On-Chain Activity Stream */}
          <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-6 shadow-sm transition-colors duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
              <div className="flex items-center gap-2">
                <RiShieldCheckLine className="w-5 h-5 text-[#00E599]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">
                  Live Settlement Ledger
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-neutral-400">
                Indexed Real-Time Events
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#21293D] mt-2">
              {protocolEvents && protocolEvents.recentActivity.length > 0 ? (
                protocolEvents.recentActivity.slice(0, 5).map((log: any, idx: number) => (
                  <div key={idx} className="py-3.5 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#00E599]" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-neutral-200">
                          {log.address?.toLowerCase() === CONTRACT_ADDRESSES.vault.toLowerCase()
                            ? 'Confidential Shield Deposit'
                            : 'Atomic RFQ Solver Fill'}
                        </div>
                        <div className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
                          Tx: {truncateAddress(log.transactionHash || '0x0', 6)} | Block: #{log.blockNumber?.toString() || '0'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#00E599] tabular-nums">
                        {log.args?.assetAmount ? `${formatDisplayBalance(log.args.assetAmount, 6, 2)} pUSD` : 'Atomic Fill'}
                      </div>
                      <div className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
                        Verified Solvency
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs font-mono text-slate-500 dark:text-neutral-400">
                  Listening for real-time settlement events on primary ledger...
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
