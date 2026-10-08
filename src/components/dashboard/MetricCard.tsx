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
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-5 backdrop-blur-md animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
          <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
        </div>
        <div className="h-7 w-32 bg-neutral-200 dark:bg-neutral-800 rounded mb-2" />
        <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" />
      </div>
    );
  }

  const isPositive = (changeBps ?? 0) >= 0;

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 p-5 backdrop-blur-md shadow-sm hover:border-emerald-500/40 transition group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-neutral-500 font-mono uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
          {value}
        </h3>

        {changeBps !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-mono font-medium ${
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
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
        <p className="mt-1 text-xs text-neutral-400 font-mono">
          {subValue}
        </p>
      )}
    </div>
  );
}
