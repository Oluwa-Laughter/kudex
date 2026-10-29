// Import a completed Foundry deployment. Never accepts manually invented addresses.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  createPublicClient,
  encodeDeployData,
  http,
  isAddress,
  parseAbi,
  keccak256,
  zeroAddress,
} from 'viem';

const file = process.argv[2];
if (!file) {
  console.error(
    'Usage: node --env-file=.env.local scripts/configure-deployment.mjs contracts/broadcast/Deploy.s.sol/420420777/run-latest.json',
  );
  process.exit(1);
}
const root = new URL('../', import.meta.url);
const required = ['Groth16Verifier', 'KudexVault', 'KudexRFQMarket', 'KudexDaaSAdapter'];
const client = createPublicClient({
  transport: http(
    process.env.NEXT_PUBLIC_PORTALDOT_RPC_HTTP || 'https://test-evm-rpc-v3.portaldot.dev',
    { timeout: 15_000, retryCount: 1 },
  ),
});
try {
  const broadcast = JSON.parse(await readFile(resolve(file), 'utf8'));
  if (Number(broadcast.chain) !== 420420777) throw new Error('Wrong chain');
  const records = Object.fromEntries(
    required.map((name) => {
      const matches = broadcast.transactions?.filter(
        (tx) => tx.contractName === name && tx.transactionType === 'CREATE',
      );
      if (matches?.length !== 1 || !isAddress(matches[0].contractAddress))
        throw new Error('Incomplete or ambiguous deployment');
      return [name, matches[0]];
    }),
  );
  if ((await client.getChainId()) !== 420420777) throw new Error('Wrong RPC chain');
  const vault = records.KudexVault.contractAddress;
  const verifier = records.Groth16Verifier.contractAddress;
  const router = records.KudexRFQMarket.contractAddress;
  const adapter = records.KudexDaaSAdapter.contractAddress;
  const vaultAbi = parseAbi([
    'function asset() view returns (address)',
    'function owner() view returns (address)',
    'function verifier() view returns (address)',
    'function defaultController() view returns (address)',
  ]);
  const asset = await client.readContract({
    address: vault,
    abi: vaultAbi,
    functionName: 'asset',
  });
  const assetCode = await client.getBytecode({ address: asset });
  if (asset === zeroAddress || !assetCode || assetCode === '0x')
    throw new Error('Collateral has no code');
  const args = {
    Groth16Verifier: [],
    KudexRFQMarket: [],
    KudexDaaSAdapter: [vault],
    KudexVault: [asset, 'Kudex Public Treasury Vault', 'kVAULT', verifier],
  };
  const confirmed = {};
  let deployer;
  for (const name of required) {
    const tx = records[name];
    const artifact = JSON.parse(
      await readFile(new URL(`contracts/out/${name}.sol/${name}.json`, root), 'utf8'),
    );
    const [receipt, transaction, code] = await Promise.all([
      client.getTransactionReceipt({ hash: tx.hash }),
      client.getTransaction({ hash: tx.hash }),
      client.getBytecode({ address: tx.contractAddress }),
    ]);
    const [canonical, finalized] = await Promise.all([
      client.getBlock({ blockNumber: receipt.blockNumber }),
      client.getBlock({ blockTag: 'finalized' }),
    ]);
    if (canonical.hash !== receipt.blockHash || finalized.number < receipt.blockNumber)
      throw new Error('Deployment is not canonical and finalized');
    const expectedInput = encodeDeployData({
      abi: artifact.abi,
      bytecode: artifact.bytecode.object,
      args: args[name],
    });
    if (
      receipt.status !== 'success' ||
      receipt.contractAddress?.toLowerCase() !== tx.contractAddress.toLowerCase() ||
      !code ||
      code === '0x' ||
      transaction.input.toLowerCase() !== expectedInput.toLowerCase()
    )
      throw new Error('Unconfirmed or incompatible contract');
    if (deployer && receipt.from.toLowerCase() !== deployer.toLowerCase())
      throw new Error('Mixed deployment owners');
    deployer = receipt.from;
    confirmed[name] = {
      address: tx.contractAddress,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber.toString(),
      runtimeCodeHash: keccak256(code),
    };
  }
  const [owner, actualVerifier, controller, adapterOwner, registered] = await Promise.all(
    [
      client.readContract({
        address: vault,
        abi: vaultAbi,
        functionName: 'owner',
      }),
      client.readContract({
        address: vault,
        abi: vaultAbi,
        functionName: 'verifier',
      }),
      client.readContract({
        address: vault,
        abi: vaultAbi,
        functionName: 'defaultController',
      }),
      client.readContract({
        address: adapter,
        abi: parseAbi(['function owner() view returns (address)']),
        functionName: 'owner',
      }),
      client.readContract({
        address: adapter,
        abi: parseAbi([
          'function vaultProfiles(address) view returns (bool,uint256,uint256,uint256,bool)',
        ]),
        functionName: 'vaultProfiles',
        args: [vault],
      }),
    ],
  );
  const eq = (a, b) => a.toLowerCase() === b.toLowerCase();
  if (
    !eq(owner, deployer) ||
    !eq(adapterOwner, deployer) ||
    !eq(actualVerifier, verifier) ||
    !eq(controller, adapter) ||
    !registered[0]
  )
    throw new Error('Contract wiring or owner mismatch');
  const manifest = {
    chainId: 420420777,
    importedAt: new Date().toISOString(),
    deployer,
    collateral: asset,
    collateralRuntimeCodeHash: keccak256(assetCode),
    contracts: confirmed,
  };
  const dir = new URL('contracts/deployments/', root);
  await mkdir(dir, { recursive: true });
  await writeFile(
    new URL('420420777.json', dir),
    JSON.stringify(manifest, null, 2) + '\n',
    { mode: 0o644 },
  );
  const envFile = new URL('.env.local', root);
  let env = '';
  try {
    env = await readFile(envFile, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const values = {
    NEXT_PUBLIC_VAULT_ADDRESS: vault,
    NEXT_PUBLIC_VAULT_CODE_HASH: confirmed.KudexVault.runtimeCodeHash,
    NEXT_PUBLIC_COLLATERAL_CODE_HASH: keccak256(assetCode),
    NEXT_PUBLIC_RFQ_ROUTER_ADDRESS: router,
    NEXT_PUBLIC_RFQ_CODE_HASH: confirmed.KudexRFQMarket.runtimeCodeHash,
    NEXT_PUBLIC_DAAS_ADAPTER_ADDRESS: adapter,
    NEXT_PUBLIC_VERIFIER_ADDRESS: verifier,
    NEXT_PUBLIC_USDC_ADDRESS: asset,
    PORTALDOT_COLLATERAL_ADDRESS: asset,
  };
  const seen = new Set();
  const lines = env.split('\n').map((line) => {
    const key = line.split('=')[0].trim();
    if (!(key in values)) return line;
    seen.add(key);
    return `${key}=${values[key]}`;
  });
  for (const [key, value] of Object.entries(values))
    if (!seen.has(key)) lines.push(`${key}=${value}`);
  await writeFile(envFile, lines.join('\n').replace(/\n+$/, '') + '\n', {
    mode: 0o600,
  });
  console.log(
    'Verified deployment imported. Public manifest written; local addresses configured. Rebuild/restart the app to inline public configuration.',
  );
} catch {
  console.error(
    'Deployment import rejected. Check the broadcast chain, successful live receipts, local compiled artifacts, signer ownership and contract wiring. No addresses were configured unless all on-chain checks passed.',
  );
  process.exitCode = 1;
}
