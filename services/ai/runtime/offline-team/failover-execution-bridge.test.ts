import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  issueFailoverExecutionInstruction, FAILOVER_EXECUTION_POLICY, FAILOVER_EXECUTION_GUARDRAILS,
  type FailoverExecutionIssued,
} from './failover-execution-bridge';
import {
  planMeasuredRegionalFailover, recordFailoverDecision, deriveFailoverPolicyDigest,
  type FailoverDecisionRecord, type FailoverPlanProvenance, type MeasuredFailoverPlan,
} from './measured-regional-failover';
import {
  DECISION_SAFETY_GUARDRAILS, DECISION_SAFETY_POLICY, recordAuditAndMonitor,
  recordMeasuredOutcome, auditTrail, verifyAuditChain, type AgentIdentity,
} from './agent-decision-safety-workflow';

const NOW = 1757700000000;
const RECEIPT = 'a'.repeat(64);
const GRANT = 'c'.repeat(64);

const mkPrimary = (over: Record<string, unknown> = {}) => ({
  regionId: 'aws-us-east-1',
  provider: 'AWS',
  failureDomain: 'us-east-1',
  observedAtMs: NOW - 30_000,
  measuredRequestsPerSecond: 5_000,
  measuredConcurrentRequests: 250,
  p95LatencyMs: 1_400,
  errorRateBps: 7_000,
  availableHeadroomBps: 0,
  admissionEligible: false,
  providerInvocationAuthorized: false,
  productionScaleProven: false,
  ...over,
});

const mkSecondary = (over: Record<string, unknown> = {}) => ({
  regionId: 'aws-us-west-2',
  provider: 'AWS',
  failureDomain: 'us-west-2',
  observedAtMs: NOW - 30_000,
  measuredRequestsPerSecond: 8_000,
  measuredConcurrentRequests: 100,
  p95LatencyMs: 120,
  errorRateBps: 10,
  availableHeadroomBps: 6_000,
  admissionEligible: true,
  providerInvocationAuthorized: false,
  productionScaleProven: false,
  ...over,
});

const mkPolicy = (over: Record<string, unknown> = {}) => ({
  maxCanaryTrafficBps: 500,
  maxEvidenceSkewMs: 60_000,
  maxEvidenceAgeMs: 3_600_000,
  allowedRegionPairs: [
    { primaryRegionId: 'aws-us-east-1', secondaryRegionId: 'aws-us-west-2' },
  ],
  ...over,
});

const mkIdentity = (over: Partial<AgentIdentity> = {}): AgentIdentity => ({
  identityId: over.identityId ?? 'agent.failover-executor',
  approvedTools: over.approvedTools ?? [FAILOVER_EXECUTION_POLICY.executionToolId],
  dataBoundaries: over.dataBoundaries ?? ['xiv.runtime.local'],
  actionPolicy: over.actionPolicy ?? 'ADVISE_ONLY',
});

const mkProvenance = (over: {
  policy?: Record<string, unknown>; primary?: Record<string, unknown> | null;
  secondary?: Record<string, unknown> | null; now?: number;
} = {}): FailoverPlanProvenance => {
  const policy = mkPolicy(over.policy) as FailoverPlanProvenance['policy'];
  return {
    policy,
    request: {
      universeId: 'universe.alpha-main',
      tenantId: 'tenant.alpha',
      requestId: 'failover.req-0001',
      sourceCommit: 'a'.repeat(40),
      dataClass: 'INTERNAL',
      requestedTrafficBps: 300,
      virtualShard: 42,
      primaryRegionId: 'aws-us-east-1',
      primaryFailureDomain: 'us-east-1',
      reason: 'PRIMARY_UNHEALTHY',
      failoverPolicyDigest: deriveFailoverPolicyDigest(policy),
    } as FailoverPlanProvenance['request'],
    nowMs: over.now ?? NOW,
    primary: (over.primary === undefined ? mkPrimary() : over.primary) as FailoverPlanProvenance['primary'],
    secondary: (over.secondary === undefined ? mkSecondary() : over.secondary) as FailoverPlanProvenance['secondary'],
  };
};

const mkDecision = (over: {
  provenance?: FailoverPlanProvenance; decidedAtMs?: number;
  decision?: 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN';
} = {}): { record: Readonly<FailoverDecisionRecord>; provenance: FailoverPlanProvenance; plan: MeasuredFailoverPlan } => {
  const provenance = over.provenance ?? mkProvenance();
  const plan = planMeasuredRegionalFailover(
    provenance.policy, provenance.request, provenance.nowMs, provenance.primary, provenance.secondary,
  );
  const record = recordFailoverDecision(plan, {
    decision: over.decision ?? 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: over.decidedAtMs ?? NOW + 60_000,
  }, provenance);
  return { record, provenance, plan };
};

const issue = (over: {
  record?: Readonly<FailoverDecisionRecord>; provenance?: FailoverPlanProvenance;
  decidedAtMs?: number; decision?: 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN';
  grant?: { operatorReceiptSha256: string; approvedBy: string }; identity?: AgentIdentity;
  now?: number; timeLimitMs?: number;
} = {}): Readonly<FailoverExecutionIssued> => {
  const provenance = over.provenance ?? mkProvenance();
  return issueFailoverExecutionInstruction({
    decisionRecord: over.record ?? mkDecision({ provenance, decidedAtMs: over.decidedAtMs, decision: over.decision }).record,
    decisionProvenance: provenance,
    executionGrant: over.grant ?? { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: over.identity ?? mkIdentity(),
    nowMs: over.now ?? NOW + 120_000,
    timeLimitMs: over.timeLimitMs ?? 300_000,
  });
};

test('the issued packet is honest end to end: nothing moves, nothing is authorized', () => {
  const issued = issue();
  assert.equal(issued.kind, 'FAILOVER_EXECUTION_ISSUED');
  assert.equal(Object.isFrozen(issued), true);
  assert.equal(issued.trafficMoved, false);
  assert.equal(issued.authorizedTrafficBps, 0);
  assert.equal(issued.instruction.executedByThisRuntime, false);
  assert.equal(issued.instruction.productionExecutionAllowed, false);
  assert.equal(issued.workflow.guardrails, DECISION_SAFETY_GUARDRAILS);
  assert.equal(issued.humanDecision, 'REQUIRED');
  assert.equal(issued.learningPromoted, false);
  assert.equal(issued.modelCalls, 0);
  assert.equal(issued.remoteCalls, 0);
  assert.equal(issued.billionUsersProven, false);
  assert.equal(issued.automaticRecovery, false);
  assert.equal(Object.isFrozen(FAILOVER_EXECUTION_GUARDRAILS), true);
});

test('the happy path: the re-derived decision drives the full ladder to a bounded canary instruction', () => {
  const issued = issue();
  assert.equal(issued.candidateRegionId, 'aws-us-west-2');
  assert.equal(issued.requestedTrafficBps, 300);
  assert.match(issued.minimumAction, /Shift 300 bps \(canary\)/);
  assert.match(issued.minimumAction, /shift NO other traffic/);
  assert.match(issued.minimumAction, /move NO classified workload/);
  assert.match(issued.actionId, /^failover\.exec\.[0-9a-f]{16}\.300$/);
  assert.equal(issued.planDigest, issued.verifiedDecisionRecord.planDigest);
  assert.ok(issued.instruction.validUntilMs > issued.workflow.openedAtMs);
  assert.ok(issued.instruction.validUntilMs <= issued.workflow.expiresAtMs);
  assert.equal(issued.workflow.stage, 'EXECUTE_MINIMUM_ACTION');
  verifyAuditChain(issued.workflow);
  const trail = auditTrail(issued.workflow);
  assert.deepEqual(trail.stages, [
    'IDENTITY_AND_POLICY', 'AGENT_PLANNER', 'TOOL_GATE', 'PROPOSED_ACTION', 'RISK_CHECK',
    'HUMAN_APPROVAL', 'RE_AUTHORIZE', 'EXECUTE_MINIMUM_ACTION',
  ]);
  const measured = recordMeasuredOutcome(issued.workflow, {
    outcome: 'EXECUTED_BY_OPERATOR', measuredAtMs: NOW + 130_000,
    note: 'operator shifted the canary outside this runtime',
  });
  const audited = recordAuditAndMonitor(measured, { auditedAtMs: NOW + 140_000 });
  assert.equal(audited.stage, 'AUDIT_AND_MONITOR');
  assert.equal(auditTrail(audited).stages.length, 10);
});

test('a forged or altered decision record never re-derives — no instruction is issued', () => {
  const { record, provenance } = mkDecision();
  for (const forged of [
    { ...record, decision: 'DECLINED_BY_HUMAN' as const },
    { ...record, operatorReceiptSha256: 'd'.repeat(64) },
    { ...record, decidedBy: 'other' },
    { ...record, decidedAtMs: record.decidedAtMs + 1 },
    { ...record, candidateRegionId: 'aws-eu-west-1' },
    { ...record, requestedTrafficBps: 2_400 },
    { ...record, planDigest: 'f'.repeat(64) },
  ]) {
    assert.throws(() => issueFailoverExecutionInstruction({
      decisionRecord: Object.freeze(forged), decisionProvenance: provenance,
      executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
      identity: mkIdentity(), nowMs: NOW + 120_000, timeLimitMs: 300_000,
    }), /does not re-derive|decline is final/);
  }
  // Provenance that now composes to a denial fails closed.
  assert.throws(() => issueFailoverExecutionInstruction({
    decisionRecord: record,
    decisionProvenance: mkProvenance({ secondary: mkSecondary({ admissionEligible: false }) }),
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: NOW + 120_000, timeLimitMs: 300_000,
  }), /does not re-derive|only an eligible/);
});

test('a DECLINED decision is a final state — no instruction can be manufactured from it', () => {
  const { record, provenance } = mkDecision({ decision: 'DECLINED_BY_HUMAN' });
  assert.throws(() => issueFailoverExecutionInstruction({
    decisionRecord: record, decisionProvenance: provenance,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: NOW + 120_000, timeLimitMs: 300_000,
  }), /a decline is final/);
});

test('the workflow identity is least-privilege: ADVISE_ONLY, exactly the failover tool', () => {
  for (const identity of [
    mkIdentity({ actionPolicy: 'BOUNDED_AUTOMATION' }),
    mkIdentity({ approvedTools: ['xiv.traffic.failover', 'xiv.traffic.route'] }),
    mkIdentity({ approvedTools: ['xiv.storage.write'] }),
    mkIdentity({ approvedTools: [] }),
  ]) {
    assert.throws(() => issue({ identity }), /ADVISE_ONLY|exactly one approved tool/);
  }
});

test('the execution grant is a separate human act with its own receipt', () => {
  assert.throws(() => issue({ grant: { operatorReceiptSha256: RECEIPT, approvedBy: 'ceo' } }),
    /separate human authorization/);
  assert.throws(() => issue({ grant: { operatorReceiptSha256: 'zz', approvedBy: 'ceo' } }),
    /operator receipt/);
});

test('ordering: the execution grant cannot predate the human decision it executes', () => {
  assert.throws(() => issue({ now: NOW + 30_000 }), /predates the human decision/);
  const { record, provenance } = mkDecision({ decidedAtMs: NOW + 60_000 });
  issueFailoverExecutionInstruction({
    decisionRecord: record, decisionProvenance: provenance,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: NOW + 60_000, timeLimitMs: 300_000,
  });
});

test('malformed inputs fail closed before anything is opened', () => {
  const { record, provenance } = mkDecision();
  assert.throws(() => issueFailoverExecutionInstruction(undefined as never), /input required/);
  assert.throws(() => issueFailoverExecutionInstruction({
    decisionRecord: { ...record } as never, decisionProvenance: provenance,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: NOW + 120_000, timeLimitMs: 300_000,
  }), /not a frozen FAILOVER_DECISION_RECORD/);
  assert.throws(() => issueFailoverExecutionInstruction({
    decisionRecord: record, decisionProvenance: null as never,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: NOW + 120_000, timeLimitMs: 300_000,
  }), /provenance required/);
  assert.throws(() => issueFailoverExecutionInstruction({
    decisionRecord: record, decisionProvenance: provenance,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: Number.NaN, timeLimitMs: 300_000,
  }), /reference time invalid/);
  assert.throws(() => issueFailoverExecutionInstruction({
    decisionRecord: record, decisionProvenance: provenance,
    executionGrant: { operatorReceiptSha256: GRANT, approvedBy: 'ceo' },
    identity: mkIdentity(), nowMs: NOW + 120_000, timeLimitMs: Number.NaN,
  }), /time limit invalid/);
});

test('policy and guardrails are frozen and pin the honest action class', () => {
  assert.equal(Object.isFrozen(FAILOVER_EXECUTION_POLICY), true);
  assert.equal(FAILOVER_EXECUTION_POLICY.requiredRiskClass, 'PRODUCTION_CONFIGURATION');
  assert.ok(DECISION_SAFETY_POLICY.humanApprovalRequiredClasses
    .includes(FAILOVER_EXECUTION_POLICY.requiredRiskClass));
  assert.equal(FAILOVER_EXECUTION_GUARDRAILS.executesNothing, true);
  assert.equal(FAILOVER_EXECUTION_GUARDRAILS.movesNoTraffic, true);
  assert.equal(FAILOVER_EXECUTION_GUARDRAILS.canaryShiftOnly, true);
  assert.equal(FAILOVER_EXECUTION_GUARDRAILS.declinedPlansAreFinalStates, true);
});