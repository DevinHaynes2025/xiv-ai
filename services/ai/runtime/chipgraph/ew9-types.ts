/**
 * 62L-EW9 — Intel CPU/GPU/NPU Adapter Candidate types / locks / soft-wires
 * Parent: Global Operations Brain / GitHub #169 / 62L-EW Offline Research Mesh
 *
 * Same shared fabric as AMD (EW7) / NVIDIA (EW8) — NOT a separate Intel AI brain.
 * Soft-wire (existsSync): EW8 NVIDIA / EW7 AMD envelope+governor / EW6 chipgraph /
 * Agent Mesh / local-runtime — presence ≠ VERIFIED; absent → WAITING_DATA.
 * L4_AUTONOMY_ENABLED=false. tip-land=NO. No PR unless founder asks.
 * Next (docs-only): EW10 — ARM + Apple Silicon + Qualcomm + Google Tensor +
 * Samsung/Exynos Mobile & Edge Capability Registry.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ DETECTED ≠ SUPPORTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 169 as const;
export const GITHUB_SOT_LABEL = '62L-EW9' as const;
export const GITHUB_SOT_FAMILY = '62L-EW' as const;
export const GITHUB_SOT_TITLE =
  'EW9 — Intel CPU/GPU/NPU Adapter Candidate — Agent Mission → Agent Mesh → Workload Genome → Compute Envelope → Cross-Chip Capability Graph → Intel Adapter → Resource Governor → CPU/GPU/NPU → Execution Receipt → Benchmark Ledger → Bottleneck Analyzer → Neural Pathway → XIV Home Base; L4=false' as const;

export const NEXT_STORY_TITLE =
  'EW10 — ARM + Apple Silicon + Qualcomm + Google Tensor + Samsung/Exynos Mobile & Edge Capability Registry' as const;

export const CANONICAL_FLOW = [
  'AgentMission',
  'AgentMesh',
  'WorkloadGenome',
  'ComputeEnvelope',
  'CrossChipCapabilityGraph',
  'IntelAdapter',
  'ResourceGovernor',
  'CpuGpuNpu',
  'ExecutionReceipt',
  'BenchmarkLedger',
  'BottleneckAnalyzer',
  'NeuralPathway',
  'XivHomeBase',
] as const;

export type CanonicalFlowHop = (typeof CANONICAL_FLOW)[number];

/**
 * Independent Intel truth classes — never infer across devices/runtimes.
 * CPU present ≠ GPU verified; NPU detected ≠ NPU inference verified;
 * runtime installed ≠ model/device path verified.
 */
export const INTEL_TRUTH_CLASSES = [
  'INTEL_CPU',
  'INTEL_GPU',
  'INTEL_NPU',
  'OPENVINO_RUNTIME',
  'ONNX_RUNTIME_PROVIDER',
  'OTHER_DOCUMENTED_RUNTIME',
] as const;

export type IntelTruthClass = (typeof INTEL_TRUTH_CLASSES)[number];

export const INTEL_DEVICES = ['INTEL_CPU', 'INTEL_GPU', 'INTEL_NPU'] as const;
export type IntelDevice = (typeof INTEL_DEVICES)[number];

export const DEVICE_TRUTH_STATES = [
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

export type DeviceTruthState = (typeof DEVICE_TRUTH_STATES)[number];

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
  'MISSING_RECEIPT',
  'SILENT_FALLBACK_FORBIDDEN',
  'RUNTIME_NOT_CONFIGURED',
  'RUNTIME_UNAVAILABLE',
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

/** XIV software acceleration only — never firmware/BIOS/microcode/voltage/clocks. */
export const SOFTWARE_ACCELERATION_LEVERS = [
  'routing',
  'operators',
  'precision',
  'quantization',
  'batching',
  'session_cache',
  'queue',
  'partitioning',
  'benchmark_fallback',
  'offline_placement',
] as const;
export type SoftwareAccelerationLever =
  (typeof SOFTWARE_ACCELERATION_LEVERS)[number];

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ew9SoftWireSnapshot = {
  ew8NvidiaAdapter: SoftWirePresence;
  ew7AmdAdapter: SoftWirePresence;
  ew7ComputeEnvelope: SoftWirePresence;
  ew7ResourcePolicy: SoftWirePresence;
  ew6Chipgraph: SoftWirePresence;
  agentMesh: SoftWirePresence;
  localRuntimeGovernor: SoftWirePresence;
  workloadGenome: SoftWirePresence;
  benchmarkLedger: SoftWirePresence;
  bottleneckAnalyzer: SoftWirePresence;
  homeBase: SoftWirePresence;
};

export const EW9_LOCKS = Object.freeze({
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
  CPU_PRESENT_IMPLIES_GPU_VERIFIED: false as const,
  NPU_DETECTED_IMPLIES_NPU_INFERENCE_VERIFIED: false as const,
  RUNTIME_INSTALLED_IMPLIES_MODEL_DEVICE_VERIFIED: false as const,
  FALLBACK_EQ_ACCELERATOR_VERIFIED: false as const,
  SILENT_FALLBACK_ALLOWED: false as const,
  STALE_EVIDENCE_KEEPS_VERIFIED: false as const,
  FABRICATE_INTEL_GPU_VERIFIED: false as const,
  FABRICATE_INTEL_NPU_VERIFIED: false as const,

  MAY_SILENT_DRIVER_RUNTIME_INSTALL: false as const,
  MAY_PHYSICALLY_MODIFY_SILICON: false as const,
  MAY_MODIFY_BIOS_FIRMWARE_MICROCODE: false as const,
  MAY_OVERCLOCK: false as const,
  MAY_CHANGE_VOLTAGE: false as const,
  MAY_REPLACE_DRIVERS: false as const,
  MAY_DISABLE_THERMAL_PROTECTIONS: false as const,
  MAY_BUY_CLOUD: false as const,
  MAY_INGEST_PROPRIETARY_INTEL_IP: false as const,

  SEPARATE_INTEL_BRAIN: false as const,
  PARALLEL_INTEL_ORCHESTRATION: false as const,
  CHILD_EXTRA_HARDWARE_AUTHORITY: false as const,
  CHILD_EXTRA_DATA_AUTHORITY: false as const,
  NEURAL_PATHWAY_MAY_INCREASE_PERMISSIONS: false as const,
  CLAIM_WORK_WHILE_POWERED_OFF: false as const,

  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  CROSS_TENANT_ADAPTER_ACCESS: false as const,
  CROSS_UNIVERSE_ADAPTER_ACCESS: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const EW9_MAY = Object.freeze([
  'connect_agent_mesh_to_intel_compatible_paths',
  'route_via_cross_chip_capability_graph',
  'reuse_shared_envelope_receipt_governor_benchmark',
  'apply_xiv_software_acceleration_levers',
  'fallback_cpu_with_honest_receipt',
  'soft_wire_ew7_ew8_resource_policy',
  'update_neural_pathway_routing_weights_only',
  'compare_equivalent_workloads_cross_vendor',
  'emit_execution_receipts_to_home_base',
  'offline_local_verified_intel_bounded_work',
] as const);

export const EW9_MUST_NOT = Object.freeze([
  'create_separate_intel_ai_brain',
  'duplicate_shared_envelope_or_governor',
  'treat_documented_or_detected_as_verified',
  'claim_accelerator_verified_via_silent_fallback',
  'fabricate_intel_gpu_or_npu_verified',
  'silent_driver_or_runtime_install',
  'ingest_proprietary_intel_ip',
  'modify_bios_firmware_microcode_voltage_clocks',
  'increase_permissions_via_neural_pathway',
  'bypass_guardian_rls_tenant_universe',
  'enable_l4_autonomy',
  'tip_land_or_open_pr',
  'claim_continued_work_while_powered_off',
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

export function assertEw9LocksIntact(): boolean {
  return (
    EW9_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EW9_LOCKS.DOCUMENTED_EQ_VERIFIED === false &&
    EW9_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EW9_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    EW9_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
    EW9_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EW9_LOCKS.CPU_PRESENT_IMPLIES_GPU_VERIFIED === false &&
    EW9_LOCKS.NPU_DETECTED_IMPLIES_NPU_INFERENCE_VERIFIED === false &&
    EW9_LOCKS.RUNTIME_INSTALLED_IMPLIES_MODEL_DEVICE_VERIFIED === false &&
    EW9_LOCKS.FALLBACK_EQ_ACCELERATOR_VERIFIED === false &&
    EW9_LOCKS.SILENT_FALLBACK_ALLOWED === false &&
    EW9_LOCKS.STALE_EVIDENCE_KEEPS_VERIFIED === false &&
    EW9_LOCKS.FABRICATE_INTEL_GPU_VERIFIED === false &&
    EW9_LOCKS.FABRICATE_INTEL_NPU_VERIFIED === false &&
    EW9_LOCKS.MAY_SILENT_DRIVER_RUNTIME_INSTALL === false &&
    EW9_LOCKS.MAY_PHYSICALLY_MODIFY_SILICON === false &&
    EW9_LOCKS.MAY_MODIFY_BIOS_FIRMWARE_MICROCODE === false &&
    EW9_LOCKS.MAY_OVERCLOCK === false &&
    EW9_LOCKS.MAY_CHANGE_VOLTAGE === false &&
    EW9_LOCKS.MAY_REPLACE_DRIVERS === false &&
    EW9_LOCKS.MAY_DISABLE_THERMAL_PROTECTIONS === false &&
    EW9_LOCKS.MAY_BUY_CLOUD === false &&
    EW9_LOCKS.MAY_INGEST_PROPRIETARY_INTEL_IP === false &&
    EW9_LOCKS.SEPARATE_INTEL_BRAIN === false &&
    EW9_LOCKS.PARALLEL_INTEL_ORCHESTRATION === false &&
    EW9_LOCKS.CHILD_EXTRA_HARDWARE_AUTHORITY === false &&
    EW9_LOCKS.CHILD_EXTRA_DATA_AUTHORITY === false &&
    EW9_LOCKS.NEURAL_PATHWAY_MAY_INCREASE_PERMISSIONS === false &&
    EW9_LOCKS.CLAIM_WORK_WHILE_POWERED_OFF === false &&
    EW9_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EW9_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EW9_LOCKS.CROSS_TENANT_ADAPTER_ACCESS === false &&
    EW9_LOCKS.CROSS_UNIVERSE_ADAPTER_ACCESS === false &&
    EW9_LOCKS.TIP_LAND === false &&
    EW9_LOCKS.MERGE_MAIN === false &&
    EW9_LOCKS.MANAGE_PULL_REQUEST === false &&
    EW9_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EW9_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EW9_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true
  );
}

export function satisfiesMinimumState(
  actual: DeviceTruthState,
  minimum: DeviceTruthState,
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
export function ew9SoftWireSnapshot(repoRoot?: string): Ew9SoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../../..');
  const runtimeDir = join(here, '..');
  const parentOfRoot = join(root, '..');
  const siblingEw8 = join(parentOfRoot, '.wt-ew8/services/ai/runtime/chipgraph');
  const siblingEw7 = join(parentOfRoot, '.wt-ew7/services/ai/runtime/chipgraph');
  const siblingEw6 = join(parentOfRoot, '.wt-ew6/services/ai/runtime/chipgraph');

  return {
    ew8NvidiaAdapter: firstPresent(
      [
        join(here, 'ew8-types.ts'),
        join(here, 'nvidia-adapter.ts'),
        join(siblingEw8, 'ew8-types.ts'),
        join(siblingEw8, 'nvidia-adapter.ts'),
      ],
      'EW8 NVIDIA Adapter Candidate PRESENT (soft-wire). Presence≠VERIFIED.',
      'EW8 NVIDIA adapter absent — soft-wire WAITING_DATA (not FAIL).',
    ),
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
      'Shared compute envelope PRESENT (soft-wire/reuse fields). Presence≠VERIFIED.',
      'Shared compute envelope soft-wire WAITING_DATA; EW9 mirrors envelope fields locally.',
    ),
    ew7ResourcePolicy: firstPresent(
      [
        join(here, 'resource-policy.ts'),
        join(siblingEw7, 'resource-policy.ts'),
      ],
      'Shared resource-policy PRESENT (soft-wire/reuse — do not duplicate). Presence≠VERIFIED.',
      'Shared resource-policy absent — soft-wire WAITING_DATA; thin EW9 bridge only.',
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
      'Agent Mesh PRESENT (soft-wire). Connect — do not create Intel brain. Presence≠VERIFIED.',
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
        join(here, 'intel-benchmark.ts'),
        join(siblingEw6, 'evidence.ts'),
        join(root, 'services/ai/local-runtime/benchmark.ts'),
      ],
      'Benchmark ledger marker PRESENT (soft-wire). Presence≠VERIFIED.',
      'Benchmark ledger soft-wire WAITING_DATA until measured paths exist.',
    ),
    bottleneckAnalyzer: firstPresent(
      [
        join(siblingEw6, 'bottlenecks.ts'),
        join(root, 'services/ai/compute-graph'),
      ],
      'Bottleneck analyzer marker PRESENT (soft-wire). Presence≠VERIFIED.',
      'Bottleneck analyzer soft-wire WAITING_DATA.',
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
 * Environment honesty — never fabricate Intel GPU/NPU VERIFIED in this cloud VM.
 */
export function intelEnvironmentHonesty(): {
  cpuDefaultSafe: true;
  cpuState: DeviceTruthState;
  gpuState: DeviceTruthState;
  npuState: DeviceTruthState;
  openVinoState: DeviceTruthState;
  onnxProviderState: DeviceTruthState;
  otherRuntimeState: DeviceTruthState;
  gpuVerified: false;
  npuVerified: false;
  note: string;
} {
  return {
    cpuDefaultSafe: true,
    cpuState: 'NOT_TESTED',
    gpuState: 'NOT_TESTED',
    npuState: 'NOT_TESTED',
    openVinoState: 'NOT_CONFIGURED',
    onnxProviderState: 'NOT_CONFIGURED',
    otherRuntimeState: 'DOCUMENTED',
    gpuVerified: false,
    npuVerified: false,
    note:
      'Intel GPU/NPU remain NOT_TESTED; OpenVINO/ONNX Intel paths NOT_CONFIGURED in this environment — VERIFIED not fabricated.',
  };
}

export function denySiliconOrFirmwareClaim(claim: string): {
  denied: true;
  reason: string;
} {
  const signals = [
    'silicon',
    'bios',
    'firmware',
    'microcode',
    'overclock',
    'undervolt',
    'voltage',
    'clock',
    'thermal bypass',
    'replace driver',
    'disable thermal',
  ];
  const lower = claim.toLowerCase();
  if (signals.some((s) => lower.includes(s))) {
    return {
      denied: true,
      reason:
        'SOFTWARE_ACCELERATION_ONLY — BIOS/firmware/microcode/clock/voltage/driver/thermal claims denied.',
    };
  }
  return {
    denied: true,
    reason: 'CLAIM_NOT_RECOGNIZED_AS_SOFTWARE_ACCELERATION',
  };
}
