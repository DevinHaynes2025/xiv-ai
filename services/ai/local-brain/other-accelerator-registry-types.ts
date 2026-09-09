/**
 * 62L-EP10 — Other Accelerator Registry (park-and-implement).
 *
 * Universal registry for additional accelerators so the Virtual Chip layer can
 * support Apple, Qualcomm, edge-AI silicon, cloud accelerators, automotive
 * compute, and future providers through the same evidence-first contract.
 *
 * Core rule: every vendor follows the same evidence standard. XIV should not
 * favor or trust a chip simply because of the manufacturer name.
 *
 * Automotive: documented platforms may be represented; capabilities remain
 * research/simulation until a specific authorized vehicle/platform is tested.
 * Cloud: registry presence ≠ spending or data movement authorization.
 * Quantum: THEORETICAL | SIMULATED | QUANTUM_INSPIRED | PHYSICAL_QPU_VERIFIED.
 * Registry presence ≠ partnership, certification, hardware access, or compatibility.
 *
 * Soft-wire when PRESENT: EP9, EP8, EP7, EP5, EP1, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #160 / 62L-EP family. GitLab mirror: not resolved (needsAuth;
 * no issue number invented).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe enforced.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EP11 — Virtual Instruction / Task Envelope.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP10' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP10 Other Accelerator Registry — universal evidence-first registry for Apple/Qualcomm/edge/automotive/cloud/ASIC/future QPU accelerators without manufacturer favoritism' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP10_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP11 — Virtual Instruction / Task Envelope — turn an agent mission into a device-neutral compute instruction that can be routed safely across any verified accelerator.' as const;

/**
 * Initial accelerator categories.
 */
export const ACCELERATOR_CATEGORIES = [
  'apple_cpu_gpu_neural_engine',
  'qualcomm_cpu_gpu_hexagon_npu',
  'arm_based_edge_accelerators',
  'automotive_adas_compute',
  'industrial_ai_accelerators',
  'cloud_inference_accelerators',
  'specialized_inference_asics',
  'future_qpu_providers',
] as const;

export type AcceleratorCategory = (typeof ACCELERATOR_CATEGORIES)[number];

/**
 * Provider / device record fields.
 */
export const ACCELERATOR_RECORD_FIELDS = [
  'providerId',
  'deviceFamily',
  'deviceModel',
  'deviceType',
  'architecture',
  'runtimeSdk',
  'supportedOs',
  'modelFormats',
  'supportedPrecisions',
  'memory',
  'documentedCapabilities',
  'measuredCapabilities',
  'privacyLocality',
  'costEnergyProxy',
  'benchmarkRefs',
  'verificationState',
  'lastVerifiedAt',
] as const;

export type AcceleratorRecordField =
  (typeof ACCELERATOR_RECORD_FIELDS)[number];

/**
 * Truth progression + adjacent states.
 * UNKNOWN → DOCUMENTED → DETECTED → SUPPORTED → VERIFIED
 */
export const ACCELERATOR_TRUTH_STATES = [
  'UNKNOWN',
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'NOT_TESTED',
  'DEGRADED',
  'UNAVAILABLE',
] as const;

export type AcceleratorTruthState =
  (typeof ACCELERATOR_TRUTH_STATES)[number];

export const ACCELERATOR_STATE_PROGRESSION = [
  'UNKNOWN',
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
] as const;

/**
 * Extra quantum ladder states (future QPU providers).
 */
export const QUANTUM_LADDER_STATES = [
  'THEORETICAL',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QuantumLadderState = (typeof QUANTUM_LADDER_STATES)[number];

/**
 * Cloud usability preconditions (registry ≠ usable).
 */
export const CLOUD_USABILITY_PRECONDITIONS = [
  'explicit_organization_authorization',
  'credentials_present',
  'region_data_policy_approval',
  'measured_runtime_evidence',
] as const;

export type CloudUsabilityPrecondition =
  (typeof CLOUD_USABILITY_PRECONDITIONS)[number];

/**
 * Automotive posture until authorized vehicle/platform tested.
 */
export const AUTOMOTIVE_CAPABILITY_POSTURES = [
  'RESEARCH',
  'SIMULATION',
  'AUTHORIZED_PLATFORM_TESTED',
] as const;

export type AutomotiveCapabilityPosture =
  (typeof AUTOMOTIVE_CAPABILITY_POSTURES)[number];

export const OTHER_ACCELERATOR_REGISTRY_CYCLE = [
  'honesty_locks',
  'other_accelerator_registry_bootstrap',
  // A — Structure
  'categories_encoded',
  'record_fields_encoded',
  'truth_states_encoded',
  'state_progression_encoded',
  'quantum_ladder_encoded',
  'cloud_usability_preconditions_encoded',
  'automotive_postures_encoded',
  // B — Truth boundaries
  'same_evidence_standard_all_vendors',
  'no_manufacturer_name_favoritism',
  'registry_presence_neq_partnership_or_access',
  'documented_neq_verified',
  'automotive_research_until_authorized_tested',
  'cloud_presence_neq_spend_or_data_movement',
  'cloud_usable_requires_all_preconditions',
  'quantum_ladder_enforced',
  // C — Safety
  'no_autonomous_cloud_spend',
  'no_autonomous_data_movement',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'ep9_soft_wire',
  'ep8_soft_wire',
  'ep7_soft_wire',
  'ep5_soft_wire',
  'ep1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep10Hop = (typeof OTHER_ACCELERATOR_REGISTRY_CYCLE)[number];

export type Ep10EvidenceState =
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

export type Ep10HopRecord = {
  hop: Ep10Hop;
  state: Ep10EvidenceState;
  summary: string;
  at: string;
};

export type Ep10ActorKind =
  | 'accelerator_registry'
  | 'runtime_research'
  | 'virtual_chip_registry'
  | 'benchmark_agent'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep10Actor = {
  kind: Ep10ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP10_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_ACCELERATOR_REGISTRY_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Evidence equality
  MANUFACTURER_NAME_EQ_TRUST: false as const,
  VENDOR_FAVORITISM_ALLOWED: false as const,
  REGISTRY_PRESENCE_EQ_PARTNERSHIP: false as const,
  REGISTRY_PRESENCE_EQ_CERTIFICATION: false as const,
  REGISTRY_PRESENCE_EQ_HARDWARE_ACCESS: false as const,
  REGISTRY_PRESENCE_EQ_COMPATIBILITY: false as const,
  DOCUMENTED_EQ_VERIFIED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  SUPPORTED_EQ_VERIFIED: false as const,

  // Automotive
  AUTOMOTIVE_DOCUMENTED_EQ_AUTHORIZED_TESTED: false as const,
  AUTOMOTIVE_SIMULATION_EQ_VERIFIED: false as const,

  // Cloud
  CLOUD_REGISTRY_EQ_SPEND_AUTHORIZED: false as const,
  CLOUD_REGISTRY_EQ_DATA_MOVEMENT_AUTHORIZED: false as const,
  CLOUD_USABLE_WITHOUT_PRECONDITIONS: false as const,
  AUTONOMOUS_CLOUD_SPEND: false as const,
  AUTONOMOUS_DATA_MOVEMENT: false as const,

  // Quantum
  THEORETICAL_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  SIMULATED_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  QUANTUM_INSPIRED_EQ_PHYSICAL_QPU_VERIFIED: false as const,

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

export const ACCELERATOR_REGISTRY_AGENT_BOUNDS = Object.freeze({
  mayRegisterDocumentedProviders: true as const,
  mayRecordMeasuredCapabilities: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayFavorManufacturerByName: false as const,
  mayTreatRegistryAsPartnership: false as const,
  mayAuthorizeCloudSpendFromRegistry: false as const,
  mayMoveDataFromRegistryPresence: false as const,
  mayClaimAutomotiveVerifiedWithoutAuthorizedTest: false as const,
  mayEquateTheoreticalWithPhysicalQpu: false as const,
  mayRecommendOnly: true as const,
});

export const EP10_MAY = Object.freeze([
  'register_accelerator_providers_equally',
  'encode_categories_and_record_fields',
  'advance_truth_states_along_progression',
  'keep_automotive_as_research_simulation_until_tested',
  'gate_cloud_usability_on_preconditions',
  'apply_quantum_ladder_states',
  'cite_benchmark_refs_without_vendor_favoritism',
  'return_registry_evidence_to_home_base',
] as const);

export const EP10_MUST_NOT = Object.freeze([
  'favor_vendor_by_manufacturer_name',
  'imply_partnership_from_registry_presence',
  'imply_certification_from_registry_presence',
  'imply_hardware_access_from_registry_presence',
  'imply_compatibility_from_registry_presence',
  'equate_documented_with_verified',
  'treat_automotive_documented_as_authorized_tested',
  'authorize_cloud_spend_from_registry_presence',
  'authorize_data_movement_from_registry_presence',
  'use_cloud_without_usability_preconditions',
  'equate_theoretical_or_simulated_with_physical_qpu_verified',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ep10SoftWireSnapshot = {
  ep9IntelAdapter: SoftWirePresence;
  ep9Report: SoftWirePresence;
  ep8NvidiaAdapter: SoftWirePresence;
  ep8Report: SoftWirePresence;
  ep7AmdAdapter: SoftWirePresence;
  ep7Report: SoftWirePresence;
  ep5BenchmarkMemory: SoftWirePresence;
  ep5Report: SoftWirePresence;
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEp10LocksIntact(): boolean {
  return (
    EP10_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP10_LOCKS.MANUFACTURER_NAME_EQ_TRUST === false &&
    EP10_LOCKS.VENDOR_FAVORITISM_ALLOWED === false &&
    EP10_LOCKS.REGISTRY_PRESENCE_EQ_PARTNERSHIP === false &&
    EP10_LOCKS.REGISTRY_PRESENCE_EQ_CERTIFICATION === false &&
    EP10_LOCKS.REGISTRY_PRESENCE_EQ_HARDWARE_ACCESS === false &&
    EP10_LOCKS.REGISTRY_PRESENCE_EQ_COMPATIBILITY === false &&
    EP10_LOCKS.DOCUMENTED_EQ_VERIFIED === false &&
    EP10_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EP10_LOCKS.SUPPORTED_EQ_VERIFIED === false &&
    EP10_LOCKS.AUTOMOTIVE_DOCUMENTED_EQ_AUTHORIZED_TESTED === false &&
    EP10_LOCKS.AUTOMOTIVE_SIMULATION_EQ_VERIFIED === false &&
    EP10_LOCKS.CLOUD_REGISTRY_EQ_SPEND_AUTHORIZED === false &&
    EP10_LOCKS.CLOUD_REGISTRY_EQ_DATA_MOVEMENT_AUTHORIZED === false &&
    EP10_LOCKS.CLOUD_USABLE_WITHOUT_PRECONDITIONS === false &&
    EP10_LOCKS.AUTONOMOUS_CLOUD_SPEND === false &&
    EP10_LOCKS.AUTONOMOUS_DATA_MOVEMENT === false &&
    EP10_LOCKS.THEORETICAL_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EP10_LOCKS.SIMULATED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EP10_LOCKS.QUANTUM_INSPIRED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EP10_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP10_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP10_LOCKS.RECOMMEND_EQ_DEPLOY === false &&
    EP10_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP10_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP10_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EP10_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP10_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP10_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP10_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP10_LOCKS.TIP_LAND === false &&
    EP10_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP10_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP10_LOCKS.FULL_PRODUCTION_ACCELERATOR_REGISTRY_SHIPPED === false &&
    EP10_LOCKS.MANAGE_PULL_REQUEST === false &&
    ACCELERATOR_REGISTRY_AGENT_BOUNDS.automaticAuthority === false &&
    ACCELERATOR_REGISTRY_AGENT_BOUNDS.mayFavorManufacturerByName === false &&
    ACCELERATOR_REGISTRY_AGENT_BOUNDS.mayTreatRegistryAsPartnership === false &&
    ACCELERATOR_REGISTRY_AGENT_BOUNDS.mayAuthorizeCloudSpendFromRegistry ===
      false &&
    ACCELERATOR_REGISTRY_AGENT_BOUNDS.mayMoveDataFromRegistryPresence ===
      false &&
    ACCELERATOR_REGISTRY_AGENT_BOUNDS
      .mayClaimAutomotiveVerifiedWithoutAuthorizedTest === false &&
    ACCELERATOR_REGISTRY_AGENT_BOUNDS.mayEquateTheoreticalWithPhysicalQpu ===
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

export function ep10SoftWireSnapshot(repoRoot?: string): Ep10SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    ep9IntelAdapter: softWireFile(
      './intel-adapter-research-path-types.ts',
      'EP9 Intel Adapter Research Path PRESENT (soft-wire).',
      'EP9 Intel Adapter Research Path absent — soft-wire WAITING_DATA.',
    ),
    ep9Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EP9_INTEL_ADAPTER_RESEARCH_PATH_REPORT.md',
      'EP9 report PRESENT.',
      'EP9 report absent — soft-wire WAITING_DATA.',
    ),
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

export function isHumanApprover(actor: Ep10Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isAcceleratorRegistryAgent(actor: Ep10Actor): boolean {
  const agents: readonly Ep10ActorKind[] = [
    'accelerator_registry',
    'runtime_research',
    'virtual_chip_registry',
    'benchmark_agent',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Same evidence standard — manufacturer name never changes trust rank alone.
 */
export function evidenceTrustRank(
  state: AcceleratorTruthState,
  _manufacturerName?: string,
): number {
  void _manufacturerName; // explicitly ignored — no favoritism
  const order: Record<AcceleratorTruthState, number> = {
    VERIFIED: 0,
    SUPPORTED: 1,
    DETECTED: 2,
    DOCUMENTED: 3,
    NOT_TESTED: 4,
    DEGRADED: 5,
    UNAVAILABLE: 6,
    UNKNOWN: 7,
  };
  return order[state] ?? 99;
}

export function canAdvanceAcceleratorState(
  from: AcceleratorTruthState,
  to: AcceleratorTruthState,
): boolean {
  if (from === to) return true;
  // No jump UNKNOWN → VERIFIED or DOCUMENTED → VERIFIED
  if (from === 'UNKNOWN' && to === 'VERIFIED') return false;
  if (from === 'DOCUMENTED' && to === 'VERIFIED') return false;
  const progression = [...ACCELERATOR_STATE_PROGRESSION];
  const fi = progression.indexOf(from as (typeof progression)[number]);
  const ti = progression.indexOf(to as (typeof progression)[number]);
  if (fi >= 0 && ti >= 0) return ti === fi + 1 || ti <= fi;
  // Adjacent states
  const adjacent: AcceleratorTruthState[] = [
    'NOT_TESTED',
    'DEGRADED',
    'UNAVAILABLE',
  ];
  return adjacent.includes(to) || adjacent.includes(from);
}
