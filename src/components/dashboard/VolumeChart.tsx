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
import { FiTrendingUp, FiCalendar } from 'react-icons/fi';

const chartData = [
  { day: 'Mon', volume: 142000, potGas: 12.4 },
  { day: 'Tue', volume: 189000, potGas: 15.2 },
  { day: 'Wed', volume: 245000, potGas: 18.7 },
  { day: 'Thu', volume: 210000, potGas: 16.3 },
  { day: 'Fri', volume: 320000, potGas: 24.1 },
  { day: 'Sat', volume: 290000, potGas: 21.5 },
  { day: 'Sun', volume: 412000, potGas: 31.8 },
];

export function VolumeChart() {
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | 'ALL'>('7D');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-72 w-full rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-6 flex items-center justify-center">
        <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-6 backdrop-blur-md shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Portaldot Settlement Delivery
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <FiTrendingUp className="w-3 h-3" />
              +28.4%
            </span>
          </div>
          <h4 className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
            1,808,000 pUSD <span className="text-xs text-neutral-400 font-normal">/ 7-Day Cumulative</span>
          </h4>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700">
          {(['7D', '30D', 'ALL'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                timeframe === t
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
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
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 shadow-xl text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
                        <FiCalendar className="w-3.5 h-3.5" />
                        <span>{data.day} Day Settlement</span>
                      </div>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ${data.volume.toLocaleString()} pUSD
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Solver Gas: {data.potGas} POT
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
              stroke="#10b981"
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
