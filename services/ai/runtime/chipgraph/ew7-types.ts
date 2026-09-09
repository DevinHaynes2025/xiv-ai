/**
 * 62L-EW7 — AMD Local Communication Adapter types / locks / soft-wires
 * Parent: Global Operations Brain / GitHub #169 / 62L-EW Offline Research Mesh
 *
 * Connects Agent Mesh + Cross-Chip Capability Graph to local AMD paths.
 * Does NOT create a separate AMD agent system.
 *
 * Soft-wire (existsSync): EW6 chipgraph, Agent Mesh, HC1/HC4, local-runtime /
 * workload-router / resource-governor — presence ≠ VERIFIED; absent → WAITING_DATA.
 * L4_AUTONOMY_ENABLED=false. tip-land=NO. No PR unless founder asks.
 * Next (docs-only): EW8 — NVIDIA Adapter Candidate.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ DETECTED ≠ SUPPORTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 169 as const;
export const GITHUB_SOT_LABEL = '62L-EW7' as const;
export const GITHUB_SOT_FAMILY = '62L-EW' as const;
export const GITHUB_SOT_TITLE =
  'EW7 — AMD Local Communication Adapter — Agent Mesh → Task Envelope → Chip Graph → AMD Adapter → Resource Governor → CPU/GPU/NPU → Execution Receipt → Benchmark/Evidence → XIV Home Base; L4=false' as const;

export const NEXT_STORY_TITLE =
  'EW8 — NVIDIA Adapter Candidate (same envelope / graph / governor / receipts / Home Base)' as const;

export const CANONICAL_FLOW = [
  'AgentMission',
  'AgentMesh',
  'TaskEnvelope',
  'ChipCapabilityGraph',
  'AmdAdapter',
  'ResourceGovernor',
  'CpuGpuNpu',
  'ExecutionReceipt',
  'BenchmarkEvidence',
  'XivHomeBase',
] as const;

export type CanonicalFlowHop = (typeof CANONICAL_FLOW)[number];

/** Independent AMD device truth classes — never infer across devices. */
export const AMD_DEVICES = ['AMD_CPU', 'AMD_GPU', 'AMD_NPU'] as const;
export type AmdDevice = (typeof AMD_DEVICES)[number];

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
  'THERMAL_PROTECTION',
  'EXECUTION_ERROR',
  'POLICY_DENIED',
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

export const SOFTWARE_ACCELERATION_LEVERS = [
  'model_runtime_selection',
  'precision_quantization',
  'batching',
  'session_reuse',
  'caching',
  'queue_policy',
  'cpu_gpu_npu_partitioning',
  'fallback',
  'benchmark_led_routing',
] as const;
export type SoftwareAccelerationLever =
  (typeof SOFTWARE_ACCELERATION_LEVERS)[number];

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ew7SoftWireSnapshot = {
  ew6Chipgraph: SoftWirePresence;
  agentMesh: SoftWirePresence;
  hc1HybridHomeBase: SoftWirePresence;
  hc4CoreCompute: SoftWirePresence;
  localRuntime: SoftWirePresence;
  workloadRouter: SoftWirePresence;
  resourceGovernor: SoftWirePresence;
};

export const EW7_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  MERGE_MAIN: false as const,
  MANAGE_PULL_REQUEST: false as const,
  DB_CANDIDATES_APPLIED: false as const,

  /** Never infer CPU present ⇒ NPU verified. */
  CPU_PRESENT_IMPLIES_NPU_VERIFIED: false as const,
  /** Never infer Radeon detected ⇒ GPU inference works. */
  RADEON_DETECTED_IMPLIES_GPU_INFERENCE: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  DOCUMENTED_EQ_VERIFIED: false as const,
  SUPPORTED_EQ_VERIFIED: false as const,
  NOT_TESTED_EQ_VERIFIED: false as const,
  PRESENCE_EQ_VERIFIED: false as const,
  FALLBACK_EQ_ACCELERATOR_VERIFIED: false as const,
  SILENT_FALLBACK_ALLOWED: false as const,
  FABRICATE_AMD_GPU_VERIFIED: false as const,
  FABRICATE_AMD_NPU_VERIFIED: false as const,
  STALE_EVIDENCE_KEEPS_VERIFIED: false as const,

  MAY_PHYSICALLY_MODIFY_SILICON: false as const,
  MAY_MODIFY_BIOS_FIRMWARE: false as const,
  MAY_OVERCLOCK: false as const,
  MAY_CHANGE_VOLTAGE: false as const,
  MAY_REPLACE_DRIVERS: false as const,
  MAY_DISABLE_THERMAL_PROTECTIONS: false as const,
  MAY_BUY_CLOUD: false as const,

  SEPARATE_AMD_AGENT_SYSTEM: false as const,
  CHILD_EXTRA_HARDWARE_AUTHORITY: false as const,
  CHILD_EXTRA_DATA_AUTHORITY: false as const,
  CLAIM_WORK_WHILE_POWERED_OFF: false as const,

  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  CROSS_TENANT_ADAPTER_ACCESS: false as const,
  CROSS_UNIVERSE_ADAPTER_ACCESS: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const EW7_MAY = Object.freeze([
  'connect_agent_mesh_to_amd_local_paths',
  'route_via_chip_capability_graph',
  'apply_software_acceleration_levers',
  'fallback_cpu_with_honest_receipt',
  'reuse_resource_governor_via_soft_wire',
  'share_adapter_across_agents_without_extra_authority',
  'offline_local_verified_cpu_gpu_npu',
  'emit_execution_receipts_to_home_base',
] as const);

export const EW7_MUST_NOT = Object.freeze([
  'create_separate_amd_agent_system',
  'duplicate_workload_router_or_resource_governor',
  'infer_cross_device_verification',
  'claim_accelerator_verified_via_silent_fallback',
  'fabricate_amd_gpu_or_npu_verified',
  'disable_thermal_protections',
  'modify_bios_firmware_clock_voltage_drivers',
  'expand_child_hardware_or_data_authority',
  'claim_continued_work_while_powered_off',
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

export function assertEw7LocksIntact(): boolean {
  return (
    EW7_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EW7_LOCKS.CPU_PRESENT_IMPLIES_NPU_VERIFIED === false &&
    EW7_LOCKS.RADEON_DETECTED_IMPLIES_GPU_INFERENCE === false &&
    EW7_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EW7_LOCKS.DOCUMENTED_EQ_VERIFIED === false &&
    EW7_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    EW7_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
    EW7_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EW7_LOCKS.FALLBACK_EQ_ACCELERATOR_VERIFIED === false &&
    EW7_LOCKS.SILENT_FALLBACK_ALLOWED === false &&
    EW7_LOCKS.FABRICATE_AMD_GPU_VERIFIED === false &&
    EW7_LOCKS.FABRICATE_AMD_NPU_VERIFIED === false &&
    EW7_LOCKS.STALE_EVIDENCE_KEEPS_VERIFIED === false &&
    EW7_LOCKS.MAY_PHYSICALLY_MODIFY_SILICON === false &&
    EW7_LOCKS.MAY_MODIFY_BIOS_FIRMWARE === false &&
    EW7_LOCKS.MAY_OVERCLOCK === false &&
    EW7_LOCKS.MAY_CHANGE_VOLTAGE === false &&
    EW7_LOCKS.MAY_REPLACE_DRIVERS === false &&
    EW7_LOCKS.MAY_DISABLE_THERMAL_PROTECTIONS === false &&
    EW7_LOCKS.MAY_BUY_CLOUD === false &&
    EW7_LOCKS.SEPARATE_AMD_AGENT_SYSTEM === false &&
    EW7_LOCKS.CHILD_EXTRA_HARDWARE_AUTHORITY === false &&
    EW7_LOCKS.CHILD_EXTRA_DATA_AUTHORITY === false &&
    EW7_LOCKS.CLAIM_WORK_WHILE_POWERED_OFF === false &&
    EW7_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EW7_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EW7_LOCKS.CROSS_TENANT_ADAPTER_ACCESS === false &&
    EW7_LOCKS.CROSS_UNIVERSE_ADAPTER_ACCESS === false &&
    EW7_LOCKS.TIP_LAND === false &&
    EW7_LOCKS.MERGE_MAIN === false &&
    EW7_LOCKS.MANAGE_PULL_REQUEST === false &&
    EW7_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EW7_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EW7_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true
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
      return {
        present: true,
        pathChecked,
        note: notePresent,
      };
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
 * Absent → WAITING_DATA (caller maps via softWireHopState).
 */
export function ew7SoftWireSnapshot(repoRoot?: string): Ew7SoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../../..');
  const runtimeDir = join(here, '..');
  const parentOfRoot = join(root, '..');

  return {
    // EW6 owns types.ts / graph modules — do NOT treat EW7's own index as EW6.
    ew6Chipgraph: firstPresent(
      [
        join(here, 'types.ts'),
        join(here, 'graph.ts'),
        join(here, 'capability-graph.ts'),
        join(parentOfRoot, '.wt-ew6/services/ai/runtime/chipgraph/types.ts'),
        join(
          parentOfRoot,
          '.wt-ew6/services/ai/runtime/chipgraph/index.ts',
        ),
        join(parentOfRoot, 'services/ai/runtime/chipgraph/types.ts'),
        join(
          root,
          'docs/operations/reports/62L_EW6_CROSS_CHIP_CAPABILITY_GRAPH_V2_REPORT.md',
        ),
        join(
          parentOfRoot,
          'docs/operations/reports/62L_EW6_CROSS_CHIP_CAPABILITY_GRAPH_V2_REPORT.md',
        ),
      ],
      'EW6 chipgraph marker PRESENT (soft-wire). Presence≠VERIFIED.',
      'EW6 chipgraph absent — soft-wire WAITING_DATA (not FAIL).',
    ),
    agentMesh: softWireAbsolute(
      join(runtimeDir, 'agentmesh/index.ts'),
      'Agent Mesh PRESENT (soft-wire). Connect — do not create separate AMD agent system. Presence≠VERIFIED.',
      'Agent Mesh absent — soft-wire WAITING_DATA.',
    ),
    hc1HybridHomeBase: firstPresent(
      [
        join(root, 'services/ai/local-brain/hybrid-compute-home-base.ts'),
        join(root, 'services/ai/local-brain/phase62leshc1.test.ts'),
        join(root, 'docs/operations/62L_ES_HC1_HYBRID_COMPUTE_HOME_BASE_REPORT.md'),
        join(
          parentOfRoot,
          'docs/operations/62L_ES_HC1_HYBRID_COMPUTE_HOME_BASE_REPORT.md',
        ),
      ],
      'HC1 Hybrid Compute Home Base PRESENT (soft-wire). Presence≠VERIFIED.',
      'HC1 absent — soft-wire WAITING_DATA (not FAIL).',
    ),
    hc4CoreCompute: firstPresent(
      [
        join(root, 'services/ai/core-compute/index.ts'),
        join(root, 'docs/operations/62L_ES_HC4_CORE_COMPUTE_AGENT_INFRA_REPORT.md'),
        join(
          parentOfRoot,
          'services/ai/core-compute/index.ts',
        ),
        join(
          parentOfRoot,
          'docs/operations/62L_ES_HC4_CORE_COMPUTE_AGENT_INFRA_REPORT.md',
        ),
      ],
      'HC4 core-compute PRESENT (soft-wire). Soft-wire/reuse — do not duplicate. Presence≠VERIFIED.',
      'HC4 core-compute absent — soft-wire WAITING_DATA (not FAIL).',
    ),
    localRuntime: firstPresent(
      [
        join(root, 'services/ai/local-runtime/index.ts'),
        join(parentOfRoot, 'services/ai/local-runtime/index.ts'),
        join(parentOfRoot, '.wt-er9/services/ai/local-runtime/index.ts'),
      ],
      'local-runtime PRESENT (soft-wire). Presence≠VERIFIED.',
      'local-runtime absent — soft-wire WAITING_DATA (not FAIL).',
    ),
    workloadRouter: firstPresent(
      [
        join(root, 'services/ai/local-runtime/workload-router.ts'),
        join(parentOfRoot, 'services/ai/local-runtime/workload-router.ts'),
        join(parentOfRoot, '.wt-er9/services/ai/local-runtime/workload-router.ts'),
      ],
      'workload-router PRESENT (soft-wire/reuse — no competing router). Presence≠VERIFIED.',
      'workload-router absent — soft-wire WAITING_DATA (not FAIL).',
    ),
    resourceGovernor: firstPresent(
      [
        join(root, 'services/ai/local-runtime/resource-governor.ts'),
        join(parentOfRoot, 'services/ai/local-runtime/resource-governor.ts'),
        join(
          parentOfRoot,
          '.wt-er9/services/ai/local-runtime/resource-governor.ts',
        ),
      ],
      'resource-governor PRESENT (soft-wire/reuse — EW7 resource-policy delegates). Presence≠VERIFIED.',
      'resource-governor absent — soft-wire WAITING_DATA; EW7 resource-policy uses thin bridge only.',
    ),
  };
}

export function softWireHopState(present: boolean): 'PASS' | 'WAITING_DATA' {
  return present ? 'PASS' : 'WAITING_DATA';
}

/**
 * Environment honesty — never fabricate AMD GPU/NPU VERIFIED in this VM.
 */
export function amdEnvironmentHonesty(): {
  cpuDefaultSafe: true;
  gpuState: DeviceTruthState;
  npuState: DeviceTruthState;
  gpuVerified: false;
  npuVerified: false;
  note: string;
} {
  return {
    cpuDefaultSafe: true,
    gpuState: 'NOT_TESTED',
    npuState: 'NOT_TESTED',
    gpuVerified: false,
    npuVerified: false,
    note: 'AMD GPU/NPU remain NOT_TESTED in this cloud VM — VERIFIED not fabricated.',
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
    'overclock',
    'undervolt',
    'voltage',
    'vbios',
    'microcode',
    'replace driver',
    'disable thermal',
  ];
  const lower = claim.toLowerCase();
  if (signals.some((s) => lower.includes(s))) {
    return {
      denied: true,
      reason:
        'SOFTWARE_ACCELERATION_ONLY — BIOS/firmware/clock/voltage/driver/thermal claims denied.',
    };
  }
  return {
    denied: true,
    reason: 'CLAIM_NOT_RECOGNIZED_AS_SOFTWARE_ACCELERATION',
  };
}
