import { z } from 'zod';
import { create } from 'zustand';
import {
  bytesToHex,
  formatUnits,
  hexToBytes,
  parseAbiItem,
  parseUnits,
  type Address,
  type Hex,
  type PublicClient,
} from 'viem';
import { kudexVaultAbi } from '../contracts/abis.ts';

export const NOTE_CIPHERTEXT_VERSION = 0x01;

export function buildNoteSyncDomainMessage(owner: Address): string {
  return [
    'Kudex Private Balance Vault Key Derivation v1',
    `Account: ${owner.toLowerCase()}`,
    'Purpose: Derive your client-side encryption key to back up and restore Private Balances across devices.',
    'Safety: Signing this message never authorizes spending or moving funds.',
  ].join('\n');
}

const privateNoteSchema = z.object({
  version: z.literal(1),
  owner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  recipient: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  assetSymbol: z.string().min(1).max(32),
  decimals: z.number().int().min(0).max(36),
  value: z.string().min(1),
  valueUnits: z.string().regex(/^\d+$/),
  salt: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  commitment: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  nullifierPreimage: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  nullifierHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  memo: z.string().max(280).optional(),
  createdAt: z.string(),
});

export type PrivateNoteMetadata = z.infer<typeof privateNoteSchema>;

export interface RestoredPrivateNote extends PrivateNoteMetadata {
  onChainCommitted: boolean;
  spent: boolean;
  syncedTimestamp: number;
  blockNumber: bigint;
  transactionHash?: Hex;
}

const encryptedNoteSyncedEvent = parseAbiItem(
  'event EncryptedNoteSynced(address indexed owner, bytes32 indexed commitment, bytes encryptedMemo, uint256 timestamp)',
);

async function sha256HexBytes32(input: string): Promise<Hex> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return bytesToHex(new Uint8Array(digest)) as Hex;
}

/**
 * Derives a deterministic 256-bit AES-GCM CryptoKey from a wallet signature over `buildNoteSyncDomainMessage`.
 */
export async function deriveNoteEncryptionKey(walletSignature: Hex): Promise<CryptoKey> {
  const sigBytes = new Uint8Array(hexToBytes(walletSignature));
  const baseKey = await crypto.subtle.importKey('raw', sigBytes, 'HKDF', false, [
    'deriveKey',
  ]);
  const salt = new TextEncoder().encode('kudex-note-sync-aes-256-gcm-v1');
  const info = new TextEncoder().encode('private-balance-note-metadata');

  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info,
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Creates deterministic commitment + nullifier metadata for a new shielded note.
 */
export async function createPrivateNoteMetadata(params: {
  owner: Address;
  recipient?: Address;
  value: string;
  decimals?: number;
  assetSymbol?: string;
  memo?: string;
}): Promise<PrivateNoteMetadata> {
  const decimals = params.decimals ?? 6;
  const assetSymbol = params.assetSymbol ?? 'USDC';
  const units = parseUnits(params.value, decimals);

  const randomSalt = crypto.getRandomValues(new Uint8Array(32));
  const randomNullifierSeed = crypto.getRandomValues(new Uint8Array(32));
  const salt = bytesToHex(randomSalt) as Hex;
  const nullifierPreimage = bytesToHex(randomNullifierSeed) as Hex;

  const commitment = await sha256HexBytes32(
    `kudex-stealth-note-v1:${params.owner.toLowerCase()}:${(params.recipient ?? params.owner).toLowerCase()}:${units.toString()}:${salt}`,
  );
  const nullifierHash = await sha256HexBytes32(
    `kudex-nullifier-v1:${commitment}:${nullifierPreimage}`,
  );

  return {
    version: 1,
    owner: params.owner,
    recipient: params.recipient,
    assetSymbol,
    decimals,
    value: params.value,
    valueUnits: units.toString(),
    salt,
    commitment,
    nullifierPreimage,
    nullifierHash,
    memo: params.memo,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Encrypts private note metadata with AES-256-GCM into `[0x01 || 12-byte IV || ciphertext+tag]`.
 */
export async function encryptNoteMetadata(
  key: CryptoKey,
  note: PrivateNoteMetadata,
): Promise<Hex> {
  const validated = privateNoteSchema.parse(note);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(validated));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    plaintext,
  );
  const cipherBytes = new Uint8Array(encryptedBuffer);
  const packed = new Uint8Array(1 + iv.length + cipherBytes.length);
  packed[0] = NOTE_CIPHERTEXT_VERSION;
  packed.set(iv, 1);
  packed.set(cipherBytes, 1 + iv.length);
  return bytesToHex(packed) as Hex;
}

/**
 * Decrypts an `encryptedMemo` ciphertext produced by `encryptNoteMetadata`.
 */
export async function decryptNoteMetadata(
  key: CryptoKey,
  encryptedMemo: Hex,
): Promise<PrivateNoteMetadata> {
  const bytes = hexToBytes(encryptedMemo);
  if (bytes.length < 1 + 12 + 16) {
    throw new Error('Encrypted note payload is too short.');
  }
  if (bytes[0] !== NOTE_CIPHERTEXT_VERSION) {
    throw new Error(`Unsupported encrypted note version: ${bytes[0]}`);
  }
  const iv = bytes.slice(1, 13);
  const ciphertext = bytes.slice(13);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    ciphertext,
  );
  const parsed = JSON.parse(new TextDecoder().decode(decryptedBuffer));
  return privateNoteSchema.parse(parsed);
}

/**
 * Queries `EncryptedNoteSynced` logs from `KudexVault.sol`, decrypts notes belonging to `owner`,
 * verifies live commitment & nullifier state, and returns the exact restored Private Balance.
 */
export async function restorePrivateNotesFromNetwork(params: {
  client: PublicClient;
  vaultAddress: Address;
  ownerAddress: Address;
  key: CryptoKey;
  fromBlock?: bigint;
}): Promise<{
  notes: RestoredPrivateNote[];
  unspentUnits: bigint;
  formattedBalance: string;
  symbol: string;
  decimals: number;
}> {
  const { client, vaultAddress, ownerAddress, key } = params;
  const latestBlock = await client.getBlockNumber();
  const defaultLookback = latestBlock > 50_000n ? latestBlock - 50_000n : 0n;
  const fromBlock = params.fromBlock ?? defaultLookback;

  const logs = await client.getLogs({
    address: vaultAddress,
    event: encryptedNoteSyncedEvent,
    args: { owner: ownerAddress },
    fromBlock,
    toBlock: latestBlock,
  });

  const seenCommitments = new Set<string>();
  const restored: RestoredPrivateNote[] = [];

  for (const log of logs) {
    const encryptedMemo = log.args.encryptedMemo;
    if (!encryptedMemo || encryptedMemo === '0x') continue;
    try {
      const metadata = await decryptNoteMetadata(key, encryptedMemo);
      const commitmentKey = metadata.commitment.toLowerCase();
      if (seenCommitments.has(commitmentKey)) continue;
      seenCommitments.add(commitmentKey);

      const [onChainCommitted, spent] = await Promise.all([
        client.readContract({
          address: vaultAddress,
          abi: kudexVaultAbi,
          functionName: 'commitments',
          args: [metadata.commitment as Hex],
        }),
        client.readContract({
          address: vaultAddress,
          abi: kudexVaultAbi,
          functionName: 'nullifiers',
          args: [metadata.nullifierHash as Hex],
        }),
      ]);

      restored.push({
        ...metadata,
        onChainCommitted,
        spent,
        syncedTimestamp: Number(log.args.timestamp ?? 0n),
        blockNumber: log.blockNumber ?? 0n,
        transactionHash: log.transactionHash ?? undefined,
      });
    } catch {
      // Ignore notes encrypted under a different recipient key
    }
  }

  const decimals = restored[0]?.decimals ?? 6;
  const symbol = restored[0]?.assetSymbol ?? 'USDC';
  const unspentUnits = restored
    .filter((n) => n.onChainCommitted && !n.spent)
    .reduce((acc, n) => acc + BigInt(n.valueUnits), 0n);

  return {
    notes: restored,
    unspentUnits,
    formattedBalance: Number(formatUnits(unspentUnits, decimals)).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    symbol,
    decimals,
  };
}

interface PrivateNotesStoreState {
  restoredOwner: Address | null;
  notes: RestoredPrivateNote[];
  formattedRestoredBalance: string | null;
  symbol: string;
  lastSyncedAt: string | null;
  setRestoredSnapshot: (payload: {
    owner: Address;
    notes: RestoredPrivateNote[];
    formattedBalance: string;
    symbol: string;
  }) => void;
  recordLocalNote: (note: PrivateNoteMetadata, txHash?: Hex) => void;
}

export const usePrivateNotesStore = create<PrivateNotesStoreState>((set) => ({
  restoredOwner: null,
  notes: [],
  formattedRestoredBalance: null,
  symbol: 'USDC',
  lastSyncedAt: null,
  setRestoredSnapshot: ({ owner, notes, formattedBalance, symbol }) =>
    set({
      restoredOwner: owner,
      notes,
      formattedRestoredBalance: formattedBalance,
      symbol,
      lastSyncedAt: new Date().toLocaleTimeString(),
    }),
  recordLocalNote: (note, txHash) =>
    set((state) => {
      const nextNotes: RestoredPrivateNote[] = [
        {
          ...note,
          onChainCommitted: true,
          spent: false,
          syncedTimestamp: Math.floor(Date.now() / 1000),
          blockNumber: 0n,
          transactionHash: txHash,
        },
        ...state.notes.filter(
          (item) => item.commitment.toLowerCase() !== note.commitment.toLowerCase(),
        ),
      ];
      const total = nextNotes
        .filter((n) => n.onChainCommitted && !n.spent)
        .reduce((acc, n) => acc + BigInt(n.valueUnits), 0n);
      return {
        restoredOwner: note.owner as Address,
        notes: nextNotes,
        formattedRestoredBalance: Number(
          formatUnits(total, note.decimals),
        ).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        symbol: note.assetSymbol,
        lastSyncedAt: new Date().toLocaleTimeString(),
      };
    }),
}));
