'use client';

import { useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { erc20Abi, formatUnits, isAddress, parseUnits, zeroAddress } from 'viem';
import {
  FiActivity,
  FiAlertOctagon,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiPlay,
  FiRepeat,
  FiSend,
  FiShield,
  FiSliders,
  FiTrendingUp,
} from 'react-icons/fi';
import { AGENT_EXECUTOR, executorAbi } from '@/lib/agent/contracts';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { usePrivateNotesStore } from '@/lib/crypto/noteSync';
import {
  SPENDING_BUDGET_PRESETS,
  TIME_LIMIT_OPTIONS,
  formatTimeRemaining,
  useAutoPilotStore,
  type AutoPilotCheckResult,
} from '@/lib/sessionKeys';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';
import { AgentConsole } from './AgentConsole';
import { AgentFleetManager } from './AgentFleetManager';
import { AgentPolicyBuilder } from './AgentPolicyBuilder';
import { AgentPolicyManager } from './AgentPolicyManager';
import { NativeAccountCard } from './NativeAccountCard';
import { RfqMandatePanel } from './RfqMandatePanel';

const advancedTabs = [
  { value: 'builder', label: 'Vault Auto-Pilot Rules', icon: FiSliders },
  { value: 'swaps', label: 'Swap Auto-Pilot Mandates', icon: FiRepeat },
  { value: 'controls', label: 'Active Rules & Revocation', icon: FiShield },
  { value: 'fleet', label: 'Activity Log', icon: FiActivity },
];

export function AgentWorkspace() {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { writeContractAsync } = useWriteContract();
  const privateNotes = usePrivateNotesStore();

  const [advancedTab, setAdvancedTab] = useState('builder');
  const [createdId, setCreatedId] = useState<`0x${string}`>();
  const [ruleBanner, setRuleBanner] = useState('');
  const [checkingNow, setCheckingNow] = useState(false);

  const {
    spendingBudget,
    timeLimitHours,
    allowedActions,
    active,
    expiresAtMs,
    onChainPolicyId,
    idleCashSweep,
    recurringPayment,
    targetRateSwap,
    checkHistory,
    hydrateTasks,
    setSpendingBudget,
    setTimeLimitHours,
    toggleAction,
    activateAutoPilot,
    turnOffImmediately,
    updateIdleCashSweep,
    updateRecurringPayment,
    updateTargetRateSwap,
    recordCheckResults,
  } = useAutoPilotStore();

  useEffect(() => {
    hydrateTasks();
  }, [hydrateTasks]);

  const anyActionAllowed =
    allowedActions.allowVaultDeposits ||
    allowedActions.allowBestPriceSwaps ||
    allowedActions.allowInvoicePayments;

  const isSessionActive =
    active && Boolean(expiresAtMs && expiresAtMs > Date.now());

  async function handleRunAutoPilotCheckNow() {
    setCheckingNow(true);
    setRuleBanner('');
    try {
      const checkedAt = new Date().toLocaleTimeString();
      const results: AutoPilotCheckResult[] = [];

      // Read live public wallet balance if connected and token is configured
      let livePublicBalanceUnits = 0n;
      let tokenDecimals = 6;
      let tokenSymbol = 'USDC';
      let liveBalanceObserved = false;

      if (client && address && CONTRACT_ADDRESSES.usdc !== zeroAddress) {
        try {
          const [bal, dec, sym] = await Promise.all([
            client.readContract({
              address: CONTRACT_ADDRESSES.usdc,
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [address],
            }),
            client.readContract({
              address: CONTRACT_ADDRESSES.usdc,
              abi: erc20Abi,
              functionName: 'decimals',
            }),
            client.readContract({
              address: CONTRACT_ADDRESSES.usdc,
              abi: erc20Abi,
              functionName: 'symbol',
            }),
          ]);
          livePublicBalanceUnits = bal;
          tokenDecimals = dec;
          tokenSymbol = sym;
          liveBalanceObserved = true;
        } catch {
          liveBalanceObserved = false;
        }
      }

      const activePolicyId = createdId ?? onChainPolicyId;

      // 1. Evaluate Auto-Sweep Idle Cash
      if (idleCashSweep.enabled) {
        const thresholdUnits = parseUnits(
          String(Math.max(0, idleCashSweep.thresholdUsd)),
          tokenDecimals,
        );
        const budgetUnits = parseUnits(String(spendingBudget), tokenDecimals);

        if (!isSessionActive || !allowedActions.allowVaultDeposits) {
          results.push({
            id: `check-sweep-${Date.now()}`,
            taskName: 'Auto-Sweep Idle Cash',
            outcome: 'Blocked by Limits',
            summary: !isSessionActive
              ? 'Save & Activate Auto-Pilot Rules above before background vault sweeps can run.'
              : 'Vault Deposits are currently unchecked in Allowed Actions.',
            checkedAt,
          });
        } else if (!liveBalanceObserved) {
          results.push({
            id: `check-sweep-${Date.now()}`,
            taskName: 'Auto-Sweep Idle Cash',
            outcome: 'Condition Not Met',
            summary: address
              ? `Monitoring public wallet against $${idleCashSweep.thresholdUsd.toLocaleString()} threshold (token deployment awaiting configuration).`
              : `Connect your business wallet to compare live public cash against your $${idleCashSweep.thresholdUsd.toLocaleString()} sweep threshold.`,
            checkedAt,
          });
        } else if (livePublicBalanceUnits <= thresholdUnits) {
          const formattedBal = Number(
            formatUnits(livePublicBalanceUnits, tokenDecimals),
          ).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          results.push({
            id: `check-sweep-${Date.now()}`,
            taskName: 'Auto-Sweep Idle Cash',
            outcome: 'Condition Not Met',
            summary: `Live wallet balance is $${formattedBal} ${tokenSymbol}, at or below your $${idleCashSweep.thresholdUsd.toLocaleString()} sweep threshold.`,
            checkedAt,
          });
        } else {
          const excessUnits = livePublicBalanceUnits - thresholdUnits;
          const cappedSweepUnits =
            excessUnits > budgetUnits ? budgetUnits : excessUnits;
          const formattedSweep = Number(
            formatUnits(cappedSweepUnits, tokenDecimals),
          ).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

          // Execute via active on-chain mandate if delegate wallet is connected
          if (
            client &&
            address &&
            chainId === portaldotTestnet.id &&
            activePolicyId &&
            AGENT_EXECUTOR !== zeroAddress
          ) {
            try {
              const sim = await client.simulateContract({
                address: AGENT_EXECUTOR,
                abi: executorAbi,
                functionName: 'execute',
                args: [activePolicyId, cappedSweepUnits],
                account: address,
              });
              const txHash = await writeContractAsync({
                ...sim.request,
                account: address,
                chainId: portaldotTestnet.id,
              });
              await client.waitForTransactionReceipt({ hash: txHash });
              results.push({
                id: `check-sweep-${Date.now()}`,
                taskName: 'Auto-Sweep Idle Cash',
                outcome: 'Executed',
                summary: `Swept $${formattedSweep} ${tokenSymbol} into ${idleCashSweep.targetVaultName} via active spending mandate (${truncateAddress(txHash)}).`,
                checkedAt,
                txHash,
              });
            } catch {
              results.push({
                id: `check-sweep-${Date.now()}`,
                taskName: 'Auto-Sweep Idle Cash',
                outcome: 'Ready for Mandate',
                summary: `Detected $${formattedSweep} ${tokenSymbol} idle cash above threshold. Authorize or fund your delegate mandate below to settle automatically.`,
                checkedAt,
              });
            }
          } else {
            results.push({
              id: `check-sweep-${Date.now()}`,
              taskName: 'Auto-Sweep Idle Cash',
              outcome: 'Ready for Mandate',
              summary: `Detected $${formattedSweep} ${tokenSymbol} excess cash ready to sweep into ${idleCashSweep.targetVaultName}. Bind an on-chain mandate ID below for zero-click execution.`,
              checkedAt,
            });
          }
        }
      }

      // 2. Evaluate Scheduled Recurring Payment
      if (recurringPayment.enabled) {
        if (!isSessionActive || !allowedActions.allowInvoicePayments) {
          results.push({
            id: `check-pay-${Date.now()}`,
            taskName: 'Scheduled Recurring Payment',
            outcome: 'Blocked by Limits',
            summary: !isSessionActive
              ? 'Auto-Pilot session is currently off. Activate Spending Limits to enable scheduled payouts.'
              : 'Invoice Payments are unchecked in Allowed Actions.',
            checkedAt,
          });
        } else if (recurringPayment.amountUsd > spendingBudget) {
          results.push({
            id: `check-pay-${Date.now()}`,
            taskName: 'Scheduled Recurring Payment',
            outcome: 'Blocked by Limits',
            summary: `Scheduled $${recurringPayment.amountUsd.toLocaleString()} payout to ${recurringPayment.vendorName} exceeds your $${spendingBudget.toLocaleString()} Auto-Pilot spending budget.`,
            checkedAt,
          });
        } else if (
          !isAddress(recurringPayment.recipientAddress) ||
          recurringPayment.recipientAddress.toLowerCase() === zeroAddress
        ) {
          results.push({
            id: `check-pay-${Date.now()}`,
            taskName: 'Scheduled Recurring Payment',
            outcome: 'Blocked by Limits',
            summary: 'Enter a valid 0x recipient address for your recurring vendor payout.',
            checkedAt,
          });
        } else {
          const syncedPrivateNotesCount = privateNotes.notes.filter(
            (n) => n.onChainCommitted && !n.spent,
          ).length;
          results.push({
            id: `check-pay-${Date.now()}`,
            taskName: 'Scheduled Recurring Payment',
            outcome: 'Ready for Mandate',
            summary: `Verified $${recurringPayment.amountUsd.toLocaleString()} every ${recurringPayment.cadence} to ${recurringPayment.vendorName} (${truncateAddress(recurringPayment.recipientAddress)}) within budget (${syncedPrivateNotesCount} unspent private ${syncedPrivateNotesCount === 1 ? 'note' : 'notes'} synced).`,
            checkedAt,
          });
        }
      }

      // 3. Evaluate Target-Rate Auto-Swap
      if (targetRateSwap.enabled) {
        if (!isSessionActive || !allowedActions.allowBestPriceSwaps) {
          results.push({
            id: `check-swap-${Date.now()}`,
            taskName: 'Target-Rate Auto-Swap',
            outcome: 'Blocked by Limits',
            summary: !isSessionActive
              ? 'Auto-Pilot session is currently off. Activate Spending Limits before target-rate swaps can trigger.'
              : 'Best-Price Swaps are unchecked in Allowed Actions.',
            checkedAt,
          });
        } else if (targetRateSwap.sellAmount > spendingBudget) {
          results.push({
            id: `check-swap-${Date.now()}`,
            taskName: 'Target-Rate Auto-Swap',
            outcome: 'Blocked by Limits',
            summary: `Swap size (${targetRateSwap.sellAmount.toLocaleString()} ${targetRateSwap.sellToken}) exceeds your $${spendingBudget.toLocaleString()} Auto-Pilot spending limit.`,
            checkedAt,
          });
        } else {
          results.push({
            id: `check-swap-${Date.now()}`,
            taskName: 'Target-Rate Auto-Swap',
            outcome: 'Ready for Mandate',
            summary: `Watching live counterparty quotes to swap ${targetRateSwap.sellAmount.toLocaleString()} ${targetRateSwap.sellToken} for ${targetRateSwap.buyToken} when rate reaches $${targetRateSwap.targetRateUsd.toFixed(2)}.`,
            checkedAt,
          });
        }
      }

      if (results.length === 0) {
        results.push({
          id: `check-none-${Date.now()}`,
          taskName: 'No Workflows Enabled',
          outcome: 'Condition Not Met',
          summary:
            'Enable at least one workflow in Active Auto-Pilot Workflows below and run the check again.',
          checkedAt,
        });
      }

      recordCheckResults(results);
      setRuleBanner(
        `Auto-Pilot check completed at ${checkedAt} (${results.length} ${
          results.length === 1 ? 'workflow' : 'workflows'
        } evaluated against live limits and balances).`,
      );
    } catch (cause) {
      setRuleBanner(getReadableErrorMessage(cause));
    } finally {
      setCheckingNow(false);
    }
  }

  return (
    <div className="space-y-10">
      <header className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <p className="eyebrow">Auto-Pilot Rules (Spending Limits)</p>
          <h1 className="page-title">Kudex Agent</h1>
          <p className="page-description">
            Give your Kudex Agent a budget and a time limit. It handles trades and
            payments in the background without asking you to click &apos;Approve&apos; on
            every step.
          </p>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="block font-bold text-primary tabular-nums">
            {active
              ? `Auto-Pilot Active · $${spendingBudget.toLocaleString()} max (${formatTimeRemaining(expiresAtMs)})`
              : 'Auto-Pilot Paused · Manual Approval Mode'}
          </span>
          <span className="text-muted-foreground">
            Strict spending limits · Instant 1-click shutoff
          </span>
        </div>
      </header>

      {/* Split-Screen Workspace: Left = Chat with Kudex Agent, Right = Auto-Pilot Rules */}
      <div className="grid items-start gap-7 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0 space-y-6">
          <AgentConsole />
          <NativeAccountCard />
        </div>

        {/* Right Panel: Auto-Pilot Rules */}
        <aside className="panel min-w-0 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold">Auto-Pilot Rules (Spending Limits)</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Set clear boundaries for what your Kudex Agent is allowed to spend and do.
              </p>
            </div>
            <span
              className={
                active
                  ? 'emerald-badge'
                  : 'inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-sm font-semibold text-muted-foreground'
              }
            >
              <FiCheckCircle aria-hidden="true" />
              <span>{active ? 'Active' : 'Off'}</span>
            </span>
          </div>

          {/* Spending Budget Slider & Presets */}
          <div className="space-y-3 rounded-xl border border-border bg-secondary/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="autopilot-budget-slider"
                className="flex items-center gap-1.5 text-sm font-semibold"
              >
                <FiDollarSign className="text-primary" aria-hidden="true" />
                <span>Spending Budget</span>
              </label>
              <span className="text-xl font-bold text-primary tabular-nums">
                ${spendingBudget.toLocaleString()} max
              </span>
            </div>

            <input
              id="autopilot-budget-slider"
              type="range"
              min={50}
              max={5000}
              step={50}
              value={spendingBudget}
              onChange={(e) => setSpendingBudget(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />

            <div className="flex flex-wrap gap-2">
              {SPENDING_BUDGET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSpendingBudget(preset)}
                  className={`min-h-10 rounded-xl border px-3.5 py-1.5 text-sm font-bold tabular-nums transition ${
                    spendingBudget === preset
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ${preset.toLocaleString()} max
                </button>
              ))}
            </div>
          </div>

          {/* Time Limit */}
          <div className="space-y-3 rounded-xl border border-border bg-secondary/60 p-4">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <FiClock className="text-primary" aria-hidden="true" />
              <span>Time Limit</span>
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {TIME_LIMIT_OPTIONS.map((option) => (
                <button
                  key={option.hours}
                  type="button"
                  onClick={() => setTimeLimitHours(option.hours)}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold tabular-nums transition ${
                    timeLimitHours === option.hours
                      ? 'border-primary bg-primary/15 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Allowed Actions Checkboxes */}
          <fieldset className="min-w-0 space-y-3 rounded-xl border border-border bg-secondary/60 p-4">
            <legend className="px-1 text-sm font-semibold">Allowed Actions</legend>

            {[
              {
                key: 'allowVaultDeposits' as const,
                label: 'Allow Vault Deposits',
                detail: 'Deposit idle funds into Fixed-Yield Business Vaults.',
              },
              {
                key: 'allowBestPriceSwaps' as const,
                label: 'Allow Best-Price Swaps',
                detail: 'Swap tokens with zero slippage via Best-Price Auto-Routing.',
              },
              {
                key: 'allowInvoicePayments' as const,
                label: 'Allow Invoice Payments',
                detail: 'Settle scheduled supplier invoices within your budget.',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3.5 transition hover:border-primary/40"
              >
                <input
                  type="checkbox"
                  checked={allowedActions[item.key]}
                  onChange={() => toggleAction(item.key)}
                  className="mt-1 h-5 w-5 rounded border-border accent-emerald-600"
                />
                <span className="min-w-0 space-y-0.5">
                  <span className="block text-sm font-bold text-foreground">
                    {item.label}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {item.detail}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="space-y-3 pt-1">
            <button
              type="button"
              disabled={!anyActionAllowed}
              onClick={() => {
                activateAutoPilot(createdId);
                setRuleBanner(
                  `Auto-Pilot Rules saved ($${spendingBudget.toLocaleString()} max for ${
                    timeLimitHours === 168 ? '7 Days' : `${timeLimitHours} Hours`
                  }). Use Run Auto-Pilot Check Now below to evaluate active treasury workflows.`,
                );
              }}
              className="action-link w-full text-base disabled:opacity-40"
            >
              {active ? 'Update Auto-Pilot Boundaries' : 'Save & Activate Auto-Pilot Rules'}
            </button>

            <button
              type="button"
              onClick={() => {
                turnOffImmediately();
                setRuleBanner(
                  'Auto-Pilot turned off immediately. Your Kudex Agent cannot initiate background actions.',
                );
              }}
              className="danger-action w-full text-base"
            >
              <FiAlertOctagon aria-hidden="true" />
              <span>Turn Off Auto-Pilot Immediately</span>
            </button>
          </div>

          {ruleBanner && (
            <p role="status" className="text-sm font-medium leading-relaxed text-primary">
              {ruleBanner}
            </p>
          )}
        </aside>
      </div>

      {/* UPGRADE 4: Persistent Auto-Pilot Tasks (Recurring Pay, Idle Cash Sweep & Target-Rate Auto-Swap) */}
      <section
        aria-labelledby="active-autopilot-workflows-heading"
        className="panel space-y-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="eyebrow">Persistent Treasury Automation</p>
            <h2 id="active-autopilot-workflows-heading" className="text-2xl font-bold">
              Active Auto-Pilot Workflows
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Configure standing treasury rules that respect your Spending Limits and
              evaluate directly against live on-chain balances.
            </p>
          </div>

          <button
            type="button"
            disabled={checkingNow}
            onClick={() => void handleRunAutoPilotCheckNow()}
            className="action-link disabled:opacity-50"
          >
            <FiPlay aria-hidden="true" />
            <span>
              {checkingNow ? 'Evaluating Live Balances…' : 'Run Auto-Pilot Check Now'}
            </span>
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Workflow 1: Auto-Sweep Idle Cash */}
          <div className="min-w-0 flex flex-col justify-between space-y-4 rounded-xl border border-border bg-secondary/50 p-5">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FiTrendingUp className="shrink-0 text-primary" aria-hidden="true" />
                  <h3 className="text-lg font-bold">Auto-Sweep Idle Cash</h3>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    aria-label="Enable Auto-Sweep Idle Cash"
                    checked={idleCashSweep.enabled}
                    onChange={(e) =>
                      updateIdleCashSweep({ enabled: e.target.checked })
                    }
                    className="h-5 w-5 rounded accent-emerald-600"
                  />
                  <span>{idleCashSweep.enabled ? 'On' : 'Off'}</span>
                </label>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Whenever my public wallet balance exceeds{' '}
                <strong className="text-foreground tabular-nums">
                  ${idleCashSweep.thresholdUsd.toLocaleString()}
                </strong>
                , automatically deposit the excess into the{' '}
                <strong className="text-foreground">
                  {idleCashSweep.targetVaultName}
                </strong>
                .
              </p>
            </div>

            <div>
              <label
                htmlFor="sweep-threshold-input"
                className="mb-1.5 block text-sm font-medium"
              >
                Public Balance Threshold ($ USD)
              </label>
              <input
                id="sweep-threshold-input"
                type="number"
                min={0}
                step={100}
                value={idleCashSweep.thresholdUsd}
                onChange={(e) =>
                  updateIdleCashSweep({
                    thresholdUsd: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="field-input font-bold tabular-nums"
              />
            </div>
          </div>

          {/* Workflow 2: Scheduled Recurring Payment */}
          <div className="min-w-0 flex flex-col justify-between space-y-4 rounded-xl border border-border bg-secondary/50 p-5">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FiSend className="shrink-0 text-primary" aria-hidden="true" />
                  <h3 className="text-lg font-bold">Scheduled Recurring Payment</h3>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    aria-label="Enable Scheduled Recurring Payment"
                    checked={recurringPayment.enabled}
                    onChange={(e) =>
                      updateRecurringPayment({ enabled: e.target.checked })
                    }
                    className="h-5 w-5 rounded accent-emerald-600"
                  />
                  <span>{recurringPayment.enabled ? 'On' : 'Off'}</span>
                </label>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Pay{' '}
                <strong className="text-foreground">
                  {recurringPayment.vendorName || 'Vendor'}
                </strong>{' '}
                <strong className="text-foreground tabular-nums">
                  ${recurringPayment.amountUsd.toLocaleString()}
                </strong>{' '}
                every <strong className="text-foreground">{recurringPayment.cadence}</strong>{' '}
                from my Private Balance.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="recurring-vendor-input"
                  className="mb-1 block text-sm font-medium"
                >
                  Vendor Name &amp; Wallet Address
                </label>
                <input
                  id="recurring-vendor-input"
                  value={recurringPayment.vendorName}
                  onChange={(e) =>
                    updateRecurringPayment({ vendorName: e.target.value })
                  }
                  placeholder="Northstar Logistics LLC"
                  className="field-input mb-2"
                />
                <input
                  aria-label="Recurring payment recipient address"
                  value={recurringPayment.recipientAddress}
                  onChange={(e) =>
                    updateRecurringPayment({ recipientAddress: e.target.value })
                  }
                  placeholder="0x…"
                  spellCheck={false}
                  className="field-input font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="recurring-amount-input"
                    className="mb-1 block text-sm font-medium"
                  >
                    Amount ($)
                  </label>
                  <input
                    id="recurring-amount-input"
                    type="number"
                    min={1}
                    step="any"
                    value={recurringPayment.amountUsd}
                    onChange={(e) =>
                      updateRecurringPayment({
                        amountUsd: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="field-input font-bold tabular-nums"
                  />
                </div>

                <div>
                  <span className="mb-1 block text-sm font-medium">Frequency</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['Week', 'Month'] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => updateRecurringPayment({ cadence: period })}
                        className={`min-h-11 rounded-xl border px-2 py-2 text-sm font-bold transition ${
                          recurringPayment.cadence === period
                            ? 'border-primary bg-primary/15 text-primary'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow 3: Target-Rate Auto-Swap */}
          <div className="min-w-0 flex flex-col justify-between space-y-4 rounded-xl border border-border bg-secondary/50 p-5">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FiRepeat className="shrink-0 text-primary" aria-hidden="true" />
                  <h3 className="text-lg font-bold">Target-Rate Auto-Swap</h3>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    aria-label="Enable Target-Rate Auto-Swap"
                    checked={targetRateSwap.enabled}
                    onChange={(e) =>
                      updateTargetRateSwap({ enabled: e.target.checked })
                    }
                    className="h-5 w-5 rounded accent-emerald-600"
                  />
                  <span>{targetRateSwap.enabled ? 'On' : 'Off'}</span>
                </label>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Swap{' '}
                <strong className="text-foreground tabular-nums">
                  {targetRateSwap.sellAmount.toLocaleString()} {targetRateSwap.sellToken}
                </strong>{' '}
                for <strong className="text-foreground">{targetRateSwap.buyToken}</strong>{' '}
                when the rate reaches{' '}
                <strong className="text-foreground tabular-nums">
                  ${targetRateSwap.targetRateUsd.toFixed(2)}
                </strong>
                .
              </p>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="swap-sell-amount"
                    className="mb-1 block text-sm font-medium"
                  >
                    Swap Amount ({targetRateSwap.sellToken})
                  </label>
                  <input
                    id="swap-sell-amount"
                    type="number"
                    min={1}
                    step="any"
                    value={targetRateSwap.sellAmount}
                    onChange={(e) =>
                      updateTargetRateSwap({
                        sellAmount: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="field-input font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label
                    htmlFor="swap-target-rate"
                    className="mb-1 block text-sm font-medium"
                  >
                    Target Rate ($)
                  </label>
                  <input
                    id="swap-target-rate"
                    type="number"
                    min={0.01}
                    step="any"
                    value={targetRateSwap.targetRateUsd}
                    onChange={(e) =>
                      updateTargetRateSwap({
                        targetRateUsd: Math.max(0.01, Number(e.target.value) || 0.01),
                      })
                    }
                    className="field-input font-bold tabular-nums"
                  />
                </div>
              </div>

              <div>
                <span className="mb-1 block text-sm font-medium">Receive Asset</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['tPOT', 'WETH'] as const).map((assetChoice) => (
                    <button
                      key={assetChoice}
                      type="button"
                      onClick={() => updateTargetRateSwap({ buyToken: assetChoice })}
                      className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                        targetRateSwap.buyToken === assetChoice
                          ? 'border-primary bg-primary/15 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {assetChoice}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Check Execution Results */}
        {checkHistory.length > 0 && (
          <div className="space-y-3 border-t border-border pt-5">
            <h3 className="text-lg font-bold">Latest Auto-Pilot Evaluation Pass</h3>
            <div className="space-y-2.5">
              {checkHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-foreground">{entry.taskName}</span>
                      <span
                        className={
                          entry.outcome === 'Executed' ||
                          entry.outcome === 'Ready for Mandate'
                            ? 'emerald-badge'
                            : 'inline-flex rounded-full border border-border bg-card px-3 py-0.5 text-sm font-semibold text-muted-foreground'
                        }
                      >
                        {entry.outcome}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{entry.summary}</p>
                  </div>
                  <span className="font-mono text-sm text-muted-foreground tabular-nums">
                    {entry.checkedAt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* On-Chain Auto-Pilot Rule Authorization & Mandate Controls */}
      <section className="space-y-5 border-t border-border pt-8">
        <div>
          <p className="eyebrow">On-Chain Rule Enforcement</p>
          <h2 className="text-2xl font-bold">
            Smart Contract Spending Rules &amp; Delegate Mandates
          </h2>
          <p className="mt-1 text-base leading-relaxed text-muted-foreground">
            Export, authorize, or revoke on-chain spending rules directly from your
            business wallet.
          </p>
        </div>

        <Tabs.Root value={advancedTab} onValueChange={setAdvancedTab}>
          <Tabs.List
            aria-label="Agent workspace"
            className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4"
          >
            {advancedTabs.map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className="workspace-tab relative"
              >
                <tab.icon size={18} aria-hidden="true" />
                {tab.label}
                {tab.value === 'controls' && createdId && (
                  <span
                    className="h-2 w-2 rounded-full bg-primary"
                    role="img"
                    aria-label="New policy created"
                  />
                )}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="builder" forceMount className="data-[state=inactive]:hidden">
            <AgentPolicyBuilder
              onCreated={(id) => {
                setCreatedId(id);
                activateAutoPilot(id);
              }}
            />
          </Tabs.Content>

          <Tabs.Content value="swaps" forceMount className="data-[state=inactive]:hidden">
            <RfqMandatePanel />
          </Tabs.Content>

          <Tabs.Content value="controls" forceMount className="data-[state=inactive]:hidden">
            <AgentPolicyManager createdId={createdId} />
          </Tabs.Content>

          <Tabs.Content value="fleet" forceMount className="data-[state=inactive]:hidden">
            <AgentFleetManager onSelectTab={setAdvancedTab} />
          </Tabs.Content>
        </Tabs.Root>
      </section>
    </div>
  );
}
