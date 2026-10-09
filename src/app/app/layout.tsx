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
} from 'react-icons/fi';
import {
  RiExchangeFundsLine,
  RiShieldCheckLine,
  RiRobot2Line,
  RiDashboardLine,
  RiBankCardLine,
  RiRouteLine,
} from 'react-icons/ri';
import { FiRadio } from 'react-icons/fi';

export const APP_NAV_ITEMS = [
  {
    name: 'Portfolio Overview',
    href: '/app/overview',
    icon: RiDashboardLine,
    badge: undefined,
  },
  {
    name: 'RFQ Marketplace',
    href: '/app/marketplace',
    icon: RiExchangeFundsLine,
    badge: 'SOLVER',
  },
  {
    name: 'Cross-Chain Bridge',
    href: '/app/bridge',
    icon: RiRouteLine,
    badge: undefined,
  },
  {
    name: 'Confidential Settlement',
    href: '/app/settlement',
    icon: RiBankCardLine,
    badge: 'PRIVATE',
  },
  {
    name: 'Kudex Agents',
    href: '/app/agents',
    icon: RiRobot2Line,
    badge: 'ACTIVE',
  },
  {
    name: 'Credit Vaults',
    href: '/app/vaults',
    icon: FiLayers,
    badge: 'RWA',
  },
  {
    name: 'Compliance & Audit',
    href: '/app/compliance',
    icon: RiShieldCheckLine,
    badge: undefined,
  },
  {
    name: 'Risk Protection & DaaS',
    href: '/app/protection',
    icon: FiActivity,
    badge: undefined,
  },
];

export default function AppWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const currentNav = APP_NAV_ITEMS.find((item) => pathname.startsWith(item.href)) || APP_NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#06080D] text-neutral-100 flex flex-col md:flex-row selection:bg-[#00E599]/30 selection:text-white">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-72 border-r border-[#21293D] bg-[#0E121B] flex-shrink-0 min-h-screen sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#21293D] flex items-center justify-between">
          <Logo size="md" />
        </div>

        {/* Navigation Workspace Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 px-3 pb-2 font-semibold">
            Institutional Workspaces
          </div>

          {APP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/app/overview' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition group ${
                  isActive
                    ? 'bg-[#00E599] text-[#06080D] font-bold shadow-lg shadow-[#00E599]/15'
                    : 'text-neutral-300 hover:text-white hover:bg-[#161C2B]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-[#06080D]' : 'text-neutral-400 group-hover:text-[#00E599]'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      isActive
                        ? 'bg-[#06080D] text-[#00E599]'
                        : 'bg-[#161C2B] text-neutral-400 border border-[#21293D]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer with Status & Links */}
        <div className="p-4 border-t border-[#21293D] space-y-3 bg-[#0E121B]">
          <div className="p-3 rounded-xl bg-[#161C2B] border border-[#21293D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
              <span className="text-xs font-mono text-neutral-300 font-medium">Settlement Ledger</span>
            </div>
            <span className="text-[11px] font-mono text-[#00E599] font-bold">ACTIVE</span>
          </div>

          <div className="flex items-center justify-between px-2 text-xs font-mono text-neutral-400">
            <Link href="/" className="hover:text-white transition flex items-center gap-1">
              <span>Public Portal</span>
              <FiArrowUpRight className="w-3 h-3" />
            </Link>
            <Link href="/docs" className="hover:text-white transition">
              Specs & Docs
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Bar */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#06080D]/90 border-b border-[#21293D] px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 rounded-xl bg-[#0E121B] border border-[#21293D] text-neutral-300 md:hidden"
            >
              {mobileSidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 hidden sm:inline">
                  Workspace
                </span>
                <span className="text-neutral-500 hidden sm:inline">/</span>
                <h1 className="text-base sm:text-lg font-bold text-neutral-100 font-mono">
                  {currentNav.name}
                </h1>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E121B] border border-[#21293D] text-xs font-mono text-neutral-400">
              <FiRadio className="w-3.5 h-3.5 text-[#00E599] animate-pulse" />
              <span>RPC Latency: 18ms</span>
            </div>
            <ThemeToggle />
            <ConnectWalletButton />
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileSidebarOpen && (
          <div className="md:hidden border-b border-[#21293D] bg-[#0E121B] p-4 space-y-2 z-50">
            <div className="text-xs font-mono uppercase text-neutral-400 px-3 pb-1">Workspaces</div>
            {APP_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'bg-[#00E599] text-[#06080D] font-bold'
                      : 'text-neutral-200 hover:bg-[#161C2B]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161C2B] text-neutral-300">
                      {item.badge}
                    </span>
                  )}
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
