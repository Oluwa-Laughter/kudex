'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { FiMenu, FiX } from 'react-icons/fi';
import { SidebarContent } from './Sidebar';

export function MobileDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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
            Switch between Home, Send and Invoice, Earn, Trade and Bridge, and Kudex
            Agent.
          </Dialog.Description>
          <Dialog.Close
            className="absolute right-3 top-4 flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Close navigation"
          >
            <FiX size={18} />
          </Dialog.Close>
          <SidebarContent onNavigate={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
