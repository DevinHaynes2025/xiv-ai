/**
 * 62L-ES-HC2 (#164) — Chip Bottleneck Analyzer (Hybrid Compute Superbrain track).
 *
 * Distinct from productization ES2 (Product Hypothesis Factory / test:62les2).
 * This is HC Superbrain track ES2 — Chip Bottleneck Analyzer — GitHub #164.
 *
 * Agents classify why a workload is slow, expensive, unstable, or power-hungry
 * from hardware/runtime evidence before proposing software-level optimizations.
 * Same analyzer across AMD/NVIDIA/Intel/ARM/Apple/Qualcomm — may improve
 * scheduling across CPU/GPU/NPU but must NOT claim to physically modify silicon.
 *
 * Core flow: Workload → hardware/runtime evidence → bottleneck classification →
 * baseline → candidate fixes → sandbox benchmark → recommendation → XIV Home Base.
 *
 * Soft-wire when PRESENT: HC1 Hybrid Compute Home Base, ER34 capability
 * manifest, ER29–ER32 runtimes. Presence ≠ VERIFIED; absent → WAITING_DATA
 * (not FAIL).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. No overclocking/BIOS/firmware/voltage/thermal
 * bypass/driver replacement/privilege escalation. Untested = NOT_TESTED.
 * Improvement claim requires baseline vs candidate benchmark.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): ES3 — Cross-Vendor Chip Path Graph.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 164 as const;
export const GITHUB_SOT_LABEL = '62L-ES-HC2' as const;
export const GITHUB_SOT_FAMILY = '62L-ES-HC' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES-HC2 Chip Bottleneck Analyzer — classify compute/memory/I-O/network/runtime/model-compat/queue/thermal/data-transfer bottlenecks from evidence; software-level candidate fixes only; baseline-vs-benchmark required for IMPROVED; silicon-modify denied' as const;

export const TRACK_DISTINCTNESS_NOTE =
  'HC Superbrain track #164 (62L-ES-HC2 Chip Bottleneck Analyzer) — distinct from productization ES2 Product Hypothesis Factory / test:62les2. Do not overwrite productization ES* naming.' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const HC2_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'ES3 — Cross-Vendor Chip Path Graph — map portable software paths across vendor chips without claiming silicon modification.' as const;

/**
 * Inspection dimensions agents may observe.
 */
export const INSPECTION_DIMENSIONS = [
  'cpu_saturation',
  'gpu_npu_utilization',
  'memory_bandwidth',
  'vram_ram_pressure',
  'cache_misses_efficiency',
  'model_load_time',
  'operator_kernel_compatibility',
  'quantization_precision_mismatch',
  'batch_size',
  'queue_depth',
  'io_latency',
  'storage_throughput',
  'network_latency',
  'api_provider_latency',
  'thermal_resource_pressure',
  'power_battery',
  'sync_overhead',
  'cpu_gpu_npu_transfer_overhead',
] as const;

export type InspectionDimension = (typeof INSPECTION_DIMENSIONS)[number];

/**
 * Bottleneck classification states.
 */
export const BOTTLENECK_STATES = [
  'COMPUTE_BOUND',
  'MEMORY_BOUND',
  'I_O_BOUND',
  'NETWORK_BOUND',
  'RUNTIME_BOUND',
  'MODEL_COMPATIBILITY_BOUND',
  'QUEUE_BOUND',
  'THERMAL_RESOURCE_BOUND',
  'DATA_TRANSFER_BOUND',
  'UNKNOWN',
] as const;

export type BottleneckState = (typeof BOTTLENECK_STATES)[number];

/**
 * Core analysis flow.
 */
export const ANALYZER_CORE_FLOW = [
  'workload',
  'hardware_runtime_evidence',
  'bottleneck_classification',
  'baseline',
  'candidate_fixes',
  'sandbox_benchmark',
  'recommendation',
  'xiv_home_base',
] as const;

/**
 * Analysis tracking fields.
 */
export const ANALYSIS_FIELDS = [
  'analysisId',
  'workloadId',
  'node_device',
  'architecture_vendor',
  'model_runtime',
  'observed_metrics',
  'suspected_bottleneck',
  'confidence',
  'evidence_refs',
  'baseline_performance',
  'candidate_optimizations',
  'expected_tradeoffs',
  'actual_benchmark_results',
  'final_classification',
] as const;

export type AnalysisField = (typeof ANALYSIS_FIELDS)[number];

/**
 * Software-level candidate fixes (never silicon/firmware).
 */
export const CANDIDATE_FIXES = [
  'smaller_better_model',
  'quantization',
  'batching',
  'model_session_reuse',
  'caching',
  'operator_runtime_change',
  'graph_fusion',
  'memory_layout',
  'queue_tuning',
  'workload_partitioning',
  'cpu_gpu_npu_reassignment',
  'local_edge_cloud_placement_change',
] as const;

export type CandidateFix = (typeof CANDIDATE_FIXES)[number];

/**
 * Vendors — same analyzer; no silicon modification claims.
 */
export const SUPPORTED_VENDORS = [
  'AMD',
  'NVIDIA',
  'Intel',
  'ARM',
  'Apple',
  'Qualcomm',
  'other',
] as const;

export type SupportedVendor = (typeof SUPPORTED_VENDORS)[number];

/**
 * Benchmark honesty states.
 */
export const BENCHMARK_RESULT_STATES = [
  'NOT_TESTED',
  'BASELINE_RECORDED',
  'CANDIDATE_RUN',
  'IMPROVED',
  'NO_ADVANTAGE',
  'REGRESSED',
  'DENIED',
] as const;

export type BenchmarkResultState = (typeof BENCHMARK_RESULT_STATES)[number];

/**
 * Hard safety / silicon boundary — never crossed.
 */
export const SAFETY_BOUNDARIES = [
  'no_overclocking',
  'no_bios_firmware',
  'no_voltage_changes',
  'no_thermal_limit_bypass',
  'no_driver_replacement',
  'no_privilege_escalation',
  'no_physical_silicon_modification',
  'software_usage_of_hardware_only',
] as const;

export type SafetyBoundary = (typeof SAFETY_BOUNDARIES)[number];

export const SILICON_MODIFY_CLAIM_SIGNALS = [
  'physically_modify_silicon',
  'rewrite_chip_microcode',
  'change_transistor_layout',
  'flash_gpu_vbios_for_clocks',
  'overclock_silicon',
  'undervolt_silicon',
  'bypass_thermal_limits_in_firmware',
] as const;

export const CHIP_BOTTLENECK_ANALYZER_CYCLE = [
  'honesty_locks',
  'chip_bottleneck_analyzer_bootstrap',
  // A — Structure
  'inspection_dimensions_encoded',
  'bottleneck_states_encoded',
  'core_flow_encoded',
  'analysis_fields_encoded',
  'candidate_fixes_encoded',
  'vendor_neutral_analyzer_encoded',
  'safety_boundaries_encoded',
  // B — Classification truth
  'classify_from_evidence',
  'transfer_bound_example_encoded',
  'blind_gpu_move_denied_when_transfer_bound',
  // C — Evidence / honesty
  'baseline_required_before_improve_claim',
  'untested_is_not_tested',
  'improvement_without_benchmark_denied',
  // D — Safety denies
  'deny_silicon_modify_claims',
  'deny_overclocking',
  'deny_bios_firmware',
  'deny_voltage_changes',
  'deny_thermal_limit_bypass',
  'deny_driver_replacement',
  'deny_privilege_escalation',
  // E — Autonomy / home base
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  'return_to_xiv_home_base',
  // F — Soft-wires
  'hc1_soft_wire',
  'er34_soft_wire',
  'er32_soft_wire',
  'er31_soft_wire',
  'er30_soft_wire',
  'er29_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Hc2Hop = (typeof CHIP_BOTTLENECK_ANALYZER_CYCLE)[number];

export type Hc2EvidenceState =
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
  | 'UNKNOWN'
  | BottleneckState
  | BenchmarkResultState;

export type Hc2HopRecord = {
  hop: Hc2Hop;
  state: Hc2EvidenceState;
  summary: string;
  at: string;
};

export type Hc2ActorKind =
  | 'bottleneck_analyzer'
  | 'scheduler'
  | 'tuning_sandbox'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Hc2Actor = {
  kind: Hc2ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export type ObservedMetrics = {
  cpuUtilizationPct: number;
  gpuUtilizationPct: number;
  npuUtilizationPct: number;
  memoryBandwidthUtilPct: number;
  vramPressurePct: number;
  ramPressurePct: number;
  cacheMissRatePct: number;
  modelLoadTimeMs: number;
  operatorKernelCompatible: boolean;
  quantizationMismatch: boolean;
  batchSize: number;
  queueDepth: number;
  ioLatencyMs: number;
  storageThroughputMBps: number;
  networkLatencyMs: number;
  apiProviderLatencyMs: number;
  thermalPressurePct: number;
  powerDrawProxy: number;
  syncOverheadMs: number;
  transferOverheadMs: number;
};

export type BaselinePerformance = {
  latencyMs: number;
  throughputOps: number;
  energyProxy: number;
  qualityProxy: number;
  recorded: boolean;
};

export type CandidateOptimization = {
  fix: CandidateFix;
  expectedTradeoffs: readonly string[];
  tested: boolean;
};

export type BenchmarkResult = {
  state: BenchmarkResultState;
  baselineLatencyMs: number | null;
  candidateLatencyMs: number | null;
  deltaPct: number | null;
  evidenceRefs: readonly string[];
};

export type ChipBottleneckAnalysis = {
  analysisId: string;
  workloadId: string;
  nodeDevice: string;
  architecture: string;
  vendor: SupportedVendor;
  modelRuntime: string;
  observedMetrics: ObservedMetrics;
  suspectedBottleneck: BottleneckState;
  confidence: number;
  evidenceRefs: readonly string[];
  baselinePerformance: BaselinePerformance | null;
  candidateOptimizations: readonly CandidateOptimization[];
  expectedTradeoffs: readonly string[];
  actualBenchmarkResults: BenchmarkResult | null;
  finalClassification: BottleneckState;
  recommendation: string | null;
  improvementClaim: 'IMPROVED' | 'NOT_TESTED' | 'DENIED' | 'NO_CLAIM';
  siliconModifyClaimed: false;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export const HC2_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  MANAGE_PULL_REQUEST: false as const,
  FULL_PRODUCTION_ANALYZER_SHIPPED: false as const,

  // Silicon / hardware internals
  MAY_PHYSICALLY_MODIFY_SILICON: false as const,
  MAY_OVERCLOCK: false as const,
  MAY_MODIFY_BIOS_FIRMWARE: false as const,
  MAY_CHANGE_VOLTAGE: false as const,
  MAY_BYPASS_THERMAL_LIMITS: false as const,
  MAY_REPLACE_DRIVERS: false as const,
  MAY_ESCALATE_PRIVILEGE: false as const,

  // Honesty
  IMPROVEMENT_WITHOUT_BENCHMARK: false as const,
  UNTESTED_EQ_IMPROVED: false as const,
  BLIND_GPU_MOVE_WHEN_TRANSFER_BOUND: false as const,
  PRESENCE_EQ_VERIFIED: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_ANALYZER: false as const,

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

export const BOTTLENECK_ANALYZER_BOUNDS = Object.freeze({
  mayClassifyBottlenecksFromEvidence: true as const,
  mayProposeSoftwareCandidateFixes: true as const,
  mayRecordBaselineAndSandboxBenchmark: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  mayScheduleAcrossCpuGpuNpu: true as const,
  automaticAuthority: false as const,
  mayPhysicallyModifySilicon: false as const,
  mayOverclockOrChangeVoltage: false as const,
  mayModifyBiosFirmware: false as const,
  mayBypassThermalLimits: false as const,
  mayReplaceDrivers: false as const,
  mayEscalatePrivilege: false as const,
  mayClaimImprovedWithoutBenchmark: false as const,
  mayTreatUntestedAsImproved: false as const,
  mayBlindGpuMoveWhenTransferBound: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const HC2_MAY = Object.freeze([
  'inspect_cpu_gpu_npu_memory_io_network_thermal_transfer_metrics',
  'classify_bottleneck_states_from_evidence',
  'propose_software_level_candidate_fixes',
  'require_baseline_vs_candidate_benchmark_before_IMPROVED',
  'label_untested_candidates_NOT_TESTED',
  'return_recommendation_to_xiv_home_base',
  'use_same_analyzer_across_amd_nvidia_intel_arm_apple_qualcomm',
] as const);

export const HC2_MUST_NOT = Object.freeze([
  'physically_modify_silicon',
  'overclock_or_change_voltage',
  'modify_bios_or_firmware',
  'bypass_thermal_limits',
  'replace_drivers',
  'escalate_privilege',
  'claim_IMPROVED_without_baseline_vs_candidate_benchmark',
  'treat_NOT_TESTED_as_IMPROVED',
  'blindly_move_workload_to_gpu_when_DATA_TRANSFER_BOUND',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Hc2SoftWireSnapshot = {
  hc1HybridComputeHomeBase: SoftWirePresence;
  hc1Report: SoftWirePresence;
  er34CapabilityManifest: SoftWirePresence;
  er34Report: SoftWirePresence;
  er32ServerEdgeRuntimePackage: SoftWirePresence;
  er32Report: SoftWirePresence;
  er31AppleDeviceRuntimePackage: SoftWirePresence;
  er31Report: SoftWirePresence;
  er30AndroidArmRuntimePackage: SoftWirePresence;
  er30Report: SoftWirePresence;
  er29WindowsRuntimePackage: SoftWirePresence;
  er29Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertHc2LocksIntact(): boolean {
  return (
    HC2_LOCKS.L4_AUTONOMY_ENABLED === false &&
    HC2_LOCKS.MAY_PHYSICALLY_MODIFY_SILICON === false &&
    HC2_LOCKS.MAY_OVERCLOCK === false &&
    HC2_LOCKS.MAY_MODIFY_BIOS_FIRMWARE === false &&
    HC2_LOCKS.MAY_CHANGE_VOLTAGE === false &&
    HC2_LOCKS.MAY_BYPASS_THERMAL_LIMITS === false &&
    HC2_LOCKS.MAY_REPLACE_DRIVERS === false &&
    HC2_LOCKS.MAY_ESCALATE_PRIVILEGE === false &&
    HC2_LOCKS.IMPROVEMENT_WITHOUT_BENCHMARK === false &&
    HC2_LOCKS.UNTESTED_EQ_IMPROVED === false &&
    HC2_LOCKS.BLIND_GPU_MOVE_WHEN_TRANSFER_BOUND === false &&
    HC2_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    HC2_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    HC2_LOCKS.RECOMMEND_EQ_ACT === false &&
    HC2_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    HC2_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_ANALYZER === false &&
    HC2_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    HC2_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    HC2_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    HC2_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    HC2_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    HC2_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    HC2_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    HC2_LOCKS.TIP_LAND === false &&
    HC2_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    HC2_LOCKS.DB_CANDIDATES_APPLIED === false &&
    HC2_LOCKS.FULL_PRODUCTION_ANALYZER_SHIPPED === false &&
    HC2_LOCKS.MANAGE_PULL_REQUEST === false &&
    BOTTLENECK_ANALYZER_BOUNDS.automaticAuthority === false &&
    BOTTLENECK_ANALYZER_BOUNDS.mayPhysicallyModifySilicon === false &&
    BOTTLENECK_ANALYZER_BOUNDS.mayClaimImprovedWithoutBenchmark === false &&
    BOTTLENECK_ANALYZER_BOUNDS.mayTreatUntestedAsImproved === false &&
    BOTTLENECK_ANALYZER_BOUNDS.mayBlindGpuMoveWhenTransferBound === false &&
    BOTTLENECK_ANALYZER_BOUNDS.mayIncludeHiddenChainOfThought === false
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
 * Soft-wire presence probe. Presence ≠ VERIFIED.
 * Absent → WAITING_DATA (caller maps via softWireHopState).
 */
export function hc2SoftWireSnapshot(repoRoot?: string): Hc2SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    hc1HybridComputeHomeBase: softWireFile(
      './hybrid-compute-home-base-types.ts',
      'HC1 Hybrid Compute Home Base PRESENT (soft-wire).',
      'HC1 Hybrid Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
    hc1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES_HC1_HYBRID_COMPUTE_HOME_BASE_REPORT.md',
      'HC1 report PRESENT.',
      'HC1 report absent — soft-wire WAITING_DATA.',
    ),
    er34CapabilityManifest: softWireFile(
      './capability-manifest-types.ts',
      'ER34 Capability Manifest PRESENT (soft-wire).',
      'ER34 Capability Manifest absent — soft-wire WAITING_DATA.',
    ),
    er34Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER34_CAPABILITY_MANIFEST_REPORT.md',
      'ER34 report PRESENT.',
      'ER34 report absent — soft-wire WAITING_DATA.',
    ),
    er32ServerEdgeRuntimePackage: softWireFile(
      './server-edge-runtime-package-types.ts',
      'ER32 Server/Edge Runtime Package PRESENT (soft-wire).',
      'ER32 Server/Edge Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er32Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER32_SERVER_EDGE_RUNTIME_PACKAGE_REPORT.md',
      'ER32 report PRESENT.',
      'ER32 report absent — soft-wire WAITING_DATA.',
    ),
    er31AppleDeviceRuntimePackage: softWireFile(
      './apple-device-runtime-package-types.ts',
      'ER31 Apple Device Runtime Package PRESENT (soft-wire).',
      'ER31 Apple Device Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er31Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER31_APPLE_DEVICE_RUNTIME_PACKAGE_REPORT.md',
      'ER31 report PRESENT.',
      'ER31 report absent — soft-wire WAITING_DATA.',
    ),
    er30AndroidArmRuntimePackage: softWireFile(
      './android-arm-runtime-package-types.ts',
      'ER30 Android ARM Runtime Package PRESENT (soft-wire).',
      'ER30 Android ARM Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er30Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER30_ANDROID_ARM_RUNTIME_PACKAGE_CANDIDATE_REPORT.md',
      'ER30 report PRESENT.',
      'ER30 report absent — soft-wire WAITING_DATA.',
    ),
    er29WindowsRuntimePackage: softWireFile(
      './windows-runtime-package-types.ts',
      'ER29 Windows Runtime Package PRESENT (soft-wire).',
      'ER29 Windows Runtime Package absent — soft-wire WAITING_DATA.',
    ),
    er29Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER29_WINDOWS_RUNTIME_PACKAGE_REPORT.md',
      'ER29 report PRESENT.',
      'ER29 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): 'PASS' | 'WAITING_DATA' {
  return present ? 'PASS' : 'WAITING_DATA';
}

export function isHumanApprover(actor: Hc2Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isBottleneckAnalyzerAgent(actor: Hc2Actor): boolean {
  const agents: readonly Hc2ActorKind[] = [
    'bottleneck_analyzer',
    'scheduler',
    'tuning_sandbox',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

export function canClaimImproved(input: {
  baselineRecorded: boolean;
  candidateBenchmarked: boolean;
  improvedMeasured: boolean;
}): boolean {
  if (HC2_LOCKS.IMPROVEMENT_WITHOUT_BENCHMARK) return false;
  return (
    input.baselineRecorded &&
    input.candidateBenchmarked &&
    input.improvedMeasured
  );
}
