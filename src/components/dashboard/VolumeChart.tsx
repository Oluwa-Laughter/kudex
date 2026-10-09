'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FiTrendingUp, FiCalendar, FiActivity, FiRadio } from 'react-icons/fi';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { formatDisplayBalance } from '@/lib/math';

export function VolumeChart() {
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | 'ALL'>('7D');
  const { data: protocolEvents, isLoading } = useProtocolEvents();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="h-72 w-full rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-6 flex flex-col items-center justify-center gap-3 transition-colors duration-200">
        <FiActivity className="w-6 h-6 text-[#00E599] animate-spin" />
        <span className="text-sm font-mono text-slate-500 dark:text-neutral-400">
          Querying Real-Time Settlement Event Stream...
        </span>
      </div>
    );
  }

  const seriesData = protocolEvents?.chartSeries || [
    { day: 'Mon', volume: 0, potGas: 0, rawVolumeBigInt: BigInt(0) },
    { day: 'Tue', volume: 0, potGas: 0, rawVolumeBigInt: BigInt(0) },
    { day: 'Wed', volume: 0, potGas: 0, rawVolumeBigInt: BigInt(0) },
    { day: 'Thu', volume: 0, potGas: 0, rawVolumeBigInt: BigInt(0) },
    { day: 'Fri', volume: 0, potGas: 0, rawVolumeBigInt: BigInt(0) },
    { day: 'Sat', volume: 0, potGas: 0, rawVolumeBigInt: BigInt(0) },
    { day: 'Sun', volume: 0, potGas: 0, rawVolumeBigInt: BigInt(0) },
  ];

  const totalShieldEvents = protocolEvents?.totalShieldEvents ?? 0;
  const totalSettlements = protocolEvents?.totalSettlements ?? 0;
  const totalVolumeBigInt = protocolEvents?.totalVolumeBigInt ?? BigInt(0);

  const cumulativeDisplay = totalVolumeBigInt > BigInt(0)
    ? `${formatDisplayBalance(totalVolumeBigInt, 6, 2)} pUSD`
    : 'Live Stream Active (0.00 pUSD Indexed)';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-6 shadow-sm transition-colors duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400 font-mono">
              Settlement Network Throughput
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#00E599]/10 text-emerald-700 dark:text-[#00E599]">
              <FiRadio className="w-3.5 h-3.5 animate-pulse" />
              Live RPC Stream
            </span>
          </div>
          <h4 className="text-2xl font-bold font-mono text-slate-900 dark:text-neutral-100 tabular-nums">
            {cumulativeDisplay}
          </h4>
          <p className="text-sm font-mono text-slate-500 dark:text-neutral-400 mt-1">
            Indexed: {totalShieldEvents} Shield Notes | {totalSettlements} Atomic RFQ Settlements
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D]">
          {(['7D', '30D', 'ALL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                timeframe === t
                  ? 'bg-white dark:bg-[#0E121B] text-slate-900 dark:text-white shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E599" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00E599" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              fontFamily="monospace"
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              fontFamily="monospace"
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-3 shadow-xl text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 mb-1">
                        <FiCalendar className="w-3.5 h-3.5" />
                        <span>{data.day} On-Chain Settlement</span>
                      </div>
                      <p className="text-sm font-bold text-emerald-600 dark:text-[#00E599]">
                        ${data.volume.toLocaleString()} pUSD
                      </p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                        Est. Gas: {data.potGas} POT
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#00E599"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#volumeGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
