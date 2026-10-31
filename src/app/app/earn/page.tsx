'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReadContract } from 'wagmi';
import { formatUnits, zeroAddress } from 'viem';
import { FiShield, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import { CONTRACT_ADDRESSES, isVaultConfigured } from '@/lib/contracts/addresses';
import { kudexDaaSAdapterAbi } from '@/lib/contracts/abis';
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

export default function EarnPage() {
  const [selectedVaultId, setSelectedVaultId] =
    useState<(typeof BUSINESS_VAULTS)[number]['id']>('treasury');

  const vaultSnap = useQuery<{
    totalAssets: string;
    symbol: string;
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
          Earn steady, predictable returns backed by real-world business invoices and
          short-term treasuries.
        </p>
      </header>

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
              className={`panel flex flex-col justify-between space-y-5 text-left transition ${
                active
                  ? 'border-primary ring-1 ring-primary'
                  : 'hover:border-primary/50 hover:bg-secondary/60'
              }`}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                      <FiTrendingUp size={20} aria-hidden="true" />
                    </div>
                    <div>
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
