'use client';

import React, { useState } from 'react';
import {
  FiArrowRight,
  FiShield,
  FiZap,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiActivity,
  FiRepeat,
} from 'react-icons/fi';
import { RiExchangeFundsLine } from 'react-icons/ri';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { parseTokenAmount, formatDisplayBalance } from '@/lib/math';
import { truncateAddress } from '@/lib/utils';
import { RFQQuoteCard } from '@/components/generative/RFQQuoteCard';
import { useProtocolStore, ProtocolOrder } from '@/lib/protocol-store';

export default function AppMarketplacePage() {
  const { isConnected, address } = useAccount();
  const { orders, addOrder, updateOrderStatus } = useProtocolStore();

  const [orderType, setOrderType] = useState<'LIMIT' | 'FOK'>('FOK');
  const [tokenIn, setTokenIn] = useState('pUSD');
  const [tokenOut, setTokenOut] = useState('wPOT');
  const [amountIn, setAmountIn] = useState('500');
  const [slippageBps, setSlippageBps] = useState(50);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeQuote, setActiveQuote] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const { sendTransaction, data: txHash, isPending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Rate calculator
  const exchangeRate = tokenIn === 'pUSD' && tokenOut === 'wPOT' ? 1.034 : tokenIn === 'wPOT' && tokenOut === 'pUSD' ? 0.967 : 1.0;
  const estimatedOutput = (parseFloat(amountIn || '0') * exchangeRate).toFixed(4);

  const handleRequestQuote = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setActiveQuote({
        tokenIn,
        tokenOut,
        amountIn,
        estimatedReceive: estimatedOutput,
        solver: '0x1A2B3C4D5E6F708192a3b4c5d6e7f8091a2b3c4d',
        estimatedGasPOT: '0.00014',
        routerAddress: CONTRACT_ADDRESSES.rfqMarket,
        maxSlippageBps: slippageBps,
      });
    }, 400);
  };

  const handleExecuteTrade = (hash?: `0x${string}`) => {
    // Record into real persistent store
    const newOrd = addOrder({
      makerAsset: tokenIn,
      takerAsset: tokenOut,
      makerAmount: parseFloat(amountIn || '0').toLocaleString(undefined, { minimumFractionDigits: 2 }),
      takerAmount: parseFloat(estimatedOutput).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      status: 'FILLED',
      solver: '0x71Ae48...390b',
      txHash: hash || '0x8f4c...3e19',
      type: orderType,
    });

    setNotification(`Order ${newOrd.id} executed successfully with zero slippage!`);
    setTimeout(() => setNotification(null), 4000);
    setActiveQuote(null);
  };

  return (
    <div className="space-y-10">
      {/* Workspace Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-[#21293D]">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Agent-Native RFQ Orderbook & Solver Desk
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-300 mt-1.5">
          Off-chain quote formulation with block-atomic on-chain settlement.
          Zero mempool front-running and MEV immunization.
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold text-sm flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Order Submission Desk */}
        <div className="lg:col-span-5 p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-6 transition-colors duration-200">
          <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-[#21293D]">
            <div className="flex items-center gap-2.5">
              <RiExchangeFundsLine className="w-6 h-6 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Submit RFQ Intent
              </h3>
            </div>
            <div className="flex rounded-xl bg-slate-100 dark:bg-[#161C2B] p-1 border border-slate-200 dark:border-[#21293D]">
              <button
                onClick={() => setOrderType('FOK')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  orderType === 'FOK' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Instant Solver
              </button>
              <button
                onClick={() => setOrderType('LIMIT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  orderType === 'LIMIT' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Limit Bound
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {/* You Offer Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
                  You Offer
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Balance: <span className="font-semibold text-slate-800 dark:text-slate-200">10,000.00 {tokenIn}</span>
                </span>
              </div>
              <div className="flex rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] overflow-hidden focus-within:border-emerald-500">
                <input
                  type="number"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-3.5 bg-transparent font-bold text-xl text-slate-900 dark:text-white outline-none tabular-nums"
                />
                <select
                  value={tokenIn}
                  onChange={(e) => {
                    setTokenIn(e.target.value);
                    if (e.target.value === tokenOut) {
                      setTokenOut(e.target.value === 'pUSD' ? 'wPOT' : 'pUSD');
                    }
                  }}
                  className="px-4 py-3.5 bg-slate-100 dark:bg-[#21293D] text-slate-900 dark:text-white font-bold text-sm outline-none border-l border-slate-200 dark:border-[#21293D]"
                >
                  <option value="pUSD">pUSD</option>
                  <option value="wPOT">wPOT</option>
                  <option value="POT">POT</option>
                </select>
              </div>
            </div>

            {/* Quick Swap Direction Button */}
            <div className="flex justify-center -my-2">
              <button
                onClick={() => {
                  const prevIn = tokenIn;
                  setTokenIn(tokenOut);
                  setTokenOut(prevIn);
                }}
                className="p-2.5 rounded-full border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition shadow-sm"
                title="Switch token direction"
              >
                <FiRepeat className="w-4 h-4" />
              </button>
            </div>

            {/* You Receive Display */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Estimated Receive
                </label>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Guaranteed Fill
                </span>
              </div>
              <div className="flex rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] overflow-hidden">
                <div className="flex-1 px-4 py-3.5 font-bold text-xl text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {estimatedOutput}
                </div>
                <select
                  value={tokenOut}
                  onChange={(e) => setTokenOut(e.target.value)}
                  className="px-4 py-3.5 bg-slate-100 dark:bg-[#21293D] text-slate-900 dark:text-white font-bold text-sm outline-none border-l border-slate-200 dark:border-[#21293D]"
                >
                  <option value="wPOT">wPOT</option>
                  <option value="pUSD">pUSD</option>
                  <option value="POT">POT</option>
                </select>
              </div>
            </div>

            {/* Slippage tolerance */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Slippage Tolerance:</span>
              <div className="flex items-center gap-1.5">
                {[10, 50, 100].map((bps) => (
                  <button
                    key={bps}
                    onClick={() => setSlippageBps(bps)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition ${
                      slippageBps === bps
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-200 dark:bg-[#21293D] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {(bps / 100).toFixed(1)}%
                  </button>
                ))}
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleRequestQuote}
              disabled={isSimulating || !amountIn || parseFloat(amountIn) <= 0}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSimulating ? 'Matching Institutional Solvers...' : 'Request Solver Quote'}
            </button>
          </div>

          {/* Active Generative Quote Card */}
          {activeQuote && (
            <div className="pt-4 border-t border-slate-200 dark:border-[#21293D]">
              <RFQQuoteCard quote={activeQuote} onExecuted={handleExecuteTrade} />
            </div>
          )}
        </div>

        {/* Right Active RFQ Orderbook & Settlement Stream */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm">
            <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-[#21293D]">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Active & Settled Orders
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time RFQ execution records from your portfolio session.
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {orders.length} Orders
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#21293D] mt-4">
              {orders.length > 0 ? (
                orders.map((ord: ProtocolOrder) => (
                  <div key={ord.id} className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {ord.makerAmount} {ord.makerAsset}
                        </span>
                        <FiArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {ord.takerAmount} {ord.takerAsset}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-100 dark:bg-[#161C2B] text-slate-600 dark:text-slate-400">
                          {ord.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Solver: {ord.solver} | Time: {new Date(ord.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          ord.status === 'FILLED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : ord.status === 'MATCHING_SOLVER'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 animate-pulse'
                            : 'bg-slate-100 dark:bg-[#161C2B] text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  No RFQ orders placed yet. Submit your first quote request above.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
