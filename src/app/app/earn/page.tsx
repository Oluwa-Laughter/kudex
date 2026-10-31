'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReadContract } from 'wagmi';
import { erc20Abi, formatUnits, zeroAddress } from 'viem';
import {
  FiShield,
  FiTrendingUp,
  FiCheckCircle,
  FiDollarSign,
  FiActivity,
} from 'react-icons/fi';
import { CONTRACT_ADDRESSES, isVaultConfigured } from '@/lib/contracts/addresses';
import { kudexDaaSAdapterAbi, kudexVaultAbi } from '@/lib/contracts/abis';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { PublicVault } from '@/components/dashboard/PublicVault';
import { RiskPanel } from '@/components/dashboard/RiskPanel';

const BUSINESS_VAULTS = [
  {
    id: 'treasury',
    name: 'Short-Term Treasury Vault',
    apy: '5.20% APY',
    backing: 'Short-term government treasuries and cash equivalents',
    liquidityNote: 'Daily liquidity with 0.5% minimum-output protection',
  },
  {
    id: 'invoices',
    name: 'Verified Business Invoice Pool',
    apy: '7.80% APY',
    backing: '30-to-60 day verified supplier and trade receivables',
    liquidityNote: 'Automatic pool freeze & reserve recovery if an invoice is late',
  },
] as const;

function formatTokenFixed(
  units: bigint,
  decimals: number,
  fractionDigits: number,
): string {
  const scale = 10n ** BigInt(decimals);
  const outScale = 10n ** BigInt(fractionDigits);
  const scaled = (units * outScale + scale / 2n) / scale;
  const whole = scaled / outScale;
  const frac = (scaled % outScale).toString().padStart(fractionDigits, '0');
  return `${whole.toLocaleString('en-US')}.${frac}`;
}

export default function EarnPage() {
  const [selectedVaultId, setSelectedVaultId] =
    useState<(typeof BUSINESS_VAULTS)[number]['id']>('treasury');

  const vaultSnap = useQuery<{
    totalAssets: string;
    symbol: string;
    decimals?: number;
    exchangeRatePerShare?: string;
    totalYieldDistributed?: string;
    protectionReserveBalance?: string;
    depositFrozen: boolean;
    riskScoreBps: string;
  }>({
    queryKey: ['earn-vault-snap', CONTRACT_ADDRESSES.vault],
    enabled: isVaultConfigured,
    staleTime: 15_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/vault');
      if (!r.ok) throw new Error('Vault snapshot unavailable');
      return r.json();
    },
  });

  const assetDecimalsRead = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: portaldotTestnet.id,
    query: {
      enabled: CONTRACT_ADDRESSES.usdc !== zeroAddress,
      staleTime: 60_000,
    },
  });

  const exchangeRateRead = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: kudexVaultAbi,
    functionName: 'exchangeRatePerShare',
    chainId: portaldotTestnet.id,
    query: {
      enabled: isVaultConfigured,
      staleTime: 12_000,
    },
  });

  const totalYieldRead = useReadContract({
    address: CONTRACT_ADDRESSES.vault,
    abi: kudexVaultAbi,
    functionName: 'totalYieldDistributed',
    chainId: portaldotTestnet.id,
    query: {
      enabled: isVaultConfigured,
      staleTime: 12_000,
    },
  });

  const reserveBalanceRead = useReadContract({
    address: CONTRACT_ADDRESSES.daasAdapter,
    abi: kudexDaaSAdapterAbi,
    functionName: 'getReserveBalance',
    args: [CONTRACT_ADDRESSES.usdc],
    chainId: portaldotTestnet.id,
    query: {
      enabled:
        CONTRACT_ADDRESSES.daasAdapter !== zeroAddress &&
        CONTRACT_ADDRESSES.usdc !== zeroAddress,
      staleTime: 12_000,
    },
  });

  const healthFactor = useReadContract({
    address: CONTRACT_ADDRESSES.daasAdapter,
    abi: kudexDaaSAdapterAbi,
    functionName: 'calculateHealthFactor',
    args: [CONTRACT_ADDRESSES.vault],
    chainId: portaldotTestnet.id,
    query: {
      enabled:
        CONTRACT_ADDRESSES.daasAdapter !== zeroAddress &&
        CONTRACT_ADDRESSES.vault !== zeroAddress,
      staleTime: 15_000,
    },
  });

  const tokenDecimals =
    typeof assetDecimalsRead.data === 'number'
      ? assetDecimalsRead.data
      : (vaultSnap.data?.decimals ?? 6);
  const tokenSymbol = vaultSnap.data?.symbol ?? 'USDC';

  const exchangeRateDisplay =
    typeof exchangeRateRead.data === 'bigint'
      ? `1 Vault Share = ${formatTokenFixed(exchangeRateRead.data, tokenDecimals, 4)} USD`
      : vaultSnap.data?.exchangeRatePerShare
        ? `1 Vault Share = ${vaultSnap.data.exchangeRatePerShare} USD`
        : '1 Vault Share = 1.0000 USD';

  const revenueDistributedDisplay =
    typeof totalYieldRead.data === 'bigint'
      ? `$${formatTokenFixed(totalYieldRead.data, tokenDecimals, 2)} ${tokenSymbol}`
      : vaultSnap.data?.totalYieldDistributed
        ? `$${Number(vaultSnap.data.totalYieldDistributed).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} ${tokenSymbol}`
        : `$0.00 ${tokenSymbol}`;

  const protectionReserveDisplay =
    typeof reserveBalanceRead.data === 'bigint'
      ? `$${formatTokenFixed(reserveBalanceRead.data, tokenDecimals, 2)} ${tokenSymbol}`
      : vaultSnap.data?.protectionReserveBalance
        ? `$${Number(vaultSnap.data.protectionReserveBalance).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} ${tokenSymbol}`
        : `$0.00 ${tokenSymbol}`;

  const poolSizeLabel = vaultSnap.data
    ? `${vaultSnap.data.totalAssets} ${vaultSnap.data.symbol}`
    : isVaultConfigured
      ? 'Syncing…'
      : '0.00 USDC';

  const isHealthy =
    !vaultSnap.data?.depositFrozen &&
    (typeof healthFactor.data === 'bigint'
      ? Number(formatUnits(healthFactor.data, 2)) > 15
      : Number(vaultSnap.data?.riskScoreBps ?? '0') < 8500);

  const protectionBadge = isHealthy
    ? 'Protected — 100% Solvency Reserve'
    : 'Paused — Safety Reserve Recovery Active';

  const selectedVault =
    BUSINESS_VAULTS.find((v) => v.id === selectedVaultId) ?? BUSINESS_VAULTS[0];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <span className="emerald-badge">
          <FiShield aria-hidden="true" />
          <span>Built-In Payment Protection</span>
        </span>
        <h1 className="page-title">Fixed-Yield Business Vaults</h1>
        <p className="page-description">
          Earn steady, predictable returns backed by real-world business invoices,
          short-term treasuries, and live protocol settlement fees.
        </p>
      </header>

      {/* Live On-Chain Yield Distribution & Solvency Reserve Strip */}
      <section
        aria-label="Live on-chain yield and reserve metrics"
        className="grid gap-4 md:grid-cols-3"
      >
        <div className="panel min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Exchange Rate
            </span>
            <FiTrendingUp className="text-primary" aria-hidden="true" />
          </div>
          <p className="text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
            {exchangeRateDisplay}
          </p>
          <p className="text-sm text-muted-foreground">
            Appreciates automatically as settlement revenue enters the vault
          </p>
        </div>

        <div className="panel min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Real-Time Revenue Distributed to Depositors
            </span>
            <FiDollarSign className="text-primary" aria-hidden="true" />
          </div>
          <p className="text-xl font-bold tracking-tight text-primary tabular-nums sm:text-2xl">
            {revenueDistributedDisplay}
          </p>
          <p className="text-sm text-muted-foreground">
            80% of the 0.10% settlement fee routed directly to vault depositors
          </p>
        </div>

        <div className="panel min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              Payment Protection Reserve Balance
            </span>
            <FiActivity className="text-accent" aria-hidden="true" />
          </div>
          <p className="text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
            {protectionReserveDisplay}
          </p>
          <p className="text-sm text-muted-foreground">
            20% of settlement fees held in the dedicated solvency reserve
          </p>
        </div>
      </section>

      {/* Vault Investment Cards */}
      <section
        aria-label="Fixed-Yield Business Vaults"
        className="grid gap-6 lg:grid-cols-2"
      >
        {BUSINESS_VAULTS.map((vaultItem) => {
          const active = vaultItem.id === selectedVaultId;
          return (
            <button
              key={vaultItem.id}
              type="button"
              onClick={() => setSelectedVaultId(vaultItem.id)}
              className={`panel min-w-0 flex flex-col justify-between space-y-5 text-left transition ${
                active
                  ? 'border-primary ring-1 ring-primary'
                  : 'hover:border-primary/50 hover:bg-secondary/60'
              }`}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <FiTrendingUp size={20} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-bold text-foreground">
                        {vaultItem.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">{vaultItem.backing}</p>
                    </div>
                  </div>

                  <span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold text-primary">
                    {active ? 'Selected' : 'Select Vault'}
                  </span>
                </div>

                <dl className="grid gap-3 pt-2 sm:grid-cols-3">
                  <div className="rounded-xl bg-secondary p-3.5">
                    <dt className="text-sm text-muted-foreground">Annual Yield (APY)</dt>
                    <dd className="mt-1 text-2xl font-bold text-primary tabular-nums">
                      {vaultItem.apy}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-secondary p-3.5">
                    <dt className="text-sm text-muted-foreground">Total Pool Size</dt>
                    <dd className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                      {poolSizeLabel}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-secondary p-3.5">
                    <dt className="text-sm text-muted-foreground">
                      Payment Protection Status
                    </dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-sm font-bold text-primary">
                      <FiCheckCircle className="shrink-0" aria-hidden="true" />
                      <span>{protectionBadge}</span>
                    </dd>
                  </div>
                </dl>
              </div>

              <p className="border-t border-border pt-3 text-sm text-muted-foreground">
                {vaultItem.liquidityNote}
              </p>
            </button>
          );
        })}
      </section>

      {/* Simple Deposit / Withdraw Box */}
      <PublicVault selectedVaultTitle={selectedVault.name} />

      {/* Built-In Payment Protection Widget */}
      <RiskPanel />
    </div>
  );
}
