/**
 * 62L-EP1 — Virtual Chip Contract (park-and-implement).
 *
 * Defines the universal object that represents compute capability across
 * AMD, NVIDIA, Intel, Apple, Qualcomm, edge devices, cloud accelerators,
 * and future verified QPU paths.
 *
 * Core honesty: XIV’s “virtual chip” is a **software intelligence layer
 * above** physical chips — NOT a claim that XIV physically modifies AMD,
 * NVIDIA, Intel, or other silicon. It may improve routing, batching,
 * caching, quantization, scheduling, model selection, benchmarking, and
 * simulation across **verified** hardware.
 *
 * SoT: GitHub #160 / 62L-EP family (authoritative per founder). GitLab
 * mirror: not resolved in this environment (GitLab MCP needsAuth; no issue
 * number invented). Note: `gh issue view 160` was unresolved in this agent
 * environment; label/issue number retained from founder SoT statement.
 *
 * Soft-wire when PRESENT: EO11, EO10, EM (#157) Home Base, EM local-runtime.
 * Presence ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * DETECTED ≠ VERIFIED. L4_AUTONOMY_ENABLED=false.
 * Quantum: THEORETICAL | SIMULATED | QUANTUM_INSPIRED | PHYSICAL_QPU_VERIFIED.
 * No silicon-modification claims. No autonomous device control.
 * No raw GPS/camera/telemetry/trip collection without explicit opt-in
 * (privacy boundary encoded for EP family; EP1 does not collect).
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): EP2 — Cross-Vendor Capability Graph.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP1' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP1 Virtual Chip Contract — universal software-defined virtual chip contract so agents interact with heterogeneous CPU/GPU/NPU/edge/cloud/future QPU resources through one governed interface (software layer above silicon; no silicon-modification claim)' as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP1_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP2 — Cross-Vendor Capability Graph — map public, documented AMD/NVIDIA/Intel/Apple/Qualcomm chip families, runtimes, strengths, limitations, and benchmark evidence into one searchable compute brain.' as const;

/**
 * Vendor / platform families the virtual chip may represent (capability
 * mapping only — not ownership or silicon modification).
 */
export const VIRTUAL_CHIP_VENDOR_FAMILIES = [
  'amd',
  'nvidia',
  'intel',
  'apple',
  'qualcomm',
  'edge_generic',
  'cloud_accelerator',
  'qpu_path_candidate',
] as const;

export type VirtualChipVendorFamily =
  (typeof VIRTUAL_CHIP_VENDOR_FAMILIES)[number];

export const VIRTUAL_CHIP_VENDOR_LABELS: Readonly<
  Record<VirtualChipVendorFamily, string>
> = Object.freeze({
  amd: 'AMD',
  nvidia: 'NVIDIA',
  intel: 'Intel',
  apple: 'Apple',
  qualcomm: 'Qualcomm',
  edge_generic: 'Edge (generic)',
  cloud_accelerator: 'Cloud Accelerator',
  qpu_path_candidate: 'QPU Path (candidate)',
});

/**
 * Device / accelerator classes (deviceType).
 */
export const VIRTUAL_CHIP_DEVICE_TYPES = [
  'cpu',
  'gpu',
  'npu',
  'accelerator',
  'hybrid',
  'qpu_path',
] as const;

export type VirtualChipDeviceType = (typeof VIRTUAL_CHIP_DEVICE_TYPES)[number];

/** @deprecated Prefer VIRTUAL_CHIP_DEVICE_TYPES / deviceType. */
export const VIRTUAL_CHIP_DEVICE_CLASSES = VIRTUAL_CHIP_DEVICE_TYPES;
export type VirtualChipDeviceClass = VirtualChipDeviceType;

/**
 * Required truth / verification states — DETECTED ≠ VERIFIED;
 * NOT_TESTED remains distinct from VERIFIED/PASS.
 */
export const VIRTUAL_CHIP_VERIFICATION_STATES = [
  'UNKNOWN',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'DEGRADED',
  'UNAVAILABLE',
  'NOT_TESTED',
] as const;

export type VirtualChipVerificationState =
  (typeof VIRTUAL_CHIP_VERIFICATION_STATES)[number];

/** Alias used by prior EP1 surfaces. */
export const VIRTUAL_CHIP_CAPABILITY_STATES = VIRTUAL_CHIP_VERIFICATION_STATES;
export type VirtualChipCapabilityState = VirtualChipVerificationState;

/**
 * Software-layer improvement surfaces (above silicon) — what the virtual
 * chip MAY standardize/optimize. Cannot alter transistor performance,
 * firmware, ISA internals, or vendor silicon without documented supported
 * interface + measured evidence.
 */
export const VIRTUAL_CHIP_SOFTWARE_CAPABILITIES = [
  'workload_placement',
  'model_selection',
  'batching',
  'caching',
  'quantization_policy',
  'queue_scheduling',
  'local_vs_edge_vs_cloud_routing',
  'accelerator_fallback',
  'benchmark_comparison',
  'simulation',
] as const;

export type VirtualChipSoftwareCapability =
  (typeof VIRTUAL_CHIP_SOFTWARE_CAPABILITIES)[number];

/**
 * Virtual Chip Contract object fields (universal governed interface).
 */
export const VIRTUAL_CHIP_CONTRACT_FIELDS = [
  'virtualChipId',
  'physicalNodeId',
  'vendor',
  'deviceFamily',
  'deviceType',
  'architecture',
  'runtime',
  'executionProvider',
  'supportedModels',
  'supportedPrecisions',
  'memoryCapacity',
  'measuredLatency',
  'measuredThroughput',
  'energyProxy',
  'costProxy',
  'privacyClass',
  'tenantUniverseScope',
  'resourceLimits',
  'heartbeat',
  'verificationState',
  'benchmarkRefs',
  'lastVerifiedAt',
  'rollbackVersion',
] as const;

export type VirtualChipContractField =
  (typeof VIRTUAL_CHIP_CONTRACT_FIELDS)[number];

/**
 * Core flow:
 * Agent task → Virtual Chip Contract → policy/resource checks →
 * physical runtime → execution → return receipt → XIV Home Base
 */
export const VIRTUAL_CHIP_CORE_FLOW = [
  'agent_task',
  'virtual_chip_contract',
  'policy_resource_checks',
  'physical_runtime',
  'execution',
  'return_receipt',
  'xiv_home_base',
] as const;

export type VirtualChipCoreFlowHop = (typeof VIRTUAL_CHIP_CORE_FLOW)[number];

/**
 * Neural compute pathway (EP family graph linkage):
 * workload → model → runtime → device → benchmark → outcome → lesson →
 * updated routing policy
 */
export const NEURAL_COMPUTE_PATHWAY = [
  'workload',
  'model',
  'runtime',
  'device',
  'benchmark',
  'outcome',
  'lesson',
  'updated_routing_policy',
] as const;

export type NeuralComputePathwayHop = (typeof NEURAL_COMPUTE_PATHWAY)[number];

/** Quantum claim ladder — QPU fits same abstraction with extra labels. */
export const QUANTUM_CLAIM_STATES = [
  'THEORETICAL',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QuantumClaimState = (typeof QUANTUM_CLAIM_STATES)[number];

/**
 * Cross-vendor example surfaces (same contract; states remain distinct).
 * Example A: AMD Radeon GPU DETECTED + Windows ML SUPPORTED + Model X NOT_TESTED
 * Example B: NVIDIA GPU VERIFIED + TensorRT VERIFIED + Model X benchmark PASS
 */
export const CROSS_VENDOR_EXAMPLE_SURFACES = [
  'amd_radeon_gpu_detected',
  'windows_ml_path_supported',
  'model_x_inference_not_tested',
  'nvidia_gpu_verified',
  'tensorrt_runtime_verified',
  'model_x_benchmark_pass',
] as const;

export const VIRTUAL_CHIP_CONTRACT_CYCLE = [
  'honesty_locks',
  'virtual_chip_contract_bootstrap',
  // A — Contract object
  'vendor_families_encoded',
  'device_types_encoded',
  'verification_states_encoded',
  'software_capabilities_encoded',
  'contract_fields_encoded',
  'core_flow_encoded',
  'neural_compute_pathway_encoded',
  'cross_vendor_examples_encoded',
  // B — Truth boundaries
  'virtual_chip_neq_silicon_modification',
  'no_transistor_firmware_isa_claim_without_evidence',
  'detected_neq_verified',
  'verified_requires_runtime_evidence',
  'quantum_claim_ladder_enforced',
  // C — Governance
  'no_driver_bios_firmware_changes',
  'no_overclocking_or_thermal_bypass',
  'no_permission_inheritance',
  'no_automatic_cloud_purchasing',
  'no_cross_tenant_data_movement',
  'no_proprietary_chip_secret_ingestion',
  'no_raw_privacy_collection_without_opt_in',
  'no_autonomous_device_control',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'eo11_soft_wire',
  'eo10_soft_wire',
  'em157_soft_wire',
  'em_local_runtime_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep1Hop = (typeof VIRTUAL_CHIP_CONTRACT_CYCLE)[number];

export type Ep1EvidenceState =
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
  | 'UNKNOWN'
  | 'THEORETICAL'
  | 'SIMULATED'
  | 'QUANTUM_INSPIRED'
  | 'PHYSICAL_QPU_VERIFIED';

export type Ep1HopRecord = {
  hop: Ep1Hop;
  state: Ep1EvidenceState;
  summary: string;
  at: string;
};

export type Ep1ActorKind =
  | 'virtual_chip_architect'
  | 'runtime_research'
  | 'benchmark_agent'
  | 'routing_agent'
  | 'privacy_guardian'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep1Actor = {
  kind: Ep1ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP1_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_VIRTUAL_CHIP_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Core truth boundary
  VIRTUAL_CHIP_EQ_SILICON_MODIFICATION: false as const,
  CLAIM_MODIFY_AMD_SILICON: false as const,
  CLAIM_MODIFY_NVIDIA_SILICON: false as const,
  CLAIM_MODIFY_INTEL_SILICON: false as const,
  CLAIM_MODIFY_APPLE_SILICON: false as const,
  CLAIM_MODIFY_QUALCOMM_SILICON: false as const,
  CLAIM_ALTER_TRANSISTOR_PERFORMANCE: false as const,
  CLAIM_ALTER_FIRMWARE_WITHOUT_DOCUMENTED_INTERFACE: false as const,
  CLAIM_ALTER_ISA_INTERNALS_WITHOUT_EVIDENCE: false as const,

  // Capability honesty
  DETECTED_EQ_VERIFIED: false as const,
  NOT_TESTED_EQ_VERIFIED: false as const,
  VERIFIED_WITHOUT_RUNTIME_EVIDENCE: false as const,
  CANDIDATE_EQ_PRODUCTION_AUTHORIZED: false as const,

  // Quantum
  AUTO_UPGRADE_QUANTUM_CLAIM_TO_PHYSICAL_QPU_VERIFIED: false as const,
  QUANTUM_INSPIRED_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  SIMULATED_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  THEORETICAL_EQ_OPERATIONAL: false as const,
  CLAIM_QUANTUM_HARDWARE_WITHOUT_AUTHORIZED_PHYSICAL_QPU: false as const,

  // Privacy / mobility (EP family boundary; EP1 does not collect)
  RAW_GPS_COLLECTION_WITHOUT_OPT_IN: false as const,
  RAW_CAMERA_COLLECTION_WITHOUT_OPT_IN: false as const,
  RAW_TELEMETRY_COLLECTION_WITHOUT_OPT_IN: false as const,
  RAW_TRIP_COLLECTION_WITHOUT_OPT_IN: false as const,
  POOL_RAW_DRIVING_DATA: false as const,

  // Governance (EP1)
  DRIVER_BIOS_FIRMWARE_CHANGES: false as const,
  OVERCLOCKING_OR_THERMAL_BYPASS: false as const,
  PERMISSION_INHERITANCE: false as const,
  AUTOMATIC_CLOUD_PURCHASING: false as const,
  CROSS_TENANT_DATA_MOVEMENT: false as const,
  PROPRIETARY_CHIP_SECRET_INGESTION: false as const,

  // Autonomy / control
  AUTO_DEVICE_CONTROL: false as const,
  AUTO_STEERING_BRAKING_THROTTLE: false as const,
  AUTO_ECU_MODIFICATION: false as const,
  AGENT_AUTO_AUTHORITY: false as const,

  // Recommend ≠ act
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_CONTROL: false as const,
  RECOMMEND_EQ_MODIFY_SILICON: false as const,
  RECOMMEND_EQ_PURCHASE: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const VIRTUAL_CHIP_AGENT_BOUNDS = Object.freeze({
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayClaimSiliconModification: false as const,
  mayCollectRawPrivacySignalsWithoutOptIn: false as const,
  mayAutonomouslyControlDevice: false as const,
  mayInheritPermissions: false as const,
  mayAutoPurchaseCloud: false as const,
  mayRecommendOnly: true as const,
});

export const EP1_MAY = Object.freeze([
  'register_virtual_chip_contracts',
  'label_verification_states',
  'attach_software_layer_capabilities',
  'run_policy_resource_checks',
  'return_execution_receipts_to_home_base',
  'record_benchmark_evidence_refs',
  'label_quantum_claim_states',
  'encode_neural_compute_pathway_linkage',
  'return_agent_evidence_to_home_base',
] as const);

export const EP1_MUST_NOT = Object.freeze([
  'claim_silicon_modification',
  'claim_alter_transistor_firmware_isa_without_evidence',
  'equate_detected_with_verified',
  'equate_not_tested_with_verified',
  'claim_verified_without_runtime_evidence',
  'claim_quantum_hardware_without_authorized_physical_qpu',
  'driver_bios_firmware_changes',
  'overclocking_or_thermal_bypass',
  'permission_inheritance',
  'automatic_cloud_purchasing',
  'cross_tenant_data_movement',
  'proprietary_chip_secret_ingestion',
  'collect_raw_gps_camera_telemetry_trip_without_opt_in',
  'pool_raw_driving_data',
  'autonomous_device_control',
  'autonomous_steering_braking_throttle',
  'ecu_modification',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ep1SoftWireSnapshot = {
  eo11VirtualDataWarehouse: SoftWirePresence;
  eo11Report: SoftWirePresence;
  eo10PhysicalProduct: SoftWirePresence;
  eo10Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
  em157Report: SoftWirePresence;
  emLocalRuntimeOnnx: SoftWirePresence;
  em1HomeBaseContract: SoftWirePresence;
};

export function assertEp1LocksIntact(): boolean {
  return (
    EP1_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP1_LOCKS.VIRTUAL_CHIP_EQ_SILICON_MODIFICATION === false &&
    EP1_LOCKS.CLAIM_MODIFY_AMD_SILICON === false &&
    EP1_LOCKS.CLAIM_MODIFY_NVIDIA_SILICON === false &&
    EP1_LOCKS.CLAIM_MODIFY_INTEL_SILICON === false &&
    EP1_LOCKS.CLAIM_MODIFY_APPLE_SILICON === false &&
    EP1_LOCKS.CLAIM_MODIFY_QUALCOMM_SILICON === false &&
    EP1_LOCKS.CLAIM_ALTER_TRANSISTOR_PERFORMANCE === false &&
    EP1_LOCKS.CLAIM_ALTER_FIRMWARE_WITHOUT_DOCUMENTED_INTERFACE === false &&
    EP1_LOCKS.CLAIM_ALTER_ISA_INTERNALS_WITHOUT_EVIDENCE === false &&
    EP1_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EP1_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
    EP1_LOCKS.VERIFIED_WITHOUT_RUNTIME_EVIDENCE === false &&
    EP1_LOCKS.CANDIDATE_EQ_PRODUCTION_AUTHORIZED === false &&
    EP1_LOCKS.AUTO_UPGRADE_QUANTUM_CLAIM_TO_PHYSICAL_QPU_VERIFIED === false &&
    EP1_LOCKS.QUANTUM_INSPIRED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EP1_LOCKS.SIMULATED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EP1_LOCKS.THEORETICAL_EQ_OPERATIONAL === false &&
    EP1_LOCKS.CLAIM_QUANTUM_HARDWARE_WITHOUT_AUTHORIZED_PHYSICAL_QPU ===
      false &&
    EP1_LOCKS.RAW_GPS_COLLECTION_WITHOUT_OPT_IN === false &&
    EP1_LOCKS.RAW_CAMERA_COLLECTION_WITHOUT_OPT_IN === false &&
    EP1_LOCKS.RAW_TELEMETRY_COLLECTION_WITHOUT_OPT_IN === false &&
    EP1_LOCKS.RAW_TRIP_COLLECTION_WITHOUT_OPT_IN === false &&
    EP1_LOCKS.POOL_RAW_DRIVING_DATA === false &&
    EP1_LOCKS.DRIVER_BIOS_FIRMWARE_CHANGES === false &&
    EP1_LOCKS.OVERCLOCKING_OR_THERMAL_BYPASS === false &&
    EP1_LOCKS.PERMISSION_INHERITANCE === false &&
    EP1_LOCKS.AUTOMATIC_CLOUD_PURCHASING === false &&
    EP1_LOCKS.CROSS_TENANT_DATA_MOVEMENT === false &&
    EP1_LOCKS.PROPRIETARY_CHIP_SECRET_INGESTION === false &&
    EP1_LOCKS.AUTO_DEVICE_CONTROL === false &&
    EP1_LOCKS.AUTO_STEERING_BRAKING_THROTTLE === false &&
    EP1_LOCKS.AUTO_ECU_MODIFICATION === false &&
    EP1_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP1_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP1_LOCKS.RECOMMEND_EQ_CONTROL === false &&
    EP1_LOCKS.RECOMMEND_EQ_MODIFY_SILICON === false &&
    EP1_LOCKS.RECOMMEND_EQ_PURCHASE === false &&
    EP1_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP1_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP1_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP1_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP1_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP1_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP1_LOCKS.TIP_LAND === false &&
    EP1_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP1_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP1_LOCKS.FULL_PRODUCTION_VIRTUAL_CHIP_SHIPPED === false &&
    EP1_LOCKS.MANAGE_PULL_REQUEST === false &&
    VIRTUAL_CHIP_AGENT_BOUNDS.automaticAuthority === false &&
    VIRTUAL_CHIP_AGENT_BOUNDS.mayClaimSiliconModification === false &&
    VIRTUAL_CHIP_AGENT_BOUNDS.mayCollectRawPrivacySignalsWithoutOptIn ===
      false &&
    VIRTUAL_CHIP_AGENT_BOUNDS.mayAutonomouslyControlDevice === false &&
    VIRTUAL_CHIP_AGENT_BOUNDS.mayInheritPermissions === false &&
    VIRTUAL_CHIP_AGENT_BOUNDS.mayAutoPurchaseCloud === false
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
 * Soft-wire EO11 / EO10 / EM157 / EM local-runtime when present.
 * Presence alone ≠ VERIFIED.
 */
export function ep1SoftWireSnapshot(repoRoot?: string): Ep1SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eo11VirtualDataWarehouse: softWireFile(
      './virtual-data-warehouse-mission-pack-types.ts',
      'EO11 Virtual Data Warehouse Mission Pack PRESENT (soft-wire).',
      'EO11 Virtual Data Warehouse Mission Pack absent — soft-wire WAITING_DATA.',
    ),
    eo11Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO11_VIRTUAL_DATA_WAREHOUSE_MISSION_PACK_REPORT.md',
      'EO11 report PRESENT.',
      'EO11 report absent — soft-wire WAITING_DATA.',
    ),
    eo10PhysicalProduct: softWireFile(
      './physical-product-contract-pack-types.ts',
      'EO10 Physical Product Contract Pack PRESENT (soft-wire).',
      'EO10 Physical Product Contract Pack absent — soft-wire WAITING_DATA.',
    ),
    eo10Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO10_PHYSICAL_PRODUCT_CONTRACT_PACK_REPORT.md',
      'EO10 report PRESENT.',
      'EO10 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
    em157Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EM_AGENT_COMPUTE_HOME_BASE_REPORT.md',
      'EM (#157) report PRESENT.',
      'EM (#157) report absent — soft-wire WAITING_DATA.',
    ),
    emLocalRuntimeOnnx: softWireFile(
      '../local-runtime/onnx-windows-ml-adapter.ts',
      'EM local-runtime ONNX/Windows ML adapter PRESENT (candidate path; DETECTED≠VERIFIED).',
      'EM local-runtime ONNX/Windows ML adapter absent — soft-wire WAITING_DATA.',
    ),
    em1HomeBaseContract: softWireFile(
      './agent-home-base-contract.ts',
      'EM1 agent home base contract PRESENT (agents return evidence).',
      'EM1 agent home base contract absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Ep1Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isVirtualChipAgent(actor: Ep1Actor): boolean {
  const agents: readonly Ep1ActorKind[] = [
    'virtual_chip_architect',
    'runtime_research',
    'benchmark_agent',
    'routing_agent',
    'privacy_guardian',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * DETECTED ≠ VERIFIED. NOT_TESTED ≠ VERIFIED.
 * Only VERIFIED requires runtime evidence.
 */
export function defaultCapabilityState(opts?: {
  detected?: boolean;
  supportedDocumented?: boolean;
  runtimeEvidencePresent?: boolean;
  degraded?: boolean;
  explicitlyUnavailable?: boolean;
  notTested?: boolean;
  /** @deprecated use supportedDocumented */
  architectureListed?: boolean;
  /** @deprecated use explicitlyUnavailable */
  explicitlyUnsupported?: boolean;
}): VirtualChipVerificationState {
  if (opts?.explicitlyUnavailable || opts?.explicitlyUnsupported) {
    return 'UNAVAILABLE';
  }
  if (opts?.degraded) return 'DEGRADED';
  if (opts?.runtimeEvidencePresent) return 'VERIFIED';
  if (opts?.notTested) return 'NOT_TESTED';
  if (opts?.supportedDocumented || opts?.architectureListed) return 'SUPPORTED';
  if (opts?.detected) return 'DETECTED';
  return 'UNKNOWN';
}

export const defaultVerificationState = defaultCapabilityState;
