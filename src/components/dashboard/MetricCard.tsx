'use client';

import React from 'react';
import { IconType } from 'react-icons';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  changeBps?: number;
  icon: IconType;
  isLoading?: boolean;
}

export function MetricCard({
  title,
  value,
  subValue,
  changeBps,
  icon: Icon,
  isLoading = false,
}: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-5.5 animate-pulse transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-28 bg-slate-200 dark:bg-[#161C2B] rounded" />
          <div className="h-9 w-9 bg-slate-200 dark:bg-[#161C2B] rounded-xl" />
        </div>
        <div className="h-8 w-36 bg-slate-200 dark:bg-[#161C2B] rounded mb-2" />
        <div className="h-4 w-20 bg-slate-200 dark:bg-[#161C2B] rounded" />
      </div>
    );
  }

  const isPositive = (changeBps ?? 0) >= 0;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-5.5 shadow-sm hover:border-[#00E599]/50 hover:bg-slate-50/80 dark:hover:bg-[#161C2B]/50 transition group">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-sm font-semibold text-slate-500 dark:text-neutral-400 font-mono uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#161C2B] text-slate-700 dark:text-neutral-300 group-hover:bg-[#00E599]/10 group-hover:text-[#00E599] transition border border-slate-200 dark:border-[#21293D]">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-neutral-100 font-mono tabular-nums">
          {value}
        </h3>

        {changeBps !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm font-mono font-semibold tabular-nums ${
              isPositive
                ? 'text-emerald-600 dark:text-[#00E599]'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isPositive ? (
              <FiTrendingUp className="w-3.5 h-3.5" />
            ) : (
              <FiTrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{(Math.abs(changeBps) / 100).toFixed(2)}%</span>
          </div>
        )}
      </div>

      {subValue && (
        <p className="mt-2 text-sm text-slate-500 dark:text-neutral-400 font-sans leading-snug">
          {subValue}
        </p>
      )}
    </div>
  );
}
