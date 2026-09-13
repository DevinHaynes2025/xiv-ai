import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  DECISION_SAFETY_POLICY, DECISION_SAFETY_GUARDRAILS, DECISION_SAFETY_CONSTITUTION,
  openDecisionWorkflow, proposeGovernedAction, authorizeMinimumAction,
  recordMeasuredOutcome, recordAuditAndMonitor, auditTrail, verifyAuditChain,
  type DecisionSafetyWorkflow, type AgentIdentity, type ActionProposal,
} from './agent-decision-safety-workflow';

const identity: AgentIdentity = {
  identityId: 'agent-procurement-01',
  approvedTools: ['catalog-lookup', 'purchase-request-draft'],
  dataBoundaries: ['catalog', 'supplier-quotes'],
  actionPolicy: 'ADVISE_ONLY',
};
const identityBounded: AgentIdentity = { ...identity, actionPolicy: 'BOUNDED_AUTOMATION' };

const T0 = 1_700_000_000_000;

const open = (now = T0, id = identity) => openDecisionWorkflow({
  identity: id, purpose: 'draft a purchase request for supplier X', nowMs: now, timeLimitMs: 3_600_000,
});

const propose = (wf: Readonly<DecisionSafetyWorkflow>, tool = 'purchase-request-draft', riskClass = 'MATERIAL_FINANCIAL', at = T0 + 1) =>
  proposeGovernedAction(wf, {
    actionId: 'action-001', description: 'create purchase request PR-7 for the approved alternate supplier',
    toolId: tool, riskClass, proposedAtMs: at,
  });

test('policy, guardrails and constitution are frozen and honest', () => {
  assert.equal(Object.isFrozen(DECISION_SAFETY_POLICY), true);
  assert.equal(Object.isFrozen(DECISION_SAFETY_GUARDRAILS), true);
  assert.equal(Object.isFrozen(DECISION_SAFETY_CONSTITUTION), true);
  assert.equal(DECISION_SAFETY_GUARDRAILS.executesNothing, true);
  assert.equal(DECISION_SAFETY_GUARDRAILS.separatesRecommendationAuthorizationExecution, true);
  assert.equal(DECISION_SAFETY_GUARDRAILS.automaticRecovery, false);
  assert.equal(DECISION_SAFETY_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.deepEqual(
    [...DECISION_SAFETY_POLICY.humanApprovalRequiredClasses].sort(),
    ['DELETION', 'EMPLOYEE_ACTION', 'MATERIAL_FINANCIAL', 'PAYMENT', 'PRIVILEGED_ACCESS',
      'PRODUCTION_CONFIGURATION', 'SENSITIVE_EXTERNAL_COMMUNICATION'],
  );
  assert.equal(DECISION_SAFETY_POLICY.humanApprovalRequiredClasses.length, 7, 'the seven high-impact classes of the master plan');
  assert.deepEqual([...DECISION_SAFETY_POLICY.knownOutcomes].sort(),
    ['DECLINED_BY_HUMAN', 'EXECUTED_BY_OPERATOR', 'EXPIRED', 'FAILED', 'OBSERVED_ONLY']);
});

test('opening a workflow enforces the IDENTITY_AND_POLICY gate (least privilege)', () => {
  const wf = open();
  assert.equal(wf.kind, 'DECISION_SAFETY_WORKFLOW');
  assert.equal(wf.stage, 'IDENTITY_AND_POLICY');
  assert.equal(wf.humanDecision, 'REQUIRED');
  assert.equal(wf.learningPromoted, false);
  assert.equal(wf.modelCalls, 0);
  assert.equal(wf.remoteCalls, 0);
  assert.equal(wf.realActionsExecuted, 0);
  assert.equal(wf.automaticRecovery, false);
  assert.equal(wf.expiresAtMs, T0 + 3_600_000);
  assert.doesNotThrow(() => verifyAuditChain(wf));
  // Fail closed: no tools, duplicated tools, unknown action policy, bad time limits.
  assert.throws(() => openDecisionWorkflow({ identity: { ...identity, approvedTools: [] }, purpose: 'p', nowMs: T0, timeLimitMs: 3_600_000 }), /approved tools/);
  assert.throws(() => openDecisionWorkflow({ identity: { ...identity, approvedTools: ['a', 'a'] }, purpose: 'p', nowMs: T0, timeLimitMs: 3_600_000 }), /distinct/);
  assert.throws(() => openDecisionWorkflow({ identity: { ...identity, actionPolicy: 'AUTONOMOUS' as never }, purpose: 'p', nowMs: T0, timeLimitMs: 3_600_000 }), /action policy unknown/);
  for (const bad of [0, 999, DECISION_SAFETY_POLICY.maxTimeLimitMs + 1])
    assert.throws(() => openDecisionWorkflow({ identity, purpose: 'p', nowMs: T0, timeLimitMs: bad }), /time limit outside policy/);
  assert.throws(() => openDecisionWorkflow({ identity, purpose: '   ', nowMs: T0, timeLimitMs: 3_600_000 }), /purpose required/);
  assert.throws(() => openDecisionWorkflow({ identity: { ...identity, identityId: 'bad id!' }, purpose: 'p', nowMs: T0, timeLimitMs: 3_600_000 }), /identity invalid/);
});

test('the approved-tool scope is frozen at admission and committed to the chain', () => {
  const tools = ['catalog-lookup', 'purchase-request-draft'];
  const wf = open(T0, { ...identity, approvedTools: tools });
  assert.equal(Object.isFrozen(wf.identity), true);
  assert.equal(Object.isFrozen(wf.identity.approvedTools), true, 'the admitted scope is a frozen copy');
  // Pushing a tool into the CALLER's array (still shared with the caller) after admission
  // cannot widen the admitted scope: the TOOL GATE reads the workflow's frozen copy.
  tools.push('erp-write');
  assert.throws(() => propose(wf, 'erp-write', 'LOW_RISK'), /outside the agent's approved scope/);
  // Metadata is bound to the chain: a forged longer lifetime or a flipped action policy
  // breaks event 1's hash and fails closed.
  const timeTampered = Object.freeze({ ...wf, expiresAtMs: wf.expiresAtMs + 3.15e12 });
  assert.throws(() => verifyAuditChain(timeTampered), /tamper-evidence check failed at event 1/);
  const idTampered = Object.freeze({ ...wf, identity: Object.freeze({ ...wf.identity, actionPolicy: 'BOUNDED_AUTOMATION' as never }) });
  assert.throws(() => verifyAuditChain(idTampered), /tamper-evidence check failed at event 1/);
  const scopeTampered = Object.freeze({ ...wf, identity: Object.freeze({ ...wf.identity, approvedTools: Object.freeze(['catalog-lookup']) }) });
  assert.throws(() => verifyAuditChain(scopeTampered), /tamper-evidence check failed at event 1/);
});

test('the TOOL GATE rejects any tool outside the agent approved scope; proposals authorize nothing', () => {
  const wf = open();
  assert.throws(() => propose(wf, 'erp-write'), /outside the agent's approved scope/);
  assert.throws(() => propose(wf, 'catalog-lookup', 'UNKNOWN_CLASS'), /unknown risk class/);
  const { workflow, proposal } = propose(wf);
  assert.equal(proposal.kind, 'GOVERNED_ACTION_PROPOSAL');
  assert.equal(proposal.humanDecision, 'REQUIRED');
  assert.equal(proposal.productionExecutionAllowed, false);
  assert.equal(proposal.automaticRecovery, false);
  const stages = workflow.events.map((e) => e.stage);
  assert.ok(stages.includes('AGENT_PLANNER') && stages.includes('TOOL_GATE')
    && stages.includes('PROPOSED_ACTION') && stages.includes('RISK_CHECK'),
    'planner, tool gate, proposal and risk check are all separately audited');
  assert.equal(workflow.stage, 'RISK_CHECK');
  // Stage machine: a second proposal on the same workflow can never be planned.
  assert.throws(() => propose(workflow, 'catalog-lookup', 'LOW_RISK'), /freshly opened workflow/);
  // An expired workflow proposes nothing.
  const late = open(T0 - DECISION_SAFETY_POLICY.maxTimeLimitMs);
  assert.throws(() => propose(late, 'purchase-request-draft', 'LOW_RISK', T0), /time limit exhausted/);
});

test('authorization is trail-bound: a forged or re-labeled proposal never matches', () => {
  // Attack path 1 (found by adversarial review): propose a PAYMENT, then authorize a
  // hand-built proposal claiming LOW_RISK — previously this bypassed the receipt gate.
  const { workflow, proposal } = propose(open(T0, identityBounded), 'purchase-request-draft', 'PAYMENT');
  const forged = { ...proposal, riskClass: 'LOW_RISK' as never };
  assert.throws(() => authorizeMinimumAction(workflow, forged, {
    operatorReceiptSha256: null as never, approvedBy: 'policy-engine', nowMs: T0 + 2,
  }), /does not match the action recorded/);
  // Attack path 2: authorize directly on a freshly opened workflow — the ladder cannot
  // be skipped even with a proposal whose workflowId matches.
  const fresh = open(T0, identityBounded);
  assert.throws(() => authorizeMinimumAction(fresh, {
    kind: 'GOVERNED_ACTION_PROPOSAL', workflowId: fresh.workflowId, actionId: 'action-004',
    description: 'pay supplier', toolId: 'catalog-lookup', riskClass: 'LOW_RISK',
    humanDecision: 'REQUIRED', automaticRecovery: false, productionExecutionAllowed: false,
  }, { operatorReceiptSha256: null as never, approvedBy: 'policy-engine', nowMs: T0 + 2 }), /risk-checked proposal/);
  // A description re-label also changes the digest (the instruction carries it verbatim).
  const { workflow: wf2, proposal: p2 } = propose(open(T0, identityBounded), 'catalog-lookup', 'LOW_RISK');
  assert.throws(() => authorizeMinimumAction(wf2, { ...p2, description: 'something else entirely' }, {
    operatorReceiptSha256: null as never, approvedBy: 'policy-engine', nowMs: T0 + 2,
  }), /does not match the action recorded/);
});

test('high-impact authorization is receipt-gated; the runtime executes nothing', () => {
  const { workflow, proposal } = propose(open());
  // No receipt -> fail closed (MATERIAL_FINANCIAL is a high-impact class).
  assert.throws(() => authorizeMinimumAction(workflow, proposal, { operatorReceiptSha256: '', approvedBy: 'operator', nowMs: T0 + 2 }), /operator receipt/);
  const receipt = 'a'.repeat(64);
  const { workflow: after, instruction } = authorizeMinimumAction(workflow, proposal, { operatorReceiptSha256: receipt, approvedBy: 'ceo', nowMs: T0 + 2 });
  assert.equal(instruction.kind, 'EXECUTION_INSTRUCTION');
  assert.equal(instruction.executedByThisRuntime, false, 'the runtime materializes no side effect');
  assert.equal(instruction.productionExecutionAllowed, false);
  assert.equal(instruction.automaticRecovery, false);
  assert.equal(instruction.minimumAction, proposal.description, 'the instruction is exactly the proposed minimum action');
  assert.equal(after.realActionsExecuted, 0);
  assert.equal(instruction.validUntilMs, T0 + 2 + DECISION_SAFETY_POLICY.instructionValidityMs);
  const stages = after.events.map((e) => e.stage);
  for (const stage of ['HUMAN_APPROVAL', 'RE_AUTHORIZE', 'EXECUTE_MINIMUM_ACTION'])
    assert.ok(stages.includes(stage), `${stage} is audited`);
  // Stage machine: a second instruction can never be issued for this workflow.
  assert.throws(() => authorizeMinimumAction(after, proposal, { operatorReceiptSha256: receipt, approvedBy: 'ceo', nowMs: T0 + 3 }), /risk-checked proposal/);
  // A proposal from a DIFFERENT workflow fails closed.
  const other = propose(open(T0 + 5), 'purchase-request-draft', 'MATERIAL_FINANCIAL', T0 + 6);
  assert.throws(() => authorizeMinimumAction(after, other.proposal, { operatorReceiptSha256: receipt, approvedBy: 'ceo', nowMs: T0 + 3 }), /does not belong to this workflow/);
  // Timestamps never move backwards in the trail.
  const { workflow: wf3, proposal: p3 } = propose(open(T0), 'purchase-request-draft', 'MATERIAL_FINANCIAL', T0 + 2);
  assert.throws(() => authorizeMinimumAction(wf3, p3, { operatorReceiptSha256: receipt, approvedBy: 'ceo', nowMs: T0 + 1 }), /moves backwards/);
});

test('policy-delegated low-risk automation is the only receipt-free path and stays audited', () => {
  const { workflow, proposal } = propose(open(T0, identityBounded), 'catalog-lookup', 'LOW_RISK');
  const { workflow: after, instruction } = authorizeMinimumAction(workflow, proposal, { operatorReceiptSha256: null as never, approvedBy: 'policy-engine', nowMs: T0 + 1 });
  assert.equal(instruction.executedByThisRuntime, false, 'even delegated execution materializes nothing in this runtime');
  assert.ok(after.events.some((e) => /policy-delegated approval/.test(e.detail)));
  // But a high-impact class on a BOUNDED_AUTOMATION agent still demands the receipt.
  const { workflow: highImpact, proposal: highProposal } = propose(open(T0, identityBounded), 'purchase-request-draft', 'PAYMENT');
  assert.throws(() => authorizeMinimumAction(highImpact, highProposal, { operatorReceiptSha256: null as never, approvedBy: 'policy-engine', nowMs: T0 + 1 }), /operator receipt/);
  // A malformed receipt on the delegated path also fails closed.
  const { workflow: wf2, proposal: p2 } = propose(open(T0, identityBounded), 'catalog-lookup', 'LOW_RISK');
  assert.throws(() => authorizeMinimumAction(wf2, p2, { operatorReceiptSha256: 'zz', approvedBy: 'policy-engine', nowMs: T0 + 1 }), /receipt malformed/);
});

test('measured outcomes are declared, validated, recorded verbatim, and never promoted into learning', () => {
  let wf = open();
  let proposal: Readonly<ActionProposal>;
  ({ workflow: wf, proposal } = propose(wf));
  ({ workflow: wf } = authorizeMinimumAction(wf, proposal, { operatorReceiptSha256: 'b'.repeat(64), approvedBy: 'ceo', nowMs: T0 + 2 }));
  // An invented outcome is NOT recorded as "evidence" — the declared union is enforced.
  assert.throws(() => recordMeasuredOutcome(wf, { outcome: 'TOTALLY_MADE_UP' as never, measuredAtMs: T0 + 3 }), /declared outcome/);
  assert.throws(() => recordMeasuredOutcome(wf, { outcome: 'EXECUTED_BY_OPERATOR', measuredAtMs: T0 + 3, note: 'x'.repeat(DECISION_SAFETY_POLICY.maxNoteChars + 1) }), /outcome note invalid/);
  assert.throws(() => recordMeasuredOutcome(wf, { outcome: 'EXECUTED_BY_OPERATOR', measuredAtMs: T0 + 3, note: 12345 as never }), /outcome note invalid/);
  wf = recordMeasuredOutcome(wf, { outcome: 'EXECUTED_BY_OPERATOR', measuredAtMs: T0 + 3, note: 'operator ran the instruction outside this runtime' });
  assert.equal(wf.stage, 'MEASURE_OUTCOME');
  assert.equal(wf.learningPromoted, false, 'an outcome is evidence, never promoted learning');
  assert.equal(wf.realActionsExecuted, 0, 'the runtime itself still executed nothing');
  // Stage machine: a second outcome can never be recorded for this workflow.
  assert.throws(() => recordMeasuredOutcome(wf, { outcome: 'FAILED', measuredAtMs: T0 + 4 }), /only be measured after/);
  // An expired workflow records nothing.
  assert.throws(() => recordMeasuredOutcome(wf, { outcome: 'EXECUTED_BY_OPERATOR' as never, measuredAtMs: T0 + 100_000_000 }), /time limit exhausted/);
});

test('the full ten-stage ladder is reachable and every stage is recorded', () => {
  const { workflow, proposal } = propose(open());
  const { workflow: after } = authorizeMinimumAction(workflow, proposal, { operatorReceiptSha256: 'd'.repeat(64), approvedBy: 'ceo', nowMs: T0 + 2 });
  let wf = recordMeasuredOutcome(after, { outcome: 'EXECUTED_BY_OPERATOR', measuredAtMs: T0 + 3 });
  wf = recordAuditAndMonitor(wf, { auditedAtMs: T0 + 4 });
  assert.equal(wf.stage, 'AUDIT_AND_MONITOR', 'the ladder reaches its terminal stage');
  assert.deepEqual(auditTrail(wf).stages, [...DECISION_SAFETY_POLICY.workflowStages]);
  // Audit runs once per workflow.
  assert.throws(() => recordAuditAndMonitor(wf, { auditedAtMs: T0 + 5 }), /after MEASURE_OUTCOME/);
  // Audit cannot skip the ladder (no MEASURE_OUTCOME yet).
  const { workflow: fresh } = propose(open());
  assert.throws(() => recordAuditAndMonitor(fresh, { auditedAtMs: T0 + 2 }), /after MEASURE_OUTCOME/);
});

test('the audit trail is hash-chained and tamper-evident; tampering fails closed, never repaired', () => {
  let wf = open();
  let proposal: Readonly<ActionProposal>;
  ({ workflow: wf, proposal } = propose(wf));
  ({ workflow: wf } = authorizeMinimumAction(wf, proposal, { operatorReceiptSha256: 'c'.repeat(64), approvedBy: 'ceo', nowMs: T0 + 2 }));
  wf = recordMeasuredOutcome(wf, { outcome: 'DECLINED_BY_HUMAN', measuredAtMs: T0 + 3 });
  const report = auditTrail(wf);
  assert.equal(report.chainValid, true);
  assert.equal(report.humanDecision, 'REQUIRED');
  assert.equal(report.automaticRecovery, false);
  assert.deepEqual(report.stages, [
    'IDENTITY_AND_POLICY', 'AGENT_PLANNER', 'TOOL_GATE', 'PROPOSED_ACTION', 'RISK_CHECK',
    'HUMAN_APPROVAL', 'RE_AUTHORIZE', 'EXECUTE_MINIMUM_ACTION', 'MEASURE_OUTCOME',
  ]);
  // Rebuild the same workflow deterministically: the hash chain is byte-identical.
  let replay = open();
  let replayProposal: Readonly<ActionProposal>;
  ({ workflow: replay, proposal: replayProposal } = propose(replay));
  ({ workflow: replay } = authorizeMinimumAction(replay, replayProposal, { operatorReceiptSha256: 'c'.repeat(64), approvedBy: 'ceo', nowMs: T0 + 2 }));
  replay = recordMeasuredOutcome(replay, { outcome: 'DECLINED_BY_HUMAN', measuredAtMs: T0 + 3 });
  assert.deepEqual(replay.events.map((e) => e.hash), wf.events.map((e) => e.hash), 'identical histories hash identically');
  // Tamper: rewrite a detail, then a hash, then delete an event. Each fails closed.
  const mutate = (fn: (w: { stage: string; events: DecisionSafetyWorkflow['events'][number][] }) => void): DecisionSafetyWorkflow => {
    const c = { ...wf, events: [...wf.events] } as unknown as { stage: string; events: DecisionSafetyWorkflow['events'][number][] };
    fn(c);
    return Object.freeze(c) as unknown as DecisionSafetyWorkflow;
  };
  assert.throws(() => verifyAuditChain(mutate((c) => { c.events[2] = { ...c.events[2]!, detail: 'forged detail' }; })), /tamper-evidence check failed at event 3/);
  assert.throws(() => verifyAuditChain(mutate((c) => { c.events[0] = { ...c.events[0]!, hash: '0'.repeat(64) }; })), /tamper-evidence check failed at event 1/);
  assert.throws(() => verifyAuditChain(mutate((c) => { c.events.splice(1, 1); })), /tamper-evidence check failed/);
  assert.throws(() => verifyAuditChain(Object.freeze({ ...wf, events: Object.freeze([]) } as unknown as DecisionSafetyWorkflow)), /event trail/);
  // Transplanted events: another workflow's trail does not verify against this one (the
  // genesis binds metadata AND the chain seeds on the workflow's own id).
  const { workflow: foreign } = propose(open(T0 + 5), 'purchase-request-draft', 'MATERIAL_FINANCIAL', T0 + 6);
  assert.throws(() => verifyAuditChain(Object.freeze({ ...wf, stage: 'RISK_CHECK', events: foreign.events } as unknown as DecisionSafetyWorkflow)), /tamper-evidence/);
});

test('the full ladder of the master plan is covered by the stage list in order', () => {
  assert.deepEqual([...DECISION_SAFETY_POLICY.workflowStages], [
    'IDENTITY_AND_POLICY', 'AGENT_PLANNER', 'TOOL_GATE', 'PROPOSED_ACTION', 'RISK_CHECK',
    'HUMAN_APPROVAL', 'RE_AUTHORIZE', 'EXECUTE_MINIMUM_ACTION', 'MEASURE_OUTCOME', 'AUDIT_AND_MONITOR',
  ]);
});