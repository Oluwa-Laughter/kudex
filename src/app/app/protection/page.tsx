'use client';

import React from 'react';
import {
  FiActivity,
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiTrendingUp,
  FiDollarSign,
  FiLayers,
  FiRefreshCw,
} from 'react-icons/fi';
import { RiShieldCheckLine } from 'react-icons/ri';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { KUDEX_VAULT_ABI } from '@/lib/contracts/abis';

export default function AppProtectionPage() {
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

  const riskScoreNum = riskScoreRaw ? Number(riskScoreRaw) : 1850;
  const isDefaulted = Boolean(isDefaultedRaw);

  const healthFactor = (10000 / Math.max(riskScoreNum, 1000)).toFixed(2);

  const restructuringEvents = [
    {
      id: 'daas-901',
      date: 'Oct 04, 2026',
      pool: 'Trade Receivables Facility',
      drawdown: '$45,000 pUSD',
      absorption: 'Junior Tranche (100% Absorbed)',
      seniorImpact: '0.00% (Fully Protected)',
      status: 'RESOLVED',
    },
    {
      id: 'daas-900',
      date: 'Sep 21, 2026',
      pool: 'Hardware Infrastructure Debt',
      drawdown: '$120,000 pUSD',
      absorption: 'Junior + Protocol Reserve',
      seniorImpact: '0.00% (Fully Protected)',
      status: 'RESOLVED',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="pb-2 border-b border-[#21293D]">
        <h2 className="text-2xl font-bold font-mono tracking-tight text-neutral-100">
          Risk Protection & Default-as-a-Service (DaaS)
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Algorithmic debt solvency surveillance. Replaces destructive flash liquidations with structured risk amortization.
        </p>
      </div>

      {/* Primary Solvency Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400">Solvency Health Factor</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00E599]/10 text-[#00E599] font-bold">
              SOLVENT
            </span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-neutral-100 tabular-nums">
            {healthFactor}x
          </div>
          <div className="text-xs font-mono text-neutral-400 pt-1">
            Liquidation Floor Threshold: &lt; 1.15x
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400">Real-Time Risk Index</span>
            <span className="text-xs font-mono text-[#00E599]">18.50%</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-[#00E599] tabular-nums">
            {riskScoreNum} / 10,000 bps
          </div>
          <div className="text-xs font-mono text-neutral-400 pt-1">
            Max Risk Ceiling: 8,500 bps
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-400">Protocol Solvency Reserve</span>
            <span className="text-xs font-mono text-[#2E68FF]">BACKSTOP</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-neutral-100 tabular-nums">
            $1,250,000 pUSD
          </div>
          <div className="text-xs font-mono text-[#00E599] pt-1">
            100% Capital Provisioned
          </div>
        </div>
      </div>

      {/* DaaS Waterfall Mechanism & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Waterfall Explanation */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#21293D]">
            <RiShieldCheckLine className="w-5 h-5 text-[#00E599]" />
            <h3 className="text-base font-bold font-mono text-neutral-100">
              Algorithmic Waterfall Engine
            </h3>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-[#161C2B] border border-[#21293D] space-y-1">
              <span className="text-[#00E599] font-bold block uppercase">Tier 1: Senior Principal Shield</span>
              <p className="text-neutral-300 font-sans text-xs">
                Senior capital receives 100% priority payouts. No haircuts can be applied unless Junior and Mezzanine reserves are completely exhausted.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#161C2B] border border-[#21293D] space-y-1">
              <span className="text-[#2E68FF] font-bold block uppercase">Tier 2: Mezzanine Buffer</span>
              <p className="text-neutral-300 font-sans text-xs">
                Mezzanine tranches absorb secondary variance, backed by DaaS reserve funds.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#161C2B] border border-[#21293D] space-y-1">
              <span className="text-amber-400 font-bold block uppercase">Tier 3: Junior First-Loss Capital</span>
              <p className="text-neutral-300 font-sans text-xs">
                Junior depositors earn premium APY (22.8%) in exchange for absorbing shortfalls first during distressed market conditions.
              </p>
            </div>
          </div>
        </div>

        {/* Restructuring Event Ledger */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-[#21293D] bg-[#0E121B] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#21293D]">
              <div className="flex items-center gap-2">
                <FiRefreshCw className="w-4 h-4 text-[#00E599]" />
                <h3 className="text-base font-bold font-mono text-neutral-100">
                  DaaS Restructuring Event Ledger
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                Zero Flash Liquidations
              </span>
            </div>

            <div className="divide-y divide-[#21293D] mt-2">
              {restructuringEvents.map((evt) => (
                <div key={evt.id} className="py-4 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-200">{evt.pool}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#00E599]/10 text-[#00E599] font-bold">
                      {evt.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-neutral-400 text-[11px]">
                    <div>Drawdown: <span className="text-neutral-200 font-bold">{evt.drawdown}</span></div>
                    <div>Senior Impact: <span className="text-[#00E599] font-bold">{evt.seniorImpact}</span></div>
                    <div>Absorption: <span className="text-neutral-300">{evt.absorption}</span></div>
                    <div>Date: <span className="text-neutral-400">{evt.date}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
