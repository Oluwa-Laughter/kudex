'use client';

import React, { useState } from 'react';
import {
  FiShield,
  FiKey,
  FiDownload,
  FiCopy,
  FiCheck,
  FiLock,
  FiCalendar,
  FiCheckCircle,
  FiTrash2,
  FiFileText,
} from 'react-icons/fi';
import { RiShieldCheckLine } from 'react-icons/ri';
import { truncateAddress } from '@/lib/utils';

export default function AppCompliancePage() {
  const [auditorName, setAuditorName] = useState('PwC Compliance Audit Desk');
  const [validDays, setValidDays] = useState(30);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [activeKeys, setActiveKeys] = useState([
    {
      id: 'vk-01',
      auditor: 'Deloitte Global Tax Audit',
      keyHash: '0x9fa8...21c4',
      scope: 'Full 2025 Ledger Decryption',
      issuedAt: 'Oct 01, 2026',
      expiresIn: '22 Days',
      status: 'ACTIVE',
    },
    {
      id: 'vk-02',
      auditor: 'Internal Financial Controller',
      keyHash: '0x33b1...78ae',
      scope: 'Contractor Payroll Only',
      issuedAt: 'Sep 15, 2026',
      expiresIn: '6 Days',
      status: 'ACTIVE',
    },
  ]);

  const handleGenerateKey = () => {
    const rawKey = `kudex-vk-${Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
    setGeneratedKey(rawKey);

    setActiveKeys((prev) => [
      {
        id: `vk-${Date.now().toString().slice(-4)}`,
        auditor: auditorName,
        keyHash: `${rawKey.slice(0, 10)}...${rawKey.slice(-6)}`,
        scope: 'Quarterly Settlement Audit',
        issuedAt: 'Just Now',
        expiresIn: `${validDays} Days`,
        status: 'ACTIVE',
      },
      ...prev,
    ]);
  };

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleRevokeKey = (id: string) => {
    setActiveKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const handleDownloadReport = () => {
    const auditData = {
      protocol: 'Kudex Confidential Settlement Network',
      exportTimestamp: new Date().toISOString(),
      solvencyInvariant: 'VERIFIED_100%',
      transactions: [
        { tx: '0x88f...12a', type: 'SHIELD_DEPOSIT', amount: '5,000.00 pUSD', timestamp: '2026-10-08T14:22:00Z', verified: true },
        { tx: '0x32c...90b', type: 'RFQ_SWAP_FILL', amount: '2,500.00 pUSD', timestamp: '2026-10-08T18:40:00Z', verified: true },
        { tx: '0x14d...55e', type: 'SHIELD_PAYROLL', amount: '12,000.00 pUSD', timestamp: '2026-10-09T08:10:00Z', verified: true },
      ],
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditData, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `kudex-audit-report-${Date.now()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#21293D]">
        <div>
          <h2 className="text-2xl font-bold font-mono tracking-tight text-neutral-100">
            Compliance & Auditor Viewing Keys
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Generate asymmetric read-only viewing keys for regulatory audit without disclosing balances publicly.
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161C2B] hover:bg-[#21293D] text-neutral-200 border border-[#21293D] text-xs font-semibold font-mono transition"
        >
          <FiDownload className="w-4 h-4 text-[#00E599]" />
          <span>Export Audit Proof (JSON)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Key Generator Form */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] shadow-xl space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#21293D]">
            <FiKey className="w-5 h-5 text-[#00E599]" />
            <h3 className="text-base font-bold font-mono text-neutral-100">
              Generate Auditor Viewing Key
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                Auditor Entity or Authority Name
              </label>
              <input
                type="text"
                value={auditorName}
                onChange={(e) => setAuditorName(e.target.value)}
                placeholder="e.g. PwC, Ernst & Young, Tax Counsel"
                className="w-full p-3 rounded-xl bg-[#161C2B] border border-[#21293D] text-xs font-mono text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#00E599]/40"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-neutral-400 mb-2">
                <span>Key Expiration Period:</span>
                <span className="text-[#00E599] font-bold">{validDays} Days</span>
              </div>
              <input
                type="range"
                min="7"
                max="90"
                step="7"
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
                className="w-full accent-[#00E599] bg-[#161C2B] rounded-lg cursor-pointer"
              />
            </div>

            <button
              onClick={handleGenerateKey}
              className="w-full py-3.5 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition shadow-lg shadow-[#00E599]/15 flex items-center justify-center gap-2"
            >
              <FiKey className="w-4 h-4" />
              <span>Create Asymmetric Viewing Key</span>
            </button>
          </div>

          {generatedKey && (
            <div className="p-4 rounded-xl bg-[#161C2B] border border-[#00E599]/40 space-y-2">
              <span className="text-xs font-mono text-[#00E599] uppercase font-bold block">
                Issued Viewing Key:
              </span>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#06080D] font-mono text-[11px] text-neutral-200 break-all">
                <span>{generatedKey}</span>
                <button
                  onClick={copyKey}
                  className="ml-2 p-1 text-neutral-400 hover:text-white"
                >
                  {copiedKey ? <FiCheck className="w-4 h-4 text-[#00E599]" /> : <FiCopy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-neutral-400">
                Provide this key to your certified auditor. It confers read-only decryption rights.
              </p>
            </div>
          )}
        </div>

        {/* Active Viewing Keys Table */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-[#21293D] bg-[#0E121B] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#21293D]">
              <div className="flex items-center gap-2">
                <RiShieldCheckLine className="w-4 h-4 text-[#00E599]" />
                <h3 className="text-base font-bold font-mono text-neutral-100">
                  Active Auditor Key Disclosures
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                Cryptographic Access Log
              </span>
            </div>

            <div className="divide-y divide-[#21293D] mt-2">
              {activeKeys.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between text-xs font-mono">
                  <div>
                    <div className="font-bold text-neutral-200">{item.auditor}</div>
                    <div className="text-neutral-400 text-[11px] mt-0.5">
                      Scope: {item.scope} | Hash: {item.keyHash}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[#00E599] block font-bold">{item.status}</span>
                      <span className="text-neutral-500 text-[10px] block">Expires in {item.expiresIn}</span>
                    </div>
                    <button
                      onClick={() => handleRevokeKey(item.id)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Revoke Key"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-2">
            <h4 className="text-sm font-bold font-mono text-neutral-100">
              Audit Invariant Verifiability
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Viewing keys permit mathematical verification of balances, inflows, and outflows
              without revealing counterparty addresses or linking multiple independent transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
