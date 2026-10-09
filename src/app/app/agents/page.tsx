'use client';

import React, { useState } from 'react';
import {
  FiCpu,
  FiShield,
  FiZap,
  FiClock,
  FiSlash,
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
} from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { useProtocolStore, AgentPolicy } from '@/lib/protocol-store';

export default function AppAgentsPage() {
  const { agentPolicies, addAgentPolicy, revokeAgentPolicy } = useProtocolStore();

  const [isDeploying, setIsDeploying] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('Arbitrage & RFQ Execution');
  const [newAgentSpendCap, setNewAgentSpendCap] = useState('5000');
  const [newAgentTtl, setNewAgentTtl] = useState('24');
  const [notification, setNotification] = useState<string | null>(null);

  const handleDeployPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName) return;

    const cap = parseFloat(newAgentSpendCap) || 1000;
    const ttl = parseInt(newAgentTtl) || 24;

    const policy = addAgentPolicy({
      name: newAgentName,
      role: newAgentRole,
      status: 'ACTIVE',
      spendCap: cap,
      ttlHours: ttl,
    });

    setNotification(`Successfully deployed agent policy "${policy.name}" with $${cap.toLocaleString()} spend cap!`);
    setIsDeploying(false);
    setNewAgentName('');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-10">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-200 dark:border-[#21293D]">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Kudex Agent Fleet & Session Policies
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 mt-1.5">
            Delegate bounded trading authority to autonomous agents. Enforce strict spending caps with zero-popup execution.
          </p>
        </div>

        <button
          onClick={() => setIsDeploying(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-md shadow-emerald-500/20"
        >
          <FiPlus className="w-5 h-5" />
          <span>Deploy New Agent Policy</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold text-sm flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Deploy Modal */}
      {isDeploying && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] p-7 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Deploy Agent Session Policy
              </h3>
              <button
                onClick={() => setIsDeploying(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeployPolicy} className="space-y-4">
              <div>
                <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                  Agent Policy Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Treasury Auto-Rebalancer"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] text-slate-900 dark:text-white font-medium text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                  Execution Role
                </label>
                <select
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] text-slate-900 dark:text-white font-medium text-sm outline-none"
                >
                  <option value="Arbitrage & RFQ Execution">Arbitrage & RFQ Execution</option>
                  <option value="Solvency Invariant Surveillance">Solvency Invariant Surveillance</option>
                  <option value="Automated Yield Compounding">Automated Yield Compounding</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                    Daily Spend Cap ($)
                  </label>
                  <input
                    type="number"
                    value={newAgentSpendCap}
                    onChange={(e) => setNewAgentSpendCap(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                    Session Duration (Hours)
                  </label>
                  <input
                    type="number"
                    value={newAgentTtl}
                    onChange={(e) => setNewAgentTtl(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeploying(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-[#161C2B] text-slate-700 dark:text-slate-300 font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm"
                >
                  Deploy Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agent Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agentPolicies.map((agent: AgentPolicy) => {
          const isRevoked = agent.status === 'REVOKED';

          return (
            <div
              key={agent.id}
              className={`p-7 rounded-2xl border transition-all ${
                isRevoked
                  ? 'border-slate-200 dark:border-[#21293D] bg-slate-100/50 dark:bg-[#0E121B]/50 opacity-60'
                  : 'border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <RiRobot2Line className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {agent.role}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isRevoked
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {agent.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 py-5 border-b border-slate-100 dark:border-[#21293D] text-sm">
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Spend Cap:</span>
                  <div className="font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                    ${agent.spendCap.toLocaleString()} pUSD
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Total Spent:</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                    ${agent.spent.toLocaleString()} pUSD
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Session Validity:</span>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {agent.ttlHours} Hours
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Actions Executed:</span>
                  <div className="font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                    {agent.executedActions} calls
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Last: {agent.lastAction}
                </div>

                {!isRevoked && (
                  <button
                    onClick={() => {
                      revokeAgentPolicy(agent.id);
                      setNotification(`Revoked permissions for ${agent.name}. Session key invalidated.`);
                      setTimeout(() => setNotification(null), 4000);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition"
                  >
                    <FiSlash className="w-3.5 h-3.5" />
                    <span>Revoke Access</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
