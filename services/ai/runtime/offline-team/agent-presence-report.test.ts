import { strict as assert } from 'node:assert';
import { generateKeyPairSync, sign } from 'node:crypto';
import { test } from 'node:test';
import { AuthenticatedAgentReport } from './agent-presence-report';
import { agentPresenceSigningBytes, type AgentPresenceEnrollment, type AgentPresencePayload } from './agent-presence-census';
const now = 1_800_000_000_000;
const keys = generateKeyPairSync('ed25519');
const definitions = [{ id: 'technology', name: 'Technology', status: 'registered' },
  { id: 'guardian', name: 'Guardian', status: 'prototype' }];
const seats = [{ id: 'OLLAMA_BUILDER', enabled: true, requiresOllama: true }];
const enrollment: AgentPresenceEnrollment = { agentId: 'agent.technology', instanceId: 'worker.1', definitionId: 'technology',
  providerId: 'ollama', modelId: 'qwen2.5-coder:7b', masterPlanSha256: 'a'.repeat(64), sourceCommit: 'b'.repeat(40),
  publicKeyPem: keys.publicKey.export({ type: 'spki', format: 'pem' }).toString(), expiresAtMs: now + 600_000 };
function fixture(enrollments: AgentPresenceEnrollment[] = [enrollment]) {
  let time = now;
  const monitor = new AuthenticatedAgentReport({ tenantId: 'xiv-dev-pilot', definitions, seats, enrollments, clock: () => time });
  const p: AgentPresencePayload = { schemaVersion: 1, collectorId: monitor.collectorId, tenantId: monitor.tenantId,
    agentId: enrollment.agentId, instanceId: enrollment.instanceId, definitionId: enrollment.definitionId,
    providerId: enrollment.providerId, modelId: enrollment.modelId, masterPlanSha256: enrollment.masterPlanSha256,
    sourceCommit: enrollment.sourceCommit, sequence: 1, observedAtMs: now, expiresAtMs: now + 120_000, state: 'RUNNING' };
  const envelope = (payload = p) => JSON.stringify({ payload, signatureHex: sign(null, agentPresenceSigningBytes(payload), keys.privateKey).toString('hex') });
  return { monitor, p, envelope, tick: (v: number) => { time = v; } };
}
test('source inventory remains separate from enrolled and reporting instances', () => {
  const f = fixture(); const before = f.monitor.snapshot();
  assert.equal(before.sourceInventory.coreDefinitionCount, 2); assert.equal(before.sourceInventory.configuredOfflineSeatCount, 1);
  assert.equal(before.instancePresence.enrolledInstanceCount, 1); assert.equal(before.instancePresence.scopedRunningInstanceCount, null);
  assert.equal(f.monitor.acceptSignedReport(f.envelope()), true);
  const after = f.monitor.snapshot(); assert.equal(after.instancePresence.scopedRunningInstanceCount, 1);
  assert.equal(after.sourceInventory.liveAgentCount, null); assert.equal(after.globalLiveAgentCount, null);
  assert.equal(after.allAgentsAligned, null); assert.equal(after.executionClaimsVerified, false);
});
test('empty enrollment is inspectable and unknown, not zero observed agents', () => {
  const r = fixture([]).monitor.snapshot(); assert.equal(r.instancePresence.enrolledInstanceCount, 0);
  assert.equal(r.instancePresence.scopedRunningInstanceCount, null); assert.equal(r.instancePresence.telemetryCompleteForScope, false);
});
test('one enrolled reporter cannot fill another seat or authorize operations', () => {
  const f = fixture([enrollment, { ...enrollment, instanceId: 'worker.2' }]); f.monitor.acceptSignedReport(f.envelope());
  const r = f.monitor.snapshot(); assert.equal(r.instancePresence.reportedRunningInstanceCount, 1);
  assert.equal(r.instancePresence.scopedRunningInstanceCount, null); assert.equal(r.operationalAuthorizationGranted, false);
  assert.equal(r.deploymentReadinessInferred, false);
});
test('replay, plain liveness booleans and cross-tenant reports cannot update the adapter', () => {
  const f = fixture(); assert.equal(f.monitor.acceptSignedReport(f.envelope()), true);
  assert.equal(f.monitor.acceptSignedReport(f.envelope()), false);
  assert.equal(f.monitor.acceptSignedReport(JSON.stringify({ liveAgentCount: 21, signatureValid: true })), false);
  assert.equal(f.monitor.acceptSignedReport(f.envelope({ ...f.p, tenantId: 'another-tenant', sequence: 2 })), false);
});
test('stale and revoked reports are reflected without relabeling them as confirmed stopped', () => {
  const f = fixture(); f.monitor.acceptSignedReport(f.envelope()); f.tick(now + 120_000);
  assert.equal(f.monitor.snapshot().instancePresence.instances[0].state, 'STALE');
  f.monitor.revoke('worker.1'); assert.equal(f.monitor.snapshot().instancePresence.instances[0].state, 'REVOKED');
  assert.equal(f.monitor.snapshot().instancePresence.scopedRunningInstanceCount, null);
});
test('snapshot does not export key material and is immutable', () => {
  const f = fixture(); const r = f.monitor.snapshot(); const text = JSON.stringify(r);
  assert.equal(text.includes('PUBLIC KEY'), false); assert.equal(text.includes('PRIVATE KEY'), false);
  assert.ok(Object.isFrozen(r)); assert.ok(Object.isFrozen(r.instancePresence));
  assert.throws(() => { (r.sourceInventory.coreDefinitions[0] as { name: string }).name = 'changed'; });
});
test('unknown definitions cannot be enrolled through the adapter', () => {
  assert.throws(() => fixture([{ ...enrollment, definitionId: 'invented' }]));
});
test('unbounded source inventories fail before construction', () => {
  assert.throws(() => new AuthenticatedAgentReport({ tenantId: 't', definitions: Array(10_001).fill(definitions[0]), seats, enrollments: [] }));
  assert.throws(() => new AuthenticatedAgentReport({ tenantId: 't', definitions, seats: Array(1025).fill(seats[0]), enrollments: [] }));
});
