// Must match KudexRFQMarket.ORDER_TYPEHASH and EIP-712 domain exactly.
// Makers supply exact terms; this module does not invent prices or store orders.
import { z } from 'zod';
import {
  hashTypedData,
  isAddress,
  parseUnits,
  zeroAddress,
  type Address,
  type Hex,
} from 'viem';

export const rfqOrderTypes = {
  Order: [
    { name: 'maker', type: 'address' },
    { name: 'tokenIn', type: 'address' },
    { name: 'tokenOut', type: 'address' },
    { name: 'amountIn', type: 'uint256' },
    { name: 'amountOut', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

export function rfqDomain(chainId: number, verifyingContract: Address) {
  return {
    name: 'KudexRFQMarket',
    version: '1',
    chainId,
    verifyingContract,
  } as const;
}

export type RfqOrder = {
  maker: Address;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOut: bigint;
  deadline: bigint;
  nonce: bigint;
};

const uint256Max = (1n << 256n) - 1n;
const address = z
  .string()
  .refine((value) => isAddress(value) && value.toLowerCase() !== zeroAddress);
const uint = z
  .string()
  .refine((value) => /^(0|[1-9]\d{0,77})$/.test(value) && BigInt(value) <= uint256Max);
const positiveUint = uint.refine(
  (value) => /^\d{1,78}$/.test(value) && BigInt(value) > 0n,
);
const envelopeSchema = z
  .object({
    format: z.literal('kudex-rfq-v1'),
    chainId: z.number().int().positive().safe(),
    router: address,
    order: z
      .object({
        maker: address,
        tokenIn: address,
        tokenOut: address,
        amountIn: positiveUint,
        amountOut: positiveUint,
        deadline: positiveUint,
        nonce: uint,
      })
      .strict(),
    signature: z.string().regex(/^0x(?:[0-9a-fA-F]{2}){1,4096}$/),
  })
  .strict();

export type SignedOffer = {
  chainId: number;
  router: Address;
  order: RfqOrder;
  signature: Hex;
};

export function parseSignedOffer(
  raw: string,
  chainId: number,
  router: Address,
): SignedOffer {
  if (new TextEncoder().encode(raw).byteLength > 12_000)
    throw new Error('The signed offer exceeds the 12 KB limit.');
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error('Paste a complete signed-offer JSON export.');
  }
  const result = envelopeSchema.safeParse(json);
  if (!result.success)
    throw new Error('The offer format, addresses, amounts, or signature are invalid.');
  const value = result.data;
  if (router === zeroAddress)
    throw new Error('The RFQ router deployment is not configured.');
  if (value.chainId !== chainId || value.router.toLowerCase() !== router.toLowerCase())
    throw new Error('This offer belongs to a different network or router.');
  if (value.order.tokenIn.toLowerCase() === value.order.tokenOut.toLowerCase())
    throw new Error('An offer must exchange two different tokens.');
  return {
    chainId,
    router,
    signature: value.signature as Hex,
    order: {
      maker: value.order.maker as Address,
      tokenIn: value.order.tokenIn as Address,
      tokenOut: value.order.tokenOut as Address,
      amountIn: BigInt(value.order.amountIn),
      amountOut: BigInt(value.order.amountOut),
      deadline: BigInt(value.order.deadline),
      nonce: BigInt(value.order.nonce),
    },
  };
}

export function serializeSignedOffer(offer: SignedOffer): string {
  return JSON.stringify(
    {
      format: 'kudex-rfq-v1',
      chainId: offer.chainId,
      router: offer.router,
      order: {
        ...offer.order,
        amountIn: offer.order.amountIn.toString(),
        amountOut: offer.order.amountOut.toString(),
        deadline: offer.order.deadline.toString(),
        nonce: offer.order.nonce.toString(),
      },
      signature: offer.signature,
    },
    null,
    2,
  );
}

export function rfqHash(offer: Pick<SignedOffer, 'chainId' | 'router' | 'order'>): Hex {
  return hashTypedData({
    domain: rfqDomain(offer.chainId, offer.router),
    types: rfqOrderTypes,
    primaryType: 'Order',
    message: offer.order,
  });
}

export function parseRfqAmount(value: string, decimals: number): bigint {
  if (
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 255 ||
    value.length > 300 ||
    !/^\d+(\.\d+)?$/.test(value) ||
    (value.split('.')[1]?.length ?? 0) > decimals
  )
    throw new Error('Enter a positive amount within the token precision.');
  const amount = parseUnits(value, decimals);
  if (amount <= 0n || amount > uint256Max)
    throw new Error(
      'The amount must fit the supported token range and be greater than zero.',
    );
  return amount;
}
