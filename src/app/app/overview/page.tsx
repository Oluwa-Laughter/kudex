'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useBalance, usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import {
  FiSend,
  FiTrendingUp,
  FiCpu,
  FiLock,
  FiShield,
  FiCheckCircle,
  FiArrowRight,
} from 'react-icons/fi';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { isVaultConfigured, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { readVault } from '@/lib/contracts/vault-client';
import { useNativeAccount } from '@/lib/hooks/useNativeAccount';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { useAutoPilotStore, formatTimeRemaining } from '@/lib/sessionKeys';
import { VolumeChart } from '@/components/dashboard/VolumeChart';

export default function HomeOverviewPage() {
  const { address } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { data: gasBalance } = useBalance({ address, chainId: portaldotTestnet.id });
  const { data: nativeAccount } = useNativeAccount();
  const events = useProtocolEvents();
  const autoPilot = useAutoPilotStore();

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

  // 2. Private Balance (Shielded / Vault-held funds)
  const privateBalanceLabel = position.data
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
      <header className="space-y-3">
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
          Your wallet balance and payment amounts are hidden from the public. Only you and
          the person you pay can see the numbers.
        </p>
      </header>

      {/* Top Summary Bar: 4 Clean Cards */}
      <section
        aria-label="Account summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="panel space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            Total Balance
          </span>
          <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
            {totalBalanceLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            Public wallet &amp; private balance combined
          </p>
        </div>

        <div className="panel space-y-2">
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
            Shielded funds hidden from public view
          </p>
        </div>

        <div className="panel space-y-2">
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

        <div className="panel space-y-2">
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

      {/* Recent Activity Summary */}
      <section className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold">Recent Account Activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified vault deposits, private transfers, and best-price swaps on the
              network.
            </p>
          </div>
          <Link
            href="/app/pay"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <span>Create 1-Click Auditor Pass</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
        </div>

        {events.data && events.data.chartSeries.some((b) => b.rawVolumeBigInt > 0n) ? (
          <div className="table-region rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Activity</th>
                  <th className="px-4 py-3">Window</th>
                  <th className="px-4 py-3">Settled Volume</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.data.chartSeries
                  .filter((b) => b.rawVolumeBigInt > 0n)
                  .map((b) => (
                    <tr key={b.day}>
                      <td className="px-4 py-3 font-semibold">
                        Vault Deposit &amp; Payment Settlement
                      </td>
                      <td className="px-4 py-3 font-mono tabular-nums">#{b.day}</td>
                      <td className="px-4 py-3 font-mono font-bold text-primary tabular-nums">
                        {formatUnits(b.rawVolumeBigInt, events.data!.decimals)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="emerald-badge">
                          <FiCheckCircle aria-hidden="true" />
                          <span>Confirmed</span>
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl bg-secondary p-5 text-sm text-muted-foreground">
            No recent transactions in the active window yet. Send a private payment,
            deposit into a Fixed-Yield Business Vault, or swap assets to see live
            confirmations here.
          </div>
        )}
      </section>
    </div>
  );
}
