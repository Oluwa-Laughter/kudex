'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { kudexRFQMarketAbi } from '@/lib/contracts/abis';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { parseTokenAmount, formatTokenAmount, POT_DECIMALS, USDC_DECIMALS } from '@/lib/math';
import { RFQQuoteCard } from '@/components/generative/RFQQuoteCard';
import { PreFlightSimCard } from '@/components/generative/PreFlightSimCard';
import { simulatePreFlightTransaction, SimulationResult } from '@/lib/simulation';
import { truncateAddress } from '@/lib/utils';
import {
  FiRepeat,
  FiZap,
  FiShield,
  FiArrowRight,
  FiCheckCircle,
  FiExternalLink,
  FiCpu,
} from 'react-icons/fi';

const LIVE_ORDERS = [
  {
    orderHash: '0x8f2d91a0c4b3e8d2e1a4f7b9c2d1e0a8f7b9c2d1e0a8f7b9c2d1e0a8f7b9c2d1' as `0x${string}`,
    maker: '0x9a84B7eCc3910c81D00B36E92b192809A18e384D' as `0x${string}`,
    tokenInSymbol: 'pUSD',
    tokenInDecimals: USDC_DECIMALS,
    tokenOutSymbol: 'wPOT',
    tokenOutDecimals: POT_DECIMALS,
    amountIn: BigInt(500000000), // 500 pUSD
    amountOut: BigInt(2500000000000000), // 250 wPOT (14 dec)
    solver: 'Portaldot Solver Alpha',
    deadline: '24m remaining',
  },
  {
    orderHash: '0x1c4e7b9a0d2f4a6b8e0a2d4f6b8e0a2d4f6b8e0a2d4f6b8e0a2d4f6b8e0a2d4f' as `0x${string}`,
    maker: '0x3Fe157482810EbA0bA3b40049454Fe98c813a1B9' as `0x${string}`,
    tokenInSymbol: 'wPOT',
    tokenInDecimals: POT_DECIMALS,
    tokenOutSymbol: 'pUSD',
    tokenOutDecimals: USDC_DECIMALS,
    amountIn: BigInt(1000000000000000), // 100 wPOT (14 dec)
    amountOut: BigInt(204000000), // 204 pUSD
    solver: 'Portaldot Solver Beta',
    deadline: '52m remaining',
  },
];

export default function RFQPage() {
  const { isConnected } = useAccount();
  const [tokenIn, setTokenIn] = useState('pUSD');
  const [tokenOut, setTokenOut] = useState('wPOT');
  const [amountIn, setAmountIn] = useState('100');
  const [generatedQuote, setGeneratedQuote] = useState<any | null>(null);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleRequestQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountIn) return;

    setIsSimulating(true);

    const inDecimals = tokenIn === 'wPOT' ? POT_DECIMALS : USDC_DECIMALS;
    const outDecimals = tokenOut === 'wPOT' ? POT_DECIMALS : USDC_DECIMALS;
    const amountInBigInt = parseTokenAmount(amountIn, inDecimals);

    // Calculate exact receive amount with 15 bps spread (zero floats!)
    const solverFee = (amountInBigInt * BigInt(15)) / BigInt(10000);
    const amountOutBigInt = amountInBigInt - solverFee;
    const estimatedReceive = formatTokenAmount(amountOutBigInt, inDecimals);

    // Execute pre-flight state diff simulation
    const sim = await simulatePreFlightTransaction(
      CONTRACT_ADDRESSES.rfqMarketRouter,
      '0x38ed1739',
      tokenIn,
      amountIn
    );

    setSimResult(sim);
    setGeneratedQuote({
      tokenIn,
      tokenOut,
      amountIn,
      estimatedReceive,
      solver: '0xSolverPortaldotAlpha77',
      estimatedGasPOT: '0.00014',
      routerAddress: CONTRACT_ADDRESSES.rfqMarketRouter,
      maxSlippageBps: 50,
    });
    setIsSimulating(false);
  };

  const handleFillOrder = (order: typeof LIVE_ORDERS[0]) => {
    writeContract({
      address: CONTRACT_ADDRESSES.rfqMarketRouter,
      abi: kudexRFQMarketAbi,
      functionName: 'fillOrder',
      args: [
        {
          maker: order.maker,
          tokenIn: CONTRACT_ADDRESSES.tokens.pUSD.address,
          tokenOut: CONTRACT_ADDRESSES.tokens.wPOT.address,
          amountIn: order.amountIn,
          amountOut: order.amountOut,
          deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
          nonce: BigInt(1),
        },
        '0x',
      ],
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
            Agentic RFQ Solver Orderbook
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-1">
            Zero-MEV atomic cross-chain settlement router on Portaldot Network V3.0 EVM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/60 text-xs font-mono">
            <span>Solvers Online: </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">12 Active</span>
          </div>
        </div>
      </div>

      {/* Split Layout: Request Quote Box & Active Solver Orderbook */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Request RFQ Quote Column */}
        <div className="lg:col-span-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-5">
            <div className="flex items-center gap-2">
              <FiRepeat className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                Request RFQ Quote
              </h2>
            </div>
            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
              Zero MEV Leakage
            </span>
          </div>

          <form onSubmit={handleRequestQuote} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-neutral-500 mb-1.5 uppercase">
                You Pay
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-neutral-900 dark:text-neutral-100"
                />
                <select
                  value={tokenIn}
                  onChange={(e) => setTokenIn(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200"
                >
                  <option value="pUSD">pUSD (6 dec)</option>
                  <option value="wPOT">wPOT (14 dec)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-center -my-1">
              <button
                type="button"
                onClick={() => {
                  const prevIn = tokenIn;
                  setTokenIn(tokenOut);
                  setTokenOut(prevIn);
                }}
                className="p-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-emerald-500 transition shadow-sm"
              >
                <FiRepeat className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-500 mb-1.5 uppercase">
                You Receive (Estimated)
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/30 text-sm font-mono text-neutral-800 dark:text-neutral-200 flex items-center">
                  {generatedQuote ? generatedQuote.estimatedReceive : '0.00'}
                </div>
                <select
                  value={tokenOut}
                  onChange={(e) => setTokenOut(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-mono font-medium text-neutral-800 dark:text-neutral-200"
                >
                  <option value="wPOT">wPOT (14 dec)</option>
                  <option value="pUSD">pUSD (6 dec)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs font-mono transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <FiZap className="w-4 h-4" />
              <span>{isSimulating ? 'Evaluating Solver Routes...' : 'Request Competitive RFQ Quote'}</span>
            </button>
          </form>

          {/* Render PreFlight & Quote Card */}
          {simResult && <PreFlightSimCard simulation={simResult} />}
          {generatedQuote && <RFQQuoteCard quote={generatedQuote} />}
        </div>

        {/* Live Solver Orderbook Column */}
        <div className="lg:col-span-7 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-5">
            <div className="flex items-center gap-2">
              <FiCpu className="w-4 h-4 text-emerald-500" />
              <h2 className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                Live Liquidity Solvers & Fillable Orders
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Atomic Settlement Router
            </span>
          </div>

          <div className="space-y-3">
            {LIVE_ORDERS.map((order, idx) => (
              <div
                key={order.orderHash}
                className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 hover:border-emerald-500/40 transition text-xs font-mono"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                      ORDER #{idx + 1}
                    </span>
                    <span className="text-neutral-500 text-[11px]">
                      Maker: {truncateAddress(order.maker)}
                    </span>
                  </div>
                  <span className="text-neutral-400 text-[11px]">{order.deadline}</span>
                </div>

                <div className="grid grid-cols-3 items-center py-2 border-y border-neutral-100 dark:border-neutral-800/80 mb-3">
                  <div>
                    <span className="text-neutral-400 text-[11px] block">Offering:</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {formatTokenAmount(order.amountIn, order.tokenInDecimals)} {order.tokenInSymbol}
                    </span>
                  </div>

                  <div className="flex justify-center text-neutral-400">
                    <FiArrowRight className="w-4 h-4" />
                  </div>

                  <div className="text-right">
                    <span className="text-neutral-400 text-[11px] block">Receiving:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatTokenAmount(order.amountOut, order.tokenOutDecimals)} {order.tokenOutSymbol}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                    <FiShield className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Solver: {order.solver}</span>
                  </div>

                  <button
                    onClick={() => handleFillOrder(order)}
                    disabled={isPending || isConfirming || !isConnected}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition text-[11px] font-medium disabled:opacity-50"
                  >
                    {isPending || isConfirming ? 'Filling...' : 'Fill Atomic Order'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {txHash && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between text-emerald-700 dark:text-emerald-300">
              <div className="flex items-center gap-1.5">
                <FiCheckCircle className="w-4 h-4" />
                <span>{isConfirmed ? 'Order Filled & Settled' : 'Broadcasting to Solvers...'}</span>
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
        </div>
      </div>
    </div>
  );
}
