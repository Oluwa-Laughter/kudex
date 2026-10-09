'use client';

import React, { useState } from 'react';
import {
  FiShield,
  FiTrendingUp,
  FiLock,
  FiCheckCircle,
  FiArrowRight,
  FiActivity,
  FiDollarSign,
  FiLayers,
  FiAlertTriangle,
} from 'react-icons/fi';
import { RiShieldCheckLine } from 'react-icons/ri';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { KUDEX_VAULT_ABI } from '@/lib/contracts/abis';
import { formatUnits, parseUnits } from 'viem';
import { useProtocolStore } from '@/lib/protocol-store';
import { getReadableErrorMessage } from '@/lib/utils';

export default function AppVaultsPage() {
  const { isConnected, address } = useAccount();
  const { positions, depositToVault, withdrawFromVault, riskScoreBps } = useProtocolStore();

  const [selectedVault, setSelectedVault] = useState<'senior' | 'mezzanine' | 'junior'>('senior');
  const [depositAmount, setDepositAmount] = useState('1000');
  const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [notification, setNotification] = useState<string | null>(null);

  // Real user on-chain balance
  const { data: pusdBalanceData } = useBalance({
    address,
    token: CONTRACT_ADDRESSES.tokens.pUSD.address,
  });
  const availableBalance = pusdBalanceData
    ? parseFloat(formatUnits(pusdBalanceData.value, pusdBalanceData.decimals))
    : 0;

  // Live on-chain read for total assets in vault
  const { data: totalAssetsRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'totalAssets',
  });

  // Live on-chain read for risk score
  const { data: riskScoreRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'riskScore',
  });

  const { writeContract, data: txHash, isPending, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const totalUserDeposits =
    positions.senior.depositedAmount +
    positions.mezzanine.depositedAmount +
    positions.junior.depositedAmount;

  const displayTVL = totalAssetsRaw
    ? `$${Number(formatUnits(totalAssetsRaw, 6)).toLocaleString()}`
    : totalUserDeposits > 0
    ? `$${totalUserDeposits.toLocaleString()}`
    : '$0.00';

  const riskScoreNum = riskScoreRaw ? Number(riskScoreRaw) : riskScoreBps;
  const healthFactor = (10000 / Math.max(riskScoreNum, 1000)).toFixed(2);

  const vaultDetails = {
    senior: {
      name: 'Senior Tranche RWA Facility',
      grade: 'AAA',
      apy: '8.50%',
      protection: '100% Principal Protection',
      description: 'First payout priority backed by junior loss absorption cushion.',
      userDeposit: positions.senior.depositedAmount,
      userYield: positions.senior.accruedYield,
    },
    mezzanine: {
      name: 'Mezzanine Trade Receivables Pool',
      grade: 'BBB',
      apy: '14.20%',
      protection: 'Secondary Waterfall Buffer',
      description: 'Balanced risk-reward tranche with amortized risk restructuring.',
      userDeposit: positions.mezzanine.depositedAmount,
      userYield: positions.mezzanine.accruedYield,
    },
    junior: {
      name: 'Junior First-Loss High Yield Pool',
      grade: 'EQUITY',
      apy: '22.80%',
      protection: 'First-Loss Capital Buffer',
      description: 'Absorbs initial defaults in exchange for maximum protocol performance fees.',
      userDeposit: positions.junior.depositedAmount,
      userYield: positions.junior.accruedYield,
    },
  };

  const handleAction = () => {
    resetWrite();
    const num = parseFloat(depositAmount);
    if (!num || num <= 0) return;

    if (!isConnected || !address) {
      setNotification('Please connect your Web3 wallet to interact with on-chain vaults.');
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    if (activeTab === 'DEPOSIT') {
      try {
        const commitment = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')}` as `0x${string}`;

        const parsedAssets = parseUnits(depositAmount, 6);

        writeContract(
          {
            address: CONTRACT_ADDRESSES.vault,
            abi: KUDEX_VAULT_ABI,
            functionName: 'shieldDeposit',
            args: [parsedAssets, commitment, address],
          },
          {
            onSuccess: (hash) => {
              depositToVault(selectedVault, num);
              setNotification(`Deposit broadcasted successfully! Transaction: ${hash.slice(0, 10)}...`);
              setTimeout(() => setNotification(null), 5000);
            },
            onError: (err) => {
              console.warn('Vault deposit error:', err);
            },
          }
        );
      } catch (err) {
        console.error('Vault deposit exception:', err);
      }
    } else {
      withdrawFromVault(selectedVault, num);
      setNotification(`Redeemed $${num.toLocaleString()} pUSD from ${vaultDetails[selectedVault].name}!`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="space-y-10">
      {/* Workspace Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-[#21293D]">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Institutional Credit Vaults & Yield Tranches
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-300 mt-1.5">
          Fractionalized real-world asset credit facilities categorized by waterfall priority.
          Protected by continuous algorithmic debt restructuring.
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-[#00E599] font-semibold text-sm flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {writeError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3">
          <FiAlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
          <div className="space-y-1">
            <div className="font-bold">Transaction Execution Halted</div>
            <p className="text-xs">{getReadableErrorMessage(writeError)}</p>
            <div className="text-xs font-mono text-slate-500 dark:text-neutral-400">
              Contract Target: {CONTRACT_ADDRESSES.vault} (Portaldot Testnet)
            </div>
          </div>
        </div>
      )}

      {/* Primary Vault Telemetry Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-2 transition-colors duration-200">
          <span className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
            Total Shielded Vault TVL
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {displayTVL}
          </div>
          <div className="text-sm text-emerald-600 dark:text-[#00E599] font-semibold pt-1">
            Across 3 Risk Tranches
          </div>
        </div>

        <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-2 transition-colors duration-200">
          <span className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
            My Deposited Assets
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            ${totalUserDeposits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-emerald-600 dark:text-[#00E599] font-semibold pt-1">
            Earning Continuous APY
          </div>
        </div>

        <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-2 transition-colors duration-200">
          <span className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
            Automated Solvency Floor
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {healthFactor}x
          </div>
          <div className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
            Safe Threshold &gt; 1.15x
          </div>
        </div>
      </div>

      {/* Tranches Selection & Deposit Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Vault Tranches Cards */}
        <div className="lg:col-span-7 space-y-5">
          {(['senior', 'mezzanine', 'junior'] as const).map((key) => {
            const vault = vaultDetails[key];
            const isSelected = selectedVault === key;

            return (
              <div
                key={key}
                onClick={() => setSelectedVault(key)}
                className={`p-7 rounded-2xl border cursor-pointer transition ${
                  isSelected
                    ? 'border-emerald-500 bg-slate-50 dark:bg-[#161C2B] shadow-lg shadow-emerald-500/10'
                    : 'border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        vault.grade === 'AAA'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20'
                          : vault.grade === 'BBB'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/10'
                          : 'bg-emerald-500/5 text-emerald-800 dark:text-emerald-400 border border-emerald-500/10'
                      }`}
                    >
                      Grade {vault.grade}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {vault.name}
                    </h3>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {vault.apy}
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                  {vault.description}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#21293D] flex items-center justify-between text-sm">
                  <div>
                    <span className="text-slate-500">My Position: </span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      ${vault.userDeposit.toLocaleString(undefined, { minimumFractionDigits: 2 })} pUSD
                    </span>
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    {vault.protection}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Deposit/Redemption Desk Form */}
        <div className="lg:col-span-5 p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-6 transition-colors duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Vault Action Desk
            </h3>
            <div className="flex rounded-xl bg-slate-100 dark:bg-[#161C2B] p-1 border border-slate-200 dark:border-[#21293D]">
              <button
                onClick={() => setActiveTab('DEPOSIT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'DEPOSIT'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Deposit
              </button>
              <button
                onClick={() => setActiveTab('WITHDRAW')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'WITHDRAW'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                Selected Tranche
              </label>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {vaultDetails[selectedVault].name}
                </span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {vaultDetails[selectedVault].apy} APY
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold uppercase text-slate-500 dark:text-neutral-400">
                    Amount (pUSD)
                  </label>
                  <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                    Avail: {activeTab === 'DEPOSIT' ? availableBalance.toFixed(2) : (vaultDetails[selectedVault].userDeposit || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        const baseBal = activeTab === 'DEPOSIT' ? availableBalance : vaultDetails[selectedVault].userDeposit;
                        setDepositAmount(baseBal > 0 ? (baseBal * (pct / 100)).toFixed(2) : '0');
                      }}
                      className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-slate-700 dark:text-neutral-300 hover:border-emerald-500 transition"
                    >
                      {pct === 100 ? 'MAX' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] overflow-hidden focus-within:border-emerald-500">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-3.5 bg-transparent font-bold text-xl text-slate-900 dark:text-white outline-none tabular-nums"
                />
                <span className="px-4 py-3.5 font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#21293D] flex items-center">
                  pUSD
                </span>
              </div>
            </div>

            {availableBalance > 0 && activeTab === 'DEPOSIT' && (
              <div className="flex gap-2">
                {[10, 50, 100, 500].filter((amt) => amt <= availableBalance).map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setDepositAmount(amt.toString())}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-slate-700 dark:text-slate-300 hover:border-emerald-500 transition"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={handleAction}
              disabled={isPending || isConfirming || !depositAmount || parseFloat(depositAmount) <= 0}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition shadow-md shadow-emerald-500/20 disabled:opacity-50 mt-2"
            >
              {isPending || isConfirming
                ? 'Confirming Transaction...'
                : activeTab === 'DEPOSIT'
                ? `Deposit to ${vaultDetails[selectedVault].grade} Vault`
                : `Withdraw from ${vaultDetails[selectedVault].grade} Vault`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
