import { create } from 'zustand';
import { prepareAgentPolicy, type AgentPolicyInput } from './agent-policy.ts';

export interface AllowedAutoPilotActions {
  allowVaultDeposits: boolean;
  allowBestPriceSwaps: boolean;
  allowInvoicePayments: boolean;
}

export interface IdleCashSweepTask {
  enabled: boolean;
  thresholdUsd: number;
  targetVaultName: string;
}

export interface RecurringPaymentTask {
  enabled: boolean;
  vendorName: string;
  recipientAddress: string;
  amountUsd: number;
  cadence: 'Week' | 'Month';
  lastExecutedAtIso: string | null;
}

export interface TargetRateSwapTask {
  enabled: boolean;
  sellAmount: number;
  sellToken: 'USDC' | 'USDT';
  buyToken: 'WETH' | 'tPOT';
  targetRateUsd: number;
}

export interface AutoPilotCheckResult {
  id: string;
  taskName: string;
  outcome: 'Executed' | 'Ready for Mandate' | 'Condition Not Met' | 'Blocked by Limits';
  summary: string;
  checkedAt: string;
  txHash?: string;
}

export interface AutoPilotState {
  spendingBudget: number;
  timeLimitHours: 2 | 24 | 168;
  allowedActions: AllowedAutoPilotActions;
  active: boolean;
  activatedAtMs: number | null;
  expiresAtMs: number | null;
  onChainPolicyId?: `0x${string}`;
  idleCashSweep: IdleCashSweepTask;
  recurringPayment: RecurringPaymentTask;
  targetRateSwap: TargetRateSwapTask;
  checkHistory: AutoPilotCheckResult[];
  hydrateTasks: () => void;
  setSpendingBudget: (budget: number) => void;
  setTimeLimitHours: (hours: 2 | 24 | 168) => void;
  toggleAction: (key: keyof AllowedAutoPilotActions) => void;
  activateAutoPilot: (policyId?: `0x${string}`) => void;
  turnOffImmediately: () => void;
  updateIdleCashSweep: (patch: Partial<IdleCashSweepTask>) => void;
  updateRecurringPayment: (patch: Partial<RecurringPaymentTask>) => void;
  updateTargetRateSwap: (patch: Partial<TargetRateSwapTask>) => void;
  recordCheckResults: (results: AutoPilotCheckResult[]) => void;
}

const TASKS_STORAGE_KEY = 'kudex-autopilot-tasks-v1';

interface PersistedTasksPayload {
  idleCashSweep: IdleCashSweepTask;
  recurringPayment: RecurringPaymentTask;
  targetRateSwap: TargetRateSwapTask;
}

function savePersistedTasks(payload: PersistedTasksPayload) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

function readPersistedTasks(): Partial<PersistedTasksPayload> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedTasksPayload>;
  } catch {
    return null;
  }
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
    allowInvoicePayments: true,
  },
  active: false,
  activatedAtMs: null,
  expiresAtMs: null,
  onChainPolicyId: undefined,
  idleCashSweep: {
    enabled: true,
    thresholdUsd: 5000,
    targetVaultName: 'Short-Term Treasury Vault',
  },
  recurringPayment: {
    enabled: false,
    vendorName: 'Northstar Logistics LLC',
    recipientAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    amountUsd: 450,
    cadence: 'Month',
    lastExecutedAtIso: null,
  },
  targetRateSwap: {
    enabled: false,
    sellAmount: 250,
    sellToken: 'USDC',
    buyToken: 'tPOT',
    targetRateUsd: 0.45,
  },
  checkHistory: [],
  hydrateTasks: () => {
    const saved = readPersistedTasks();
    if (!saved) return;
    set((state) => ({
      idleCashSweep: saved.idleCashSweep ?? state.idleCashSweep,
      recurringPayment: saved.recurringPayment ?? state.recurringPayment,
      targetRateSwap: saved.targetRateSwap ?? state.targetRateSwap,
    }));
  },
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
    set((state) => {
      const disabledTasks: PersistedTasksPayload = {
        idleCashSweep: { ...state.idleCashSweep, enabled: false },
        recurringPayment: { ...state.recurringPayment, enabled: false },
        targetRateSwap: { ...state.targetRateSwap, enabled: false },
      };
      savePersistedTasks(disabledTasks);
      return {
        active: false,
        activatedAtMs: null,
        expiresAtMs: null,
        ...disabledTasks,
      };
    }),
  updateIdleCashSweep: (patch) =>
    set((state) => {
      const next = { ...state.idleCashSweep, ...patch };
      savePersistedTasks({
        idleCashSweep: next,
        recurringPayment: state.recurringPayment,
        targetRateSwap: state.targetRateSwap,
      });
      return { idleCashSweep: next };
    }),
  updateRecurringPayment: (patch) =>
    set((state) => {
      const next = { ...state.recurringPayment, ...patch };
      savePersistedTasks({
        idleCashSweep: state.idleCashSweep,
        recurringPayment: next,
        targetRateSwap: state.targetRateSwap,
      });
      return { recurringPayment: next };
    }),
  updateTargetRateSwap: (patch) =>
    set((state) => {
      const next = { ...state.targetRateSwap, ...patch };
      savePersistedTasks({
        idleCashSweep: state.idleCashSweep,
        recurringPayment: state.recurringPayment,
        targetRateSwap: next,
      });
      return { targetRateSwap: next };
    }),
  recordCheckResults: (results) =>
    set((state) => ({
      checkHistory: [...results, ...state.checkHistory].slice(0, 12),
    })),
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
