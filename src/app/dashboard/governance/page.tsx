'use client';

import React from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { kudexDaaSAdapterAbi, kudexVaultAbi } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { truncateAddress } from '@/lib/utils';
import {
  FiActivity,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiKey,
  FiLock,
  FiExternalLink,
} from 'react-icons/fi';
import { RiShieldCrossLine } from 'react-icons/ri';

export default function GovernanceDaaSPage() {
  const { isConnected } = useAccount();

  // Read DaaS Health Factor
  const { data: healthFactor } = useReadContract({
    address: CONTRACT_ADDRESSES.daasAdapter,
    abi: kudexDaaSAdapterAbi,
    functionName: 'calculateHealthFactor',
    args: [CONTRACT_ADDRESSES.portaldotVaultPUSD],
  });

  // Read Vault Risk Score
  const { data: riskScore } = useReadContract({
    address: CONTRACT_ADDRESSES.portaldotVaultPUSD,
    abi: kudexVaultAbi,
    functionName: 'riskScore',
  });

  // Read Vault Default status
  const { data: isDefaulted } = useReadContract({
    address: CONTRACT_ADDRESSES.portaldotVaultPUSD,
    abi: kudexVaultAbi,
    functionName: 'isDefaulted',
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleEnforceRestructuring = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.daasAdapter,
      abi: kudexDaaSAdapterAbi,
      functionName: 'evaluateAndEnforce',
      args: [CONTRACT_ADDRESSES.portaldotVaultPUSD],
    });
  };

  const healthFactorNumber = healthFactor ? Number(healthFactor) / 10000 : 1.42;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
            DAO Sentinel & DaaS Debt Restructuring
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            Autonomous Default-as-a-Service surveillance, algorithmic liquidation cascades, and ERC-7579 session policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <FiShield className="w-3.5 h-3.5" />
            <span>Sentinel Status: Surveillance Active</span>
          </span>
        </div>
      </div>

      {/* Sentinel Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-neutral-500 uppercase">Health Factor (HF)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FiActivity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {healthFactorNumber.toFixed(2)}x
          </div>
          <p className="text-[11px] font-mono text-neutral-400 mt-1">
            Critical Default Threshold: 1.15x
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-neutral-500 uppercase">Vault Risk Score</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FiShield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {riskScore !== undefined ? `${riskScore.toString()} Bps` : '1850 Bps'}
          </div>
          <p className="text-[11px] font-mono text-neutral-400 mt-1">
            Max Permitted: 8500 Bps (85.0%)
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-neutral-500 uppercase">Solvency Flag</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FiCheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {isDefaulted ? 'Default Triggered' : 'Fully Solvent'}
          </div>
          <p className="text-[11px] font-mono text-neutral-400 mt-1">
            Zero Restructuring Cascades Pending
          </p>
        </div>
      </div>

      {/* DaaS Surveillance Table & Restructuring Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Monitored Vaults */}
        <div className="lg:col-span-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-4">
            <div className="flex items-center gap-2">
              <RiShieldCrossLine className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                DaaS Monitored Vault Facilities
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-400">Portaldot V3.0 EVM</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400">
                  <th className="pb-3 font-medium">Vault Facility</th>
                  <th className="pb-3 font-medium">Collateral Ratio</th>
                  <th className="pb-3 font-medium">Risk Score</th>
                  <th className="pb-3 font-medium">Health Factor</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                <tr>
                  <td className="py-4">
                    <span className="font-bold text-neutral-900 dark:text-white block">
                      Kudex Senior RWA (k-pUSD)
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      {truncateAddress(CONTRACT_ADDRESSES.portaldotVaultPUSD)}
                    </span>
                  </td>
                  <td className="py-4 text-neutral-700 dark:text-neutral-300">120.0%</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                    18.5% (1850 bps)
                  </td>
                  <td className="py-4 font-bold text-emerald-600 dark:text-emerald-400">
                    {healthFactorNumber.toFixed(2)}x
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={handleEnforceRestructuring}
                      disabled={isPending || isConfirming || !isConnected}
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] transition disabled:opacity-50"
                    >
                      Audit & Enforce
                    </button>
                  </td>
                </tr>

                <tr>
                  <td className="py-4">
                    <span className="font-bold text-neutral-900 dark:text-white block">
                      POT Validator Yield (k-wPOT)
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      {truncateAddress(CONTRACT_ADDRESSES.portaldotVaultWPOT)}
                    </span>
                  </td>
                  <td className="py-4 text-neutral-700 dark:text-neutral-300">150.0%</td>
                  <td className="py-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                    12.0% (1200 bps)
                  </td>
                  <td className="py-4 font-bold text-emerald-600 dark:text-emerald-400">
                    1.65x
                  </td>
                  <td className="py-4 text-right">
                    <button
                      disabled
                      className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-400 text-[11px] opacity-60"
                    >
                      Optimal State
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {txHash && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between text-emerald-700 dark:text-emerald-300">
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4" />
                <span>{isConfirmed ? 'Audit Complete: Solvency Confirmed' : 'Executing DaaS Sentinel Hook...'}</span>
              </div>
              <a
                href={`https://testnet.portaldot.world/explorer/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono hover:underline"
              >
                {truncateAddress(txHash)}
                <FiExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* ERC-7579 Bounded Session Key Policies */}
        <div className="lg:col-span-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
            <FiKey className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
              ERC-7579 Session Policies
            </h3>
          </div>

          <p className="text-xs text-neutral-500 font-sans">
            Session keys delegate bounded execution authority to autonomous agents without prompt popups or private key disclosure.
          </p>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-400 block text-[10px] uppercase">Spending Ceiling</span>
              <span className="font-bold text-neutral-900 dark:text-white">500.00 POT (14 decimals)</span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-400 block text-[10px] uppercase">Whitelisted Router</span>
              <span className="font-bold text-neutral-900 dark:text-white break-all">
                {truncateAddress(CONTRACT_ADDRESSES.rfqMarketRouter, 8)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
              <span className="text-neutral-400 block text-[10px] uppercase">Session Lifetime</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">2 Hours Rolling TTL</span>
            </div>
          </div>

          <div className="pt-2">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <FiLock className="w-4 h-4 flex-shrink-0" />
              <span>Native transfers & account upgrades strictly locked.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
