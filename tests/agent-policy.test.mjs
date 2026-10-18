import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareAgentPolicy } from '../src/lib/agent-policy.ts';
const input = {
  owner: '0x1111111111111111111111111111111111111111',
  delegate: '0x2222222222222222222222222222222222222222',
  vault: '0x3333333333333333333333333333333333333333',
  asset: '0x4444444444444444444444444444444444444444',
  decimals: '6',
  perAction: '0.000001',
  daily: '1',
  total: '10',
  hours: '24',
};
test('draft uses exact token units, fixed chain, UTC expiry, and never activates', () => {
  const policy = prepareAgentPolicy(input, 0);
  assert.equal(policy.limits.perAction, '1');
  assert.equal(policy.limits.daily, '1000000');
  assert.equal(policy.chainId, 420420777);
  assert.equal(policy.expiresAt, 86400);
  assert.equal(policy.status, 'draft-not-authorized');
});
test('rejects overprecision, invalid caps, self-delegation and excessive expiry', () => {
  for (const patch of [
    { perAction: '0.0000001' },
    { daily: '0.0000001' },
    { total: '0.5' },
    { delegate: input.owner },
    { hours: '721' },
    { owner: '5native' },
    { total: '1e10' },
    { decimals: '18.5' },
  ]) {
    assert.throws(() => prepareAgentPolicy({ ...input, ...patch }));
  }
});
