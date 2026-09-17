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
  READING_LOOPBACK_CALLER_POLICY,
} from './xiv-reading-loopback-caller';
import { auditAlignmentInvariants, AUTHORIZED_NETWORK_SURFACES } from './alignment-invariant-audit';

const HERE = dirname(fileURLToPath(import.meta.url));

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

test('12d-289: the pin is real — the pinned model, stream:false, temperature:0 hit the wire', async () => {
  await withServer(200, JSON.stringify({ response: 'the draft text verbatim' }), async (_s, endpoint, seen) => {
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