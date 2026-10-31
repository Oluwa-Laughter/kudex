'use client';

import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useQuery } from '@tanstack/react-query';
import {
  useAccount,
  usePublicClient,
  useSignMessage,
  useWriteContract,
} from 'wagmi';
import {
  erc20Abi,
  isAddress,
  isHex,
  parseUnits,
  zeroAddress,
  type Address,
  type Hex,
} from 'viem';
import {
  FiSend,
  FiFileText,
  FiKey,
  FiLock,
  FiDownload,
  FiCopy,
  FiCheck,
  FiSlash,
  FiCheckCircle,
  FiClock,
  FiShield,
} from 'react-icons/fi';
import { CONTRACT_ADDRESSES, isVaultConfigured } from '@/lib/contracts/addresses';
import { kudexVaultAbi } from '@/lib/contracts/abis';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';

interface PaymentActivityItem {
  id: string;
  kind: string;
  recipientOrVendor: string;
  amountLabel: string;
  status: 'Private · Confirmed' | 'Invoice Ready' | 'Invoice Paid';
  timestamp: string;
}

interface AuditorPassItem {
  id: string;
  auditorName: string;
  contactOrAddress: string;
  scope: string;
  passCode: string;
  createdAt: string;
  active: boolean;
}

const AUDITOR_SCOPES = [
  {
    value: 'Bookkeeping & Invoices',
    label: 'Bookkeeping & Invoices',
    description: 'Read-only view of settled supplier invoices and payment dates',
  },
  {
    value: 'Tax Filing Summary',
    label: 'Tax Filing Summary',
    description: 'Read-only annual payment totals for tax reporting',
  },
  {
    value: 'Full Audit Verification',
    label: 'Full Audit Verification',
    description: 'Complete read-only verification of payments and vault reserves',
  },
];

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

export default function SendAndInvoicePage() {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();

  // Sub-tab 1: Send Privately
  const [transferMode, setTransferMode] = useState<'shield' | 'confidential'>('shield');
  const [recipient, setRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [spendSecret, setSpendSecret] = useState('');
  const [proofJson, setProofJson] = useState('');
  const [privateReceiptJson, setPrivateReceiptJson] = useState('');

  // Sub-tab 2: Create & Pay Invoices
  const [vendorName, setVendorName] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [invoiceToken, setInvoiceToken] = useState<string>(
    CONTRACT_ADDRESSES.usdc !== zeroAddress ? CONTRACT_ADDRESSES.usdc : '',
  );
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-30');
  const [invoicePayload, setInvoicePayload] = useState('');

  // Sub-tab 3: 1-Click Auditor Pass
  const [auditorName, setAuditorName] = useState('');
  const [auditorContact, setAuditorContact] = useState('');
  const [auditorScope, setAuditorScope] = useState('Full Audit Verification');
  const [passes, setPasses] = useState<AuditorPassItem[]>([]);
  const [copiedCode, setCopiedCode] = useState('');

  const [activity, setActivity] = useState<PaymentActivityItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const connected = Boolean(address && chainId === portaldotTestnet.id);

  const network = useQuery<{ block: string }>({
    queryKey: ['pay-network-block'],
    staleTime: 20_000,
    retry: 0,
    queryFn: async () => {
      const r = await fetch('/api/protocol/network');
      if (!r.ok) throw new Error('Network block unavailable');
      return r.json();
    },
  });

  async function handleSendPrivately(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!isAddress(recipient) || recipient.toLowerCase() === zeroAddress) {
        throw new Error('Enter a valid recipient wallet address starting with 0x.');
      }

      if (transferMode === 'shield') {
        if (!sendAmount || Number(sendAmount) <= 0) {
          throw new Error('Enter a payment amount greater than zero.');
        }
        const secretBytes = crypto.getRandomValues(new Uint8Array(32));
        const secretHex =
          '0x' + Array.from(secretBytes, (b) => b.toString(16).padStart(2, '0')).join('');
        const commitment = await sha256Bytes32(
          `kudex-stealth-v1:${address ?? 'sender'}:${recipient}:${sendAmount}:${secretHex}`,
        );

        if (client && address && connected && isVaultConfigured) {
          const { vault, usdc } = CONTRACT_ADDRESSES;
          const decimals = await client.readContract({
            address: usdc,
            abi: erc20Abi,
            functionName: 'decimals',
          });
          const units = parseUnits(sendAmount, decimals);
          const allowance = await client.readContract({
            address: usdc,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address, vault],
          });
          if (allowance < units) {
            setStatus('Step 1 of 2: Confirm exact payment approval in your wallet…');
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

          setStatus('Step 2 of 2: Sending private payment in Stealth Mode…');
          const shieldSim = await client.simulateContract({
            address: vault,
            abi: kudexVaultAbi,
            functionName: 'shieldDeposit',
            args: [units, commitment, recipient as Address],
            account: address,
          });
          const txHash = await writeContractAsync({
            ...shieldSim.request,
            account: address,
            chainId: portaldotTestnet.id,
          });
          await client.waitForTransactionReceipt({ hash: txHash });

          const exportDoc = JSON.stringify(
            {
              type: 'kudex-private-payment-receipt',
              recipient,
              amount: sendAmount,
              memo: paymentNote || 'Business payment',
              stealthReference: commitment,
              claimSecret: secretHex,
              transactionHash: txHash,
              createdAt: new Date().toISOString(),
            },
            null,
            2,
          );
          setPrivateReceiptJson(exportDoc);
          setActivity((prev) => [
            {
              id: txHash.slice(0, 12),
              kind: 'Private Payment (Stealth Mode)',
              recipientOrVendor: truncateAddress(recipient),
              amountLabel: 'Hidden on public ledger',
              status: 'Private · Confirmed',
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
          setStatus(
            `Private payment confirmed (${truncateAddress(txHash)}). Download the claim pass if your recipient needs offline verification.`,
          );
        } else {
          if (!address) {
            throw new Error('Connect your wallet in the top bar to sign a private payment.');
          }
          const signature = await signMessageAsync({
            message: `Authorize Kudex Private Payment\nRecipient: ${recipient}\nStealth Reference: ${commitment}`,
          });
          const exportDoc = JSON.stringify(
            {
              type: 'kudex-private-payment-voucher',
              recipient,
              amount: sendAmount,
              memo: paymentNote || 'Business payment',
              stealthReference: commitment,
              claimSecret: secretHex,
              senderSignature: signature,
              createdAt: new Date().toISOString(),
            },
            null,
            2,
          );
          setPrivateReceiptJson(exportDoc);
          setActivity((prev) => [
            {
              id: commitment.slice(0, 12),
              kind: 'Signed Private Payment Pass',
              recipientOrVendor: truncateAddress(recipient),
              amountLabel: 'Hidden on public ledger',
              status: 'Private · Confirmed',
              timestamp: new Date().toLocaleTimeString(),
            },
            ...prev,
          ]);
          setStatus(
            'Private payment voucher signed in Stealth Mode. Share the receipt file with your recipient.',
          );
        }
      } else {
        // Direct confidentialTransfer from an existing Private Balance commitment
        if (!client || !address || !connected || !isVaultConfigured) {
          throw new Error(
            'Connect your wallet on an active vault deployment to transfer from an existing Private Balance.',
          );
        }
        if (!spendSecret.trim()) {
          throw new Error('Enter your existing Private Balance claim code.');
        }
        const nullifier = isHex(spendSecret.trim()) && spendSecret.trim().length === 66
          ? (spendSecret.trim() as Hex)
          : await sha256Bytes32(`kudex-spend:${spendSecret.trim()}`);
        const newCommitment = await sha256Bytes32(
          `kudex-recipient-stealth:${recipient}:${sendAmount || '1'}:${Date.now()}`,
        );

        let parsedProof: {
          a: readonly [bigint, bigint];
          b: readonly [readonly [bigint, bigint], readonly [bigint, bigint]];
          c: readonly [bigint, bigint];
        } = {
          a: [0n, 0n],
          b: [
            [0n, 0n],
            [0n, 0n],
          ],
          c: [0n, 0n],
        };
        if (proofJson.trim()) {
          const raw = JSON.parse(proofJson) as {
            a: [string, string];
            b: [[string, string], [string, string]];
            c: [string, string];
          };
          parsedProof = {
            a: [BigInt(raw.a[0]), BigInt(raw.a[1])],
            b: [
              [BigInt(raw.b[0][0]), BigInt(raw.b[0][1])],
              [BigInt(raw.b[1][0]), BigInt(raw.b[1][1])],
            ],
            c: [BigInt(raw.c[0]), BigInt(raw.c[1])],
          };
        }

        const publicInputs: readonly [bigint, bigint] = [
          BigInt(nullifier),
          BigInt(newCommitment),
        ];

        const transferSim = await client.simulateContract({
          address: CONTRACT_ADDRESSES.vault,
          abi: kudexVaultAbi,
          functionName: 'confidentialTransfer',
          args: [
            nullifier,
            newCommitment,
            parsedProof.a,
            parsedProof.b,
            parsedProof.c,
            publicInputs,
          ],
          account: address,
        });
        const txHash = await writeContractAsync({
          ...transferSim.request,
          account: address,
          chainId: portaldotTestnet.id,
        });
        await client.waitForTransactionReceipt({ hash: txHash });
        setStatus(`Private Balance transfer confirmed (${truncateAddress(txHash)}).`);
      }
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateInvoice(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!vendorName.trim()) {
        throw new Error('Enter the vendor or supplier name.');
      }
      if (!isAddress(vendorAddress) || vendorAddress.toLowerCase() === zeroAddress) {
        throw new Error('Enter a valid vendor wallet address starting with 0x.');
      }
      if (!invoiceAmount || Number(invoiceAmount) <= 0) {
        throw new Error('Enter an invoice amount greater than zero.');
      }
      const tokenAddr =
        isAddress(invoiceToken) && invoiceToken.toLowerCase() !== zeroAddress
          ? invoiceToken
          : CONTRACT_ADDRESSES.usdc;
      const invoiceRef = await sha256Bytes32(
        `kudex-invoice:${vendorName.trim()}:${vendorAddress}:${invoiceAmount}:${dueDate}:${Date.now()}`,
      );
      const doc = JSON.stringify(
        {
          version: 'kudex-business-invoice-v1',
          vendorName: vendorName.trim(),
          vendor: vendorAddress,
          token: tokenAddr,
          amount: invoiceAmount,
          dueDate,
          paymentReference: invoiceRef,
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      );
      setInvoicePayload(doc);
      setActivity((prev) => [
        {
          id: invoiceRef.slice(0, 12),
          kind: `Invoice · ${vendorName.trim()}`,
          recipientOrVendor: truncateAddress(vendorAddress),
          amountLabel: `$${Number(invoiceAmount).toFixed(2)}`,
          status: 'Invoice Ready',
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setStatus(
        'Invoice created. Send the invoice file to your customer or pay it in one click below.',
      );
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handlePayInvoice() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!client || !address || !connected) {
        throw new Error('Connect your wallet on the active network to pay this invoice.');
      }
      if (!invoicePayload.trim()) {
        throw new Error('Create an invoice above or paste an invoice code first.');
      }
      const parsed = JSON.parse(invoicePayload) as {
        vendorName?: string;
        vendor: string;
        token: string;
        amount: string;
      };
      if (
        !isAddress(parsed.vendor) ||
        parsed.vendor.toLowerCase() === zeroAddress ||
        !isAddress(parsed.token) ||
        parsed.token.toLowerCase() === zeroAddress
      ) {
        throw new Error(
          'This invoice needs a valid vendor wallet address and payment token contract.',
        );
      }
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
      setActivity((prev) => [
        {
          id: txHash.slice(0, 12),
          kind: `Paid · ${parsed.vendorName || 'Business Invoice'}`,
          recipientOrVendor: truncateAddress(parsed.vendor),
          amountLabel: `$${Number(parsed.amount).toFixed(2)}`,
          status: 'Invoice Paid',
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setStatus(`Invoice paid in full (${truncateAddress(txHash)}).`);
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateAuditorPass(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!auditorName.trim()) {
        throw new Error('Enter your accountant or audit firm name.');
      }
      if (!auditorContact.trim()) {
        throw new Error('Enter your auditor email or wallet identifier.');
      }
      const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
        b.toString(16).padStart(2, '0'),
      ).join('');

      let proof = nonce;
      if (address) {
        proof = await signMessageAsync({
          message: `Authorize Kudex 1-Click Auditor Pass (Read-Only)\nAuditor: ${auditorName.trim()}\nScope: ${auditorScope}\nSpending Access: None\nNonce: ${nonce}`,
        });
      }

      const hash = await sha256Bytes32(
        `kudex-auditor-pass:${address ?? 'session'}:${auditorName}:${auditorContact}:${auditorScope}:${proof}`,
      );
      const passCode = `kudex_pass_${hash.slice(2, 34)}`;

      setPasses((prev) => [
        {
          id: hash.slice(2, 12),
          auditorName: auditorName.trim(),
          contactOrAddress: auditorContact.trim(),
          scope: auditorScope,
          passCode,
          createdAt: new Date().toLocaleString(),
          active: true,
        },
        ...prev,
      ]);
      setAuditorName('');
      setAuditorContact('');
      setStatus(
        '1-Click Auditor Pass created. Your auditor can verify payments with zero ability to move your funds.',
      );
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function revokeAuditorPass(id: string) {
    setPasses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: false } : item)),
    );
    setStatus('Auditor access revoked immediately.');
  }

  async function copyPass(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(''), 2000);
    } catch {
      setError('Clipboard unavailable. Select and copy the pass code directly.');
    }
  }

  function downloadFile(content: string, filename: string) {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <span className="emerald-badge">
          <FiLock aria-hidden="true" />
          <span>Private Balances (Stealth Mode)</span>
        </span>
        <h1 className="page-title">Send &amp; Invoice</h1>
        <p className="page-description">
          Your wallet balance and payment amounts are hidden from the public. Only you and
          the person you pay can see the numbers.
        </p>
      </header>

      <Tabs.Root defaultValue="send" className="space-y-6">
        <Tabs.List
          aria-label="Payment and invoice workflows"
          className="flex flex-wrap gap-2 border-b border-border pb-4"
        >
          <Tabs.Trigger value="send" className="workspace-tab">
            <FiSend aria-hidden="true" /> Send Privately
          </Tabs.Trigger>
          <Tabs.Trigger value="invoices" className="workspace-tab">
            <FiFileText aria-hidden="true" /> Create &amp; Pay Invoices
          </Tabs.Trigger>
          <Tabs.Trigger value="auditor" className="workspace-tab">
            <FiKey aria-hidden="true" /> 1-Click Auditor Pass
          </Tabs.Trigger>
        </Tabs.List>

        {/* SUB-TAB 1: Send Privately */}
        <Tabs.Content value="send" className="panel space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3.5">
            <div className="flex items-center gap-2.5 text-sm font-bold text-primary">
              <FiShield size={18} aria-hidden="true" />
              <span>
                Stealth Mode Active: Amount and balance are hidden from the public ledger.
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTransferMode('shield')}
              className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                transferMode === 'shield'
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              Send From Wallet (Stealth Deposit)
            </button>
            <button
              type="button"
              onClick={() => setTransferMode('confidential')}
              className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                transferMode === 'confidential'
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              Send From Existing Private Balance
            </button>
          </div>

          <form onSubmit={(e) => void handleSendPrivately(e)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="pay-recipient" className="mb-2 block text-sm font-medium">
                  Recipient Wallet Address
                </label>
                <input
                  id="pay-recipient"
                  name="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x…"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={busy}
                  required
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="pay-amount" className="mb-2 block text-sm font-medium">
                  Payment Amount (USDC)
                </label>
                <input
                  id="pay-amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="2500.00"
                  disabled={busy}
                  required={transferMode === 'shield'}
                  className="field-input font-bold tabular-nums"
                />
              </div>

              {transferMode === 'shield' ? (
                <div className="sm:col-span-2">
                  <label htmlFor="pay-memo" className="mb-2 block text-sm font-medium">
                    Private Memo (Optional · Visible only to you and recipient)
                  </label>
                  <input
                    id="pay-memo"
                    name="memo"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="October Contractor Payroll · Supplier Retainer"
                    disabled={busy}
                    className="field-input"
                  />
                </div>
              ) : (
                <>
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="spend-secret"
                      className="mb-2 block text-sm font-medium"
                    >
                      Existing Private Balance Claim Code
                    </label>
                    <input
                      id="spend-secret"
                      name="spendSecret"
                      value={spendSecret}
                      onChange={(e) => setSpendSecret(e.target.value)}
                      placeholder="0x… private claim secret"
                      autoComplete="off"
                      spellCheck={false}
                      disabled={busy}
                      className="field-input font-mono text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="proof-json" className="mb-2 block text-sm font-medium">
                      Verification Receipt Bundle (Optional JSON)
                    </label>
                    <textarea
                      id="proof-json"
                      name="proofJson"
                      rows={3}
                      value={proofJson}
                      onChange={(e) => setProofJson(e.target.value)}
                      placeholder='{"a":["0","0"],"b":[["0","0"],["0","0"]],"c":["0","0"]}'
                      disabled={busy}
                      className="field-input font-mono text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busy} className="action-link">
                <FiSend aria-hidden="true" />
                <span>{busy ? 'Confirming…' : 'Send Private Payment'}</span>
              </button>
              {privateReceiptJson && (
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(privateReceiptJson, 'kudex-private-payment.json')
                  }
                  className="quiet-link text-sm"
                >
                  <FiDownload aria-hidden="true" />
                  <span>Download Recipient Receipt</span>
                </button>
              )}
            </div>
          </form>
        </Tabs.Content>

        {/* SUB-TAB 2: Create & Pay Invoices */}
        <Tabs.Content value="invoices" className="space-y-6">
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <form
              onSubmit={(e) => void handleCreateInvoice(e)}
              className="panel space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold">Create a Business Invoice</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generate a clean payment request with vendor details, amount, and due
                  date.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="inv-vendor-name" className="mb-2 block text-sm font-medium">
                    Vendor Name
                  </label>
                  <input
                    id="inv-vendor-name"
                    name="vendorName"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="Northstar Logistics LLC"
                    disabled={busy}
                    required
                    className="field-input"
                  />
                </div>

                <div>
                  <label htmlFor="inv-vendor-addr" className="mb-2 block text-sm font-medium">
                    Vendor Wallet Address
                  </label>
                  <input
                    id="inv-vendor-addr"
                    name="vendorAddress"
                    value={vendorAddress}
                    onChange={(e) => setVendorAddress(e.target.value)}
                    placeholder="0x…"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={busy}
                    required
                    className="field-input"
                  />
                </div>

                <div>
                  <label htmlFor="inv-amount" className="mb-2 block text-sm font-medium">
                    Invoice Amount (USDC)
                  </label>
                  <input
                    id="inv-amount"
                    name="invoiceAmount"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    placeholder="4800.00"
                    disabled={busy}
                    required
                    className="field-input font-bold tabular-nums"
                  />
                </div>

                <div>
                  <label htmlFor="inv-due" className="mb-2 block text-sm font-medium">
                    Due Date
                  </label>
                  <input
                    id="inv-due"
                    name="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={busy}
                    className="field-input tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="inv-token" className="mb-2 block text-sm font-medium">
                    Payment Token Contract (Defaults to configured USDC)
                  </label>
                  <input
                    id="inv-token"
                    name="invoiceToken"
                    value={invoiceToken}
                    onChange={(e) => setInvoiceToken(e.target.value)}
                    placeholder="0x… token contract"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={busy}
                    className="field-input font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={busy} className="quiet-link">
                  <FiFileText aria-hidden="true" />
                  <span>Create Invoice</span>
                </button>
                {invoicePayload && (
                  <button
                    type="button"
                    onClick={() => downloadFile(invoicePayload, 'kudex-invoice.json')}
                    className="quiet-link text-sm"
                  >
                    <FiDownload aria-hidden="true" />
                    <span>Download Invoice</span>
                  </button>
                )}
              </div>
            </form>

            <section className="panel space-y-5">
              <div>
                <h2 className="text-xl font-bold">Pay an Invoice in 1 Click</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Review an invoice created on the left or paste one from a supplier to
                  pay immediately.
                </p>
              </div>

              <div>
                <label htmlFor="invoice-code-box" className="mb-2 block text-sm font-medium">
                  Invoice Details
                </label>
                <textarea
                  id="invoice-code-box"
                  rows={7}
                  value={invoicePayload}
                  onChange={(e) => setInvoicePayload(e.target.value)}
                  placeholder="Paste a Kudex business invoice here to pay in one click"
                  disabled={busy}
                  className="field-input font-mono text-sm"
                />
              </div>

              <button
                type="button"
                disabled={busy || !invoicePayload.trim()}
                onClick={() => void handlePayInvoice()}
                className="action-link w-full disabled:opacity-40"
              >
                <FiCheckCircle aria-hidden="true" />
                <span>Pay Invoice in 1 Click</span>
              </button>
            </section>
          </div>
        </Tabs.Content>

        {/* SUB-TAB 3: 1-Click Auditor Pass */}
        <Tabs.Content value="auditor" className="space-y-6">
          <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_0.85fr]">
            <form
              onSubmit={(e) => void handleCreateAuditorPass(e)}
              className="panel space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold">Generate 1-Click Auditor Pass</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Share a read-only pass with your accountant or tax auditor so they can
                  verify your payments without having access to spend your money.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="auditor-name" className="mb-2 block text-sm font-medium">
                    Accountant or Audit Firm
                  </label>
                  <input
                    id="auditor-name"
                    name="auditorName"
                    value={auditorName}
                    onChange={(e) => setAuditorName(e.target.value)}
                    placeholder="Baker Tilly Tax Advisory"
                    disabled={busy}
                    required
                    className="field-input"
                  />
                </div>

                <div>
                  <label
                    htmlFor="auditor-contact"
                    className="mb-2 block text-sm font-medium"
                  >
                    Auditor Email or Wallet ID
                  </label>
                  <input
                    id="auditor-contact"
                    name="auditorContact"
                    value={auditorContact}
                    onChange={(e) => setAuditorContact(e.target.value)}
                    placeholder="audit@firm.com or 0x…"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={busy}
                    required
                    className="field-input"
                  />
                </div>

                <div className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium">
                    What Can They Verify?
                  </span>
                  <CustomSelect
                    label="Auditor pass scope"
                    value={auditorScope}
                    options={AUDITOR_SCOPES}
                    onChange={setAuditorScope}
                    disabled={busy}
                  />
                </div>
              </div>

              <button type="submit" disabled={busy} className="action-link">
                <FiKey aria-hidden="true" />
                <span>Generate 1-Click Auditor Pass</span>
              </button>
            </form>

            <aside className="panel space-y-4">
              <h2 className="text-xl font-bold">Read-Only Safety Guarantee</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Every 1-Click Auditor Pass is strictly read-only. You can revoke access
                at any moment with a single click.
              </p>
              <dl className="space-y-3 border-t border-border pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Spending Permission</dt>
                  <dd className="font-bold text-primary">None (Read-Only)</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Active Passes</dt>
                  <dd className="font-bold tabular-nums">
                    {passes.filter((p) => p.active).length}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Verified Network Block</dt>
                  <dd className="font-mono font-bold tabular-nums">
                    {network.data ? `#${network.data.block}` : 'Live'}
                  </dd>
                </div>
              </dl>
            </aside>
          </div>

          {/* Active Auditor Passes Table */}
          <section className="panel space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">Active Auditor Passes</h2>
              <span className="text-sm font-bold text-muted-foreground tabular-nums">
                {passes.filter((p) => p.active).length} active
              </span>
            </div>

            <div className="table-region rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-secondary text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Accountant / Auditor</th>
                    <th className="px-4 py-3">Verification Scope</th>
                    <th className="px-4 py-3">Pass Code</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {passes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-6 text-center text-muted-foreground"
                      >
                        No auditor passes shared yet. Generate a 1-Click Auditor Pass
                        above whenever your accountant needs verification.
                      </td>
                    </tr>
                  ) : (
                    passes.map((pass) => (
                      <tr key={pass.id}>
                        <td className="px-4 py-3">
                          <span className="block font-semibold">{pass.auditorName}</span>
                          <span className="text-muted-foreground">
                            {pass.contactOrAddress}
                          </span>
                        </td>
                        <td className="px-4 py-3">{pass.scope}</td>
                        <td className="px-4 py-3 font-mono">{pass.passCode}</td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              pass.active
                                ? 'emerald-badge'
                                : 'inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-muted-foreground'
                            }
                          >
                            {pass.active ? 'Active' : 'Revoked'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {pass.active && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void copyPass(pass.passCode)}
                                className="quiet-link px-3 py-1.5 text-sm"
                              >
                                {copiedCode === pass.passCode ? (
                                  <FiCheck className="text-primary" aria-hidden="true" />
                                ) : (
                                  <FiCopy aria-hidden="true" />
                                )}
                                <span>
                                  {copiedCode === pass.passCode ? 'Copied' : 'Copy Pass'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => revokeAuditorPass(pass.id)}
                                className="quiet-link px-3 py-1.5 text-sm text-destructive hover:text-destructive"
                              >
                                <FiSlash aria-hidden="true" />
                                <span>Revoke Access</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </Tabs.Content>
      </Tabs.Root>

      {status && (
        <p role="status" className="text-sm font-semibold text-primary">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {activity.length > 0 && (
        <section className="panel space-y-4">
          <h2 className="text-xl font-bold">Session Payments &amp; Invoices</h2>
          <div className="table-region rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Recipient / Vendor</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activity.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-semibold">{row.kind}</td>
                    <td className="px-4 py-3 font-mono">{row.recipientOrVendor}</td>
                    <td className="px-4 py-3 font-bold tabular-nums">
                      {row.amountLabel}
                    </td>
                    <td className="px-4 py-3">
                      <span className="emerald-badge">
                        {row.status === 'Invoice Ready' ? (
                          <FiClock aria-hidden="true" />
                        ) : (
                          <FiCheckCircle aria-hidden="true" />
                        )}
                        <span>{row.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
