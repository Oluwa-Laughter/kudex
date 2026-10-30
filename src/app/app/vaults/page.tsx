'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiLayers, FiShield, FiArrowRight } from 'react-icons/fi';
import { PublicVault } from '@/components/dashboard/PublicVault';

const TRANCHES = [
  {
    id: 'senior',
    name: 'Senior Capital Pool',
    priority: 'First-priority redemption waterfall',
    guardrail: '85% automated solvency freeze threshold',
  },
  {
    id: 'mezzanine',
    name: 'Mezzanine Credit Pool',
    priority: 'Balanced institutional credit allocation',
    guardrail: 'Backed by junior first-loss reserve buffer',
  },
  {
    id: 'junior',
    name: 'Junior First-Loss Pool',
    priority: 'Subordinated risk absorption capital',
    guardrail: 'Absorbs initial credit variance before senior pools',
  },
] as const;

export default function VaultsWorkspacePage() {
  const [selectedTranche, setSelectedTranche] =
    useState<(typeof TRANCHES)[number]['id']>('senior');

  return (
    <div className="space-y-8">
      <header className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="eyebrow">Institutional Yield & Custody</p>
          <h1 className="page-title">Structured Liquidity Pools & Deposits</h1>
          <p className="page-description">
            Select a capital pool tier, inspect live on-chain share balances, and execute
            slippage-protected deposits or redemptions.
          </p>
        </div>
        <Link className="quiet-link text-sm" href="/app/protection">
          <FiShield className="text-primary" aria-hidden="true" />
          <span>Inspect Pool Solvency</span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {TRANCHES.map((tranche) => {
          const active = selectedTranche === tranche.id;
          return (
            <button
              key={tranche.id}
              type="button"
              onClick={() => setSelectedTranche(tranche.id)}
              className={`rounded-2xl border p-5 text-left transition ${
                active
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <FiLayers className="text-primary" size={20} aria-hidden="true" />
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-sm font-semibold text-primary">
                  {active ? 'Selected' : 'Select Pool'}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-bold text-foreground">{tranche.name}</h2>
              <p className="mt-1 text-sm">{tranche.priority}</p>
              <p className="mt-2 text-sm text-muted-foreground">{tranche.guardrail}</p>
            </button>
          );
        })}
      </section>

      <PublicVault hideHeader />
    </div>
  );
}
