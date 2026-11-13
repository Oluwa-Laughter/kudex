'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiSend,
  FiTrendingUp,
  FiRepeat,
  FiCpu,
  FiArrowUpRight,
  FiShield,
} from 'react-icons/fi';
import { Logo } from '@/components/brand/Logo';
import { useAutoPilotStore } from '@/lib/sessionKeys';

export const APP_NAV_ITEMS = [
  { name: 'Home', href: '/app/overview', icon: FiHome },
  { name: 'Send & Invoice', href: '/app/pay', icon: FiSend },
  { name: 'Earn', href: '/app/earn', icon: FiTrendingUp },
  { name: 'Trade & Bridge', href: '/app/trade', icon: FiRepeat },
  { name: 'Kudex Agent', href: '/app/agent', icon: FiCpu },
] as const;

export function SidebarContent({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const autoPilot = useAutoPilotStore();

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 py-2">
        {compact ? (
          <Link
            href="/"
            className="flex h-11 items-center justify-center rounded-xl border border-border bg-secondary font-heading text-lg font-bold text-primary"
            aria-label="Kudex home"
          >
            K
          </Link>
        ) : (
          <Logo size="sm" showSubtitle />
        )}
      </div>

      <nav aria-label="Workspace" className="space-y-1.5 overflow-y-auto pr-1">
        {APP_NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={compact ? item.name : undefined}
              aria-label={compact ? item.name : undefined}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl border px-3.5 text-sm font-semibold transition-all duration-150 ${
                compact ? 'justify-center px-0' : ''
              } ${
                active
                  ? 'border-primary/35 bg-secondary text-primary shadow-sm'
                  : 'border-transparent text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
              }`}
            >
              <item.icon size={18} aria-hidden="true" className="shrink-0" />
              {!compact && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        {!compact && (
          <div className="rounded-2xl border border-border bg-secondary/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-2">
                <FiCpu className="text-primary" aria-hidden="true" />
                <span>
                  {autoPilot.active ? 'Auto-Pilot Active' : 'Auto-Pilot Ready'}
                </span>
              </span>
              <FiShield className="text-primary" aria-hidden="true" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground tabular-nums">
              {autoPilot.active
                ? `Active budget: $${autoPilot.spendingBudget.toLocaleString()} max per session.`
                : 'Set a clear spending limit and time window for your Kudex Agent.'}
            </p>
            <Link
              className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              href="/app/agent"
              onClick={onNavigate}
            >
              <span>Manage Auto-Pilot Rules</span>
              <FiArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 border-r border-border bg-card lg:block ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <SidebarContent compact={collapsed} />
    </aside>
  );
}
