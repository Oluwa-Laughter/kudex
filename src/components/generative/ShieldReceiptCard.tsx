'use client';

import React, { useState } from 'react';
import { FiShield, FiKey, FiCopy, FiCheck, FiDownload, FiLock } from 'react-icons/fi';
import { truncateAddress } from '@/lib/utils';
import { ShieldReceipt } from '@/types';

interface ShieldReceiptCardProps {
  receipt: ShieldReceipt;
}

export function ShieldReceiptCard({ receipt }: ShieldReceiptCardProps) {
  const [copiedCommitment, setCopiedCommitment] = useState(false);
  const [copiedNullifier, setCopiedNullifier] = useState(false);

  const copyToClipboard = (text: string, type: 'comm' | 'null') => {
    navigator.clipboard.writeText(text);
    if (type === 'comm') {
      setCopiedCommitment(true);
      setTimeout(() => setCopiedCommitment(false), 2000);
    } else {
      setCopiedNullifier(true);
      setTimeout(() => setCopiedNullifier(false), 2000);
    }
  };

  const downloadNoteJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(receipt, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kudex-zk-note-${receipt.commitment.slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="my-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/80 p-5 backdrop-blur-md shadow-sm font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <FiLock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Confidential ZK Note
            </span>
            <p className="text-[11px] text-neutral-400">Groth16 Shielded Vault Commitment</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <FiShield className="w-4 h-4" />
          <span>On-Chain Shielded</span>
        </div>
      </div>

      <div className="space-y-3 py-4 text-xs">
        <div>
          <span className="text-neutral-400 block mb-1">Commitment Hash:</span>
          <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px] text-neutral-800 dark:text-neutral-200 break-all">
            <span>{receipt.commitment}</span>
            <button
              onClick={() => copyToClipboard(receipt.commitment, 'comm')}
              className="ml-2 p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              aria-label="Copy commitment"
            >
              {copiedCommitment ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div>
          <span className="text-neutral-400 block mb-1">Nullifier Identifier:</span>
          <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 font-mono text-[11px] text-neutral-800 dark:text-neutral-200 break-all">
            <span>{receipt.nullifier}</span>
            <button
              onClick={() => copyToClipboard(receipt.nullifier, 'null')}
              className="ml-2 p-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              aria-label="Copy nullifier"
            >
              {copiedNullifier ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
            <span className="text-neutral-400 block text-[11px]">Vault Address:</span>
            <span className="font-mono text-neutral-800 dark:text-neutral-200 font-medium">
              {truncateAddress(receipt.vaultAddress, 6)}
            </span>
          </div>
          <div className="p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
            <span className="text-neutral-400 block text-[11px]">Asset Value:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              {receipt.amount.toString()} {receipt.tokenSymbol}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <FiKey className="w-3.5 h-3.5 text-emerald-500" />
          <span>Keep your nullifier private to spend</span>
        </div>

        <button
          onClick={downloadNoteJson}
          className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition"
        >
          <FiDownload className="w-3.5 h-3.5" />
          <span>Export Note</span>
        </button>
      </div>
    </div>
  );
}
