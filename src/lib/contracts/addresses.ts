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
  portaldotVaultPUSD: vault,
  portaldotVaultWPOT: configuredAddress(process.env.NEXT_PUBLIC_WPOT_VAULT_ADDRESS),
  rfqMarketRouter: rfqMarket,
  tokens: {
    pUSD: {
      address: usdc,
      symbol: 'pUSD',
      name: 'Test collateral',
      decimals: 6,
    },
    wPOT: {
      address: configuredAddress(process.env.NEXT_PUBLIC_WPOT_ADDRESS),
      symbol: 'wPOT',
      name: 'Wrapped POT',
      decimals: 18,
    },
    POT: {
      address: zeroAddress,
      symbol: 'POT',
      name: 'Portaldot Token',
      decimals: 18,
    },
    kRealEstate: {
      address: configuredAddress(process.env.NEXT_PUBLIC_RWA_ADDRESS),
      symbol: 'kRE-Prime',
      name: 'RWA token',
      decimals: 6,
    },
  },
} as const;

export const isVaultConfigured = vault !== zeroAddress && usdc !== zeroAddress;

// Populated by the receipt/artifact-verifying deployment importer, never guessed.
export const VAULT_CODE_HASH = process.env.NEXT_PUBLIC_VAULT_CODE_HASH;
export const COLLATERAL_CODE_HASH = process.env.NEXT_PUBLIC_COLLATERAL_CODE_HASH;
export const isVaultProvenanceConfigured =
  isVaultConfigured &&
  /^0x[0-9a-fA-F]{64}$/.test(VAULT_CODE_HASH ?? '') &&
  /^0x[0-9a-fA-F]{64}$/.test(COLLATERAL_CODE_HASH ?? '');
