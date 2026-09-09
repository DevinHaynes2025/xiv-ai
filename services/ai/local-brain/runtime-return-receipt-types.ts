/**
 * 62L-EP13 — Runtime Return Receipt (park-and-implement).
 *
 * Every compute execution returns a tamper-evident receipt so Home Base can
 * verify what actually ran, where it ran, which model/runtime handled it, and
 * whether fallback occurred.
 *
 * Core truth: requested device and actual device are always recorded separately.
 * Fallback to CPU can validate CPU but cannot verify NPU/GPU.
 *
 * Missing/malformed/stale/inconsistent receipt → UNVERIFIED (not silent accept).
 *
 * Soft-wire when PRESENT: EP12, EP10, EP5, EP1, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #160 / 62L-EP family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Append-only audit. Secrets redacted.
 * High-consequence PASS still needs human authorization.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EP14 — Adaptive Benchmark Ledger.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP13' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP13 Runtime Return Receipt — tamper-evident compute receipt with separate requested vs actual device, fallback recording, and Home Base UNVERIFIED gate for missing/malformed/stale/inconsistent receipts' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP13_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP14 — Adaptive Benchmark Ledger — turn these receipts into time-aware performance memory and detect when hardware, drivers, runtimes, or models improve or regress.' as const;

/**
 * Home Base flow after execution.
 */
export const RECEIPT_HOME_BASE_FLOW = [
  'receipt',
  'validation',
  'audit',
  'benchmark_memory',
  'neural_compute_graph',
  'agent_result',
] as const;

/**
 * Receipt tracking fields.
 */
export const RECEIPT_FIELDS = [
  'receiptId',
  'taskEnvelopeId',
  'agentId',
  'tenantId',
  'homeUniverseId',
  'requestedDeviceClass',
  'selectedNodeId',
  'actualDevice',
  'vendor',
  'runtimeProvider',
  'modelId',
  'modelVersionHash',
  'precision',
  'startedAt',
  'completedAt',
  'latencyMs',
  'memoryUsed',
  'resourceState',
  'fallbackUsed',
  'fallbackReason',
  'resultState',
  'failureClass',
  'benchmarkRef',
  'evidenceRefs',
  'receiptSignatureHash',
] as const;

export type ReceiptField = (typeof RECEIPT_FIELDS)[number];

/**
 * Receipt / result states.
 */
export const RECEIPT_RESULT_STATES = [
  'PASS',
  'FAIL',
  'PARTIAL',
  'DEGRADED',
  'TIMEOUT',
  'RESOURCE_LIMIT',
  'POLICY_DENIED',
  'PROVIDER_UNAVAILABLE',
  'MODEL_LOAD_FAILED',
  'INVALID_OUTPUT',
  'UNVERIFIED',
] as const;

export type ReceiptResultState = (typeof RECEIPT_RESULT_STATES)[number];

export const DEVICE_CLASSES = [
  'cpu',
  'gpu',
  'npu',
  'edge_gpu',
  'cloud_gpu',
  'accelerator',
  'qpu_path',
] as const;

export type DeviceClass = (typeof DEVICE_CLASSES)[number];

export const RUNTIME_RETURN_RECEIPT_CYCLE = [
  'honesty_locks',
  'runtime_return_receipt_bootstrap',
  // A — Structure
  'home_base_flow_encoded',
  'receipt_fields_encoded',
  'result_states_encoded',
  'device_classes_encoded',
  // B — Truth
  'requested_and_actual_recorded_separately',
  'fallback_cannot_verify_accelerator',
  'missing_malformed_stale_inconsistent_unverified',
  // C — Security
  'tenant_universe_must_match_originating_task',
  'no_hidden_chain_of_thought',
  'secrets_credentials_redacted',
  'receipts_append_only',
  'cross_tenant_reuse_denied',
  'failed_policy_cannot_rewrite_as_pass',
  'high_consequence_pass_needs_human_auth',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'ep12_soft_wire',
  'ep10_soft_wire',
  'ep5_soft_wire',
  'ep1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep13Hop = (typeof RUNTIME_RETURN_RECEIPT_CYCLE)[number];

export type Ep13EvidenceState =
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
  | 'UNKNOWN';

export type Ep13HopRecord = {
  hop: Ep13Hop;
  state: Ep13EvidenceState;
  summary: string;
  at: string;
};

export type Ep13ActorKind =
  | 'runtime_receipt'
  | 'home_base_validator'
  | 'scheduler'
  | 'benchmark_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep13Actor = {
  kind: Ep13ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP13_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_RECEIPT_SYSTEM_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Truth
  REQUESTED_EQ_ACTUAL_IMPLIED: false as const,
  FALLBACK_VERIFIES_ACCELERATOR: false as const,
  MISSING_RECEIPT_SILENT_ACCEPT: false as const,
  MALFORMED_RECEIPT_SILENT_ACCEPT: false as const,
  STALE_RECEIPT_SILENT_ACCEPT: false as const,
  INCONSISTENT_RECEIPT_SILENT_ACCEPT: false as const,

  // Security
  TENANT_UNIVERSE_MISMATCH_ALLOWED: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_RECEIPT: false as const,
  SECRETS_IN_RECEIPT: false as const,
  RECEIPT_MUTATION_AFTER_FINALIZE: false as const,
  CROSS_TENANT_RECEIPT_REUSE: false as const,
  POLICY_FAIL_REWRITTEN_AS_PASS: false as const,
  HIGH_CONSEQUENCE_PASS_SKIPS_HUMAN: false as const,

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

export const RECEIPT_AGENT_BOUNDS = Object.freeze({
  mayEmitReceipts: true as const,
  mayValidateAtHomeBase: true as const,
  mayFeedBenchmarkMemory: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayIncludeSecrets: false as const,
  mayMutateFinalizedReceipt: false as const,
  mayReuseAcrossTenants: false as const,
  mayRewritePolicyFailAsPass: false as const,
  maySkipHumanForHighConsequence: false as const,
  mayRecommendOnly: true as const,
});

export const EP13_MAY = Object.freeze([
  'emit_tamper_evident_receipts',
  'record_requested_and_actual_separately',
  'record_fallback_without_verifying_accelerator',
  'classify_missing_malformed_stale_inconsistent_as_unverified',
  'append_only_audit_artifacts',
  'redact_secrets_and_credentials',
  'feed_validated_receipts_to_benchmark_memory',
  'require_human_auth_for_high_consequence',
] as const);

export const EP13_MUST_NOT = Object.freeze([
  'imply_requested_equals_actual',
  'verify_accelerator_via_cpu_fallback',
  'silently_accept_missing_or_malformed_receipt',
  'include_hidden_chain_of_thought',
  'include_secrets_or_credentials',
  'mutate_finalized_receipt',
  'reuse_receipt_across_tenants',
  'rewrite_policy_fail_as_pass',
  'skip_human_for_high_consequence_pass',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ep13SoftWireSnapshot = {
  ep12Scheduler: SoftWirePresence;
  ep12Report: SoftWirePresence;
  ep10OtherAcceleratorRegistry: SoftWirePresence;
  ep10Report: SoftWirePresence;
  ep5BenchmarkMemory: SoftWirePresence;
  ep5Report: SoftWirePresence;
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp13LocksIntact(): boolean {
  return (
    EP13_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP13_LOCKS.REQUESTED_EQ_ACTUAL_IMPLIED === false &&
    EP13_LOCKS.FALLBACK_VERIFIES_ACCELERATOR === false &&
    EP13_LOCKS.MISSING_RECEIPT_SILENT_ACCEPT === false &&
    EP13_LOCKS.MALFORMED_RECEIPT_SILENT_ACCEPT === false &&
    EP13_LOCKS.STALE_RECEIPT_SILENT_ACCEPT === false &&
    EP13_LOCKS.INCONSISTENT_RECEIPT_SILENT_ACCEPT === false &&
    EP13_LOCKS.TENANT_UNIVERSE_MISMATCH_ALLOWED === false &&
    EP13_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_RECEIPT === false &&
    EP13_LOCKS.SECRETS_IN_RECEIPT === false &&
    EP13_LOCKS.RECEIPT_MUTATION_AFTER_FINALIZE === false &&
    EP13_LOCKS.CROSS_TENANT_RECEIPT_REUSE === false &&
    EP13_LOCKS.POLICY_FAIL_REWRITTEN_AS_PASS === false &&
    EP13_LOCKS.HIGH_CONSEQUENCE_PASS_SKIPS_HUMAN === false &&
    EP13_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP13_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP13_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EP13_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP13_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP13_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EP13_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP13_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP13_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP13_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP13_LOCKS.TIP_LAND === false &&
    EP13_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP13_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP13_LOCKS.FULL_PRODUCTION_RECEIPT_SYSTEM_SHIPPED === false &&
    EP13_LOCKS.MANAGE_PULL_REQUEST === false &&
    RECEIPT_AGENT_BOUNDS.automaticAuthority === false &&
    RECEIPT_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false &&
    RECEIPT_AGENT_BOUNDS.mayIncludeSecrets === false &&
    RECEIPT_AGENT_BOUNDS.mayMutateFinalizedReceipt === false &&
    RECEIPT_AGENT_BOUNDS.mayReuseAcrossTenants === false &&
    RECEIPT_AGENT_BOUNDS.mayRewritePolicyFailAsPass === false &&
    RECEIPT_AGENT_BOUNDS.maySkipHumanForHighConsequence === false
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

export function ep13SoftWireSnapshot(repoRoot?: string): Ep13SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
    ep10OtherAcceleratorRegistry: softWireFile(
      './other-accelerator-registry-types.ts',
      'EP10 Other Accelerator Registry PRESENT (soft-wire).',
      'EP10 Other Accelerator Registry absent — soft-wire WAITING_DATA.',
    ),
    ep10Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP10_OTHER_ACCELERATOR_REGISTRY_REPORT.md',
      'EP10 report PRESENT.',
      'EP10 report absent — soft-wire WAITING_DATA.',
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

export function isHumanApprover(actor: Ep13Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isReceiptAgent(actor: Ep13Actor): boolean {
  const agents: readonly Ep13ActorKind[] = [
    'runtime_receipt',
    'home_base_validator',
    'scheduler',
    'benchmark_agent',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Accelerator request that fell back to CPU cannot verify the accelerator.
 */
export function fallbackVerifiesAccelerator(input: {
  requestedDeviceClass: DeviceClass;
  actualDevice: DeviceClass;
  fallbackUsed: boolean;
}): boolean {
  void input;
  return false; // never — fallback validates actual path only
}

export function isAcceleratorFallback(input: {
  requestedDeviceClass: DeviceClass;
  actualDevice: DeviceClass;
}): boolean {
  const requestedAccel =
    input.requestedDeviceClass === 'gpu' ||
    input.requestedDeviceClass === 'npu' ||
    input.requestedDeviceClass === 'edge_gpu' ||
    input.requestedDeviceClass === 'cloud_gpu' ||
    input.requestedDeviceClass === 'accelerator';
  return requestedAccel && input.actualDevice === 'cpu';
}
