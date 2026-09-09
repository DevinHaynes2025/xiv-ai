/**
 * 62L-EO (#159) — Government Quantum AI Mission OS + Strategic Industries
 * Contracting + Logistics Modernization + Quantum/Agentic R&D +
 * Revenue Operations Council.
 *
 * SoT: GitHub #159 (authoritative). GitLab mirror: not resolved in this
 * environment (GitLab MCP needsAuth; no issue number invented).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * Soft-wire EN (#158) deal/gov contracting when PRESENT; EM1/EM10 pricing &
 * home base; EM fabric (CPU/GPU/NPU/QPU routing); Starlink remains UNCONNECTED
 * until credentials.
 *
 * XIV may analyze / advise / draft / decompose / recommend.
 * XIV MUST NOT autonomously send bids, make pricing commitments, spend money,
 * or sign contracts. Logistics autonomy denies freight / PO / prod-change.
 * Digital Twin ≠ founder. DETECTED ≠ VERIFIED. Satellite research ≠ control.
 * NQI agency names = research context labels (INTEGRATION_CANDIDATE /
 * RESEARCH_CONTEXT), not claimed official partnership unless evidenced.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 159 as const;
export const GITHUB_SOT_TITLE =
  '62L-EO Government Quantum AI Mission OS + Strategic Industries Contracting + Logistics Modernization + Quantum/Agentic R&D + Revenue Operations Council' as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EO_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EO1 — Government Contracts Command Center — dedicated section inside XIV for federal/state/local/corporate/strategic-industry opportunities decomposed into requirements, logistics problems, technical solutions, pricing, compliance, proposal tasks, human approvals, and contract-performance tracking.' as const;

/** QPU / accelerator evidence ladder — DETECTED ≠ VERIFIED. */
export const QPU_EVIDENCE_STATES = [
  'PHYSICAL_QPU_VERIFIED',
  'SIMULATED',
  'QUANTUM_INSPIRED',
  'THEORETICAL',
] as const;

export type QpuEvidenceState = (typeof QPU_EVIDENCE_STATES)[number];

/** Accelerator class for universal routing soft-wire. */
export const ACCELERATOR_CLASSES = ['CPU', 'GPU', 'NPU', 'QPU'] as const;
export type AcceleratorClass = (typeof ACCELERATOR_CLASSES)[number];

/**
 * NQI-aware framing — NIST/NSF/DOE whole-of-government research policy labels.
 * Not claimed affiliation / partnership unless evidenced.
 */
export const NQI_RESEARCH_CONTEXT_LABELS = Object.freeze({
  framing: 'NQI_WHOLE_OF_GOVERNMENT_RESEARCH_CONTEXT' as const,
  agencies: ['NIST', 'NSF', 'DOE'] as const,
  partnershipClaimDefault: 'RESEARCH_CONTEXT' as const,
  integrationDefault: 'INTEGRATION_CANDIDATE' as const,
  officialPartnershipClaimed: false as const,
});

export type NqiAgencyLabel = (typeof NQI_RESEARCH_CONTEXT_LABELS.agencies)[number];

export type PartnershipClaimStatus =
  | 'RESEARCH_CONTEXT'
  | 'INTEGRATION_CANDIDATE'
  | 'EVIDENCED_PARTNERSHIP'
  | 'UNAVAILABLE';

/** Mission packs (B). */
export const MISSION_PACK_IDS = [
  'quantum_ai',
  'logistics',
  'supply_chain_resilience',
  'digital_physical_products',
  'virtual_data_warehouses',
  'digital_twins',
  'strategic_industries',
  'telecom_satellite_research',
  'universal_accelerator_routing',
] as const;

export type MissionPackId = (typeof MISSION_PACK_IDS)[number];

/** Opportunity jurisdictions for Government Contracts Command Center (A / EO1 foundation). */
export const OPPORTUNITY_JURISDICTIONS = [
  'federal',
  'state',
  'local',
  'corporate',
  'strategic_industry',
] as const;

export type OpportunityJurisdiction = (typeof OPPORTUNITY_JURISDICTIONS)[number];

/** Decomposition facets for gov/contracts opportunities. */
export const OPPORTUNITY_DECOMPOSITION_FACETS = [
  'requirements',
  'logistics_problems',
  'technical_solutions',
  'pricing',
  'compliance',
  'proposal_tasks',
  'human_approvals',
  'contract_performance_tracking',
] as const;

export type OpportunityDecompositionFacet =
  (typeof OPPORTUNITY_DECOMPOSITION_FACETS)[number];

export const GOVERNMENT_QUANTUM_AI_MISSION_OS_CYCLE = [
  'honesty_locks',
  'mission_os_bootstrap',
  // A — Government Contracts Command Center foundation
  'gov_contracts_command_center_register',
  'opportunity_decompose',
  'human_approval_gates',
  // B — Mission packs
  'mission_pack_register',
  'universal_accelerator_routing_soft_wire',
  'qpu_evidence_gated',
  // C — Quantum/Agentic R&D (NQI-aware)
  'quantum_agentic_rd_register',
  'classical_baseline_required',
  'no_quantum_advantage_without_evidence',
  'nqi_research_context_labels',
  // D — Logistics Modernization + supply-chain resilience
  'logistics_modernization_advise',
  'no_autonomous_freight',
  'no_autonomous_purchase_order',
  'no_autonomous_prod_change',
  // E — CFO Daily Revenue Council
  'cfo_daily_revenue_council',
  'no_autonomous_bids',
  'no_autonomous_pricing_commitments',
  'no_autonomous_spend',
  'no_autonomous_sign_contracts',
  // F — Soft-wire EN (#158)
  'en_deal_gov_contracting_soft_wire',
  'sam_far_research_human_authorized_only',
  // G — Soft-wire EM1/EM10 + Starlink
  'em1_em10_pricing_home_base_soft_wire',
  'starlink_unconnected_until_credentials',
  // H — Honesty / digital twin / satellite
  'digital_twin_neq_founder',
  'detected_neq_verified',
  'satellite_research_neq_control',
  'documented_neq_implemented_neq_verified_neq_prod',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type EoHop = (typeof GOVERNMENT_QUANTUM_AI_MISSION_OS_CYCLE)[number];

export type EoEvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'UNCONNECTED'
  | 'WAITING_DATA'
  | 'NOT_APPLIED'
  | 'RESEARCH_CONTEXT'
  | 'INTEGRATION_CANDIDATE'
  | 'SIMULATED'
  | 'THEORETICAL';

export type EoHopRecord = {
  hop: EoHop;
  state: EoEvidenceState;
  summary: string;
  at: string;
};

export type EoActorKind =
  | 'mission_analyst'
  | 'contracts_analyst'
  | 'logistics_advisor'
  | 'quantum_rd_analyst'
  | 'cfo_council'
  | 'digital_twin'
  | 'human_approver'
  | 'founder'
  | 'guardian';

export type EoActor = {
  kind: EoActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const EO_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_MISSION_OS_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  // Hard autonomy boundary — CFO / contracting
  AUTO_SEND_BID: false as const,
  AUTO_PRICING_COMMITMENT: false as const,
  AUTO_SPEND: false as const,
  AUTO_SIGN_CONTRACT: false as const,
  AUTONOMOUS_CONTRACTS: false as const,

  // Logistics autonomy denies
  AUTO_FREIGHT_DISPATCH: false as const,
  AUTO_PURCHASE_ORDER: false as const,
  AUTO_PRODUCTION_CHANGE: false as const,

  // Recommend ≠ act
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_CHARGE: false as const,
  RECOMMEND_EQ_DEPLOY: false as const,
  RECOMMEND_EQ_SPEND: false as const,
  RECOMMEND_EQ_SIGN: false as const,
  RECOMMEND_EQ_BID: false as const,

  // Digital twin / founder honesty
  DIGITAL_TWIN_EQ_FOUNDER: false as const,
  DIGITAL_TWIN_MAY_CHARGE: false as const,
  DIGITAL_TWIN_MAY_DEPLOY: false as const,
  DIGITAL_TWIN_MAY_SPEND: false as const,
  DIGITAL_TWIN_MAY_SIGN: false as const,

  // Quantum / accelerator honesty
  DETECTED_EQ_VERIFIED: false as const,
  QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE: false as const,
  QUANTUM_WITHOUT_CLASSICAL_BASELINE: false as const,
  QPU_THEORETICAL_EQ_PHYSICAL_VERIFIED: false as const,
  SIMULATED_EQ_PHYSICAL_QPU_VERIFIED: false as const,

  // Satellite / telecom
  SATELLITE_RESEARCH_EQ_CONTROL: false as const,
  TELECOM_RESEARCH_EQ_LIVE_CONTROL: false as const,
  STARLINK_CONNECTED_WITHOUT_CREDENTIALS: false as const,
  LIVE_VEHICLE_CONTROL: false as const,

  // NQI / partnership honesty
  NQI_AGENCY_NAME_EQ_OFFICIAL_PARTNERSHIP: false as const,
  CLAIM_OFFICIAL_NIST_NSF_DOE_AFFILIATION_WITHOUT_EVIDENCE: false as const,

  // EN soft-wire inherits
  AUTO_SUBMIT_BID: false as const,
  AUTO_SIGN_CERTIFICATION: false as const,
  AUTO_MAKE_REPRESENTATION: false as const,
  AUTO_ACCEPT_CONTRACT: false as const,
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

export const EO_MAY = Object.freeze([
  'register_gov_opportunities',
  'decompose_requirements_logistics_tech_pricing_compliance',
  'draft_proposal_tasks',
  'advise_logistics_modernization',
  'run_quantum_rd_with_classical_baseline',
  'cfo_daily_pipeline_pricing_renewals_analysis',
  'recommend_lawful_revenue_channels',
  'probe_sam_far_research_adapters',
  'soft_wire_em_fabric_accelerator_routing',
  'telecom_satellite_research_advisory',
] as const);

export const EO_MUST_NOT = Object.freeze([
  'autonomously_send_bids',
  'make_pricing_commitments',
  'spend_money',
  'sign_contracts',
  'autonomous_freight_dispatch',
  'autonomous_purchase_orders',
  'autonomous_production_changes',
  'claim_quantum_advantage_without_evidence',
  'treat_digital_twin_as_founder',
  'live_satellite_or_vehicle_control',
  'claim_nqi_agency_official_partnership_without_evidence',
  'auto_certify_represent_accept',
] as const);

export const CFO_COUNCIL_ANALYSIS_SURFACES = Object.freeze([
  'pipeline',
  'pricing',
  'renewals',
  'cost_to_serve',
  'product_tiers',
  'partnerships',
  'government_opportunities',
  'lawful_revenue_channels',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type EoSoftWireSnapshot = {
  enDealContractOs: SoftWirePresence;
  enDealContractRuntime: SoftWirePresence;
  enReport: SoftWirePresence;
  em1HomeBase: SoftWirePresence;
  em10UserAccessEconomy: SoftWirePresence;
  em10Report: SoftWirePresence;
  em9MarketSimulator: SoftWirePresence;
  em3Registry: SoftWirePresence;
  em8Receipts: SoftWirePresence;
  em157HomeBase: SoftWirePresence;
  starlinkAdapterSurface: SoftWirePresence;
  classicalQuantBaseline: SoftWirePresence;
};

export function assertEoLocksIntact(): boolean {
  return (
    EO_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EO_LOCKS.AUTO_SEND_BID === false &&
    EO_LOCKS.AUTO_PRICING_COMMITMENT === false &&
    EO_LOCKS.AUTO_SPEND === false &&
    EO_LOCKS.AUTO_SIGN_CONTRACT === false &&
    EO_LOCKS.AUTONOMOUS_CONTRACTS === false &&
    EO_LOCKS.AUTO_FREIGHT_DISPATCH === false &&
    EO_LOCKS.AUTO_PURCHASE_ORDER === false &&
    EO_LOCKS.AUTO_PRODUCTION_CHANGE === false &&
    EO_LOCKS.RECOMMEND_EQ_ACT === false &&
    EO_LOCKS.RECOMMEND_EQ_CHARGE === false &&
    EO_LOCKS.RECOMMEND_EQ_DEPLOY === false &&
    EO_LOCKS.RECOMMEND_EQ_SPEND === false &&
    EO_LOCKS.RECOMMEND_EQ_SIGN === false &&
    EO_LOCKS.RECOMMEND_EQ_BID === false &&
    EO_LOCKS.DIGITAL_TWIN_EQ_FOUNDER === false &&
    EO_LOCKS.DIGITAL_TWIN_MAY_CHARGE === false &&
    EO_LOCKS.DIGITAL_TWIN_MAY_DEPLOY === false &&
    EO_LOCKS.DIGITAL_TWIN_MAY_SPEND === false &&
    EO_LOCKS.DIGITAL_TWIN_MAY_SIGN === false &&
    EO_LOCKS.DETECTED_EQ_VERIFIED === false &&
    EO_LOCKS.QUANTUM_ADVANTAGE_WITHOUT_EVIDENCE === false &&
    EO_LOCKS.QUANTUM_WITHOUT_CLASSICAL_BASELINE === false &&
    EO_LOCKS.QPU_THEORETICAL_EQ_PHYSICAL_VERIFIED === false &&
    EO_LOCKS.SIMULATED_EQ_PHYSICAL_QPU_VERIFIED === false &&
    EO_LOCKS.SATELLITE_RESEARCH_EQ_CONTROL === false &&
    EO_LOCKS.TELECOM_RESEARCH_EQ_LIVE_CONTROL === false &&
    EO_LOCKS.STARLINK_CONNECTED_WITHOUT_CREDENTIALS === false &&
    EO_LOCKS.LIVE_VEHICLE_CONTROL === false &&
    EO_LOCKS.NQI_AGENCY_NAME_EQ_OFFICIAL_PARTNERSHIP === false &&
    EO_LOCKS.CLAIM_OFFICIAL_NIST_NSF_DOE_AFFILIATION_WITHOUT_EVIDENCE === false &&
    EO_LOCKS.AUTO_SUBMIT_BID === false &&
    EO_LOCKS.AUTO_SIGN_CERTIFICATION === false &&
    EO_LOCKS.AUTO_MAKE_REPRESENTATION === false &&
    EO_LOCKS.AUTO_ACCEPT_CONTRACT === false &&
    EO_LOCKS.SAM_GOV_CONFIGURED === false &&
    EO_LOCKS.FAR_ADAPTER_CONFIGURED === false &&
    EO_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EO_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EO_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EO_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    EO_LOCKS.HUMAN_AUTHORIZED_SUBMISSION_REQUIRED === true &&
    EO_LOCKS.TIP_LAND === false &&
    EO_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EO_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EO_LOCKS.FULL_PRODUCTION_MISSION_OS_SHIPPED === false &&
    EO_LOCKS.MANAGE_PULL_REQUEST === false
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
 * Soft-wire EN (#158), EM1/EM10, EM fabric, #157 Starlink surface when present.
 * Presence alone ≠ VERIFIED.
 */
export function eoSoftWireSnapshot(repoRoot?: string): EoSoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    enDealContractOs: softWireFile(
      './deal-contract-intelligence-os.ts',
      'EN (#158) Deal & Contract Intelligence OS PRESENT (soft-wire).',
      'EN (#158) Deal & Contract Intelligence OS absent — soft-wire WAITING_DATA / probe-only.',
    ),
    enDealContractRuntime: softWireFile(
      './deal-contract-intelligence-os-runtime.ts',
      'EN (#158) deal/gov runtime PRESENT (SAM/FAR research soft-wire; human-authorized submission only).',
      'EN (#158) deal/gov runtime absent on this tip — soft-wire WAITING_DATA.',
    ),
    enReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EN_DEAL_CONTRACT_INTELLIGENCE_OS_REPORT.md',
      'EN (#158) report PRESENT.',
      'EN (#158) report absent on this tip.',
    ),
    em1HomeBase: softWireFile(
      './agent-home-base-contract.ts',
      'EM1 agent home base contract PRESENT (soft-wire).',
      'EM1 agent home base contract absent.',
    ),
    em10UserAccessEconomy: softWireFile(
      './user-access-economy.ts',
      'EM10 User Access Economy PRESENT (pricing / tiers soft-wire).',
      'EM10 User Access Economy absent.',
    ),
    em10Report: softWireRepoRelative(
      root,
      'docs/operations/62L_EM10_USER_ACCESS_ECONOMY_REPORT.md',
      'EM10 report PRESENT.',
      'EM10 report absent.',
    ),
    em9MarketSimulator: softWireFile(
      '../local-runtime/compute-resource-market-simulator.ts',
      'EM9 compute resource market simulator PRESENT (EM fabric soft-wire).',
      'EM9 market simulator absent.',
    ),
    em3Registry: softWireFile(
      '../local-runtime/universal-compute-registry.ts',
      'EM3 universal compute registry PRESENT (CPU/GPU/NPU routing soft-wire).',
      'EM3 registry absent.',
    ),
    em8Receipts: softWireFile(
      '../local-runtime/compute-return-receipt.ts',
      'EM8 compute return receipts PRESENT (soft-wire).',
      'EM8 receipts absent.',
    ),
    em157HomeBase: softWireFile(
      './agent-compute-home-base-runtime.ts',
      '#157 agent-compute-home-base runtime PRESENT (Starlink / CFO council soft-wire).',
      '#157 agent-compute-home-base absent on this tip — EO local Starlink adapter stays UNCONNECTED.',
    ),
    starlinkAdapterSurface: softWireFile(
      './agent-compute-home-base-runtime.ts',
      'Starlink adapter surface via #157 home-base PRESENT (still UNCONNECTED until credentials).',
      'Starlink adapter surface absent — EO local probe defaults UNCONNECTED / UNAVAILABLE.',
    ),
    classicalQuantBaseline: softWireFile(
      '../local-runtime/classical-quant-benchmark.ts',
      'Classical quant baseline PRESENT (required before any quantum-inspired claim).',
      'Classical quant baseline absent — quantum advantage claims remain DENIED.',
    ),
  };
}

export function isHumanApprover(actor: EoActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function isDigitalTwin(actor: EoActor): boolean {
  return actor.kind === 'digital_twin';
}
