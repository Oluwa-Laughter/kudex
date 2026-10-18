import { defineChain } from 'viem';

// Organizer announcement, verified against V3 runtime 3002 on 2026-10-17.
export const PORTALDOT_TESTNET_CHAIN_ID = 420420777;
export const PORTALDOT_NATIVE_DECIMALS = 14;
export const PORTALDOT_EVM_DECIMALS = 18; // revive.nativeToEthRatio = 10_000
export const PORTALDOT_NATIVE_WS =
  process.env.NEXT_PUBLIC_PORTALDOT_NATIVE_WS || 'wss://test-node-v3.portaldot.dev';
export const PORTALDOT_NODE_CONSOLE = 'https://node-console.portaldot.dev/';

const chainId = Number(
  process.env.NEXT_PUBLIC_PORTALDOT_CHAIN_ID || PORTALDOT_TESTNET_CHAIN_ID,
);
const decimals = Number(
  process.env.NEXT_PUBLIC_PORTALDOT_GAS_DECIMALS || PORTALDOT_EVM_DECIMALS,
);
const rpc =
  process.env.NEXT_PUBLIC_PORTALDOT_RPC_HTTP || 'https://test-evm-rpc-v3.portaldot.dev';
export const isNetworkConfigured =
  /^https?:\/\//.test(rpc) &&
  chainId === PORTALDOT_TESTNET_CHAIN_ID &&
  decimals === PORTALDOT_EVM_DECIMALS;

// EVM execution extends Portaldot's native network. The native WebSocket endpoint
// is NOT an Ethereum WebSocket endpoint and must not be passed to an EVM transport.
export const portaldotTestnet = defineChain({
  id: PORTALDOT_TESTNET_CHAIN_ID,
  name: 'Portaldot V3 Testnet',
  nativeCurrency: {
    name: 'Test Portaldot Token',
    symbol: 'tPOT',
    decimals: PORTALDOT_EVM_DECIMALS,
  },
  rpcUrls: { default: { http: [rpc] } },
  blockExplorers: {
    default: { name: 'Portaldot Node Console', url: PORTALDOT_NODE_CONSOLE },
  },
  testnet: true,
});
