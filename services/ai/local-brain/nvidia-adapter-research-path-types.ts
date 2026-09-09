/**
 * 62L-EP8 — NVIDIA Adapter Research Path (park-and-implement).
 *
 * Governed NVIDIA runtime adapter so the Virtual Chip layer can test and use
 * compatible NVIDIA GPU execution paths without assuming CUDA, TensorRT, or
 * model support before evidence exists.
 *
 * Critical: detecting an NVIDIA GPU ≠ CUDA or TensorRT usable.
 * VERIFIED requires bounded model load + successful inference on the intended
 * NVIDIA execution path. Silent CPU fallback → record requestedDevice=NVIDIA_GPU,
 * actualDevice=CPU, fallbackUsed=true; GPU remains unverified.
 *
 * Soft-wire when PRESENT: EP7, EP6, EP5, EP1, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #160 / 62L-EP family. GitLab mirror: not resolved (needsAuth;
 * no issue number invented).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. No production deploy / main merge / permission
 * expansion / cloud GPU provisioning. DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EP9 — Intel Adapter Research Path.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP8' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP8 NVIDIA Adapter Research Path — governed NVIDIA runtime adapter for CUDA/TensorRT/ONNX-compatible GPU paths with evidence-first VERIFIED gate and receipt-recorded CPU fallback' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP8_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP9 — Intel Adapter Research Path — add the same evidence-first abstraction for Intel CPU/GPU/NPU and OpenVINO/oneAPI-compatible runtimes.' as const;

export const NVIDIA_ADAPTER_CORE_FLOW = [
  'agent_task',
  'virtual_chip_registry',
  'nvidia_adapter',
  'runtime_provider_check',
  'bounded_inference',
  'return_receipt',
  'benchmark_memory',
  'xiv_home_base',
] as const;

export type NvidiaAdapterCoreFlowHop =
  (typeof NVIDIA_ADAPTER_CORE_FLOW)[number];

export const NVIDIA_ADAPTER_FIELDS = [
  'adapterId',
  'nvidiaGpuModel',
  'vram',
  'driverState',
  'cudaState',
  'tensorRtState',
  'tensorRtLlmState',
  'onnxCompatibility',
  'supportedPrecisions',
  'modelCompatibility',
  'actualExecutionDevice',
  'latency',
  'throughput',
  'memoryUsage',
  'fallbackRoute',
  'benchmarkReference',
  'lastVerifiedTimestamp',
  'failureClass',
] as const;

export type NvidiaAdapterField = (typeof NVIDIA_ADAPTER_FIELDS)[number];

export const NVIDIA_ADAPTER_STATES = [
  'UNKNOWN',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'UNAVAILABLE',
] as const;

export type NvidiaAdapterState = (typeof NVIDIA_ADAPTER_STATES)[number];

export const NVIDIA_EXECUTION_DEVICES = [
  'NVIDIA_GPU',
  'CPU',
  'unknown',
] as const;

export type NvidiaExecutionDevice = (typeof NVIDIA_EXECUTION_DEVICES)[number];

export const NVIDIA_FAILURE_CLASSES = [
  'none',
  'gpu_not_detected',
  'driver_missing',
  'cuda_unusable',
  'tensorrt_unusable',
  'onnx_incompatible',
  'model_load_failed',
  'inference_failed',
  'silent_cpu_fallback',
  'execution_device_unconfirmed',
  'benchmark_missing',
  'multi_gpu_not_tested',
  'distributed_not_tested',
  'out_of_memory',
  'degraded',
  'unavailable',
  'unknown',
] as const;

export type NvidiaFailureClass = (typeof NVIDIA_FAILURE_CLASSES)[number];

export const NVIDIA_VERIFIED_PRECONDITIONS = [
  'nvidia_gpu_detected',
  'compatible_runtime_provider_present',
  'bounded_model_load_succeeds',
  'inference_succeeds_on_intended_nvidia_path',
  'actual_execution_device_confirmed_nvidia_gpu',
  'result_timestamped',
  'benchmark_evidence_stored',
  'cpu_fallback_behavior_tested_separately',
] as const;

export type NvidiaVerifiedPrecondition =
  (typeof NVIDIA_VERIFIED_PRECONDITIONS)[number];

export const NVIDIA_ADAPTER_MUST_NOT = [
  'automatically_install_cuda_tensorrt_or_drivers',
  'overclock',
  'thermal_limit_bypass',
  'alter_bios_firmware',
  'privilege_escalation',
  'automatic_cloud_gpu_provisioning',
  'private_tenant_data_leave_universe',
  'claim_multi_gpu_verified_without_measurement',
  'claim_distributed_verified_without_measurement',
  'claim_verified_after_silent_cpu_fallback',
  'assume_cuda_from_gpu_detection',
  'assume_tensorrt_from_gpu_detection',
  'production_deployment',
  'main_merge',
  'permission_expansion',
] as const;

export const NVIDIA_ADAPTER_RESEARCH_CYCLE = [
  'honesty_locks',
  'nvidia_adapter_bootstrap',
  // A — Structure
  'core_flow_encoded',
  'adapter_fields_encoded',
  'adapter_states_encoded',
  'execution_devices_encoded',
  'failure_classes_encoded',
  'verified_preconditions_encoded',
  'must_not_actions_encoded',
  // B — Truth boundaries
  'gpu_detection_neq_cuda_usable',
  'gpu_detection_neq_tensorrt_usable',
  'silent_cpu_fallback_recorded',
  'gpu_unverified_on_cpu_fallback',
  'verified_requires_all_preconditions',
  'multi_gpu_distributed_not_tested_until_measured',
  // C — Safety
  'no_auto_cuda_tensorrt_driver_install',
  'no_overclock_thermal_bypass',
  'no_bios_firmware_alteration',
  'no_privilege_escalation',
  'no_automatic_cloud_gpu_provisioning',
  'private_tenant_data_stays_in_universe',
  'no_production_deploy_main_merge',
  'no_permission_expansion',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'ep7_soft_wire',
  'ep6_soft_wire',
  'ep5_soft_wire',
  'ep1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep8Hop = (typeof NVIDIA_ADAPTER_RESEARCH_CYCLE)[number];

export type Ep8EvidenceState =
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

export type Ep8HopRecord = {
  hop: Ep8Hop;
  state: Ep8EvidenceState;
  summary: string;
  at: string;
};

export type Ep8ActorKind =
  | 'nvidia_adapter'
  | 'runtime_research'
  | 'virtual_chip_registry'
  | 'benchmark_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep8Actor = {
  kind: Ep8ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP8_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_NVIDIA_ADAPTER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  MAIN_MERGE: false as const,
  PRODUCTION_DEPLOYMENT: false as const,
  PERMISSION_EXPANSION: false as const,

  // Truth
  GPU_DETECTION_EQ_CUDA_USABLE: false as const,
  GPU_DETECTION_EQ_TENSORRT_USABLE: false as const,
  SILENT_CPU_FALLBACK_EQ_VERIFIED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  SUPPORTED_EQ_VERIFIED: false as const,
  NOT_TESTED_EQ_VERIFIED: false as const,
  VERIFIED_WITHOUT_PRECONDITIONS: false as const,
  GPU_VERIFIED_ON_CPU_FALLBACK: false as const,
  MULTI_GPU_EQ_VERIFIED_WITHOUT_MEASUREMENT: false as const,
  DISTRIBUTED_EQ_VERIFIED_WITHOUT_MEASUREMENT: false as const,

  // Forbidden actions
  AUTO_INSTALL_CUDA_TENSORRT_DRIVERS: false as const,
  OVERCLOCK: false as const,
  THERMAL_LIMIT_BYPASS: false as const,
  ALTER_BIOS_FIRMWARE: false as const,
  PRIVILEGE_ESCALATION: false as const,
  AUTOMATIC_CLOUD_GPU_PROVISIONING: false as const,
  PRIVATE_TENANT_DATA_LEAVE_UNIVERSE: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_DEPLOY: false as const,

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

export const NVIDIA_ADAPTER_AGENT_BOUNDS = Object.freeze({
  mayResearchCudaTensorRtOnnxPaths: true as const,
  mayRunBoundedInference: true as const,
  mayReturnReceiptToHomeBase: true as const,
  automaticAuthority: false as const,
  mayAutoInstallCudaTensorRtDrivers: false as const,
  mayOverclockOrThermalBypass: false as const,
  mayAlterBiosFirmware: false as const,
  mayEscalatePrivileges: false as const,
  mayAutoProvisionCloudGpu: false as const,
  mayExfiltratePrivateTenantData: false as const,
  mayClaimVerifiedOnSilentCpuFallback: false as const,
  mayClaimMultiGpuVerifiedWithoutMeasurement: false as const,
  mayRecommendOnly: true as const,
});

export const EP8_MAY = Object.freeze([
  'research_documented_cuda_tensorrt_onnx_paths',
  'track_adapter_fields_and_states',
  'run_bounded_inference_tests',
  'record_receipts_including_cpu_fallback',
  'store_benchmark_evidence_references',
  'keep_multi_gpu_distributed_not_tested_until_measured',
  'return_receipts_to_home_base',
] as const);

export const EP8_MUST_NOT = Object.freeze([
  ...NVIDIA_ADAPTER_MUST_NOT,
  'equate_gpu_detection_with_cuda_usable',
  'equate_gpu_detection_with_tensorrt_usable',
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

export type Ep8SoftWireSnapshot = {
  ep7AmdAdapter: SoftWirePresence;
  ep7Report: SoftWirePresence;
  ep6HardwareTruthProbe: SoftWirePresence;
  ep6Report: SoftWirePresence;
  ep5BenchmarkMemory: SoftWirePresence;
  ep5Report: SoftWirePresence;
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp8LocksIntact(): boolean {
  return (
    EP8_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP8_LOCKS.GPU_DETECTION_EQ_CUDA_USABLE === false &&
    EP8_LOCKS.GPU_DETECTION_EQ_TENSORRT_USABLE === false &&
    EP8_LOCKS.SILENT_CPU_FALLBACK_EQ_VERIFIED === false &&
    EP8_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EP8_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    EP8_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
    EP8_LOCKS.VERIFIED_WITHOUT_PRECONDITIONS === false &&
    EP8_LOCKS.GPU_VERIFIED_ON_CPU_FALLBACK === false &&
    EP8_LOCKS.MULTI_GPU_EQ_VERIFIED_WITHOUT_MEASUREMENT === false &&
    EP8_LOCKS.DISTRIBUTED_EQ_VERIFIED_WITHOUT_MEASUREMENT === false &&
    EP8_LOCKS.AUTO_INSTALL_CUDA_TENSORRT_DRIVERS === false &&
    EP8_LOCKS.OVERCLOCK === false &&
    EP8_LOCKS.THERMAL_LIMIT_BYPASS === false &&
    EP8_LOCKS.ALTER_BIOS_FIRMWARE === false &&
    EP8_LOCKS.PRIVILEGE_ESCALATION === false &&
    EP8_LOCKS.AUTOMATIC_CLOUD_GPU_PROVISIONING === false &&
    EP8_LOCKS.PRIVATE_TENANT_DATA_LEAVE_UNIVERSE === false &&
    EP8_LOCKS.PRODUCTION_DEPLOYMENT === false &&
    EP8_LOCKS.MAIN_MERGE === false &&
    EP8_LOCKS.PERMISSION_EXPANSION === false &&
    EP8_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP8_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP8_LOCKS.RECOMMEND_EQ_DEPLOY === false &&
    EP8_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP8_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP8_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EP8_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP8_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP8_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP8_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP8_LOCKS.TIP_LAND === false &&
    EP8_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP8_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP8_LOCKS.FULL_PRODUCTION_NVIDIA_ADAPTER_SHIPPED === false &&
    EP8_LOCKS.MANAGE_PULL_REQUEST === false &&
    NVIDIA_ADAPTER_AGENT_BOUNDS.automaticAuthority === false &&
    NVIDIA_ADAPTER_AGENT_BOUNDS.mayAutoInstallCudaTensorRtDrivers === false &&
    NVIDIA_ADAPTER_AGENT_BOUNDS.mayOverclockOrThermalBypass === false &&
    NVIDIA_ADAPTER_AGENT_BOUNDS.mayAlterBiosFirmware === false &&
    NVIDIA_ADAPTER_AGENT_BOUNDS.mayEscalatePrivileges === false &&
    NVIDIA_ADAPTER_AGENT_BOUNDS.mayAutoProvisionCloudGpu === false &&
    NVIDIA_ADAPTER_AGENT_BOUNDS.mayExfiltratePrivateTenantData === false &&
    NVIDIA_ADAPTER_AGENT_BOUNDS.mayClaimVerifiedOnSilentCpuFallback === false &&
    NVIDIA_ADAPTER_AGENT_BOUNDS.mayClaimMultiGpuVerifiedWithoutMeasurement ===
      false
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

export function ep8SoftWireSnapshot(repoRoot?: string): Ep8SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    ep7AmdAdapter: softWireFile(
      './amd-adapter-research-path-types.ts',
      'EP7 AMD Adapter Research Path PRESENT (soft-wire).',
      'EP7 AMD Adapter Research Path absent — soft-wire WAITING_DATA.',
    ),
    ep7Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP7_AMD_ADAPTER_RESEARCH_PATH_REPORT.md',
      'EP7 report PRESENT.',
      'EP7 report absent — soft-wire WAITING_DATA.',
    ),
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

export function isHumanApprover(actor: Ep8Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isNvidiaAdapterAgent(actor: Ep8Actor): boolean {
  const agents: readonly Ep8ActorKind[] = [
    'nvidia_adapter',
    'runtime_research',
    'virtual_chip_registry',
    'benchmark_agent',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export function isSilentCpuFallback(input: {
  requestedDevice: NvidiaExecutionDevice;
  actualDevice: NvidiaExecutionDevice;
}): boolean {
  return (
    input.requestedDevice === 'NVIDIA_GPU' && input.actualDevice === 'CPU'
  );
}
