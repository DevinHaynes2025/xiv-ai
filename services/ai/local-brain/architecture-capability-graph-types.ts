/**
 * 62L-EQ6 — Architecture Capability Graph (park-and-implement).
 *
 * One evidence-backed graph connecting architectures, extensions, runtimes,
 * models, workloads, devices, and benchmarks so agents can reason across
 * heterogeneous compute without relying on vendor assumptions.
 *
 * Core graph:
 * Architecture → Extension/Feature → Compiler/IR → Runtime → Model/Operator →
 * Device → Benchmark → Workload → Outcome
 *
 * Measured success strengthens edges; failed/stale/regression weaken them.
 * No inferred edge may silently become fact.
 * Evidence classes: FACT | MEASURED | DOCUMENTED | INFERRED | HYPOTHESIS
 *
 * Soft-wire when PRESENT: EQ5, EQ4, EQ3, EQ2, EQ1, EM (#157). Presence ≠ VERIFIED.
 *
 * SoT: GitHub #161 / 62L-EQ family. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): EQ7 — ARM Edge/Phone Runtime Research.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 161 as const;
export const GITHUB_SOT_LABEL = '62L-EQ6' as const;
export const GITHUB_SOT_FAMILY = '62L-EQ' as const;
export const GITHUB_SOT_TITLE =
  '62L-EQ6 Architecture Capability Graph — evidence-backed cross-platform graph; measured≠inferred; DOCUMENTED→VERIFIED only with test evidence' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EQ6_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EQ7 — ARM Edge/Phone Runtime Research — map mobile/embedded ARM devices, local AI runtimes, energy/latency tradeoffs, and phone compatibility into the Virtual Chip brain.' as const;

/**
 * Core graph node kinds / pathway.
 */
export const CAPABILITY_GRAPH_PATHWAY = [
  'architecture',
  'extension_feature',
  'compiler_ir',
  'runtime',
  'model_operator',
  'device',
  'benchmark',
  'workload',
  'outcome',
] as const;

export type CapabilityGraphNodeKind =
  (typeof CAPABILITY_GRAPH_PATHWAY)[number];

/**
 * Required capability / edge states.
 */
export const CAPABILITY_STATES = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
  'PARTIAL',
  'DEGRADED',
  'STALE',
  'NOT_TESTED',
  'UNAVAILABLE',
] as const;

export type CapabilityState = (typeof CAPABILITY_STATES)[number];

/**
 * Evidence class — must distinguish fact vs inferred.
 */
export const EVIDENCE_CLASSES = [
  'FACT',
  'MEASURED',
  'DOCUMENTED',
  'INFERRED',
  'HYPOTHESIS',
] as const;

export type EvidenceClass = (typeof EVIDENCE_CLASSES)[number];

/**
 * Relationship types between graph nodes.
 */
export const RELATIONSHIP_TYPES = [
  'has_extension',
  'compiles_via',
  'runs_on_runtime',
  'implements_operators',
  'deploys_to_device',
  'benchmarked_by',
  'serves_workload',
  'produces_outcome',
  'fallback_of',
  'regressed_from',
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

/**
 * Edge audit / payload fields.
 */
export const CAPABILITY_EDGE_FIELDS = [
  'sourceNode',
  'targetNode',
  'relationshipType',
  'evidenceClass',
  'sourceReference',
  'version',
  'verifiedDate',
  'confidence',
  'tenantId',
  'universeId',
  'compatibilityState',
  'benchmarkRefs',
  'knownLimitations',
  'expiryOrStaleness',
] as const;

export type CapabilityEdgeField = (typeof CAPABILITY_EDGE_FIELDS)[number];

/**
 * Agent query kinds the graph answers.
 */
export const AGENT_GRAPH_QUERIES = [
  'which_verified_architectures_execute_workload',
  'which_runtimes_support_required_operators',
  'which_devices_have_recent_benchmarks',
  'which_route_is_most_private',
  'which_path_has_regressed',
  'what_fallback_if_accelerator_unavailable',
  'which_feature_documented_vs_locally_verified',
] as const;

/**
 * Allowed graph knowledge sources (safety/IP).
 */
export const ALLOWED_GRAPH_SOURCES = [
  'public_architecture_specifications',
  'public_runtime_docs',
  'lawful_benchmarks',
  'xiv_owned_measurements',
] as const;

/**
 * Blocked graph content (safety/IP).
 */
export const BLOCKED_GRAPH_CONTENT = [
  'confidential_rtl',
  'firmware_keys',
  'leaked_implementation_details',
  'trade_secrets',
  'unauthorized_customer_data',
] as const;

/**
 * Ladder for strengthening toward VERIFIED (measured path).
 */
export const MEASURED_STRENGTHEN_LADDER = [
  'DOCUMENTED',
  'DETECTED',
  'SUPPORTED',
  'VERIFIED',
] as const;

export const ARCHITECTURE_CAPABILITY_GRAPH_CYCLE = [
  'honesty_locks',
  'architecture_capability_graph_bootstrap',
  // A — Structure
  'core_graph_pathway_encoded',
  'capability_states_encoded',
  'evidence_classes_encoded',
  'edge_fields_encoded',
  'agent_queries_encoded',
  // B — Truth
  'measured_strengthens_edges',
  'failed_stale_regression_weaken',
  'supported_to_verified_needs_test_evidence',
  'inferred_not_silent_fact',
  // C — Denies
  'deny_inferred_silent_fact',
  'deny_verified_without_measurement',
  'deny_confidential_rtl',
  'deny_firmware_keys',
  'deny_leaked_implementation',
  'deny_trade_secrets',
  'deny_unauthorized_customer_data',
  // D — Autonomy
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // E — Soft-wires
  'eq5_soft_wire',
  'eq4_soft_wire',
  'eq3_soft_wire',
  'eq2_soft_wire',
  'eq1_soft_wire',
  'em157_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eq6Hop = (typeof ARCHITECTURE_CAPABILITY_GRAPH_CYCLE)[number];

export type Eq6EvidenceState =
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
  | 'STALE'
  | 'UNKNOWN'
  | 'DETECTED'
  | 'SUPPORTED'
  | 'FACT'
  | 'MEASURED'
  | 'INFERRED'
  | 'HYPOTHESIS';

export type Eq6HopRecord = {
  hop: Eq6Hop;
  state: Eq6EvidenceState;
  summary: string;
  at: string;
};

export type Eq6ActorKind =
  | 'graph_curator'
  | 'capability_reasoner'
  | 'benchmark_ingest'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Eq6Actor = {
  kind: Eq6ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EQ6_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_CAPABILITY_GRAPH_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Graph integrity
  INFERRED_SILENT_FACT: false as const,
  VERIFIED_WITHOUT_MEASUREMENT: false as const,
  VENDOR_ASSUMPTION_AS_FACT: false as const,
  DOCUMENTED_EQ_LOCALLY_VERIFIED: false as const,

  // Safety / IP
  CONFIDENTIAL_RTL_IN_GRAPH: false as const,
  FIRMWARE_KEYS_IN_GRAPH: false as const,
  LEAKED_IMPLEMENTATION_IN_GRAPH: false as const,
  TRADE_SECRETS_IN_GRAPH: false as const,
  UNAUTHORIZED_CUSTOMER_DATA_IN_GRAPH: false as const,

  // Autonomy
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_IN_GRAPH: false as const,

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

export const CAPABILITY_GRAPH_AGENT_BOUNDS = Object.freeze({
  mayEmitNodesAndEdges: true as const,
  mayStrengthenWithMeasurement: true as const,
  mayWeakenOnFailureStaleRegression: true as const,
  mayAnswerCapabilityQueries: true as const,
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  mayPromoteInferredToFactSilently: false as const,
  mayMarkVerifiedWithoutMeasurement: false as const,
  mayTreatVendorAssumptionAsFact: false as const,
  mayIngestConfidentialRtl: false as const,
  mayIngestFirmwareKeys: false as const,
  mayIngestLeakedImplementation: false as const,
  mayIngestTradeSecrets: false as const,
  mayIngestUnauthorizedCustomerData: false as const,
  mayIncludeHiddenChainOfThought: false as const,
  mayRecommendOnly: true as const,
});

export const EQ6_MAY = Object.freeze([
  'connect_architecture_through_outcome_with_evidence',
  'strengthen_edges_on_measured_success',
  'weaken_edges_on_failure_stale_or_regression',
  'answer_verified_runtime_device_fallback_queries',
  'distinguish_documented_vs_locally_verified',
  'use_only_public_lawful_xiv_owned_sources',
] as const);

export const EQ6_MUST_NOT = Object.freeze([
  'promote_inferred_edge_to_fact_silently',
  'mark_verified_without_actual_test_evidence',
  'treat_vendor_assumptions_as_facts',
  'ingest_confidential_rtl_or_firmware_keys',
  'ingest_leaked_implementation_trade_secrets_or_unauthorized_customer_data',
  'store_hidden_chain_of_thought',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eq6SoftWireSnapshot = {
  eq5CompilerIrTranslationLayer: SoftWirePresence;
  eq5Report: SoftWirePresence;
  eq4ProprietaryIsaBoundary: SoftWirePresence;
  eq4Report: SoftWirePresence;
  eq3RiscvOpenIsaKnowledgePack: SoftWirePresence;
  eq3Report: SoftWirePresence;
  eq2ArmArchitectureKnowledgePack: SoftWirePresence;
  eq2Report: SoftWirePresence;
  eq1CrossArchitectureContract: SoftWirePresence;
  eq1Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
};

export function assertEq6LocksIntact(): boolean {
  return (
    EQ6_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EQ6_LOCKS.INFERRED_SILENT_FACT === false &&
    EQ6_LOCKS.VERIFIED_WITHOUT_MEASUREMENT === false &&
    EQ6_LOCKS.VENDOR_ASSUMPTION_AS_FACT === false &&
    EQ6_LOCKS.DOCUMENTED_EQ_LOCALLY_VERIFIED === false &&
    EQ6_LOCKS.CONFIDENTIAL_RTL_IN_GRAPH === false &&
    EQ6_LOCKS.FIRMWARE_KEYS_IN_GRAPH === false &&
    EQ6_LOCKS.LEAKED_IMPLEMENTATION_IN_GRAPH === false &&
    EQ6_LOCKS.TRADE_SECRETS_IN_GRAPH === false &&
    EQ6_LOCKS.UNAUTHORIZED_CUSTOMER_DATA_IN_GRAPH === false &&
    EQ6_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EQ6_LOCKS.RECOMMEND_EQ_ACT === false &&
    EQ6_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    EQ6_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_IN_GRAPH === false &&
    EQ6_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EQ6_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EQ6_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    EQ6_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EQ6_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EQ6_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EQ6_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EQ6_LOCKS.TIP_LAND === false &&
    EQ6_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EQ6_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EQ6_LOCKS.FULL_PRODUCTION_CAPABILITY_GRAPH_SHIPPED === false &&
    EQ6_LOCKS.MANAGE_PULL_REQUEST === false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.automaticAuthority === false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayPromoteInferredToFactSilently === false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayMarkVerifiedWithoutMeasurement ===
      false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayTreatVendorAssumptionAsFact === false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayIngestConfidentialRtl === false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayIngestFirmwareKeys === false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayIngestLeakedImplementation === false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayIngestTradeSecrets === false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayIngestUnauthorizedCustomerData ===
      false &&
    CAPABILITY_GRAPH_AGENT_BOUNDS.mayIncludeHiddenChainOfThought === false
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

export function eq6SoftWireSnapshot(repoRoot?: string): Eq6SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eq5CompilerIrTranslationLayer: softWireFile(
      './compiler-ir-translation-layer-types.ts',
      'EQ5 Compiler/IR Translation Layer PRESENT (soft-wire).',
      'EQ5 Compiler/IR Translation Layer absent — soft-wire WAITING_DATA.',
    ),
    eq5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ5_COMPILER_IR_TRANSLATION_LAYER_REPORT.md',
      'EQ5 report PRESENT.',
      'EQ5 report absent — soft-wire WAITING_DATA.',
    ),
    eq4ProprietaryIsaBoundary: softWireFile(
      './proprietary-isa-boundary-types.ts',
      'EQ4 Proprietary ISA Boundary PRESENT (soft-wire).',
      'EQ4 Proprietary ISA Boundary absent — soft-wire WAITING_DATA.',
    ),
    eq4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ4_PROPRIETARY_ISA_BOUNDARY_REPORT.md',
      'EQ4 report PRESENT.',
      'EQ4 report absent — soft-wire WAITING_DATA.',
    ),
    eq3RiscvOpenIsaKnowledgePack: softWireFile(
      './riscv-open-isa-knowledge-pack-types.ts',
      'EQ3 RISC-V Open ISA Knowledge Pack PRESENT (soft-wire).',
      'EQ3 RISC-V Open ISA Knowledge Pack absent — soft-wire WAITING_DATA.',
    ),
    eq3Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ3_RISCV_OPEN_ISA_KNOWLEDGE_PACK_REPORT.md',
      'EQ3 report PRESENT.',
      'EQ3 report absent — soft-wire WAITING_DATA.',
    ),
    eq2ArmArchitectureKnowledgePack: softWireFile(
      './arm-architecture-knowledge-pack-types.ts',
      'EQ2 ARM Architecture Knowledge Pack PRESENT (soft-wire).',
      'EQ2 ARM Architecture Knowledge Pack absent — soft-wire WAITING_DATA.',
    ),
    eq2Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ2_ARM_ARCHITECTURE_KNOWLEDGE_PACK_REPORT.md',
      'EQ2 report PRESENT.',
      'EQ2 report absent — soft-wire WAITING_DATA.',
    ),
    eq1CrossArchitectureContract: softWireFile(
      './cross-architecture-contract-types.ts',
      'EQ1 Cross-Architecture Contract PRESENT (soft-wire).',
      'EQ1 Cross-Architecture Contract absent — soft-wire WAITING_DATA.',
    ),
    eq1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EQ1_CROSS_ARCHITECTURE_CONTRACT_REPORT.md',
      'EQ1 report PRESENT.',
      'EQ1 report absent — soft-wire WAITING_DATA.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM (#157) Agent Compute Home Base PRESENT (soft-wire).',
      'EM (#157) Agent Compute Home Base absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Eq6Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin'
  );
}

export function isCapabilityGraphAgent(actor: Eq6Actor): boolean {
  const agents: readonly Eq6ActorKind[] = [
    'graph_curator',
    'capability_reasoner',
    'benchmark_ingest',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * INFERRED / HYPOTHESIS may not silently become FACT.
 */
export function inferredMayBecomeFactSilently(): false {
  return false;
}

/**
 * SUPPORTED → VERIFIED only with actual test / measurement evidence.
 */
export function canPromoteToVerified(input: {
  from: CapabilityState;
  hasMeasuredEvidence: boolean;
  evidenceClass: EvidenceClass;
}): boolean {
  if (input.from !== 'SUPPORTED' && input.from !== 'PARTIAL') {
    // allow DETECTED path only via stepwise strengthen; VERIFIED needs measurement
  }
  if (!input.hasMeasuredEvidence) return false;
  if (input.evidenceClass !== 'MEASURED' && input.evidenceClass !== 'FACT') {
    return false;
  }
  return input.from === 'SUPPORTED' || input.from === 'PARTIAL';
}

export function evidenceClassMaySilentPromoteToFact(
  from: EvidenceClass,
): boolean {
  if (from === 'INFERRED' || from === 'HYPOTHESIS') return false;
  return from === 'FACT' || from === 'MEASURED' || from === 'DOCUMENTED';
}
