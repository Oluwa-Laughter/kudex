'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProtocolOrder {
  id: string;
  makerAsset: string;
  takerAsset: string;
  makerAmount: string;
  takerAmount: string;
  status: 'PENDING' | 'MATCHING_SOLVER' | 'FILLED' | 'CANCELLED';
  timestamp: number;
  solver: string;
  txHash?: string;
  type: 'FOK' | 'IOC' | 'LIMIT';
}

export interface ShieldedNote {
  id: string;
  commitment: string;
  nullifier: string;
  amount: string;
  asset: string;
  timestamp: number;
  status: 'SHIELDED' | 'UNSHIELDED';
  recipient?: string;
  txHash?: string;
}

export interface VaultPosition {
  trancheId: 'senior' | 'mezzanine' | 'junior';
  depositedAmount: number;
  shares: number;
  accruedYield: number;
  lastDepositTimestamp: number;
}

export interface BridgeTransfer {
  id: string;
  originChain: string;
  targetChain: string;
  asset: string;
  amount: string;
  status: 'INITIATED' | 'RELAYING' | 'SETTLED';
  timestamp: number;
  txHash: string;
  mode: 'Direct Deposit' | 'Shielded Note';
}

export interface AgentPolicy {
  id: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'STANDBY' | 'REVOKED';
  spendCap: number;
  spent: number;
  ttlHours: number;
  createdTimestamp: number;
  executedActions: number;
  lastAction: string;
}

export interface ViewingKey {
  id: string;
  auditor: string;
  keyHash: string;
  scope: string;
  issuedAt: number;
  validDays: number;
  status: 'ACTIVE' | 'REVOKED';
}

interface ProtocolState {
  // Orders
  orders: ProtocolOrder[];
  addOrder: (order: Omit<ProtocolOrder, 'id' | 'timestamp'>) => ProtocolOrder;
  updateOrderStatus: (id: string, status: ProtocolOrder['status'], txHash?: string) => void;

  // Shielded Notes
  notes: ShieldedNote[];
  addNote: (note: Omit<ShieldedNote, 'id' | 'timestamp'>) => ShieldedNote;
  unshieldNote: (id: string) => void;

  // Vault Positions
  positions: {
    senior: VaultPosition;
    mezzanine: VaultPosition;
    junior: VaultPosition;
  };
  depositToVault: (trancheId: 'senior' | 'mezzanine' | 'junior', amount: number) => void;
  withdrawFromVault: (trancheId: 'senior' | 'mezzanine' | 'junior', amount: number) => void;

  // Bridge Transfers
  bridgeTransfers: BridgeTransfer[];
  addBridgeTransfer: (transfer: Omit<BridgeTransfer, 'id' | 'timestamp'>) => BridgeTransfer;

  // Agent Policies
  agentPolicies: AgentPolicy[];
  addAgentPolicy: (policy: Omit<AgentPolicy, 'id' | 'createdTimestamp' | 'spent' | 'executedActions' | 'lastAction'>) => AgentPolicy;
  revokeAgentPolicy: (id: string) => void;

  // Compliance Viewing Keys
  viewingKeys: ViewingKey[];
  addViewingKey: (key: Omit<ViewingKey, 'id' | 'issuedAt'>) => ViewingKey;
  revokeViewingKey: (id: string) => void;

  // Solvency Telemetry
  riskScoreBps: number;
  setRiskScoreBps: (score: number) => void;
}

export const useProtocolStore = create<ProtocolState>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (newOrder) => {
        const order: ProtocolOrder = {
          ...newOrder,
          id: `ord-${Date.now().toString().slice(-4)}`,
          timestamp: Date.now(),
        };
        set((state) => ({ orders: [order, ...state.orders] }));
        return order;
      },
      updateOrderStatus: (id, status, txHash) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id ? { ...o, status, ...(txHash ? { txHash } : {}) } : o
          ),
        }));
      },

      notes: [],
      addNote: (newNote) => {
        const note: ShieldedNote = {
          ...newNote,
          id: `note-${Date.now().toString().slice(-4)}`,
          timestamp: Date.now(),
        };
        set((state) => ({ notes: [note, ...state.notes] }));
        return note;
      },
      unshieldNote: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, status: 'UNSHIELDED' as const } : n
          ),
        }));
      },

      positions: {
        senior: {
          trancheId: 'senior',
          depositedAmount: 0,
          shares: 0,
          accruedYield: 0,
          lastDepositTimestamp: 0,
        },
        mezzanine: {
          trancheId: 'mezzanine',
          depositedAmount: 0,
          shares: 0,
          accruedYield: 0,
          lastDepositTimestamp: 0,
        },
        junior: {
          trancheId: 'junior',
          depositedAmount: 0,
          shares: 0,
          accruedYield: 0,
          lastDepositTimestamp: 0,
        },
      },
      depositToVault: (trancheId, amount) => {
        set((state) => {
          const current = state.positions[trancheId];
          return {
            positions: {
              ...state.positions,
              [trancheId]: {
                ...current,
                depositedAmount: current.depositedAmount + amount,
                shares: current.shares + amount,
                lastDepositTimestamp: Date.now(),
              },
            },
          };
        });
      },
      withdrawFromVault: (trancheId, amount) => {
        set((state) => {
          const current = state.positions[trancheId];
          const newAmount = Math.max(0, current.depositedAmount - amount);
          return {
            positions: {
              ...state.positions,
              [trancheId]: {
                ...current,
                depositedAmount: newAmount,
                shares: Math.max(0, current.shares - amount),
              },
            },
          };
        });
      },

      bridgeTransfers: [],
      addBridgeTransfer: (transfer) => {
        const item: BridgeTransfer = {
          ...transfer,
          id: `brg-${Date.now().toString().slice(-4)}`,
          timestamp: Date.now(),
        };
        set((state) => ({ bridgeTransfers: [item, ...state.bridgeTransfers] }));
        return item;
      },

      agentPolicies: [],
      addAgentPolicy: (newPolicy) => {
        const item: AgentPolicy = {
          ...newPolicy,
          id: `agent-${Date.now().toString().slice(-4)}`,
          createdTimestamp: Date.now(),
          spent: 0,
          executedActions: 0,
          lastAction: 'Policy initialized',
        };
        set((state) => ({ agentPolicies: [item, ...state.agentPolicies] }));
        return item;
      },
      revokeAgentPolicy: (id) => {
        set((state) => ({
          agentPolicies: state.agentPolicies.map((p) =>
            p.id === id ? { ...p, status: 'REVOKED' as const } : p
          ),
        }));
      },

      viewingKeys: [],
      addViewingKey: (newKey) => {
        const item: ViewingKey = {
          ...newKey,
          id: `vk-${Date.now().toString().slice(-4)}`,
          issuedAt: Date.now(),
        };
        set((state) => ({ viewingKeys: [item, ...state.viewingKeys] }));
        return item;
      },
      revokeViewingKey: (id) => {
        set((state) => ({
          viewingKeys: state.viewingKeys.map((k) =>
            k.id === id ? { ...k, status: 'REVOKED' as const } : k
          ),
        }));
      },

      riskScoreBps: 1200,
      setRiskScoreBps: (score) => set({ riskScoreBps: score }),
    }),
    {
      name: 'kudex-protocol-v3',
    }
  )
);
