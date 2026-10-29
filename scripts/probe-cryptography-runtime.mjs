import { readFile, writeFile } from 'node:fs/promises';
import { createPublicClient, http, decodeAbiParameters } from 'viem';
const client = createPublicClient({
  transport: http(
    process.env.NEXT_PUBLIC_PORTALDOT_RPC_HTTP || 'https://test-evm-rpc-v3.portaldot.dev',
    { timeout: 45000, retryCount: 0 },
  ),
});
if ((await client.getChainId()) !== 420420777) throw Error('Unexpected chain');
const artifact = JSON.parse(
  await readFile('contracts/out/CryptoProbe.sol/CryptoProbe.json', 'utf8'),
);
const block = await client.getBlock();
const from = '0x0000000000000000000000000000000000001234';
const result = await client.request({
  method: 'eth_call',
  params: [
    { from, data: artifact.bytecode.object, value: '0x0' },
    '0x' + block.number.toString(16),
    { [from]: { balance: '0x33b2e3c9fd0803ce8000000' } },
  ],
});
const [checks] = decodeAbiParameters([{ type: 'bool[5]' }], result);
const report = {
  observedAt: new Date().toISOString(),
  chainId: 420420777,
  block: block.number.toString(),
  blockHash: block.hash,
  method:
    'ephemeral CryptoProbe constructor via eth_call and diagnostic balance state override; no broadcast',
  allPassed: checks.every(Boolean),
  checks: Object.fromEntries(
    [
      'ecadd-identity',
      'ecmul-one',
      'pairing-nonidentity',
      'pairing-cancellation',
      'pairing-malformed-rejection',
    ].map((name, i) => [name, checks[i]]),
  ),
  rawResult: result,
};
await writeFile(
  'docs/PORTALDOT_CRYPTO_PROBES.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
if (!report.allPassed) process.exitCode = 1;
