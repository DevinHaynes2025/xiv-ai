/**
 * 62L-EP6 — Local Hardware Truth Probe v2 (park-and-implement).
 *
 * ASUS/Windows node produces a machine-specific hardware truth profile so the
 * Virtual Chip layer knows what CPU/GPU/NPU hardware is actually present and
 * which capabilities are merely documented versus locally verified.
 *
 * Critical: Seeing an AMD CPU ≠ AMD NPU exists. Seeing a Radeon GPU ≠
 * Windows ML/ONNX works. Installed packages ≠ model compatibility.
 * VERIFIED requires actual bounded model inference or benchmark on that path.
 * Device states never jump UNKNOWN → VERIFIED.
 *
 * SoT: GitHub #160 / 62L-EP family (authoritative per founder). GitLab mirror:
 * not resolved in this environment (GitLab MCP needsAuth; no issue number invented).
 *
 * Soft-wire when PRESENT: EP5, EP4, EP1, EM (#157). Presence ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 * Read-only technical metadata only — no personal files/credentials/location.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): EP7 — AMD Adapter Research Path.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP6' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP6 Local Hardware Truth Probe v2 — machine-specific ASUS/Windows hardware truth profile with UNKNOWN→DETECTED→SUPPORTED→VERIFIED progression; CPU/GPU/NPU independently classified; privacy-bounded read-only probe' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP6_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP7 — AMD Adapter Research Path — connect the verified ASUS hardware profile to Windows ML/ONNX Runtime candidates and begin measuring which AMD CPU/GPU/NPU execution paths actually work.' as const;

/**
 * Probe collects only read-only technical metadata.
 */
export const HARDWARE_PROBE_FIELDS = [
  'windowsVersionBuild',
  'systemArchitecture',
  'cpuVendorModel',
  'logicalPhysicalCoreCounts',
  'installedRam',
  'gpuVendorModel',
  'gpuMemory',
  'npuPresence',
  'storageCapacityFreeSpaceXivPaths',
  'availableExecutionRuntimeProviders',
  'powerBatteryState',
  'xivRuntimeHeartbeat',
  'timestamp',
] as const;

export type HardwareProbeField = (typeof HARDWARE_PROBE_FIELDS)[number];

/**
 * Required state progression + adjacent states.
 * Never jump UNKNOWN → VERIFIED.
 */
export const HARDWARE_TRUTH_STATES = [
  'UNKNOWN',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'UNAVAILABLE',
  'STALE',
] as const;

export type HardwareTruthState = (typeof HARDWARE_TRUTH_STATES)[number];

/** Ordered progression for advancement checks (subset). */
export const HARDWARE_STATE_PROGRESSION = [
  'UNKNOWN',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
] as const;

export type HardwareStateProgression =
  (typeof HARDWARE_STATE_PROGRESSION)[number];

/**
 * Independently classified device / capability surfaces.
 */
export const MACHINE_EVIDENCE_SURFACES = [
  'cpu',
  'amd_gpu',
  'npu',
  'windows_ml',
  'cpu_inference',
  'gpu_inference',
  'npu_inference',
] as const;

export type MachineEvidenceSurface =
  (typeof MACHINE_EVIDENCE_SURFACES)[number];

/**
 * Node availability after heartbeat / sleep / shutdown.
 */
export const NODE_AVAILABILITY_STATES = [
  'RUNNING_VERIFIED',
  'WAITING_NODE',
  'OFFLINE_STOPPED',
] as const;

export type NodeAvailabilityState =
  (typeof NODE_AVAILABILITY_STATES)[number];

/**
 * Home Base integration path.
 */
export const HARDWARE_TRUTH_HOME_BASE_FLOW = [
  'asus_node',
  'virtual_chip_registry',
  'benchmark_memory',
  'workload_router',
  'agent_compute_decisions',
] as const;

/**
 * Privacy: probe must NOT inspect these.
 */
export const PROBE_MUST_NOT_INSPECT = [
  'personal_files',
  'browser_history',
  'passwords',
  'credentials',
  'documents',
  'photos',
  'contacts',
  'unrelated_running_process_contents',
  'precise_location',
] as const;

export type ProbeMustNotInspect = (typeof PROBE_MUST_NOT_INSPECT)[number];

export const LOCAL_HARDWARE_TRUTH_PROBE_CYCLE = [
  'honesty_locks',
  'hardware_truth_probe_bootstrap',
  // A — Structure
  'probe_fields_encoded',
  'truth_states_encoded',
  'state_progression_encoded',
  'machine_evidence_surfaces_encoded',
  'node_availability_states_encoded',
  'home_base_flow_encoded',
  'privacy_must_not_inspect_encoded',
  // B — Truth boundaries
  'no_unknown_to_verified_jump',
  'cpu_gpu_npu_independently_classified',
  'amd_cpu_neq_amd_npu',
  'radeon_gpu_neq_windows_ml_works',
  'installed_packages_neq_model_compatibility',
  'verified_requires_bounded_inference_or_benchmark',
  'accelerator_fallbacks_visible',
  'evidence_timestamped',
  'stale_profiles_stop_verified_scheduling',
  'fresh_heartbeat_required_for_availability',
  'sleep_shutdown_to_waiting_or_offline',
  // C — Privacy / safety
  'read_only_technical_metadata_only',
  'no_personal_files_or_credentials',
  'no_precise_location',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'ep5_soft_wire',
  'ep4_soft_wire',
  'ep1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep6Hop = (typeof LOCAL_HARDWARE_TRUTH_PROBE_CYCLE)[number];

export type Ep6EvidenceState =
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
  | 'STALE'
  | 'DETECTED'
  | 'SUPPORTED'
  | 'DEGRADED'
  | 'UNKNOWN';

export type Ep6HopRecord = {
  hop: Ep6Hop;
  state: Ep6EvidenceState;
  summary: string;
  at: string;
};

export type Ep6ActorKind =
  | 'hardware_probe'
  | 'node_agent'
  | 'scheduler_research'
  | 'virtual_chip_registry'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep6Actor = {
  kind: Ep6ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP6_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_HARDWARE_PROBE_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Progression honesty
  UNKNOWN_TO_VERIFIED_JUMP_ALLOWED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  SUPPORTED_EQ_VERIFIED: false as const,
  NOT_TESTED_EQ_VERIFIED: false as const,
  DOCUMENTED_EQ_LOCALLY_VERIFIED: false as const,

  // Independence
  AMD_CPU_EQ_AMD_NPU: false as const,
  RADEON_GPU_EQ_WINDOWS_ML_WORKS: false as const,
  INSTALLED_PACKAGES_EQ_MODEL_COMPATIBILITY: false as const,
  CPU_GPU_NPU_COLLAPSED_SINGLE_STATE: false as const,

  // Verification
  VERIFIED_WITHOUT_BOUNDED_INFERENCE_OR_BENCHMARK: false as const,
  STALE_INFLUENCES_VERIFIED_SCHEDULING: false as const,
  AVAILABLE_WITHOUT_FRESH_HEARTBEAT: false as const,

  // Privacy
  INSPECT_PERSONAL_FILES: false as const,
  INSPECT_BROWSER_HISTORY: false as const,
  INSPECT_PASSWORDS_CREDENTIALS: false as const,
  INSPECT_DOCUMENTS_PHOTOS_CONTACTS: false as const,
  INSPECT_UNRELATED_PROCESS_CONTENTS: false as const,
  COLLECT_PRECISE_LOCATION: false as const,

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

export const HARDWARE_PROBE_AGENT_BOUNDS = Object.freeze({
  mayCollectReadOnlyHardwareMetadata: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayJumpUnknownToVerified: false as const,
  mayInspectPersonalData: false as const,
  mayCollectPreciseLocation: false as const,
  mayRecommendOnly: true as const,
});

export const EP6_MAY = Object.freeze([
  'collect_read_only_hardware_metadata',
  'classify_cpu_gpu_npu_independently',
  'advance_states_along_progression',
  'mark_not_tested_degraded_unavailable_stale',
  'emit_machine_evidence_profile',
  'require_fresh_heartbeat_for_availability',
  'surface_accelerator_fallbacks',
  'timestamp_evidence',
  'stop_stale_from_verified_scheduling',
  'return_agent_evidence_to_home_base',
] as const);

export const EP6_MUST_NOT = Object.freeze([
  'jump_unknown_to_verified',
  'equate_detected_with_verified',
  'equate_amd_cpu_with_amd_npu',
  'equate_radeon_gpu_with_windows_ml_works',
  'equate_installed_packages_with_model_compatibility',
  'verify_without_bounded_inference_or_benchmark',
  'let_stale_influence_verified_scheduling',
  'mark_available_without_fresh_heartbeat',
  'inspect_personal_files',
  'inspect_browser_history',
  'inspect_passwords_credentials',
  'inspect_documents_photos_contacts',
  'inspect_unrelated_process_contents',
  'collect_precise_location',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ep6SoftWireSnapshot = {
  ep5BenchmarkMemory: SoftWirePresence;
  ep5Report: SoftWirePresence;
  ep4IpFirewall: SoftWirePresence;
  ep4Report: SoftWirePresence;
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp6LocksIntact(): boolean {
  return (
    EP6_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP6_LOCKS.UNKNOWN_TO_VERIFIED_JUMP_ALLOWED === false &&
    EP6_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EP6_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    EP6_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
    EP6_LOCKS.DOCUMENTED_EQ_LOCALLY_VERIFIED === false &&
    EP6_LOCKS.AMD_CPU_EQ_AMD_NPU === false &&
    EP6_LOCKS.RADEON_GPU_EQ_WINDOWS_ML_WORKS === false &&
    EP6_LOCKS.INSTALLED_PACKAGES_EQ_MODEL_COMPATIBILITY === false &&
    EP6_LOCKS.CPU_GPU_NPU_COLLAPSED_SINGLE_STATE === false &&
    EP6_LOCKS.VERIFIED_WITHOUT_BOUNDED_INFERENCE_OR_BENCHMARK === false &&
    EP6_LOCKS.STALE_INFLUENCES_VERIFIED_SCHEDULING === false &&
    EP6_LOCKS.AVAILABLE_WITHOUT_FRESH_HEARTBEAT === false &&
    EP6_LOCKS.INSPECT_PERSONAL_FILES === false &&
    EP6_LOCKS.INSPECT_BROWSER_HISTORY === false &&
    EP6_LOCKS.INSPECT_PASSWORDS_CREDENTIALS === false &&
    EP6_LOCKS.INSPECT_DOCUMENTS_PHOTOS_CONTACTS === false &&
    EP6_LOCKS.INSPECT_UNRELATED_PROCESS_CONTENTS === false &&
    EP6_LOCKS.COLLECT_PRECISE_LOCATION === false &&
    EP6_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP6_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP6_LOCKS.RECOMMEND_EQ_DEPLOY === false &&
    EP6_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP6_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP6_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP6_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP6_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP6_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP6_LOCKS.TIP_LAND === false &&
    EP6_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP6_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP6_LOCKS.FULL_PRODUCTION_HARDWARE_PROBE_SHIPPED === false &&
    EP6_LOCKS.MANAGE_PULL_REQUEST === false &&
    HARDWARE_PROBE_AGENT_BOUNDS.automaticAuthority === false &&
    HARDWARE_PROBE_AGENT_BOUNDS.mayJumpUnknownToVerified === false &&
    HARDWARE_PROBE_AGENT_BOUNDS.mayInspectPersonalData === false &&
    HARDWARE_PROBE_AGENT_BOUNDS.mayCollectPreciseLocation === false
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

export function ep6SoftWireSnapshot(repoRoot?: string): Ep6SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
    ep4IpFirewall: softWireFile(
      './proprietary-ip-firewall-types.ts',
      'EP4 Proprietary-IP Firewall PRESENT (soft-wire).',
      'EP4 Proprietary-IP Firewall absent — soft-wire WAITING_DATA.',
    ),
    ep4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP4_PROPRIETARY_IP_FIREWALL_REPORT.md',
      'EP4 report PRESENT.',
      'EP4 report absent — soft-wire WAITING_DATA.',
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

export function isHumanApprover(actor: Ep6Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isHardwareProbeAgent(actor: Ep6Actor): boolean {
  const agents: readonly Ep6ActorKind[] = [
    'hardware_probe',
    'node_agent',
    'scheduler_research',
    'virtual_chip_registry',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Legal next states from a progression state (no UNKNOWN→VERIFIED jump).
 */
export function allowedProgressionTargets(
  from: HardwareTruthState,
): readonly HardwareTruthState[] {
  if (from === 'UNKNOWN') {
    return ['DETECTED', 'UNAVAILABLE', 'STALE', 'NOT_TESTED'] as const;
  }
  if (from === 'DETECTED') {
    return [
      'SUPPORTED',
      'NOT_TESTED',
      'DEGRADED',
      'UNAVAILABLE',
      'STALE',
    ] as const;
  }
  if (from === 'SUPPORTED') {
    return [
      'VERIFIED',
      'NOT_TESTED',
      'DEGRADED',
      'UNAVAILABLE',
      'STALE',
    ] as const;
  }
  if (from === 'VERIFIED') {
    return ['DEGRADED', 'UNAVAILABLE', 'STALE', 'NOT_TESTED'] as const;
  }
  if (from === 'NOT_TESTED') {
    return [
      'DETECTED',
      'SUPPORTED',
      'DEGRADED',
      'UNAVAILABLE',
      'STALE',
    ] as const;
  }
  if (from === 'DEGRADED') {
    return ['SUPPORTED', 'VERIFIED', 'UNAVAILABLE', 'STALE', 'NOT_TESTED'] as const;
  }
  if (from === 'UNAVAILABLE') {
    return ['UNKNOWN', 'DETECTED', 'STALE'] as const;
  }
  // STALE
  return ['UNKNOWN', 'DETECTED', 'UNAVAILABLE'] as const;
}

export function canAdvanceHardwareState(
  from: HardwareTruthState,
  to: HardwareTruthState,
): boolean {
  if (from === to) return true;
  // Explicit ban: never UNKNOWN → VERIFIED
  if (from === 'UNKNOWN' && to === 'VERIFIED') return false;
  return allowedProgressionTargets(from).includes(to);
}
