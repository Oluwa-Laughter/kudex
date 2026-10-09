'use client';

import React, { useState } from 'react';
import {
  FiRepeat,
  FiShield,
  FiZap,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiActivity,
  FiLock,
  FiGlobe,
} from 'react-icons/fi';
import { RiRouteLine } from 'react-icons/ri';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { truncateAddress } from '@/lib/utils';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';

export default function AppBridgePage() {
  const { isConnected, address } = useAccount();
  const [sourceChain, setSourceChain] = useState<'Ethereum' | 'Base' | 'Arbitrum'>('Base');
  const [amount, setAmount] = useState('2500');
  const [shieldOnArrival, setShieldOnArrival] = useState(true);
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeCompleted, setBridgeCompleted] = useState(false);

  const feeAmount = (parseFloat(amount || '0') * 0.0008).toFixed(2);
  const receiveAmount = (parseFloat(amount || '0') - parseFloat(feeAmount)).toFixed(2);

  const handleBridge = () => {
    setIsBridging(true);
    setTimeout(() => {
      setIsBridging(false);
      setBridgeCompleted(true);
    }, 2000);
  };

  const bridgeHistory = [
    {
      id: 'brg-102',
      origin: 'Base',
      target: 'Kudex Settlement',
      asset: 'USDC',
      amount: '5,000.00',
      status: 'SETTLED',
      time: '14 mins ago',
      mode: 'Shield Note',
    },
    {
      id: 'brg-101',
      origin: 'Ethereum',
      target: 'Kudex Settlement',
      asset: 'USDC',
      amount: '12,500.00',
      status: 'SETTLED',
      time: '2 hours ago',
      mode: 'Direct Deposit',
    },
    {
      id: 'brg-100',
      origin: 'Arbitrum',
      target: 'Kudex Settlement',
      asset: 'ETH',
      amount: '2.50',
      status: 'SETTLED',
      time: '1 day ago',
      mode: 'Shield Note',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-[#21293D]">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
          Cross-Chain Capital Gateway & Solver Bridge
        </h2>
        <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1">
          Atomic liquidity routing from major EVM networks. Bridge funds with immediate confidential note conversion.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Bridge Execution Desk */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-6 transition-colors duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
            <div className="flex items-center gap-2">
              <RiRouteLine className="w-5 h-5 text-[#2E68FF]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">
                Bridge Liquidity
              </h3>
            </div>
            <span className="text-xs font-mono text-[#00E599] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
              <span>Fast Solver Relay: Active</span>
            </span>
          </div>

          <div className="space-y-5">
            {/* Source Network Selection */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 dark:text-neutral-400 mb-2">
                Origin Network
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['Ethereum', 'Base', 'Arbitrum'] as const).map((chain) => (
                  <button
                    key={chain}
                    onClick={() => setSourceChain(chain)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-mono font-medium transition border ${
                      sourceChain === chain
                        ? 'bg-[#2E68FF] text-white border-[#2E68FF] font-bold shadow-md shadow-[#2E68FF]/20'
                        : 'bg-slate-100 dark:bg-[#161C2B] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#21293D] hover:border-slate-400 dark:hover:border-neutral-600'
                    }`}
                  >
                    {chain}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Network Fixed */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 dark:text-neutral-400 mb-2">
                Destination Network
              </label>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-900 dark:text-neutral-100">Kudex Settlement Network</span>
                <span className="text-[#00E599] font-bold">PRIMARY</span>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-neutral-400 mb-2">
                <span>Transfer Amount</span>
                <span>Asset: USDC</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D]">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-lg font-mono font-bold text-slate-900 dark:text-neutral-100 focus:outline-none"
                />
                <span className="px-3 py-1 rounded-lg bg-white dark:bg-[#0E121B] text-xs font-mono font-bold text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-[#21293D]">
                  USDC
                </span>
              </div>
            </div>

            {/* Shield on Arrival Toggle */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <FiLock className="w-4 h-4 text-[#00E599]" />
                  <span>Shield on Arrival</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Deposit directly into confidential vault note upon bridging
                </div>
              </div>
              <button
                onClick={() => setShieldOnArrival(!shieldOnArrival)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                  shieldOnArrival ? 'bg-[#00E599]' : 'bg-slate-300 dark:bg-neutral-700'
                }`}
              >
                <div
                  className={`bg-white dark:bg-[#06080D] w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                    shieldOnArrival ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Fee Breakdown */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#06080D] border border-slate-200 dark:border-[#21293D] space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-500 dark:text-neutral-400">
                <span>Solver Liquidity Fee:</span>
                <span className="text-slate-800 dark:text-neutral-200 tabular-nums">${feeAmount} (8 bps)</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-neutral-400">
                <span>Estimated Finality:</span>
                <span className="text-[#00E599]">~12 Seconds</span>
              </div>
              <div className="border-t border-slate-200 dark:border-[#21293D] pt-2 flex justify-between text-slate-900 dark:text-neutral-100 font-bold text-sm">
                <span>Total You Receive:</span>
                <span className="text-[#00E599] tabular-nums">${receiveAmount}</span>
              </div>
            </div>

            {bridgeCompleted ? (
              <div className="p-4 rounded-xl bg-[#00E599]/10 border border-[#00E599]/40 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-[#00E599] font-bold text-sm">
                  <FiCheckCircle className="w-5 h-5" />
                  <span>Bridge Settlement Completed!</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-neutral-300 font-mono">
                  {shieldOnArrival
                    ? 'Confidential commitment note generated and confirmed on-chain.'
                    : 'Tokens delivered to recipient wallet.'}
                </p>
                <button
                  onClick={() => setBridgeCompleted(false)}
                  className="mt-2 text-xs text-[#00E599] hover:underline font-mono"
                >
                  Bridge Another Transfer
                </button>
              </div>
            ) : (
              <button
                onClick={handleBridge}
                disabled={isBridging || !amount}
                className="w-full py-4 rounded-xl bg-[#2E68FF] hover:bg-[#2557d6] text-white font-bold text-sm transition shadow-lg shadow-[#2E68FF]/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isBridging ? (
                  <>
                    <FiActivity className="w-4 h-4 animate-spin" />
                    <span>Routing Solver Liquidity Across Chains...</span>
                  </>
                ) : (
                  <>
                    <span>Execute Cross-Chain Bridge</span>
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bridge History Ledger */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-6 shadow-sm transition-colors duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
              <div className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-[#00E599]" />
                <h3 className="text-base font-bold font-mono text-slate-900 dark:text-neutral-100">
                  Cross-Chain Transfer Ledger
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                Verified Finality
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#21293D] mt-2">
              {bridgeHistory.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-neutral-200">
                      {item.origin} → {item.target}
                    </div>
                    <div className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
                      Mode: <span className="text-[#00E599]">{item.mode}</span> | {item.time}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-neutral-100 tabular-nums">
                      {item.amount} {item.asset}
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] bg-[#00E599]/10 text-[#00E599] font-bold">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-3 transition-colors duration-200">
            <div className="flex items-center gap-2 text-sm font-bold font-mono text-slate-900 dark:text-neutral-100">
              <FiGlobe className="w-4 h-4 text-[#2E68FF]" />
              <span>Multi-Chain Solver Security Architecture</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Kudex solvers stake protocol collateral to provide fast bridging fills.
              If a solver fails to deliver funds on destination within 60 seconds, their staked bond
              is slashed and refunded directly to the user.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
