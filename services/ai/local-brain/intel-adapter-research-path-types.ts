/**
 * 62L-EP9 — Intel Adapter Research Path (park-and-implement).
 *
 * Governed Intel runtime adapter so the Virtual Chip layer can evaluate Intel
 * CPU, GPU, and NPU execution paths through documented runtimes such as
 * OpenVINO/oneAPI-compatible tooling without assuming support before evidence.
 *
 * Critical: an Intel processor or integrated GPU being present does not prove
 * OpenVINO/NPU acceleration works. VERIFIED requires exact device detection,
 * compatible runtime, bounded model load, inference on intended Intel device,
 * actual execution device confirmed, and benchmark receipt stored.
 *
 * If request targets Intel GPU/NPU but falls back to CPU, record fallback and
 * do not verify the accelerator.
 *
 * Soft-wire when PRESENT: EP8, EP7, EP6, EP5, EP1, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #160 / 62L-EP family. GitLab mirror: not resolved (needsAuth;
 * no issue number invented).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. No auto drivers/runtime installs, BIOS/firmware,
 * overclocking, privilege escalation, or autonomous cloud provisioning.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EP10 — Other Accelerator Registry.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP9' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP9 Intel Adapter Research Path — governed Intel CPU/GPU/NPU runtime adapter for OpenVINO/oneAPI-compatible paths with evidence-first VERIFIED gate and receipt-recorded CPU fallback' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP9_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP10 — Other Accelerator Registry — generalize the same evidence contract to Apple Neural Engine, Qualcomm Hexagon/NPU, cloud accelerators, edge AI chips, and future compute providers.' as const;

export const INTEL_ADAPTER_CORE_FLOW = [
  'agent_task',
  'virtual_chip_registry',
  'intel_adapter',
  'runtime_provider_check',
  'bounded_inference',
  'return_receipt',
  'benchmark_memory',
  'xiv_home_base',
] as const;

export type IntelAdapterCoreFlowHop =
  (typeof INTEL_ADAPTER_CORE_FLOW)[number];

export const INTEL_ADAPTER_FIELDS = [
  'adapterId',
  'intelDeviceModel',
  'deviceClass',
  'architectureGeneration',
  'driverRuntimeVersions',
  'openVinoState',
  'oneApiState',
  'onnxCompatibility',
  'supportedPrecisions',
  'modelCompatibility',
  'memoryRequirements',
  'actualExecutionDevice',
  'latency',
  'throughput',
  'resourceUsage',
  'fallbackRoute',
  'benchmarkReference',
  'lastVerifiedTimestamp',
  'failureClass',
] as const;

export type IntelAdapterField = (typeof INTEL_ADAPTER_FIELDS)[number];

export const INTEL_ADAPTER_STATES = [
  'UNKNOWN',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'UNAVAILABLE',
] as const;

export type IntelAdapterState = (typeof INTEL_ADAPTER_STATES)[number];

export const INTEL_DEVICE_CLASSES = [
  'intel_cpu',
  'intel_gpu',
  'intel_npu',
] as const;

export type IntelDeviceClass = (typeof INTEL_DEVICE_CLASSES)[number];

export const INTEL_EXECUTION_DEVICES = [
  'INTEL_CPU',
  'INTEL_GPU',
  'INTEL_NPU',
  'CPU_FALLBACK',
  'unknown',
] as const;

export type IntelExecutionDevice = (typeof INTEL_EXECUTION_DEVICES)[number];

export const INTEL_FAILURE_CLASSES = [
  'none',
  'device_not_detected',
  'runtime_missing',
  'openvino_unusable',
  'oneapi_unusable',
  'onnx_incompatible',
  'model_load_failed',
  'inference_failed',
  'silent_cpu_fallback',
  'execution_device_unconfirmed',
  'benchmark_missing',
  'out_of_memory',
  'degraded',
  'unavailable',
  'unknown',
] as const;

export type IntelFailureClass = (typeof INTEL_FAILURE_CLASSES)[number];

export const INTEL_VERIFIED_PRECONDITIONS = [
  'exact_device_detected',
  'compatible_runtime_provider_available',
  'bounded_model_load_succeeds',
  'inference_succeeds_on_intended_intel_device',
  'actual_execution_device_confirmed',
  'evidence_and_benchmark_receipt_stored',
] as const;

export type IntelVerifiedPrecondition =
  (typeof INTEL_VERIFIED_PRECONDITIONS)[number];

export const INTEL_ADAPTER_MUST_NOT = [
  'automatically_install_drivers_or_runtimes',
  'alter_bios_firmware',
  'overclock',
  'privilege_escalation',
  'autonomous_cloud_provisioning',
  'claim_verified_after_silent_cpu_fallback',
  'assume_openvino_from_cpu_or_igpu_presence',
  'assume_npu_acceleration_from_cpu_presence',
  'production_deployment',
  'main_merge',
  'permission_expansion',
] as const;

export const INTEL_ADAPTER_RESEARCH_CYCLE = [
  'honesty_locks',
  'intel_adapter_bootstrap',
  // A — Structure
  'core_flow_encoded',
  'adapter_fields_encoded',
  'adapter_states_encoded',
  'device_classes_encoded',
  'execution_devices_encoded',
  'failure_classes_encoded',
  'verified_preconditions_encoded',
  'must_not_actions_encoded',
  // B — Truth boundaries
  'cpu_or_igpu_presence_neq_openvino_works',
  'cpu_presence_neq_npu_acceleration',
  'silent_cpu_fallback_recorded',
  'accelerator_unverified_on_cpu_fallback',
  'verified_requires_all_preconditions',
  // C — Safety
  'no_auto_driver_runtime_install',
  'no_bios_firmware_alteration',
  'no_overclock',
  'no_privilege_escalation',
  'no_autonomous_cloud_provisioning',
  'no_production_deploy_main_merge',
  'no_permission_expansion',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'ep8_soft_wire',
  'ep7_soft_wire',
  'ep6_soft_wire',
  'ep5_soft_wire',
  'ep1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep9Hop = (typeof INTEL_ADAPTER_RESEARCH_CYCLE)[number];

export type Ep9EvidenceState =
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

export type Ep9HopRecord = {
  hop: Ep9Hop;
  state: Ep9EvidenceState;
  summary: string;
  at: string;
};

export type Ep9ActorKind =
  | 'intel_adapter'
  | 'runtime_research'
  | 'virtual_chip_registry'
  | 'benchmark_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep9Actor = {
  kind: Ep9ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP9_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_INTEL_ADAPTER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  MAIN_MERGE: false as const,
  PRODUCTION_DEPLOYMENT: false as const,
  PERMISSION_EXPANSION: false as const,

  // Truth
  CPU_OR_IGPU_PRESENCE_EQ_OPENVINO_WORKS: false as const,
  CPU_PRESENCE_EQ_NPU_ACCELERATION: false as const,
  SILENT_CPU_FALLBACK_EQ_VERIFIED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  SUPPORTED_EQ_VERIFIED: false as const,
  NOT_TESTED_EQ_VERIFIED: false as const,
  VERIFIED_WITHOUT_PRECONDITIONS: false as const,
  ACCELERATOR_VERIFIED_ON_CPU_FALLBACK: false as const,

  // Forbidden actions
  AUTO_INSTALL_DRIVERS_OR_RUNTIMES: false as const,
  ALTER_BIOS_FIRMWARE: false as const,
  OVERCLOCK: false as const,
  PRIVILEGE_ESCALATION: false as const,
  AUTONOMOUS_CLOUD_PROVISIONING: false as const,

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

export const INTEL_ADAPTER_AGENT_BOUNDS = Object.freeze({
  mayResearchOpenVinoOneApiOnnxPaths: true as const,
  mayRunBoundedInference: true as const,
  mayReturnReceiptToHomeBase: true as const,
  automaticAuthority: false as const,
  mayAutoInstallDriversOrRuntimes: false as const,
  mayAlterBiosFirmware: false as const,
  mayOverclock: false as const,
  mayEscalatePrivileges: false as const,
  mayAutonomousCloudProvision: false as const,
  mayClaimVerifiedOnSilentCpuFallback: false as const,
  mayRecommendOnly: true as const,
});

export const EP9_MAY = Object.freeze([
  'research_documented_openvino_oneapi_onnx_paths',
  'track_adapter_fields_and_states',
  'classify_intel_cpu_gpu_npu_independently',
  'run_bounded_inference_tests',
  'record_receipts_including_cpu_fallback',
  'store_benchmark_evidence_references',
  'return_receipts_to_home_base',
] as const);

export const EP9_MUST_NOT = Object.freeze([
  ...INTEL_ADAPTER_MUST_NOT,
  'equate_cpu_or_igpu_presence_with_openvino_works',
  'equate_cpu_presence_with_npu_acceleration',
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

export type Ep9SoftWireSnapshot = {
  ep8NvidiaAdapter: SoftWirePresence;
  ep8Report: SoftWirePresence;
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

export function assertEp9LocksIntact(): boolean {
  return (
    EP9_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP9_LOCKS.CPU_OR_IGPU_PRESENCE_EQ_OPENVINO_WORKS === false &&
    EP9_LOCKS.CPU_PRESENCE_EQ_NPU_ACCELERATION === false &&
    EP9_LOCKS.SILENT_CPU_FALLBACK_EQ_VERIFIED === false &&
    EP9_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EP9_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    EP9_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
    EP9_LOCKS.VERIFIED_WITHOUT_PRECONDITIONS === false &&
    EP9_LOCKS.ACCELERATOR_VERIFIED_ON_CPU_FALLBACK === false &&
    EP9_LOCKS.AUTO_INSTALL_DRIVERS_OR_RUNTIMES === false &&
    EP9_LOCKS.ALTER_BIOS_FIRMWARE === false &&
    EP9_LOCKS.OVERCLOCK === false &&
    EP9_LOCKS.PRIVILEGE_ESCALATION === false &&
    EP9_LOCKS.AUTONOMOUS_CLOUD_PROVISIONING === false &&
    EP9_LOCKS.PRODUCTION_DEPLOYMENT === false &&
    EP9_LOCKS.MAIN_MERGE === false &&
    EP9_LOCKS.PERMISSION_EXPANSION === false &&
    EP9_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP9_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP9_LOCKS.RECOMMEND_EQ_DEPLOY === false &&
    EP9_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP9_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP9_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EP9_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP9_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP9_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP9_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP9_LOCKS.TIP_LAND === false &&
    EP9_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP9_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP9_LOCKS.FULL_PRODUCTION_INTEL_ADAPTER_SHIPPED === false &&
    EP9_LOCKS.MANAGE_PULL_REQUEST === false &&
    INTEL_ADAPTER_AGENT_BOUNDS.automaticAuthority === false &&
    INTEL_ADAPTER_AGENT_BOUNDS.mayAutoInstallDriversOrRuntimes === false &&
    INTEL_ADAPTER_AGENT_BOUNDS.mayAlterBiosFirmware === false &&
    INTEL_ADAPTER_AGENT_BOUNDS.mayOverclock === false &&
    INTEL_ADAPTER_AGENT_BOUNDS.mayEscalatePrivileges === false &&
    INTEL_ADAPTER_AGENT_BOUNDS.mayAutonomousCloudProvision === false &&
    INTEL_ADAPTER_AGENT_BOUNDS.mayClaimVerifiedOnSilentCpuFallback === false
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

export function ep9SoftWireSnapshot(repoRoot?: string): Ep9SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    ep8NvidiaAdapter: softWireFile(
      './nvidia-adapter-research-path-types.ts',
      'EP8 NVIDIA Adapter Research Path PRESENT (soft-wire).',
      'EP8 NVIDIA Adapter Research Path absent — soft-wire WAITING_DATA.',
    ),
    ep8Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP8_NVIDIA_ADAPTER_RESEARCH_PATH_REPORT.md',
      'EP8 report PRESENT.',
      'EP8 report absent — soft-wire WAITING_DATA.',
    ),
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

export function isHumanApprover(actor: Ep9Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isIntelAdapterAgent(actor: Ep9Actor): boolean {
  const agents: readonly Ep9ActorKind[] = [
    'intel_adapter',
    'runtime_research',
    'virtual_chip_registry',
    'benchmark_agent',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Request targeted Intel GPU/NPU but executed on CPU fallback.
 */
export function isSilentCpuFallback(input: {
  requestedDevice: IntelExecutionDevice;
  actualDevice: IntelExecutionDevice;
}): boolean {
  const intendedAccelerator =
    input.requestedDevice === 'INTEL_GPU' ||
    input.requestedDevice === 'INTEL_NPU';
  const ranOnCpu =
    input.actualDevice === 'CPU_FALLBACK' ||
    input.actualDevice === 'INTEL_CPU';
  return intendedAccelerator && ranOnCpu;
}
