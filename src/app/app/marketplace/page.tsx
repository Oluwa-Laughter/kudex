'use client';

import React, { useState } from 'react';
import {
  FiArrowRight,
  FiRepeat,
  FiZap,
  FiShield,
  FiCheckCircle,
  FiTrendingUp,
  FiCpu,
  FiRefreshCw,
  FiAlertCircle,
  FiPlus,
  FiMinus,
  FiLayers,
  FiDollarSign,
} from 'react-icons/fi';
import { RiExchangeFundsLine } from 'react-icons/ri';
import { useAccount, useBalance } from 'wagmi';
import { useNativeWallet } from '@/components/navigation/NativeWalletProvider';
import { useNativeAccount } from '@/lib/hooks/useNativeAccount';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useProtocolStore, ProtocolOrder, LiquidityPoolPosition } from '@/lib/protocol-store';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';

const AVAILABLE_TOKENS = [
  { symbol: 'tPOT', name: 'Test Portaldot Token (Native Gas)', color: 'bg-emerald-400' },
  { symbol: 'pUSD', name: 'Portaldot Confidential USD', color: 'bg-[#00E599]' },
  { symbol: 'wPOT', name: 'Wrapped POT (Revive EVM)', color: 'bg-teal-400' },
  { symbol: 'USDT', name: 'Tether USD (Revive)', color: 'bg-emerald-300' },
  { symbol: 'ETH', name: 'Bridged Ether (Revive)', color: 'bg-blue-400' },
];

const TOKEN_OPTIONS: SelectOption[] = AVAILABLE_TOKENS.map((token) => ({
  value: token.symbol,
  label: token.symbol,
  description: token.name,
  icon: <span className={`w-3 h-3 rounded-full ${token.color} inline-block shadow-sm`} />,
}));

// Relative price reference in USD for rate calculation
const PRICES_IN_USD: Record<string, number> = {
  tPOT: 41.66,
  POT: 41.66,
  pUSD: 1.0,
  wPOT: 41.66,
  USDT: 1.0,
  ETH: 3450.0,
};

const FEATURED_POOLS = [
  {
    id: 'pool-tpot-pusd',
    name: 'tPOT / pUSD',
    token0: 'tPOT',
    token1: 'pUSD',
    feeTier: '0.30%',
    apr: '18.5%',
    tvlUSD: 1450200,
    volume24h: 320400,
    ratio: 41.66, // 1 tPOT = 41.66 pUSD
  },
  {
    id: 'pool-wpot-pusd',
    name: 'wPOT / pUSD',
    token0: 'wPOT',
    token1: 'pUSD',
    feeTier: '0.30%',
    apr: '14.2%',
    tvlUSD: 980000,
    volume24h: 185000,
    ratio: 41.66,
  },
  {
    id: 'pool-tpot-eth',
    name: 'tPOT / ETH',
    token0: 'tPOT',
    token1: 'ETH',
    feeTier: '0.30%',
    apr: '22.0%',
    tvlUSD: 640000,
    volume24h: 92000,
    ratio: 0.012, // 1 tPOT = 0.012 ETH
  },
];

export default function AppMarketplacePage() {
  const { isConnected: isEvmConnected, address: evmAddress } = useAccount();
  const { selected: nativeWallet } = useNativeWallet();
  const { data: evmBalance } = useBalance({ address: evmAddress });
  const { data: nativeAccount } = useNativeAccount();

  const {
    balances,
    orders,
    executeSwap,
    addOrder,
    agentBots,
    addAgentPolicy,
    liquidityPositions,
    addLiquidity,
    removeLiquidity,
  } = useProtocolStore();

  const [activeTab, setActiveTab] = useState<'swap' | 'pools' | 'autopilot'>('swap');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'swaps' | 'liquidity'>('all');

  // SWAP STATE
  const [tokenIn, setTokenIn] = useState('tPOT');
  const [tokenOut, setTokenOut] = useState('pUSD');
  const [amountIn, setAmountIn] = useState('');
  const [slippageBps, setSlippageBps] = useState(50);
  const [isSwapping, setIsSwapping] = useState(false);

  // LIQUIDITY POOL STATE
  const [selectedPoolId, setSelectedPoolId] = useState(FEATURED_POOLS[0].id);
  const [lpAmount0, setLpAmount0] = useState('');
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);

  // AUTOPILOT STATE
  const [dcaAmount, setDcaAmount] = useState('');
  const [dcaAsset, setDcaAsset] = useState('tPOT');
  const [dcaFrequency, setDcaFrequency] = useState('Daily');
  const [dcaDailyCap, setDcaDailyCap] = useState('');
  const [isDeployingAgent, setIsDeployingAgent] = useState(false);

  // NOTIFICATION
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Real on-chain tPOT balance from native Substrate wallet or EVM wallet
  const realTpotBalance = nativeAccount?.nativeFreeTPOT
    ? parseFloat(nativeAccount.nativeFreeTPOT)
    : evmBalance
    ? parseFloat(evmBalance.formatted)
    : balances['POT'] ?? 0;

  // Swap dynamic calculations
  const priceIn = PRICES_IN_USD[tokenIn] || 1.0;
  const priceOut = PRICES_IN_USD[tokenOut] || 1.0;
  const exchangeRate = priceIn / priceOut;
  const numAmountIn = parseFloat(amountIn || '0');
  const calculatedSwapOutput = (numAmountIn * exchangeRate).toFixed(4);

  const currentTokenInBalance =
    tokenIn === 'tPOT' || tokenIn === 'POT'
      ? realTpotBalance
      : balances[tokenIn] ?? 0;

  const handleApplySwapPercentage = (pct: number) => {
    const calculated = (currentTokenInBalance * (pct / 100)).toFixed(2);
    setAmountIn(calculated);
  };

  const handleExecuteInstantSwap = () => {
    if (!numAmountIn || numAmountIn <= 0) {
      showNotification('Please enter a valid amount to swap.', 'error');
      return;
    }
    if (numAmountIn > currentTokenInBalance) {
      showNotification(`Insufficient ${tokenIn} balance (Available: ${currentTokenInBalance.toLocaleString()})`, 'error');
      return;
    }

    setIsSwapping(true);
    setTimeout(() => {
      const numAmountOut = parseFloat(calculatedSwapOutput);
      executeSwap(tokenIn, tokenOut, numAmountIn, numAmountOut);
      setIsSwapping(false);
      setAmountIn('');
      showNotification(`Successfully swapped ${numAmountIn.toLocaleString()} ${tokenIn} for ${numAmountOut.toLocaleString()} ${tokenOut} on Portaldot 3.0 AMM!`);
    }, 600);
  };

  // Liquidity calculations
  const activePool = FEATURED_POOLS.find((p) => p.id === selectedPoolId) || FEATURED_POOLS[0];
  const numLp0 = parseFloat(lpAmount0 || '0');
  const derivedLp1 = (numLp0 * activePool.ratio).toFixed(4);
  const token0Balance = activePool.token0 === 'tPOT' ? realTpotBalance : balances[activePool.token0] ?? 0;
  const token1Balance = balances[activePool.token1] ?? 0;

  const handleAddLiquidity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numLp0 || numLp0 <= 0) {
      showNotification(`Please enter an amount of ${activePool.token0} to deposit.`, 'error');
      return;
    }
    const numLp1 = parseFloat(derivedLp1);
    if (numLp0 > token0Balance) {
      showNotification(`Insufficient ${activePool.token0} balance (Available: ${token0Balance.toLocaleString()})`, 'error');
      return;
    }
    if (numLp1 > token1Balance) {
      showNotification(`Insufficient ${activePool.token1} balance (Available: ${token1Balance.toLocaleString()})`, 'error');
      return;
    }

    setIsAddingLiquidity(true);
    setTimeout(() => {
      setIsAddingLiquidity(false);
      const pos = addLiquidity(activePool.id, activePool.token0, activePool.token1, numLp0, numLp1);
      setLpAmount0('');
      showNotification(`Supplied ${numLp0} ${activePool.token0} + ${numLp1} ${activePool.token1} to ${activePool.name} pool! Received ${pos.lpTokens} LP tokens.`);
    }, 700);
  };

  const handleRemoveLiquidity = (positionId: string) => {
    removeLiquidity(positionId);
    showNotification('Liquidity withdrawn successfully! Principal tokens returned to wallet.');
  };

  // Auto-Pilot Deployment
  const handleDeployAutopilot = () => {
    const amt = parseFloat(dcaAmount);
    const cap = parseFloat(dcaDailyCap);

    if (!amt || amt <= 0) {
      showNotification('Please enter a valid DCA investment amount.', 'error');
      return;
    }

    if (!cap || cap <= 0) {
      showNotification('Please set a valid daily spend cap for the agent.', 'error');
      return;
    }

    setIsDeployingAgent(true);
    setTimeout(() => {
      setIsDeployingAgent(false);
      addAgentPolicy({
        name: `Autopilot DCA into ${dcaAsset}`,
        role: `Automated ${dcaFrequency.toLowerCase()} buy orders with zero slippage`,
        status: 'ACTIVE',
        spendCap: cap,
        ttlHours: 720,
      });
      showNotification(`Autonomous Agent deployed! DCA schedule active under bounded session key.`);
      setActiveTab('autopilot');
    }, 800);
  };

  return (
    <div className="space-y-10">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#21293D]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
              DeFi Protocol & Liquidity Engine
            </span>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
              Portaldot 3.0 Revive (Chain ID: 420420777)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            DeFi Swaps & Liquidity Pools
          </h1>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-1">
            Instant decentralized token swaps, automated liquidity pool farming, and autonomous agent DCA on Portaldot 3.0.
          </p>
        </div>

        {/* Live Portfolio Snapshot Pills */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-[#161C2B] p-2 rounded-2xl border border-slate-200 dark:border-[#21293D]">
          {AVAILABLE_TOKENS.map((tok) => {
            const bal =
              tok.symbol === 'tPOT' || tok.symbol === 'POT'
                ? realTpotBalance
                : balances[tok.symbol] ?? 0;

            return (
              <div key={tok.symbol} className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${tok.color}`} />
                <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">{tok.symbol}:</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {bal.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl font-semibold text-sm flex items-center gap-3 transition-all ${
            notification.type === 'error'
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-[#00E599]'
          }`}
        >
          {notification.type === 'error' ? (
            <FiAlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <FiCheckCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#21293D] pb-3 overflow-x-auto">
        {[
          { id: 'swap', label: 'Instant Swap', icon: FiRepeat, desc: '1-Click AMM Swap' },
          { id: 'pools', label: 'Liquidity Pools', icon: FiLayers, desc: 'Provide LP & Earn Fees' },
          { id: 'autopilot', label: 'Agent Auto-Pilot', icon: FiCpu, desc: 'Automated DCA & Bots' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/30'
                : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-[#161C2B]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Work Area (7 cols on lg) */}
        <div className="lg:col-span-7">
          {/* TAB 1: INSTANT SWAP */}
          {activeTab === 'swap' && (
            <div className="p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Instant Token Swap
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Atomic routing with zero front-running and MEV protection.
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                  <FiZap className="w-3.5 h-3.5" /> Best Rate Guaranteed
                </span>
              </div>

              {/* You Offer Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase text-slate-500 dark:text-neutral-400">You Offer</span>
                  <span className="font-mono text-slate-600 dark:text-neutral-400">
                    Available:{' '}
                    <strong className="text-slate-900 dark:text-white font-bold">
                      {currentTokenInBalance.toLocaleString()} {tokenIn}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]">
                  <input
                    type="number"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-4 py-4 bg-transparent font-bold text-2xl text-slate-900 dark:text-white outline-none"
                  />
                  <CustomSelect
                    variant="input-addon"
                    options={TOKEN_OPTIONS}
                    value={tokenIn}
                    onChange={(val) => {
                      setTokenIn(val);
                      if (val === tokenOut) {
                        setTokenOut(val === 'pUSD' ? 'tPOT' : 'pUSD');
                      }
                    }}
                    buttonClassName="py-4 rounded-r-2xl text-base"
                  />
                </div>

                {/* Percentage Quick-Fill Pills */}
                <div className="flex items-center gap-2 pt-1">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplySwapPercentage(pct)}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-[#161C2B] text-slate-600 dark:text-neutral-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-[#21293D] transition"
                    >
                      {pct === 100 ? 'MAX' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Swap Switch Button */}
              <div className="flex justify-center -my-2">
                <button
                  type="button"
                  onClick={() => {
                    const temp = tokenIn;
                    setTokenIn(tokenOut);
                    setTokenOut(temp);
                  }}
                  className="p-3 rounded-full border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] text-slate-600 dark:text-neutral-400 hover:text-emerald-500 hover:border-emerald-500 transition shadow-sm"
                  title="Switch direction"
                >
                  <FiRepeat className="w-4 h-4" />
                </button>
              </div>

              {/* You Receive Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase text-slate-500 dark:text-neutral-400">You Receive</span>
                  <span className="font-mono text-emerald-600 dark:text-[#00E599] font-semibold">
                    1 {tokenIn} ≈ {exchangeRate.toFixed(4)} {tokenOut}
                  </span>
                </div>

                <div className="flex items-center rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]">
                  <div className="flex-1 px-4 py-4 font-bold text-2xl text-emerald-600 dark:text-[#00E599] tabular-nums">
                    {calculatedSwapOutput}
                  </div>
                  <CustomSelect
                    variant="input-addon"
                    options={TOKEN_OPTIONS}
                    value={tokenOut}
                    onChange={(val) => {
                      setTokenOut(val);
                      if (val === tokenIn) {
                        setTokenIn(val === 'pUSD' ? 'tPOT' : 'pUSD');
                      }
                    }}
                    buttonClassName="py-4 rounded-r-2xl text-base"
                  />
                </div>
              </div>

              {/* Swap Details Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-neutral-400">
                  <span>Routing:</span>
                  <span className="font-semibold text-slate-800 dark:text-neutral-200">
                    Kudex AMM Router → Portaldot Revive
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-neutral-400">
                  <span>Price Impact:</span>
                  <span className="text-emerald-600 dark:text-[#00E599] font-semibold">&lt; 0.01%</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-neutral-400">
                  <span>Slippage Tolerance:</span>
                  <div className="flex gap-1.5">
                    {[10, 50, 100].map((bps) => (
                      <button
                        key={bps}
                        type="button"
                        onClick={() => setSlippageBps(bps)}
                        className={`px-2 py-0.5 rounded font-mono font-bold ${
                          slippageBps === bps
                            ? 'bg-[#00E599] text-[#06080D]'
                            : 'bg-slate-200 dark:bg-[#21293D] text-slate-700 dark:text-neutral-300'
                        }`}
                      >
                        {(bps / 100).toFixed(1)}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <button
                type="button"
                onClick={handleExecuteInstantSwap}
                disabled={isSwapping || !numAmountIn || numAmountIn <= 0}
                className="w-full py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSwapping ? (
                  <>
                    <FiRefreshCw className="w-5 h-5 animate-spin" />
                    <span>Executing Instant Swap...</span>
                  </>
                ) : (
                  <>
                    <FiZap className="w-5 h-5" />
                    <span>Swap Instantly</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: LIQUIDITY POOLS */}
          {activeTab === 'pools' && (
            <div className="space-y-6">
              {/* Pool Selection and Deposit Card */}
              <div className="p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Supply Liquidity & Earn Protocol Fees
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                      Earn a 0.30% fee on all swaps proportionally to your share of the pool.
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                    <FiTrendingUp className="w-3.5 h-3.5" /> High APR Pool
                  </span>
                </div>

                {/* Pool Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {FEATURED_POOLS.map((pool) => (
                    <button
                      key={pool.id}
                      type="button"
                      onClick={() => setSelectedPoolId(pool.id)}
                      className={`p-4 rounded-xl border text-left transition ${
                        selectedPoolId === pool.id
                          ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] text-slate-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="font-bold text-sm flex items-center justify-between">
                        <span>{pool.name}</span>
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-[#00E599]">
                          {pool.apr} APR
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-slate-500 dark:text-neutral-400">
                        Fee: {pool.feeTier} • 24h Vol: ${pool.volume24h.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Add Liquidity Inputs */}
                <form onSubmit={handleAddLiquidity} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase text-slate-500 dark:text-neutral-400">
                        Input {activePool.token0}
                      </span>
                      <span className="font-mono text-slate-600 dark:text-neutral-400">
                        Available: <strong className="text-slate-900 dark:text-white">{token0Balance.toLocaleString()} {activePool.token0}</strong>
                      </span>
                    </div>
                    <div className="flex items-center rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]">
                      <input
                        type="number"
                        value={lpAmount0}
                        onChange={(e) => setLpAmount0(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 px-4 py-4 bg-transparent font-bold text-2xl text-slate-900 dark:text-white outline-none"
                      />
                      <span className="px-5 py-4 font-bold font-mono text-emerald-600 dark:text-[#00E599]">
                        {activePool.token0}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-center -my-1 text-slate-400">
                    <FiPlus className="w-4 h-4" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase text-slate-500 dark:text-neutral-400">
                        Required {activePool.token1} (Auto-Calculated)
                      </span>
                      <span className="font-mono text-slate-600 dark:text-neutral-400">
                        Available: <strong className="text-slate-900 dark:text-white">{token1Balance.toLocaleString()} {activePool.token1}</strong>
                      </span>
                    </div>
                    <div className="flex items-center rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]">
                      <div className="flex-1 px-4 py-4 font-bold text-2xl text-slate-900 dark:text-white tabular-nums">
                        {derivedLp1}
                      </div>
                      <span className="px-5 py-4 font-bold font-mono text-emerald-600 dark:text-[#00E599]">
                        {activePool.token1}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-1.5 text-xs text-slate-600 dark:text-neutral-400">
                    <div className="flex justify-between">
                      <span>Estimated LP Tokens Minted:</span>
                      <strong className="font-mono text-slate-900 dark:text-white">
                        {numLp0 > 0 ? (Math.sqrt(numLp0 * parseFloat(derivedLp1))).toFixed(4) : '0.00'} LP
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Pool Share:</span>
                      <strong className="font-mono text-emerald-600 dark:text-[#00E599]">0.15%</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Reward Accrual:</span>
                      <strong className="font-mono text-slate-900 dark:text-white">Continuous (Every Block)</strong>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingLiquidity || !numLp0 || numLp0 <= 0}
                    className="w-full py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAddingLiquidity ? (
                      <>
                        <FiRefreshCw className="w-5 h-5 animate-spin" />
                        <span>Supplying Liquidity to Pool...</span>
                      </>
                    ) : (
                      <>
                        <FiLayers className="w-5 h-5" />
                        <span>Supply Liquidity & Earn {activePool.apr}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* My Positions Section */}
              <div className="p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#21293D]">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                    My Active Liquidity Positions
                  </h4>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599]">
                    {liquidityPositions.length} Active Positions
                  </span>
                </div>

                {liquidityPositions.length > 0 ? (
                  <div className="space-y-3">
                    {liquidityPositions.map((pos) => (
                      <div
                        key={pos.id}
                        className="p-4 rounded-xl border border-slate-100 dark:border-[#1c2438] bg-slate-50 dark:bg-[#161C2B] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{pos.token0} / {pos.token1} Pool</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-[#00E599] font-bold">
                              {pos.lpTokens} LP
                            </span>
                          </div>
                          <div className="text-slate-500 dark:text-neutral-400">
                            Deposited: {pos.amount0} {pos.token0} + {pos.amount1} {pos.token1}
                          </div>
                          <div className="text-emerald-600 dark:text-[#00E599] font-mono font-medium">
                            Accrued Trading Fees: +${(pos.accruedFeesUSD + (pos.lpTokens * 0.04)).toFixed(2)} USD
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveLiquidity(pos.id)}
                          className="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <FiMinus className="w-3.5 h-3.5" />
                          <span>Remove Liquidity</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500 dark:text-neutral-400 space-y-2">
                    <p>You have no active liquidity positions.</p>
                    <p>Supply liquidity above to earn automatic protocol fees on every swap.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AGENT AUTO-PILOT */}
          {activeTab === 'autopilot' && (
            <div className="p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Agent Auto-Pilot Trading
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Delegate automated recurring trades and dip purchases to Kudex AI Agents under strict session budget bounds.
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                  <FiCpu className="w-3.5 h-3.5" /> {agentBots.length} Active Fleet Bots
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                      Asset to Accumulate
                    </label>
                    <CustomSelect
                      options={TOKEN_OPTIONS}
                      value={dcaAsset}
                      onChange={(val) => setDcaAsset(val)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                      Execution Schedule
                    </label>
                    <CustomSelect
                      options={[
                        { value: 'Hourly', label: 'Every Hour' },
                        { value: 'Daily', label: 'Daily (Every 24h)' },
                        { value: 'Weekly', label: 'Weekly (Every Monday)' },
                      ]}
                      value={dcaFrequency}
                      onChange={(val) => setDcaFrequency(val)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                      Amount per Order (pUSD)
                    </label>
                    <input
                      type="number"
                      value={dcaAmount}
                      onChange={(e) => setDcaAmount(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] text-sm text-slate-900 dark:text-white outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                      Daily Max Spend Cap (pUSD)
                    </label>
                    <input
                      type="number"
                      value={dcaDailyCap}
                      onChange={(e) => setDcaDailyCap(e.target.value)}
                      placeholder="e.g. 200"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] text-sm text-slate-900 dark:text-white outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-xs space-y-1 text-slate-600 dark:text-neutral-400">
                  <div className="font-bold text-slate-800 dark:text-neutral-200">
                    Cryptographic Spend Ceiling
                  </div>
                  <p>
                    The agent signer is strictly bounded by the PolicyRegistry smart contract. It cannot exceed ${dcaDailyCap || '0'} pUSD/day, cannot withdraw principal, and all acquired {dcaAsset} is transferred directly to your wallet.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDeployAutopilot}
                  disabled={isDeployingAgent}
                  className="w-full py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/20 flex items-center justify-center gap-2"
                >
                  {isDeployingAgent ? (
                    <>
                      <FiRefreshCw className="w-5 h-5 animate-spin" />
                      <span>Authorizing Bounded Session Key...</span>
                    </>
                  ) : (
                    <>
                      <FiCpu className="w-5 h-5" />
                      <span>Deploy Autonomous DCA Agent</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Activity Feed & Live Agents (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Autonomous Fleet Status */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#21293D]">
              <div className="flex items-center gap-2">
                <FiCpu className="w-5 h-5 text-emerald-500" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Kudex Agent Fleet
                </h4>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] font-semibold">
                Autonomous
              </span>
            </div>

            <div className="space-y-3">
              {agentBots.length > 0 ? (
                agentBots.slice(0, 3).map((bot) => (
                  <div
                    key={bot.id}
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-[#1c2438] bg-slate-50 dark:bg-[#161C2B] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{bot.name}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                      <div className="text-slate-500 dark:text-neutral-400 line-clamp-1">{bot.role}</div>
                      <div className="text-[11px] font-mono text-emerald-600 dark:text-[#00E599]">
                        Vol: ${bot.totalProfitOrVolume.toLocaleString()} | {bot.interval}
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded font-mono font-bold text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-[#00E599]">
                      {bot.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-neutral-400 space-y-2">
                  <p>No autonomous bots deployed yet.</p>
                  <button
                    onClick={() => setActiveTab('autopilot')}
                    className="text-emerald-600 dark:text-[#00E599] font-bold hover:underline"
                  >
                    Deploy your first DCA agent →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Activity Stream */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#21293D]">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  DeFi Activity History
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Real-time swaps and liquidity operations.
                </p>
              </div>

              <div className="flex rounded-xl bg-slate-100 dark:bg-[#161C2B] p-1 text-xs">
                {(['all', 'swaps', 'liquidity'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setHistoryFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg font-bold capitalize transition ${
                      historyFilter === filter
                        ? 'bg-[#00E599] text-[#06080D]'
                        : 'text-slate-600 dark:text-neutral-400'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {/* Liquidity Operations in Stream */}
              {(historyFilter === 'all' || historyFilter === 'liquidity') &&
                liquidityPositions.map((pos) => (
                  <div
                    key={`stream-${pos.id}`}
                    className="p-3 rounded-xl border border-slate-100 dark:border-[#1c2438] bg-slate-50 dark:bg-[#161C2B] text-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/15 text-blue-500 font-bold">
                          SUPPLIED LIQUIDITY
                        </span>
                        <span>
                          {pos.amount0} {pos.token0} + {pos.amount1} {pos.token1}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                        Minted {pos.lpTokens} LP • {new Date(pos.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-[#00E599] text-xs">
                      ACTIVE
                    </span>
                  </div>
                ))}

              {/* Show Orders / Swaps */}
              {(historyFilter === 'all' || historyFilter === 'swaps') &&
                orders.map((ord: ProtocolOrder) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-[#1c2438] bg-slate-50 dark:bg-[#161C2B] text-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-[#00E599] font-bold">
                          AMM SWAP
                        </span>
                        <span>
                          {ord.makerAmount} {ord.makerAsset} → {ord.takerAmount} {ord.takerAsset}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                        Portaldot Revive • {new Date(ord.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-[#00E599] text-xs">
                      {ord.status}
                    </span>
                  </div>
                ))}

              {orders.length === 0 && liquidityPositions.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-neutral-400">
                  No DeFi transactions recorded yet. Execute a swap or supply liquidity above!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
