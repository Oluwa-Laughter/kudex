'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { FiArrowRight, FiMenu, FiX } from 'react-icons/fi';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';

export const MARKETING_NAV_LINKS = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Business Pay', href: '/solutions/enterprise-payroll' },
  { label: 'Protected Yield', href: '/solutions/credit-tranches' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
] as const;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-screen-2xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <Logo size="sm" />

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {MARKETING_NAV_LINKS.map((item) => (
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
            <span>Open App</span>
            <FiArrowRight aria-hidden="true" />
          </Link>

          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger
              aria-label="Open menu"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card lg:hidden"
            >
              <FiMenu size={18} />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="drawer-overlay fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
              <Dialog.Content className="drawer-content fixed inset-y-0 right-0 z-50 w-72 max-w-[90vw] overflow-y-auto border-l border-border bg-card p-5">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <Dialog.Title className="text-base font-bold">Menu</Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Explore how Kudex works, business payments, protected yield, pricing,
                    and documentation.
                  </Dialog.Description>
                  <Dialog.Close
                    aria-label="Close menu"
                    className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-secondary"
                  >
                    <FiX size={18} />
                  </Dialog.Close>
                </div>
                <div className="mt-4 flex flex-col gap-1.5">
                  {MARKETING_NAV_LINKS.map((item) => (
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
                    <span>Open App</span>
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
