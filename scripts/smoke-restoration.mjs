// Read-only actual-runtime diagnostic with ephemeral assets. No wallet, key or broadcast.
import { readFile, writeFile } from 'node:fs/promises';
import { createPublicClient, http, decodeAbiParameters, keccak256 } from 'viem';
const client = createPublicClient({
  transport: http(
    process.env.NEXT_PUBLIC_PORTALDOT_RPC_HTTP || 'https://test-evm-rpc-v3.portaldot.dev',
    { timeout: 55000, retryCount: 0 },
  ),
});
if ((await client.getChainId()) !== 420420777) throw Error('Unexpected network');
const artifact = JSON.parse(
  await readFile('contracts/out/RestorationSmoke.sol/RestorationSmoke.json', 'utf8'),
);
const from = '0x0000000000000000000000000000000000001234';
const block = await client.getBlock();
const data = await client.request({
  method: 'eth_call',
  params: [
    { from, data: artifact.bytecode.object, value: '0x0' },
    '0x' + block.number.toString(16),
    { [from]: { balance: '0x33b2e3c9fd0803ce8000000' } },
  ],
});
const [rfq, credit] = decodeAbiParameters([{ type: 'bool' }, { type: 'bool' }], data);
if (!rfq || !credit) throw Error('Runtime assertions failed');
const report = {
  observedAt: new Date().toISOString(),
  chainId: 420420777,
  block: block.number.toString(),
  blockHash: block.hash,
  mode: 'read-only ephemeral constructor eth_call with diagnostic balance override; no deployment or transaction receipt',
  creationCodeHash: keccak256(artifact.bytecode.object),
  checks: {
    policyBoundRfqExactTransfersAndRevocation: rfq,
    creditSubscriptionRepaymentWaterfallAndClaims: credit,
  },
};
await writeFile(
  'docs/PORTALDOT_RESTORATION_SMOKE.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
