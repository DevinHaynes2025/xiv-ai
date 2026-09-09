/**
 * 62L-EO1 — Government Contracts Command Center (park-and-implement child).
 *
 * Dedicated public-sector opportunity surface: discover → decompose → assign →
 * price → review → track delivery — without losing governance or evidence.
 *
 * SoT: GitHub EO1 park-and-implement (Government Contracts Command Center).
 * Soft-wire: #159 EO Government Quantum AI Mission OS; #158 EN SAM/FAR;
 * CFO council denies. GitLab mirror: not resolved (needsAuth; no number invented).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * Public opportunity discovery ≠ eligibility.
 * Agents cannot fabricate registrations, certifications, clearances,
 * past performance, or quantum capability.
 * Quantum claims remain THEORETICAL | SIMULATED | QUANTUM_INSPIRED | PHYSICAL_QPU_VERIFIED.
 * Proposal packages may be drafted; bid submission / certifications / signatures /
 * representations require explicit human authorization.
 * No classified-data access or export-control bypass.
 * No autonomous purchasing, subcontract commitments, or physical dispatch.
 * Guardian/RLS/tenant/Universe isolation unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 * Next (report only): EO2 — Government Agency Knowledge Graph.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_LABEL = '62L-EO1' as const;
export const GITHUB_SOT_TITLE =
  '62L-EO1 Government Contracts Command Center — Opportunity Pipeline through Performance Control Tower' as const;

/** Soft-wired predecessor issue refs (presence ≠ VERIFIED). */
export const SOFT_WIRE_EO_ISSUE = 159 as const;
export const SOFT_WIRE_EN_ISSUE = 158 as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EO1_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EO2 — Government Agency Knowledge Graph — agencies, bureaus, missions, programs, historical awards, procurement vehicles, priorities, relationships with provenance.' as const;

/**
 * Core workflow (encoded):
 * Opportunity → Requirement decomposition → Bid/No-Bid → Capture plan →
 * Solution architecture → Logistics model → Quantum/AI evidence → Pricing →
 * Compliance matrix → Proposal → Human approval → Submission →
 * Performance control tower
 */
export const GOV_CONTRACTS_COMMAND_CENTER_WORKFLOW = [
  'opportunity',
  'requirement_decomposition',
  'bid_no_bid',
  'capture_plan',
  'solution_architecture',
  'logistics_model',
  'quantum_ai_evidence',
  'pricing',
  'compliance_matrix',
  'proposal',
  'human_approval',
  'submission',
  'performance_control_tower',
] as const;

export type GovContractsWorkflowHop =
  (typeof GOV_CONTRACTS_COMMAND_CENTER_WORKFLOW)[number];

/** Dedicated views (contracts/UI model — not necessarily full React UI). */
export const GOV_CONTRACTS_COMMAND_CENTER_VIEWS = [
  'opportunity_pipeline',
  'agency_intelligence',
  'requirements',
  'logistics_supply_chain',
  'quantum_ai_capability_matrix',
  'proposal_factory',
  'pricing_war_room',
  'compliance_evidence_vault',
  'negotiation_room',
  'contract_performance',
  'win_loss_learning',
] as const;

export type GovContractsViewId =
  (typeof GOV_CONTRACTS_COMMAND_CENTER_VIEWS)[number];

/** Quantum claim ladder — agents cannot fabricate PHYSICAL_QPU_VERIFIED. */
export const QUANTUM_CLAIM_STATES = [
  'THEORETICAL',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'PHYSICAL_QPU_VERIFIED',
] as const;

export type QuantumClaimState = (typeof QUANTUM_CLAIM_STATES)[number];

/** Tracked opportunity fields (encode). */
export const TRACKED_OPPORTUNITY_FIELDS = [
  'opportunityId',
  'agencyBureau',
  'solicitationOrNoticeId',
  'contractType',
  'naics',
  'psc',
  'dueDate',
  'estimatedValue',
  'setAsideStatus',
  'missionProblemStatement',
  'logisticsSupplyChainRequirements',
  'digitalProductRequirements',
  'physicalProductRequirements',
  'aiQuantumRequirements',
  'complianceRequirements',
  'requiredCertificationsEvidence',
  'pricingModel',
  'captureOwner',
  'proposalOwner',
  'technicalOwner',
  'cfoAccountantReview',
  'legalComplianceReview',
  'probability',
  'blockers',
  'approvalState',
] as const;

export type TrackedOpportunityField =
  (typeof TRACKED_OPPORTUNITY_FIELDS)[number];

export const GOVERNMENT_CONTRACTS_COMMAND_CENTER_CYCLE = [
  'honesty_locks',
  'command_center_bootstrap',
  // A — Opportunity register + tracked fields
  'opportunity_register',
  'tracked_fields_encoded',
  'public_discovery_neq_eligibility',
  // B — Workflow hops
  'requirement_decomposition',
  'bid_no_bid_gate',
  'capture_plan',
  'solution_architecture',
  'logistics_model',
  'quantum_ai_evidence',
  'pricing',
  'compliance_matrix',
  'proposal_draft',
  'human_approval',
  'submission_gate',
  'performance_control_tower',
  // C — Dedicated views
  'views_model_register',
  // D — Soft-wire EO #159 + EN #158 + CFO council
  'eo159_mission_os_soft_wire',
  'en158_sam_far_soft_wire',
  'cfo_council_deny_autonomy',
  // E — Hard autonomy / fabrication denies
  'no_fabricate_registration',
  'no_fabricate_certification',
  'no_fabricate_clearance',
  'no_fabricate_past_performance',
  'no_fabricate_quantum_capability',
  'quantum_claim_ladder_enforced',
  'no_auto_submit_bid',
  'no_auto_sign',
  'no_auto_certify',
  'no_auto_represent',
  'no_classified_access',
  'no_export_control_bypass',
  'no_autonomous_purchasing',
  'no_autonomous_subcontract',
  'no_autonomous_physical_dispatch',
  'guardian_rls_tenant_universe_isolation',
  'l4_autonomy_false',
  'evidence',
] as const;

export type Eo1Hop = (typeof GOVERNMENT_CONTRACTS_COMMAND_CENTER_CYCLE)[number];

export type Eo1EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
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
  | 'NOT_VERIFIED'
  | 'UNCONNECTED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED'
  | 'ADVISORY_ONLY'
  | 'APPROVED_BOUNDED'
  | 'BID'
  | 'NO_BID'
  | 'REGISTERED'
  | 'THEORETICAL'
  | 'SIMULATED'
  | 'QUANTUM_INSPIRED'
  | 'PHYSICAL_QPU_VERIFIED'
  | 'DISCOVERED_NOT_ELIGIBLE'
  | 'ELIGIBILITY_UNKNOWN';

export type Eo1HopRecord = {
  hop: Eo1Hop;
  state: Eo1EvidenceState;
  summary: string;
  at: string;
};

export type Eo1ActorKind =
  | 'capture_owner'
  | 'proposal_owner'
  | 'technical_owner'
  | 'cfo_council'
  | 'accountant'
  | 'legal_compliance'
  | 'logistics_advisor'
  | 'quantum_ai_analyst'
  | 'agency_intelligence'
  | 'win_loss_analyst'
  | 'guardian'
  | 'human_approver'
  | 'founder';

export type Eo1Actor = {
  kind: Eo1ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EO1_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_COMMAND_CENTER_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Discovery ≠ eligibility
  PUBLIC_DISCOVERY_EQ_ELIGIBILITY: false as const,

  // Fabrication denies
  FABRICATE_REGISTRATION: false as const,
  FABRICATE_CERTIFICATION: false as const,
  FABRICATE_CLEARANCE: false as const,
  FABRICATE_PAST_PERFORMANCE: false as const,
  FABRICATE_QUANTUM_CAPABILITY: false as const,
  AUTO_UPGRADE_QUANTUM_CLAIM_TO_PHYSICAL_QPU_VERIFIED: false as const,

  // Submission / representation / signature
  AUTO_SUBMIT_BID: false as const,
  AUTO_SIGN_CERTIFICATION: false as const,
  AUTO_MAKE_REPRESENTATION: false as const,
  AUTO_ACCEPT_CONTRACT: false as const,
  AUTO_SEND_BID: false as const,

  // Classified / export control
  CLASSIFIED_DATA_ACCESS: false as const,
  EXPORT_CONTROL_BYPASS: false as const,

  // Logistics / purchasing / subcontract
  AUTONOMOUS_PURCHASING: false as const,
  AUTONOMOUS_SUBCONTRACT_COMMITMENT: false as const,
  AUTONOMOUS_PHYSICAL_DISPATCH: false as const,
  AUTO_FREIGHT_DISPATCH: false as const,
  AUTO_PURCHASE_ORDER: false as const,

  // CFO council
  CFO_COUNCIL_MAY_AUTO_BID: false as const,
  CFO_COUNCIL_MAY_AUTO_PRICE_COMMIT: false as const,
  CFO_COUNCIL_MAY_AUTO_SPEND: false as const,
  CFO_COUNCIL_MAY_AUTO_SIGN: false as const,

  // Recommend ≠ act
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_BIND_PRICE: false as const,
  RECOMMEND_EQ_SUBMIT: false as const,
  RECOMMEND_EQ_SIGN: false as const,
  RECOMMEND_EQ_CHARGE: false as const,

  // Isolation unchanged
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,

  // Adapter defaults (inherit EN honesty)
  SAM_GOV_CONFIGURED: false as const,
  FAR_ADAPTER_CONFIGURED: false as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  // Human gates
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  HUMAN_AUTHORIZED_SUBMISSION_REQUIRED: true as const,
});

export const EO1_MAY = Object.freeze([
  'discover_public_opportunities',
  'register_tracked_opportunity_fields',
  'decompose_requirements',
  'recommend_bid_no_bid',
  'draft_capture_plan',
  'draft_solution_architecture',
  'model_logistics_advisory',
  'label_quantum_ai_evidence',
  'open_pricing_scenarios',
  'build_compliance_matrix',
  'draft_proposal_packages',
  'prepare_submission_packages',
  'track_performance_control_tower',
  'record_win_loss_learning',
  'render_command_center_view_models',
] as const);

export const EO1_MUST_NOT = Object.freeze([
  'treat_discovery_as_eligibility',
  'fabricate_registrations',
  'fabricate_certifications',
  'fabricate_clearances',
  'fabricate_past_performance',
  'fabricate_quantum_capability',
  'autonomously_submit_bids',
  'sign_certifications',
  'make_representations',
  'accept_contracts',
  'access_classified_data',
  'bypass_export_controls',
  'autonomous_purchasing',
  'autonomous_subcontract_commitments',
  'autonomous_physical_dispatch',
  'cfo_council_auto_bid_price_spend_sign',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eo1SoftWireSnapshot = {
  eo159MissionOsTypes: SoftWirePresence;
  eo159MissionOsRuntime: SoftWirePresence;
  eo159Report: SoftWirePresence;
  en158DealOs: SoftWirePresence;
  en158DealRuntime: SoftWirePresence;
  en158Report: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
  em10UserAccessEconomy: SoftWirePresence;
};

export function assertEo1LocksIntact(): boolean {
  return (
    EO1_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EO1_LOCKS.PUBLIC_DISCOVERY_EQ_ELIGIBILITY === false &&
    EO1_LOCKS.FABRICATE_REGISTRATION === false &&
    EO1_LOCKS.FABRICATE_CERTIFICATION === false &&
    EO1_LOCKS.FABRICATE_CLEARANCE === false &&
    EO1_LOCKS.FABRICATE_PAST_PERFORMANCE === false &&
    EO1_LOCKS.FABRICATE_QUANTUM_CAPABILITY === false &&
    EO1_LOCKS.AUTO_UPGRADE_QUANTUM_CLAIM_TO_PHYSICAL_QPU_VERIFIED === false &&
    EO1_LOCKS.AUTO_SUBMIT_BID === false &&
    EO1_LOCKS.AUTO_SIGN_CERTIFICATION === false &&
    EO1_LOCKS.AUTO_MAKE_REPRESENTATION === false &&
    EO1_LOCKS.AUTO_ACCEPT_CONTRACT === false &&
    EO1_LOCKS.AUTO_SEND_BID === false &&
    EO1_LOCKS.CLASSIFIED_DATA_ACCESS === false &&
    EO1_LOCKS.EXPORT_CONTROL_BYPASS === false &&
    EO1_LOCKS.AUTONOMOUS_PURCHASING === false &&
    EO1_LOCKS.AUTONOMOUS_SUBCONTRACT_COMMITMENT === false &&
    EO1_LOCKS.AUTONOMOUS_PHYSICAL_DISPATCH === false &&
    EO1_LOCKS.AUTO_FREIGHT_DISPATCH === false &&
    EO1_LOCKS.AUTO_PURCHASE_ORDER === false &&
    EO1_LOCKS.CFO_COUNCIL_MAY_AUTO_BID === false &&
    EO1_LOCKS.CFO_COUNCIL_MAY_AUTO_PRICE_COMMIT === false &&
    EO1_LOCKS.CFO_COUNCIL_MAY_AUTO_SPEND === false &&
    EO1_LOCKS.CFO_COUNCIL_MAY_AUTO_SIGN === false &&
    EO1_LOCKS.RECOMMEND_EQ_ACT === false &&
    EO1_LOCKS.RECOMMEND_EQ_BIND_PRICE === false &&
    EO1_LOCKS.RECOMMEND_EQ_SUBMIT === false &&
    EO1_LOCKS.RECOMMEND_EQ_SIGN === false &&
    EO1_LOCKS.RECOMMEND_EQ_CHARGE === false &&
    EO1_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    EO1_LOCKS.SAM_GOV_CONFIGURED === false &&
    EO1_LOCKS.FAR_ADAPTER_CONFIGURED === false &&
    EO1_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EO1_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EO1_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EO1_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EO1_LOCKS.HUMAN_AUTHORIZED_SUBMISSION_REQUIRED === true &&
    EO1_LOCKS.TIP_LAND === false &&
    EO1_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EO1_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EO1_LOCKS.FULL_PRODUCTION_COMMAND_CENTER_SHIPPED === false &&
    EO1_LOCKS.MANAGE_PULL_REQUEST === false
  );
}

function softWireFile(
  relFromLocalBrain: string,
  notePresent: string,
  noteAbsent: string,
): SoftWirePresence {
  const pathChecked = join(dirname(fileURLToPath(import.meta.url)), relFromLocalBrain);
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
 * Soft-wire #159 EO Mission OS + #158 EN SAM/FAR (+ EM surfaces).
 * Presence alone ≠ VERIFIED.
 */
export function eo1SoftWireSnapshot(repoRoot?: string): Eo1SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eo159MissionOsTypes: softWireFile(
      './government-quantum-ai-mission-os-types.ts',
      'EO (#159) Government Quantum AI Mission OS types PRESENT (soft-wire).',
      'EO (#159) Mission OS types absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo159MissionOsRuntime: softWireFile(
      './government-quantum-ai-mission-os-runtime.ts',
      'EO (#159) Mission OS runtime PRESENT (soft-wire).',
      'EO (#159) Mission OS runtime absent — soft-wire WAITING_DATA.',
    ),
    eo159Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO_GOVERNMENT_QUANTUM_AI_MISSION_OS_REPORT.md',
      'EO (#159) report PRESENT.',
      'EO (#159) report absent on this tip.',
    ),
    en158DealOs: softWireFile(
      './deal-contract-intelligence-os.ts',
      'EN (#158) Deal & Contract Intelligence OS PRESENT (SAM/FAR soft-wire).',
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
    em157HomeBase: softWireFile(
      './agent-compute-home-base-runtime.ts',
      '#157 agent-compute-home-base runtime PRESENT (pricing council soft-wire).',
      '#157 home-base absent — soft-wire WAITING_DATA.',
    ),
    em10UserAccessEconomy: softWireFile(
      './user-access-economy.ts',
      'EM10 User Access Economy PRESENT (soft-wire).',
      'EM10 User Access Economy absent.',
    ),
  };
}

export function isHumanApprover(actor: Eo1Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isCfoCouncil(actor: Eo1Actor): boolean {
  return actor.kind === 'cfo_council' || actor.kind === 'accountant';
}
