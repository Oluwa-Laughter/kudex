'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { FiMenu, FiX, FiGrid, FiLayers, FiRepeat, FiActivity, FiShield, FiBook } from 'react-icons/fi';
import { Logo } from '@/components/brand/Logo';
import { ThemeToggle } from '@/components/brand/ThemeToggle';

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
    name: 'RFQ Orderbook',
    href: '/app/marketplace',
    icon: FiRepeat,
  },
  {
    name: 'Risk Protection',
    href: '/app/protection',
    icon: FiActivity,
  },
  {
    name: 'How It Works',
    href: '/how-it-works',
    icon: FiBook,
  },
];

export function MobileDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="md:hidden p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          aria-label="Open mobile navigation menu"
        >
          <FiMenu className="w-5 h-5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-neutral-950 p-6 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800">
              <Logo size="sm" />
              <Dialog.Close asChild>
                <button
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                  aria-label="Close navigation menu"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <nav className="mt-6 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono text-[#00E599]">
                <FiShield className="w-3.5 h-3.5" />
                <span>Primary Ledger</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
