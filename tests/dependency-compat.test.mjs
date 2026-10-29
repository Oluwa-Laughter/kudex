// Fixed upstream decoder's ESM and CJS builds must remain behaviorally identical.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
const require = createRequire(import.meta.url);
const wagmiRequire = createRequire(require.resolve('wagmi'));
const connectorsRequire = createRequire(wagmiRequire.resolve('@wagmi/connectors'));
const providerRequire = createRequire(
  connectorsRequire.resolve('@walletconnect/ethereum-provider'),
);
const rootRequire = createRequire(providerRequire.resolve('@walletconnect/utils'));
const queryString = rootRequire('query-string');
const qsRequire = createRequire(rootRequire.resolve('query-string'));
const decoder = qsRequire('decode-uri-component');
test('patched upstream decoder preserves CommonJS query-string API and fixed single-pass behavior', async () => {
  const entry = qsRequire.resolve('decode-uri-component');
  const { default: esm } = await import(new URL('./index.js', 'file://' + entry));
  for (const value of [
    'hello%20world',
    '%C3%A5',
    '%E0%A4%A',
    '%C2',
    '%',
    '%FF',
    '%FE%FF',
    'a%2520b',
    '%41%FF%41',
    '%2B',
    '🙂',
  ])
    assert.equal(decoder(value), esm(value));
  assert.deepEqual(
    { ...queryString.parse('name=hello%20world&currency=%E2%82%AC') },
    { currency: '€', name: 'hello world' },
  );
  assert.equal(
    queryString.stringify({ scope: 'a b', plus: '+' }),
    'plus=%2B&scope=a%20b',
  );
  const before = performance.now();
  const value = decoder('%41'.repeat(100000) + '%FF');
  assert.equal(value, 'A'.repeat(100000) + '%FF');
  assert.ok(
    performance.now() - before < 2000,
    'single-pass adversarial fixture exceeded 2 seconds',
  );
  const source = await readFile(entry, 'utf8');
  const esmSource = await readFile(new URL('./index.js', 'file://' + entry), 'utf8');
  assert.equal(
    source,
    esmSource.replace(
      'export default function decodeUriComponent',
      'module.exports = function decodeUriComponent',
    ),
  );
});
