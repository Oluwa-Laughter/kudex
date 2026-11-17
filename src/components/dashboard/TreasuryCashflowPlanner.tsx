'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import {
  FiArrowDownLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiCalendar,
  FiTrendingUp,
} from 'react-icons/fi';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import {
  CONTRACT_ADDRESSES,
  isInvoiceEscrowConfigured,
} from '@/lib/contracts/addresses';
import { kudexInvoiceEscrowAbi } from '@/lib/contracts/abis';
import { useAutoPilotStore } from '@/lib/sessionKeys';

export interface TreasuryCashflowPlannerProps {
  walletCashUsd: number;
  vaultCashUsd: number;
  privateBalanceUsd: number;
  assetSymbol: string;
}

export function TreasuryCashflowPlanner({
  walletCashUsd,
  vaultCashUsd,
  privateBalanceUsd,
  assetSymbol,
}: TreasuryCashflowPlannerProps) {
  const { address } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const autoPilot = useAutoPilotStore();

  const recurringMonthlyDefault = autoPilot.recurringPayment.enabled
    ? autoPilot.recurringPayment.cadence === 'Week'
      ? autoPilot.recurringPayment.amountUsd * 4
      : autoPilot.recurringPayment.amountUsd
    : 5000;

  const [monthlyBurnInput, setMonthlyBurnInput] = useState<string>(
    String(Math.max(500, Math.round(recurringMonthlyDefault))),
  );
  const [targetVaultSharePct, setTargetVaultSharePct] = useState<number>(70);

  const invoiceSummaryQuery = useQuery({
    queryKey: [
      'overview-invoice-summary',
      CONTRACT_ADDRESSES.invoiceEscrow,
      address,
    ],
    enabled: isInvoiceEscrowConfigured && Boolean(client && address),
    staleTime: 12_000,
    retry: 0,
    queryFn: async () => {
      const ids = await client!.readContract({
        address: CONTRACT_ADDRESSES.invoiceEscrow,
        abi: kudexInvoiceEscrowAbi,
        functionName: 'getInvoicesForAccount',
        args: [address!],
      });
      const recentIds = [...ids].slice(-25);
      const invoices = await Promise.all(
        recentIds.map((id) =>
          client!.readContract({
            address: CONTRACT_ADDRESSES.invoiceEscrow,
            abi: kudexInvoiceEscrowAbi,
            functionName: 'getInvoice',
            args: [id],
          }),
        ),
      );

      let receivableUsd = 0;
      let payableUsd = 0;
      let overdueCount = 0;
      let openCount = 0;
      const nowSec = BigInt(Math.floor(Date.now() / 1000));
      const userLower = address!.toLowerCase();

      for (const inv of invoices) {
        const statusNum = Number(inv.status);
        if (statusNum === 0 || statusNum === 1) {
          openCount += 1;
          const usd = Number(formatUnits(inv.amount, 6));
          if (inv.issuer.toLowerCase() === userLower) {
            receivableUsd += usd;
          } else {
            payableUsd += usd;
          }
          if (inv.dueTimestamp > 0n && inv.dueTimestamp < nowSec) {
            overdueCount += 1;
          }
        }
      }

      return { receivableUsd, payableUsd, overdueCount, openCount };
    },
  });

  const totalCashUsd = Math.max(0, walletCashUsd + vaultCashUsd + privateBalanceUsd);
  const burnUsd = Math.max(0, Number(monthlyBurnInput) || 0);
  const blendedApy = 0.065; // 5.20% Treasury Vault – 7.80% Business Invoice Pool midpoint
  const targetVaultCapital = (totalCashUsd * targetVaultSharePct) / 100;
  const recommendedTopUp = Math.max(0, targetVaultCapital - vaultCashUsd);
  const projectedAnnualYieldUsd = targetVaultCapital * blendedApy;
  const projectedMonthlyYieldUsd = projectedAnnualYieldUsd / 12;

  const receivableUsd = invoiceSummaryQuery.data?.receivableUsd ?? 0;
  const payableUsd = invoiceSummaryQuery.data?.payableUsd ?? 0;
  const netWorkingCapitalUsd = totalCashUsd + receivableUsd - payableUsd;

  const netMonthlyOutflow = Math.max(0, burnUsd - projectedMonthlyYieldUsd);
  const runwayLabel =
    totalCashUsd === 0 && burnUsd > 0
      ? 'Fund wallet to start'
      : burnUsd === 0
        ? 'No monthly burn set'
        : netMonthlyOutflow <= 0
          ? 'Self-sustaining yield'
          : `${(Math.max(0, netWorkingCapitalUsd) / netMonthlyOutflow).toFixed(1)} months`;

  return (
    <section
      aria-labelledby="treasury-cashflow-heading"
      className="panel space-y-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="eyebrow">Cashflow &amp; Treasury Planning</p>
          <h2 id="treasury-cashflow-heading" className="text-xl font-bold sm:text-2xl">
            Working Capital, Receivables &amp; Runway Forecaster
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Track unpaid business invoices alongside live vault allocations to estimate
            monthly yield offset and operating runway.
          </p>
        </div>

        <Link
          href={
            recommendedTopUp >= 10
              ? `/app/earn?amount=${recommendedTopUp.toFixed(2)}&vault=invoices`
              : '/app/earn?vault=invoices'
          }
          className="action-link text-sm"
        >
          <FiTrendingUp aria-hidden="true" />
          <span>
            {recommendedTopUp >= 10
              ? `Deploy $${recommendedTopUp.toLocaleString('en-US', {
                  maximumFractionDigits: 0,
                })} Idle Cash`
              : 'Optimize Vault Allocation'}
          </span>
          <FiArrowRight aria-hidden="true" />
        </Link>
      </div>

      {/* Live Accounts Receivable & Payable Strip */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-secondary/60 p-4 space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>Accounts Receivable</span>
            <FiArrowDownLeft className="text-primary" aria-hidden="true" />
          </div>
          <p className="text-xl font-bold text-primary tabular-nums">
            ${receivableUsd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            {assetSymbol}
          </p>
          <span className="block text-sm text-muted-foreground">
            Open invoices owed to your business
          </span>
        </div>

        <div className="rounded-xl border border-border bg-secondary/60 p-4 space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>Accounts Payable</span>
            <FiArrowUpRight className="text-accent" aria-hidden="true" />
          </div>
          <p className="text-xl font-bold text-foreground tabular-nums">
            ${payableUsd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            {assetSymbol}
          </p>
          <span className="block text-sm text-muted-foreground">
            {invoiceSummaryQuery.data?.overdueCount
              ? `${invoiceSummaryQuery.data.overdueCount} overdue needing attention`
              : 'Invoices & sign-offs awaiting payment'}
          </span>
        </div>

        <div className="rounded-xl border border-border bg-secondary/60 p-4 space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>Projected Annual Yield</span>
            <FiTrendingUp className="text-primary" aria-hidden="true" />
          </div>
          <p className="text-xl font-bold text-primary tabular-nums">
            +$
            {projectedAnnualYieldUsd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            /yr
          </p>
          <span className="block text-sm text-muted-foreground tabular-nums">
            ~${projectedMonthlyYieldUsd.toFixed(2)}/mo at {targetVaultSharePct}% vault share
          </span>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
            <span>Estimated Cash Runway</span>
            <FiCalendar className="text-primary" aria-hidden="true" />
          </div>
          <p className="text-xl font-bold text-primary tabular-nums">
            {runwayLabel}
          </p>
          <span className="block text-sm text-muted-foreground tabular-nums">
            Net position ${netWorkingCapitalUsd.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Interactive Planning Controls */}
      <div className="grid gap-5 rounded-2xl border border-border bg-secondary/50 p-4 sm:p-5 lg:grid-cols-2">
        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="planner-monthly-burn"
              className="text-sm font-semibold text-foreground"
            >
              Monthly Payroll &amp; Operating Burn ($ USD)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[2500, 10000, 25000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMonthlyBurnInput(String(preset))}
                  className={`rounded-lg border px-2.5 py-1 text-sm font-semibold tabular-nums transition ${
                    Number(monthlyBurnInput) === preset
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ${(preset / 1000).toFixed(1).replace('.0', '')}k
                </button>
              ))}
            </div>
          </div>
          <input
            id="planner-monthly-burn"
            type="number"
            min="0"
            step="100"
            value={monthlyBurnInput}
            onChange={(e) => setMonthlyBurnInput(e.target.value)}
            className="field-input font-bold tabular-nums"
          />
        </div>

        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="planner-vault-allocation"
              className="text-sm font-semibold text-foreground"
            >
              Target Cash Earning Yield in Business Vaults
            </label>
            <span className="text-base font-bold text-primary tabular-nums">
              {targetVaultSharePct}% ($
              {targetVaultCapital.toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}
              )
            </span>
          </div>
          <input
            id="planner-vault-allocation"
            type="range"
            min={0}
            max={100}
            step={5}
            value={targetVaultSharePct}
            onChange={(e) => setTargetVaultSharePct(Number(e.target.value))}
            className="mt-2 w-full accent-emerald-600"
          />
          <p className="text-sm text-muted-foreground">
            Balances liquid cash for instant payroll with protected treasury return.
          </p>
        </div>
      </div>
    </section>
  );
}
