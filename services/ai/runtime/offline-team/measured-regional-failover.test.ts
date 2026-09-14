import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  planMeasuredRegionalFailover, deriveFailoverPolicyDigest, recordFailoverDecision,
  type FailoverCapacityEvidence, type FailoverRequest,
  type MeasuredFailoverPolicy, type MeasuredFailoverPlan,
} from './measured-regional-failover';

const NOW = 1757700000000;

type EvidenceOverrides = Partial<FailoverCapacityEvidence>;
type PolicyOverrides = Partial<MeasuredFailoverPolicy>;
type RequestOverrides = Partial<FailoverRequest>;

const mkEvidence = (over: EvidenceOverrides = {}): FailoverCapacityEvidence => ({
  regionId: 'aws-us-west-2',
  provider: 'AWS',
  failureDomain: 'aws-us-west-2a',
  observedAtMs: NOW - 30_000,
  measuredRequestsPerSecond: 1200,
  measuredConcurrentRequests: 400,
  p95LatencyMs: 180,
  errorRateBps: 12,
  availableHeadroomBps: 4000,
  admissionEligible: true,
  providerInvocationAuthorized: false,
  productionScaleProven: false,
  ...over,
});

const mkPrimary = (over: EvidenceOverrides = {}): FailoverCapacityEvidence =>
  mkEvidence({
    regionId: 'aws-us-east-1',
    provider: 'AWS',
    failureDomain: 'aws-us-east-1a',
    admissionEligible: false,
    ...over,
  });

const mkPolicy = (over: PolicyOverrides = {}): MeasuredFailoverPolicy => ({
  maxCanaryTrafficBps: 500,
  maxEvidenceSkewMs: 60_000,
  maxEvidenceAgeMs: 3_600_000,
  allowedRegionPairs: [
    { primaryRegionId: 'aws-us-east-1', secondaryRegionId: 'aws-us-west-2' },
  ],
  ...over,
});

const mkRequest = (over: RequestOverrides = {}): FailoverRequest => ({
  tenantId: 'tenant.alpha',
  universeId: 'universe.alpha-main',
  requestId: 'failover.req-0001',
  sourceCommit: 'a'.repeat(40),
  failoverPolicyDigest: deriveFailoverPolicyDigest(mkPolicy()),
  virtualShard: 42,
  dataClass: 'INTERNAL',
  primaryRegionId: 'aws-us-east-1',
  primaryFailureDomain: 'aws-us-east-1a',
  requestedTrafficBps: 300,
  reason: 'PRIMARY_UNHEALTHY',
  ...over,
});

const plan = (over: {
  policy?: PolicyOverrides; request?: RequestOverrides; now?: number;
  primary?: FailoverCapacityEvidence | null; secondary?: FailoverCapacityEvidence | null;
} = {}): MeasuredFailoverPlan => {
  const policy = mkPolicy(over.policy);
  const requestOverrides = over.request ?? {};
  return planMeasuredRegionalFailover(
    policy,
    mkRequest({
      ...requestOverrides,
      failoverPolicyDigest: requestOverrides.failoverPolicyDigest ?? deriveFailoverPolicyDigest(policy),
    }),
    over.now ?? NOW,
    over.primary === undefined ? mkPrimary() : over.primary,
    over.secondary === undefined ? mkEvidence() : over.secondary,
  );
};

const eligible = (p: MeasuredFailoverPlan): Extract<MeasuredFailoverPlan, { disposition: 'HUMAN_APPROVAL_REQUIRED' }> =>
  p as Extract<MeasuredFailoverPlan, { disposition: 'HUMAN_APPROVAL_REQUIRED' }>;

test('every plan path is honest: nothing moves, nothing is authorized, approval is required', () => {
  for (const p of [
    plan(),
    plan({ primary: mkPrimary({ admissionEligible: true }) }),
    plan({ primary: null }),
    plan({ policy: { maxCanaryTrafficBps: 1 }, request: { requestedTrafficBps: 2 } }),
  ]) {
    assert.equal(p.kind, 'MEASURED_FAILOVER_PLAN');
    assert.equal(Object.isFrozen(p), true);
    assert.equal(p.providerInvocationAuthorized, false);
    assert.equal(p.trafficMoved, false);
    assert.equal(p.automaticRecovery, false);
    assert.equal(p.productionScaleProven, false);
    assert.equal(p.humanApprovalRequired, true);
    assert.equal(p.learningPromoted, false);
    assert.equal(p.modelCalls, 0);
    assert.equal(p.remoteCalls, 0);
    assert.equal(p.billionUsersProven, false);
    assert.equal(p.authorizedTrafficBps, 0);
  }
  // The eligible packet freezes its measured sub-structure too.
  const p = eligible(plan());
  assert.equal(Object.isFrozen(p.measuredSecondary), true);
});

test('classified workloads never fail over — denied to the local plane before any evidence is examined', () => {
  for (const dataClass of ['CONFIDENTIAL', 'TOP_SECRET'] as const) {
    // Null, malformed, and mismatched evidence cannot even change the disposition.
    const p = plan({ request: { dataClass }, primary: null, secondary: null });
    assert.equal(p.disposition, 'OFFLINE_LOCAL_REQUIRED');
    assert.equal(p.reason, 'CLASSIFIED_FAILOVER_DENIED');
    assert.equal(p.candidateRegionId, null);
    assert.equal(p.authorizedTrafficBps, 0);
    assert.equal(plan({ request: { dataClass }, primary: { garbage: true } as unknown as FailoverCapacityEvidence }).disposition,
      'OFFLINE_LOCAL_REQUIRED');
  }
});

test('classified denial precedes evidence validation but policy/request validation still throws', () => {
  assert.throws(() => planMeasuredRegionalFailover(
    { maxCanaryTrafficBps: 999_999 } as unknown as MeasuredFailoverPolicy,
    mkRequest({ dataClass: 'CONFIDENTIAL' }), NOW, mkPrimary(), mkEvidence(),
  ), /invalid failover policy/);
  assert.throws(() => plan({ request: { sourceCommit: 'nope' }, primary: null }), /invalid failover request or policy/);
  assert.throws(() => plan({ now: Number.NaN }), /reference time invalid/);
});

test('failover requires verified primary evidence — absence is denied, never planned on', () => {
  const p = plan({ primary: null });
  assert.equal(p.disposition, 'DENIED');
  assert.equal((p as Extract<MeasuredFailoverPlan, { disposition: 'DENIED' }>).reason, 'PRIMARY_EVIDENCE_REQUIRED');
});

test('stale evidence is denied, never planned on', () => {
  const p = plan({ policy: { maxEvidenceAgeMs: 60_000 }, primary: mkPrimary({ observedAtMs: NOW - 60_001 }) });
  assert.equal(p.disposition, 'DENIED');
  assert.equal((p as Extract<MeasuredFailoverPlan, { disposition: 'DENIED' }>).reason, 'PRIMARY_EVIDENCE_STALE');
  const s = plan({ policy: { maxEvidenceAgeMs: 60_000 }, secondary: mkEvidence({ observedAtMs: NOW - 60_001 }) });
  assert.equal(s.disposition, 'DENIED');
  assert.equal((s as Extract<MeasuredFailoverPlan, { disposition: 'DENIED' }>).reason, 'SECONDARY_EVIDENCE_STALE');
  // A stale-evidence request cannot be smuggled to the eligible path by a stale
  // PRIMARY either: the primary is checked first.
  const both = plan({
    policy: { maxEvidenceAgeMs: 60_000 },
    primary: mkPrimary({ observedAtMs: NOW - 1_000 }),
    secondary: mkEvidence({ observedAtMs: NOW - 60_001 }),
  });
  assert.equal((both as Extract<MeasuredFailoverPlan, { disposition: 'DENIED' }>).reason, 'SECONDARY_EVIDENCE_STALE');
});

test('the failover policy digest RE-DERIVES from the declared policy — foreign digests fail closed', () => {
  assert.throws(() => plan({ request: { failoverPolicyDigest: 'b'.repeat(64) } }), /invalid failover request or policy/);
  assert.throws(() => plan({ request: { failoverPolicyDigest: 'nope' } }), /invalid failover request or policy/);
  // Pair-list order does not change the digest; pair CONTENT does.
  assert.equal(deriveFailoverPolicyDigest(mkPolicy({
    allowedRegionPairs: [
      { primaryRegionId: 'aws-us-west-2', secondaryRegionId: 'aws-us-east-1' },
      { primaryRegionId: 'aws-us-east-1', secondaryRegionId: 'aws-us-west-2' },
    ],
  })), deriveFailoverPolicyDigest(mkPolicy({
    allowedRegionPairs: [
      { primaryRegionId: 'aws-us-east-1', secondaryRegionId: 'aws-us-west-2' },
      { primaryRegionId: 'aws-us-west-2', secondaryRegionId: 'aws-us-east-1' },
    ],
  })));
  assert.notEqual(deriveFailoverPolicyDigest(mkPolicy({ maxCanaryTrafficBps: 2500 })),
    deriveFailoverPolicyDigest(mkPolicy({ maxCanaryTrafficBps: 500 })));
  // A plan under a DIFFERENT effective policy therefore cannot share a digest.
  const policyB = mkPolicy({ maxCanaryTrafficBps: 2500 });
  assert.notEqual(eligible(plan({
    policy: { maxCanaryTrafficBps: 2500 },
    request: { failoverPolicyDigest: deriveFailoverPolicyDigest(policyB) },
  })).planDigest, eligible(plan()).planDigest);
});

test('the happy path proposes a bounded, digest-bound canary — and authorizes zero bps', () => {
  const p = eligible(plan());
  assert.equal(p.disposition, 'HUMAN_APPROVAL_REQUIRED');
  assert.equal(p.reason, 'MEASURED_SECONDARY_CANDIDATE');
  assert.equal(p.candidateRegionId, 'aws-us-west-2');
  assert.equal(p.candidateProvider, 'AWS');
  assert.equal(p.candidateFailureDomain, 'aws-us-west-2a');
  assert.equal(p.authorizedTrafficBps, 0);
  assert.equal(p.requestedTrafficBps, 300);
  assert.match(p.planDigest, /^[0-9a-f]{64}$/);
  assert.deepEqual({ ...p.measuredSecondary }, {
    observedAtMs: NOW - 30_000, p95LatencyMs: 180, errorRateBps: 12, availableHeadroomBps: 4000,
  });
  assert.equal(p.primaryEvidenceObservedAtMs, NOW - 30_000);
  const again = eligible(plan());
  assert.equal(again.planDigest, p.planDigest, 'the plan digest is deterministic');
});

test('the plan digest binds the measured evidence — no digest escape (12D-125 lesson, one rung higher)', () => {
  const base = eligible(plan());
  // Each single-variable change to the MEASURED evidence changes the digest.
  for (const over of [
    { p95LatencyMs: 999 },
    { errorRateBps: 999 },
    { availableHeadroomBps: 999 },
    { observedAtMs: NOW - 29_999 },
    { provider: 'AZURE' as const },
    { failureDomain: 'aws-us-west-2b' },
  ]) {
    assert.notEqual(eligible(plan({ secondary: mkEvidence(over) })).planDigest, base.planDigest,
      `a change to ${Object.keys(over)[0]} changes the plan digest`);
  }
  // And each single-variable change to the request.
  for (const [field, value] of [
    ['tenantId', 'tenant.other'], ['universeId', 'universe.other'], ['requestId', 'failover.req-0002'],
    ['sourceCommit', 'b'.repeat(40)], ['virtualShard', 43], ['dataClass', 'PUBLIC' as const],
    ['reason', 'PRIMARY_UNAVAILABLE' as const], ['requestedTrafficBps', 299],
  ] as Array<[keyof FailoverRequest, FailoverRequest[keyof FailoverRequest]]>) {
    assert.notEqual(eligible(plan({ request: { [field]: value } as RequestOverrides })).planDigest, base.planDigest);
  }
  // The primary's ineligibility evidence is bound too.
  assert.notEqual(eligible(plan({ primary: mkPrimary({ observedAtMs: NOW - 20_000 }) })).planDigest, base.planDigest);
});

test('primary evidence identity is tamper-evident — a substituted region or domain throws', () => {
  assert.throws(() => plan({ primary: mkPrimary({ regionId: 'aws-eu-west-1' }) }), /primary capacity identity mismatch/);
  assert.throws(() => plan({ primary: mkPrimary({ failureDomain: 'aws-us-east-1c' }) }), /primary capacity identity mismatch/);
});

test('a still-eligible primary means no failover', () => {
  const p = plan({ primary: mkPrimary({ admissionEligible: true }) });
  assert.equal(p.disposition, 'NO_FAILOVER_REQUIRED');
  assert.equal(p.reason, 'PRIMARY_STILL_ELIGIBLE');
  assert.equal(p.candidateRegionId, null);
});

test('the canary ceiling is enforced', () => {
  const p = plan({ request: { requestedTrafficBps: 501 } });
  assert.equal(p.disposition, 'DENIED');
  assert.equal((p as Extract<MeasuredFailoverPlan, { disposition: 'DENIED' }>).reason, 'CANARY_LIMIT_EXCEEDED');
  assert.equal(eligible(plan({ request: { requestedTrafficBps: 500 } })).requestedTrafficBps, 500);
});

test('a healthy, independently fault-isolated, allowlisted secondary is required', () => {
  for (const [secondary, reason] of [
    [null, 'HEALTHY_SECONDARY_EVIDENCE_REQUIRED'],
    [mkEvidence({ admissionEligible: false }), 'HEALTHY_SECONDARY_EVIDENCE_REQUIRED'],
    [mkEvidence({ regionId: 'aws-us-east-1' }), 'INDEPENDENT_FAILURE_DOMAIN_REQUIRED'],
    [mkEvidence({ failureDomain: 'aws-us-east-1a' }), 'INDEPENDENT_FAILURE_DOMAIN_REQUIRED'],
    [mkEvidence({ regionId: 'aws-us-west-1' }), 'REGION_PAIR_NOT_ALLOWED'],
  ] as Array<[FailoverCapacityEvidence | null, string]>) {
    const p = plan({ secondary });
    assert.equal(p.disposition, 'DENIED');
    assert.equal((p as Extract<MeasuredFailoverPlan, { disposition: 'DENIED' }>).reason, reason);
  }
});

test('both evidences must come from the same measurement window — and NaN can no longer bypass it', () => {
  const p = plan({
    primary: mkPrimary({ observedAtMs: NOW - 30_000 }),
    secondary: mkEvidence({ observedAtMs: NOW - 120_000 }),
  });
  assert.equal(p.disposition, 'DENIED');
  assert.equal((p as Extract<MeasuredFailoverPlan, { disposition: 'DENIED' }>).reason, 'CAPACITY_EVIDENCE_WINDOW_MISMATCH');
  // REGRESSION (BLOCKING): the original contract evaluated
  // Math.abs(NaN - x) > maxSkew → false and PLANNED the failover on a NaN timestamp.
  // The evidence shape gate now throws before any window compare can be bypassed.
  assert.throws(() => plan({ secondary: mkEvidence({ observedAtMs: Number.NaN }) }), /secondary observation timestamp invalid/);
  assert.throws(() => plan({ primary: mkPrimary({ observedAtMs: undefined }) as unknown as FailoverCapacityEvidence }),
    /primary observation timestamp invalid/);
  assert.throws(() => plan({ secondary: mkEvidence({ observedAtMs: NOW - 0.5 }) }), /secondary observation timestamp invalid/);
});

test('capacity evidence is exactly-shaped and fail-closed — no undeclared fields, no negative or NaN measurements', () => {
  // Undeclared extra field on the evidence (the digest-escape family).
  assert.throws(() => plan({ secondary: mkEvidence({ scoreFromLiveDatabase: 'prod-primary' } as EvidenceOverrides) as unknown as FailoverCapacityEvidence }),
    /secondary capacity evidence carries undeclared fields/);
  assert.throws(() => plan({ primary: mkPrimary({ basisSource: 'smuggled' } as EvidenceOverrides) as unknown as FailoverCapacityEvidence }),
    /primary capacity evidence carries undeclared fields/);
  // A MISSING declared key fails the exact-shape gate.
  const { p95LatencyMs: _missing, ...missingKey } = mkEvidence();
  assert.throws(() => plan({ secondary: missingKey as unknown as FailoverCapacityEvidence }),
    /secondary capacity evidence carries undeclared fields/);
  // Measurements must be finite non-negative safe integers.
  for (const over of [
    { p95LatencyMs: -1 }, { p95LatencyMs: Number.NaN }, { errorRateBps: -1 },
    { availableHeadroomBps: Number.NaN }, { measuredRequestsPerSecond: -0.5 },
    { measuredConcurrentRequests: Number.POSITIVE_INFINITY },
  ] as EvidenceOverrides[]) {
    assert.throws(() => plan({ secondary: mkEvidence(over) }), /must be a non-negative safe integer/);
  }
  // Identity fields and provider.
  assert.throws(() => plan({ secondary: mkEvidence({ regionId: 'bad region!' }) }), /secondary region identity invalid/);
  assert.throws(() => plan({ secondary: mkEvidence({ provider: 'EVIL_CLOUD' as 'AWS' }) }), /secondary provider unknown/);
  assert.throws(() => plan({ secondary: mkEvidence({ failureDomain: '' }) }), /secondary failure domain invalid/);
  // Evidence can never carry authorization or scale claims.
  assert.throws(() => plan({ secondary: mkEvidence({ providerInvocationAuthorized: true as false }) }),
    /provider-authorization claim/);
  assert.throws(() => plan({ secondary: mkEvidence({ productionScaleProven: true as false }) }),
    /proven production scale/);
  assert.throws(() => plan({ secondary: mkEvidence({ admissionEligible: 'true' as unknown as boolean }) }),
    /declared boolean/);
});

test('policy and request shapes are exactly-validated; pairs are validated too', () => {
  assert.throws(() => plan({ policy: { extraPolicyField: 1 } as unknown as PolicyOverrides }), /invalid failover policy/);
  assert.throws(() => plan({
    policy: { allowedRegionPairs: [{ primaryRegionId: 'a', secondaryRegionId: 'b', weight: 50 }] as never },
  }), /invalid failover policy/);
  assert.throws(() => plan({
    policy: { allowedRegionPairs: [{ primaryRegionId: '', secondaryRegionId: 'b' }] as never },
  }), /invalid failover policy/);
  assert.throws(() => plan({ request: { smuggled: 'field' } as unknown as RequestOverrides }),
    /invalid failover request or policy/);
  // maxEvidenceAgeMs is bounded.
  assert.throws(() => plan({ policy: { maxEvidenceAgeMs: 0 } }), /invalid failover policy/);
  assert.throws(() => plan({ policy: { maxEvidenceAgeMs: 86_400_001 } }), /invalid failover policy/);
});

test('recordFailoverDecision is receipt-gated; every record requires a 12D-121 workflow before ANY action and moves nothing', () => {
  const p = eligible(plan());
  // Malformed or missing receipts fail closed.
  for (const bad of ['', 'zz', 'A'.repeat(64), 'a'.repeat(63), 'a'.repeat(65)]) {
    assert.throws(() => recordFailoverDecision(p, {
      decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
      operatorReceiptSha256: bad, decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
    }), /operator receipt/);
  }
  // Unknown decisions fail closed.
  assert.throws(() => recordFailoverDecision(p, {
    decision: 'AUTO_EXECUTED' as 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: 'a'.repeat(64), decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  }), /decision unknown/);
  // Invalid decider identity or timestamp fails closed.
  assert.throws(() => recordFailoverDecision(p, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: 'a'.repeat(64), decidedBy: 'ceo dev', decidedAtMs: NOW + 60_000,
  }), /decider identity/);
  assert.throws(() => recordFailoverDecision(p, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: 'a'.repeat(64), decidedBy: 'ceo', decidedAtMs: 0,
  }), /decision timestamp/);
  // A decision cannot chronologically predate the capacity evidence it responds to.
  assert.throws(() => recordFailoverDecision(p, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: 'a'.repeat(64), decidedBy: 'ceo', decidedAtMs: NOW - 60_000,
  }), /predates the capacity evidence/);
  assert.throws(() => recordFailoverDecision(p, {
    decision: 'DECLINED_BY_HUMAN',
    operatorReceiptSha256: 'a'.repeat(64), decidedBy: 'ceo', decidedAtMs: NOW - 30_001,
  }), /predates the capacity evidence/);
  // The accepted record REQUIRES a 12D-121 workflow before any action — a requirement
  // on the record, never a past-tense claim that any routing happened.
  const accepted = recordFailoverDecision(p, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: 'a'.repeat(64), decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  });
  assert.equal(accepted.kind, 'FAILOVER_DECISION_RECORD');
  assert.equal(accepted.planDigest, p.planDigest);
  assert.equal(accepted.candidateRegionId, 'aws-us-west-2');
  assert.equal(accepted.requestedTrafficBps, 300);
  assert.equal(accepted.requiresDecisionSafetyWorkflowBeforeAnyAction, true);
  assert.equal(accepted.executedByThisRuntime, false);
  assert.equal(accepted.productionExecutionAllowed, false);
  assert.equal(accepted.authorizedTrafficBps, 0);
  assert.equal(accepted.trafficMoved, false);
  assert.equal(accepted.humanDecision, 'REQUIRED');
  assert.equal(accepted.learningPromoted, false);
  assert.equal(accepted.modelCalls, 0);
  assert.equal(accepted.remoteCalls, 0);
  assert.equal(accepted.automaticRecovery, false);
  assert.equal(accepted.billionUsersProven, false);
  assert.equal(Object.isFrozen(accepted), true);
  // A DECLINE is recorded verbatim, same governance shape.
  const declined = recordFailoverDecision(p, {
    decision: 'DECLINED_BY_HUMAN',
    operatorReceiptSha256: 'a'.repeat(64), decidedBy: 'ceo', decidedAtMs: NOW + 60_001,
  });
  assert.equal(declined.decision, 'DECLINED_BY_HUMAN');
  assert.equal(declined.requiresDecisionSafetyWorkflowBeforeAnyAction, true);
  assert.equal(declined.authorizedTrafficBps, 0);
  // ONLY an eligible plan can be decided — denied packets are final states, not
  // decision points, and "approving" one would manufacture authorization.
  const denied = plan({ secondary: null });
  assert.throws(() => recordFailoverDecision(denied, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: 'a'.repeat(64), decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  }), /only an eligible HUMAN_APPROVAL_REQUIRED plan/);
  const noFailover = plan({ primary: mkPrimary({ admissionEligible: true }) });
  assert.throws(() => recordFailoverDecision(noFailover, {
    decision: 'DECLINED_BY_HUMAN',
    operatorReceiptSha256: 'a'.repeat(64), decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  }), /only an eligible HUMAN_APPROVAL_REQUIRED plan/);
  const classified = plan({ request: { dataClass: 'TOP_SECRET' }, primary: null, secondary: null });
  assert.throws(() => recordFailoverDecision(classified, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: 'a'.repeat(64), decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  }), /only an eligible HUMAN_APPROVAL_REQUIRED plan/);
  // A decision against a tampered (unfrozen) plan fails closed first.
  assert.throws(() => recordFailoverDecision({ ...p } as unknown as MeasuredFailoverPlan, {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW',
    operatorReceiptSha256: 'a'.repeat(64), decidedBy: 'ceo', decidedAtMs: NOW + 60_000,
  }), /not a frozen MEASURED_FAILOVER_PLAN/);
});