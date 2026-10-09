'use client';

import React, { useState } from 'react';
import {
  FiCpu,
  FiZap,
  FiShield,
  FiLock,
  FiCheckCircle,
  FiClock,
  FiAlertOctagon,
  FiPlus,
  FiActivity,
  FiTrendingUp,
} from 'react-icons/fi';
import { RiRobot2Line, RiShieldCheckLine } from 'react-icons/ri';
import { truncateAddress } from '@/lib/utils';

export default function AppAgentsPage() {
  const [agents, setAgents] = useState([
    {
      id: 'agent-sentinel',
      name: 'Kudex Sentinel',
      role: 'Solvency & Invariant Surveillance',
      status: 'ACTIVE',
      spendCap: '$10,000.00 pUSD',
      spent: '$2,450.00 pUSD',
      ttlRemaining: '18h 42m',
      executedActions: 142,
      lastAction: 'Pre-flight invariant check passed',
    },
    {
      id: 'agent-solver',
      name: 'Solver Arbitrageur',
      role: 'Cross-Chain RFQ Negotiation',
      status: 'ACTIVE',
      spendCap: '$25,000.00 pUSD',
      spent: '$14,800.00 pUSD',
      ttlRemaining: '6h 15m',
      executedActions: 388,
      lastAction: 'Settled atomic RFQ swap for 500 pUSD',
    },
    {
      id: 'agent-daas',
      name: 'Solvency Monitor',
      role: 'Solvency Risk Scoring & Debt Protection',
      status: 'STANDBY',
      spendCap: '$5,000.00 pUSD',
      spent: '$0.00 pUSD',
      ttlRemaining: '48h 00m',
      executedActions: 24,
      lastAction: 'Verified health factor at 1.42x',
    },
  ]);

  const [revokedId, setRevokedId] = useState<string | null>(null);

  const handleRevoke = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'REVOKED' } : a))
    );
    setRevokedId(id);
    setTimeout(() => setRevokedId(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#21293D]">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
            Kudex Agent Fleet & Session Policies
          </h2>
          <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1">
            Delegate bounded trading authority to autonomous agents. Enforce strict spending caps with zero-popup execution.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-xs transition shadow-md shadow-[#00E599]/15">
          <FiPlus className="w-4 h-4" />
          <span>Deploy New Session Policy</span>
        </button>
      </div>

      {revokedId && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs font-mono text-rose-600 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiAlertOctagon className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <span>Session policy revoked! Agent authority frozen on-chain.</span>
          </div>
          <span className="font-bold">REVOKED</span>
        </div>
      )}

      {/* Active Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`p-6 rounded-2xl border transition flex flex-col justify-between space-y-6 ${
              agent.status === 'ACTIVE'
                ? 'border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] hover:border-[#00E599]/50 shadow-sm'
                : 'border-rose-200 dark:border-rose-900/40 bg-white/60 dark:bg-[#0E121B]/60 opacity-80'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#21293D]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#161C2B] text-[#00E599] border border-slate-200 dark:border-[#21293D]">
                    <RiRobot2Line className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-neutral-100">
                      {agent.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400">{agent.role}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    agent.status === 'ACTIVE'
                      ? 'bg-[#00E599]/10 text-[#00E599]'
                      : agent.status === 'STANDBY'
                      ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400'
                      : 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                  }`}
                >
                  {agent.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D]">
                  <span className="text-slate-500 dark:text-neutral-400 block text-[10px] uppercase">Spend Ceiling</span>
                  <span className="font-bold text-slate-900 dark:text-neutral-100 mt-0.5 block">{agent.spendCap}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D]">
                  <span className="text-slate-500 dark:text-neutral-400 block text-[10px] uppercase">Utilized</span>
                  <span className="font-bold text-[#00E599] mt-0.5 block">{agent.spent}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D]">
                  <span className="text-slate-500 dark:text-neutral-400 block text-[10px] uppercase">TTL Remaining</span>
                  <span className="font-bold text-slate-900 dark:text-neutral-100 mt-0.5 block">{agent.ttlRemaining}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D]">
                  <span className="text-slate-500 dark:text-neutral-400 block text-[10px] uppercase">Actions</span>
                  <span className="font-bold text-slate-900 dark:text-neutral-100 mt-0.5 block">{agent.executedActions}</span>
                </div>
              </div>

              <div className="pt-4 text-xs font-mono text-slate-500 dark:text-neutral-400">
                <span className="text-slate-400 dark:text-neutral-500 block text-[10px] uppercase">Latest Execution:</span>
                <span className="text-slate-700 dark:text-neutral-300 mt-0.5 block font-sans text-xs">
                  {agent.lastAction}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#21293D] flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 dark:text-neutral-500">
                Session Policy Bound
              </span>
              {agent.status !== 'REVOKED' ? (
                <button
                  onClick={() => handleRevoke(agent.id)}
                  className="px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-mono transition"
                >
                  Revoke Policy
                </button>
              ) : (
                <span className="text-xs font-mono text-rose-500">Decommissioned</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Session Security Architecture */}
      <div className="p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4 transition-colors duration-200">
        <div className="flex items-center gap-2 text-sm font-bold font-mono text-slate-900 dark:text-neutral-100">
          <RiShieldCheckLine className="w-5 h-5 text-[#00E599]" />
          <span>Zero-Popup Session Architecture</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed max-w-4xl">
          Kudex session policies grant bounded operational keys restricted by exact spending limits,
          validity expirations, and contract target whitelists. The agent can never exceed authorized funds,
          divert capital to non-whitelisted contracts, or continue executing after session expiration.
        </p>
      </div>
    </div>
  );
}
