/**
 * 62L-EO6 — Classical Baseline Requirement runtime.
 *
 * Framework: problem definition → classical baselines → advanced candidate →
 * metric comparison → tradeoff honesty → promotion gate → vague-claim deny.
 *
 * Soft-wires EO4 matrix, EO5 evidence boundary, EM9 classical quant benchmarks.
 * L4_AUTONOMY_ENABLED=false. No auto-promote without measured advantage.
 */

import {
  CLASSICAL_BASELINE_COMPARISON_FLOW,
  CLASSICAL_BASELINE_FAMILIES,
  CLASSICAL_BASELINE_REQUIREMENT_CYCLE,
  COMPARISON_METRICS,
  EO6_DB_CANDIDATES_STATUS,
  EO6_LOCKS,
  EO6_MAY,
  EO6_MUST_NOT,
  EO6_POLICY_FRAMING,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  PROBLEM_DEFINITION_FIELDS,
  PROMOTION_FALLBACK_OUTCOMES,
  PROMOTION_OUTCOMES_WITH_EVIDENCE,
  VAGUE_CLAIM_PATTERNS,
  assertEo6LocksIntact,
  eo6SoftWireSnapshot,
  isPromotionOutcomeWithEvidence,
  isVagueClaimText,
  metricDeltaDirection,
  type ClassicalBaselineFamily,
  type ClassicalBaselineFlowHop,
  type ComparisonMetric,
  type Eo6EvidenceState,
  type Eo6HopRecord,
  type Eo6SoftWireSnapshot,
  type MetaheuristicSubtype,
  type PromotionFallbackOutcome,
  type PromotionOutcome,
  type PromotionOutcomeWithEvidence,
} from './classical-baseline-requirement-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof CLASSICAL_BASELINE_REQUIREMENT_CYCLE)[number],
  state: Eo6EvidenceState,
  summary: string,
): Eo6HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

// ---------------------------------------------------------------------------
// Problem definition
// ---------------------------------------------------------------------------

export type ProblemDefinition = {
  problemId: string;
  objectiveFunction: string;
  constraints: readonly string[];
  datasetVersion: string;
  baselineAlgorithms: readonly ClassicalBaselineFamily[];
  advancedCandidateAlgorithms: readonly string[];
  evaluationMetrics: readonly ComparisonMetric[];
  computeBudget: string;
  runtimeBudget: string;
  reproducibilitySeed: number;
  testEnvironment: string;
  expectedOutcome: string;
  evidenceOwner: string;
  registeredAt: string;
};

export type DeniedResult = {
  denied: true;
  state: 'DENIED';
  reason: string;
  locks?: Record<string, boolean>;
};

export type MetricObservation = {
  metric: ComparisonMetric;
  baselineValue: number;
  candidateValue: number;
  unit: string;
  direction: 'improved' | 'worsened' | 'unchanged';
};

export type TradeoffStatement = {
  improved: readonly ComparisonMetric[];
  worsened: readonly ComparisonMetric[];
  unchanged: readonly ComparisonMetric[];
  narrative: string;
  honest: boolean;
};

export type BenchmarkEvidence = {
  evidenceId: string;
  problemId: string;
  datasetVersion: string;
  reproducibilitySeed: number;
  classicalFamiliesRun: readonly ClassicalBaselineFamily[];
  candidateId: string;
  observations: readonly MetricObservation[];
  tradeoff: TradeoffStatement;
  computedAt: string;
};

export type PromotionDecision = {
  problemId: string;
  outcome: PromotionOutcome;
  promoted: boolean;
  autoPromoted: false;
  requiresHumanReview: true;
  reason: string;
  evidenceId: string | null;
  tradeoff: TradeoffStatement | null;
  at: string;
};

function missingProblemFields(
  input: Partial<ProblemDefinition>,
): ProblemDefinitionFieldGap[] {
  const gaps: ProblemDefinitionFieldGap[] = [];
  for (const field of PROBLEM_DEFINITION_FIELDS) {
    const value = (input as Record<string, unknown>)[field];
    const empty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);
    if (empty) gaps.push(field);
  }
  return gaps;
}

type ProblemDefinitionFieldGap =
  (typeof PROBLEM_DEFINITION_FIELDS)[number];

/**
 * Register a fully-specified optimization / experiment problem.
 * All problem definition fields are required.
 */
export function registerProblemDefinition(
  input: Omit<ProblemDefinition, 'registeredAt'>,
): ProblemDefinition | DeniedResult {
  const gaps = missingProblemFields(input);
  if (gaps.length > 0) {
    return {
      denied: true,
      state: 'DENIED',
      reason: `MISSING_PROBLEM_DEFINITION_FIELDS: ${gaps.join(', ')}`,
    };
  }
  if (!input.evidenceOwner.trim()) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'EVIDENCE_OWNER_REQUIRED',
      locks: { EVIDENCE_OWNER_REQUIRED: EO6_LOCKS.EVIDENCE_OWNER_REQUIRED },
    };
  }
  if (input.baselineAlgorithms.length === 0) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'CLASSICAL_BASELINES_REQUIRED',
      locks: {
        PROMOTE_WITHOUT_CLASSICAL_BASELINE:
          EO6_LOCKS.PROMOTE_WITHOUT_CLASSICAL_BASELINE,
      },
    };
  }
  for (const family of input.baselineAlgorithms) {
    if (!(CLASSICAL_BASELINE_FAMILIES as readonly string[]).includes(family)) {
      return {
        denied: true,
        state: 'DENIED',
        reason: `UNKNOWN_BASELINE_FAMILY: ${family}`,
      };
    }
  }
  return {
    ...input,
    registeredAt: nowIso(),
  };
}

/**
 * Select applicable classical baseline families for a problem domain.
 * Always includes at least one greedy/rule-based baseline when applicable.
 */
export function selectClassicalBaselines(input: {
  requiredFamilies: readonly ClassicalBaselineFamily[];
  includeMetaheuristics?: boolean;
  metaheuristicSubtypes?: readonly MetaheuristicSubtype[];
  dynamicProgrammingApplicable?: boolean;
}): {
  families: readonly ClassicalBaselineFamily[];
  metaheuristicSubtypes: readonly MetaheuristicSubtype[];
  note: string;
} {
  const set = new Set<ClassicalBaselineFamily>(input.requiredFamilies);
  set.add('greedy_rule_based');
  if (input.dynamicProgrammingApplicable) set.add('dynamic_programming');
  if (input.includeMetaheuristics) set.add('metaheuristics');
  return {
    families: [...set],
    metaheuristicSubtypes: input.metaheuristicSubtypes ?? [],
    note: 'Classical baseline families selected; presence of family ≠ VERIFIED result.',
  };
}

/**
 * Compare candidate metrics against classical baseline observations.
 * Records exact improved / worsened / unchanged sets (tradeoff honesty).
 */
export function compareAgainstBaselines(input: {
  problemId: string;
  datasetVersion: string;
  reproducibilitySeed: number;
  classicalFamiliesRun: readonly ClassicalBaselineFamily[];
  candidateId: string;
  observations: readonly {
    metric: ComparisonMetric;
    baselineValue: number;
    candidateValue: number;
    unit: string;
  }[];
}): BenchmarkEvidence | DeniedResult {
  if (input.classicalFamiliesRun.length === 0) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_CLASSICAL_BASELINE_RUN — classical baselines required before comparison.',
      locks: {
        PROMOTE_WITHOUT_CLASSICAL_BASELINE:
          EO6_LOCKS.PROMOTE_WITHOUT_CLASSICAL_BASELINE,
        QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE:
          EO6_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE,
      },
    };
  }
  if (input.observations.length === 0) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'NO_METRIC_OBSERVATIONS — comparison requires measured metrics.',
      locks: {
        PROMOTE_WITHOUT_BENCHMARK_EVIDENCE:
          EO6_LOCKS.PROMOTE_WITHOUT_BENCHMARK_EVIDENCE,
      },
    };
  }

  const observations: MetricObservation[] = input.observations.map((o) => ({
    ...o,
    direction: metricDeltaDirection(
      o.metric,
      o.baselineValue,
      o.candidateValue,
    ),
  }));

  const improved = observations
    .filter((o) => o.direction === 'improved')
    .map((o) => o.metric);
  const worsened = observations
    .filter((o) => o.direction === 'worsened')
    .map((o) => o.metric);
  const unchanged = observations
    .filter((o) => o.direction === 'unchanged')
    .map((o) => o.metric);

  const narrative =
    improved.length === 0 && worsened.length === 0
      ? 'No measured metric deltas vs classical baselines.'
      : `Improved: [${improved.join(', ') || 'none'}]. Worsened: [${worsened.join(', ') || 'none'}]. Unchanged: [${unchanged.join(', ') || 'none'}].`;

  // Tradeoff honesty: if anything improved, worsened must be explicitly stated
  // (may be empty only when truly none worsened — still must be stated).
  const honest =
    (improved.length === 0 && worsened.length === 0) ||
    (improved.length > 0 && narrative.includes('Worsened:')) ||
    (worsened.length > 0 && narrative.includes('Improved:'));

  return {
    evidenceId: `ev-${input.problemId}-${input.candidateId}`,
    problemId: input.problemId,
    datasetVersion: input.datasetVersion,
    reproducibilitySeed: input.reproducibilitySeed,
    classicalFamiliesRun: input.classicalFamiliesRun,
    candidateId: input.candidateId,
    observations,
    tradeoff: {
      improved,
      worsened,
      unchanged,
      narrative,
      honest,
    },
    computedAt: nowIso(),
  };
}

/**
 * Critical rule: promotion requires classical baseline evidence AND an honest
 * tradeoff statement (exactly what improved and what got worse).
 * Auto-promote without measured advantage is DENIED.
 */
export function evaluatePromotionGate(input: {
  problem: ProblemDefinition;
  evidence: BenchmarkEvidence | null;
  requestedOutcome: PromotionOutcome;
  autoPromote?: boolean;
}): PromotionDecision | DeniedResult {
  if (input.autoPromote) {
    return {
      denied: true,
      state: 'DENIED',
      reason:
        'NO_AUTO_PROMOTE_WITHOUT_MEASURED_ADVANTAGE — L4_AUTONOMY_ENABLED=false; human review required.',
      locks: {
        AUTO_PROMOTE_WITHOUT_MEASURED_ADVANTAGE:
          EO6_LOCKS.AUTO_PROMOTE_WITHOUT_MEASURED_ADVANTAGE,
        L4_AUTONOMY_ENABLED: EO6_LOCKS.L4_AUTONOMY_ENABLED,
        RECOMMEND_EQ_PROMOTE: EO6_LOCKS.RECOMMEND_EQ_PROMOTE,
      },
    };
  }

  if (!input.evidence) {
    return {
      denied: true,
      state: 'DENIED',
      reason:
        'PROMOTE_WITHOUT_BENCHMARK_EVIDENCE — every optimization claim must be traceable to benchmark evidence.',
      locks: {
        PROMOTE_WITHOUT_BENCHMARK_EVIDENCE:
          EO6_LOCKS.PROMOTE_WITHOUT_BENCHMARK_EVIDENCE,
      },
    };
  }

  if (input.evidence.classicalFamiliesRun.length === 0) {
    return {
      denied: true,
      state: 'DENIED',
      reason: 'PROMOTE_WITHOUT_CLASSICAL_BASELINE',
      locks: {
        PROMOTE_WITHOUT_CLASSICAL_BASELINE:
          EO6_LOCKS.PROMOTE_WITHOUT_CLASSICAL_BASELINE,
      },
    };
  }

  const tradeoff = input.evidence.tradeoff;
  if (!tradeoff.honest) {
    return {
      denied: true,
      state: 'DENIED',
      reason:
        'PROMOTE_WITHOUT_TRADEOFF_STATEMENT — must state exactly what improved and what got worse.',
      locks: {
        PROMOTE_WITHOUT_TRADEOFF_STATEMENT:
          EO6_LOCKS.PROMOTE_WITHOUT_TRADEOFF_STATEMENT,
        TRADEOFF_IMPROVED_ONLY_WITHOUT_WORSENED:
          EO6_LOCKS.TRADEOFF_IMPROVED_ONLY_WITHOUT_WORSENED,
      },
    };
  }

  // Claiming an evidence-backed promotion outcome requires at least one improvement.
  if (isPromotionOutcomeWithEvidence(input.requestedOutcome)) {
    if (tradeoff.improved.length === 0) {
      return {
        problemId: input.problem.problemId,
        outcome: 'NO_MEASURED_ADVANTAGE',
        promoted: false,
        autoPromoted: false,
        requiresHumanReview: true,
        reason:
          'NO_MEASURED_ADVANTAGE — requested promotion outcome but no metric improved vs classical baselines.',
        evidenceId: input.evidence.evidenceId,
        tradeoff,
        at: nowIso(),
      };
    }
    // Must still state what got worse (even if empty list is explicit).
    if (!tradeoff.narrative.toLowerCase().includes('worsened')) {
      return {
        denied: true,
        state: 'DENIED',
        reason:
          'TRADEOFF_IMPROVED_ONLY_WITHOUT_WORSENED — improved metrics claimed without stating what got worse.',
        locks: {
          TRADEOFF_IMPROVED_ONLY_WITHOUT_WORSENED:
            EO6_LOCKS.TRADEOFF_IMPROVED_ONLY_WITHOUT_WORSENED,
        },
      };
    }
    return {
      problemId: input.problem.problemId,
      outcome: input.requestedOutcome,
      promoted: false, // recommendation only — human review required
      autoPromoted: false,
      requiresHumanReview: true,
      reason: `RECOMMENDATION_ONLY — ${input.requestedOutcome} supported by measured deltas; human review required before promote. ${tradeoff.narrative}`,
      evidenceId: input.evidence.evidenceId,
      tradeoff,
      at: nowIso(),
    };
  }

  // Fallback outcomes
  const fallback = input.requestedOutcome as PromotionFallbackOutcome;
  if (!(PROMOTION_FALLBACK_OUTCOMES as readonly string[]).includes(fallback)) {
    return {
      denied: true,
      state: 'DENIED',
      reason: `UNKNOWN_PROMOTION_OUTCOME: ${String(input.requestedOutcome)}`,
    };
  }

  return {
    problemId: input.problem.problemId,
    outcome: fallback,
    promoted: false,
    autoPromoted: false,
    requiresHumanReview: true,
    reason:
      fallback === 'RESEARCH_ONLY'
        ? 'RESEARCH_ONLY — hold as research; no production promotion.'
        : 'NO_MEASURED_ADVANTAGE — classical baselines not beaten on promoted dimensions.',
    evidenceId: input.evidence.evidenceId,
    tradeoff,
    at: nowIso(),
  };
}

/**
 * Attempt auto-promote — always DENIED under EO6 locks.
 */
export function attemptAutoPromote(input?: {
  requestedOutcome?: PromotionOutcomeWithEvidence;
}): DeniedResult {
  return {
    denied: true,
    state: 'DENIED',
    reason:
      'NO_AUTO_PROMOTE_WITHOUT_MEASURED_ADVANTAGE — auto-promote denied; L4_AUTONOMY_ENABLED=false.',
    locks: {
      AUTO_PROMOTE_WITHOUT_MEASURED_ADVANTAGE:
        EO6_LOCKS.AUTO_PROMOTE_WITHOUT_MEASURED_ADVANTAGE,
      L4_AUTONOMY_ENABLED: EO6_LOCKS.L4_AUTONOMY_ENABLED,
      RECOMMEND_EQ_PROMOTE: EO6_LOCKS.RECOMMEND_EQ_PROMOTE,
    },
  };
}

/**
 * Government proposal rule: deny vague optimization claims without
 * benchmark evidence / test data.
 */
export function evaluateOptimizationClaim(input: {
  claimText: string;
  hasBenchmarkEvidence: boolean;
  classicalBaselineCompared: boolean;
}): {
  allowed: boolean;
  state: 'PASS' | 'DENIED';
  reason: string;
  vague: boolean;
  locks: Record<string, boolean>;
} {
  const vague = isVagueClaimText(input.claimText);
  if (vague && !input.hasBenchmarkEvidence) {
    return {
      allowed: false,
      state: 'DENIED',
      reason:
        'VAGUE_OPTIMIZATION_CLAIM_WITHOUT_DATA — deny claims like "quantum-powered efficiency" without test data.',
      vague: true,
      locks: {
        VAGUE_OPTIMIZATION_CLAIM_WITHOUT_DATA:
          EO6_LOCKS.VAGUE_OPTIMIZATION_CLAIM_WITHOUT_DATA,
        QUANTUM_POWERED_EFFICIENCY_WITHOUT_TEST_DATA:
          EO6_LOCKS.QUANTUM_POWERED_EFFICIENCY_WITHOUT_TEST_DATA,
      },
    };
  }
  if (!input.hasBenchmarkEvidence) {
    return {
      allowed: false,
      state: 'DENIED',
      reason:
        'OPTIMIZATION_CLAIM_REQUIRES_BENCHMARK_EVIDENCE — every optimization claim must be traceable to benchmark evidence.',
      vague,
      locks: {
        PROMOTE_WITHOUT_BENCHMARK_EVIDENCE:
          EO6_LOCKS.PROMOTE_WITHOUT_BENCHMARK_EVIDENCE,
      },
    };
  }
  if (!input.classicalBaselineCompared) {
    return {
      allowed: false,
      state: 'DENIED',
      reason:
        'QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE — classical baseline comparison required.',
      vague,
      locks: {
        QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE:
          EO6_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE,
        QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE:
          EO6_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE,
      },
    };
  }
  return {
    allowed: true,
    state: 'PASS',
    reason:
      'Claim permitted as evidence-backed statement only — not production authorization; human review still required for consequential use.',
    vague,
    locks: {
      VAGUE_OPTIMIZATION_CLAIM_WITHOUT_DATA:
        EO6_LOCKS.VAGUE_OPTIMIZATION_CLAIM_WITHOUT_DATA,
      PRODUCTION_AUTHORIZATION: EO6_LOCKS.PRODUCTION_AUTHORIZATION,
    },
  };
}

export function denyVagueQuantumPoweredEfficiencyClaim(): DeniedResult {
  return {
    denied: true,
    state: 'DENIED',
    reason:
      'QUANTUM_POWERED_EFFICIENCY_WITHOUT_TEST_DATA — vague claim denied; provide classical baseline comparison + measured metrics.',
    locks: {
      QUANTUM_POWERED_EFFICIENCY_WITHOUT_TEST_DATA:
        EO6_LOCKS.QUANTUM_POWERED_EFFICIENCY_WITHOUT_TEST_DATA,
      VAGUE_OPTIMIZATION_CLAIM_WITHOUT_DATA:
        EO6_LOCKS.VAGUE_OPTIMIZATION_CLAIM_WITHOUT_DATA,
    },
  };
}

// ---------------------------------------------------------------------------
// Bootstrap + cycle
// ---------------------------------------------------------------------------

export type Eo6BootstrapResult = {
  honestyBanner: typeof HONESTY_BANNER;
  sotIssue: typeof GITHUB_SOT_ISSUE;
  sotTitle: typeof GITHUB_SOT_TITLE;
  gitlabMirrorNote: typeof GITLAB_MIRROR_NOTE;
  nextPhase: typeof NEXT_PHASE_TITLE;
  dbCandidatesStatus: typeof EO6_DB_CANDIDATES_STATUS;
  locksIntact: boolean;
  softWire: Eo6SoftWireSnapshot;
  flow: typeof CLASSICAL_BASELINE_COMPARISON_FLOW;
  families: typeof CLASSICAL_BASELINE_FAMILIES;
  metrics: typeof COMPARISON_METRICS;
  promotionOutcomes: typeof PROMOTION_OUTCOMES_WITH_EVIDENCE;
  fallbackOutcomes: typeof PROMOTION_FALLBACK_OUTCOMES;
  vaguePatterns: typeof VAGUE_CLAIM_PATTERNS;
  may: typeof EO6_MAY;
  mustNot: typeof EO6_MUST_NOT;
  policy: typeof EO6_POLICY_FRAMING;
  l4AutonomyEnabled: false;
  hops: Eo6HopRecord[];
};

export function bootstrapClassicalBaselineRequirement(
  repoRoot?: string,
): Eo6BootstrapResult {
  const softWire = eo6SoftWireSnapshot(repoRoot);
  const hops: Eo6HopRecord[] = [
    hop('honesty_locks', 'PASS', HONESTY_BANNER),
    hop(
      'baseline_framework_bootstrap',
      'PASS',
      'Classical baseline requirement framework bootstrapped.',
    ),
    hop(
      'problem_definition_fields',
      'PASS',
      `Problem fields encoded: ${PROBLEM_DEFINITION_FIELDS.join(', ')}`,
    ),
    hop(
      'baseline_families_encoded',
      'PASS',
      `Baseline families: ${CLASSICAL_BASELINE_FAMILIES.join(', ')}`,
    ),
    hop(
      'comparison_metrics_encoded',
      'PASS',
      `Comparison metrics: ${COMPARISON_METRICS.join(', ')}`,
    ),
    hop(
      'promotion_outcomes_encoded',
      'PASS',
      `Promotion outcomes (evidence): ${PROMOTION_OUTCOMES_WITH_EVIDENCE.join(' | ')}; else ${PROMOTION_FALLBACK_OUTCOMES.join(' | ')}`,
    ),
    hop(
      'eo4_capability_matrix_soft_wire',
      softWire.eo4CapabilityMatrix.present ||
        softWire.eo4CapabilityMatrixTypes.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.eo4CapabilityMatrix.present ||
        softWire.eo4CapabilityMatrixTypes.present
        ? 'EO4 matrix soft-wire PRESENT (≠ VERIFIED).'
        : 'EO4 matrix WAITING_DATA on this tip.',
    ),
    hop(
      'eo5_evidence_boundary_soft_wire',
      softWire.eo5EvidenceBoundary.present ||
        softWire.eo5EvidenceBoundaryTypes.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.eo5EvidenceBoundary.present ||
        softWire.eo5EvidenceBoundaryTypes.present
        ? 'EO5 evidence boundary soft-wire PRESENT (language gate / classical mandate).'
        : 'EO5 evidence boundary WAITING_DATA on this tip.',
    ),
    hop(
      'em9_classical_quant_benchmark_soft_wire',
      softWire.em9ClassicalQuantBenchmark.present ? 'PASS' : 'WAITING_DATA',
      softWire.em9ClassicalQuantBenchmark.present
        ? 'EM9 classical quant benchmark PRESENT.'
        : 'EM9 classical quant benchmark WAITING_DATA.',
    ),
    hop('l4_autonomy_false', 'PASS', 'L4_AUTONOMY_ENABLED=false'),
  ];

  return {
    honestyBanner: HONESTY_BANNER,
    sotIssue: GITHUB_SOT_ISSUE,
    sotTitle: GITHUB_SOT_TITLE,
    gitlabMirrorNote: GITLAB_MIRROR_NOTE,
    nextPhase: NEXT_PHASE_TITLE,
    dbCandidatesStatus: EO6_DB_CANDIDATES_STATUS,
    locksIntact: assertEo6LocksIntact(),
    softWire,
    flow: CLASSICAL_BASELINE_COMPARISON_FLOW,
    families: CLASSICAL_BASELINE_FAMILIES,
    metrics: COMPARISON_METRICS,
    promotionOutcomes: PROMOTION_OUTCOMES_WITH_EVIDENCE,
    fallbackOutcomes: PROMOTION_FALLBACK_OUTCOMES,
    vaguePatterns: VAGUE_CLAIM_PATTERNS,
    may: EO6_MAY,
    mustNot: EO6_MUST_NOT,
    policy: EO6_POLICY_FRAMING,
    l4AutonomyEnabled: false,
    hops,
  };
}

export type BaselineComparisonCycleResult = {
  problem: ProblemDefinition;
  evidence: BenchmarkEvidence;
  promotion: PromotionDecision;
  claimGate: ReturnType<typeof evaluateOptimizationClaim>;
  flowPosition: ClassicalBaselineFlowHop;
  hops: Eo6HopRecord[];
  softWire: Eo6SoftWireSnapshot;
};

/**
 * Run a full classical-baseline comparison cycle for one problem + candidate.
 */
export function runClassicalBaselineComparisonCycle(input: {
  problem: Omit<ProblemDefinition, 'registeredAt'>;
  candidateId: string;
  observations: readonly {
    metric: ComparisonMetric;
    baselineValue: number;
    candidateValue: number;
    unit: string;
  }[];
  requestedOutcome: PromotionOutcome;
  claimText?: string;
  repoRoot?: string;
}): BaselineComparisonCycleResult | DeniedResult {
  const problem = registerProblemDefinition(input.problem);
  if ('denied' in problem) return problem;

  const hops: Eo6HopRecord[] = [
    hop('problem_register', 'REGISTERED', `problemId=${problem.problemId}`),
    hop(
      'baseline_selection',
      'PASS',
      `Baselines: ${problem.baselineAlgorithms.join(', ')}`,
    ),
  ];

  const evidence = compareAgainstBaselines({
    problemId: problem.problemId,
    datasetVersion: problem.datasetVersion,
    reproducibilitySeed: problem.reproducibilitySeed,
    classicalFamiliesRun: problem.baselineAlgorithms,
    candidateId: input.candidateId,
    observations: input.observations,
  });
  if ('denied' in evidence) return evidence;

  hops.push(
    hop('metric_comparison', 'COMPARED', evidence.tradeoff.narrative),
    hop(
      'tradeoff_honesty_required',
      evidence.tradeoff.honest ? 'PASS' : 'FAIL',
      evidence.tradeoff.narrative,
    ),
    hop(
      'improved_and_worsened_must_both_be_stated',
      evidence.tradeoff.narrative.includes('Improved:') &&
        evidence.tradeoff.narrative.includes('Worsened:')
        ? 'PASS'
        : 'FAIL',
      'Tradeoff narrative must include Improved and Worsened clauses.',
    ),
  );

  const promotion = evaluatePromotionGate({
    problem,
    evidence,
    requestedOutcome: input.requestedOutcome,
  });
  if ('denied' in promotion) return promotion;

  hops.push(
    hop(
      'promotion_gate',
      promotion.promoted ? 'PROMOTED' : 'HELD',
      promotion.reason,
    ),
    hop(
      'no_auto_promote_without_measured_advantage',
      'PASS',
      'autoPromoted=false; human review required',
    ),
  );

  const claimGate = evaluateOptimizationClaim({
    claimText:
      input.claimText ??
      `${input.candidateId} vs classical baselines: ${evidence.tradeoff.narrative}`,
    hasBenchmarkEvidence: true,
    classicalBaselineCompared: true,
  });
  hops.push(
    hop(
      'vague_claim_deny',
      claimGate.state === 'PASS' ? 'PASS' : 'DENIED',
      claimGate.reason,
    ),
    hop('evidence', 'PASS', `evidenceId=${evidence.evidenceId}`),
  );

  return {
    problem,
    evidence,
    promotion,
    claimGate,
    flowPosition: 'evidence_owner_attestation',
    hops,
    softWire: eo6SoftWireSnapshot(input.repoRoot),
  };
}
