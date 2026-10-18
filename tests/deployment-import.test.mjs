import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const script = fileURLToPath(
  new URL('../scripts/configure-deployment.mjs', import.meta.url),
);

for (const [name, payload] of [
  ['a broadcast from another chain', { chain: 1, transactions: [] }],
  ['an incomplete V3 broadcast', { chain: 420420777, transactions: [] }],
  [
    'ambiguous duplicated creation records',
    {
      chain: 420420777,
      transactions: [1, 2].map(() => ({
        contractName: 'Groth16Verifier',
        transactionType: 'CREATE',
        contractAddress: '0x0000000000000000000000000000000000000001',
      })),
    },
  ],
]) {
  test(`reject ${name} without changing local configuration or contacting RPC`, async () => {
    const before = await stat(new URL('../.env.local', import.meta.url)).catch(
      () => null,
    );
    const dir = await mkdtemp(new URL('../.deployment-test-', import.meta.url));
    try {
      const file = `${dir}/broadcast.json`;
      await writeFile(file, JSON.stringify(payload));
      const result = spawnSync(process.execPath, [script, file], {
        cwd: root,
        env: { ...process.env, NEXT_PUBLIC_PORTALDOT_RPC_HTTP: 'http://127.0.0.1:1' },
        encoding: 'utf8',
        timeout: 5000,
      });
      assert.equal(result.status, 1);
      assert.match(result.stderr, /Deployment import rejected/);
      const after = await stat(new URL('../.env.local', import.meta.url)).catch(
        () => null,
      );
      assert.equal(after?.mtimeMs, before?.mtimeMs);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}
