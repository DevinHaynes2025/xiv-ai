import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import * as ts from 'typescript';
import { createOfflineSupervisorContract, OFFLINE_SUPERVISOR_POLICY as P, SUPERVISOR_MODE_DECLARATIONS } from './xvi-offline-supervisor-contract';

const create = () => createOfflineSupervisorContract('tenant-a', 'universe-a', 'human-a');
const request = (overrides: Record<string, unknown> = {}) => JSON.stringify({
  tenantId: 'tenant-a', universeId: 'universe-a', actorId: 'human-a', executionMode: 'OFFLINE_ONLY',
  policyVersion: P.version, purpose: 'SYNTHETIC_SUPERVISOR_METADATA', requestId: 'request-a',
  baseRevision: 0, operation: 'PROPOSE', nowMs: 0, referenceId: null, durationMs: 1000, consent: true, ...overrides,
});
const hash = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const send = (s: ReturnType<typeof create>, operation: string, overrides: Record<string, unknown> = {}) => s.humanControl.record(request({
  operation, requestId: `request-${s.snapshot().revision + 1}`, baseRevision: s.snapshot().revision,
  nowMs: s.snapshot().observedAtMs, durationMs: null, ...overrides,
}));
function leased(durationMs = 1000) {
  const s = create(); s.propose(request({ durationMs }));
  assert.equal(send(s, 'APPROVE', { referenceId: 'proposal-1' }).outcome, 'RECORDED'); return s;
}
test('default state is inert and modes never grant execution capabilities', () => {
  const s = create().snapshot();
  assert.equal(s.lifecycle, 'IDLE'); assert.equal(s.runningWorkers, 0);
  assert.equal(s.agentsEnabled, false); assert.deepEqual(s.agentPermissions, []);
  assert.equal(s.execution, 'UNAVAILABLE'); assert.equal(s.persisted, false);
  assert.equal(P.retryLimit, 0); assert.equal(P.serviceActivation, 'UNAVAILABLE');
  assert.deepEqual(Object.keys(SUPERVISOR_MODE_DECLARATIONS), ['OFFLINE_ONLY', 'ONLINE_ALLOWED', 'CLOUD_GOVERNED']);
  assert.ok(Object.isFrozen(s)); assert.ok(Object.isFrozen(s.acceptedRequestIds));
});
test('proposal-only handle cannot approve, renew, resume, stop or execute', () => {
  const s = create(); assert.equal(s.propose(request()).reason, 'AWAITING_HUMAN_REVIEW');
  for (const operation of ['APPROVE', 'HEARTBEAT', 'COMPLETE', 'EXPIRE', 'PAUSE', 'RESUME', 'DRAIN', 'KILL']) {
    const referenceId = ['APPROVE', 'HEARTBEAT', 'COMPLETE', 'EXPIRE'].includes(operation) ? 'proposal-1' : null;
    assert.equal(s.propose(request({ operation, referenceId, durationMs: null, requestId: 'agent-attempt', baseRevision: 1 })).reason, 'HUMAN_CONTROL_REQUIRED');
  }
  assert.equal(s.snapshot().lifecycle, 'PENDING_REVIEW'); assert.equal(s.snapshot().lease, null);
  assert.equal(send(s, 'APPROVE', { referenceId: 'proposal-wrong' }).reason, 'STALE_PROPOSAL');
  assert.equal(send(s, 'APPROVE', { referenceId: 'proposal-1', consent: false }).reason, 'HUMAN_CONSENT_REQUIRED');
});
test('lease approval, heartbeat and completion record metadata without execution', () => {
  const s = leased(); assert.equal(s.snapshot().lease?.expiresAtMs, 1000);
  assert.equal(send(s, 'HEARTBEAT', { referenceId: 'lease-2', nowMs: 500 }).reason, 'HEARTBEAT_METADATA_ONLY');
  assert.equal(s.snapshot().lease?.expiresAtMs, 1500);
  assert.equal(send(s, 'COMPLETE', { referenceId: 'lease-2', nowMs: 1499 }).outcome, 'RECORDED');
  assert.equal(s.snapshot().lifecycle, 'IDLE'); assert.equal(s.snapshot().lease, null);
  assert.equal(s.snapshot().runningWorkers, 0);
});
test('lease expiry is exclusive and heartbeat lifetime has an absolute bound', () => {
  const s = leased(30_000);
  for (const nowMs of [29_000, 58_000, 87_000, 116_000, 119_999]) assert.equal(send(s, 'HEARTBEAT', { referenceId: 'lease-2', nowMs }).outcome, 'RECORDED');
  assert.equal(s.snapshot().lease?.expiresAtMs, 120_000);
  assert.equal(send(s, 'HEARTBEAT', { referenceId: 'lease-2', nowMs: 120_000 }).reason, 'LEASE_EXPIRED');
  assert.equal(send(s, 'COMPLETE', { referenceId: 'lease-2', nowMs: 120_000 }).reason, 'LEASE_EXPIRED');
  assert.equal(send(s, 'EXPIRE', { referenceId: 'lease-2', nowMs: 119_999 }).reason, 'LEASE_NOT_EXPIRED');
  assert.equal(send(s, 'EXPIRE', { referenceId: 'lease-2', nowMs: 120_000 }).reason, 'TIMEOUT_REQUIRES_HUMAN_REVIEW');
  assert.equal(s.snapshot().lifecycle, 'PAUSED'); assert.equal(s.snapshot().lease, null);
});
test('pause and kill override stale revision/time and cancel leases; kill latches', () => {
  const s = leased(); send(s, 'HEARTBEAT', { referenceId: 'lease-2', nowMs: 500 });
  assert.equal(send(s, 'PAUSE', { baseRevision: 0, nowMs: 0, consent: false }).outcome, 'RECORDED');
  assert.equal(s.snapshot().observedAtMs, 500); assert.equal(s.snapshot().lease, null);
  assert.equal(send(s, 'RESUME').outcome, 'RECORDED'); assert.equal(s.snapshot().lifecycle, 'IDLE');
  assert.equal(send(s, 'KILL', { baseRevision: 0, nowMs: 0, consent: false }).outcome, 'RECORDED');
  for (const operation of ['RESUME', 'PAUSE', 'KILL']) assert.equal(send(s, operation).reason, 'KILL_LATCHED');
  assert.equal(s.snapshot().lifecycle, 'KILLED');
});
test('drain refuses renewal and proposals then pauses on completion or expiry', () => {
  for (const ending of ['COMPLETE', 'EXPIRE']) {
    const s = leased(); assert.equal(send(s, 'DRAIN').outcome, 'RECORDED');
    assert.equal(s.snapshot().lifecycle, 'DRAINING');
    assert.equal(send(s, 'HEARTBEAT', { referenceId: 'lease-2', nowMs: 500 }).reason, 'DRAINING_NO_RENEWAL');
    assert.equal(send(s, 'PROPOSE', { durationMs: 1000 }).reason, 'TRANSITION_REFUSED');
    assert.equal(send(s, ending, { referenceId: 'lease-2', nowMs: ending === 'EXPIRE' ? 1000 : 500 }).outcome, 'RECORDED');
    assert.equal(s.snapshot().lifecycle, 'PAUSED');
  }
  const pending = create(); pending.propose(request()); send(pending, 'DRAIN');
  assert.equal(pending.snapshot().pending, null); assert.equal(pending.snapshot().lifecycle, 'PAUSED');
});
test('replay, stale leases, stale revisions, backwards time and occupied slots refuse unchanged', () => {
  const s = leased(); const before = s.snapshot();
  assert.equal(s.propose(request()).reason, 'REPLAY_REFUSED');
  assert.equal(send(s, 'HEARTBEAT', { referenceId: 'lease-wrong' }).reason, 'STALE_LEASE');
  assert.equal(send(s, 'HEARTBEAT', { referenceId: 'lease-2', baseRevision: 1 }).reason, 'STALE_REVISION');
  assert.equal(send(s, 'HEARTBEAT', { referenceId: 'lease-2' }).reason, 'HEARTBEAT_NOT_ADVANCING');
  assert.equal(send(s, 'PROPOSE', { durationMs: 1000 }).reason, 'TRANSITION_REFUSED');
  assert.deepEqual(s.snapshot(), before);
  send(s, 'HEARTBEAT', { referenceId: 'lease-2', nowMs: 500 });
  assert.equal(send(s, 'COMPLETE', { referenceId: 'lease-2', nowMs: 499 }).reason, 'TIME_REGRESSION');
});
test('request capacity remains bounded and cannot obstruct human pause or kill', () => {
  const s = create();
  for (let i = 0; i < P.rememberedRequests; i++) assert.equal(send(s, i % 2 === 0 ? 'PAUSE' : 'RESUME').outcome, 'RECORDED');
  assert.equal(s.snapshot().acceptedRequestIds.length, 64);
  assert.equal(send(s, 'PROPOSE', { durationMs: 1000 }).reason, 'SESSION_CAPACITY');
  assert.equal(send(s, 'PAUSE', { baseRevision: 0 }).outcome, 'RECORDED');
  assert.equal(send(s, 'PAUSE').reason, 'ALREADY_PAUSED');
  assert.equal(send(s, 'RESUME').reason, 'SESSION_CAPACITY');
  assert.equal(send(s, 'KILL', { baseRevision: 0 }).outcome, 'RECORDED');
  assert.equal(s.snapshot().acceptedRequestIds.length, 64);
});
test('scope, actor, policy, unknown modes and online/cloud modes fail closed even for kill', () => {
  const s = leased(), before = s.snapshot();
  for (const changes of [{ tenantId: 'tenant-b' }, { universeId: 'universe-b' }, { actorId: 'human-b' },
    { policyVersion: 'wrong' }, { executionMode: 'ONLINE_ALLOWED' }, { executionMode: 'CLOUD_GOVERNED' }, { executionMode: 'UNKNOWN' }]) {
    const r = send(s, 'KILL', changes); assert.equal(r.outcome, 'REFUSED'); assert.deepEqual(s.snapshot(), before);
  }
  assert.equal(create().snapshot().lease, null);
});
test('hostile objects, malformed state, Unicode and payloads refuse without inspection or pollution', () => {
  const s = create(); let touched = 0;
  const proxy = new Proxy({}, { get() { touched++; throw Error(); }, ownKeys() { touched++; throw Error(); } });
  const oversized = request({ purpose: '界'.repeat(600) });
  assert.ok(oversized.length <= 2048); assert.ok(Buffer.byteLength(oversized) > 2048);
  for (const input of [proxy, null, [], 'null', '[]', '{}', '{', 'x'.repeat(2049), request({ state: 'LEASED' }),
    request({ actorId: 'a\n' }), request({ tenantId: '\ud800' }), request({ universeId: '\u202e' }),
    request({ durationMs: 999 }), request({ durationMs: 30_001 }), request({ nowMs: Number.MAX_SAFE_INTEGER }),
    request({ baseRevision: 0.5 }), request({ consent: 'true' }), request({ durationMs: {} }),
    '{"__proto__":{"polluted":true}}', oversized]) {
    assert.equal(s.propose(input).outcome, 'REFUSED'); assert.equal(s.snapshot().revision, 0);
  }
  assert.equal(s.propose(oversized).reason, 'PAYLOAD_BYTE_LIMIT');
  assert.equal(s.propose(oversized).requestDigest, null); assert.equal(touched, 0);
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
  assert.throws(() => createOfflineSupervisorContract(proxy as string, 'u', 'a'), /SCOPE_REFUSED/);
  assert.equal(touched, 0);
});
test('receipts independently bind canonical requests, state, scope, result, sequence and prior digest', () => {
  const s = create(), initial = s.snapshot();
  const stateDigest = (v: typeof initial) => hash(JSON.stringify({ tenantId: v.tenantId, universeId: v.universeId, actorId: v.actorId,
    executionMode: v.executionMode, policyVersion: v.policyVersion, lifecycle: v.lifecycle, revision: v.revision,
    observedAtMs: v.observedAtMs, pending: v.pending, lease: v.lease, acceptedRequestIds: v.acceptedRequestIds }));
  const first = s.propose(request()), replay = s.propose(request()), last = send(s, 'KILL');
  assert.equal(first.fromStateDigest, stateDigest(initial));
  assert.equal(last.toStateDigest, stateDigest(s.snapshot()));
  assert.equal(first.requestDigest, hash(request()));
  for (const [i, r] of [first, replay, last].entries()) {
    const { digest, id, canonicalPayload, ...payload } = r;
    assert.equal(canonicalPayload, JSON.stringify(payload)); assert.equal(digest, hash(canonicalPayload));
    assert.equal(id, `xvi-offline-supervisor-receipt-v1:${digest}`); assert.equal(r.sequence, i + 1);
    assert.equal(r.previousDigest, [null, first.digest, replay.digest][i]);
    assert.equal(r.executed, false); assert.ok(Object.isFrozen(r.result));
  }
  assert.deepEqual(create().propose(JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(request())).reverse()), null, 2)), first);
  assert.equal(replay.fromStateDigest, replay.toStateDigest);
  const ids = [first.id, create().propose(request({ durationMs: 2000 })).id];
  for (const [tenantId, universeId, actorId] of [['tenant-b', 'universe-a', 'human-a'], ['tenant-a', 'universe-b', 'human-a'], ['tenant-a', 'universe-a', 'human-b']]) ids.push(createOfflineSupervisorContract(tenantId, universeId, actorId).propose(request({ tenantId, universeId, actorId })).id);
  assert.equal(new Set(ids).size, ids.length);
});
test('contract has no live execution, clock, randomness, I/O or mutable state import path', t => {
  t.mock.method(globalThis, 'fetch', () => { throw Error('network'); });
  t.mock.method(Date, 'now', () => { throw Error('clock'); });
  t.mock.method(Math, 'random', () => { throw Error('random'); });
  assert.equal(leased().snapshot().agentsEnabled, false);
  const source = ts.createSourceFile('contract.ts', readFileSync(new URL('./xvi-offline-supervisor-contract.ts', import.meta.url), 'utf8'), ts.ScriptTarget.ES2022, true);
  const imports: string[] = [], forbidden = new Set(['fetch', 'process', 'require', 'eval', 'Function', 'Worker', 'WebSocket', 'XMLHttpRequest', 'setTimeout', 'setInterval', 'localStorage', 'indexedDB']);
  const visit = (n: ts.Node) => {
    if (ts.isImportDeclaration(n)) imports.push((n.moduleSpecifier as ts.StringLiteral).text);
    if (ts.isIdentifier(n)) assert.ok(!forbidden.has(n.text), n.text);
    if (ts.isCallExpression(n)) assert.notEqual(n.expression.kind, ts.SyntaxKind.ImportKeyword);
    ts.forEachChild(n, visit);
  }; visit(source); assert.deepEqual(imports, ['./xvi-canonical-sha256']);
});
