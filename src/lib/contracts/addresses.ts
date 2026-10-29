import { isAddress, zeroAddress, type Address } from 'viem';

// Literal env access is required for Next.js to inline public variables in browser builds.
function configuredAddress(value: string | undefined): Address {
  return value && isAddress(value) && value !== zeroAddress ? value : zeroAddress;
}

const vault = configuredAddress(process.env.NEXT_PUBLIC_VAULT_ADDRESS);
const rfqMarket = configuredAddress(process.env.NEXT_PUBLIC_RFQ_ROUTER_ADDRESS);
const daasAdapter = configuredAddress(process.env.NEXT_PUBLIC_DAAS_ADAPTER_ADDRESS);
const verifier = configuredAddress(process.env.NEXT_PUBLIC_VERIFIER_ADDRESS);
const usdc = configuredAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS);

export const CONTRACT_ADDRESSES = {
  vault,
  rfqMarket,
  daasAdapter,
  verifier,
  usdc,
} as const;

export const isVaultConfigured = vault !== zeroAddress && usdc !== zeroAddress;

// Populated by the receipt/artifact-verifying deployment importer, never guessed.
export const VAULT_CODE_HASH = process.env.NEXT_PUBLIC_VAULT_CODE_HASH;
export const COLLATERAL_CODE_HASH = process.env.NEXT_PUBLIC_COLLATERAL_CODE_HASH;
export const isVaultProvenanceConfigured =
  isVaultConfigured &&
  /^0x[0-9a-fA-F]{64}$/.test(VAULT_CODE_HASH ?? '') &&
  /^0x[0-9a-fA-F]{64}$/.test(COLLATERAL_CODE_HASH ?? '');

// Execution allowlist populated only after asset/source and deployment review.
export const RFQ_CODE_HASH = process.env.NEXT_PUBLIC_RFQ_CODE_HASH;
export function parseRfqAssetPins(
  raw: string | undefined,
): Readonly<Record<string, string>> {
  if (!raw) return {};
  try {
    if (raw.length > 6000) return {};
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const entries = Object.entries(value);
    if (
      entries.length > 32 ||
      entries.some(
        ([a, h]) =>
          !isAddress(a) ||
          a.toLowerCase() === zeroAddress ||
          typeof h !== 'string' ||
          !/^0x[0-9a-f]{64}$/i.test(h),
      )
    )
      return {};
    return Object.fromEntries(entries.map(([a, h]) => [a.toLowerCase(), h as string]));
  } catch {
    return {};
  }
}
export const RFQ_ASSET_PINS: Readonly<Record<string, string>> = {
  ...(isVaultProvenanceConfigured ? { [usdc.toLowerCase()]: COLLATERAL_CODE_HASH! } : {}),
  ...parseRfqAssetPins(process.env.NEXT_PUBLIC_RFQ_ASSET_PINS),
};
