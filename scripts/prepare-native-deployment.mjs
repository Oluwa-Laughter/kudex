// Prepares ONE native revive deployment for review/signing in native wallet tooling.
// Read-only: no private keys, no signing and no transaction submission.
import { ApiPromise, HttpProvider } from '@polkadot/api';
import { readFile } from 'node:fs/promises';
import { encodeAbiParameters, keccak256, parseUnits } from 'viem';

const argv = process.argv.slice(2);
function option(key) {
  const index = argv.indexOf(key);
  return index < 0 ? undefined : argv[index + 1];
}
const contract = option('--contract');
const origin = option('--origin');
const capText = option('--storage-cap');
const allowed = [
  'KudexTestToken',
  'Groth16Verifier',
  'KudexVault',
  'KudexRFQMarket',
  'KudexDaaSAdapter',
];
if (
  !allowed.includes(contract) ||
  !origin ||
  !capText ||
  !/^\d+(\.\d{1,14})?$/.test(capText)
) {
  console.error(
    'Usage: pnpm prepare:native --contract KudexTestToken --origin <native SS58 address> --storage-cap <maximum tPOT storage deposit> [--args JSON-array]',
  );
  process.exit(1);
}
let api;
const timeout = setTimeout(() => {
  console.error('Native preparation timed out; no transaction was sent.');
  process.exit(1);
}, 40_000);
try {
  const cap = parseUnits(capText, 14);
  if (cap <= 0n) throw new Error('Storage cap must be positive.');
  const ws = process.env.PORTALDOT_NATIVE_WS || 'wss://test-node-v3.portaldot.dev';
  api = await ApiPromise.create({
    provider: new HttpProvider(ws.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')),
    noInitWarn: true,
    throwOnConnect: true,
  });
  if (
    api.genesisHash.toHex() !==
      '0xd4f9acbcf7f52388d8b095abe3c198d19fc510e0343e643e87cfbccb155283bd' ||
    Number(api.consts.revive.chainId.toString()) !== 420420777 ||
    !api.consts.revive.allowEVMBytecode.isTrue
  )
    throw new Error('Native runtime identity or EVM capability mismatch.');
  const accountId = api.createType('AccountId', origin);
  const account = await api.query.system.account(accountId);
  if (account.data.free.isZero())
    throw new Error(
      'The native account has no tPOT. Wait for faucet funding before preparing a payable deployment.',
    );
  const artifact = JSON.parse(
    await readFile(
      new URL(`../contracts/out/${contract}.sol/${contract}.json`, import.meta.url),
      'utf8',
    ),
  );
  const constructor = artifact.abi.find((item) => item.type === 'constructor');
  const data = encodeAbiParameters(
    constructor?.inputs ?? [],
    JSON.parse(option('--args') || '[]'),
  );
  const code = artifact.bytecode.object;
  const estimate = await api.call.reviveApi.instantiate(
    accountId,
    0,
    null,
    cap.toString(),
    { Upload: code },
    data,
    null,
  );
  if (estimate.result.isErr)
    throw new Error(
      'Native constructor simulation rejected the deployment. Check funding, storage cap and constructor arguments.',
    );
  const execution = estimate.result.asOk.result;
  if (!execution || (BigInt(execution.flags.toString()) & 1n) !== 0n)
    throw new Error('Constructor reverted.');
  const weight = {
    refTime: (
      (BigInt(estimate.gasRequired.refTime.toString()) * 120n + 99n) /
      100n
    ).toString(),
    proofSize: (
      (BigInt(estimate.gasRequired.proofSize.toString()) * 120n + 99n) /
      100n
    ).toString(),
  };
  const tx = api.tx.revive.instantiateWithCode(
    0,
    weight,
    cap.toString(),
    code,
    data,
    null,
  );
  const fee = await tx.paymentInfo(accountId);
  console.log(
    JSON.stringify(
      {
        mode: 'unsigned native extrinsic; not submitted',
        chainId: 420420777,
        genesisHash: api.genesisHash.toHex(),
        origin: accountId.toString(),
        contractFacingOrigin: (await api.call.reviveApi.address(accountId)).toHex(),
        contract,
        method: 'revive.instantiateWithCode',
        valueNativeBaseUnits: '0',
        storageDepositCapNativeBaseUnits: cap.toString(),
        estimatedPartialFeeNativeBaseUnits: fee.partialFee.toString(),
        weightLimit: weight,
        codeHash: keccak256(code),
        constructorData: data,
        callHex: tx.method.toHex(),
        simulation: estimate.toJSON(),
        signing:
          'Decode callHex in native extrinsic tooling, select the SAME native account, review fee/storage cap, and sign in your wallet. Rerun preparation immediately before signing; addresses derived during simulation are provisional until finalized.',
      },
      null,
      2,
    ),
  );
} catch (error) {
  const known = [
    'The native account',
    'Storage cap',
    'Native runtime',
    'Native constructor',
    'Constructor reverted',
  ];
  console.error(
    known.some((prefix) => error.message?.startsWith(prefix))
      ? error.message
      : 'Native preparation failed. Check the artifact, public address, constructor arguments and RPC availability.',
  );
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  await api?.disconnect();
}
