/**
 * 62L-EO11 — Virtual Data Warehouse Mission Pack (park-and-implement).
 *
 * Isolated mission-specific virtual data warehouses so government and
 * enterprise teams can unify approved operational data without losing
 * tenant, Universe, lineage, retention, or access controls.
 *
 * SoT: GitHub EO family / #159 lineage (authoritative). GitLab mirror: not
 * resolved in this environment (GitLab MCP needsAuth; no issue number invented).
 *
 * Soft-wire when PRESENT: EO10, EO9, EO8, EN (#158), EM10, EM1.
 * Presence ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * No raw-private cross-tenant pooling.
 * No production database mutations from this queue.
 * No unauthorized ingestion.
 * No leaked/restricted datasets.
 * No silent replication to cloud providers.
 * Deletion/revocation must propagate to derived indexes/caches where applicable.
 * Guardian/RLS/tenant/Universe isolation cannot be weakened.
 * Agents never receive blanket database access.
 * Stale/missing data ≠ current truth.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): EO12 — Virtual Universe Mission Simulator.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 159 as const;
export const GITHUB_SOT_LABEL = '62L-EO11' as const;
export const GITHUB_SOT_TITLE =
  '62L-EO11 Virtual Data Warehouse Mission Pack — isolated mission-specific virtual data warehouses with lineage, access controls, retention, compute budgets, and agent-ready analytical layers' as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EO11_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EO12 — Virtual Universe Mission Simulator — isolated software worlds for testing logistics, procurement, infrastructure, pricing, readiness, manufacturing, and quantum/AI strategies before anything touches real operations.' as const;

/**
 * Core data flow:
 * Source → Authorized Connector → Ingestion Gate → Mission Warehouse →
 * Search/Analytics/Agents → Decision Object → Outcome
 */
export const VIRTUAL_WAREHOUSE_CORE_FLOW = [
  'source',
  'authorized_connector',
  'ingestion_gate',
  'mission_warehouse',
  'search_analytics_agents',
  'decision_object',
  'outcome',
] as const;

export type VirtualWarehouseCoreFlowHop =
  (typeof VIRTUAL_WAREHOUSE_CORE_FLOW)[number];

/**
 * Mission warehouse types (encoded).
 */
export const MISSION_WAREHOUSE_TYPES = [
  'logistics_warehouse',
  'supply_chain_resilience_warehouse',
  'procurement_contract_warehouse',
  'maintenance_readiness_warehouse',
  'finance_cost_warehouse',
  'quantum_ai_research_warehouse',
  'semiconductor_chip_knowledge_warehouse',
  'telecom_satellite_research_warehouse',
  'proposal_evidence_warehouse',
  'historical_business_case_study_warehouse',
] as const;

export type MissionWarehouseType = (typeof MISSION_WAREHOUSE_TYPES)[number];

export const MISSION_WAREHOUSE_TYPE_LABELS: Readonly<
  Record<MissionWarehouseType, string>
> = Object.freeze({
  logistics_warehouse: 'Logistics Warehouse',
  supply_chain_resilience_warehouse: 'Supply-Chain Resilience Warehouse',
  procurement_contract_warehouse: 'Procurement / Contract Warehouse',
  maintenance_readiness_warehouse: 'Maintenance / Readiness Warehouse',
  finance_cost_warehouse: 'Finance / Cost Warehouse',
  quantum_ai_research_warehouse: 'Quantum / AI Research Warehouse',
  semiconductor_chip_knowledge_warehouse:
    'Semiconductor / Chip Knowledge Warehouse',
  telecom_satellite_research_warehouse:
    'Telecom / Satellite Research Warehouse',
  proposal_evidence_warehouse: 'Proposal / Evidence Warehouse',
  historical_business_case_study_warehouse:
    'Historical Business / Case-Study Warehouse',
});

/**
 * Warehouse definition fields (encode).
 */
export const WAREHOUSE_DEFINITION_FIELDS = [
  'warehouseId',
  'missionOrganization',
  'tenantUniverse',
  'dataOwners',
  'sourceSystems',
  'schemaCatalog',
  'dataClassifications',
  'lineage',
  'retention',
  'residencyLocation',
  'encryptionState',
  'accessRoles',
  'connectorScopes',
  'computeBudget',
  'storageBudget',
  'freshnessSLOs',
  'backupRecoveryState',
  'deletionRevocationPolicy',
  'auditState',
  'evidenceStatus',
] as const;

export type WarehouseDefinitionField =
  (typeof WAREHOUSE_DEFINITION_FIELDS)[number];

/**
 * Reliability / freshness states — stale/missing ≠ current truth.
 */
export const WAREHOUSE_RELIABILITY_STATES = [
  'FRESH',
  'STALE',
  'DEGRADED',
  'UNAVAILABLE',
  'UNKNOWN',
] as const;

export type WarehouseReliabilityState =
  (typeof WAREHOUSE_RELIABILITY_STATES)[number];

/**
 * Agent access request fields — no blanket database access.
 */
export const AGENT_ACCESS_REQUEST_FIELDS = [
  'agentId',
  'purpose',
  'allowedDataset',
  'fields',
  'dataClass',
  'timeWindow',
  'taskId',
  'expiry',
] as const;

export type AgentAccessRequestField =
  (typeof AGENT_ACCESS_REQUEST_FIELDS)[number];

/**
 * Access gate flow:
 * Policy/RLS/Guardian → approved query → bounded result → evidence receipt
 */
export const AGENT_ACCESS_GATE_FLOW = [
  'policy_rls_guardian',
  'approved_query',
  'bounded_result',
  'evidence_receipt',
] as const;

export type AgentAccessGateHop = (typeof AGENT_ACCESS_GATE_FLOW)[number];

/**
 * Neural pathway node kinds (approved warehouse results may become nodes).
 * Every edge keeps provenance and permission scope.
 */
export const NEURAL_PATHWAY_NODE_KINDS = [
  'source_fact',
  'business_logistics_pattern',
  'experiment',
  'recommendation',
  'decision',
  'outcome',
] as const;

export type NeuralPathwayNodeKind = (typeof NEURAL_PATHWAY_NODE_KINDS)[number];

/**
 * Data classifications (structure).
 */
export const DATA_CLASSIFICATIONS = [
  'public',
  'internal',
  'confidential',
  'restricted',
  'classified_candidate',
] as const;

export type DataClassification = (typeof DATA_CLASSIFICATIONS)[number];

export const VIRTUAL_DATA_WAREHOUSE_MISSION_PACK_CYCLE = [
  'honesty_locks',
  'virtual_warehouse_pack_bootstrap',
  // A — Types + fields + core flow
  'mission_warehouse_types_encoded',
  'warehouse_definition_fields_encoded',
  'core_flow_encoded',
  // B — Reliability
  'reliability_states_encoded',
  'stale_or_missing_neq_current_truth',
  // C — Agent access model
  'agent_access_request_fields_encoded',
  'agent_access_gate_flow_encoded',
  'no_blanket_database_access',
  // D — Neural pathway
  'neural_pathway_nodes_encoded',
  'neural_edges_keep_provenance_and_permission_scope',
  // E — Critical boundaries
  'no_raw_private_cross_tenant_pooling',
  'no_production_database_mutations',
  'no_unauthorized_ingestion',
  'no_leaked_restricted_datasets',
  'no_silent_cloud_replication',
  'deletion_revocation_propagates',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // F — Soft-wires
  'eo10_soft_wire',
  'eo9_soft_wire',
  'eo8_soft_wire',
  'en158_soft_wire',
  'em10_soft_wire',
  'em1_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eo11Hop = (typeof VIRTUAL_DATA_WAREHOUSE_MISSION_PACK_CYCLE)[number];

export type Eo11EvidenceState =
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
  | 'FRESH'
  | 'STALE'
  | 'DEGRADED'
  | 'UNKNOWN'
  | 'APPROVED'
  | 'EXPIRED';

export type Eo11HopRecord = {
  hop: Eo11Hop;
  state: Eo11EvidenceState;
  summary: string;
  at: string;
};

export type Eo11ActorKind =
  | 'warehouse_architect'
  | 'data_steward'
  | 'connector_agent'
  | 'analytics_agent'
  | 'search_agent'
  | 'lineage_agent'
  | 'policy_guardian'
  | 'proposal'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Eo11Actor = {
  kind: Eo11ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EO11_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_VIRTUAL_WAREHOUSE_PACK_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Critical boundaries
  RAW_PRIVATE_CROSS_TENANT_POOLING: false as const,
  PRODUCTION_DATABASE_MUTATIONS: false as const,
  UNAUTHORIZED_INGESTION: false as const,
  LEAK_RESTRICTED_DATASETS: false as const,
  SILENT_CLOUD_REPLICATION: false as const,
  WEAKEN_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  BLANKET_AGENT_DATABASE_ACCESS: false as const,
  TREAT_STALE_AS_CURRENT_TRUTH: false as const,
  TREAT_MISSING_AS_CURRENT_TRUTH: false as const,
  SKIP_DELETION_REVOCATION_PROPAGATION: false as const,

  // Agent authority
  AGENT_AUTO_AUTHORITY: false as const,
  AGENT_AUTO_INGEST: false as const,
  AGENT_AUTO_MUTATE_PRODUCTION_DB: false as const,
  AGENT_AUTO_CROSS_TENANT_READ: false as const,
  AGENT_AUTO_CLOUD_REPLICATE: false as const,

  // Recommend ≠ act
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_INGEST: false as const,
  RECOMMEND_EQ_MUTATE: false as const,
  RECOMMEND_EQ_REPLICATE: false as const,
  RECOMMEND_EQ_POOL_TENANTS: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  // Human gates
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  DELETION_REVOCATION_PROPAGATION_REQUIRED: true as const,
});

export const VIRTUAL_WAREHOUSE_AGENT_BOUNDS = Object.freeze({
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  blanketDatabaseAccess: false as const,
  automaticIngestion: false as const,
  automaticProductionMutation: false as const,
  automaticCrossTenantPooling: false as const,
  automaticSilentCloudReplication: false as const,
  mayTreatStaleAsCurrentTruth: false as const,
  mayRecommendOnly: true as const,
});

export const EO11_MAY = Object.freeze([
  'register_mission_warehouse_definitions',
  'encode_core_data_flow',
  'open_bounded_agent_access_requests',
  'run_policy_rls_guardian_gate',
  'return_bounded_query_results',
  'issue_evidence_receipts',
  'attach_neural_pathway_nodes_with_provenance',
  'track_reliability_states',
  'plan_deletion_revocation_propagation',
  'return_agent_evidence_to_home_base',
] as const);

export const EO11_MUST_NOT = Object.freeze([
  'raw_private_cross_tenant_pooling',
  'production_database_mutations',
  'unauthorized_ingestion',
  'leak_restricted_datasets',
  'silent_cloud_replication',
  'blanket_agent_database_access',
  'treat_stale_or_missing_as_current_truth',
  'skip_deletion_revocation_propagation',
  'weaken_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eo11SoftWireSnapshot = {
  eo10PhysicalProductContractPack: SoftWirePresence;
  eo10Report: SoftWirePresence;
  eo9DigitalProductContractPack: SoftWirePresence;
  eo9Report: SoftWirePresence;
  eo8SupplyChainResiliencePack: SoftWirePresence;
  eo8Report: SoftWirePresence;
  en158DealOs: SoftWirePresence;
  en158DealRuntime: SoftWirePresence;
  en158Report: SoftWirePresence;
  em10UserAccessEconomy: SoftWirePresence;
  em10Report: SoftWirePresence;
  em1HomeBaseContract: SoftWirePresence;
};

export function assertEo11LocksIntact(): boolean {
  return (
    EO11_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EO11_LOCKS.RAW_PRIVATE_CROSS_TENANT_POOLING === false &&
    EO11_LOCKS.PRODUCTION_DATABASE_MUTATIONS === false &&
    EO11_LOCKS.UNAUTHORIZED_INGESTION === false &&
    EO11_LOCKS.LEAK_RESTRICTED_DATASETS === false &&
    EO11_LOCKS.SILENT_CLOUD_REPLICATION === false &&
    EO11_LOCKS.WEAKEN_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EO11_LOCKS.BLANKET_AGENT_DATABASE_ACCESS === false &&
    EO11_LOCKS.TREAT_STALE_AS_CURRENT_TRUTH === false &&
    EO11_LOCKS.TREAT_MISSING_AS_CURRENT_TRUTH === false &&
    EO11_LOCKS.SKIP_DELETION_REVOCATION_PROPAGATION === false &&
    EO11_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EO11_LOCKS.AGENT_AUTO_INGEST === false &&
    EO11_LOCKS.AGENT_AUTO_MUTATE_PRODUCTION_DB === false &&
    EO11_LOCKS.AGENT_AUTO_CROSS_TENANT_READ === false &&
    EO11_LOCKS.AGENT_AUTO_CLOUD_REPLICATE === false &&
    EO11_LOCKS.RECOMMEND_EQ_ACT === false &&
    EO11_LOCKS.RECOMMEND_EQ_INGEST === false &&
    EO11_LOCKS.RECOMMEND_EQ_MUTATE === false &&
    EO11_LOCKS.RECOMMEND_EQ_REPLICATE === false &&
    EO11_LOCKS.RECOMMEND_EQ_POOL_TENANTS === false &&
    EO11_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EO11_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EO11_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EO11_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EO11_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EO11_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EO11_LOCKS.DELETION_REVOCATION_PROPAGATION_REQUIRED === true &&
    EO11_LOCKS.TIP_LAND === false &&
    EO11_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EO11_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EO11_LOCKS.FULL_PRODUCTION_VIRTUAL_WAREHOUSE_PACK_SHIPPED === false &&
    EO11_LOCKS.MANAGE_PULL_REQUEST === false &&
    VIRTUAL_WAREHOUSE_AGENT_BOUNDS.automaticAuthority === false &&
    VIRTUAL_WAREHOUSE_AGENT_BOUNDS.blanketDatabaseAccess === false &&
    VIRTUAL_WAREHOUSE_AGENT_BOUNDS.automaticIngestion === false &&
    VIRTUAL_WAREHOUSE_AGENT_BOUNDS.automaticProductionMutation === false &&
    VIRTUAL_WAREHOUSE_AGENT_BOUNDS.automaticCrossTenantPooling === false &&
    VIRTUAL_WAREHOUSE_AGENT_BOUNDS.automaticSilentCloudReplication === false &&
    VIRTUAL_WAREHOUSE_AGENT_BOUNDS.mayTreatStaleAsCurrentTruth === false
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
 * Soft-wire EO10 / EO9 / EO8 / EN / EM10 / EM1 when present.
 * Presence alone ≠ VERIFIED.
 */
export function eo11SoftWireSnapshot(repoRoot?: string): Eo11SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eo10PhysicalProductContractPack: softWireFile(
      './physical-product-contract-pack-types.ts',
      'EO10 Physical Product Contract Pack PRESENT (soft-wire).',
      'EO10 Physical Product Contract Pack absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo10Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO10_PHYSICAL_PRODUCT_CONTRACT_PACK_REPORT.md',
      'EO10 report PRESENT.',
      'EO10 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo9DigitalProductContractPack: softWireFile(
      './digital-product-contract-pack-types.ts',
      'EO9 Digital Product Contract Pack PRESENT (soft-wire).',
      'EO9 Digital Product Contract Pack absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo9Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO9_DIGITAL_PRODUCT_CONTRACT_PACK_REPORT.md',
      'EO9 report PRESENT.',
      'EO9 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo8SupplyChainResiliencePack: softWireFile(
      './supply-chain-resilience-pack-types.ts',
      'EO8 Supply Chain Resilience Pack PRESENT (soft-wire).',
      'EO8 Supply Chain Resilience Pack absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo8Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO8_SUPPLY_CHAIN_RESILIENCE_PACK_REPORT.md',
      'EO8 report PRESENT.',
      'EO8 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    en158DealOs: softWireFile(
      './deal-contract-intelligence-os.ts',
      'EN (#158) Deal & Contract Intelligence OS PRESENT (soft-wire).',
      'EN (#158) Deal OS absent — soft-wire WAITING_DATA.',
    ),
    en158DealRuntime: softWireFile(
      './deal-contract-intelligence-os-runtime.ts',
      'EN (#158) deal/gov runtime PRESENT (human-authorized submission only).',
      'EN (#158) deal/gov runtime absent — soft-wire WAITING_DATA.',
    ),
    en158Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EN_DEAL_CONTRACT_INTELLIGENCE_OS_REPORT.md',
      'EN (#158) report PRESENT.',
      'EN (#158) report absent.',
    ),
    em10UserAccessEconomy: softWireFile(
      './user-access-economy.ts',
      'EM10 User Access Economy PRESENT (soft-wire).',
      'EM10 User Access Economy absent.',
    ),
    em10Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EM10_USER_ACCESS_ECONOMY_REPORT.md',
      'EM10 report PRESENT.',
      'EM10 report absent.',
    ),
    em1HomeBaseContract: softWireFile(
      './agent-home-base-contract.ts',
      'EM1 agent home base contract PRESENT (agents return evidence).',
      'EM1 agent home base contract absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Eo11Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isWarehouseAgent(actor: Eo11Actor): boolean {
  const agents: readonly Eo11ActorKind[] = [
    'warehouse_architect',
    'data_steward',
    'connector_agent',
    'analytics_agent',
    'search_agent',
    'lineage_agent',
    'policy_guardian',
    'proposal',
  ];
  return agents.includes(actor.kind);
}

/**
 * Stale / degraded / unavailable / unknown / missing must not be treated as
 * current truth. Only FRESH may be labeled current-truth-eligible.
 */
export function mayTreatAsCurrentTruth(
  state: WarehouseReliabilityState,
): boolean {
  return state === 'FRESH';
}
