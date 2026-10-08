'use client';

import React from 'react';
import { FiCheckCircle, FiAlertTriangle, FiActivity, FiLayers, FiDollarSign } from 'react-icons/fi';
import { SimulationResult } from '@/lib/simulation';

interface PreFlightSimCardProps {
  simulation: SimulationResult;
}

export function PreFlightSimCard({ simulation }: PreFlightSimCardProps) {
  return (
    <div className="my-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/80 p-5 backdrop-blur-md shadow-sm font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              simulation.isSafe
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}
          >
            {simulation.isSafe ? (
              <FiCheckCircle className="w-4 h-4" />
            ) : (
              <FiAlertTriangle className="w-4 h-4" />
            )}
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Pre-Flight Invariant Simulation
            </span>
            <p className="text-[11px] text-neutral-400">Portaldot V3.0 EVM State Diff Interceptor</p>
          </div>
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border ${
            simulation.isSafe
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
          }`}
        >
          {simulation.isSafe ? 'PASS: Invariant Preserved' : 'FAIL: Risk Flagged'}
        </div>
      </div>

      <div className="space-y-3 py-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mb-1">
              <FiDollarSign className="w-3.5 h-3.5" />
              <span>Projected Balance Delta</span>
            </div>
            <span className="font-mono text-neutral-800 dark:text-neutral-100 font-semibold">
              {simulation.assetDelta}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mb-1">
              <FiActivity className="w-3.5 h-3.5" />
              <span>Est. Execution Gas</span>
            </div>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              {simulation.gasEstimatePOT} POT
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] mb-1">
            <FiLayers className="w-3.5 h-3.5" />
            <span>Allowance & Approval Ceiling</span>
          </div>
          <span className="text-neutral-700 dark:text-neutral-300">
            {simulation.approvalStatus}
          </span>
        </div>

        <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-800/60">
          <span className="text-neutral-400 block text-[11px] mb-1">Security Audit Summary</span>
          <p className="text-neutral-700 dark:text-neutral-300 font-mono text-[11px]">
            {simulation.securitySummary}
          </p>
        </div>
      </div>
    </div>
  );
}
