// Read-only native/EVM inspection. Arguments are public addresses, never keys.
import { ApiPromise, HttpProvider } from '@polkadot/api';
import { formatUnits, isAddress } from 'viem';

const args = process.argv.slice(2);
function option(name) {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}
const nativeAddress = option('--native-address');
const evmAddress = option('--evm-address');
if (evmAddress && !isAddress(evmAddress)) throw new Error('Invalid public EVM address');
const nativeWs = process.env.PORTALDOT_NATIVE_WS || 'wss://test-node-v3.portaldot.dev';
// HTTP on the same native host was separately probed. Large metadata responses
// currently time out over the native WebSocket proxy; this tool uses HTTP.
const nativeHttp = nativeWs.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
const evmRpc =
  process.env.NEXT_PUBLIC_PORTALDOT_RPC_HTTP || 'https://test-evm-rpc-v3.portaldot.dev';
let api;
const timeout = setTimeout(() => {
  console.error('Native inspection timed out');
  process.exit(1);
}, 40_000);
try {
  api = await ApiPromise.create({
    provider: new HttpProvider(nativeHttp),
    noInitWarn: true,
    throwOnConnect: true,
  });
  const properties = await api.rpc.system.properties();
  const nativeDecimals = properties.tokenDecimals.unwrapOrDefault()[0]?.toNumber();
  const ratio = BigInt(api.consts.revive.nativeToEthRatio.toString());
  const nativeChainId = Number(api.consts.revive.chainId.toString());
  const allowEVMBytecode = api.consts.revive.allowEVMBytecode.isTrue;
  const ratioPower = ratio.toString().length - 1;
  if (10n ** BigInt(ratioPower) !== ratio)
    throw new Error('Unexpected native/EVM denomination ratio');
  const evmDecimals = nativeDecimals + ratioPower;
  const response = await fetch(evmRpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_chainId',
      params: [],
    }),
    signal: AbortSignal.timeout(12_000),
  });
  const chain = await response.json();
  if (
    chain.error ||
    Number(BigInt(chain.result)) !== nativeChainId ||
    nativeChainId !== 420420777
  )
    throw new Error('Native/EVM chain identity mismatch');
  const report = {
    chainId: nativeChainId,
    genesisHash: api.genesisHash.toHex(),
    specName: api.runtimeVersion.specName.toString(),
    specVersion: api.runtimeVersion.specVersion.toNumber(),
    nativeDecimals,
    nativeToEthRatio: ratio.toString(),
    evmDecimals,
    allowEVMBytecode,
    palletNames: api.runtimeMetadata.asLatest.pallets.map((pallet) =>
      pallet.name.toString(),
    ),
    daasNamedInterfaces: Object.keys(api.tx)
      .filter((name) => /daas|default|bankrupt|liquidat|recover|court/i.test(name))
      .map((name) => ({ name, methods: Object.keys(api.tx[name]) })),
  };
  if (nativeAddress) {
    const accountId = api.createType('AccountId', nativeAddress);
    const account = await api.query.system.account(accountId);
    report.nativeWallet = {
      address: accountId.toString(),
      freeBaseUnits: account.data.free.toString(),
      freeTPOT: formatUnits(BigInt(account.data.free.toString()), nativeDecimals),
    };
    report.nativeWallet.reviveAddress = (
      await api.call.reviveApi.address(accountId)
    ).toHex();
  }
  if (evmAddress) {
    const mapped = await api.call.reviveApi.accountId(evmAddress);
    const account = await api.query.system.account(mapped);
    report.evmWallet = {
      address: evmAddress,
      nativeFundingAddress: mapped.toString(),
      nativeFreeBaseUnits: account.data.free.toString(),
      nativeFreeTPOT: formatUnits(BigInt(account.data.free.toString()), nativeDecimals),
    };
  }
  console.log(JSON.stringify(report, null, 2));
} catch {
  console.error(
    'Portaldot inspection failed. Check public addresses, endpoint availability and runtime compatibility. No transaction was sent.',
  );
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  await api?.disconnect();
}
