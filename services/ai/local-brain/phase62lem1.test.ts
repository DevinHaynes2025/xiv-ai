/**
 * 62L-EM1 — Agent Home Base Contract acceptance + denial tests.
 *
 * These tests MUST execute. Do not mark PASS without running.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EM1_CORE_FLOW,
  EM1_HONESTY_BANNER,
  EM1_LOCKS,
  NEXT_PHASE_EM2,
  acceptNewWork,
  assertEm1LocksIntact,
  buildStructuredEvidence,
  checkpointWhenHomeBaseUnavailable,
  createChildBranch,
  createHomeBaseRoot,
  denyPermanentSelfAuthority,
  em1HonestySnapshot,
  em1SoftWireSnapshot,
  evaluateBranchAcceptance,
  gateHighConsequenceRecommendation,
  signReturnEnvelope,
  validateBranchAgainstParent,
  verifyReturnEnvelope,
  type HomeBaseAgentContract,
  type ReturnEnvelopePayload,
} from './agent-home-base-contract';

const SECRET = 'em1-test-secret-not-for-prod';

function signedEnvelopeFor(
  child: HomeBaseAgentContract,
  overrides: Partial<ReturnEnvelopePayload> = {},
) {
  const evidence = buildStructuredEvidence({
    summary: 'Bounded branch completed with measured facts.',
    facts: { latencyMs: 12, toolCalls: 2 },
    artifacts: ['result.json'],
  });
  assert.equal(evidence.ok, true);
  if (!evidence.ok) throw new Error(evidence.reason);
  const payload: ReturnEnvelopePayload = {
    agentId: child.agentId,
    homeBaseId: child.homeBaseId,
    parentAgentId: child.parentAgentId,
    returnPath: child.returnPath,
    mission: child.mission,
    evidence: evidence.evidence,
    completedAt: new Date().toISOString(),
    branchId: `branch-${child.agentId}`,
    highConsequence: false,
    humanAuthorizationRequired: false,
    humanAuthorized: false,
    ...overrides,
  };
  return signReturnEnvelope(payload, SECRET);
}

test('EM1 honesty banner, core flow, L4 off, next EM2 recorded', () => {
  assert.match(EM1_HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(assertEm1LocksIntact(), true);
  assert.equal(EM1_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EM1_LOCKS.TIP_LAND, false);
  assert.equal(EM1_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.deepEqual(
    [...EM1_CORE_FLOW],
    [
      'XIV_HOME_BASE',
      'AGENT_MISSION',
      'BOUNDED_BRANCH_TASK',
      'CPU_GPU_NPU_MODEL_TOOL',
      'EVIDENCE_RESULT',
      'RETURN_RECEIPT',
      'HOME_BASE',
    ],
  );
  assert.match(NEXT_PHASE_EM2, /EM2/);
  const snap = em1HonestySnapshot();
  assert.equal(snap.l4AutonomyEnabled, false);
});

test('soft-wire local-runtime heartbeat + EL9 governor present; #157 optional', () => {
  const wire = em1SoftWireSnapshot();
  assert.equal(wire.localRuntimeHeartbeatApiPresent, true);
  assert.equal(wire.localRuntimeResourceGovernorPresent, true);
  assert.match(wire.note, /Presence soft-wire/);
  // #157 may or may not be landed — presence is informational only.
  assert.equal(typeof wire.em157HomeBasePresent, 'boolean');
});

test('happy path: valid child branch + signed return envelope accepted', () => {
  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent);
  const envelope = signedEnvelopeFor(child);
  const result = evaluateBranchAcceptance({ parent, child, envelope, secret: SECRET });
  assert.equal(result.accepted, true);
  assert.equal(result.envelopeOk, true);
  assert.equal(result.validation.valid, true);
});

test('DENY: child cannot inherit broader tools than parent', () => {
  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent, {
    allowedTools: [...parent.allowedTools, 'root_shell_bypass'],
  });
  const v = validateBranchAgainstParent(parent, child);
  assert.equal(v.valid, false);
  if (!v.valid) {
    assert.equal(v.denialCode, 'BROADER_THAN_PARENT');
    assert.ok(v.reasons.some((r) => /root_shell_bypass/.test(r)));
  }
});

test('DENY: child cannot inherit broader data classes than parent', () => {
  const parent = createHomeBaseRoot({
    allowedDataClasses: ['public', 'internal'],
  });
  const child = createChildBranch(parent, {
    allowedDataClasses: ['public', 'internal', 'sovereign'],
  });
  const v = validateBranchAgainstParent(parent, child);
  assert.equal(v.valid, false);
  if (!v.valid) {
    assert.equal(v.denialCode, 'BROADER_THAN_PARENT');
    assert.ok(v.reasons.some((r) => /sovereign/.test(r)));
  }
});

test('DENY: child compute budget cannot exceed parent', () => {
  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent, {
    computeBudget: {
      ...parent.computeBudget,
      maxRamBytes: parent.computeBudget.maxRamBytes + 1,
    },
  });
  const v = validateBranchAgainstParent(parent, child);
  assert.equal(v.valid, false);
  if (!v.valid) assert.equal(v.denialCode, 'BROADER_THAN_PARENT');
});

test('DENY: branch missing max runtime / task scope / stop condition', () => {
  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent, {
    branchBounds: {
      maxRuntimeMs: 0,
      resourceBudget: parent.computeBudget,
      taskScope: '',
      stopCondition: '',
    },
  });
  const v = validateBranchAgainstParent(parent, child);
  assert.equal(v.valid, false);
  if (!v.valid) assert.equal(v.denialCode, 'MISSING_REQUIRED_FIELDS');
});

test('DENY: every agent must know returnPath', () => {
  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent, { returnPath: '   ' });
  const v = validateBranchAgainstParent(parent, child);
  assert.equal(v.valid, false);
  if (!v.valid) {
    assert.ok(v.reasons.some((r) => /returnPath/.test(r)));
  }
});

test('DENY: results as hidden chain-of-thought rejected', () => {
  const built = buildStructuredEvidence({
    summary: 'looks fine',
    hiddenChainOfThought: 'secret reasoning dump',
  });
  assert.equal(built.ok, false);
  if (!built.ok) assert.match(built.reason, /structured evidence/);
});

test('DENY: Home Base unavailable → checkpoint → WAITING_NODE', () => {
  const agent = createHomeBaseRoot();
  const ckpt = checkpointWhenHomeBaseUnavailable(agent, false, 'Home Base unreachable');
  assert.equal(ckpt.runtimeState, 'WAITING_NODE');
  assert.equal(ckpt.evidencePreserved, true);
  assert.match(ckpt.reason, /WAITING_NODE/);
});

test('DENY: heartbeat WAITING_NODE rejects branch work', () => {
  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent, {
    heartbeat: { state: 'WAITING_NODE', observedAt: null, nodeId: 'node-home' },
  });
  const v = validateBranchAgainstParent(parent, child);
  assert.equal(v.valid, false);
  if (!v.valid) {
    assert.equal(v.denialCode, 'HOME_BASE_UNAVAILABLE');
    assert.equal(v.runtimeState, 'WAITING_NODE');
  }
});

test('DENY: revoked agents stop accepting new work', () => {
  const agent = createHomeBaseRoot({ revocationState: 'REVOKED' });
  const decision = acceptNewWork(agent);
  assert.equal(decision.accepted, false);
  assert.equal(decision.runtimeState, 'REVOKED');

  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent, { revocationState: 'REVOKED' });
  const v = validateBranchAgainstParent(parent, child);
  assert.equal(v.valid, false);
  if (!v.valid) assert.equal(v.denialCode, 'REVOKED');
});

test('DENY: expired branch cannot silently continue', () => {
  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent, {
    expiry: new Date(Date.now() - 60_000).toISOString(),
  });
  const v = validateBranchAgainstParent(parent, child);
  assert.equal(v.valid, false);
  if (!v.valid) {
    assert.equal(v.denialCode, 'EXPIRED');
    assert.equal(v.runtimeState, 'EXPIRED');
  }
  const decision = acceptNewWork(child);
  assert.equal(decision.accepted, false);
  assert.equal(decision.runtimeState, 'EXPIRED');
});

test('DENY: no agent can create itself permanent authority', () => {
  const denied = denyPermanentSelfAuthority({
    agentId: 'rogue',
    claimPermanentAuthority: true,
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.permanentAuthority, false);

  const parent = createHomeBaseRoot();
  // Factory forces permanentAuthority=false; assert lock + denial helper.
  const child = createChildBranch(parent);
  assert.equal(child.permanentAuthority, false);
  assert.equal(EM1_LOCKS.SILENT_PERMANENT_AUTHORITY, false);
});

test('DENY: cross-organization movement by default', () => {
  const parent = createHomeBaseRoot({ organizationId: 'org-a' });
  const child = createChildBranch(parent, { organizationId: 'org-b' });
  const v = validateBranchAgainstParent(parent, child);
  assert.equal(v.valid, false);
  if (!v.valid) {
    assert.equal(v.denialCode, 'CROSS_SCOPE_DENIED');
    assert.ok(v.reasons.some((r) => /Cross-organization/.test(r)));
  }
});

test('DENY: cross-Universe movement by default', () => {
  const parent = createHomeBaseRoot({ homeUniverseId: 'universe-a' });
  const child = createChildBranch(parent, { homeUniverseId: 'universe-b' });
  const v = validateBranchAgainstParent(parent, child);
  assert.equal(v.valid, false);
  if (!v.valid) {
    assert.equal(v.denialCode, 'CROSS_SCOPE_DENIED');
    assert.ok(v.reasons.some((r) => /Cross-Universe/.test(r)));
  }
});

test('DENY: high-consequence recommendation without human auth', () => {
  const agent = createHomeBaseRoot();
  const gate = gateHighConsequenceRecommendation({
    agent,
    recommendation: 'reallocate production budget 40%',
    humanAuthorized: false,
  });
  assert.equal(gate.allowed, false);
  assert.equal(gate.requiresHumanAuth, true);
  assert.equal(gate.returnedToHomeBase, true);
  assert.match(gate.reason, /human authorization/i);
});

test('ALLOW: high-consequence with human auth at Home Base', () => {
  const agent = createHomeBaseRoot();
  const gate = gateHighConsequenceRecommendation({
    agent,
    recommendation: 'reallocate production budget 40%',
    humanAuthorized: true,
  });
  assert.equal(gate.allowed, true);
});

test('DENY: unsigned / missing return envelope fails acceptance', () => {
  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent);
  const result = evaluateBranchAcceptance({
    parent,
    child,
    envelope: null,
    secret: SECRET,
  });
  assert.equal(result.accepted, false);
  assert.equal(result.envelopeOk, false);
  assert.ok(result.reasons.some((r) => /Signed return envelope/.test(r)));
});

test('DENY: tampered return envelope signature', () => {
  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent);
  const envelope = signedEnvelopeFor(child);
  envelope.signature = '00'.repeat(32);
  const verified = verifyReturnEnvelope(envelope, SECRET);
  assert.equal(verified.ok, false);
  assert.ok(verified.reasons.some((r) => /signature/.test(r)));
});

test('DENY: high-consequence envelope without humanAuthorized', () => {
  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent);
  const envelope = signedEnvelopeFor(child, {
    highConsequence: true,
    humanAuthorizationRequired: true,
    humanAuthorized: false,
  });
  const verified = verifyReturnEnvelope(envelope, SECRET);
  assert.equal(verified.ok, false);
  assert.ok(verified.reasons.some((r) => /humanAuthorization/.test(r)));
});

test('DENY: unknown parent / Home Base', () => {
  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent, { parentAgentId: 'not-the-parent' });
  const v = validateBranchAgainstParent(parent, child);
  assert.equal(v.valid, false);
  if (!v.valid) assert.equal(v.denialCode, 'UNKNOWN_PARENT');
});

test('acceptance criteria: known parent, bounds, limits, heartbeat, signed envelope', () => {
  const parent = createHomeBaseRoot();
  const child = createChildBranch(parent);
  assert.ok(child.parentAgentId);
  assert.ok(child.homeBaseId);
  assert.ok(child.branchBounds.maxRuntimeMs > 0);
  assert.ok(child.branchBounds.taskScope);
  assert.ok(child.branchBounds.stopCondition);
  assert.ok(child.computeBudget.maxRamBytes > 0);
  assert.ok(child.allowedDataClasses.length > 0);
  assert.ok(child.heartbeat.state);
  const envelope = signedEnvelopeFor(child);
  const result = evaluateBranchAcceptance({ parent, child, envelope, secret: SECRET });
  assert.equal(result.accepted, true);
});
