/**
 * 62L-EO3 — Quantum Mission Opportunity Watch.
 *
 * Soft-wires EO1 Government Contracts Command Center, EO2 Agency Knowledge Graph,
 * and umbrella #159 EO (Government Quantum/AI Mission OS). Parent EO1/EO2 code may
 * be WAITING_DATA on this lineage — presence alone ≠ VERIFIED.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * Hard rule (tested): the watch must NEVER upgrade a capability label or quantum
 * truth state just because a solicitation asks for it.
 *
 * Core workflow:
 * Official opportunity source → classify → capability match → readiness gaps →
 * strategic score → EO Command Center → human bid/no-bid
 *
 * No fabricated certifications, clearances, past performance, or QPU access.
 * No autonomous bid submission or external commitment.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

/** Soft-wire SoT for umbrella EO (#159). EO3 is the watch-layer child. */
export const GITHUB_SOT_ISSUE = 159 as const;
export const GITHUB_SOT_TITLE =
  '62L-EO Government Quantum/AI Mission OS (umbrella) — EO3 Quantum Mission Opportunity Watch' as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EO3_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EO4 — AI & Quantum Capability Matrix — map every government requirement to what XIV can actually prove today vs research/simulated/unavailable.' as const;

/**
 * Core watch workflow (encoded):
 * Official opportunity source → classify → capability match → readiness gaps →
 * strategic score → EO Command Center → human bid/no-bid
 */
export const QUANTUM_MISSION_WATCH_FLOW = [
  'official_opportunity_source',
  'classify',
  'capability_match',
  'readiness_gaps',
  'strategic_score',
  'eo_command_center',
  'human_bid_no_bid',
] as const;

export type WatchFlowHop = (typeof QUANTUM_MISSION_WATCH_FLOW)[number];

export const QUANTUM_MISSION_OPPORTUNITY_WATCH_CYCLE = [
  'honesty_locks',
  'watch_bootstrap',
  // A — ingest official / authorized sources only
  'official_source_ingest',
  'preserve_publication_date_and_solicitation_id',
  'prioritize_official_authorized_sources',
  // B — classify mission domains + contract/research type
  'classify_mission_domain',
  'distinguish_notice_types',
  // C — capability match (no solicitation-driven upgrade)
  'capability_match_labels',
  'quantum_truth_states',
  'no_auto_capability_upgrade_from_solicitation',
  // D — readiness / eligibility gaps (evidence-gated)
  'readiness_gaps',
  'no_eligibility_claim_without_entity_evidence',
  'no_fabricated_certifications_clearances_pp_qpu',
  // E — strategic score + capture priority
  'strategic_score',
  'capture_priority_assign',
  // F — soft-wire EO1/EO2/#159 + human bid/no-bid
  'eo1_command_center_soft_wire',
  'eo2_agency_graph_soft_wire',
  'eo159_umbrella_soft_wire',
  'en_deal_os_soft_wire',
  'route_to_eo_command_center',
  'human_bid_no_bid_gate',
  'no_autonomous_bid',
  'watch_flow_encoded',
  'evidence',
] as const;

export type Eo3Hop = (typeof QUANTUM_MISSION_OPPORTUNITY_WATCH_CYCLE)[number];

export type Eo3EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'WAITING_DATA'
  | 'WAITING_NODE'
  | 'OFFLINE_STOPPED'
  | 'STALE'
  | 'UNKNOWN'
  | 'NOT_TESTED'
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
  | 'LABELED_SIMULATION'
  | 'NOT_APPLIED'
  | 'NOT_VERIFIED'
  | 'UNCONNECTED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'HUMAN_BID_NO_BID_REQUIRED'
  | 'ADVISORY_ONLY'
  | 'SUPPORTED'
  | 'NOT_AVAILABLE'
  | 'REGISTERED'
  | 'CLASSIFIED'
  | 'MATCHED'
  | 'SCORED'
  | 'ROUTED';

export type Eo3HopRecord = {
  hop: Eo3Hop;
  state: Eo3EvidenceState;
  summary: string;
  at: string;
};

/** Opportunity classification domains (EO3 watch scope). */
export const OPPORTUNITY_CLASSIFICATION_DOMAINS = [
  'quantum_computing_simulation',
  'quantum_sensing_timing',
  'quantum_networking',
  'ai_ml_agentic_systems',
  'hpc_accelerated_computing',
  'semiconductor_chip_research',
  'logistics_modernization',
  'supply_chain_resilience',
  'digital_twins_simulation',
  'edge_embedded_ai',
  'data_infrastructure_search',
  'telecom_satellite_systems',
  'cybersecurity_adjacent_defensive_modernization',
] as const;

export type OpportunityClassificationDomain =
  (typeof OPPORTUNITY_CLASSIFICATION_DOMAINS)[number];

/** Notice / instrument types — must be distinguished, not collapsed. */
export const NOTICE_INSTRUMENT_TYPES = [
  'grant',
  'rfi',
  'baa',
  'sbir_sttr',
  'contract',
  'idiq',
  'task_order',
  'research_program',
  'other_authorized',
] as const;

export type NoticeInstrumentType = (typeof NOTICE_INSTRUMENT_TYPES)[number];

/** Capability matching labels — evidence-gated; never solicitation-upgraded. */
export const CAPABILITY_MATCH_LABELS = [
  'VERIFIED',
  'SUPPORTED',
  'CANDIDATE',
  'NOT_AVAILABLE',
] as const;

export type CapabilityMatchLabel = (typeof CAPABILITY_MATCH_LABELS)[number];

/** Quantum-specific truth states — evidence-gated; never solicitation-upgraded. */
export const QUANTUM_TRUTH_STATES = [
  'PHYSICAL_QPU_VERIFIED',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'THEORETICAL',
] as const;

export type QuantumTruthState = (typeof QUANTUM_TRUTH_STATES)[number];

export type CapturePriority = 'P0' | 'P1' | 'P2' | 'P3' | 'WATCH_ONLY' | 'NO_BID_ADVISORY';

export type SourceAuthority = 'official' | 'authorized' | 'unofficial' | 'unknown';

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Eo3SoftWireSnapshot = {
  eo1CommandCenter: SoftWirePresence;
  eo1CommandCenterReport: SoftWirePresence;
  eo2AgencyGraph: SoftWirePresence;
  eo2AgencyGraphReport: SoftWirePresence;
  eoUmbrellaReport: SoftWirePresence;
  enDealContractOs: SoftWirePresence;
  enDealContractReport: SoftWirePresence;
};

export const EO3_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_WATCH_SHIPPED: false as const,
  // Hard autonomy boundary
  AUTO_SUBMIT_BID: false as const,
  AUTONOMOUS_BID_SUBMISSION: false as const,
  AUTONOMOUS_EXTERNAL_COMMITMENT: false as const,
  // Hard rule — solicitation must never upgrade capability / quantum truth
  AUTO_CAPABILITY_UPGRADE_FROM_SOLICITATION: false as const,
  SOLICITATION_ASK_EQ_CAPABILITY_VERIFIED: false as const,
  SOLICITATION_ASK_EQ_PHYSICAL_QPU_VERIFIED: false as const,
  // Fabrication denies
  FABRICATE_CERTIFICATIONS: false as const,
  FABRICATE_CLEARANCES: false as const,
  FABRICATE_PAST_PERFORMANCE: false as const,
  FABRICATE_QPU_ACCESS: false as const,
  // Eligibility honesty
  ELIGIBILITY_CLAIM_WITHOUT_ENTITY_EVIDENCE: false as const,
  UNOFFICIAL_SOURCE_EQ_OFFICIAL: false as const,
  // Recommend ≠ act
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_BID: false as const,
  SCORE_EQ_COMMIT: false as const,
  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  // Human gates
  HUMAN_BID_NO_BID_REQUIRED: true as const,
  HUMAN_OWNER_REQUIRED_FOR_CAPTURE: true as const,
});

export const EO3_MAY = Object.freeze([
  'ingest_official_authorized_opportunities',
  'classify_mission_domains',
  'match_capabilities_to_evidence',
  'surface_readiness_gaps',
  'compute_strategic_scores',
  'route_to_eo_command_center',
  'recommend_capture_priority',
] as const);

export const EO3_MUST_NOT = Object.freeze([
  'upgrade_capability_because_solicitation_asks',
  'fabricate_certifications_clearances_past_performance_qpu',
  'claim_eligibility_without_entity_evidence',
  'autonomously_submit_bids',
  'make_external_commitments',
] as const);

export const EO3_POLICY_FRAMING = Object.freeze({
  officialSources:
    'Prioritize official and authorized procurement/research sources; unofficial feeds are labeled and never promoted to official.',
  identifiers:
    'Preserve publication date and solicitation / notice identifiers on every watch record.',
  noticeTypes:
    'Distinguish grants, RFIs, BAAs, SBIR/STTR-style, contracts, IDIQs, task orders, and research programs.',
  noAutoUpgrade:
    'The watch must never upgrade a capability just because a solicitation asks for it.',
  humanGate:
    'Strategic score and capture priority are advisory; human owner decides bid/no-bid.',
});

export function assertEo3LocksIntact(): boolean {
  return (
    EO3_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EO3_LOCKS.AUTO_SUBMIT_BID === false &&
    EO3_LOCKS.AUTONOMOUS_BID_SUBMISSION === false &&
    EO3_LOCKS.AUTONOMOUS_EXTERNAL_COMMITMENT === false &&
    EO3_LOCKS.AUTO_CAPABILITY_UPGRADE_FROM_SOLICITATION === false &&
    EO3_LOCKS.SOLICITATION_ASK_EQ_CAPABILITY_VERIFIED === false &&
    EO3_LOCKS.SOLICITATION_ASK_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO3_LOCKS.FABRICATE_CERTIFICATIONS === false &&
    EO3_LOCKS.FABRICATE_CLEARANCES === false &&
    EO3_LOCKS.FABRICATE_PAST_PERFORMANCE === false &&
    EO3_LOCKS.FABRICATE_QPU_ACCESS === false &&
    EO3_LOCKS.ELIGIBILITY_CLAIM_WITHOUT_ENTITY_EVIDENCE === false &&
    EO3_LOCKS.UNOFFICIAL_SOURCE_EQ_OFFICIAL === false &&
    EO3_LOCKS.RECOMMEND_EQ_ACT === false &&
    EO3_LOCKS.RECOMMEND_EQ_BID === false &&
    EO3_LOCKS.SCORE_EQ_COMMIT === false &&
    EO3_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EO3_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EO3_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EO3_LOCKS.HUMAN_BID_NO_BID_REQUIRED === true &&
    EO3_LOCKS.HUMAN_OWNER_REQUIRED_FOR_CAPTURE === true &&
    EO3_LOCKS.TIP_LAND === false &&
    EO3_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EO3_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EO3_LOCKS.FULL_PRODUCTION_WATCH_SHIPPED === false
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
 * Soft-wire EO1 Command Center, EO2 agency graph, #159 EO umbrella, and EN deal OS
 * when present. Presence alone ≠ VERIFIED.
 */
export function eo3SoftWireSnapshot(repoRoot?: string): Eo3SoftWireSnapshot {
  const root =
    repoRoot ??
    join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    eo1CommandCenter: softWireFile(
      './government-contracts-command-center.ts',
      'EO1 Government Contracts Command Center PRESENT (soft-wire).',
      'EO1 Government Contracts Command Center absent — soft-wire no-op / WAITING_DATA.',
    ),
    eo1CommandCenterReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EO1_GOVERNMENT_CONTRACTS_COMMAND_CENTER_REPORT.md',
      'EO1 Command Center report PRESENT.',
      'EO1 Command Center report absent — soft-wire no-op / WAITING_DATA.',
    ),
    eo2AgencyGraph: softWireFile(
      './government-agency-knowledge-graph.ts',
      'EO2 Government Agency Knowledge Graph PRESENT (soft-wire).',
      'EO2 Agency Knowledge Graph absent — soft-wire no-op / WAITING_DATA.',
    ),
    eo2AgencyGraphReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EO2_GOVERNMENT_AGENCY_KNOWLEDGE_GRAPH_REPORT.md',
      'EO2 Agency Graph report PRESENT.',
      'EO2 Agency Graph report absent — soft-wire no-op / WAITING_DATA.',
    ),
    eoUmbrellaReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EO_GOVERNMENT_QUANTUM_AI_MISSION_OS_REPORT.md',
      'EO #159 umbrella report PRESENT.',
      'EO #159 umbrella report absent — soft-wire no-op / WAITING_DATA.',
    ),
    enDealContractOs: softWireFile(
      './deal-contract-intelligence-os.ts',
      'EN Deal & Contract Intelligence OS PRESENT (soft-wire).',
      'EN Deal & Contract Intelligence OS absent — soft-wire no-op.',
    ),
    enDealContractReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EN_DEAL_CONTRACT_INTELLIGENCE_OS_REPORT.md',
      'EN Deal OS report PRESENT.',
      'EN Deal OS report MISSING.',
    ),
  };
}

/** Rank helper — lower index = stronger evidence. Used to deny upgrades. */
export function capabilityLabelRank(label: CapabilityMatchLabel): number {
  return CAPABILITY_MATCH_LABELS.indexOf(label);
}

export function quantumTruthRank(state: QuantumTruthState): number {
  return QUANTUM_TRUTH_STATES.indexOf(state);
}

/**
 * Returns true if `next` would be a stronger capability claim than `current`
 * (i.e. an illegal solicitation-driven upgrade).
 */
export function isCapabilityUpgrade(
  current: CapabilityMatchLabel,
  next: CapabilityMatchLabel,
): boolean {
  return capabilityLabelRank(next) < capabilityLabelRank(current);
}

/**
 * Returns true if `next` would claim a stronger quantum truth than `current`.
 * PHYSICAL_QPU_VERIFIED is strongest; THEORETICAL is weakest.
 */
export function isQuantumTruthUpgrade(
  current: QuantumTruthState,
  next: QuantumTruthState,
): boolean {
  return quantumTruthRank(next) < quantumTruthRank(current);
}
