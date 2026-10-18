// Read-only deployment preflight. Never logs RPC URLs, credentials or private keys.
const rpcUrl =
  process.env.NEXT_PUBLIC_PORTALDOT_RPC_HTTP || 'https://test-evm-rpc-v3.portaldot.dev';
const chainId = Number(process.env.NEXT_PUBLIC_PORTALDOT_CHAIN_ID || '420420777');
const gasDecimals = Number(process.env.NEXT_PUBLIC_PORTALDOT_GAS_DECIMALS || '18');
if (
  !rpcUrl ||
  !Number.isSafeInteger(chainId) ||
  chainId !== 420420777 ||
  !Number.isInteger(gasDecimals) ||
  gasDecimals !== 18
) {
  console.error(
    'Preflight blocked: supply the officially confirmed RPC, chain ID and gas decimals.',
  );
  process.exit(1);
}
let id = 0;
async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`${method}: HTTP ${response.status}`);
  const data = await response.json();
  if (data.error || data.result === undefined)
    throw new Error(`${method}: RPC method unavailable or rejected`);
  return data.result;
}
try {
  const actual = BigInt(await rpc('eth_chainId'));
  if (actual !== BigInt(chainId))
    throw new Error('RPC chain ID differs from configured chain ID');
  const block = await rpc('eth_getBlockByNumber', ['latest', false]);
  if (!block?.number || !block?.hash)
    throw new Error('Latest EVM block was not returned');
  console.log(`Chain ID verified: ${actual}; latest RPC block: ${BigInt(block.number)}`);
  const rpcOnly = process.argv.includes('--rpc-only');
  let missing = false;
  for (const [name, key] of Object.entries(
    rpcOnly
      ? {}
      : {
          Vault: 'NEXT_PUBLIC_VAULT_ADDRESS',
          RFQ: 'NEXT_PUBLIC_RFQ_ROUTER_ADDRESS',
          Collateral: 'NEXT_PUBLIC_USDC_ADDRESS',
          RiskAdapter: 'NEXT_PUBLIC_DAAS_ADAPTER_ADDRESS',
        },
  )) {
    const address = process.env[key];
    if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address) || /^0x0{40}$/.test(address)) {
      console.error(`${name}: deployment address missing or invalid`);
      missing = true;
      continue;
    }
    const code = await rpc('eth_getCode', [address, 'latest']);
    if (!code || code === '0x') {
      console.error(`${name}: no deployed code`);
      missing = true;
    } else console.log(`${name}: deployed code returned`);
  }
  if (missing) {
    console.error('RPC identity passed; contract deployment is incomplete.');
    process.exitCode = 1;
  }
  console.log(
    'This checks RPC identity and code presence only. Use the native inspector for runtime/account mapping and the runtime smoke check for read-only contract execution. Only successful receipts establish deployment.',
  );
} catch (error) {
  // Do not forward fetch errors: they can contain credentials embedded in an RPC URL.
  const message = error instanceof Error ? error.message : '';
  console.error(
    /^(eth_|RPC chain ID differs|Latest EVM block)/.test(message)
      ? message
      : 'Network preflight failed. Verify RPC availability.',
  );
  process.exitCode = 1;
}
