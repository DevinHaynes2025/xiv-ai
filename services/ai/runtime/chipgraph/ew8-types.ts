/**
 * 62L-EW8 — NVIDIA Adapter Candidate types / locks / soft-wires
 * Parent: Global Operations Brain / GitHub #169 / 62L-EW Offline Research Mesh
 *
 * Connects Agent Mesh + Cross-Chip Capability Graph + Workload Genome +
 * Resource Governor + Benchmark Ledger + Home Base to NVIDIA-compatible paths.
 * Does NOT create a parallel NVIDIA orchestration system or separate NVIDIA brain.
 *
 * Soft-wire (existsSync): EW7 AMD adapter / shared envelope / resource-policy,
 * EW6 chipgraph, Agent Mesh, local-runtime resource-governor — presence ≠ VERIFIED;
 * absent → WAITING_DATA.
 * L4_AUTONOMY_ENABLED=false. tip-land=NO. No PR unless founder asks.
 * Next (docs-only): EW9 — Intel CPU/GPU/NPU Adapter Candidate.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ DETECTED ≠ SUPPORTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 169 as const;
export const GITHUB_SOT_LABEL = '62L-EW8' as const;
export const GITHUB_SOT_FAMILY = '62L-EW' as const;
export const GITHUB_SOT_TITLE =
  'EW8 — NVIDIA Adapter Candidate — Agent Mesh → Compute Task Envelope → Chip Capability Graph → NVIDIA Adapter → Resource Governor → Verified Runtime → NVIDIA GPU → Execution Receipt → Benchmark Ledger → Neural Pathway → XIV Home Base; L4=false' as const;

export const NEXT_STORY_TITLE =
  'EW9 — Intel CPU/GPU/NPU Adapter Candidate' as const;

export const FOLLOWING_STORY_TITLE =
  'EW10 — ARM/Apple/Qualcomm Mobile & Edge Registry' as const;

/** Canonical pathway (encoded — not a second orchestrator). */
export const CANONICAL_FLOW = [
  'AgentMission',
  'AgentMesh',
  'ComputeTaskEnvelope',
  'ChipCapabilityGraph',
  'NvidiaAdapter',
  'ResourceGovernor',
  'VerifiedRuntime',
  'NvidiaGpu',
  'ExecutionReceipt',
  'BenchmarkLedger',
  'NeuralPathway',
  'XivHomeBase',
] as const;

export type CanonicalFlowHop = (typeof CANONICAL_FLOW)[number];

/**
 * Independent NVIDIA truth layers — never infer across layers.
 * GPU detected ≠ CUDA verified; CUDA installed ≠ TensorRT verified;
 * TensorRT available ≠ Model X verified.
 */
export const NVIDIA_TRUTH_LAYERS = [
  'NVIDIA_GPU',
  'NVIDIA_DRIVER',
  'CUDA_RUNTIME',
  'TENSORRT',
  'TENSORRT_LLM',
  'ONNX_NVIDIA_PROVIDER',
  'MODEL_COMPATIBILITY',
] as const;

export type NvidiaTruthLayer = (typeof NVIDIA_TRUTH_LAYERS)[number];

export const TRUTH_STATES = [
  'UNKNOWN',
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'STALE',
  'UNAVAILABLE',
  'REVOKED',
  'NOT_CONFIGURED',
] as const;

export type TruthState = (typeof TRUTH_STATES)[number];

/**
 * Preferred compute target — agents request capabilities, not hard-coded NVIDIA,
 * unless the mission explicitly requires an NVIDIA path.
 */
export const PREFERRED_COMPUTE_TARGETS = [
  'CAPABILITY_GPU',
  'CAPABILITY_CPU',
  'NVIDIA_GPU',
  'CUDA',
  'TENSORRT',
  'TENSORRT_LLM',
  'ONNX_NVIDIA',
  'CPU',
  'CPU_ONNX',
] as const;

export type PreferredComputeTarget = (typeof PREFERRED_COMPUTE_TARGETS)[number];

export const ACTUAL_EXECUTION_DEVICES = [
  'NVIDIA_GPU',
  'CUDA',
  'TENSORRT',
  'TENSORRT_LLM',
  'ONNX_NVIDIA',
  'CPU',
  'CPU_ONNX',
  'UNKNOWN',
] as const;

export type ActualExecutionDevice = (typeof ACTUAL_EXECUTION_DEVICES)[number];

export const GOVERNOR_RESULTS = [
  'ALLOW',
  'QUEUE',
  'THROTTLE',
  'FALLBACK',
  'DENY',
] as const;

export type GovernorResult = (typeof GOVERNOR_RESULTS)[number];

export const RESULT_STATES = [
  'PASS',
  'FAIL',
  'PARTIAL',
  'DEGRADED',
  'TIMEOUT',
  'RESOURCE_LIMIT',
  'PROVIDER_UNAVAILABLE',
  'POLICY_DENIED',
  'WAITING_DATA',
  'OFFLINE_STOPPED',
  'UNVERIFIED',
] as const;

export type ResultState = (typeof RESULT_STATES)[number];

export const FAILURE_CLASSES = [
  null,
  'NONE',
  'EXPIRED',
  'OVER_BUDGET',
  'TENANT_MISMATCH',
  'UNIVERSE_MISMATCH',
  'STALE_EVIDENCE',
  'DEVICE_NOT_ELIGIBLE',
  'MINIMUM_STATE_UNMET',
  'CLOUD_REQUIRED_OFFLINE',
  'UNAUTHORIZED_CLOUD_NVIDIA',
  'CLOUD_PURCHASE_FORBIDDEN',
  'MISSING_RECEIPT',
  'SILENT_FALLBACK_FORBIDDEN',
  'INSUFFICIENT_VRAM',
  'CUDA_NOT_CONFIGURED',
  'TENSORRT_NOT_CONFIGURED',
  'MULTI_GPU_NOT_TESTED',
  'THERMAL_PROTECTION',
  'EXECUTION_ERROR',
  'POLICY_DENIED',
  'NOT_COMPARABLE',
] as const;

export type FailureClass = (typeof FAILURE_CLASSES)[number];

export const FALLBACK_POLICIES = [
  'NONE',
  'CPU_SAFE',
  'QUEUE_THEN_CPU',
  'DENY_IF_UNAVAILABLE',
] as const;

export type FallbackPolicy = (typeof FALLBACK_POLICIES)[number];

export const PRIVACY_MODES = [
  'TENANT_PRIVATE',
  'SEALED_LOCAL',
  'XIV_OWNED',
  'PUBLIC_REFERENCE',
] as const;

export type PrivacyMode = (typeof PRIVACY_MODES)[number];

export const PLACEMENT_CLASSES = [
  'LOCAL',
  'EDGE',
  'AUTHORIZED_CLOUD_NVIDIA',
] as const;

export type PlacementClass = (typeof PLACEMENT_CLASSES)[number];

export const MULTI_GPU_STATES = [
  'MULTI_GPU_NOT_TESTED',
  'SINGLE_GPU_VERIFIED',
  'MULTI_GPU_VERIFIED',
] as const;

export type MultiGpuState = (typeof MULTI_GPU_STATES)[number];

/** XIV software acceleration only — never silicon/SM/firmware/clock claims. */
export const SOFTWARE_ACCELERATION_LEVERS = [
  'placement',
  'model_precision_quantization',
  'dynamic_batching',
  'session_cache_reuse',
  'queue',
  'multi_model_placement',
  'cpu_gpu_partition',
  'fallback',
  'benchmark_aware_routing',
] as const;

export type SoftwareAccelerationLever =
  (typeof SOFTWARE_ACCELERATION_LEVERS)[number];

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ew8SoftWireSnapshot = {
  ew7AmdAdapter: SoftWirePresence;
  ew7ComputeEnvelope: SoftWirePresence;
  ew7ResourcePolicy: SoftWirePresence;
  ew6Chipgraph: SoftWirePresence;
  agentMesh: SoftWirePresence;
  localRuntimeGovernor: SoftWirePresence;
  workloadGenome: SoftWirePresence;
  benchmarkLedger: SoftWirePresence;
  homeBase: SoftWirePresence;
};

export const EW8_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  DB_CANDIDATES_APPLIED: false as const,

  DOCUMENTED_EQ_VERIFIED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  SUPPORTED_EQ_VERIFIED: false as const,
  NOT_TESTED_EQ_VERIFIED: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  GPU_DETECTED_EQ_CUDA_VERIFIED: false as const,
  CUDA_INSTALLED_EQ_TENSORRT_VERIFIED: false as const,
  TENSORRT_AVAILABLE_EQ_MODEL_VERIFIED: false as const,
  FALLBACK_EQ_NVIDIA_VERIFIED: false as const,
  SILENT_CPU_FALLBACK_EQ_VERIFIED: false as const,
  STALE_EVIDENCE_KEEPS_VERIFIED: false as const,
  FABRICATE_NVIDIA_GPU_VERIFIED: false as const,
  FABRICATE_CUDA_VERIFIED: false as const,
  FABRICATE_TENSORRT_VERIFIED: false as const,

  MAY_AUTO_INSTALL_DRIVERS_CUDA_TENSORRT: false as const,
  MAY_CHANGE_PATH_OR_SYSTEM_CONFIG: false as const,
  MAY_REQUEST_ADMIN: false as const,
  MAY_PHYSICALLY_MODIFY_SILICON: false as const,
  MAY_MODIFY_FIRMWARE_DRIVER: false as const,
  MAY_OVERCLOCK: false as const,
  MAY_CLAIM_SM_MICROARCH: false as const,
  MAY_BUY_CLOUD: false as const,
  MAY_AUTONOMOUS_CLOUD_RENTAL: false as const,
  MAY_INGEST_PROPRIETARY_NVIDIA_IP: false as const,

  SEPARATE_NVIDIA_BRAIN: false as const,
  PARALLEL_NVIDIA_ORCHESTRATION: false as const,
  CHILD_EXTRA_HARDWARE_AUTHORITY: false as const,
  CHILD_EXTRA_DATA_AUTHORITY: false as const,
  NEURAL_PATHWAY_MAY_INCREASE_PERMISSIONS: false as const,

  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  CROSS_TENANT_ADAPTER_ACCESS: false as const,
  CROSS_UNIVERSE_ADAPTER_ACCESS: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const EW8_MAY = Object.freeze([
  'connect_agent_mesh_to_nvidia_compatible_paths',
  'route_via_chip_capability_graph',
  'reuse_ew7_envelope_receipt_governor_fields',
  'apply_xiv_software_acceleration_levers',
  'fallback_cpu_with_honest_receipt',
  'soft_wire_ew7_resource_policy',
  'update_neural_pathway_preference_confidence_only',
  'compare_equivalent_workloads_cross_vendor',
  'emit_execution_receipts_to_home_base',
] as const);

export const EW8_MUST_NOT = Object.freeze([
  'create_parallel_nvidia_orchestration_or_brain',
  'duplicate_ew7_resource_governor',
  'treat_documented_or_detected_as_verified',
  'claim_nvidia_verified_via_silent_cpu_fallback',
  'fabricate_nvidia_cuda_tensorrt_verified',
  'auto_install_drivers_cuda_tensorrt',
  'claim_multi_gpu_or_distributed_without_evidence',
  'autonomous_cloud_purchase_or_rental',
  'ingest_proprietary_nvidia_ip',
  'increase_permissions_via_neural_pathway',
  'bypass_guardian_rls_tenant_universe',
  'enable_l4_autonomy',
  'tip_land_or_open_pr',
] as const);

export type TenantScope = {
  orgId: string;
  tenantId: string;
  universeId: string;
};

export function scopesMatch(a: TenantScope, b: TenantScope): boolean {
  return (
    a.orgId === b.orgId &&
    a.tenantId === b.tenantId &&
    a.universeId === b.universeId
  );
}

export function assertEw8LocksIntact(): boolean {
  return (
    EW8_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EW8_LOCKS.DOCUMENTED_EQ_VERIFIED === false &&
    EW8_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EW8_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    EW8_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
    EW8_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EW8_LOCKS.GPU_DETECTED_EQ_CUDA_VERIFIED === false &&
    EW8_LOCKS.CUDA_INSTALLED_EQ_TENSORRT_VERIFIED === false &&
    EW8_LOCKS.TENSORRT_AVAILABLE_EQ_MODEL_VERIFIED === false &&
    EW8_LOCKS.FALLBACK_EQ_NVIDIA_VERIFIED === false &&
    EW8_LOCKS.SILENT_CPU_FALLBACK_EQ_VERIFIED === false &&
    EW8_LOCKS.STALE_EVIDENCE_KEEPS_VERIFIED === false &&
    EW8_LOCKS.FABRICATE_NVIDIA_GPU_VERIFIED === false &&
    EW8_LOCKS.FABRICATE_CUDA_VERIFIED === false &&
    EW8_LOCKS.FABRICATE_TENSORRT_VERIFIED === false &&
    EW8_LOCKS.MAY_AUTO_INSTALL_DRIVERS_CUDA_TENSORRT === false &&
    EW8_LOCKS.MAY_CHANGE_PATH_OR_SYSTEM_CONFIG === false &&
    EW8_LOCKS.MAY_REQUEST_ADMIN === false &&
    EW8_LOCKS.MAY_PHYSICALLY_MODIFY_SILICON === false &&
    EW8_LOCKS.MAY_MODIFY_FIRMWARE_DRIVER === false &&
    EW8_LOCKS.MAY_OVERCLOCK === false &&
    EW8_LOCKS.MAY_CLAIM_SM_MICROARCH === false &&
    EW8_LOCKS.MAY_BUY_CLOUD === false &&
    EW8_LOCKS.MAY_AUTONOMOUS_CLOUD_RENTAL === false &&
    EW8_LOCKS.MAY_INGEST_PROPRIETARY_NVIDIA_IP === false &&
    EW8_LOCKS.SEPARATE_NVIDIA_BRAIN === false &&
    EW8_LOCKS.PARALLEL_NVIDIA_ORCHESTRATION === false &&
    EW8_LOCKS.CHILD_EXTRA_HARDWARE_AUTHORITY === false &&
    EW8_LOCKS.CHILD_EXTRA_DATA_AUTHORITY === false &&
    EW8_LOCKS.NEURAL_PATHWAY_MAY_INCREASE_PERMISSIONS === false &&
    EW8_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EW8_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EW8_LOCKS.CROSS_TENANT_ADAPTER_ACCESS === false &&
    EW8_LOCKS.CROSS_UNIVERSE_ADAPTER_ACCESS === false &&
    EW8_LOCKS.TIP_LAND === false &&
    EW8_LOCKS.MERGE_MAIN === false &&
    EW8_LOCKS.MANAGE_PULL_REQUEST === false &&
    EW8_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EW8_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EW8_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true
  );
}

export function satisfiesMinimumState(
  actual: TruthState,
  minimum: TruthState,
): boolean {
  if (minimum === 'VERIFIED') return actual === 'VERIFIED';
  if (minimum === 'SUPPORTED') {
    return actual === 'SUPPORTED' || actual === 'VERIFIED';
  }
  if (minimum === 'DETECTED') {
    return (
      actual === 'DETECTED' ||
      actual === 'SUPPORTED' ||
      actual === 'VERIFIED'
    );
  }
  if (minimum === 'DOCUMENTED') {
    return (
      actual === 'DOCUMENTED' ||
      actual === 'DETECTED' ||
      actual === 'SUPPORTED' ||
      actual === 'VERIFIED'
    );
  }
  return actual === minimum;
}

function softWireAbsolute(
  pathChecked: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? notePresent : noteAbsent,
  };
}

function firstPresent(
  candidates: readonly string[],
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  for (const pathChecked of candidates) {
    if (existsSync(pathChecked)) {
      return { present: true, pathChecked, note: notePresent };
    }
  }
  return {
    present: false,
    pathChecked: candidates[0]!,
    note: noteAbsent,
  };
}

/**
 * Soft-wire presence probe. Presence ≠ VERIFIED.
 * Absent → WAITING_DATA (not FAIL).
 */
export function ew8SoftWireSnapshot(repoRoot?: string): Ew8SoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../../..');
  const runtimeDir = join(here, '..');
  const parentOfRoot = join(root, '..');
  const siblingEw7 = join(parentOfRoot, '.wt-ew7/services/ai/runtime/chipgraph');
  const siblingEw6 = join(parentOfRoot, '.wt-ew6/services/ai/runtime/chipgraph');

  return {
    ew7AmdAdapter: firstPresent(
      [
        join(here, 'ew7-types.ts'),
        join(here, 'amd-adapter.ts'),
        join(siblingEw7, 'ew7-types.ts'),
        join(siblingEw7, 'amd-adapter.ts'),
      ],
      'EW7 AMD Local Communication Adapter PRESENT (soft-wire). Presence≠VERIFIED.',
      'EW7 AMD adapter absent — soft-wire WAITING_DATA (not FAIL).',
    ),
    ew7ComputeEnvelope: firstPresent(
      [
        join(here, 'compute-envelope.ts'),
        join(siblingEw7, 'compute-envelope.ts'),
      ],
      'EW7 compute envelope PRESENT (soft-wire/reuse fields). Presence≠VERIFIED.',
      'EW7 compute envelope absent — soft-wire WAITING_DATA; EW8 mirrors envelope fields locally.',
    ),
    ew7ResourcePolicy: firstPresent(
      [
        join(here, 'resource-policy.ts'),
        join(siblingEw7, 'resource-policy.ts'),
      ],
      'EW7 resource-policy PRESENT (soft-wire/reuse — do not duplicate). Presence≠VERIFIED.',
      'EW7 resource-policy absent — soft-wire WAITING_DATA; thin EW8 GPU policy bridge only.',
    ),
    ew6Chipgraph: firstPresent(
      [
        join(here, 'types.ts'),
        join(here, 'graph.ts'),
        join(siblingEw6, 'types.ts'),
        join(siblingEw6, 'graph.ts'),
      ],
      'EW6 chipgraph PRESENT (soft-wire). Presence≠VERIFIED.',
      'EW6 chipgraph absent — soft-wire WAITING_DATA (not FAIL).',
    ),
    agentMesh: softWireAbsolute(
      join(runtimeDir, 'agentmesh/index.ts'),
      'Agent Mesh PRESENT (soft-wire). Connect — do not create NVIDIA brain. Presence≠VERIFIED.',
      'Agent Mesh absent — soft-wire WAITING_DATA.',
    ),
    localRuntimeGovernor: firstPresent(
      [
        join(root, 'services/ai/local-runtime/resource-governor.ts'),
        join(parentOfRoot, 'services/ai/local-runtime/resource-governor.ts'),
      ],
      'local-runtime resource-governor PRESENT (soft-wire/reuse). Presence≠VERIFIED.',
      'local-runtime resource-governor absent — soft-wire WAITING_DATA.',
    ),
    workloadGenome: firstPresent(
      [
        join(root, 'services/ai/local-runtime/workload-router.ts'),
        join(parentOfRoot, 'services/ai/local-runtime/workload-router.ts'),
        join(siblingEw6, 'routing.ts'),
      ],
      'Workload genome / router marker PRESENT (soft-wire). Presence≠VERIFIED.',
      'Workload genome absent — soft-wire WAITING_DATA.',
    ),
    benchmarkLedger: firstPresent(
      [
        join(here, 'nvidia-benchmark.ts'),
        join(siblingEw6, 'evidence.ts'),
        join(root, 'services/ai/local-runtime/benchmark.ts'),
      ],
      'Benchmark ledger marker PRESENT (soft-wire). Presence≠VERIFIED.',
      'Benchmark ledger soft-wire WAITING_DATA until measured paths exist.',
    ),
    homeBase: firstPresent(
      [
        join(root, 'services/ai/local-brain/hybrid-compute-home-base.ts'),
        join(root, 'services/ai/local-brain/agent-compute-home-base-types.ts'),
        join(parentOfRoot, 'services/ai/local-brain/hybrid-compute-home-base.ts'),
        join(siblingEw7, 'compute-receipt.ts'),
      ],
      'XIV Home Base marker PRESENT (soft-wire). Presence≠VERIFIED.',
      'Home Base absent — soft-wire WAITING_DATA (not FAIL).',
    ),
  };
}

export function softWireHopState(present: boolean): 'PASS' | 'WAITING_DATA' {
  return present ? 'PASS' : 'WAITING_DATA';
}

/**
 * Environment honesty — never fabricate NVIDIA VERIFIED in this cloud VM.
 */
export function nvidiaEnvironmentHonesty(): {
  gpuState: TruthState;
  driverState: TruthState;
  cudaState: TruthState;
  tensorRtState: TruthState;
  tensorRtLlmState: TruthState;
  onnxNvidiaState: TruthState;
  modelCompatibilityState: TruthState;
  multiGpuState: MultiGpuState;
  gpuVerified: false;
  cudaVerified: false;
  tensorRtVerified: false;
  note: string;
} {
  return {
    gpuState: 'NOT_TESTED',
    driverState: 'NOT_CONFIGURED',
    cudaState: 'NOT_CONFIGURED',
    tensorRtState: 'NOT_CONFIGURED',
    tensorRtLlmState: 'NOT_CONFIGURED',
    onnxNvidiaState: 'NOT_CONFIGURED',
    modelCompatibilityState: 'NOT_TESTED',
    multiGpuState: 'MULTI_GPU_NOT_TESTED',
    gpuVerified: false,
    cudaVerified: false,
    tensorRtVerified: false,
    note:
      'NVIDIA GPU/CUDA/TensorRT remain NOT_TESTED / NOT_CONFIGURED in this environment — VERIFIED not fabricated.',
  };
}

export function denySiliconOrFirmwareClaim(claim: string): {
  denied: true;
  reason: string;
} {
  const signals = [
    'silicon',
    'sm count',
    'streaming multiprocessor',
    'firmware',
    'vbios',
    'overclock',
    'undervolt',
    'voltage',
    'clock',
    'thermal bypass',
    'microarch',
    'cuda core count claim',
  ];
  const lower = claim.toLowerCase();
  if (signals.some((s) => lower.includes(s))) {
    return {
      denied: true,
      reason:
        'SOFTWARE_ACCELERATION_ONLY — NVIDIA silicon/SM/firmware/voltage/clock/thermal/microarch claims denied.',
    };
  }
  return {
    denied: true,
    reason: 'CLAIM_NOT_RECOGNIZED_AS_SOFTWARE_ACCELERATION',
  };
}
