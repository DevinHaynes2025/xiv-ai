// 12D-289 — adversarial tests for the reading chain's loopback caller
// module and the 12D-113 audit-debt paydown. Central properties under
// attack:
//   1. LOOPBACK ONLY, MECHANICALLY: a caller built for ANY non-loopback
//      host refuses BEFORE any request — the reading chain never calls
//      a remote model through this surface, whatever the endpoint
//      spelling (remote host, LAN IP, whitespace, a URL instead of a
//      host:port, an empty string).
//   2. THE PIN IS REAL: a real loopback HTTP server (node:http, an
//      ephemeral port, never Ollama) receives model qwen2.5-coder:7b,
//      stream:false, temperature:0 — and the caller maps the response
//      verbatim; a non-2xx throws `ollama returned HTTP <status>`.
//   3. THE AUDIT DEBT IS PAID: the CLI module declares *_GUARDRAILS and
//      now contains NO network primitive; the caller module IS in the
//      audit's AUTHORIZED_NETWORK_SURFACES and carries its own
//      local-plane literal; the REAL audit over the offline-team
//      runtime reports ZERO findings (the pre-existing 12d-113 debt is
//      gone, not grandfathered).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildLoopbackCaller, buildLoopbackCallerForEndpoint,
  buildLoopbackCallerForEndpointAndModel,
  buildStructuredLoopbackCallerForEndpointAndModel,
  type ReadingLoopbackGenerationBounds,
  type ReadingLoopbackJsonSchema,
  READING_LOOPBACK_CALLER_POLICY,
} from './xiv-reading-loopback-caller';
import { auditAlignmentInvariants, AUTHORIZED_NETWORK_SURFACES } from './alignment-invariant-audit';

const HERE = dirname(fileURLToPath(import.meta.url));
const BOUNDS: ReadingLoopbackGenerationBounds = {
  timeoutMs: 2000, maxResponseBytes: 1024, numPredict: 32, numCtx: 512,
};

async function withServer(
  status: number,
  body: string,
  fn: (server: Server, endpoint: string, seen: { bodies: string[] }) => Promise<void>,
): Promise<void> {
  const seen: string[] = [];
  const server = createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      seen.push(raw);
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(body);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  assert.ok(addr !== null && typeof addr === 'object');
  const endpoint = `127.0.0.1:${addr.port}`;
  try {
    await fn(server, endpoint, { bodies: seen });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test('12d-289: a non-loopback endpoint refuses before any request', () => {
  for (const bad of [
    'remote.example.invalid', 'remote.example.invalid:8080', '10.0.0.5:11434',
    'localhost.example.com', 'http://127.0.0.1:11434', ' 127.0.0.1:11434',
    '127.0.0.1:99999', '', '0.0.0.0:11434', '[::1]:11434',
  ]) {
    assert.throws(() => buildLoopbackCallerForEndpoint(bad), /loopback-only|port is out of range/, `endpoint ${bad}`);
  }
});

test('bounded options reject malformed and missing limits synchronously', () => {
  for (const bounds of [null, [], {},
    ...(['timeoutMs', 'maxResponseBytes', 'numPredict', 'numCtx'] as const).flatMap(key =>
      [undefined, 0, -1, 1.5, NaN, Infinity, '32', 1_048_577].map(value => ({ ...BOUNDS, [key]: value }))),
    { ...BOUNDS, timeoutMs: 120001 }, { ...BOUNDS, numPredict: 257 },
    { ...BOUNDS, numCtx: 127 }, { ...BOUNDS, numCtx: 4097 },
  ]) {
    assert.throws(() => buildLoopbackCallerForEndpointAndModel('127.0.0.1:1', 'test-model',
      bounds as ReadingLoopbackGenerationBounds), /bounds|must be an integer/);
  }
});

test('bounds refuse inherited, missing, hidden, accessor and proxy properties without invoking them', () => {
  let invoked = 0;
  for (const key of ['timeoutMs', 'maxResponseBytes', 'numPredict', 'numCtx'] as const) {
    const missing: Partial<ReadingLoopbackGenerationBounds> = { ...BOUNDS };
    delete missing[key];
    const inherited = Object.assign(Object.create({ [key]: BOUNDS[key] }), missing);
    const hidden = Object.defineProperty({ ...BOUNDS }, key, { enumerable: false });
    const accessor = Object.defineProperty({ ...BOUNDS }, key, {
      get() { invoked++; return invoked === 1 ? BOUNDS[key] : Infinity; },
    });
    for (const value of [missing, inherited, hidden, accessor]) {
      assert.throws(() => buildLoopbackCallerForEndpointAndModel('127.0.0.1:1', 'test-model',
        value as ReadingLoopbackGenerationBounds), /bounds.*(?:plain data object|own enumerable data property)/);
    }
  }
  const proxy = new Proxy({ ...BOUNDS }, {
    get() { invoked++; throw new Error('unexpected get'); },
    getPrototypeOf() { invoked++; throw new Error('unexpected prototype read'); },
    getOwnPropertyDescriptor() { invoked++; throw new Error('unexpected descriptor read'); },
    ownKeys() { invoked++; throw new Error('unexpected enumeration'); },
  });
  assert.throws(() => buildLoopbackCallerForEndpointAndModel('127.0.0.1:1', 'test-model', proxy), /bounds.*plain data object/);
  assert.equal(invoked, 0);
});

test('normalized bounds retain the byte cap after input mutation and ignore unrelated getters', async () => {
  const body = JSON.stringify({ model: 'test-model', response: 'x'.repeat(100), done: true });
  let invoked = 0;
  await withServer(200, body, async (_server, endpoint) => {
    for (const prototype of [Object.prototype, null]) {
      const input = Object.assign(Object.create(prototype), BOUNDS, { maxResponseBytes: 32 });
      Object.defineProperty(input, 'unrelated', { enumerable: true, get() { invoked++; throw new Error('must not copy'); } });
      const caller = buildLoopbackCallerForEndpointAndModel(endpoint, 'test-model', input);
      input.maxResponseBytes = Infinity;
      await assert.rejects(caller('question'), /exceeds maxResponseBytes \(32\)/);
    }
  });
  assert.equal(invoked, 0);
});

test('bounded requests send explicit limits and require a completed response', async () => {
  await withServer(200, JSON.stringify({ model: 'test-model', response: 'answer', done: true }), async (_s, endpoint, seen) => {
    const input = { ...BOUNDS };
    const caller = buildLoopbackCallerForEndpointAndModel(endpoint, 'test-model', input);
    input.numPredict = 256;
    assert.deepEqual(await caller('question'), { model: 'test-model', response: 'answer' });
    assert.deepEqual(JSON.parse(seen.bodies[0]!), {
      model: 'test-model', prompt: 'question', stream: false,
      options: { temperature: 0, num_predict: 32, num_ctx: 512 }, keep_alive: 0,
    });
  });
  for (const done of [undefined, false, 'true', 1]) {
    await withServer(200, JSON.stringify({ model: 'test-model', response: 'partial', done }), async (_s, endpoint) => {
      await assert.rejects(buildLoopbackCallerForEndpointAndModel(endpoint, 'test-model', BOUNDS)('p'), /done:true/);
    });
  }
});

test('bounded body enforces bytes, accepting the exact limit', async () => {
  const body = JSON.stringify({ model: 'test-model', response: '😀'.repeat(20), done: true });
  const bytes = Buffer.byteLength(body);
  await withServer(200, body, async (_s, endpoint) => {
    const caller = (maxResponseBytes: number) => buildLoopbackCallerForEndpointAndModel(endpoint, 'test-model', { ...BOUNDS, maxResponseBytes });
    await assert.rejects(caller(bytes - 1)('p'), /maxResponseBytes/);
    assert.equal((await caller(bytes)('p')).response, '😀'.repeat(20));
  });
});

test('bounded timeout covers both missing headers and a stalled response body', async () => {
  for (const flushHeaders of [false, true]) {
    let observedRequest = false;
    let closed!: () => void;
    const connectionClosed = new Promise<void>(resolve => { closed = resolve; });
    const server = createServer((_req, res) => {
      observedRequest = true;
      res.once('close', closed);
      if (flushHeaders) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.write('{"model":"test-model",');
      }
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    try {
      const caller = buildLoopbackCallerForEndpointAndModel(`127.0.0.1:${address.port}`, 'test-model', { ...BOUNDS, timeoutMs: 250 });
      const started = performance.now();
      await Promise.race([
        (async () => {
          await assert.rejects(caller('p'), error => error instanceof Error && error.name === 'AbortError');
          assert.equal(observedRequest, true);
          await connectionClosed;
          assert.ok(performance.now() - started < 1500, 'request and connection must cancel promptly');
        })(),
        new Promise<never>((_resolve, reject) => {
          watchdog = setTimeout(() => reject(new Error('independent deadline watchdog expired')), 2000);
        }),
      ]);
    } finally {
      clearTimeout(watchdog);
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  }
});

test('bounded streaming cap stops an oversized body before the server ends it', async () => {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.write('x'.repeat(1025));
    // Deliberately leave the chunked response open: res.text() would wait for timeout.
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  try {
    const caller = buildLoopbackCallerForEndpointAndModel(`127.0.0.1:${address.port}`, 'test-model', BOUNDS);
    await assert.rejects(caller('p'), /maxResponseBytes/);
  } finally {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('12d-289: the pin is real — the pinned model, stream:false, temperature:0 hit the wire', async () => {
  await withServer(200, JSON.stringify({ model: 'qwen2.5-coder:7b', response: 'the draft text verbatim' }), async (_s, endpoint, seen) => {
    const caller = buildLoopbackCallerForEndpoint(endpoint);
    const out = await caller('READ AND SUMMARIZE a chunk.');
    assert.equal(out.model, 'qwen2.5-coder:7b');
    assert.equal(out.response, 'the draft text verbatim');
    assert.equal(seen.bodies.length, 1);
    const sent = JSON.parse(seen.bodies[0]!) as { model: string; stream: boolean; options: { temperature: number } };
    assert.equal(sent.model, 'qwen2.5-coder:7b');
    assert.equal(sent.stream, false);
    assert.equal(sent.options.temperature, 0);
  });
});

test('unbounded callers retain the request shape and do not require completion metadata', async () => {
  for (const completion of [{}, { done: false }]) {
    const response = 'x'.repeat(2048);
    await withServer(200, JSON.stringify({ model: 'test-model', response, ...completion }), async (_server, endpoint, seen) => {
      const caller = buildLoopbackCallerForEndpointAndModel(endpoint, 'test-model');
      assert.deepEqual(await caller('question'), { model: 'test-model', response });
      assert.deepEqual(JSON.parse(seen.bodies[0]!), {
        model: 'test-model', prompt: 'question', stream: false, options: { temperature: 0 },
      });
    });
  }
});

test('12d-289: a non-2xx throws honestly; the pinned default endpoint is 127.0.0.1:11434', async () => {
  await withServer(500, 'boom', async (_s, endpoint) => {
    await assert.rejects(() => buildLoopbackCallerForEndpoint(endpoint)('p'), /ollama returned HTTP 500/);
  });
  assert.equal(READING_LOOPBACK_CALLER_POLICY.defaultEndpoint, '127.0.0.1:11434');
  assert.equal(READING_LOOPBACK_CALLER_POLICY.model, 'qwen2.5-coder:7b');
  assert.equal(READING_LOOPBACK_CALLER_POLICY.remoteCalls, 0);
  assert.equal(READING_LOOPBACK_CALLER_POLICY.humanDecision, 'REQUIRED');
  assert.equal(READING_LOOPBACK_CALLER_POLICY.billionUsersProven, false);
});

test('refuses missing or mismatched model identity and malformed response values', async () => {
  for (const data of [null, [], {}, { response: 'draft' }, { model: 'undeclared-model', response: 'draft' },
    { model: 'qwen2.5-coder:7b' }, { model: 'qwen2.5-coder:7b', response: 42 },
    { model: 'qwen2.5-coder:7b', response: { text: 'draft' } }]) {
    await withServer(200, JSON.stringify(data), async (_server, endpoint) => {
      await assert.rejects(() => buildLoopbackCallerForEndpoint(endpoint)('p'), /declared model|response must be a string/);
    });
  }
});

test('refuses redirects without forwarding the reading prompt to the target', async () => {
  await withServer(200, JSON.stringify({ model: 'qwen2.5-coder:7b', response: 'redirected draft' }), async (_target, targetEndpoint, targetSeen) => {
    for (const status of [301, 302, 303, 307, 308]) {
      const redirector = createServer((_req, res) => {
        res.writeHead(status, { location: `http://${targetEndpoint}/api/generate` });
        res.end();
      });
      await new Promise<void>(resolve => redirector.listen(0, '127.0.0.1', resolve));
      const address = redirector.address();
      assert.ok(address && typeof address === 'object');
      try {
        await assert.rejects(() => buildLoopbackCallerForEndpoint(`127.0.0.1:${address.port}`)('private reading prompt'));
        assert.equal(targetSeen.bodies.length, 0, `redirect ${status} must not reach the target`);
      } finally {
        redirector.closeAllConnections();
        await new Promise<void>(resolve => redirector.close(() => resolve()));
      }
    }
  });
});

test('12d-289: the CLI module carries no network primitive; the caller module is authorized and loopback-bound in source', () => {
  const cli = readFileSync(join(HERE, 'xiv-supervised-reading-cycle.cli.ts'), 'utf8');
  assert.ok(/\b[A-Z][A-Z0-9_]*_GUARDRAILS\b\s*=/.test(cli), 'the CLI still declares its guardrails');
  assert.ok(!/fetch\s*\(/.test(cli), 'the CLI no longer calls fetch');
  assert.ok(!/node:(http|https|net|dns|dgram|tls|undici)/.test(cli), 'the CLI no longer imports network primitives');
  assert.ok(!/127\.0\.0\.1:11434/.test(cli), 'the endpoint literal moved out of the CLI with the caller');
  const caller = readFileSync(join(HERE, 'xiv-reading-loopback-caller.ts'), 'utf8');
  assert.ok(/127\.0\.0\.1:11434/.test(caller), 'the caller module carries its own local-plane binding');
  const entry = AUTHORIZED_NETWORK_SURFACES.find((a) => a.file === 'xiv-reading-loopback-caller.ts');
  assert.ok(entry, 'the caller module is listed in AUTHORIZED_NETWORK_SURFACES');
  assert.ok(entry!.reason.includes('127.0.0.1:11434'));
});

test('12d-289: the REAL audit over the offline-team runtime reports ZERO findings', () => {
  const packet = auditAlignmentInvariants({ dir: HERE, auditedAtMs: 1_700_005_000 });
  assert.equal(packet.kind, 'ALIGNMENT_INVARIANT_AUDIT');
  assert.deepEqual(packet.findings, [], `audit findings: ${packet.findings.map((f) => `${f.invariant} ${f.file}: ${f.detail}`).join('; ')}`);
  assert.equal(packet.humanDecision, 'REQUIRED');
  assert.equal(packet.learningPromoted, false);
});

const STRUCTURED_SCHEMA: ReadingLoopbackJsonSchema = {
  type: 'object',
  properties: {
    state: { type: 'string', enum: ['proposal', 'applied'] },
    verified: { type: 'boolean', enum: [false] },
  },
  required: ['state', 'verified'],
  additionalProperties: false,
};

test('structured caller sends an immutable closed schema on the wire', async () => {
  const mutable = {
    type: 'object' as const,
    properties: {
      state: { type: 'string' as const, enum: ['proposal', 'applied'] },
      verified: { type: 'boolean' as const, enum: [false] },
    },
    required: ['state', 'verified'],
    additionalProperties: false as const,
  };

  await withServer(
    200,
    JSON.stringify({
      model: 'test-model',
      response: '{"state":"proposal","verified":false}',
      done: true,
    }),
    async (_server, endpoint, seen) => {
      const caller = buildStructuredLoopbackCallerForEndpointAndModel(
        endpoint,
        'test-model',
        BOUNDS,
        mutable,
      );

      mutable.properties.state.enum[0] = 'applied';
      mutable.required.reverse();

      await caller('question');

      const sent = JSON.parse(seen.bodies[0]!);

      assert.deepEqual(sent.format, {
        type: 'object',
        properties: {
          state: { type: 'string', enum: ['proposal', 'applied'] },
          verified: { type: 'boolean', enum: [false] },
        },
        required: ['state', 'verified'],
        additionalProperties: false,
      });

      assert.equal(sent.stream, false);
      assert.equal(sent.options.temperature, 0);
      assert.equal(sent.options.num_predict, 32);
      assert.equal(sent.options.num_ctx, 512);
      assert.equal(sent.keep_alive, 0);
    },
  );
});

test('structured schema refuses mismatched required keys and invalid enums', () => {
  const badSchemas = [
    {
      ...STRUCTURED_SCHEMA,
      required: ['state'],
    },
    {
      ...STRUCTURED_SCHEMA,
      required: ['state', 'state'],
    },
    {
      ...STRUCTURED_SCHEMA,
      properties: {
        state: { type: 'string', enum: [] },
      },
      required: ['state'],
    },
    {
      ...STRUCTURED_SCHEMA,
      properties: {
        verified: { type: 'boolean', enum: ['false'] },
      },
      required: ['verified'],
    },
  ];

  for (const schema of badSchemas) {
    assert.throws(
      () => buildStructuredLoopbackCallerForEndpointAndModel(
        '127.0.0.1:1',
        'test-model',
        BOUNDS,
        schema as ReadingLoopbackJsonSchema,
      ),
      /structured schema/,
    );
  }
});

test('structured caller remains loopback-only', () => {
  for (const endpoint of [
    '10.0.0.5:11434',
    'remote.example.invalid:11434',
    '0.0.0.0:11434',
    'http://127.0.0.1:11434',
  ]) {
    assert.throws(
      () => buildStructuredLoopbackCallerForEndpointAndModel(
        endpoint,
        'test-model',
        BOUNDS,
        STRUCTURED_SCHEMA,
      ),
      /loopback-only/,
    );
  }
});

test('structured schema refuses top-level accessors without invoking them', () => {
  let invoked = 0;

  const schema = {
    properties: {
      state: { type: 'string', enum: ['proposal', 'applied'] },
    },
    required: ['state'],
    additionalProperties: false,
  };

  Object.defineProperty(schema, 'type', {
    enumerable: true,
    get() {
      invoked++;
      throw new Error('HOSTILE_GETTER_EXECUTED');
    },
  });

  assert.throws(
    () => buildStructuredLoopbackCallerForEndpointAndModel(
      '127.0.0.1:1',
      'test-model',
      BOUNDS,
      schema as unknown as ReadingLoopbackJsonSchema,
    ),
  );

  assert.equal(invoked, 0);
});

test('structured schema refuses property accessors without invoking them', () => {
  let invoked = 0;

  const property: Record<string, unknown> = {
    enum: ['proposal', 'applied'],
  };

  Object.defineProperty(property, 'type', {
    enumerable: true,
    get() {
      invoked++;
      throw new Error('HOSTILE_PROPERTY_GETTER_EXECUTED');
    },
  });

  const schema = {
    type: 'object',
    properties: { state: property },
    required: ['state'],
    additionalProperties: false,
  };

  assert.throws(
    () => buildStructuredLoopbackCallerForEndpointAndModel(
      '127.0.0.1:1',
      'test-model',
      BOUNDS,
      schema as unknown as ReadingLoopbackJsonSchema,
    ),
  );

  assert.equal(invoked, 0);
});

test('structured schema refuses unexpected top-level and property keywords', () => {
  const extraTopLevel = {
    ...STRUCTURED_SCHEMA,
    description: 'not allowed',
  };

  const extraPropertyKeyword = {
    type: 'object',
    properties: {
      state: {
        type: 'string',
        enum: ['proposal', 'applied'],
        description: 'not allowed',
      },
    },
    required: ['state'],
    additionalProperties: false,
  };

  for (const schema of [extraTopLevel, extraPropertyKeyword]) {
    assert.throws(
      () => buildStructuredLoopbackCallerForEndpointAndModel(
        '127.0.0.1:1',
        'test-model',
        BOUNDS,
        schema as ReadingLoopbackJsonSchema,
      ),
      /structured schema/,
    );
  }
});

test('structured schema refuses sparse and accessor arrays without invoking accessors', () => {
  let invoked = 0;

  const sparseRequired = new Array(1);

  const accessorEnum: unknown[] = [];
  Object.defineProperty(accessorEnum, '0', {
    enumerable: true,
    configurable: true,
    get() {
      invoked++;
      throw new Error('HOSTILE_ARRAY_GETTER_EXECUTED');
    },
  });
  accessorEnum.length = 1;

  const schemas = [
    {
      type: 'object',
      properties: {
        state: { type: 'string', enum: ['proposal'] },
      },
      required: sparseRequired,
      additionalProperties: false,
    },
    {
      type: 'object',
      properties: {
        state: { type: 'string', enum: accessorEnum },
      },
      required: ['state'],
      additionalProperties: false,
    },
  ];

  for (const schema of schemas) {
    assert.throws(
      () => buildStructuredLoopbackCallerForEndpointAndModel(
        '127.0.0.1:1',
        'test-model',
        BOUNDS,
        schema as ReadingLoopbackJsonSchema,
      ),
      /structured schema/,
    );
  }

  assert.equal(invoked, 0);
});

test('structured schema refuses symbol, hidden and unexpected array properties', () => {
  const symbolSchema = {
    type: 'object',
    properties: {
      state: { type: 'string', enum: ['proposal'] },
    },
    required: ['state'],
    additionalProperties: false,
  };

  Object.defineProperty(symbolSchema, Symbol('hidden'), {
    value: true,
    enumerable: true,
  });

  const hiddenSchema = {
    type: 'object',
    properties: {
      state: { type: 'string', enum: ['proposal'] },
    },
    required: ['state'],
  };

  Object.defineProperty(hiddenSchema, 'additionalProperties', {
    value: false,
    enumerable: false,
  });

  const enumWithExtra = ['proposal'];
  Object.defineProperty(enumWithExtra, 'extra', {
    value: 'not-allowed',
    enumerable: true,
  });

  const extraArraySchema = {
    type: 'object',
    properties: {
      state: { type: 'string', enum: enumWithExtra },
    },
    required: ['state'],
    additionalProperties: false,
  };

  for (const schema of [symbolSchema, hiddenSchema, extraArraySchema]) {
    assert.throws(
      () => buildStructuredLoopbackCallerForEndpointAndModel(
        '127.0.0.1:1',
        'test-model',
        BOUNDS,
        schema as ReadingLoopbackJsonSchema,
      ),
      /structured schema/,
    );
  }
});

test('structured schema refuses prototype-pollution-shaped property names', () => {
  for (const key of ['__proto__', 'prototype', 'constructor']) {
    const properties = Object.create(null);
    properties[key] = { type: 'string', enum: ['proposal'] };

    const schema = {
      type: 'object',
      properties,
      required: [key],
      additionalProperties: false,
    };

    assert.throws(
      () => buildStructuredLoopbackCallerForEndpointAndModel(
        '127.0.0.1:1',
        'test-model',
        BOUNDS,
        schema as ReadingLoopbackJsonSchema,
      ),
      /structured schema/,
    );
  }
});
