/**
 * 62L-EO6 — Classical Baseline Requirement (park-and-implement).
 *
 * Every advanced optimization, AI-agentic, or quantum experiment must be
 * compared against strong classical baselines so XIV can prove whether a new
 * method actually improves performance.
 *
 * Soft-wire: EO4 AI/Quantum Capability Matrix, EO5 Quantum Evidence Boundary
 * (language gate / classical baseline mandate), EM9 classical quant benchmarks
 * when PRESENT. Presence alone ≠ VERIFIED.
 *
 * SoT: GitHub #159 EO family (authoritative). GitLab mirror: not resolved
 * (GitLab MCP needsAuth; no issue number invented).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * Critical rule (tested): a method need not beat classical baselines on every
 * metric, but XIV must state exactly what tradeoff improved and what got worse.
 *
 * Government proposal rule: every optimization claim must be traceable to
 * benchmark evidence. Deny vague claims like "quantum-powered efficiency"
 * without test data.
 *
 * Auto-promote without measured advantage: DENIED.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): EO7 — Government Logistics Mission Pack.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 159 as const;
export const GITHUB_SOT_TITLE =
  '62L-EO6 Classical Baseline Requirement — every advanced / AI-agentic / quantum experiment compared against strong classical baselines with tradeoff honesty' as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EO6_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EO7 — Government Logistics Mission Pack — transportation, warehousing, inventory, maintenance, readiness, routing, procurement, supplier-risk capabilities for public-sector missions.' as const;

/**
 * Core comparison workflow (encoded):
 * Define problem → select classical baselines → run baselines → run advanced
 * candidate → compare metrics → record tradeoffs → promotion gate →
 * evidence owner attestation
 */
export const CLASSICAL_BASELINE_COMPARISON_FLOW = [
  'define_problem',
  'select_classical_baselines',
  'run_classical_baselines',
  'run_advanced_candidate',
  'compare_metrics',
  'record_tradeoffs',
  'promotion_gate',
  'evidence_owner_attestation',
] as const;

export type ClassicalBaselineFlowHop =
  (typeof CLASSICAL_BASELINE_COMPARISON_FLOW)[number];

export const CLASSICAL_BASELINE_REQUIREMENT_CYCLE = [
  'honesty_locks',
  'baseline_framework_bootstrap',
  // A — problem definition fields
  'problem_definition_fields',
  'problem_register',
  // B — minimum baseline families
  'baseline_families_encoded',
  'baseline_selection',
  // C — comparison metrics
  'comparison_metrics_encoded',
  'metric_comparison',
  // D — promotion outcomes + gate
  'promotion_outcomes_encoded',
  'promotion_gate',
  'no_auto_promote_without_measured_advantage',
  // E — tradeoff honesty (critical)
  'tradeoff_honesty_required',
  'improved_and_worsened_must_both_be_stated',
  // F — vague claim deny (government proposal rule)
  'vague_claim_deny',
  'quantum_powered_efficiency_without_data_denied',
  'optimization_claim_requires_benchmark_evidence',
  // G — soft-wire EO4 / EO5 / EM9
  'eo4_capability_matrix_soft_wire',
  'eo5_evidence_boundary_soft_wire',
  'em9_classical_quant_benchmark_soft_wire',
  'l4_autonomy_false',
  'evidence',
] as const;

export type Eo6Hop = (typeof CLASSICAL_BASELINE_REQUIREMENT_CYCLE)[number];

export type Eo6EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'DENIED'
  | 'REJECTED'
  | 'CANDIDATE'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_VERIFIED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'ADVISORY_ONLY'
  | 'RESEARCH_ONLY'
  | 'NO_MEASURED_ADVANTAGE'
  | 'REGISTERED'
  | 'COMPARED'
  | 'PROMOTED'
  | 'HELD';

export type Eo6HopRecord = {
  hop: Eo6Hop;
  state: Eo6EvidenceState;
  summary: string;
  at: string;
};

/** Required problem definition fields. */
export const PROBLEM_DEFINITION_FIELDS = [
  'problemId',
  'objectiveFunction',
  'constraints',
  'datasetVersion',
  'baselineAlgorithms',
  'advancedCandidateAlgorithms',
  'evaluationMetrics',
  'computeBudget',
  'runtimeBudget',
  'reproducibilitySeed',
  'testEnvironment',
  'expectedOutcome',
  'evidenceOwner',
] as const;

export type ProblemDefinitionField =
  (typeof PROBLEM_DEFINITION_FIELDS)[number];

/** Minimum classical baseline families. */
export const CLASSICAL_BASELINE_FAMILIES = [
  'greedy_rule_based',
  'linear_programming',
  'mixed_integer_programming',
  'constraint_programming',
  'graph_algorithms',
  'dynamic_programming',
  'monte_carlo_statistical',
  'classical_ml',
  'metaheuristics',
] as const;

export type ClassicalBaselineFamily =
  (typeof CLASSICAL_BASELINE_FAMILIES)[number];

/** Metaheuristic subtypes (where relevant). */
export const METAHEURISTIC_SUBTYPES = [
  'genetic_algorithm',
  'simulated_annealing',
  'tabu_search',
  'particle_swarm',
  'other_metaheuristic',
] as const;

export type MetaheuristicSubtype = (typeof METAHEURISTIC_SUBTYPES)[number];

/** Comparison metrics. */
export const COMPARISON_METRICS = [
  'solution_quality',
  'runtime',
  'memory',
  'throughput',
  'convergence',
  'robustness',
  'reliability',
  'cost',
  'energy_proxy',
  'explainability',
  'reproducibility',
] as const;

export type ComparisonMetric = (typeof COMPARISON_METRICS)[number];

/**
 * Promotion outcomes — only with measured evidence.
 * Else: NO_MEASURED_ADVANTAGE | RESEARCH_ONLY.
 */
export const PROMOTION_OUTCOMES_WITH_EVIDENCE = [
  'BETTER_QUALITY',
  'LOWER_COST',
  'LOWER_LATENCY',
  'BETTER_SCALING',
  'BETTER_ROBUSTNESS',
  'BETTER_PRIVACY_LOCALITY',
  'BETTER_MULTI_OBJECTIVE_TRADEOFF',
] as const;

export type PromotionOutcomeWithEvidence =
  (typeof PROMOTION_OUTCOMES_WITH_EVIDENCE)[number];

export const PROMOTION_FALLBACK_OUTCOMES = [
  'NO_MEASURED_ADVANTAGE',
  'RESEARCH_ONLY',
] as const;

export type PromotionFallbackOutcome =
  (typeof PROMOTION_FALLBACK_OUTCOMES)[number];

export type PromotionOutcome =
  | PromotionOutcomeWithEvidence
  | PromotionFallbackOutcome;

/** Vague claim patterns denied without benchmark evidence. */
export const VAGUE_CLAIM_PATTERNS = [
  'quantum-powered efficiency',
  'quantum powered efficiency',
  'quantum advantage',
  'ai-powered optimization',
  'revolutionary speedup',
  'orders of magnitude better',
  'unprecedented performance',
  'guaranteed optimal',
] as const;

export type VagueClaimPattern = (typeof VAGUE_CLAIM_PATTERNS)[number];

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eo6SoftWireSnapshot = {
  eo4CapabilityMatrix: SoftWirePresence;
  eo4CapabilityMatrixTypes: SoftWirePresence;
  eo4CapabilityMatrixRuntime: SoftWirePresence;
  eo4Report: SoftWirePresence;
  eo5EvidenceBoundary: SoftWirePresence;
  eo5EvidenceBoundaryTypes: SoftWirePresence;
  eo5EvidenceBoundaryRuntime: SoftWirePresence;
  eo5Report: SoftWirePresence;
  em9ClassicalQuantBenchmark: SoftWirePresence;
  em9Honesty: SoftWirePresence;
  em9Report: SoftWirePresence;
  eo3Watch: SoftWirePresence;
  eoMissionOs: SoftWirePresence;
  enDealOs: SoftWirePresence;
};

export const EO6_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_BASELINE_FRAMEWORK_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  /** Critical: no auto-promote without measured advantage. */
  AUTO_PROMOTE_WITHOUT_MEASURED_ADVANTAGE: false as const,
  PROMOTE_WITHOUT_CLASSICAL_BASELINE: false as const,
  PROMOTE_WITHOUT_TRADEOFF_STATEMENT: false as const,
  PROMOTE_WITHOUT_BENCHMARK_EVIDENCE: false as const,

  /** Vague / government proposal claim denies. */
  VAGUE_OPTIMIZATION_CLAIM_WITHOUT_DATA: false as const,
  QUANTUM_POWERED_EFFICIENCY_WITHOUT_TEST_DATA: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE: false as const,

  /** Tradeoff honesty — both sides required. */
  TRADEOFF_IMPROVED_ONLY_WITHOUT_WORSENED: false as const,
  CLAIM_BETTER_ON_ALL_METRICS_WITHOUT_EVIDENCE: false as const,

  /** Soft-wire honesty. */
  PRESENCE_EQ_VERIFIED: false as const,
  EO4_ABSENCE_EQ_VERIFIED_MATRIX: false as const,
  EO5_ABSENCE_EQ_EVIDENCE_BOUNDARY_VERIFIED: false as const,

  /** Recommend ≠ act / promote. */
  RECOMMEND_EQ_PROMOTE: false as const,
  RECOMMEND_EQ_ACT: false as const,

  /** Isolation unchanged. */
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,

  /** Honesty ladder. */
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  /** Human / evidence owner gates. */
  EVIDENCE_OWNER_REQUIRED: true as const,
  HUMAN_REVIEW_REQUIRED_FOR_PROMOTION: true as const,
});

export const EO6_MAY = Object.freeze([
  'define_optimization_problems',
  'select_classical_baseline_families',
  'run_classical_baseline_comparisons',
  'compare_advanced_candidates_to_baselines',
  'record_metric_deltas',
  'state_exact_tradeoffs_improved_and_worsened',
  'recommend_promotion_outcome_with_evidence',
  'deny_vague_claims_without_benchmark_data',
  'soft_wire_eo4_eo5_em9',
] as const);

export const EO6_MUST_NOT = Object.freeze([
  'auto_promote_without_measured_advantage',
  'promote_without_classical_baseline',
  'claim_advantage_without_stating_what_got_worse',
  'use_vague_quantum_powered_efficiency_without_test_data',
  'assert_optimization_claim_without_benchmark_evidence',
  'treat_soft_wire_presence_as_verified',
  'tip_land_or_open_pr_from_this_phase',
] as const);

export const EO6_POLICY_FRAMING = Object.freeze({
  classicalMandate:
    'Every advanced optimization, AI-agentic, or quantum experiment must be compared against strong classical baselines.',
  tradeoffHonesty:
    'A method need not beat classical baselines on every metric, but XIV must state exactly what tradeoff improved and what got worse.',
  governmentProposal:
    'Every optimization claim in government proposals must be traceable to benchmark evidence. Vague claims without test data are denied.',
  promotion:
    'Promotion outcomes require measured evidence. Otherwise NO_MEASURED_ADVANTAGE or RESEARCH_ONLY. No auto-promote.',
  softWire:
    'EO4 matrix, EO5 evidence boundary, and EM9 classical quant benchmarks soft-wired when PRESENT; presence ≠ VERIFIED.',
});

export function assertEo6LocksIntact(): boolean {
  return (
    EO6_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EO6_LOCKS.AUTO_PROMOTE_WITHOUT_MEASURED_ADVANTAGE === false &&
    EO6_LOCKS.PROMOTE_WITHOUT_CLASSICAL_BASELINE === false &&
    EO6_LOCKS.PROMOTE_WITHOUT_TRADEOFF_STATEMENT === false &&
    EO6_LOCKS.PROMOTE_WITHOUT_BENCHMARK_EVIDENCE === false &&
    EO6_LOCKS.VAGUE_OPTIMIZATION_CLAIM_WITHOUT_DATA === false &&
    EO6_LOCKS.QUANTUM_POWERED_EFFICIENCY_WITHOUT_TEST_DATA === false &&
    EO6_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_CLASSICAL_BASELINE === false &&
    EO6_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE === false &&
    EO6_LOCKS.TRADEOFF_IMPROVED_ONLY_WITHOUT_WORSENED === false &&
    EO6_LOCKS.CLAIM_BETTER_ON_ALL_METRICS_WITHOUT_EVIDENCE === false &&
    EO6_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EO6_LOCKS.RECOMMEND_EQ_PROMOTE === false &&
    EO6_LOCKS.RECOMMEND_EQ_ACT === false &&
    EO6_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EO6_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EO6_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EO6_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EO6_LOCKS.EVIDENCE_OWNER_REQUIRED === true &&
    EO6_LOCKS.HUMAN_REVIEW_REQUIRED_FOR_PROMOTION === true &&
    EO6_LOCKS.TIP_LAND === false &&
    EO6_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EO6_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EO6_LOCKS.MANAGE_PULL_REQUEST === false
  );
}

function softWireFile(
  relFromLocalBrain: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(
    dirname(fileURLToPath(import.meta.url)),
    relFromLocalBrain,
  );
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function softWireRepoRelative(
  repoRoot: string,
  rel: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(repoRoot, rel);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

/**
 * Soft-wire EO4 capability matrix, EO5 evidence boundary (language gate /
 * classical baseline mandate), and EM9 classical quant benchmarks.
 * Presence alone ≠ VERIFIED. Missing predecessors → WAITING_DATA.
 */
export function eo6SoftWireSnapshot(repoRoot?: string): Eo6SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eo4CapabilityMatrix: softWireFile(
      './ai-quantum-capability-matrix.ts',
      'EO4 AI & Quantum Capability Matrix PRESENT (soft-wire).',
      'EO4 capability matrix absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo4CapabilityMatrixTypes: softWireFile(
      './ai-quantum-capability-matrix-types.ts',
      'EO4 capability matrix types PRESENT (soft-wire).',
      'EO4 capability matrix types absent — soft-wire WAITING_DATA.',
    ),
    eo4CapabilityMatrixRuntime: softWireFile(
      './ai-quantum-capability-matrix-runtime.ts',
      'EO4 capability matrix runtime PRESENT (soft-wire).',
      'EO4 capability matrix runtime absent — soft-wire WAITING_DATA.',
    ),
    eo4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO4_AI_QUANTUM_CAPABILITY_MATRIX_REPORT.md',
      'EO4 report PRESENT.',
      'EO4 report absent — soft-wire WAITING_DATA.',
    ),
    eo5EvidenceBoundary: softWireFile(
      './quantum-evidence-boundary.ts',
      'EO5 Quantum Evidence Boundary PRESENT (language gate / classical baseline mandate soft-wire).',
      'EO5 evidence boundary absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo5EvidenceBoundaryTypes: softWireFile(
      './quantum-evidence-boundary-types.ts',
      'EO5 evidence boundary types PRESENT (soft-wire).',
      'EO5 evidence boundary types absent — soft-wire WAITING_DATA.',
    ),
    eo5EvidenceBoundaryRuntime: softWireFile(
      './quantum-evidence-boundary-runtime.ts',
      'EO5 evidence boundary runtime PRESENT (soft-wire).',
      'EO5 evidence boundary runtime absent — soft-wire WAITING_DATA.',
    ),
    eo5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO5_QUANTUM_EVIDENCE_BOUNDARY_REPORT.md',
      'EO5 report PRESENT.',
      'EO5 report absent — soft-wire WAITING_DATA.',
    ),
    em9ClassicalQuantBenchmark: softWireFile(
      '../local-runtime/classical-quant-benchmark.ts',
      'EM9 classical quant benchmark PRESENT (required before quantum-inspired claims).',
      'EM9 classical quant benchmark absent — quantum comparison claims remain DENIED.',
    ),
    em9Honesty: softWireFile(
      '../local-runtime/em9-honesty.ts',
      'EM9 honesty locks PRESENT (soft-wire).',
      'EM9 honesty locks absent.',
    ),
    em9Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EM9_COMPUTE_RESOURCE_MARKET_SIMULATOR_REPORT.md',
      'EM9 report PRESENT.',
      'EM9 report absent.',
    ),
    eo3Watch: softWireFile(
      './quantum-mission-opportunity-watch.ts',
      'EO3 Quantum Mission Opportunity Watch PRESENT (soft-wire).',
      'EO3 watch absent — soft-wire WAITING_DATA.',
    ),
    eoMissionOs: softWireFile(
      './government-quantum-ai-mission-os.ts',
      '#159 EO Mission OS PRESENT (soft-wire).',
      '#159 EO Mission OS absent — soft-wire WAITING_DATA.',
    ),
    enDealOs: softWireFile(
      './deal-contract-intelligence-os.ts',
      'EN (#158) Deal OS PRESENT (soft-wire).',
      'EN (#158) Deal OS absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isPromotionOutcomeWithEvidence(
  outcome: PromotionOutcome,
): outcome is PromotionOutcomeWithEvidence {
  return (PROMOTION_OUTCOMES_WITH_EVIDENCE as readonly string[]).includes(
    outcome,
  );
}

export function isVagueClaimText(claim: string): boolean {
  const normalized = claim.trim().toLowerCase();
  return VAGUE_CLAIM_PATTERNS.some((p) => normalized.includes(p));
}

export function metricDeltaDirection(
  metric: ComparisonMetric,
  baselineValue: number,
  candidateValue: number,
): 'improved' | 'worsened' | 'unchanged' {
  // Lower-is-better metrics
  const lowerBetter: ReadonlySet<ComparisonMetric> = new Set([
    'runtime',
    'memory',
    'cost',
    'energy_proxy',
  ]);
  if (baselineValue === candidateValue) return 'unchanged';
  if (lowerBetter.has(metric)) {
    return candidateValue < baselineValue ? 'improved' : 'worsened';
  }
  return candidateValue > baselineValue ? 'improved' : 'worsened';
}
