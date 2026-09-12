import { strict as assert } from 'node:assert';
import { generateKeyPairSync, sign } from 'node:crypto';
import { test } from 'node:test';
import { AgentPresenceCensus, agentPresenceSigningBytes, type AgentPresenceEnrollment, type AgentPresencePayload } from './agent-presence-census';
const keys = generateKeyPairSync('ed25519');
const other = generateKeyPairSync('ed25519');
const start = 1_800_000_000_000;
const config: AgentPresenceEnrollment = { agentId: 'agent.technology', instanceId: 'worker.1', definitionId: 'technology',
  providerId: 'ollama', modelId: 'qwen2.5-coder:7b', masterPlanSha256: 'a'.repeat(64), sourceCommit: 'b'.repeat(40),
  publicKeyPem: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString(), expiresAtMs: start + 600_000 };
function fixture(enrollments: AgentPresenceEnrollment[] = [config]) {
  let now = start;
  const c = new AgentPresenceCensus({ tenantId: 'tenant.1', definitionIds: ['technology', 'guardian'], enrollments, clock: () => now });
  const p: AgentPresencePayload = { schemaVersion: 1, collectorId: c.collectorId, tenantId: c.tenantId,
    agentId: config.agentId, instanceId: config.instanceId, definitionId: config.definitionId, providerId: config.providerId,
    modelId: config.modelId, masterPlanSha256: config.masterPlanSha256, sourceCommit: config.sourceCommit,
    sequence: 1, observedAtMs: now, expiresAtMs: now + 120_000, state: 'RUNNING' };
  return { c, p, tick: (v: number) => { now = v; } };
}
const envelope = (p: AgentPresencePayload, key = keys.privateKey) => JSON.stringify({ payload: p, signatureHex: sign(null, agentPresenceSigningBytes(p), key).toString('hex') });

test('definitions and enrollments alone never claim live agents', () => {
  const f = fixture(); const s = f.c.snapshot(); assert.equal(s.catalogDefinitionCount, 2); assert.equal(s.enrolledInstanceCount, 1);
  assert.equal(s.scopedRunningInstanceCount, null); assert.equal(s.totalLiveAgents, null); assert.equal(s.instances[0].state, 'UNOBSERVED');
  assert.equal(fixture([]).c.snapshot().telemetryCompleteForScope, false);
});
test('valid enrolled signature yields a scoped observation, not execution authority', () => {
  const f = fixture(); assert.equal(f.c.accept(envelope(f.p)), true); const s = f.c.snapshot();
  assert.equal(s.scopedRunningInstanceCount, 1); assert.equal(s.totalLiveAgents, null); assert.equal(s.productionAuthorityGranted, false);
  assert.equal(s.privateDataAuthorityGranted, false); assert.equal(s.learningPromoted, false);
});
test('one receipt cannot claim that all instances are running', () => {
  const f = fixture([config, { ...config, instanceId: 'worker.2' }]); assert.equal(f.c.accept(envelope(f.p)), true);
  assert.equal(f.c.snapshot().reportedRunningInstanceCount, 1); assert.equal(f.c.snapshot().scopedRunningInstanceCount, null);
});
test('replay and lower sequence are rejected without double-counting', () => {
  const f = fixture(); assert.equal(f.c.accept(envelope({ ...f.p, sequence: 2 })), true);
  assert.equal(f.c.accept(envelope({ ...f.p, sequence: 2 })), false); assert.equal(f.c.accept(envelope(f.p)), false);
  assert.equal(f.c.snapshot().reportedRunningInstanceCount, 1);
});
test('higher sequence can report IDLE and STOPPED accurately', () => {
  const f = fixture(); assert.equal(f.c.accept(envelope(f.p)), true);
  assert.equal(f.c.accept(envelope({ ...f.p, sequence: 2, state: 'IDLE' })), true);
  assert.equal(f.c.snapshot().scopedRunningInstanceCount, 0); assert.equal(f.c.snapshot().reportedIdleInstanceCount, 1);
  assert.equal(f.c.accept(envelope({ ...f.p, sequence: 3, state: 'STOPPED' })), true); assert.equal(f.c.snapshot().instances[0].state, 'STOPPED');
});
test('wrong key and unsigned payloads never verify', () => {
  const f = fixture(); assert.equal(f.c.accept(envelope(f.p, other.privateKey)), false); assert.equal(f.c.accept(JSON.stringify({ payload: f.p })), false);
});
test('altered signed payload is rejected', () => {
  const f = fixture(); const raw = JSON.parse(envelope(f.p)); raw.payload.state = 'IDLE'; assert.equal(f.c.accept(JSON.stringify(raw)), false);
});
test('tenant, instance, agent, provider, model, revision and definition are bound', () => {
  for (const patch of [{ tenantId: 'tenant.2' }, { instanceId: 'worker.2' }, { agentId: 'fake' }, { definitionId: 'guardian' },
    { providerId: 'xai' }, { modelId: 'different' }, { masterPlanSha256: 'c'.repeat(64) }, { sourceCommit: 'c'.repeat(40) }]) {
    const f = fixture(); assert.equal(f.c.accept(envelope({ ...f.p, ...patch })), false);
  }
});
test('collector restart invalidates old-run receipts', () => {
  const one = fixture(); const two = fixture(); assert.notEqual(one.c.collectorId, two.c.collectorId);
  assert.equal(two.c.accept(envelope(one.p)), false);
});
test('future, expired, overlong and enrollment-exceeding receipts fail', () => {
  for (const patch of [{ observedAtMs: start + 1 }, { expiresAtMs: start }, { expiresAtMs: start + 120_001 },
    { observedAtMs: start - 1, expiresAtMs: start - 1 }]) {
    const f = fixture(); assert.equal(f.c.accept(envelope({ ...f.p, ...patch })), false);
  }
  const f = fixture([{ ...config, expiresAtMs: start + 10 }]); assert.equal(f.c.accept(envelope(f.p)), false);
});
test('stale observations become unknown, never assumed stopped', () => {
  const f = fixture(); f.c.accept(envelope(f.p)); f.tick(start + 120_000);
  assert.equal(f.c.snapshot().instances[0].state, 'STALE'); assert.equal(f.c.snapshot().scopedRunningInstanceCount, null);
});
test('revoked and expired enrollments cannot report in', () => {
  const f = fixture(); f.c.accept(envelope(f.p)); f.c.revoke(config.instanceId);
  assert.equal(f.c.snapshot().instances[0].state, 'REVOKED'); assert.equal(f.c.accept(envelope({ ...f.p, sequence: 2 })), false);
  const g = fixture(); g.tick(start + 600_000); assert.equal(g.c.snapshot().instances[0].state, 'ENROLLMENT_EXPIRED');
  assert.equal(g.c.accept(envelope(g.p)), false);
});
test('malformed and oversized data fail without throwing or retaining raw data', () => {
  const f = fixture(); for (const raw of ['{', 'null', '[]', 'x'.repeat(8193), JSON.stringify({ payload: f.p, signatureHex: 'zz' })]) assert.equal(f.c.accept(raw), false);
});
test('unrecognized fields and status values cannot enter census', () => {
  const f = fixture(); const raw = JSON.parse(envelope(f.p)); raw.payload.extraSecret = 'DO_NOT_STORE'; assert.equal(f.c.accept(JSON.stringify(raw)), false);
  const raw2 = JSON.parse(envelope(f.p)); raw2.extra = true; assert.equal(f.c.accept(JSON.stringify(raw2)), false);
  assert.throws(() => agentPresenceSigningBytes({ ...f.p, state: 'AVAILABLE' as 'IDLE' }));
  assert.equal(JSON.stringify(f.c.snapshot()).includes('DO_NOT_STORE'), false);
});
test('unknown definitions and duplicate instances rejected at enrollment', () => {
  assert.throws(() => fixture([config, config])); assert.throws(() => fixture([{ ...config, definitionId: 'invented' }]));
});
test('private keys and non-Ed25519 keys are rejected', () => {
  assert.throws(() => fixture([{ ...config, publicKeyPem: keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() }]));
  const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  assert.throws(() => fixture([{ ...config, publicKeyPem: ec.publicKey.export({ type: 'spki', format: 'pem' }).toString() }]));
});
test('configuration and snapshots cannot be mutated to spoof new observations', () => {
  const c = { ...config }; const f = fixture([c]); c.providerId = 'xai'; assert.equal(f.c.accept(envelope(f.p)), true);
  assert.throws(() => { (f.c.snapshot().instances[0] as { state: string }).state = 'fake'; });
});
test('backward or non-finite clocks stop evaluation', () => {
  const f = fixture(); f.c.accept(envelope(f.p)); f.tick(start - 1); assert.throws(() => f.c.snapshot());
  const g = fixture(); g.tick(NaN); assert.throws(() => g.c.accept(envelope(g.p)));
});
test('finite capacity and sequence/schema checks are enforced', () => {
  assert.throws(() => fixture(Array.from({ length: 1025 }, (_, i) => ({ ...config, instanceId: 'w.' + i }))));
  const f = fixture(); for (const sequence of [0, NaN, Infinity, -1, 1.2]) assert.throws(() => agentPresenceSigningBytes({ ...f.p, sequence }));
});

test('signature success does not attest execution, model identity or host egress', () => {
  const f = fixture(); f.c.accept(envelope(f.p)); const r = f.c.snapshot();
  assert.equal(r.executionClaimsVerified, false); assert.equal(r.providerIdentityAttested, false); assert.equal(r.offlineExecutionAttested, false);
});
test('STOPPED is terminal for this collector enrollment', () => {
  const f = fixture(); assert.equal(f.c.accept(envelope({ ...f.p, state: 'STOPPED' })), true);
  assert.equal(f.c.accept(envelope({ ...f.p, sequence: 2, state: 'RUNNING' })), false);
  assert.equal(f.c.snapshot().instances[0].state, 'STOPPED');
});
test('signed observation timestamp cannot be edited to renew stale evidence', () => {
  const f = fixture(); const raw = JSON.parse(envelope(f.p));
  f.tick(start + 1000); raw.payload.observedAtMs += 1000; raw.payload.expiresAtMs += 1000;
  assert.equal(f.c.accept(JSON.stringify(raw)), false); assert.equal(f.c.snapshot().instances[0].state, 'UNOBSERVED');
});
test('invalid higher-sequence signature cannot poison the replay watermark', () => {
  const f = fixture(); assert.equal(f.c.accept(envelope({ ...f.p, sequence: 100 }, other.privateKey)), false);
  assert.equal(f.c.accept(envelope(f.p)), true); assert.equal(f.c.snapshot().instances[0].sequence, 1);
});
test('higher sequence with an older observation does not roll telemetry backwards', () => {
  const f = fixture(); assert.equal(f.c.accept(envelope(f.p)), true);
  assert.equal(f.c.accept(envelope({ ...f.p, sequence: 2, observedAtMs: start - 1, expiresAtMs: start + 119_999 })), false);
});
test('snapshot after a terminal report still becomes stale when its evidence expires', () => {
  const f = fixture(); f.c.accept(envelope({ ...f.p, state: 'STOPPED' }));
  assert.equal(f.c.snapshot().scopedRunningInstanceCount, 0); f.tick(start + 120_000);
  assert.equal(f.c.snapshot().scopedRunningInstanceCount, null); assert.equal(f.c.snapshot().instances[0].state, 'STALE');
});
test('wrong collector challenge cannot be substituted even with an enrolled signature', () => {
  const f = fixture(); assert.equal(f.c.accept(envelope({ ...f.p, collectorId: '0'.repeat(32) })), false);
  assert.equal(f.c.snapshot().scopedRunningInstanceCount, null);
});
