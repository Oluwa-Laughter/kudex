'use client';

import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  FiActivity,
  FiAlertOctagon,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiRepeat,
  FiShield,
  FiSliders,
} from 'react-icons/fi';
import { AgentConsole } from './AgentConsole';
import { AgentFleetManager } from './AgentFleetManager';
import { AgentPolicyBuilder } from './AgentPolicyBuilder';
import { AgentPolicyManager } from './AgentPolicyManager';
import { NativeAccountCard } from './NativeAccountCard';
import { RfqMandatePanel } from './RfqMandatePanel';
import {
  SPENDING_BUDGET_PRESETS,
  TIME_LIMIT_OPTIONS,
  formatTimeRemaining,
  useAutoPilotStore,
} from '@/lib/sessionKeys';

const advancedTabs = [
  { value: 'builder', label: 'Vault Auto-Pilot Rules', icon: FiSliders },
  { value: 'swaps', label: 'Swap Auto-Pilot Mandates', icon: FiRepeat },
  { value: 'controls', label: 'Active Rules & Revocation', icon: FiShield },
  { value: 'fleet', label: 'Activity Log', icon: FiActivity },
];

export function AgentWorkspace() {
  const [advancedTab, setAdvancedTab] = useState('builder');
  const [createdId, setCreatedId] = useState<`0x${string}`>();
  const [ruleBanner, setRuleBanner] = useState('');

  const {
    spendingBudget,
    timeLimitHours,
    allowedActions,
    active,
    expiresAtMs,
    setSpendingBudget,
    setTimeLimitHours,
    toggleAction,
    activateAutoPilot,
    turnOffImmediately,
  } = useAutoPilotStore();

  const anyActionAllowed =
    allowedActions.allowVaultDeposits ||
    allowedActions.allowBestPriceSwaps ||
    allowedActions.allowInvoicePayments;

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
                <span className="space-y-0.5">
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
                  }). Use the on-chain authorization tab below when delegating live contract execution.`,
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
