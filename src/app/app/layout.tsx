'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { ConnectWalletButton } from '@/components/navigation/ConnectWalletButton';
import {
  FiGrid,
  FiRepeat,
  FiLock,
  FiCpu,
  FiLayers,
  FiShield,
  FiActivity,
  FiCheckCircle,
  FiMenu,
  FiX,
  FiExternalLink,
  FiChevronRight,
  FiArrowUpRight,
  FiBook,
  FiRadio,
} from 'react-icons/fi';
import {
  RiExchangeFundsLine,
  RiShieldCheckLine,
  RiRobot2Line,
  RiDashboardLine,
  RiBankCardLine,
  RiRouteLine,
} from 'react-icons/ri';

export const APP_NAV_ITEMS = [
  {
    name: 'Portfolio Overview',
    href: '/app/overview',
    icon: RiDashboardLine,
  },
  {
    name: 'Trade & Swap',
    href: '/app/marketplace',
    icon: RiExchangeFundsLine,
  },
  {
    name: 'Earn & Vaults',
    href: '/app/vaults',
    icon: FiLayers,
  },
  {
    name: 'Private Transfers',
    href: '/app/settlement',
    icon: RiBankCardLine,
  },
  {
    name: 'Cross-Chain Bridge',
    href: '/app/bridge',
    icon: RiRouteLine,
  },
  {
    name: 'Kudex Agent',
    href: '/app/agents',
    icon: RiRobot2Line,
  },
  {
    name: 'Risk Protection',
    href: '/app/protection',
    icon: FiActivity,
  },
  {
    name: 'Audit & Keys',
    href: '/app/compliance',
    icon: RiShieldCheckLine,
  },
  {
    name: 'How It Works',
    href: '/app/how-it-works',
    icon: FiCheckCircle,
  },
];

export default function AppWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const currentNav =
    APP_NAV_ITEMS.find((item) => pathname === item.href || (item.href !== '/app/overview' && pathname.startsWith(item.href))) ||
    APP_NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#06080D] text-slate-900 dark:text-neutral-100 flex flex-col md:flex-row transition-colors duration-200 selection:bg-[#00E599]/30 selection:text-white">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] flex-shrink-0 min-h-screen sticky top-0 h-screen transition-colors duration-200">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200 dark:border-[#21293D] flex items-center justify-between">
          <Logo size="md" />
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {APP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/app/overview' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#00E599] text-[#06080D] font-bold shadow-md shadow-[#00E599]/15'
                    : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive ? 'text-[#06080D]' : 'text-slate-400 dark:text-neutral-400'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] transition-colors duration-200">
          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B] transition"
          >
            <span>Back to Home</span>
            <FiArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-[#06080D]/90 border-b border-slate-200 dark:border-[#21293D] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 rounded-xl bg-white dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-slate-700 dark:text-neutral-300 md:hidden"
            >
              {mobileSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-neutral-100 font-mono">
                {currentNav.name}
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <ConnectWalletButton />
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileSidebarOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-4 space-y-1.5 z-50 transition-colors duration-200">
            {APP_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-[#00E599] text-[#06080D] font-bold'
                      : 'text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-[#161C2B]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Workspace Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
