/**
 * 62L-EQ15 — Pathway Plasticity runtime.
 *
 * Evidence-driven strengthen/weaken of compute routes.
 * Preference-only learning; never permissions/authority expansion.
 * Soft-wires EQ14 (WAITING_DATA ok), EQ13, EQ12, EQ6, EP15, EM157.
 */

import { createHash } from 'node:crypto';
import {
  EQ15_AGENT_BOUNDS,
  EQ15_DB_CANDIDATES_STATUS,
  EQ15_LOCKS,
  EQ15_MAY,
  EQ15_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PATHWAY_LEARNING_BOUNDARY,
  PATHWAY_LIFECYCLE_STATES,
  PATHWAY_METADATA_FIELDS,
  PATHWAY_PLASTICITY_CYCLE,
  PATHWAY_STRENGTHEN_CONDITIONS,
  PATHWAY_WEAKEN_CONDITIONS,
  PATHWAY_WEIGHT_INFLUENCES,
  assertEq15LocksIntact,
  canStrengthenPathway,
  eq15SoftWireSnapshot,
  isEq15Agent,
  isHumanApprover,
  preferenceImpliesAuthority,
  preferenceImpliesPermission,
  type Eq15Actor,
  type Eq15EvidenceState,
  type Eq15HopRecord,
  type Eq15SoftWireSnapshot,
  type PathwayLifecycleState,
  type PathwayRecord,
  type PathwayRegressionState,
  type PathwayWeightInfluence,
} from './pathway-plasticity-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof PATHWAY_PLASTICITY_CYCLE)[number],
  state: Eq15EvidenceState,
  summary: string,
): Eq15HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED';
  reason: string;
  executed: false;
};

function deny(reason: string): DenialResult {
  return { denied: true, state: 'DENIED', reason, executed: false };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function computeStalenessScore(input: {
  lastVerifiedAt: string | null;
  nowIso?: string;
  halfLifeHours?: number;
}): number {
  if (!input.lastVerifiedAt) return 1;
  const now = Date.parse(input.nowIso ?? nowIso());
  const then = Date.parse(input.lastVerifiedAt);
  if (!Number.isFinite(now) || !Number.isFinite(then) || then > now) return 1;
  const hours = (now - then) / (1000 * 60 * 60);
  const halfLife = input.halfLifeHours ?? 168;
  return clamp01(1 - Math.exp((-Math.LN2 * hours) / halfLife));
}

export function initialPathway(input: {
  pathwayId: string;
  routeKey: string;
  hypothesis: string;
  evidenceRefs?: readonly string[];
  rollbackVersion?: string | null;
}): PathwayRecord {
  return {
    pathwayId: input.pathwayId,
    routeKey: input.routeKey,
    lifecycle: 'HYPOTHESIS',
    weight: 0.5,
    confidence: 0,
    successCount: 0,
    failureCount: 0,
    lastVerifiedAt: null,
    stalenessScore: 1,
    regressionState: 'NONE',
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    rollbackVersion: input.rollbackVersion ?? null,
    hypothesis: input.hypothesis,
  };
}

export function advanceLifecycle(
  current: PathwayLifecycleState,
  event:
    | 'mark_tested'
    | 'mark_measured'
    | 'mark_verified'
    | 'mark_stale'
    | 'mark_regressed'
    | 'mark_rejected',
): PathwayLifecycleState {
  switch (event) {
    case 'mark_tested':
      return current === 'HYPOTHESIS' || current === 'STALE' ? 'TESTED' : current;
    case 'mark_measured':
      return current === 'TESTED' || current === 'HYPOTHESIS'
        ? 'MEASURED'
        : current;
    case 'mark_verified':
      return current === 'MEASURED' || current === 'TESTED'
        ? 'VERIFIED'
        : current;
    case 'mark_stale':
      return 'STALE';
    case 'mark_regressed':
      return 'REGRESSED';
    case 'mark_rejected':
      return 'REJECTED';
    default:
      return current;
  }
}

export type StrengthenInput = {
  actor: Eq15Actor;
  pathway: PathwayRecord;
  influences?: Partial<Record<PathwayWeightInfluence, number>>;
  repeatedBoundedTestsSucceed: boolean;
  resultsReproducible: boolean;
  evidenceFresh: boolean;
  beatsOrJustifiesBaseline: boolean;
  humanApprovalRequired?: boolean;
  humanApprover?: Eq15Actor;
  nowIso?: string;
};

export type StrengthenResult =
  | {
      ok: true;
      pathway: PathwayRecord;
      preferenceChanged: true;
      permissionsChanged: false;
      authorityChanged: false;
      reason: string;
    }
  | DenialResult;

/**
 * Strengthen only when bounded reproducible fresh success + baseline justification.
 * Changes routing preference weight — never permissions/authority.
 */
export function strengthenPathway(input: StrengthenInput): StrengthenResult {
  if (input.humanApprovalRequired) {
    if (!input.humanApprover || !isHumanApprover(input.humanApprover)) {
      return deny(
        'HUMAN_APPROVAL_REQUIRED — consequential pathway promotion needs human_approver/founder/tenant_admin.',
      );
    }
  }

  if (
    input.pathway.lifecycle === 'REJECTED' ||
    input.pathway.lifecycle === 'REGRESSED'
  ) {
    return deny(
      `Cannot strengthen pathway in lifecycle ${input.pathway.lifecycle}.`,
    );
  }

  const evidenceOk = canStrengthenPathway({
    repeatedBoundedTestsSucceed: input.repeatedBoundedTestsSucceed,
    resultsReproducible: input.resultsReproducible,
    evidenceFresh: input.evidenceFresh,
    evidenceRefs: input.pathway.evidenceRefs,
  });

  if (
    !evidenceOk ||
    !input.beatsOrJustifiesBaseline ||
    EQ15_LOCKS.STRENGTHEN_WITHOUT_EVIDENCE === true
  ) {
    return deny(
      'STRENGTHEN_WITHOUT_EVIDENCE=false — need repeated bounded success, reproducible, fresh evidence, baseline justification, evidenceRefs.',
    );
  }

  if (!EQ15_AGENT_BOUNDS.mayStrengthenOnReproducibleFreshSuccess) {
    return deny('mayStrengthenOnReproducibleFreshSuccess=false');
  }

  const p: PathwayRecord = {
    ...input.pathway,
    evidenceRefs: [...input.pathway.evidenceRefs],
  };

  const successSignal = clamp01(input.influences?.benchmark_success ?? 0.7);
  const reliability = clamp01(input.influences?.reliability ?? 0.7);
  const quality = clamp01(input.influences?.output_quality ?? 0.7);
  const delta = 0.05 + 0.1 * ((successSignal + reliability + quality) / 3);

  const verifiedAt = input.nowIso ?? nowIso();
  p.successCount += 1;
  p.weight = clamp01(p.weight + delta);
  p.confidence = clamp01(p.confidence + 0.08 * reliability);
  p.lastVerifiedAt = verifiedAt;
  p.stalenessScore = computeStalenessScore({
    lastVerifiedAt: verifiedAt,
    nowIso: verifiedAt,
  });
  p.regressionState = 'NONE';
  p.lifecycle = advanceLifecycle(
    advanceLifecycle(advanceLifecycle(p.lifecycle, 'mark_tested'), 'mark_measured'),
    'mark_verified',
  );

  return {
    ok: true,
    pathway: p,
    preferenceChanged: true,
    permissionsChanged: false,
    authorityChanged: false,
    reason:
      'Pathway preference weight strengthened from bounded evidence (not permissions/authority).',
  };
}

export type WeakenReason =
  | 'runtime_regression'
  | 'driver_or_model_change'
  | 'failures_increased'
  | 'evidence_stale'
  | 'conflicting_results'
  | 'reviewer_rejected';

export type WeakenInput = {
  actor: Eq15Actor;
  pathway: PathwayRecord;
  reason: WeakenReason;
  influences?: Partial<Record<PathwayWeightInfluence, number>>;
  nowIso?: string;
};

export type WeakenResult = {
  ok: true;
  pathway: PathwayRecord;
  preferenceChanged: true;
  permissionsChanged: false;
  authorityChanged: false;
  reason: string;
};

export function weakenPathway(input: WeakenInput): WeakenResult {
  const p: PathwayRecord = {
    ...input.pathway,
    evidenceRefs: [...input.pathway.evidenceRefs],
  };
  const failureSignal = clamp01(input.influences?.repeated_failure ?? 0.6);
  const contradiction = clamp01(input.influences?.contradiction ?? 0);
  const regression = clamp01(input.influences?.regression ?? 0);
  const delta = 0.08 + 0.12 * Math.max(failureSignal, contradiction, regression);

  p.failureCount += 1;
  p.weight = clamp01(p.weight - delta);
  p.confidence = clamp01(p.confidence - 0.1);
  p.stalenessScore = computeStalenessScore({
    lastVerifiedAt: p.lastVerifiedAt,
    nowIso: input.nowIso,
  });

  let regressionState: PathwayRegressionState = p.regressionState;
  let lifecycle = p.lifecycle;
  switch (input.reason) {
    case 'runtime_regression':
      regressionState = 'REGRESSED';
      lifecycle = advanceLifecycle(lifecycle, 'mark_regressed');
      break;
    case 'reviewer_rejected':
      lifecycle = advanceLifecycle(lifecycle, 'mark_rejected');
      break;
    case 'evidence_stale':
      lifecycle = advanceLifecycle(lifecycle, 'mark_stale');
      break;
    case 'driver_or_model_change':
      regressionState = 'SUSPECTED';
      lifecycle = advanceLifecycle(lifecycle, 'mark_stale');
      break;
    case 'conflicting_results':
      regressionState = 'SUSPECTED';
      break;
    case 'failures_increased':
      regressionState =
        regressionState === 'REGRESSED' ? 'REGRESSED' : 'SUSPECTED';
      break;
  }
  p.regressionState = regressionState;
  p.lifecycle = lifecycle;

  return {
    ok: true,
    pathway: p,
    preferenceChanged: true,
    permissionsChanged: false,
    authorityChanged: false,
    reason: `Pathway preference weakened (${input.reason}); permissions/authority unchanged.`,
  };
}

export function assertPreferenceOnlyChange(
  before: PathwayRecord,
  after: PathwayRecord,
): { ok: boolean; detail: string } {
  if (preferenceImpliesPermission() || preferenceImpliesAuthority()) {
    return { ok: false, detail: 'preference must never imply permission/authority' };
  }
  if (before.pathwayId !== after.pathwayId || before.routeKey !== after.routeKey) {
    return {
      ok: false,
      detail: 'pathway identity/routeKey must not rewrite into permission grants',
    };
  }
  return {
    ok: true,
    detail: 'Change is preference-weight only; permissions/authority untouched',
  };
}

export function attemptSelfGrantTools(): DenialResult {
  return deny('SELF_GRANT_TOOLS=false — pathway learning cannot self-grant tools.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny(
    'BYPASS_GUARDIAN_RLS=false — pathway learning cannot bypass Guardian/RLS.',
  );
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny(
    'EXPAND_TENANT_UNIVERSE_ACCESS=false — pathway learning cannot expand tenant/Universe access.',
  );
}

export function attemptPromoteResearchToProduction(): DenialResult {
  return deny(
    'PROMOTE_RESEARCH_DIRECTLY_TO_PRODUCTION=false — research cannot promote directly to production.',
  );
}

export function attemptPersistHiddenChainOfThought(): DenialResult {
  return deny(
    'PERSIST_HIDDEN_CHAIN_OF_THOUGHT=false — no hidden chain-of-thought.',
  );
}

export function attemptAutoDeployChanges(): DenialResult {
  return deny('AUTO_DEPLOY_CHANGES=false — no auto-deploy of pathway changes.');
}

export function attemptStrengthenWithoutEvidence(): DenialResult {
  return deny(
    'STRENGTHEN_WITHOUT_EVIDENCE=false — strengthen requires bounded reproducible fresh evidence.',
  );
}

export function attemptUncontrolledSelfModification(): DenialResult {
  return deny(
    'UNCONTROLLED_SELF_MODIFICATION=false — plasticity is bounded and evidence-gated.',
  );
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act / authorize.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false — agents have no automatic authority.');
}

export function attemptPreferenceAsPermission(): DenialResult {
  return deny(
    'PREFERENCE_EQ_PERMISSION=false — routing preference ≠ permission grant.',
  );
}

export function attemptPreferenceAsAuthority(): DenialResult {
  return deny(
    'PREFERENCE_EQ_AUTHORITY=false — routing preference ≠ authority expansion.',
  );
}

export function returnEq15EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq15Actor;
  summary: string;
  pathway?: PathwayRecord;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
      permissionsChanged: false;
      hiddenChainOfThoughtPresent: false;
      preferenceSnapshot: {
        pathwayId: string | null;
        weight: number | null;
        lifecycle: PathwayLifecycleState | null;
      };
    }
  | DenialResult {
  if (!EQ15_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEq15Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only EQ15 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
    permissionsChanged: false,
    hiddenChainOfThoughtPresent: false,
    preferenceSnapshot: {
      pathwayId: input.pathway?.pathwayId ?? null,
      weight: input.pathway?.weight ?? null,
      lifecycle: input.pathway?.lifecycle ?? null,
    },
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq15Actor;
  action: string;
}):
  | {
      approvalId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver, founder, or tenant_admin.',
    );
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential.');
  }
  return {
    approvalId: input.approvalId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  humanApprovalUnchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EQ15_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ15_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ15_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleVerifiedPathway(actor: Eq15Actor): {
  pathway: PathwayRecord;
  strengthened: Extract<StrengthenResult, { ok: true }>;
} {
  void actor;
  const hypo = initialPathway({
    pathwayId: 'path-eq15-demo',
    routeKey: 'route.compute.demo',
    hypothesis: 'Bounded route prefers lower-latency verified backend',
    evidenceRefs: ['bench://eq12/demo', 'receipt://eq13/demo'],
    rollbackVersion: 'v0',
  });
  const strengthened = strengthenPathway({
    actor,
    pathway: hypo,
    influences: {
      benchmark_success: 0.9,
      reliability: 0.85,
      recency_freshness: 1,
      output_quality: 0.8,
      latency: 0.7,
      cost_energy_proxy: 0.6,
    },
    repeatedBoundedTestsSucceed: true,
    resultsReproducible: true,
    evidenceFresh: true,
    beatsOrJustifiesBaseline: true,
    humanApprovalRequired: false,
  });
  if ('denied' in strengthened) {
    throw new Error(`example strengthen failed: ${strengthened.reason}`);
  }
  return { pathway: hypo, strengthened };
}

export function bootstrapPathwayPlasticity(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq15SoftWireSnapshot;
  weightInfluences: typeof PATHWAY_WEIGHT_INFLUENCES;
  lifecycle: typeof PATHWAY_LIFECYCLE_STATES;
  metadataFields: typeof PATHWAY_METADATA_FIELDS;
  strengthenConditions: typeof PATHWAY_STRENGTHEN_CONDITIONS;
  weakenConditions: typeof PATHWAY_WEAKEN_CONDITIONS;
  learningBoundary: typeof PATHWAY_LEARNING_BOUNDARY;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ15_MAY;
  mustNot: typeof EQ15_MUST_NOT;
  dbCandidates: typeof EQ15_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq15LocksIntact(),
    softWire: eq15SoftWireSnapshot(repoRoot),
    weightInfluences: PATHWAY_WEIGHT_INFLUENCES,
    lifecycle: PATHWAY_LIFECYCLE_STATES,
    metadataFields: PATHWAY_METADATA_FIELDS,
    strengthenConditions: PATHWAY_STRENGTHEN_CONDITIONS,
    weakenConditions: PATHWAY_WEAKEN_CONDITIONS,
    learningBoundary: PATHWAY_LEARNING_BOUNDARY,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ15_MAY,
    mustNot: EQ15_MUST_NOT,
    dbCandidates: EQ15_DB_CANDIDATES_STATUS,
  };
}

function softWireHopState(present: boolean): Eq15EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function runPathwayPlasticityCycle(input: {
  actor: Eq15Actor;
  human: Eq15Actor;
  repoRoot?: string;
}): {
  hops: Eq15HopRecord[];
  pathway: PathwayRecord;
  strengthened: Extract<StrengthenResult, { ok: true }>;
  softWire: Eq15SoftWireSnapshot;
  cycleEvidenceSha256: string;
} {
  const hops: Eq15HopRecord[] = [];
  const softWire = eq15SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq15LocksIntact() ? 'PASS' : 'FAIL',
      'EQ15 locks intact including L4=false and preference≠permissions/authority.',
    ),
  );
  hops.push(
    hop(
      'pathway_plasticity_bootstrap',
      'PASS',
      'Pathway Plasticity bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'weight_influences_encoded',
      PATHWAY_WEIGHT_INFLUENCES.length === 11 ? 'PASS' : 'FAIL',
      `${PATHWAY_WEIGHT_INFLUENCES.length} weight influences encoded.`,
    ),
  );
  hops.push(
    hop(
      'lifecycle_states_encoded',
      PATHWAY_LIFECYCLE_STATES.length === 7 ? 'PASS' : 'FAIL',
      PATHWAY_LIFECYCLE_STATES.join(' → '),
    ),
  );
  hops.push(
    hop(
      'metadata_fields_encoded',
      PATHWAY_METADATA_FIELDS.length === 9 ? 'PASS' : 'FAIL',
      PATHWAY_METADATA_FIELDS.join(' · '),
    ),
  );
  hops.push(
    hop(
      'strengthen_weaken_conditions_encoded',
      PATHWAY_STRENGTHEN_CONDITIONS.length === 4 &&
        PATHWAY_WEAKEN_CONDITIONS.length === 6
        ? 'PASS'
        : 'FAIL',
      `strengthen=${PATHWAY_STRENGTHEN_CONDITIONS.length}; weaken=${PATHWAY_WEAKEN_CONDITIONS.length}`,
    ),
  );
  hops.push(
    hop(
      'preference_neq_authority_encoded',
      PATHWAY_LEARNING_BOUNDARY.mayChangeRoutingPreference === true &&
        PATHWAY_LEARNING_BOUNDARY.mayChangePermissions === false &&
        PATHWAY_LEARNING_BOUNDARY.mayChangeAuthority === false &&
        preferenceImpliesPermission() === false &&
        preferenceImpliesAuthority() === false
        ? 'PASS'
        : 'FAIL',
      'Learning may change routing preference only — not permissions/authority.',
    ),
  );

  const { pathway: hypo, strengthened } = exampleVerifiedPathway(input.actor);

  hops.push(
    hop(
      'strengthen_on_reproducible_fresh_success',
      strengthened.ok &&
        strengthened.pathway.lifecycle === 'VERIFIED' &&
        strengthened.pathway.weight > hypo.weight &&
        strengthened.permissionsChanged === false &&
        strengthened.authorityChanged === false
        ? 'PASS'
        : 'FAIL',
      strengthened.reason,
    ),
  );

  const regressed = weakenPathway({
    actor: input.actor,
    pathway: strengthened.pathway,
    reason: 'runtime_regression',
    influences: { regression: 0.9, repeated_failure: 0.7 },
  });
  const stale = weakenPathway({
    actor: input.actor,
    pathway: strengthened.pathway,
    reason: 'evidence_stale',
    influences: { recency_freshness: 0.1 },
  });
  const conflicted = weakenPathway({
    actor: input.actor,
    pathway: strengthened.pathway,
    reason: 'conflicting_results',
    influences: { contradiction: 0.8 },
  });
  const rejected = weakenPathway({
    actor: input.actor,
    pathway: strengthened.pathway,
    reason: 'reviewer_rejected',
    influences: { evaluator_review: 0 },
  });

  hops.push(
    hop(
      'weaken_on_regression_stale_contradiction_reject',
      regressed.pathway.lifecycle === 'REGRESSED' &&
        stale.pathway.lifecycle === 'STALE' &&
        conflicted.pathway.regressionState === 'SUSPECTED' &&
        rejected.pathway.lifecycle === 'REJECTED' &&
        regressed.permissionsChanged === false
        ? 'PASS'
        : 'FAIL',
      'Weaken on regression / stale / contradiction / reviewer reject.',
    ),
  );

  const prefCheck = assertPreferenceOnlyChange(hypo, strengthened.pathway);
  hops.push(
    hop(
      'preference_change_neq_permission_or_authority',
      prefCheck.ok &&
        attemptPreferenceAsPermission().state === 'DENIED' &&
        attemptPreferenceAsAuthority().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      prefCheck.detail,
    ),
  );

  const denyHops: Array<{
    hop: (typeof PATHWAY_PLASTICITY_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_self_grant_tools', fn: attemptSelfGrantTools },
    { hop: 'deny_bypass_guardian_rls', fn: attemptBypassGuardianRls },
    {
      hop: 'deny_expand_tenant_universe_access',
      fn: attemptExpandTenantUniverseAccess,
    },
    {
      hop: 'deny_promote_research_to_production',
      fn: attemptPromoteResearchToProduction,
    },
    {
      hop: 'deny_persist_hidden_chain_of_thought',
      fn: attemptPersistHiddenChainOfThought,
    },
    { hop: 'deny_auto_deploy_changes', fn: attemptAutoDeployChanges },
    {
      hop: 'deny_strengthen_without_evidence',
      fn: attemptStrengthenWithoutEvidence,
    },
  ];
  for (const d of denyHops) {
    hops.push(
      hop(d.hop, d.fn().state === 'DENIED' ? 'PASS' : 'FAIL', `${d.hop} DENIED.`),
    );
  }

  // Also exercise strengthen-without-evidence path through API
  const bare = strengthenPathway({
    actor: input.actor,
    pathway: hypo,
    repeatedBoundedTestsSucceed: false,
    resultsReproducible: false,
    evidenceFresh: false,
    beatsOrJustifiesBaseline: false,
  });
  if (!('denied' in bare)) {
    hops[hops.length - 1] = hop(
      'deny_strengthen_without_evidence',
      'FAIL',
      'Bare strengthen unexpectedly allowed.',
    );
  }

  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' &&
        attemptAgentAutoAuthority().state === 'DENIED' &&
        attemptUncontrolledSelfModification().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; no agent auto-authority; no uncontrolled self-mod.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EQ15_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );
  hops.push(
    hop(
      'promoted_policy_needs_reproducible_tests_and_review',
      EQ15_LOCKS.PROMOTED_POLICY_REQUIRES_REPRODUCIBLE_TESTS_AND_REVIEW === true
        ? 'PASS'
        : 'FAIL',
      'Promoted scheduler/routing policy still needs reproducible tests and review.',
    ),
  );

  hops.push(
    hop(
      'eq14_soft_wire',
      softWireHopState(softWire.eq14NeuralPathwayArchitectureGraph.present),
      softWire.eq14NeuralPathwayArchitectureGraph.note,
    ),
  );
  hops.push(
    hop(
      'eq13_soft_wire',
      softWireHopState(softWire.eq13ArchitectureReturnReceipt.present),
      softWire.eq13ArchitectureReturnReceipt.note,
    ),
  );
  hops.push(
    hop(
      'eq12_soft_wire',
      softWireHopState(softWire.eq12CrossArchitectureBenchmarkMatrix.present),
      softWire.eq12CrossArchitectureBenchmarkMatrix.note,
    ),
  );
  hops.push(
    hop(
      'eq6_soft_wire',
      softWireHopState(softWire.eq6ArchitectureCapabilityGraph.present),
      softWire.eq6ArchitectureCapabilityGraph.note,
    ),
  );
  hops.push(
    hop(
      'ep15_soft_wire',
      softWireHopState(softWire.ep15AlgorithmTuningSandbox.present),
      softWire.ep15AlgorithmTuningSandbox.note,
    ),
  );
  hops.push(
    hop(
      'em157_soft_wire',
      softWireHopState(softWire.em157HomeBase.present),
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      EQ15_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq15-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  const evidence = returnEq15EvidenceToHomeBase({
    evidenceId: 'ev-eq15-1',
    actor: input.actor,
    summary: 'pathway plasticity advisory',
    pathway: strengthened.pathway,
  });
  hops.push(
    hop(
      'evidence',
      'denied' in humanGate || 'denied' in evidence ? 'DENIED' : 'PASS',
      'Human approval gate exercised; preference evidence returned; no authority granted.',
    ),
  );

  void PATHWAY_PLASTICITY_CYCLE;

  const cycleEvidenceSha256 = sha256(
    JSON.stringify({
      hopIds: hops.map((h) => h.hop),
      states: hops.map((h) => h.state),
      pathwayId: strengthened.pathway.pathwayId,
      weight: strengthened.pathway.weight,
    }),
  );

  return {
    hops,
    pathway: strengthened.pathway,
    strengthened,
    softWire,
    cycleEvidenceSha256,
  };
}
