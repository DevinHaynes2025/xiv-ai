/**
 * 62L-EW6 — Cross-Chip Capability Graph v2
 * Parent: Global Operations Brain / GitHub #169 / 62L-EW Offline Research Mesh.
 *
 * One shared evidence-backed compute graph across AMD, NVIDIA, Intel, ARM,
 * Apple, Qualcomm, RISC-V, and future accelerators. Integrates with Agent Mesh
 * (not a second orchestration framework). Soft-wires EW1–EW5 + HC compute-graph
 * via existsSync — presence ≠ VERIFIED; absent → WAITING_DATA (not FAIL).
 *
 * Honesty: DOCUMENTED ≠ VERIFIED, DETECTED ≠ VERIFIED, SUPPORTED ≠ VERIFIED.
 * VERIFIED requires actual runtime/test evidence.
 * L4_AUTONOMY_ENABLED=false. tip-land=NO. No PR unless founder asks.
 * Next story: EW7 — AMD Local Communication Adapter.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ DETECTED ≠ SUPPORTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 169 as const;
export const GITHUB_SOT_LABEL = '62L-EW6' as const;
export const GITHUB_SOT_FAMILY = '62L-EW' as const;
export const GITHUB_SOT_TITLE =
  'EW6 — Cross-Chip Capability Graph v2 — shared vendor graph, capability routing, bottleneck/fallback truth, neural pathway weighting; L4=false' as const;

export const NEXT_STORY_TITLE =
  'EW7 — AMD Local Communication Adapter' as const;

/** Canonical pathway (encoded, not a second orchestrator). */
export const CANONICAL_PATHWAY = [
  'BusinessProblem',
  'Algorithm',
  'WorkloadGenome',
  'RuntimeCompiler',
  'Architecture',
  'PhysicalDevice',
  'Benchmark',
  'Bottleneck',
  'Result',
  'Lesson',
  'XivHomeBase',
] as const;

export type CanonicalPathwayHop = (typeof CANONICAL_PATHWAY)[number];

export const EVIDENCE_STATES = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'STALE',
  'UNAVAILABLE',
  'REVOKED',
  'WAITING_DATA',
] as const;

export type EvidenceState = (typeof EVIDENCE_STATES)[number];

/** Ordered advancement ladder — never skip to VERIFIED. */
export const TRUTH_LADDER = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
] as const;

export type TruthLadderState = (typeof TRUTH_LADDER)[number];

export const CHIP_VENDORS = [
  'AMD',
  'NVIDIA',
  'INTEL',
  'ARM',
  'APPLE',
  'QUALCOMM',
  'RISC_V',
  'FUTURE_ACCELERATOR',
] as const;

export type ChipVendor = (typeof CHIP_VENDORS)[number];

export const ACCELERATOR_CLASSES = [
  'CPU',
  'GPU',
  'NPU',
  'OTHER_ACCELERATOR',
] as const;

export type AcceleratorClass = (typeof ACCELERATOR_CLASSES)[number];

export const GRAPH_NODE_KINDS = [
  'VendorNode',
  'ArchitectureNode',
  'DeviceNode',
  'RuntimeNode',
  'CompilerNode',
  'ModelNode',
  'PrecisionNode',
  'WorkloadNode',
  'BenchmarkNode',
  'BottleneckNode',
  'FallbackNode',
  'EvidenceNode',
  'LessonNode',
] as const;

export type GraphNodeKind = (typeof GRAPH_NODE_KINDS)[number];

export const BOTTLENECK_CLASSES = [
  'COMPUTE_BOUND',
  'MEMORY_BOUND',
  'CACHE_BOUND',
  'DATA_TRANSFER_BOUND',
  'RUNTIME_BOUND',
  'MODEL_COMPATIBILITY_BOUND',
  'QUEUE_BOUND',
  'I_O_BOUND',
  'NETWORK_BOUND',
  'THERMAL_RESOURCE_BOUND',
  'UNKNOWN',
] as const;

export type BottleneckClass = (typeof BOTTLENECK_CLASSES)[number];

export const PRIVACY_CLASSES = [
  'TENANT_PRIVATE',
  'PUBLIC_REFERENCE',
  'XIV_OWNED',
  'SEALED_LOCAL',
] as const;

export type PrivacyClass = (typeof PRIVACY_CLASSES)[number];

/** Proprietary / restricted evidence classes — must be rejected. */
export const RESTRICTED_EVIDENCE_CLASSES = [
  'VENDOR_RTL',
  'VENDOR_FIRMWARE',
  'CONFIDENTIAL_MICROARCHITECTURE',
  'LEAKED_SOURCE',
  'RESTRICTED_ISA_EXTENSION',
  'TRADE_SECRET',
] as const;

export type RestrictedEvidenceClass = (typeof RESTRICTED_EVIDENCE_CLASSES)[number];

export const ALLOWED_EVIDENCE_CLASSES = [
  'PUBLIC_DOCUMENTATION',
  'RUNTIME_DETECTION',
  'BOUNDED_RUNTIME_TEST',
  'BENCHMARK_RECEIPT',
  'XIV_OWNED_WORKLOAD_GENOME',
  'XIV_OWNED_ROUTING_POLICY',
  'XIV_OWNED_BOTTLENECK_GRAPH',
  'XIV_OWNED_FALLBACK_INTELLIGENCE',
  'AGENT_MESH_RECEIPT',
] as const;

export type AllowedEvidenceClass = (typeof ALLOWED_EVIDENCE_CLASSES)[number];

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ew6SoftWireSnapshot = {
  agentMesh: SoftWirePresence;
  ew1Ew5ResearchMesh: SoftWirePresence;
  hc3ComputeGraph: SoftWirePresence;
  hcChipgraphAlias: SoftWirePresence;
  globalOperationsBrain: SoftWirePresence;
};

export const EW6_LOCKS = Object.freeze({
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
  FALLBACK_EQ_REQUESTED_VERIFIED: false as const,
  STALE_EVIDENCE_KEEPS_VERIFIED: false as const,
  FABRICATE_AMD_GPU_VERIFIED: false as const,
  FABRICATE_AMD_NPU_VERIFIED: false as const,

  MAY_PHYSICALLY_MODIFY_SILICON: false as const,
  MAY_COPY_VENDOR_RTL_FIRMWARE: false as const,
  SEPARATE_VENDOR_BRAINS: false as const,
  SECOND_ORCHESTRATION_FRAMEWORK: false as const,

  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  CROSS_TENANT_GRAPH_ACCESS: false as const,
  CROSS_UNIVERSE_GRAPH_ACCESS: false as const,
  NEURAL_PATHWAY_MAY_CHANGE_PERMISSIONS: false as const,
  NEURAL_PATHWAY_MAY_CHANGE_GUARDIAN: false as const,
  NEURAL_PATHWAY_MAY_CHANGE_RLS: false as const,
  NEURAL_PATHWAY_MAY_CHANGE_PROD_CONTRACT_PAYMENT: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
});

export const EW6_MAY = Object.freeze([
  'encode_shared_cross_chip_capability_graph',
  'route_by_capability_not_brand',
  'link_bottleneck_classes_multi',
  'record_fallback_requested_vs_actual',
  'strengthen_weaken_neural_pathways_for_routing_confidence',
  'soft_wire_agentmesh_ew1ew5_hc3_ops_brain',
  'isolate_graph_by_tenant_universe',
  'reject_proprietary_restricted_evidence',
] as const);

export const EW6_MUST_NOT = Object.freeze([
  'treat_documented_or_detected_as_verified',
  'select_not_tested_when_verified_required',
  'claim_requested_accelerator_verified_via_fallback',
  'create_separate_amd_nvidia_intel_arm_apple_qualcomm_brains',
  'create_second_orchestration_framework',
  'copy_vendor_rtl_firmware_trade_secrets',
  'change_permissions_guardian_rls_via_neural_pathways',
  'enable_l4_autonomy',
  'tip_land_or_open_pr',
  'cross_tenant_or_cross_universe_graph_access',
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

export function tenantMatches(a: TenantScope, b: TenantScope): boolean {
  return a.orgId === b.orgId && a.tenantId === b.tenantId;
}

export function universeMatches(a: TenantScope, b: TenantScope): boolean {
  return a.orgId === b.orgId && a.universeId === b.universeId;
}

export function assertEw6LocksIntact(): boolean {
  return (
    EW6_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EW6_LOCKS.DOCUMENTED_EQ_VERIFIED === false &&
    EW6_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EW6_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    EW6_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
    EW6_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    EW6_LOCKS.FALLBACK_EQ_REQUESTED_VERIFIED === false &&
    EW6_LOCKS.STALE_EVIDENCE_KEEPS_VERIFIED === false &&
    EW6_LOCKS.FABRICATE_AMD_GPU_VERIFIED === false &&
    EW6_LOCKS.FABRICATE_AMD_NPU_VERIFIED === false &&
    EW6_LOCKS.MAY_PHYSICALLY_MODIFY_SILICON === false &&
    EW6_LOCKS.MAY_COPY_VENDOR_RTL_FIRMWARE === false &&
    EW6_LOCKS.SEPARATE_VENDOR_BRAINS === false &&
    EW6_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK === false &&
    EW6_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EW6_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EW6_LOCKS.CROSS_TENANT_GRAPH_ACCESS === false &&
    EW6_LOCKS.CROSS_UNIVERSE_GRAPH_ACCESS === false &&
    EW6_LOCKS.NEURAL_PATHWAY_MAY_CHANGE_PERMISSIONS === false &&
    EW6_LOCKS.NEURAL_PATHWAY_MAY_CHANGE_GUARDIAN === false &&
    EW6_LOCKS.NEURAL_PATHWAY_MAY_CHANGE_RLS === false &&
    EW6_LOCKS.NEURAL_PATHWAY_MAY_CHANGE_PROD_CONTRACT_PAYMENT === false &&
    EW6_LOCKS.TIP_LAND === false &&
    EW6_LOCKS.MERGE_MAIN === false &&
    EW6_LOCKS.MANAGE_PULL_REQUEST === false &&
    EW6_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EW6_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EW6_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true
  );
}

export function satisfiesMinimumState(
  actual: EvidenceState,
  minimum: EvidenceState,
): boolean {
  if (minimum === 'VERIFIED') {
    return actual === 'VERIFIED';
  }
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
  // Honesty states as minimum: exact match only (STALE etc. never satisfy VERIFIED).
  return actual === minimum;
}

export function canAdvanceTruthLadder(
  from: EvidenceState,
  to: EvidenceState,
): boolean {
  if (from === to) return true;
  const fromIdx = TRUTH_LADDER.indexOf(from as TruthLadderState);
  const toIdx = TRUTH_LADDER.indexOf(to as TruthLadderState);
  if (fromIdx < 0 || toIdx < 0) return false;
  if (from === 'DOCUMENTED' && to === 'VERIFIED') return false;
  if (from === 'DETECTED' && to === 'VERIFIED') return false;
  return toIdx === fromIdx + 1;
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

/**
 * Soft-wire presence probe. Presence ≠ VERIFIED.
 * Absent → WAITING_DATA (caller maps via softWireHopState).
 */

function resolveHc3ComputeGraphSoftWire(root: string): SoftWirePresence {
  const parentRoot = join(root, '..');
  const candidates = [
    join(root, 'services/ai/compute-graph/index.ts'),
    join(parentRoot, 'services/ai/compute-graph/index.ts'),
  ];
  for (const pathChecked of candidates) {
    if (existsSync(pathChecked)) {
      return {
        present: true,
        pathChecked,
        note: 'HC3 compute-graph PRESENT (soft-wire). Soft-wire only — EW6 home is runtime/chipgraph. Presence≠VERIFIED.',
      };
    }
  }
  return {
    present: false,
    pathChecked: candidates[0]!,
    note: 'HC3 compute-graph absent — soft-wire WAITING_DATA (not FAIL).',
  };
}

export function ew6SoftWireSnapshot(repoRoot?: string): Ew6SoftWireSnapshot {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../../..');
  const runtimeDir = join(here, '..');

  return {
    agentMesh: softWireAbsolute(
      join(runtimeDir, 'agentmesh/index.ts'),
      'Agent Mesh PRESENT (soft-wire). Integrate — do not create second orchestrator. Presence≠VERIFIED.',
      'Agent Mesh absent — soft-wire WAITING_DATA.',
    ),
    ew1Ew5ResearchMesh: resolveEw1Ew5SoftWire(root, runtimeDir),
    hc3ComputeGraph: resolveHc3ComputeGraphSoftWire(root),
    hcChipgraphAlias: softWireAbsolute(
      join(here, 'index.ts'),
      'EW6 chipgraph PRESENT (this module).',
      'EW6 chipgraph absent — WAITING_DATA.',
    ),
    globalOperationsBrain: resolveGlobalOperationsBrainSoftWire(root),
  };
}

function resolveEw1Ew5SoftWire(
  root: string,
  runtimeDir: string,
): SoftWirePresence {
  // Prefer committed Agent Mesh types that export RESEARCH_RUNTIME_STATES (EW1–EW5 tip).
  const meshTypes = join(runtimeDir, 'agentmesh/types.ts');
  const parentRoot = join(root, '..');
  const parkMarkers = [
    join(root, '.wt-ew1-ew5/services/ai/runtime/agentmesh/types.ts'),
    join(parentRoot, '.wt-ew1-ew5/services/ai/runtime/agentmesh/types.ts'),
    join(root, 'docs/operations/reports/62L_EW1_EW5_OFFLINE_RESEARCH_MESH_REPORT.md'),
    join(parentRoot, 'docs/operations/reports/62L_EW1_EW5_OFFLINE_RESEARCH_MESH_REPORT.md'),
  ];
  for (const marker of parkMarkers) {
    if (existsSync(marker)) {
      return {
        present: true,
        pathChecked: marker,
        note: 'EW1–EW5 offline research mesh marker PRESENT (soft-wire). Presence≠VERIFIED.',
      };
    }
  }
  if (existsSync(meshTypes)) {
    return {
      present: true,
      pathChecked: meshTypes,
      note: 'Agent Mesh types PRESENT as EW soft-wire host; EW1–EW5 research markers may be WAITING_DATA until tip lands. Presence≠VERIFIED.',
    };
  }
  return {
    present: false,
    pathChecked: meshTypes,
    note: 'EW1–EW5 / Agent Mesh absent — soft-wire WAITING_DATA.',
  };
}

export function resolveGlobalOperationsBrainSoftWire(
  repoRoot?: string,
): SoftWirePresence {
  const here = dirname(fileURLToPath(import.meta.url));
  const root = repoRoot ?? join(here, '../../../..');
  const candidates = [
    join(root, 'services/ai/local-brain/global-operations-brain-types.ts'),
    join(root, 'services/ai/orchestration/index.ts'),
    join(
      root,
      '.wt-dh-final/services/ai/local-brain/global-operations-brain-types.ts',
    ),
  ];
  for (const pathChecked of candidates) {
    if (existsSync(pathChecked)) {
      return {
        present: true,
        pathChecked,
        note: 'Global Operations Brain PRESENT (soft-wire). Findings returnable. Presence≠VERIFIED.',
      };
    }
  }
  return {
    present: false,
    pathChecked: candidates[0]!,
    note: 'Global Operations Brain absent — WAITING_DATA (not FAIL).',
  };
}

export function softWireHopState(present: boolean): 'PASS' | 'WAITING_DATA' {
  return present ? 'PASS' : 'WAITING_DATA';
}

/**
 * Environment honesty — never fabricate AMD GPU/NPU VERIFIED.
 */
export function probeAmdGpuEnvironmentEvidence(): boolean {
  return false;
}

export function probeAmdNpuEnvironmentEvidence(): boolean {
  return false;
}

export function amdHardwareHonesty(): {
  gpuState: EvidenceState;
  npuState: EvidenceState;
  gpuVerified: false;
  npuVerified: false;
  note: string;
} {
  return {
    gpuState: 'NOT_TESTED',
    npuState: 'NOT_TESTED',
    gpuVerified: false,
    npuVerified: false,
    note: 'AMD GPU/NPU verification NO / NOT_TESTED — no fresh runtime evidence in this environment.',
  };
}
