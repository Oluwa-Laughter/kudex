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

export default function AppMarketplacePage() {
  const { isConnected, address } = useAccount();
  const [orderType, setOrderType] = useState<'LIMIT' | 'FOK'>('FOK');
  const [tokenIn, setTokenIn] = useState('pUSD');
  const [tokenOut, setTokenOut] = useState('wPOT');
  const [amountIn, setAmountIn] = useState('500');
  const [slippageBps, setSlippageBps] = useState(50);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeQuote, setActiveQuote] = useState<any>(null);

  const { sendTransaction, data: txHash, isPending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const handleRequestQuote = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setActiveQuote({
        tokenIn,
        tokenOut,
        amountIn,
        estimatedReceive: (parseFloat(amountIn) * 1.034).toFixed(4),
        solver: '0x1A2B3C4D5E6F708192a3b4c5d6e7f8091a2b3c4d',
        estimatedGasPOT: '0.00014',
        routerAddress: CONTRACT_ADDRESSES.rfqMarket,
        maxSlippageBps: slippageBps,
      });
    }, 600);
  };

  const activeOrders = [
    {
      id: 'ord-881',
      makerAsset: 'pUSD',
      takerAsset: 'wPOT',
      makerAmount: '2,500.00',
      takerAmount: '2,585.00',
      status: 'MATCHING_SOLVER',
      expiry: '12m remaining',
      solver: '0x71A...90b',
    },
    {
      id: 'ord-880',
      makerAsset: 'pUSD',
      takerAsset: 'wPOT',
      makerAmount: '1,000.00',
      takerAmount: '1,034.00',
      status: 'FILLED',
      expiry: 'Executed',
      solver: '0x34C...12d',
    },
    {
      id: 'ord-879',
      makerAsset: 'wPOT',
      takerAsset: 'pUSD',
      makerAmount: '500.00',
      takerAmount: '485.00',
      status: 'FILLED',
      expiry: 'Executed',
      solver: '0x99E...44a',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-[#21293D]">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
          Agent-Native RFQ Orderbook & Solver Desk
        </h2>
        <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1">
          Off-chain quote formulation with block-atomic on-chain settlement.
          Zero mempool front-running and MEV immunization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Order Submission Desk */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-6 transition-colors duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
            <div className="flex items-center gap-2">
              <RiExchangeFundsLine className="w-5 h-5 text-[#00E599]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">
                Submit RFQ Intent
              </h3>
            </div>
            <div className="flex rounded-lg bg-slate-100 dark:bg-[#161C2B] p-1 border border-slate-200 dark:border-[#21293D]">
              <button
                onClick={() => setOrderType('FOK')}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
                  orderType === 'FOK' ? 'bg-[#00E599] text-[#06080D] font-bold' : 'text-slate-600 dark:text-neutral-400'
                }`}
              >
                Instant Solver
              </button>
              <button
                onClick={() => setOrderType('LIMIT')}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
                  orderType === 'LIMIT' ? 'bg-[#00E599] text-[#06080D] font-bold' : 'text-slate-600 dark:text-neutral-400'
                }`}
              >
                Limit Order
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 dark:text-neutral-400 mb-2">
                You Pay
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D]">
                <input
                  type="number"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent text-lg font-mono font-bold text-slate-900 dark:text-neutral-100 focus:outline-none"
                />
                <span className="px-3 py-1 rounded-lg bg-white dark:bg-[#0E121B] text-xs font-mono font-bold text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-[#21293D]">
                  {tokenIn}
                </span>
              </div>
            </div>

            <div className="flex justify-center -my-2">
              <button
                onClick={() => {
                  setTokenIn(tokenOut);
                  setTokenOut(tokenIn);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-slate-600 dark:text-neutral-400 hover:text-[#00E599] transition"
              >
                <FiRepeat className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 dark:text-neutral-400 mb-2">
                You Receive (Estimated Target)
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D]">
                <input
                  type="text"
                  readOnly
                  value={(parseFloat(amountIn || '0') * 1.034).toFixed(4)}
                  className="w-full bg-transparent text-lg font-mono font-bold text-[#00E599] focus:outline-none cursor-default"
                />
                <span className="px-3 py-1 rounded-lg bg-white dark:bg-[#0E121B] text-xs font-mono font-bold text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-[#21293D]">
                  {tokenOut}
                </span>
              </div>
            </div>

            {/* Slippage Selector */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-500 dark:text-neutral-400 mb-2">
                <span>Max Execution Slippage:</span>
                <span className="text-slate-800 dark:text-neutral-200 font-bold">{(slippageBps / 100).toFixed(2)}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[10, 50, 100].map((bps) => (
                  <button
                    key={bps}
                    onClick={() => setSlippageBps(bps)}
                    className={`py-1.5 rounded-lg text-xs font-mono transition border ${
                      slippageBps === bps
                        ? 'bg-[#00E599]/10 text-[#00E599] border-[#00E599]/40 font-bold'
                        : 'bg-slate-100 dark:bg-[#161C2B] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-[#21293D]'
                    }`}
                  >
                    {(bps / 100).toFixed(2)}%
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRequestQuote}
              disabled={isSimulating || !amountIn}
              className="w-full py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition shadow-lg shadow-[#00E599]/15 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSimulating ? (
                <>
                  <FiActivity className="w-4 h-4 animate-spin" />
                  <span>Simulating Solver Routes...</span>
                </>
              ) : (
                <>
                  <span>Request Institutional Quote</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Active Generated RFQ Quote Card */}
          {activeQuote && (
            <div className="pt-2">
              <RFQQuoteCard quote={activeQuote} />
            </div>
          )}
        </div>

        {/* Orderbook & Recent Solver Fills */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-6 shadow-sm transition-colors duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
              <div className="flex items-center gap-2">
                <FiClock className="w-4 h-4 text-[#00E599]" />
                <h3 className="text-base font-bold font-mono text-slate-900 dark:text-neutral-100">
                  Active RFQ Orders & Solver Matches
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                Block-Atomic Fills
              </span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#21293D] text-slate-500 dark:text-neutral-400">
                    <th className="pb-3">ORDER ID</th>
                    <th className="pb-3">OFFER</th>
                    <th className="pb-3">RECEIVE</th>
                    <th className="pb-3">SOLVER</th>
                    <th className="pb-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#21293D] text-slate-700 dark:text-neutral-300">
                  {activeOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-[#161C2B]/40 transition">
                      <td className="py-3.5 font-bold text-slate-800 dark:text-neutral-200">{ord.id}</td>
                      <td className="py-3.5 text-slate-900 dark:text-neutral-100 font-semibold tabular-nums">
                        {ord.makerAmount} {ord.makerAsset}
                      </td>
                      <td className="py-3.5 text-[#00E599] font-semibold tabular-nums">
                        {ord.takerAmount} {ord.takerAsset}
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-neutral-400">{ord.solver}</td>
                      <td className="py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ord.status === 'FILLED'
                              ? 'bg-[#00E599]/10 text-[#00E599]'
                              : 'bg-amber-500/10 text-amber-500 dark:text-amber-400 animate-pulse'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Solvers Health & Execution Guarantee */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#00E599]/10 text-[#00E599] border border-[#00E599]/20">
                <FiShield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-neutral-100 font-mono">
                  MEV-Proof Invariant Guarantee
                </div>
                <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Solvers settle via signed intents. Orders can never be front-run or sandwiched in the public mempool.
                </div>
              </div>
            </div>
            <div className="text-xs font-mono text-[#00E599] whitespace-nowrap">
              100% Invariant Preserved
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
