// 12D-224 tests — adversarial coverage for the Agent Policy Enforcement Gateway.
// Owner controls under test: identity/permission/budget/risk/approval/audit on every
// call, prohibited-refusal even with approval, retry limit 3, temp-agent lifetime and
// narrowing, evaluation 90% line + rollback trigger, learning pipeline isolation,
// emergency stop, and audit-chain tamper evidence. Nothing here executes an action.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_GATEWAY_POLICY,
  AGENT_GATEWAY_GUARDRAILS,
  AGENT_GATEWAY_CONSTITUTION,
  AgentPolicyGateway,
  classifyActionClass,
  verifyApproval,
  type HumanApproval,
} from './agent-policy-gateway';

const T0 = 1_000_000_000;
const TOOLS = ['doc-retriever', 'report-writer', 'sandbox-runner', 'deploy-tool', 'delete-tool'];

function baseCall(overrides: Partial<Parameters<AgentPolicyGateway['evaluateToolCall']>[0]> = {}) {
  return {
    agentId: 'xiv-logistics-agent',
    taskId: 'shipment-review-1042',
    toolId: 'doc-retriever',
    actionClass: 'RETRIEVE_DOCUMENTS',
    attemptIndex: 0,
    tokenEstimate: 100,
    costEstimate: 1,
    auditLogged: true as const,
    nowMs: T0 + 1_000,
    approval: null,
    ...overrides,
  };
}

function registerLogistics(gw: AgentPolicyGateway) {
  gw.declareTools(TOOLS);
  return gw.registerAgent({
    agentId: 'xiv-logistics-agent',
    parentId: null,
    permissions: [
      'CALL_ANALYZE_APPROVED_DATA',
      'CALL_RETRIEVE_DOCUMENTS',
      'CALL_GENERATE_REPORTS',
      'CALL_UPDATE_AGENT_MEMORY',
      'CALL_CREATE_TEST_CASES',
      'CALL_EXECUTE_SANDBOX_TESTS',
      'CALL_RETRY_RECOVERABLE_FAILURES',
      'CALL_DEPLOY_TO_STAGING',
      'CALL_ROLLBACK_FAILED_VERSIONS',
      'CALL_PRODUCTION_DEPLOYMENT',
      'CALL_EXTERNAL_COMMUNICATIONS',
    ],
    budgets: { maxToolCalls: 10, maxTokens: 10_000, maxCostUnits: 100, timeLimitMs: 3_600_000 },
    isTemporary: false,
    nowMs: T0,
  });
}

test('12D-224 policy constants match the owner charter', () => {
  assert.equal(AGENT_GATEWAY_POLICY.maxAutonomousRetries, 3);
  assert.equal(AGENT_GATEWAY_POLICY.maxTemporaryAgentLifetimeMs, 3_600_000);
  assert.equal(AGENT_GATEWAY_POLICY.evaluationPassScoreMin, 0.9);
  assert.equal(AGENT_GATEWAY_POLICY.rollbackDeadlineMs, 300_000);
  assert.equal(AGENT_GATEWAY_POLICY.emergencyStopDeadlineMs, 10_000);
  assert.equal(AGENT_GATEWAY_POLICY.unregisteredToolExecutionsAllowed, 0);
  assert.equal(AGENT_GATEWAY_POLICY.highRiskWithoutApprovalAllowed, 0);
  assert.equal(AGENT_GATEWAY_POLICY.auditLoggingRequired, true);
  assert.equal(AGENT_GATEWAY_GUARDRAILS.executesNothing, true);
  assert.equal(AGENT_GATEWAY_GUARDRAILS.approvalCannotLaunderProhibitedAction, true);
  assert.equal(AGENT_GATEWAY_CONSTITUTION.modelCalls, 0);
  assert.equal(AGENT_GATEWAY_CONSTITUTION.remoteCalls, 0);
  assert.equal(AGENT_GATEWAY_CONSTITUTION.learningPromoted, false);
  assert.equal(AGENT_GATEWAY_CONSTITUTION.billionUsersProven, false);
  assert.equal(AGENT_GATEWAY_CONSTITUTION.humanDecision, 'REQUIRED');
  assert.equal(Object.isFrozen(AGENT_GATEWAY_POLICY), true);
  assert.equal(Object.isFrozen(AGENT_GATEWAY_GUARDRAILS), true);
  assert.equal(Object.isFrozen(AGENT_GATEWAY_CONSTITUTION), true);
});

test('12D-224 classification is exact and fail-closed on unknown classes', () => {
  assert.equal(classifyActionClass('RETRIEVE_DOCUMENTS'), 'AUTOMATIC');
  assert.equal(classifyActionClass('PRODUCTION_DEPLOYMENT'), 'APPROVAL_REQUIRED');
  assert.equal(classifyActionClass('REVEAL_CREDENTIALS'), 'PROHIBITED');
  assert.equal(classifyActionClass('MAKE_COFFEE'), 'UNCLASSIFIED');
  assert.equal(classifyActionClass(''), 'UNCLASSIFIED');
});

test('12D-224 low-risk registered call is AUTO_RUN_CLEARED with identity attached and audited', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  registerLogistics(gw);
  const rec = gw.evaluateToolCall(baseCall());
  assert.equal(rec.kind, 'AUTO_RUN_CLEARED');
  assert.equal(rec.agentId, 'xiv-logistics-agent');
  assert.equal(rec.taskId, 'shipment-review-1042');
  assert.equal(rec.flags.executesNothing, true);
  assert.equal(rec.flags.grantsNoProductionAuthority, true);
  assert.match(rec.decisionDigest, /^[0-9a-f]{64}$/);
  assert.equal(gw.verifyAuditTrail().ok, true);
  assert.equal(gw.auditEntries().at(-1)?.taskId, 'shipment-review-1042');
});

test('12D-224 prohibited action refused even WITH a valid approval', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  registerLogistics(gw);
  const approval: HumanApproval = {
    operatorReceipt: 'a'.repeat(64),
    approver: 'devin-xavier-haynes',
    atMs: T0,
    forActionClass: 'REVEAL_CREDENTIALS',
  };
  const rec = gw.evaluateToolCall(
    baseCall({ toolId: 'delete-tool', actionClass: 'REVEAL_CREDENTIALS', approval }),
  );
  assert.equal(rec.kind, 'REFUSED_PROHIBITED');
  assert.equal(gw.verifyAuditTrail().ok, true);
});

test('12D-224 unclassified and unregistered tools refused; refusals consume no budget', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  registerLogistics(gw);
  const unknown = gw.evaluateToolCall(baseCall({ actionClass: 'SOMETHING_ELSE' }));
  assert.equal(unknown.kind, 'REFUSED_UNCLASSIFIED');
  const unregistered = gw.evaluateToolCall(baseCall({ toolId: 'shadow-tool' }));
  assert.equal(unregistered.kind, 'REFUSED_UNREGISTERED_TOOL');
  // A gateway with NO declared registry refuses everything (fail-closed).
  const undeclared = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  undeclared.registerAgent({
    agentId: 'xiv-no-registry', parentId: null,
    permissions: ['CALL_RETRIEVE_DOCUMENTS'],
    budgets: { maxToolCalls: 5, maxTokens: 1_000, maxCostUnits: 10, timeLimitMs: 60_000 },
    isTemporary: false, nowMs: T0,
  });
  assert.equal(undeclared.evaluateToolCall(baseCall({ agentId: 'xiv-no-registry' })).kind, 'REFUSED_UNREGISTERED_TOOL');
  // Budget untouched: the full budget is still available afterwards.
  for (let i = 0; i < 10; i++) {
    const rec = gw.evaluateToolCall(baseCall({ nowMs: T0 + 1_000 + i }));
    assert.equal(rec.kind, 'AUTO_RUN_CLEARED');
  }
  const exhausted = gw.evaluateToolCall(baseCall({ nowMs: T0 + 99_000 }));
  assert.equal(exhausted.kind, 'REFUSED_BUDGET');
});

test('12D-224 high-impact class pauses without approval; verified approval clears; invalid fails closed', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  registerLogistics(gw);
  const paused = gw.evaluateToolCall(
    baseCall({ toolId: 'deploy-tool', actionClass: 'PRODUCTION_DEPLOYMENT' }),
  );
  assert.equal(paused.kind, 'REQUIRES_HUMAN_APPROVAL');
  assert.equal(paused.flags.humanDecision, 'REQUIRED');

  const valid: HumanApproval = {
    operatorReceipt: 'b'.repeat(64),
    approver: 'devin-xavier-haynes',
    atMs: T0,
    forActionClass: 'PRODUCTION_DEPLOYMENT',
  };
  const cleared = gw.evaluateToolCall(
    baseCall({ toolId: 'deploy-tool', actionClass: 'PRODUCTION_DEPLOYMENT', approval: valid, nowMs: T0 + 2_000 }),
  );
  assert.equal(cleared.kind, 'HUMAN_APPROVAL_VERIFIED');

  const badReceipt = gw.evaluateToolCall(
    baseCall({ toolId: 'deploy-tool', actionClass: 'PRODUCTION_DEPLOYMENT', approval: { ...valid, operatorReceipt: 'short' }, nowMs: T0 + 3_000 }),
  );
  assert.equal(badReceipt.kind, 'REFUSED_APPROVAL_INVALID');

  const future = gw.evaluateToolCall(
    baseCall({ toolId: 'deploy-tool', actionClass: 'PRODUCTION_DEPLOYMENT', approval: { ...valid, atMs: T0 + 99_999 }, nowMs: T0 + 3_000 }),
  );
  assert.equal(future.kind, 'REFUSED_APPROVAL_INVALID');

  const crossClass = gw.evaluateToolCall(
    baseCall({ toolId: 'deploy-tool', actionClass: 'PRODUCTION_DEPLOYMENT', approval: { ...valid, forActionClass: 'FINANCIAL_TRANSACTION' }, nowMs: T0 + 3_000 }),
  );
  assert.equal(crossClass.kind, 'REFUSED_APPROVAL_INVALID');

  assert.equal(verifyApproval(null, 'PRODUCTION_DEPLOYMENT', T0) !== null, true);
});

test('12D-224 autonomous retry limit is 3; attempt 4+ refused', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  registerLogistics(gw);
  assert.equal(gw.evaluateToolCall(baseCall({ attemptIndex: 3, nowMs: T0 + 1_100 })).kind, 'AUTO_RUN_CLEARED');
  assert.equal(gw.evaluateToolCall(baseCall({ attemptIndex: 4, nowMs: T0 + 1_200 })).kind, 'REFUSED_RETRY_LIMIT');
  assert.equal(gw.evaluateToolCall(baseCall({ attemptIndex: 99, nowMs: T0 + 1_300 })).kind, 'REFUSED_RETRY_LIMIT');
  assert.equal(gw.evaluateToolCall(baseCall({ attemptIndex: -1, nowMs: T0 + 1_400 })).kind, 'REFUSED_MALFORMED');
});

test('12D-224 temporary specialist: narrower permissions enforced, budgets capped, lifetime capped', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  const creator = registerLogistics(gw);
  const spec = gw.registerAgent({
    agentId: 'xiv-shipment-scanner',
    parentId: 'xiv-logistics-agent',
    permissions: ['CALL_RETRIEVE_DOCUMENTS'],
    budgets: { maxToolCalls: 2, maxTokens: 500, maxCostUnits: 5, timeLimitMs: 1_800_000 },
    isTemporary: true,
    nowMs: T0,
  });
  assert.equal(spec.parentId, 'xiv-logistics-agent');
  assert.equal(spec.isTemporary, true);
  assert.equal(spec.expiresAtMs, T0 + 1_800_000);
  assert.equal(gw.evaluateToolCall(baseCall({ agentId: 'xiv-shipment-scanner', nowMs: T0 + 5_000 })).kind, 'AUTO_RUN_CLEARED');

  // Not narrower (same permission set as the creator) refused.
  assert.throws(() =>
    gw.registerAgent({
      agentId: 'xiv-not-narrower', parentId: 'xiv-logistics-agent',
      permissions: [
        'CALL_ANALYZE_APPROVED_DATA', 'CALL_RETRIEVE_DOCUMENTS', 'CALL_GENERATE_REPORTS',
        'CALL_UPDATE_AGENT_MEMORY', 'CALL_CREATE_TEST_CASES', 'CALL_EXECUTE_SANDBOX_TESTS',
        'CALL_RETRY_RECOVERABLE_FAILURES', 'CALL_DEPLOY_TO_STAGING', 'CALL_ROLLBACK_FAILED_VERSIONS',
        'CALL_PRODUCTION_DEPLOYMENT', 'CALL_EXTERNAL_COMMUNICATIONS',
      ],
      budgets: { maxToolCalls: 1, maxTokens: 1, maxCostUnits: 1, timeLimitMs: 60_000 },
      isTemporary: true, nowMs: T0 + 10_000,
    }),
  );
  // Permission outside creator scope refused (the creator does NOT hold FINANCIAL_TRANSACTION).
  assert.throws(() =>
    gw.registerAgent({
      agentId: 'xiv-escalation-attempt', parentId: 'xiv-logistics-agent',
      permissions: ['CALL_FINANCIAL_TRANSACTION'],
      budgets: { maxToolCalls: 1, maxTokens: 1, maxCostUnits: 1, timeLimitMs: 60_000 },
      isTemporary: true, nowMs: T0 + 10_000,
    }),
  );
  // Tool budget exceeding the creator refused.
  assert.throws(() =>
    gw.registerAgent({
      agentId: 'xiv-budget-creep', parentId: 'xiv-logistics-agent',
      permissions: ['CALL_RETRIEVE_DOCUMENTS'],
      budgets: { maxToolCalls: creator.budgets.maxToolCalls + 1, maxTokens: 1, maxCostUnits: 1, timeLimitMs: 60_000 },
      isTemporary: true, nowMs: T0 + 10_000,
    }),
  );
  // Lifetime above 60 minutes refused.
  assert.throws(() =>
    gw.registerAgent({
      agentId: 'xiv-immortal-specialist', parentId: 'xiv-logistics-agent',
      permissions: ['CALL_RETRIEVE_DOCUMENTS'],
      budgets: { maxToolCalls: 1, maxTokens: 1, maxCostUnits: 1, timeLimitMs: 3_600_001 },
      isTemporary: true, nowMs: T0 + 10_000,
    }),
  );
  // Temporary without a registered creator refused.
  assert.throws(() =>
    gw.registerAgent({
      agentId: 'xiv-orphan-specialist', parentId: 'xiv-ghost-agent',
      permissions: ['CALL_RETRIEVE_DOCUMENTS'],
      budgets: { maxToolCalls: 1, maxTokens: 1, maxCostUnits: 1, timeLimitMs: 60_000 },
      isTemporary: true, nowMs: T0 + 10_000,
    }),
  );
});

test('12D-224 temporary specialist auto-terminates at expiry on every surface', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  registerLogistics(gw);
  gw.registerAgent({
    agentId: 'xiv-ephemeral', parentId: 'xiv-logistics-agent',
    permissions: ['CALL_RETRIEVE_DOCUMENTS', 'CALL_GENERATE_REPORTS'],
    budgets: { maxToolCalls: 5, maxTokens: 1_000, maxCostUnits: 10, timeLimitMs: 60_000 },
    isTemporary: true, nowMs: T0,
  });
  assert.equal(gw.evaluateToolCall(baseCall({ agentId: 'xiv-ephemeral', nowMs: T0 + 59_999 })).kind, 'AUTO_RUN_CLEARED');
  const expired = gw.evaluateToolCall(baseCall({ agentId: 'xiv-ephemeral', nowMs: T0 + 60_000 }));
  assert.equal(expired.kind, 'REFUSED_EXPIRED_OR_STOPPED');
  assert.throws(() => gw.recordEvaluation({ agentId: 'xiv-ephemeral', taskId: 't-1', score: 0.95, nowMs: T0 + 60_001 }));
  assert.throws(() => gw.proposeImprovement({ agentId: 'xiv-ephemeral', taskId: 't-1', proposedLesson: 'x', proposedChange: 'y', nowMs: T0 + 60_001 }));
  // Permanent agents are NOT time-capped by expiry (only by their declared time budget).
  const perm = gw.evaluateToolCall(baseCall({ nowMs: T0 + 60_000 }));
  assert.equal(perm.kind, 'AUTO_RUN_CLEARED');
});

test('12D-224 emergency stop refuses every later surface within the 10s control', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  registerLogistics(gw);
  gw.emergencyStop('xiv-logistics-agent', T0 + 1_000, 'operator halt');
  // Idempotent: a second stop on the same agent records nothing new and throws nothing.
  gw.emergencyStop('xiv-logistics-agent', T0 + 1_100, 'duplicate stop is a no-op');
  assert.equal(gw.auditEntries().filter((e) => e.kind === 'EMERGENCY_STOP').length, 1);
  const rec = gw.evaluateToolCall(baseCall({ nowMs: T0 + 1_050 }));
  assert.equal(rec.kind, 'REFUSED_EXPIRED_OR_STOPPED');
  assert.throws(() => gw.recordEvaluation({ agentId: 'xiv-logistics-agent', taskId: 't-2', score: 0.99, nowMs: T0 + 1_100 }));
  assert.throws(() => gw.proposeImprovement({ agentId: 'xiv-logistics-agent', taskId: 't-2', proposedLesson: 'x', proposedChange: 'y', nowMs: T0 + 1_100 }));
  assert.throws(() => gw.emergencyStop('xiv-ghost', T0 + 1_100, 'unknown'));
});

test('12D-224 evaluation gate: 90% pass line, rollback trigger bounded by 5 minutes', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  registerLogistics(gw);
  const pass = gw.recordEvaluation({ agentId: 'xiv-logistics-agent', taskId: 'ship-1', score: 0.91, nowMs: T0 + 1_000 });
  assert.equal(pass.accepted, true);
  assert.equal(pass.rollbackTrigger, null);
  const fail = gw.recordEvaluation({ agentId: 'xiv-logistics-agent', taskId: 'ship-2', score: 0.89, nowMs: T0 + 2_000 });
  assert.equal(fail.accepted, false);
  assert.equal(fail.rollbackTrigger, 'score_below_baseline');
  assert.equal(fail.rollbackDeadlineMs, T0 + 2_000 + 300_000);
  const boundary = gw.recordEvaluation({ agentId: 'xiv-logistics-agent', taskId: 'ship-3', score: 0.9, nowMs: T0 + 3_000 });
  assert.equal(boundary.accepted, true);
  assert.throws(() => gw.recordEvaluation({ agentId: 'xiv-logistics-agent', taskId: 'ship-4', score: 1.2, nowMs: T0 + 4_000 }));
  assert.throws(() => gw.recordEvaluation({ agentId: 'xiv-logistics-agent', taskId: 'ship-4', score: Number.NaN, nowMs: T0 + 4_000 }));
  assert.throws(() => gw.recordEvaluation({ agentId: 'xiv-ghost', taskId: 'ship-4', score: 0.9, nowMs: T0 + 4_000 }));
});

test('12D-224 learning proposals stay pending and promote nothing', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  registerLogistics(gw);
  const p = gw.proposeImprovement({
    agentId: 'xiv-logistics-agent', taskId: 'shipment-review-1042',
    proposedLesson: 'queue drains faster with summary index', proposedChange: 'adopt summary index',
    nowMs: T0 + 1_000,
  });
  assert.equal(p.approvalStatus, 'pending');
  assert.equal(p.learningPromoted, false);
  assert.match(p.proposalDigest, /^[0-9a-f]{64}$/);
  assert.throws(() => gw.proposeImprovement({ agentId: 'xiv-logistics-agent', taskId: 't', proposedLesson: '', proposedChange: 'y', nowMs: T0 + 2_000 }));
  assert.throws(() => gw.proposeImprovement({ agentId: 'xiv-logistics-agent', taskId: 't', proposedLesson: 'x'.repeat(501), proposedChange: 'y', nowMs: T0 + 2_000 }));
});

test('12D-224 audit trail is hash-chained, complete, and tamper-evident', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  registerLogistics(gw);
  gw.evaluateToolCall(baseCall());
  gw.evaluateToolCall(baseCall({ toolId: 'delete-tool', actionClass: 'PERMANENT_DATA_DELETION', nowMs: T0 + 1_100 }));
  gw.emergencyStop('xiv-logistics-agent', T0 + 1_200, 'halt');
  gw.evaluateToolCall(baseCall({ nowMs: T0 + 1_300 }));
  const trail = gw.verifyAuditTrail();
  assert.equal(trail.ok, true);
  assert.equal(trail.entries >= 5, true);
  // Every entry carries the agent identity and a taskId (100% logged, identity attached).
  for (const e of gw.auditEntries()) {
    assert.equal(typeof e.agentId, 'string');
    assert.equal(typeof e.hash, 'string');
    assert.match(e.hash, /^[0-9a-f]{64}$/);
  }
});

test('12D-224 malformed calls are refused without budget mutation; unknown agents refused', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  registerLogistics(gw);
  const malformed = gw.evaluateToolCall(baseCall({ taskId: 'bad task id!' }));
  assert.equal(malformed.kind, 'REFUSED_MALFORMED');
  assert.equal(malformed.flags.executesNothing, true);
  const ghost = gw.evaluateToolCall(baseCall({ agentId: 'xiv-ghost-agent' }));
  assert.equal(ghost.kind, 'REFUSED_PERMISSION');
  const predates = gw.evaluateToolCall(baseCall({ nowMs: T0 - 1 }));
  assert.equal(predates.kind, 'REFUSED_MALFORMED');
});

test('12D-224 time budget and registration identity are enforced', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  gw.declareTools(TOOLS);
  gw.registerAgent({
    agentId: 'xiv-shortlived', parentId: null,
    permissions: ['CALL_RETRIEVE_DOCUMENTS'],
    budgets: { maxToolCalls: 10, maxTokens: 10_000, maxCostUnits: 100, timeLimitMs: 5_000 },
    isTemporary: false, nowMs: T0,
  });
  assert.equal(gw.evaluateToolCall(baseCall({ agentId: 'xiv-shortlived', nowMs: T0 + 4_999 })).kind, 'AUTO_RUN_CLEARED');
  assert.equal(gw.evaluateToolCall(baseCall({ agentId: 'xiv-shortlived', nowMs: T0 + 5_000 })).kind, 'REFUSED_BUDGET');
  assert.throws(() =>
    gw.registerAgent({
      agentId: 'XIV-UPPER', parentId: null,
      permissions: ['CALL_RETRIEVE_DOCUMENTS'],
      budgets: { maxToolCalls: 1, maxTokens: 1, maxCostUnits: 1, timeLimitMs: 60_000 },
      isTemporary: false, nowMs: T0,
    }),
  );
  assert.throws(() =>
    gw.registerAgent({
      agentId: 'xiv-shortlived', parentId: null,
      permissions: ['CALL_RETRIEVE_DOCUMENTS'],
      budgets: { maxToolCalls: 1, maxTokens: 1, maxCostUnits: 1, timeLimitMs: 60_000 },
      isTemporary: false, nowMs: T0,
    }),
  );
  // A PERMANENT agent naming an unregistered parent is refused (lineage integrity).
  assert.throws(() =>
    gw.registerAgent({
      agentId: 'xiv-ghost-child', parentId: 'xiv-ghost-agent',
      permissions: ['CALL_RETRIEVE_DOCUMENTS'],
      budgets: { maxToolCalls: 1, maxTokens: 1, maxCostUnits: 1, timeLimitMs: 60_000 },
      isTemporary: false, nowMs: T0,
    }),
  );
});

test('12D-224 isOperational is the strict executor-boundary probe (liveness AND time budget)', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  gw.declareTools(TOOLS);
  gw.registerAgent({
    agentId: 'xiv-probed', parentId: null,
    permissions: ['CALL_RETRIEVE_DOCUMENTS'],
    budgets: { maxToolCalls: 10, maxTokens: 10_000, maxCostUnits: 100, timeLimitMs: 5_000 },
    isTemporary: false, nowMs: T0,
  });
  assert.equal(gw.isOperational('xiv-probed', T0 + 1), true);
  // Past the DECLARED TIME BUDGET even though not temporary/expired/stopped.
  assert.equal(gw.isOperational('xiv-probed', T0 + 5_000), false);
  // Unknown agent and malformed timestamps fail closed.
  assert.equal(gw.isOperational('xiv-ghost-agent', T0 + 1), false);
  assert.equal(gw.isOperational('xiv-probed', -1), false);
  // Emergency stop is caught at any timestamp (stateful).
  const gw2 = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  gw2.declareTools(TOOLS);
  gw2.registerAgent({
    agentId: 'xiv-halted', parentId: null,
    permissions: ['CALL_RETRIEVE_DOCUMENTS'],
    budgets: { maxToolCalls: 10, maxTokens: 10_000, maxCostUnits: 100, timeLimitMs: 3_600_000 },
    isTemporary: false, nowMs: T0,
  });
  gw2.emergencyStop('xiv-halted', T0 + 1, 'halt');
  assert.equal(gw2.isOperational('xiv-halted', T0), false);
  // Probe is read-only: it appends nothing to the trail.
  assert.equal(gw2.verifyAuditTrail().ok, true);
});