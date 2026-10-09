'use client';

import React, { useState } from 'react';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { FiArrowRight, FiShield, FiZap, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { truncateAddress } from '@/lib/utils';

export interface RFQQuoteProps {
  quote: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    estimatedReceive: string;
    solver: string;
    estimatedGasPOT: string;
    routerAddress: `0x${string}`;
    maxSlippageBps?: number;
  };
  onExecuted?: (txHash: `0x${string}`) => void;
}

export function RFQQuoteCard({ quote, onExecuted }: RFQQuoteProps) {
  const { sendTransaction, data: hash, isPending, error } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const [sessionExecuted, setSessionExecuted] = useState(false);

  const handleExecute = () => {
    sendTransaction(
      {
        to: quote.routerAddress,
        value: BigInt(0),
        data: '0x38ed1739', // fillOrder selector
      },
      {
        onSuccess: (txHash) => {
          setSessionExecuted(true);
          if (onExecuted) onExecuted(txHash);
        },
      }
    );
  };

  return (
    <div className="my-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/80 p-5 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 font-mono">
          Agentic RFQ Order
        </span>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <FiShield className="w-4 h-4" />
          <span>Pre-Flight Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-3 items-center py-4">
        <div>
          <p className="text-xs text-neutral-400">You Offer</p>
          <p className="text-base font-semibold text-neutral-900 dark:text-white tabular-nums font-mono">
            {quote.amountIn} {quote.tokenIn}
          </p>
        </div>
        <div className="flex justify-center">
          <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
            <FiArrowRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-400">You Receive</p>
          <p className="text-base font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
            {quote.estimatedReceive} {quote.tokenOut}
          </p>
        </div>
      </div>

      <div className="py-2.5 px-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 mb-4 text-xs flex flex-wrap items-center justify-between gap-2 border border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 text-neutral-500">
          <span>Solver:</span>
          <span className="font-mono text-neutral-800 dark:text-neutral-200">
            {quote.solver.startsWith('0x') ? truncateAddress(quote.solver) : quote.solver}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-neutral-500">
          <span>Slippage:</span>
          <span className="font-mono text-neutral-800 dark:text-neutral-200">
            {quote.maxSlippageBps ? `${(quote.maxSlippageBps / 100).toFixed(2)}%` : '0.50%'}
          </span>
        </div>
      </div>

      {hash && (
        <div className="mb-3 p-3 rounded-xl bg-[#00E599]/10 border border-[#00E599]/30 text-xs flex items-center justify-between text-[#00E599]">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="w-4 h-4 text-[#00E599]" />
            <span className="font-medium">{isConfirmed ? 'Settlement Confirmed' : 'Settling on Primary Ledger...'}</span>
          </div>
          <a
            href={`https://testnet.portaldot.world/explorer/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 font-mono hover:underline"
          >
            {truncateAddress(hash)}
            <FiExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400">
          {error.message.slice(0, 120)}...
        </div>
      )}

      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div className="text-xs text-neutral-500">
          <span>Est. Gas: </span>
          <span className="font-mono text-neutral-700 dark:text-neutral-300">
            {quote.estimatedGasPOT} POT
          </span>
        </div>

        <button
          onClick={handleExecute}
          disabled={isPending || isConfirming || (isConfirmed && sessionExecuted)}
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 disabled:opacity-50"
        >
          <FiZap className="w-3.5 h-3.5" />
          {isPending || isConfirming
            ? 'Executing...'
            : isConfirmed
            ? 'Settled'
            : 'Confirm Via Session Key'}
        </button>
      </div>
    </div>
  );
}
