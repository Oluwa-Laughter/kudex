import { z } from 'zod';
import type { Address, Hash } from 'viem';
const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const integer = z
  .string()
  .regex(/^\d{1,78}$/)
  .refine((v) => BigInt(v) < 2n ** 256n);
export type VaultReview = {
  owner: Address;
  operation: 'deposit' | 'redeem';
  input: bigint;
  minimum: bigint;
  deadline: bigint;
  preview: bigint;
};
export type PendingVaultTransaction = {
  hash: Hash;
  owner: Address;
  approval?: bigint;
  review?: VaultReview;
};
const schema = z
  .object({
    chainId: z.literal(420420777),
    vault: address,
    asset: address,
    hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
    owner: address,
    approval: integer.optional(),
    review: z
      .object({
        owner: address,
        operation: z.enum(['deposit', 'redeem']),
        input: integer,
        minimum: integer,
        deadline: integer,
        preview: integer,
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((v) => (v.approval === undefined) !== (v.review === undefined));
// Only submitted transaction references and review terms are retained. No balance,
// position or successful execution is restored from browser storage.
export function decodePendingVault(
  raw: string,
  vault: Address,
  asset: Address,
): PendingVaultTransaction {
  if (raw.length > 4096) throw new Error('Pending reference exceeds limit.');
  const p = schema.parse(JSON.parse(raw));
  if (
    p.vault.toLowerCase() !== vault.toLowerCase() ||
    p.asset.toLowerCase() !== asset.toLowerCase()
  )
    throw new Error('Pending reference belongs to a different deployment.');
  if (p.review && p.review.owner.toLowerCase() !== p.owner.toLowerCase())
    throw new Error('Pending review owner mismatch.');
  return {
    hash: p.hash as Hash,
    owner: p.owner as Address,
    ...(p.approval !== undefined
      ? { approval: BigInt(p.approval) }
      : {
          review: {
            ...p.review!,
            owner: p.review!.owner as Address,
            input: BigInt(p.review!.input),
            minimum: BigInt(p.review!.minimum),
            deadline: BigInt(p.review!.deadline),
            preview: BigInt(p.review!.preview),
          },
        }),
  };
}
export function encodePendingVault(
  p: PendingVaultTransaction,
  vault: Address,
  asset: Address,
): string {
  return JSON.stringify({ chainId: 420420777, vault, asset, ...p }, (_key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
  );
}
