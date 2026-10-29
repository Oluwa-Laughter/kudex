import {
  keccak256,
  parseEventLogs,
  erc20Abi,
  type Address,
  type Hex,
  type PublicClient,
  type TransactionReceipt,
} from 'viem';
import { assertDeployment } from './readiness.ts';
import { kudexRFQMarketAbi } from './abis.ts';
export type RfqEvidence = { owner: Address; router: Address; hash: Hex } & (
  | { action: 'fill'; maker: Address; orderHash: Hex }
  | { action: 'cancel'; nonce: bigint }
  | { action: 'approve' | 'clear'; token: Address; amount: bigint }
);
export async function assertRfqProvenance(
  client: PublicClient,
  router: Address,
  routerHash: string | undefined,
  assetPins: Readonly<Record<string, string>>,
  assets: Address[],
) {
  await assertDeployment(client, [router, ...assets]);
  const pin = async (address: Address, expected: string | undefined) => {
    if (!expected || !/^0x[\da-f]{64}$/i.test(expected))
      throw Error(
        'Reviewed RFQ router and asset code pins are required before signing or spending.',
      );
    const code = await client.getBytecode({ address });
    if (
      !code ||
      code === '0x' ||
      keccak256(code).toLowerCase() !== expected.toLowerCase()
    )
      throw Error(
        'RFQ deployment provenance mismatch. No financial action was submitted.',
      );
  };
  await pin(router, routerHash);
  await Promise.all(assets.map((asset) => pin(asset, assetPins[asset.toLowerCase()])));
}
export function verifyRfqReceipt(receipt: TransactionReceipt, e: RfqEvidence) {
  const eq = (a: string | undefined | null, b: string) =>
    a?.toLowerCase() === b.toLowerCase();
  const target = e.action === 'approve' || e.action === 'clear' ? e.token : e.router;
  if (
    receipt.status !== 'success' ||
    !eq(receipt.transactionHash, e.hash) ||
    !eq(receipt.from, e.owner) ||
    !eq(receipt.to, target)
  )
    throw Error(
      'RFQ receipt status or transaction identity mismatch. Requires reconciliation.',
    );
  const logs = receipt.logs.filter((l) => eq(l.address, target));
  let matched = false;
  if (e.action === 'fill')
    matched = parseEventLogs({
      abi: kudexRFQMarketAbi,
      eventName: 'RFQSettled',
      logs,
    }).some(
      ({ args }) =>
        eq(args.orderHash, e.orderHash) &&
        eq(args.maker, e.maker) &&
        eq(args.taker, e.owner),
    );
  else if (e.action === 'cancel')
    matched = parseEventLogs({
      abi: kudexRFQMarketAbi,
      eventName: 'OrderCancelled',
      logs,
    }).some(({ args }) => eq(args.maker, e.owner) && args.nonce === e.nonce);
  else
    matched = parseEventLogs({ abi: erc20Abi, eventName: 'Approval', logs }).some(
      ({ args }) =>
        eq(args.owner, e.owner) && eq(args.spender, e.router) && args.value === e.amount,
    );
  if (!matched)
    throw Error('Matching RFQ operation event missing. Do not blindly resubmit.');
}
// Only a submitted reference is stored, never financial success or signed quote contents.
export function encodeRfqReference(e: RfqEvidence) {
  return JSON.stringify(e, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
}
export function decodeRfqReference(raw: string): RfqEvidence {
  if (raw.length > 1500) throw Error('Invalid recovery reference.');
  const e = JSON.parse(raw);
  if (!e || typeof e !== 'object' || Array.isArray(e))
    throw Error('Invalid recovery reference.');
  const extra =
    e.action === 'fill'
      ? ['maker', 'orderHash']
      : e.action === 'cancel'
        ? ['nonce']
        : ['token', 'amount'];
  const allowed = new Set(['owner', 'router', 'hash', 'action', ...extra]);
  if (Object.keys(e).some((key) => !allowed.has(key)))
    throw Error('Unexpected recovery field.');
  const address = (x: unknown) => typeof x === 'string' && /^0x[\da-f]{40}$/i.test(x);
  const hash = (x: unknown) => typeof x === 'string' && /^0x[\da-f]{64}$/i.test(x);
  const uint = (x: unknown) =>
    typeof x === 'string' && /^(0|[1-9]\d{0,77})$/.test(x) && BigInt(x) < 1n << 256n;
  if (!address(e.owner) || !address(e.router) || !hash(e.hash))
    throw Error('Invalid recovery identity.');
  if (e.action === 'fill' && address(e.maker) && hash(e.orderHash)) return e;
  if (e.action === 'cancel' && uint(e.nonce)) return { ...e, nonce: BigInt(e.nonce) };
  if (
    (e.action === 'approve' || e.action === 'clear') &&
    address(e.token) &&
    uint(e.amount)
  )
    return { ...e, amount: BigInt(e.amount) };
  throw Error('Invalid recovery action.');
}
