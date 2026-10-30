'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import {
  FiGrid,
  FiLayers,
  FiRepeat,
  FiCpu,
  FiGlobe,
  FiMenu,
  FiX,
  FiSidebar,
  FiArrowUpRight,
  FiShield,
  FiSend,
  FiFileText,
} from 'react-icons/fi';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { ConnectWalletButton } from '@/components/navigation/ConnectWalletButton';

export const APP_NAV_ITEMS = [
  { name: 'Overview', href: '/app/overview', icon: FiGrid },
  { name: 'Marketplace', href: '/app/marketplace', icon: FiRepeat },
  { name: 'Bridge', href: '/app/bridge', icon: FiGlobe },
  { name: 'Settlement', href: '/app/settlement', icon: FiSend },
  { name: 'Agents', href: '/app/agents', icon: FiCpu },
  { name: 'Vaults', href: '/app/vaults', icon: FiLayers },
  { name: 'Compliance', href: '/app/compliance', icon: FiFileText },
  { name: 'Protection', href: '/app/protection', icon: FiShield },
];

export default function AppWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const network = useQuery<{ block: string }>({
    queryKey: ['header-network-status'],
    staleTime: 20_000,
    refetchInterval: 30_000,
    retry: 0,
    queryFn: async () => {
      const response = await fetch('/api/protocol/network');
      if (!response.ok) throw new Error('Network status unavailable');
      return response.json();
    },
  });

  function SidebarContent({ compact = false }: { compact?: boolean }) {
    return (
      <div className="flex h-full flex-col gap-6 p-4">
        <div className="px-2 py-2">
          {compact ? (
            <Link
              href="/"
              className="flex h-11 items-center justify-center rounded-xl bg-secondary font-heading text-lg font-bold text-primary"
              aria-label="Kudex home"
            >
              K
            </Link>
          ) : (
            <Logo size="sm" />
          )}
        </div>

        <nav aria-label="Workspace" className="space-y-1.5 overflow-y-auto pr-1">
          {APP_NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobile(false)}
                title={compact ? item.name : undefined}
                aria-label={compact ? item.name : undefined}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors duration-150 ${
                  compact ? 'justify-center px-0' : ''
                } ${
                  active
                    ? 'bg-secondary text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                }`}
              >
                <item.icon size={18} aria-hidden="true" className="shrink-0" />
                {!compact && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          {!compact && (
            <div className="rounded-2xl border border-border bg-secondary p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FiCpu className="text-primary" aria-hidden="true" />
                <span>KUDEX AGENT</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Inspect live pools, prepare RFQ mandates, and manage session spend caps.
              </p>
              <Link
                className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                href="/app/agents"
                onClick={() => setMobile(false)}
              >
                <span>Open KUDEX AGENT</span>
                <FiArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <a
        href="#workspace-content"
        className="sr-only z-[60] rounded-xl bg-card p-4 text-sm font-semibold focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to workspace
      </a>

      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 border-r border-border bg-card lg:block ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent compact={collapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Dialog.Root open={mobile} onOpenChange={setMobile}>
              <Dialog.Trigger
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground lg:hidden"
                aria-label="Open navigation"
              >
                <FiMenu size={18} />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="drawer-overlay fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
                <Dialog.Content className="drawer-content fixed inset-y-0 left-0 z-50 w-72 max-w-[90vw] overflow-y-auto border-r border-border bg-card">
                  <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Navigate Kudex application workspaces.
                  </Dialog.Description>
                  <Dialog.Close
                    className="absolute right-3 top-4 flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label="Close navigation"
                  >
                    <FiX size={18} />
                  </Dialog.Close>
                  <SidebarContent />
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>

            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              className="hidden h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground lg:flex"
            >
              <FiSidebar size={18} />
            </button>

            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              <span>Settlement Network</span>
              {network.data?.block && (
                <span className="font-mono text-muted-foreground tabular-nums">
                  · #{network.data.block}
                </span>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Link
              href="/docs"
              className="hidden min-h-11 items-center rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-muted-foreground transition hover:text-foreground md:inline-flex"
            >
              Docs
            </Link>
            <ThemeToggle />
            <ConnectWalletButton />
          </div>
        </header>

        <main
          id="workspace-content"
          className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-7 sm:px-8 sm:py-10 xl:px-12"
        >
          {children}
        </main>

        <footer className="mx-4 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border py-5 text-sm text-muted-foreground sm:mx-8">
          <span>Kudex Confidential Settlement Network</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link className="hover:text-foreground" href="/pricing">
              Fee Schedule
            </Link>
            <Link className="hover:text-foreground" href="/docs">
              Documentation
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
