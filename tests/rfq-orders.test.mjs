import test from 'node:test';
import assert from 'node:assert/strict';
import { recoverAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  parseRfqAmount,
  parseSignedOffer,
  serializeSignedOffer,
  rfqHash,
  rfqDomain,
  rfqOrderTypes,
} from '../src/lib/contracts/orders.ts';

// Public deterministic fixture only; never loaded from user environment or used on a network.
const maker = privateKeyToAccount('0x' + '01'.padStart(64, '0'));
const router = '0x1111111111111111111111111111111111111111';
const order = {
  maker: maker.address,
  tokenIn: '0x2222222222222222222222222222222222222222',
  tokenOut: '0x3333333333333333333333333333333333333333',
  amountIn: 900719925474099312345n,
  amountOut: 1000001n,
  deadline: 2000000000n,
  nonce: 17n,
};
const offer = { chainId: 420420777, router, order, signature: '0x' + '11'.repeat(65) };

test('RFQ exports preserve large quantities and accept only the expected chain/router', () => {
  const raw = serializeSignedOffer(offer);
  assert.deepEqual(parseSignedOffer(raw, offer.chainId, router), offer);
  assert.throws(() => parseSignedOffer(raw, 8890, router), /different network/);
  assert.throws(
    () => parseSignedOffer(raw, offer.chainId, order.tokenOut),
    /different network/,
  );
  assert.throws(
    () => parseSignedOffer(raw, offer.chainId, '0x' + '0'.repeat(40)),
    /not configured/,
  );
});

test('RFQ import rejects extra instructions, overflowing uints, malformed signatures and same-token trades', () => {
  const json = JSON.parse(serializeSignedOffer(offer));
  for (const patch of [
    { prompt: 'sign something else' },
    { order: { ...json.order, amountIn: (1n << 256n).toString() } },
    { order: { ...json.order, amountOut: '0' } },
    { order: { ...json.order, amountIn: '1e6' } },
    { order: { ...json.order, maker: '0x' + '0'.repeat(40) } },
    { order: { ...json.order, tokenOut: json.order.tokenIn } },
    { signature: '0xabc' },
  ])
    assert.throws(() =>
      parseSignedOffer(JSON.stringify({ ...json, ...patch }), offer.chainId, router),
    );
  assert.throws(
    () => parseSignedOffer('x'.repeat(12001), offer.chainId, router),
    /12 KB/,
  );
});

test('maker signature binds quantities, assets, nonce, deadline, chain and router', async () => {
  const signature = await maker.signTypedData({
    domain: rfqDomain(offer.chainId, router),
    types: rfqOrderTypes,
    primaryType: 'Order',
    message: order,
  });
  assert.equal(
    (await recoverAddress({ hash: rfqHash(offer), signature })).toLowerCase(),
    maker.address.toLowerCase(),
  );
  for (const changed of [
    { ...offer, chainId: 1 },
    { ...offer, router: order.tokenOut },
    ...['amountIn', 'amountOut', 'nonce', 'deadline'].map((key) => ({
      ...offer,
      order: { ...order, [key]: order[key] + 1n },
    })),
    { ...offer, order: { ...order, tokenOut: router } },
  ])
    assert.notEqual(rfqHash(changed), rfqHash(offer));
});

test('token amount entry rejects rounding, floats, zero and uint overflow', () => {
  assert.equal(parseRfqAmount('9007199254.740993', 6), 9007199254740993n);
  assert.equal(parseRfqAmount('0.000001', 6), 1n);
  for (const value of [
    '1.0000001',
    '1e6',
    '-1',
    'NaN',
    '0',
    '0.0',
    (1n << 256n).toString(),
  ])
    assert.throws(() => parseRfqAmount(value, 6));
});
