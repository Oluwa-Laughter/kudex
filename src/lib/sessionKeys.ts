import { parsePOT } from './math';

export interface KudexSessionPolicy {
  validUntil: number;
  spendingLimitPOT: bigint;
  whitelistedRouter: `0x${string}`;
  canTransferNative: boolean;
  canUpgradeAccount: boolean;
}

export interface ActiveSessionKey {
  id: string;
  sessionPublicKey: `0x${string}`;
  policy: KudexSessionPolicy;
  spentAmountPOT: bigint;
  status: 'active' | 'revoked' | 'expired';
  createdAt: number;
}

export function buildKudexSessionPolicy(
  routerAddress: `0x${string}`,
  durationHours: number = 2,
  spendingCapPOTString: string = '500'
): KudexSessionPolicy {
  return {
    validUntil: Math.floor(Date.now() / 1000) + durationHours * 3600,
    spendingLimitPOT: parsePOT(spendingCapPOTString),
    whitelistedRouter: routerAddress,
    canTransferNative: false,
    canUpgradeAccount: false,
  };
}

export function isSessionKeyValid(policy: KudexSessionPolicy, currentSpend: bigint): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (now > policy.validUntil) return false;
  if (currentSpend > policy.spendingLimitPOT) return false;
  return true;
}
