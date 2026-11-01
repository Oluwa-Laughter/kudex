'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useBalance, usePublicClient, useSignMessage } from 'wagmi';
import { formatUnits } from 'viem';
import {
  FiSend,
  FiTrendingUp,
  FiCpu,
  FiLock,
  FiShield,
  FiCheckCircle,
  FiArrowRight,
  FiRefreshCw,
  FiDownload,
  FiExternalLink,
} from 'react-icons/fi';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { isVaultConfigured, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { readVault } from '@/lib/contracts/vault-client';
import {
  buildNoteSyncDomainMessage,
  deriveNoteEncryptionKey,
  restorePrivateNotesFromNetwork,
  usePrivateNotesStore,
} from '@/lib/crypto/noteSync';
import { useNativeAccount } from '@/lib/hooks/useNativeAccount';
import {
  useLiveActivity,
  type ActivityFilterGroup,
} from '@/lib/hooks/useLiveActivity';
import { downloadLiveActivityReceipt } from '@/components/navigation/ActivityDrawer';
import { useAutoPilotStore, formatTimeRemaining } from '@/lib/sessionKeys';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';
import { VolumeChart } from '@/components/dashboard/VolumeChart';

const HOME_FILTER_PILLS: Array<{ id: ActivityFilterGroup; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'payments', label: 'Payments' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'vaults', label: 'Vaults' },
  { id: 'swaps', label: 'Swaps' },
  { id: 'protection', label: 'Protection' },
];

export default function HomeOverviewPage() {
  const { address } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { signMessageAsync } = useSignMessage();
  const { data: gasBalance } = useBalance({ address, chainId: portaldotTestnet.id });
  const { data: nativeAccount } = useNativeAccount();
  const liveActivity = useLiveActivity('all');
  const autoPilot = useAutoPilotStore();
  const privateNotes = usePrivateNotesStore();

  const [syncingNotes, setSyncingNotes] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');

  const position = useQuery({
    queryKey: [
      'home-vault-position',
      portaldotTestnet.id,
      CONTRACT_ADDRESSES.vault,
      CONTRACT_ADDRESSES.usdc,
      address,
    ],
    enabled: isVaultConfigured && Boolean(client && address),
    staleTime: 12_000,
    retry: 0,
    queryFn: () =>
      readVault(client!, CONTRACT_ADDRESSES.vault, CONTRACT_ADDRESSES.usdc, address!),
  });

  const vaultSnap = useQuery<{
    totalAssets: string;
    symbol: string;
    depositFrozen: boolean;
  }>({
    queryKey: ['home-vault-snap', CONTRACT_ADDRESSES.vault],
    enabled: isVaultConfigured,
    staleTime: 15_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/vault');
      if (!r.ok) throw new Error('Vault status unavailable');
      return r.json();
    },
  });

  async function handleRestorePrivateBalance() {
    setSyncingNotes(true);
    setSyncError('');
    setSyncMessage('');
    try {
      if (!address) {
        throw new Error(
          'Connect your wallet in the top bar to derive your encryption key and restore your Private Balance.',
        );
      }
      if (!client || !isVaultConfigured) {
        throw new Error(
          'Business vault contract is not yet configured on this deployment.',
        );
      }
      const signature = await signMessageAsync({
        message: buildNoteSyncDomainMessage(address),
      });
      const key = await deriveNoteEncryptionKey(signature);
      const restored = await restorePrivateNotesFromNetwork({
        client,
        vaultAddress: CONTRACT_ADDRESSES.vault,
        ownerAddress: address,
        key,
      });
      privateNotes.setRestoredSnapshot({
        owner: address,
        notes: restored.notes,
        formattedBalance: restored.formattedBalance,
        symbol: restored.symbol,
      });
      setSyncMessage(
        restored.notes.length > 0
          ? `Restored ${restored.notes.length} encrypted private ${
              restored.notes.length === 1 ? 'note' : 'notes'
            } (${restored.formattedBalance} ${restored.symbol} available).`
          : 'Encrypted note scan complete. Zero private notes found for this wallet on-chain.',
      );
    } catch (cause) {
      setSyncError(getReadableErrorMessage(cause));
    } finally {
      setSyncingNotes(false);
    }
  }

  const hasRestoredForAddress =
    Boolean(address) &&
    privateNotes.restoredOwner?.toLowerCase() === address?.toLowerCase() &&
    privateNotes.formattedRestoredBalance !== null;

  // 1. Total Balance (Public wallet + Vault/Private position combined)
  let totalBalanceLabel = 'Connect wallet';
  if (position.data) {
    const combined = position.data.balance + position.data.assets;
    totalBalanceLabel = `${Number(formatUnits(combined, position.data.decimals)).toLocaleString(
      'en-US',
      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    )} ${position.data.symbol}`;
  } else if (gasBalance) {
    totalBalanceLabel = `${parseFloat(gasBalance.formatted).toFixed(2)} ${gasBalance.symbol}`;
  } else if (nativeAccount?.nativeFreeTPOT) {
    totalBalanceLabel = `${parseFloat(nativeAccount.nativeFreeTPOT).toFixed(2)} tPOT`;
  }

  // 2. Private Balance (Restored encrypted notes or Shielded / Vault-held funds)
  const privateBalanceLabel = hasRestoredForAddress
    ? `${privateNotes.formattedRestoredBalance} ${privateNotes.symbol}`
    : position.data
      ? `${Number(formatUnits(position.data.assets, position.data.decimals)).toLocaleString(
          'en-US',
          { minimumFractionDigits: 2, maximumFractionDigits: 2 },
        )} ${position.data.symbol}`
      : address
        ? '0.00 USDC'
        : 'Hidden · Stealth Mode';

  // 3. Current Yield Earned (APY & Fixed-Yield Business Vault status)
  const earnedSharesDiff =
    position.data && position.data.assets > position.data.shares
      ? position.data.assets - position.data.shares
      : 0n;
  const yieldDisplay = position.data
    ? earnedSharesDiff > 0n
      ? `+${Number(formatUnits(earnedSharesDiff, position.data.decimals)).toFixed(2)} ${position.data.symbol}`
      : '5.20% – 7.80% APY'
    : vaultSnap.data
      ? '5.20% – 7.80% APY'
      : 'Up to 7.80% APY';

  // 4. Auto-Pilot Status (Active budget remaining & time left)
  const autoPilotDisplay = autoPilot.active
    ? `$${autoPilot.spendingBudget.toLocaleString('en-US')} · ${formatTimeRemaining(autoPilot.expiresAtMs)}`
    : 'Off · Manual Approval';

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="emerald-badge">
              <FiLock aria-hidden="true" />
              <span>Private Balances (Stealth Mode)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-sm font-semibold text-foreground">
              <FiShield className="text-primary" aria-hidden="true" />
              <span>Built-In Payment Protection</span>
            </span>
          </div>
          <h1 className="page-title">Your Business Operating Account</h1>
          <p className="page-description">
            Your wallet balance and payment amounts are hidden from the public. Only you
            and the person you pay can see the numbers.
          </p>
        </div>

        <button
          type="button"
          disabled={syncingNotes}
          onClick={() => void handleRestorePrivateBalance()}
          className="quiet-link text-sm disabled:opacity-50"
        >
          <FiRefreshCw
            className={syncingNotes ? 'animate-spin text-primary' : 'text-primary'}
            aria-hidden="true"
          />
          <span>
            {syncingNotes
              ? 'Decrypting Notes…'
              : 'Restore Private Balance from Network'}
          </span>
        </button>
      </header>

      {syncMessage && (
        <p role="status" className="text-sm font-semibold text-primary">
          {syncMessage}
        </p>
      )}
      {syncError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {syncError}
        </p>
      )}

      {/* Top Summary Bar: 4 Clean Cards */}
      <section
        aria-label="Account summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="panel min-w-0 space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Total Balance</span>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {totalBalanceLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            Public wallet &amp; private balance combined
          </p>
        </div>

        <div className="panel min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Private Balance
            </span>
            <FiLock className="text-primary" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-primary tabular-nums sm:text-3xl">
            {privateBalanceLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            {hasRestoredForAddress && privateNotes.lastSyncedAt
              ? `Synced from encrypted notes · ${privateNotes.lastSyncedAt}`
              : 'Shielded funds hidden from public view'}
          </p>
        </div>

        <div className="panel min-w-0 space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            Current Yield Earned
          </span>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {yieldDisplay}
          </p>
          <p className="text-sm text-muted-foreground">
            {vaultSnap.data
              ? `Pool size: ${vaultSnap.data.totalAssets} ${vaultSnap.data.symbol}`
              : 'Fixed-Yield Business Vaults'}
          </p>
        </div>

        <div className="panel min-w-0 space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            Auto-Pilot Status
          </span>
          <p className="text-2xl font-bold tracking-tight text-accent tabular-nums sm:text-3xl">
            {autoPilotDisplay}
          </p>
          <p className="text-sm text-muted-foreground">
            {autoPilot.active
              ? 'Spending budget & remaining window'
              : 'Set a budget & time limit anytime'}
          </p>
        </div>
      </section>

      {/* Quick Actions Row: 3 Prominent Buttons */}
      <section aria-label="Quick actions" className="grid gap-4 md:grid-cols-3">
        <Link
          href="/app/pay"
          className="action-link min-h-14 justify-between px-6 py-4 text-base"
        >
          <span className="inline-flex items-center gap-2.5 font-bold">
            <FiSend size={19} aria-hidden="true" />
            <span>Send Private Payment</span>
          </span>
          <FiArrowRight aria-hidden="true" />
        </Link>

        <Link
          href="/app/earn"
          className="quiet-link min-h-14 justify-between border-primary/40 px-6 py-4 text-base hover:border-primary"
        >
          <span className="inline-flex items-center gap-2.5 font-bold text-foreground">
            <FiTrendingUp size={19} className="text-primary" aria-hidden="true" />
            <span>Deposit to Earn</span>
          </span>
          <FiArrowRight className="text-primary" aria-hidden="true" />
        </Link>

        <Link
          href="/app/agent"
          className="quiet-link min-h-14 justify-between px-6 py-4 text-base"
        >
          <span className="inline-flex items-center gap-2.5 font-bold text-foreground">
            <FiCpu size={19} className="text-accent" aria-hidden="true" />
            <span>Ask Kudex Agent</span>
          </span>
          <FiArrowRight className="text-accent" aria-hidden="true" />
        </Link>
      </section>

      {/* Main Activity Chart */}
      <VolumeChart />

      {/* Live Event-Indexed On-Chain Activity Ledger */}
      <section className="panel space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">On-Chain Activity &amp; Receipts</h2>
              {liveActivity.latestBlock !== null && (
                <span className="rounded-full border border-border bg-secondary px-3 py-0.5 font-mono text-sm font-semibold text-muted-foreground tabular-nums">
                  Synced · Block #{liveActivity.latestBlock.toString()}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time event logs indexed directly from network blocks across payments,
              invoices, vaults, POT fee locks, and swaps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void liveActivity.refetch()}
              disabled={liveActivity.isFetching}
              className="quiet-link text-sm disabled:opacity-50"
            >
              <FiRefreshCw
                className={liveActivity.isFetching ? 'animate-spin text-primary' : ''}
                aria-hidden="true"
              />
              <span>Refresh Blocks</span>
            </button>
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <span>Public Auditor Portal</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Filter Pills: Scope + Categories */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Account activity scope"
            className="inline-flex flex-wrap gap-1.5 rounded-xl border border-border bg-secondary p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={liveActivity.scope === 'all'}
              onClick={() => liveActivity.setScope('all')}
              className={`min-h-9 rounded-lg px-3 py-1 text-sm font-semibold transition ${
                liveActivity.scope === 'all'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Network Activity
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={liveActivity.scope === 'mine'}
              onClick={() => liveActivity.setScope('mine')}
              className={`min-h-9 rounded-lg px-3 py-1 text-sm font-semibold transition ${
                liveActivity.scope === 'mine'
                  ? 'bg-card text-foreground shadow-sm'
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
            {HOME_FILTER_PILLS.map((pill) => {
              const active = liveActivity.filterGroup === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => liveActivity.setFilterGroup(pill.id)}
                  className={`min-h-9 rounded-full border px-3.5 py-1 text-sm font-semibold transition ${
                    active
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {liveActivity.filteredItems.length > 0 ? (
          <div
            tabIndex={0}
            role="region"
            aria-label="Live on-chain activity ledger"
            className="table-region rounded-xl border border-border"
          >
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Category &amp; Event</th>
                  <th className="px-4 py-3">Block &amp; Tx Hash</th>
                  <th className="px-4 py-3">Settled Amount</th>
                  <th className="px-4 py-3">Receipt &amp; Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {liveActivity.filteredItems.slice(0, 25).map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <span className="emerald-badge">
                        <FiCheckCircle aria-hidden="true" />
                        <span>{item.category}</span>
                      </span>
                      <span className="mt-1 block font-semibold text-foreground">
                        {item.title}
                      </span>
                      <span className="block text-muted-foreground">{item.subtitle}</span>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">
                      <span className="block font-bold text-foreground">
                        #{item.blockNumber.toString()}
                      </span>
                      <span className="text-muted-foreground">
                        {truncateAddress(item.transactionHash)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-primary tabular-nums">
                      {item.formattedAmount}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
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
                          className="quiet-link px-3 py-1.5 text-sm"
                        >
                          <FiExternalLink aria-hidden="true" />
                          <span>Verify</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-secondary/60 p-6 space-y-4">
            <div className="space-y-1">
              <p className="font-bold text-foreground">
                No Confirmed On-Chain Transactions in This Filter Yet
              </p>
              <p className="text-sm text-muted-foreground">
                Execute a private payment, create an on-chain invoice, lock POT for 0%
                fees, or deposit into a Fixed-Yield Business Vault to index your first live
                block receipt.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/app/pay" className="action-link text-sm">
                <FiSend aria-hidden="true" />
                <span>Start a Payment</span>
              </Link>
              <Link href="/app/earn" className="quiet-link text-sm">
                <FiTrendingUp className="text-primary" aria-hidden="true" />
                <span>Deposit Funds</span>
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
