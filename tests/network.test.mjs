import test from 'node:test';
import assert from 'node:assert/strict';
import { parseUnits } from 'viem';
import { parsePOT } from '../src/lib/math.ts';

const keys = [
  'NEXT_PUBLIC_PORTALDOT_CHAIN_ID',
  'NEXT_PUBLIC_PORTALDOT_RPC_HTTP',
  'NEXT_PUBLIC_PORTALDOT_GAS_DECIMALS',
  'NEXT_PUBLIC_PORTALDOT_NATIVE_WS',
];
let revision = 0;
async function configuration(env = {}) {
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    Object.assign(process.env, env);
    return await import(`../src/lib/chains/portaldot.ts?test=${++revision}`);
  } finally {
    for (const key of keys)
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
  }
}

test('official defaults select the announced V3 network and Ethereum denomination', async () => {
  const { portaldotTestnet: chain, isNetworkConfigured } = await configuration();
  assert.equal(chain.id, 420420777);
  assert.equal(chain.nativeCurrency.decimals, 18);
  assert.equal(chain.nativeCurrency.symbol, 'tPOT');
  assert.equal(chain.rpcUrls.default.http[0], 'https://test-evm-rpc-v3.portaldot.dev');
  assert.equal(isNetworkConfigured, true);
  assert.equal(chain.rpcUrls.default.webSocket, undefined);
  assert.equal(chain.contracts?.multicall3, undefined);
});
test('native POT and EVM tPOT retain their distinct units', async () => {
  const { portaldotTestnet: chain } = await configuration();
  assert.equal(parsePOT('1'), 100_000_000_000_000n);
  assert.equal(parseUnits('1', chain.nativeCurrency.decimals), parsePOT('1') * 10_000n);
});
test('retired chain ID cannot enable transactions', async () => {
  const config = await configuration({
    NEXT_PUBLIC_PORTALDOT_CHAIN_ID: '8890',
  });
  assert.equal(config.isNetworkConfigured, false);
  assert.equal(config.portaldotTestnet.id, 420420777);
});
test('native decimals cannot be substituted for Ethereum decimals', async () => {
  const config = await configuration({
    NEXT_PUBLIC_PORTALDOT_GAS_DECIMALS: '14',
  });
  assert.equal(config.isNetworkConfigured, false);
});
test('a native WebSocket endpoint cannot be used as an EVM HTTP transport', async () => {
  const config = await configuration({
    NEXT_PUBLIC_PORTALDOT_RPC_HTTP: 'wss://test-node-v3.portaldot.dev',
  });
  assert.equal(config.isNetworkConfigured, false);
});
