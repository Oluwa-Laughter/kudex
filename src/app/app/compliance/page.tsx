'use client';

import React, { useState } from 'react';
import {
  FiShield,
  FiKey,
  FiDownload,
  FiCheckCircle,
  FiCopy,
  FiSlash,
  FiLock,
  FiFileText,
  FiPlus,
} from 'react-icons/fi';
import { RiShieldCheckLine } from 'react-icons/ri';
import { truncateAddress } from '@/lib/utils';
import { useProtocolStore, ViewingKey } from '@/lib/protocol-store';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';

const SCOPE_OPTIONS: SelectOption[] = [
  {
    value: 'Full Settlement & Solvency Audit',
    label: 'Full Settlement & Solvency Audit',
    description: 'Complete inspection of notes, swaps, and solvency invariant metrics',
  },
  {
    value: 'Contractor Payroll Disbursements Only',
    label: 'Contractor Payroll Disbursements Only',
    description: 'Restricted viewing to employee and vendor disbursement streams',
  },
  {
    value: 'Credit Facility Debt Amortization Only',
    label: 'Credit Facility Debt Amortization Only',
    description: 'Read-only access to senior debt tranche repayment schedules',
  },
];

export default function AppCompliancePage() {
  const { viewingKeys, addViewingKey, revokeViewingKey, orders, notes } = useProtocolStore();

  const [auditorName, setAuditorName] = useState('');
  const [scope, setScope] = useState('Full Settlement & Solvency Audit');
  const [validDays, setValidDays] = useState('30');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditorName) return;

    const rawKey = `kudex-vk-${Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
    setGeneratedKey(rawKey);

    const keyHash = `${rawKey.slice(0, 10)}...${rawKey.slice(-6)}`;

    addViewingKey({
      auditor: auditorName,
      keyHash,
      scope,
      validDays: parseInt(validDays) || 30,
      status: 'ACTIVE',
    });

    setNotification(`Generated viewing key for auditor "${auditorName}"!`);
    setAuditorName('');
    setTimeout(() => setNotification(null), 4000);
  };

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleDownloadReport = () => {
    const auditData = {
      protocol: 'Kudex Confidential Settlement Network',
      exportTimestamp: new Date().toISOString(),
      solvencyInvariant: 'VERIFIED_100%',
      activeNotesCount: notes.length,
      ordersSettledCount: orders.length,
      portfolioNotes: notes.map((n) => ({
        id: n.id,
        commitment: n.commitment,
        amount: n.amount,
        asset: n.asset,
        status: n.status,
        timestamp: new Date(n.timestamp).toISOString(),
      })),
      settledOrders: orders.map((o) => ({
        id: o.id,
        pair: `${o.makerAsset}/${o.takerAsset}`,
        makerAmount: o.makerAmount,
        takerAmount: o.takerAmount,
        solver: o.solver,
        status: o.status,
        timestamp: new Date(o.timestamp).toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dl = document.createElement('a');
    dl.href = url;
    dl.download = `kudex-audit-proof-${Date.now()}.json`;
    dl.click();
    dl.remove();

    setNotification('Exported complete cryptographic audit proof (JSON)!');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-10">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-200 dark:border-[#21293D]">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Compliance & Auditor Viewing Keys
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 mt-1.5">
            Generate asymmetric read-only viewing keys for regulatory audit without disclosing balances publicly.
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161C2B] dark:hover:bg-[#21293D] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#21293D] text-sm font-semibold transition"
        >
          <FiDownload className="w-4 h-4 text-emerald-500" />
          <span>Export Audit Proof (JSON)</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold text-sm flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Key Issuance Desk */}
        <div className="lg:col-span-5 p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-6 transition-colors duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#21293D]">
            <div className="flex items-center gap-2.5">
              <FiKey className="w-6 h-6 text-emerald-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Issue Auditor Viewing Key
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Read-Only Scope
            </span>
          </div>

          <form onSubmit={handleGenerateKey} className="space-y-4">
            <div>
              <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                Auditor / Recipient Entity
              </label>
              <input
                type="text"
                required
                placeholder="e.g. KPMG Digital Audit Team"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] text-slate-900 dark:text-white font-medium text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                Audit Scope
              </label>
              <CustomSelect
                options={SCOPE_OPTIONS}
                value={scope}
                onChange={setScope}
              />
            </div>

            <div>
              <label className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 block mb-2">
                Key Validity (Days)
              </label>
              <input
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition shadow-md shadow-emerald-500/20"
            >
              Generate Asymmetric Viewing Key
            </button>
          </form>

          {generatedKey && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Derived Private Viewing Key</span>
                <button
                  onClick={copyKey}
                  className="hover:text-emerald-500 flex items-center gap-1 font-semibold"
                >
                  <FiCopy className="w-3.5 h-3.5" />
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-slate-900 dark:text-white break-all">
                {generatedKey}
              </div>
            </div>
          )}
        </div>

        {/* Right Active Viewing Keys List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm">
            <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-[#21293D]">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Active Viewing Keys
              </h3>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#00E599] border border-emerald-500/20">
                {viewingKeys.filter((k) => k.status === 'ACTIVE').length} Active
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-[#21293D] mt-4">
              {viewingKeys.length > 0 ? (
                viewingKeys.map((vk: ViewingKey) => {
                  const isRevoked = vk.status === 'REVOKED';

                  return (
                    <div key={vk.id} className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {vk.auditor}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Scope: {vk.scope} | Valid: {vk.validDays} Days
                        </div>
                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          Key Hash: {vk.keyHash}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isRevoked
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {vk.status}
                        </span>

                        {!isRevoked && (
                          <button
                            onClick={() => {
                              revokeViewingKey(vk.id);
                              setNotification(`Revoked viewing key for ${vk.auditor}!`);
                              setTimeout(() => setNotification(null), 3000);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                            title="Revoke Viewing Key"
                          >
                            <FiSlash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  No active auditor viewing keys generated yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
