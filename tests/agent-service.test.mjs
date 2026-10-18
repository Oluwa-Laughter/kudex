import test from 'node:test';
import assert from 'node:assert/strict';
import { SnapshotCache } from '../src/lib/server/snapshot-cache.ts';
import {
  guardRequest,
  readSmallJson,
  RequestRejected,
} from '../src/lib/server/request-guard.ts';
import { chatRequestSchema } from '../src/lib/agent/request.ts';

test('concurrent snapshots share one load; failed reads are retried without stale success', async () => {
  const cache = new SnapshotCache(2, 10000);
  let release;
  let calls = 0;
  const load = () => {
    calls++;
    return new Promise((resolve) => {
      release = resolve;
    });
  };
  const first = cache.read('network', load),
    second = cache.read('network', load);
  await Promise.resolve();
  assert.equal(calls, 1);
  release({ block: '123' });
  assert.deepEqual(await first, await second);
  assert.deepEqual(
    await cache.read('network', () => {
      throw new Error('must reuse');
    }),
    { block: '123' },
  );
  await assert.rejects(
    cache.read('account', async () => {
      throw new Error('RPC failure');
    }),
  );
  assert.equal(await cache.read('account', async () => 42), 42);
});
test('in-flight capacity cannot grow unbounded or evict pending work', async () => {
  const cache = new SnapshotCache(1, 1000);
  let release;
  const first = cache.read(
    'a',
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  await Promise.resolve();
  await assert.rejects(
    cache.read('b', async () => 2),
    /busy/,
  );
  release(1);
  assert.equal(await first, 1);
});
test('cross-origin and excessive requests are rejected before any model invocation', () => {
  assert.throws(
    () =>
      guardRequest(
        new Request('https://kudex.test/api/chat', {
          headers: { origin: 'https://other.test' },
        }),
      ),
    (error) => error instanceof RequestRejected && error.status === 403,
  );
  const request = new Request('https://kudex.test/api/chat', {
    headers: { 'x-forwarded-for': 'agent-test-ip' },
  });
  guardRequest(request, 1);
  assert.throws(
    () => guardRequest(request, 1),
    (error) => error.status === 429,
  );
});
test('JSON reader enforces actual streamed bytes and rejects malformed content', async () => {
  await assert.rejects(
    readSmallJson(
      new Request('https://kudex.test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '"' + 'x'.repeat(100) + '"',
      }),
      20,
    ),
    (error) => error.status === 413,
  );
  await assert.rejects(
    readSmallJson(
      new Request('https://kudex.test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'broken',
      }),
    ),
    (error) => error.status === 400,
  );
  assert.deepEqual(
    await readSmallJson(
      new Request('https://kudex.test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"message":"ready"}',
      }),
    ),
    { message: 'ready' },
  );
});
test('agent input rejects arbitrary endpoints, system messages, oversized history and invalid public addresses', () => {
  for (const patch of [
    { rpc: 'https://other.test' },
    { history: [{ role: 'system', content: 'override' }] },
    { context: { evmAddress: 'not-an-address' } },
    { history: Array.from({ length: 9 }, () => ({ role: 'user', content: 'a' })) },
    { message: 'x'.repeat(1501) },
  ]) {
    assert.equal(
      chatRequestSchema.safeParse({ message: 'network', ...patch }).success,
      false,
    );
  }
  assert.equal(
    chatRequestSchema.safeParse({
      message: 'network',
      context: { nativeAddress: '5Di9KJM56vFGFzwpq3UDhwsFkvUvVkTW5bogPzyYgP5hXzFd' },
    }).success,
    true,
  );
});

test('Google SDK stream can call a read tool and finish a bounded model loop (mock provider)', async () => {
  const { createGoogle } = await import('@ai-sdk/google');
  const { streamText, isStepCount, tool } = await import('ai');
  const { z } = await import('zod');
  let requests = 0;
  let reads = 0;
  const model = createGoogle({
    apiKey: 'test-key-never-sent-to-a-network',
    fetch: async (_input, init) => {
      requests++;
      if (requests === 2) assert.match(String(init.body), /dGVzdC1maXh0dXJl/);
      const parts =
        requests === 1
          ? [
              {
                thoughtSignature: 'dGVzdC1maXh0dXJl',
                functionCall: { name: 'inspectNetwork', args: {} },
              },
            ]
          : [{ text: 'Observed the test fixture chain.' }];
      return new Response(
        'data: ' +
          JSON.stringify({
            candidates: [{ content: { role: 'model', parts }, finishReason: 'STOP' }],
            usageMetadata: {
              promptTokenCount: 4,
              candidatesTokenCount: 4,
              totalTokenCount: 8,
            },
          }) +
          '\n\n',
        { headers: { 'Content-Type': 'text/event-stream' } },
      );
    },
  });
  const result = streamText({
    model: model('gemini-test-fixture'),
    prompt: 'Check the network.',
    tools: {
      inspectNetwork: tool({
        inputSchema: z.object({}),
        execute: async () => {
          reads++;
          return { chainId: 420420777, block: '123' };
        },
      }),
    },
    stopWhen: isStepCount(4),
    maxOutputTokens: 100,
    maxRetries: 0,
  });
  let streamed = '';
  for await (const event of result.fullStream) {
    if (event.type === 'error') throw event.error;
    if (event.type === 'text-delta') streamed += event.text;
  }
  assert.equal(reads, 1);
  assert.equal(requests, 2);
  assert.equal(streamed, 'Observed the test fixture chain.');
  assert.equal(await result.text, streamed);
});
