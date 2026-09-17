// 12D-222 — focused tests for INSTRUCTION-SIDE ADOPTION & LINEAGE RECONCILIATION.
// Coverage: the complete chain recomposed end to end (SCALING and FAILOVER), every
// presented packet treated as untrusted, structured (exact) trail evidence, replay
// refused, and honest flags.

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  InstructionAdoptionGate, INSTRUCTION_ADOPTION_POLICY, INSTRUCTION_ADOPTION_GUARDRAILS,
} from './instruction-adoption-gate';
import {
  issueScalingExecutionInstruction, SCALING_EXECUTION_POLICY, type ScalingExecutionIssued,
} from './scaling-execution-bridge';
import {
  planMeasuredHorizontalScaling, recordScalingDecision, deriveScalingPolicyDigest,
  type ScalingDecisionRecord, type ScalingPlanProvenance,
} from './measured-horizontal-scaling';
import {
  issueFailoverExecutionInstruction, FAILOVER_EXECUTION_POLICY, type FailoverExecutionIssued,
} from './failover-execution-bridge';
import {
  planMeasuredRegionalFailover, recordFailoverDecision, deriveFailoverPolicyDigest,
  type FailoverDecisionRecord, type FailoverPlanProvenance,
} from './measured-regional-failover';
import {
  openDecisionWorkflow, deriveProposalDigest, verifyAuditChain,
  type AgentIdentity, type DecisionSafetyWorkflow, type ExecutionInstruction,
} from './agent-decision-safety-workflow';
import {
  planRegionalCells, type RegionalCellPlacementPlan,
} from './regional-cell-contract';
import { planEventPlane, type DistributedEventPlanePlan } from './event-plane-contract';
import { PARTITION_POLICY, type QueueRouting } from './queue-partition-contract';
import {
  adoptCellPlacementOperatively, bindEventPlaneToAdoptedCells,
  cellPlanDigestOf, CELL_PLACEMENT_ADAPTER_GUARDRAILS,
} from './cell-placement-adapter';
import { OperatorCustodyRegistry } from './operator-custody-registry';
import { eventPlanePlanDigestOf } from './event-plane-adapter';

// ── execution-bridge fixtures (12D-130/131 templates) ────────────────────────────

const NOW = 1757700000000;
const PLAN_RECEIPT = 'a'.repeat(64);
const GRANT = 'b'.repeat(64);
const FAIL_GRANT = 'c'.repeat(64);
const ADOPT_RECEIPT = 'd'.repeat(64);
const INSTR_RECEIPT = 'e'.repeat(64);
const REVISION = 'a'.repeat(40);
const EPOCH_PLACE = 'local-sqlite-pilot-2026-09';

/** 12D-290 paydown: a FRESH custody registry per fixture, both receipts
 * registered for their REAL purposes (the 12D-235 discipline) — the
 * bridges consume both receipts exactly once at issue time. */
const mkScalingCustody = (): OperatorCustodyRegistry => {
  const c = new OperatorCustodyRegistry('custody-seed-123456789');
  c.register({ receiptSha256: PLAN_RECEIPT, purpose: SCALING_EXECUTION_POLICY.planApprovalPurpose, registeredBy: 'ceo', issuedAtMs: NOW, registeredAtMs: NOW });
  c.register({ receiptSha256: GRANT, purpose: SCALING_EXECUTION_POLICY.executionToolId, registeredBy: 'ceo', issuedAtMs: NOW, registeredAtMs: NOW });
  return c;
};
const mkFailoverCustody = (): OperatorCustodyRegistry => {
  const c = new OperatorCustodyRegistry('custody-seed-123456789');
  c.register({ receiptSha256: PLAN_RECEIPT, purpose: FAILOVER_EXECUTION_POLICY.planApprovalPurpose, registeredBy: 'ceo', issuedAtMs: NOW, registeredAtMs: NOW });
  c.register({ receiptSha256: FAIL_GRANT, purpose: FAILOVER_EXECUTION_POLICY.executionToolId, registeredBy: 'ceo', issuedAtMs: NOW, registeredAtMs: NOW });
  return c;
};

const mkScalingEvidence = (over: {
  databaseId?: string; observedAtMs?: number; rowCount?: number; growthRowsPerDay?: number;
} = {}) => ({
  databaseId: over.databaseId ?? 'db.alpha-01',
  observedAtMs: over.observedAtMs ?? NOW - 30_000,
  rowCount: over.rowCount ?? 1_600_000,
  growthRowsPerDay: over.growthRowsPerDay ?? 2_000,
  providerInvocationAuthorized: false as const,
  productionScaleProven: false as const,
});

const mkScalingPolicy = (over: {
  scaleOutTargetPercent?: number; horizonDays?: number; maxEvidenceAgeMs?: number; maxNewDatabasesPerPlan?: number;
} = {}) => ({
  scaleOutTargetPercent: over.scaleOutTargetPercent ?? 80,
  horizonDays: over.horizonDays ?? 30,
  maxEvidenceAgeMs: over.maxEvidenceAgeMs ?? 3_600_000,
  maxNewDatabasesPerPlan: over.maxNewDatabasesPerPlan ?? 4,
});

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

const scalingIdentity = (): AgentIdentity => ({
  identityId: 'agent.scaling-executor',
  approvedTools: [SCALING_EXECUTION_POLICY.executionToolId],
  dataBoundaries: ['xiv.runtime.local'],
  actionPolicy: 'ADVISE_ONLY',
});

const failoverIdentity = (): AgentIdentity => ({
  identityId: 'agent.failover-executor',
  approvedTools: [FAILOVER_EXECUTION_POLICY.executionToolId],
  dataBoundaries: ['xiv.runtime.local'],
  actionPolicy: 'ADVISE_ONLY',
});

const mkScalingProvenance = (over: {
  requestId?: string; tenantId?: string; now?: number;
} = {}): ScalingPlanProvenance => {
  const policy = mkScalingPolicy();
  return {
    policy,
    request: {
      tenantId: over.tenantId ?? 'tenant.alpha',
      universeId: 'universe.alpha-main',
      requestId: over.requestId ?? 'scaling.req-0001',
      sourceCommit: REVISION,
      scalingPolicyDigest: deriveScalingPolicyDigest(policy),
      fleetDatabaseIds: ['db.alpha-01', 'db.alpha-02'],
    },
    nowMs: over.now ?? NOW,
    evidence: [mkScalingEvidence(), mkScalingEvidence({ databaseId: 'db.alpha-02' })],
  };
};

const mkFailoverProvenance = (over: {
  requestId?: string; tenantId?: string; now?: number;
} = {}): FailoverPlanProvenance => {
  const policy = {
    maxCanaryTrafficBps: 500,
    maxEvidenceSkewMs: 60_000,
    maxEvidenceAgeMs: 3_600_000,
    allowedRegionPairs: [
      { primaryRegionId: 'aws-us-east-1', secondaryRegionId: 'aws-us-west-2' },
    ],
  } as FailoverPlanProvenance['policy'];
  return {
    policy,
    request: {
      universeId: 'universe.alpha-main',
      tenantId: over.tenantId ?? 'tenant.alpha',
      requestId: over.requestId ?? 'failover.req-0001',
      sourceCommit: REVISION,
      dataClass: 'INTERNAL',
      requestedTrafficBps: 300,
      virtualShard: 42,
      primaryRegionId: 'aws-us-east-1',
      primaryFailureDomain: 'us-east-1',
      reason: 'PRIMARY_UNHEALTHY',
      failoverPolicyDigest: deriveFailoverPolicyDigest(policy),
    } as FailoverPlanProvenance['request'],
    nowMs: over.now ?? NOW,
    primary: mkPrimary() as FailoverPlanProvenance['primary'],
    secondary: mkSecondary() as FailoverPlanProvenance['secondary'],
  };
};

// ── placement-chain fixtures (12D-120/123/136 templates) ─────────────────────────

const mkRouting = (
  shardCount: number,
  assigns: Array<[string, number]>,
  budgets: Record<string, number>,
): QueueRouting => Object.freeze({
  epoch: EPOCH_PLACE,
  shardCount,
  assignments: Object.freeze(assigns.map(([tenantId, shardId]) => Object.freeze({ tenantId, shardId }))),
  tenantRowBudgets: Object.freeze(budgets),
});

const routing = mkRouting(4,
  [['tenant-a', 0], ['tenant-b', 0], ['tenant-c', 1], ['tenant-d', 3]],
  { 'tenant-a': 600_000, 'tenant-b': 400_000, 'tenant-c': 250_000, 'tenant-d': 750_000 });

const multiCellPlan = (): Readonly<RegionalCellPlacementPlan> => planRegionalCells(routing, 2);
const singleCellPlan = (): Readonly<RegionalCellPlacementPlan> => planRegionalCells(routing, 1);
const planeOver = (cells: number): DistributedEventPlanePlan =>
  planEventPlane(routing, planRegionalCells(routing, cells));

// ── chain assembly ───────────────────────────────────────────────────────────────

interface Chain {
  record: Readonly<ScalingDecisionRecord> | Readonly<FailoverDecisionRecord>;
  provenance: Readonly<ScalingPlanProvenance> | Readonly<FailoverPlanProvenance>;
  issued: Readonly<ScalingExecutionIssued> | Readonly<FailoverExecutionIssued>;
  grant: { operatorReceiptSha256: string; approvedBy: string };
  cellPlan: Readonly<RegionalCellPlacementPlan>;
  cellAdoption: ReturnType<typeof adoptCellPlacementOperatively>;
  plane: DistributedEventPlanePlan;
  binding: ReturnType<typeof bindEventPlaneToAdoptedCells>;
  cellBinding: ReturnType<typeof bindEventPlaneToAdoptedCells>;
}

const mkChain = (
  scope: 'SCALING' | 'FAILOVER',
  over: { adoptedAtMs?: number; decidedAtMs?: number } = {},
): Chain => {
  const provenance = scope === 'SCALING' ? mkScalingProvenance() : mkFailoverProvenance();
  const plan = scope === 'SCALING'
    ? planMeasuredHorizontalScaling(
      (provenance as ScalingPlanProvenance).policy,
      (provenance as ScalingPlanProvenance).request,
      (provenance as ScalingPlanProvenance).nowMs,
      (provenance as ScalingPlanProvenance).evidence)
    : planMeasuredRegionalFailover(
      (provenance as FailoverPlanProvenance).policy,
      (provenance as FailoverPlanProvenance).request,
      (provenance as FailoverPlanProvenance).nowMs,
      (provenance as FailoverPlanProvenance).primary,
      (provenance as FailoverPlanProvenance).secondary);
  const record = scope === 'SCALING'
    ? recordScalingDecision(plan as never, {
      decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
      operatorReceiptSha256: PLAN_RECEIPT, decidedBy: 'ceo', decidedAtMs: over.decidedAtMs ?? NOW + 60_000,
    }, provenance as ScalingPlanProvenance)
    : recordFailoverDecision(plan as never, {
      decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
      operatorReceiptSha256: PLAN_RECEIPT, decidedBy: 'ceo', decidedAtMs: over.decidedAtMs ?? NOW + 60_000,
    }, provenance as FailoverPlanProvenance);
  const grant = { operatorReceiptSha256: scope === 'SCALING' ? GRANT : FAIL_GRANT, approvedBy: 'ceo' };
  const issued = scope === 'SCALING'
    ? issueScalingExecutionInstruction({
      decisionRecord: record as ScalingDecisionRecord,
      decisionProvenance: provenance as ScalingPlanProvenance,
      executionGrant: grant,
      custody: mkScalingCustody(),
      identity: scalingIdentity(), nowMs: NOW + 120_000, timeLimitMs: 300_000,
    })
    : issueFailoverExecutionInstruction({
      decisionRecord: record as FailoverDecisionRecord,
      decisionProvenance: provenance as FailoverPlanProvenance,
      executionGrant: grant,
      custody: mkFailoverCustody(),
      identity: failoverIdentity(), nowMs: NOW + 120_000, timeLimitMs: 300_000,
    });
  const cellPlan = multiCellPlan();
  const cellAdoption = adoptCellPlacementOperatively(cellPlan, {
    operatorReceiptSha256: ADOPT_RECEIPT, adoptedBy: 'ceo', adoptedAtMs: over.adoptedAtMs ?? NOW + 40_000,
  });
  const plane = planeOver(2);
  const cellBinding = bindEventPlaneToAdoptedCells(plane, cellAdoption, multiCellPlan());
  return {
    record, provenance, issued, grant, cellPlan, cellAdoption, plane,
    binding: cellBinding, cellBinding,
  };
};

type AdoptOverride = {
  tenantId?: string; universeId?: string; storyId?: string; sourceRevision?: string;
  operatorReceiptSha256?: string; recordedAtMs?: number;
  grant?: { operatorReceiptSha256?: string; approvedBy?: string };
};

const adoptChain = (
  gate: InstructionAdoptionGate,
  chain: Chain,
  scope: 'SCALING' | 'FAILOVER',
  over: AdoptOverride = {},
) => gate.adoptInstruction({
  scope,
  tenantId: over.tenantId ?? 'tenant.alpha',
  universeId: over.universeId ?? 'universe.alpha-main',
  storyId: over.storyId ?? '12D-222',
  sourceRevision: over.sourceRevision ?? REVISION,
  decisionRecord: chain.record,
  decisionProvenance: chain.provenance,
  executionGrant: over.grant
    ? {
      operatorReceiptSha256: over.grant.operatorReceiptSha256 ?? chain.grant.operatorReceiptSha256,
      approvedBy: over.grant.approvedBy ?? chain.grant.approvedBy,
    }
    : chain.grant,
  instruction: chain.issued.instruction,
  workflow: chain.issued.workflow,
  cellPlacementPlan: chain.cellPlan,
  cellAdoption: chain.cellAdoption,
  eventPlanePlan: chain.plane,
  cellBinding: chain.cellBinding,
  operatorReceiptSha256: over.operatorReceiptSha256 ?? INSTR_RECEIPT,
  recordedAtMs: over.recordedAtMs ?? NOW + 130_000,
});

const digestChainCheck = (
  record: ReturnType<InstructionAdoptionGate['adoptInstruction']>,
): void => {
  for (const d of [record.instructionDigest, record.cellPlanDigest, record.cellAdoptionDigest,
    record.eventPlaneDigest, record.bindingDigest]) {
    assert.equal(/^[0-9a-f]{64}$/.test(d), true);
  }
};

// ── tests ────────────────────────────────────────────────────────────────────────

test('12d-222 the complete SCALING chain recomposes end to end into a bounded advisory record', () => {
  const gate = new InstructionAdoptionGate();
  const chain = mkChain('SCALING');
  const record = adoptChain(gate, chain, 'SCALING');
  assert.equal(record.kind, 'INSTRUCTION_ADOPTION_RECORD');
  assert.equal(record.tenantId, 'tenant.alpha');
  assert.equal(record.universeId, 'universe.alpha-main');
  assert.equal(record.storyId, '12D-222');
  // The storyId is bound VERBATIM and honestly marked — no upstream 12D contract
  // carries a story id, so it is NEVER lineage evidence.
  assert.equal(record.storyIdIsAnUnverifiedCallerAssertion, true);
  assert.equal(record.sourceRevision, REVISION);
  // instructionId is DERIVED by the gate — `${workflowId}:${actionId}` — never a
  // caller-controlled value.
  assert.equal(record.instructionId,
    `${(chain.issued.workflow as DecisionSafetyWorkflow).workflowId}`
    + `:${(chain.issued.instruction as ExecutionInstruction).actionId}`);
  assert.equal(record.workflowId, (chain.issued.workflow as DecisionSafetyWorkflow).workflowId);
  assert.equal(record.actionId, (chain.issued.instruction as ExecutionInstruction).actionId);
  assert.match(record.actionId, /^scaling\.exec\.[0-9a-f]{16}\.1$/);
  // Every digest is 64-hex AND re-derives against the presented packets independently.
  digestChainCheck(record);
  assert.equal(record.instructionDigest, deriveProposalDigest({
    workflowId: (chain.issued.workflow as DecisionSafetyWorkflow).workflowId,
    actionId: (chain.issued.instruction as ExecutionInstruction).actionId,
    description: (chain.issued.instruction as ExecutionInstruction).minimumAction,
    toolId: SCALING_EXECUTION_POLICY.executionToolId,
    riskClass: SCALING_EXECUTION_POLICY.requiredRiskClass,
  }));
  assert.equal(record.cellPlanDigest, cellPlanDigestOf(chain.cellPlan));
  assert.equal(record.eventPlaneDigest, eventPlanePlanDigestOf(chain.plane));
  assert.equal(record.operatorReceiptSha256, INSTR_RECEIPT);
  assert.equal(record.policyVersion, INSTRUCTION_ADOPTION_POLICY.policyVersion);
  assert.equal(record.adoptedAtMs, NOW + 130_000);
  assert.equal(record.expiresAtMs, Math.min(
    (chain.issued.instruction as ExecutionInstruction).validUntilMs,
    NOW + 130_000 + INSTRUCTION_ADOPTION_POLICY.recordValidityMs));
  // Structural safety values.
  assert.equal(record.trafficMoved, false);
  assert.equal(record.authorizedTrafficBps, 0);
  assert.equal(record.executionStarted, false);
  assert.equal(record.productionMutationAllowed, false);
  assert.equal(record.realCellsProvisioned, 0);
  assert.equal(record.databasesProvisioned, 0);
  assert.equal(record.rowsMoved, 0);
  // Honest flags.
  assert.equal(record.humanDecision, 'REQUIRED');
  assert.equal(record.learningPromoted, false);
  assert.equal(record.modelCalls, 0);
  assert.equal(record.remoteCalls, 0);
  assert.equal(record.billionUsersProven, false);
  assert.equal(record.automaticRecovery, false);
  assert.equal(Object.isFrozen(record), true);
});

test('12d-222 the FAILOVER chain recomposes end to end with the same discipline', () => {
  const gate = new InstructionAdoptionGate();
  const chain = mkChain('FAILOVER');
  const record = adoptChain(gate, chain, 'FAILOVER');
  assert.equal(record.kind, 'INSTRUCTION_ADOPTION_RECORD');
  assert.match(record.actionId, /^failover\.exec\.[0-9a-f]{16}\.300$/);
  digestChainCheck(record);
  assert.equal(record.instructionDigest, deriveProposalDigest({
    workflowId: (chain.issued.workflow as DecisionSafetyWorkflow).workflowId,
    actionId: (chain.issued.instruction as ExecutionInstruction).actionId,
    description: (chain.issued.instruction as ExecutionInstruction).minimumAction,
    toolId: FAILOVER_EXECUTION_POLICY.executionToolId,
    riskClass: FAILOVER_EXECUTION_POLICY.requiredRiskClass,
  }));
  assert.equal(record.cellPlanDigest, cellPlanDigestOf(chain.cellPlan));
  assert.equal(record.eventPlaneDigest, eventPlanePlanDigestOf(chain.plane));
  assert.equal(record.trafficMoved, false);
  assert.equal(record.authorizedTrafficBps, 0);
  assert.equal(record.executionStarted, false);
  assert.equal(record.productionMutationAllowed, false);
  assert.equal(record.realCellsProvisioned, 0);
  assert.equal(record.humanDecision, 'REQUIRED');
  assert.equal(record.modelCalls, 0);
  assert.equal(record.remoteCalls, 0);
});

test('12d-222 shape gates: unknown scope, wildcards, malformed ids, and bad receipts fail closed', () => {
  const chain = mkChain('SCALING');
  const overrides: AdoptOverride[] = [
    { tenantId: 'tenant-*' },                       // wildcard scope
    { universeId: '*' },
    { storyId: '12D-*' },
    { storyId: 'not-a-story' },
    { sourceRevision: 'b'.repeat(39) },
    { operatorReceiptSha256: 'e'.repeat(63) },
    { operatorReceiptSha256: 'not-a-receipt' },
    { grant: { operatorReceiptSha256: 'zz' } },     // malformed grant receipt
    { grant: { approvedBy: 'bad identity!' } },     // invalid grant approver
  ];
  for (const over of overrides) {
    assert.throws(() => adoptChain(new InstructionAdoptionGate(), chain, 'SCALING', over),
      /fail closed|receipt|approver/);
  }
  // An unsupported action/scope family is refused outright.
  const input = {
    scope: 'AUTO_SCALE',
    tenantId: 'tenant.alpha', universeId: 'universe.alpha-main', storyId: '12D-222',
    sourceRevision: REVISION,
    decisionRecord: chain.record, decisionProvenance: chain.provenance,
    executionGrant: chain.grant,
    instruction: chain.issued.instruction, workflow: chain.issued.workflow,
    cellPlacementPlan: chain.cellPlan, cellAdoption: chain.cellAdoption,
    eventPlanePlan: chain.plane, cellBinding: chain.cellBinding,
    operatorReceiptSha256: INSTR_RECEIPT, recordedAtMs: NOW + 130_000,
  };
  assert.throws(() => (new InstructionAdoptionGate()).adoptInstruction(input as never),
    /adoption scope unknown/);
  // A missing execution grant is refused.
  assert.throws(() => (new InstructionAdoptionGate()).adoptInstruction({
    ...input, scope: 'SCALING', executionGrant: undefined,
  } as never), /execution grant is required/);
});

test('12d-222 the decision record is UNTRUSTED: forged digests, declined finals, and mixed scope fail closed', () => {
  const happy = mkChain('SCALING');
  // A tampered record (any recorded field moved) does not re-derive its recordDigest.
  const tampered = Object.freeze({
    ...happy.record, decidedBy: 'attacker',
  }) as unknown as typeof happy.record;
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), { ...happy, record: tampered }, 'SCALING'),
    /does not re-derive its recordDigest/);
  // A wrong-family record cannot bind a scaling adoption.
  const failoverChain = mkChain('FAILOVER');
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), { ...happy, record: failoverChain.record }, 'SCALING'),
    /non-scaling decision record/);
  // A DECLINE is a final state — never adoptable.
  const provenance = mkScalingProvenance();
  const plan = planMeasuredHorizontalScaling(provenance.policy, provenance.request, provenance.nowMs, provenance.evidence);
  const declined = recordScalingDecision(plan, {
    decision: 'DECLINED_BY_HUMAN', operatorReceiptSha256: PLAN_RECEIPT, decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  }, provenance);
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), { ...happy, record: declined }, 'SCALING'),
    /a declined plan is a final state/);
  // Provenance that no longer recomposes to the record's planDigest fails closed.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), {
    ...happy, provenance: mkScalingProvenance({ requestId: 'scaling.req-tampered' }),
  }, 'SCALING'), /does not recompose from its presented provenance/);
  // Mixed tenants refuse.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), happy, 'SCALING', { tenantId: 'tenant.beta' }),
    /mixed scope/);
  // Mixed source revisions fail closed.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), happy, 'SCALING', { sourceRevision: 'b'.repeat(40) }),
    /mixed revision/);
  // A FUTURE-dated decision (the recording predates the human decision it adopts).
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), mkChain('SCALING', { decidedAtMs: NOW + 200_000 }), 'SCALING'),
    /predates the human decision/);
});

test('12d-222 the instruction chain is UNTRUSTED: unverified trails, foreign workflows, and dishonest flags fail closed', () => {
  const chain = mkChain('SCALING');
  const w = chain.issued.workflow as DecisionSafetyWorkflow;
  const instr = chain.issued.instruction as ExecutionInstruction;
  const withWorkflow = (workflow: DecisionSafetyWorkflow) =>
    ({ ...chain, issued: { ...chain.issued, workflow } as typeof chain.issued });
  const withInstruction = (instruction: ExecutionInstruction) =>
    ({ ...chain, issued: { ...chain.issued, instruction } as typeof chain.issued });
  // A tampered hash-chained trail is refused before anything else re-derives.
  const tamperedWorkflow = Object.freeze({
    ...w,
    events: Object.freeze(w.events.map((e, i) => (i === 2 ? Object.freeze({ ...e, detail: 'tampered' }) : e))),
  }) as DecisionSafetyWorkflow;
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), withWorkflow(tamperedWorkflow), 'SCALING'),
    /tamper-evidence|fail closed/);
  // A workflow not yet at EXECUTE_MINIMUM_ACTION cannot bound an adoption.
  const fresh = openDecisionWorkflow({
    identity: scalingIdentity(), purpose: 'unused workflow',
    nowMs: NOW + 120_000, timeLimitMs: 300_000,
  });
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), withWorkflow(fresh), 'SCALING'),
    /EXECUTE_MINIMUM_ACTION stage/);
  // An instruction from another workflow is refused.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(),
    withInstruction(Object.freeze({ ...instr, workflowId: 'wf.other' }) as ExecutionInstruction), 'SCALING'),
    /does not belong to this workflow/);
  // Dishonest governance flags on the instruction are structural refusals.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(),
    withInstruction(Object.freeze({ ...instr, productionExecutionAllowed: true }) as unknown as ExecutionInstruction), 'SCALING'),
    /dishonest governance flags/);
  // A cross-contract actionId from another proposal family is refused.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(),
    withInstruction(Object.freeze({ ...instr, actionId: `scaling.exec.${'f'.repeat(16)}.1` }) as ExecutionInstruction), 'SCALING'),
    /does not re-derive from the decision record/);
  // An instruction whose proposal the trail never recorded (altered minimum action).
  assert.throws(() => adoptChain(new InstructionAdoptionGate(),
    withInstruction(Object.freeze({ ...instr, minimumAction: 'Provision 99 databases and everything else' }) as unknown as ExecutionInstruction), 'SCALING'),
    /does not re-derive a proposal this workflow trail recorded/);
  // Temporal bounds: recording after the instruction expired.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), chain, 'SCALING', { recordedAtMs: instr.validUntilMs + 1 }),
    /validity window/);
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), chain, 'SCALING', { recordedAtMs: NOW + 50_000 }),
    /predates the human decision/);
  // Negative and non-safe-integer recording timestamps fail closed.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), chain, 'SCALING', { recordedAtMs: -1 }),
    /recording timestamp/);
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), chain, 'SCALING', { recordedAtMs: 1.5 }),
    /recording timestamp invalid/);
});

test('12d-222 trail evidence is STRUCTURED: a forged approver or a non-canonical approval detail can never stand in', () => {
  const chain = mkChain('SCALING');
  // A grant naming an approver whose canonical approval event is absent fails closed —
  // no substring of another approval can impersonate it.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), chain, 'SCALING',
    { grant: { approvedBy: 'other-approver' } }), /approval by the presented execution grant/);
  // A malformed grant receipt fails closed before the trail is searched.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), chain, 'SCALING',
    { grant: { operatorReceiptSha256: 'zz' } }), /64-hex sha256 operator receipt/);
});

test('12d-222 the placement chain is UNTRUSTED: non-adoptions, digest mismatches, staleness, and forged bindings fail closed', () => {
  const chain = mkChain('SCALING');
  // A non-adopted placement can never bind.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), {
    ...chain, cellAdoption: { ...chain.cellAdoption, kind: 'NOT_AN_ADOPTION' } as unknown as typeof chain.cellAdoption,
  }, 'SCALING'), /non-adopted placement/);
  // A presented adoption carrying a malformed receipt, invalid timestamp, or invalid
  // adopter identity is refused (defense in depth — the digest alone is not enough).
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), {
    ...chain, cellAdoption: Object.freeze({
      ...chain.cellAdoption, operatorReceiptSha256: 'zz',
    }) as unknown as typeof chain.cellAdoption,
  }, 'SCALING'), /malformed receipt/);
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), {
    ...chain, cellAdoption: Object.freeze({ ...chain.cellAdoption, adoptedAtMs: 1.5 }) as unknown as typeof chain.cellAdoption,
  }, 'SCALING'), /invalid timestamp/);
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), {
    ...chain, cellAdoption: Object.freeze({ ...chain.cellAdoption, adoptedBy: 'bad identity!' }) as unknown as typeof chain.cellAdoption,
  }, 'SCALING'), /invalid adopter identity/);
  // A cell plan that does not digest-match the operator adoption is refused — even a
  // structurally valid sibling with identical counts.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), { ...chain, cellPlan: singleCellPlan() }, 'SCALING'),
    /does not match the operator adoption record/);
  // A stale operator adoption (older than maxAdoptionAgeMs = 300s) and a
  // future-dated one are both refused.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), mkChain('SCALING', { adoptedAtMs: NOW - 400_000 }), 'SCALING'),
    /stale/);
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), mkChain('SCALING', { adoptedAtMs: NOW + 140_000 }), 'SCALING'),
    /stale/);
  // An unfrozen cell plan and an unfrozen event-plane plan are refused.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(),
    { ...chain, cellPlan: { ...chain.cellPlan } as RegionalCellPlacementPlan }, 'SCALING'),
    /frozen REGIONAL_CELL_PLACEMENT_PLAN/);
  assert.throws(() => adoptChain(new InstructionAdoptionGate(),
    { ...chain, plane: { ...chain.plane } as DistributedEventPlanePlan }, 'SCALING'),
    /frozen DISTRIBUTED_EVENT_PLANE_PLAN/);
  // A presented binding that the gate cannot re-derive (tampered stream count) is refused.
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), {
    ...chain, cellBinding: Object.freeze({ ...chain.binding, streamCount: 99 }) as unknown as typeof chain.binding,
  }, 'SCALING'), /does not match the re-derived binding/);
  // So is a binding from a DIFFERENT lineage (single-cell posture vs multi-cell chain).
  const wrongLineageAdoption = adoptCellPlacementOperatively(singleCellPlan(), {
    operatorReceiptSha256: ADOPT_RECEIPT, adoptedBy: 'ceo', adoptedAtMs: NOW + 40_000,
  });
  const wrongBinding = bindEventPlaneToAdoptedCells(planeOver(1), wrongLineageAdoption, singleCellPlan());
  assert.throws(() => adoptChain(new InstructionAdoptionGate(), { ...chain, cellBinding: wrongBinding }, 'SCALING'),
    /does not match the re-derived binding/);
});

test('12d-222 one adoption per instruction lineage: replay is refused on the same gate (process-local, disclosed)', () => {
  const gate = new InstructionAdoptionGate();
  const chain = mkChain('SCALING');
  adoptChain(gate, chain, 'SCALING');
  assert.throws(() => adoptChain(gate, chain, 'SCALING'), /replay refused/);
  // A FAILOVER lineage is a different key and still adopts on the same gate instance.
  const other = mkChain('FAILOVER');
  const failoverRecord = adoptChain(gate, other, 'FAILOVER');
  assert.equal(failoverRecord.kind, 'INSTRUCTION_ADOPTION_RECORD');
});

test('12d-222 honest flags and guardrails: the adoption record executes and authorizes nothing', () => {
  const gate = new InstructionAdoptionGate();
  const chain = mkChain('SCALING');
  const record = adoptChain(gate, chain, 'SCALING');
  assert.equal(record.trafficMoved, false);
  assert.equal(record.authorizedTrafficBps, 0);
  assert.equal(record.executionStarted, false);
  assert.equal(record.productionMutationAllowed, false);
  assert.equal(record.realCellsProvisioned, 0);
  assert.equal(record.humanDecision, 'REQUIRED');
  assert.equal(record.learningPromoted, false);
  assert.equal(record.modelCalls, 0);
  assert.equal(record.remoteCalls, 0);
  assert.equal(record.billionUsersProven, false);
  assert.equal(record.automaticRecovery, false);
  assert.equal(record.guardrails, INSTRUCTION_ADOPTION_GUARDRAILS);
  assert.equal(Object.isFrozen(INSTRUCTION_ADOPTION_GUARDRAILS), true);
  assert.equal(Object.isFrozen(INSTRUCTION_ADOPTION_POLICY), true);
  assert.equal(INSTRUCTION_ADOPTION_GUARDRAILS.everyPresentedPacketIsUntrusted, true);
  assert.equal(INSTRUCTION_ADOPTION_GUARDRAILS.theWholeChainIsRecomposedNeverTrusted, true);
  assert.equal(INSTRUCTION_ADOPTION_GUARDRAILS.trailEvidenceIsStructuredNotSubstringProbed, true);
  assert.equal(INSTRUCTION_ADOPTION_GUARDRAILS.approvalIsBoundToTheCanonicalApprovalDetailAndItsApprover, true);
  assert.equal(INSTRUCTION_ADOPTION_GUARDRAILS.presentedBindingsMustMatchReDerivedBindings, true);
  assert.equal(INSTRUCTION_ADOPTION_GUARDRAILS.wildcardScopeIsRefused, true);
  assert.equal(INSTRUCTION_ADOPTION_GUARDRAILS.storyIdCarriesNoUpstreamLineageEvidence, true);
  assert.equal(INSTRUCTION_ADOPTION_GUARDRAILS.replayProtectionIsProcessLocalNotDurable, true);
  assert.equal(INSTRUCTION_ADOPTION_GUARDRAILS.executesNothing, true);
  assert.equal(INSTRUCTION_ADOPTION_GUARDRAILS.authorizesNoProductionAuthority, true);
  assert.equal(INSTRUCTION_ADOPTION_GUARDRAILS.automaticRecovery, false);
  assert.equal(INSTRUCTION_ADOPTION_GUARDRAILS.humanDecision, 'REQUIRED');
  // The chain beneath is untouched: the composing placement still binds its own
  // content digest, and the measured 2,000,000-row per-database ceiling stands (12D-103).
  assert.equal(CELL_PLACEMENT_ADAPTER_GUARDRAILS.bindsThePlanContentNotJustItsCounts, true);
  assert.equal(PARTITION_POLICY.maxRowsPerShard, 2_000_000);
  // The gate verifies the presented workflow trail before anything else.
  assert.equal((() => { verifyAuditChain(chain.issued.workflow as DecisionSafetyWorkflow); return true; })(), true);
});