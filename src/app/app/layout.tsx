'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {
  FiGrid,
  FiLayers,
  FiRepeat,
  FiCpu,
  FiBookOpen,
  FiMenu,
  FiX,
  FiSidebar,
  FiArrowUpRight,
  FiShield,
  FiSend,
  FiGlobe,
  FiFileText,
} from 'react-icons/fi';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { ConnectWalletButton } from '@/components/navigation/ConnectWalletButton';

export const APP_NAV_ITEMS = [
  { name: 'Overview', href: '/app/overview', icon: FiGrid },
  { name: 'Public Vault', href: '/app/vaults', icon: FiLayers },
  { name: 'Swap & Liquidity', href: '/app/marketplace', icon: FiRepeat },
  { name: 'Confidential Settlement', href: '/app/settlement', icon: FiSend },
  { name: 'Autonomous Agents', href: '/app/agents', icon: FiCpu },
  { name: 'Solvency Risk Matrix', href: '/app/protection', icon: FiShield },
  { name: 'Audit & Viewing Keys', href: '/app/compliance', icon: FiFileText },
  { name: 'Bridge Gateway', href: '/app/bridge', icon: FiGlobe },
  { name: 'How It Works', href: '/app/how-it-works', icon: FiBookOpen },
];

export default function AppWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  function navigation(compact = false) {
    return (
      <div className="flex h-full flex-col gap-6 p-4">
        <div className="px-2 py-3">
          {compact ? (
            <Link
              href="/"
              className="flex h-11 items-center justify-center font-semibold text-primary"
              aria-label="Kudex home"
            >
              K
            </Link>
          ) : (
            <Logo size="sm" />
          )}
        </div>
        <nav aria-label="Workspace" className="space-y-1.5 overflow-y-auto pr-1">
          {APP_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobile(false)}
              title={compact ? item.name : undefined}
              aria-label={compact ? item.name : undefined}
              aria-current={pathname === item.href ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150 ${compact ? 'justify-center' : ''} ${pathname === item.href ? 'bg-secondary text-primary font-bold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <item.icon size={18} aria-hidden="true" />
              {!compact && item.name}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          {!compact && (
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-sm font-medium">Start with the essentials</p>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">
                Review a vault, a signed offer, or agent permissions before signing.
              </p>
              <Link
                className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-primary"
                href="/app/how-it-works"
                onClick={() => setMobile(false)}
              >
                Read the guide <FiArrowUpRight aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen bg-background">
      <a
        href="#workspace-content"
        className="sr-only z-[60] rounded-xl bg-card p-4 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to workspace
      </a>
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 border-r border-border bg-card lg:block ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {navigation(collapsed)}
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Dialog.Root open={mobile} onOpenChange={setMobile}>
              <Dialog.Trigger
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border lg:hidden"
                aria-label="Open navigation"
              >
                <FiMenu />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="drawer-overlay fixed inset-0 z-40 bg-black/45" />
                <Dialog.Content className="drawer-content fixed inset-y-0 left-0 z-50 w-72 max-w-[90vw] overflow-y-auto border-r border-border bg-card">
                  <Dialog.Title className="sr-only">Workspace navigation</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Choose a Kudex workflow or open the user guide.
                  </Dialog.Description>
                  <Dialog.Close
                    className="absolute right-3 top-4 flex h-11 w-11 items-center justify-center rounded-xl hover:bg-secondary"
                    aria-label="Close navigation"
                  >
                    <FiX />
                  </Dialog.Close>
                  {navigation()}
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              className="hidden h-11 w-11 items-center justify-center rounded-xl border border-border lg:flex"
            >
              <FiSidebar />
            </button>
            <span className="text-sm font-medium">
              Portaldot{' '}
              <span className="ml-1 rounded-full bg-secondary px-2.5 py-1 text-sm text-primary">
                Testnet
              </span>
            </span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <ThemeToggle />
            <ConnectWalletButton />
          </div>
        </header>
        <main
          id="workspace-content"
          className="mx-auto w-full max-w-screen-2xl px-4 py-8 sm:px-8 sm:py-10 xl:px-12"
        >
          {children}
        </main>
        <footer className="mx-4 mt-8 flex flex-wrap justify-between gap-3 border-t border-border py-6 text-sm text-muted-foreground sm:mx-8">
          <span>Testnet assets only · Public balances</span>
          <Link className="underline underline-offset-4" href="/app/how-it-works">
            Need a hand? Read the guide
          </Link>
        </footer>
      </div>
    </div>
  );
}
