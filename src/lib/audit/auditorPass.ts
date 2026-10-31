import { z } from 'zod';
import {
  isAddress,
  verifyMessage,
  zeroAddress,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem';
import { kudexVaultAbi } from '../contracts/abis.ts';

export const AUDITOR_PASS_PREFIX = 'kudex_pass_v1.';

const auditorEntrySchema = z.object({
  date: z.string(),
  payee: z.string().min(1).max(160),
  reference: z.string().max(240),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  currency: z.string().min(1).max(16),
  commitment: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  nullifier: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .optional(),
  txHash: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .optional(),
});

const auditorPassPayloadSchema = z.object({
  v: z.literal(1),
  organization: z.string().min(1).max(140),
  ownerAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  auditorName: z.string().min(1).max(140),
  auditorContact: z.string().min(1).max(160),
  scope: z.string().min(1).max(120),
  vaultAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  chainId: z.number().int(),
  issuedAt: z.string(),
  entries: z.array(auditorEntrySchema).max(100),
  issuerSignature: z.string().regex(/^0x[0-9a-fA-F]+$/).optional(),
});

export type AuditorDisclosedEntry = z.infer<typeof auditorEntrySchema>;
export type AuditorPassPayload = z.infer<typeof auditorPassPayloadSchema>;

export interface VerifiedAuditRow extends AuditorDisclosedEntry {
  commitmentRecordedOnChain: boolean;
  nullifierSpentOnChain: boolean;
  verificationLabel:
    | 'Verified On-Chain · Unspent'
    | 'Verified On-Chain · Settled'
    | 'Disclosed · Pending On-Chain Anchor'
    | 'Disclosed · Vault Unconfigured';
}

export interface VerifiedAuditStatement {
  payload: AuditorPassPayload;
  signatureValid: boolean | null;
  vaultReachable: boolean;
  observedBlock: string | null;
  rows: VerifiedAuditRow[];
  totalDisclosedAmount: number;
  verifiedCount: number;
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return base64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): string {
  const normalized = encoded.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  if (typeof atob === 'function') {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function buildAuditorPassSignatureMessage(payload: {
  auditorName: string;
  scope: string;
  issuedAt: string;
  entryCount: number;
}): string {
  return [
    'Authorize Kudex 1-Click Auditor Pass (Read-Only)',
    `Auditor: ${payload.auditorName}`,
    `Scope: ${payload.scope}`,
    `Disclosed Entries: ${payload.entryCount}`,
    `Issued At: ${payload.issuedAt}`,
    'Spending Permission: None',
  ].join('\n');
}

export function encodeAuditorPass(payload: AuditorPassPayload): string {
  const validated = auditorPassPayloadSchema.parse(payload);
  return `${AUDITOR_PASS_PREFIX}${toBase64Url(JSON.stringify(validated))}`;
}

export function decodeAuditorPass(rawPassInput: string): AuditorPassPayload {
  const trimmed = rawPassInput.trim();
  if (!trimmed) {
    throw new Error('Paste a 1-Click Auditor Pass code to view the financial statement.');
  }

  // Extract ?pass= if the user pasted a full shareable URL
  let token = trimmed;
  if (trimmed.includes('pass=')) {
    try {
      const url = new URL(trimmed, 'https://kudex.app');
      const param = url.searchParams.get('pass');
      if (param) token = param.trim();
    } catch {
      // Continue with raw string
    }
  }

  if (!token.startsWith(AUDITOR_PASS_PREFIX)) {
    throw new Error(
      'Unrecognized Auditor Pass format. Generate a 1-Click Auditor Pass in Send & Invoice and paste the full code.',
    );
  }

  const encoded = token.slice(AUDITOR_PASS_PREFIX.length);
  let decodedJson: unknown;
  try {
    decodedJson = JSON.parse(fromBase64Url(encoded));
  } catch {
    throw new Error('Auditor Pass code is corrupted or incomplete.');
  }

  return auditorPassPayloadSchema.parse(decodedJson);
}

/**
 * Verifies an Auditor Pass payload directly against `KudexVault.sol` using a public Viem client
 * with zero wallet connection required.
 */
export async function verifyAuditorPassOnChain(
  payload: AuditorPassPayload,
  client: PublicClient,
): Promise<VerifiedAuditStatement> {
  let signatureValid: boolean | null = null;
  if (payload.ownerAddress && payload.issuerSignature) {
    try {
      signatureValid = await verifyMessage({
        address: payload.ownerAddress as Address,
        message: buildAuditorPassSignatureMessage({
          auditorName: payload.auditorName,
          scope: payload.scope,
          issuedAt: payload.issuedAt,
          entryCount: payload.entries.length,
        }),
        signature: payload.issuerSignature as Hex,
      });
    } catch {
      signatureValid = false;
    }
  }

  const vaultConfigured =
    isAddress(payload.vaultAddress) &&
    payload.vaultAddress.toLowerCase() !== zeroAddress;

  let vaultReachable = false;
  let observedBlock: string | null = null;

  if (vaultConfigured) {
    try {
      const [block, code] = await Promise.all([
        client.getBlockNumber(),
        client.getBytecode({ address: payload.vaultAddress as Address }),
      ]);
      observedBlock = block.toString();
      vaultReachable = Boolean(code && code !== '0x');
    } catch {
      vaultReachable = false;
    }
  }

  const rows: VerifiedAuditRow[] = await Promise.all(
    payload.entries.map(async (entry) => {
      if (!vaultConfigured) {
        return {
          ...entry,
          commitmentRecordedOnChain: false,
          nullifierSpentOnChain: false,
          verificationLabel: 'Disclosed · Vault Unconfigured',
        };
      }
      if (!vaultReachable) {
        return {
          ...entry,
          commitmentRecordedOnChain: false,
          nullifierSpentOnChain: false,
          verificationLabel: 'Disclosed · Pending On-Chain Anchor',
        };
      }

      try {
        const [committed, spent] = await Promise.all([
          client.readContract({
            address: payload.vaultAddress as Address,
            abi: kudexVaultAbi,
            functionName: 'commitments',
            args: [entry.commitment as Hex],
          }),
          entry.nullifier
            ? client.readContract({
                address: payload.vaultAddress as Address,
                abi: kudexVaultAbi,
                functionName: 'nullifiers',
                args: [entry.nullifier as Hex],
              })
            : Promise.resolve(false),
        ]);

        return {
          ...entry,
          commitmentRecordedOnChain: committed,
          nullifierSpentOnChain: spent,
          verificationLabel: committed
            ? spent
              ? 'Verified On-Chain · Settled'
              : 'Verified On-Chain · Unspent'
            : 'Disclosed · Pending On-Chain Anchor',
        };
      } catch {
        return {
          ...entry,
          commitmentRecordedOnChain: false,
          nullifierSpentOnChain: false,
          verificationLabel: 'Disclosed · Pending On-Chain Anchor',
        };
      }
    }),
  );

  const totalDisclosedAmount = rows.reduce(
    (sum, r) => sum + Number(r.amount || '0'),
    0,
  );
  const verifiedCount = rows.filter((r) => r.commitmentRecordedOnChain).length;

  return {
    payload,
    signatureValid,
    vaultReachable,
    observedBlock,
    rows,
    totalDisclosedAmount,
    verifiedCount,
  };
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/**
 * Formats the verified ledger in standard QuickBooks / Xero bank & audit import CSV format.
 */
export function formatQuickBooksXeroCsv(statement: VerifiedAuditStatement): string {
  const header = [
    '*Date',
    '*Amount',
    'Currency',
    'Payee',
    'Description',
    'Reference',
    'AccountCode',
    'OnChainCommitment',
    'TransactionHash',
    'VerificationStatus',
  ];

  const lines = [header.join(',')];
  for (const row of statement.rows) {
    lines.push(
      [
        escapeCsvCell(row.date.slice(0, 10)),
        escapeCsvCell(`-${Number(row.amount).toFixed(2)}`),
        escapeCsvCell(row.currency),
        escapeCsvCell(row.payee),
        escapeCsvCell(`${statement.payload.scope} — ${row.reference}`),
        escapeCsvCell(row.reference),
        '200-Operating-Settlement',
        escapeCsvCell(row.commitment),
        escapeCsvCell(row.txHash ?? ''),
        escapeCsvCell(row.verificationLabel),
      ].join(','),
    );
  }
  return lines.join('\n');
}
