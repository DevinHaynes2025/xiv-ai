// 12D-225 tests — adversarial coverage for the Gateway Executor.
// Under test: re-decide-never-trust re-verification, one-shot digest consumption,
// replay refusal, liveness re-check at execution time, forgery and cross-gateway
// refusal, registry drift, trail tamper-evidence, one-executor-per-gateway.
// Nothing here executes an action — the executor emits instructions only.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_GATEWAY_POLICY,
  AgentPolicyGateway,
  type AgentToolCallRequest,
  type GatewayDecisionRecord,
  type HumanApproval,
} from './agent-policy-gateway';
import {
  GATEWAY_EXECUTOR_POLICY,
  GATEWAY_EXECUTOR_GUARDRAILS,
  GATEWAY_EXECUTOR_CONSTITUTION,
  GatewayExecutor,
} from './gateway-executor';

const T0 = 1_000_000_000;
const TOOLS = ['doc-retriever', 'report-writer', 'sandbox-runner', 'deploy-tool', 'delete-tool'];

function baseCall(overrides: Partial<AgentToolCallRequest> = {}): AgentToolCallRequest {
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

function freshExecutor(): { gw: AgentPolicyGateway; exec: GatewayExecutor } {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  registerLogistics(gw);
  return { gw, exec: new GatewayExecutor(gw, T0 + 5_000, 'executor-seed-1234567890') };
}

test('12D-225 executor policy constants match the owner charter', () => {
  assert.equal(GATEWAY_EXECUTOR_POLICY.reVerifiesEveryRecord, true);
  assert.equal(GATEWAY_EXECUTOR_POLICY.oneInstructionPerDecisionDigest, true);
  assert.equal(GATEWAY_EXECUTOR_POLICY.oneExecutorPerGateway, true);
  assert.deepEqual([...GATEWAY_EXECUTOR_POLICY.executableDecisionKinds], ['AUTO_RUN_CLEARED', 'HUMAN_APPROVAL_VERIFIED']);
  assert.equal(GATEWAY_EXECUTOR_GUARDRAILS.executesNothing, true);
  assert.equal(GATEWAY_EXECUTOR_GUARDRAILS.materializesNothing, true);
  assert.equal(GATEWAY_EXECUTOR_GUARDRAILS.reChecksLivenessAtExecutionTime, true);
  assert.equal(GATEWAY_EXECUTOR_GUARDRAILS.approvalCannotLaunderProhibitedAction, true);
  assert.equal(GATEWAY_EXECUTOR_CONSTITUTION.modelCalls, 0);
  assert.equal(GATEWAY_EXECUTOR_CONSTITUTION.remoteCalls, 0);
  assert.equal(GATEWAY_EXECUTOR_CONSTITUTION.realActionsExecuted, 0);
  assert.equal(GATEWAY_EXECUTOR_CONSTITUTION.learningPromoted, false);
  assert.equal(GATEWAY_EXECUTOR_CONSTITUTION.billionUsersProven, false);
  assert.equal(Object.isFrozen(GATEWAY_EXECUTOR_POLICY), true);
  assert.equal(Object.isFrozen(GATEWAY_EXECUTOR_GUARDRAILS), true);
  assert.equal(Object.isFrozen(GATEWAY_EXECUTOR_CONSTITUTION), true);
});

test('12D-225 auto-run clearance re-verifies and issues ONE instruction; replay refused', () => {
  const { gw, exec } = freshExecutor();
  const rec = gw.evaluateToolCall(baseCall());
  assert.equal(rec.kind, 'AUTO_RUN_CLEARED');
  const out = exec.executeClearedCall({ request: baseCall(), decision: rec, executedAtMs: T0 + 6_000 });
  assert.equal(out.kind, 'EXECUTION_INSTRUCTION_ISSUED');
  assert.equal(out.decisionDigest, rec.decisionDigest);
  assert.match(out.instructionDigest!, /^[0-9a-f]{64}$/);
  assert.equal(out.flags.humanDecision, 'NOT_REQUIRED');
  assert.equal(out.flags.requiresDecisionSafetyWorkflowBeforeAnyAction, false);
  assert.equal(out.flags.executesNothing, true);
  assert.equal(out.flags.materializesNothing, true);
  // One-shot consumption: the same decision digest can never execute again.
  const replay = exec.executeClearedCall({ request: baseCall(), decision: rec, executedAtMs: T0 + 7_000 });
  assert.equal(replay.kind, 'REFUSED_REPLAY');
  assert.equal(exec.executorAuditEntries().filter((e) => e.kind === 'EXECUTION_INSTRUCTION_ISSUED').length, 1);
  assert.equal(exec.verifyExecutorTrail().ok, true);
  assert.equal(AGENT_GATEWAY_POLICY.unregisteredToolExecutionsAllowed, 0);
});

test('12D-225 approval-verified instruction requires the 12D-121 decision-safety workflow', () => {
  const { gw, exec } = freshExecutor();
  const approval: HumanApproval = {
    operatorReceipt: 'b'.repeat(64),
    approver: 'devin-xavier-haynes',
    atMs: T0,
    forActionClass: 'PRODUCTION_DEPLOYMENT',
  };
  const req = baseCall({ toolId: 'deploy-tool', actionClass: 'PRODUCTION_DEPLOYMENT', approval, nowMs: T0 + 2_000 });
  const rec = gw.evaluateToolCall(req);
  assert.equal(rec.kind, 'HUMAN_APPROVAL_VERIFIED');
  const out = exec.executeClearedCall({ request: req, decision: rec, executedAtMs: T0 + 6_000 });
  assert.equal(out.kind, 'EXECUTION_INSTRUCTION_ISSUED');
  assert.equal(out.flags.humanDecision, 'REQUIRED');
  assert.equal(out.flags.requiresDecisionSafetyWorkflowBeforeAnyAction, true);
  assert.equal(out.flags.grantsNoProductionAuthority, true);
});

test('12D-225 refusal-kind records are never executable', () => {
  const { gw, exec } = freshExecutor();
  const paused = gw.evaluateToolCall(
    baseCall({ toolId: 'deploy-tool', actionClass: 'PRODUCTION_DEPLOYMENT' }),
  );
  assert.equal(paused.kind, 'REQUIRES_HUMAN_APPROVAL');
  const out1 = exec.executeClearedCall({ request: baseCall({ toolId: 'deploy-tool', actionClass: 'PRODUCTION_DEPLOYMENT' }), decision: paused, executedAtMs: T0 + 6_000 });
  assert.equal(out1.kind, 'REFUSED_KIND_NOT_EXECUTABLE');

  const prohibited = gw.evaluateToolCall(baseCall({ toolId: 'delete-tool', actionClass: 'REVEAL_CREDENTIALS' }));
  assert.equal(prohibited.kind, 'REFUSED_PROHIBITED');
  const out2 = exec.executeClearedCall({ request: baseCall({ toolId: 'delete-tool', actionClass: 'REVEAL_CREDENTIALS' }), decision: prohibited, executedAtMs: T0 + 6_000 });
  assert.equal(out2.kind, 'REFUSED_KIND_NOT_EXECUTABLE');
});

test('12D-225 forged digest refused; the genuine record survives a failed forgery attempt', () => {
  const { gw, exec } = freshExecutor();
  const rec = gw.evaluateToolCall(baseCall());
  const forged = { ...rec, decisionDigest: 'f'.repeat(64) } as GatewayDecisionRecord;
  const bad = exec.executeClearedCall({ request: baseCall(), decision: forged, executedAtMs: T0 + 6_000 });
  assert.equal(bad.kind, 'REFUSED_DIGEST_MISMATCH');
  // The failed forgery did NOT consume anything: the genuine record still executes.
  const good = exec.executeClearedCall({ request: baseCall(), decision: rec, executedAtMs: T0 + 6_100 });
  assert.equal(good.kind, 'EXECUTION_INSTRUCTION_ISSUED');
});

test('12D-225 cross-gateway record refused (fresh digest differs under a different genesis)', () => {
  const { exec } = freshExecutor();
  const otherGw = new AgentPolicyGateway(T0, 'a-different-seed-123456');
  registerLogistics(otherGw);
  const foreign = otherGw.evaluateToolCall(baseCall());
  assert.equal(foreign.kind, 'AUTO_RUN_CLEARED');
  const out = exec.executeClearedCall({ request: baseCall(), decision: foreign, executedAtMs: T0 + 6_000 });
  assert.equal(out.kind, 'REFUSED_DIGEST_MISMATCH');
});

test('12D-225 emergency stop after the decision fails re-verification (fresh divergence)', () => {
  const { gw, exec } = freshExecutor();
  const rec = gw.evaluateToolCall(baseCall());
  gw.emergencyStop('xiv-logistics-agent', T0 + 1_500, 'operator halt between decision and execution');
  const out = exec.executeClearedCall({ request: baseCall(), decision: rec, executedAtMs: T0 + 6_000 });
  assert.equal(out.kind, 'REFUSED_STALE');
  assert.match(out.reason!, /diverged: fresh decision is REFUSED_EXPIRED_OR_STOPPED/);
});

test('12D-225 temporary expiry after the decision is caught by the execution-time probe', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  gw.declareTools(TOOLS);
  const creator = gw.registerAgent({
    agentId: 'xiv-logistics-agent', parentId: null,
    permissions: ['CALL_RETRIEVE_DOCUMENTS', 'CALL_GENERATE_REPORTS'],
    budgets: { maxToolCalls: 10, maxTokens: 10_000, maxCostUnits: 100, timeLimitMs: 3_600_000 },
    isTemporary: false, nowMs: T0,
  });
  void creator;
  gw.registerAgent({
    agentId: 'xiv-ephemeral', parentId: 'xiv-logistics-agent',
    permissions: ['CALL_RETRIEVE_DOCUMENTS'],
    budgets: { maxToolCalls: 5, maxTokens: 1_000, maxCostUnits: 10, timeLimitMs: 60_000 },
    isTemporary: true, nowMs: T0,
  });
  const exec = new GatewayExecutor(gw, T0 + 5_000, 'executor-seed-1234567890');
  const req = baseCall({ agentId: 'xiv-ephemeral', nowMs: T0 + 1_000 });
  const rec = gw.evaluateToolCall(req);
  assert.equal(rec.kind, 'AUTO_RUN_CLEARED');
  // Executed AFTER expiry: the re-run at the ORIGINAL timestamp still clears
  // (expiry is timestamp-based), so only the execution-time probe catches it.
  const out = exec.executeClearedCall({ request: req, decision: rec, executedAtMs: T0 + 60_000 });
  assert.equal(out.kind, 'REFUSED_STALE');
  assert.match(out.reason!, /not operational at the execution timestamp/);
});

test('12D-225 registry drift fails re-verification; same tools redeclared in any order still execute', () => {
  const { gw, exec } = freshExecutor();
  const rec = gw.evaluateToolCall(baseCall());
  // Drift: the tool is removed from the declared registry.
  gw.declareTools(['report-writer', 'sandbox-runner', 'deploy-tool', 'delete-tool']);
  const drift = exec.executeClearedCall({ request: baseCall(), decision: rec, executedAtMs: T0 + 6_000 });
  assert.equal(drift.kind, 'REFUSED_STALE');
  assert.match(drift.reason!, /REFUSED_UNREGISTERED_TOOL/);
  // Restore the SAME registry in a different order: the digest is order-insensitive.
  gw.declareTools(['delete-tool', 'doc-retriever', 'report-writer', 'sandbox-runner', 'deploy-tool']);
  const rec2 = gw.evaluateToolCall(baseCall({ nowMs: T0 + 2_000 }));
  const out = exec.executeClearedCall({ request: baseCall({ nowMs: T0 + 2_000 }), decision: rec2, executedAtMs: T0 + 6_000 });
  assert.equal(out.kind, 'EXECUTION_INSTRUCTION_ISSUED');
});

test('12D-225 budget exhaustion between decision and execution fails closed', () => {
  const gw = new AgentPolicyGateway(T0, 'genesis-seed-1234567890');
  gw.declareTools(TOOLS);
  gw.registerAgent({
    agentId: 'xiv-tight', parentId: null,
    permissions: ['CALL_RETRIEVE_DOCUMENTS'],
    budgets: { maxToolCalls: 1, maxTokens: 10_000, maxCostUnits: 100, timeLimitMs: 3_600_000 },
    isTemporary: false, nowMs: T0,
  });
  const exec = new GatewayExecutor(gw, T0 + 5_000, 'executor-seed-1234567890');
  const req = baseCall({ agentId: 'xiv-tight' });
  const rec = gw.evaluateToolCall(req);
  assert.equal(rec.kind, 'AUTO_RUN_CLEARED');
  // The clearance itself charged the only tool-call unit; the re-verification
  // (the authoritative charge) now fails on budget. Disclosed behavior.
  const out = exec.executeClearedCall({ request: req, decision: rec, executedAtMs: T0 + 6_000 });
  assert.equal(out.kind, 'REFUSED_STALE');
  assert.match(out.reason!, /REFUSED_BUDGET/);
});

test('12D-225 malformed presentations refused without consuming anything', () => {
  const { gw, exec } = freshExecutor();
  const rec = gw.evaluateToolCall(baseCall());
  // Record/request field mismatch.
  const m1 = exec.executeClearedCall({ request: baseCall({ toolId: 'report-writer' }), decision: rec, executedAtMs: T0 + 6_000 });
  assert.equal(m1.kind, 'REFUSED_MALFORMED');
  // Time travel: executedAtMs before the decision timestamp.
  const m2 = exec.executeClearedCall({ request: baseCall(), decision: rec, executedAtMs: T0 + 500 });
  assert.equal(m2.kind, 'REFUSED_MALFORMED');
  // Digest not 64-hex.
  const m3 = exec.executeClearedCall({ request: baseCall(), decision: { ...rec, decisionDigest: 'short' } as unknown as GatewayDecisionRecord, executedAtMs: T0 + 6_000 });
  assert.equal(m3.kind, 'REFUSED_MALFORMED');
  // Nothing consumed: the genuine record still executes afterwards.
  const good = exec.executeClearedCall({ request: baseCall(), decision: rec, executedAtMs: T0 + 6_000 });
  assert.equal(good.kind, 'EXECUTION_INSTRUCTION_ISSUED');
  // Refusal records never execute: flags must not claim authority.
  for (const r of [m1, m2, m3]) {
    assert.equal(r.flags.executesNothing, true);
    assert.equal(r.flags.grantsNoProductionAuthority, true);
  }
});

test('12D-225 one executor per gateway (second binding refused)', () => {
  const { gw, exec } = freshExecutor();
  void exec;
  assert.throws(() => new GatewayExecutor(gw, T0 + 5_000, 'executor-seed-1234567890'));
  // A different gateway binds fine.
  const gw2 = new AgentPolicyGateway(T0, 'another-genesis-seed-123');
  registerLogistics(gw2);
  assert.doesNotThrow(() => new GatewayExecutor(gw2, T0 + 5_000, 'executor-seed-1234567890'));
});

test('12D-225 tampered gateway trail refused at the executor boundary and at construction', () => {
  const { gw, exec } = freshExecutor();
  const rec = gw.evaluateToolCall(baseCall());
  // Simulate tampering: a bogus entry injected into the live trail.
  (gw.auditEntries() as unknown as { push: (e: unknown) => void }).push({
    seq: 9999, atMs: T0, agentId: 'xiv-forge', taskId: 't', kind: 'AUTO_RUN_CLEARED', detail: 'forged', hash: 'f'.repeat(64),
  });
  const out = exec.executeClearedCall({ request: baseCall(), decision: rec, executedAtMs: T0 + 6_000 });
  assert.equal(out.kind, 'REFUSED_TRAIL_TAMPERED');
  // A NEW executor refuses to bind to a tampered gateway at all.
  assert.throws(() => new GatewayExecutor(gw, T0 + 6_000, 'executor-seed-1234567890'));
});

test('12D-225 executor trail is hash-chained, complete, and identity-attached', () => {
  const { gw, exec } = freshExecutor();
  const rec = gw.evaluateToolCall(baseCall());
  exec.executeClearedCall({ request: baseCall(), decision: rec, executedAtMs: T0 + 6_000 });
  exec.executeClearedCall({ request: baseCall(), decision: rec, executedAtMs: T0 + 6_100 }); // replay refusal
  const trail = exec.verifyExecutorTrail();
  assert.equal(trail.ok, true);
  assert.equal(trail.entries >= 2, true);
  for (const e of exec.executorAuditEntries()) {
    assert.equal(typeof e.agentId, 'string');
    assert.equal(typeof e.taskId, 'string');
    assert.match(e.hash, /^[0-9a-f]{64}$/);
  }
  assert.equal(exec.executorAuditEntries().at(-2)?.kind, 'EXECUTION_INSTRUCTION_ISSUED');
  assert.equal(exec.executorAuditEntries().at(-1)?.kind, 'REFUSED_REPLAY');
});