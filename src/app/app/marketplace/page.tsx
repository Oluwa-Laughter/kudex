'use client';

import React, { useState } from 'react';
import {
  FiArrowRight,
  FiRepeat,
  FiZap,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiChevronDown,
} from 'react-icons/fi';
import { RiExchangeFundsLine } from 'react-icons/ri';
import { RFQQuoteCard } from '@/components/generative/RFQQuoteCard';
import { useProtocolStore, ProtocolOrder } from '@/lib/protocol-store';

const AVAILABLE_TOKENS = [
  { symbol: 'pUSD', name: 'Portaldot USD', color: 'bg-[#00E599]' },
  { symbol: 'wPOT', name: 'Wrapped POT', color: 'bg-[#2E68FF]' },
  { symbol: 'POT', name: 'Native POT', color: 'bg-purple-500' },
];

export default function AppMarketplacePage() {
  const { orders, addOrder } = useProtocolStore();

  const [orderType, setOrderType] = useState<'FOK' | 'IOC' | 'LIMIT'>('FOK');
  const [tokenIn, setTokenIn] = useState('pUSD');
  const [tokenOut, setTokenOut] = useState('wPOT');
  const [amountIn, setAmountIn] = useState('500');
  const [slippageBps, setSlippageBps] = useState(50);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeQuote, setActiveQuote] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [showTokenInMenu, setShowTokenInMenu] = useState(false);
  const [showTokenOutMenu, setShowTokenOutMenu] = useState(false);

  const userBalance = tokenIn === 'pUSD' ? 10000 : tokenIn === 'wPOT' ? 250 : 500;

  // Real-time calculated solver rate
  const rateMultiplier =
    tokenIn === 'pUSD' && tokenOut === 'wPOT'
      ? 0.024
      : tokenIn === 'wPOT' && tokenOut === 'pUSD'
      ? 41.66
      : tokenIn === 'POT' && tokenOut === 'pUSD'
      ? 41.66
      : 1.0;

  const estimatedOutput = (parseFloat(amountIn || '0') * rateMultiplier).toFixed(2);

  const handleApplyPercentage = (pct: number) => {
    const calculated = (userBalance * (pct / 100)).toFixed(2);
    setAmountIn(calculated);
  };

  const handleRequestQuote = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setActiveQuote({
        tokenIn,
        tokenOut,
        amountIn,
        estimatedReceive: estimatedOutput,
        solver: '0x71Ae48...390b (Kudex Institutional Solver)',
        estimatedGasPOT: '0.00045',
        routerAddress: '0x8800000000000000000000000000000000000001' as `0x${string}`,
        maxSlippageBps: slippageBps,
      });
    }, 600);
  };

  const handleExecuteTrade = (hash?: `0x${string}`) => {
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

  const selectedInToken = AVAILABLE_TOKENS.find((t) => t.symbol === tokenIn) || AVAILABLE_TOKENS[0];
  const selectedOutToken = AVAILABLE_TOKENS.find((t) => t.symbol === tokenOut) || AVAILABLE_TOKENS[1];

  return (
    <div className="space-y-10">
      {/* Workspace Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-[#21293D]">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Agent-Native RFQ Orderbook & Solver Desk
        </h2>
        <p className="text-base text-slate-600 dark:text-neutral-400 mt-1.5">
          Off-chain quote formulation with block-atomic on-chain settlement.
          Zero mempool front-running and MEV immunization.
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-[#00E599] font-semibold text-sm flex items-center gap-2">
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
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  orderType === 'FOK' ? 'bg-[#00E599] text-[#06080D]' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Instant Solver
              </button>
              <button
                onClick={() => setOrderType('LIMIT')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  orderType === 'LIMIT' ? 'bg-[#00E599] text-[#06080D]' : 'text-slate-600 dark:text-slate-400'
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
                <label className="text-sm font-semibold uppercase text-slate-500 dark:text-neutral-400">
                  You Offer
                </label>
                <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                  Balance: <span className="font-semibold text-slate-800 dark:text-neutral-200">{userBalance.toLocaleString()} {tokenIn}</span>
                </span>
              </div>

              {/* Percentage Buttons */}
              <div className="flex items-center gap-2 mb-2">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleApplyPercentage(pct)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#161C2B] dark:hover:bg-[#21293D] border border-slate-200 dark:border-[#21293D] text-xs font-mono font-bold text-slate-700 dark:text-neutral-300 transition"
                  >
                    {pct === 100 ? 'MAX' : `${pct}%`}
                  </button>
                ))}
              </div>

              {/* Input Box with Aligned Token Selector */}
              <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] overflow-visible focus-within:border-emerald-500 transition">
                <input
                  type="number"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-4 bg-transparent font-bold text-2xl text-slate-900 dark:text-white outline-none tabular-nums"
                />

                {/* Styled Token Selector Dropdown Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTokenInMenu(!showTokenInMenu);
                      setShowTokenOutMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-4 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-[#21293D]/60 dark:hover:bg-[#21293D] text-slate-900 dark:text-white font-bold text-base border-l border-slate-200 dark:border-[#21293D] transition rounded-r-2xl"
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${selectedInToken.color} flex-shrink-0 shadow-sm`} />
                    <span>{tokenIn}</span>
                    <FiChevronDown className="w-4 h-4 text-slate-500" />
                  </button>

                  {showTokenInMenu && (
                    <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-2xl p-1.5 z-40">
                      {AVAILABLE_TOKENS.map((token) => (
                        <button
                          key={token.symbol}
                          type="button"
                          onClick={() => {
                            setTokenIn(token.symbol);
                            if (token.symbol === tokenOut) {
                              setTokenOut(token.symbol === 'pUSD' ? 'wPOT' : 'pUSD');
                            }
                            setShowTokenInMenu(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-lg transition ${
                            tokenIn === token.symbol
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00E599]'
                              : 'hover:bg-slate-100 dark:hover:bg-[#161C2B] text-slate-800 dark:text-neutral-200'
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full ${token.color} flex-shrink-0`} />
                          <div className="text-left">
                            <div className="font-bold">{token.symbol}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Swap Direction Button */}
            <div className="flex justify-center -my-1">
              <button
                type="button"
                onClick={() => {
                  const prevIn = tokenIn;
                  setTokenIn(tokenOut);
                  setTokenOut(prevIn);
                }}
                className="p-3 rounded-full border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] text-slate-600 dark:text-neutral-400 hover:text-emerald-500 hover:border-emerald-500 transition shadow-sm"
                title="Switch token direction"
              >
                <FiRepeat className="w-4 h-4" />
              </button>
            </div>

            {/* You Receive Display */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold uppercase text-slate-500 dark:text-neutral-400">
                  Estimated Receive
                </label>
                <span className="text-xs text-emerald-600 dark:text-[#00E599] font-semibold">
                  Guaranteed Fill
                </span>
              </div>
              <div className="relative flex items-center rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] overflow-visible">
                <div className="flex-1 px-4 py-4 font-bold text-2xl text-emerald-600 dark:text-[#00E599] tabular-nums">
                  {estimatedOutput}
                </div>

                {/* Styled Token Selector Dropdown Button for Output */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTokenOutMenu(!showTokenOutMenu);
                      setShowTokenInMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-4 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-[#21293D]/60 dark:hover:bg-[#21293D] text-slate-900 dark:text-white font-bold text-base border-l border-slate-200 dark:border-[#21293D] transition rounded-r-2xl"
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${selectedOutToken.color} flex-shrink-0 shadow-sm`} />
                    <span>{tokenOut}</span>
                    <FiChevronDown className="w-4 h-4 text-slate-500" />
                  </button>

                  {showTokenOutMenu && (
                    <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-2xl p-1.5 z-40">
                      {AVAILABLE_TOKENS.map((token) => (
                        <button
                          key={token.symbol}
                          type="button"
                          onClick={() => {
                            setTokenOut(token.symbol);
                            if (token.symbol === tokenIn) {
                              setTokenIn(token.symbol === 'pUSD' ? 'wPOT' : 'pUSD');
                            }
                            setShowTokenOutMenu(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold rounded-lg transition ${
                            tokenOut === token.symbol
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00E599]'
                              : 'hover:bg-slate-100 dark:hover:bg-[#161C2B] text-slate-800 dark:text-neutral-200'
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full ${token.color} flex-shrink-0`} />
                          <div className="text-left">
                            <div className="font-bold">{token.symbol}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Slippage Tolerance Preset Buttons */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-sm">
              <span className="text-slate-600 dark:text-neutral-400 font-semibold">Slippage Tolerance:</span>
              <div className="flex items-center gap-2">
                {[10, 50, 100].map((bps) => (
                  <button
                    key={bps}
                    type="button"
                    onClick={() => setSlippageBps(bps)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                      slippageBps === bps
                        ? 'bg-[#00E599] text-[#06080D]'
                        : 'bg-slate-200 dark:bg-[#21293D] text-slate-700 dark:text-neutral-300 hover:bg-slate-300 dark:hover:bg-[#2c364f]'
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
              className="w-full py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/20 disabled:opacity-50"
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
          <div className="p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm">
            <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-[#21293D]">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Active & Settled Orders
                </h3>
                <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
                  Real-time RFQ execution records from your portfolio session.
                </p>
              </div>
              <span className="text-sm font-semibold px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                {orders.length} Orders
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#21293D] mt-4">
              {orders.length > 0 ? (
                orders.map((ord: ProtocolOrder) => (
                  <div key={ord.id} className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-base">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {ord.makerAmount} {ord.makerAsset}
                        </span>
                        <FiArrowRight className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-emerald-600 dark:text-[#00E599]">
                          {ord.takerAmount} {ord.takerAsset}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded font-mono bg-slate-100 dark:bg-[#161C2B] text-slate-600 dark:text-neutral-400 font-semibold">
                          {ord.type}
                        </span>
                      </div>
                      <div className="text-sm font-mono text-slate-500 dark:text-neutral-400">
                        Solver: {ord.solver} | Time: {new Date(ord.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-mono ${
                          ord.status === 'FILLED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00E599]'
                            : ord.status === 'MATCHING_SOLVER'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-[#2E68FF] animate-pulse'
                            : 'bg-slate-100 dark:bg-[#161C2B] text-slate-600 dark:text-neutral-400'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-base text-slate-500 dark:text-neutral-400">
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
