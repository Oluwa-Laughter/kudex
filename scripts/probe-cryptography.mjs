// Read-only known-answer probes, NOT a verifier or proof-system activation.
import { writeFile } from 'node:fs/promises';
const rpc =
  process.env.NEXT_PUBLIC_PORTALDOT_RPC_HTTP || 'https://test-evm-rpc-v3.portaldot.dev';
let id = 0;
async function call(method, params) {
  const response = await fetch(rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
    signal: AbortSignal.timeout(15000),
  });
  const value = await response.json();
  if (value.error) throw Error(value.error.message);
  if (!response.ok || value.result === undefined) throw Error('RPC response unavailable');
  return value.result;
}
const word = (x) => BigInt(x).toString(16).padStart(64, '0');
const data = (a) => '0x' + a.map(word).join('');
const p = 21888242871839275222246405745257275088696311157297823662689037894645226208583n;
const g2 = [
  11559732032986387107991004021392285783925812861821192530917403151452391805634n,
  10857046999023057135944570762232829481370756359578518086990519993285655852781n,
  4082367875863433681332203403145435568316851327593401208105741076214120093531n,
  8495653923123431417604973247489272438418190587263600148770280649306958101930n,
];
const chain = await call('eth_chainId', []);
if (Number(BigInt(chain)) !== 420420777) throw Error('Unexpected chain');
const block = await call('eth_blockNumber', []);
const account = '0x0000000000000000000000000000000000001234';
const vectors = [
  ['ecadd-identity', 6, [1, 2, 0, 0], data([1, 2])],
  ['ecmul-one', 7, [1, 2, 1], data([1, 2])],
  ['pairing-nonidentity', 8, [1, 2, ...g2], data([0])],
  ['pairing-cancellation', 8, [1, 2, ...g2, 1, p - 2n, ...g2], data([1])],
  ['pairing-malformed-point', 8, [1, 3, ...g2], null],
];
const results = [];
for (const [name, address, input, expected] of vectors) {
  try {
    const result = await call('eth_call', [
      {
        from: account,
        to: '0x' + address.toString(16).padStart(40, '0'),
        data: data(input),
        gas: '0x989680',
      },
      block,
      { [account]: { balance: '0x33b2e3c9fd0803ce8000000' } },
    ]);
    results.push({
      name,
      address,
      input: data(input),
      expected,
      result,
      passed: expected !== null && result.toLowerCase() === expected,
    });
  } catch (e) {
    results.push({
      name,
      address,
      input: data(input),
      expected,
      error: e.message,
      passed:
        expected === null && !/Payment|timeout|fetch|response|connect/i.test(e.message),
    });
  }
}
const report = {
  observedAt: new Date().toISOString(),
  chainId: 420420777,
  block: BigInt(block).toString(),
  blockHash: (await call('eth_getBlockByNumber', [block, false])).hash,
  method:
    'read-only eth_call with diagnostic caller balance state override to EIP-196/197 addresses; not proof verification or deployment',
  allPassed: results.every((x) => x.passed),
  results,
};
await writeFile(
  'docs/PORTALDOT_CRYPTO_PROBES.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
if (!report.allPassed) process.exitCode = 1;
