/**
 * 62L-EP18 — Quantum-Inspired Compute Lab (park-and-implement).
 *
 * Dedicated quantum-inspired compute lab so advanced scheduling, routing,
 * assignment, graph search, and optimization ideas can be tested rigorously
 * without pretending simulated or classical methods are physical quantum computing.
 *
 * Core flow: Problem → Classical Baseline Lab → Quantum-Inspired Candidate →
 * Same Dataset → Same Metrics → Compare → Evidence Review →
 * Research/Promotion Decision.
 *
 * Simulation ≠ physical QPU. QUANTUM_INSPIRED remains classical software unless
 * PHYSICAL_QPU_VERIFIED with authorized backend/job evidence.
 * No quantum-advantage claim without reproducible measured superiority.
 *
 * Soft-wire when PRESENT: EP17, EP16, EP15, EP14, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #160 / 62L-EP family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. High-consequence → human-authorized.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EP19 — Neural Compute Pathway Graph.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP18' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP18 Quantum-Inspired Compute Lab — test QI scheduling/routing/assignment/optimization against classical baselines; simulation≠physical QPU; no quantum-advantage without reproducible measured superiority' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP18_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP19 — Neural Compute Pathway Graph — link workloads, models, runtimes, hardware, benchmarks, failures, and successful outcomes into a growing evidence-based compute knowledge graph.' as const;

/**
 * Supported evidence classes.
 */
export const QI_EVIDENCE_CLASSES = [
  'THEORETICAL',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QiEvidenceClass = (typeof QI_EVIDENCE_CLASSES)[number];

/**
 * Core experiment families.
 */
export const QI_EXPERIMENT_FAMILIES = [
  'routing',
  'scheduling',
  'assignment',
  'inventory_optimization',
  'supplier_selection',
  'warehouse_network_design',
  'graph_partitioning',
  'compute_placement',
  'agent_task_allocation',
  'portfolio_resource_allocation',
  'vehicle_fleet_logistics',
] as const;

export type QiExperimentFamily = (typeof QI_EXPERIMENT_FAMILIES)[number];

/**
 * Experiment tracking fields.
 */
export const QI_EXPERIMENT_FIELDS = [
  'experimentId',
  'problemDefinition',
  'datasetVersion',
  'objectiveFunction',
  'constraints',
  'classicalBaseline',
  'quantumInspiredMethod',
  'simulatorBackend',
  'hardwareRuntime',
  'iterationsShots',
  'randomSeed',
  'latency',
  'solutionQuality',
  'memory',
  'reliability',
  'costEnergyProxy',
  'uncertainty',
  'reproducibilityEvidence',
] as const;

export type QiExperimentField = (typeof QI_EXPERIMENT_FIELDS)[number];

/**
 * Core lab flow (bridges Virtual Chip brain ↔ classical quantitative foundation).
 */
export const QI_COMPUTE_LAB_FLOW = [
  'problem',
  'classical_baseline_lab',
  'quantum_inspired_candidate',
  'same_dataset',
  'same_metrics',
  'compare',
  'evidence_review',
  'research_or_promotion_decision',
] as const;

/**
 * Promotion states.
 */
export const QI_PROMOTION_STATES = [
  'NO_ADVANTAGE',
  'TRADEOFF_IMPROVEMENT',
  'RESEARCH_ONLY',
  'IMPROVED_CANDIDATE',
  'VERIFIED_CANDIDATE',
] as const;

export type QiPromotionState = (typeof QI_PROMOTION_STATES)[number];

export const QUANTUM_INSPIRED_COMPUTE_LAB_CYCLE = [
  'honesty_locks',
  'quantum_inspired_compute_lab_bootstrap',
  // A — Structure
  'evidence_classes_encoded',
  'experiment_families_encoded',
  'experiment_fields_encoded',
  'core_flow_encoded',
  'promotion_states_encoded',
  // B — Truth
  'simulation_neq_physical_qpu',
  'qi_remains_classical_without_physical_evidence',
  'no_physical_qpu_claim_without_backend_job_evidence',
  'no_quantum_advantage_without_reproducible_superiority',
  'classical_baseline_lab_mandatory',
  'same_dataset_same_metrics_required',
  'sandbox_before_operational_use',
  'high_consequence_human_authorized',
  // C — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'ep17_soft_wire',
  'ep16_soft_wire',
  'ep15_soft_wire',
  'ep14_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep18Hop = (typeof QUANTUM_INSPIRED_COMPUTE_LAB_CYCLE)[number];

export type Ep18EvidenceState =
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
  | 'NO_ADVANTAGE'
  | 'TRADEOFF_IMPROVEMENT'
  | 'RESEARCH_ONLY'
  | 'IMPROVED_CANDIDATE'
  | 'VERIFIED_CANDIDATE'
  | 'THEORETICAL'
  | 'SIMULATED'
  | 'QUANTUM_INSPIRED'
  | 'PHYSICAL_QPU_VERIFIED';

export type Ep18HopRecord = {
  hop: Ep18Hop;
  state: Ep18EvidenceState;
  summary: string;
  at: string;
};

export type Ep18ActorKind =
  | 'qi_compute_lab'
  | 'reviewer'
  | 'scheduler'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep18Actor = {
  kind: Ep18ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP18_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_QI_LAB_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Critical truth rules
  SIMULATION_EQ_PHYSICAL_QPU: false as const,
  QI_IMPLIED_PHYSICAL_WITHOUT_EVIDENCE: false as const,
  PHYSICAL_QPU_CLAIM_WITHOUT_BACKEND_JOB: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_REPRODUCIBLE_SUPERIORITY: false as const,
  SKIP_CLASSICAL_BASELINE_LAB: false as const,
  UNLIKE_DATASET_OR_METRICS_COMPARED: false as const,
  OPERATIONAL_USE_WITHOUT_SANDBOX: false as const,
  HIGH_CONSEQUENCE_WITHOUT_HUMAN_AUTH: false as const,
  AUTO_PROMOTE_TO_PRODUCTION: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_QI_LAB: false as const,

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

export const QI_LAB_AGENT_BOUNDS = Object.freeze({
  mayRunSandboxedQiExperiments: true as const,
  mayCompareAgainstClassicalBaselineLab: true as const,
  mayRecommendPromotionStates: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayEquateSimulationWithPhysicalQpu: false as const,
  mayClaimPhysicalQpuWithoutBackendJob: false as const,
  mayClaimQuantumAdvantageWithoutReproducibleSuperiority: false as const,
  maySkipClassicalBaselineLab: false as const,
  mayCompareUnlikeDatasetOrMetrics: false as const,
  mayUseOperationallyWithoutSandbox: false as const,
  maySkipHumanForHighConsequence: false as const,
  mayAutoPromoteToProduction: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EP18_MAY = Object.freeze([
  'run_quantum_inspired_experiments_in_sandbox',
  'require_classical_baseline_lab_first',
  'label_evidence_classes_honestly',
  'compare_under_same_dataset_and_metrics',
  'deny_simulation_as_physical_qpu',
  'deny_quantum_advantage_without_reproducible_superiority',
  'require_human_auth_for_high_consequence',
] as const);

export const EP18_MUST_NOT = Object.freeze([
  'equate_simulation_with_physical_qpu',
  'imply_qi_is_physical_without_evidence',
  'claim_physical_qpu_without_authorized_backend_job',
  'claim_quantum_advantage_without_reproducible_measured_superiority',
  'skip_classical_baseline_lab',
  'compare_unlike_dataset_or_metrics',
  'use_operationally_without_sandbox',
  'skip_human_for_high_consequence',
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

export type Ep18SoftWireSnapshot = {
  ep17ClassicalQuantBaselineLab: SoftWirePresence;
  ep17Report: SoftWirePresence;
  ep16NoOverclockBiosRule: SoftWirePresence;
  ep16Report: SoftWirePresence;
  ep15AlgorithmTuningSandbox: SoftWirePresence;
  ep15Report: SoftWirePresence;
  ep14AdaptiveBenchmarkLedger: SoftWirePresence;
  ep14Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp18LocksIntact(): boolean {
  return (
    EP18_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP18_LOCKS.SIMULATION_EQ_PHYSICAL_QPU === false &&
    EP18_LOCKS.QI_IMPLIED_PHYSICAL_WITHOUT_EVIDENCE === false &&
    EP18_LOCKS.PHYSICAL_QPU_CLAIM_WITHOUT_BACKEND_JOB === false &&
    EP18_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_REPRODUCIBLE_SUPERIORITY === false &&
    EP18_LOCKS.SKIP_CLASSICAL_BASELINE_LAB === false &&
    EP18_LOCKS.UNLIKE_DATASET_OR_METRICS_COMPARED === false &&
    EP18_LOCKS.OPERATIONAL_USE_WITHOUT_SANDBOX === false &&
    EP18_LOCKS.HIGH_CONSEQUENCE_WITHOUT_HUMAN_AUTH === false &&
    EP18_LOCKS.AUTO_PROMOTE_TO_PRODUCTION === false &&
    EP18_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP18_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP18_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EP18_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_QI_LAB === false &&
    EP18_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP18_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP18_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EP18_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP18_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP18_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP18_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP18_LOCKS.TIP_LAND === false &&
    EP18_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP18_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP18_LOCKS.FULL_PRODUCTION_QI_LAB_SHIPPED === false &&
    EP18_LOCKS.MANAGE_PULL_REQUEST === false &&
    QI_LAB_AGENT_BOUNDS.automaticAuthority === false &&
    QI_LAB_AGENT_BOUNDS.mayEquateSimulationWithPhysicalQpu === false &&
    QI_LAB_AGENT_BOUNDS.mayClaimPhysicalQpuWithoutBackendJob === false &&
    QI_LAB_AGENT_BOUNDS.mayClaimQuantumAdvantageWithoutReproducibleSuperiority ===
      false &&
    QI_LAB_AGENT_BOUNDS.maySkipClassicalBaselineLab === false &&
    QI_LAB_AGENT_BOUNDS.mayCompareUnlikeDatasetOrMetrics === false &&
    QI_LAB_AGENT_BOUNDS.mayUseOperationallyWithoutSandbox === false &&
    QI_LAB_AGENT_BOUNDS.maySkipHumanForHighConsequence === false &&
    QI_LAB_AGENT_BOUNDS.mayAutoPromoteToProduction === false &&
    QI_LAB_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function ep18SoftWireSnapshot(repoRoot?: string): Ep18SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    ep17ClassicalQuantBaselineLab: softWireFile(
      './classical-quant-baseline-lab-types.ts',
      'EP17 Classical Quant Baseline Lab PRESENT (soft-wire).',
      'EP17 Classical Quant Baseline Lab absent — soft-wire WAITING_DATA.',
    ),
    ep17Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP17_CLASSICAL_QUANT_BASELINE_LAB_REPORT.md',
      'EP17 report PRESENT.',
      'EP17 report absent — soft-wire WAITING_DATA.',
    ),
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
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Ep18Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isQiLabAgent(actor: Ep18Actor): boolean {
  const agents: readonly Ep18ActorKind[] = [
    'qi_compute_lab',
    'reviewer',
    'scheduler',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Simulation / QUANTUM_INSPIRED never equals PHYSICAL_QPU_VERIFIED by implication.
 */
export function evidenceClassImpliesPhysicalQpu(
  evidenceClass: QiEvidenceClass,
): boolean {
  return evidenceClass === 'PHYSICAL_QPU_VERIFIED';
}
