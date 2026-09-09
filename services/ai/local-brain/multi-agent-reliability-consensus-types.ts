/**
 * 62L-ES29 — Multi-Agent Reliability & Consensus Engine (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory /
 * Multi-Agent Reliability & Consensus.
 *
 * Multi-agent teams compare answers, surface disagreement, and measure
 * reliability before Home Base accepts a combined recommendation.
 *
 * Core flow:
 * Mission → multiple bounded agents → independent outputs → evidence
 * comparison → disagreement analysis → evaluator review → consensus
 * candidate → Home Base
 *
 * Independence rule: consensus ≠ five agents repeating the same source.
 * Measure source independence and method diversity. Stronger: ops + quant +
 * historical + finance + security from different evidence.
 *
 * Dissent preservation: minority findings with credible evidence remain
 * visible; never silently discard.
 *
 * Soft-wire when PRESENT (existsSync): ES28 Workflow Graph Optimizer, ES27
 * Capability Composition Engine, ER16 / Home Base (agent-compute-home-base),
 * ER18 Research Review Board. Presence ≠ VERIFIED. Absent → WAITING_DATA
 * (not FAIL).
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR / ManagePullRequest.
 * Consensus ≠ authority. Next (report only): ES30 — Agent Reputation &
 * Domain Trust Graph.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HONESTY_BANNER =
  'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED' as const;

/** GitHub SoT not resolved here — do not invent an issue number. */
export const GITHUB_SOT_ISSUE: null = null;
export const GITHUB_SOT_ISSUE_NOTE =
  'GitHub SoT for 62L-ES not resolved in this environment — no issue number invented.' as const;
export const GITHUB_SOT_LABEL = '62L-ES29' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES29 Multi-Agent Reliability & Consensus Engine — independence metrics; dissent preservation; domain reliability isolation; merge package; unanimous≠authority; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES29_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory / Multi-Agent Reliability & Consensus' as const;

export const NEXT_PHASE_TITLE =
  'ES30 — Agent Reputation & Domain Trust Graph — track per-domain agent reliability history so consensus weighting stays domain-isolated (logistics ≠ legal ≠ quantum ≠ cyber).' as const;

/**
 * Core consensus flow (exact order from user story).
 */
export const CONSENSUS_CORE_FLOW = [
  'mission',
  'multiple_bounded_agents',
  'independent_outputs',
  'evidence_comparison',
  'disagreement_analysis',
  'evaluator_review',
  'consensus_candidate',
  'home_base',
] as const;

export type ConsensusCoreFlowHop = (typeof CONSENSUS_CORE_FLOW)[number];

/**
 * Consensus run tracking fields (exact set from user story).
 */
export const CONSENSUS_TRACKING_FIELDS = [
  'consensusId',
  'missionTask',
  'participatingAgents',
  'agentVersions',
  'sourceSets',
  'outputs',
  'confidenceScores',
  'contradictionCount',
  'overlapDuplication',
  'evidenceQuality',
  'evaluatorScores',
  'failureRates',
  'minorityDissentingViews',
  'finalRecommendation',
  'unresolvedUncertainty',
  'approvalState',
] as const;

export type ConsensusTrackingField =
  (typeof CONSENSUS_TRACKING_FIELDS)[number];

/**
 * Required consensus outcome states (exact).
 */
export const CONSENSUS_OUTCOME_STATES = [
  'CONSENSUS_STRONG',
  'CONSENSUS_WEAK',
  'MIXED_EVIDENCE',
  'HIGH_DISAGREEMENT',
  'INSUFFICIENT_EVIDENCE',
  'REVIEW_REQUIRED',
] as const;

export type ConsensusOutcomeState = (typeof CONSENSUS_OUTCOME_STATES)[number];

/**
 * Approval states for consensus candidates (never auto-authorize consequential acts).
 */
export const CONSENSUS_APPROVAL_STATES = [
  'CANDIDATE_ONLY',
  'AWAITING_HUMAN',
  'HUMAN_APPROVED_RECOMMENDATION',
  'REJECTED',
  'ESCALATED',
] as const;

export type ConsensusApprovalState =
  (typeof CONSENSUS_APPROVAL_STATES)[number];

/**
 * Domains for reliability isolation (logistics expert ≠ auto-trusted for legal).
 */
export const RELIABILITY_DOMAINS = [
  'logistics',
  'ops',
  'quant',
  'historical',
  'finance',
  'security',
  'legal',
  'quantum',
  'cyber',
  'general',
] as const;

export type ReliabilityDomain = (typeof RELIABILITY_DOMAINS)[number];

/**
 * Method diversity labels (independence strengthens when methods differ).
 */
export const METHOD_DIVERSITY_LABELS = [
  'ops_observation',
  'quant_model',
  'historical_atlas',
  'finance_ledger',
  'security_audit',
  'legal_review',
  'cyber_scan',
  'quantum_sim',
  'same_source_echo',
] as const;

export type MethodDiversityLabel = (typeof METHOD_DIVERSITY_LABELS)[number];

/**
 * Reliability scoring dimensions (domain-specific history).
 */
export const RELIABILITY_SCORE_DIMENSIONS = [
  'factualAccuracy',
  'groundingCitation',
  'testSuccess',
  'contradictionRate',
  'escalation',
  'policyCompliance',
  'latencyCost',
  'evaluatorResults',
] as const;

export type ReliabilityScoreDimension =
  (typeof RELIABILITY_SCORE_DIMENSIONS)[number];

/**
 * High-consequence actions unanimous agents still cannot take.
 * Consensus ≠ authority.
 */
export const FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS = [
  'sign_contracts',
  'submit_gov_bids',
  'move_money',
  'change_production',
  'expand_permissions',
  'employment_decisions',
  'control_vehicles',
  'control_infrastructure',
] as const;

export type ForbiddenConsensusAuthorityAction =
  (typeof FORBIDDEN_CONSENSUS_AUTHORITY_ACTIONS)[number];

export const CONSENSUS_TRUTH_BOUNDARY = Object.freeze({
  sameSourceEchoIsNotStrongConsensus: true as const,
  dissentWithCredibleEvidenceMustRemainVisible: true as const,
  domainReliabilityIsIsolated: true as const,
  logisticsExpertNotAutoTrustedForLegal: true as const,
  logisticsExpertNotAutoTrustedForQuantum: true as const,
  logisticsExpertNotAutoTrustedForCyber: true as const,
  mergePackageMustIncludeRecommendation: true as const,
  mergePackageMustIncludeSupportingEvidence: true as const,
  mergePackageMustIncludeKeyDisagreements: true as const,
  mergePackageMustIncludeConfidence: true as const,
  mergePackageMustIncludeKnownGaps: true as const,
  mergePackageMustIncludeHumanDecisionRequired: true as const,
  noHiddenChainOfThoughtPersisted: true as const,
  consensusIsNotAuthority: true as const,
  unanimousCannotSignContracts: true as const,
  unanimousCannotSubmitGovBids: true as const,
  unanimousCannotMoveMoney: true as const,
  unanimousCannotChangeProduction: true as const,
  unanimousCannotExpandPermissions: true as const,
  unanimousCannotMakeEmploymentDecisions: true as const,
  unanimousCannotControlVehiclesOrInfrastructure: true as const,
});

export type AgentReliabilityProfile = {
  agentId: string;
  domain: ReliabilityDomain;
  factualAccuracy: number;
  groundingCitation: number;
  testSuccess: number;
  contradictionRate: number;
  escalation: number;
  policyCompliance: number;
  latencyCost: number;
  evaluatorResults: number;
};

export type ParticipatingAgent = {
  agentId: string;
  version: string;
  primaryDomain: ReliabilityDomain;
  method: MethodDiversityLabel;
  reliability: AgentReliabilityProfile;
};

export type AgentConsensusOutput = {
  agentId: string;
  version: string;
  domain: ReliabilityDomain;
  method: MethodDiversityLabel;
  output: string;
  sourceIds: readonly string[];
  confidence: number;
  evidenceQuality: number;
  evaluatorScore?: number;
  failureRate?: number;
  dissentNote?: string;
};

export type IndependenceMetrics = {
  uniqueSourceCount: number;
  uniqueMethodCount: number;
  sourceIndependenceScore: number;
  methodDiversityScore: number;
  sameSourceEchoDetected: boolean;
  overlapDuplicationScore: number;
};

export type DissentingView = {
  agentId: string;
  finding: string;
  credibleEvidence: true;
  sourceIds: readonly string[];
  silentlyDiscarded: false;
};

export type ConsensusMergePackage = {
  recommendation: string;
  supportingEvidence: readonly string[];
  keyDisagreements: readonly string[];
  confidence: number;
  knownGaps: readonly string[];
  humanDecisionRequired: true;
  hiddenChainOfThoughtPersisted: false;
};

export type ConsensusRun = {
  consensusId: string;
  missionTask: string;
  participatingAgents: readonly ParticipatingAgent[];
  agentVersions: readonly string[];
  sourceSets: readonly (readonly string[])[];
  outputs: readonly AgentConsensusOutput[];
  confidenceScores: readonly number[];
  contradictionCount: number;
  overlapDuplication: number;
  evidenceQuality: number;
  evaluatorScores: readonly number[];
  failureRates: readonly number[];
  minorityDissentingViews: readonly DissentingView[];
  finalRecommendation: string;
  unresolvedUncertainty: readonly string[];
  approvalState: ConsensusApprovalState;
  outcome: ConsensusOutcomeState;
  independence: IndependenceMetrics;
  mergePackage: ConsensusMergePackage;
  tenantId: string;
  universeId: string;
  orgId: string;
  createdAt: string;
};

export const CONSENSUS_ENGINE_CYCLE = [
  'honesty_locks',
  'consensus_engine_bootstrap',
  'tracking_fields_encoded',
  'outcome_states_encoded',
  'reliability_domains_encoded',
  'forbidden_authority_encoded',
  'mission_intake',
  'bounded_agents_collect',
  'independent_outputs',
  'evidence_comparison',
  'independence_metrics',
  'disagreement_analysis',
  'dissent_preservation',
  'domain_reliability_isolation',
  'evaluator_review',
  'outcome_classification',
  'merge_package',
  'deny_same_source_echo_strong',
  'deny_hidden_cot',
  'deny_unanimous_authority',
  'home_base_handoff',
  'es28_workflow_graph_optimizer_soft_wire',
  'es27_capability_composition_soft_wire',
  'er16_home_base_soft_wire',
  'er18_research_review_board_soft_wire',
  'cycle_complete',
] as const;

export type Es29Hop = (typeof CONSENSUS_ENGINE_CYCLE)[number];

export type Es29EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'DENIED'
  | 'DOCUMENTED'
  | 'IMPLEMENTED'
  | 'AVAILABLE'
  | 'VERIFIED'
  | 'PRODUCTION_AUTHORIZED'
  | 'RECOMMENDATION_ONLY'
  | 'BOUNDED'
  | 'NOT_APPLIED'
  | 'NOT_TESTED'
  | 'NOT_AVAILABLE'
  | 'NOT_VERIFIED'
  | 'WAITING_DATA'
  | 'ADVISORY_ONLY'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'UNKNOWN'
  | 'CONSENSUS_STRONG'
  | 'CONSENSUS_WEAK'
  | 'MIXED_EVIDENCE'
  | 'HIGH_DISAGREEMENT'
  | 'INSUFFICIENT_EVIDENCE'
  | 'REVIEW_REQUIRED';

export type Es29HopRecord = {
  hop: Es29Hop;
  state: Es29EvidenceState;
  summary: string;
  at: string;
};

export type Es29ActorKind =
  | 'consensus_agent'
  | 'ops_agent'
  | 'quant_agent'
  | 'historical_agent'
  | 'finance_agent'
  | 'security_agent'
  | 'legal_agent'
  | 'evaluator'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'home_base'
  | 'tenant_admin';

export type Es29Actor = {
  kind: Es29ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
  domain?: ReliabilityDomain;
};

export const ES29_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_CONSENSUS_ENGINE_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  SAME_SOURCE_ECHO_EQ_CONSENSUS_STRONG: false as const,
  SILENT_DISSENT_DISCARD: false as const,
  CROSS_DOMAIN_AUTO_TRUST: false as const,
  HIDDEN_CHAIN_OF_THOUGHT: false as const,
  PERSIST_HIDDEN_CHAIN_OF_THOUGHT: false as const,

  CONSENSUS_EQ_AUTHORITY: false as const,
  UNANIMOUS_SIGN_CONTRACTS: false as const,
  UNANIMOUS_SUBMIT_GOV_BIDS: false as const,
  UNANIMOUS_MOVE_MONEY: false as const,
  UNANIMOUS_CHANGE_PRODUCTION: false as const,
  UNANIMOUS_EXPAND_PERMISSIONS: false as const,
  UNANIMOUS_EMPLOYMENT_DECISIONS: false as const,
  UNANIMOUS_CONTROL_VEHICLES: false as const,
  UNANIMOUS_CONTROL_INFRASTRUCTURE: false as const,

  BYPASS_GUARDIAN_RLS: false as const,
  EXPAND_TENANT_UNIVERSE_ACCESS: false as const,
  AUTO_DEPLOY_CHANGES: false as const,
  AGENT_AUTO_AUTHORITY: false as const,
  RECOMMEND_EQ_ACT: false as const,
  RECOMMEND_EQ_AUTHORIZE: false as const,
  BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE: false as const,
  GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED: true as const,
  HUMAN_APPROVAL_BOUNDARIES_UNCHANGED: true as const,

  DOCUMENTED_EQ_IMPLEMENTED: false as const,
  IMPLEMENTED_EQ_VERIFIED: false as const,
  VERIFIED_EQ_PRODUCTION_AUTHORIZED: false as const,
  HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS: true as const,
  PRESENCE_EQ_VERIFIED: false as const,
});

export const ES29_AGENT_BOUNDS = Object.freeze({
  mayProduceIndependentOutputs: true as const,
  maySurfaceDissent: true as const,
  mayBuildConsensusCandidate: true as const,
  mayScoreDomainReliability: true as const,
  mayHandOffToHomeBase: true as const,
  maySignContracts: false as const,
  maySubmitGovBids: false as const,
  mayMoveMoney: false as const,
  mayChangeProduction: false as const,
  mayExpandPermissions: false as const,
  mayMakeEmploymentDecisions: false as const,
  mayControlVehicles: false as const,
  mayControlInfrastructure: false as const,
  mayPersistHiddenChainOfThought: false as const,
  mayTreatSameSourceEchoAsStrongConsensus: false as const,
  maySilentlyDiscardCredibleDissent: false as const,
  mayCrossDomainAutoTrust: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  recommendEqAct: false as const,
  recommendEqAuthorize: false as const,
});

export const ES29_MAY = [
  'run_multi_agent_consensus_candidate',
  'measure_source_independence_and_method_diversity',
  'preserve_credible_minority_dissent',
  'score_domain_specific_reliability',
  'emit_merge_package_with_gaps_and_human_decision',
  'hand_off_candidate_to_home_base',
  'escalate_high_disagreement_for_review',
] as const;

export const ES29_MUST_NOT = [
  'treat_same_source_echo_as_consensus_strong',
  'silently_discard_credible_dissent',
  'auto_trust_logistics_expert_for_legal_quantum_cyber',
  'persist_hidden_chain_of_thought',
  'treat_consensus_as_authority',
  'sign_contracts_or_submit_gov_bids',
  'move_money_or_change_production',
  'expand_permissions_or_make_employment_decisions',
  'control_vehicles_or_infrastructure',
  'bypass_guardian_rls',
  'tip_land_or_open_pr',
  'enable_l4_autonomy',
] as const;

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es29SoftWireSnapshot = {
  /** Strong soft-wire when present. */
  es28WorkflowGraphOptimizer: SoftWirePresence;
  es28Report: SoftWirePresence;
  /** Strong soft-wire when present. */
  es27CapabilityComposition: SoftWirePresence;
  es27Report: SoftWirePresence;
  /** ER16 / Home Base (agent-compute-home-base) often PRESENT on ER34 tips. */
  er16HomeBase: SoftWirePresence;
  er16HomeBaseReport: SoftWirePresence;
  /** Strong soft-wire when present. */
  er18ResearchReviewBoard: SoftWirePresence;
  er18Report: SoftWirePresence;
};

export function assertEs29LocksIntact(): boolean {
  return (
    ES29_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES29_LOCKS.SAME_SOURCE_ECHO_EQ_CONSENSUS_STRONG === false &&
    ES29_LOCKS.SILENT_DISSENT_DISCARD === false &&
    ES29_LOCKS.CROSS_DOMAIN_AUTO_TRUST === false &&
    ES29_LOCKS.HIDDEN_CHAIN_OF_THOUGHT === false &&
    ES29_LOCKS.PERSIST_HIDDEN_CHAIN_OF_THOUGHT === false &&
    ES29_LOCKS.CONSENSUS_EQ_AUTHORITY === false &&
    ES29_LOCKS.UNANIMOUS_SIGN_CONTRACTS === false &&
    ES29_LOCKS.UNANIMOUS_SUBMIT_GOV_BIDS === false &&
    ES29_LOCKS.UNANIMOUS_MOVE_MONEY === false &&
    ES29_LOCKS.UNANIMOUS_CHANGE_PRODUCTION === false &&
    ES29_LOCKS.UNANIMOUS_EXPAND_PERMISSIONS === false &&
    ES29_LOCKS.UNANIMOUS_EMPLOYMENT_DECISIONS === false &&
    ES29_LOCKS.UNANIMOUS_CONTROL_VEHICLES === false &&
    ES29_LOCKS.UNANIMOUS_CONTROL_INFRASTRUCTURE === false &&
    ES29_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ES29_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ES29_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ES29_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ES29_LOCKS.RECOMMEND_EQ_ACT === false &&
    ES29_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ES29_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ES29_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ES29_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ES29_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ES29_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ES29_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ES29_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS ===
      true &&
    ES29_LOCKS.PRESENCE_EQ_VERIFIED === false &&
    ES29_LOCKS.TIP_LAND === false &&
    ES29_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ES29_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ES29_LOCKS.FULL_PRODUCTION_CONSENSUS_ENGINE_SHIPPED === false &&
    ES29_LOCKS.MANAGE_PULL_REQUEST === false
  );
}

function softWireFile(
  relativeFromLocalBrain: string,
  presentNote: string,
  absentNote: string,
): SoftWirePresence {
  const here = dirname(fileURLToPath(import.meta.url));
  const pathChecked = join(here, relativeFromLocalBrain);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? presentNote : absentNote,
  };
}

function softWireRepoRelative(
  relativeFromRepoRoot: string,
  presentNote: string,
  absentNote: string,
  repoRoot?: string,
): SoftWirePresence {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');
  const pathChecked = join(root, relativeFromRepoRoot);
  const present = existsSync(pathChecked);
  return {
    present,
    pathChecked,
    note: present ? presentNote : absentNote,
  };
}

/**
 * Soft-wire snapshot. Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 * ES28 / ES27 / ER18 may be WAITING_DATA on ER34-derived tips.
 * ER16 Home Base (agent-compute-home-base) often PRESENT.
 */
export function es29SoftWireSnapshot(repoRoot?: string): Es29SoftWireSnapshot {
  return {
    es28WorkflowGraphOptimizer: softWireFile(
      './workflow-graph-optimizer-types.ts',
      'ES28 Workflow Graph Optimizer PRESENT (soft-wire).',
      'ES28 Workflow Graph Optimizer absent — soft-wire WAITING_DATA.',
    ),
    es28Report: softWireRepoRelative(
      'docs/operations/62L_ES28_WORKFLOW_GRAPH_OPTIMIZER_REPORT.md',
      'ES28 report PRESENT (soft-wire).',
      'ES28 report absent — soft-wire WAITING_DATA.',
      repoRoot,
    ),
    es27CapabilityComposition: softWireFile(
      './capability-composition-engine-types.ts',
      'ES27 Capability Composition Engine PRESENT (soft-wire).',
      'ES27 Capability Composition Engine absent — soft-wire WAITING_DATA.',
    ),
    es27Report: softWireRepoRelative(
      'docs/operations/62L_ES27_CAPABILITY_COMPOSITION_ENGINE_REPORT.md',
      'ES27 report PRESENT (soft-wire).',
      'ES27 report absent — soft-wire WAITING_DATA.',
      repoRoot,
    ),
    er16HomeBase: softWireFile(
      './agent-compute-home-base-types.ts',
      'ER16 / Home Base (agent-compute-home-base) PRESENT (soft-wire).',
      'ER16 / Home Base absent — soft-wire WAITING_DATA.',
    ),
    er16HomeBaseReport: softWireRepoRelative(
      'docs/operations/62L_EM_AGENT_COMPUTE_HOME_BASE_REPORT.md',
      'Home Base report PRESENT (soft-wire).',
      'Home Base report absent — soft-wire WAITING_DATA.',
      repoRoot,
    ),
    er18ResearchReviewBoard: softWireFile(
      './research-review-board-types.ts',
      'ER18 Research Review Board PRESENT (soft-wire).',
      'ER18 Research Review Board absent — soft-wire WAITING_DATA.',
    ),
    er18Report: softWireRepoRelative(
      'docs/operations/62L_ER18_RESEARCH_REVIEW_BOARD_REPORT.md',
      'ER18 report PRESENT (soft-wire).',
      'ER18 report absent — soft-wire WAITING_DATA.',
      repoRoot,
    ),
  };
}

export function softWireHopState(present: boolean): Es29EvidenceState {
  return present ? 'AVAILABLE' : 'WAITING_DATA';
}

export function isHumanApprover(actor: Es29Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.permissions.includes('approve_consequential')
  );
}

export function isConsensusAgent(actor: Es29Actor): boolean {
  return (
    actor.kind === 'consensus_agent' ||
    actor.kind === 'ops_agent' ||
    actor.kind === 'quant_agent' ||
    actor.kind === 'historical_agent' ||
    actor.kind === 'finance_agent' ||
    actor.kind === 'security_agent' ||
    actor.kind === 'legal_agent' ||
    actor.kind === 'evaluator' ||
    actor.kind === 'home_base'
  );
}

export function domainReliabilityApplies(
  agentDomain: ReliabilityDomain,
  questionDomain: ReliabilityDomain,
): boolean {
  if (questionDomain === 'general') return true;
  return agentDomain === questionDomain;
}

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
