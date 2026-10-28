import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeEventTopics, encodeAbiParameters } from 'viem';
import {
  exactAmount,
  verifyVaultReceipt,
  receiptFinality,
} from '../src/lib/contracts/vault-client.ts';
import { kudexVaultAbi } from '../src/lib/contracts/abis.ts';
const owner = '0x1111111111111111111111111111111111111111';
const vault = '0x2222222222222222222222222222222222222222';
test('financial amounts reject rounding, exponent syntax, negative and out-of-range values', () => {
  assert.equal(exactAmount('9007199254740993.123456', 6), 9007199254740993123456n);
  assert.equal(exactAmount('0.000000000000000001', 18), 1n);
  for (const v of [
    '1e6',
    '-1',
    '0',
    '1.0000001',
    '.1',
    'NaN',
    'Infinity',
    ' 1',
    '9'.repeat(80),
  ])
    assert.throws(() => exactAmount(v, 6));
});
test('only a successful matching vault event verifies financial execution', () => {
  const topics = encodeEventTopics({
    abi: kudexVaultAbi,
    eventName: 'Deposit',
    args: { sender: owner, owner },
  });
  const receipt = {
    status: 'success',
    to: vault,
    from: owner,
    logs: [
      {
        address: vault,
        topics,
        data: encodeAbiParameters(
          [{ type: 'uint256' }, { type: 'uint256' }],
          [100n, 99n],
        ),
      },
    ],
  };
  verifyVaultReceipt(receipt, vault, owner, 'deposit', 100n, 99n);
  for (const changed of [
    { status: 'reverted' },
    { logs: [] },
    { to: owner },
    { from: vault },
    { logs: [{ ...receipt.logs[0], address: owner }] },
  ])
    assert.throws(() =>
      verifyVaultReceipt({ ...receipt, ...changed }, vault, owner, 'deposit', 100n, 99n),
    );
  assert.throws(() => verifyVaultReceipt(receipt, vault, owner, 'deposit', 101n, 99n));
  assert.throws(() => verifyVaultReceipt(receipt, vault, owner, 'deposit', 100n, 100n));
});
test('finality requires canonical receipt hash and an actual finalized head', async () => {
  const receipt = { blockNumber: 10n, blockHash: '0x123' };
  assert.equal(
    await receiptFinality(
      {
        getBlock: async ({ blockTag }) =>
          blockTag ? { number: 10n } : { hash: '0x123' },
      },
      receipt,
    ),
    'finalized',
  );
  assert.equal(
    await receiptFinality(
      {
        getBlock: async ({ blockTag }) => {
          if (blockTag) throw Error('unsupported');
          return { hash: '0x123' };
        },
      },
      receipt,
    ),
    'confirmed',
  );
  assert.equal(
    await receiptFinality({ getBlock: async () => ({ hash: '0x456' }) }, receipt),
    'unknown',
  );
  await assert.rejects(
    receiptFinality(
      {
        getBlock: async () => {
          throw Error('pruned');
        },
      },
      receipt,
    ),
  );
});

import {
  encodePendingVault,
  decodePendingVault,
} from '../src/lib/contracts/pending-vault.ts';
test('recovery stores submitted references only; balances, successful status and other deployments are rejected', () => {
  const hash = '0x' + 'ab'.repeat(32);
  const submitted = { hash, owner, approval: 100n };
  const encoded = encodePendingVault(submitted, vault, owner);
  assert.deepEqual(decodePendingVault(encoded, vault, owner), submitted);
  assert.throws(() => decodePendingVault(encoded, owner, owner));
  for (const changed of [
    { balance: '100' },
    { status: 'confirmed' },
    { chainId: 1 },
    { hash: '0xfake' },
    { approval: undefined },
  ])
    assert.throws(() =>
      decodePendingVault(
        JSON.stringify({ ...JSON.parse(encoded), ...changed }),
        vault,
        owner,
      ),
    );
});
