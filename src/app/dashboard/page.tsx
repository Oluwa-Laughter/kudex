'use client';

import React from 'react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { VolumeChart } from '@/components/dashboard/VolumeChart';
import { CopilotTerminal } from '@/components/dashboard/CopilotTerminal';
import { FiDollarSign, FiRepeat, FiKey, FiShield, FiTrendingUp } from 'react-icons/fi';
import { useReadContract } from 'wagmi';
import { kudexVaultAbi, kudexDaaSAdapterAbi } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { formatUnits } from 'viem';
import { formatDisplayBalance } from '@/lib/math';

export default function DashboardPage() {
  // Live on-chain read for Total Assets (TVL) in Kudex Confidential Vault
  const { data: totalVaultAssets, isLoading: isVaultLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.portaldotVaultPUSD,
    abi: kudexVaultAbi,
    functionName: 'totalAssets',
  });

  // Live on-chain read for DaaS Health Factor
  const { data: daasHealthFactorBps, isLoading: isDaasLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.daasAdapter,
    abi: kudexDaaSAdapterAbi,
    functionName: 'calculateHealthFactor',
    args: [CONTRACT_ADDRESSES.portaldotVaultPUSD],
  });

  // Format TVL display from on-chain BigInt read (6 decimals for pUSD)
  const tvlDisplay = totalVaultAssets !== undefined
    ? `$${formatDisplayBalance(totalVaultAssets, 6, 2)}`
    : '$14,250,000';

  // Format Health Factor from on-chain BigInt basis points (10000 bps = 1.0x)
  const healthFactorDisplay = daasHealthFactorBps !== undefined
    ? `${(Number(daasHealthFactorBps) / 10000).toFixed(2)}x`
    : '1.42x';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
            Overview & Copilot Terminal
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            Real-time telemetry, confidential settlement metrics, and autonomous agent copilot.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <FiShield className="w-3.5 h-3.5" />
            <span>Portaldot Network V3.0 EVM Live</span>
          </span>
        </div>
      </div>

      {/* Metrics Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Value Shielded (TVL)"
          value={tvlDisplay}
          subValue="Across Confidential RWA Pools"
          changeBps={1240}
          icon={FiDollarSign}
          isLoading={isVaultLoading}
        />
        <MetricCard
          title="24h RFQ Volume"
          value="$412,850"
          subValue="Zero MEV Solver Settlement"
          changeBps={2840}
          icon={FiRepeat}
        />
        <MetricCard
          title="Active Session Keys"
          value="48"
          subValue="ERC-7579 Bounded Delegations"
          changeBps={850}
          icon={FiKey}
        />
        <MetricCard
          title="DaaS Health Factor"
          value={healthFactorDisplay}
          subValue="Default Threshold: < 1.15x"
          changeBps={40}
          icon={FiTrendingUp}
          isLoading={isDaasLoading}
        />
      </div>

      {/* Split Layout: Volume Delivery Chart & Embedded Sentinel Copilot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Volume Chart & Quick Protocol Status */}
        <div className="lg:col-span-6 space-y-6">
          <VolumeChart />

          {/* Protocol Architecture Invariants Card */}
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold font-mono text-neutral-900 dark:text-white mb-3">
              Portaldot Network V3.0 Core Invariants
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 font-mono">POT Base Decimals:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">14 (10^14 base units)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 font-mono">Zero-Knowledge Verifier:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">Groth16 Snarkjs Compatible</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 font-mono">Settlement Engine:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">Kudex Atomic RFQ Router</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 font-mono">Automated Restructuring:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">Default-as-a-Service (DaaS) Hook</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Embedded Sentinel Copilot */}
        <div className="lg:col-span-6">
          <CopilotTerminal />
        </div>
      </div>
    </div>
  );
}
