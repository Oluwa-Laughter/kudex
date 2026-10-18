// Executes compiled contract logic inside eth_call. NEVER broadcasts or creates durable state.
import { readFile } from 'node:fs/promises';
import { createPublicClient, decodeAbiParameters, http } from 'viem';

const rpc =
  process.env.NEXT_PUBLIC_PORTALDOT_RPC_HTTP || 'https://test-evm-rpc-v3.portaldot.dev';
const client = createPublicClient({
  transport: http(rpc, { timeout: 45_000, retryCount: 0 }),
});
try {
  if ((await client.getChainId()) !== 420420777) throw new Error('Unexpected chain');
  const artifact = JSON.parse(
    await readFile(
      new URL('../contracts/out/RuntimeSmoke.sol/RuntimeSmoke.json', import.meta.url),
      'utf8',
    ),
  );
  const account = '0x0000000000000000000000000000000000001234';
  const blockNumber = await client.getBlockNumber();
  const result = await client.request({
    method: 'eth_call',
    params: [
      { from: account, data: artifact.bytecode.object, value: '0x0' },
      `0x${blockNumber.toString(16)}`,
      { [account]: { balance: '0x33b2e3c9fd0803ce8000000' } },
    ],
  });
  const [passed, vaultAssets, makerReceived, frozen] = decodeAbiParameters(
    [{ type: 'bool' }, { type: 'uint256' }, { type: 'uint256' }, { type: 'bool' }],
    result,
  );
  if (!passed || vaultAssets !== 60n || makerReceived !== 50n || !frozen)
    throw new Error('Unexpected result');
  console.log(
    JSON.stringify(
      {
        chainId: 420420777,
        blockNumber: blockNumber.toString(),
        mode: 'read-only eth_call with ephemeral diagnostic assets',
        passed,
        checks: [
          'public vault deposit and withdrawal',
          'ERC-1271 authorized RFQ settlement',
          'replay and unsigned-order rejection',
          'risk freeze with withdrawals available',
          'disabled placeholder verifier',
        ],
      },
      null,
      2,
    ),
  );
} catch {
  console.error(
    'Runtime smoke check failed. Build contracts/testnet/RuntimeSmoke.sol, verify RPC availability and review runtime compatibility. No transaction was sent.',
  );
  process.exitCode = 1;
}
