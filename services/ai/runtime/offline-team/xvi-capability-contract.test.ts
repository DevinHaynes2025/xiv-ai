import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as ts from 'typescript';
import { CAPABILITY_CONTRACT, CAPABILITY_MATRIX, CAPABILITY_POLICY_VERSION, createCapabilitySession, DEFAULT_CAPABILITY_PREFERENCES, parseCapabilityPreferences } from './xvi-capability-contract';

const hash = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const request = (overrides: Record<string, unknown> = {}) => JSON.stringify({ requestId: 'request-a', executionMode: 'OFFLINE_ONLY', tenantId: 'tenant-a', universeId: 'universe-a', actorId: 'human-a', purpose: 'CLARIFY_GOAL', policyVersion: CAPABILITY_POLICY_VERSION, baseRevision: 0, operation: 'PROPOSE_LOCAL_CHANGE', targetMode: null, consent: true, ...overrides });
const session = () => createCapabilitySession('tenant-a', 'universe-a', 'human-a');
test('matrix and contract declare future gates without granting any external capability', () => {
  for (const row of Object.values(CAPABILITY_MATRIX)) {
    assert.equal(row.network, false); assert.equal(row.cloud, false);
    assert.ok(Object.isFrozen(row)); assert.ok(Object.isFrozen(row.requirements));
  }
  assert.equal(CAPABILITY_CONTRACT.automaticTransitions, false);
  assert.equal(CAPABILITY_CONTRACT.agentsEnabled, false);
  assert.deepEqual(CAPABILITY_CONTRACT.agentPermissions, []);
  assert.ok(CAPABILITY_MATRIX.CLOUD_GOVERNED.requirements.includes('REVOCABLE_PERMISSION'));
  assert.ok(CAPABILITY_MATRIX.CLOUD_GOVERNED.requirements.includes('TENANT_UNIVERSE_ISOLATION'));
});
test('canonical receipt independently binds request, state, scope and history', () => {
  const a = session(); const initial = a.snapshot(); const r = a.record(request());
  const { id, digest, canonicalPayload, ...payload } = r;
  assert.equal(canonicalPayload, JSON.stringify(payload)); assert.equal(digest, hash(canonicalPayload));
  assert.equal(id, `xvi-capability-receipt-v1:${digest}`);
  assert.equal(r.requestDigest, hash(request()));
  const state = (s: typeof initial, accepted: string[]) => hash(JSON.stringify({
    scope: { executionMode: s.executionMode, tenantId: s.tenantId, universeId: s.universeId, actorId: s.actorId, policyVersion: s.policyVersion },
    preferences: s.preferences, revision: s.revision, pending: s.pending, accepted,
  }));
  assert.equal(r.fromStateDigest, state(initial, [])); assert.equal(r.toStateDigest, state(a.snapshot(), ['request-a']));
  assert.equal(r.executionMode, 'OFFLINE_ONLY'); assert.equal(r.purpose, 'CLARIFY_GOAL'); assert.equal(r.executed, false);
  assert.equal(r.authenticated, false); assert.equal(r.persisted, false);
  assert.deepEqual(session().record(JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(request())).reverse()), null, 2)), r);
  assert.deepEqual(session().record(request()), r);
  const replay = a.record(request()); assert.equal(replay.reason, 'REPLAY_REFUSED');
  assert.equal(replay.previousDigest, digest); assert.equal(replay.sequence, 2);
  assert.equal(replay.fromStateDigest, replay.toStateDigest);
  assert.notEqual(replay.id, r.id); assert.ok(Object.isFrozen(r));
});
test('receipt identities separate scope, purpose, events, sequence and preferences', () => {
  const original = session().record(request());
  const ids = [original.id];
  for (const [key, value] of [['tenantId', 'tenant-b'], ['universeId', 'universe-b'], ['actorId', 'human-b']]) {
    const scope = { tenantId: 'tenant-a', universeId: 'universe-a', actorId: 'human-a', [key]: value };
    ids.push(createCapabilitySession(scope.tenantId, scope.universeId, scope.actorId).record(request(scope)).id);
  }
  ids.push(session().record(request({ purpose: 'REVIEW_CAPABILITIES' })).id);
  ids.push(session().record(request({ operation: 'DISCARD_LOCAL_CHANGES' })).id);
  const configured = createCapabilitySession('tenant-a', 'universe-a', 'human-a', JSON.stringify({ ...DEFAULT_CAPABILITY_PREFERENCES, dataResidency: 'EU_ONLY' }));
  ids.push(configured.record(request()).id);
  assert.equal(new Set(ids).size, ids.length);
});
test('mode spoofing, policy mismatch and cross-scope requests fail without queue mutation', () => {
  for (const [change, reason] of [
    [{ executionMode: 'ONLINE_ALLOWED' }, 'MODE_SPOOFING_REFUSED'],
    [{ executionMode: 'CLOUD_GOVERNED' }, 'MODE_SPOOFING_REFUSED'],
    [{ policyVersion: 'older' }, 'POLICY_VERSION_REFUSED'],
    [{ tenantId: 'tenant-b' }, 'SCOPE_REFUSED'], [{ universeId: 'universe-b' }, 'SCOPE_REFUSED'],
    [{ actorId: 'human-b' }, 'SCOPE_REFUSED'], [{ consent: false }, 'VISIBLE_HUMAN_CONSENT_REQUIRED'],
  ] as const) {
    const a = session(), before = a.snapshot(), r = a.record(request(change));
    assert.equal(r.reason, reason); assert.equal(r.outcome, 'REFUSED'); assert.deepEqual(a.snapshot(), before);
    if (reason === 'SCOPE_REFUSED') assert.equal(r.requestId, null);
  }
});
test('receipt chains expose replay, reordering and internal omission, including refused events', () => {
  const run = () => {
    const s = session();
    return [s.record(request()), s.record(request({ requestId: 'stale' })),
      s.record(request({ requestId: 'sync', baseRevision: 1, operation: 'SYNCHRONIZE' })),
      s.record(request({ requestId: 'discard', baseRevision: 1, operation: 'DISCARD_LOCAL_CHANGES' }))];
  };
  const receipts = run(); assert.deepEqual(receipts, run());
  const intact = (rs: typeof receipts) => rs.every((r, i) => r.sequence === i + 1 && r.previousDigest === (rs[i - 1]?.digest ?? null) && r.digest === hash(r.canonicalPayload));
  assert.equal(intact(receipts), true);
  assert.equal(intact([receipts[1], receipts[0], ...receipts.slice(2)]), false);
  assert.equal(intact(receipts.filter((_, i) => i !== 1)), false);
  assert.equal(intact([...receipts, receipts[3]]), false);
  const other = session(); other.record(request()); other.record(request({ requestId: 'different-refusal' }));
  assert.notEqual(other.record(request({ requestId: 'sync', baseRevision: 1, operation: 'SYNCHRONIZE' })).digest, receipts[2].digest);
});
test('no consent claim enables transitions, synchronization, uploads or cloud operations', () => {
  const a = session();
  for (const targetMode of ['ONLINE_ALLOWED', 'CLOUD_GOVERNED']) {
    assert.equal(a.record(request({ operation: 'REQUEST_MODE_CHANGE', targetMode })).reason, 'MODE_TRANSITION_UNAVAILABLE');
    assert.equal(a.snapshot().executionMode, 'OFFLINE_ONLY');
  }
  for (const operation of ['SYNCHRONIZE', 'UPLOAD', 'CLOUD_OPERATION']) assert.equal(a.record(request({ operation })).reason, 'AUTHENTICATED_ADAPTER_UNAVAILABLE');
  assert.equal(a.record(request({ operation: 'REQUEST_MODE_CHANGE', targetMode: 'OFFLINE_ONLY' })).reason, 'ALREADY_OFFLINE_NO_TRANSITION');
  assert.equal(a.snapshot().executionMode, 'OFFLINE_ONLY');
});
test('pending proposals are bounded immutable metadata; stale and replay edits fail closed', () => {
  const a = session(); a.record(request()); const before = a.snapshot();
  assert.equal(a.record(request()).reason, 'REPLAY_REFUSED');
  assert.equal(a.record(request({ requestId: 'mobile' })).reason, 'STALE_REVISION_REFUSED');
  assert.deepEqual(a.snapshot(), before);
  assert.ok(Object.isFrozen(before.pending)); assert.ok(Object.isFrozen(before.pending[0]));
  assert.equal(a.record(request({ requestId: 'mobile', baseRevision: 1 })).outcome, 'RECORDED');
  assert.equal(session().snapshot().pendingReviewCount, 0);
  for (let i = 2; i < 32; i++) a.record(request({ requestId: `r-${i}`, baseRevision: i }));
  assert.equal(a.record(request({ requestId: 'overflow', baseRevision: 32 })).reason, 'PENDING_CAPACITY_REACHED');
  assert.equal(a.record(request({ requestId: 'discard', baseRevision: 32, operation: 'DISCARD_LOCAL_CHANGES' })).outcome, 'RECORDED');
  assert.equal(a.snapshot().pendingReviewCount, 0);
  assert.equal(a.record(request({ requestId: 'discard', baseRevision: 32, operation: 'DISCARD_LOCAL_CHANGES' })).reason, 'REPLAY_REFUSED');
});
test('session capacity cannot prevent discard and accepted-request bookkeeping stays bounded', () => {
  const a = session();
  for (let i = 0; i < 127; i++) assert.equal(a.record(request({ requestId: `r-${i}`, baseRevision: i, operation: 'REQUEST_MODE_CHANGE', targetMode: 'OFFLINE_ONLY' })).outcome, 'RECORDED');
  a.record(request({ requestId: 'last-proposal', baseRevision: 127 }));
  assert.equal(a.snapshot().pendingReviewCount, 1);
  assert.equal(a.record(request({ requestId: 'full', baseRevision: 128 })).reason, 'SESSION_CAPACITY_REACHED');
  const clear = request({ requestId: 'clear', baseRevision: 128, operation: 'DISCARD_LOCAL_CHANGES' });
  assert.equal(a.record(clear).outcome, 'RECORDED'); assert.equal(a.snapshot().pendingReviewCount, 0);
  assert.equal(a.record(clear).reason, 'STALE_REVISION_REFUSED');
});
test('hostile inputs are bounded, never coerced, and never stored as content', () => {
  const a = session(); let touched = 0;
  const proxy = new Proxy({}, { get() { touched++; throw Error(); }, ownKeys() { touched++; throw Error(); } });
  const unicode = request({ purpose: '界'.repeat(700) });
  assert.ok(unicode.length < 2048); assert.ok(Buffer.byteLength(unicode) > 2048);
  for (const input of [proxy, null, [], 'null', '[]', '{', request({ extra: true }), request({ requestId: 'bad\n' }), request({ purpose: '\ud800' }), request({ purpose: '\u202e' }), request({ purpose: '__proto__' }), request({ consent: 'true' }), request({ baseRevision: -1 }), request({ baseRevision: 0.5 }), '{"__proto__":{"polluted":true}}', unicode, 'x'.repeat(2049)]) {
    const r = a.record(input); assert.equal(r.outcome, 'REFUSED'); assert.equal(a.snapshot().pendingReviewCount, 0);
    assert.equal(r.digest, hash(r.canonicalPayload));
  }
  assert.equal(touched, 0); assert.equal(({} as { polluted?: boolean }).polluted, undefined);
  assert.equal(a.record(unicode).requestEncoding, 'REDACTED');
  assert.throws(() => createCapabilitySession(proxy as string, 'universe-a', 'human-a'), /SCOPE_REFUSED/);
  assert.equal(touched, 0);
});
test('preference changes never relax safety, mode or identity requirements', () => {
  const p = { language: 'ar', locale: 'ar-SA', accessibility: 'SCREEN_READER', culturalContext: 'local-custom', dataResidency: 'EU_ONLY' };
  assert.deepEqual(parseCapabilityPreferences(JSON.stringify(p)), p);
  const a = createCapabilitySession('tenant-a', 'universe-a', 'human-a', JSON.stringify(p));
  assert.equal(a.snapshot().agentsEnabled, false); assert.equal(a.snapshot().executionMode, 'OFFLINE_ONLY');
  assert.equal(a.record(request({ operation: 'UPLOAD' })).outcome, 'REFUSED');
  for (const x of [{ ...p, network: true }, { ...p, locale: 'en-US' }, { ...p, dataResidency: 'ANYWHERE' }]) assert.throws(() => parseCapabilityPreferences(JSON.stringify(x)), /PREFERENCES_REFUSED/);
});
test('contract dependency closure contains no external I/O, worker, clock or execution path', t => {
  t.mock.method(globalThis, 'fetch', () => { throw Error('network'); });
  t.mock.method(Date, 'now', () => { throw Error('clock'); });
  t.mock.method(Math, 'random', () => { throw Error('random'); });
  assert.equal(session().record(request()).outcome, 'RECORDED');
  for (const name of ['xvi-capability-contract.ts', 'xvi-canonical-sha256.ts']) {
    const source = ts.createSourceFile(name, readFileSync(new URL(name, import.meta.url), 'utf8'), ts.ScriptTarget.ES2022, true);
    const imports: string[] = []; const forbidden = new Set(['fetch', 'process', 'require', 'eval', 'Function', 'Worker', 'WebSocket', 'XMLHttpRequest', 'localStorage', 'indexedDB', 'setTimeout', 'setInterval']);
    const visit = (n: ts.Node) => {
      if (ts.isImportDeclaration(n)) imports.push((n.moduleSpecifier as ts.StringLiteral).text);
      if (ts.isIdentifier(n)) assert.ok(!forbidden.has(n.text), n.text);
      if (ts.isCallExpression(n)) assert.notEqual(n.expression.kind, ts.SyntaxKind.ImportKeyword);
      ts.forEachChild(n, visit);
    }; visit(source);
    assert.deepEqual(imports, name === 'xvi-capability-contract.ts' ? ['./xvi-canonical-sha256'] : []);
  }
});
