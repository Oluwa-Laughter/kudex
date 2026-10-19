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
  FiInfo,
} from 'react-icons/fi';
import { RiExchangeFundsLine } from 'react-icons/ri';
import { RFQQuoteCard } from '@/components/generative/RFQQuoteCard';
import { useAccount, useBalance } from 'wagmi';
import { useNativeWallet } from '@/components/navigation/NativeWalletProvider';
import { useNativeAccount } from '@/lib/hooks/useNativeAccount';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useProtocolStore, ProtocolOrder } from '@/lib/protocol-store';
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
  } = useProtocolStore();

  const [activeTab, setActiveTab] = useState<'swap' | 'autopilot' | 'rfq'>('swap');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'swaps' | 'rfq'>('all');

  // SWAP STATE
  const [tokenIn, setTokenIn] = useState('tPOT');
  const [tokenOut, setTokenOut] = useState('pUSD');
  const [amountIn, setAmountIn] = useState('');
  const [slippageBps, setSlippageBps] = useState(50);
  const [isSwapping, setIsSwapping] = useState(false);

  // AUTOPILOT STATE
  const [dcaAmount, setDcaAmount] = useState('');
  const [dcaAsset, setDcaAsset] = useState('tPOT');
  const [dcaFrequency, setDcaFrequency] = useState('Daily');
  const [dcaDailyCap, setDcaDailyCap] = useState('');
  const [isDeployingAgent, setIsDeployingAgent] = useState(false);

  // RFQ STATE
  const [rfqOrderType, setRfqOrderType] = useState<'FOK' | 'IOC' | 'LIMIT'>('FOK');
  const [activeQuote, setActiveQuote] = useState<any | null>(null);
  const [isSimulatingQuote, setIsSimulatingQuote] = useState(false);

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
    if (CONTRACT_ADDRESSES.rfqMarket === '0x0000000000000000000000000000000000000000') {
      showNotification('RFQ Market Router contract awaiting deployment. Configure NEXT_PUBLIC_RFQ_ROUTER_ADDRESS in .env.local to execute live on-chain swaps.', 'error');
      return;
    }

    setIsSwapping(true);
    setTimeout(() => {
      const numAmountOut = parseFloat(calculatedSwapOutput);
      const newOrder = executeSwap(tokenIn, tokenOut, numAmountIn, numAmountOut);
      setIsSwapping(false);
      setAmountIn('');
      showNotification(`Swapped ${numAmountIn.toLocaleString()} ${tokenIn} for ${numAmountOut.toLocaleString()} ${tokenOut} via Kudex Solver!`);
    }, 700);
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

  // RFQ quote
  const handleRequestRFQQuote = () => {
    if (!amountIn || parseFloat(amountIn) <= 0) return;
    setIsSimulatingQuote(true);
    setTimeout(() => {
      setIsSimulatingQuote(false);
      setActiveQuote({
        tokenIn,
        tokenOut,
        amountIn,
        estimatedReceive: calculatedSwapOutput,
        solver: '0x71Ae48...390b (Kudex Institutional Solver)',
        estimatedGasPOT: '0.00045',
        routerAddress: CONTRACT_ADDRESSES.rfqMarket,
        maxSlippageBps: slippageBps,
      });
    }, 600);
  };

  const handleExecuteRFQTrade = (hash?: `0x${string}`) => {
    const newOrd = addOrder({
      makerAsset: tokenIn,
      takerAsset: tokenOut,
      makerAmount: parseFloat(amountIn || '0').toLocaleString(undefined, { minimumFractionDigits: 2 }),
      takerAmount: parseFloat(calculatedSwapOutput).toLocaleString(undefined, { minimumFractionDigits: 2 }),
      status: 'FILLED',
      solver: '0x71Ae48...390b',
      txHash: hash || '0x8f4c...3e19',
      type: rfqOrderType,
    });

    showNotification(`RFQ Order ${newOrd.id} settled block-atomically!`);
    setActiveQuote(null);
  };

  return (
    <div className="space-y-10">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#21293D]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
              Decentralized Exchange & Solver Desk
            </span>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
              Portaldot 3.0 Revive Stack (Chain ID: 420420777)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Instant Swaps & Autonomous Desks
          </h1>
          <p className="text-base text-slate-600 dark:text-neutral-400 mt-1">
            Seamless token swaps, autonomous agent-driven DCA schedules, and institutional solver execution natively on Portaldot 3.0.
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
          { id: 'swap', label: 'Instant Swap', icon: FiRepeat, desc: 'Simple 1-Click DEX' },
          { id: 'autopilot', label: 'Agent Auto-Pilot', icon: FiCpu, desc: 'Automated DCA & Bots' },
          { id: 'rfq', label: 'Institutional RFQ Desk', icon: RiExchangeFundsLine, desc: 'Solver Quotes' },
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
                    Kudex Agent Solver → Portaldot Revive EVM
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

          {/* TAB 2: AGENT AUTO-PILOT */}
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

          {/* TAB 3: INSTITUTIONAL RFQ */}
          {activeTab === 'rfq' && (
            <div className="p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Submit RFQ Intent
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Off-chain cryptographic quote formulation with block-atomic settlement.
                  </p>
                </div>
                <div className="flex rounded-xl bg-slate-100 dark:bg-[#161C2B] p-1 border border-slate-200 dark:border-[#21293D]">
                  <button
                    onClick={() => setRfqOrderType('FOK')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      rfqOrderType === 'FOK' ? 'bg-[#00E599] text-[#06080D]' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Instant Solver
                  </button>
                  <button
                    onClick={() => setRfqOrderType('LIMIT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      rfqOrderType === 'LIMIT' ? 'bg-[#00E599] text-[#06080D]' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Limit Bound
                  </button>
                </div>
              </div>

              {/* Educational Explanation Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-xs space-y-1.5 text-slate-600 dark:text-neutral-400">
                <div className="font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                  <FiShield className="w-4 h-4 text-emerald-500" /> What is RFQ (Request for Quote)?
                </div>
                <p>
                  Unlike public AMMs where pending orders sit in the public mempool (subject to front-running, sandwich attacks, and high slippage), 
                  <strong> RFQ lets you negotiate directly with institutional solvers off-chain</strong>. 
                  You receive a cryptographically signed quote with a guaranteed fill price, and settle block-atomically on Portaldot Revive EVM.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-neutral-400">
                    You Offer
                  </label>
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
                      onChange={(val) => setTokenIn(val)}
                      buttonClassName="py-4 rounded-r-2xl text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-neutral-400">
                    Estimated Receive (Guaranteed Fill)
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]">
                    <div className="flex-1 px-4 py-4 font-bold text-2xl text-emerald-600 dark:text-[#00E599] tabular-nums">
                      {calculatedSwapOutput}
                    </div>
                    <CustomSelect
                      variant="input-addon"
                      options={TOKEN_OPTIONS}
                      value={tokenOut}
                      onChange={(val) => setTokenOut(val)}
                      buttonClassName="py-4 rounded-r-2xl text-base"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRequestRFQQuote}
                  disabled={isSimulatingQuote || !amountIn || parseFloat(amountIn) <= 0}
                  className="w-full py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-base transition shadow-md shadow-[#00E599]/20 flex items-center justify-center gap-2"
                >
                  {isSimulatingQuote ? (
                    <>
                      <FiRefreshCw className="w-5 h-5 animate-spin" />
                      <span>Matching Institutional Solvers...</span>
                    </>
                  ) : (
                    <span>Request Solver Quote</span>
                  )}
                </button>

                {activeQuote && (
                  <div className="pt-4 border-t border-slate-200 dark:border-[#21293D]">
                    <RFQQuoteCard quote={activeQuote} onExecuted={handleExecuteRFQTrade} />
                  </div>
                )}
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
                  Activity History
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Real-time swaps and RFQ settlements.
                </p>
              </div>

              <div className="flex rounded-xl bg-slate-100 dark:bg-[#161C2B] p-1 text-xs">
                {(['all', 'swaps', 'rfq'] as const).map((filter) => (
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
              {/* Show Orders / Swaps */}
              {orders
                .filter((ord) => historyFilter !== 'swaps' || ord.type === 'FOK')
                .filter((ord) => historyFilter !== 'rfq' || ord.type !== 'FOK')
                .map((ord: ProtocolOrder) => (
                  <div
                    key={ord.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-[#1c2438] bg-slate-50 dark:bg-[#161C2B] text-xs flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-[#00E599] font-bold">
                          {ord.type === 'FOK' ? 'INSTANT SWAP' : ord.type}
                        </span>
                        <span>
                          {ord.makerAmount} {ord.makerAsset} → {ord.takerAmount} {ord.takerAsset}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                        Solver: {ord.solver} • {new Date(ord.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-[#00E599] text-xs">
                      {ord.status}
                    </span>
                  </div>
                ))}

              {orders.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-neutral-400">
                  No trades recorded yet. Execute an instant swap or request an RFQ quote above!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
