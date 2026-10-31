'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { FiSidebar } from 'react-icons/fi';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { ConnectWalletButton } from '@/components/navigation/ConnectWalletButton';
import { Sidebar, APP_NAV_ITEMS } from '@/components/navigation/Sidebar';
import { MobileDrawer } from '@/components/navigation/MobileDrawer';

export { APP_NAV_ITEMS };

export default function AppWorkspaceLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <a
        href="#workspace-content"
        className="sr-only z-[60] rounded-xl bg-card p-4 text-sm font-semibold focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to workspace
      </a>

      <Sidebar collapsed={collapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <MobileDrawer open={mobile} onOpenChange={setMobile} />

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
              <span>Live Network</span>
              {network.data?.block && (
                <span className="font-mono font-bold text-muted-foreground tabular-nums">
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
          <span>Kudex · Private, Automated Finance for Modern Businesses</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link className="hover:text-foreground" href="/pricing">
              Pricing
            </Link>
            <Link className="hover:text-foreground" href="/docs">
              Docs
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
