/**
 * 62L-EO9 — Digital Product Contract Pack (park-and-implement).
 *
 * Contract-ready digital-product architecture so government and enterprise
 * opportunities map to deployable AI software, search, analytics, simulation,
 * agentic workflows, APIs, data platforms, and secure knowledge systems.
 *
 * SoT: GitHub EO family / #159 lineage (authoritative). GitLab mirror: not
 * resolved in this environment (GitLab MCP needsAuth; no issue number invented).
 *
 * Soft-wire when PRESENT: EO1, EN (#158), EM10, EO4, EO5, EO8.
 * Presence ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * No claim FedRAMP / FISMA / CMMC / clearance / agency authorization /
 * production readiness unless evidenced.
 * No autonomous production deployment, bid submission, contract acceptance,
 * customer-data ingestion, or permission expansion.
 * Quantum claims retain THEORETICAL | SIMULATED | QUANTUM_INSPIRED |
 * PHYSICAL_QPU_VERIFIED.
 * Deployment models claim only if tested; default untested → NOT_TESTED /
 * CANDIDATE / NOT_AVAILABLE as appropriate.
 * Agents return evidence to Home Base; no automatic authority.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): EO10 — Physical Product Contract Pack.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 159 as const;
export const GITHUB_SOT_LABEL = '62L-EO9' as const;
export const GITHUB_SOT_TITLE =
  '62L-EO9 Digital Product Contract Pack — contract-ready digital-product architecture mapping government/enterprise opportunities to deployable AI software, search, analytics, simulation, agentic workflows, APIs, data platforms, and secure knowledge systems' as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EO9_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EO10 — Physical Product Contract Pack — hardware, edge devices, sensors, compute appliances, electronics, manufacturing/logistics lifecycle.' as const;

/**
 * Product families (encoded).
 */
export const DIGITAL_PRODUCT_FAMILIES = [
  'xiv_search_knowledge_os',
  'agentic_workflow_platform',
  'decision_intelligence',
  'logistics_supply_chain_control_tower',
  'digital_twin_simulation_engine',
  'secure_data_virtual_warehouse_layer',
  'executive_mission_command_center',
  'universal_cpu_gpu_npu_runtime',
  'historical_knowledge_research_engine',
  'pricing_contract_proposal_intelligence',
  'api_enterprise_connector_layer',
] as const;

export type DigitalProductFamily = (typeof DIGITAL_PRODUCT_FAMILIES)[number];

export const DIGITAL_PRODUCT_FAMILY_LABELS: Readonly<
  Record<DigitalProductFamily, string>
> = Object.freeze({
  xiv_search_knowledge_os: 'XIV Search & Knowledge OS',
  agentic_workflow_platform: 'Agentic Workflow Platform',
  decision_intelligence: 'Decision Intelligence',
  logistics_supply_chain_control_tower: 'Logistics & Supply Chain Control Tower',
  digital_twin_simulation_engine: 'Digital Twin / Simulation Engine',
  secure_data_virtual_warehouse_layer: 'Secure Data & Virtual Warehouse Layer',
  executive_mission_command_center: 'Executive / Mission Command Center',
  universal_cpu_gpu_npu_runtime: 'Universal CPU/GPU/NPU Runtime',
  historical_knowledge_research_engine: 'Historical Knowledge / Research Engine',
  pricing_contract_proposal_intelligence:
    'Pricing / Contract / Proposal Intelligence',
  api_enterprise_connector_layer: 'API & Enterprise Connector Layer',
});

/**
 * Solution record fields (encode).
 */
export const SOLUTION_RECORD_FIELDS = [
  'requirementId',
  'productModule',
  'deploymentModel',
  'dataSources',
  'userRoles',
  'agentRoles',
  'computeRequirements',
  'securityBoundary',
  'integrationRequirements',
  'performanceTargets',
  'acceptanceTests',
  'supportModel',
  'pricingModel',
  'knownLimitations',
  'evidenceState',
] as const;

export type SolutionRecordField = (typeof SOLUTION_RECORD_FIELDS)[number];

/**
 * Deployment options — claim only if tested.
 * Default untested → NOT_TESTED / CANDIDATE / NOT_AVAILABLE as appropriate.
 */
export const DEPLOYMENT_OPTIONS = [
  'LOCAL',
  'PRIVATE_CLOUD',
  'PUBLIC_CLOUD',
  'HYBRID',
  'EDGE',
  'DISCONNECTED_OFFLINE',
] as const;

export type DeploymentOption = (typeof DEPLOYMENT_OPTIONS)[number];

export const DEPLOYMENT_CLAIM_STATES = [
  'NOT_TESTED',
  'CANDIDATE',
  'NOT_AVAILABLE',
  'TESTED',
  'VERIFIED',
] as const;

export type DeploymentClaimState = (typeof DEPLOYMENT_CLAIM_STATES)[number];

/**
 * Government contract workflow for digital products:
 * Solicitation requirement → Digital product mapping → Architecture →
 * Data/integration plan → Security/compliance gaps → Compute sizing →
 * Implementation plan → Test/acceptance criteria → Pricing → Proposal evidence
 */
export const DIGITAL_PRODUCT_CONTRACT_WORKFLOW = [
  'solicitation_requirement',
  'digital_product_mapping',
  'architecture',
  'data_integration_plan',
  'security_compliance_gaps',
  'compute_sizing',
  'implementation_plan',
  'test_acceptance_criteria',
  'pricing',
  'proposal_evidence',
] as const;

export type DigitalProductWorkflowHop =
  (typeof DIGITAL_PRODUCT_CONTRACT_WORKFLOW)[number];

/**
 * Acceptance criteria checklist (encode).
 */
export const ACCEPTANCE_CHECKLIST_ITEMS = [
  'exact_measurable_outcome',
  'what_xiv_can_verify_today',
  'what_remains_candidate_research',
  'required_customer_government_data',
  'integrations_and_permissions',
  'expected_users_load',
  'latency_availability_targets',
  'backup_recovery',
  'tenant_universe_isolation',
  'audit_logging',
  'rollback_plan',
  'human_approvals_for_consequential_actions',
] as const;

export type AcceptanceChecklistItem =
  (typeof ACCEPTANCE_CHECKLIST_ITEMS)[number];

/**
 * Agent team — evidence to Home Base; no auto authority.
 */
export const DIGITAL_PRODUCT_AGENT_TEAM = [
  'solution_architect',
  'product',
  'ai_model',
  'data_engineering',
  'integration',
  'security',
  'devops',
  'test_qa',
  'pricing_cfo',
  'proposal',
] as const;

export type DigitalProductAgentRole =
  (typeof DIGITAL_PRODUCT_AGENT_TEAM)[number];

export const DIGITAL_PRODUCT_AGENT_BOUNDS = Object.freeze({
  mayReturnEvidenceToHomeBase: true as const,
  automaticAuthority: false as const,
  automaticProductionDeploy: false as const,
  automaticBidSubmission: false as const,
  automaticContractAcceptance: false as const,
  automaticCustomerDataIngest: false as const,
  automaticPermissionExpansion: false as const,
  mayRecommendOnly: true as const,
});

/** Quantum claim ladder — cannot fabricate PHYSICAL_QPU_VERIFIED. */
export const QUANTUM_CLAIM_STATES = [
  'THEORETICAL',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QuantumClaimState = (typeof QUANTUM_CLAIM_STATES)[number];

/** Certification / authorization claim labels that require evidence. */
export const CERTIFICATION_CLAIM_LABELS = [
  'FedRAMP',
  'FISMA',
  'CMMC',
  'clearance',
  'agency_authorization',
  'production_readiness',
] as const;

export type CertificationClaimLabel =
  (typeof CERTIFICATION_CLAIM_LABELS)[number];

export const DIGITAL_PRODUCT_CONTRACT_PACK_CYCLE = [
  'honesty_locks',
  'digital_product_pack_bootstrap',
  // A — Product families + solution record fields
  'product_families_encoded',
  'solution_record_fields_encoded',
  // B — Deployment honesty
  'deployment_options_encoded',
  'deployment_claim_only_if_tested',
  'untested_defaults_not_tested_candidate_or_not_available',
  // C — Government contract workflow
  'gov_contract_workflow_encoded',
  'solicitation_requirement',
  'digital_product_mapping',
  'architecture',
  'data_integration_plan',
  'security_compliance_gaps',
  'compute_sizing',
  'implementation_plan',
  'test_acceptance_criteria',
  'pricing',
  'proposal_evidence',
  // D — Acceptance checklist
  'acceptance_checklist_encoded',
  // E — Agent team bounds + Home Base evidence
  'agent_team_bounded',
  'agent_evidence_to_home_base',
  'no_agent_auto_authority',
  // F — Certification / autonomy denies
  'deny_fedramp_without_evidence',
  'deny_fisma_without_evidence',
  'deny_cmmc_without_evidence',
  'deny_clearance_without_evidence',
  'deny_agency_authorization_without_evidence',
  'deny_production_readiness_without_evidence',
  'no_autonomous_production_deploy',
  'no_autonomous_bid_submission',
  'no_autonomous_contract_acceptance',
  'no_autonomous_customer_data_ingest',
  'no_autonomous_permission_expansion',
  'quantum_claim_ladder_enforced',
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  // G — Soft-wires
  'eo1_soft_wire',
  'en158_soft_wire',
  'em10_soft_wire',
  'eo4_soft_wire',
  'eo5_soft_wire',
  'eo8_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eo9Hop = (typeof DIGITAL_PRODUCT_CONTRACT_PACK_CYCLE)[number];

export type Eo9EvidenceState =
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
  | 'THEORETICAL'
  | 'SIMULATED'
  | 'QUANTUM_INSPIRED'
  | 'PHYSICAL_QPU_VERIFIED'
  | 'TESTED';

export type Eo9HopRecord = {
  hop: Eo9Hop;
  state: Eo9EvidenceState;
  summary: string;
  at: string;
};

export type Eo9ActorKind =
  | DigitalProductAgentRole
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base';

export type Eo9Actor = {
  kind: Eo9ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EO9_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_DIGITAL_PRODUCT_PACK_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Certification / authorization claims — deny without evidence
  CLAIM_FEDRAMP_WITHOUT_EVIDENCE: false as const,
  CLAIM_FISMA_WITHOUT_EVIDENCE: false as const,
  CLAIM_CMMC_WITHOUT_EVIDENCE: false as const,
  CLAIM_CLEARANCE_WITHOUT_EVIDENCE: false as const,
  CLAIM_AGENCY_AUTHORIZATION_WITHOUT_EVIDENCE: false as const,
  CLAIM_PRODUCTION_READINESS_WITHOUT_EVIDENCE: false as const,

  // Hard autonomy denies
  AUTO_PRODUCTION_DEPLOY: false as const,
  AUTO_BID_SUBMISSION: false as const,
  AUTO_CONTRACT_ACCEPTANCE: false as const,
  AUTO_CUSTOMER_DATA_INGEST: false as const,
  AUTO_PERMISSION_EXPANSION: false as const,
  AUTO_SUBMIT_BID: false as const,
  AUTO_ACCEPT_CONTRACT: false as const,

  // Agent authority bounds
  AGENT_AUTO_AUTHORITY: false as const,
  AGENT_AUTO_PRODUCTION_DEPLOY: false as const,
  AGENT_AUTO_BID_SUBMISSION: false as const,
  AGENT_AUTO_CONTRACT_ACCEPTANCE: false as const,
  AGENT_AUTO_CUSTOMER_DATA_INGEST: false as const,
  AGENT_AUTO_PERMISSION_EXPANSION: false as const,

  // Deployment honesty
  CLAIM_DEPLOYMENT_WITHOUT_TEST: false as const,
  UNTESTED_DEPLOYMENT_EQ_VERIFIED: false as const,
  UNTESTED_DEPLOYMENT_EQ_TESTED: false as const,

  // Quantum
  AUTO_UPGRADE_QUANTUM_CLAIM_TO_PHYSICAL_QPU_VERIFIED: false as const,
  QUANTUM_INSPIRED_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  SIMULATED_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  THEORETICAL_EQ_OPERATIONAL: false as const,

  // Recommend ≠ act
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_DEPLOY: false as const,
  RECOMMEND_EQ_SUBMIT: false as const,
  RECOMMEND_EQ_ACCEPT: false as const,
  RECOMMEND_EQ_INGEST: false as const,
  RECOMMEND_EQ_EXPAND_PERMISSIONS: false as const,

  // Isolation
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  // Human gates
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  HUMAN_AUTHORIZED_SUBMISSION_REQUIRED: true as const,
});

export const EO9_MAY = Object.freeze([
  'register_digital_solution_records',
  'map_solicitation_to_product_families',
  'draft_architecture_plans',
  'draft_data_integration_plans',
  'surface_security_compliance_gaps',
  'size_compute_candidately',
  'draft_implementation_plans',
  'encode_acceptance_checklists',
  'open_pricing_scenarios',
  'prepare_proposal_evidence_packages',
  'label_deployment_claim_states',
  'return_agent_evidence_to_home_base',
] as const);

export const EO9_MUST_NOT = Object.freeze([
  'claim_fedramp_without_evidence',
  'claim_fisma_without_evidence',
  'claim_cmmc_without_evidence',
  'claim_clearance_without_evidence',
  'claim_agency_authorization_without_evidence',
  'claim_production_readiness_without_evidence',
  'autonomous_production_deploy',
  'autonomous_bid_submission',
  'autonomous_contract_acceptance',
  'autonomous_customer_data_ingest',
  'autonomous_permission_expansion',
  'claim_deployment_tested_without_test',
  'upgrade_quantum_claim_without_verification',
  'bypass_guardian_rls_tenant_universe',
  'treat_recommend_as_act',
  'grant_agents_automatic_authority',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eo9SoftWireSnapshot = {
  eo1GovContractsCommandCenter: SoftWirePresence;
  eo1Report: SoftWirePresence;
  en158DealOs: SoftWirePresence;
  en158DealRuntime: SoftWirePresence;
  en158Report: SoftWirePresence;
  em10UserAccessEconomy: SoftWirePresence;
  em10Report: SoftWirePresence;
  eo4AiQuantumCapabilityMatrix: SoftWirePresence;
  eo4Report: SoftWirePresence;
  eo5QuantumEvidenceBoundary: SoftWirePresence;
  eo5Report: SoftWirePresence;
  eo8SupplyChainResiliencePack: SoftWirePresence;
  eo8Report: SoftWirePresence;
  em1HomeBaseContract: SoftWirePresence;
};

export function assertEo9LocksIntact(): boolean {
  return (
    EO9_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EO9_LOCKS.CLAIM_FEDRAMP_WITHOUT_EVIDENCE === false &&
    EO9_LOCKS.CLAIM_FISMA_WITHOUT_EVIDENCE === false &&
    EO9_LOCKS.CLAIM_CMMC_WITHOUT_EVIDENCE === false &&
    EO9_LOCKS.CLAIM_CLEARANCE_WITHOUT_EVIDENCE === false &&
    EO9_LOCKS.CLAIM_AGENCY_AUTHORIZATION_WITHOUT_EVIDENCE === false &&
    EO9_LOCKS.CLAIM_PRODUCTION_READINESS_WITHOUT_EVIDENCE === false &&
    EO9_LOCKS.AUTO_PRODUCTION_DEPLOY === false &&
    EO9_LOCKS.AUTO_BID_SUBMISSION === false &&
    EO9_LOCKS.AUTO_CONTRACT_ACCEPTANCE === false &&
    EO9_LOCKS.AUTO_CUSTOMER_DATA_INGEST === false &&
    EO9_LOCKS.AUTO_PERMISSION_EXPANSION === false &&
    EO9_LOCKS.AUTO_SUBMIT_BID === false &&
    EO9_LOCKS.AUTO_ACCEPT_CONTRACT === false &&
    EO9_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    EO9_LOCKS.AGENT_AUTO_PRODUCTION_DEPLOY === false &&
    EO9_LOCKS.AGENT_AUTO_BID_SUBMISSION === false &&
    EO9_LOCKS.AGENT_AUTO_CONTRACT_ACCEPTANCE === false &&
    EO9_LOCKS.AGENT_AUTO_CUSTOMER_DATA_INGEST === false &&
    EO9_LOCKS.AGENT_AUTO_PERMISSION_EXPANSION === false &&
    EO9_LOCKS.CLAIM_DEPLOYMENT_WITHOUT_TEST === false &&
    EO9_LOCKS.UNTESTED_DEPLOYMENT_EQ_VERIFIED === false &&
    EO9_LOCKS.UNTESTED_DEPLOYMENT_EQ_TESTED === false &&
    EO9_LOCKS.AUTO_UPGRADE_QUANTUM_CLAIM_TO_PHYSICAL_QPU_VERIFIED === false &&
    EO9_LOCKS.QUANTUM_INSPIRED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO9_LOCKS.SIMULATED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO9_LOCKS.THEORETICAL_EQ_OPERATIONAL === false &&
    EO9_LOCKS.RECOMMEND_EQ_ACT === false &&
    EO9_LOCKS.RECOMMEND_EQ_DEPLOY === false &&
    EO9_LOCKS.RECOMMEND_EQ_SUBMIT === false &&
    EO9_LOCKS.RECOMMEND_EQ_ACCEPT === false &&
    EO9_LOCKS.RECOMMEND_EQ_INGEST === false &&
    EO9_LOCKS.RECOMMEND_EQ_EXPAND_PERMISSIONS === false &&
    EO9_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    EO9_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EO9_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EO9_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EO9_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EO9_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EO9_LOCKS.HUMAN_AUTHORIZED_SUBMISSION_REQUIRED === true &&
    EO9_LOCKS.TIP_LAND === false &&
    EO9_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EO9_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EO9_LOCKS.FULL_PRODUCTION_DIGITAL_PRODUCT_PACK_SHIPPED === false &&
    EO9_LOCKS.MANAGE_PULL_REQUEST === false &&
    DIGITAL_PRODUCT_AGENT_BOUNDS.automaticAuthority === false &&
    DIGITAL_PRODUCT_AGENT_BOUNDS.automaticProductionDeploy === false &&
    DIGITAL_PRODUCT_AGENT_BOUNDS.automaticBidSubmission === false &&
    DIGITAL_PRODUCT_AGENT_BOUNDS.automaticContractAcceptance === false &&
    DIGITAL_PRODUCT_AGENT_BOUNDS.automaticCustomerDataIngest === false &&
    DIGITAL_PRODUCT_AGENT_BOUNDS.automaticPermissionExpansion === false
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
 * Soft-wire EO1 / EN / EM10 / EO4 / EO5 / EO8 when present.
 * Presence alone ≠ VERIFIED.
 */
export function eo9SoftWireSnapshot(repoRoot?: string): Eo9SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eo1GovContractsCommandCenter: softWireFile(
      './government-contracts-command-center-types.ts',
      'EO1 Government Contracts Command Center PRESENT (soft-wire).',
      'EO1 Government Contracts Command Center absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo1Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO1_GOVERNMENT_CONTRACTS_COMMAND_CENTER_REPORT.md',
      'EO1 report PRESENT.',
      'EO1 report absent on this tip — soft-wire WAITING_DATA.',
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
    eo4AiQuantumCapabilityMatrix: softWireFile(
      './ai-quantum-capability-matrix-types.ts',
      'EO4 AI/Quantum Capability Matrix PRESENT (soft-wire).',
      'EO4 AI/Quantum Capability Matrix absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo4Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO4_AI_QUANTUM_CAPABILITY_MATRIX_REPORT.md',
      'EO4 report PRESENT.',
      'EO4 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo5QuantumEvidenceBoundary: softWireFile(
      './quantum-evidence-boundary-types.ts',
      'EO5 Quantum Evidence Boundary PRESENT (soft-wire).',
      'EO5 Quantum Evidence Boundary absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo5Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO5_QUANTUM_EVIDENCE_BOUNDARY_REPORT.md',
      'EO5 report PRESENT.',
      'EO5 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo8SupplyChainResiliencePack: softWireFile(
      './supply-chain-resilience-pack-types.ts',
      'EO8 Supply Chain Resilience Pack PRESENT (soft-wire).',
      'EO8 Supply Chain Resilience Pack absent on this tip — soft-wire WAITING_DATA / probe-only (base branch tip used).',
    ),
    eo8Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO8_SUPPLY_CHAIN_RESILIENCE_PACK_REPORT.md',
      'EO8 report PRESENT.',
      'EO8 report absent on this tip — soft-wire WAITING_DATA.',
    ),
    em1HomeBaseContract: softWireFile(
      './agent-home-base-contract.ts',
      'EM1 agent home base contract PRESENT (agents return evidence).',
      'EM1 agent home base contract absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function isHumanApprover(actor: Eo9Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isDigitalProductAgent(actor: Eo9Actor): boolean {
  return (DIGITAL_PRODUCT_AGENT_TEAM as readonly string[]).includes(actor.kind);
}

/**
 * Default deployment claim for untested options.
 * Prefer NOT_TESTED; CANDIDATE when architecture-listed but unproven;
 * NOT_AVAILABLE when explicitly unsupported.
 */
export function defaultDeploymentClaimState(
  option: DeploymentOption,
  opts?: { architectureListed?: boolean; explicitlyUnsupported?: boolean },
): DeploymentClaimState {
  if (opts?.explicitlyUnsupported) return 'NOT_AVAILABLE';
  if (opts?.architectureListed) return 'CANDIDATE';
  void option;
  return 'NOT_TESTED';
}
