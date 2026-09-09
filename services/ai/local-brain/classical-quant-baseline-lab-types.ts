/**
 * 62L-EP17 — Classical Quant Baseline Lab (park-and-implement).
 *
 * Reusable quantitative benchmark lab so every advanced scheduler, agentic
 * optimizer, simulation, or quantum-inspired method is compared against strong
 * classical methods first.
 *
 * Core flow: Problem → Classical Baselines → Candidate Method →
 * Same Data/Test Conditions → Compare → Promote / Reject.
 *
 * No unrun benchmark is a PASS. Quantum-advantage language denied without
 * supporting evidence. Tradeoffs must be stated explicitly.
 *
 * Soft-wire when PRESENT: EP16, EP15, EP14, EP12, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #160 / 62L-EP family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe isolation unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EP18 — Quantum-Inspired Compute Lab.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP17' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP17 Classical Quant Baseline Lab — mandatory classical baselines before advanced/quantum-inspired candidates; no unrun PASS; explicit tradeoffs; no quantum-advantage language without evidence' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP17_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP18 — Quantum-Inspired Compute Lab — test quantum-inspired scheduling, routing, graph search, assignment, and optimization against these classical baselines.' as const;

/**
 * Core comparison flow.
 */
export const QUANT_BASELINE_LAB_FLOW = [
  'problem',
  'classical_baselines',
  'candidate_method',
  'same_data_test_conditions',
  'compare',
  'promote_or_reject',
] as const;

/**
 * Classical baseline families.
 */
export const CLASSICAL_BASELINE_FAMILIES = [
  'greedy_heuristics',
  'priority_queues',
  'weighted_scoring',
  'linear_programming',
  'mixed_integer_programming',
  'constraint_programming',
  'graph_algorithms',
  'dynamic_programming',
  'monte_carlo',
  'statistical_forecasting',
  'classical_ml',
  'metaheuristics',
] as const;

export type ClassicalBaselineFamily =
  (typeof CLASSICAL_BASELINE_FAMILIES)[number];

/**
 * Metaheuristic examples (when appropriate).
 */
export const METAHEURISTIC_EXAMPLES = [
  'simulated_annealing',
  'genetic_algorithms',
] as const;

/**
 * Experiment tracking fields.
 */
export const QUANT_EXPERIMENT_FIELDS = [
  'problemId',
  'objective',
  'constraints',
  'datasetVersion',
  'baselineAlgorithm',
  'candidateAlgorithm',
  'computeBudget',
  'runtimeBudget',
  'randomSeed',
  'hardwareRuntime',
  'latency',
  'memory',
  'solutionQuality',
  'reliability',
  'costEnergyProxy',
  'reproducibility',
  'evidenceRefs',
] as const;

export type QuantExperimentField = (typeof QUANT_EXPERIMENT_FIELDS)[number];

/**
 * Promotion states.
 */
export const QUANT_PROMOTION_STATES = [
  'BASELINE_ONLY',
  'NO_MEASURED_ADVANTAGE',
  'TRADEOFF_IMPROVEMENT',
  'IMPROVED_CANDIDATE',
  'VERIFIED_CANDIDATE',
  'RESEARCH_ONLY',
] as const;

export type QuantPromotionState = (typeof QUANT_PROMOTION_STATES)[number];

/**
 * Explicit tradeoff axes for clear reporting.
 */
export const QUANT_TRADEOFF_AXES = [
  'latency',
  'solution_quality',
  'reliability',
  'cost_energy',
  'memory',
] as const;

export type QuantTradeoffAxis = (typeof QUANT_TRADEOFF_AXES)[number];

/**
 * Forbidden marketing language without evidence.
 */
export const FORBIDDEN_QUANTUM_CLAIMS = [
  'quantum_advantage',
  'quantum_powered_efficiency',
] as const;

export const CLASSICAL_QUANT_BASELINE_LAB_CYCLE = [
  'honesty_locks',
  'classical_quant_baseline_lab_bootstrap',
  // A — Structure
  'core_flow_encoded',
  'baseline_families_encoded',
  'experiment_fields_encoded',
  'promotion_states_encoded',
  'tradeoff_axes_encoded',
  // B — Truth
  'classical_baselines_mandatory_first',
  'same_data_test_conditions_required',
  'unrun_benchmark_is_not_pass',
  'tradeoffs_stated_explicitly',
  'quantum_advantage_language_denied_without_evidence',
  'quantum_inspired_requires_this_lab',
  // C — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'ep16_soft_wire',
  'ep15_soft_wire',
  'ep14_soft_wire',
  'ep12_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep17Hop = (typeof CLASSICAL_QUANT_BASELINE_LAB_CYCLE)[number];

export type Ep17EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
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
  | 'NOT_TESTED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'DEGRADED'
  | 'UNKNOWN'
  | 'BASELINE_ONLY'
  | 'NO_MEASURED_ADVANTAGE'
  | 'TRADEOFF_IMPROVEMENT'
  | 'IMPROVED_CANDIDATE'
  | 'VERIFIED_CANDIDATE'
  | 'RESEARCH_ONLY';

export type Ep17HopRecord = {
  hop: Ep17Hop;
  state: Ep17EvidenceState;
  summary: string;
  at: string;
};

export type Ep17ActorKind =
  | 'quant_baseline_lab'
  | 'reviewer'
  | 'scheduler'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep17Actor = {
  kind: Ep17ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP17_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_QUANT_LAB_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Lab integrity
  UNRUN_BENCHMARK_IS_PASS: false as const,
  SKIP_CLASSICAL_BASELINES: false as const,
  DIFFERENT_DATA_OR_CONDITIONS_COMPARED_AS_SAME: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE: false as const,
  QUANTUM_POWERED_EFFICIENCY_WITHOUT_EVIDENCE: false as const,
  QUANTUM_INSPIRED_WITHOUT_THIS_LAB: false as const,
  HIDE_TRADEOFFS: false as const,
  AUTO_PROMOTE_TO_PRODUCTION: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_LAB: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const QUANT_LAB_AGENT_BOUNDS = Object.freeze({
  mayDefineProblemsAndBaselines: true as const,
  mayRunComparableExperiments: true as const,
  mayReportExplicitTradeoffs: true as const,
  mayRecommendPromotionStates: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayMarkUnrunAsPass: false as const,
  maySkipClassicalBaselines: false as const,
  mayCompareUnlikeConditions: false as const,
  mayClaimQuantumAdvantageWithoutEvidence: false as const,
  maySkipLabForQuantumInspired: false as const,
  mayHideTradeoffs: false as const,
  mayAutoPromoteToProduction: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EP17_MAY = Object.freeze([
  'define_problems_with_classical_baseline_families',
  'compare_candidates_under_same_data_and_test_conditions',
  'state_tradeoffs_explicitly_when_not_winning_all_metrics',
  'require_this_lab_for_quantum_inspired_work',
  'deny_unrun_benchmarks_as_pass',
  'deny_quantum_advantage_language_without_evidence',
] as const);

export const EP17_MUST_NOT = Object.freeze([
  'mark_unrun_benchmark_as_pass',
  'skip_classical_baselines',
  'compare_unlike_data_or_conditions_as_equivalent',
  'claim_quantum_advantage_without_evidence',
  'claim_quantum_powered_efficiency_without_evidence',
  'skip_lab_for_quantum_inspired_work',
  'hide_tradeoffs',
  'auto_promote_to_production',
  'store_hidden_chain_of_thought',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ep17SoftWireSnapshot = {
  ep16NoOverclockBiosRule: SoftWirePresence;
  ep16Report: SoftWirePresence;
  ep15AlgorithmTuningSandbox: SoftWirePresence;
  ep15Report: SoftWirePresence;
  ep14AdaptiveBenchmarkLedger: SoftWirePresence;
  ep14Report: SoftWirePresence;
  ep12Scheduler: SoftWirePresence;
  ep12Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp17LocksIntact(): boolean {
  return (
    EP17_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP17_LOCKS.UNRUN_BENCHMARK_IS_PASS === false &&
    EP17_LOCKS.SKIP_CLASSICAL_BASELINES === false &&
    EP17_LOCKS.DIFFERENT_DATA_OR_CONDITIONS_COMPARED_AS_SAME === false &&
    EP17_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE === false &&
    EP17_LOCKS.QUANTUM_POWERED_EFFICIENCY_WITHOUT_EVIDENCE === false &&
    EP17_LOCKS.QUANTUM_INSPIRED_WITHOUT_THIS_LAB === false &&
    EP17_LOCKS.HIDE_TRADEOFFS === false &&
    EP17_LOCKS.AUTO_PROMOTE_TO_PRODUCTION === false &&
    EP17_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP17_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP17_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EP17_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_LAB === false &&
    EP17_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP17_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP17_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EP17_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP17_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP17_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP17_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP17_LOCKS.TIP_LAND === false &&
    EP17_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP17_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP17_LOCKS.FULL_PRODUCTION_QUANT_LAB_SHIPPED === false &&
    EP17_LOCKS.MANAGE_PULL_REQUEST === false &&
    QUANT_LAB_AGENT_BOUNDS.automaticAuthority === false &&
    QUANT_LAB_AGENT_BOUNDS.mayMarkUnrunAsPass === false &&
    QUANT_LAB_AGENT_BOUNDS.maySkipClassicalBaselines === false &&
    QUANT_LAB_AGENT_BOUNDS.mayCompareUnlikeConditions === false &&
    QUANT_LAB_AGENT_BOUNDS.mayClaimQuantumAdvantageWithoutEvidence === false &&
    QUANT_LAB_AGENT_BOUNDS.maySkipLabForQuantumInspired === false &&
    QUANT_LAB_AGENT_BOUNDS.mayHideTradeoffs === false &&
    QUANT_LAB_AGENT_BOUNDS.mayAutoPromoteToProduction === false &&
    QUANT_LAB_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function ep17SoftWireSnapshot(repoRoot?: string): Ep17SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    ep16NoOverclockBiosRule: softWireFile(
      './no-overclock-bios-rule-types.ts',
      'EP16 No Overclock / BIOS Rule PRESENT (soft-wire).',
      'EP16 No Overclock / BIOS Rule absent — soft-wire WAITING_DATA.',
    ),
    ep16Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP16_NO_OVERCLOCK_BIOS_RULE_REPORT.md',
      'EP16 report PRESENT.',
      'EP16 report absent — soft-wire WAITING_DATA.',
    ),
    ep15AlgorithmTuningSandbox: softWireFile(
      './algorithm-tuning-sandbox-types.ts',
      'EP15 Algorithm Tuning Sandbox PRESENT (soft-wire).',
      'EP15 Algorithm Tuning Sandbox absent — soft-wire WAITING_DATA.',
    ),
    ep15Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP15_ALGORITHM_TUNING_SANDBOX_REPORT.md',
      'EP15 report PRESENT.',
      'EP15 report absent — soft-wire WAITING_DATA.',
    ),
    ep14AdaptiveBenchmarkLedger: softWireFile(
      './adaptive-benchmark-ledger-types.ts',
      'EP14 Adaptive Benchmark Ledger PRESENT (soft-wire).',
      'EP14 Adaptive Benchmark Ledger absent — soft-wire WAITING_DATA.',
    ),
    ep14Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP14_ADAPTIVE_BENCHMARK_LEDGER_REPORT.md',
      'EP14 report PRESENT.',
      'EP14 report absent — soft-wire WAITING_DATA.',
    ),
    ep12Scheduler: softWireFile(
      './hardware-neutral-scheduler-types.ts',
      'EP12 Hardware-Neutral Scheduler PRESENT (soft-wire).',
      'EP12 Hardware-Neutral Scheduler absent — soft-wire WAITING_DATA.',
    ),
    ep12Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP12_HARDWARE_NEUTRAL_SCHEDULER_REPORT.md',
      'EP12 report PRESENT.',
      'EP12 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Ep17Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isQuantLabAgent(actor: Ep17Actor): boolean {
  const agents: readonly Ep17ActorKind[] = [
    'quant_baseline_lab',
    'reviewer',
    'scheduler',
    'proposal',
  ];
  return agents.includes(actor.kind);
}
