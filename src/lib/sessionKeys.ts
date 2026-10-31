import { create } from 'zustand';
import { prepareAgentPolicy, type AgentPolicyInput } from './agent-policy';

export interface AllowedAutoPilotActions {
  allowVaultDeposits: boolean;
  allowBestPriceSwaps: boolean;
  allowInvoicePayments: boolean;
}

export interface AutoPilotState {
  spendingBudget: number;
  timeLimitHours: 2 | 24 | 168;
  allowedActions: AllowedAutoPilotActions;
  active: boolean;
  activatedAtMs: number | null;
  expiresAtMs: number | null;
  onChainPolicyId?: `0x${string}`;
  setSpendingBudget: (budget: number) => void;
  setTimeLimitHours: (hours: 2 | 24 | 168) => void;
  toggleAction: (key: keyof AllowedAutoPilotActions) => void;
  activateAutoPilot: (policyId?: `0x${string}`) => void;
  turnOffImmediately: () => void;
}

export const SPENDING_BUDGET_PRESETS = [100, 500, 2500] as const;

export const TIME_LIMIT_OPTIONS: ReadonlyArray<{
  hours: 2 | 24 | 168;
  label: string;
}> = [
  { hours: 2, label: '2 Hours' },
  { hours: 24, label: '24 Hours' },
  { hours: 168, label: '7 Days' },
];

export const useAutoPilotStore = create<AutoPilotState>((set) => ({
  spendingBudget: 500,
  timeLimitHours: 24,
  allowedActions: {
    allowVaultDeposits: true,
    allowBestPriceSwaps: true,
    allowInvoicePayments: false,
  },
  active: false,
  activatedAtMs: null,
  expiresAtMs: null,
  onChainPolicyId: undefined,
  setSpendingBudget: (budget) =>
    set({ spendingBudget: Math.max(50, Math.min(25000, Math.round(budget))) }),
  setTimeLimitHours: (hours) => set({ timeLimitHours: hours }),
  toggleAction: (key) =>
    set((state) => ({
      allowedActions: {
        ...state.allowedActions,
        [key]: !state.allowedActions[key],
      },
    })),
  activateAutoPilot: (policyId) =>
    set((state) => {
      const now = Date.now();
      return {
        active: true,
        activatedAtMs: now,
        expiresAtMs: now + state.timeLimitHours * 3_600_000,
        onChainPolicyId: policyId ?? state.onChainPolicyId,
      };
    }),
  turnOffImmediately: () =>
    set({
      active: false,
      activatedAtMs: null,
      expiresAtMs: null,
    }),
}));

export function formatTimeRemaining(expiresAtMs: number | null, nowMs = Date.now()): string {
  if (!expiresAtMs || expiresAtMs <= nowMs) return 'Expired';
  const totalMinutes = Math.max(1, Math.ceil((expiresAtMs - nowMs) / 60_000));
  if (totalMinutes < 60) return `${totalMinutes}m left`;
  const hours = Math.floor(totalMinutes / 60);
  if (hours < 48) return `${hours}h left`;
  const days = Math.ceil(hours / 24);
  return `${days}d left`;
}

export function buildAutoPilotContractDraft(params: {
  owner: string;
  delegate: string;
  vault: string;
  asset: string;
  decimals?: string;
  spendingBudget: number;
  timeLimitHours: number;
}) {
  const perAction = Math.max(1, Math.round(params.spendingBudget / 2));
  const daily = Math.max(perAction, Math.round(params.spendingBudget));
  const input: AgentPolicyInput = {
    owner: params.owner,
    delegate: params.delegate,
    vault: params.vault,
    asset: params.asset,
    decimals: params.decimals ?? '6',
    perAction: String(perAction),
    daily: String(daily),
    total: String(Math.round(params.spendingBudget)),
    hours: String(params.timeLimitHours),
  };
  return prepareAgentPolicy(input);
}
