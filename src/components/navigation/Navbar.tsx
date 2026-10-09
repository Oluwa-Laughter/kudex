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
              href="/app/vaults"
              className="hover:text-[#00E599] transition"
            >
              Credit Vaults
            </Link>
            <Link
              href="/app/marketplace"
              className="hover:text-[#00E599] transition"
            >
              RFQ Market
            </Link>
            <Link
              href="/app/protection"
              className="hover:text-[#00E599] transition"
            >
              Risk Protection
            </Link>
            <Link
              href="/how-it-works"
              className="hover:text-[#00E599] transition"
            >
              How It Works
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Network Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#00E599]/30 bg-[#00E599]/10 text-xs font-mono text-[#00E599]">
            <FiShield className="w-3.5 h-3.5" />
            <span>Primary Ledger</span>
          </div>

          <ThemeToggle />

          <Link
            href="/app/overview"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] transition text-xs font-bold shadow-sm"
          >
            <FiTerminal className="w-3.5 h-3.5" />
            <span>Launch App</span>
            <FiArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}
