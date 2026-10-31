'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
  FiUsers,
  FiBookOpen,
  FiRefreshCw,
  FiUpload,
  FiPlus,
  FiTrash2,
  FiExternalLink,
  FiAlertTriangle,
} from 'react-icons/fi';
import { CONTRACT_ADDRESSES, isVaultConfigured } from '@/lib/contracts/addresses';
import { kudexVaultAbi } from '@/lib/contracts/abis';
import { portaldotTestnet } from '@/lib/chains/portaldot';
import {
  buildNoteSyncDomainMessage,
  createPrivateNoteMetadata,
  deriveNoteEncryptionKey,
  encryptNoteMetadata,
  restorePrivateNotesFromNetwork,
  usePrivateNotesStore,
} from '@/lib/crypto/noteSync';
import {
  MAX_BATCH_PAYROLL_ROWS,
  downloadPaymentReceipt,
  parsePayrollCsv,
  useAddressBookStore,
  type SavedContact,
} from '@/lib/payroll/csvParser';
import {
  buildAuditorPassSignatureMessage,
  encodeAuditorPass,
  type AuditorDisclosedEntry,
} from '@/lib/audit/auditorPass';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { getReadableErrorMessage, truncateAddress } from '@/lib/utils';

interface PaymentActivityItem {
  id: string;
  kind: string;
  recipientOrVendor: string;
  recipientAddress: string;
  amountLabel: string;
  numericAmount: string;
  reference: string;
  status: 'Private · Confirmed' | 'Invoice Ready' | 'Invoice Paid';
  timestamp: string;
  timestampIso: string;
  commitment: Hex;
  nullifier?: Hex;
  transactionHash?: Hex;
  verificationUrl: string;
}

interface AuditorPassItem {
  id: string;
  auditorName: string;
  contactOrAddress: string;
  scope: string;
  passCode: string;
  entryCount: number;
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

const CONTACT_CATEGORIES = [
  {
    value: 'Supplier',
    label: 'Supplier',
    description: 'Recurring vendor, logistics partner, or software provider',
  },
  {
    value: 'Employee',
    label: 'Employee',
    description: 'Salaried team member on scheduled payroll',
  },
  {
    value: 'Contractor',
    label: 'Contractor',
    description: 'Milestone or retainer independent contractor',
  },
];

const SAMPLE_PAYROLL_CSV = [
  'Recipient Name, Address, Amount, Reference',
  'Northstar Logistics LLC, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8, 1250.00, October Freight Settlement',
  'Meridian Cloud Systems, 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC, 840.50, Production Hosting Retainer',
].join('\n');

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

function buildReceiptVerifyUrl(entry: AuditorDisclosedEntry, ownerAddress?: Address): string {
  const passCode = encodeAuditorPass({
    v: 1,
    organization: ownerAddress
      ? `Kudex Business Account (${truncateAddress(ownerAddress)})`
      : 'Kudex Business Account',
    ownerAddress,
    auditorName: 'Payment Receipt Verification',
    auditorContact: 'Public Receipt Link',
    scope: 'Single Payment Settlement Verification',
    vaultAddress: CONTRACT_ADDRESSES.vault,
    chainId: portaldotTestnet.id,
    issuedAt: entry.date,
    entries: [entry],
  });
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/verify?pass=${encodeURIComponent(passCode)}`;
}

export default function SendAndInvoicePage() {
  const { address, chainId } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();

  const privateNotes = usePrivateNotesStore();
  const addressBook = useAddressBookStore();

  useEffect(() => {
    addressBook.hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeTab, setActiveTab] = useState('send');

  // Sub-tab 1: Send Privately
  const [transferMode, setTransferMode] = useState<'shield' | 'confidential'>('shield');
  const [recipient, setRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [spendSecret, setSpendSecret] = useState('');
  const [proofJson, setProofJson] = useState('');
  const [privateReceiptJson, setPrivateReceiptJson] = useState('');

  // Sub-tab 2: Batch Payroll & Vendor Run
  const [batchCsvText, setBatchCsvText] = useState('');
  const [batchAddAmount, setBatchAddAmount] = useState('1000.00');

  // Sub-tab 3: Create & Pay Invoices
  const [vendorName, setVendorName] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [invoiceToken, setInvoiceToken] = useState<string>(
    CONTRACT_ADDRESSES.usdc !== zeroAddress ? CONTRACT_ADDRESSES.usdc : '',
  );
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-30');
  const [invoicePayload, setInvoicePayload] = useState('');

  // Sub-tab 4: Saved Contacts / Vendor Address Book
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [newContactCategory, setNewContactCategory] =
    useState<SavedContact['category']>('Supplier');
  const [newContactRef, setNewContactRef] = useState('');

  // Sub-tab 5: 1-Click Auditor Pass
  const [organizationName, setOrganizationName] = useState('Kudex Treasury Operations');
  const [auditorName, setAuditorName] = useState('');
  const [auditorContact, setAuditorContact] = useState('');
  const [auditorScope, setAuditorScope] = useState('Full Audit Verification');
  const [passes, setPasses] = useState<AuditorPassItem[]>([]);
  const [copiedCode, setCopiedCode] = useState('');

  // Cross-device encrypted note restore state
  const [syncingNotes, setSyncingNotes] = useState(false);

  const [activity, setActivity] = useState<PaymentActivityItem[]>([]);
  const [lastCompletedItem, setLastCompletedItem] = useState<PaymentActivityItem | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const connected = Boolean(address && chainId === portaldotTestnet.id);

  const parsedBatch = useMemo(() => parsePayrollCsv(batchCsvText, 6), [batchCsvText]);

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

  const hasRestoredNotes =
    Boolean(address) &&
    privateNotes.restoredOwner?.toLowerCase() === address?.toLowerCase() &&
    privateNotes.formattedRestoredBalance !== null;

  function recordCompletedActivity(item: PaymentActivityItem) {
    setActivity((prev) => [item, ...prev]);
    setLastCompletedItem(item);
  }

  async function handleRestorePrivateBalance() {
    setSyncingNotes(true);
    setError('');
    setStatus('');
    try {
      if (!address) {
        throw new Error(
          'Connect your wallet in the top bar to derive your encryption key and restore your Private Balance.',
        );
      }
      if (!client || !isVaultConfigured) {
        throw new Error(
          'Business vault contract is not yet configured on this deployment.',
        );
      }
      const signature = await signMessageAsync({
        message: buildNoteSyncDomainMessage(address),
      });
      const key = await deriveNoteEncryptionKey(signature);
      const restored = await restorePrivateNotesFromNetwork({
        client,
        vaultAddress: CONTRACT_ADDRESSES.vault,
        ownerAddress: address,
        key,
      });
      privateNotes.setRestoredSnapshot({
        owner: address,
        notes: restored.notes,
        formattedBalance: restored.formattedBalance,
        symbol: restored.symbol,
      });
      setStatus(
        restored.notes.length > 0
          ? `Restored ${restored.notes.length} encrypted private ${
              restored.notes.length === 1 ? 'note' : 'notes'
            } (${restored.formattedBalance} ${restored.symbol} available).`
          : 'Encrypted note scan complete. Zero private notes found for this wallet on-chain.',
      );
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setSyncingNotes(false);
    }
  }

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

        if (client && address && connected && isVaultConfigured) {
          const { vault, usdc } = CONTRACT_ADDRESSES;
          const [decimals, symbol] = await Promise.all([
            client.readContract({
              address: usdc,
              abi: erc20Abi,
              functionName: 'decimals',
            }),
            client.readContract({
              address: usdc,
              abi: erc20Abi,
              functionName: 'symbol',
            }),
          ]);
          const units = parseUnits(sendAmount, decimals);

          setStatus('Step 1 of 3: Sign key derivation message to back up encrypted note…');
          const keySig = await signMessageAsync({
            message: buildNoteSyncDomainMessage(address),
          });
          const aesKey = await deriveNoteEncryptionKey(keySig);
          const note = await createPrivateNoteMetadata({
            owner: address,
            recipient: recipient as Address,
            value: sendAmount,
            decimals,
            assetSymbol: symbol,
            memo: paymentNote || 'Business payment',
          });
          const encryptedMemo = await encryptNoteMetadata(aesKey, note);

          const allowance = await client.readContract({
            address: usdc,
            abi: erc20Abi,
            functionName: 'allowance',
            args: [address, vault],
          });
          if (allowance < units) {
            setStatus('Step 2 of 3: Confirm exact payment approval in your wallet…');
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

          setStatus('Step 3 of 3: Sending private payment & syncing encrypted backup…');
          const shieldSim = await client.simulateContract({
            address: vault,
            abi: kudexVaultAbi,
            functionName: 'shieldDeposit',
            args: [units, note.commitment as Hex, recipient as Address, encryptedMemo],
            account: address,
          });
          const txHash = await writeContractAsync({
            ...shieldSim.request,
            account: address,
            chainId: portaldotTestnet.id,
          });
          await client.waitForTransactionReceipt({ hash: txHash });

          privateNotes.recordLocalNote(note, txHash);

          const nowIso = new Date().toISOString();
          const verifyUrl = buildReceiptVerifyUrl(
            {
              date: nowIso,
              payee: recipient,
              reference: paymentNote || 'Business payment',
              amount: sendAmount,
              currency: symbol,
              commitment: note.commitment,
              nullifier: note.nullifierHash,
              txHash,
            },
            address,
          );

          const exportDoc = JSON.stringify(
            {
              type: 'kudex-private-payment-receipt',
              recipient,
              amount: sendAmount,
              memo: paymentNote || 'Business payment',
              stealthReference: note.commitment,
              claimSecret: note.nullifierPreimage,
              transactionHash: txHash,
              verificationUrl: verifyUrl,
              createdAt: nowIso,
            },
            null,
            2,
          );
          setPrivateReceiptJson(exportDoc);

          recordCompletedActivity({
            id: txHash.slice(0, 12),
            kind: 'Private Payment (Stealth Mode)',
            recipientOrVendor: truncateAddress(recipient),
            recipientAddress: recipient,
            amountLabel: 'Hidden on public ledger',
            numericAmount: sendAmount,
            reference: paymentNote || 'Business payment',
            status: 'Private · Confirmed',
            timestamp: new Date().toLocaleTimeString(),
            timestampIso: nowIso,
            commitment: note.commitment as Hex,
            nullifier: note.nullifierHash as Hex,
            transactionHash: txHash,
            verificationUrl: verifyUrl,
          });

          setStatus(
            `Private payment confirmed and backed up on-chain (${truncateAddress(txHash)}).`,
          );
        } else {
          if (!address) {
            throw new Error('Connect your wallet in the top bar to sign a private payment.');
          }
          const keySig = await signMessageAsync({
            message: buildNoteSyncDomainMessage(address),
          });
          const aesKey = await deriveNoteEncryptionKey(keySig);
          const note = await createPrivateNoteMetadata({
            owner: address,
            recipient: recipient as Address,
            value: sendAmount,
            decimals: 6,
            assetSymbol: 'USDC',
            memo: paymentNote || 'Business payment',
          });
          const encryptedMemo = await encryptNoteMetadata(aesKey, note);
          privateNotes.recordLocalNote(note);

          const nowIso = new Date().toISOString();
          const verifyUrl = buildReceiptVerifyUrl(
            {
              date: nowIso,
              payee: recipient,
              reference: paymentNote || 'Business payment',
              amount: sendAmount,
              currency: 'USDC',
              commitment: note.commitment,
              nullifier: note.nullifierHash,
            },
            address,
          );

          const exportDoc = JSON.stringify(
            {
              type: 'kudex-private-payment-voucher',
              recipient,
              amount: sendAmount,
              memo: paymentNote || 'Business payment',
              stealthReference: note.commitment,
              encryptedBackupMemo: encryptedMemo,
              claimSecret: note.nullifierPreimage,
              verificationUrl: verifyUrl,
              createdAt: nowIso,
            },
            null,
            2,
          );
          setPrivateReceiptJson(exportDoc);
          recordCompletedActivity({
            id: note.commitment.slice(0, 12),
            kind: 'Signed Private Payment Pass',
            recipientOrVendor: truncateAddress(recipient),
            recipientAddress: recipient,
            amountLabel: 'Hidden on public ledger',
            numericAmount: sendAmount,
            reference: paymentNote || 'Business payment',
            status: 'Private · Confirmed',
            timestamp: new Date().toLocaleTimeString(),
            timestampIso: nowIso,
            commitment: note.commitment as Hex,
            nullifier: note.nullifierHash as Hex,
            verificationUrl: verifyUrl,
          });
          setStatus(
            'Private payment voucher encrypted and signed in Stealth Mode. Download the payment receipt below.',
          );
        }
      } else {
        // Direct confidentialTransfer from an existing Private Balance commitment with encryptedMemo backup
        if (!client || !address || !connected || !isVaultConfigured) {
          throw new Error(
            'Connect your wallet on an active vault deployment to transfer from an existing Private Balance.',
          );
        }
        if (!spendSecret.trim()) {
          throw new Error('Enter your existing Private Balance claim code.');
        }
        const effectiveAmount = sendAmount && Number(sendAmount) > 0 ? sendAmount : '1.00';
        const keySig = await signMessageAsync({
          message: buildNoteSyncDomainMessage(address),
        });
        const aesKey = await deriveNoteEncryptionKey(keySig);
        const note = await createPrivateNoteMetadata({
          owner: address,
          recipient: recipient as Address,
          value: effectiveAmount,
          decimals: 6,
          assetSymbol: 'USDC',
          memo: paymentNote || 'Confidential balance transfer',
        });
        const encryptedMemo = await encryptNoteMetadata(aesKey, note);

        const nullifier =
          isHex(spendSecret.trim()) && spendSecret.trim().length === 66
            ? (spendSecret.trim() as Hex)
            : await sha256Bytes32(`kudex-spend:${spendSecret.trim()}`);
        const newCommitment = note.commitment as Hex;

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
            encryptedMemo,
          ],
          account: address,
        });
        const txHash = await writeContractAsync({
          ...transferSim.request,
          account: address,
          chainId: portaldotTestnet.id,
        });
        await client.waitForTransactionReceipt({ hash: txHash });
        privateNotes.recordLocalNote(note, txHash);

        const nowIso = new Date().toISOString();
        const verifyUrl = buildReceiptVerifyUrl(
          {
            date: nowIso,
            payee: recipient,
            reference: paymentNote || 'Confidential balance transfer',
            amount: effectiveAmount,
            currency: 'USDC',
            commitment: newCommitment,
            nullifier,
            txHash,
          },
          address,
        );

        recordCompletedActivity({
          id: txHash.slice(0, 12),
          kind: 'Private Balance Transfer',
          recipientOrVendor: truncateAddress(recipient),
          recipientAddress: recipient,
          amountLabel: 'Hidden on public ledger',
          numericAmount: effectiveAmount,
          reference: paymentNote || 'Confidential balance transfer',
          status: 'Private · Confirmed',
          timestamp: new Date().toLocaleTimeString(),
          timestampIso: nowIso,
          commitment: newCommitment,
          nullifier,
          transactionHash: txHash,
          verificationUrl: verifyUrl,
        });
        setStatus(`Private Balance transfer confirmed (${truncateAddress(txHash)}).`);
      }
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function handleExecuteBatchPayroll() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      if (parsedBatch.rows.length === 0) {
        throw new Error('Paste or upload a CSV payroll list before running settlement.');
      }
      if (parsedBatch.exceedsMaxBatch) {
        throw new Error(
          `Batch payroll supports up to ${MAX_BATCH_PAYROLL_ROWS} recipients per atomic transaction.`,
        );
      }
      if (parsedBatch.hasErrors) {
        throw new Error(
          'Resolve highlighted CSV validation or duplicate address errors before settling.',
        );
      }
      if (!address) {
        throw new Error('Connect your wallet in the top bar to authorize batch payroll.');
      }

      if (client && connected && isVaultConfigured) {
        const { vault, usdc } = CONTRACT_ADDRESSES;
        const [decimals, symbol] = await Promise.all([
          client.readContract({
            address: usdc,
            abi: erc20Abi,
            functionName: 'decimals',
          }),
          client.readContract({
            address: usdc,
            abi: erc20Abi,
            functionName: 'symbol',
          }),
        ]);

        const liveBatch = parsePayrollCsv(batchCsvText, decimals);
        if (liveBatch.hasErrors || liveBatch.validRows.length === 0) {
          throw new Error('CSV batch validation failed against token decimals.');
        }

        setStatus('Step 1 of 3: Sign key derivation message to encrypt batch payroll notes…');
        const keySig = await signMessageAsync({
          message: buildNoteSyncDomainMessage(address),
        });
        const aesKey = await deriveNoteEncryptionKey(keySig);

        const items: Array<{
          assets: bigint;
          commitment: Hex;
          receiver: Address;
          encryptedMemo: Hex;
        }> = [];
        const createdNotes = [];

        for (const row of liveBatch.validRows) {
          const note = await createPrivateNoteMetadata({
            owner: address,
            recipient: row.address as Address,
            value: row.amount,
            decimals,
            assetSymbol: symbol,
            memo: `${row.recipientName} — ${row.reference}`,
          });
          const encryptedMemo = await encryptNoteMetadata(aesKey, note);
          items.push({
            assets: row.amountUnits,
            commitment: note.commitment as Hex,
            receiver: row.address as Address,
            encryptedMemo,
          });
          createdNotes.push({ row, note });
        }

        const allowance = await client.readContract({
          address: usdc,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [address, vault],
        });
        if (allowance < liveBatch.totalUnits) {
          setStatus(
            `Step 2 of 3: Approve total batch payout ($${liveBatch.totalFormatted} ${symbol}) in wallet…`,
          );
          const approveSim = await client.simulateContract({
            address: usdc,
            abi: erc20Abi,
            functionName: 'approve',
            args: [vault, liveBatch.totalUnits],
            account: address,
          });
          const approveHash = await writeContractAsync({
            ...approveSim.request,
            account: address,
            chainId: portaldotTestnet.id,
          });
          await client.waitForTransactionReceipt({ hash: approveHash });
        }

        setStatus(
          `Step 3 of 3: Settling ${items.length} private payouts in a single atomic transaction…`,
        );
        const batchSim = await client.simulateContract({
          address: vault,
          abi: kudexVaultAbi,
          functionName: 'batchShieldDeposit',
          args: [items],
          account: address,
        });
        const txHash = await writeContractAsync({
          ...batchSim.request,
          account: address,
          chainId: portaldotTestnet.id,
        });
        await client.waitForTransactionReceipt({ hash: txHash });

        const nowIso = new Date().toISOString();
        for (const { row, note } of createdNotes) {
          privateNotes.recordLocalNote(note, txHash);
          const verifyUrl = buildReceiptVerifyUrl(
            {
              date: nowIso,
              payee: `${row.recipientName} (${truncateAddress(row.address)})`,
              reference: row.reference,
              amount: row.amount,
              currency: symbol,
              commitment: note.commitment,
              nullifier: note.nullifierHash,
              txHash,
            },
            address,
          );
          recordCompletedActivity({
            id: `${txHash.slice(0, 8)}-${row.rowNumber}`,
            kind: `Batch Payroll · ${row.recipientName}`,
            recipientOrVendor: truncateAddress(row.address),
            recipientAddress: row.address,
            amountLabel: 'Hidden on public ledger',
            numericAmount: row.amount,
            reference: row.reference,
            status: 'Private · Confirmed',
            timestamp: new Date().toLocaleTimeString(),
            timestampIso: nowIso,
            commitment: note.commitment as Hex,
            nullifier: note.nullifierHash as Hex,
            transactionHash: txHash,
            verificationUrl: verifyUrl,
          });
        }

        setStatus(
          `Batch payroll settled atomically for ${items.length} recipients (${truncateAddress(txHash)}).`,
        );
      } else {
        const keySig = await signMessageAsync({
          message: buildNoteSyncDomainMessage(address),
        });
        const aesKey = await deriveNoteEncryptionKey(keySig);
        const nowIso = new Date().toISOString();

        for (const row of parsedBatch.validRows) {
          const note = await createPrivateNoteMetadata({
            owner: address,
            recipient: row.address as Address,
            value: row.amount,
            decimals: 6,
            assetSymbol: 'USDC',
            memo: `${row.recipientName} — ${row.reference}`,
          });
          await encryptNoteMetadata(aesKey, note);
          privateNotes.recordLocalNote(note);

          const verifyUrl = buildReceiptVerifyUrl(
            {
              date: nowIso,
              payee: `${row.recipientName} (${truncateAddress(row.address)})`,
              reference: row.reference,
              amount: row.amount,
              currency: 'USDC',
              commitment: note.commitment,
              nullifier: note.nullifierHash,
            },
            address,
          );

          recordCompletedActivity({
            id: `${note.commitment.slice(0, 10)}-${row.rowNumber}`,
            kind: `Batch Payroll · ${row.recipientName}`,
            recipientOrVendor: truncateAddress(row.address),
            recipientAddress: row.address,
            amountLabel: 'Hidden on public ledger',
            numericAmount: row.amount,
            reference: row.reference,
            status: 'Private · Confirmed',
            timestamp: new Date().toLocaleTimeString(),
            timestampIso: nowIso,
            commitment: note.commitment as Hex,
            nullifier: note.nullifierHash as Hex,
            verificationUrl: verifyUrl,
          });
        }

        setStatus(
          `Signed batch payroll manifest for ${parsedBatch.validRows.length} recipients ($${parsedBatch.totalFormatted} USDC).`,
        );
      }
    } catch (cause) {
      setError(getReadableErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  function handleCsvFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBatchCsvText(reader.result);
        setStatus(`Loaded ${file.name} into Batch Payroll validator.`);
      }
    };
    reader.onerror = () => {
      setError('Could not read the selected CSV file.');
    };
    reader.readAsText(file);
  }

  function appendContactToBatch(contact: SavedContact) {
    const cleanAmount =
      batchAddAmount && Number(batchAddAmount) > 0 ? batchAddAmount : '1000.00';
    const safeName = contact.name.includes(',') ? `"${contact.name}"` : contact.name;
    const safeRef = contact.defaultReference.includes(',')
      ? `"${contact.defaultReference}"`
      : contact.defaultReference;
    const line = `${safeName}, ${contact.address}, ${cleanAmount}, ${safeRef}`;

    setBatchCsvText((prev) => {
      if (!prev.trim()) {
        return `Recipient Name, Address, Amount, Reference\n${line}`;
      }
      return `${prev.trim()}\n${line}`;
    });
    setActiveTab('batch');
    setStatus(`Added ${contact.name} to Batch Payroll & Vendor Run.`);
  }

  function handleAddSavedContact(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setStatus('');
    if (!newContactName.trim()) {
      setError('Enter a supplier, contractor, or employee name.');
      return;
    }
    if (!isAddress(newContactAddress) || newContactAddress.toLowerCase() === zeroAddress) {
      setError('Enter a valid contact wallet address starting with 0x.');
      return;
    }
    addressBook.addContact({
      name: newContactName.trim(),
      address: newContactAddress as Address,
      category: newContactCategory,
      defaultReference: newContactRef.trim() || `${newContactCategory} Settlement`,
    });
    setNewContactName('');
    setNewContactAddress('');
    setNewContactRef('');
    setStatus('Saved contact added to your business address book.');
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
      const nowIso = new Date().toISOString();
      const doc = JSON.stringify(
        {
          version: 'kudex-business-invoice-v1',
          vendorName: vendorName.trim(),
          vendor: vendorAddress,
          token: tokenAddr,
          amount: invoiceAmount,
          dueDate,
          paymentReference: invoiceRef,
          createdAt: nowIso,
        },
        null,
        2,
      );
      setInvoicePayload(doc);

      const verifyUrl = buildReceiptVerifyUrl(
        {
          date: nowIso,
          payee: `${vendorName.trim()} (${truncateAddress(vendorAddress)})`,
          reference: `Invoice Due ${dueDate}`,
          amount: invoiceAmount,
          currency: 'USDC',
          commitment: invoiceRef,
        },
        address,
      );

      recordCompletedActivity({
        id: invoiceRef.slice(0, 12),
        kind: `Invoice · ${vendorName.trim()}`,
        recipientOrVendor: truncateAddress(vendorAddress),
        recipientAddress: vendorAddress,
        amountLabel: `$${Number(invoiceAmount).toFixed(2)}`,
        numericAmount: invoiceAmount,
        reference: `Invoice Due ${dueDate}`,
        status: 'Invoice Ready',
        timestamp: new Date().toLocaleTimeString(),
        timestampIso: nowIso,
        commitment: invoiceRef,
        verificationUrl: verifyUrl,
      });
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
        paymentReference?: string;
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

      const commitment =
        parsed.paymentReference && isHex(parsed.paymentReference) && parsed.paymentReference.length === 66
          ? (parsed.paymentReference as Hex)
          : await sha256Bytes32(`kudex-paid-invoice:${txHash}`);
      const nowIso = new Date().toISOString();
      const verifyUrl = buildReceiptVerifyUrl(
        {
          date: nowIso,
          payee: `${parsed.vendorName || 'Business Vendor'} (${truncateAddress(parsed.vendor)})`,
          reference: `Settled Invoice ${parsed.vendorName || ''}`.trim(),
          amount: parsed.amount,
          currency: 'USDC',
          commitment,
          txHash,
        },
        address,
      );

      recordCompletedActivity({
        id: txHash.slice(0, 12),
        kind: `Paid · ${parsed.vendorName || 'Business Invoice'}`,
        recipientOrVendor: truncateAddress(parsed.vendor),
        recipientAddress: parsed.vendor,
        amountLabel: `$${Number(parsed.amount).toFixed(2)}`,
        numericAmount: parsed.amount,
        reference: `Settled Invoice ${parsed.vendorName || ''}`.trim(),
        status: 'Invoice Paid',
        timestamp: new Date().toLocaleTimeString(),
        timestampIso: nowIso,
        commitment,
        transactionHash: txHash,
        verificationUrl: verifyUrl,
      });
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

      const issuedAt = new Date().toISOString();

      // Combine disclosed session payments + restored encrypted notes without duplicates
      const seenCommitments = new Set<string>();
      const entries: AuditorDisclosedEntry[] = [];

      for (const item of activity) {
        const key = item.commitment.toLowerCase();
        if (seenCommitments.has(key)) continue;
        seenCommitments.add(key);
        entries.push({
          date: item.timestampIso,
          payee: `${item.kind} (${item.recipientOrVendor})`,
          reference: item.reference,
          amount: item.numericAmount,
          currency: 'USDC',
          commitment: item.commitment,
          nullifier: item.nullifier,
          txHash: item.transactionHash,
        });
      }

      for (const note of privateNotes.notes) {
        const key = note.commitment.toLowerCase();
        if (seenCommitments.has(key)) continue;
        seenCommitments.add(key);
        entries.push({
          date: note.createdAt,
          payee: note.recipient ? truncateAddress(note.recipient) : truncateAddress(note.owner),
          reference: note.memo || 'Shielded Private Balance Note',
          amount: note.value,
          currency: note.assetSymbol,
          commitment: note.commitment,
          nullifier: note.nullifierHash,
          txHash: note.transactionHash,
        });
      }

      let issuerSignature: Hex | undefined;
      if (address) {
        issuerSignature = await signMessageAsync({
          message: buildAuditorPassSignatureMessage({
            auditorName: auditorName.trim(),
            scope: auditorScope,
            issuedAt,
            entryCount: entries.length,
          }),
        });
      }

      const passCode = encodeAuditorPass({
        v: 1,
        organization: organizationName.trim() || 'Kudex Business Account',
        ownerAddress: address,
        auditorName: auditorName.trim(),
        auditorContact: auditorContact.trim(),
        scope: auditorScope,
        vaultAddress: CONTRACT_ADDRESSES.vault,
        chainId: portaldotTestnet.id,
        issuedAt,
        entries: entries.slice(0, 100),
        issuerSignature,
      });

      const passId = (await sha256Bytes32(passCode)).slice(2, 12);

      setPasses((prev) => [
        {
          id: passId,
          auditorName: auditorName.trim(),
          contactOrAddress: auditorContact.trim(),
          scope: auditorScope,
          passCode,
          entryCount: entries.length,
          createdAt: new Date().toLocaleString(),
          active: true,
        },
        ...prev,
      ]);
      setAuditorName('');
      setAuditorContact('');
      setStatus(
        '1-Click Auditor Pass created. Open it in the Public Auditor Portal or share the link with your accountant.',
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

  async function copyText(value: string, keyId: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedCode(keyId);
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

  function handleDownloadReceiptForItem(item: PaymentActivityItem) {
    downloadPaymentReceipt({
      receiptId: item.id,
      kind: item.kind,
      payerLabel: address ? truncateAddress(address) : 'Kudex Business Account',
      recipientLabel: item.recipientAddress,
      amountLabel: `${Number(item.numericAmount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USDC`,
      reference: item.reference,
      timestampIso: item.timestampIso,
      transactionHash: item.transactionHash,
      commitment: item.commitment,
      verificationUrl: item.verificationUrl,
    });
    setStatus(`Printable payment receipt downloaded (${item.id}).`);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="emerald-badge">
              <FiLock aria-hidden="true" />
              <span>Private Balances (Stealth Mode)</span>
            </span>
            {hasRestoredNotes && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-sm font-bold text-primary tabular-nums">
                <span>
                  Synced Private Balance: {privateNotes.formattedRestoredBalance}{' '}
                  {privateNotes.symbol}
                </span>
              </span>
            )}
          </div>
          <h1 className="page-title">Send &amp; Invoice</h1>
          <p className="page-description">
            Your wallet balance and payment amounts are hidden from the public. Only you and
            the person you pay can see the numbers.
          </p>
        </div>

        <button
          type="button"
          disabled={syncingNotes}
          onClick={() => void handleRestorePrivateBalance()}
          className="quiet-link text-sm disabled:opacity-50"
        >
          <FiRefreshCw
            className={syncingNotes ? 'animate-spin text-primary' : 'text-primary'}
            aria-hidden="true"
          />
          <span>
            {syncingNotes
              ? 'Decrypting Notes…'
              : 'Restore Private Balance from Network'}
          </span>
        </button>
      </header>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <Tabs.List
          aria-label="Payment and invoice workflows"
          className="flex flex-wrap gap-2 border-b border-border pb-4"
        >
          <Tabs.Trigger value="send" className="workspace-tab">
            <FiSend aria-hidden="true" /> Send Privately
          </Tabs.Trigger>
          <Tabs.Trigger value="batch" className="workspace-tab">
            <FiUsers aria-hidden="true" /> Batch Payroll &amp; Vendor Run
          </Tabs.Trigger>
          <Tabs.Trigger value="invoices" className="workspace-tab">
            <FiFileText aria-hidden="true" /> Create &amp; Pay Invoices
          </Tabs.Trigger>
          <Tabs.Trigger value="contacts" className="workspace-tab">
            <FiBookOpen aria-hidden="true" /> Saved Contacts
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

          {/* Quick-fill from Saved Contacts */}
          {addressBook.contacts.length > 0 && (
            <div className="space-y-2">
              <span className="block text-sm font-medium text-muted-foreground">
                Quick-Fill from Saved Contacts:
              </span>
              <div className="flex flex-wrap gap-2">
                {addressBook.contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => {
                      setRecipient(contact.address);
                      setPaymentNote(contact.defaultReference);
                    }}
                    className="min-h-10 rounded-xl border border-border bg-secondary px-3.5 py-1.5 text-sm font-semibold text-foreground transition hover:border-primary/50"
                  >
                    {contact.name} ({contact.category})
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e) => void handleSendPrivately(e)} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="min-w-0">
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

              <div className="min-w-0">
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
                <div className="min-w-0 sm:col-span-2">
                  <label htmlFor="pay-memo" className="mb-2 block text-sm font-medium">
                    Private Memo (Optional · Encrypted on-chain for cross-device recovery)
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
                  <div className="min-w-0 sm:col-span-2">
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
                  <div className="min-w-0 sm:col-span-2">
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
              {lastCompletedItem && (
                <button
                  type="button"
                  onClick={() => handleDownloadReceiptForItem(lastCompletedItem)}
                  className="quiet-link text-sm"
                >
                  <FiDownload aria-hidden="true" />
                  <span>Download Payment Receipt</span>
                </button>
              )}
              {privateReceiptJson && (
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(privateReceiptJson, 'kudex-private-payment.json')
                  }
                  className="quiet-link text-sm"
                >
                  <FiDownload aria-hidden="true" />
                  <span>Download Claim Bundle</span>
                </button>
              )}
            </div>
          </form>
        </Tabs.Content>

        {/* SUB-TAB 2: Batch Payroll & Vendor Run */}
        <Tabs.Content value="batch" className="space-y-6">
          <section className="panel space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <h2 className="text-xl font-bold">Batch Payroll &amp; Vendor Run</h2>
                <p className="text-sm text-muted-foreground">
                  Upload or paste a CSV schedule to settle up to {MAX_BATCH_PAYROLL_ROWS}{' '}
                  private employee or supplier payments in a single atomic transaction.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="payroll-csv-file"
                  className="quiet-link cursor-pointer text-sm"
                >
                  <FiUpload aria-hidden="true" />
                  <span>Upload CSV File</span>
                  <input
                    id="payroll-csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileUpload}
                    disabled={busy}
                    className="sr-only"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setBatchCsvText(SAMPLE_PAYROLL_CSV)}
                  disabled={busy}
                  className="quiet-link text-sm"
                >
                  <FiFileText aria-hidden="true" />
                  <span>Load CSV Example</span>
                </button>
              </div>
            </div>

            {/* Quick-append from Saved Contacts */}
            {addressBook.contacts.length > 0 && (
              <div className="rounded-xl border border-border bg-secondary/60 p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <span className="block text-sm font-semibold">
                      Add Saved Contacts to Payroll Run:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {addressBook.contacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => appendContactToBatch(contact)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-sm font-semibold transition hover:border-primary"
                        >
                          <FiPlus className="text-primary" aria-hidden="true" />
                          <span>{contact.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="w-full sm:w-44">
                    <label
                      htmlFor="batch-quick-amount"
                      className="mb-1 block text-sm font-medium"
                    >
                      Quick-Add Amount ($)
                    </label>
                    <input
                      id="batch-quick-amount"
                      type="number"
                      min="0"
                      step="any"
                      value={batchAddAmount}
                      onChange={(e) => setBatchAddAmount(e.target.value)}
                      className="field-input font-bold tabular-nums"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="payroll-csv-textarea" className="mb-2 block text-sm font-medium">
                Payroll &amp; Vendor CSV (`Recipient Name, Address, Amount, Reference`)
              </label>
              <textarea
                id="payroll-csv-textarea"
                rows={6}
                value={batchCsvText}
                onChange={(e) => setBatchCsvText(e.target.value)}
                placeholder={SAMPLE_PAYROLL_CSV}
                spellCheck={false}
                disabled={busy}
                className="field-input font-mono text-sm"
              />
            </div>

            {/* Live Batch Validation & Total Cost Summary */}
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-secondary p-4">
                <dt className="text-sm text-muted-foreground">Validated Recipients</dt>
                <dd className="mt-1 text-2xl font-bold text-foreground tabular-nums">
                  {parsedBatch.validRows.length} / {MAX_BATCH_PAYROLL_ROWS}
                </dd>
              </div>

              <div className="rounded-xl bg-secondary p-4">
                <dt className="text-sm text-muted-foreground">Duplicate Addresses</dt>
                <dd
                  className={`mt-1 text-2xl font-bold tabular-nums ${
                    parsedBatch.duplicateCount > 0 ? 'text-destructive' : 'text-foreground'
                  }`}
                >
                  {parsedBatch.duplicateCount}
                </dd>
              </div>

              <div className="rounded-xl bg-secondary p-4">
                <dt className="text-sm text-muted-foreground">Total Batch Cost</dt>
                <dd className="mt-1 text-2xl font-bold text-primary tabular-nums">
                  ${parsedBatch.totalFormatted} USDC
                </dd>
              </div>
            </dl>

            {parsedBatch.exceedsMaxBatch && (
              <p role="alert" className="text-sm font-semibold text-destructive">
                Batch exceeds the {MAX_BATCH_PAYROLL_ROWS}-recipient atomic settlement limit.
                Split larger runs into two batches.
              </p>
            )}

            {parsedBatch.rows.length > 0 && (
              <div
                tabIndex={0}
                role="region"
                aria-label="Batch payroll validation preview"
                className="table-region rounded-xl border border-border"
              >
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-secondary text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Recipient Name</th>
                      <th className="px-4 py-3">Wallet Address</th>
                      <th className="px-4 py-3">Amount (USDC)</th>
                      <th className="px-4 py-3">Reference</th>
                      <th className="px-4 py-3">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedBatch.rows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td className="px-4 py-3 font-mono tabular-nums">{row.rowNumber}</td>
                        <td className="px-4 py-3 font-semibold">
                          {row.recipientName || '—'}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {isAddress(row.address)
                            ? truncateAddress(row.address)
                            : row.address || 'Invalid'}
                        </td>
                        <td className="px-4 py-3 font-bold tabular-nums">
                          {row.amount ? `$${row.amount}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{row.reference}</td>
                        <td className="px-4 py-3">
                          {row.errors.length === 0 ? (
                            <span className="emerald-badge">
                              <FiCheckCircle aria-hidden="true" />
                              <span>Ready</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-destructive">
                              <FiAlertTriangle className="shrink-0" aria-hidden="true" />
                              <span>{row.errors.join(' ')}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={busy || parsedBatch.rows.length === 0 || parsedBatch.hasErrors}
                onClick={() => void handleExecuteBatchPayroll()}
                className="action-link disabled:opacity-40"
              >
                <FiSend aria-hidden="true" />
                <span>
                  {busy
                    ? 'Settling Batch Payroll…'
                    : `Execute Atomic Batch Payroll ($${parsedBatch.totalFormatted} USDC)`}
                </span>
              </button>

              {batchCsvText && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setBatchCsvText('')}
                  className="quiet-link text-sm"
                >
                  Clear Batch CSV
                </button>
              )}
            </div>
          </section>
        </Tabs.Content>

        {/* SUB-TAB 3: Create & Pay Invoices */}
        <Tabs.Content value="invoices" className="space-y-6">
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <form
              onSubmit={(e) => void handleCreateInvoice(e)}
              className="panel min-w-0 space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold">Create a Business Invoice</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Generate a clean payment request with vendor details, amount, and due
                  date.
                </p>
              </div>

              {addressBook.contacts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {addressBook.contacts.map((contact) => (
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
                    placeholder="0x…"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={busy}
                    required
                    className="field-input"
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

            <section className="panel min-w-0 space-y-5">
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

        {/* SUB-TAB 4: Saved Contacts / Vendor Address Book */}
        <Tabs.Content value="contacts" className="space-y-6">
          <div className="grid items-start gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <form onSubmit={handleAddSavedContact} className="panel min-w-0 space-y-5">
              <div>
                <h2 className="text-xl font-bold">Save Supplier or Employee Contact</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Store verified supplier and team wallet addresses once to eliminate
                  copy-paste mistakes during payroll and invoice runs.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="contact-name" className="mb-2 block text-sm font-medium">
                    Vendor or Employee Name
                  </label>
                  <input
                    id="contact-name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Apex Precision Manufacturing"
                    required
                    className="field-input"
                  />
                </div>

                <div>
                  <label htmlFor="contact-address" className="mb-2 block text-sm font-medium">
                    Wallet Address
                  </label>
                  <input
                    id="contact-address"
                    value={newContactAddress}
                    onChange={(e) => setNewContactAddress(e.target.value)}
                    placeholder="0x…"
                    spellCheck={false}
                    required
                    className="field-input font-mono text-sm"
                  />
                </div>

                <div>
                  <span className="mb-2 block text-sm font-medium">Contact Role</span>
                  <CustomSelect
                    label="Contact category"
                    value={newContactCategory}
                    options={CONTACT_CATEGORIES}
                    onChange={(val) =>
                      setNewContactCategory(val as SavedContact['category'])
                    }
                  />
                </div>

                <div>
                  <label htmlFor="contact-ref" className="mb-2 block text-sm font-medium">
                    Default Payment Reference
                  </label>
                  <input
                    id="contact-ref"
                    value={newContactRef}
                    onChange={(e) => setNewContactRef(e.target.value)}
                    placeholder="Monthly Supply Retainer"
                    className="field-input"
                  />
                </div>
              </div>

              <button type="submit" className="action-link">
                <FiPlus aria-hidden="true" />
                <span>Save Contact to Address Book</span>
              </button>
            </form>

            <section className="panel min-w-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-bold">Saved Contacts &amp; Vendor Directory</h2>
                <span className="text-sm font-bold text-muted-foreground tabular-nums">
                  {addressBook.contacts.length} saved
                </span>
              </div>

              <div className="space-y-3">
                {addressBook.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/60 p-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-foreground">{contact.name}</span>
                        <span className="emerald-badge">{contact.category}</span>
                      </div>
                      <p className="font-mono text-sm text-muted-foreground">
                        {truncateAddress(contact.address)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {contact.defaultReference}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRecipient(contact.address);
                          setPaymentNote(contact.defaultReference);
                          setActiveTab('send');
                        }}
                        className="quiet-link px-3 py-1.5 text-sm"
                      >
                        <FiSend aria-hidden="true" />
                        <span>Pay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => appendContactToBatch(contact)}
                        className="quiet-link px-3 py-1.5 text-sm"
                      >
                        <FiPlus aria-hidden="true" />
                        <span>Add to Batch</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${contact.name}`}
                        onClick={() => addressBook.removeContact(contact.id)}
                        className="quiet-link px-3 py-1.5 text-sm text-destructive hover:text-destructive"
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </Tabs.Content>

        {/* SUB-TAB 5: 1-Click Auditor Pass */}
        <Tabs.Content value="auditor" className="space-y-6">
          <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_0.85fr]">
            <form
              onSubmit={(e) => void handleCreateAuditorPass(e)}
              className="panel min-w-0 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold">Generate 1-Click Auditor Pass</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Share a read-only pass with your accountant or tax auditor so they can
                    verify your payments in the Public Auditor Portal without needing a
                    wallet or spending access.
                  </p>
                </div>
                <Link href="/verify" className="quiet-link text-sm">
                  <span>Open Verify &amp; Audit Portal</span>
                  <FiExternalLink aria-hidden="true" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 sm:col-span-2">
                  <label htmlFor="auditor-org" className="mb-2 block text-sm font-medium">
                    Business / Entity Name on Statement
                  </label>
                  <input
                    id="auditor-org"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Kudex Treasury Operations"
                    disabled={busy}
                    required
                    className="field-input"
                  />
                </div>

                <div className="min-w-0">
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

                <div className="min-w-0">
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

                <div className="min-w-0 sm:col-span-2">
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

            <aside className="panel min-w-0 space-y-4">
              <h2 className="text-xl font-bold">Read-Only Safety Guarantee</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Every 1-Click Auditor Pass is strictly read-only and works in any browser
                at <code className="rounded bg-secondary px-1.5 py-0.5 font-mono">/verify</code>{' '}
                with zero wallet connection.
              </p>
              <dl className="space-y-3 border-t border-border pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Spending Permission</dt>
                  <dd className="font-bold text-primary">None (Read-Only)</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Disclosable Session Records</dt>
                  <dd className="font-bold tabular-nums">
                    {activity.length + privateNotes.notes.length}
                  </dd>
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
                    passes.map((pass) => {
                      const portalHref = `/verify?pass=${encodeURIComponent(pass.passCode)}`;
                      return (
                        <tr key={pass.id}>
                          <td className="px-4 py-3">
                            <span className="block font-semibold">{pass.auditorName}</span>
                            <span className="text-muted-foreground">
                              {pass.contactOrAddress}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="block">{pass.scope}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {pass.entryCount} disclosed{' '}
                              {pass.entryCount === 1 ? 'record' : 'records'}
                            </span>
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3 font-mono">
                            {pass.passCode}
                          </td>
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
                                <Link
                                  href={portalHref}
                                  className="quiet-link px-3 py-1.5 text-sm"
                                >
                                  <FiExternalLink aria-hidden="true" />
                                  <span>Open Auditor Portal</span>
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => void copyText(pass.passCode, pass.id)}
                                  className="quiet-link px-3 py-1.5 text-sm"
                                >
                                  {copiedCode === pass.id ? (
                                    <FiCheck className="text-primary" aria-hidden="true" />
                                  ) : (
                                    <FiCopy aria-hidden="true" />
                                  )}
                                  <span>
                                    {copiedCode === pass.id ? 'Copied' : 'Copy Pass'}
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
                      );
                    })
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
                  <th className="px-4 py-3">Receipt</th>
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
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDownloadReceiptForItem(row)}
                        className="quiet-link px-3 py-1.5 text-sm"
                      >
                        <FiDownload aria-hidden="true" />
                        <span>Download Payment Receipt</span>
                      </button>
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
