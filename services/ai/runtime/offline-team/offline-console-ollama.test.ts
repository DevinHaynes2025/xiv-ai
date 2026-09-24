import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readConsoleOllamaInventory } from './offline-console-ollama';

const respond = (value: unknown): typeof fetch => async () => Response.json(value);

test('reads only fixed local tags and projects normal Ollama metadata', async () => {
  const fetcher: typeof fetch = async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:11434/api/tags');
    assert.equal(options?.method, 'GET');
    assert.equal(options?.redirect, 'error');
    assert.ok(options?.signal);
    return Response.json({ models: [{ name: 'qwen2.5:3b', size: 1_900_000_000, digest: 'digest', modified_at: 'timestamp', details: { family: 'qwen2' } }] });
  };
  const models = await readConsoleOllamaInventory(fetcher);
  assert.deepEqual(models, [{ name: 'qwen2.5:3b', sizeBytes: 1_900_000_000 }]);
  assert.ok(Object.isFrozen(models));
  assert.ok(Object.isFrozen(models![0]));
  assert.deepEqual(await readConsoleOllamaInventory(respond({ models: [] })), []);
});

test('unavailable, HTTP failures, invalid JSON and redirects return unknown', async () => {
  const failures: (typeof fetch)[] = [
    async () => { throw new Error('private failure'); },
    async () => new Response('unavailable', { status: 503 }),
    async () => new Response('invalid json'),
    async () => new Response(null, { status: 302, headers: { location: 'https://example.invalid' } }),
    async () => {
      const response = Response.json({ models: [] });
      Object.defineProperty(response, 'redirected', { value: true });
      return response;
    },
  ];
  for (const fetcher of failures) assert.equal(await readConsoleOllamaInventory(fetcher), null);
});

test('refuses malformed, duplicate, unsafe or oversized inventory records', async () => {
  const invalid = [null, [], {}, { models: null }, { models: [null] }, { models: [{ name: 'qwen2.5:3b' }] },
    { models: [{ name: '../private', size: 1 }] }, { models: [{ name: 'model', size: -1 }] },
    { models: [{ name: 'model', size: '1' }] }, { models: [{ name: 'secret-token', size: 1 }] },
    { models: Array(2).fill({ name: 'model', size: 1 }) }, { models: Array(33).fill({ name: 'model', size: 1 }) }];
  for (const value of invalid) assert.equal(await readConsoleOllamaInventory(respond(value)), null);
});

test('enforces byte cap while streaming even without Content-Length', async () => {
  let cancelled = false;
  let reads = 0;
  const fetcher: typeof fetch = async () => new Response(new ReadableStream<Uint8Array>({
    pull(controller) { reads++; controller.enqueue(new Uint8Array(32_769)); },
    cancel() { cancelled = true; },
  }));
  assert.equal(await readConsoleOllamaInventory(fetcher), null);
  assert.ok(cancelled);
  assert.ok(reads <= 3);
});

test('deadline bounds both stalled requests and stalled response bodies', async () => {
  let requestSignal: AbortSignal | null | undefined;
  let cancelled = false;
  const stalledRequest: typeof fetch = async (_url, options) => {
    requestSignal = options?.signal;
    return new Promise<Response>(() => {});
  };
  const stalledBody: typeof fetch = async () => new Response(new ReadableStream<Uint8Array>({
    cancel() { cancelled = true; },
  }));
  const start = Date.now();
  assert.deepEqual(await Promise.all([readConsoleOllamaInventory(stalledRequest), readConsoleOllamaInventory(stalledBody)]), [null, null]);
  assert.ok(requestSignal?.aborted);
  assert.ok(cancelled);
  assert.ok(Date.now() - start < 6000);
});
