// 12D-129 — Measured horizontal scaling contract (XIV scale ladder: MEASURED HORIZONTAL
// SCALING).
//
// The briefing's scale ladder after MEASURED FAILOVER (12D-126/127/128): horizontal
// scaling that needs its own measured evidence. The ONLY measured number in this
// runtime is the 12D-103 drill ceiling — 2,000,000 rows per database. Every row count
// and growth rate here is DECLARED evidence, never measured by this runtime; the
// projections are sparse logical projections over those declarations, and the packet
// says so.
//
// What this contract is — and is not. It consumes DECLARED per-database capacity
// evidence (row count, declared growth per day) for a tenant's declared database
// fleet, projects each database's rows over a declared horizon, and PROPOSES a
// bounded fleet expansion — the smallest count of additional databases that keeps the
// projected aggregate fleet utilization at or below the policy target — for HUMAN
// approval. It PROVISIONS NOTHING: every path returns `databasesProvisioned: 0`,
// `providerInvocationAuthorized: false`, `automaticRecovery: false`,
// `productionScaleProven: false`, `humanApprovalRequired: true` (structural). A new
// database adds AGGREGATE fleet headroom (it starts empty and absorbs growth); it
// does NOT move existing rows — a single database whose projection exceeds the
// measured ceiling is a data-movement problem, denied here as out of scope
// (`PER_DATABASE_CEILING_PROJECTED`), never masked by aggregate arithmetic.
//
// Digest-binding discipline (the 12D-124→128 lessons, applied at construction): the
// scaling policy digest RE-DERIVES from the declared policy; the plan digest binds
// every declared input — request, policy digest, each fleet database's full evidence
// and projection, and the proposed count; the decision-record boundary RE-COMPOSES
// the plan from its full provenance (request, policy, reference time, evidence array)
// and refuses any plan whose identity does not re-derive — the 12D-128 provenance
// discipline, present from the first version of this contract.

import { createHash } from 'node:crypto';

/** The ONLY measured number in this runtime (12D-103 capacity drill). */
export const MEASURED_SCALING_CONSTANTS = Object.freeze({
  measuredCeilingRowsPerDatabase: 2_000_000,
  maxFleetDatabases: 64,
});

const EVIDENCE_KEYS = Object.freeze([
  'databaseId', 'observedAtMs', 'rowCount', 'growthRowsPerDay',
  'providerInvocationAuthorized', 'productionScaleProven',
]);
const REQUEST_KEYS = Object.freeze([
  'tenantId', 'universeId', 'requestId', 'sourceCommit',
  'scalingPolicyDigest', 'fleetDatabaseIds',
]);
const POLICY_KEYS = Object.freeze([
  'scaleOutTargetPercent', 'horizonDays', 'maxEvidenceAgeMs', 'maxNewDatabasesPerPlan',
]);

const hasExactKeys = (obj: unknown, keys: readonly string[]): boolean =>
  typeof obj === 'object' && obj !== null
  && JSON.stringify(Object.keys(obj).sort()) === JSON.stringify([...keys].sort());

const hex64 = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v);
const id = (v: unknown): v is string =>
  typeof v === 'string' && v.length >= 1 && v.length <= 128
  && /^[A-Za-z0-9][A-Za-z0-9_.:@/-]*$/.test(v);
const commitSha = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{40}$/.test(v);
const sha256 = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');
const safeInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);

export interface DatabaseCapacityEvidence {
  readonly databaseId: string;
  readonly observedAtMs: number;
  /** DECLARED — this runtime never counts rows itself. */
  readonly rowCount: number;
  /** DECLARED growth per day (may be negative — a declining fleet). */
  readonly growthRowsPerDay: number;
  /** Structural: evidence can never carry an authorization claim. */
  readonly providerInvocationAuthorized: false;
  readonly productionScaleProven: false;
}

export interface ScalingRequest {
  readonly tenantId: string;
  readonly universeId: string;
  readonly requestId: string;
  readonly sourceCommit: string;
  /** MUST re-derive from the policy object presented with the request. */
  readonly scalingPolicyDigest: string;
  readonly fleetDatabaseIds: readonly string[];
}

export interface ScalingPolicy {
  /** Post-plan maximum projected utilization percent for the fleet. */
  readonly scaleOutTargetPercent: number;
  /** Projection horizon in days (1..365). */
  readonly horizonDays: number;
  readonly maxEvidenceAgeMs: number;
  readonly maxNewDatabasesPerPlan: number;
}

export type ScalingDenialReason =
  | 'FLEET_EVIDENCE_REQUIRED'
  | 'EVIDENCE_STALE'
  | 'PER_DATABASE_CEILING_PROJECTED'
  | 'SCALE_OUT_BEYOND_POLICY';

interface ScalingPlanBase {
  readonly kind: 'MEASURED_SCALING_PLAN';
  readonly measuredCeilingRowsPerDatabase: 2_000_000;
  readonly providerInvocationAuthorized: false;
  readonly databasesProvisioned: 0;
  readonly automaticRecovery: false;
  readonly productionScaleProven: false;
  readonly humanApprovalRequired: true;
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly billionUsersProven: false;
}

export type MeasuredScalingPlan =
  | (ScalingPlanBase & {
      readonly disposition: 'DENIED';
      readonly reason: ScalingDenialReason;
      readonly detailDatabaseId: string | null;
      readonly proposedNewDatabaseCount: 0;
    })
  | (ScalingPlanBase & {
      readonly disposition: 'NO_SCALE_REQUIRED';
      readonly reason: 'HEADROOM_WITHIN_TARGET';
      readonly detailDatabaseId: null;
      readonly proposedNewDatabaseCount: 0;
    })
  | (ScalingPlanBase & {
      readonly disposition: 'HUMAN_APPROVAL_REQUIRED';
      readonly reason: 'MEASURED_HEADROOM_PROJECTION';
      readonly detailDatabaseId: null;
      readonly proposedNewDatabaseCount: number;
      readonly postPlanFleetDatabaseCount: number;
      readonly projectedAggregateRows: number;
      readonly projectedUtilizationPercent: number;
      readonly planDigest: string;
      readonly fleetProjection: ReadonlyArray<Readonly<{
        databaseId: string;
        observedAtMs: number;
        declaredRowCount: number;
        declaredGrowthRowsPerDay: number;
        projectedRows: number;
      }>>;
    });

/** The scaling policy digest, RE-DERIVED over the declared policy content. */
export const deriveScalingPolicyDigest = (c: ScalingPolicy): string =>
  sha256(JSON.stringify({
    horizonDays: c.horizonDays,
    maxEvidenceAgeMs: c.maxEvidenceAgeMs,
    maxNewDatabasesPerPlan: c.maxNewDatabasesPerPlan,
    scaleOutTargetPercent: c.scaleOutTargetPercent,
  }));

function assertEvidence(e: unknown, label: string): asserts e is DatabaseCapacityEvidence {
  const v = e as DatabaseCapacityEvidence | null;
  if (!hasExactKeys(v, EVIDENCE_KEYS))
    throw new Error(`${label} capacity evidence carries undeclared fields; fail closed`);
  if (!v || !id(v.databaseId))
    throw new Error(`${label} database identity invalid; fail closed`);
  if (!safeInt(v.observedAtMs) || v.observedAtMs <= 0)
    throw new Error(`${label} observation timestamp invalid; fail closed`);
  if (!safeInt(v.rowCount) || v.rowCount < 0
    || v.rowCount > MEASURED_SCALING_CONSTANTS.measuredCeilingRowsPerDatabase)
    throw new Error(`${label} declared row count must be a safe integer within the measured 2,000,000-row ceiling; fail closed`);
  if (!safeInt(v.growthRowsPerDay)
    || v.growthRowsPerDay < -MEASURED_SCALING_CONSTANTS.measuredCeilingRowsPerDatabase
    || v.growthRowsPerDay > MEASURED_SCALING_CONSTANTS.measuredCeilingRowsPerDatabase)
    throw new Error(`${label} declared growth must be a safe integer within ±the measured ceiling; fail closed`);
  if (v.providerInvocationAuthorized !== false)
    throw new Error(`${label} evidence can never carry a provider-authorization claim; fail closed`);
  if (v.productionScaleProven !== false)
    throw new Error(`${label} evidence can never claim proven production scale; fail closed`);
}

const ceilDiv = (a: number, b: number): number => Math.floor((a + b - 1) / b);

/**
 * Plan a measured horizontal scaling step, fail-closed. Pure: reads no clock (the
 * reference time arrives as `nowMs`), makes no model or remote call, provisions
 * nothing, and returns a frozen plan whose eligible packet is digest-bound to the
 * request, the re-derived policy, and every fleet database's full evidence and
 * projection. Per-database ceiling projections are DENIED (data movement is a
 * separate governed plan), never masked by aggregate arithmetic.
 */
export function planMeasuredHorizontalScaling(
  policy: ScalingPolicy,
  request: ScalingRequest,
  nowMs: number,
  evidence: readonly DatabaseCapacityEvidence[],
): MeasuredScalingPlan {
  const c = policy as ScalingPolicy | null;
  const q = request as ScalingRequest | null;
  if (!hasExactKeys(c, POLICY_KEYS)
    || !safeInt(c!.scaleOutTargetPercent) || c!.scaleOutTargetPercent < 1 || c!.scaleOutTargetPercent > 100
    || !safeInt(c!.horizonDays) || c!.horizonDays < 1 || c!.horizonDays > 365
    || !safeInt(c!.maxEvidenceAgeMs) || c!.maxEvidenceAgeMs < 1 || c!.maxEvidenceAgeMs > 86_400_000
    || !safeInt(c!.maxNewDatabasesPerPlan) || c!.maxNewDatabasesPerPlan < 1 || c!.maxNewDatabasesPerPlan > 8)
    throw new Error('invalid scaling policy; fail closed');
  if (!hex64(q!.scalingPolicyDigest)
    || !hasExactKeys(q, REQUEST_KEYS)
    || !id(q!.tenantId) || !id(q!.universeId) || !id(q!.requestId)
    || !commitSha(q!.sourceCommit)
    || q!.scalingPolicyDigest !== deriveScalingPolicyDigest(c!)
    || !Array.isArray(q!.fleetDatabaseIds)
    || q!.fleetDatabaseIds.length < 1
    || q!.fleetDatabaseIds.length > MEASURED_SCALING_CONSTANTS.maxFleetDatabases
    || !q!.fleetDatabaseIds.every((d) => id(d))
    || new Set(q!.fleetDatabaseIds).size !== q!.fleetDatabaseIds.length)
    throw new Error('invalid scaling request or policy; fail closed');
  if (!safeInt(nowMs) || nowMs <= 0)
    throw new Error('scaling reference time invalid; fail closed');
  if (!Array.isArray(evidence) || evidence.length > MEASURED_SCALING_CONSTANTS.maxFleetDatabases)
    throw new Error('invalid capacity evidence; fail closed');

  const base: ScalingPlanBase = {
    kind: 'MEASURED_SCALING_PLAN',
    measuredCeilingRowsPerDatabase: 2_000_000 as const,
    providerInvocationAuthorized: false,
    databasesProvisioned: 0,
    automaticRecovery: false,
    productionScaleProven: false,
    humanApprovalRequired: true,
    learningPromoted: false,
    modelCalls: 0,
    remoteCalls: 0,
    billionUsersProven: false,
  };

  const deny = (reason: ScalingDenialReason, detailDatabaseId: string | null = null): MeasuredScalingPlan =>
    Object.freeze({
      ...base,
      disposition: 'DENIED' as const,
      reason,
      detailDatabaseId,
      proposedNewDatabaseCount: 0 as const,
    });

  // Exact-shape gate on EVERY evidence BEFORE anything is derived from it.
  for (const e of evidence)
    assertEvidence(e, 'fleet');

  // Evidence identity is tamper-evident: evidence for a database outside the declared
  // fleet, duplicates, and gaps all fail closed or deny with a named detail.
  const byId = new Map<string, DatabaseCapacityEvidence>();
  for (const e of evidence) {
    if (byId.has(e.databaseId))
      throw new Error(`duplicate capacity evidence for ${e.databaseId}; fail closed`);
    if (!q!.fleetDatabaseIds.includes(e.databaseId))
      throw new Error('capacity evidence for a database outside the declared fleet; fail closed');
    byId.set(e.databaseId, e);
  }
  for (const databaseId of q!.fleetDatabaseIds) {
    if (!byId.has(databaseId)) return deny('FLEET_EVIDENCE_REQUIRED', databaseId);
    // An observation timestamp in the future of the declared reference time is an
    // impossible ordering (and would otherwise never go stale) — tamper-evident, throw.
    if (byId.get(databaseId)!.observedAtMs > nowMs)
      throw new Error(`capacity evidence for ${databaseId} is dated in the future of the reference time; fail closed`);
    if (nowMs - byId.get(databaseId)!.observedAtMs > c!.maxEvidenceAgeMs)
      return deny('EVIDENCE_STALE', databaseId);
  }

  // Sparse logical projections over DECLARED evidence — clamped at zero rows (a fleet
  // cannot project below empty), never measured by this runtime.
  const fleetProjection = q!.fleetDatabaseIds.map((databaseId) => {
    const e = byId.get(databaseId)!;
    const projectedRows = Math.max(0, e.rowCount + e.growthRowsPerDay * c!.horizonDays);
    return {
      databaseId,
      observedAtMs: e.observedAtMs,
      declaredRowCount: e.rowCount,
      declaredGrowthRowsPerDay: e.growthRowsPerDay,
      projectedRows,
    };
  });
  // A SINGLE database projected past the measured ceiling is a data-movement problem:
  // adding empty databases adds aggregate headroom but moves no rows, so the plan
  // denies instead of masking the exhaustion in aggregate arithmetic.
  const overCeiling = fleetProjection.find(
    (f) => f.projectedRows > MEASURED_SCALING_CONSTANTS.measuredCeilingRowsPerDatabase,
  );
  if (overCeiling)
    return deny('PER_DATABASE_CEILING_PROJECTED', overCeiling.databaseId);

  const projectedAggregateRows = fleetProjection.reduce((a, f) => a + f.projectedRows, 0);
  const existing = q!.fleetDatabaseIds.length;
  const ceiling = MEASURED_SCALING_CONSTANTS.measuredCeilingRowsPerDatabase;
  // The smallest K keeping projected aggregate utilization at or below the policy
  // target: aggregate * 100 <= (existing + K) * ceiling * target.
  const requiredFleetSize = ceilDiv(projectedAggregateRows * 100, ceiling * c!.scaleOutTargetPercent);
  const proposedNewDatabaseCount = Math.max(0, requiredFleetSize - existing);
  if (proposedNewDatabaseCount === 0)
    return Object.freeze({
      ...base,
      disposition: 'NO_SCALE_REQUIRED' as const,
      reason: 'HEADROOM_WITHIN_TARGET' as const,
      detailDatabaseId: null,
      proposedNewDatabaseCount: 0 as const,
    });
  if (proposedNewDatabaseCount > c!.maxNewDatabasesPerPlan)
    return deny('SCALE_OUT_BEYOND_POLICY');

  const postPlanFleetDatabaseCount = existing + proposedNewDatabaseCount;
  const projectedUtilizationPercent = ceilDiv(projectedAggregateRows * 100, postPlanFleetDatabaseCount * ceiling);
  // The plan identity binds EVERY declared input: the request, the re-derived policy
  // digest, every fleet database's full evidence and projection, and the proposal.
  const planDigest = sha256(JSON.stringify({
    fleetProjection,
    policyDigest: q!.scalingPolicyDigest,
    proposedNewDatabaseCount,
    requestId: q!.requestId,
    sourceCommit: q!.sourceCommit,
    tenantId: q!.tenantId,
    universeId: q!.universeId,
  }));
  return Object.freeze({
    ...base,
    disposition: 'HUMAN_APPROVAL_REQUIRED' as const,
    reason: 'MEASURED_HEADROOM_PROJECTION' as const,
    detailDatabaseId: null,
    proposedNewDatabaseCount,
    postPlanFleetDatabaseCount,
    projectedAggregateRows,
    projectedUtilizationPercent,
    planDigest,
    fleetProjection: Object.freeze(fleetProjection.map((f) => Object.freeze({ ...f }))),
  });
}

/**
 * A HUMAN decision on a proposed scaling plan, receipt-gated (64-hex sha256 operator
 * receipt) and PROVENANCE-VERIFIED from its first version: the plan is re-composed
 * from the request, policy, reference time, and evidence it claims to come from, and
 * a presented plan whose identity does not re-derive is refused before any receipt is
 * examined. Only an eligible plan can be decided. Every record requires a 12D-121
 * decision-safety workflow before any action — this runtime provisions nothing.
 */
export interface ScalingDecisionRecord {
  readonly kind: 'SCALING_DECISION_RECORD';
  readonly planDigest: string;
  readonly proposedNewDatabaseCount: number;
  readonly decision: 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN';
  readonly decidedBy: string;
  readonly decidedAtMs: number;
  readonly operatorReceiptSha256: string;
  readonly requiresDecisionSafetyWorkflowBeforeAnyAction: true;
  readonly executedByThisRuntime: false;
  readonly productionExecutionAllowed: false;
  readonly databasesProvisioned: 0;
  readonly humanDecision: 'REQUIRED';
  readonly learningPromoted: false;
  readonly modelCalls: 0;
  readonly remoteCalls: 0;
  readonly billionUsersProven: false;
  readonly automaticRecovery: false;
}

export interface ScalingPlanProvenance {
  readonly policy: ScalingPolicy;
  readonly request: ScalingRequest;
  readonly nowMs: number;
  readonly evidence: readonly DatabaseCapacityEvidence[];
}

export function recordScalingDecision(
  plan: MeasuredScalingPlan,
  input: {
    decision: 'ACCEPTED_FOR_HUMAN_REVIEW' | 'DECLINED_BY_HUMAN';
    operatorReceiptSha256: string;
    decidedBy: string;
    decidedAtMs: number;
  },
  provenance: ScalingPlanProvenance,
): Readonly<ScalingDecisionRecord> {
  const p = plan as MeasuredScalingPlan | null;
  if (!p || p.kind !== 'MEASURED_SCALING_PLAN' || !Object.isFrozen(p))
    throw new Error('not a frozen MEASURED_SCALING_PLAN; fail closed');
  if (p.disposition !== 'HUMAN_APPROVAL_REQUIRED' || p.reason !== 'MEASURED_HEADROOM_PROJECTION')
    throw new Error('only an eligible HUMAN_APPROVAL_REQUIRED plan can receive a decision; fail closed');
  if (p.humanApprovalRequired !== true || p.databasesProvisioned !== 0
    || p.providerInvocationAuthorized !== false || p.automaticRecovery !== false
    || p.productionScaleProven !== false)
    throw new Error('plan carries dishonest governance flags; fail closed');
  // PROVENANCE RE-DERIVATION (the 12D-128 discipline, present from the first version):
  // the plan is re-composed from its declared inputs and must re-derive exactly.
  const v = provenance as ScalingPlanProvenance | null;
  if (!v || typeof v !== 'object')
    throw new Error('scaling plan provenance required; fail closed');
  const recomposed = planMeasuredHorizontalScaling(v.policy, v.request, v.nowMs, v.evidence);
  if (recomposed.disposition !== 'HUMAN_APPROVAL_REQUIRED'
    || recomposed.planDigest !== p.planDigest
    || recomposed.proposedNewDatabaseCount !== p.proposedNewDatabaseCount
    || recomposed.postPlanFleetDatabaseCount !== p.postPlanFleetDatabaseCount)
    throw new Error('scaling plan provenance does not re-derive the presented plan; fail closed');
  if (input?.decision !== 'ACCEPTED_FOR_HUMAN_REVIEW' && input?.decision !== 'DECLINED_BY_HUMAN')
    throw new Error('scaling decision unknown; fail closed');
  if (!hex64(input.operatorReceiptSha256))
    throw new Error('a scaling decision requires a 64-hex sha256 operator receipt; fail closed');
  if (typeof input.decidedBy !== 'string' || input.decidedBy.length < 1
    || input.decidedBy.length > 128 || !/^[A-Za-z0-9_.:@-]+$/.test(input.decidedBy))
    throw new Error('decider identity invalid; fail closed');
  if (!safeInt(input.decidedAtMs) || input.decidedAtMs <= 0)
    throw new Error('decision timestamp invalid; fail closed');
  // A decision cannot chronologically predate the evidence it responds to — the LATEST
  // fleet observation, not the earliest: deciding before every database's evidence
  // existed means deciding on incomplete evidence (the 12D-127/128 ordering rule).
  const latestEvidenceMs = Math.max(...p.fleetProjection.map((f) => f.observedAtMs));
  if (input.decidedAtMs < latestEvidenceMs)
    throw new Error('decision timestamp predates the capacity evidence; fail closed');
  return Object.freeze({
    kind: 'SCALING_DECISION_RECORD' as const,
    planDigest: p.planDigest,
    proposedNewDatabaseCount: p.proposedNewDatabaseCount,
    decision: input.decision,
    decidedBy: input.decidedBy,
    decidedAtMs: input.decidedAtMs,
    operatorReceiptSha256: input.operatorReceiptSha256,
    requiresDecisionSafetyWorkflowBeforeAnyAction: true as const,
    executedByThisRuntime: false as const,
    productionExecutionAllowed: false as const,
    databasesProvisioned: 0 as const,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
    modelCalls: 0 as const,
    remoteCalls: 0 as const,
    billionUsersProven: false as const,
    automaticRecovery: false as const,
  });
}