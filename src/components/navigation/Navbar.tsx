'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { FiArrowUpRight, FiShield, FiTerminal } from 'react-icons/fi';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Logo size="md" />
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-600 dark:text-neutral-400">
            <Link
              href="#pillars"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            >
              Protocol Pillars
            </Link>
            <Link
              href="/dashboard/vaults"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            >
              RWA Vaults
            </Link>
            <Link
              href="/dashboard/rfq"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            >
              RFQ Market
            </Link>
            <Link
              href="/dashboard/governance"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            >
              DaaS Sentinel
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Portaldot Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/40 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
            <FiShield className="w-3.5 h-3.5" />
            <span>Portaldot V3.0 (8890)</span>
          </div>

          <ThemeToggle />

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 transition text-xs font-medium shadow-sm"
          >
            <FiTerminal className="w-3.5 h-3.5" />
            <span>Launch Terminal</span>
            <FiArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}
