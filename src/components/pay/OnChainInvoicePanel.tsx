'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  isHex,
  keccak256,
  parseEventLogs,
  parseUnits,
  toBytes,
  zeroAddress,
  type Address,
  type Hex,
} from 'viem';
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiDownload,
  FiFileText,
  FiLock,
  FiRefreshCw,
  FiUsers,
} from 'react-icons/fi';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import {
  CONTRACT_ADDRESSES,
  isInvoiceEscrowConfigured,
  isVaultConfigured,
} from '@/lib/contracts/addresses';
import { kudexInvoiceEscrowAbi } from '@/lib/contracts/abis';
import {
  buildNoteSyncDomainMessage,
  createPrivateNoteMetadata,
  deriveNoteEncryptionKey,
  encryptNoteMetadata,
  usePrivateNotesStore,
} from '@/lib/crypto/noteSync';
import { LIVE_ACTIVITY_QUERY_KEY } from '@/lib/hooks/useLiveActivity';
import { type SavedContact } from '@/lib/payroll/csvParser';
import { BusinessLookupBar } from './BusinessDirectoryPanel';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';

const STATUS_LABELS: Record<number, string> = {
  0: 'Pending Team Sign-Off',
  1: 'Approved & Payable',
  2: 'Settled On-Chain',
  3: 'Cancelled',
};

export interface RecordedInvoiceActivity {
  id: string;
  kind: string;
  recipientAddress: string;
  numericAmount: string;
  reference: string;
  status: 'Private · Confirmed' | 'Invoice Ready' | 'Invoice Paid';
  timestampIso: string;
  commitment: Hex;
  transactionHash?: Hex;
}

export function OnChainInvoicePanel({
  initialInvoiceId,
  savedContacts,
  prefillVendorName,
  prefillVendorAddress,
  onInvoiceActivity,
}: {
  initialInvoiceId?: string;
  savedContacts: SavedContact[];
  prefillVendorName?: string;
  prefillVendorAddress?: string;
  onInvoiceActivity: (entry: RecordedInvoiceActivity) => void;
}) {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const privateNotes = usePrivateNotesStore();

  const [vendorName, setVendorName] = useState(prefillVendorName ?? '');
  const [vendorAddress, setVendorAddress] = useState(prefillVendorAddress ?? '');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-30');
  const [designatedPayer, setDesignatedPayer] = useState('');
  const [approversText, setApproversText] = useState('');
  const [invoiceToken, setInvoiceToken] = useState<string>(
    CONTRACT_ADDRESSES.usdc !== zeroAddress ? CONTRACT_ADDRESSES.usdc : '',
  );

  const [activeInvoiceId, setActiveInvoiceId] = useState<string>(
    initialInvoiceId && isHex(initialInvoiceId) && initialInvoiceId.length === 66
      ? initialInvoiceId
      : '',
  );
  const [invoicePayload, setInvoicePayload] = useState('');
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const connected = Boolean(address && chainId === portaldotTestnet.id);

  useEffect(() => {
    if (prefillVendorName) setVendorName(prefillVendorName);
    if (prefillVendorAddress) setVendorAddress(prefillVendorAddress);
  }, [prefillVendorName, prefillVendorAddress]);

  useEffect(() => {
    if (initialInvoiceId && isHex(initialInvoiceId) && initialInvoiceId.length === 66) {
      setActiveInvoiceId(initialInvoiceId);
    }
  }, [initialInvoiceId]);

  const validActiveId =
    isHex(activeInvoiceId.trim()) && activeInvoiceId.trim().length === 66
      ? (activeInvoiceId.trim() as Hex)
      : null;

  const liveInvoiceQuery = useQuery({
    queryKey: [
      'onchain-invoice-detail',
      CONTRACT_ADDRESSES.invoiceEscrow,
      validActiveId,
      address,
    ],
    enabled: isInvoiceEscrowConfigured && Boolean(client && validActiveId),
    staleTime: 6_000,
    queryFn: async () => {
      const [exists, invoice] = await client!.readContract({
        address: CONTRACT_ADDRESSES.invoiceEscrow,
        abi: kudexInvoiceEscrowAbi,
        functionName: 'tryGetInvoice',
        args: [validActiveId!],
      });
      if (!exists) return null;

      let decimals = 6;
      let symbol = 'USDC';
      try {
        const [d, s] = await Promise.all([
          client!.readContract({
            address: invoice.token,
            abi: erc20Abi,
            functionName: 'decimals',
          }),
          client!.readContract({
            address: invoice.token,
            abi: erc20Abi,
            functionName: 'symbol',
          }),
        ]);
        decimals = Number(d);
        symbol = s;
      } catch {
        decimals = 6;
      }

      const [feeWaiver, effectiveFee, userRequiredApprover, userAlreadyApproved] =
        address
          ? await Promise.all([
              client!.readContract({
                address: CONTRACT_ADDRESSES.invoiceEscrow,
                abi: kudexInvoiceEscrowAbi,
                functionName: 'hasFeeWaiver',
                args: [address, invoice.issuer],
              }),
              client!.readContract({
                address: CONTRACT_ADDRESSES.invoiceEscrow,
                abi: kudexInvoiceEscrowAbi,
                functionName: 'effectiveInvoiceFee',
                args: [validActiveId!, address],
              }),
              client!.readContract({
                address: CONTRACT_ADDRESSES.invoiceEscrow,
                abi: kudexInvoiceEscrowAbi,
                functionName: 'isRequiredApprover',
                args: [validActiveId!, address],
              }),
              client!.readContract({
                address: CONTRACT_ADDRESSES.invoiceEscrow,
                abi: kudexInvoiceEscrowAbi,
                functionName: 'hasApproved',
                args: [validActiveId!, address],
              }),
            ])
          : [false, 0n, false, false];

      return {
        invoice,
        decimals,
        symbol,
        feeWaiver,
        effectiveFee,
        userRequiredApprover,
        userAlreadyApproved,
      };
    },
  });

  const accountInvoicesQuery = useQuery({
    queryKey: [
      'account-onchain-invoices',
      CONTRACT_ADDRESSES.invoiceEscrow,
      address,
    ],
    enabled: isInvoiceEscrowConfigured && Boolean(client && address),
    staleTime: 8_000,
    queryFn: async () => {
      const ids = await client!.readContract({
        address: CONTRACT_ADDRESSES.invoiceEscrow,
        abi: kudexInvoiceEscrowAbi,
        functionName: 'getInvoicesForAccount',
        args: [address!],
      });
      const recentIds = [...ids].reverse().slice(0, 12);
      const records = await Promise.all(
        recentIds.map(async (id) => {
          const inv = await client!.readContract({
            address: CONTRACT_ADDRESSES.invoiceEscrow,
            abi: kudexInvoiceEscrowAbi,
            functionName: 'getInvoice',
            args: [id],
          });
          return inv;
        }),
      );
      return records;
    },
  });

  async function refreshInvoices() {
    await Promise.all([
      liveInvoiceQuery.refetch(),
      accountInvoicesQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: [LIVE_ACTIVITY_QUERY_KEY] }),
    ]);
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
      const effectiveVendor = vendorAddress.trim() || address || '';
      if (!isAddress(effectiveVendor) || effectiveVendor.toLowerCase() === zeroAddress) {
        throw new Error('Enter a valid vendor wallet address starting with 0x.');
      }
      if (!invoiceAmount || Number(invoiceAmount) <= 0) {
        throw new Error('Enter an invoice amount greater than zero.');
      }

      const payerAddr: Address = designatedPayer.trim()
        ? isAddress(designatedPayer.trim())
          ? (designatedPayer.trim() as Address)
          : (() => {
              throw new Error('Designated payer must be a valid 0x wallet address.');
            })()
        : zeroAddress;

      const parsedApprovers: Address[] = approversText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((addr) => {
          if (!isAddress(addr) || addr.toLowerCase() === zeroAddress) {
            throw new Error(`Invalid team approver address: ${addr}`);
          }
          return addr as Address;
        });

      const tokenAddr: Address =
        isAddress(invoiceToken) && invoiceToken.toLowerCase() !== zeroAddress
          ? (invoiceToken as Address)
          : CONTRACT_ADDRESSES.usdc;

      const dueMs = Date.parse(`${dueDate}T23:59:59Z`);
      const dueTimestamp = BigInt(
        Number.isFinite(dueMs) && dueMs > 0
          ? Math.floor(dueMs / 1000)
          : Math.floor(Date.now() / 1000) + 30 * 86_400,
      );

      const encryptedReference = keccak256(
        toBytes(`kudex-invoice:${vendorName.trim()}:${dueDate}:${invoiceAmount}`),
      );
      const nowIso = new Date().toISOString();

      if (
        isInvoiceEscrowConfigured &&
        connected &&
        client &&
        address &&
        tokenAddr !== zeroAddress
      ) {
        const decimals = await client.readContract({
          address: tokenAddr,
          abi: erc20Abi,
          functionName: 'decimals',
        });
        const amountUnits = parseUnits(invoiceAmount, decimals);

        setStatus('Publishing invoice to On-Chain Invoice Escrow…');
        const sim = await client.simulateContract({
          address: CONTRACT_ADDRESSES.invoiceEscrow,
          abi: kudexInvoiceEscrowAbi,
          functionName: 'createInvoice',
          args: [
            `0x${'0'.repeat(64)}` as Hex,
            payerAddr,
            tokenAddr,
            amountUnits,
            dueTimestamp,
            encryptedReference,
            parsedApprovers,
          ],
          account: address,
        });
        const txHash = await writeContractAsync({
          ...sim.request,
          account: address,
          chainId: portaldotTestnet.id,
        });
        const receipt = await client.waitForTransactionReceipt({ hash: txHash });

        const createdLogs = parseEventLogs({
          abi: kudexInvoiceEscrowAbi,
          eventName: 'InvoiceCreated',
          logs: receipt.logs,
        });
        const createdId = createdLogs[0]?.args.invoiceId ?? sim.result;

        setActiveInvoiceId(createdId);
        const shareUrl =
          typeof window !== 'undefined'
            ? `${window.location.origin}/app/pay?invoiceId=${createdId}`
            : `/app/pay?invoiceId=${createdId}`;

        const doc = JSON.stringify(
          {
            version: 'kudex-onchain-invoice-v2',
            invoiceId: createdId,
            issuer: address,
            vendorName: vendorName.trim(),
            payer: payerAddr,
            token: tokenAddr,
            amount: invoiceAmount,
            dueDate,
            requiredApprovers: parsedApprovers,
            shareableUrl: shareUrl,
            transactionHash: txHash,
            createdAt: nowIso,
          },
          null,
          2,
        );
        setInvoicePayload(doc);

        onInvoiceActivity({
          id: createdId.slice(0, 12),
          kind: `On-Chain Invoice · ${vendorName.trim()}`,
          recipientAddress: address,
          numericAmount: invoiceAmount,
          reference: `Invoice Due ${dueDate}`,
          status: 'Invoice Ready',
          timestampIso: nowIso,
          commitment: createdId,
          transactionHash: txHash,
        });

        await refreshInvoices();
        setStatus(
          `On-chain invoice created (${truncateAddress(createdId)}). Share the link or pay in 1 click on the right.`,
        );
      } else {
        // Offline / unconfigured preview mode so invoice export & Auditor Pass verification remain operable before wallet connection
        const draftId = keccak256(
          toBytes(
            `kudex-draft-invoice:${vendorName.trim()}:${effectiveVendor}:${invoiceAmount}:${Date.now()}`,
          ),
        );
        const doc = JSON.stringify(
          {
            version: 'kudex-business-invoice-v1',
            invoiceId: draftId,
            vendorName: vendorName.trim(),
            vendor: effectiveVendor,
            payer: payerAddr,
            token: tokenAddr,
            amount: invoiceAmount,
            dueDate,
            requiredApprovers: parsedApprovers,
            paymentReference: draftId,
            createdAt: nowIso,
          },
          null,
          2,
        );
        setInvoicePayload(doc);

        onInvoiceActivity({
          id: draftId.slice(0, 12),
          kind: `Invoice · ${vendorName.trim()}`,
          recipientAddress: effectiveVendor,
          numericAmount: invoiceAmount,
          reference: `Invoice Due ${dueDate}`,
          status: 'Invoice Ready',
          timestampIso: nowIso,
          commitment: draftId,
        });

        setStatus(
          'Invoice created. Connect your wallet on an active escrow deployment to anchor multi-approver sign-offs on-chain, or share this invoice directly.',
        );
      }
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleApproveOnChainInvoice() {
    if (!validActiveId) return;
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!address || !connected || !client || !isInvoiceEscrowConfigured) {
        throw new Error('Connect an authorized approver wallet to sign off on this invoice.');
      }
      setStatus('Recording team sign-off approval on-chain…');
      const sim = await client.simulateContract({
        address: CONTRACT_ADDRESSES.invoiceEscrow,
        abi: kudexInvoiceEscrowAbi,
        functionName: 'approveInvoice',
        args: [validActiveId],
        account: address,
      });
      const txHash = await writeContractAsync({
        ...sim.request,
        account: address,
        chainId: portaldotTestnet.id,
      });
      await client.waitForTransactionReceipt({ hash: txHash });
      await refreshInvoices();
      setStatus(`Team sign-off recorded on-chain (${truncateAddress(txHash)}).`);
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleSettleOnChainInvoice(confidential: boolean) {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (!address || !connected || !client) {
        throw new Error('Connect your wallet on the active network to pay this invoice.');
      }

      if (validActiveId && isInvoiceEscrowConfigured && liveInvoiceQuery.data) {
        const { invoice, decimals, symbol } = liveInvoiceQuery.data;
        const escrowAddr = CONTRACT_ADDRESSES.invoiceEscrow;

        const allowance = await client.readContract({
          address: invoice.token,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address, escrowAddr],
        });
        if (allowance < invoice.amount) {
          setStatus('Step 1 of 2: Approve exact invoice payment in your wallet…');
          const approveSim = await client.simulateContract({
            address: invoice.token,
            abi: erc20Abi,
            functionName: 'approve',
            args: [escrowAddr, invoice.amount],
            account: address,
          });
          const approveHash = await writeContractAsync({
            ...approveSim.request,
            account: address,
            chainId: portaldotTestnet.id,
          });
          await client.waitForTransactionReceipt({ hash: approveHash });
        }

        let txHash: Hex;
        let commitment: Hex = validActiveId;
        const humanAmt = formatUnits(invoice.amount, decimals);

        if (confidential) {
          if (!isVaultConfigured) {
            throw new Error('Business vault must be configured for Stealth Mode settlement.');
          }
          setStatus('Deriving encryption key for Stealth Mode invoice settlement…');
          const sig = await signMessageAsync({
            message: buildNoteSyncDomainMessage(address),
          });
          const key = await deriveNoteEncryptionKey(sig);
          const note = await createPrivateNoteMetadata({
            owner: address,
            recipient: invoice.issuer,
            value: humanAmt,
            decimals,
            assetSymbol: symbol,
            memo: `Confidential Invoice ${truncateAddress(validActiveId)}`,
          });
          const encryptedMemo = await encryptNoteMetadata(key, note);
          commitment = note.commitment as Hex;

          setStatus('Step 2 of 2: Settling invoice privately into KudexVault…');
          const sim = await client.simulateContract({
            address: escrowAddr,
            abi: kudexInvoiceEscrowAbi,
            functionName: 'payInvoiceConfidential',
            args: [validActiveId, commitment, encryptedMemo],
            account: address,
          });
          txHash = await writeContractAsync({
            ...sim.request,
            account: address,
            chainId: portaldotTestnet.id,
          });
          await client.waitForTransactionReceipt({ hash: txHash });
          privateNotes.recordLocalNote(note, txHash);
        } else {
          setStatus('Step 2 of 2: Settling invoice on-chain in 1 click…');
          const sim = await client.simulateContract({
            address: escrowAddr,
            abi: kudexInvoiceEscrowAbi,
            functionName: 'payInvoice',
            args: [validActiveId],
            account: address,
          });
          txHash = await writeContractAsync({
            ...sim.request,
            account: address,
            chainId: portaldotTestnet.id,
          });
          await client.waitForTransactionReceipt({ hash: txHash });
        }

        const nowIso = new Date().toISOString();
        onInvoiceActivity({
          id: txHash.slice(0, 12),
          kind: confidential
            ? 'Paid Privately · On-Chain Invoice'
            : 'Paid · On-Chain Invoice',
          recipientAddress: invoice.issuer,
          numericAmount: humanAmt,
          reference: `Settled Invoice ${truncateAddress(validActiveId)}`,
          status: 'Invoice Paid',
          timestampIso: nowIso,
          commitment,
          transactionHash: txHash,
        });

        await refreshInvoices();
        setStatus(`Invoice settled on-chain (${truncateAddress(txHash)}).`);
        return;
      }

      // Fallback JSON invoice settlement when a legacy JSON payload was pasted
      if (!invoicePayload.trim()) {
        throw new Error('Load an on-chain Invoice ID or create an invoice first.');
      }
      const parsed = JSON.parse(invoicePayload) as {
        invoiceId?: string;
        vendorName?: string;
        vendor?: string;
        issuer?: string;
        token: string;
        amount: string;
      };
      const payee = parsed.vendor || parsed.issuer || '';
      if (
        !isAddress(payee) ||
        payee.toLowerCase() === zeroAddress ||
        !isAddress(parsed.token) ||
        parsed.token.toLowerCase() === zeroAddress
      ) {
        throw new Error('Invoice requires a valid vendor wallet and token contract.');
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
        args: [payee as Address, units],
        account: address,
      });
      const txHash = await writeContractAsync({
        ...sim.request,
        account: address,
        chainId: portaldotTestnet.id,
      });
      await client.waitForTransactionReceipt({ hash: txHash });

      const nowIso = new Date().toISOString();
      const commitment =
        parsed.invoiceId && isHex(parsed.invoiceId) && parsed.invoiceId.length === 66
          ? (parsed.invoiceId as Hex)
          : txHash;
      onInvoiceActivity({
        id: txHash.slice(0, 12),
        kind: `Paid · ${parsed.vendorName || 'Business Invoice'}`,
        recipientAddress: payee,
        numericAmount: parsed.amount,
        reference: `Settled Invoice ${parsed.vendorName || ''}`.trim(),
        status: 'Invoice Paid',
        timestampIso: nowIso,
        commitment,
        transactionHash: txHash,
      });
      setStatus(`Invoice paid in full (${truncateAddress(txHash)}).`);
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function copyShareLink(invoiceId: Hex) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/app/pay?invoiceId=${invoiceId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedShareLink(true);
      window.setTimeout(() => setCopiedShareLink(false), 2000);
    } catch {
      setError('Clipboard unavailable. Copy the Invoice ID directly.');
    }
  }

  function downloadInvoiceJson() {
    if (!invoicePayload) return;
    const url = URL.createObjectURL(
      new Blob([invoicePayload], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kudex-invoice.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  const liveDetail = liveInvoiceQuery.data;

  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {/* LEFT: Create On-Chain Business Invoice */}
        <form
          onSubmit={(e) => void handleCreateInvoice(e)}
          className="panel min-w-0 space-y-5"
        >
          <div>
            <h2 className="text-xl font-bold">Create a Business Invoice</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Publish a verifiable invoice on-chain with optional CFO/CEO multi-approver
              sign-off and shareable 1-click payment link.
            </p>
          </div>

          <BusinessLookupBar
            label="Lookup Verified Business Handle"
            onSelectBusiness={(biz) => {
              setVendorName(biz.businessName);
              setVendorAddress(biz.payoutAddress);
            }}
          />

          {savedContacts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {savedContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    setVendorName(contact.name);
                    setVendorAddress(contact.address);
                  }}
                  className="min-h-10 rounded-xl border border-border bg-secondary px-3 py-1.5 text-sm font-semibold transition hover:border-primary"
                >
                  {contact.name}
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
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

            <div className="min-w-0">
              <label htmlFor="inv-vendor-addr" className="mb-2 block text-sm font-medium">
                Vendor Wallet Address
              </label>
              <input
                id="inv-vendor-addr"
                name="vendorAddress"
                value={vendorAddress}
                onChange={(e) => setVendorAddress(e.target.value)}
                placeholder={address ?? '0x…'}
                autoComplete="off"
                spellCheck={false}
                disabled={busy}
                required={!address}
                className="field-input font-mono text-sm"
              />
            </div>

            <div className="min-w-0">
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

            <div className="min-w-0">
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

            <div className="min-w-0 sm:col-span-2">
              <label htmlFor="inv-payer" className="mb-2 block text-sm font-medium">
                Designated Payer Wallet (Optional · Leave blank for open payable link)
              </label>
              <input
                id="inv-payer"
                value={designatedPayer}
                onChange={(e) => setDesignatedPayer(e.target.value)}
                placeholder="0x… customer wallet (optional)"
                spellCheck={false}
                disabled={busy}
                className="field-input font-mono text-sm"
              />
            </div>

            <div className="min-w-0 sm:col-span-2">
              <label htmlFor="inv-approvers" className="mb-2 block text-sm font-medium">
                Team Sign-Off Approvers (Optional · Comma-separated CFO / CEO wallets)
              </label>
              <input
                id="inv-approvers"
                value={approversText}
                onChange={(e) => setApproversText(e.target.value)}
                placeholder="0xCFO…, 0xCEO… (leave blank for instant 1-click payment)"
                spellCheck={false}
                disabled={busy}
                className="field-input font-mono text-sm"
              />
            </div>

            <div className="min-w-0 sm:col-span-2">
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
            <button type="submit" disabled={busy} className="action-link disabled:opacity-40">
              <FiFileText aria-hidden="true" />
              <span>{busy ? 'Creating Invoice…' : 'Create Invoice'}</span>
            </button>
            {invoicePayload && (
              <button
                type="button"
                onClick={downloadInvoiceJson}
                className="quiet-link text-sm"
              >
                <FiDownload aria-hidden="true" />
                <span>Download Invoice</span>
              </button>
            )}
          </div>
        </form>

        {/* RIGHT: Live On-Chain Invoice Inspector & 1-Click Settlement */}
        <section className="panel min-w-0 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold">Pay or Approve On-Chain Invoice</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Load any escrowed Invoice ID (`0x…`) or open a shareable
                `/app/pay?invoiceId=…` link to sign off or settle in 1 click.
              </p>
            </div>
            {validActiveId && (
              <button
                type="button"
                onClick={() => void liveInvoiceQuery.refetch()}
                disabled={liveInvoiceQuery.isFetching}
                aria-label="Refresh invoice status"
                className="quiet-link px-3 py-1.5 text-sm"
              >
                <FiRefreshCw
                  className={liveInvoiceQuery.isFetching ? 'animate-spin' : ''}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          <div>
            <label htmlFor="onchain-invoice-id" className="mb-2 block text-sm font-medium">
              On-Chain Invoice ID (`0x…` 32-byte identifier)
            </label>
            <input
              id="onchain-invoice-id"
              value={activeInvoiceId}
              onChange={(e) => setActiveInvoiceId(e.target.value)}
              placeholder="0x… paste on-chain invoiceId"
              spellCheck={false}
              disabled={busy}
              className="field-input font-mono text-sm"
            />
          </div>

          {liveDetail ? (
            <div className="rounded-2xl border border-primary/40 bg-secondary/60 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="emerald-badge">
                  {Number(liveDetail.invoice.status) === 2 ? (
                    <FiCheckCircle aria-hidden="true" />
                  ) : (
                    <FiClock aria-hidden="true" />
                  )}
                  <span>
                    {STATUS_LABELS[Number(liveDetail.invoice.status)] ?? 'On-Chain'}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => void copyShareLink(liveDetail.invoice.invoiceId)}
                  className="quiet-link px-3 py-1 text-sm"
                >
                  {copiedShareLink ? (
                    <FiCheck className="text-primary" aria-hidden="true" />
                  ) : (
                    <FiCopy aria-hidden="true" />
                  )}
                  <span>{copiedShareLink ? 'Link Copied' : 'Copy Shareable Link'}</span>
                </button>
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Amount Due</dt>
                  <dd className="text-xl font-bold text-primary tabular-nums">
                    {Number(
                      formatUnits(liveDetail.invoice.amount, liveDetail.decimals),
                    ).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {liveDetail.symbol}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Settlement Fee</dt>
                  <dd className="font-bold text-foreground tabular-nums">
                    {liveDetail.feeWaiver
                      ? '0.00% (POT Fee-Free Member)'
                      : `${formatUnits(
                          liveDetail.effectiveFee,
                          liveDetail.decimals,
                        )} ${liveDetail.symbol}`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Issuer Wallet</dt>
                  <dd className="font-mono text-foreground">
                    {truncateAddress(liveDetail.invoice.issuer)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Team Sign-Off Approvals</dt>
                  <dd className="font-bold text-foreground tabular-nums">
                    {liveDetail.invoice.requiredApprovers.length === 0
                      ? 'None Required (Instant Pay)'
                      : `${liveDetail.invoice.approvalCount.toString()} / ${
                          liveDetail.invoice.requiredApprovers.length
                        } Signed`}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2.5 pt-1">
                {Number(liveDetail.invoice.status) === 0 &&
                  liveDetail.userRequiredApprover &&
                  !liveDetail.userAlreadyApproved && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleApproveOnChainInvoice()}
                      className="action-link text-sm disabled:opacity-40"
                    >
                      <FiUsers aria-hidden="true" />
                      <span>Approve Invoice (Team Sign-Off)</span>
                    </button>
                  )}

                {Number(liveDetail.invoice.status) === 1 && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleSettleOnChainInvoice(false)}
                      className="action-link text-sm disabled:opacity-40"
                    >
                      <FiCheckCircle aria-hidden="true" />
                      <span>Pay Invoice in 1 Click</span>
                    </button>

                    <button
                      type="button"
                      disabled={busy || !isVaultConfigured}
                      onClick={() => void handleSettleOnChainInvoice(true)}
                      className="quiet-link text-sm disabled:opacity-40"
                    >
                      <FiLock className="text-primary" aria-hidden="true" />
                      <span>Pay Privately via Vault</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="invoice-code-box"
                  className="mb-2 block text-sm font-medium"
                >
                  Invoice Details
                </label>
                <textarea
                  id="invoice-code-box"
                  rows={5}
                  value={invoicePayload}
                  onChange={(e) => setInvoicePayload(e.target.value)}
                  placeholder="Create an invoice on the left or paste a shared invoice JSON / ID to pay in 1 click"
                  disabled={busy}
                  className="field-input font-mono text-sm"
                />
              </div>

              <button
                type="button"
                disabled={busy || (!invoicePayload.trim() && !validActiveId)}
                onClick={() => void handleSettleOnChainInvoice(false)}
                className="action-link w-full disabled:opacity-40"
              >
                <FiCheckCircle aria-hidden="true" />
                <span>Pay Invoice in 1 Click</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Connected Account's Live On-Chain Invoices */}
      {accountInvoicesQuery.data && accountInvoicesQuery.data.length > 0 && (
        <section className="panel space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold">Your On-Chain Escrowed Invoices</h3>
            <span className="text-sm font-bold text-muted-foreground tabular-nums">
              {accountInvoicesQuery.data.length} indexed
            </span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Account on-chain invoices"
            className="table-region rounded-xl border border-border"
          >
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Invoice ID</th>
                  <th className="px-4 py-3">Issuer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Approvals</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accountInvoicesQuery.data.map((inv) => (
                  <tr key={inv.invoiceId}>
                    <td className="px-4 py-3 font-mono">
                      {truncateAddress(inv.invoiceId)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {truncateAddress(inv.issuer)}
                    </td>
                    <td className="px-4 py-3 font-bold text-primary tabular-nums">
                      {Number(formatUnits(inv.amount, 6)).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      USDC
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {inv.requiredApprovers.length === 0
                        ? 'Auto'
                        : `${inv.approvalCount.toString()}/${inv.requiredApprovers.length}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="emerald-badge">
                        {STATUS_LABELS[Number(inv.status)] ?? 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setActiveInvoiceId(inv.invoiceId)}
                        className="quiet-link px-3 py-1.5 text-sm"
                      >
                        Inspect &amp; Pay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {status && (
        <p role="status" className="text-sm font-semibold text-primary">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
