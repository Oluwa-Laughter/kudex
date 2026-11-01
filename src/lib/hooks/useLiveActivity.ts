'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import {
  erc20Abi,
  formatUnits,
  parseAbiItem,
  zeroAddress,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem';
import {
  PORTALDOT_NATIVE_DECIMALS,
  portaldotTestnet,
} from '../chains/portaldot.ts';
import { CONTRACT_ADDRESSES } from '../contracts/addresses.ts';
import { encodeAuditorPass } from '../audit/auditorPass.ts';
import { truncateAddress } from '../utils.ts';

export type PlainEnglishActivityCategory =
  | 'Private Payment'
  | 'Batch Payroll'
  | 'Invoice Created'
  | 'Invoice Paid'
  | 'Vault Deposit'
  | 'Best-Price Swap'
  | 'Payment Protection Reserve'
  | 'POT Fee-Free Lock';

export type ActivityFilterGroup =
  | 'all'
  | 'payments'
  | 'invoices'
  | 'vaults'
  | 'swaps'
  | 'protection';

export type ActivityScope = 'all' | 'mine';

export interface LiveActivityContractSet {
  vault: Address;
  rfqMarket: Address;
  daasAdapter: Address;
  invoiceEscrow: Address;
  businessRegistry: Address;
  potStaking: Address;
  usdc: Address;
}

export interface LiveActivityItem {
  id: string;
  category: PlainEnglishActivityCategory;
  filterGroup: Exclude<ActivityFilterGroup, 'all'>;
  title: string;
  subtitle: string;
  blockNumber: bigint;
  logIndex: number;
  transactionHash: Hex;
  timestampSec: number;
  timestampIso: string;
  involvedAddresses: Address[];
  rawAmount: bigint | null;
  formattedAmount: string;
  numericAmount: string;
  assetSymbol: string;
  commitment: Hex;
  verificationUrl: string;
}

export interface LiveActivitySnapshot {
  latestBlock: bigint;
  fromBlock: bigint;
  anyContractConfigured: boolean;
  items: LiveActivityItem[];
  observedAt: string;
}

const VAULT_NOTE_SHIELDED = parseAbiItem(
  'event NoteShielded(bytes32 indexed commitment, uint256 assetAmount, uint256 timestamp)',
);
const VAULT_BATCH_SHIELDED = parseAbiItem(
  'event BatchNotesShielded(address indexed sender, uint256 count, uint256 totalAssets, uint256 timestamp)',
);
const VAULT_NOTE_SPENT = parseAbiItem(
  'event NoteSpent(bytes32 indexed nullifier, bytes32 indexed newCommitment)',
);
const VAULT_NOTE_SYNCED = parseAbiItem(
  'event EncryptedNoteSynced(address indexed owner, bytes32 indexed commitment, bytes encryptedMemo, uint256 timestamp)',
);
const VAULT_DEPOSIT = parseAbiItem(
  'event Deposit(address indexed sender, address indexed owner, uint256 assets, uint256 shares)',
);
const VAULT_WITHDRAW = parseAbiItem(
  'event Withdraw(address indexed sender, address indexed receiver, address indexed owner, uint256 assets, uint256 shares)',
);

const RFQ_SETTLED = parseAbiItem(
  'event RFQSettled(bytes32 indexed orderHash, address indexed taker, address maker)',
);
const RFQ_CANCELLED = parseAbiItem(
  'event OrderCancelled(address indexed maker, uint256 indexed nonce)',
);

const INVOICE_CREATED = parseAbiItem(
  'event InvoiceCreated(bytes32 indexed invoiceId, address indexed issuer, address indexed payer, address token, uint256 amount, uint256 dueTimestamp, bytes32 encryptedReference, uint256 requiredApprovals, uint256 timestamp)',
);
const INVOICE_APPROVED = parseAbiItem(
  'event InvoiceApproved(bytes32 indexed invoiceId, address indexed approver, uint256 approvalCount, uint256 requiredApprovals, bool fullyApproved, uint256 timestamp)',
);
const INVOICE_SETTLED = parseAbiItem(
  'event InvoiceSettled(bytes32 indexed invoiceId, address indexed payer, address indexed issuer, address token, uint256 amount, uint256 protocolFee, bool confidentialSettlement, bytes32 commitment, uint256 timestamp)',
);

const DAAS_RESERVE_FUNDED = parseAbiItem(
  'event ReserveFunded(address indexed source, address indexed token, uint256 amount, uint256 newBalance, uint256 timestamp)',
);
const DAAS_PROTECTION_FUNDED = parseAbiItem(
  'event ProtectionReserveFunded(address indexed source, address indexed token, uint256 amount, uint256 newBalance)',
);
const DAAS_STAGE_ADVANCED = parseAbiItem(
  'event DaaSStageAdvanced(address indexed vault, uint8 stage, uint256 reserveCommitted, uint256 timestamp)',
);

const POT_STAKED = parseAbiItem(
  'event POTStaked(address indexed account, uint256 amount, uint256 totalAccountStake, uint256 timestamp)',
);
const POT_UNSTAKED = parseAbiItem(
  'event POTUnstaked(address indexed account, uint256 amount, uint256 remainingStake, uint256 timestamp)',
);

const BUSINESS_REGISTERED = parseAbiItem(
  'event BusinessRegistered(address indexed owner, address indexed payoutAddress, string businessName, string category, bytes32 registrationHash, uint256 timestamp)',
);

const DAAS_STAGE_NAMES: Record<number, string> = {
  1: 'Triggered',
  2: 'Validated',
  3: 'Deposits Paused',
  4: 'Reserve Merged',
  5: 'Recovery Active',
};

function formatHumanUnits(
  raw: bigint,
  decimals: number,
  maxFractionDigits: number = 4,
): { formatted: string; numeric: string } {
  const exact = formatUnits(raw, decimals);
  const parsed = Number(exact);
  if (!Number.isFinite(parsed)) {
    return { formatted: exact, numeric: exact };
  }
  const formatted = parsed.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFractionDigits,
  });
  return { formatted, numeric: exact };
}

function buildAuditorVerifyLink(params: {
  title: string;
  counterparty: string;
  amount: string;
  currency: string;
  commitment: Hex;
  txHash: Hex;
  timestampIso: string;
  vaultAddress: Address;
}): string {
  const passCode = encodeAuditorPass({
    v: 1,
    organization: 'Kudex Live Network Ledger',
    auditorName: 'Public Block Verification',
    auditorContact: 'Verify & Audit Portal',
    scope: 'On-Chain Receipt Proof',
    vaultAddress: params.vaultAddress,
    chainId: portaldotTestnet.id,
    issuedAt: params.timestampIso,
    entries: [
      {
        date: params.timestampIso,
        payee: params.counterparty,
        reference: params.title,
        amount: params.amount,
        currency: params.currency,
        commitment: params.commitment,
        txHash: params.txHash,
      },
    ],
  });
  return `/verify?pass=${encodeURIComponent(passCode)}`;
}

async function safeGetLogs<TEvent>(
  client: PublicClient,
  address: Address,
  event: TEvent,
  fromBlock: bigint,
  toBlock: bigint,
) {
  if (address === zeroAddress) return [];
  try {
    return await client.getLogs({
      address,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event: event as any,
      fromBlock,
      toBlock,
    });
  } catch {
    const fallbackFrom = toBlock > 500n ? toBlock - 500n : 0n;
    try {
      return await client.getLogs({
        address,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event: event as any,
        fromBlock: fallbackFrom,
        toBlock,
      });
    } catch {
      return [];
    }
  }
}

export async function indexLiveActivity(params: {
  client: PublicClient;
  contracts?: Partial<LiveActivityContractSet>;
  maxBlockSpan?: bigint;
}): Promise<LiveActivitySnapshot> {
  const contracts: LiveActivityContractSet = {
    vault: params.contracts?.vault ?? CONTRACT_ADDRESSES.vault,
    rfqMarket: params.contracts?.rfqMarket ?? CONTRACT_ADDRESSES.rfqMarket,
    daasAdapter: params.contracts?.daasAdapter ?? CONTRACT_ADDRESSES.daasAdapter,
    invoiceEscrow:
      params.contracts?.invoiceEscrow ?? CONTRACT_ADDRESSES.invoiceEscrow,
    businessRegistry:
      params.contracts?.businessRegistry ?? CONTRACT_ADDRESSES.businessRegistry,
    potStaking: params.contracts?.potStaking ?? CONTRACT_ADDRESSES.potStaking,
    usdc: params.contracts?.usdc ?? CONTRACT_ADDRESSES.usdc,
  };

  const anyContractConfigured = Object.entries(contracts).some(
    ([key, addr]) => key !== 'usdc' && addr !== zeroAddress,
  );

  const latestBlock = await params.client.getBlockNumber();
  const span = params.maxBlockSpan ?? 5_000n;
  const fromBlock = latestBlock > span ? latestBlock - span : 0n;

  if (!anyContractConfigured) {
    return {
      latestBlock,
      fromBlock,
      anyContractConfigured: false,
      items: [],
      observedAt: new Date().toISOString(),
    };
  }

  let stableDecimals = 6;
  let stableSymbol = 'pUSD';
  if (contracts.usdc !== zeroAddress) {
    try {
      const [dec, sym] = await Promise.all([
        params.client.readContract({
          address: contracts.usdc,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
        params.client.readContract({
          address: contracts.usdc,
          abi: erc20Abi,
          functionName: 'symbol',
        }),
      ]);
      stableDecimals = Number(dec);
      stableSymbol = sym;
    } catch {
      stableDecimals = 6;
      stableSymbol = 'pUSD';
    }
  }

  const [
    noteShieldedLogs,
    batchShieldedLogs,
    noteSpentLogs,
    noteSyncedLogs,
    depositLogs,
    withdrawLogs,
    rfqSettledLogs,
    rfqCancelledLogs,
    invoiceCreatedLogs,
    invoiceApprovedLogs,
    invoiceSettledLogs,
    reserveFundedLogs,
    protectionFundedLogs,
    daasStageLogs,
    potStakedLogs,
    potUnstakedLogs,
    businessRegisteredLogs,
  ] = await Promise.all([
    safeGetLogs(params.client, contracts.vault, VAULT_NOTE_SHIELDED, fromBlock, latestBlock),
    safeGetLogs(params.client, contracts.vault, VAULT_BATCH_SHIELDED, fromBlock, latestBlock),
    safeGetLogs(params.client, contracts.vault, VAULT_NOTE_SPENT, fromBlock, latestBlock),
    safeGetLogs(params.client, contracts.vault, VAULT_NOTE_SYNCED, fromBlock, latestBlock),
    safeGetLogs(params.client, contracts.vault, VAULT_DEPOSIT, fromBlock, latestBlock),
    safeGetLogs(params.client, contracts.vault, VAULT_WITHDRAW, fromBlock, latestBlock),
    safeGetLogs(params.client, contracts.rfqMarket, RFQ_SETTLED, fromBlock, latestBlock),
    safeGetLogs(params.client, contracts.rfqMarket, RFQ_CANCELLED, fromBlock, latestBlock),
    safeGetLogs(
      params.client,
      contracts.invoiceEscrow,
      INVOICE_CREATED,
      fromBlock,
      latestBlock,
    ),
    safeGetLogs(
      params.client,
      contracts.invoiceEscrow,
      INVOICE_APPROVED,
      fromBlock,
      latestBlock,
    ),
    safeGetLogs(
      params.client,
      contracts.invoiceEscrow,
      INVOICE_SETTLED,
      fromBlock,
      latestBlock,
    ),
    safeGetLogs(
      params.client,
      contracts.daasAdapter,
      DAAS_RESERVE_FUNDED,
      fromBlock,
      latestBlock,
    ),
    safeGetLogs(
      params.client,
      contracts.daasAdapter,
      DAAS_PROTECTION_FUNDED,
      fromBlock,
      latestBlock,
    ),
    safeGetLogs(
      params.client,
      contracts.daasAdapter,
      DAAS_STAGE_ADVANCED,
      fromBlock,
      latestBlock,
    ),
    safeGetLogs(params.client, contracts.potStaking, POT_STAKED, fromBlock, latestBlock),
    safeGetLogs(params.client, contracts.potStaking, POT_UNSTAKED, fromBlock, latestBlock),
    safeGetLogs(
      params.client,
      contracts.businessRegistry,
      BUSINESS_REGISTERED,
      fromBlock,
      latestBlock,
    ),
  ]);

  // Cache block timestamps for logs that do not embed a timestamp field
  const blockTimestampCache = new Map<bigint, number>();
  async function resolveBlockTimestamp(
    blockNumber: bigint,
    embedded?: bigint,
  ): Promise<number> {
    if (typeof embedded === 'bigint' && embedded > 0n) {
      return Number(embedded);
    }
    const cached = blockTimestampCache.get(blockNumber);
    if (cached !== undefined) return cached;
    try {
      const blk = await params.client.getBlock({ blockNumber });
      const ts = Number(blk.timestamp);
      blockTimestampCache.set(blockNumber, ts);
      return ts;
    } catch {
      const fallback = Math.floor(Date.now() / 1000);
      blockTimestampCache.set(blockNumber, fallback);
      return fallback;
    }
  }

  // Correlate transaction sets so batch payroll / stealth notes / confidential invoices do not duplicate Deposit rows
  const batchTxHashes = new Set<string>(
    batchShieldedLogs
      .map((l) => l.transactionHash?.toLowerCase())
      .filter((v): v is string => Boolean(v)),
  );
  const confidentialInvoiceTxHashes = new Set<string>(
    invoiceSettledLogs
      .filter((l) => Boolean((l as { args?: { confidentialSettlement?: boolean } }).args?.confidentialSettlement))
      .map((l) => l.transactionHash?.toLowerCase())
      .filter((v): v is string => Boolean(v)),
  );
  const noteShieldedTxHashes = new Set<string>(
    noteShieldedLogs
      .map((l) => l.transactionHash?.toLowerCase())
      .filter((v): v is string => Boolean(v)),
  );
  const reserveFundedTxHashes = new Set<string>(
    reserveFundedLogs
      .map((l) => `${l.transactionHash?.toLowerCase()}:${String((l as { args?: { amount?: bigint } }).args?.amount ?? '')}`)
      .filter(Boolean),
  );

  // Map commitment -> owners from EncryptedNoteSynced + Deposit logs for My Account matching
  const commitmentParties = new Map<string, Set<Address>>();
  for (const raw of noteSyncedLogs) {
    const args = (raw as { args?: { owner?: Address; commitment?: Hex } }).args;
    if (args?.commitment && args?.owner) {
      const key = args.commitment.toLowerCase();
      if (!commitmentParties.has(key)) commitmentParties.set(key, new Set());
      commitmentParties.get(key)!.add(args.owner);
    }
  }
  const txDepositParties = new Map<string, Set<Address>>();
  for (const raw of depositLogs) {
    const txKey = raw.transactionHash?.toLowerCase();
    const args = (raw as { args?: { sender?: Address; owner?: Address } }).args;
    if (txKey) {
      if (!txDepositParties.has(txKey)) txDepositParties.set(txKey, new Set());
      if (args?.sender) txDepositParties.get(txKey)!.add(args.sender);
      if (args?.owner) txDepositParties.get(txKey)!.add(args.owner);
    }
  }

  const items: LiveActivityItem[] = [];

  // 1. KudexVault: BatchNotesShielded -> "Batch Payroll"
  for (const log of batchShieldedLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as {
        args: { sender: Address; count: bigint; totalAssets: bigint; timestamp: bigint };
      }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber, args.timestamp);
    const iso = new Date(ts * 1000).toISOString();
    const amt = formatHumanUnits(args.totalAssets, stableDecimals, 2);
    const parties = new Set<Address>([args.sender]);
    for (const p of txDepositParties.get(log.transactionHash.toLowerCase()) ?? []) {
      parties.add(p);
    }
    const commitment = log.transactionHash;
    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Batch Payroll',
      filterGroup: 'payments',
      title: `Batch Payroll (${args.count.toString()} recipients)`,
      subtitle: `Settled by ${truncateAddress(args.sender)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: Array.from(parties),
      rawAmount: args.totalAssets,
      formattedAmount: `${amt.formatted} ${stableSymbol}`,
      numericAmount: amt.numeric,
      assetSymbol: stableSymbol,
      commitment,
      verificationUrl: buildAuditorVerifyLink({
        title: `Batch Payroll (${args.count.toString()} recipients)`,
        counterparty: truncateAddress(args.sender),
        amount: amt.numeric,
        currency: stableSymbol,
        commitment,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  // 2. KudexVault: NoteShielded -> "Private Payment" (skip if part of Batch Payroll or Confidential Invoice)
  for (const log of noteShieldedLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const txLower = log.transactionHash.toLowerCase();
    if (batchTxHashes.has(txLower) || confidentialInvoiceTxHashes.has(txLower)) continue;

    const args = (
      log as unknown as {
        args: { commitment: Hex; assetAmount: bigint; timestamp: bigint };
      }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber, args.timestamp);
    const iso = new Date(ts * 1000).toISOString();
    const amt = formatHumanUnits(args.assetAmount, stableDecimals, 2);
    const parties = new Set<Address>();
    for (const p of commitmentParties.get(args.commitment.toLowerCase()) ?? []) {
      parties.add(p);
    }
    for (const p of txDepositParties.get(txLower) ?? []) {
      parties.add(p);
    }
    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Private Payment',
      filterGroup: 'payments',
      title: 'Private Payment (Stealth Mode)',
      subtitle: `Stealth Ref ${truncateAddress(args.commitment)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: Array.from(parties),
      rawAmount: args.assetAmount,
      formattedAmount: `${amt.formatted} ${stableSymbol}`,
      numericAmount: amt.numeric,
      assetSymbol: stableSymbol,
      commitment: args.commitment,
      verificationUrl: buildAuditorVerifyLink({
        title: 'Private Payment (Stealth Mode)',
        counterparty: truncateAddress(args.commitment),
        amount: amt.numeric,
        currency: stableSymbol,
        commitment: args.commitment,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  // 3. KudexVault: NoteSpent -> "Private Payment"
  for (const log of noteSpentLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as { args: { nullifier: Hex; newCommitment: Hex } }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber);
    const iso = new Date(ts * 1000).toISOString();
    const parties = Array.from(
      commitmentParties.get(args.newCommitment.toLowerCase()) ?? [],
    );
    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Private Payment',
      filterGroup: 'payments',
      title: 'Private Balance Transfer',
      subtitle: `Stealth Ref ${truncateAddress(args.newCommitment)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: parties,
      rawAmount: null,
      formattedAmount: 'Stealth Amount',
      numericAmount: '0.00',
      assetSymbol: stableSymbol,
      commitment: args.newCommitment,
      verificationUrl: buildAuditorVerifyLink({
        title: 'Private Balance Transfer',
        counterparty: truncateAddress(args.newCommitment),
        amount: '0.00',
        currency: stableSymbol,
        commitment: args.newCommitment,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  // 4. KudexVault: Public Deposit / Withdraw -> "Vault Deposit"
  for (const log of depositLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const txLower = log.transactionHash.toLowerCase();
    if (
      batchTxHashes.has(txLower) ||
      noteShieldedTxHashes.has(txLower) ||
      confidentialInvoiceTxHashes.has(txLower)
    ) {
      continue;
    }
    const args = (
      log as unknown as {
        args: { sender: Address; owner: Address; assets: bigint; shares: bigint };
      }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber);
    const iso = new Date(ts * 1000).toISOString();
    const amt = formatHumanUnits(args.assets, stableDecimals, 2);
    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Vault Deposit',
      filterGroup: 'vaults',
      title: 'Fixed-Yield Business Vault Deposit',
      subtitle: `Depositor ${truncateAddress(args.owner)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: [args.sender, args.owner],
      rawAmount: args.assets,
      formattedAmount: `${amt.formatted} ${stableSymbol}`,
      numericAmount: amt.numeric,
      assetSymbol: stableSymbol,
      commitment: log.transactionHash,
      verificationUrl: buildAuditorVerifyLink({
        title: 'Fixed-Yield Business Vault Deposit',
        counterparty: truncateAddress(args.owner),
        amount: amt.numeric,
        currency: stableSymbol,
        commitment: log.transactionHash,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  for (const log of withdrawLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as {
        args: {
          sender: Address;
          receiver: Address;
          owner: Address;
          assets: bigint;
          shares: bigint;
        };
      }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber);
    const iso = new Date(ts * 1000).toISOString();
    const amt = formatHumanUnits(args.assets, stableDecimals, 2);
    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Vault Deposit',
      filterGroup: 'vaults',
      title: 'Business Vault Withdrawal',
      subtitle: `Receiver ${truncateAddress(args.receiver)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: [args.sender, args.receiver, args.owner],
      rawAmount: args.assets,
      formattedAmount: `${amt.formatted} ${stableSymbol}`,
      numericAmount: amt.numeric,
      assetSymbol: stableSymbol,
      commitment: log.transactionHash,
      verificationUrl: buildAuditorVerifyLink({
        title: 'Business Vault Withdrawal',
        counterparty: truncateAddress(args.receiver),
        amount: amt.numeric,
        currency: stableSymbol,
        commitment: log.transactionHash,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  // 5. KudexRFQMarket: RFQSettled / OrderCancelled -> "Best-Price Swap"
  for (const log of rfqSettledLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as { args: { orderHash: Hex; taker: Address; maker: Address } }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber);
    const iso = new Date(ts * 1000).toISOString();
    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Best-Price Swap',
      filterGroup: 'swaps',
      title: 'Best-Price Swap Settled',
      subtitle: `${truncateAddress(args.taker)} with ${truncateAddress(args.maker)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: [args.taker, args.maker],
      rawAmount: null,
      formattedAmount: 'Locked Rate Filled',
      numericAmount: '0.00',
      assetSymbol: stableSymbol,
      commitment: args.orderHash,
      verificationUrl: buildAuditorVerifyLink({
        title: 'Best-Price Swap Settled',
        counterparty: truncateAddress(args.maker),
        amount: '0.00',
        currency: stableSymbol,
        commitment: args.orderHash,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  for (const log of rfqCancelledLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as { args: { maker: Address; nonce: bigint } }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber);
    const iso = new Date(ts * 1000).toISOString();
    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Best-Price Swap',
      filterGroup: 'swaps',
      title: `Swap Quote #${args.nonce.toString()} Cancelled`,
      subtitle: `Maker ${truncateAddress(args.maker)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: [args.maker],
      rawAmount: null,
      formattedAmount: 'Cancelled',
      numericAmount: '0.00',
      assetSymbol: stableSymbol,
      commitment: log.transactionHash,
      verificationUrl: buildAuditorVerifyLink({
        title: `Swap Quote #${args.nonce.toString()} Cancelled`,
        counterparty: truncateAddress(args.maker),
        amount: '0.00',
        currency: stableSymbol,
        commitment: log.transactionHash,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  // 6. KudexInvoiceEscrow: InvoiceCreated / InvoiceApproved / InvoiceSettled
  for (const log of invoiceCreatedLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as {
        args: {
          invoiceId: Hex;
          issuer: Address;
          payer: Address;
          amount: bigint;
          requiredApprovals: bigint;
          timestamp: bigint;
        };
      }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber, args.timestamp);
    const iso = new Date(ts * 1000).toISOString();
    const amt = formatHumanUnits(args.amount, stableDecimals, 2);
    const involved: Address[] = [args.issuer];
    if (args.payer !== zeroAddress) involved.push(args.payer);

    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Invoice Created',
      filterGroup: 'invoices',
      title:
        args.requiredApprovals > 0n
          ? `On-Chain Invoice Created (${args.requiredApprovals.toString()} Sign-Offs)`
          : 'On-Chain Business Invoice Created',
      subtitle: `Issuer ${truncateAddress(args.issuer)} · ID ${truncateAddress(args.invoiceId)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: involved,
      rawAmount: args.amount,
      formattedAmount: `${amt.formatted} ${stableSymbol}`,
      numericAmount: amt.numeric,
      assetSymbol: stableSymbol,
      commitment: args.invoiceId,
      verificationUrl: buildAuditorVerifyLink({
        title: 'On-Chain Business Invoice Created',
        counterparty: truncateAddress(args.issuer),
        amount: amt.numeric,
        currency: stableSymbol,
        commitment: args.invoiceId,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  for (const log of invoiceApprovedLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as {
        args: {
          invoiceId: Hex;
          approver: Address;
          approvalCount: bigint;
          requiredApprovals: bigint;
          fullyApproved: boolean;
          timestamp: bigint;
        };
      }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber, args.timestamp);
    const iso = new Date(ts * 1000).toISOString();

    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Invoice Created',
      filterGroup: 'invoices',
      title: `Invoice Team Sign-Off (${args.approvalCount.toString()}/${args.requiredApprovals.toString()})`,
      subtitle: `Approved by ${truncateAddress(args.approver)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: [args.approver],
      rawAmount: null,
      formattedAmount: args.fullyApproved ? 'Ready to Pay' : 'Sign-Off Recorded',
      numericAmount: '0.00',
      assetSymbol: stableSymbol,
      commitment: args.invoiceId,
      verificationUrl: buildAuditorVerifyLink({
        title: 'Invoice Team Sign-Off Approved',
        counterparty: truncateAddress(args.approver),
        amount: '0.00',
        currency: stableSymbol,
        commitment: args.invoiceId,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  for (const log of invoiceSettledLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as {
        args: {
          invoiceId: Hex;
          payer: Address;
          issuer: Address;
          amount: bigint;
          protocolFee: bigint;
          confidentialSettlement: boolean;
          commitment: Hex;
          timestamp: bigint;
        };
      }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber, args.timestamp);
    const iso = new Date(ts * 1000).toISOString();
    const amt = formatHumanUnits(args.amount, stableDecimals, 2);
    const effectiveCommitment =
      args.confidentialSettlement && args.commitment !== zeroAddress
        ? args.commitment
        : args.invoiceId;

    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Invoice Paid',
      filterGroup: 'invoices',
      title: args.confidentialSettlement
        ? 'Business Invoice Paid (Stealth Vault)'
        : 'Business Invoice Paid On-Chain',
      subtitle: `${truncateAddress(args.payer)} paid ${truncateAddress(args.issuer)}${
        args.protocolFee === 0n ? ' · 0% Fee' : ''
      }`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: [args.payer, args.issuer],
      rawAmount: args.amount,
      formattedAmount: `${amt.formatted} ${stableSymbol}`,
      numericAmount: amt.numeric,
      assetSymbol: stableSymbol,
      commitment: effectiveCommitment,
      verificationUrl: buildAuditorVerifyLink({
        title: 'Business Invoice Paid On-Chain',
        counterparty: truncateAddress(args.issuer),
        amount: amt.numeric,
        currency: stableSymbol,
        commitment: effectiveCommitment,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  // 7. KudexDaaSAdapter: ReserveFunded & DaaSStageAdvanced -> "Payment Protection Reserve"
  for (const log of reserveFundedLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as {
        args: { source: Address; amount: bigint; newBalance: bigint; timestamp: bigint };
      }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber, args.timestamp);
    const iso = new Date(ts * 1000).toISOString();
    const amt = formatHumanUnits(args.amount, stableDecimals, 4);

    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Payment Protection Reserve',
      filterGroup: 'protection',
      title: 'Payment Protection Reserve Funded',
      subtitle: `Source ${truncateAddress(args.source)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: [args.source],
      rawAmount: args.amount,
      formattedAmount: `${amt.formatted} ${stableSymbol}`,
      numericAmount: amt.numeric,
      assetSymbol: stableSymbol,
      commitment: log.transactionHash,
      verificationUrl: buildAuditorVerifyLink({
        title: 'Payment Protection Reserve Funded',
        counterparty: truncateAddress(args.source),
        amount: amt.numeric,
        currency: stableSymbol,
        commitment: log.transactionHash,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  for (const log of protectionFundedLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as {
        args: { source: Address; amount: bigint; newBalance: bigint };
      }
    ).args;
    const dedupKey = `${log.transactionHash.toLowerCase()}:${args.amount.toString()}`;
    if (reserveFundedTxHashes.has(dedupKey)) continue;
    const ts = await resolveBlockTimestamp(log.blockNumber);
    const iso = new Date(ts * 1000).toISOString();
    const amt = formatHumanUnits(args.amount, stableDecimals, 4);

    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Payment Protection Reserve',
      filterGroup: 'protection',
      title: 'Payment Protection Reserve Funded',
      subtitle: `Source ${truncateAddress(args.source)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: [args.source],
      rawAmount: args.amount,
      formattedAmount: `${amt.formatted} ${stableSymbol}`,
      numericAmount: amt.numeric,
      assetSymbol: stableSymbol,
      commitment: log.transactionHash,
      verificationUrl: buildAuditorVerifyLink({
        title: 'Payment Protection Reserve Funded',
        counterparty: truncateAddress(args.source),
        amount: amt.numeric,
        currency: stableSymbol,
        commitment: log.transactionHash,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  for (const log of daasStageLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as {
        args: {
          vault: Address;
          stage: number;
          reserveCommitted: bigint;
          timestamp: bigint;
        };
      }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber, args.timestamp);
    const iso = new Date(ts * 1000).toISOString();
    const stageNum = Number(args.stage);
    const stageLabel = DAAS_STAGE_NAMES[stageNum] ?? `Stage ${stageNum}`;
    const amt =
      args.reserveCommitted > 0n
        ? formatHumanUnits(args.reserveCommitted, stableDecimals, 2)
        : null;

    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Payment Protection Reserve',
      filterGroup: 'protection',
      title: `Protection Stage ${stageNum} of 5: ${stageLabel}`,
      subtitle: `Vault ${truncateAddress(args.vault)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: [args.vault],
      rawAmount: args.reserveCommitted > 0n ? args.reserveCommitted : null,
      formattedAmount: amt ? `${amt.formatted} ${stableSymbol} Committed` : stageLabel,
      numericAmount: amt ? amt.numeric : '0.00',
      assetSymbol: stableSymbol,
      commitment: log.transactionHash,
      verificationUrl: buildAuditorVerifyLink({
        title: `Protection Stage ${stageNum} of 5: ${stageLabel}`,
        counterparty: truncateAddress(args.vault),
        amount: amt ? amt.numeric : '0.00',
        currency: stableSymbol,
        commitment: log.transactionHash,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  // 8. KudexPOTStaking: POTStaked & POTUnstaked -> "POT Fee-Free Lock" (14 decimals)
  for (const log of potStakedLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as {
        args: {
          account: Address;
          amount: bigint;
          totalAccountStake: bigint;
          timestamp: bigint;
        };
      }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber, args.timestamp);
    const iso = new Date(ts * 1000).toISOString();
    const amt = formatHumanUnits(args.amount, PORTALDOT_NATIVE_DECIMALS, 4);
    const unlockedFeeFree = args.totalAccountStake >= 100n * 10n ** 14n;

    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'POT Fee-Free Lock',
      filterGroup: 'vaults',
      title: unlockedFeeFree
        ? 'POT Locked · 0% Fee Tier Active'
        : 'POT Locked for Fee Membership',
      subtitle: `Account ${truncateAddress(args.account)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: [args.account],
      rawAmount: args.amount,
      formattedAmount: `${amt.formatted} POT`,
      numericAmount: amt.numeric,
      assetSymbol: 'POT',
      commitment: log.transactionHash,
      verificationUrl: buildAuditorVerifyLink({
        title: 'POT Fee-Free Lock',
        counterparty: truncateAddress(args.account),
        amount: amt.numeric,
        currency: 'POT',
        commitment: log.transactionHash,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  for (const log of potUnstakedLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as {
        args: {
          account: Address;
          amount: bigint;
          remainingStake: bigint;
          timestamp: bigint;
        };
      }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber, args.timestamp);
    const iso = new Date(ts * 1000).toISOString();
    const amt = formatHumanUnits(args.amount, PORTALDOT_NATIVE_DECIMALS, 4);

    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'POT Fee-Free Lock',
      filterGroup: 'vaults',
      title: 'POT Unlocked from Membership Vault',
      subtitle: `Account ${truncateAddress(args.account)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: [args.account],
      rawAmount: args.amount,
      formattedAmount: `${amt.formatted} POT`,
      numericAmount: amt.numeric,
      assetSymbol: 'POT',
      commitment: log.transactionHash,
      verificationUrl: buildAuditorVerifyLink({
        title: 'POT Unlocked from Membership Vault',
        counterparty: truncateAddress(args.account),
        amount: amt.numeric,
        currency: 'POT',
        commitment: log.transactionHash,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  // 9. KudexBusinessRegistry: BusinessRegistered -> "Private Payment" (Payments & Directory group)
  for (const log of businessRegisteredLogs) {
    if (!log.transactionHash || log.blockNumber === null) continue;
    const args = (
      log as unknown as {
        args: {
          owner: Address;
          payoutAddress: Address;
          businessName: string;
          category: string;
          registrationHash: Hex;
          timestamp: bigint;
        };
      }
    ).args;
    const ts = await resolveBlockTimestamp(log.blockNumber, args.timestamp);
    const iso = new Date(ts * 1000).toISOString();

    items.push({
      id: `${log.transactionHash}-${log.logIndex ?? 0}`,
      category: 'Private Payment',
      filterGroup: 'payments',
      title: `Verified Business Registered: ${args.businessName}`,
      subtitle: `${args.category} · Payout ${truncateAddress(args.payoutAddress)}`,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex ?? 0,
      transactionHash: log.transactionHash,
      timestampSec: ts,
      timestampIso: iso,
      involvedAddresses: [args.owner, args.payoutAddress],
      rawAmount: null,
      formattedAmount: 'Verified Identity',
      numericAmount: '0.00',
      assetSymbol: 'ID',
      commitment: args.registrationHash,
      verificationUrl: buildAuditorVerifyLink({
        title: `Verified Business Registered: ${args.businessName}`,
        counterparty: `${args.businessName} (${truncateAddress(args.payoutAddress)})`,
        amount: '0.00',
        currency: stableSymbol,
        commitment: args.registrationHash,
        txHash: log.transactionHash,
        timestampIso: iso,
        vaultAddress: contracts.vault,
      }),
    });
  }

  items.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber > b.blockNumber ? -1 : 1;
    }
    return b.logIndex - a.logIndex;
  });

  return {
    latestBlock,
    fromBlock,
    anyContractConfigured,
    items,
    observedAt: new Date().toISOString(),
  };
}

export function filterLiveActivityItems(
  items: LiveActivityItem[],
  scope: ActivityScope,
  filterGroup: ActivityFilterGroup,
  connectedAddress?: Address,
): LiveActivityItem[] {
  const lowerAccount = connectedAddress?.toLowerCase();
  return items.filter((item) => {
    if (scope === 'mine') {
      if (!lowerAccount) return false;
      const matches = item.involvedAddresses.some(
        (addr) => addr.toLowerCase() === lowerAccount,
      );
      if (!matches) return false;
    }
    if (filterGroup !== 'all' && item.filterGroup !== filterGroup) {
      return false;
    }
    return true;
  });
}

export const LIVE_ACTIVITY_QUERY_KEY = 'kudex-live-activity-ledger';

export function useLiveActivity(initialScope: ActivityScope = 'all') {
  const { address } = useAccount();
  const client = usePublicClient({ chainId: portaldotTestnet.id });

  const [scope, setScope] = useState<ActivityScope>(initialScope);
  const [filterGroup, setFilterGroup] = useState<ActivityFilterGroup>('all');

  const query = useQuery({
    queryKey: [
      LIVE_ACTIVITY_QUERY_KEY,
      portaldotTestnet.id,
      CONTRACT_ADDRESSES.vault,
      CONTRACT_ADDRESSES.rfqMarket,
      CONTRACT_ADDRESSES.daasAdapter,
      CONTRACT_ADDRESSES.invoiceEscrow,
      CONTRACT_ADDRESSES.businessRegistry,
      CONTRACT_ADDRESSES.potStaking,
    ],
    enabled: Boolean(client),
    staleTime: 6_000,
    refetchInterval: 12_000,
    refetchIntervalInBackground: false,
    retry: 0,
    queryFn: () => indexLiveActivity({ client: client! }),
  });

  const allItems = useMemo(() => query.data?.items ?? [], [query.data?.items]);

  const filteredItems = useMemo(
    () => filterLiveActivityItems(allItems, scope, filterGroup, address),
    [allItems, scope, filterGroup, address],
  );

  return {
    ...query,
    scope,
    setScope,
    filterGroup,
    setFilterGroup,
    allItems,
    filteredItems,
    totalCount: allItems.length,
    latestBlock: query.data?.latestBlock ?? null,
    anyContractConfigured: query.data?.anyContractConfigured ?? false,
  };
}
