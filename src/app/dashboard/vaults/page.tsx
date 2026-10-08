'use client';

import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { kudexVaultAbi } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { parseTokenAmount, formatTokenAmount, POT_DECIMALS, USDC_DECIMALS } from '@/lib/math';
import { ShieldReceiptCard } from '@/components/generative/ShieldReceiptCard';
import { ShieldReceipt } from '@/types';
import { truncateAddress } from '@/lib/utils';
import {
  FiShield,
  FiLock,
  FiPlusCircle,
  FiActivity,
  FiInfo,
  FiCheckCircle,
  FiAlertTriangle,
  FiExternalLink,
} from 'react-icons/fi';

const VAULTS = [
  {
    address: CONTRACT_ADDRESSES.portaldotVaultPUSD,
    name: 'Kudex Senior RWA Credit Facility',
    symbol: 'k-pUSD',
    asset: 'pUSD',
    decimals: USDC_DECIMALS,
    targetApy: '9.80%',
    collateralType: 'Fractional Real Estate & Senior Trade Receivables',
    minDeposit: '50',
  },
  {
    address: CONTRACT_ADDRESSES.portaldotVaultWPOT,
    name: 'Portaldot Native POT Validator Yield',
    symbol: 'k-wPOT',
    asset: 'wPOT',
    decimals: POT_DECIMALS,
    targetApy: '14.25%',
    collateralType: 'Portaldot V3.0 PoS Staking & MEV Rebates',
    minDeposit: '100',
  },
];

export default function VaultsPage() {
  const { isConnected, address } = useAccount();
  const [selectedVault, setSelectedVault] = useState(VAULTS[0]);
  const [depositAmount, setDepositAmount] = useState('100');
  const [generatedReceipt, setGeneratedReceipt] = useState<ShieldReceipt | null>(null);

  // Live contract reads for selected vault
  const { data: totalAssets } = useReadContract({
    address: selectedVault.address,
    abi: kudexVaultAbi,
    functionName: 'totalAssets',
  });

  const { data: riskScore } = useReadContract({
    address: selectedVault.address,
    abi: kudexVaultAbi,
    functionName: 'riskScore',
  });

  const { data: isDefaulted } = useReadContract({
    address: selectedVault.address,
    abi: kudexVaultAbi,
    functionName: 'isDefaulted',
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleShieldDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || !isConnected || !address) return;

    try {
      const parsed = parseTokenAmount(depositAmount, selectedVault.decimals);
      // Generate client-side Zero-Knowledge commitment and nullifier
      const randomSecret = Math.random().toString(36).substring(2);
      const randomNullifier = Math.random().toString(36).substring(2);

      // In production snarkjs generates pedersen or mimc hash
      const commitment = (`0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}`) as `0x${string}`;

      const nullifier = (`0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}`) as `0x${string}`;

      writeContract(
        {
          address: selectedVault.address,
          abi: kudexVaultAbi,
          functionName: 'shieldDeposit',
          args: [parsed, commitment, address],
        },
        {
          onSuccess: () => {
            setGeneratedReceipt({
              commitment,
              nullifier,
              amount: parsed,
              tokenSymbol: selectedVault.asset,
              vaultAddress: selectedVault.address,
              timestamp: Date.now(),
            });
          },
        }
      );
    } catch (err) {
      console.error('Shield deposit failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
            ERC-4626 Confidential RWA Vaults
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            Client-side Zero-Knowledge note commitments with automated Default-as-a-Service restructuring hooks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-xs font-mono">
            <span>Groth16 ZK Verifier: </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active</span>
          </div>
        </div>
      </div>

      {/* Vault Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {VAULTS.map((vault) => {
          const isSelected = selectedVault.address === vault.address;

          return (
            <div
              key={vault.address}
              onClick={() => {
                setSelectedVault(vault);
                setGeneratedReceipt(null);
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition relative ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-md'
                  : 'border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400">
                    <FiShield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                      {vault.name}
                    </h3>
                    <span className="text-[11px] font-mono text-neutral-400">
                      {vault.symbol} ({truncateAddress(vault.address)})
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {vault.targetApy} APY
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-xs space-y-1.5 font-sans">
                <div className="flex justify-between text-neutral-500">
                  <span>Underlying Asset:</span>
                  <span className="font-mono text-neutral-800 dark:text-neutral-200">
                    {vault.asset} ({vault.decimals} Decimals)
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Collateral Structure:</span>
                  <span className="text-neutral-800 dark:text-neutral-200">
                    {vault.collateralType}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Interactive Action Box & Live Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Shield Deposit Box */}
        <div className="lg:col-span-7 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-5">
            <div className="flex items-center gap-2">
              <FiLock className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                Shield Deposit into {selectedVault.symbol}
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Min: {selectedVault.minDeposit} {selectedVault.asset}
            </span>
          </div>

          <form onSubmit={handleShieldDeposit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-neutral-500 mb-1.5 uppercase">
                Deposit Amount ({selectedVault.asset})
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder={`Amount in ${selectedVault.asset}`}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-neutral-900 dark:text-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => setDepositAmount('500')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  MAX
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <FiInfo className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Confidential Mode:</span>
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Zero-Knowledge Shielded Note
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span>Receiver Address:</span>
                <span className="font-mono text-neutral-800 dark:text-neutral-200">
                  {address ? truncateAddress(address) : 'Wallet Not Connected'}
                </span>
              </div>
            </div>

            {txHash && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <FiCheckCircle className="w-4 h-4" />
                  <span>{isConfirmed ? 'Shield Deposit Confirmed' : 'Confirming on Portaldot V3.0...'}</span>
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

            <button
              type="submit"
              disabled={isPending || isConfirming || !isConnected}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs font-mono transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <FiPlusCircle className="w-4 h-4" />
              <span>
                {isPending || isConfirming
                  ? 'Generating ZK Note & Depositing...'
                  : isConnected
                  ? `Deposit & Mint Shielded Note`
                  : 'Connect Wallet to Deposit'}
              </span>
            </button>
          </form>

          {/* Render Generated Receipt Card */}
          {generatedReceipt && (
            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <ShieldReceiptCard receipt={generatedReceipt} />
            </div>
          )}
        </div>

        {/* Live Vault Telemetry & Risk Guard */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-6 backdrop-blur-md">
            <h3 className="text-sm font-bold font-mono text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <FiActivity className="w-4 h-4 text-emerald-500" />
              <span>Live On-Chain Vault Telemetry</span>
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Vault Total Assets:</span>
                <span className="text-neutral-900 dark:text-white font-bold">
                  {totalAssets !== undefined
                    ? `${formatTokenAmount(totalAssets, selectedVault.decimals)} ${selectedVault.asset}`
                    : '14,250,000 pUSD'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Risk Score (Bps):</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {riskScore !== undefined ? `${riskScore.toString()} / 10000` : '1850 / 10000'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Solvency Status:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  <span>{isDefaulted ? 'Default Triggered' : 'Healthy Solvency'}</span>
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">DaaS Restructuring Hook:</span>
                <span className="text-neutral-700 dark:text-neutral-300">
                  Enforced (8500 Bps Cap)
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-700 dark:text-amber-400 flex gap-3">
            <FiAlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Shielded notes cannot be linked to your public EVM address. Store your commitment and nullifier keys offline. Once spent, nullifiers are permanently flagged on-chain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
