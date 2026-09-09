/**
 * 62L-EP14 — Adaptive Benchmark Ledger (park-and-implement).
 *
 * Time-aware benchmark ledger: every verified CPU/GPU/NPU/runtime/model result
 * becomes durable performance evidence that can improve scheduling and detect
 * regressions.
 *
 * Lifecycle: Compute Receipt → normalize → compare with prior evidence →
 * classify → update scheduler memory.
 *
 * Unlike tests (model/precision/batch/input/runtime/hardware/software) →
 * NOT_COMPARABLE. Old evidence is not deleted; scheduling weight declines.
 * Quantum-inspired entries remain separately labeled and require classical baselines.
 *
 * Soft-wire when PRESENT: EP13, EP12, EP5, EP1, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #160 / 62L-EP family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. No hidden chain-of-thought. Measured evidence only.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EP15 — Algorithm Tuning Sandbox.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP14' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP14 Adaptive Benchmark Ledger — time-aware performance memory from verified receipts with BASELINE/IMPROVED/REGRESSED/UNCHANGED/STALE/NOT_COMPARABLE classification, unlike-test integrity, and quantum-inspired classical baseline gate' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP14_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP15 — Algorithm Tuning Sandbox — safely experiment with batching, caching, quantization, scheduling, model selection, and queue policies without modifying firmware, BIOS, or production systems.' as const;

/**
 * Core lifecycle after a verified compute receipt.
 */
export const LEDGER_LIFECYCLE = [
  'compute_receipt',
  'normalize',
  'compare_with_prior',
  'classify',
  'update_scheduler_memory',
] as const;

/**
 * Benchmark entry tracking fields.
 */
export const BENCHMARK_ENTRY_FIELDS = [
  'benchmarkId',
  'receiptId',
  'nodeId',
  'device',
  'vendor',
  'runtimeProvider',
  'driverRuntimeVersion',
  'modelId',
  'modelVersionHash',
  'precision',
  'workload',
  'datasetInputProfile',
  'batchSize',
  'latency',
  'throughput',
  'memoryUsage',
  'energyProxy',
  'costProxy',
  'successRate',
  'timestamp',
  'environmentFingerprint',
  'verificationState',
  'evidenceRefs',
] as const;

export type BenchmarkEntryField = (typeof BENCHMARK_ENTRY_FIELDS)[number];

/**
 * Comparison / classification states.
 */
export const COMPARISON_STATES = [
  'BASELINE',
  'IMPROVED',
  'REGRESSED',
  'UNCHANGED',
  'STALE',
  'NOT_COMPARABLE',
] as const;

export type ComparisonState = (typeof COMPARISON_STATES)[number];

/**
 * Staleness triggers that make old evidence candidates for retest.
 * Old evidence is not deleted; scheduling weight declines.
 */
export const STALENESS_TRIGGERS = [
  'driver_update',
  'windows_update',
  'runtime_provider_update',
  'model_version_change',
  'quantization_change',
  'hardware_change',
  'significant_thermal_resource_change',
] as const;

export type StalenessTrigger = (typeof STALENESS_TRIGGERS)[number];

/**
 * Dimensions that must match for comparable benchmarks.
 */
export const COMPARABILITY_DIMENSIONS = [
  'model',
  'precision',
  'batch',
  'input_size',
  'runtime',
  'hardware',
  'software_version',
] as const;

export type ComparabilityDimension = (typeof COMPARABILITY_DIMENSIONS)[number];

/**
 * Neural learning edge shape (structured; no hidden CoT).
 */
export const NEURAL_EDGE_SHAPE = [
  'workload',
  'device',
  'runtime',
  'measured_outcome',
  'confidence',
] as const;

export const ADAPTIVE_BENCHMARK_LEDGER_CYCLE = [
  'honesty_locks',
  'adaptive_benchmark_ledger_bootstrap',
  // A — Structure
  'lifecycle_encoded',
  'entry_fields_encoded',
  'comparison_states_encoded',
  'staleness_triggers_encoded',
  'comparability_dimensions_encoded',
  'neural_edge_shape_encoded',
  // B — Truth
  'unlike_tests_not_comparable',
  'regression_lowers_scheduler_preference',
  'old_evidence_weight_declines_not_deleted',
  'only_measured_evidence_strengthens_edges',
  // C — Quantum
  'quantum_inspired_separately_labeled',
  'quantum_requires_classical_baseline',
  'quantum_better_only_when_data_demonstrates',
  // D — Security / autonomy
  'no_hidden_chain_of_thought',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'ep13_soft_wire',
  'ep12_soft_wire',
  'ep5_soft_wire',
  'ep1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep14Hop = (typeof ADAPTIVE_BENCHMARK_LEDGER_CYCLE)[number];

export type Ep14EvidenceState =
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
  | 'BASELINE'
  | 'IMPROVED'
  | 'REGRESSED'
  | 'UNCHANGED'
  | 'STALE'
  | 'NOT_COMPARABLE';

export type Ep14HopRecord = {
  hop: Ep14Hop;
  state: Ep14EvidenceState;
  summary: string;
  at: string;
};

export type Ep14ActorKind =
  | 'benchmark_ledger'
  | 'scheduler'
  | 'receipt_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep14Actor = {
  kind: Ep14ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP14_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_LEDGER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Comparability / integrity
  UNLIKE_TESTS_COMPARED_AS_EQUIVALENT: false as const,
  DELETE_OLD_EVIDENCE_ON_STALE: false as const,
  UNMEASURED_EVIDENCE_STRENGTHENS_EDGES: false as const,

  // Quantum
  QUANTUM_WITHOUT_CLASSICAL_BASELINE: false as const,
  QUANTUM_BETTER_WITHOUT_DATA: false as const,
  QUANTUM_MIXED_INTO_CLASSICAL_LABEL: false as const,

  // Autonomy / honesty
  HIDDEN_CHAIN_OF_THOUGHT_IN_LEDGER: false as const,
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  AUTONOMOUS_FIRMWARE_BIOS_CHANGE: false as const,

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

export const LEDGER_AGENT_BOUNDS = Object.freeze({
  mayNormalizeReceipts: true as const,
  mayClassifyComparisons: true as const,
  mayUpdateSchedulerMemoryWeights: true as const,
  mayMarkStaleForRetest: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayCompareUnlikeTests: false as const,
  mayDeleteOldEvidence: false as const,
  mayStrengthenEdgesWithoutMeasurement: false as const,
  mayClaimQuantumBetterWithoutData: false as const,
  mayOmitClassicalBaselineForQuantum: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayModifyFirmwareOrBios: false as const,
  mayRecommendOnly: true as const,
});

export const EP14_MAY = Object.freeze([
  'normalize_verified_receipts_into_benchmark_entries',
  'compare_like_tests_and_classify',
  'detect_regressions_and_lower_scheduler_preference',
  'mark_stale_candidates_for_retest_without_deleting',
  'feed_measured_edges_to_neural_learning',
  'label_quantum_inspired_separately_with_classical_baseline',
  'decline_scheduling_weight_for_stale_evidence',
] as const);

export const EP14_MUST_NOT = Object.freeze([
  'compare_unlike_tests_as_equivalent',
  'delete_old_evidence_on_staleness',
  'strengthen_routing_edges_without_measured_evidence',
  'claim_quantum_better_without_demonstrating_data',
  'omit_classical_baseline_for_quantum_inspired',
  'mix_quantum_into_classical_label',
  'store_hidden_chain_of_thought',
  'modify_firmware_bios_or_production_systems',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ep14SoftWireSnapshot = {
  ep13RuntimeReturnReceipt: SoftWirePresence;
  ep13Report: SoftWirePresence;
  ep12Scheduler: SoftWirePresence;
  ep12Report: SoftWirePresence;
  ep5BenchmarkMemory: SoftWirePresence;
  ep5Report: SoftWirePresence;
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp14LocksIntact(): boolean {
  return (
    EP14_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP14_LOCKS.UNLIKE_TESTS_COMPARED_AS_EQUIVALENT === false &&
    EP14_LOCKS.DELETE_OLD_EVIDENCE_ON_STALE === false &&
    EP14_LOCKS.UNMEASURED_EVIDENCE_STRENGTHENS_EDGES === false &&
    EP14_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE === false &&
    EP14_LOCKS.QUANTUM_BETTER_WITHOUT_DATA === false &&
    EP14_LOCKS.QUANTUM_MIXED_INTO_CLASSICAL_LABEL === false &&
    EP14_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_LEDGER === false &&
    EP14_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP14_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP14_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EP14_LOCKS.AUTONOMOUS_FIRMWARE_BIOS_CHANGE === false &&
    EP14_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP14_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP14_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EP14_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP14_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP14_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP14_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP14_LOCKS.TIP_LAND === false &&
    EP14_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP14_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP14_LOCKS.FULL_PRODUCTION_LEDGER_SHIPPED === false &&
    EP14_LOCKS.MANAGE_PULL_REQUEST === false &&
    LEDGER_AGENT_BOUNDS.automaticAuthority === false &&
    LEDGER_AGENT_BOUNDS.mayCompareUnlikeTests === false &&
    LEDGER_AGENT_BOUNDS.mayDeleteOldEvidence === false &&
    LEDGER_AGENT_BOUNDS.mayStrengthenEdgesWithoutMeasurement === false &&
    LEDGER_AGENT_BOUNDS.mayClaimQuantumBetterWithoutData === false &&
    LEDGER_AGENT_BOUNDS.mayOmitClassicalBaselineForQuantum === false &&
    LEDGER_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false &&
    LEDGER_AGENT_BOUNDS.mayModifyFirmwareOrBios === false
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

export function ep14SoftWireSnapshot(repoRoot?: string): Ep14SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
    ep1VirtualChipContract: softWireFile(
      './virtual-chip-contract-types.ts',
      'EP1 Virtual Chip Contract PRESENT (soft-wire).',
      'EP1 Virtual Chip Contract absent — soft-wire WAITING_DATA.',
    ),
    ep1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP1_VIRTUAL_CHIP_CONTRACT_REPORT.md',
      'EP1 report PRESENT.',
      'EP1 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Ep14Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isLedgerAgent(actor: Ep14Actor): boolean {
  const agents: readonly Ep14ActorKind[] = [
    'benchmark_ledger',
    'scheduler',
    'receipt_agent',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Scheduling weight declines for stale evidence; never deleted by this helper.
 */
export function declineStaleSchedulingWeight(
  currentWeight: number,
  declineFactor = 0.5,
): { weight: number; deleted: false } {
  const next = Math.max(0, currentWeight * declineFactor);
  return { weight: next, deleted: false };
}
