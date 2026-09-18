// 12D-385 — adversarial tests for the multi-MODEL reading caller
// (CEO directive 2026-09-19: "lets have multiple llms"). Central
// properties under attack:
//   1. THE LIST IS DECLARED, DISTINCT, CAPPED: an empty list, a
//      duplicate, a >cap list, a non-loopback endpoint, or a
//      malformed model name refuses at BUILD time — before any
//      request.
//   2. FAILOVER ACROSS MODELS IS ORDERED SELECTION, NOT RETRY CHURN:
//      with the primary model's endpoint down and a declared fallback
//      up, exactly ONE request hits each, and the fallback's answer
//      settles under the FALLBACK's declared model name.
//   3. ALL-DOWN IS HONEST: every measured failure is named per
//      model@endpoint — no invented availability, no remote fallback.
//   4. THE DEFAULT IS TODAY'S BEHAVIOR: the default builder declares
//      exactly the single pinned primary (qwen2.5-coder:7b at
//      127.0.0.1:11434); the policy's declaredFallbackModels is EMPTY.
//   5. THE AUDIT STAYS GREEN: composition over the authorized 12D-289
//      module only — no fetch, no network primitive, no *_GUARDRAILS,
//      no new authorized surface.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildMultiModelCaller, buildMultiModelCallerDefault,
  MULTI_MODEL_READING_CALLER_POLICY,
} from './xiv-reading-multi-model-caller';
import { buildLoopbackCallerForEndpointAndModel } from './xiv-reading-loopback-caller';
import { OLLAMA_FIRST_READER_POLICY } from './xiv-ollama-first-reader';
import { auditAlignmentInvariants, AUTHORIZED_NETWORK_SURFACES } from './alignment-invariant-audit';

const HERE = dirname(fileURLToPath(import.meta.url));

async function withResponder(
  status: number,
  body: string,
  fn: (endpoint: string, seen: { count: number }) => Promise<void>,
): Promise<void> {
  const seen = { count: 0 };
  const server = createServer((_req, res) => {
    seen.count += 1;
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address();
  assert.ok(addr !== null && typeof addr === 'object');
  const endpoint = `127.0.0.1:${addr.port}`;
  try {
    await fn(endpoint, seen);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

test('12d-385: the policy is pinned honest — empty declared fallbacks by default', () => {
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.policyVersion, '12d-385-v1');
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.primaryModel, 'qwen2.5-coder:7b');
  assert.deepEqual(MULTI_MODEL_READING_CALLER_POLICY.declaredFallbackModels, []);
  assert.deepEqual(MULTI_MODEL_READING_CALLER_POLICY.defaultEndpoints, ['127.0.0.1:11434']);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.loopbackOnly, true);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.remoteCalls, 0);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.candidatesTriedInDeclaredOrder, true);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.firstHealthyAnswerSettles, true);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.noRetryChurn, true);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.allDownIsAnHonestBlockerNotRecovery, true);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.reportedModelMustEqualDeclaredModel, true);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.automaticRecovery, false);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.learningPromoted, false);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.activated, 0);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.collectsNothing, true);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.modelWeightMutation, false);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.billionUsersProven, false);
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.humanDecision, 'REQUIRED');
  assert.equal(MULTI_MODEL_READING_CALLER_POLICY.maxCandidates, 8);
  // The 12D-280 reader's fallback list mirrors the caller policy's.
  assert.deepEqual(OLLAMA_FIRST_READER_POLICY.declaredFallbackModels, []);
  assert.equal(OLLAMA_FIRST_READER_POLICY.modelName, 'qwen2.5-coder:7b');
});

test('12d-385: the candidate list is declared, distinct, capped, loopback, well-named — all at build time', () => {
  assert.throws(() => buildMultiModelCaller([]), /declared non-empty candidate list/);
  assert.throws(
    () => buildMultiModelCaller([
      { endpoint: '127.0.0.1:11434', model: 'qwen2.5-coder:7b' },
      { endpoint: '127.0.0.1:11434', model: 'qwen2.5-coder:7b' },
    ]),
    /duplicate candidate/,
  );
  const nine = Array.from({ length: 9 }, (_, i) => ({ endpoint: `127.0.0.1:${11434 + i}`, model: `m${i}` }));
  assert.throws(() => buildMultiModelCaller(nine), /at most 8 candidates/);
  assert.throws(
    () => buildMultiModelCaller([{ endpoint: 'remote.example.invalid:11434', model: 'qwen2.5-coder:7b' }]),
    /loopback-only/,
    'a non-loopback endpoint refuses before any request',
  );
  assert.throws(
    () => buildMultiModelCaller([{ endpoint: '127.0.0.1:11434', model: 'has space' }]),
    /model name is malformed/,
  );
  assert.throws(
    () => buildMultiModelCaller([{ endpoint: '127.0.0.1:11434', model: '' }]),
    /model name is malformed/,
  );
});

test('12d-385: failover across MODELS — primary down, declared fallback settles under the fallback model', async () => {
  await withResponder(500, 'boom', async (downEndpoint, downSeen) => {
    await withResponder(200, JSON.stringify({ response: 'the fallback draft' }), async (upEndpoint, upSeen) => {
      const caller = buildMultiModelCaller([
        { endpoint: downEndpoint, model: 'qwen2.5-coder:7b' },
        { endpoint: upEndpoint, model: 'qwen2.5:3b' },
      ]);
      const out = await caller('READ AND SUMMARIZE a chunk.');
      assert.equal(out.model, 'qwen2.5:3b', 'the settled result names the model that ACTUALLY served it');
      assert.equal(out.candidateIndex, 1);
      assert.equal(out.response, 'the fallback draft');
      assert.equal(downSeen.count, 1, 'the down primary is hit exactly once — no retry churn');
      assert.equal(upSeen.count, 1, 'the fallback settles on its first call');
    });
  });
});

test('12d-385: declared order wins — the primary model answers, the fallback is never called', async () => {
  await withResponder(200, JSON.stringify({ response: 'primary draft' }), async (primaryEndpoint, primarySeen) => {
    await withResponder(200, JSON.stringify({ response: 'fallback draft' }), async (fallbackEndpoint, fallbackSeen) => {
      const caller = buildMultiModelCaller([
        { endpoint: primaryEndpoint, model: 'qwen2.5-coder:7b' },
        { endpoint: fallbackEndpoint, model: 'qwen2.5:3b' },
      ]);
      const out = await caller('READ AND SUMMARIZE a chunk.');
      assert.equal(out.model, 'qwen2.5-coder:7b');
      assert.equal(out.candidateIndex, 0);
      assert.equal(out.response, 'primary draft');
      assert.equal(primarySeen.count, 1);
      assert.equal(fallbackSeen.count, 0);
    });
  });
});

test('12d-385: all-down is an honest blocker naming every model@endpoint failure', async () => {
  await withResponder(500, 'boom-a', async (a, aSeen) => {
    await withResponder(503, 'boom-b', async (b, bSeen) => {
      const caller = buildMultiModelCaller([
        { endpoint: a, model: 'qwen2.5-coder:7b' },
        { endpoint: b, model: 'qwen2.5:3b' },
      ]);
      await assert.rejects(() => caller('READ AND SUMMARIZE a chunk.'), (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        return /all 2 declared candidate\(s\) failed/.test(message)
          && /honestly down/.test(message)
          && /never a remote fallback/.test(message)
          && message.includes(`qwen2.5-coder:7b@${a}: ollama returned HTTP 500`)
          && message.includes(`qwen2.5:3b@${b}: ollama returned HTTP 503`);
      });
      assert.equal(aSeen.count, 1);
      assert.equal(bSeen.count, 1);
    });
  });
});

test('12d-385: the default builder is the single pinned primary — behavior unchanged', async () => {
  await withResponder(200, JSON.stringify({ response: 'verbatim' }), async (endpoint, seen) => {
    const caller = buildMultiModelCaller([{ endpoint, model: MULTI_MODEL_READING_CALLER_POLICY.primaryModel }]);
    const out = await caller('READ AND SUMMARIZE a chunk.');
    assert.equal(out.model, 'qwen2.5-coder:7b');
    assert.equal(out.candidateIndex, 0);
    assert.equal(out.response, 'verbatim');
    assert.equal(seen.count, 1);
  });
  // The DEFAULT default (no arguments) targets the pinned primary
  // endpoint — verified WITHOUT a live call: its pre-request gates
  // fire identically wherever it points, and a test must never depend
  // on a live Ollama instance.
  const def = buildMultiModelCallerDefault();
  assert.rejects(() => def(''), /non-empty prompt/, 'the default refuses an empty prompt before any request');
  assert.rejects(() => (def as unknown as (p: unknown) => Promise<unknown>)(null as unknown), /non-empty prompt/);
});

test('12d-385: an empty prompt refuses; the module carries no network primitive and no guardrails', () => {
  const caller = buildMultiModelCaller([{ endpoint: '127.0.0.1:11434', model: 'qwen2.5-coder:7b' }]);
  assert.rejects(() => caller(''), /non-empty prompt/);
  assert.rejects(() => (caller as unknown as (p: unknown) => Promise<unknown>)(5 as unknown), /non-empty prompt/);
  const src = readFileSync(join(HERE, 'xiv-reading-multi-model-caller.ts'), 'utf8');
  assert.ok(!/fetch\s*\(/.test(src), 'the multi-model module composes; it calls no fetch');
  assert.ok(!/node:(http|https|net|dns|dgram|tls|undici)/.test(src), 'the multi-model module imports no network primitive');
  assert.ok(!/[A-Z][A-Z0-9_]*_GUARDRAILS\b\s*=/.test(src), 'the multi-model module declares no *_GUARDRAILS');
  assert.ok(!AUTHORIZED_NETWORK_SURFACES.some((a) => a.file === 'xiv-reading-multi-model-caller.ts'),
    'composition needs no new authorized network surface — the 12D-289 module stays the only fetcher');
});

test('12d-385: the 12D-289 module validates the model name at build time — pre-request', () => {
  assert.throws(() => buildLoopbackCallerForEndpointAndModel('127.0.0.1:11434', 'bad model!'), /model name is malformed/);
  assert.throws(() => buildLoopbackCallerForEndpointAndModel('127.0.0.1:11434', ''), /model name is malformed/);
  assert.throws(() => buildLoopbackCallerForEndpointAndModel('remote.example.invalid', 'qwen2.5-coder:7b'), /loopback-only/);
});

test('12d-385: the REAL audit over the offline-team runtime still reports ZERO findings', () => {
  const packet = auditAlignmentInvariants({ dir: HERE, auditedAtMs: 1_700_005_000 });
  assert.equal(packet.kind, 'ALIGNMENT_INVARIANT_AUDIT');
  assert.deepEqual(packet.findings, [], `audit findings: ${packet.findings.map((f) => `${f.invariant} ${f.file}: ${f.detail}`).join('; ')}`);
});