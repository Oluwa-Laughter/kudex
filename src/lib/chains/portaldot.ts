import { defineChain } from 'viem';

export const portaldotTestnet = defineChain({
  id: 8890,
  name: 'Portaldot Testnet',
  nativeCurrency: {
    name: 'Portaldot Token',
    symbol: 'POT',
    decimals: 14, // Portaldot native token specification
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_PORTALDOT_RPC_HTTP || 'https://testnet-evm.portaldot.world'],
      webSocket: [process.env.NEXT_PUBLIC_PORTALDOT_RPC_WS || 'wss://testnet-evm.portaldot.world/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Portaldot Explorer',
      url: 'https://testnet.portaldot.world/explorer',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 1,
    },
  },
  testnet: true,
});
