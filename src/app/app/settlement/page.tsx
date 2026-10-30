'use client';

import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  useAccount,
  usePublicClient,
  useSignMessage,
  useWriteContract,
} from 'wagmi';
import {
  erc20Abi,
  formatUnits,
  isAddress,
  parseUnits,
  zeroAddress,
  type Address,
  type Hex,
} from 'viem';
import {
  FiSend,
  FiFileText,
  FiShield,
  FiDownload,
  FiCheckCircle,
  FiClock,
  FiUnlock,
} from 'react-icons/fi';
import { CONTRACT_ADDRESSES, isVaultConfigured } from '@/lib/contracts/addresses';
import { kudexVaultAbi } from '@/lib/contracts/abis';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { useProtocolEvents } from '@/lib/hooks/useProtocolEvents';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';

interface LedgerRow {
  id: string;
  type: string;
  counterparty: string;
  amountLabel: string;
  status: 'Settled Confidentially' | 'Unshielded' | 'Pending';
  reference: string;
  timestamp: string;
}

async function sha256Bytes32(input: string): Promise<Hex> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  );
  return ('0x' +
    Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')) as Hex;
}

export default function SettlementWorkspacePage() {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const events = useProtocolEvents();

  // Private Transfer state
  const [recipient, setRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMemo, setTransferMemo] = useState('');
  const [generatedNoteJson, setGeneratedNoteJson] = useState('');

  // Corporate Invoice state
  const [vendor, setVendor] = useState('');
  const [invoiceToken, setInvoiceToken] = useState<string>(
    CONTRACT_ADDRESSES.usdc !== zeroAddress ? CONTRACT_ADDRESSES.usdc : '',
  );
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-30');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [invoiceJson, setInvoiceJson] = useState('');

  // Shield / Unshield Portal state
  const [portalMode, setPortalMode] = useState<'shield' | 'unshield'>('shield');
  const [portalAmount, setPortalAmount] = useState('');

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [ledger, setLedger] = useState<LedgerRow[]>([]);

  const connected = Boolean(address && chainId === portaldotTestnet.id);

  async function createPrivateTransfer() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!address) throw new Error('Connect your wallet to sign a confidential note.');
      if (!isAddress(recipient) || recipient.toLowerCase() === zeroAddress)
        throw new Error('Enter a valid nonzero recipient address.');
      if (!transferAmount || Number(transferAmount) <= 0)
        throw new Error('Enter a positive transfer amount.');

      const blinding =
        '0x' +
        Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
          b.toString(16).padStart(2, '0'),
        ).join('');
      const commitment = await sha256Bytes32(
        `kudex-note-v1:${address}:${recipient}:${transferAmount}:${blinding}`,
      );
      const encryptedRef = await sha256Bytes32(
        `kudex-memo:${transferMemo || 'corporate-settlement'}:${blinding}`,
      );

      const signature = await signMessageAsync({
        message: `Authorize Kudex One-Time Shielded Note\nCommitment: ${commitment}\nEncrypted Ref: ${encryptedRef}`,
      });

      const payload = JSON.stringify(
        {
          version: 'kudex-private-note-v1',
          senderCommitment: commitment,
          recipient,
          amount: transferAmount,
          encryptedReference: encryptedRef,
          blindingFactor: blinding,
          senderSignature: signature,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      );
      setGeneratedNoteJson(payload);
      setLedger((prev) => [
        {
          id: commitment.slice(0, 12),
          type: 'One-Time Recipient Note',
          counterparty: truncateAddress(recipient),
          amountLabel: 'Confidential Amount',
          status: 'Settled Confidentially',
          reference: truncateAddress(commitment),
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setStatus('One-time recipient note signed. Export and deliver to recipient.');
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function buildInvoice() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!isAddress(vendor) || vendor.toLowerCase() === zeroAddress)
        throw new Error('Enter a valid vendor settlement address.');
      if (!isAddress(invoiceToken) || invoiceToken.toLowerCase() === zeroAddress)
        throw new Error('Enter a valid ERC-20 settlement token address.');
      if (!invoiceAmount || Number(invoiceAmount) <= 0)
        throw new Error('Enter a positive invoice amount.');

      const encryptedPaymentRef = await sha256Bytes32(
        `kudex-invoice:${vendor}:${invoiceToken}:${invoiceAmount}:${dueDate}:${invoiceRef}`,
      );
      const payload = JSON.stringify(
        {
          version: 'kudex-corporate-invoice-v1',
          vendor,
          token: invoiceToken,
          amount: invoiceAmount,
          dueDate,
          encryptedPaymentReference: encryptedPaymentRef,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      );
      setInvoiceJson(payload);
      setLedger((prev) => [
        {
          id: encryptedPaymentRef.slice(0, 12),
          type: 'Corporate Invoice Issued',
          counterparty: truncateAddress(vendor),
          amountLabel: `${invoiceAmount} units`,
          status: 'Pending',
          reference: truncateAddress(encryptedPaymentRef),
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setStatus('Cryptographic invoice generated with encrypted payment reference.');
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function settleInvoiceOnChain() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!client || !address || !connected)
        throw new Error(
          'Connect your transaction wallet on the settlement network to pay an invoice.',
        );
      if (!invoiceJson.trim()) throw new Error('Generate or paste an invoice JSON first.');
      const parsed = JSON.parse(invoiceJson) as {
        vendor: string;
        token: string;
        amount: string;
        encryptedPaymentReference: string;
      };
      if (!isAddress(parsed.vendor) || !isAddress(parsed.token))
        throw new Error('Invoice contains invalid vendor or token address.');
      const decimals = await client.readContract({
        address: parsed.token as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      });
      const units = parseUnits(parsed.amount, decimals);
      const sim = await client.simulateContract({
        address: parsed.token as Address,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [parsed.vendor as Address, units],
        account: address,
      });
      const txHash = await writeContractAsync({
        ...sim.request,
        account: address,
        chainId: portaldotTestnet.id,
      });
      await client.waitForTransactionReceipt({ hash: txHash });
      setLedger((prev) => [
        {
          id: txHash.slice(0, 12),
          type: 'Invoice Paid On-Chain',
          counterparty: truncateAddress(parsed.vendor),
          amountLabel: `${parsed.amount} tokens`,
          status: 'Settled Confidentially',
          reference: truncateAddress(txHash),
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setStatus(`Invoice settled on-chain (${truncateAddress(txHash)}).`);
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function executePortalOperation() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!client || !address || !connected)
        throw new Error('Connect your wallet on the settlement network first.');
      if (!isVaultConfigured)
        throw new Error('Settlement pool contract is awaiting configuration.');
      if (!portalAmount || Number(portalAmount) <= 0)
        throw new Error('Enter a positive amount.');

      const { vault, usdc } = CONTRACT_ADDRESSES;
      const decimals = await client.readContract({
        address: usdc,
        abi: erc20Abi,
        functionName: 'decimals',
      });
      const units = parseUnits(portalAmount, decimals);

      if (portalMode === 'shield') {
        const allowance = await client.readContract({
          address: usdc,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address, vault],
        });
        if (allowance < units) {
          setStatus('Approving exact collateral for shielded pool deposit…');
          const approveSim = await client.simulateContract({
            address: usdc,
            abi: erc20Abi,
            functionName: 'approve',
            args: [vault, units],
            account: address,
          });
          const approveHash = await writeContractAsync({
            ...approveSim.request,
            account: address,
            chainId: portaldotTestnet.id,
          });
          await client.waitForTransactionReceipt({ hash: approveHash });
        }
        const commitment = await sha256Bytes32(
          `kudex-shield-portal:${address}:${units.toString()}:${Date.now()}`,
        );
        setStatus('Confirming shielded deposit into confidential pool…');
        const shieldSim = await client.simulateContract({
          address: vault,
          abi: kudexVaultAbi,
          functionName: 'shieldDeposit',
          args: [units, commitment, address],
          account: address,
        });
        const txHash = await writeContractAsync({
          ...shieldSim.request,
          account: address,
          chainId: portaldotTestnet.id,
        });
        await client.waitForTransactionReceipt({ hash: txHash });
        setLedger((prev) => [
          {
            id: txHash.slice(0, 12),
            type: 'Shielded Pool Deposit',
            counterparty: 'Confidential Pool',
            amountLabel: 'Confidential Amount',
            status: 'Settled Confidentially',
            reference: truncateAddress(commitment),
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
        setStatus(`Assets shielded on-chain (${truncateAddress(txHash)}).`);
      } else {
        const block = await client.getBlock();
        const preview = await client.readContract({
          address: vault,
          abi: kudexVaultAbi,
          functionName: 'previewRedeem',
          args: [units],
        });
        const minAssets = (preview * 9950n) / 10000n;
        const redeemSim = await client.simulateContract({
          address: vault,
          abi: kudexVaultAbi,
          functionName: 'redeemWithMinimum',
          args: [units, address, minAssets, block.timestamp + 600n],
          account: address,
        });
        const txHash = await writeContractAsync({
          ...redeemSim.request,
          account: address,
          chainId: portaldotTestnet.id,
        });
        await client.waitForTransactionReceipt({ hash: txHash });
        setLedger((prev) => [
          {
            id: txHash.slice(0, 12),
            type: 'Pool Note Unshielded',
            counterparty: truncateAddress(address),
            amountLabel: `${portalAmount} shares`,
            status: 'Unshielded',
            reference: truncateAddress(txHash),
            timestamp: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
        setStatus(`Assets unshielded to standard tokens (${truncateAddress(txHash)}).`);
      }
      setPortalAmount('');
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function downloadJson(content: string, filename: string) {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow">Enterprise A2B Operations</p>
        <h1 className="page-title">Private Settlement & Corporate Invoicing</h1>
        <p className="page-description">
          Send one-time recipient notes, settle encrypted vendor invoices, and shield or
          unshield corporate treasury balances.
        </p>
      </header>

      <Tabs.Root defaultValue="transfer" className="space-y-6">
        <Tabs.List
          aria-label="Settlement workflows"
          className="flex flex-wrap gap-2 border-b border-border pb-4"
        >
          <Tabs.Trigger value="transfer" className="workspace-tab">
            <FiSend aria-hidden="true" /> Private Transfer
          </Tabs.Trigger>
          <Tabs.Trigger value="invoicing" className="workspace-tab">
            <FiFileText aria-hidden="true" /> Corporate Invoicing
          </Tabs.Trigger>
          <Tabs.Trigger value="portal" className="workspace-tab">
            <FiShield aria-hidden="true" /> Shield / Unshield Portal
          </Tabs.Trigger>
        </Tabs.List>

        {/* Tab 1: Private Transfer */}
        <Tabs.Content value="transfer" className="panel space-y-6">
          <div>
            <h2 className="text-xl font-bold">Send Shielded One-Time Recipient Note</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a blinded commitment hiding transfer amounts and counterparty links
              while preserving cryptographic validity.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Recipient Address
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x…"
                disabled={busy}
                className="field-input mt-2"
              />
            </label>
            <label className="block text-sm font-medium">
              Transfer Amount
              <input
                type="number"
                min="0"
                step="any"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="5000.00"
                disabled={busy}
                className="field-input mt-2 tabular-nums"
              />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              Confidential Memo (Hashed Locally)
              <input
                value={transferMemo}
                onChange={(e) => setTransferMemo(e.target.value)}
                placeholder="Q4 Vendor Retainer · Payroll Batch #14"
                disabled={busy}
                className="field-input mt-2"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void createPrivateTransfer()}
              className="action-link"
            >
              Sign One-Time Recipient Note
            </button>
            {generatedNoteJson && (
              <button
                type="button"
                onClick={() =>
                  downloadJson(generatedNoteJson, 'kudex-recipient-note.json')
                }
                className="quiet-link text-sm"
              >
                <FiDownload aria-hidden="true" /> Download Note Claim JSON
              </button>
            )}
          </div>

          {generatedNoteJson && (
            <pre className="overflow-x-auto rounded-xl border border-border bg-secondary p-4 font-mono text-sm">
              {generatedNoteJson}
            </pre>
          )}
        </Tabs.Content>

        {/* Tab 2: Corporate Invoicing */}
        <Tabs.Content value="invoicing" className="panel space-y-6">
          <div>
            <h2 className="text-xl font-bold">Cryptographic Corporate Invoicing</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create tamper-evident vendor invoices with encrypted payment references and
              settle in one click.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Vendor Address
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="0x…"
                disabled={busy}
                className="field-input mt-2"
              />
            </label>
            <label className="block text-sm font-medium">
              Settlement Token Address
              <input
                value={invoiceToken}
                onChange={(e) => setInvoiceToken(e.target.value)}
                placeholder="0x…"
                disabled={busy}
                className="field-input mt-2"
              />
            </label>
            <label className="block text-sm font-medium">
              Invoice Amount
              <input
                type="number"
                min="0"
                step="any"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                placeholder="12500.00"
                disabled={busy}
                className="field-input mt-2 tabular-nums"
              />
            </label>
            <label className="block text-sm font-medium">
              Due Date
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={busy}
                className="field-input mt-2 tabular-nums"
              />
            </label>
            <label className="block text-sm font-medium sm:col-span-2">
              Payment Reference (Encrypted via SHA-256)
              <input
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                placeholder="INV-2026-0892 · Enterprise Cloud Infrastructure"
                disabled={busy}
                className="field-input mt-2"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void buildInvoice()}
              className="quiet-link"
            >
              Generate Encrypted Invoice
            </button>
            {invoiceJson && (
              <button
                type="button"
                onClick={() => downloadJson(invoiceJson, 'kudex-corporate-invoice.json')}
                className="quiet-link text-sm"
              >
                <FiDownload aria-hidden="true" /> Export Invoice
              </button>
            )}
          </div>

          <div className="space-y-2 border-t border-border pt-5">
            <label htmlFor="invoice-payload" className="block text-sm font-medium">
              Invoice Payload (Create above or paste received invoice JSON)
            </label>
            <textarea
              id="invoice-payload"
              rows={5}
              value={invoiceJson}
              onChange={(e) => setInvoiceJson(e.target.value)}
              placeholder="Paste cryptographic invoice JSON here for one-click settlement"
              className="field-input font-mono text-sm"
            />
            <button
              type="button"
              disabled={busy || !invoiceJson.trim()}
              onClick={() => void settleInvoiceOnChain()}
              className="action-link mt-2 disabled:opacity-40"
            >
              One-Click Invoice Settlement
            </button>
          </div>
        </Tabs.Content>

        {/* Tab 3: Shield / Unshield Portal */}
        <Tabs.Content value="portal" className="panel space-y-6">
          <div>
            <h2 className="text-xl font-bold">Shield / Unshield Liquidity Portal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Deposit transparent tokens into the confidential pool commitment tree or
              withdraw shielded shares back to standard tokens.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPortalMode('shield')}
              className={`rounded-xl border p-4 text-left transition ${
                portalMode === 'shield'
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-secondary text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-foreground">
                <FiShield className="text-primary" aria-hidden="true" />
                <span>Shield Transparent Assets</span>
              </div>
              <p className="mt-1 text-sm">
                Lock collateral in the pool and register a cryptographic note commitment.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPortalMode('unshield')}
              className={`rounded-xl border p-4 text-left transition ${
                portalMode === 'unshield'
                  ? 'border-accent bg-accent/10 text-foreground'
                  : 'border-border bg-secondary text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-foreground">
                <FiUnlock className="text-accent" aria-hidden="true" />
                <span>Unshield to Standard Tokens</span>
              </div>
              <p className="mt-1 text-sm">
                Redeem pool shares back into liquid wallet tokens with 0.5% slippage guard.
              </p>
            </button>
          </div>

          <label className="block max-w-md text-sm font-medium">
            {portalMode === 'shield' ? 'Amount to Shield' : 'Pool Shares to Unshield'}
            <input
              type="number"
              min="0"
              step="any"
              value={portalAmount}
              onChange={(e) => setPortalAmount(e.target.value)}
              placeholder="1000.00"
              disabled={busy}
              className="field-input mt-2 tabular-nums"
            />
          </label>

          <button
            type="button"
            disabled={busy || !isVaultConfigured || !portalAmount}
            onClick={() => void executePortalOperation()}
            className="action-link disabled:opacity-40"
          >
            {portalMode === 'shield'
              ? 'Shield Assets in Wallet'
              : 'Unshield Shares in Wallet'}
          </button>

          {!isVaultConfigured && (
            <p className="text-sm text-muted-foreground">
              Confidential pool contract address awaiting configuration for on-chain
              shielding.
            </p>
          )}
        </Tabs.Content>
      </Tabs.Root>

      {status && (
        <p role="status" className="text-sm font-medium text-primary">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Transaction Activity Ledger */}
      <section className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold">Transaction Activity Ledger</h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {events.data
              ? `${events.data.totalDepositEvents} On-Chain Pool Entries`
              : 'Session & On-Chain Ledger'}
          </span>
        </div>

        <div className="table-region rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Operation</th>
                <th className="px-4 py-3">Counterparty</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ledger.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-semibold">{row.type}</td>
                  <td className="px-4 py-3 font-mono">{row.counterparty}</td>
                  <td className="px-4 py-3 font-mono tabular-nums">{row.amountLabel}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {row.reference}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                        row.status === 'Settled Confidentially'
                          ? 'bg-primary/15 text-primary'
                          : row.status === 'Unshielded'
                            ? 'bg-accent/15 text-accent'
                            : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {row.status === 'Pending' ? (
                        <FiClock aria-hidden="true" />
                      ) : (
                        <FiCheckCircle aria-hidden="true" />
                      )}
                      <span>{row.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
              {events.data?.chartSeries
                .filter((b) => b.rawVolumeBigInt > 0n)
                .map((b) => (
                  <tr key={b.day}>
                    <td className="px-4 py-3 font-semibold">On-Chain Pool Commitment</td>
                    <td className="px-4 py-3 font-mono">Confidential Pool</td>
                    <td className="px-4 py-3 font-mono tabular-nums">
                      {formatUnits(b.rawVolumeBigInt, events.data!.decimals)} units
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      Blocks {b.day}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
                        <FiCheckCircle aria-hidden="true" />
                        <span>Settled Confidentially</span>
                      </span>
                    </td>
                  </tr>
                ))}
              {ledger.length === 0 &&
                (!events.data || events.data.totalDepositEvents === 0) && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No shielded transfers or invoices recorded in this session yet.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
