/**
 * 62L-EN (#158) — Deal & Contract Intelligence OS + Government Contracting Brain +
 * AI Marketing/Negotiation Team + Historical Negotiation Memory +
 * Proposal & Pricing War Room.
 *
 * SoT: GitHub #158 (authoritative). GitLab mirror: not resolved in this
 * environment (GitLab MCP needsAuth; no issue number invented).
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false.
 *
 * Soft-wire EM1/#157 Agent Compute Home Base return receipts + pricing council,
 * and prior DR/DS negotiation honesty when PRESENT.
 *
 * XIV may discover / analyze / draft / price-scenario / prepare packages.
 * XIV MUST NOT autonomously submit bids, sign certifications, make
 * representations, or accept contracts.
 *
 * Agents recommend ≠ act. Lessons ≠ proof same strategy works today.
 * No hidden chain-of-thought storage. Agents cannot self-expand authority.
 * Business Law / contracting agents ≠ attorney. LegalShield-style partners
 * UNAVAILABLE until authorized. SAM.gov / FAR adapters UNAVAILABLE until configured.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR from this phase.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

export const GITHUB_SOT_ISSUE = 158 as const;
export const GITHUB_SOT_TITLE =
  '62L-EN Deal & Contract Intelligence OS + Government Contracting Brain + AI Marketing/Negotiation Team + Historical Negotiation Memory + Proposal & Pricing War Room' as const;

/** GitLab mirror not resolved — do not invent a number. */
export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const EN_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const NEXT_PHASE_TITLE =
  'EN1 — Deal Intelligence Home Base — central object where every commercial, enterprise, licensing, partnership, subcontract, and government opportunity will live.' as const;

/**
 * Government-contract flow (encoded):
 * SAM.gov opportunity → qualification → eligibility/readiness → bid/no-bid →
 * capture plan → compliance matrix → pricing → proposal → negotiation strategy →
 * human approval → human-authorized submission → award/performance tracking →
 * win/loss learning
 */
export const GOVERNMENT_CONTRACT_FLOW = [
  'sam_gov_opportunity',
  'qualification',
  'eligibility_readiness_check',
  'bid_no_bid',
  'capture_plan',
  'compliance_matrix',
  'pricing',
  'proposal',
  'negotiation_strategy',
  'human_approval',
  'human_authorized_submission',
  'award_performance_tracking',
  'win_loss_learning',
] as const;

export type GovContractFlowHop = (typeof GOVERNMENT_CONTRACT_FLOW)[number];

export const DEAL_CONTRACT_INTELLIGENCE_OS_CYCLE = [
  'honesty_locks',
  'deal_os_bootstrap',
  // A — Deal & Contract Intelligence OS home objects
  'deal_home_object_register',
  'opportunity_lifecycle_track',
  // B — AI Marketing/Negotiation Team roster + permission bounds
  'deal_team_roster',
  'recommend_neq_act',
  'agent_cannot_self_expand_authority',
  // C — Historical Negotiation Memory + neural lesson writeback
  'historical_negotiation_lesson',
  'provenance_required',
  'lesson_neq_guarantee',
  'no_hidden_cot_storage',
  // D — Government Contracting Brain (SAM/FAR)
  'sam_gov_adapter_probe',
  'far_research_adapter_probe',
  'unconfigured_unavailable',
  'policy_framing_not_legal_advice',
  'legalshield_unavailable_until_authorized',
  // E — Proposal & Pricing War Room
  'proposal_war_room',
  'pricing_scenario_recommend_neq_bind',
  // F — Bid/No-Bid + Capture + Compliance
  'bid_no_bid_gate',
  'capture_plan_draft',
  'compliance_matrix_build',
  // G — Teaming/Subcontracting + Win/Loss
  'teaming_subcontracting_advise',
  'win_loss_learning_writeback',
  // H — Human approval → human-authorized submission + EM soft-wire
  'human_approval_required',
  'no_auto_submit',
  'no_auto_sign',
  'no_auto_certify',
  'no_auto_accept',
  'em_home_base_return_receipt_soft_wire',
  'em157_pricing_council_soft_wire',
  'dr_ds_negotiation_honesty_soft_wire',
  'gov_contract_flow_encoded',
  'evidence',
] as const;

export type EnHop = (typeof DEAL_CONTRACT_INTELLIGENCE_OS_CYCLE)[number];

export type EnEvidenceState =
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
  | 'HUMAN_AUTHORIZED_SUBMISSION_REQUIRED'
  | 'PROVENANCE_LABELED'
  | 'ADVISORY_ONLY'
  | 'APPROVED_BOUNDED'
  | 'BID'
  | 'NO_BID'
  | 'CONFIGURED'
  | 'AUTHORIZED'
  | 'REGISTERED';

export type EnHopRecord = {
  hop: EnHop;
  state: EnEvidenceState;
  summary: string;
  at: string;
};

/** Governed deal-team roles — recommend ≠ act. */
export type DealTeamRole =
  | 'marketing'
  | 'sdr'
  | 'account_executive'
  | 'negotiation_strategist'
  | 'procurement_analyst'
  | 'cfo_deal_desk'
  | 'accountant'
  | 'proposal_factory'
  | 'government_market_research'
  | 'capture_planning'
  | 'bid_no_bid'
  | 'teaming_subcontracting'
  | 'win_loss_learning'
  | 'human_approver'
  | 'founder'
  | 'business_law_research'
  | 'guardian';

export type EnActor = {
  kind: DealTeamRole;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  /** Explicit permission set — never self-expanded. */
  permissions: readonly string[];
};

export const DEAL_TEAM_ROSTER: readonly DealTeamRole[] = [
  'marketing',
  'sdr',
  'account_executive',
  'negotiation_strategist',
  'procurement_analyst',
  'cfo_deal_desk',
  'accountant',
  'proposal_factory',
  'government_market_research',
  'capture_planning',
  'bid_no_bid',
  'teaming_subcontracting',
  'win_loss_learning',
] as const;

/** Permission bounds per role — advisory / research / draft only unless human_approver. */
export const DEAL_TEAM_PERMISSION_BOUNDS: Readonly<Record<DealTeamRole, readonly string[]>> =
  Object.freeze({
    marketing: ['draft_messaging', 'market_research'],
    sdr: ['qualify_lead', 'draft_outreach'],
    account_executive: ['draft_commercial_terms', 'recommend_deal_path'],
    negotiation_strategist: ['draft_batna', 'recommend_concession', 'sim_scenario'],
    procurement_analyst: ['analyze_rfp', 'far_research'],
    cfo_deal_desk: ['price_scenario', 'margin_advise'],
    accountant: ['cost_ledger', 'margin_check'],
    proposal_factory: ['draft_proposal', 'build_compliance_matrix'],
    government_market_research: ['sam_search_candidate', 'agency_research'],
    capture_planning: ['draft_capture_plan'],
    bid_no_bid: ['recommend_bid_no_bid'],
    teaming_subcontracting: ['advise_teaming', 'advise_subcontract'],
    win_loss_learning: ['record_win_loss_lesson'],
    human_approver: ['approve_consequential', 'authorize_submission'],
    founder: ['approve_consequential', 'authorize_submission', 'expand_permissions'],
    business_law_research: ['clause_compare', 'compliance_spot', 'counsel_questions'],
    guardian: ['deny_by_default', 'audit'],
  });

export const EN_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_DEAL_OS_SHIPPED: false as const,
  // Hard autonomy boundary
  AUTO_SUBMIT_BID: false as const,
  AUTO_SIGN_CERTIFICATION: false as const,
  AUTO_MAKE_REPRESENTATION: false as const,
  AUTO_ACCEPT_CONTRACT: false as const,
  AUTONOMOUS_CONTRACTS: false as const,
  // Recommend ≠ bind / act
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_BIND_PRICE: false as const,
  RECOMMEND_EQ_SUBMIT: false as const,
  RECOMMEND_EQ_SIGN: false as const,
  RECOMMEND_EQ_CHARGE: false as const,
  BATNA_AUTO_COMMIT: false as const,
  CONCESSION_WITHOUT_HUMAN_GATE: false as const,
  // Lessons / memory honesty
  LESSON_EQ_GUARANTEE_STRATEGY_WORKS_TODAY: false as const,
  CORRELATION_EQ_CAUSATION: false as const,
  HIDDEN_CHAIN_OF_THOUGHT_STORAGE: false as const,
  AGENT_SELF_EXPAND_AUTHORITY: false as const,
  // Legal / partner honesty
  BUSINESS_LAW_EQ_ATTORNEY: false as const,
  LEGALSHIELD_AUTHORIZED: false as const,
  // Adapter defaults
  SAM_GOV_CONFIGURED: false as const,
  FAR_ADAPTER_CONFIGURED: false as const,
  // Honesty ladder
  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  // Human gates
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_DEAL_ACTIONS: true as const,
  HUMAN_AUTHORIZED_SUBMISSION_REQUIRED: true as const,
});

export const EN_POLICY_FRAMING = Object.freeze({
  samGov:
    'SAM.gov = federal system for searching procurement notices (adapter/candidate; unconfigured → UNAVAILABLE)',
  far: 'FAR = primary uniform acquisition regulation (+ agency supplements as research references)',
  publicTrust:
    'Emphasize best value, competition, integrity, fairness, public trust as policy framing — not legal advice authority',
  notAttorney:
    'Business Law / contracting agents ≠ attorney; LegalShield-style partners UNAVAILABLE until authorized',
});

export const EN_MAY = Object.freeze([
  'discover_opportunities',
  'analyze_far_requirements',
  'build_proposals',
  'price_scenarios',
  'draft_negotiation_plans',
  'prepare_submission_packages',
] as const);

export const EN_MUST_NOT = Object.freeze([
  'autonomously_submit_bids',
  'sign_certifications',
  'make_representations',
  'accept_contracts',
] as const);

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type EnSoftWireSnapshot = {
  em157HomeBaseTypes: SoftWirePresence;
  em157HomeBaseRuntime: SoftWirePresence;
  em157HomeBaseReport: SoftWirePresence;
  em157PricingCouncilSurface: SoftWirePresence;
  drNegotiationHonesty: SoftWirePresence;
  dsDealSimulationHonesty: SoftWirePresence;
  dsRevenueOsTypes: SoftWirePresence;
};

export function assertEnLocksIntact(): boolean {
  return (
    EN_LOCKS.L4_AUTONOMY_ENABLED === false &&
    EN_LOCKS.AUTO_SUBMIT_BID === false &&
    EN_LOCKS.AUTO_SIGN_CERTIFICATION === false &&
    EN_LOCKS.AUTO_MAKE_REPRESENTATION === false &&
    EN_LOCKS.AUTO_ACCEPT_CONTRACT === false &&
    EN_LOCKS.AUTONOMOUS_CONTRACTS === false &&
    EN_LOCKS.RECOMMEND_EQ_ACT === false &&
    EN_LOCKS.RECOMMEND_EQ_BIND_PRICE === false &&
    EN_LOCKS.RECOMMEND_EQ_SUBMIT === false &&
    EN_LOCKS.RECOMMEND_EQ_SIGN === false &&
    EN_LOCKS.RECOMMEND_EQ_CHARGE === false &&
    EN_LOCKS.BATNA_AUTO_COMMIT === false &&
    EN_LOCKS.CONCESSION_WITHOUT_HUMAN_GATE === false &&
    EN_LOCKS.LESSON_EQ_GUARANTEE_STRATEGY_WORKS_TODAY === false &&
    EN_LOCKS.CORRELATION_EQ_CAUSATION === false &&
    EN_LOCKS.HIDDEN_CHAIN_OF_THOUGHT_STORAGE === false &&
    EN_LOCKS.AGENT_SELF_EXPAND_AUTHORITY === false &&
    EN_LOCKS.BUSINESS_LAW_EQ_ATTORNEY === false &&
    EN_LOCKS.LEGALSHIELD_AUTHORIZED === false &&
    EN_LOCKS.SAM_GOV_CONFIGURED === false &&
    EN_LOCKS.FAR_ADAPTER_CONFIGURED === false &&
    EN_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    EN_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    EN_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    EN_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_DEAL_ACTIONS === true &&
    EN_LOCKS.HUMAN_AUTHORIZED_SUBMISSION_REQUIRED === true &&
    EN_LOCKS.TIP_LAND === false &&
    EN_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    EN_LOCKS.DB_CANDIDATES_APPLIED === false &&
    EN_LOCKS.FULL_PRODUCTION_DEAL_OS_SHIPPED === false
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
 * Soft-wire EM1/#157 home-base return receipts + pricing council, and DR/DS
 * negotiation honesty when present. Presence alone ≠ VERIFIED.
 */
export function enSoftWireSnapshot(repoRoot?: string): EnSoftWireSnapshot {
  const root =
    repoRoot ??
    join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    em157HomeBaseTypes: softWireFile(
      './agent-compute-home-base-types.ts',
      'EM #157 home-base types PRESENT (return-receipt pathway soft-wire).',
      'EM #157 home-base types absent — soft-wire no-op.',
    ),
    em157HomeBaseRuntime: softWireFile(
      './agent-compute-home-base-runtime.ts',
      'EM #157 home-base runtime PRESENT (mission return receipts soft-wire).',
      'EM #157 home-base runtime absent.',
    ),
    em157HomeBaseReport: softWireRepoRelative(
      root,
      'docs/operations/62L_EM_AGENT_COMPUTE_HOME_BASE_REPORT.md',
      'EM #157 home-base report PRESENT.',
      'EM #157 home-base report MISSING.',
    ),
    em157PricingCouncilSurface: softWireFile(
      './agent-compute-home-base-runtime.ts',
      'EM #157 pricing council surface (pricingCouncilRecommend / negotiateStrategy) soft-wired via home-base runtime.',
      'EM #157 pricing council surface absent.',
    ),
    drNegotiationHonesty: softWireFile(
      './negotiation-cockpit.ts',
      'DR negotiation cockpit PRESENT (honesty soft-wire; advisory until founder gate).',
      'DR negotiation cockpit absent on this branch — soft-wire no-op / WAITING_DATA.',
    ),
    dsDealSimulationHonesty: softWireFile(
      './deal-simulation-negotiation-engine.ts',
      'DS deal-simulation negotiation engine PRESENT (sim≠fact; concession needs founder gate).',
      'DS deal-simulation engine absent on this branch — soft-wire no-op / WAITING_DATA.',
    ),
    dsRevenueOsTypes: softWireFile(
      './revenue-intelligence-os-types.ts',
      'DS revenue intelligence OS types PRESENT.',
      'DS revenue intelligence OS types absent on this branch — soft-wire no-op.',
    ),
  };
}

export function isHumanApprover(actor: EnActor): boolean {
  return actor.kind === 'human_approver' || actor.kind === 'founder';
}

export function rolePermissionBounds(role: DealTeamRole): readonly string[] {
  return DEAL_TEAM_PERMISSION_BOUNDS[role];
}
