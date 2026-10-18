'use client';

import React, { useState } from 'react';
import {
  FiCpu,
  FiPlay,
  FiPause,
  FiZap,
  FiPlus,
  FiShield,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi';
import { useProtocolStore, AgentBot } from '@/lib/protocol-store';
import { CustomSelect } from '@/components/ui/CustomSelect';

export function AgentFleetManager() {
  const {
    agentBots,
    toggleAgentBot,
    triggerAgentBotRun,
    balances,
    executeSwap,
    depositToVault,
  } = useProtocolStore();

  const [isDeploying, setIsDeploying] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotStrategy, setNewBotStrategy] = useState<'DCA' | 'ARBITRAGE' | 'SOLVENCY_REBALANCE' | 'PAYROLL'>('DCA');
  const [newBotBudget, setNewBotBudget] = useState('');
  const [newBotInterval, setNewBotInterval] = useState('Every 4 hours');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTriggerRun = (bot: AgentBot) => {
    if (bot.strategy === 'DCA') {
      const balance = balances['pUSD'] || 0;
      if (balance <= 0) {
        showNotification(`Agent execution paused: Insufficient pUSD balance (Current: ${balance}). Fund wallet to run DCA.`);
        return;
      }
      const tradeAmount = Math.min(balance, bot.dailyBudget || 10);
      const estReceived = tradeAmount * 0.024;
      executeSwap('pUSD', 'POT', tradeAmount, estReceived);
      triggerAgentBotRun(bot.id);
      showNotification(`Executed scheduled DCA order: ${tradeAmount} pUSD → ${estReceived.toFixed(4)} POT.`);
    } else if (bot.strategy === 'SOLVENCY_REBALANCE') {
      const balance = balances['pUSD'] || 0;
      if (balance <= 0) {
        showNotification(`Solvency Sentinel paused: Insufficient pUSD balance to rebalance.`);
        return;
      }
      const rebalanceAmount = Math.min(balance, 50);
      depositToVault('senior', rebalanceAmount);
      triggerAgentBotRun(bot.id);
      showNotification(`Solvency Sentinel rebalanced: ${rebalanceAmount} pUSD deployed to senior AAA tranche.`);
    } else {
      triggerAgentBotRun(bot.id);
      showNotification(`${bot.name} routine executed successfully.`);
    }
  };

  const handleDeployNewBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) {
      showNotification('Please specify an agent name.');
      return;
    }
    const budget = parseFloat(newBotBudget);
    if (!budget || budget <= 0) {
      showNotification('Please enter a valid daily budget in pUSD.');
      return;
    }

    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setShowDeployModal(false);

      const newBot: AgentBot = {
        id: `bot-${Date.now().toString().slice(-4)}`,
        name: newBotName,
        role: strategyDescriptions[newBotStrategy],
        strategy: newBotStrategy,
        status: 'RUNNING',
        dailyBudget: budget,
        spentToday: 0,
        lastRunTimestamp: Date.now(),
        totalProfitOrVolume: 0,
        interval: newBotInterval,
      };

      useProtocolStore.setState((state) => ({
        agentBots: [newBot, ...state.agentBots],
      }));

      setNewBotName('');
      setNewBotBudget('');
      showNotification(`New agent "${newBotName}" deployed to Portaldot 3.0 execution network!`);
      setNewBotName('');
    }, 800);
  };

  const strategyDescriptions: Record<string, string> = {
    DCA: 'Automated Dollar-Cost Averaging into POT/pUSD under bounded daily caps.',
    ARBITRAGE: 'Sub-second cross-shard price disparity capture between Substrate L0 and Revive EVM.',
    SOLVENCY_REBALANCE: 'Dynamic rebalancing of senior/mezzanine tranches to maintain solvency health factor Hf > 1.30.',
    PAYROLL: 'Confidential scheduled payroll streaming with zero balance leakage via ZK notes.',
  };

  return (
    <div className="space-y-8">
      {/* Fleet Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-[#00E599]">
              Autonomous Fleet Active
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Programmatic Agents & Solvers
          </h2>
          <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1 max-w-2xl">
            AI agents run 24/7 on Portaldot 3.0 to automate trading, capture cross-shard arbitrage, and protect vault solvency under strict session permissions.
          </p>
        </div>

        <button
          onClick={() => setShowDeployModal(true)}
          className="px-5 py-3 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition shadow-md shadow-[#00E599]/20 flex items-center gap-2 shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          <span>Deploy New Agent</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-[#00E599] font-semibold text-sm flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Deploy Agent Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg p-7 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#21293D]">
              <div className="flex items-center gap-2">
                <FiCpu className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Deploy Autonomous Bot
                </h3>
              </div>
              <button
                onClick={() => setShowDeployModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeployNewBot} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                  Agent Designation / Name
                </label>
                <input
                  type="text"
                  required
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  placeholder="e.g. Volatility Arbitrageur V2"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] text-sm text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                  Execution Strategy
                </label>
                <CustomSelect
                  options={[
                    { value: 'DCA', label: 'DCA Accumulator (Dollar Cost Average)' },
                    { value: 'ARBITRAGE', label: 'Cross-Shard Revive Arbitrage' },
                    { value: 'SOLVENCY_REBALANCE', label: 'Waterfall Solvency Sentinel' },
                    { value: 'PAYROLL', label: 'Confidential Payroll Streamer' },
                  ]}
                  value={newBotStrategy}
                  onChange={(val: any) => setNewBotStrategy(val)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                    Daily Cap (pUSD)
                  </label>
                  <input
                    type="number"
                    value={newBotBudget}
                    onChange={(e) => setNewBotBudget(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] text-sm text-slate-900 dark:text-white outline-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-neutral-400">
                    Execution Interval
                  </label>
                  <CustomSelect
                    options={[
                      { value: 'Block-atomic', label: 'Block-atomic (Every block)' },
                      { value: 'Every 1 hour', label: 'Every 1 hour' },
                      { value: 'Every 6 hours', label: 'Every 6 hours' },
                      { value: 'Daily', label: 'Daily (24h)' },
                    ]}
                    value={newBotInterval}
                    onChange={(val) => setNewBotInterval(val)}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-xs text-slate-500 dark:text-neutral-400">
                A bounded PolicyRegistry key will be issued with a strict maximum of ${newBotBudget || '0'} pUSD/day. The agent cannot withdraw principal.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeployModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#21293D] text-xs font-bold text-slate-600 dark:text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeploying || !newBotName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-xs flex items-center gap-2"
                >
                  {isDeploying ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      <span>Deploying Key...</span>
                    </>
                  ) : (
                    <span>Deploy Agent</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid of Active Agent Bots */}
      {agentBots.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-[#21293D] bg-white dark:bg-[#0E121B] space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] flex items-center justify-center">
            <FiCpu className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Autonomous Bots Deployed Yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
              Your autonomous execution fleet is ready. Deploy your first agent bot to automate DCA schedules, capture arbitrage, or manage vault solvency under cryptographic session keys.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeployModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition"
          >
            Deploy First Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agentBots.map((bot) => (
            <div
              key={bot.id}
              className="p-6 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-md space-y-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#21293D]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00E599]">
                      <FiCpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {bot.name}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                        ID: {bot.id} • {bot.interval}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                      bot.status === 'RUNNING'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-[#00E599] border border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-[#161C2B] text-slate-600 dark:text-neutral-400'
                    }`}
                  >
                    {bot.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-neutral-400 mt-3 leading-relaxed">
                  {strategyDescriptions[bot.strategy] || bot.role}
                </p>

                {/* Progress & Metrics */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#1c2438] grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-100 dark:border-[#21293D]">
                    <span className="text-slate-500 dark:text-neutral-400 block text-[11px]">Daily Budget</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      ${bot.spentToday} / ${bot.dailyBudget}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-100 dark:border-[#21293D]">
                    <span className="text-slate-500 dark:text-neutral-400 block text-[11px]">Cumulative Volume / Yield</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-[#00E599] text-sm">
                      ${bot.totalProfitOrVolume.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Budget Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="w-full bg-slate-100 dark:bg-[#161C2B] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#00E599] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (bot.spentToday / bot.dailyBudget) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>Last run: {new Date(bot.lastRunTimestamp).toLocaleTimeString()}</span>
                    <span>{((bot.spentToday / bot.dailyBudget) * 100).toFixed(0)}% used</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-[#1c2438]">
                <button
                  type="button"
                  onClick={() => toggleAgentBot(bot.id)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-[#21293D] hover:bg-slate-100 dark:hover:bg-[#161C2B] font-bold text-xs text-slate-700 dark:text-neutral-300 transition flex items-center justify-center gap-1.5"
                >
                  {bot.status === 'RUNNING' ? (
                    <>
                      <FiPause className="w-3.5 h-3.5" />
                      <span>Pause Bot</span>
                    </>
                  ) : (
                    <>
                      <FiPlay className="w-3.5 h-3.5" />
                      <span>Resume Bot</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleTriggerRun(bot)}
                  disabled={bot.status !== 'RUNNING'}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-[#00E599] border border-emerald-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <FiZap className="w-3.5 h-3.5" />
                  <span>Trigger Run Now</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
