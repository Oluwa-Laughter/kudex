// One bounded deposit attempt. Dry-run by default. Signing remains in a Foundry keystore.
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createPublicClient, http, isAddress } from 'viem';
const args = process.argv.slice(2);
function option(name) {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}
try {
  const executor = option('--executor'),
    policyId = option('--policy'),
    rawAmount = option('--amount-base-units');
  if (
    !isAddress(executor ?? '') ||
    !/^0x[0-9a-fA-F]{64}$/.test(policyId ?? '') ||
    !/^\d+$/.test(rawAmount ?? '')
  )
    throw new Error(
      'Usage: pnpm agent:run --executor 0x… --policy 0x… --amount-base-units 1000000 [--execute --account keystore-name]',
    );
  const amount = BigInt(rawAmount);
  if (amount <= 0n || amount >= 2n ** 256n)
    throw new Error('Amount must fit a positive uint256.');
  const client = createPublicClient({
    transport: http(
      process.env.NEXT_PUBLIC_PORTALDOT_RPC_HTTP ||
        'https://test-evm-rpc-v3.portaldot.dev',
      { timeout: 20000, retryCount: 0 },
    ),
  });
  if ((await client.getChainId()) !== 420420777)
    throw new Error('Expected Portaldot V3 testnet.');
  const code = await client.getBytecode({ address: executor });
  if (!code || code === '0x') throw new Error('No executor code at this address.');
  const artifact = JSON.parse(
    await readFile(
      new URL(
        '../contracts/out/KudexAgentExecutor.sol/KudexAgentExecutor.json',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  const policy = await client.readContract({
    address: executor,
    abi: artifact.abi,
    functionName: 'policies',
    args: [policyId],
  });
  const [
    owner,
    delegate,
    vault,
    asset,
    expiresAt,
    revoked,
    perAction,
    daily,
    total,
    spent,
    day,
    daySpent,
  ] = policy;
  const block = await client.getBlock();
  const today = block.timestamp / 86400n;
  if (revoked || block.timestamp >= expiresAt)
    throw new Error('Policy is revoked, expired, or missing.');
  if (
    amount > perAction ||
    amount > total - spent ||
    amount > daily - (day === today ? daySpent : 0n)
  )
    throw new Error('Requested deposit exceeds policy limits.');
  await client.simulateContract({
    address: executor,
    abi: artifact.abi,
    functionName: 'execute',
    args: [policyId, amount],
    account: delegate,
  });
  console.log(
    JSON.stringify(
      {
        mode: args.includes('--execute') ? 'signing-requested' : 'dry-run',
        chainId: 420420777,
        executor,
        policyId,
        owner,
        delegate,
        vault,
        asset,
        amountBaseUnits: amount.toString(),
        block: block.number.toString(),
        simulation: 'passed',
      },
      null,
      2,
    ),
  );
  if (args.includes('--execute')) {
    const account = option('--account');
    if (!account || !/^[a-zA-Z0-9_-]{1,80}$/.test(account))
      throw new Error('An explicit Foundry keystore name is required for execution.');
    const signer = spawnSync('cast', ['wallet', 'address', '--account', account], {
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'inherit'],
    });
    if (
      signer.status !== 0 ||
      signer.stdout.trim().toLowerCase() !== delegate.toLowerCase()
    )
      throw new Error('Selected keystore does not match the authorized delegate.');
    const execution = spawnSync(
      'cast',
      [
        'send',
        '--account',
        account,
        '--from',
        delegate,
        '--rpc-url',
        client.transport.url,
        '--chain',
        '420420777',
        executor,
        'execute(bytes32,uint256)',
        policyId,
        amount.toString(),
      ],
      { stdio: 'inherit' },
    );
    if (execution.status !== 0)
      throw new Error('Execution failed. Inspect the receipt before retrying.');
  } else
    console.log(
      'No transaction was signed or broadcast. Use --execute and a matching local keystore only after reviewing the policy.',
    );
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Agent run failed.');
  process.exitCode = 1;
}
