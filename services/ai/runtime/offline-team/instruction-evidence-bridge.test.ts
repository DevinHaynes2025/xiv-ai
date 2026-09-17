// 12D-134 — focused tests for the INSTRUCTION-EVIDENCE BRIDGE.
// Coverage: the full loop (instruction → trail-verified evidence → completed ladder),
// unrecorded proposals, tampered chains, instruction mismatch, cross-contract binding,
// expired action claims, one-outcome-per-instruction, redacted trail notes, honest flags.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { issueScalingExecutionInstruction, SCALING_EXECUTION_POLICY } from './scaling-execution-bridge';
import { issueFailoverExecutionInstruction, FAILOVER_EXECUTION_POLICY } from './failover-execution-bridge';
import { DeclaredEvidenceCollector, DECLARED_EVIDENCE_GUARDRAILS, type TrafficObservation } from './declared-evidence-collector';
import { DeclaredEvidenceIntake, EVIDENCE_INTAKE_GUARDRAILS, EVIDENCE_INTAKE_POLICY } from './instruction-evidence-bridge';
import {
  planMeasuredHorizontalScaling, recordScalingDecision, deriveScalingPolicyDigest,
  type ScalingPlanProvenance,
} from './measured-horizontal-scaling';
import {
  planMeasuredRegionalFailover, recordFailoverDecision, deriveFailoverPolicyDigest,
  type FailoverPlanProvenance,
} from './measured-regional-failover';
import { auditTrail, type AgentIdentity, type DecisionSafetyWorkflow } from './agent-decision-safety-workflow';
import { OperatorCustodyRegistry } from './operator-custody-registry';

const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');
const NOW = 1_757_700_000_000;
const RECEIPT = sha256('plan-approval');
const GRANT = sha256('execution-grant');
const TENANT = 'tenant.alpha';
const UNIVERSE = 'universe.alpha-main';

/** 12D-290 paydown: a FRESH custody registry per fixture, both receipts
 * registered for their REAL purposes (the 12D-235 discipline) — the
 * bridges consume both receipts exactly once at issue time. */
const mkScalingCustody = (): OperatorCustodyRegistry => {
  const c = new OperatorCustodyRegistry('custody-seed-123456789');
  c.register({ receiptSha256: RECEIPT, purpose: SCALING_EXECUTION_POLICY.planApprovalPurpose, registeredBy: 'ceo', issuedAtMs: NOW, registeredAtMs: NOW });
  c.register({ receiptSha256: GRANT, purpose: SCALING_EXECUTION_POLICY.executionToolId, registeredBy: 'ceo', issuedAtMs: NOW, registeredAtMs: NOW });
  return c;
};
const mkFailoverCustody = (): OperatorCustodyRegistry => {
  const c = new OperatorCustodyRegistry('custody-seed-123456789');
  c.register({ receiptSha256: RECEIPT, purpose: FAILOVER_EXECUTION_POLICY.planApprovalPurpose, registeredBy: 'ceo', issuedAtMs: NOW, registeredAtMs: NOW });
  c.register({ receiptSha256: GRANT, purpose: FAILOVER_EXECUTION_POLICY.executionToolId, registeredBy: 'ceo', issuedAtMs: NOW, registeredAtMs: NOW });
  return c;
};

// ---- scaling fixtures (the 12D-130 test's discipline) ----

const mkScalingIssued = (issuedNowMs: number = NOW + 120_000) => {
  const policy = {
    scaleOutTargetPercent: 80, horizonDays: 30,
    maxEvidenceAgeMs: 3_600_000, maxNewDatabasesPerPlan: 4,
  };
  const provenance: ScalingPlanProvenance = {
    policy,
    request: {
      tenantId: TENANT, universeId: UNIVERSE,
      requestId: 'scaling.req-0001', sourceCommit: 'a'.repeat(40),
      scalingPolicyDigest: deriveScalingPolicyDigest(policy),
      fleetDatabaseIds: ['db.alpha-01', 'db.alpha-02'],
    },
    nowMs: NOW,
    evidence: [
      { databaseId: 'db.alpha-01', observedAtMs: NOW - 30_000, rowCount: 1_600_000, growthRowsPerDay: 2_000, providerInvocationAuthorized: false as const, productionScaleProven: false as const },
      { databaseId: 'db.alpha-02', observedAtMs: NOW - 30_000, rowCount: 1_600_000, growthRowsPerDay: 2_000, providerInvocationAuthorized: false as const, productionScaleProven: false as const },
    ],
  };
  const plan = planMeasuredHorizontalScaling(provenance.policy, provenance.request, provenance.nowMs, provenance.evidence);
  const record = recordScalingDecision(plan, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW', operatorReceiptSha256: RECEIPT,
    decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  }, provenance);
  return issueScalingExecutionInstruction({
    decisionRecord: record, decisionProvenance: provenance,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    custody: mkScalingCustody(),
    identity: {
      identityId: 'agent.scaling-executor',
      approvedTools: [SCALING_EXECUTION_POLICY.executionToolId],
      dataBoundaries: ['xiv.runtime.local'], actionPolicy: 'ADVISE_ONLY',
    } satisfies AgentIdentity,
    nowMs: issuedNowMs, timeLimitMs: 300_000,
  });
};

// ---- failover fixtures (the 12D-131 test's discipline) ----

const mkFailoverIssued = () => {
  const policy = {
    maxCanaryTrafficBps: 500, maxEvidenceSkewMs: 60_000, maxEvidenceAgeMs: 3_600_000,
    allowedRegionPairs: [{ primaryRegionId: 'aws-us-east-1', secondaryRegionId: 'aws-us-west-2' }],
  };
  const provenance: FailoverPlanProvenance = {
    policy,
    request: {
      universeId: UNIVERSE, tenantId: TENANT,
      requestId: 'failover.req-0001', sourceCommit: 'a'.repeat(40),
      dataClass: 'INTERNAL', requestedTrafficBps: 300, virtualShard: 42,
      primaryRegionId: 'aws-us-east-1', primaryFailureDomain: 'us-east-1',
      reason: 'PRIMARY_UNHEALTHY', failoverPolicyDigest: deriveFailoverPolicyDigest(policy),
    } as FailoverPlanProvenance['request'],
    nowMs: NOW,
    primary: {
      regionId: 'aws-us-east-1', provider: 'AWS', failureDomain: 'us-east-1',
      observedAtMs: NOW - 30_000, measuredRequestsPerSecond: 5_000,
      measuredConcurrentRequests: 250, p95LatencyMs: 1_400, errorRateBps: 7_000,
      availableHeadroomBps: 0, admissionEligible: false,
      providerInvocationAuthorized: false, productionScaleProven: false,
    },
    secondary: {
      regionId: 'aws-us-west-2', provider: 'AWS', failureDomain: 'us-west-2',
      observedAtMs: NOW - 30_000, measuredRequestsPerSecond: 8_000,
      measuredConcurrentRequests: 100, p95LatencyMs: 120, errorRateBps: 10,
      availableHeadroomBps: 6_000, admissionEligible: true,
      providerInvocationAuthorized: false, productionScaleProven: false,
    },
  } as FailoverPlanProvenance;
  const plan = planMeasuredRegionalFailover(provenance.policy, provenance.request, provenance.nowMs, provenance.primary, provenance.secondary);
  const record = recordFailoverDecision(plan, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW', operatorReceiptSha256: RECEIPT,
    decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  }, provenance);
  return issueFailoverExecutionInstruction({
    decisionRecord: record, decisionProvenance: provenance,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    custody: mkFailoverCustody(),
    identity: {
      identityId: 'agent.failover-executor',
      approvedTools: [FAILOVER_EXECUTION_POLICY.executionToolId],
      dataBoundaries: ['xiv.runtime.local'], actionPolicy: 'ADVISE_ONLY',
    } satisfies AgentIdentity,
    nowMs: NOW + 120_000, timeLimitMs: 300_000,
  });
};

// ---- intake fixtures ----

const mkIntake = () => new DeclaredEvidenceIntake({
  collector: new DeclaredEvidenceCollector({
    tenantId: TENANT, universeId: UNIVERSE, collectorId: 'collector-1',
  }),
});

const mkObservation = (over: Partial<TrafficObservation> = {}): TrafficObservation => ({
  observationId: `obs-${Math.random().toString(16).slice(2, 10)}`,
  observedAtMs: NOW + 150_000,
  virtualShard: 42,
  observedTrafficBps: 100,
  observedBy: 'observer:local-agent',
  ...over,
});

type ScalingIssued = ReturnType<typeof mkScalingIssued>;
type FailoverIssued = ReturnType<typeof mkFailoverIssued>;

const scalingOutcomeInput = (
  issued: ScalingIssued,
  over: {
    status?: 'PROPOSED' | 'NOT_EXECUTED' | 'EXECUTED' | 'FAILED' | 'UNVERIFIED';
    before?: TrafficObservation; after?: TrafficObservation; recordedAtMs?: number;
    note?: string; instruction?: ScalingIssued['instruction']; workflow?: DecisionSafetyWorkflow;
    operatorReceiptSha256?: string; tenantId?: string; universeId?: string;
  } = {},
) => ({
  tenantId: over.tenantId ?? TENANT,
  universeId: over.universeId ?? UNIVERSE,
  scope: 'SCALING' as const,
  runId: 'run-12d-134',
  sourceCommit: 'a'.repeat(40),
  decisionId: 'decision-1',
  decisionRecord: issued.verifiedDecisionRecord,
  instruction: over.instruction ?? issued.instruction,
  workflow: over.workflow ?? issued.workflow,
  operatorReceiptSha256: over.operatorReceiptSha256 ?? GRANT,
  status: over.status ?? ('PROPOSED' as const),
  before: over.before ?? mkObservation(),
  after: over.after ?? mkObservation({ observedAtMs: NOW + 170_000 }),
  recordedAtMs: over.recordedAtMs ?? NOW + 180_000,
  ...over,
});

test('12d-134 happy path: a trail-verified instruction binds a receipt and completes the ladder', () => {
  const issued = mkScalingIssued();
  const intake = mkIntake();
  const r = intake.recordInstructionOutcome(scalingOutcomeInput(issued, { status: 'EXECUTED' }));
  // The receipt is bound to the instruction reference composed from verified objects.
  assert.match(r.receipt.instructionId, /^[^/]+\/scaling\.exec\./);
  assert.equal(r.instructionId, `${issued.workflowId}/${issued.actionId}`);
  assert.equal(r.receipt.instructionId, r.instructionId);
  assert.match(r.proposalDigest, /^[0-9a-f]{64}$/);
  // The declared outcome was measured on the trail AND the ladder completed.
  assert.equal(r.workflow.stage, 'AUDIT_AND_MONITOR');
  const stages = auditTrail(r.workflow).stages;
  assert.equal(stages.length, 10); // all ten 12D-121 ladder stages
  assert.equal(stages[stages.length - 2], 'MEASURE_OUTCOME');
  assert.ok(stages[stages.length - 2]!.length > 0);
  assert.equal(r.outcomeRecorded, 'EXECUTED_BY_OPERATOR');
  // The receipt carries the honest 12D-221 surface.
  assert.equal(r.receipt.status, 'EXECUTED');
  assert.equal(r.receipt.providerInvocationAuthorized, false);
  assert.equal(r.receipt.trafficMoved, false);
  assert.equal(Object.isFrozen(r), true);
  assert.equal(Object.isFrozen(r.workflow), true);
});

test('12d-134 failover happy path: a failover instruction binds a failover receipt', () => {
  const issued = mkFailoverIssued();
  const intake = mkIntake();
  const r = intake.recordInstructionOutcome({
    tenantId: TENANT, universeId: UNIVERSE, scope: 'FAILOVER',
    runId: 'run-12d-134', sourceCommit: 'a'.repeat(40), decisionId: 'decision-failover-1',
    decisionRecord: issued.verifiedDecisionRecord,
    instruction: issued.instruction, workflow: issued.workflow,
    operatorReceiptSha256: GRANT, status: 'NOT_EXECUTED',
    before: mkObservation({ observedAtMs: NOW + 150_000 }),
    after: mkObservation({ observedAtMs: NOW + 150_000 }),
    recordedAtMs: NOW + 180_000,
  });
  assert.equal(r.outcomeRecorded, 'OBSERVED_ONLY');
  assert.equal(r.receipt.scope, 'FAILOVER');
  assert.match(r.receipt.instructionId, /\/failover\.exec\./);
  assert.equal(r.workflow.stage, 'AUDIT_AND_MONITOR');
});

test('12d-134 an instruction the trail never recorded cannot bind evidence', () => {
  const issued = mkScalingIssued();
  const intake = mkIntake();
  // A forged minimumAction changes the candidate proposal digest → not in the trail.
  assert.throws(() => intake.recordInstructionOutcome(scalingOutcomeInput(issued, {
    instruction: Object.freeze({
      ...issued.instruction, minimumAction: 'Provision 99 empty database(s) — escalated',
    }),
  })), /re-derive a proposal this workflow trail recorded/);
  // An actionId swap fails too (different digest, and cross-contract prefix).
  assert.throws(() => intake.recordInstructionOutcome(scalingOutcomeInput(issued, {
    instruction: Object.freeze({
      ...issued.instruction, actionId: 'scaling.exec.deadbeefdeadbeef.9',
    }),
  })), /re-derive a proposal this workflow trail recorded|does not re-derive from the decision record/);
  // An instruction from ANOTHER workflow (issued at a different time → a different
  // content-derived workflowId) fails the ownership gate.
  const other = mkScalingIssued(NOW + 130_000);
  assert.throws(() => intake.recordInstructionOutcome(scalingOutcomeInput(issued, {
    instruction: other.instruction,
  })), /does not belong to this workflow/);
});

test('12d-134 a tampered workflow chain fails closed before any evidence', () => {
  const issued = mkScalingIssued();
  const intake = mkIntake();
  // Tamper with a mid-chain event: the hash chain must break.
  const events = issued.workflow.events.map((e, i) => (i === 2
    ? { ...e, detail: `${e.detail} TAMPERED` } : e));
  const tampered = Object.freeze({
    ...issued.workflow, events: Object.freeze(events),
  }) as DecisionSafetyWorkflow;
  assert.throws(() => intake.recordInstructionOutcome(scalingOutcomeInput(issued, {
    workflow: tampered,
  })), /tamper|chain|fail closed|re-derive/);
});

test('12d-134 cross-contract binding: an actionId must re-derive from the decision record', () => {
  const issued = mkScalingIssued();
  const intake = mkIntake();
  // A failover-shaped instruction (composed over the same workflow) fails the prefix check.
  assert.throws(() => intake.recordInstructionOutcome(scalingOutcomeInput(issued, {
    instruction: Object.freeze({
      ...issued.instruction,
      actionId: `failover.exec.${issued.planDigest.slice(0, 16)}.300`,
    }),
  })), /does not re-derive a proposal this workflow trail recorded/);
  // A wrong-scope decision record is refused before the digest matters.
  assert.throws(() => intake.recordInstructionOutcome({
    ...scalingOutcomeInput(issued, { status: 'PROPOSED' }),
    scope: 'FAILOVER',
  }), /cannot bind a non-failover decision record/);
});

test('12d-134 an action claim observed after the instruction expired is refused', () => {
  const issued = mkScalingIssued();
  const intake = mkIntake();
  assert.ok(issued.instruction.validUntilMs > NOW + 150_000); // fixture sanity
  assert.throws(() => intake.recordInstructionOutcome(scalingOutcomeInput(issued, {
    status: 'EXECUTED',
    after: mkObservation({ observedAtMs: issued.instruction.validUntilMs + 1 }),
  })), /after the instruction expired/);
  // But a no-action status carries no such requirement.
  const r = intake.recordInstructionOutcome(scalingOutcomeInput(issued, {
    status: 'NOT_EXECUTED',
    after: mkObservation({ observedAtMs: issued.instruction.validUntilMs + 1, observationId: 'obs-late-ok' }),
    recordedAtMs: NOW + 200_000, // the late observation still must not be future-dated
  }));
  assert.equal(r.outcomeRecorded, 'OBSERVED_ONLY');
});

test('12d-134 one declared outcome per instruction', () => {
  const issued = mkScalingIssued();
  const intake = mkIntake();
  intake.recordInstructionOutcome(scalingOutcomeInput(issued, { status: 'PROPOSED' }));
  // A DIFFERENT receipt about the SAME instruction is refused by the intake gate...
  assert.throws(() => intake.recordInstructionOutcome({
    ...scalingOutcomeInput(issued, { status: 'EXECUTED' }),
    workflow: issued.workflow, // the measured workflow is now past EXECUTE_MINIMUM_ACTION anyway
  }), /already measured|EXECUTE_MINIMUM_ACTION stage|one declared outcome/);
  // ...and a second intake still refuses by the one-per-instruction digest even with a
  // fresh workflow from a re-issued instruction? No — a re-issued instruction is a new
  // proposal digest. The gate is per digest, not per workflow instance.
  const second = mkScalingIssued();
  const r2 = mkIntake().recordInstructionOutcome(scalingOutcomeInput(second, { status: 'EXECUTED' }));
  assert.equal(r2.receipt.status, 'EXECUTED');
});

test('12d-134 trail notes carry only redacted text', () => {
  const issued = mkScalingIssued();
  const intake = mkIntake();
  const secret = 'api_key=sk-live-abcdef123456 rotated keys on shard 42';
  const r = intake.recordInstructionOutcome(scalingOutcomeInput(issued, {
    status: 'PROPOSED', note: secret,
  }));
  assert.ok(!r.receipt.note!.includes('sk-live-abcdef123456'));
  const measuredEvent = r.workflow.events.find((e) => e.stage === 'MEASURE_OUTCOME');
  assert.ok(measuredEvent);
  assert.ok(!measuredEvent.detail.includes('sk-live-abcdef123456'));
});

test('12d-134 scope, stage, and freeze gates fail closed', () => {
  const issued = mkScalingIssued();
  const intake = mkIntake();
  // Cross-tenant and cross-universe claims refused at the intake boundary.
  assert.throws(() => intake.recordInstructionOutcome(scalingOutcomeInput(issued, { tenantId: 'tenant.beta' })), /outside this intake/);
  assert.throws(() => intake.recordInstructionOutcome(scalingOutcomeInput(issued, { universeId: 'universe.other' })), /outside this intake/);
  // A workflow already past EXECUTE_MINIMUM_ACTION cannot be re-measured into evidence.
  const once = mkIntake().recordInstructionOutcome(scalingOutcomeInput(issued, { status: 'PROPOSED' }));
  assert.throws(() => mkIntake().recordInstructionOutcome(scalingOutcomeInput(issued, {
    status: 'EXECUTED', workflow: once.workflow,
  })), /exactly the EXECUTE_MINIMUM_ACTION stage/);
  // Unfrozen inputs are refused outright.
  assert.throws(() => intake.recordInstructionOutcome(scalingOutcomeInput(issued, {
    workflow: { ...issued.workflow },
  })), /frozen DECISION_SAFETY_WORKFLOW/);
  assert.throws(() => intake.recordInstructionOutcome(scalingOutcomeInput(issued, {
    instruction: { ...issued.instruction },
  })), /frozen EXECUTION_INSTRUCTION/);
  // An unknown status is refused; rollback goes to the collector directly.
  assert.throws(() => intake.recordInstructionOutcome(scalingOutcomeInput(issued, {
    status: 'ROLLED_BACK' as never,
  })), /rollback evidence goes to the collector/);
  assert.throws(() => intake.recordInstructionOutcome(scalingOutcomeInput(issued, {
    status: 'ASSUMED_EXECUTED' as never,
  })), /status unknown/);
});

test('12d-134 honest flags and guardrails: the intake permits nothing', () => {
  const issued = mkScalingIssued();
  const intake = mkIntake();
  const r = intake.recordInstructionOutcome(scalingOutcomeInput(issued, { status: 'PROPOSED' }));
  assert.equal(r.humanDecision, 'REQUIRED');
  assert.equal(r.learningPromoted, false);
  assert.equal(r.modelCalls, 0);
  assert.equal(r.remoteCalls, 0);
  assert.equal(r.billionUsersProven, false);
  assert.equal(r.automaticRecovery, false);
  assert.equal(EVIDENCE_INTAKE_GUARDRAILS.noPresentedProposalIsTrusted_theCandidateIsDerivedAndTrailVerified, true);
  assert.equal(EVIDENCE_INTAKE_GUARDRAILS.approvalMustPrecedeTheActInTheTrail, true);
  assert.equal(EVIDENCE_INTAKE_GUARDRAILS.oneDeclaredOutcomePerInstruction, true);
  assert.equal(EVIDENCE_INTAKE_GUARDRAILS.permitsNoProviderCall, true);
  assert.equal(EVIDENCE_INTAKE_GUARDRAILS.permitsNoTrafficMovement, true);
  assert.equal(EVIDENCE_INTAKE_GUARDRAILS.permitsNoProductionMutation, true);
  assert.equal(EVIDENCE_INTAKE_GUARDRAILS.permitsNoMergeOrDeployment, true);
  assert.equal(EVIDENCE_INTAKE_GUARDRAILS.humanDecision, 'REQUIRED');
  assert.equal(EVIDENCE_INTAKE_GUARDRAILS.automaticRecovery, false);
  // The receipt still carries the full 12D-221 honest surface.
  assert.equal(r.receipt.productionMutationAllowed, false);
  assert.equal(r.receipt.mergeAllowed, false);
  assert.equal(r.receipt.deployAllowed, false);
  assert.equal(DECLARED_EVIDENCE_GUARDRAILS.permitsNoProductionMutation, true);
  assert.equal(Object.isFrozen(EVIDENCE_INTAKE_GUARDRAILS), true);
  assert.equal(Object.isFrozen(EVIDENCE_INTAKE_POLICY), true);
});