'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FiShield,
  FiRepeat,
  FiCpu,
  FiActivity,
  FiArrowUpRight,
  FiLock,
  FiArrowRight,
  FiCheckCircle,
  FiTrendingUp,
  FiLayers,
  FiRefreshCw,
  FiCopy,
  FiCheck,
} from 'react-icons/fi';
import { RiExchangeFundsLine, RiShieldCheckLine, RiBankCardLine } from 'react-icons/ri';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { formatUnits, zeroAddress } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { KUDEX_VAULT_ABI } from '@/lib/contracts/abis';
import { truncateAddress } from '@/lib/utils';
import { useProtocolStore } from '@/lib/protocol-store';
import { useNativeWallet } from '@/components/navigation/NativeWalletProvider';
import { useNativeAccount } from '@/lib/hooks/useNativeAccount';
import { VolumeChart } from '@/components/dashboard/VolumeChart';
import { AgentConsole } from '@/components/dashboard/AgentConsole';

export default function OverviewPage() {
  const { address, isConnected } = useAccount();
  const { selected: nativeSelected } = useNativeWallet();
  const nativeAccount = useNativeAccount();
  const { notes, positions, orders, riskScoreBps } = useProtocolStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Dynamic live on-chain contract read for TVL
  const { data: totalAssetsRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'totalAssets',
  });

  // Dynamic live on-chain read for risk score
  const { data: riskScoreRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: KUDEX_VAULT_ABI,
    functionName: 'riskScore',
  });

  // User's active shielded notes total
  const userShieldedTotal = notes
    .filter((n) => n.status === 'SHIELDED')
    .reduce((sum, n) => sum + parseFloat(n.amount.replace(/,/g, '')), 0);

  // User's deposited vault total
  const userVaultTotal =
    positions.senior.depositedAmount +
    positions.mezzanine.depositedAmount +
    positions.junior.depositedAmount;

  const displayTVL =
    totalAssetsRaw && CONTRACT_ADDRESSES.vault !== zeroAddress
      ? `$${Number(formatUnits(totalAssetsRaw, 6)).toLocaleString()}`
      : userVaultTotal > 0
      ? `$${userVaultTotal.toLocaleString()}`
      : '$0.00';

  const storeVolume = orders
    .filter((o) => o.status === 'FILLED')
    .reduce((sum, o) => sum + parseFloat(o.makerAmount.replace(/,/g, '') || '0'), 0);

  const displayVolume = storeVolume > 0 ? `$${storeVolume.toLocaleString()}` : '$0.00';

  const riskScoreNum = riskScoreRaw ? Number(riskScoreRaw) : riskScoreBps;
  const healthFactor =
    riskScoreNum > 0 ? `${(10000 / Math.max(riskScoreNum, 1000)).toFixed(2)}x` : '--';
  const displayShielded =
    userShieldedTotal > 0 ? `$${userShieldedTotal.toLocaleString()}` : '$0.00';

  return (
    <div className="space-y-10">
      {/* Header with Identity and Quick Status */}
      <header className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="eyebrow">Portaldot 3.0 Settlement Workspace</p>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Protocol Command Center
          </h1>
          <p className="mt-2 text-base text-muted-foreground max-w-2xl">
            Institutional confidential settlement, structured RWA credit tranches, and autonomous agent RFQ execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/app/how-it-works"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-sm font-semibold transition"
          >
            <span>Protocol Architecture Guide</span>
            <FiArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Dual Wallet Status Card */}
      <section className="p-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <RiShieldCheckLine className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Connected Network Identity
              </h2>
              <p className="text-xs text-muted-foreground">
                Portaldot 3.0 Substrate L0 & Revive EVM dual-runtime environments
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Portaldot 3.0 Live</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Native Portaldot Account */}
          <div className="p-4 rounded-xl border border-border bg-background space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Portaldot Extension (SS58)
              </span>
              {nativeSelected && (
                <button
                  onClick={() => handleCopy(nativeSelected.address, 'native')}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                >
                  {copiedId === 'native' ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'native' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            {nativeSelected ? (
              <div>
                <p className="font-mono text-xs font-bold text-foreground break-all select-all">
                  {nativeSelected.address}
                </p>
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Native Balance:</span>
                  <span className="font-mono font-bold text-foreground tabular-nums">
                    {nativeAccount.data?.nativeFreeTPOT ?? '0'} tPOT
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-1">
                Portaldot extension not connected. Use the wallet button to link your native account.
              </p>
            )}
          </div>

          {/* EVM Account */}
          <div className="p-4 rounded-xl border border-border bg-background space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Revive EVM Signer (0x)
              </span>
              {address && (
                <button
                  onClick={() => handleCopy(address, 'evm')}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                >
                  {copiedId === 'evm' ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'evm' ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            {address ? (
              <div>
                <p className="font-mono text-xs font-bold text-foreground break-all select-all">
                  {address}
                </p>
                <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Execution Runtime:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-[#00E599]">
                    Revive Module (Active)
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-1">
                EVM wallet not connected. Connect MetaMask or Rabby to sign smart contract transactions.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Primary Metrics Ribbon */}
      <section aria-label="Key Protocol Metrics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl border border-border bg-card space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-muted-foreground">
            <span>Total Value Locked</span>
            <FiLayers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-foreground tabular-nums">
            {displayTVL}
          </div>
          <p className="text-xs text-emerald-600 dark:text-[#00E599] font-medium flex items-center gap-1">
            <FiTrendingUp className="w-3.5 h-3.5" />
            <span>Senior, Mezzanine & Junior Tranches</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-muted-foreground">
            <span>Settled RFQ Volume</span>
            <FiRepeat className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-foreground tabular-nums">
            {displayVolume}
          </div>
          <p className="text-xs text-muted-foreground">
            Zero mempool front-running & MEV
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-muted-foreground">
            <span>Solvency Health Factor</span>
            <FiActivity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-[#00E599] tabular-nums">
            {healthFactor}
          </div>
          <p className="text-xs text-muted-foreground">
            Dynamic debt restructuring active
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-muted-foreground">
            <span>Confidential Pool (pUSD)</span>
            <FiLock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-foreground tabular-nums">
            {displayShielded}
          </div>
          <p className="text-xs text-muted-foreground">
            Zero plaintext metadata leakage
          </p>
        </div>
      </section>

      {/* Primary Protocol Workflows */}
      <section aria-label="Core Workflows" className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">
          Core Settlement & Credit Facilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/app/settlement"
            className="group p-6 rounded-2xl border border-border bg-card hover:border-primary transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <FiLock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                Confidential Settlement Desk
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Shield public tokens into encrypted zero-knowledge commitment notes (`pUSD`). Perform private transfers and corporate invoicing without mempool leakage.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-sm font-bold text-primary">
              <span>Open Settlement Desk</span>
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/app/vaults"
            className="group p-6 rounded-2xl border border-border bg-card hover:border-primary transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <FiLayers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                Waterfall Credit Tranches
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Allocate capital across Senior (8.5% APY), Mezzanine (14.2% APY), and Junior (22.8% APY) tranches with algorithmic debt restructuring protecting senior principal.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-sm font-bold text-primary">
              <span>Explore Vaults</span>
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/app/marketplace"
            className="group p-6 rounded-2xl border border-border bg-card hover:border-primary transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <FiRepeat className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                Instant Swap & Fiat Ramps
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simple 1-click token swaps, instant fiat on-ramps via card or bank wire, and confidential off-ramps to bank accounts with zero balance leakage.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2 text-sm font-bold text-primary">
              <span>Trade & Ramp Now</span>
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* Volume Chart & Telemetry */}
      <VolumeChart />

      {/* AI Copilot & Solver Terminal */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Autonomous Agent & Settlement Copilot
            </h2>
            <p className="text-sm text-muted-foreground">
              Query on-chain solvency telemetry, simulate RFQ routes, and explore credit tranches.
            </p>
          </div>
        </div>
        <AgentConsole />
      </section>
    </div>
  );
}
