export const CONTRACT_ADDRESSES = {
  portaldotVaultPUSD: '0x39a04aA367a783637172DEb547849cb151909e74' as `0x${string}`,
  portaldotVaultWPOT: '0x8B75F397f3549Eb8EecA2740751A464aF919C748' as `0x${string}`,
  rfqMarketRouter: '0x1111111254fb6c44bac0bed2854e76f90643097d' as `0x${string}`,
  daasAdapter: '0x66f446059d0840A6e95cDF07e60A441865F87b5a' as `0x${string}`,
  tokens: {
    pUSD: {
      address: '0x2055b0aEB50C7738222A955376F0E047242C2e85' as `0x${string}`,
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
