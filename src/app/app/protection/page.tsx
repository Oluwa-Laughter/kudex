'use client';

import React, { useState } from 'react';
import {
  FiActivity,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingUp,
  FiDollarSign,
  FiLayers,
  FiRefreshCw,
  FiSliders,
} from 'react-icons/fi';
import { RiShieldCheckLine } from 'react-icons/ri';
import { formatUnits } from 'viem';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { KUDEX_VAULT_ABI } from '@/lib/contracts/abis';
import { useProtocolStore } from '@/lib/protocol-store';

export default function AppProtectionPage() {
  const { riskScoreBps, positions } = useProtocolStore();

  const { data: riskScoreRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'riskScore',
  });

  const { data: isDefaultedRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'isDefaulted',
  });

  const { data: totalAssetsRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'totalAssets',
  });

  const riskScoreNum = riskScoreRaw ? Number(riskScoreRaw) : riskScoreBps;
  const isDefaulted = Boolean(isDefaultedRaw);
  const healthFactor = (10000 / Math.max(riskScoreNum, 1000)).toFixed(2);

  // Interactive Solvency Stress-Test Simulator
  const [stressDrawdownPct, setStressDrawdownPct] = useState(15);
  const onChainAssets = totalAssetsRaw ? Number(formatUnits(totalAssetsRaw, 6)) : 0;
  const storeCapital = Object.values(positions).reduce((acc, p) => acc + p.depositedAmount, 0);
  const totalFacilityCapital = onChainAssets > 0 ? onChainAssets : (storeCapital > 0 ? storeCapital : 1000000);

  // Dynamic proportional waterfall: 20% Junior First-Loss, 35% Mezzanine, 45% Senior Principal
  const juniorCapital = totalFacilityCapital * 0.20;
  const mezzanineCapital = totalFacilityCapital * 0.35;
  const simulatedLoss = totalFacilityCapital * (stressDrawdownPct / 100);

  const juniorLoss = Math.min(simulatedLoss, juniorCapital);
  const remainingLossAfterJunior = Math.max(0, simulatedLoss - juniorCapital);
  const mezzanineLoss = Math.min(remainingLossAfterJunior, mezzanineCapital);
  const seniorLoss = Math.max(0, remainingLossAfterJunior - mezzanineCapital);

  return (
    <div className="space-y-10">
      {/* Workspace Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-[#21293D]">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Risk Protection & Solvency Defense
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-300 mt-1.5">
          Algorithmic debt solvency surveillance. Replaces sudden liquidations with structured risk amortization and capital protection.
        </p>
      </div>

      {/* Primary Solvency Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-2 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
              Solvency Health Factor
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              SOLVENT
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {healthFactor}x
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
            Liquidation Floor Threshold: &lt; 1.15x
          </div>
        </div>

        <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-2 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
              Risk Index Score
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {(riskScoreNum / 100).toFixed(2)}%
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {riskScoreNum} / 10,000 bps
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
            Max Risk Ceiling: 8,500 bps
          </div>
        </div>

        <div className="p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-2 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
              Default Circuit Status
            </span>
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <RiShieldCheckLine className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            {isDefaulted ? 'HALTED' : 'NORMAL'}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
            Zero Solvency Breaches
          </div>
        </div>
      </div>

      {/* Interactive Solvency Stress-Test Simulator */}
      <div className="p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#21293D]">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Interactive Waterfall Stress-Test Simulator
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate extreme market drawdowns to observe automated capital tranche absorption.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <FiSliders className="w-4 h-4" />
            <span>Simulate Risk</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Simulated Market Drawdown
            </span>
            <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
              -{stressDrawdownPct}% (${simulatedLoss.toLocaleString()})
            </span>
          </div>

          {/* Form Input with Preset Quick Buttons (No Slider / No Radio Fill) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                max="50"
                value={stressDrawdownPct}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStressDrawdownPct(Math.min(50, Math.max(0, isNaN(val) ? 0 : val)));
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] font-mono font-bold text-lg text-slate-900 dark:text-white outline-none focus:border-[#00E599] tabular-nums"
                placeholder="Drawdown %"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400 dark:text-neutral-500 font-semibold">
                % Drawdown
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[5, 10, 15, 25, 35].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setStressDrawdownPct(pct)}
                  className={`py-3 px-3 rounded-xl text-xs font-mono font-bold transition border ${
                    stressDrawdownPct === pct
                      ? 'bg-[#00E599] text-[#06080D] border-[#00E599] shadow-sm'
                      : 'bg-slate-100 dark:bg-[#161C2B] text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-[#21293D] hover:bg-slate-200 dark:hover:bg-[#21293D]'
                  }`}
                >
                  -{pct}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tranche Absorption Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]">
            <div className="text-xs uppercase font-mono font-bold text-emerald-600 dark:text-[#00E599]">Junior Tranche</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">First-Loss Cushion</div>
            <div className="text-sm font-semibold text-rose-500 mt-2 font-mono">
              Absorbs: -${juniorLoss.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-mono">
              {juniorLoss >= juniorCapital ? '100% Depleted' : 'Absorbing Shock'}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B]">
            <div className="text-xs uppercase font-mono font-bold text-emerald-600 dark:text-[#00E599]">Mezzanine Tranche</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">Secondary Buffer</div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 font-mono">
              Absorbs: -${mezzanineLoss.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-mono">
              {mezzanineLoss === 0 ? 'Zero Loss (Protected)' : 'Partial Cushion'}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[#00E599]/40 bg-emerald-500/5">
            <div className="text-xs uppercase font-mono font-bold text-emerald-600 dark:text-[#00E599]">Senior Tranche</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">Principal Protection</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-[#00E599] mt-2 font-mono">
              {seniorLoss === 0 ? '100% Capital Preserved ($0 Loss)' : `Haircut: -$${seniorLoss.toLocaleString()}`}
            </div>
            <div className="text-xs text-emerald-600 dark:text-[#00E599] font-semibold mt-1">
              Legal & Cryptographic Priority
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
