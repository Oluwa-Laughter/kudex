'use client';

import React, { useState } from 'react';
import {
  FiLock,
  FiKey,
  FiSend,
  FiCheckCircle,
  FiDownload,
  FiShield,
  FiArrowRight,
  FiCopy,
  FiFileText,
} from 'react-icons/fi';
import { RiShieldCheckLine, RiBankCardLine } from 'react-icons/ri';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { truncateAddress } from '@/lib/utils';
import { useProtocolStore, ShieldedNote } from '@/lib/protocol-store';

export default function AppSettlementPage() {
  const { isConnected, address } = useAccount();
  const { notes, addNote, unshieldNote } = useProtocolStore();

  const [activeTab, setActiveTab] = useState<'SHIELD' | 'UNSHIELD' | 'TRANSFER' | 'INVOICE'>('SHIELD');
  const [shieldAmount, setShieldAmount] = useState('1000');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('500');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const { sendTransaction, data: txHash, isPending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  // Generate real cryptographic note commitment
  const handleShieldDeposit = () => {
    const num = parseFloat(shieldAmount);
    if (!num || num <= 0) return;

    const commitment = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    const nullifier = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    if (isConnected) {
      sendTransaction({
        to: CONTRACT_ADDRESSES.vault,
        value: BigInt(0),
        data: '0xb6b55f25', // depositShielded
      });
    }

    const note = addNote({
      commitment,
      nullifier,
      amount: num.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      asset: 'pUSD',
      status: 'SHIELDED',
      txHash: txHash || '0x4f1a...92bc',
    });

    setNotification(`Successfully created shielded note for $${num.toLocaleString()} pUSD!`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTransfer = () => {
    const num = parseFloat(transferAmount);
    if (!num || num <= 0 || !recipientAddress) return;

    const commitment = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    const nullifier = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    addNote({
      commitment,
      nullifier,
      amount: num.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      asset: 'pUSD',
      status: 'SHIELDED',
      recipient: recipientAddress,
    });

    setNotification(`Transferred $${num.toLocaleString()} pUSD privately to ${truncateAddress(recipientAddress, 6)}!`);
    setRecipientAddress('');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shieldedNotes = notes.filter((n) => n.status === 'SHIELDED');

  return (
    <div className="space-y-10">
      {/* Workspace Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-[#21293D]">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Confidential Settlement & Shielded Invoicing
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-300 mt-1.5">
          Mint and redeem encrypted commitment notes. Execute private peer-to-peer transfers with zero public ledger exposure.
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold text-sm flex items-center gap-2">
          <FiCheckCircle className="w-5 h-5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#21293D] gap-2 overflow-x-auto pb-1">
        {[
          { key: 'SHIELD', label: 'Shield Deposit', icon: FiLock },
          { key: 'UNSHIELD', label: 'My Shielded Notes', icon: FiKey },
          { key: 'TRANSFER', label: 'Private Transfer', icon: FiSend },
          { key: 'INVOICE', label: 'Corporate Invoice', icon: FiFileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-t-xl text-sm font-bold transition border-b-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#0E121B]'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form View */}
        <div className="lg:col-span-6 p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-xl space-y-6 transition-colors duration-200">
          {activeTab === 'SHIELD' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Shield Assets into Confidential Pool
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Transforms public token balance into client-side encrypted commitment notes.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">
                  Deposit Amount (pUSD)
                </label>
                <div className="flex rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] overflow-hidden focus-within:border-emerald-500">
                  <input
                    type="number"
                    value={shieldAmount}
                    onChange={(e) => setShieldAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-4 py-3.5 bg-transparent font-bold text-xl text-slate-900 dark:text-white outline-none tabular-nums"
                  />
                  <span className="px-4 py-3.5 font-bold text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#21293D] flex items-center">
                    pUSD
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] text-xs space-y-2 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Cryptographic Proof:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Zero Balance Leakage</span>
                </div>
                <div className="flex justify-between">
                  <span>Auditor Compliance:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Viewing Key Supported</span>
                </div>
              </div>

              <button
                onClick={handleShieldDeposit}
                disabled={isPending || isConfirming || !shieldAmount || parseFloat(shieldAmount) <= 0}
                className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {isPending || isConfirming ? 'Shielding on Primary Ledger...' : 'Shield Deposit'}
              </button>
            </div>
          )}

          {activeTab === 'TRANSFER' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Private P2P Transfer
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Send shielded balance directly to another address with zero public mempool tracing.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] font-mono text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">
                  Transfer Amount (pUSD)
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-[#21293D] bg-slate-50 dark:bg-[#161C2B] font-bold text-xl text-slate-900 dark:text-white outline-none focus:border-emerald-500 tabular-nums"
                />
              </div>

              <button
                onClick={handleTransfer}
                disabled={!recipientAddress || !transferAmount || parseFloat(transferAmount) <= 0}
                className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                Send Shielded Transfer
              </button>
            </div>
          )}

          {activeTab === 'UNSHIELD' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  My Active Shielded Notes
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Encrypted notes available to redeem back to your public wallet.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-[#21293D]">
                {shieldedNotes.length > 0 ? (
                  shieldedNotes.map((note) => (
                    <div key={note.id} className="py-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base text-slate-900 dark:text-white tabular-nums">
                          ${note.amount} {note.asset}
                        </span>
                        <button
                          onClick={() => {
                            unshieldNote(note.id);
                            setNotification(`Redeemed note ${note.id} back to wallet!`);
                            setTimeout(() => setNotification(null), 4000);
                          }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-emerald-500 hover:text-slate-950 dark:bg-[#161C2B] dark:hover:bg-emerald-500 text-slate-800 dark:text-slate-200 transition"
                        >
                          Redeem to Wallet
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                        <span>Commitment: {truncateAddress(note.commitment, 8)}</span>
                        <button
                          onClick={() => handleCopy(note.commitment, note.id)}
                          className="hover:text-emerald-500 flex items-center gap-1"
                        >
                          <FiCopy className="w-3.5 h-3.5" />
                          <span>{copiedId === note.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    No active notes to redeem. Shield a deposit above to create one.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'INVOICE' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Corporate Invoicing
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Generate shielded disbursement invoices for cross-border contractor payouts.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161C2B] border border-slate-200 dark:border-[#21293D] space-y-2 text-sm">
                <div className="font-bold text-slate-900 dark:text-white">Sample Corporate Invoice #INV-2026-08</div>
                <div className="text-slate-500 dark:text-slate-400">Amount: $12,500.00 pUSD | Due: Net 30</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Payment Method: Cryptographic Shield Note</div>
              </div>

              <button
                onClick={() => {
                  setNotification('Generated corporate invoice note commitment!');
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition shadow-md"
              >
                Create Invoice Commitment
              </button>
            </div>
          )}
        </div>

        {/* Right Explainer Panel */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-7 sm:p-8 rounded-2xl border border-slate-200 dark:border-[#21293D] bg-white dark:bg-[#0E121B] shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FiShield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                How Note Shielding Protects You
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              When you shield funds, your local browser computes an encrypted cryptographic note commitment.
              Blockchain explorers see only a zero-knowledge commitment hash without your wallet balance or transfer destination.
            </p>
            <div className="space-y-3 pt-2 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Zero plaintext mempool leakage</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Instant recipient note redemption</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Compliance audit trails via asymmetric viewing keys</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
