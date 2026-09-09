/**
 * 62L-ES32 — Mission Decomposition & Dependency Planner runtime.
 *
 * Decompose missions into work packages; wire HARD/SOFT/HUMAN/DATA deps;
 * compute critical path; bound parallelism; deny Guardian strip / permission
 * widen / spending authority / human-gate bypass; soft-wire prior phases.
 */

import {
  DEFAULT_MAX_PARALLEL_WORK_PACKAGES,
  DEPENDENCY_KINDS,
  ES32_DB_CANDIDATES_STATUS,
  ES32_LOCKS,
  ES32_MAY,
  ES32_MUST_NOT,
  ES_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MISSION_DECOMPOSITION_CORE_FLOW,
  MISSION_DECOMPOSITION_PLANNER_CYCLE,
  MISSION_PLANNER_TRUTH_BOUNDARY,
  NEXT_PHASE_TITLE,
  STOP_CONDITION_KINDS,
  WORK_PACKAGE_FIELDS,
  WORK_PACKAGE_STATES,
  assertEs32LocksIntact,
  dependencyBlocksStart,
  es32SoftWireSnapshot,
  initialStateForDependency,
  isHumanApprover,
  softWireHopState,
  type CriticalPathResult,
  type DependencyEdge,
  type DependencyKind,
  type Es32Actor,
  type Es32EvidenceState,
  type Es32HopRecord,
  type Es32SoftWireSnapshot,
  type ExecutionPlan,
  type MissionConstraints,
  type MissionIntake,
  type ParallelismAssessment,
  type StopConditionKind,
  type WorkPackage,
  type WorkPackageState,
} from './mission-decomposition-dependency-planner-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof MISSION_DECOMPOSITION_PLANNER_CYCLE)[number],
  state: Es32EvidenceState,
  summary: string,
): Es32HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'BLOCKED' | 'REJECTED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: DenialResult['state'] = 'DENIED',
): DenialResult {
  return {
    denied: true,
    state,
    reason,
    executed: false,
  };
}

const DEFAULT_STOPS: readonly StopConditionKind[] = [
  'REQUIRED_DATA_RIGHTS_FAIL',
  'CRITICAL_PREREQUISITE_FAILS',
  'COST_BUDGET_EXHAUSTED',
  'EVIDENCE_DISPROVES_HYPOTHESIS',
  'SECURITY_POLICY_BOUNDARY_CANNOT_BE_PRESERVED',
  'HUMAN_REVIEWER_REJECTS_CONTINUATION',
];

export const GOV_QUANTUM_LOGISTICS_MISSION_ID =
  'mission-gov-quantum-logistics-proposal' as const;

/**
 * Example: Gov quantum/logistics proposal decomposition.
 * Opportunity qualification → requirements → parallel (logistics, quantum/AI
 * evidence, compliance, pricing) → merge → proposal review → human submission.
 * Pricing must not finalize before technical scope sufficiently known.
 */
export function buildGovQuantumLogisticsPackages(
  missionId: string = GOV_QUANTUM_LOGISTICS_MISSION_ID,
): WorkPackage[] {
  const commonStops = [...DEFAULT_STOPS];
  const base = {
    parentMission: missionId,
    escalationPath: 'team_lead → mission_owner → human_approver',
    returnPath: 'return evidence pack to mission_owner; do not tip-land',
    stopConditions: commonStops,
    costRuntimeBudget: { costUnits: 10, runtimeMinutes: 60 },
  };

  const wpQualify: WorkPackage = {
    ...base,
    workPackageId: 'wp-opportunity-qualification',
    objective: 'Qualify government quantum/logistics opportunity',
    ownerTeam: 'mission-intake',
    requiredInputs: ['rfp_summary', 'agency_context'],
    requiredDataApiScopes: ['public_procurement_read'],
    requiredCertifiedSkills: ['opportunity_qualification'],
    computeRuntimeNeeds: ['cpu_light'],
    dependencies: [],
    blockers: [],
    expectedOutput: 'qualified_opportunity_brief',
    acceptanceCriteria: ['opportunity in-scope', 'lawful sources only'],
    evidenceRequirements: ['source_citations'],
    state: 'READY',
  };

  const wpReqs: WorkPackage = {
    ...base,
    workPackageId: 'wp-requirements-decomposition',
    objective: 'Decompose requirements for logistics + quantum/AI proposal',
    ownerTeam: 'requirements',
    requiredInputs: ['qualified_opportunity_brief'],
    requiredDataApiScopes: ['mission_requirements_read'],
    requiredCertifiedSkills: ['requirements_decomposition'],
    computeRuntimeNeeds: ['cpu_light'],
    dependencies: [
      {
        fromWorkPackageId: 'wp-opportunity-qualification',
        toWorkPackageId: 'wp-requirements-decomposition',
        kind: 'HARD_DEPENDENCY',
        note: 'Cannot begin until qualification passes',
      },
    ],
    blockers: [],
    expectedOutput: 'requirements_pack',
    acceptanceCriteria: ['scoped requirements', 'acceptance criteria listed'],
    evidenceRequirements: ['requirements_traceability'],
    state: 'WAITING_DEPENDENCY',
  };

  const wpLogistics: WorkPackage = {
    ...base,
    workPackageId: 'wp-logistics-design',
    objective: 'Design logistics response workstream',
    ownerTeam: 'logistics-design',
    requiredInputs: ['requirements_pack'],
    requiredDataApiScopes: ['logistics_design_read'],
    requiredCertifiedSkills: ['logistics_design'],
    computeRuntimeNeeds: ['cpu_medium'],
    dependencies: [
      {
        fromWorkPackageId: 'wp-requirements-decomposition',
        toWorkPackageId: 'wp-logistics-design',
        kind: 'HARD_DEPENDENCY',
      },
    ],
    blockers: [],
    expectedOutput: 'logistics_design_pack',
    acceptanceCriteria: ['design covers stated requirements'],
    evidenceRequirements: ['design_review_notes'],
    state: 'WAITING_DEPENDENCY',
  };

  const wpQuantum: WorkPackage = {
    ...base,
    workPackageId: 'wp-quantum-ai-evidence',
    objective: 'Assemble quantum/AI evidence with honesty classifications',
    ownerTeam: 'quantum-ai-evidence',
    requiredInputs: ['requirements_pack'],
    requiredDataApiScopes: ['research_evidence_read'],
    requiredCertifiedSkills: ['quantum_evidence_honesty'],
    computeRuntimeNeeds: ['cpu_medium'],
    dependencies: [
      {
        fromWorkPackageId: 'wp-requirements-decomposition',
        toWorkPackageId: 'wp-quantum-ai-evidence',
        kind: 'HARD_DEPENDENCY',
      },
      {
        fromWorkPackageId: 'er7-quantum-honesty',
        toWorkPackageId: 'wp-quantum-ai-evidence',
        kind: 'DATA_GATE',
        note: 'Lawful/authorized quantum honesty evidence',
      },
    ],
    blockers: [],
    expectedOutput: 'quantum_ai_evidence_pack',
    acceptanceCriteria: [
      'explicit quantum content classification',
      'no unverified quantum-advantage claims',
    ],
    evidenceRequirements: ['classification_tags', 'source_lawfulness'],
    missingEvidence: ['er7_quantum_honesty_pack'],
    state: 'WAITING_DEPENDENCY',
  };

  const wpCompliance: WorkPackage = {
    ...base,
    workPackageId: 'wp-compliance',
    objective: 'Compliance and policy boundary review',
    ownerTeam: 'compliance',
    requiredInputs: ['requirements_pack'],
    requiredDataApiScopes: ['compliance_read'],
    requiredCertifiedSkills: ['compliance_review'],
    computeRuntimeNeeds: ['cpu_light'],
    dependencies: [
      {
        fromWorkPackageId: 'wp-requirements-decomposition',
        toWorkPackageId: 'wp-compliance',
        kind: 'HARD_DEPENDENCY',
      },
    ],
    blockers: [],
    expectedOutput: 'compliance_pack',
    acceptanceCriteria: ['policy boundaries preserved'],
    evidenceRequirements: ['compliance_checklist'],
    state: 'WAITING_DEPENDENCY',
  };

  const wpPricing: WorkPackage = {
    ...base,
    workPackageId: 'wp-pricing',
    objective: 'Draft pricing (must not finalize before technical scope known)',
    ownerTeam: 'pricing',
    requiredInputs: ['requirements_pack', 'technical_scope_sufficient'],
    requiredDataApiScopes: ['pricing_draft_read'],
    requiredCertifiedSkills: ['pricing_draft'],
    computeRuntimeNeeds: ['cpu_light'],
    dependencies: [
      {
        fromWorkPackageId: 'wp-requirements-decomposition',
        toWorkPackageId: 'wp-pricing',
        kind: 'SOFT_DEPENDENCY',
        note: 'May draft with assumptions; reconcile when scope known',
      },
      {
        fromWorkPackageId: 'wp-logistics-design',
        toWorkPackageId: 'wp-pricing',
        kind: 'HARD_DEPENDENCY',
        note: 'Pricing finalize blocked until logistics scope known',
      },
      {
        fromWorkPackageId: 'wp-quantum-ai-evidence',
        toWorkPackageId: 'wp-pricing',
        kind: 'SOFT_DEPENDENCY',
        note: 'Reconcile quantum/AI cost assumptions later',
      },
    ],
    blockers: ['technical_scope_insufficient_for_finalize'],
    expectedOutput: 'pricing_draft_or_final',
    acceptanceCriteria: [
      'draft allowed under soft assumptions',
      'finalize only after technical scope sufficiently known',
    ],
    evidenceRequirements: ['scope_sufficiency_attestation'],
    assumptions: ['preliminary_scope_from_requirements'],
    scheduleRisk: true,
    state: 'WAITING_DEPENDENCY',
  };

  const wpMerge: WorkPackage = {
    ...base,
    workPackageId: 'wp-merge-proposal',
    objective: 'Merge parallel workstreams into proposal draft',
    ownerTeam: 'proposal-merge',
    requiredInputs: [
      'logistics_design_pack',
      'quantum_ai_evidence_pack',
      'compliance_pack',
      'pricing_draft_or_final',
    ],
    requiredDataApiScopes: ['proposal_compose'],
    requiredCertifiedSkills: ['proposal_merge'],
    computeRuntimeNeeds: ['cpu_medium'],
    dependencies: [
      {
        fromWorkPackageId: 'wp-logistics-design',
        toWorkPackageId: 'wp-merge-proposal',
        kind: 'HARD_DEPENDENCY',
      },
      {
        fromWorkPackageId: 'wp-quantum-ai-evidence',
        toWorkPackageId: 'wp-merge-proposal',
        kind: 'HARD_DEPENDENCY',
      },
      {
        fromWorkPackageId: 'wp-compliance',
        toWorkPackageId: 'wp-merge-proposal',
        kind: 'HARD_DEPENDENCY',
      },
      {
        fromWorkPackageId: 'wp-pricing',
        toWorkPackageId: 'wp-merge-proposal',
        kind: 'HARD_DEPENDENCY',
      },
    ],
    blockers: [],
    expectedOutput: 'merged_proposal_draft',
    acceptanceCriteria: ['no contradictory claims across streams'],
    evidenceRequirements: ['merge_diff_notes'],
    state: 'WAITING_DEPENDENCY',
  };

  const wpReview: WorkPackage = {
    ...base,
    workPackageId: 'wp-proposal-review',
    objective: 'Internal proposal review',
    ownerTeam: 'proposal-review',
    requiredInputs: ['merged_proposal_draft'],
    requiredDataApiScopes: ['proposal_review'],
    requiredCertifiedSkills: ['proposal_review'],
    computeRuntimeNeeds: ['cpu_light'],
    dependencies: [
      {
        fromWorkPackageId: 'wp-merge-proposal',
        toWorkPackageId: 'wp-proposal-review',
        kind: 'HARD_DEPENDENCY',
      },
    ],
    blockers: [],
    expectedOutput: 'reviewed_proposal',
    acceptanceCriteria: ['review checklist complete'],
    evidenceRequirements: ['reviewer_signoff_internal'],
    state: 'WAITING_DEPENDENCY',
  };

  const wpHumanSubmit: WorkPackage = {
    ...base,
    workPackageId: 'wp-human-submission-approval',
    objective: 'Human submission approval gate',
    ownerTeam: 'human-approvers',
    requiredInputs: ['reviewed_proposal'],
    requiredDataApiScopes: ['submission_approval'],
    requiredCertifiedSkills: ['human_gate'],
    computeRuntimeNeeds: ['none'],
    dependencies: [
      {
        fromWorkPackageId: 'wp-proposal-review',
        toWorkPackageId: 'wp-human-submission-approval',
        kind: 'HUMAN_GATE',
        note: 'Pauses until explicit human authorization',
      },
    ],
    blockers: [],
    expectedOutput: 'human_authorized_submission_decision',
    acceptanceCriteria: ['explicit human authorization recorded'],
    evidenceRequirements: ['human_authorization_record'],
    state: 'REVIEW_REQUIRED',
  };

  return [
    wpQualify,
    wpReqs,
    wpLogistics,
    wpQuantum,
    wpCompliance,
    wpPricing,
    wpMerge,
    wpReview,
    wpHumanSubmit,
  ];
}

export function collectDependencyEdges(
  packages: readonly WorkPackage[],
): DependencyEdge[] {
  const edges: DependencyEdge[] = [];
  for (const wp of packages) {
    for (const d of wp.dependencies) {
      edges.push(d);
    }
  }
  return edges;
}

export function resolveWorkPackageStates(
  packages: readonly WorkPackage[],
  options: {
    completedIds?: ReadonlySet<string>;
    humanAuthorizedIds?: ReadonlySet<string>;
    dataAuthorizedIds?: ReadonlySet<string>;
  } = {},
): WorkPackage[] {
  const completed = options.completedIds ?? new Set<string>();
  const humanAuth = options.humanAuthorizedIds ?? new Set<string>();
  const dataAuth = options.dataAuthorizedIds ?? new Set<string>();

  return packages.map((wp) => {
    if (wp.dependencies.length === 0) {
      return { ...wp, state: wp.state === 'PLANNED' ? 'READY' : wp.state };
    }

    let next: WorkPackageState = 'READY';
    const assumptions = [...(wp.assumptions ?? [])];

    for (const dep of wp.dependencies) {
      const predPassed = completed.has(dep.fromWorkPackageId);
      const humanOk =
        dep.kind !== 'HUMAN_GATE' ||
        humanAuth.has(wp.workPackageId) ||
        humanAuth.has(dep.fromWorkPackageId);
      const dataOk =
        dep.kind !== 'DATA_GATE' ||
        dataAuth.has(dep.fromWorkPackageId) ||
        dataAuth.has(wp.workPackageId);

      if (dependencyBlocksStart(dep.kind, predPassed, humanOk, dataOk)) {
        next = initialStateForDependency(
          dep.kind,
          predPassed,
          humanOk,
          dataOk,
        );
        break;
      }

      if (dep.kind === 'SOFT_DEPENDENCY' && !predPassed) {
        assumptions.push(
          `soft_assumption_pending_reconcile:${dep.fromWorkPackageId}`,
        );
        if (next === 'READY') {
          next = 'READY';
        }
      }
    }

    // Pricing finalize: HARD block from logistics keeps WAITING even if soft allows draft
    if (
      wp.workPackageId === 'wp-pricing' &&
      wp.blockers.includes('technical_scope_insufficient_for_finalize')
    ) {
      const logisticsDone = completed.has('wp-logistics-design');
      if (!logisticsDone) {
        next = 'WAITING_DEPENDENCY';
      }
    }

    return {
      ...wp,
      assumptions: assumptions.length > 0 ? assumptions : wp.assumptions,
      state: next,
    };
  });
}

/**
 * Longest dependency path among known package ids (HARD edges preferred for
 * critical path length; HUMAN_GATE and DATA_GATE also extend path risk).
 */
export function computeCriticalPath(
  packages: readonly WorkPackage[],
  edges: readonly DependencyEdge[],
): CriticalPathResult {
  const ids = new Set(packages.map((p) => p.workPackageId));
  const outgoing = new Map<string, DependencyEdge[]>();
  for (const e of edges) {
    if (!ids.has(e.fromWorkPackageId) || !ids.has(e.toWorkPackageId)) continue;
    const list = outgoing.get(e.fromWorkPackageId) ?? [];
    list.push(e);
    outgoing.set(e.fromWorkPackageId, list);
  }

  let bestPath: string[] = [];
  const memo = new Map<string, string[]>();

  function dfs(node: string, stack: string[]): string[] {
    if (memo.has(node) && !stack.includes(node)) {
      return memo.get(node)!;
    }
    if (stack.includes(node)) return [node];
    const nexts = outgoing.get(node) ?? [];
    let best: string[] = [node];
    for (const e of nexts) {
      if (
        e.kind === 'SOFT_DEPENDENCY' &&
        e.toWorkPackageId.startsWith('wp-pricing')
      ) {
        // Soft edges still counted for schedule risk but prefer HARD for length
      }
      const child = dfs(e.toWorkPackageId, [...stack, node]);
      const path = [node, ...child];
      if (path.length > best.length) best = path;
    }
    memo.set(node, best.slice(1));
    return best;
  }

  for (const p of packages) {
    const path = dfs(p.workPackageId, []);
    if (path.length > bestPath.length) bestPath = path;
  }

  const scheduleRiskWorkPackageIds = packages
    .filter((p) => p.scheduleRisk)
    .map((p) => p.workPackageId);
  const missingEvidenceWorkPackageIds = packages
    .filter((p) => (p.missingEvidence?.length ?? 0) > 0)
    .map((p) => p.workPackageId);

  const teamLoad = new Map<string, number>();
  for (const p of packages) {
    if (
      p.state === 'READY' ||
      p.state === 'RUNNING_VERIFIED' ||
      p.state === 'WAITING_DEPENDENCY'
    ) {
      teamLoad.set(p.ownerTeam, (teamLoad.get(p.ownerTeam) ?? 0) + 1);
    }
  }
  const overloadedTeamIds = [...teamLoad.entries()]
    .filter(([, n]) => n > 2)
    .map(([t]) => t);

  const apiRuntimeBlockers = packages.flatMap((p) =>
    p.blockers.filter(
      (b) =>
        b.toLowerCase().includes('api') ||
        b.toLowerCase().includes('runtime') ||
        b.toLowerCase().includes('scope'),
    ),
  );

  const humanApprovalBottlenecks = packages
    .filter(
      (p) =>
        p.state === 'REVIEW_REQUIRED' ||
        p.dependencies.some((d) => d.kind === 'HUMAN_GATE'),
    )
    .map((p) => p.workPackageId);

  return {
    pathWorkPackageIds: bestPath,
    length: bestPath.length,
    scheduleRiskWorkPackageIds,
    missingEvidenceWorkPackageIds,
    overloadedTeamIds,
    apiRuntimeBlockers,
    humanApprovalBottlenecks,
    signals: [
      'longest_dependency_path',
      'schedule_risk_tasks',
      'missing_evidence',
      'overloaded_teams',
      'api_runtime_blockers',
      'human_approval_bottlenecks',
    ],
  };
}

/**
 * Parallel only when truly independent enough. Too much parallelism = waste.
 */
export function assessParallelism(
  packages: readonly WorkPackage[],
  edges: readonly DependencyEdge[],
  maxParallel: number = DEFAULT_MAX_PARALLEL_WORK_PACKAGES,
): ParallelismAssessment {
  const blockedBy = new Map<string, Set<string>>();
  for (const e of edges) {
    if (e.kind === 'SOFT_DEPENDENCY') continue;
    const set = blockedBy.get(e.toWorkPackageId) ?? new Set<string>();
    set.add(e.fromWorkPackageId);
    blockedBy.set(e.toWorkPackageId, set);
  }

  const ready = packages.filter((p) => {
    const preds = blockedBy.get(p.workPackageId);
    return !preds || preds.size === 0 || p.state === 'READY';
  });

  // Group packages that share the same hard predecessor set as a parallel cohort
  const cohorts = new Map<string, string[]>();
  for (const p of packages) {
    const preds = [...(blockedBy.get(p.workPackageId) ?? [])].sort().join('|');
    const key = preds || '__root__';
    const list = cohorts.get(key) ?? [];
    list.push(p.workPackageId);
    cohorts.set(key, list);
  }

  const proposedParallelGroups = [...cohorts.values()].filter(
    (g) => g.length > 1,
  );
  const largest = proposedParallelGroups.reduce(
    (m, g) => Math.max(m, g.length),
    ready.length,
  );

  // Detect contradictory/duplicated objectives in a parallel cohort
  let wasteReason: string | undefined;
  let overParallelWasteFlag = false;

  if (largest > maxParallel) {
    overParallelWasteFlag = true;
    wasteReason = `Proposed parallel cohort size ${largest} exceeds maxParallel=${maxParallel}; too much parallelism is waste, not intelligence.`;
  }

  for (const group of proposedParallelGroups) {
    const objs = packages
      .filter((p) => group.includes(p.workPackageId))
      .map((p) => p.objective.toLowerCase());
    const overlap = objs.filter(
      (o, i) => objs.findIndex((x) => x === o || (x.includes(o) && o.length > 12)) !== i,
    );
    if (overlap.length > 0) {
      overParallelWasteFlag = true;
      wasteReason =
        wasteReason ??
        'Parallel cohort contains duplicated/overlapping objectives — risk of contradictory work.';
    }
  }

  // Explicit over-parallel probe: if caller marked many READY with no independence
  const forcedParallel = packages.filter((p) =>
    p.blockers.includes('forced_over_parallel'),
  );
  if (forcedParallel.length > maxParallel) {
    overParallelWasteFlag = true;
    wasteReason =
      wasteReason ??
      'Forced over-parallelism exceeds independence bound; flag waste.';
  }

  return {
    proposedParallelGroups,
    independentEnough: !overParallelWasteFlag,
    overParallelWasteFlag,
    wasteReason,
    maxParallelAllowed: maxParallel,
  };
}

export function evaluateStopConditions(input: {
  dataRightsOk: boolean;
  criticalPrerequisiteOk: boolean;
  costRemaining: number;
  evidenceDisprovesHypothesis: boolean;
  securityPolicyPreserved: boolean;
  humanContinuationAuthorized: boolean;
}): { shouldStop: boolean; triggered: StopConditionKind[] } {
  const triggered: StopConditionKind[] = [];
  if (!input.dataRightsOk) triggered.push('REQUIRED_DATA_RIGHTS_FAIL');
  if (!input.criticalPrerequisiteOk)
    triggered.push('CRITICAL_PREREQUISITE_FAILS');
  if (input.costRemaining <= 0) triggered.push('COST_BUDGET_EXHAUSTED');
  if (input.evidenceDisprovesHypothesis)
    triggered.push('EVIDENCE_DISPROVES_HYPOTHESIS');
  if (!input.securityPolicyPreserved)
    triggered.push('SECURITY_POLICY_BOUNDARY_CANNOT_BE_PRESERVED');
  if (!input.humanContinuationAuthorized)
    triggered.push('HUMAN_REVIEWER_REJECTS_CONTINUATION');
  return { shouldStop: triggered.length > 0, triggered };
}

export function attemptStripGuardian(
  _plan: ExecutionPlan,
  _actor: Es32Actor,
): DenialResult {
  void _plan;
  void _actor;
  return deny(
    'Governance: planning cannot remove Guardian/RLS checks. Isolation unchanged.',
  );
}

export function attemptWidenPermissions(
  _plan: ExecutionPlan,
  _actor: Es32Actor,
): DenialResult {
  void _plan;
  void _actor;
  return deny('Governance: widen permissions DENIED.');
}

export function attemptCreateSpendingAuthority(
  _plan: ExecutionPlan,
  _actor: Es32Actor,
): DenialResult {
  void _plan;
  void _actor;
  return deny('Governance: create spending authority DENIED.');
}

export function attemptBypassHumanGate(
  _plan: ExecutionPlan,
  _actor: Es32Actor,
): DenialResult {
  void _plan;
  void _actor;
  return deny(
    'Governance: bypass human gates DENIED. HUMAN_GATE requires explicit authorization.',
  );
}

export function attemptTipLand(
  _plan: ExecutionPlan,
  _actor: Es32Actor,
): DenialResult {
  void _plan;
  void _actor;
  return deny('Tip-land onto xiv-v2/main DENIED.');
}

export function attemptManagePullRequest(
  _plan: ExecutionPlan,
  _actor: Es32Actor,
): DenialResult {
  void _plan;
  void _actor;
  return deny(
    'ManagePullRequest / draft PR creation DENIED for this park work.',
  );
}

export function attemptEnableL4Autonomy(
  _actor: Es32Actor,
): DenialResult {
  void _actor;
  return deny('L4_AUTONOMY_ENABLED must remain false.');
}

export function pricingFinalizeBlockedBeforeScope(
  packages: readonly WorkPackage[],
  completedIds: ReadonlySet<string>,
): {
  draftAllowedUnderSoft: boolean;
  finalizeBlocked: boolean;
  reason: string;
} {
  const pricing = packages.find((p) => p.workPackageId === 'wp-pricing');
  if (!pricing) {
    return {
      draftAllowedUnderSoft: false,
      finalizeBlocked: true,
      reason: 'pricing work package absent',
    };
  }
  const softFromReqs = pricing.dependencies.some(
    (d) =>
      d.kind === 'SOFT_DEPENDENCY' &&
      d.fromWorkPackageId === 'wp-requirements-decomposition',
  );
  const hardFromLogistics = pricing.dependencies.some(
    (d) =>
      d.kind === 'HARD_DEPENDENCY' &&
      d.fromWorkPackageId === 'wp-logistics-design',
  );
  const logisticsDone = completedIds.has('wp-logistics-design');
  const draftAllowedUnderSoft = softFromReqs;
  const finalizeBlocked = hardFromLogistics && !logisticsDone;
  return {
    draftAllowedUnderSoft,
    finalizeBlocked,
    reason: finalizeBlocked
      ? 'Pricing finalize HARD-blocked until logistics/technical scope sufficiently known; soft draft may proceed with assumptions.'
      : 'Technical scope sufficiently known for pricing finalize path.',
  };
}

export type PlannerCycleResult = {
  plan: ExecutionPlan;
  hops: Es32HopRecord[];
  softWire: Es32SoftWireSnapshot;
  locksIntact: boolean;
  honestyBanner: typeof HONESTY_BANNER;
  meta: {
    githubSotLabel: typeof GITHUB_SOT_LABEL;
    githubSotIssue: typeof GITHUB_SOT_ISSUE;
    githubSotFamily: typeof GITHUB_SOT_FAMILY;
    githubSotTitle: typeof GITHUB_SOT_TITLE;
    githubSotIssueNote: typeof GITHUB_SOT_ISSUE_NOTE;
    gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
    layerTitle: typeof ES_LAYER_TITLE;
    nextPhaseTitle: typeof NEXT_PHASE_TITLE;
    dbCandidatesStatus: typeof ES32_DB_CANDIDATES_STATUS;
    may: typeof ES32_MAY;
    mustNot: typeof ES32_MUST_NOT;
    dependencyKinds: typeof DEPENDENCY_KINDS;
    workPackageStates: typeof WORK_PACKAGE_STATES;
    workPackageFields: typeof WORK_PACKAGE_FIELDS;
    stopConditionKinds: typeof STOP_CONDITION_KINDS;
    coreFlow: typeof MISSION_DECOMPOSITION_CORE_FLOW;
    truthBoundary: typeof MISSION_PLANNER_TRUTH_BOUNDARY;
    locks: typeof ES32_LOCKS;
  };
};

export function defaultMissionConstraints(
  overrides: Partial<MissionConstraints> = {},
): MissionConstraints {
  return {
    maxParallelWorkPackages: DEFAULT_MAX_PARALLEL_WORK_PACKAGES,
    costBudgetUnits: 100,
    runtimeBudgetMinutes: 480,
    requireHumanGateBeforeExternalSubmission: true,
    preserveGuardianRls: true,
    preserveTenantUniverseIsolation: true,
    allowPermissionWidening: false,
    allowSpendingAuthorityCreation: false,
    allowHumanGateBypass: false,
    ...overrides,
  };
}

export function decomposeMission(
  intake: MissionIntake,
  packages: readonly WorkPackage[],
  options: {
    completedIds?: ReadonlySet<string>;
    humanAuthorizedIds?: ReadonlySet<string>;
    dataAuthorizedIds?: ReadonlySet<string>;
  } = {},
): ExecutionPlan {
  const resolved = resolveWorkPackageStates(packages, options);
  const edges = collectDependencyEdges(resolved);
  const criticalPath = computeCriticalPath(resolved, edges);
  const parallelism = assessParallelism(
    resolved,
    edges,
    intake.constraints.maxParallelWorkPackages,
  );

  const evidenceRequirements = [
    ...new Set(resolved.flatMap((p) => [...p.evidenceRequirements])),
  ];

  const planState: ExecutionPlan['planState'] = parallelism.overParallelWasteFlag
    ? 'REVIEW_REQUIRED'
    : resolved.some((p) => p.state === 'BLOCKED')
      ? 'BLOCKED'
      : resolved.some((p) => p.state === 'REVIEW_REQUIRED')
        ? 'REVIEW_REQUIRED'
        : 'PLANNED';

  return {
    planId: `plan-${intake.missionId}`,
    missionId: intake.missionId,
    objective: intake.objective,
    workPackages: resolved,
    dependencyEdges: edges,
    criticalPath,
    parallelism,
    stopConditions: [...DEFAULT_STOPS],
    agentTeamAssignments: resolved.map((p) => ({
      workPackageId: p.workPackageId,
      ownerTeam: p.ownerTeam,
      requiredCertifiedSkills: p.requiredCertifiedSkills,
    })),
    evidenceRequirements,
    l4AutonomyEnabled: false,
    guardianRlsIntact: true,
    permissionWideningAuthorized: false,
    spendingAuthorityCreated: false,
    humanGatesBypassed: false,
    tipLand: false,
    productionAuthorized: false,
    planState,
  };
}

export function runMissionDecompositionPlannerCycle(input: {
  actor: Es32Actor;
  repoRoot?: string;
  intake?: MissionIntake;
  packages?: readonly WorkPackage[];
  completedIds?: ReadonlySet<string>;
  humanAuthorizedIds?: ReadonlySet<string>;
  dataAuthorizedIds?: ReadonlySet<string>;
  forceOverParallelWaste?: boolean;
}): PlannerCycleResult {
  const locksIntact = assertEs32LocksIntact();
  const softWire = es32SoftWireSnapshot(input.repoRoot);
  const hops: Es32HopRecord[] = [];

  const intake: MissionIntake = input.intake ?? {
    missionId: GOV_QUANTUM_LOGISTICS_MISSION_ID,
    title: 'Gov quantum/logistics proposal',
    objective:
      'Produce a governed proposal with parallel evidence streams and human submission approval',
    constraints: defaultMissionConstraints(
      input.forceOverParallelWaste
        ? { maxParallelWorkPackages: 2 }
        : undefined,
    ),
    industryContext: 'government_quantum_logistics',
  };

  hops.push(
    hop('intake_mission', 'PASS', `Mission intake ${intake.missionId}`),
  );

  let packages = [
    ...(input.packages ?? buildGovQuantumLogisticsPackages(intake.missionId)),
  ];

  if (input.forceOverParallelWaste) {
    packages = packages.map((p) =>
      [
        'wp-logistics-design',
        'wp-quantum-ai-evidence',
        'wp-compliance',
        'wp-pricing',
        'wp-merge-proposal',
      ].includes(p.workPackageId)
        ? {
            ...p,
            blockers: [...p.blockers, 'forced_over_parallel'],
            state: 'READY' as const,
            dependencies: [],
          }
        : p,
    );
  }

  hops.push(
    hop(
      'decompose_packages',
      'PASS',
      `Decomposed ${packages.length} work packages`,
    ),
  );

  const plan = decomposeMission(intake, packages, {
    completedIds: input.completedIds,
    humanAuthorizedIds: input.humanAuthorizedIds,
    dataAuthorizedIds: input.dataAuthorizedIds,
  });

  hops.push(
    hop(
      'wire_dependencies',
      'PASS',
      `Wired ${plan.dependencyEdges.length} dependency edges`,
    ),
  );
  hops.push(
    hop(
      'compute_critical_path',
      'PASS',
      `Critical path length ${plan.criticalPath.length}`,
    ),
  );
  hops.push(
    hop(
      'bound_parallelism',
      plan.parallelism.overParallelWasteFlag ? 'BLOCKED' : 'PASS',
      plan.parallelism.overParallelWasteFlag
        ? plan.parallelism.wasteReason ?? 'Over-parallel waste flagged'
        : 'Parallelism within independence bounds',
    ),
  );
  hops.push(
    hop(
      'assign_teams',
      'PASS',
      `Assigned ${plan.agentTeamAssignments.length} team bindings`,
    ),
  );
  hops.push(
    hop(
      'encode_evidence_and_stops',
      'PASS',
      `Evidence reqs ${plan.evidenceRequirements.length}; stops ${plan.stopConditions.length}`,
    ),
  );
  hops.push(
    hop('emit_execution_plan', 'PASS', `Plan ${plan.planId} state=${plan.planState}`),
  );

  const softPresent =
    softWire.es31DynamicAgentTeamBuilder.present ||
    softWire.es30AgentReputationTrustGraph.present ||
    softWire.es27CapabilityComposition.present ||
    softWire.es15DeploymentPlans.present ||
    softWire.er7QuantumHonesty.present;

  hops.push(
    hop(
      'soft_wire_prior_phases',
      softWireHopState(softPresent),
      [
        softWire.es31DynamicAgentTeamBuilder.note,
        softWire.es30AgentReputationTrustGraph.note,
        softWire.es27CapabilityComposition.note,
        softWire.es15DeploymentPlans.note,
        softWire.er7QuantumHonesty.note,
      ].join(' | '),
    ),
  );

  void input.actor;
  void isHumanApprover;

  return {
    plan,
    hops,
    softWire,
    locksIntact,
    honestyBanner: HONESTY_BANNER,
    meta: {
      githubSotLabel: GITHUB_SOT_LABEL,
      githubSotIssue: GITHUB_SOT_ISSUE,
      githubSotFamily: GITHUB_SOT_FAMILY,
      githubSotTitle: GITHUB_SOT_TITLE,
      githubSotIssueNote: GITHUB_SOT_ISSUE_NOTE,
      gitlabMirrorNote: GITLAB_MIRROR_NOTE,
      layerTitle: ES_LAYER_TITLE,
      nextPhaseTitle: NEXT_PHASE_TITLE,
      dbCandidatesStatus: ES32_DB_CANDIDATES_STATUS,
      may: ES32_MAY,
      mustNot: ES32_MUST_NOT,
      dependencyKinds: DEPENDENCY_KINDS,
      workPackageStates: WORK_PACKAGE_STATES,
      workPackageFields: WORK_PACKAGE_FIELDS,
      stopConditionKinds: STOP_CONDITION_KINDS,
      coreFlow: MISSION_DECOMPOSITION_CORE_FLOW,
      truthBoundary: MISSION_PLANNER_TRUTH_BOUNDARY,
      locks: ES32_LOCKS,
    },
  };
}

export function classifyDependencyKind(kind: DependencyKind): DependencyKind {
  return kind;
}
