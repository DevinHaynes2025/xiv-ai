/**
 * 62L-EQ13 — Architecture Return Receipt (park-and-implement).
 *
 * Every cross-architecture execution returns a structured receipt so Home Base
 * can prove which architecture, runtime, device, and fallback path actually
 * handled the workload.
 *
 * Core truth: requestedArchitecture != actualArchitecture must always be
 * possible. Fallback verifies the actual route only — not the requested one.
 *
 * Home Base flow:
 * Execution → Receipt → validation → audit → Benchmark Matrix →
 * Architecture Capability Graph → Neural Pathway update
 *
 * Missing/stale/malformed/inconsistent receipts → UNVERIFIED.
 * No hidden chain-of-thought stored.
 *
 * Soft-wire when PRESENT: EQ12, EQ11, EQ6, EP13, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ14 — Neural Pathway Architecture Graph.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ13' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ13 Architecture Return Receipt — requested≠actual always possible; fallback verifies actual route only; missing/malformed→UNVERIFIED; no hidden CoT' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ13_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ14 — Neural Pathway Architecture Graph — link workloads, algorithms, compiler/IR paths, architectures, devices, benchmarks, failures, and successful outcomes into a growing compute-intelligence graph.' as const;

/**
 * Receipt required fields.
 */
export const ARCHITECTURE_RECEIPT_FIELDS = [
  'receiptId',
  'taskId',
  'workloadId',
  'agentId',
  'tenantId',
  'homeUniverseId',
  'requestedArchitecture',
  'selectedArchitecture',
  'actualArchitecture',
  'deviceId',
  'vendor',
  'runtimeProvider',
  'modelId',
  'modelVersionHash',
  'precision',
  'startedAt',
  'completedAt',
  'latencyMs',
  'throughput',
  'memoryUsed',
  'resourceState',
  'fallbackUsed',
  'fallbackReason',
  'resultState',
  'benchmarkRef',
  'evidenceRefs',
  'receiptHashSignature',
] as const;

export type ArchitectureReceiptField =
  (typeof ARCHITECTURE_RECEIPT_FIELDS)[number];

/**
 * Receipt result states.
 */
export const ARCHITECTURE_RECEIPT_STATES = [
  'PASS',
  'FAIL',
  'PARTIAL',
  'DEGRADED',
  'TIMEOUT',
  'RESOURCE_LIMIT',
  'POLICY_DENIED',
  'RUNTIME_UNAVAILABLE',
  'MODEL_LOAD_FAILED',
  'INVALID_OUTPUT',
  'UNVERIFIED',
] as const;

export type ArchitectureReceiptState =
  (typeof ARCHITECTURE_RECEIPT_STATES)[number];

/**
 * Home Base processing flow.
 */
export const ARCHITECTURE_RECEIPT_HOME_BASE_FLOW = [
  'execution',
  'receipt',
  'validation',
  'audit',
  'benchmark_matrix',
  'architecture_capability_graph',
  'neural_pathway_update',
] as const;

/**
 * Validation failure reasons → UNVERIFIED.
 */
export const RECEIPT_UNVERIFIED_REASONS = [
  'missing',
  'stale',
  'malformed',
  'inconsistent_with_task_envelope',
] as const;

/**
 * Example fallback truth from story.
 */
export const FALLBACK_TRUTH_EXAMPLE = Object.freeze({
  requestedArchitecture: 'ARM_NPU' as const,
  actualArchitecture: 'ARM_CPU' as const,
  fallbackUsed: true as const,
  verifiesNpuRoute: false as const,
  verifiesCpuRoute: true as const,
});

export const ARCHITECTURE_RETURN_RECEIPT_CYCLE = [
  'honesty_locks',
  'architecture_return_receipt_bootstrap',
  // A — Structure
  'receipt_fields_encoded',
  'receipt_states_encoded',
  'home_base_flow_encoded',
  'unverified_reasons_encoded',
  // B — Truth
  'requested_neq_actual_always_possible',
  'fallback_verifies_actual_not_requested',
  'missing_malformed_stale_inconsistent_unverified',
  'no_hidden_chain_of_thought',
  // C — Denies
  'deny_require_requested_eq_actual',
  'deny_verify_requested_route_on_fallback',
  'deny_accept_missing_receipt_as_verified',
  'deny_accept_malformed_receipt',
  'deny_accept_stale_receipt',
  'deny_accept_inconsistent_envelope',
  'deny_store_hidden_chain_of_thought',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  'human_authorization_unchanged',
  // E — Soft-wires
  'eq12_soft_wire',
  'eq11_soft_wire',
  'eq6_soft_wire',
  'ep13_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq13Hop = (typeof ARCHITECTURE_RETURN_RECEIPT_CYCLE)[number];

export type Eq13EvidenceState =
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
  | 'STALE'
  | 'UNKNOWN'
  | 'TIMEOUT'
  | 'POLICY_DENIED';

export type Eq13HopRecord = {
  hop: Eq13Hop;
  state: Eq13EvidenceState;
  summary: string;
  at: string;
};

export type Eq13ActorKind =
  | 'receipt_emitter'
  | 'home_base_validator'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Eq13Actor = {
  kind: Eq13ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ13_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_ARCHITECTURE_RECEIPT_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Core truth
  REQUIRE_REQUESTED_EQ_ACTUAL: false as const,
  VERIFY_REQUESTED_ROUTE_ON_FALLBACK: false as const,
  ACCEPT_MISSING_RECEIPT_AS_VERIFIED: false as const,
  ACCEPT_MALFORMED_RECEIPT: false as const,
  ACCEPT_STALE_RECEIPT: false as const,
  ACCEPT_INCONSISTENT_ENVELOPE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_RECEIPT: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,

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

export const EQ13_AGENT_BOUNDS = Object.freeze({
  mayEmitArchitectureReceipts: true as const,
  mayRecordFallbackRequestedVsActual: true as const,
  mayValidateReceiptsAtHomeBase: true as const,
  mayMarkUnverifiedOnMissingStaleMalformedInconsistent: true as const,
  mayReturnStructuredEvidenceOnly: true as const,
  automaticAuthority: false as const,
  mayRequireRequestedEqActual: false as const,
  mayVerifyRequestedRouteOnFallback: false as const,
  mayAcceptMissingReceiptAsVerified: false as const,
  mayAcceptMalformedReceipt: false as const,
  mayAcceptStaleReceipt: false as const,
  mayAcceptInconsistentEnvelope: false as const,
  mayStoreHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ13_MAY = Object.freeze([
  'emit_structured_architecture_return_receipts',
  'allow_requested_architecture_to_differ_from_actual',
  'verify_only_actual_route_when_fallback_used',
  'mark_unverified_on_missing_stale_malformed_or_inconsistent_receipts',
  'return_only_structured_outputs_evidence_metrics_failures_lessons',
  'feed_validated_receipts_into_benchmark_matrix_and_capability_graph',
] as const);

export const EQ13_MUST_NOT = Object.freeze([
  'require_requested_architecture_equal_actual',
  'treat_fallback_receipt_as_verification_of_requested_route',
  'accept_missing_stale_malformed_or_inconsistent_receipts_as_verified',
  'store_hidden_chain_of_thought',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
  'skip_human_authorization_for_high_consequence_actions',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eq13SoftWireSnapshot = {
  eq12CrossArchitectureBenchmarkMatrix: SoftWirePresence;
  eq12Report: SoftWirePresence;
  eq11DeviceNeutralWorkloadGenome: SoftWirePresence;
  eq11Report: SoftWirePresence;
  eq6ArchitectureCapabilityGraph: SoftWirePresence;
  eq6Report: SoftWirePresence;
  ep13RuntimeReturnReceipt: SoftWirePresence;
  ep13Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq13LocksIntact(): boolean {
  return (
    EQ13_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ13_LOCKS.REQUIRE_REQUESTED_EQ_ACTUAL === false &&
    EQ13_LOCKS.VERIFY_REQUESTED_ROUTE_ON_FALLBACK === false &&
    EQ13_LOCKS.ACCEPT_MISSING_RECEIPT_AS_VERIFIED === false &&
    EQ13_LOCKS.ACCEPT_MALFORMED_RECEIPT === false &&
    EQ13_LOCKS.ACCEPT_STALE_RECEIPT === false &&
    EQ13_LOCKS.ACCEPT_INCONSISTENT_ENVELOPE === false &&
    EQ13_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_RECEIPT === false &&
    EQ13_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ13_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ13_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ13_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ13_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ13_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ13_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ13_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ13_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ13_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ13_LOCKS.TIP_LAND === false &&
    EQ13_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ13_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ13_LOCKS.FULL_PRODUCTION_ARCHITECTURE_RECEIPT_SHIPPED === false &&
    EQ13_LOCKS.MANAGE_PULL_REQUEST === false &&
    FALLBACK_TRUTH_EXAMPLE.verifiesNpuRoute === false &&
    FALLBACK_TRUTH_EXAMPLE.verifiesCpuRoute === true &&
    EQ13_AGENT_BOUNDS.automaticAuthority === false &&
    EQ13_AGENT_BOUNDS.mayRequireRequestedEqActual === false &&
    EQ13_AGENT_BOUNDS.mayVerifyRequestedRouteOnFallback === false &&
    EQ13_AGENT_BOUNDS.mayAcceptMissingReceiptAsVerified === false &&
    EQ13_AGENT_BOUNDS.mayAcceptMalformedReceipt === false &&
    EQ13_AGENT_BOUNDS.mayAcceptStaleReceipt === false &&
    EQ13_AGENT_BOUNDS.mayAcceptInconsistentEnvelope === false &&
    EQ13_AGENT_BOUNDS.mayStoreHiddenChainOfThought === false
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

export function eq13SoftWireSnapshot(repoRoot?: string): Eq13SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eq12CrossArchitectureBenchmarkMatrix: softWireFile(
      './cross-architecture-benchmark-matrix-types.ts',
      'EQ12 Cross-Architecture Benchmark Matrix PRESENT (soft-wire).',
      'EQ12 Cross-Architecture Benchmark Matrix absent — soft-wire WAITING_DATA.',
    ),
    eq12Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ12_CROSS_ARCHITECTURE_BENCHMARK_MATRIX_REPORT.md',
      'EQ12 report PRESENT.',
      'EQ12 report absent — soft-wire WAITING_DATA.',
    ),
    eq11DeviceNeutralWorkloadGenome: softWireFile(
      './device-neutral-workload-genome-types.ts',
      'EQ11 Device-Neutral Workload Genome PRESENT (soft-wire).',
      'EQ11 Device-Neutral Workload Genome absent — soft-wire WAITING_DATA.',
    ),
    eq11Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ11_DEVICE_NEUTRAL_WORKLOAD_GENOME_REPORT.md',
      'EQ11 report PRESENT.',
      'EQ11 report absent — soft-wire WAITING_DATA.',
    ),
    eq6ArchitectureCapabilityGraph: softWireFile(
      './architecture-capability-graph-types.ts',
      'EQ6 Architecture Capability Graph PRESENT (soft-wire).',
      'EQ6 Architecture Capability Graph absent — soft-wire WAITING_DATA.',
    ),
    eq6Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ6_ARCHITECTURE_CAPABILITY_GRAPH_REPORT.md',
      'EQ6 report PRESENT.',
      'EQ6 report absent — soft-wire WAITING_DATA.',
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
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Eq13Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isEq13Agent(actor: Eq13Actor): boolean {
  const agents: readonly Eq13ActorKind[] = [
    'receipt_emitter',
    'home_base_validator',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * requestedArchitecture may always differ from actualArchitecture.
 */
export function requestedMustEqualActual(): false {
  return false;
}

/**
 * Fallback receipt verifies actual route only.
 */
export function fallbackVerifiesRequestedRoute(): false {
  return false;
}
