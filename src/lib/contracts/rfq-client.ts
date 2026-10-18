import { erc20Abi, recoverAddress, type Address, type PublicClient } from 'viem';
import { kudexRFQMarketAbi } from './abis';
import { assertDeployment } from './readiness';
import { rfqHash, type SignedOffer } from './orders';

const signatureAbi = [
  {
    type: 'function',
    name: 'isValidSignature',
    stateMutability: 'view',
    inputs: [
      { name: 'hash', type: 'bytes32' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes4' }],
  },
] as const;

export async function readRfqToken(
  client: PublicClient,
  token: Address,
  account: Address,
  router: Address,
  blockNumber: bigint,
) {
  const [decimals, symbol, balance, allowance] = await Promise.all([
    client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'decimals',
      blockNumber,
    }),
    client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'symbol',
      blockNumber,
    }),
    client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [account],
      blockNumber,
    }),
    client.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [account, router],
      blockNumber,
    }),
  ]);
  return { address: token, decimals, symbol: symbol.slice(0, 64), balance, allowance };
}

export async function inspectSignedOffer(
  client: PublicClient,
  offer: SignedOffer,
  taker?: Address,
) {
  await assertDeployment(client, [
    offer.router,
    offer.order.tokenIn,
    offer.order.tokenOut,
  ]);
  const block = await client.getBlock();
  const { order } = offer;
  const hash = rfqHash(offer);
  const [contractHash, used, cancelled, settled, offered, requested, makerCode] =
    await Promise.all([
      client.readContract({
        address: offer.router,
        abi: kudexRFQMarketAbi,
        functionName: 'hashOrder',
        args: [order],
        blockNumber: block.number,
      }),
      client.readContract({
        address: offer.router,
        abi: kudexRFQMarketAbi,
        functionName: 'nonceUsed',
        args: [order.maker, order.nonce],
        blockNumber: block.number,
      }),
      client.readContract({
        address: offer.router,
        abi: kudexRFQMarketAbi,
        functionName: 'orderCancelled',
        args: [order.maker, order.nonce],
        blockNumber: block.number,
      }),
      client.readContract({
        address: offer.router,
        abi: kudexRFQMarketAbi,
        functionName: 'orderSettled',
        args: [hash],
        blockNumber: block.number,
      }),
      readRfqToken(client, order.tokenIn, order.maker, offer.router, block.number),
      readRfqToken(
        client,
        order.tokenOut,
        taker ?? order.maker,
        offer.router,
        block.number,
      ),
      client.getBytecode({ address: order.maker, blockNumber: block.number }),
    ]);
  if (contractHash.toLowerCase() !== hash.toLowerCase())
    throw new Error(
      'The router returned a different signed-order hash. Verify the deployment.',
    );
  let signatureValid = false;
  if (makerCode && makerCode !== '0x') {
    // Reverts, malformed return data and RPC failures stay failures; never infer validity.
    signatureValid =
      (await client.readContract({
        address: order.maker,
        abi: signatureAbi,
        functionName: 'isValidSignature',
        args: [hash, offer.signature],
        blockNumber: block.number,
      })) === '0x1626ba7e';
  } else if (offer.signature.length === 132) {
    // Mirror OpenZeppelin ECDSA's 65-byte, low-s, canonical-v restrictions.
    const s = BigInt('0x' + offer.signature.slice(66, 130));
    const v = offer.signature.slice(130).toLowerCase();
    if (
      s > 0n &&
      s <= 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n &&
      (v === '1b' || v === '1c')
    ) {
      try {
        signatureValid =
          (await recoverAddress({ hash, signature: offer.signature })).toLowerCase() ===
          order.maker.toLowerCase();
      } catch {
        signatureValid = false;
      }
    }
  }
  const expired = block.timestamp > order.deadline;
  return {
    offer,
    hash,
    offered,
    requested,
    used,
    cancelled,
    settled,
    expired,
    signatureValid,
    active: !used && !cancelled && !settled && !expired && signatureValid,
    taker,
    block: block.number,
    observedAt: new Date().toISOString(),
  };
}

export type RfqInspection = Awaited<ReturnType<typeof inspectSignedOffer>>;
