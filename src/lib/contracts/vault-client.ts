import {
  erc20Abi,
  keccak256,
  parseEventLogs,
  type Address,
  type PublicClient,
  type TransactionReceipt,
} from 'viem';
import { kudexVaultAbi } from './abis.ts';
import { assertDeployment } from './readiness.ts';

export function exactAmount(value: string, decimals: number): bigint {
  if (
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 255 ||
    !/^\d+(\.\d+)?$/.test(value) ||
    value.length > 350 ||
    (value.split('.')[1]?.length ?? 0) > decimals
  )
    throw new Error('Enter an exact positive decimal amount within the token precision.');
  const [whole, fraction = ''] = value.split('.');
  const amount =
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, '0') || '0');
  if (amount <= 0n || amount > (1n << 256n) - 1n)
    throw new Error('Amount is outside uint256 bounds.');
  return amount;
}

export async function assertVaultProvenance(
  client: PublicClient,
  vault: Address,
  asset: Address,
  vaultHash?: string,
  assetHash?: string,
) {
  if (
    !/^0x[0-9a-fA-F]{64}$/.test(vaultHash ?? '') ||
    !/^0x[0-9a-fA-F]{64}$/.test(assetHash ?? '')
  )
    throw new Error('Verified deployment code hashes are required before spending.');
  await assertDeployment(client, [vault, asset]);
  const codes = await Promise.all([
    client.getBytecode({ address: vault }),
    client.getBytecode({ address: asset }),
  ]);
  if (
    !codes[0] ||
    !codes[1] ||
    keccak256(codes[0]).toLowerCase() !== vaultHash!.toLowerCase() ||
    keccak256(codes[1]).toLowerCase() !== assetHash!.toLowerCase()
  )
    throw new Error('Deployment runtime bytecode does not match the verified manifest.');
}

export async function readVault(
  client: PublicClient,
  vault: Address,
  asset: Address,
  owner: Address,
) {
  await assertDeployment(client, [vault, asset]);
  const block = await client.getBlock();
  const read = <T extends 'asset' | 'decimals' | 'totalAssets' | 'isDefaulted'>(
    functionName: T,
  ) =>
    client.readContract({
      address: vault,
      abi: kudexVaultAbi,
      functionName,
      blockNumber: block.number,
    });
  const actualAsset = await read('asset');
  if (actualAsset.toLowerCase() !== asset.toLowerCase())
    throw new Error('Configured collateral does not match vault.asset().');
  const [
    decimals,
    symbol,
    shareDecimals,
    totalAssets,
    frozen,
    balance,
    shares,
    allowance,
    maxDeposit,
    maxRedeem,
    maxWithdraw,
  ] = await Promise.all([
    client.readContract({
      address: asset,
      abi: erc20Abi,
      functionName: 'decimals',
      blockNumber: block.number,
    }),
    client.readContract({
      address: asset,
      abi: erc20Abi,
      functionName: 'symbol',
      blockNumber: block.number,
    }),
    read('decimals'),
    read('totalAssets'),
    read('isDefaulted'),
    client.readContract({
      address: asset,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [owner],
      blockNumber: block.number,
    }),
    client.readContract({
      address: vault,
      abi: kudexVaultAbi,
      functionName: 'balanceOf',
      args: [owner],
      blockNumber: block.number,
    }),
    client.readContract({
      address: asset,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [owner, vault],
      blockNumber: block.number,
    }),
    client.readContract({
      address: vault,
      abi: kudexVaultAbi,
      functionName: 'maxDeposit',
      args: [owner],
      blockNumber: block.number,
    }),
    client.readContract({
      address: vault,
      abi: kudexVaultAbi,
      functionName: 'maxRedeem',
      args: [owner],
      blockNumber: block.number,
    }),
    client.readContract({
      address: vault,
      abi: kudexVaultAbi,
      functionName: 'maxWithdraw',
      args: [owner],
      blockNumber: block.number,
    }),
  ]);
  const assets = await client.readContract({
    address: vault,
    abi: kudexVaultAbi,
    functionName: 'convertToAssets',
    args: [shares],
    blockNumber: block.number,
  });
  return {
    vault,
    asset,
    owner,
    decimals,
    symbol: symbol.slice(0, 64),
    shareDecimals,
    totalAssets,
    frozen,
    balance,
    shares,
    allowance,
    maxDeposit,
    maxRedeem,
    maxWithdraw,
    assets,
    block: block.number,
    timestamp: block.timestamp,
  };
}

export function verifyVaultReceipt(
  receipt: TransactionReceipt,
  vault: Address,
  owner: Address,
  operation: 'deposit' | 'redeem',
  input: bigint,
  minimum: bigint,
) {
  if (
    receipt.status !== 'success' ||
    receipt.to?.toLowerCase() !== vault.toLowerCase() ||
    receipt.from.toLowerCase() !== owner.toLowerCase()
  )
    throw new Error('Vault transaction reverted or receipt identity did not match.');
  const logs = receipt.logs.filter(
    (log) => log.address.toLowerCase() === vault.toLowerCase(),
  );
  if (operation === 'deposit') {
    const events = parseEventLogs({ abi: kudexVaultAbi, eventName: 'Deposit', logs });
    if (
      events.some(
        ({ args }) =>
          args.sender.toLowerCase() === owner.toLowerCase() &&
          args.owner.toLowerCase() === owner.toLowerCase() &&
          args.assets === input &&
          args.shares >= minimum,
      )
    )
      return;
  } else {
    const events = parseEventLogs({ abi: kudexVaultAbi, eventName: 'Withdraw', logs });
    if (
      events.some(
        ({ args }) =>
          args.sender.toLowerCase() === owner.toLowerCase() &&
          args.owner.toLowerCase() === owner.toLowerCase() &&
          args.receiver.toLowerCase() === owner.toLowerCase() &&
          args.shares === input &&
          args.assets >= minimum,
      )
    )
      return;
  }
  throw new Error(
    'Matching vault event missing. Requires reconciliation; do not retry blindly.',
  );
}

// Finality is reported only if the RPC supports the finalized tag and the receipt
// block is still canonical. Pruned history / unsupported tags remain confirmed.
export async function receiptFinality(
  client: PublicClient,
  receipt: TransactionReceipt,
): Promise<'confirmed' | 'finalized' | 'unknown'> {
  const canonical = await client.getBlock({ blockNumber: receipt.blockNumber });
  if (canonical.hash !== receipt.blockHash) return 'unknown';
  try {
    const finalized = await client.getBlock({ blockTag: 'finalized' });
    return finalized.number >= receipt.blockNumber ? 'finalized' : 'confirmed';
  } catch {
    return 'confirmed';
  }
}
