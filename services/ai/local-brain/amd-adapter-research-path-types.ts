/**
 * 62L-EP7 — AMD Adapter Research Path (park-and-implement).
 *
 * Governed AMD runtime adapter so the Virtual Chip layer can test and use
 * compatible AMD CPU/GPU/NPU execution paths on Windows without overstating
 * support.
 *
 * Critical: if an AMD GPU/NPU request silently executes on CPU, the receipt
 * must record the fallback and the accelerator remains unverified.
 *
 * May research/test documented Windows ML / ONNX Runtime-compatible paths.
 * Must NOT auto-install drivers, alter BIOS/firmware, overclock, undervolt,
 * or bypass Windows security controls.
 *
 * SoT: GitHub #160 / 62L-EP family (authoritative per founder). GitLab mirror:
 * not resolved in this environment (GitLab MCP needsAuth; no issue number invented).
 *
 * Soft-wire when PRESENT: EP6, EP5, EP1, EM (#157). Presence ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. No production deployment / main merge /
 * permission expansion / cloud purchasing.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): EP8 — NVIDIA Adapter Research Path.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP7' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP7 AMD Adapter Research Path — governed AMD runtime adapter for Windows ML/ONNX-compatible CPU/GPU/NPU paths with receipt-recorded CPU fallback and evidence-first VERIFIED gate' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP7_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP8 — NVIDIA Adapter Research Path — apply the same evidence-first contract to CUDA/TensorRT/ONNX-compatible NVIDIA environments.' as const;

/**
 * Core flow.
 */
export const AMD_ADAPTER_CORE_FLOW = [
  'agent_task',
  'virtual_chip_registry',
  'amd_adapter',
  'runtime_provider_check',
  'bounded_inference',
  'return_receipt',
  'benchmark_memory',
  'xiv_home_base',
] as const;

export type AmdAdapterCoreFlowHop = (typeof AMD_ADAPTER_CORE_FLOW)[number];

/**
 * Adapter tracking fields.
 */
export const AMD_ADAPTER_FIELDS = [
  'adapterId',
  'amdDeviceModel',
  'windowsVersion',
  'runtimeProvider',
  'modelCompatibility',
  'precision',
  'memoryRequirement',
  'providerInitializationState',
  'actualExecutionDevice',
  'latency',
  'throughput',
  'resourceUsage',
  'fallbackPath',
  'benchmarkReference',
  'lastVerifiedTimestamp',
  'failureClass',
] as const;

export type AmdAdapterField = (typeof AMD_ADAPTER_FIELDS)[number];

/**
 * Required adapter / device states.
 */
export const AMD_ADAPTER_STATES = [
  'UNKNOWN',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'UNAVAILABLE',
] as const;

export type AmdAdapterState = (typeof AMD_ADAPTER_STATES)[number];

/**
 * Actual execution device classes for receipts.
 */
export const AMD_EXECUTION_DEVICES = [
  'amd_cpu',
  'amd_gpu',
  'amd_npu',
  'cpu_fallback',
  'unknown',
] as const;

export type AmdExecutionDevice = (typeof AMD_EXECUTION_DEVICES)[number];

/**
 * Failure classes for adapter receipts.
 */
export const AMD_FAILURE_CLASSES = [
  'none',
  'device_not_detected',
  'runtime_missing',
  'model_load_failed',
  'inference_failed',
  'silent_cpu_fallback',
  'execution_device_unconfirmed',
  'benchmark_missing',
  'provider_init_failed',
  'unsupported_precision',
  'out_of_memory',
  'degraded',
  'unavailable',
  'unknown',
] as const;

export type AmdFailureClass = (typeof AMD_FAILURE_CLASSES)[number];

/**
 * Preconditions before VERIFIED.
 */
export const AMD_VERIFIED_PRECONDITIONS = [
  'exact_device_detected',
  'compatible_runtime_provider_present',
  'bounded_model_load_succeeds',
  'inference_succeeds_on_intended_amd_device',
  'actual_execution_device_confirmed',
  'result_timestamped',
  'benchmark_evidence_stored',
  'cpu_fallback_behavior_tested_separately',
] as const;

export type AmdVerifiedPrecondition =
  (typeof AMD_VERIFIED_PRECONDITIONS)[number];

/**
 * Forbidden adapter actions.
 */
export const AMD_ADAPTER_MUST_NOT = [
  'automatically_install_drivers',
  'alter_bios_firmware',
  'overclock',
  'undervolt',
  'bypass_windows_security_controls',
  'claim_verified_after_silent_cpu_fallback',
  'production_deployment',
  'main_merge',
  'permission_expansion',
  'cloud_purchasing',
] as const;

export const AMD_ADAPTER_RESEARCH_CYCLE = [
  'honesty_locks',
  'amd_adapter_bootstrap',
  // A — Structure
  'core_flow_encoded',
  'adapter_fields_encoded',
  'adapter_states_encoded',
  'execution_devices_encoded',
  'failure_classes_encoded',
  'verified_preconditions_encoded',
  'must_not_actions_encoded',
  // B — Truth boundaries
  'silent_cpu_fallback_recorded',
  'accelerator_unverified_on_cpu_fallback',
  'verified_requires_all_preconditions',
  'cpu_fallback_tested_separately',
  'windows_ml_onnx_research_allowed',
  // C — Safety
  'no_auto_driver_install',
  'no_bios_firmware_alteration',
  'no_overclock_undervolt',
  'no_bypass_windows_security',
  'no_production_deploy_main_merge',
  'no_permission_expansion_cloud_purchase',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'ep6_soft_wire',
  'ep5_soft_wire',
  'ep1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep7Hop = (typeof AMD_ADAPTER_RESEARCH_CYCLE)[number];

export type Ep7EvidenceState =
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
  | 'DETECTED'
  | 'SUPPORTED'
  | 'DEGRADED'
  | 'UNKNOWN';

export type Ep7HopRecord = {
  hop: Ep7Hop;
  state: Ep7EvidenceState;
  summary: string;
  at: string;
};

export type Ep7ActorKind =
  | 'amd_adapter'
  | 'runtime_research'
  | 'virtual_chip_registry'
  | 'benchmark_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep7Actor = {
  kind: Ep7ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP7_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_AMD_ADAPTER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  MAIN_MERGE: false as const,
  PRODUCTION_DEPLOYMENT: false as const,
  PERMISSION_EXPANSION: false as const,
  CLOUD_PURCHASING: false as const,

  // Truth
  SILENT_CPU_FALLBACK_EQ_VERIFIED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  SUPPORTED_EQ_VERIFIED: false as const,
  NOT_TESTED_EQ_VERIFIED: false as const,
  VERIFIED_WITHOUT_PRECONDITIONS: false as const,
  ACCELERATOR_VERIFIED_ON_CPU_FALLBACK: false as const,

  // Forbidden actions
  AUTO_INSTALL_DRIVERS: false as const,
  ALTER_BIOS_FIRMWARE: false as const,
  OVERCLOCK: false as const,
  UNDERVOLT: false as const,
  BYPASS_WINDOWS_SECURITY: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_DEPLOY: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const AMD_ADAPTER_AGENT_BOUNDS = Object.freeze({
  mayResearchWindowsMlOnnxPaths: true as const,
  mayRunBoundedInference: true as const,
  mayReturnReceiptToHomeBase: true as const,
  automaticAuthority: false as const,
  mayAutoInstallDrivers: false as const,
  mayAlterBiosFirmware: false as const,
  mayOverclockOrUndervolt: false as const,
  mayBypassWindowsSecurity: false as const,
  mayClaimVerifiedOnSilentCpuFallback: false as const,
  mayRecommendOnly: true as const,
});

export const EP7_MAY = Object.freeze([
  'research_documented_windows_ml_onnx_paths',
  'track_adapter_fields_and_states',
  'run_bounded_inference_tests',
  'record_receipts_including_cpu_fallback',
  'store_benchmark_evidence_references',
  'test_cpu_fallback_separately',
  'return_receipts_to_home_base',
] as const);

export const EP7_MUST_NOT = Object.freeze([
  ...AMD_ADAPTER_MUST_NOT,
  'equate_silent_cpu_fallback_with_verified',
  'verify_without_preconditions',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ep7SoftWireSnapshot = {
  ep6HardwareTruthProbe: SoftWirePresence;
  ep6Report: SoftWirePresence;
  ep5BenchmarkMemory: SoftWirePresence;
  ep5Report: SoftWirePresence;
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp7LocksIntact(): boolean {
  return (
    EP7_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP7_LOCKS.SILENT_CPU_FALLBACK_EQ_VERIFIED === false &&
    EP7_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EP7_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    EP7_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
    EP7_LOCKS.VERIFIED_WITHOUT_PRECONDITIONS === false &&
    EP7_LOCKS.ACCELERATOR_VERIFIED_ON_CPU_FALLBACK === false &&
    EP7_LOCKS.AUTO_INSTALL_DRIVERS === false &&
    EP7_LOCKS.ALTER_BIOS_FIRMWARE === false &&
    EP7_LOCKS.OVERCLOCK === false &&
    EP7_LOCKS.UNDERVOLT === false &&
    EP7_LOCKS.BYPASS_WINDOWS_SECURITY === false &&
    EP7_LOCKS.PRODUCTION_DEPLOYMENT === false &&
    EP7_LOCKS.MAIN_MERGE === false &&
    EP7_LOCKS.PERMISSION_EXPANSION === false &&
    EP7_LOCKS.CLOUD_PURCHASING === false &&
    EP7_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP7_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP7_LOCKS.RECOMMEND_EQ_DEPLOY === false &&
    EP7_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP7_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP7_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP7_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP7_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP7_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP7_LOCKS.TIP_LAND === false &&
    EP7_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP7_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP7_LOCKS.FULL_PRODUCTION_AMD_ADAPTER_SHIPPED === false &&
    EP7_LOCKS.MANAGE_PULL_REQUEST === false &&
    AMD_ADAPTER_AGENT_BOUNDS.automaticAuthority === false &&
    AMD_ADAPTER_AGENT_BOUNDS.mayAutoInstallDrivers === false &&
    AMD_ADAPTER_AGENT_BOUNDS.mayAlterBiosFirmware === false &&
    AMD_ADAPTER_AGENT_BOUNDS.mayOverclockOrUndervolt === false &&
    AMD_ADAPTER_AGENT_BOUNDS.mayBypassWindowsSecurity === false &&
    AMD_ADAPTER_AGENT_BOUNDS.mayClaimVerifiedOnSilentCpuFallback === false
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

export function ep7SoftWireSnapshot(repoRoot?: string): Ep7SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    ep6HardwareTruthProbe: softWireFile(
      './local-hardware-truth-probe-types.ts',
      'EP6 Local Hardware Truth Probe v2 PRESENT (soft-wire).',
      'EP6 Local Hardware Truth Probe v2 absent — soft-wire WAITING_DATA.',
    ),
    ep6Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP6_LOCAL_HARDWARE_TRUTH_PROBE_V2_REPORT.md',
      'EP6 report PRESENT.',
      'EP6 report absent — soft-wire WAITING_DATA.',
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

export function isHumanApprover(actor: Ep7Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isAmdAdapterAgent(actor: Ep7Actor): boolean {
  const agents: readonly Ep7ActorKind[] = [
    'amd_adapter',
    'runtime_research',
    'virtual_chip_registry',
    'benchmark_agent',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Intended accelerator vs actual device — silent CPU fallback detection.
 */
export function isSilentCpuFallback(input: {
  intendedDevice: AmdExecutionDevice;
  actualExecutionDevice: AmdExecutionDevice;
}): boolean {
  const intendedAccelerator =
    input.intendedDevice === 'amd_gpu' || input.intendedDevice === 'amd_npu';
  const ranOnCpu =
    input.actualExecutionDevice === 'cpu_fallback' ||
    input.actualExecutionDevice === 'amd_cpu';
  return intendedAccelerator && ranOnCpu;
}
