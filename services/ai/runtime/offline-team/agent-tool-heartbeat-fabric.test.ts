import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { buildCollaborationPlan, canPromoteReasoningPathway, isApprovedOllamaLoopback, type CollaboratorReceipt, type CollaborationTask } from './local-model-collaboration-bus';
import { evaluatePathwayCandidate, activatePathway, applyConfidenceDecay, rollbackPathway, selectPreferredPathway } from './neural-pathway-growth-engine';
import { probeOllamaHeartbeat, runHeartbeatMeeting, HEARTBEAT_FABRIC_POLICY as policy, type HeartbeatRequest } from './agent-tool-heartbeat-fabric';
const now = Date.parse('2026-09-11T23:00:00.000Z');
const task: CollaborationTask = { taskId: 'test-task', tenantId: 'tenant-1', objective: 'Synthetic test only', kind: 'REVIEW', securityClass: 'ORDINARY', evidenceRefs: ['test:evidence'], humanApprovalRequired: true, externalReviewApproved: true };
const receipt: CollaboratorReceipt = { collaboratorId: 'OLLAMA_LOCAL', tenantId: 'tenant-1', status: 'VERIFIED', receiptRef: 'test:receipt', endpoint: policy.endpoint, providerId: 'ollama', modelId: policy.model, verifiedAt: new Date(now).toISOString(), expiresAt: new Date(now + 120_000).toISOString(), deviceLocalCli: false, modelExecutionLocal: true, productionAuthority: false, rawPrivateDataAllowed: true };
const plan = (r: CollaboratorReceipt[] = [receipt], t = task, networkAvailable = true) => buildCollaborationPlan({ task: t, collaboratorReceipts: r, nowMs: now, networkAvailable });
const enabled = (r: CollaboratorReceipt) => plan([r]).collaboratorsAvailable;
const candidate = { pathwayId: 'path', tenantId: 'tenant-1', domain: 'CODE' as const, version: 1, confidence: .95, evaluationScore: .95, evidenceRefs: ['test:evidence'], reviewRefs: ['test:r1', 'test:r2'], humanApproved: true, rollbackRef: 'test:rollback', modelWeightMutation: false as const, productionMutation: false as const };
function json(value: unknown) { return new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } }); }
const tags = { models: [{ name: policy.model, digest: 'a'.repeat(64), details: { format: 'gguf' } }] };
const output = (text = 'XIV_OLLAMA_OK') => ({ model: policy.model, response: text, done: true, eval_count: 8 });
function mock(responses: Response[]) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const request: HeartbeatRequest = async (url, init) => { calls.push({ url, init }); const result = responses.shift(); if (!result) throw new Error('unexpected request'); return result; };
  return { calls, request };
}

test('loopback allowlist rejects hosts, alternate ports, credentials and URL tricks', () => {
  assert.equal(isApprovedOllamaLoopback(policy.endpoint), true);
  assert.equal(isApprovedOllamaLoopback('http://[::1]:11434/'), true);
  for (const endpoint of ['http://remote:11434', 'http://127.0.0.1:11435', 'http://127.0.0.1.evil:11434', 'http://x@127.0.0.1:11434', 'http://127.0.0.1:11434/?next=remote', 'http://localhost:11434', 'http://2130706433:11434', 'file:///tmp/model']) {
    assert.equal(isApprovedOllamaLoopback(endpoint), false); assert.equal(enabled({ ...receipt, endpoint }), false);
  }
});
test('cross-tenant and legacy unbound receipts cannot authorize a task', () => {
  assert.equal(enabled({ ...receipt, tenantId: 'tenant-2' }), false); assert.equal(enabled({ ...receipt, tenantId: undefined }), false);
});
test('expired, future, malformed and excessively long receipts fail closed', () => {
  for (const patch of [{ expiresAt: new Date(now).toISOString() }, { verifiedAt: new Date(now + 1).toISOString() }, { verifiedAt: 'bad' }, { expiresAt: undefined }, { expiresAt: new Date(now + 300_001).toISOString() }]) assert.equal(enabled({ ...receipt, ...patch }), false);
});
test('ambiguous duplicates and TARGET receipts are not verified', () => {
  assert.equal(plan([receipt, receipt]).collaboratorsAvailable, false); assert.equal(enabled({ ...receipt, status: 'TARGET' }), false);
});
test('provider and model identity must be recorded; cloud models cannot claim locality', () => {
  assert.equal(enabled({ ...receipt, modelId: undefined }), false); assert.equal(enabled({ ...receipt, providerId: '' }), false); assert.equal(enabled({ ...receipt, modelId: 'glm-5.3-flash:cloud' }), false);
});
test('confidential work requires private permission; no TOP_SECRET remote fallback', () => {
  assert.equal(plan([{ ...receipt, rawPrivateDataAllowed: false }], { ...task, securityClass: 'CONFIDENTIAL' }).collaboratorsAvailable, false);
  assert.throws(() => plan([], { ...task, securityClass: 'TOP_SECRET' }));
});
test('Claude Code and Grok need fresh identity, consent and network; remain ordinary-only', () => {
  const claude: CollaboratorReceipt = { ...receipt, collaboratorId: 'CLAUDE_CODE_LOCAL', providerId: 'fixture-glm-provider', modelId: 'glm-5.3-flash:cloud', deviceLocalCli: true, modelExecutionLocal: false, rawPrivateDataAllowed: false };
  const grok: CollaboratorReceipt = { ...claude, collaboratorId: 'GROK_XAI', endpoint: 'https://api.x.ai/v1', providerId: 'xai', modelId: 'fixture-grok-model' };
  assert.equal(plan([receipt, claude, grok]).assignments.filter(a => a.enabled).length, 3);
  for (const r of [claude, grok]) {
    assert.equal(plan([r], { ...task, externalReviewApproved: false }).collaboratorsAvailable, false);
    assert.equal(plan([r], task, false).collaboratorsAvailable, false);
    assert.equal(plan([r], { ...task, securityClass: 'CONFIDENTIAL' }).collaboratorsAvailable, false);
  }
});
test('no collaborators is visible and pathway proposal cannot drop human gate', () => {
  assert.equal(plan([]).collaboratorsAvailable, false); assert.throws(() => plan([receipt], { ...task, kind: 'PATHWAY_PROPOSAL', humanApprovalRequired: false }));
});
test('non-finite and out-of-range learning scores are rejected', () => {
  for (const value of [NaN, Infinity, -Infinity, -.01, 1.01]) for (const field of ['confidence', 'evaluationScore']) assert.equal(evaluatePathwayCandidate({ ...candidate, [field]: value }).eligible, false);
});
test('blank, duplicate and whitespace-duplicate reviews cannot satisfy review count', () => {
  for (const reviewRefs of [['', 'r2'], ['r1', 'r1'], ['r1', ' r1 ']]) assert.equal(evaluatePathwayCandidate({ ...candidate, reviewRefs }).eligible, false);
  assert.equal(canPromoteReasoningPathway({ pathwayId: 'p', tenantId: 't', evaluationScore: .95, evidenceRefs: ['e'], independentReviewRefs: ['r', 'r'], securityClass: 'ORDINARY', humanApproved: true }), false);
});
test('activation snapshots do not alias input arrays and timestamp must parse', () => {
  const input = { ...candidate, reviewRefs: ['a', 'b'] }; const active = activatePathway(input, new Date(now).toISOString()); input.reviewRefs.push('c'); assert.equal(active.reviewRefs.length, 2); assert.throws(() => activatePathway(candidate, 'invalid'));
});
test('rollback stays rolled back under decay and selection is tenant-scoped', () => {
  const active = activatePathway(candidate, new Date(now).toISOString()); const rolled = rollbackPathway(active, 'test:rb'); assert.equal(applyConfidenceDecay(rolled, 1).status, 'ROLLED_BACK');
  const other = { ...active, tenantId: 'tenant-2', evaluationScore: .99 }; assert.throws(() => selectPreferredPathway([active, other], 'CODE')); assert.equal(selectPreferredPathway([active, other], 'CODE', 'tenant-1')?.tenantId, 'tenant-1');
});
test('live-path mock checks tags then generation and issues scoped expiring evidence only', async () => {
  const m = mock([json(tags), json(output())]); const h = await probeOllamaHeartbeat({ tenantId: 'tenant-1', request: m.request, clock: () => now });
  assert.equal(h.status, 'VERIFIED'); assert.equal(h.receipt?.tenantId, 'tenant-1'); assert.equal(h.privateDataAuthorized, false); assert.equal(h.cloudDisabledVerified, false); assert.match(h.outputHash!, /^[a-f0-9]{64}$/); assert.equal(m.calls.length, 2);
  for (const call of m.calls) { assert.ok(call.url.startsWith(policy.endpoint + '/api/')); assert.equal(call.init.redirect, 'error'); }
});
test('absent or cloud model metadata never triggers inference', async () => {
  for (const data of [{ models: [] }, { models: [{ ...tags.models[0], remote_host: 'https://cloud.example' }] }, { models: [{ ...tags.models[0], details: {} }] }]) {
    const m = mock([json(data)]); assert.equal((await probeOllamaHeartbeat({ tenantId: 't', request: m.request })).status, 'DEGRADED'); assert.equal(m.calls.length, 1);
  }
});
test('model mismatch, incomplete inference and wrong marker cannot verify', async () => {
  for (const o of [{ ...output(), model: 'other' }, { ...output(), done: false }, { ...output(), eval_count: 0 }, output('not the marker')]) {
    const m = mock([json(tags), json(o)]); const h = await probeOllamaHeartbeat({ tenantId: 't', request: m.request }); assert.notEqual(h.status, 'VERIFIED'); assert.equal(h.receipt, undefined);
  }
});
test('redirects, malformed JSON, non-JSON and oversized responses are rejected', async () => {
  const cases = [new Response('', { status: 302, headers: { location: 'https://example.com' } }), new Response('{', { headers: { 'content-type': 'application/json' } }), new Response('{}'), json({ filler: 'x'.repeat(70_000) })];
  for (const response of cases) { const m = mock([response]); const h = await probeOllamaHeartbeat({ tenantId: 't', request: m.request }); assert.notEqual(h.status, 'VERIFIED'); }
});
test('deadline aborts without retries and output does not leak error text', async () => {
  let requests = 0; let signal: AbortSignal | undefined;
  const h = await probeOllamaHeartbeat({ tenantId: 't', timeoutMs: 10, request: async (_, init) => { requests++; signal = init.signal!; return await new Promise<Response>(() => {}); } });
  assert.equal(h.status, 'OFFLINE'); assert.equal(requests, 1); assert.equal(signal?.aborted, true);
  const failed = await probeOllamaHeartbeat({ tenantId: 't', request: async () => { throw new Error('SECRET_SENTINEL'); } }); assert.equal(JSON.stringify(failed).includes('SECRET_SENTINEL'), false);
});
test('one local meeting contribution leaves both external reviewers pending', async () => {
  const m = mock([json(tags), json(output()), json(output('Recommendation: fix tenant binding. Risk: stale evidence. Test: cross-tenant denial. Dissent: defer more features.'))]);
  const result = await runHeartbeatMeeting({ tenantId: 't', masterPlanSha256: 'b'.repeat(64), request: m.request, clock: () => now });
  assert.equal(result.status, 'AWAITING_REVIEW'); assert.equal(m.calls.length, 3); assert.equal(result.remoteCallsMade, 0); assert.equal(result.meetingComplete, false); assert.equal(result.learningPromoted, false); assert.equal(result.allAgentsAligned, false); assert.equal(result.reviewRequests.filter(r => r.status === 'PENDING').length, 2); assert.equal(result.localContribution?.trustedInstruction, false);
});
test('offline meetings block, failed contributions are not success, and no cloud fallback occurs', async () => {
  const options = { tenantId: 't', masterPlanSha256: 'a'.repeat(64), clock: () => now };
  const absent = await runHeartbeatMeeting({ ...options, request: async () => { throw new Error('offline'); } }); assert.equal(absent.status, 'BLOCKED');
  const m = mock([json(tags), json(output()), new Response('failure', { status: 500 })]); const failed = await runHeartbeatMeeting({ ...options, request: m.request }); assert.equal(failed.status, 'FAILED'); assert.equal(failed.localContribution, null);
});
test('invalid tenant, digest, clock and request limits fail before network access', async () => {
  const request: HeartbeatRequest = async () => { throw new Error('must not run'); };
  await assert.rejects(probeOllamaHeartbeat({ tenantId: '', request })); await assert.rejects(probeOllamaHeartbeat({ tenantId: 't', timeoutMs: Infinity, request }));
  await assert.rejects(probeOllamaHeartbeat({ tenantId: 't', clock: () => NaN, request })); await assert.rejects(runHeartbeatMeeting({ tenantId: 't', masterPlanSha256: 'not-a-hash', request }));
});
