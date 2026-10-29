import test from 'node:test';
import assert from 'node:assert/strict';
import { privateKeyToAccount } from 'viem/accounts';
import { encodeEventTopics, encodeAbiParameters, keccak256 } from 'viem';
import {
  requestDomain,
  requestTypes,
  verifyRequest,
  serializeRequest,
  quoteMatchesRequest,
} from '../src/lib/contracts/requests.ts';
import {
  verifyRfqReceipt,
  assertRfqProvenance,
  encodeRfqReference,
  decodeRfqReference,
} from '../src/lib/contracts/rfq-execution.ts';
import { kudexRFQMarketAbi } from '../src/lib/contracts/abis.ts';
const maker = privateKeyToAccount('0x' + '12'.repeat(32)),
  requester = privateKeyToAccount('0x' + '13'.repeat(32));
const router = '0x' + '22'.repeat(20),
  buy = '0x' + '33'.repeat(20),
  pay = '0x' + '44'.repeat(20),
  hash = '0x' + '55'.repeat(32),
  orderHash = '0x' + '66'.repeat(32);
async function invitation() {
  const request = {
    requester: requester.address,
    solver: maker.address,
    buyToken: buy,
    payToken: pay,
    minimumBuy: 100n,
    maximumPay: 50n,
    deadline: 4600n,
    nonce: 7n,
  };
  return {
    chainId: 420420777,
    router,
    request,
    signature: await requester.signTypedData({
      domain: requestDomain(420420777, router),
      types: requestTypes,
      primaryType: 'Request',
      message: request,
    }),
  };
}
test('request signatures bind private invitation terms and deterministic quote bounds', async () => {
  const r = await invitation(),
    raw = serializeRequest(r);
  assert.deepEqual(await verifyRequest(raw, 420420777, router, 1000n), r);
  for (const mutate of [
    (x) => (x.request.maximumPay = '51'),
    (x) => (x.request.solver = requester.address),
    (x) => (x.request.nonce = '8'),
    (x) => (x.chainId = 1),
    (x) => (x.router = pay),
  ]) {
    const changed = JSON.parse(raw);
    mutate(changed);
    await assert.rejects(
      verifyRequest(JSON.stringify(changed), 420420777, router, 1000n),
    );
  }
  await assert.rejects(verifyRequest(raw, 420420777, router, 4600n));
  await assert.rejects(verifyRequest('x'.repeat(8001), 420420777, router, 1000n));
  const quote = {
    chainId: 420420777,
    router,
    order: {
      maker: maker.address,
      tokenIn: buy,
      tokenOut: pay,
      amountIn: 100n,
      amountOut: 50n,
      deadline: 4000n,
      nonce: 99n,
    },
    signature: '0x00',
  };
  assert.equal(quoteMatchesRequest(r, quote, requester.address, 1000n), true);
  for (const order of [
    { ...quote.order, amountOut: 51n },
    { ...quote.order, amountIn: 99n },
    { ...quote.order, deadline: 4601n },
    { ...quote.order, maker: requester.address },
  ])
    assert.equal(
      quoteMatchesRequest(r, { ...quote, order }, requester.address, 1000n),
      false,
    );
  assert.equal(quoteMatchesRequest(r, quote, maker.address, 1000n), false);
});
test('RFQ receipt requires exact operation, identities and event source; references carry no signed quote', () => {
  const evidence = {
    owner: requester.address,
    router,
    hash,
    action: 'fill',
    maker: maker.address,
    orderHash,
  };
  const topics = encodeEventTopics({
    abi: kudexRFQMarketAbi,
    eventName: 'RFQSettled',
    args: { orderHash, taker: requester.address },
  });
  const receipt = {
    status: 'success',
    transactionHash: hash,
    from: requester.address,
    to: router,
    logs: [
      {
        address: router,
        topics,
        data: encodeAbiParameters([{ type: 'address' }], [maker.address]),
      },
    ],
  };
  verifyRfqReceipt(receipt, evidence);
  for (const r of [
    { ...receipt, status: 'reverted' },
    { ...receipt, from: maker.address },
    { ...receipt, to: pay },
    { ...receipt, transactionHash: orderHash },
    { ...receipt, logs: [] },
    { ...receipt, logs: [{ ...receipt.logs[0], address: buy }] },
  ])
    assert.throws(() => verifyRfqReceipt(r, evidence));
  for (const e of [
    evidence,
    { owner: requester.address, router, hash, action: 'cancel', nonce: 1n },
    {
      owner: requester.address,
      router,
      hash,
      action: 'approve',
      token: pay,
      amount: 123n,
    },
  ])
    assert.deepEqual(decodeRfqReference(encodeRfqReference(e)), e);
  assert.throws(() => decodeRfqReference('{}'));
  assert.throws(() =>
    decodeRfqReference(
      JSON.stringify({ ...evidence, balances: { fake: 100 }, status: 'settled' }),
    ),
  );
  assert.doesNotMatch(encodeRfqReference(evidence), /signature|amountIn/);
});
test('RFQ financial actions fail closed on missing or mismatched deployment and asset pins', async () => {
  const code = '0x6000';
  const client = { getBytecode: async () => code, getChainId: async () => 420420777 };
  const pins = { [buy]: keccak256(code), [pay]: keccak256(code) };
  await assertRfqProvenance(client, router, keccak256(code), pins, [buy, pay]);
  await assert.rejects(assertRfqProvenance(client, router, undefined, pins, [buy]));
  await assert.rejects(assertRfqProvenance(client, router, hash, pins, [buy]));
  await assert.rejects(assertRfqProvenance(client, router, keccak256(code), {}, [buy]));
});
