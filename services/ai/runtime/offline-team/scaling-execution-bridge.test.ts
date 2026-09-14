import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  issueScalingExecutionInstruction, SCALING_EXECUTION_POLICY, SCALING_EXECUTION_GUARDRAILS,
  type ScalingExecutionIssued,
} from './scaling-execution-bridge';
import {
  planMeasuredHorizontalScaling, recordScalingDecision, deriveScalingPolicyDigest,
  type ScalingDecisionRecord, type ScalingPlanProvenance,
} from './measured-horizontal-scaling';
import {
  DECISION_SAFETY_GUARDRAILS, DECISION_SAFETY_POLICY, recordAuditAndMonitor,
  recordMeasuredOutcome, auditTrail, verifyAuditChain, type AgentIdentity,
} from './agent-decision-safety-workflow';

const NOW = 1757700000000;
const RECEIPT = 'a'.repeat(64);
const GRANT = 'b'.repeat(64);

const mkEvidence = (over: {
  databaseId?: string; observedAtMs?: number; rowCount?: number; growthRowsPerDay?: number;
} = {}) => ({
  databaseId: over.databaseId ?? 'db.alpha-01',
  observedAtMs: over.observedAtMs ?? NOW - 30_000,
  rowCount: over.rowCount ?? 1_600_000,
  growthRowsPerDay: over.growthRowsPerDay ?? 2_000,
  providerInvocationAuthorized: false as const,
  productionScaleProven: false as const,
});

const mkPolicy = (over: { scaleOutTargetPercent?: number; horizonDays?: number; maxEvidenceAgeMs?: number; maxNewDatabasesPerPlan?: number } = {}) => ({
  scaleOutTargetPercent: over.scaleOutTargetPercent ?? 80,
  horizonDays: over.horizonDays ?? 30,
  maxEvidenceAgeMs: over.maxEvidenceAgeMs ?? 3_600_000,
  maxNewDatabasesPerPlan: over.maxNewDatabasesPerPlan ?? 4,
});

const mkIdentity = (over: Partial<AgentIdentity> = {}): AgentIdentity => ({
  identityId: over.identityId ?? 'agent.scaling-executor',
  approvedTools: over.approvedTools ?? [SCALING_EXECUTION_POLICY.executionToolId],
  dataBoundaries: over.dataBoundaries ?? ['xiv.runtime.local'],
  actionPolicy: over.actionPolicy ?? 'ADVISE_ONLY',
});

const mkProvenance = (over: {
  policy?: ReturnType<typeof mkPolicy>;
  tenantId?: string; universeId?: string; requestId?: string;
  now?: number; evidence?: ReturnType<typeof mkEvidence>[];
} = {}): ScalingPlanProvenance => {
  const policy = over.policy ?? mkPolicy();
  return {
    policy,
    request: {
      tenantId: over.tenantId ?? 'tenant.alpha',
      universeId: over.universeId ?? 'universe.alpha-main',
      requestId: over.requestId ?? 'scaling.req-0001',
      sourceCommit: 'a'.repeat(40),
      scalingPolicyDigest: deriveScalingPolicyDigest(policy),
      fleetDatabaseIds: ['db.alpha-01', 'db.alpha-02'],
    },
    nowMs: over.now ?? NOW,
    evidence: over.evidence ?? [mkEvidence(), mkEvidence({ databaseId: 'db.alpha-02' })],
  };
};

const mkDecision = (over: {
  provenance?: ScalingPlanProvenance; decidedAtMs?: number;
  decision?: 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN';
} = {}): { record: Readonly<ScalingDecisionRecord>; provenance: ScalingPlanProvenance } => {
  const provenance = over.provenance ?? mkProvenance();
  const plan = planMeasuredHorizontalScaling(provenance.policy, provenance.request, provenance.nowMs, provenance.evidence);
  const record = recordScalingDecision(plan, {
    decision: over.decision ?? 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: over.decidedAtMs ?? NOW + 60_000,
  }, provenance);
  return { record, provenance };
};

const issue = (over: {
  record?: Readonly<ScalingDecisionRecord>; provenance?: ScalingPlanProvenance;
  decidedAtMs?: number; decision?: 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN';
  grant?: { operatorReceiptSha256: string; approvedBy: string }; identity?: AgentIdentity;
  now?: number; timeLimitMs?: number;
} = {}): Readonly<ScalingExecutionIssued> => {
  const provenance = over.provenance ?? mkProvenance();
  return issueScalingExecutionInstruction({
    decisionRecord: over.record ?? mkDecision({ provenance, decidedAtMs: over.decidedAtMs, decision: over.decision }).record,
    decisionProvenance: provenance,
    executionGrant: over.grant ?? { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: over.identity ?? mkIdentity(),
    nowMs: over.now ?? NOW + 120_000,
    timeLimitMs: over.timeLimitMs ?? 300_000,
  });
};

test('the issued packet is honest end to end: nothing provisioned, nothing executed, approval required', () => {
  const issued = issue();
  assert.equal(issued.kind, 'SCALING_EXECUTION_ISSUED');
  assert.equal(Object.isFrozen(issued), true);
  assert.equal(issued.databasesProvisioned, 0);
  assert.equal(issued.rowsMoved, 0);
  assert.equal(issued.instruction.executedByThisRuntime, false);
  assert.equal(issued.instruction.productionExecutionAllowed, false);
  assert.equal(issued.workflow.guardrails, DECISION_SAFETY_GUARDRAILS);
  assert.equal(issued.humanDecision, 'REQUIRED');
  assert.equal(issued.learningPromoted, false);
  assert.equal(issued.modelCalls, 0);
  assert.equal(issued.remoteCalls, 0);
  assert.equal(issued.billionUsersProven, false);
  assert.equal(issued.automaticRecovery, false);
  assert.equal(Object.isFrozen(SCALING_EXECUTION_GUARDRAILS), true);
});

test('the happy path: the re-derived decision drives the full ladder to a bounded instruction', () => {
  const issued = issue();
  // The proposal is pinned: production configuration on the canonical tool, and the
  // minimum action is composed from re-derived values (count + plan digest), never
  // caller-authored text.
  assert.equal(issued.proposedNewDatabaseCount, 1);
  assert.match(issued.minimumAction, /Provision 1 empty database/);
  assert.match(issued.minimumAction, /move NO rows/);
  assert.match(issued.actionId, /^scaling\.exec\.[0-9a-f]{16}\.1$/);
  assert.equal(issued.planDigest, issued.verifiedDecisionRecord.planDigest);
  // The instruction is bounded in time by 12D-121's validity window.
  assert.ok(issued.instruction.validUntilMs > issued.workflow.openedAtMs);
  assert.ok(issued.instruction.validUntilMs <= issued.workflow.expiresAtMs);
  assert.equal(issued.workflow.stage, 'EXECUTE_MINIMUM_ACTION');
  // The audit chain verifies and the trail evidences every stage so far.
  verifyAuditChain(issued.workflow);
  const trail = auditTrail(issued.workflow);
  assert.deepEqual(trail.stages, [
    'IDENTITY_AND_POLICY', 'AGENT_PLANNER', 'TOOL_GATE', 'PROPOSED_ACTION', 'RISK_CHECK',
    'HUMAN_APPROVAL', 'RE_AUTHORIZE', 'EXECUTE_MINIMUM_ACTION',
  ]);
  // The ladder completes: declared outcome, then audit + monitor.
  const measured = recordMeasuredOutcome(issued.workflow, {
    outcome: 'EXECUTED_BY_OPERATOR', measuredAtMs: NOW + 130_000,
    note: 'operator provisioned the databases outside this runtime',
  });
  const audited = recordAuditAndMonitor(measured, { auditedAtMs: NOW + 140_000 });
  assert.equal(audited.stage, 'AUDIT_AND_MONITOR');
  assert.equal(auditTrail(audited).stages.length, 10);
});

test('a forged or altered decision record never re-derives — no instruction is issued', () => {
  const { record, provenance } = mkDecision();
  for (const forged of [
    { ...record, decision: 'DECLINED_BY_HUMAN' as const },
    { ...record, operatorReceiptSha256: 'c'.repeat(64) },
    { ...record, decidedBy: 'other' },
    { ...record, decidedAtMs: record.decidedAtMs + 1 },
    { ...record, proposedNewDatabaseCount: 5 },
    { ...record, planDigest: 'f'.repeat(64) },
  ]) {
    assert.throws(() => issueScalingExecutionInstruction({
      decisionRecord: Object.freeze(forged), decisionProvenance: provenance,
      executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
      identity: mkIdentity(), nowMs: NOW + 120_000, timeLimitMs: 300_000,
    }), /does not re-derive|decline is final|only an ACCEPTED/);
  }
  // A record presented without its provenance, or with provenance that now composes to
  // a denial, fails closed.
  assert.throws(() => issueScalingExecutionInstruction({
    decisionRecord: record,
    decisionProvenance: mkProvenance({ evidence: [mkEvidence({ rowCount: 100 }), mkEvidence({ databaseId: 'db.alpha-02' })] }),
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: NOW + 120_000, timeLimitMs: 300_000,
  }), /does not re-derive|only an eligible/);
});

test('a DECLINED decision is a final state — no instruction can be manufactured from it', () => {
  const { record, provenance } = mkDecision({ decision: 'DECLINED_BY_HUMAN' });
  assert.throws(() => issueScalingExecutionInstruction({
    decisionRecord: record, decisionProvenance: provenance,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: NOW + 120_000, timeLimitMs: 300_000,
  }), /a decline is final/);
});

test('the workflow identity is least-privilege: ADVISE_ONLY, exactly the provisioning tool', () => {
  for (const identity of [
    mkIdentity({ actionPolicy: 'BOUNDED_AUTOMATION' }),
    mkIdentity({ approvedTools: ['xiv.database.provision', 'xiv.database.migrate'] }),
    mkIdentity({ approvedTools: ['xiv.storage.write'] }),
    mkIdentity({ approvedTools: [] }),
  ]) {
    assert.throws(() => issue({ identity }), /ADVISE_ONLY|exactly one approved tool/);
  }
});

test('the execution grant is a separate human act with its own receipt', () => {
  // Reusing the plan-approval receipt collapses two gates into one authorization.
  assert.throws(() => issue({ grant: { operatorReceiptSha256: RECEIPT, approvedBy: 'ceo' } }),
    /separate human authorization/);
  // A malformed grant receipt is refused by the 12D-121 receipt gate.
  assert.throws(() => issue({ grant: { operatorReceiptSha256: 'zz', approvedBy: 'ceo' } }),
    /operator receipt/);
});

test('ordering: the execution grant cannot predate the human decision it executes', () => {
  assert.throws(() => issue({ now: NOW + 30_000 }), /predates the human decision/);
  // Equal to decidedAtMs is legitimate (the grant can be the same instant).
  const { record, provenance } = mkDecision({ decidedAtMs: NOW + 60_000 });
  issueScalingExecutionInstruction({
    decisionRecord: record, decisionProvenance: provenance,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: NOW + 60_000, timeLimitMs: 300_000,
  });
});

test('malformed inputs fail closed before anything is opened', () => {
  const { record, provenance } = mkDecision();
  assert.throws(() => issueScalingExecutionInstruction(undefined as never), /input required/);
  assert.throws(() => issueScalingExecutionInstruction({
    decisionRecord: { ...record } as never, decisionProvenance: provenance,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: NOW + 120_000, timeLimitMs: 300_000,
  }), /not a frozen SCALING_DECISION_RECORD/);
  assert.throws(() => issueScalingExecutionInstruction({
    decisionRecord: record, decisionProvenance: null as never,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: NOW + 120_000, timeLimitMs: 300_000,
  }), /provenance required/);
  assert.throws(() => issueScalingExecutionInstruction({
    decisionRecord: record, decisionProvenance: provenance,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: Number.NaN, timeLimitMs: 300_000,
  }), /reference time invalid/);
  assert.throws(() => issueScalingExecutionInstruction({
    decisionRecord: record, decisionProvenance: provenance,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: NOW + 120_000, timeLimitMs: Number.NaN,
  }), /time limit invalid/);
});

test('policy and guardrails are frozen and pin the honest action class', () => {
  assert.equal(Object.isFrozen(SCALING_EXECUTION_POLICY), true);
  assert.equal(SCALING_EXECUTION_POLICY.requiredRiskClass, 'PRODUCTION_CONFIGURATION');
  assert.ok(DECISION_SAFETY_POLICY.humanApprovalRequiredClasses
    .includes(SCALING_EXECUTION_POLICY.requiredRiskClass));
  assert.equal(SCALING_EXECUTION_GUARDRAILS.executesNothing, true);
  assert.equal(SCALING_EXECUTION_GUARDRAILS.movesNoRows, true);
  assert.equal(SCALING_EXECUTION_GUARDRAILS.declinedPlansAreFinalStates, true);
});