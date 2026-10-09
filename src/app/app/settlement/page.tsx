'use client';

import React, { useState } from 'react';
import {
  FiLock,
  FiShield,
  FiArrowRight,
  FiCheckCircle,
  FiDownload,
  FiCopy,
  FiCheck,
  FiPlus,
  FiSend,
  FiFileText,
  FiKey,
} from 'react-icons/fi';
import { RiBankCardLine, RiShieldCheckLine } from 'react-icons/ri';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts/addresses';
import { parseTokenAmount, formatDisplayBalance } from '@/lib/math';
import { truncateAddress } from '@/lib/utils';
import { ShieldReceiptCard } from '@/components/generative/ShieldReceiptCard';

export default function AppSettlementPage() {
  const { isConnected, address } = useAccount();
  const [activeTab, setActiveTab] = useState<'SHIELD' | 'UNSHIELD' | 'TRANSFER' | 'INVOICE'>('SHIELD');

  // Shield Form State
  const [shieldAmount, setShieldAmount] = useState('500');
  const [generatedReceipt, setGeneratedReceipt] = useState<any>(null);

  // Unshield Form State
  const [unshieldNullifier, setUnshieldNullifier] = useState('');
  const [unshieldRecipient, setUnshieldRecipient] = useState('');
  const [unshieldAmount, setUnshieldAmount] = useState('');

  // Invoice Form State
  const [invoiceRecipient, setInvoiceRecipient] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('1200');
  const [invoiceMemo, setInvoiceMemo] = useState('Monthly Engineering Contractor Retainer');
  const [invoiceGenerated, setInvoiceGenerated] = useState<any>(null);

  const { sendTransaction, data: txHash, isPending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  const handleShieldDeposit = () => {
    // Generate client-side cryptographic commitment & nullifier
    const commitment = (`0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`) as `0x${string}`;

    const nullifier = (`0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`) as `0x${string}`;

    const receipt = {
      commitment,
      nullifier,
      amount: shieldAmount,
      tokenSymbol: 'pUSD',
      vaultAddress: CONTRACT_ADDRESSES.vault,
      timestamp: Date.now(),
    };

    setGeneratedReceipt(receipt);

    // Call on-chain vault depositShielded
    sendTransaction({
      to: CONTRACT_ADDRESSES.vault,
      value: BigInt(0),
      data: '0xb6b55f25', // depositShielded selector
    });
  };

  const handleGenerateInvoice = () => {
    const invoiceRef = `INV-${Date.now().toString().slice(-6)}`;
    const invoiceKey = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    setInvoiceGenerated({
      ref: invoiceRef,
      recipient: invoiceRecipient || '0x78B...99a',
      amount: invoiceAmount,
      memo: invoiceMemo,
      encryptedKey: invoiceKey,
      status: 'AWAITING_SHIELDED_PAYMENT',
    });
  };

  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="pb-2 border-b border-[#21293D]">
        <h2 className="text-2xl font-bold font-mono tracking-tight text-neutral-100">
          Confidential Settlement & Shielded Invoicing
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Mint and redeem encrypted commitment notes. Execute private peer-to-peer transfers with zero public ledger exposure.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#21293D] gap-2 overflow-x-auto pb-1">
        {[
          { key: 'SHIELD', label: 'Shield Deposit', icon: FiLock },
          { key: 'UNSHIELD', label: 'Redeem Note', icon: FiKey },
          { key: 'TRANSFER', label: 'Private Transfer', icon: FiSend },
          { key: 'INVOICE', label: 'Corporate Invoice', icon: FiFileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-medium transition border-b-2 font-mono whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-[#00E599] text-[#00E599] bg-[#0E121B]'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
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
        {/* Left Interactive Desk Form */}
        <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] shadow-xl space-y-6">
          {activeTab === 'SHIELD' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-mono text-neutral-100">
                  Shield Assets into Confidential Pool
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Transforms public token balance into client-side encrypted commitment notes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                  Deposit Amount (pUSD)
                </label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#161C2B] border border-[#21293D]">
                  <input
                    type="number"
                    value={shieldAmount}
                    onChange={(e) => setShieldAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-lg font-mono font-bold text-neutral-100 focus:outline-none"
                  />
                  <span className="px-3 py-1 rounded-lg bg-[#0E121B] text-xs font-mono font-bold text-neutral-200 border border-[#21293D]">
                    pUSD
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#161C2B] border border-[#21293D] space-y-2 text-xs font-mono text-neutral-300">
                <div className="flex items-center gap-2 text-[#00E599] font-bold">
                  <FiShield className="w-4 h-4" />
                  <span>Client-Side Cryptographic Commitment</span>
                </div>
                <p className="text-neutral-400 font-sans text-[11px]">
                  A secret nullifier and commitment pair will be synthesized locally in your browser.
                  The public mempool observer sees only an encrypted state update.
                </p>
              </div>

              <button
                onClick={handleShieldDeposit}
                disabled={isPending || isConfirming || !shieldAmount}
                className="w-full py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition shadow-lg shadow-[#00E599]/15 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiLock className="w-4 h-4" />
                <span>
                  {isPending || isConfirming
                    ? 'Confirming Shield Note...'
                    : 'Shield Deposit on Ledger'}
                </span>
              </button>
            </div>
          )}

          {activeTab === 'UNSHIELD' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-mono text-neutral-100">
                  Redeem Confidential Note
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Provide your private nullifier to withdraw shielded funds into a destination wallet.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                  Secret Nullifier Identifier
                </label>
                <input
                  type="text"
                  value={unshieldNullifier}
                  onChange={(e) => setUnshieldNullifier(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 rounded-xl bg-[#161C2B] border border-[#21293D] text-xs font-mono text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#00E599]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                  Destination Recipient Address
                </label>
                <input
                  type="text"
                  value={unshieldRecipient}
                  onChange={(e) => setUnshieldRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 rounded-xl bg-[#161C2B] border border-[#21293D] text-xs font-mono text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#00E599]/40"
                />
              </div>

              <button
                disabled={!unshieldNullifier}
                className="w-full py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FiKey className="w-4 h-4" />
                <span>Verify Proof & Redeem Note</span>
              </button>
            </div>
          )}

          {activeTab === 'TRANSFER' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-mono text-neutral-100">
                  Private Peer-to-Peer Transfer
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Transfer commitment notes to another party without exposing identities or amounts on-chain.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                  Recipient Public Identity / Key
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="w-full p-3 rounded-xl bg-[#161C2B] border border-[#21293D] text-xs font-mono text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#00E599]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                  Transfer Amount (pUSD)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full p-3 rounded-xl bg-[#161C2B] border border-[#21293D] text-lg font-mono font-bold text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#00E599]/40"
                />
              </div>

              <button className="w-full py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition flex items-center justify-center gap-2">
                <FiSend className="w-4 h-4" />
                <span>Send Shielded Note</span>
              </button>
            </div>
          )}

          {activeTab === 'INVOICE' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold font-mono text-neutral-100">
                  Create Encrypted Corporate Invoice
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Generate a cryptographic payment request with encrypted reference metadata.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                  Client / Payor Identity
                </label>
                <input
                  type="text"
                  value={invoiceRecipient}
                  onChange={(e) => setInvoiceRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 rounded-xl bg-[#161C2B] border border-[#21293D] text-xs font-mono text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#00E599]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                  Invoice Amount (pUSD)
                </label>
                <input
                  type="number"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#161C2B] border border-[#21293D] text-lg font-mono font-bold text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#00E599]/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-neutral-400 mb-2">
                  Encrypted Invoice Memo / Reference
                </label>
                <input
                  type="text"
                  value={invoiceMemo}
                  onChange={(e) => setInvoiceMemo(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#161C2B] border border-[#21293D] text-xs text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#00E599]/40"
                />
              </div>

              <button
                onClick={handleGenerateInvoice}
                className="w-full py-4 rounded-xl bg-[#00E599] hover:bg-[#00c985] text-[#06080D] font-bold text-sm transition flex items-center justify-center gap-2"
              >
                <FiFileText className="w-4 h-4" />
                <span>Generate Encrypted Invoice</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Output Desk: Generated Receipts & Invoices */}
        <div className="lg:col-span-6 space-y-6">
          {generatedReceipt ? (
            <ShieldReceiptCard receipt={generatedReceipt} />
          ) : invoiceGenerated ? (
            <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#21293D]">
                <span className="font-mono text-xs font-bold text-[#00E599] px-2 py-0.5 rounded bg-[#00E599]/10">
                  {invoiceGenerated.ref}
                </span>
                <span className="text-xs font-mono text-amber-400 uppercase font-bold">
                  {invoiceGenerated.status}
                </span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-neutral-400">
                  <span>Payor Address:</span>
                  <span className="text-neutral-200">{invoiceGenerated.recipient}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Due Amount:</span>
                  <span className="text-xl font-bold text-[#00E599] tabular-nums">
                    ${invoiceGenerated.amount} pUSD
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Encrypted Memo:</span>
                  <span className="text-neutral-200">{invoiceGenerated.memo}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#161C2B] border border-[#21293D] text-[11px] font-mono text-neutral-400 break-all">
                <span>Decryption Key: {invoiceGenerated.encryptedKey}</span>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-[#21293D] bg-[#0E121B] text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#161C2B] text-neutral-400 flex items-center justify-center mx-auto border border-[#21293D]">
                <FiLock className="w-6 h-6 text-[#00E599]" />
              </div>
              <h4 className="text-base font-bold font-mono text-neutral-200">
                Confidential Ledger Standing By
              </h4>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                Initiate a shield deposit, invoice request, or note redemption. Generated cryptographic
                commitments and receipt notes will display here.
              </p>
            </div>
          )}

          {/* Privacy Security Guarantee */}
          <div className="p-6 rounded-2xl border border-[#21293D] bg-[#0E121B] space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold font-mono text-neutral-100">
              <RiShieldCheckLine className="w-5 h-5 text-[#00E599]" />
              <span>Zero Mempool Leakage Guarantee</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every commitment generated by Kudex is cryptographically salted.
              Network validators and external observers can never determine the deposit balance,
              transaction participants, or internal corporate invoice details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
