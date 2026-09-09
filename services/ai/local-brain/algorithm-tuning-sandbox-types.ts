/**
 * 62L-EP15 — Algorithm Tuning Sandbox (park-and-implement).
 *
 * Bounded tuning sandbox so agents can improve software-level performance
 * across verified hardware without unsafe system modification.
 *
 * Core flow: Baseline → Candidate Policy → Sandbox Run → Compare →
 * Reviewer → Promote / Reject.
 *
 * Optimization must not blindly maximize speed — tradeoffs
 * (quality / reliability / energy / latency) are reported explicitly.
 *
 * Soft-wire when PRESENT: EP14, EP13, EP12, EP5, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #160 / 62L-EP family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. No BIOS/firmware/overclock/driver/thermal bypass.
 * Quantum-inspired remains QUANTUM_INSPIRED or SIMULATED unless physical-QPU evidence.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EP16 — No Overclock / BIOS Rule.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP15' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP15 Algorithm Tuning Sandbox — bounded software-level tuning (batching/caching/quantization/scheduling) with explicit tradeoffs, classical baseline gate, and hard safety denies for BIOS/firmware/overclock/production mutation' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP15_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP16 — No Overclock / BIOS Rule — formalize the hardware safety boundary so agent optimization can never drift into unsafe low-level system manipulation.' as const;

/**
 * Core promotion / experiment flow.
 */
export const TUNING_CORE_FLOW = [
  'baseline',
  'candidate_policy',
  'sandbox_run',
  'compare',
  'reviewer',
  'promote_or_reject',
] as const;

/**
 * Software-level experiment levers (safe sandbox surface).
 */
export const TUNING_LEVERS = [
  'batching',
  'queue_policy',
  'caching',
  'model_selection',
  'quantization',
  'precision_choice',
  'request_coalescing',
  'concurrency',
  'prefetching',
  'graph_scheduling',
  'local_vs_edge_routing',
  'retry_backoff',
  'checkpoint_frequency',
] as const;

export type TuningLever = (typeof TUNING_LEVERS)[number];

/**
 * Experiment tracking fields.
 */
export const EXPERIMENT_FIELDS = [
  'experimentId',
  'objective',
  'baselineConfiguration',
  'candidateConfiguration',
  'hardwareRuntime',
  'modelWorkload',
  'datasetInput',
  'resourceCeiling',
  'randomSeed',
  'latency',
  'throughput',
  'memory',
  'qualityAccuracyProxy',
  'reliability',
  'energyCostProxy',
  'regressionRisk',
  'evidenceRefs',
  'result',
] as const;

export type ExperimentField = (typeof EXPERIMENT_FIELDS)[number];

/**
 * Promotion states.
 */
export const PROMOTION_STATES = [
  'RESEARCH_ONLY',
  'NO_ADVANTAGE',
  'IMPROVED_CANDIDATE',
  'VERIFIED_CANDIDATE',
  'REJECTED',
] as const;

export type PromotionState = (typeof PROMOTION_STATES)[number];

/**
 * Explicit tradeoff axes (must not blindly maximize speed).
 */
export const TRADEOFF_AXES = [
  'latency',
  'quality',
  'reliability',
  'energy',
  'cost',
] as const;

export type TradeoffAxis = (typeof TRADEOFF_AXES)[number];

/**
 * Quantum labeling for tuning experiments.
 */
export const QUANTUM_TUNING_LABELS = [
  'CLASSICAL',
  'QUANTUM_INSPIRED',
  'SIMULATED',
  'PHYSICAL_QPU',
] as const;

export type QuantumTuningLabel = (typeof QUANTUM_TUNING_LABELS)[number];

/**
 * Hard safety boundaries — never crossed by the sandbox.
 */
export const SAFETY_BOUNDARIES = [
  'no_bios_changes',
  'no_overclocking_undervolting',
  'no_firmware_modification',
  'no_driver_replacement',
  'no_thermal_limit_bypass',
  'no_privilege_escalation',
  'no_production_configuration_changes',
  'no_automatic_cloud_purchases',
  'no_self_modifying_production_scheduler',
] as const;

export type SafetyBoundary = (typeof SAFETY_BOUNDARIES)[number];

export const ALGORITHM_TUNING_SANDBOX_CYCLE = [
  'honesty_locks',
  'algorithm_tuning_sandbox_bootstrap',
  // A — Structure
  'core_flow_encoded',
  'tuning_levers_encoded',
  'experiment_fields_encoded',
  'promotion_states_encoded',
  'tradeoff_axes_encoded',
  'safety_boundaries_encoded',
  // B — Truth
  'tradeoffs_reported_explicitly',
  'must_beat_or_justify_classical_baseline',
  'quantum_inspired_or_simulated_unless_physical_qpu',
  // C — Safety denies
  'no_bios_changes',
  'no_overclocking_undervolting',
  'no_firmware_modification',
  'no_driver_replacement',
  'no_thermal_limit_bypass',
  'no_privilege_escalation',
  'no_production_configuration_changes',
  'no_automatic_cloud_purchases',
  'no_self_modifying_production_scheduler',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'ep14_soft_wire',
  'ep13_soft_wire',
  'ep12_soft_wire',
  'ep5_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep15Hop = (typeof ALGORITHM_TUNING_SANDBOX_CYCLE)[number];

export type Ep15EvidenceState =
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
  | 'RESEARCH_ONLY'
  | 'NO_ADVANTAGE'
  | 'IMPROVED_CANDIDATE'
  | 'VERIFIED_CANDIDATE';

export type Ep15HopRecord = {
  hop: Ep15Hop;
  state: Ep15EvidenceState;
  summary: string;
  at: string;
};

export type Ep15ActorKind =
  | 'tuning_sandbox'
  | 'reviewer'
  | 'scheduler'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep15Actor = {
  kind: Ep15ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP15_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_TUNING_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Blind optimization
  BLIND_SPEED_MAXIMIZATION: false as const,
  PROMOTE_WITHOUT_BASELINE: false as const,
  PROMOTE_WITHOUT_REVIEWER: false as const,
  AUTO_PROMOTE_TO_PRODUCTION: false as const,

  // Quantum
  QUANTUM_CLAIMED_PHYSICAL_WITHOUT_EVIDENCE: false as const,
  QUANTUM_MIXED_INTO_CLASSICAL_LABEL: false as const,

  // Safety boundaries
  BIOS_CHANGES: false as const,
  OVERCLOCKING_UNDERVOLTING: false as const,
  FIRMWARE_MODIFICATION: false as const,
  DRIVER_REPLACEMENT: false as const,
  THERMAL_LIMIT_BYPASS: false as const,
  PRIVILEGE_ESCALATION: false as const,
  PRODUCTION_CONFIGURATION_CHANGES: false as const,
  AUTOMATIC_CLOUD_PURCHASES: false as const,
  SELF_MODIFYING_PRODUCTION_SCHEDULER: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_EXPERIMENT: false as const,

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

export const TUNING_AGENT_BOUNDS = Object.freeze({
  mayProposeCandidatePolicies: true as const,
  mayRunSandboxExperiments: true as const,
  mayReportTradeoffs: true as const,
  mayRecommendPromotion: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayBlindMaximizeSpeed: false as const,
  mayPromoteWithoutBaseline: false as const,
  mayPromoteWithoutReviewer: false as const,
  mayAutoPromoteToProduction: false as const,
  mayChangeBios: false as const,
  mayOverclockOrUndervolt: false as const,
  mayModifyFirmware: false as const,
  mayReplaceDrivers: false as const,
  mayBypassThermalLimits: false as const,
  mayEscalatePrivilege: false as const,
  mayChangeProductionConfig: false as const,
  mayPurchaseCloudAutomatically: false as const,
  maySelfModifyProductionScheduler: false as const,
  mayClaimPhysicalQpuWithoutEvidence: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EP15_MAY = Object.freeze([
  'experiment_with_software_level_levers_in_sandbox',
  'compare_candidates_against_classical_baseline',
  'report_latency_quality_reliability_energy_tradeoffs_explicitly',
  'recommend_promotion_states_to_reviewer',
  'label_quantum_inspired_or_simulated_separately',
  'reject_unsafe_system_modification_attempts',
] as const);

export const EP15_MUST_NOT = Object.freeze([
  'blindly_maximize_speed',
  'promote_without_beating_or_justifying_baseline',
  'auto_promote_to_production',
  'change_bios',
  'overclock_or_undervolt',
  'modify_firmware',
  'replace_drivers',
  'bypass_thermal_limits',
  'escalate_privilege',
  'change_production_configuration',
  'purchase_cloud_automatically',
  'self_modify_production_scheduler',
  'claim_physical_qpu_without_evidence',
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

export type Ep15SoftWireSnapshot = {
  ep14AdaptiveBenchmarkLedger: SoftWirePresence;
  ep14Report: SoftWirePresence;
  ep13RuntimeReturnReceipt: SoftWirePresence;
  ep13Report: SoftWirePresence;
  ep12Scheduler: SoftWirePresence;
  ep12Report: SoftWirePresence;
  ep5BenchmarkMemory: SoftWirePresence;
  ep5Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp15LocksIntact(): boolean {
  return (
    EP15_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP15_LOCKS.BLIND_SPEED_MAXIMIZATION === false &&
    EP15_LOCKS.PROMOTE_WITHOUT_BASELINE === false &&
    EP15_LOCKS.PROMOTE_WITHOUT_REVIEWER === false &&
    EP15_LOCKS.AUTO_PROMOTE_TO_PRODUCTION === false &&
    EP15_LOCKS.QUANTUM_CLAIMED_PHYSICAL_WITHOUT_EVIDENCE === false &&
    EP15_LOCKS.QUANTUM_MIXED_INTO_CLASSICAL_LABEL === false &&
    EP15_LOCKS.BIOS_CHANGES === false &&
    EP15_LOCKS.OVERCLOCKING_UNDERVOLTING === false &&
    EP15_LOCKS.FIRMWARE_MODIFICATION === false &&
    EP15_LOCKS.DRIVER_REPLACEMENT === false &&
    EP15_LOCKS.THERMAL_LIMIT_BYPASS === false &&
    EP15_LOCKS.PRIVILEGE_ESCALATION === false &&
    EP15_LOCKS.PRODUCTION_CONFIGURATION_CHANGES === false &&
    EP15_LOCKS.AUTOMATIC_CLOUD_PURCHASES === false &&
    EP15_LOCKS.SELF_MODIFYING_PRODUCTION_SCHEDULER === false &&
    EP15_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP15_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP15_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EP15_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_EXPERIMENT === false &&
    EP15_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP15_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP15_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EP15_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP15_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP15_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP15_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP15_LOCKS.TIP_LAND === false &&
    EP15_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP15_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP15_LOCKS.FULL_PRODUCTION_TUNING_SHIPPED === false &&
    EP15_LOCKS.MANAGE_PULL_REQUEST === false &&
    TUNING_AGENT_BOUNDS.automaticAuthority === false &&
    TUNING_AGENT_BOUNDS.mayBlindMaximizeSpeed === false &&
    TUNING_AGENT_BOUNDS.mayPromoteWithoutBaseline === false &&
    TUNING_AGENT_BOUNDS.mayAutoPromoteToProduction === false &&
    TUNING_AGENT_BOUNDS.mayChangeBios === false &&
    TUNING_AGENT_BOUNDS.mayOverclockOrUndervolt === false &&
    TUNING_AGENT_BOUNDS.mayModifyFirmware === false &&
    TUNING_AGENT_BOUNDS.mayReplaceDrivers === false &&
    TUNING_AGENT_BOUNDS.mayBypassThermalLimits === false &&
    TUNING_AGENT_BOUNDS.mayEscalatePrivilege === false &&
    TUNING_AGENT_BOUNDS.mayChangeProductionConfig === false &&
    TUNING_AGENT_BOUNDS.mayPurchaseCloudAutomatically === false &&
    TUNING_AGENT_BOUNDS.maySelfModifyProductionScheduler === false &&
    TUNING_AGENT_BOUNDS.mayClaimPhysicalQpuWithoutEvidence === false &&
    TUNING_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function ep15SoftWireSnapshot(repoRoot?: string): Ep15SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
    ep13RuntimeReturnReceipt: softWireFile(
      './runtime-return-receipt-types.ts',
      'EP13 Runtime Return Receipt PRESENT (soft-wire).',
      'EP13 Runtime Return Receipt absent — soft-wire WAITING_DATA.',
    ),
    ep13Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP13_RUNTIME_RETURN_RECEIPT_REPORT.md',
      'EP13 report PRESENT.',
      'EP13 report absent — soft-wire WAITING_DATA.',
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
    ep5BenchmarkMemory: softWireFile(
      './public-benchmark-memory-types.ts',
      'EP5 Public Benchmark Memory PRESENT (soft-wire).',
      'EP5 Public Benchmark Memory absent — soft-wire WAITING_DATA.',
    ),
    ep5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP5_PUBLIC_BENCHMARK_MEMORY_REPORT.md',
      'EP5 report PRESENT.',
      'EP5 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Ep15Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isTuningAgent(actor: Ep15Actor): boolean {
  const agents: readonly Ep15ActorKind[] = [
    'tuning_sandbox',
    'reviewer',
    'scheduler',
    'proposal',
  ];
  return agents.includes(actor.kind);
}
