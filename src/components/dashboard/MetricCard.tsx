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
      <div className="rounded-2xl border border-[#21293D] bg-[#0E121B] p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-28 bg-[#161C2B] rounded" />
          <div className="h-9 w-9 bg-[#161C2B] rounded-xl" />
        </div>
        <div className="h-8 w-36 bg-[#161C2B] rounded mb-2" />
        <div className="h-4 w-20 bg-[#161C2B] rounded" />
      </div>
    );
  }

  const isPositive = (changeBps ?? 0) >= 0;

  return (
    <div className="rounded-2xl border border-[#21293D] bg-[#0E121B] p-5.5 shadow-sm hover:border-[#00E599]/40 hover:bg-[#161C2B]/50 transition group">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-xs font-semibold text-neutral-400 font-mono uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-[#161C2B] text-neutral-300 group-hover:bg-[#00E599]/10 group-hover:text-[#00E599] transition border border-[#21293D]">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100 font-mono tabular-nums">
          {value}
        </h3>

        {changeBps !== undefined && (
          <div
            className={`flex items-center gap-1 text-xs font-mono font-medium tabular-nums ${
              isPositive
                ? 'text-[#00E599]'
                : 'text-rose-400'
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
        <p className="mt-2 text-sm text-neutral-400 font-sans leading-snug">
          {subValue}
        </p>
      )}
    </div>
  );
}
