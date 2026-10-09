'use client';

import React, { useState } from 'react';
import {
  FiArrowRight,
  FiShield,
  FiRepeat,
  FiClock,
  FiCheckCircle,
  FiExternalLink,
  FiZap,
} from 'react-icons/fi';
import { RiRouteLine } from 'react-icons/ri';
import { useAccount } from 'wagmi';
import { truncateAddress } from '@/lib/utils';
import { useProtocolStore, BridgeTransfer } from '@/lib/protocol-store';

export default function AppBridgePage() {
  const { isConnected, address } = useAccount();
  const { bridgeTransfers, addBridgeTransfer } = useProtocolStore();

  const [originChain, setOriginChain] = useState('Ethereum Sepolia');
  const [targetChain, setTargetChain] = useState('Kudex Settlement');
  const [asset, setAsset] = useState('USDC');
  const [amount, setAmount] = useState('1000');
  const [isBridging, setIsBridging] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleInitiateBridge = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;

    setIsBridging(true);
    setTimeout(() => {
      setIsBridging(false);
      const txHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(20)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}`;

      const transfer = addBridgeTransfer({
        originChain,
        targetChain,
        asset,
        amount: num.toLocaleString(undefined, { minimumFractionDigits: 2 }),
        status: 'SETTLED',
        txHash,
        mode: 'Direct Deposit',
      });

      setNotification(`Bridge transfer of $${num.toLocaleString()} ${asset} completed into Kudex!`);
      setTimeout(() => setNotification(null), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-10">
      {/* Workspace Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-[#21293D]">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Cross-Chain Capital Gateway & Solver Bridge
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-300 mt-1.5">
          Atomic liquidity routing from major EVM networks. Bridge funds with immediate confidential note conversion.
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold text-sm flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Bridge Execution Desk */}
        <div className="lg:col-span-6 p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-6 transition-colors duration-200">
          <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-[#21293D]">
            <div className="flex items-center gap-2.5">
              <RiRouteLine className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Bridge Liquidity
              </h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Gateway Operational
            </span>
          </div>

          <div className="space-y-5">
            {/* Origin & Target Chain selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                  Origin Network
                </label>
                <select
                  value={originChain}
                  onChange={(e) => setOriginChain(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] font-bold text-sm text-slate-900 dark:text-white outline-none"
                >
                  <option value="Ethereum Sepolia">Ethereum Sepolia</option>
                  <option value="Arbitrum Sepolia">Arbitrum Sepolia</option>
                  <option value="Base Sepolia">Base Sepolia</option>
                  <option value="Polygon Amoy">Polygon Amoy</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                  Destination
                </label>
                <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-100 dark:bg-[#161C2B] font-bold text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                  {targetChain}
                </div>
              </div>
            </div>

            {/* Asset and Amount */}
            <div>
              <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                Bridge Amount
              </label>
              <div className="flex rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] overflow-hidden focus-within:border-emerald-500">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-3.5 bg-transparent font-bold text-xl text-slate-900 dark:text-white outline-none tabular-nums"
                />
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="px-4 py-3.5 bg-slate-100 dark:bg-[#21293D] text-slate-900 dark:text-white font-bold text-sm outline-none border-l border-slate-200 dark:border-[#21293D]"
                >
                  <option value="USDC">USDC</option>
                  <option value="ETH">ETH</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-xs space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Estimated Finality:</span>
                <span className="font-semibold text-slate-900 dark:text-white">~15 Seconds (Fast Path)</span>
              </div>
              <div className="flex justify-between">
                <span>Routing Fee:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">0.00% (Subsidized Testnet)</span>
              </div>
            </div>

            <button
              onClick={handleInitiateBridge}
              disabled={isBridging || !amount || parseFloat(amount) <= 0}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {isBridging ? 'Relaying Cross-Chain Packets...' : 'Initiate Bridge Transfer'}
            </button>
          </div>
        </div>

        {/* Bridge Records */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm">
            <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-[#21293D]">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Recent Bridge Transfers
              </h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {bridgeTransfers.length} Transfers
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#21293D] mt-3">
              {bridgeTransfers.length > 0 ? (
                bridgeTransfers.map((item: BridgeTransfer) => (
                  <div key={item.id} className="py-4.5 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.originChain} &rarr; {item.targetChain}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Tx: {truncateAddress(item.txHash, 6)} | {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {item.amount} {item.asset}
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        {item.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  No bridge transactions recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
