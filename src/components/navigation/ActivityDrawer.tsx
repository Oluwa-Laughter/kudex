'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import {
  FiActivity,
  FiArrowRight,
  FiCheckCircle,
  FiDownload,
  FiExternalLink,
  FiRefreshCw,
  FiSend,
  FiTrendingUp,
  FiX,
} from 'react-icons/fi';
import {
  useLiveActivity,
  type ActivityFilterGroup,
  type LiveActivityItem,
} from '@/lib/hooks/useLiveActivity';
import { downloadPaymentReceipt } from '@/lib/payroll/csvParser';
import { truncateAddress } from '@/lib/utils';

const FILTER_TABS: Array<{ id: ActivityFilterGroup; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'payments', label: 'Payments' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'vaults', label: 'Vaults' },
  { id: 'swaps', label: 'Swaps' },
  { id: 'protection', label: 'Protection' },
];

export function downloadLiveActivityReceipt(item: LiveActivityItem) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const fullVerifyUrl = item.verificationUrl.startsWith('http')
    ? item.verificationUrl
    : `${origin}${item.verificationUrl}`;

  downloadPaymentReceipt({
    receiptId: `${item.blockNumber.toString()}-${item.logIndex}`,
    kind: `${item.category} · ${item.title}`,
    payerLabel: item.involvedAddresses[0]
      ? truncateAddress(item.involvedAddresses[0])
      : 'Verified Network Account',
    recipientLabel: item.involvedAddresses[1]
      ? truncateAddress(item.involvedAddresses[1])
      : item.subtitle,
    amountLabel: item.formattedAmount,
    reference: `Block #${item.blockNumber.toString()} · ${item.subtitle}`,
    timestampIso: item.timestampIso,
    transactionHash: item.transactionHash,
    commitment: item.commitment,
    verificationUrl: fullVerifyUrl,
  });
}

export function ActivityDrawer() {
  const [open, setOpen] = useState(false);
  const activity = useLiveActivity('all');

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        type="button"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:bg-secondary"
      >
        <FiActivity className="text-primary" size={17} aria-hidden="true" />
        <span>Activity History</span>
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary/15 px-2 py-0.5 text-sm font-bold text-primary tabular-nums">
          {activity.totalCount}
        </span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border bg-card text-foreground shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Dialog.Title className="text-lg font-bold sm:text-xl">
                  On-Chain Activity &amp; Receipt Center
                </Dialog.Title>
                {activity.latestBlock !== null && (
                  <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 font-mono text-sm font-semibold text-muted-foreground tabular-nums">
                    Block #{activity.latestBlock.toString()}
                  </span>
                )}
              </div>
              <Dialog.Description className="text-sm text-muted-foreground">
                Live event-indexed receipts read directly from network blocks. Zero local
                guesses or synthetic entries.
              </Dialog.Description>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => void activity.refetch()}
                disabled={activity.isFetching}
                aria-label="Refresh on-chain activity"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground transition hover:text-foreground disabled:opacity-50"
              >
                <FiRefreshCw
                  size={17}
                  className={activity.isFetching ? 'animate-spin text-primary' : ''}
                  aria-hidden="true"
                />
              </button>
              <Dialog.Close
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground transition hover:text-foreground"
                aria-label="Close activity drawer"
              >
                <FiX size={18} aria-hidden="true" />
              </Dialog.Close>
            </div>
          </div>

          {/* Scope & Category Filter Controls */}
          <div className="space-y-3 border-b border-border bg-secondary/40 px-5 py-3.5 sm:px-6">
            <div
              role="group"
              aria-label="Activity scope filter"
              className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1"
            >
              <button
                type="button"
                onClick={() => activity.setScope('all')}
                className={`min-h-10 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  activity.scope === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Network Activity
              </button>
              <button
                type="button"
                onClick={() => activity.setScope('mine')}
                className={`min-h-10 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  activity.scope === 'mine'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                My Account Activity
              </button>
            </div>

            <div
              role="group"
              aria-label="Activity category filter"
              className="flex flex-wrap gap-1.5"
            >
              {FILTER_TABS.map((tab) => {
                const selected = activity.filterGroup === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => activity.setFilterGroup(tab.id)}
                    className={`min-h-9 rounded-full border px-3 py-1 text-sm font-semibold transition ${
                      selected
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Indexed Event Feed */}
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
            {activity.filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-border bg-secondary/50 p-6 space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground">
                    {activity.anyContractConfigured
                      ? 'No On-Chain Events Indexed in This Filter Yet'
                      : 'Awaiting Active Contract Deployment'}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {activity.scope === 'mine'
                      ? 'Connect your wallet or switch to All Network Activity to inspect every verified settlement on the chain.'
                      : 'Every private payment, on-chain invoice, vault deposit, POT fee-free lock, and swap appears here automatically once confirmed in a block.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <Link
                    href="/app/pay"
                    onClick={() => setOpen(false)}
                    className="action-link text-sm"
                  >
                    <FiSend aria-hidden="true" />
                    <span>Send First Payment</span>
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                  <Link
                    href="/app/earn"
                    onClick={() => setOpen(false)}
                    className="quiet-link text-sm"
                  >
                    <FiTrendingUp className="text-primary" aria-hidden="true" />
                    <span>Deposit to Earn</span>
                  </Link>
                </div>
              </div>
            ) : (
              activity.filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-border bg-secondary/40 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <span className="emerald-badge">
                        <FiCheckCircle aria-hidden="true" />
                        <span>{item.category}</span>
                      </span>
                      <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-bold text-primary tabular-nums">
                        {item.formattedAmount}
                      </p>
                      <p className="font-mono text-sm text-muted-foreground tabular-nums">
                        Block #{item.blockNumber.toString()} ·{' '}
                        {truncateAddress(item.transactionHash)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={() => downloadLiveActivityReceipt(item)}
                      className="quiet-link px-3 py-1.5 text-sm"
                    >
                      <FiDownload aria-hidden="true" />
                      <span>Download Receipt</span>
                    </button>

                    <Link
                      href={item.verificationUrl}
                      onClick={() => setOpen(false)}
                      className="quiet-link px-3 py-1.5 text-sm"
                    >
                      <FiExternalLink aria-hidden="true" />
                      <span>Verify on Auditor Portal</span>
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
