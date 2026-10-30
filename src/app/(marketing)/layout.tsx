'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { FiArrowRight, FiMenu, FiX } from 'react-icons/fi';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';

const PRIMARY_LINKS = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Bridge', href: '/bridge' },
  { label: 'Payroll', href: '/solutions/enterprise-payroll' },
  { label: 'Credit Tranches', href: '/solutions/credit-tranches' },
  { label: 'Agents', href: '/solutions/autonomous-agents' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Logo size="sm" />

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 xl:flex"
          >
            {PRIMARY_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/app/overview"
              className="action-link hidden px-4 py-2.5 text-sm sm:inline-flex"
            >
              <span>Launch App</span>
              <FiArrowRight aria-hidden="true" />
            </Link>

            <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
              <Dialog.Trigger
                aria-label="Open menu"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card xl:hidden"
              >
                <FiMenu size={18} />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="drawer-overlay fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
                <Dialog.Content className="drawer-content fixed inset-y-0 right-0 z-50 w-72 max-w-[90vw] overflow-y-auto border-l border-border bg-card p-5">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <Dialog.Title className="text-base font-bold">
                      Navigation
                    </Dialog.Title>
                    <Dialog.Description className="sr-only">
                      Explore Kudex solutions, pricing, documentation, and workspaces.
                    </Dialog.Description>
                    <Dialog.Close
                      aria-label="Close menu"
                      className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary"
                    >
                      <FiX size={18} />
                    </Dialog.Close>
                  </div>
                  <div className="mt-4 flex flex-col gap-1.5">
                    {PRIMARY_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-xl px-3.5 py-3 text-base font-medium text-foreground hover:bg-secondary"
                      >
                        {item.label}
                      </Link>
                    ))}
                    <Link
                      href="/app/overview"
                      onClick={() => setMobileOpen(false)}
                      className="action-link mt-4 w-full text-sm"
                    >
                      <span>Launch App</span>
                      <FiArrowRight aria-hidden="true" />
                    </Link>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-10 sm:px-8 sm:py-16">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-screen-2xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          <div className="space-y-3">
            <Logo size="sm" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              The Autonomous Confidential Settlement Layer for institutional liquidity,
              corporate payroll, and bounded agent execution.
            </p>
          </div>

          <div className="space-y-2.5 text-sm">
            <h2 className="font-bold text-foreground">Solutions</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link className="hover:text-foreground" href="/solutions/enterprise-payroll">
                  Enterprise Payroll
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/solutions/credit-tranches">
                  Credit Tranches
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/solutions/autonomous-agents">
                  Autonomous Agents
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5 text-sm">
            <h2 className="font-bold text-foreground">Platform</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link className="hover:text-foreground" href="/marketplace">
                  RFQ Marketplace
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/bridge">
                  Cross-Chain Bridge
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/pricing">
                  Pricing & Fees
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/docs">
                  Developer Docs
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5 text-sm">
            <h2 className="font-bold text-foreground">Application</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link className="hover:text-foreground" href="/app/overview">
                  Portfolio Overview
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/app/settlement">
                  Private Settlement
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/app/compliance">
                  Compliance & Viewing Keys
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" href="/app/protection">
                  Solvency & Protection
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
