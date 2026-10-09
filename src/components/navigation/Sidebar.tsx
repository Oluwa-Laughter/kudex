'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import {
  FiGrid,
  FiLayers,
  FiRepeat,
  FiShield,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiCode,
  FiExternalLink,
  FiBook,
} from 'react-icons/fi';

import {
  RiRouteLine,
  RiRobot2Line,
  RiShieldCheckLine,
  RiBankCardLine,
  RiExchangeFundsLine,
} from 'react-icons/ri';

const navItems = [
  {
    name: 'Overview & KUDEX AGENT',
    href: '/app/overview',
    icon: FiGrid,
  },
  {
    name: 'Credit Vaults',
    href: '/app/vaults',
    icon: FiLayers,
  },
  {
    name: 'Confidential Settlement',
    href: '/app/settlement',
    icon: RiBankCardLine,
  },
  {
    name: 'RFQ Orderbook',
    href: '/app/marketplace',
    icon: FiRepeat,
  },
  {
    name: 'Cross-Chain Bridge',
    href: '/app/bridge',
    icon: RiRouteLine,
  },
  {
    name: 'Risk Protection',
    href: '/app/protection',
    icon: FiActivity,
  },
  {
    name: 'Agent Fleet Policies',
    href: '/app/agents',
    icon: RiRobot2Line,
  },
  {
    name: 'Compliance Viewing Keys',
    href: '/app/compliance',
    icon: RiShieldCheckLine,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md transition-all duration-300 relative z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
        <Logo size={collapsed ? 'sm' : 'md'} showSubtitle={!collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className={`px-3 mb-2 text-xs font-mono uppercase tracking-wider text-neutral-400 ${collapsed ? 'hidden' : 'block'}`}>
          Navigation
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
              {!collapsed && <span>{item.name}</span>}
              {!collapsed && isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </Link>
          );
        })}

        <div className={`pt-6 px-3 mb-2 text-xs font-mono uppercase tracking-wider text-neutral-400 ${collapsed ? 'hidden' : 'block'}`}>
          Resources
        </div>

        <Link
          href="/how-it-works"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100 transition"
          title={collapsed ? 'How It Works' : undefined}
        >
          <FiBook className="w-4 h-4 flex-shrink-0 text-emerald-500" />
          {!collapsed && <span>How It Works</span>}
        </Link>
      </div>

      {!collapsed && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="p-3 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">Network Operational</span>
            </div>
            <p className="text-neutral-500 font-mono text-xs">
              Confidential Settlement Active
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
