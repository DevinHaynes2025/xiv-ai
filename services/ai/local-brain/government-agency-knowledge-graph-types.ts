/**
 * 62L-EO2 — Government Agency Knowledge Graph (park-and-implement).
 *
 * SoT: GitHub #159 EO family (authoritative). GitLab mirror: not resolved in
 * this environment (GitLab MCP needsAuth; no issue number invented).
 * Soft-wire: EO1 Command Center, #159 EO Mission OS, #158 EN Deal OS when PRESENT.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * Graph model (encoded):
 * Agency → Bureau → Program → Mission → Procurement Vehicle → Opportunity →
 * Award History → Vendor/Prime/Sub → Requirement → Outcome
 *
 * Relationship inference labels: PUBLIC_EVIDENCE | HYPOTHESIS | UNKNOWN.
 *
 * Rules:
 * - Historical award data ≠ future preference
 * - Public contractor relationships ≠ partnership with XIV
 * - Agency priorities from current official/public evidence only
 * - Political/leadership changes timestamped ≠ permanent
 * - Sensitive/classified procurement excluded unless separately authorized
 * - No automated lobbying, improper influence, bribery, or procurement manipulation
 * - Authorized / public / licensed data only
 * - DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 159 as const;
export const GITHUB_SOT_TITLE =
  '62L-EO2 Government Agency Knowledge Graph — provenance-backed agencies, bureaus, missions, programs, procurement vehicles, historical awards, and public priorities' as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EO2_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EO3 — Quantum Mission Opportunity Watch — continuously organize public quantum-computing, sensing, networking, semiconductor, HPC, and AI/ML opportunities into an evidence-backed research and capture pipeline.' as const;

/**
 * Canonical graph hop chain (Agency → … → Outcome).
 */
export const AGENCY_KNOWLEDGE_GRAPH_MODEL = [
  'agency',
  'bureau',
  'program',
  'mission',
  'procurement_vehicle',
  'opportunity',
  'award_history',
  'vendor_prime_sub',
  'requirement',
  'outcome',
] as const;

export type AgencyGraphNodeKind = (typeof AGENCY_KNOWLEDGE_GRAPH_MODEL)[number];

/** Relationship inference class — required on inferred edges. */
export const RELATIONSHIP_INFERENCE_LABELS = [
  'PUBLIC_EVIDENCE',
  'HYPOTHESIS',
  'UNKNOWN',
] as const;

export type RelationshipInferenceLabel =
  (typeof RELATIONSHIP_INFERENCE_LABELS)[number];

/** Evidence class retained on nodes / edges. */
export type EvidenceClass =
  | 'official_public'
  | 'licensed_public'
  | 'historical_award_public'
  | 'hypothesis_labeled'
  | 'unknown'
  | 'classified_excluded';

export const XIV_CAPABILITY_ALIGNMENT_TAGS = [
  'logistics',
  'ai',
  'quantum',
  'data',
  'simulation',
  'modernization',
] as const;

export type XivCapabilityAlignmentTag =
  (typeof XIV_CAPABILITY_ALIGNMENT_TAGS)[number];

export const GOVERNMENT_AGENCY_KNOWLEDGE_GRAPH_CYCLE = [
  'honesty_locks',
  'agency_kg_bootstrap',
  // A — Graph model + node retained fields
  'graph_model_encoded',
  'node_retained_fields',
  'register_agency_node',
  'register_bureau_program_mission',
  'register_procurement_vehicle',
  'register_opportunity_award',
  'register_vendor_requirement_outcome',
  // B — Provenance + freshness + confidence
  'provenance_required',
  'source_url_date_freshness_confidence',
  'evidence_class_labeled',
  // C — Inference labels
  'relationship_inference_labels',
  'public_evidence_vs_hypothesis_vs_unknown',
  // D — Core use surfaces (contracts)
  'find_agencies_aligned_capabilities',
  'identify_repeated_procurement_patterns',
  'common_requirement_language',
  'surface_compliance_gap_hypotheses',
  'connect_awards_to_capture_hypotheses',
  'tailor_proposal_evidence_to_mission',
  // E — Hard honesty denies
  'historical_award_neq_future_preference',
  'public_contractor_neq_xiv_partnership',
  'priorities_from_current_public_evidence_only',
  'leadership_change_timestamped_neq_permanent',
  'classified_procurement_excluded',
  'no_automated_lobbying',
  'no_improper_influence',
  'no_bribery',
  'no_procurement_manipulation',
  'authorized_public_licensed_data_only',
  // F — Soft-wire EO1 / #159 EO / #158 EN
  'eo1_command_center_soft_wire',
  'eo_159_mission_os_soft_wire',
  'en_158_deal_os_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Eo2Hop = (typeof GOVERNMENT_AGENCY_KNOWLEDGE_GRAPH_CYCLE)[number];

export type Eo2EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'WAITING_DATA'
  | 'NOT_APPLIED'
  | 'PUBLIC_EVIDENCE'
  | 'HYPOTHESIS'
  | 'UNKNOWN'
  | 'PROVENANCE_LABELED'
  | 'IMPLEMENTED'
  | 'RECOMMENDATION_ONLY'
  | 'PLAN_ONLY'
  | 'EXCLUDED';

export type Eo2HopRecord = {
  hop: Eo2Hop;
  state: Eo2EvidenceState;
  summary: string;
  at: string;
};

export type Eo2ActorKind =
  | 'agency_research_analyst'
  | 'capture_analyst'
  | 'proposal_evidence_curator'
  | 'compliance_spotter'
  | 'human_approver'
  | 'founder'
  | 'guardian';

export type Eo2Actor = {
  kind: Eo2ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

/** Retained fields shared across graph nodes. */
export type AgencyGraphProvenance = {
  sourceUrlOrReference: string;
  sourceDate: string;
  freshness: 'current' | 'stale' | 'unknown';
  confidence: number;
  evidenceClass: EvidenceClass;
};

export const EO2_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_AGENCY_KG_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Core honesty rules
  HISTORICAL_AWARD_EQ_FUTURE_PREFERENCE: false as const,
  PUBLIC_CONTRACTOR_EQ_XIV_PARTNERSHIP: false as const,
  PRIORITIES_WITHOUT_CURRENT_PUBLIC_EVIDENCE: false as const,
  LEADERSHIP_CHANGE_EQ_PERMANENT: false as const,
  CLASSIFIED_PROCUREMENT_WITHOUT_AUTHORIZATION: false as const,

  // Influence / lobbying / procurement integrity
  AUTOMATED_LOBBYING: false as const,
  IMPROPER_INFLUENCE: false as const,
  BRIBERY: false as const,
  PROCUREMENT_MANIPULATION: false as const,

  // Data posture
  UNAUTHORIZED_OR_CLASSIFIED_INGEST: false as const,
  NON_PUBLIC_UNLICENSED_DATA: false as const,

  // Inference honesty
  HYPOTHESIS_EQ_PUBLIC_EVIDENCE: false as const,
  UNKNOWN_EQ_PUBLIC_EVIDENCE: false as const,
  INFERENCE_WITHOUT_LABEL: false as const,

  // Autonomy / capture
  AUTO_SUBMIT_BID: false as const,
  AUTO_LOBBY: false as const,
  AUTO_CONTACT_AGENCY_OFFICIALS: false as const,
  RECOMMEND_EQ_ACT: false as const,

  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,

  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_CAPTURE_ACTIONS: true as const,
});

export const EO2_MAY = Object.freeze([
  'register_public_agency_graph_nodes',
  'label_provenance_freshness_confidence',
  'label_relationship_inference',
  'find_agencies_aligned_with_xiv_capabilities',
  'identify_repeated_procurement_patterns',
  'surface_common_requirement_language',
  'surface_likely_compliance_gap_hypotheses',
  'connect_historical_awards_to_capture_hypotheses',
  'tailor_proposal_evidence_to_agency_mission',
] as const);

export const EO2_MUST_NOT = Object.freeze([
  'treat_historical_awards_as_future_preference',
  'claim_xiv_partnership_from_public_contractor_records',
  'assert_agency_priorities_without_current_public_evidence',
  'treat_leadership_changes_as_permanent',
  'ingest_classified_procurement_without_authorization',
  'automated_lobbying',
  'improper_influence',
  'bribery',
  'procurement_manipulation',
  'use_unauthorized_or_unlicensed_data',
  'omit_inference_labels',
  'autonomously_submit_bids_or_contact_officials',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eo2SoftWireSnapshot = {
  eo1CommandCenter: SoftWirePresence;
  eo159MissionOsTypes: SoftWirePresence;
  eo159MissionOsRuntime: SoftWirePresence;
  eo159Report: SoftWirePresence;
  en158DealOs: SoftWirePresence;
  en158DealRuntime: SoftWirePresence;
  en158Report: SoftWirePresence;
};

export function assertEo2LocksIntact(): boolean {
  return (
    EO2_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EO2_LOCKS.HISTORICAL_AWARD_EQ_FUTURE_PREFERENCE === false &&
    EO2_LOCKS.PUBLIC_CONTRACTOR_EQ_XIV_PARTNERSHIP === false &&
    EO2_LOCKS.PRIORITIES_WITHOUT_CURRENT_PUBLIC_EVIDENCE === false &&
    EO2_LOCKS.LEADERSHIP_CHANGE_EQ_PERMANENT === false &&
    EO2_LOCKS.CLASSIFIED_PROCUREMENT_WITHOUT_AUTHORIZATION === false &&
    EO2_LOCKS.AUTOMATED_LOBBYING === false &&
    EO2_LOCKS.IMPROPER_INFLUENCE === false &&
    EO2_LOCKS.BRIBERY === false &&
    EO2_LOCKS.PROCUREMENT_MANIPULATION === false &&
    EO2_LOCKS.UNAUTHORIZED_OR_CLASSIFIED_INGEST === false &&
    EO2_LOCKS.NON_PUBLIC_UNLICENSED_DATA === false &&
    EO2_LOCKS.HYPOTHESIS_EQ_PUBLIC_EVIDENCE === false &&
    EO2_LOCKS.UNKNOWN_EQ_PUBLIC_EVIDENCE === false &&
    EO2_LOCKS.INFERENCE_WITHOUT_LABEL === false &&
    EO2_LOCKS.AUTO_SUBMIT_BID === false &&
    EO2_LOCKS.AUTO_LOBBY === false &&
    EO2_LOCKS.AUTO_CONTACT_AGENCY_OFFICIALS === false &&
    EO2_LOCKS.RECOMMEND_EQ_ACT === false &&
    EO2_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EO2_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EO2_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EO2_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_CAPTURE_ACTIONS ===
      true &&
    EO2_LOCKS.TIP_LAND === false &&
    EO2_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EO2_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EO2_LOCKS.FULL_PRODUCTION_AGENCY_KG_SHIPPED === false &&
    EO2_LOCKS.MANAGE_PULL_REQUEST === false
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
 * Soft-wire EO1 Command Center, #159 EO Mission OS, #158 EN Deal OS when present.
 * Presence alone ≠ VERIFIED.
 */
export function eo2SoftWireSnapshot(repoRoot?: string): Eo2SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eo1CommandCenter: softWireFile(
      './government-contracts-command-center.ts',
      'EO1 Government Contracts Command Center PRESENT (soft-wire).',
      'EO1 Command Center absent on this tip — soft-wire WAITING_DATA / probe-only.',
    ),
    eo159MissionOsTypes: softWireFile(
      './government-quantum-ai-mission-os-types.ts',
      '#159 EO Mission OS types PRESENT (soft-wire).',
      '#159 EO Mission OS types absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo159MissionOsRuntime: softWireFile(
      './government-quantum-ai-mission-os-runtime.ts',
      '#159 EO Mission OS runtime PRESENT (soft-wire).',
      '#159 EO Mission OS runtime absent on this tip — soft-wire WAITING_DATA.',
    ),
    eo159Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EO_GOVERNMENT_QUANTUM_AI_MISSION_OS_REPORT.md',
      '#159 EO report PRESENT.',
      '#159 EO report absent on this tip — soft-wire WAITING_DATA.',
    ),
    en158DealOs: softWireFile(
      './deal-contract-intelligence-os.ts',
      'EN (#158) Deal & Contract Intelligence OS PRESENT (soft-wire).',
      'EN (#158) Deal OS absent — soft-wire WAITING_DATA.',
    ),
    en158DealRuntime: softWireFile(
      './deal-contract-intelligence-os-runtime.ts',
      'EN (#158) deal/gov runtime PRESENT (soft-wire).',
      'EN (#158) deal/gov runtime absent — soft-wire WAITING_DATA.',
    ),
    en158Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EN_DEAL_CONTRACT_INTELLIGENCE_OS_REPORT.md',
      'EN (#158) report PRESENT.',
      'EN (#158) report absent.',
    ),
  };
}

export function isHumanApprover(actor: Eo2Actor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

/** Node retained field inventory (contract surface). */
export const NODE_RETAINED_FIELDS = Object.freeze([
  'officialName',
  'agencyBureauHierarchy',
  'missionAndPublicPriorities',
  'programNames',
  'procurementVehicles',
  'naicsPscAssociations',
  'publicBudgetProgramReferences',
  'historicalSolicitations',
  'publicAwardHistory',
  'incumbentContractorContext',
  'setAsidePatterns',
  'contractingOffice',
  'sourceUrlOrReference',
  'sourceDate',
  'freshness',
  'confidence',
  'evidenceClass',
] as const);
