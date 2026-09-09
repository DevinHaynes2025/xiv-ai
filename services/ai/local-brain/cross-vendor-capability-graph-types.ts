/**
 * 62L-EP2 — Cross-Vendor Capability Graph (park-and-implement).
 *
 * One searchable capability graph across major chip vendors so agents can
 * understand what each CPU/GPU/NPU/accelerator can actually do, which
 * runtimes it supports, and where evidence is still missing.
 *
 * Core honesty: public documentation ≠ XIV runtime verification.
 * DOCUMENTED ≠ DETECTED ≠ SUPPORTED ≠ VERIFIED.
 *
 * SoT: GitHub #160 / 62L-EP family (authoritative per founder). GitLab
 * mirror: not resolved in this environment (GitLab MCP needsAuth; no issue
 * number invented).
 *
 * Soft-wire when PRESENT: EP1 Virtual Chip Contract, EO11, EM (#157).
 * Presence ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 * Proprietary-IP boundary: no leaked schematics, firmware keys, confidential
 * design files, trade secrets, private source code, or restricted eng data.
 * Neural edges strengthen on verified benchmarks; weaken to STALE/REGRESSED
 * on regression. No hidden chain-of-thought — structured evidence/outcomes only.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): EP3 — Chip Research Agent Team.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 160 as const;
export const GITHUB_SOT_LABEL = '62L-EP2' as const;
export const GITHUB_SOT_FAMILY = '62L-EP' as const;
export const GITHUB_SOT_TITLE =
  '62L-EP2 Cross-Vendor Capability Graph — searchable capability graph across AMD/NVIDIA/Intel/Apple/Qualcomm chip families, runtimes, strengths, limitations, and benchmark evidence (public documentation ≠ XIV runtime verification)' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EP2_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EP3 — Chip Research Agent Team — specialized semiconductor, compiler/runtime, memory, packaging, power, manufacturing, and supply-chain research agents that feed verified knowledge back into the Virtual Chip brain.' as const;

/**
 * Core graph:
 * Vendor → Chip Family → Device → Runtime → Model Support → Precision →
 * Benchmark → Workload → Result → Lesson
 */
export const CAPABILITY_GRAPH_CORE_PATH = [
  'vendor',
  'chip_family',
  'device',
  'runtime',
  'model_support',
  'precision',
  'benchmark',
  'workload',
  'result',
  'lesson',
] as const;

export type CapabilityGraphCoreHop =
  (typeof CAPABILITY_GRAPH_CORE_PATH)[number];

/**
 * Initial vendor coverage.
 */
export const CAPABILITY_GRAPH_VENDORS = [
  'amd',
  'nvidia',
  'intel',
  'apple',
  'qualcomm',
  'other_documented_accelerator',
] as const;

export type CapabilityGraphVendor =
  (typeof CAPABILITY_GRAPH_VENDORS)[number];

export const CAPABILITY_GRAPH_VENDOR_LABELS: Readonly<
  Record<CapabilityGraphVendor, string>
> = Object.freeze({
  amd: 'AMD',
  nvidia: 'NVIDIA',
  intel: 'Intel',
  apple: 'Apple',
  qualcomm: 'Qualcomm',
  other_documented_accelerator: 'Other Documented Accelerator',
});

/**
 * Capability node fields.
 */
export const CAPABILITY_NODE_FIELDS = [
  'vendor',
  'productFamily',
  'deviceModel',
  'deviceType',
  'architecture',
  'generation',
  'memory',
  'supportedPrecisions',
  'documentedRuntimes',
  'executionProviders',
  'operatingSystems',
  'modelCompatibility',
  'workloadStrengths',
  'knownLimitations',
  'powerEnergyProxy',
  'benchmarkEvidence',
  'source',
  'sourceDate',
  'verificationState',
  'lastTestedAt',
] as const;

export type CapabilityNodeField = (typeof CAPABILITY_NODE_FIELDS)[number];

/**
 * Required evidence / verification states.
 * Public documentation ≠ XIV runtime verification.
 */
export const CAPABILITY_EVIDENCE_STATES = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'DEGRADED',
  'NOT_TESTED',
  'UNAVAILABLE',
] as const;

export type CapabilityEvidenceState =
  (typeof CAPABILITY_EVIDENCE_STATES)[number];

/**
 * Historical semiconductor learning path:
 * process node → architecture → packaging → memory → software ecosystem →
 * workload performance → supply-chain context
 */
export const HISTORICAL_SEMICONDUCTOR_LEARNING_PATH = [
  'process_node',
  'architecture',
  'packaging',
  'memory',
  'software_ecosystem',
  'workload_performance',
  'supply_chain_context',
] as const;

export type HistoricalSemiconductorLearningHop =
  (typeof HISTORICAL_SEMICONDUCTOR_LEARNING_PATH)[number];

/**
 * Lawful learning source classes (may).
 */
export const LAWFUL_LEARNING_SOURCES = [
  'public_technical_documentation',
  'open_standards',
  'vendor_sdk_documentation',
  'published_research',
  'public_benchmarks',
  'licensed_technical_material',
  'xiv_owned_measured_benchmarks',
] as const;

export type LawfulLearningSource = (typeof LAWFUL_LEARNING_SOURCES)[number];

/**
 * Forbidden proprietary / restricted ingest classes (must not).
 */
export const FORBIDDEN_IP_INGEST_CLASSES = [
  'leaked_schematics',
  'firmware_keys',
  'confidential_design_files',
  'trade_secrets',
  'private_source_code',
  'restricted_engineering_data',
] as const;

export type ForbiddenIpIngestClass =
  (typeof FORBIDDEN_IP_INGEST_CLASSES)[number];

/**
 * Neural edge strength labels after verified benchmarks / regressions.
 */
export const NEURAL_EDGE_STRENGTH_STATES = [
  'STRENGTHENED',
  'STABLE',
  'STALE',
  'REGRESSED',
  'UNKNOWN',
] as const;

export type NeuralEdgeStrengthState =
  (typeof NEURAL_EDGE_STRENGTH_STATES)[number];

/**
 * Agent question surfaces the graph should help answer (structure only).
 */
export const CAPABILITY_GRAPH_AGENT_QUESTIONS = [
  'which_verified_device_can_run_this_model',
  'which_hardware_is_fastest_for_this_workload',
  'which_path_keeps_data_local',
  'which_vendor_runtime_supports_required_precision',
  'what_is_the_cheapest_verified_route',
  'has_this_configuration_regressed_after_driver_runtime_update',
  'which_chip_family_best_suited_for_edge_inference_simulation_or_training',
] as const;

export const CAPABILITY_GRAPH_CYCLE = [
  'honesty_locks',
  'capability_graph_bootstrap',
  // A — Graph structure
  'vendors_encoded',
  'core_graph_path_encoded',
  'capability_node_fields_encoded',
  'evidence_states_encoded',
  'agent_questions_encoded',
  'historical_semiconductor_learning_encoded',
  // B — Truth boundaries
  'documented_neq_verified',
  'public_docs_neq_xiv_runtime_verification',
  'verified_requires_runtime_evidence',
  // C — IP / neural / storage honesty
  'lawful_learning_sources_encoded',
  'no_forbidden_ip_ingest',
  'neural_edge_strengthen_on_verified_benchmark',
  'neural_edge_stale_or_regressed_on_regression',
  'no_hidden_chain_of_thought_storage',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // D — Soft-wires
  'ep1_soft_wire',
  'eo11_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Ep2Hop = (typeof CAPABILITY_GRAPH_CYCLE)[number];

export type Ep2EvidenceState =
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
  | 'STALE'
  | 'REGRESSED'
  | 'STRENGTHENED'
  | 'UNKNOWN';

export type Ep2HopRecord = {
  hop: Ep2Hop;
  state: Ep2EvidenceState;
  summary: string;
  at: string;
};

export type Ep2ActorKind =
  | 'capability_graph_architect'
  | 'vendor_research'
  | 'benchmark_agent'
  | 'runtime_research'
  | 'historical_semiconductor_research'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Ep2Actor = {
  kind: Ep2ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EP2_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_CAPABILITY_GRAPH_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Documentation ≠ verification
  DOCUMENTED_EQ_VERIFIED: false as const,
  DETECTED_EQ_VERIFIED: false as const,
  PUBLIC_DOCS_EQ_XIV_RUNTIME_VERIFICATION: false as const,
  VERIFIED_WITHOUT_RUNTIME_EVIDENCE: false as const,
  NOT_TESTED_EQ_VERIFIED: false as const,

  // Proprietary IP boundary
  INGEST_LEAKED_SCHEMATICS: false as const,
  INGEST_FIRMWARE_KEYS: false as const,
  INGEST_CONFIDENTIAL_DESIGN_FILES: false as const,
  INGEST_TRADE_SECRETS: false as const,
  INGEST_PRIVATE_SOURCE_CODE: false as const,
  INGEST_RESTRICTED_ENGINEERING_DATA: false as const,
  COPY_PROPRIETARY_CHIP_DESIGNS: false as const,

  // Neural / storage honesty
  STORE_HIDDEN_CHAIN_OF_THOUGHT: false as const,
  KEEP_REGRESSED_EDGE_AS_VERIFIED: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  AUTO_CLOUD_PURCHASE: false as const,
  AUTO_DEVICE_CONTROL: false as const,

  // Recommend ≠ act
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_DEPLOY: false as const,
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

export const CAPABILITY_GRAPH_AGENT_BOUNDS = Object.freeze({
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayIngestForbiddenIp: false as const,
  mayStoreHiddenChainOfThought: false as const,
  mayEquateDocumentedWithVerified: false as const,
  mayRecommendOnly: true as const,
});

export const EP2_MAY = Object.freeze([
  'register_capability_nodes',
  'link_core_graph_edges',
  'label_evidence_states',
  'answer_agent_capability_questions_advisably',
  'link_historical_semiconductor_learning',
  'strengthen_neural_edges_on_verified_benchmark',
  'mark_neural_edges_stale_or_regressed',
  'ingest_lawful_learning_sources',
  'return_agent_evidence_to_home_base',
] as const);

export const EP2_MUST_NOT = Object.freeze([
  'equate_documented_with_verified',
  'equate_public_docs_with_xiv_runtime_verification',
  'claim_verified_without_runtime_evidence',
  'ingest_leaked_schematics',
  'ingest_firmware_keys',
  'ingest_confidential_design_files',
  'ingest_trade_secrets',
  'ingest_private_source_code',
  'ingest_restricted_engineering_data',
  'copy_proprietary_chip_designs',
  'store_hidden_chain_of_thought',
  'keep_regressed_edge_as_verified',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Ep2SoftWireSnapshot = {
  ep1VirtualChipContract: SoftWirePresence;
  ep1Report: SoftWirePresence;
  eo11VirtualDataWarehouse: SoftWirePresence;
  eo11Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
  em157Report: SoftWirePresence;
};

export function assertEp2LocksIntact(): boolean {
  return (
    EP2_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EP2_LOCKS.DOCUMENTED_EQ_VERIFIED === false &&
    EP2_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EP2_LOCKS.PUBLIC_DOCS_EQ_XIV_RUNTIME_VERIFICATION === false &&
    EP2_LOCKS.VERIFIED_WITHOUT_RUNTIME_EVIDENCE === false &&
    EP2_LOCKS.NOT_TESTED_EQ_VERIFIED === false &&
    EP2_LOCKS.INGEST_LEAKED_SCHEMATICS === false &&
    EP2_LOCKS.INGEST_FIRMWARE_KEYS === false &&
    EP2_LOCKS.INGEST_CONFIDENTIAL_DESIGN_FILES === false &&
    EP2_LOCKS.INGEST_TRADE_SECRETS === false &&
    EP2_LOCKS.INGEST_PRIVATE_SOURCE_CODE === false &&
    EP2_LOCKS.INGEST_RESTRICTED_ENGINEERING_DATA === false &&
    EP2_LOCKS.COPY_PROPRIETARY_CHIP_DESIGNS === false &&
    EP2_LOCKS.STORE_HIDDEN_CHAIN_OF_THOUGHT === false &&
    EP2_LOCKS.KEEP_REGRESSED_EDGE_AS_VERIFIED === false &&
    EP2_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EP2_LOCKS.AUTO_CLOUD_PURCHASE === false &&
    EP2_LOCKS.AUTO_DEVICE_CONTROL === false &&
    EP2_LOCKS.RECOMMEND_EQ_ACT === false &&
    EP2_LOCKS.RECOMMEND_EQ_DEPLOY === false &&
    EP2_LOCKS.RECOMMEND_EQ_PURCHASE === false &&
    EP2_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EP2_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EP2_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EP2_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EP2_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EP2_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EP2_LOCKS.TIP_LAND === false &&
    EP2_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EP2_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EP2_LOCKS.FULL_PRODUCTION_CAPABILITY_GRAPH_SHIPPED === false &&
    EP2_LOCKS.MANAGE_PULL_REQUEST === false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.automaticAuthority === false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayIngestForbiddenIp === false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayStoreHiddenChainOfThought === false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayEquateDocumentedWithVerified === false
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
 * Soft-wire EP1 / EO11 / EM157 when present. Presence alone ≠ VERIFIED.
 */
export function ep2SoftWireSnapshot(repoRoot?: string): Ep2SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
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
  };
}

export function isHumanApprover(actor: Ep2Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isCapabilityGraphAgent(actor: Ep2Actor): boolean {
  const agents: readonly Ep2ActorKind[] = [
    'capability_graph_architect',
    'vendor_research',
    'benchmark_agent',
    'runtime_research',
    'historical_semiconductor_research',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Public documentation ≠ XIV runtime verification.
 * DOCUMENTED from vendor docs alone cannot become VERIFIED.
 */
export function defaultEvidenceState(opts?: {
  vendorDocumentationPresent?: boolean;
  hardwareDetected?: boolean;
  runtimeSupportedDocumented?: boolean;
  xivRuntimeEvidencePresent?: boolean;
  degraded?: boolean;
  notTested?: boolean;
  unavailable?: boolean;
}): CapabilityEvidenceState {
  if (opts?.unavailable) return 'UNAVAILABLE';
  if (opts?.degraded) return 'DEGRADED';
  if (opts?.xivRuntimeEvidencePresent) return 'VERIFIED';
  if (opts?.notTested) return 'NOT_TESTED';
  if (opts?.runtimeSupportedDocumented) return 'SUPPORTED';
  if (opts?.hardwareDetected) return 'DETECTED';
  if (opts?.vendorDocumentationPresent) return 'DOCUMENTED';
  return 'NOT_TESTED';
}
