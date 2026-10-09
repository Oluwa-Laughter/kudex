'use client';

import React, { useState } from 'react';
import {
  FiLayers,
  FiShield,
  FiTrendingUp,
  FiArrowRight,
  FiCheckCircle,
  FiActivity,
  FiDollarSign,
  FiLock,
  FiInfo,
} from 'react-icons/fi';
import { RiExchangeFundsLine } from 'react-icons/ri';
import { useReadContract, useSendTransaction, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { KUDEX_VAULT_ABI } from '@/lib/contracts/abis';
import { formatUnits } from 'viem';
import { formatDisplayBalance } from '@/lib/math';

export default function AppVaultsPage() {
  const { isConnected } = useAccount();
  const [selectedVault, setSelectedVault] = useState<string>('senior');
  const [depositAmount, setDepositAmount] = useState('1000');

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

  const riskScoreNum = riskScoreRaw ? Number(riskScoreRaw) : 1850;

  const { sendTransaction, data: txHash, isPending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const handleDeposit = () => {
    sendTransaction({
      to: CONTRACT_ADDRESSES.vault,
      value: BigInt(0),
      data: '0xb6b55f25', // depositShielded selector
    });
  };

  const vaults = [
    {
      id: 'senior',
      name: 'Senior Tranche RWA Facility',
      grade: 'AAA',
      apy: '8.50%',
      protection: '100% Principal Protection',
      tvl: '$8,200,000 pUSD',
      utilization: '88.4%',
      riskScore: '1,200 bps',
      description: 'First payout priority backed by junior loss absorption cushion.',
    },
    {
      id: 'mezzanine',
      name: 'Mezzanine Trade Receivables Pool',
      grade: 'BBB',
      apy: '14.20%',
      protection: 'Secondary Waterfall Buffer',
      tvl: '$4,150,000 pUSD',
      utilization: '74.2%',
      riskScore: '2,400 bps',
      description: 'Balanced risk-reward tranche with amortized DaaS restructuring.',
    },
    {
      id: 'junior',
      name: 'Junior First-Loss High Yield Pool',
      grade: 'EQUITY',
      apy: '22.80%',
      protection: 'First-Loss Capital Buffer',
      tvl: '$1,900,000 pUSD',
      utilization: '92.0%',
      riskScore: '4,100 bps',
      description: 'Absorbs initial defaults in exchange for maximum protocol performance fees.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="pb-2 border-b border-[#21293D]">
        <h2 className="text-2xl font-bold font-mono tracking-tight text-neutral-100">
          Institutional Credit Vaults & Yield Tranches
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Fractionalized real-world asset credit facilities categorized by waterfall priority.
          Protected by continuous algorithmic debt restructuring.
        </p>
      </div>

      {/* Primary Vault Telemetry Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-1">
          <span className="text-xs font-mono uppercase text-neutral-400">Total Shielded Vault TVL</span>
          <div className="text-3xl font-extrabold font-mono text-neutral-100 tabular-nums">
            {displayTVL}
          </div>
          <div className="text-xs font-mono text-[#00E599] pt-1">
            Across 3 Risk Tranches
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-1">
          <span className="text-xs font-mono uppercase text-neutral-400">On-Chain Risk Index</span>
          <div className="text-3xl font-extrabold font-mono text-[#00E599] tabular-nums">
            {riskScoreNum} / 10,000 bps
          </div>
          <div className="text-xs font-mono text-neutral-400 pt-1">
            Status: HEALTHY (Solvent)
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-1">
          <span className="text-xs font-mono uppercase text-neutral-400">DaaS Solvency Floor</span>
          <div className="text-3xl font-extrabold font-mono text-neutral-100 tabular-nums">
            1.42x
          </div>
          <div className="text-xs font-mono text-[#00E599] pt-1">
            Critical Threshold: &lt; 1.15x
          </div>
        </div>
      </div>

      {/* Tranches Selection & Deposit Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Vault Tranches Cards */}
        <div className="lg:col-span-7 space-y-4">
          {vaults.map((vault) => (
            <div
              key={vault.id}
              onClick={() => setSelectedVault(vault.id)}
              className={`p-6 rounded-2xl border cursor-pointer transition ${
                selectedVault === vault.id
                  ? 'border-[#00E599] bg-[#161C2B]/80 shadow-lg shadow-[#00E599]/10'
                  : 'border-[#21293D] bg-[#0E121B] hover:border-neutral-600'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#21293D]">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      vault.grade === 'AAA'
                        ? 'bg-[#00E599]/10 text-[#00E599]'
                        : vault.grade === 'BBB'
                        ? 'bg-[#2E68FF]/10 text-[#2E68FF]'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}
                  >
                    Grade {vault.grade}
                  </span>
                  <h3 className="text-base font-bold font-mono text-neutral-100">
                    {vault.name}
                  </h3>
                </div>
                <div className="text-lg font-extrabold font-mono text-[#00E599] tabular-nums">
                  {vault.apy}
                </div>
              </div>

              <p className="text-xs text-neutral-400 mt-3">{vault.description}</p>

              <div className="grid grid-cols-3 gap-4 pt-4 text-xs font-mono">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Pool Assets</span>
                  <span className="text-neutral-200 font-bold mt-0.5 block">{vault.tvl}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Protection</span>
                  <span className="text-neutral-200 font-bold mt-0.5 block">{vault.protection}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">Utilization</span>
                  <span className="text-[#00E599] font-bold mt-0.5 block">{vault.utilization}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Deposit Execution Desk */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#21293D]">
            <div className="flex items-center gap-2">
              <FiLock className="w-5 h-5 text-[#00E599]" />
              <h3 className="text-base font-bold font-mono text-neutral-100">
                Deposit into Tranche
              </h3>
            </div>
            <span className="text-xs font-mono text-[#00E599] uppercase font-bold">
              {selectedVault.toUpperCase()} POOL
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                Deposit Amount (pUSD)
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#161C2B] border border-[#21293D]">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-lg font-mono font-bold text-neutral-100 focus:outline-none"
                />
                <span className="px-3 py-1 rounded-lg bg-[#0E121B] text-xs font-mono font-bold text-neutral-200 border border-[#21293D]">
                  pUSD
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#161C2B] border border-[#21293D] space-y-2 text-xs font-mono text-neutral-300">
              <div className="flex justify-between text-neutral-400">
                <span>Estimated Target APY:</span>
                <span className="text-[#00E599] font-bold">
                  {selectedVault === 'senior' ? '8.50%' : selectedVault === 'mezzanine' ? '14.20%' : '22.80%'}
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Loss Absorption Priority:</span>
                <span className="text-neutral-200">
                  {selectedVault === 'senior' ? 'Junior Buffers First' : selectedVault === 'mezzanine' ? 'Secondary' : 'First Loss'}
                </span>
              </div>
            </div>

            {isConfirmed ? (
              <div className="p-4 rounded-xl bg-[#00E599]/10 border border-[#00E599]/40 text-center space-y-1">
                <div className="text-sm font-bold text-[#00E599] flex items-center justify-center gap-2">
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Deposit Confirmed on Ledger!</span>
                </div>
                <p className="text-xs text-neutral-300 font-mono">
                  Shielded tranche shares minted to your account.
                </p>
              </div>
            ) : (
              <button
                onClick={handleDeposit}
                disabled={isPending || isConfirming || !depositAmount}
                className="w-full py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition shadow-lg shadow-[#00E599]/15 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiLock className="w-4 h-4" />
                <span>
                  {isPending || isConfirming ? 'Confirming Deposit...' : 'Confirm Shielded Deposit'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
