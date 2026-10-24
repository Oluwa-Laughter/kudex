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

export interface RampTransaction {
  id: string;
  type: 'ON_RAMP' | 'OFF_RAMP';
  fiatCurrency: string;
  fiatAmount: number;
  cryptoAsset: string;
  cryptoAmount: number;
  paymentMethod: string;
  destinationAddress: string;
  status: 'COMPLETED' | 'PROCESSING' | 'PENDING';
  timestamp: number;
  txHash: string;
  complianceReceipt?: string;
}

export interface AgentBot {
  id: string;
  name: string;
  role: string;
  strategy: 'DCA' | 'ARBITRAGE' | 'SOLVENCY_REBALANCE' | 'PAYROLL';
  status: 'RUNNING' | 'PAUSED';
  dailyBudget: number;
  spentToday: number;
  lastRunTimestamp: number;
  totalProfitOrVolume: number;
  interval: string;
}

export interface LiquidityPoolPosition {
  id: string;
  poolId: string;
  token0: string;
  token1: string;
  amount0: number;
  amount1: number;
  lpTokens: number;
  sharePercent: number;
  timestamp: number;
  accruedFeesUSD: number;
}

interface ProtocolState {
  // Balances
  balances: Record<string, number>;
  updateBalance: (asset: string, delta: number) => void;
  executeSwap: (fromAsset: string, toAsset: string, fromAmount: number, toAmount: number) => ProtocolOrder;

  // Orders
  orders: ProtocolOrder[];
  addOrder: (order: Omit<ProtocolOrder, 'id' | 'timestamp'>) => ProtocolOrder;
  updateOrderStatus: (id: string, status: ProtocolOrder['status'], txHash?: string) => void;

  // Ramps
  rampTransactions: RampTransaction[];
  addRampTransaction: (tx: Omit<RampTransaction, 'id' | 'timestamp'>) => RampTransaction;

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

  // Agent Fleet
  agentBots: AgentBot[];
  toggleAgentBot: (id: string) => void;
  triggerAgentBotRun: (id: string) => void;

  // Agent Policies
  agentPolicies: AgentPolicy[];
  addAgentPolicy: (policy: Omit<AgentPolicy, 'id' | 'createdTimestamp' | 'spent' | 'executedActions' | 'lastAction'>) => AgentPolicy;
  revokeAgentPolicy: (id: string) => void;

  // Compliance Viewing Keys
  viewingKeys: ViewingKey[];
  addViewingKey: (key: Omit<ViewingKey, 'id' | 'issuedAt'>) => ViewingKey;
  revokeViewingKey: (id: string) => void;

  // Liquidity Pools
  liquidityPositions: LiquidityPoolPosition[];
  addLiquidity: (poolId: string, token0: string, token1: string, amount0: number, amount1: number) => LiquidityPoolPosition;
  removeLiquidity: (positionId: string) => void;

  // Solvency Telemetry
  riskScoreBps: number;
  setRiskScoreBps: (score: number) => void;
}

export const useProtocolStore = create<ProtocolState>()(
  persist(
    (set, get) => ({
      // Portfolio Balances (Real-time initial zero state)
      balances: {
        pUSD: 0,
        POT: 0,
        wPOT: 0,
        USDT: 0,
        ETH: 0,
      },
      updateBalance: (asset, delta) => {
        set((state) => {
          const current = state.balances[asset] ?? 0;
          return {
            balances: {
              ...state.balances,
              [asset]: Math.max(0, parseFloat((current + delta).toFixed(4))),
            },
          };
        });
      },
      executeSwap: (fromAsset, toAsset, fromAmount, toAmount) => {
        get().updateBalance(fromAsset, -fromAmount);
        get().updateBalance(toAsset, toAmount);
        const order = get().addOrder({
          makerAsset: fromAsset,
          takerAsset: toAsset,
          makerAmount: fromAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          takerAmount: toAmount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          status: 'FILLED',
          solver: '0x71Ae48...390b (Kudex Instant Solver)',
          txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
          type: 'FOK',
        });
        return order;
      },

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

      // Ramps
      rampTransactions: [],
      addRampTransaction: (newTx) => {
        const item: RampTransaction = {
          ...newTx,
          id: `rmp-${Date.now().toString().slice(-4)}`,
          timestamp: Date.now(),
        };
        if (newTx.type === 'ON_RAMP') {
          get().updateBalance(newTx.cryptoAsset, newTx.cryptoAmount);
        } else {
          get().updateBalance(newTx.cryptoAsset, -newTx.cryptoAmount);
        }
        set((state) => ({ rampTransactions: [item, ...state.rampTransactions] }));
        return item;
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

      // Agent Fleet (Initial zero state - user deploys their own agents)
      agentBots: [],
      toggleAgentBot: (id) => {
        set((state) => ({
          agentBots: state.agentBots.map((b) =>
            b.id === id
              ? { ...b, status: b.status === 'RUNNING' ? ('PAUSED' as const) : ('RUNNING' as const) }
              : b
          ),
        }));
      },
      triggerAgentBotRun: (id) => {
        set((state) => ({
          agentBots: state.agentBots.map((b) => {
            if (b.id !== id) return b;
            const executedAmt = Math.min(50, Math.max(10, b.dailyBudget - b.spentToday));
            return {
              ...b,
              spentToday: b.spentToday + executedAmt,
              totalProfitOrVolume: b.totalProfitOrVolume + executedAmt,
              lastRunTimestamp: Date.now(),
            };
          }),
        }));
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

      // Liquidity Pools
      liquidityPositions: [],
      addLiquidity: (poolId, token0, token1, amount0, amount1) => {
        get().updateBalance(token0, -amount0);
        get().updateBalance(token1, -amount1);
        const lpTokens = parseFloat(Math.sqrt(amount0 * amount1).toFixed(4));
        const position: LiquidityPoolPosition = {
          id: `lp-${Date.now().toString().slice(-4)}`,
          poolId,
          token0,
          token1,
          amount0,
          amount1,
          lpTokens,
          sharePercent: 0.15,
          timestamp: Date.now(),
          accruedFeesUSD: 0,
        };
        set((state) => ({ liquidityPositions: [position, ...state.liquidityPositions] }));
        return position;
      },
      removeLiquidity: (positionId) => {
        const pos = get().liquidityPositions.find((p) => p.id === positionId);
        if (pos) {
          get().updateBalance(pos.token0, pos.amount0);
          get().updateBalance(pos.token1, pos.amount1);
          set((state) => ({
            liquidityPositions: state.liquidityPositions.filter((p) => p.id !== positionId),
          }));
        }
      },

      riskScoreBps: 0,
      setRiskScoreBps: (score: number) => set({ riskScoreBps: score }),
    }),
    {
      name: 'kudex-protocol-v5',
    }
  )
);
