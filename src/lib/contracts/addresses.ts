const getEnvAddress = (key: string, defaultAddress?: `0x${string}`): `0x${string}` => {
  const value = process.env[key];
  if (value && value.startsWith('0x') && value.length === 42) {
    return value as `0x${string}`;
  }
  if (defaultAddress) {
    return defaultAddress;
  }
  throw new Error(`Missing required environment configuration: ${key}. Please configure this in your .env.local file.`);
};

// Canonical Portaldot EVM Deployments
const vaultAddress = getEnvAddress(
  'NEXT_PUBLIC_VAULT_ADDRESS',
  '0x39a04aA367a783637172DEb547849cb151909e74'
);

const rfqMarketAddress = getEnvAddress(
  'NEXT_PUBLIC_RFQ_ROUTER_ADDRESS',
  '0x1111111254fb6c44bac0bed2854e76f90643097d'
);

const daasAdapterAddress = getEnvAddress(
  'NEXT_PUBLIC_DAAS_ADAPTER_ADDRESS',
  '0x66f446059d0840A6e95cDF07e60A441865F87b5a'
);

const verifierAddress = getEnvAddress(
  'NEXT_PUBLIC_VERIFIER_ADDRESS',
  '0x43a8B5cD84F3910c81D00B36E92b192809A18e38'
);

const usdcAddress = getEnvAddress(
  'NEXT_PUBLIC_USDC_ADDRESS',
  '0x2055b0aEB50C7738222A955376F0E047242C2e85'
);

export const CONTRACT_ADDRESSES = {
  // Direct canonical handles
  vault: vaultAddress,
  rfqMarket: rfqMarketAddress,
  daasAdapter: daasAdapterAddress,
  verifier: verifierAddress,
  usdc: usdcAddress,

  // Compatibility aliases
  portaldotVaultPUSD: vaultAddress,
  portaldotVaultWPOT: '0x8B75F397f3549Eb8EecA2740751A464aF919C748' as `0x${string}`,
  rfqMarketRouter: rfqMarketAddress,

  tokens: {
    pUSD: {
      address: usdcAddress,
      symbol: 'pUSD',
      name: 'Portaldot Shielded USD',
      decimals: 6,
    },
    wPOT: {
      address: '0x4200000000000000000000000000000000000006' as `0x${string}`,
      symbol: 'wPOT',
      name: 'Wrapped Portaldot Token',
      decimals: 14,
    },
    POT: {
      address: '0x0000000000000000000000000000000000000000' as `0x${string}`,
      symbol: 'POT',
      name: 'Native Portaldot Token',
      decimals: 14,
    },
    kRealEstate: {
      address: '0x99A80aC93B330F77287950E5516b27B3d4924A12' as `0x${string}`,
      symbol: 'kRE-Prime',
      name: 'Fractional Real Estate Senior Note',
      decimals: 6,
    },
  },
} as const;
