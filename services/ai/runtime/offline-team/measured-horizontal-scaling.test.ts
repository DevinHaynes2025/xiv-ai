import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  planMeasuredHorizontalScaling, deriveScalingPolicyDigest, recordScalingDecision,
  MEASURED_SCALING_CONSTANTS,
  type DatabaseCapacityEvidence, type ScalingPolicy, type ScalingRequest,
  type MeasuredScalingPlan,
} from './measured-horizontal-scaling';

const NOW = 1757700000000;
const RECEIPT = 'a'.repeat(64);

type EvidenceOverrides = Partial<DatabaseCapacityEvidence>;
type PolicyOverrides = Partial<ScalingPolicy>;
type RequestOverrides = Partial<ScalingRequest>;

const mkEvidence = (over: EvidenceOverrides = {}): DatabaseCapacityEvidence => ({
  databaseId: 'db.alpha-01',
  observedAtMs: NOW - 30_000,
  rowCount: 1_600_000,
  growthRowsPerDay: 2_000,
  providerInvocationAuthorized: false,
  productionScaleProven: false,
  ...over,
});

const mkPolicy = (over: PolicyOverrides = {}): ScalingPolicy => ({
  scaleOutTargetPercent: 80,
  horizonDays: 30,
  maxEvidenceAgeMs: 3_600_000,
  maxNewDatabasesPerPlan: 4,
  ...over,
});

const mkRequest = (over: RequestOverrides = {}): ScalingRequest => ({
  tenantId: 'tenant.alpha',
  universeId: 'universe.alpha-main',
  requestId: 'scaling.req-0001',
  sourceCommit: 'a'.repeat(40),
  scalingPolicyDigest: deriveScalingPolicyDigest(mkPolicy()),
  fleetDatabaseIds: ['db.alpha-01', 'db.alpha-02'],
  ...over,
});

const mkProvenance = (over: {
  policy?: PolicyOverrides; request?: RequestOverrides; now?: number;
  evidence?: DatabaseCapacityEvidence[];
} = {}) => {
  const policy = mkPolicy(over.policy);
  return {
    policy,
    request: mkRequest({
      ...over.request,
      scalingPolicyDigest: over.request?.scalingPolicyDigest ?? deriveScalingPolicyDigest(policy),
    }),
    nowMs: over.now ?? NOW,
    evidence: over.evidence ?? [mkEvidence(), mkEvidence({ databaseId: 'db.alpha-02' })],
  };
};

const plan = (over: {
  policy?: PolicyOverrides; request?: RequestOverrides; now?: number;
  evidence?: DatabaseCapacityEvidence[];
} = {}): MeasuredScalingPlan => {
  const v = mkProvenance(over);
  return planMeasuredHorizontalScaling(v.policy, v.request, v.nowMs, v.evidence);
};

const eligible = (p: MeasuredScalingPlan): Extract<MeasuredScalingPlan, { disposition: 'HUMAN_APPROVAL_REQUIRED' }> =>
  p as Extract<MeasuredScalingPlan, { disposition: 'HUMAN_APPROVAL_REQUIRED' }>;

const denied = (p: MeasuredScalingPlan): Extract<MeasuredScalingPlan, { disposition: 'DENIED' }> =>
  p as Extract<MeasuredScalingPlan, { disposition: 'DENIED' }>;

test('every plan path is honest: nothing is provisioned, nothing authorized, approval required', () => {
  for (const p of [
    plan(),
    plan({ request: { fleetDatabaseIds: ['db.alpha-01'] }, evidence: [mkEvidence({ rowCount: 100_000 })] }),
    plan({ request: { fleetDatabaseIds: ['db.alpha-01'] }, evidence: [] }),
    plan({ policy: { scaleOutTargetPercent: 1 } }),
  ]) {
    assert.equal(p.kind, 'MEASURED_SCALING_PLAN');
    assert.equal(Object.isFrozen(p), true);
    assert.equal(p.measuredCeilingRowsPerDatabase, 2_000_000);
    assert.equal(p.providerInvocationAuthorized, false);
    assert.equal(p.databasesProvisioned, 0);
    assert.equal(p.automaticRecovery, false);
    assert.equal(p.productionScaleProven, false);
    assert.equal(p.humanApprovalRequired, true);
    assert.equal(p.learningPromoted, false);
    assert.equal(p.modelCalls, 0);
    assert.equal(p.remoteCalls, 0);
    assert.equal(p.billionUsersProven, false);
  }
});

test('the policy digest RE-DERIVES from the declared policy — foreign digests fail closed', () => {
  assert.throws(() => plan({ request: { scalingPolicyDigest: 'b'.repeat(64) } }), /invalid scaling request or policy/);
  assert.throws(() => plan({ request: { scalingPolicyDigest: 'nope' } }), /invalid scaling request or policy/);
  assert.notEqual(deriveScalingPolicyDigest(mkPolicy({ scaleOutTargetPercent: 99 })),
    deriveScalingPolicyDigest(mkPolicy({ scaleOutTargetPercent: 80 })));
  // A plan under a DIFFERENT effective policy therefore cannot share a digest.
  assert.notEqual(
    eligible(plan({ policy: { scaleOutTargetPercent: 90 } })).planDigest,
    eligible(plan()).planDigest,
  );
});

test('the proposal is exact arithmetic: the smallest K keeping utilization at or below the target', () => {
  // Two databases at 1.6M rows, +2,000 rows/day, 30-day horizon → 1.66M each,
  // aggregate 3.32M. Target 80% of 2M/db: required fleet = ceil(332M / 1.6M) = 208? No:
  // ceil(3_320_000*100 / (2_000_000*80)) = ceil(332_000_000/160_000_000) = ceil(2.075) = 3
  // → K = 3 - 2 = 1 new database; post-plan utilization = ceil(332/ (3*2M)*100) = 56%.
  const p = eligible(plan());
  assert.equal(p.proposedNewDatabaseCount, 1);
  assert.equal(p.postPlanFleetDatabaseCount, 3);
  assert.equal(p.projectedAggregateRows, 3_320_000);
  assert.equal(p.projectedUtilizationPercent, 56);
  assert.match(p.planDigest, /^[0-9a-f]{64}$/);
  assert.equal(p.fleetProjection.length, 2);
  assert.equal(p.fleetProjection[0]!.projectedRows, 1_660_000);
  assert.equal(p.fleetProjection[1]!.projectedRows, 1_660_000);
  for (const f of p.fleetProjection) assert.equal(Object.isFrozen(f), true);
  // Deterministic.
  assert.equal(eligible(plan()).planDigest, p.planDigest);
});

test('headroom within target means no scale required; the threshold boundary is exact', () => {
  // Aggregate 400k rows, target 80%: required fleet = ceil(40M/160M)=1 → K=0.
  const p = plan({
    request: { fleetDatabaseIds: ['db.alpha-01'] },
    evidence: [mkEvidence({ rowCount: 100_000, growthRowsPerDay: 10_000 })],
  });
  assert.equal(p.disposition, 'NO_SCALE_REQUIRED');
  assert.equal(p.reason, 'HEADROOM_WITHIN_TARGET');
  assert.equal(p.proposedNewDatabaseCount, 0);
  // Exactly AT the target needs no scale: 1.6M projected = 80% of 2M → required = 1.
  const atTarget = plan({
    request: { fleetDatabaseIds: ['db.alpha-01'] },
    evidence: [mkEvidence({ rowCount: 1_600_000, growthRowsPerDay: 0 })],
  });
  assert.equal(atTarget.disposition, 'NO_SCALE_REQUIRED');
  // One row above the exact target requires scale.
  const over = plan({
    request: { fleetDatabaseIds: ['db.alpha-01'] },
    evidence: [mkEvidence({ rowCount: 1_600_001, growthRowsPerDay: 0 })],
  });
  assert.equal(eligible(over).proposedNewDatabaseCount, 1);
});

test('a single database projected past the measured ceiling is DENIED — never masked by aggregate arithmetic', () => {
  // db.alpha-02 projects past 2M; db.alpha-01 is tiny, so AGGREGATE headroom exists —
  // the plan still denies: adding empty databases moves no rows.
  const p = plan({
    evidence: [mkEvidence({ rowCount: 1_000 }), mkEvidence({ databaseId: 'db.alpha-02', rowCount: 1_990_000, growthRowsPerDay: 1_000 })],
  });
  assert.equal(p.disposition, 'DENIED');
  assert.equal(denied(p).reason, 'PER_DATABASE_CEILING_PROJECTED');
  assert.equal(denied(p).detailDatabaseId, 'db.alpha-02');
  // The measured ceiling is not raisable: declared row counts above 2M fail closed.
  assert.throws(() => plan({ evidence: [mkEvidence({ rowCount: 2_000_001 }), mkEvidence({ databaseId: 'db.alpha-02' })] }),
    /within the measured 2,000,000-row ceiling/);
});

test('fleet evidence is required, fresh, and tamper-evident', () => {
  // Missing evidence for a fleet member.
  const missing = plan({ request: { fleetDatabaseIds: ['db.alpha-01', 'db.alpha-02', 'db.alpha-03'] } });
  assert.equal(missing.disposition, 'DENIED');
  assert.equal(denied(missing).reason, 'FLEET_EVIDENCE_REQUIRED');
  assert.equal(denied(missing).detailDatabaseId, 'db.alpha-03');
  // Stale evidence names the database (evidence is 30s old; the bound is 10s).
  const stale = plan({ policy: { maxEvidenceAgeMs: 10_000 } });
  assert.equal(denied(stale).reason, 'EVIDENCE_STALE');
  assert.equal(denied(stale).detailDatabaseId, 'db.alpha-01');
  // Future-dated evidence is an impossible ordering and would never go stale — throws.
  assert.throws(() => plan({
    evidence: [mkEvidence({ observedAtMs: NOW + 60_000 }), mkEvidence({ databaseId: 'db.alpha-02' })],
  }), /dated in the future of the reference time/);
  // Evidence for a database OUTSIDE the declared fleet throws.
  assert.throws(() => plan({ evidence: [mkEvidence(), mkEvidence({ databaseId: 'db.alpha-02' }), mkEvidence({ databaseId: 'db.outsider' })] }),
    /outside the declared fleet/);
  // Duplicate evidence throws.
  assert.throws(() => plan({ evidence: [mkEvidence(), mkEvidence()] }), /duplicate capacity evidence/);
  // Evidence identity mismatches throw.
  assert.throws(() => plan({ evidence: [mkEvidence({ databaseId: 'db.impostor' })] }),
    /outside the declared fleet|FLEET_EVIDENCE|invalid/);
  // A fleet larger than policy throws; duplicate fleet ids throw.
  assert.throws(() => plan({ request: { fleetDatabaseIds: ['db.alpha-01', 'db.alpha-01'] } }), /invalid scaling request or policy/);
  assert.throws(() => plan({
    request: { fleetDatabaseIds: Array.from({ length: 65 }, (_, i) => `db.fleet-${i}`) },
    evidence: Array.from({ length: 65 }, (_, i) => mkEvidence({ databaseId: `db.fleet-${i}` })),
  }), /invalid scaling request or policy/);
});

test('evidence is exactly-shaped and fail-closed — no undeclared fields, no ceiling violations', () => {
  assert.throws(() => plan({ evidence: [mkEvidence({ scoreFromLiveDatabase: 'prod-primary' } as EvidenceOverrides), mkEvidence({ databaseId: 'db.alpha-02' })] }),
    /fleet capacity evidence carries undeclared fields/);
  const { growthRowsPerDay: _missing, ...missingKey } = mkEvidence();
  assert.throws(() => plan({ evidence: [mkEvidence(), missingKey as unknown as DatabaseCapacityEvidence] }),
    /fleet capacity evidence carries undeclared fields/);
  for (const over of [
    { rowCount: -1 }, { rowCount: Number.NaN }, { rowCount: 2_000.5 },
    { growthRowsPerDay: Number.NaN }, { growthRowsPerDay: 2_000_001 },
    { growthRowsPerDay: -2_000_001 },
  ] as EvidenceOverrides[]) {
    assert.throws(() => plan({ evidence: [mkEvidence(over), mkEvidence({ databaseId: 'db.alpha-02' })] }),
      /measured 2,000,000-row ceiling|safe integer/);
  }
  assert.throws(() => plan({ evidence: [mkEvidence({ databaseId: 'bad db!' }), mkEvidence({ databaseId: 'db.alpha-02' })] }),
    /fleet database identity invalid/);
  assert.throws(() => plan({ evidence: [mkEvidence({ observedAtMs: Number.NaN }), mkEvidence({ databaseId: 'db.alpha-02' })] }),
    /fleet observation timestamp invalid/);
  assert.throws(() => plan({ evidence: [mkEvidence({ providerInvocationAuthorized: true as false }), mkEvidence({ databaseId: 'db.alpha-02' })] }),
    /provider-authorization claim/);
  assert.throws(() => plan({ evidence: [mkEvidence({ productionScaleProven: true as false }), mkEvidence({ databaseId: 'db.alpha-02' })] }),
    /proven production scale/);
});

test('the plan digest binds every declared input — no digest escape', () => {
  const base = eligible(plan());
  // Each single-variable change to the fleet evidence changes the digest.
  for (const over of [
    { rowCount: 1_599_999 },
    { growthRowsPerDay: 2_001 },
    { observedAtMs: NOW - 29_999 },
  ] as EvidenceOverrides[]) {
    assert.notEqual(eligible(plan({
      evidence: [mkEvidence(over), mkEvidence({ databaseId: 'db.alpha-02' })],
    })).planDigest, base.planDigest);
  }
  // Each single-variable change to the request.
  for (const [field, value] of [
    ['tenantId', 'tenant.other'], ['universeId', 'universe.other'], ['requestId', 'scaling.req-0002'],
    ['sourceCommit', 'b'.repeat(40)],
  ] as Array<[keyof ScalingRequest, ScalingRequest[keyof ScalingRequest]]>) {
    assert.notEqual(eligible(plan({ request: { [field]: value } as RequestOverrides })).planDigest, base.planDigest);
  }
  // A different fleet or horizon changes the projection and the digest.
  assert.notEqual(eligible(plan({ policy: { horizonDays: 31 } })).planDigest, base.planDigest);
  assert.notEqual(eligible(plan({
    request: { fleetDatabaseIds: ['db.alpha-01'] },
    evidence: [mkEvidence()],
  })).planDigest, base.planDigest);
});

test('scale-out beyond the policy cap is denied; the ceiling denial wins when both apply', () => {
  // Per-database projections blow the ceiling: 1.9M + 30d*1M = 31.6M — the ceiling
  // denial wins over any aggregate consideration, which is the honest priority.
  const p = plan({
    policy: { scaleOutTargetPercent: 10 },
    evidence: [
      mkEvidence({ rowCount: 1_900_000, growthRowsPerDay: 1_000_000 }),
      mkEvidence({ databaseId: 'db.alpha-02', rowCount: 1_900_000, growthRowsPerDay: 1_000_000 }),
    ],
  });
  assert.equal(denied(p).reason, 'PER_DATABASE_CEILING_PROJECTED');
  // A genuine cap case: a FULL fleet (each database AT the ceiling, projections valid)
  // at a 1% target → required fleet = 6400, K = 6400 - 64 = 6336 > any policy cap.
  const fleet = Array.from({ length: 64 }, (_, i) => `db.fleet-${i}`);
  const cap = plan({
    policy: { scaleOutTargetPercent: 1 },
    request: { fleetDatabaseIds: fleet },
    evidence: fleet.map((d) => mkEvidence({
      databaseId: d, rowCount: 2_000_000, growthRowsPerDay: 0,
    })),
  });
  assert.equal(cap.disposition, 'DENIED');
  assert.equal(denied(cap).reason, 'SCALE_OUT_BEYOND_POLICY');
});

test('recordScalingDecision is receipt-gated, provenance-verified, and provisions nothing', () => {
  const p = eligible(plan());
  const goodInput = {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW' as const,
    operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  };
  // Malformed receipts, unknown decisions, bad identity/timestamp.
  for (const bad of ['', 'zz', 'A'.repeat(64), 'a'.repeat(65)])
    assert.throws(() => recordScalingDecision(p, { ...goodInput, operatorReceiptSha256: bad }, mkProvenance()),
      /operator receipt/);
  assert.throws(() => recordScalingDecision(p, { ...goodInput, decision: 'AUTO_EXECUTED' as 'ACCEPTED_FOR_HUMAN_REVIEW' }, mkProvenance()),
    /decision unknown/);
  assert.throws(() => recordScalingDecision(p, { ...goodInput, decidedBy: 'ceo dev' }, mkProvenance()),
    /decider identity/);
  assert.throws(() => recordScalingDecision(p, { ...goodInput, decidedAtMs: 0 }, mkProvenance()),
    /decision timestamp/);
  // A decision predating the evidence is an impossible ordering.
  assert.throws(() => recordScalingDecision(p, { ...goodInput, decidedAtMs: NOW - 60_000 }, mkProvenance()),
    /predates the capacity evidence/);
  // The boundary is the LATEST fleet evidence, not the earliest: a decision made after
  // db.alpha-01's evidence existed but before db.alpha-02's did is deciding on
  // incomplete evidence, and fails closed.
  const asymmetric = plan({
    evidence: [mkEvidence({ observedAtMs: NOW - 100_000 }), mkEvidence({ databaseId: 'db.alpha-02', observedAtMs: NOW - 10_000 })],
  });
  const asymProv = mkProvenance({
    evidence: [mkEvidence({ observedAtMs: NOW - 100_000 }), mkEvidence({ databaseId: 'db.alpha-02', observedAtMs: NOW - 10_000 })],
  });
  assert.throws(() => recordScalingDecision(eligible(asymmetric), {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW', operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: NOW - 50_000,
  }, asymProv), /predates the capacity evidence/);
  // At or after the latest evidence is accepted.
  recordScalingDecision(eligible(asymmetric), {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW', operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: NOW - 10_000,
  }, asymProv);
  // Provenance is REQUIRED and must re-derive exactly.
  assert.throws(() => recordScalingDecision(p, goodInput, undefined as never), /provenance required/);
  assert.throws(() => recordScalingDecision(p, goodInput, mkProvenance({
    evidence: [mkEvidence({ rowCount: 1_599_999 }), mkEvidence({ databaseId: 'db.alpha-02' })],
  })), /does not re-derive/);
  // A forged plan with honest flags and a fabricated digest is refused.
  const forged = { ...p, planDigest: 'f'.repeat(64) };
  assert.throws(() => recordScalingDecision(
    Object.freeze(forged) as unknown as MeasuredScalingPlan, goodInput, mkProvenance(),
  ), /does not re-derive/);
  // Only an eligible plan can be decided.
  assert.throws(() => recordScalingDecision(plan({ evidence: [] }), goodInput, mkProvenance({ evidence: [] })),
    /only an eligible HUMAN_APPROVAL_REQUIRED plan/);
  // The honest path issues a full honest record.
  const accepted = recordScalingDecision(p, goodInput, mkProvenance());
  assert.equal(accepted.kind, 'SCALING_DECISION_RECORD');
  assert.equal(accepted.planDigest, p.planDigest);
  assert.equal(accepted.proposedNewDatabaseCount, 1);
  assert.equal(accepted.requiresDecisionSafetyWorkflowBeforeAnyAction, true);
  assert.equal(accepted.executedByThisRuntime, false);
  assert.equal(accepted.productionExecutionAllowed, false);
  assert.equal(accepted.databasesProvisioned, 0);
  assert.equal(accepted.humanDecision, 'REQUIRED');
  assert.equal(accepted.learningPromoted, false);
  assert.equal(accepted.modelCalls, 0);
  assert.equal(accepted.remoteCalls, 0);
  assert.equal(accepted.automaticRecovery, false);
  assert.equal(accepted.billionUsersProven, false);
  assert.equal(Object.isFrozen(accepted), true);
  // A decline is recorded verbatim, same governance shape.
  const declinedRecord = recordScalingDecision(p, {
    decision: 'DECLINED_BY_HUMAN', operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: NOW + 60_001,
  }, mkProvenance());
  assert.equal(declinedRecord.decision, 'DECLINED_BY_HUMAN');
  assert.equal(declinedRecord.databasesProvisioned, 0);
  // A decision against an unfrozen plan fails closed first.
  assert.throws(() => recordScalingDecision({ ...p } as unknown as MeasuredScalingPlan, goodInput, mkProvenance()),
    /not a frozen MEASURED_SCALING_PLAN/);
});

test('the decision record binds itself: recordDigest covers every recorded field', () => {
  const p = eligible(plan());
  const a = recordScalingDecision(p, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW', operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  }, mkProvenance());
  assert.match(a.recordDigest, /^[0-9a-f]{64}$/);
  // Each single-variable change to the recorded human input changes the digest.
  assert.notEqual(recordScalingDecision(p, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW', operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: NOW + 60_001,
  }, mkProvenance()).recordDigest, a.recordDigest);
  assert.notEqual(recordScalingDecision(p, {
    decision: 'DECLINED_BY_HUMAN', operatorReceiptSha256: RECEIPT, decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  }, mkProvenance()).recordDigest, a.recordDigest);
  assert.notEqual(recordScalingDecision(p, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW', operatorReceiptSha256: 'c'.repeat(64), decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  }, mkProvenance()).recordDigest, a.recordDigest);
  // A post-hoc field swap that keeps the ORIGINAL digest is detectable: a consumer
  // re-derives the record from the swapped inputs and compares digests.
  const tampered = { ...a, decidedBy: 'other' };
  const reDerived = recordScalingDecision(p, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW', operatorReceiptSha256: RECEIPT, decidedBy: 'other', decidedAtMs: NOW + 60_000,
  }, mkProvenance());
  assert.notEqual(reDerived.recordDigest, tampered.recordDigest);
});

test('policy and request shapes are exactly-validated', () => {
  assert.throws(() => plan({ policy: { extraPolicyField: 1 } as unknown as PolicyOverrides }), /invalid scaling policy/);
  assert.throws(() => plan({ policy: { scaleOutTargetPercent: 0 } }), /invalid scaling policy/);
  assert.throws(() => plan({ policy: { scaleOutTargetPercent: 101 } }), /invalid scaling policy/);
  assert.throws(() => plan({ policy: { horizonDays: 0 } }), /invalid scaling policy/);
  assert.throws(() => plan({ policy: { horizonDays: 366 } }), /invalid scaling policy/);
  assert.throws(() => plan({ policy: { maxNewDatabasesPerPlan: 9 } }), /invalid scaling policy/);
  assert.throws(() => plan({ request: { smuggled: 'field' } as unknown as RequestOverrides }),
    /invalid scaling request or policy/);
  assert.throws(() => plan({ now: Number.NaN }), /reference time invalid/);
  assert.equal(MEASURED_SCALING_CONSTANTS.measuredCeilingRowsPerDatabase, 2_000_000);
});