// 12D-367 — adversarial tests for the multi-reasoner failover caller
// (CEO directive 2026-09-19: "if ollama go down we need to find
// alternatives ... lets have multiple llms"). Central properties under
// attack:
//   1. THE LIST IS DECLARED, DISTINCT, CAPPED: an empty list, a
//      duplicate, a >cap list, or any non-loopback entry refuses at
//      BUILD time — before any request.
//   2. FAILOVER IS ORDERED SELECTION, NOT RETRY CHURN: with candidate
//      A down and candidate B up, exactly ONE request hits A and
//      exactly ONE hits B, and B's answer settles. A request is never
//      replayed against the same candidate.
//   3. ALL-DOWN IS HONEST: every candidate failing rejects with an
//      error naming every measured failure — no invented availability,
//      no remote fallback, no silent success.
//   4. THE MODEL PIN SURVIVES FAILOVER: the settled result names the
//      pinned 12D-280/289 model, whatever endpoint served it — the
//      12D-280 reader's model-identity gate stays untouched.
//   5. THE AUDIT STAYS GREEN: the module declares no *_GUARDRAILS, calls
//      no fetch, and imports no network primitive — composition over
//      the authorized 12D-289 builders only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildFailoverLoopbackCaller, buildFailoverLoopbackCallerDefault,
  READING_FAILOVER_CALLER_POLICY,
} from './xiv-reading-failover-caller';
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

test('12d-367: the policy is pinned honest', () => {
  assert.equal(READING_FAILOVER_CALLER_POLICY.policyVersion, '12d-367-v1');
  assert.equal(READING_FAILOVER_CALLER_POLICY.model, 'qwen2.5-coder:7b');
  assert.deepEqual(READING_FAILOVER_CALLER_POLICY.defaultEndpoints, ['127.0.0.1:11434']);
  assert.equal(READING_FAILOVER_CALLER_POLICY.loopbackOnly, true);
  assert.equal(READING_FAILOVER_CALLER_POLICY.remoteCalls, 0);
  assert.equal(READING_FAILOVER_CALLER_POLICY.candidatesTriedInDeclaredOrder, true);
  assert.equal(READING_FAILOVER_CALLER_POLICY.allDownIsAnHonestBlockerNotRecovery, true);
  assert.equal(READING_FAILOVER_CALLER_POLICY.automaticRecovery, false);
  assert.equal(READING_FAILOVER_CALLER_POLICY.learningPromoted, false);
  assert.equal(READING_FAILOVER_CALLER_POLICY.activated, 0);
  assert.equal(READING_FAILOVER_CALLER_POLICY.collectsNothing, true);
  assert.equal(READING_FAILOVER_CALLER_POLICY.modelWeightMutation, false);
  assert.equal(READING_FAILOVER_CALLER_POLICY.billionUsersProven, false);
  assert.equal(READING_FAILOVER_CALLER_POLICY.humanDecision, 'REQUIRED');
  assert.equal(READING_FAILOVER_CALLER_POLICY.maxCandidates, 8);
});

test('12d-367: the candidate list is declared, distinct, within cap, loopback — all at build time', () => {
  assert.throws(() => buildFailoverLoopbackCaller([]), /at least one declared loopback endpoint/);
  assert.throws(
    () => buildFailoverLoopbackCaller(['127.0.0.1:11434', '127.0.0.1:11434']),
    /must be distinct declared endpoint strings/,
  );
  assert.throws(
    () => buildFailoverLoopbackCaller(['127.0.0.1:11434', '127.0.0.1:11435', '127.0.0.1:11436', '127.0.0.1:11437',
      '127.0.0.1:11438', '127.0.0.1:11439', '127.0.0.1:11440', '127.0.0.1:11441', '127.0.0.1:11442']),
    /exceeds 8 candidates/,
  );
  assert.throws(() => buildFailoverLoopbackCaller(['127.0.0.1:11434', 'remote.example.invalid:11434']), /loopback-only/,
    'a non-loopback entry refuses before any request');
  assert.throws(() => buildFailoverLoopbackCaller(['127.0.0.1:99999']), /port is out of range/);
});

test('12d-367: failover is ordered selection — A down, B up, exactly one request each, B settles', async () => {
  await withResponder(500, 'boom', async (downEndpoint, downSeen) => {
    await withResponder(200, JSON.stringify({ response: 'the draft from the backup' }), async (upEndpoint, upSeen) => {
      const caller = buildFailoverLoopbackCaller([downEndpoint, upEndpoint]);
      const out = await caller('READ AND SUMMARIZE a chunk.');
      assert.equal(out.model, 'qwen2.5-coder:7b');
      assert.equal(out.response, 'the draft from the backup');
      assert.equal(downSeen.count, 1, 'the down candidate is hit exactly once — no retry churn');
      assert.equal(upSeen.count, 1, 'the up candidate settles on its first call');
    });
  });
});

test('12d-367: declared order wins — the FIRST healthy candidate answers, later ones are never called', async () => {
  await withResponder(200, JSON.stringify({ response: 'primary draft' }), async (primaryEndpoint, primarySeen) => {
    await withResponder(200, JSON.stringify({ response: 'backup draft' }), async (backupEndpoint, backupSeen) => {
      const caller = buildFailoverLoopbackCaller([primaryEndpoint, backupEndpoint]);
      const out = await caller('READ AND SUMMARIZE a chunk.');
      assert.equal(out.response, 'primary draft');
      assert.equal(primarySeen.count, 1);
      assert.equal(backupSeen.count, 0);
    });
  });
});

test('12d-367: all-down is an honest blocker — every measured failure named, no remote fallback, no churn', async () => {
  await withResponder(500, 'boom-a', async (a, aSeen) => {
    await withResponder(503, 'boom-b', async (b, bSeen) => {
      const caller = buildFailoverLoopbackCaller([a, b]);
      await assert.rejects(() => caller('READ AND SUMMARIZE a chunk.'), (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        return /all 2 loopback candidate\(s\) failed/.test(message)
          && /honestly down/.test(message)
          && /never a remote fallback/.test(message)
          && message.includes(`${a}: ollama returned HTTP 500`)
          && message.includes(`${b}: ollama returned HTTP 503`);
      });
      assert.equal(aSeen.count, 1);
      assert.equal(bSeen.count, 1);
    });
  });
});

test('12d-367: the default builder is today\'s single pinned endpoint — behavior unchanged', async () => {
  assert.deepEqual(buildFailoverLoopbackCallerDefault, buildFailoverLoopbackCallerDefault);
  await withResponder(200, JSON.stringify({ response: 'verbatim' }), async (endpoint, seen) => {
    const caller = buildFailoverLoopbackCaller([endpoint]);
    const out = await caller('READ AND SUMMARIZE a chunk.');
    assert.equal(out.model, 'qwen2.5-coder:7b');
    assert.equal(out.response, 'verbatim');
    assert.equal(seen.count, 1);
  });
});

test('12d-367: an empty prompt refuses; the module carries no network primitive and no guardrails', () => {
  const caller = buildFailoverLoopbackCaller(['127.0.0.1:11434']);
  assert.rejects(() => caller(''), /non-empty prompt string/);
  assert.rejects(() => (caller as unknown as (p: unknown) => Promise<unknown>)(5 as unknown), /non-empty prompt string/);
  const src = readFileSync(join(HERE, 'xiv-reading-failover-caller.ts'), 'utf8');
  assert.ok(!/fetch\s*\(/.test(src), 'the failover module composes; it calls no fetch');
  assert.ok(!/node:(http|https|net|dns|dgram|tls|undici)/.test(src), 'the failover module imports no network primitive');
  assert.ok(!/[A-Z][A-Z0-9_]*_GUARDRAILS\b\s*=/.test(src), 'the failover module declares no *_GUARDRAILS');
  assert.ok(!AUTHORIZED_NETWORK_SURFACES.some((a) => a.file === 'xiv-reading-failover-caller.ts'),
    'composition needs no new authorized network surface — the 12D-289 module stays the only fetcher');
});

test('12d-367: the REAL audit over the offline-team runtime still reports ZERO findings', () => {
  const packet = auditAlignmentInvariants({ dir: HERE, auditedAtMs: 1_700_005_000 });
  assert.equal(packet.kind, 'ALIGNMENT_INVARIANT_AUDIT');
  assert.deepEqual(packet.findings, [], `audit findings: ${packet.findings.map((f) => `${f.invariant} ${f.file}: ${f.detail}`).join('; ')}`);
});