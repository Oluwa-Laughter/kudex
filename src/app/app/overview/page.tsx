'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import {
  FiArrowRight,
  FiRepeat,
  FiGlobe,
  FiSend,
  FiLayers,
  FiCpu,
  FiFileText,
  FiShield,
} from 'react-icons/fi';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { isVaultConfigured, CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { useNativeAccount } from '@/lib/hooks/useNativeAccount';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { VolumeChart } from '@/components/dashboard/VolumeChart';
import { AgentConsole } from '@/components/dashboard/AgentConsole';

const QUICK_WORKFLOWS = [
  {
    title: 'RFQ Marketplace',
    description: 'Trade credit tranches and treasury quotes with zero slippage.',
    href: '/app/marketplace',
    icon: FiRepeat,
    cta: 'Open Orderbook',
  },
  {
    title: 'Cross-Chain Bridge',
    description: 'Route capital from Ethereum, Arbitrum, Base, or Optimism.',
    href: '/app/bridge',
    icon: FiGlobe,
    cta: 'Bridge Assets',
  },
  {
    title: 'Private Settlement',
    description: 'Dispatch shielded recipient notes and cryptographic invoices.',
    href: '/app/settlement',
    icon: FiSend,
    cta: 'Send & Invoice',
  },
  {
    title: 'Yield Vaults',
    description: 'Deposit collateral into institutional pools and manage shares.',
    href: '/app/vaults',
    icon: FiLayers,
    cta: 'Manage Pools',
  },
  {
    title: 'Compliance & Keys',
    description: 'Issue read-only auditor viewing keys and tax certificates.',
    href: '/app/compliance',
    icon: FiFileText,
    cta: 'Manage Disclosure',
  },
  {
    title: 'Solvency Protection',
    description: 'Monitor real-time pool risk scores and DaaS reserve coverage.',
    href: '/app/protection',
    icon: FiShield,
    cta: 'Inspect Risk',
  },
];

export default function OverviewWorkspacePage() {
  const { address } = useAccount();
  const { data: gasBalance } = useBalance({ address, chainId: portaldotTestnet.id });
  const { data: nativeAccount } = useNativeAccount();
  const events = useProtocolEvents();

  const vaultSnap = useQuery<{
    totalAssets: string;
    symbol: string;
    riskScorePercent: string;
    depositFrozen: boolean;
  }>({
    queryKey: ['overview-vault', CONTRACT_ADDRESSES.vault],
    enabled: isVaultConfigured,
    staleTime: 15_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/vault');
      if (!r.ok) throw new Error('Pool telemetry unavailable');
      return r.json();
    },
  });

  const walletDisplay = gasBalance
    ? `${parseFloat(gasBalance.formatted).toFixed(2)} ${gasBalance.symbol}`
    : nativeAccount?.nativeFreeTPOT
      ? `${parseFloat(nativeAccount.nativeFreeTPOT).toFixed(2)} tPOT`
      : 'Connect wallet';

  const poolDisplay = vaultSnap.data
    ? `${vaultSnap.data.totalAssets} ${vaultSnap.data.symbol}`
    : isVaultConfigured
      ? 'Syncing…'
      : 'Awaiting pool';

  const windowVolumeDisplay = events.data
    ? `${formatUnits(events.data.totalVolumeBigInt, events.data.decimals)} units`
    : '0.00 units';

  const settlementsDisplay = events.data
    ? `${events.data.totalSettlements} fills`
    : '0 fills';

  return (
    <div className="space-y-8">
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">Portfolio Command Center</p>
          <h1 className="page-title">Confidential Settlement & Treasury Operations</h1>
          <p className="page-description">
            Execute negotiated RFQ swaps, route cross-chain liquidity into shielded notes,
            and delegate bounded treasury actions to KUDEX AGENT.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="action-link text-sm" href="/app/marketplace">
            <span>Request Liquidity</span>
            <FiArrowRight aria-hidden="true" />
          </Link>
          <Link className="cobalt-action text-sm" href="/app/bridge">
            <span>Bridge Capital</span>
            <FiGlobe aria-hidden="true" />
          </Link>
        </div>
      </header>

      {/* Live Portfolio & Protocol Ribbon */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel space-y-1">
          <span className="text-sm text-muted-foreground">Connected Wallet Balance</span>
          <p className="text-2xl font-bold text-primary tabular-nums">{walletDisplay}</p>
        </div>
        <div className="panel space-y-1">
          <span className="text-sm text-muted-foreground">Active Pool Liquidity</span>
          <p className="text-2xl font-bold tabular-nums">{poolDisplay}</p>
        </div>
        <div className="panel space-y-1">
          <span className="text-sm text-muted-foreground">500-Block Window Volume</span>
          <p className="text-2xl font-bold tabular-nums">{windowVolumeDisplay}</p>
        </div>
        <div className="panel space-y-1">
          <span className="text-sm text-muted-foreground">Recent RFQ Settlements</span>
          <p className="text-2xl font-bold text-accent tabular-nums">
            {settlementsDisplay}
          </p>
        </div>
      </section>

      {/* Actionable Workspaces Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Core Workspaces</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {QUICK_WORKFLOWS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="panel group flex flex-col justify-between space-y-4 transition hover:border-primary hover:bg-secondary/70"
            >
              <div className="space-y-2.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <item.icon size={20} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <span>{item.cta}</span>
                <FiArrowRight aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <VolumeChart />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FiCpu className="text-primary" aria-hidden="true" />
          <h2 className="text-xl font-bold">KUDEX AGENT Copilot</h2>
        </div>
        <AgentConsole />
      </div>
    </div>
  );
}
