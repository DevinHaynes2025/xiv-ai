import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { APPROVED_MASTER_PLAN_SHA256, runApprovedMasterPlanMeeting } from './approved-master-plan-meeting';
import { HEARTBEAT_FABRIC_POLICY as policy, type HeartbeatRequest } from './agent-tool-heartbeat-fabric';

function fixture() {
  let calls = 0;
  const request: HeartbeatRequest = async () => {
    calls++;
    const body = calls === 1
      ? { models: [{ name: policy.model, digest: 'a'.repeat(64), details: { format: 'gguf' } }] }
      : { model: policy.model, response: calls === 2 ? 'XIV_OLLAMA_OK' : 'Synthetic review: preserve tenant isolation and request independent review.', done: true, eval_count: 8 };
    return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
  };
  return { request, calls: () => calls };
}

test('well-formed but unapproved master-plan hash makes zero requests', async () => {
  const f = fixture();
  await assert.rejects(runApprovedMasterPlanMeeting({ tenantId: 'test-tenant', masterPlanSha256: 'b'.repeat(64), request: f.request }), /not approved/);
  assert.equal(f.calls(), 0);
});
test('blank, malformed and nonstring master-plan hashes make zero requests', async () => {
  for (const value of ['', 'bad', null, undefined, 42]) {
    const f = fixture();
    await assert.rejects(runApprovedMasterPlanMeeting({ tenantId: 'test-tenant', masterPlanSha256: value as string, request: f.request }), /not approved/);
    assert.equal(f.calls(), 0);
  }
});
test('approved revision permits bounded synthetic meeting without external or learning claims', async () => {
  const f = fixture();
  const packet = await runApprovedMasterPlanMeeting({ tenantId: 'test-tenant', masterPlanSha256: APPROVED_MASTER_PLAN_SHA256, request: f.request });
  assert.equal(f.calls(), 3); assert.equal(packet.status, 'AWAITING_REVIEW');
  assert.equal(packet.masterPlanRevisionVerified, true); assert.equal(packet.approvalScope, 'DOCUMENT_REVISION_ONLY');
  assert.equal(packet.allAgentsAligned, false); assert.equal(packet.meetingComplete, false);
  assert.equal(packet.learningPromoted, false); assert.equal(packet.remoteCallsMade, 0);
  assert.equal(packet.reviewRequests.every(r => r.status === 'PENDING'), true);
});
test('uppercase form is normalized to the approved revision', async () => {
  const f = fixture();
  const packet = await runApprovedMasterPlanMeeting({ tenantId: 'test-tenant', masterPlanSha256: APPROVED_MASTER_PLAN_SHA256.toUpperCase(), request: f.request });
  assert.equal(packet.masterPlanSha256, APPROVED_MASTER_PLAN_SHA256);
});
test('approved document does not turn an unavailable model into a healthy connection', async () => {
  let calls = 0;
  const request: HeartbeatRequest = async () => { calls++; throw new Error('unavailable'); };
  const packet = await runApprovedMasterPlanMeeting({ tenantId: 'test-tenant', masterPlanSha256: APPROVED_MASTER_PLAN_SHA256, request });
  assert.equal(calls, 1); assert.equal(packet.status, 'BLOCKED'); assert.equal(packet.heartbeat.status, 'OFFLINE');
});
