'use client';

import React, { useState, useEffect } from 'react';
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
  FiChevronLeft,
  FiChevronRight,
  FiSidebar,
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
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const currentNav =
    APP_NAV_ITEMS.find((item) => pathname === item.href || (item.href !== '/app/overview' && pathname.startsWith(item.href))) ||
    APP_NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#06080D] text-slate-900 dark:text-white flex transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-500">
      {/* Desktop Sidebar Navigation */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] flex-shrink-0 min-h-screen sticky top-0 h-screen transition-all duration-300 ${
          desktopCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-4 border-b border-slate-200 dark:border-[#21293D] flex items-center justify-between">
          {!desktopCollapsed ? (
            <div className="flex items-center justify-between w-full">
              <Logo size="md" />
              <button
                onClick={() => setDesktopCollapsed(true)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B] transition"
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <button
                onClick={() => setDesktopCollapsed(false)}
                className="p-2.5 rounded-xl text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#161C2B] transition"
                title="Expand Sidebar"
                aria-label="Expand Sidebar"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5">
          {APP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/app/overview' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-xl text-sm font-semibold transition group ${
                  desktopCollapsed ? 'justify-center p-3.5' : 'gap-3.5 px-4 py-3'
                } ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B]'
                }`}
                title={desktopCollapsed ? item.name : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition ${
                    isActive ? 'text-slate-950' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                  }`}
                />
                {!desktopCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] transition-colors duration-200">
          {!desktopCollapsed ? (
            <Link
              href="/"
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B] transition border border-slate-200 dark:border-[#21293D]"
            >
              <span>Back to Main Site</span>
              <FiArrowUpRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/"
              className="flex items-center justify-center p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161C2B] transition border border-slate-200 dark:border-[#21293D]"
              title="Back to Main Site"
            >
              <FiArrowUpRight className="w-5 h-5" />
            </Link>
          )}
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
              className="p-2.5 rounded-xl bg-white dark:bg-[#0E121B] border border-slate-200 dark:border-[#21293D] text-slate-700 dark:text-slate-300 md:hidden shadow-sm"
              aria-label="Toggle Navigation"
            >
              {mobileSidebarOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>

            {/* Desktop toggle button if collapsed */}
            {desktopCollapsed && (
              <button
                onClick={() => setDesktopCollapsed(false)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition"
                title="Expand Navigation"
              >
                <FiSidebar className="w-4 h-4 text-emerald-500" />
                <span>Show Sidebar</span>
              </button>
            )}

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

        {/* Mobile Navigation Drawer Modal */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative w-80 max-w-[85vw] bg-white dark:bg-[#0E121B] h-full flex flex-col border-r border-slate-200 dark:border-[#21293D] shadow-2xl p-6 z-10 overflow-y-auto">
              <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-[#21293D]">
                <Logo size="md" />
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  aria-label="Close Navigation"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="py-6 space-y-2 flex-1">
                {APP_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-semibold transition ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#161C2B]'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-[#21293D]">
                <Link
                  href="/"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161C2B] border border-slate-200 dark:border-[#21293D]"
                >
                  <span>Main Website</span>
                  <FiArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Main Viewport - Occupies full available width up to 1700px */}
        <main className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
