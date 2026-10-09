'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { ConnectWalletButton } from '@/components/navigation/ConnectWalletButton';
import {
  FiCheckCircle,
  FiMenu,
  FiX,
  FiArrowUpRight,
  FiLayers,
  FiActivity,
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#06080D] text-slate-900 dark:text-white flex flex-col md:flex-row transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-500">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-72 border-r border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] flex-shrink-0 min-h-screen sticky top-0 h-screen transition-colors duration-200">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-200 dark:border-[#21293D] flex items-center justify-between">
          <Logo size="md" />
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          {APP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/app/overview' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition ${
                    isActive ? 'text-slate-950' : 'text-slate-400 dark:text-slate-400'
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] transition-colors duration-200">
          <Link
            href="/"
            className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B] transition border border-slate-200 dark:border-[#21293D]"
          >
            <span>Back to Main Site</span>
            <FiArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-[#06080D]/90 border-b border-slate-200 dark:border-[#21293D] px-6 sm:px-8 lg:px-10 h-20 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2.5 rounded-xl bg-white dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-slate-700 dark:text-slate-300 md:hidden"
            >
              {mobileSidebarOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {currentNav.name}
              </h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3.5">
            <ThemeToggle />
            <ConnectWalletButton />
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileSidebarOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-5 space-y-2 z-50 transition-colors duration-200">
            {APP_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-base font-semibold ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#161C2B]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Workspace Main Viewport */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
