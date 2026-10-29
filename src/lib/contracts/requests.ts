// Signed invitations are NOT token approvals, accepted quotes or on-chain orders.
import { z } from 'zod';
import {
  hashTypedData,
  recoverTypedDataAddress,
  isAddress,
  zeroAddress,
  type Address,
  type Hex,
} from 'viem';
import type { SignedOffer } from './orders.ts';
const uint = z
  .string()
  .regex(/^(0|[1-9]\d{0,77})$/)
  .refine((x) => BigInt(x) < 1n << 256n);
const addr = z.string().refine((x) => isAddress(x) && x.toLowerCase() !== zeroAddress);
const schema = z
  .object({
    format: z.literal('kudex-request-v1'),
    chainId: z.number().int().positive().safe(),
    router: addr,
    request: z
      .object({
        requester: addr,
        solver: addr,
        buyToken: addr,
        payToken: addr,
        minimumBuy: uint,
        maximumPay: uint,
        deadline: uint,
        nonce: uint,
      })
      .strict(),
    signature: z.string().regex(/^0x[0-9a-fA-F]{130}$/),
  })
  .strict();
export const requestTypes = {
  Request: [
    { name: 'requester', type: 'address' },
    { name: 'solver', type: 'address' },
    { name: 'buyToken', type: 'address' },
    { name: 'payToken', type: 'address' },
    { name: 'minimumBuy', type: 'uint256' },
    { name: 'maximumPay', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;
export type LiquidityRequest = {
  requester: Address;
  solver: Address;
  buyToken: Address;
  payToken: Address;
  minimumBuy: bigint;
  maximumPay: bigint;
  deadline: bigint;
  nonce: bigint;
};
export type SignedRequest = {
  chainId: number;
  router: Address;
  request: LiquidityRequest;
  signature: Hex;
};
export function requestDomain(chainId: number, router: Address) {
  return {
    name: 'KudexLiquidityRequest',
    version: '1',
    chainId,
    verifyingContract: router,
  } as const;
}
export function requestHash(r: SignedRequest) {
  return hashTypedData({
    domain: requestDomain(r.chainId, r.router),
    types: requestTypes,
    primaryType: 'Request',
    message: r.request,
  });
}
export function serializeRequest(r: SignedRequest) {
  return JSON.stringify(
    { format: 'kudex-request-v1', ...r },
    (_, v) => (typeof v === 'bigint' ? v.toString() : v),
    2,
  );
}
export async function verifyRequest(
  raw: string,
  chainId: number,
  router: Address,
  now: bigint,
): Promise<SignedRequest> {
  if (new TextEncoder().encode(raw).length > 8000) throw Error('Request exceeds 8 KB.');
  const r = schema.parse(JSON.parse(raw));
  if (
    router === zeroAddress ||
    r.chainId !== chainId ||
    r.router.toLowerCase() !== router.toLowerCase()
  )
    throw Error('Request domain does not match this network/router.');
  const request = {
    ...r.request,
    minimumBuy: BigInt(r.request.minimumBuy),
    maximumPay: BigInt(r.request.maximumPay),
    deadline: BigInt(r.request.deadline),
    nonce: BigInt(r.request.nonce),
  } as LiquidityRequest;
  if (
    request.minimumBuy === 0n ||
    request.maximumPay === 0n ||
    request.buyToken.toLowerCase() === request.payToken.toLowerCase() ||
    request.requester.toLowerCase() === request.solver.toLowerCase() ||
    request.deadline <= now ||
    request.deadline > now + 7n * 86400n
  )
    throw Error('Invalid terms or expiry; requests must expire within seven days.');
  const signed = { chainId, router, request, signature: r.signature as Hex };
  if (
    (
      await recoverTypedDataAddress({
        domain: requestDomain(chainId, router),
        types: requestTypes,
        primaryType: 'Request',
        message: request,
        signature: signed.signature,
      })
    ).toLowerCase() !== request.requester.toLowerCase()
  )
    throw Error('Request signature is invalid. EOA request signatures only.');
  return signed;
}
export function quoteMatchesRequest(
  r: SignedRequest,
  offer: SignedOffer,
  account: Address,
  now: bigint,
) {
  const q = offer.order,
    t = r.request;
  return (
    r.chainId === offer.chainId &&
    r.router.toLowerCase() === offer.router.toLowerCase() &&
    account.toLowerCase() === t.requester.toLowerCase() &&
    q.maker.toLowerCase() === t.solver.toLowerCase() &&
    q.tokenIn.toLowerCase() === t.buyToken.toLowerCase() &&
    q.tokenOut.toLowerCase() === t.payToken.toLowerCase() &&
    q.amountIn >= t.minimumBuy &&
    q.amountOut <= t.maximumPay &&
    now < t.deadline &&
    now <= q.deadline &&
    q.deadline <= t.deadline
  );
}
