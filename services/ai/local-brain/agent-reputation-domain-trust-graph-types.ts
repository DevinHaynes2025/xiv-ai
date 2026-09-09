/**
 * 62L-ES30 — Agent Reputation & Domain Trust Graph (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory /
 * Certified Skill Marketplace → Multi-Agent Consensus → Reputation & Trust.
 *
 * Each agent and certified skill builds a domain-specific trust profile so
 * Home Base knows which agents are reliable for which tasks, evidence types,
 * industries, and runtimes.
 *
 * Model: Agent → Domain → Skill → Task → Evidence → Outcome
 *
 * Domain isolation: Supply Chain HIGH_TRUST for inventory ≠ HIGH_TRUST for legal.
 *
 * Routing: Mission → required domain → eligible agents → trust graph →
 * capability/cost/availability → team selection. Prefer best qualified, not
 * most active/expensive.
 *
 * Dissent weighting: Reputation influences confidence but never auto-suppresses
 * a lower-trust agent with stronger evidence. Evidence remains primary.
 * Soft-wire ES29 Multi-Agent Consensus when PRESENT.
 *
 * Soft-wire when PRESENT (existsSync): ES29 Multi-Agent Consensus, ES28 (prior
 * tip when present), ES25 Skill Certification, ES16 / Home Base surfaces.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * Security boundary: No agent can modify its own trust score, certification,
 * or reviewer history. Trust cannot grant new permissions/authority.
 * Guardian/RLS/tenant/Universe enforced. L4_AUTONOMY_ENABLED=false.
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO.
 * Next (report only): ES31 — Dynamic Agent Team Builder.
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
export const GITHUB_SOT_LABEL = '62L-ES30' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES30 Agent Reputation & Domain Trust Graph — domain-isolated trust profiles; evidence primacy; no self-modify; trust≠authority; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES30_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory / Certified Skill Marketplace → Multi-Agent Consensus → Reputation & Trust' as const;

export const NEXT_PHASE_TITLE =
  'ES31 — Dynamic Agent Team Builder — assemble mission teams from domain trust, capability, cost, and availability without granting new authority.' as const;

/**
 * Required trust states (exact set from user story).
 */
export const TRUST_STATES = [
  'UNVERIFIED',
  'LIMITED_TRUST',
  'DOMAIN_VERIFIED',
  'HIGH_TRUST',
  'DEGRADED',
  'SUSPENDED',
  'REVALIDATION_REQUIRED',
] as const;

export type TrustState = (typeof TRUST_STATES)[number];

/**
 * Trust record tracking fields (exact set from user story).
 */
export const TRUST_RECORD_FIELDS = [
  'agentId',
  'skillId',
  'domain',
  'taskClass',
  'certificationState',
  'testHistory',
  'factualAccuracy',
  'citationQuality',
  'contradictionRate',
  'escalationQuality',
  'policyCompliance',
  'latency',
  'cost',
  'failureRate',
  'evaluatorScores',
  'humanReviewOutcomes',
  'lastVerifiedDate',
  'trustState',
  'evidenceRefs',
] as const;

export type TrustRecordField = (typeof TRUST_RECORD_FIELDS)[number];

/**
 * Domain model chain (exact).
 */
export const DOMAIN_TRUST_MODEL = [
  'agent',
  'domain',
  'skill',
  'task',
  'evidence',
  'outcome',
] as const;

export type DomainTrustModelHop = (typeof DOMAIN_TRUST_MODEL)[number];

/**
 * Routing preference chain (exact).
 */
export const TRUST_ROUTING_PATH = [
  'mission',
  'required_domain',
  'eligible_agents',
  'trust_graph',
  'capability_cost_availability',
  'team_selection',
] as const;

export type TrustRoutingPathHop = (typeof TRUST_ROUTING_PATH)[number];

/**
 * Signals that increase domain trust.
 */
export const TRUST_INCREASE_SIGNALS = [
  'independent_tests_pass',
  'well_grounded_outputs',
  'recommendations_match_measured_outcomes',
  'correct_escalation',
  'strong_policy_compliance',
  'reviewers_approve',
] as const;

export type TrustIncreaseSignal = (typeof TRUST_INCREASE_SIGNALS)[number];

/**
 * Signals that decrease domain trust.
 */
export const TRUST_DECREASE_SIGNALS = [
  'hallucinations',
  'citation_failures',
  'stale_as_current',
  'contradictions',
  'runtime_failures',
  'policy_violations',
  'certified_skill_expires_or_regresses',
] as const;

export type TrustDecreaseSignal = (typeof TRUST_DECREASE_SIGNALS)[number];

export const CERTIFICATION_STATES = [
  'UNCERTIFIED',
  'CANDIDATE',
  'CERTIFIED',
  'EXPIRED',
  'REGRESSED',
  'REVOKED',
  'WAITING_DATA',
] as const;

export type CertificationState = (typeof CERTIFICATION_STATES)[number];

export type MetricScore = {
  value: number;
  samples: number;
  note?: string;
};

export type TestHistoryEntry = {
  testId: string;
  domain: string;
  passed: boolean;
  at: string;
  evidenceRef?: string;
};

export type HumanReviewOutcome = {
  reviewId: string;
  reviewerId: string;
  approved: boolean;
  at: string;
  notes?: string;
};

export type EvaluatorScore = {
  evaluatorId: string;
  score: number;
  at: string;
  dimension?: string;
};

/**
 * Domain-scoped trust profile for one agent or skill.
 * Trust in domain A never transfers to domain B.
 */
export type DomainTrustRecord = {
  trustRecordId: string;
  agentId: string;
  skillId: string | null;
  domain: string;
  taskClass: string;
  certificationState: CertificationState;
  testHistory: readonly TestHistoryEntry[];
  factualAccuracy: MetricScore;
  citationQuality: MetricScore;
  contradictionRate: MetricScore;
  escalationQuality: MetricScore;
  policyCompliance: MetricScore;
  latencyMs: MetricScore;
  costUnits: MetricScore;
  failureRate: MetricScore;
  evaluatorScores: readonly EvaluatorScore[];
  humanReviewOutcomes: readonly HumanReviewOutcome[];
  lastVerifiedDate: string | null;
  trustState: TrustState;
  evidenceRefs: readonly string[];
  activityCount: number;
  tenantId: string;
  universeId: string;
  orgId: string;
  l4AutonomyEnabled: false;
  grantsPermissions: false;
  grantsAuthority: false;
};

export type EvidenceStrength = {
  evidenceId: string;
  agentId: string;
  domain: string;
  strength: number;
  grounded: boolean;
  citationOk: boolean;
  contradictionFree: boolean;
  refs: readonly string[];
};

export type DissentWeightingDecision = {
  suppressed: false;
  evidencePrimary: true;
  reputationInfluencesConfidence: true;
  lowerTrustAgentId: string;
  higherTrustAgentId: string;
  lowerTrustEvidenceStrength: number;
  higherTrustEvidenceStrength: number;
  confidenceAdjustment: number;
  reason: string;
};

export type RoutingCandidate = {
  agentId: string;
  domain: string;
  trustState: TrustState;
  trustScore: number;
  capabilityFit: number;
  costUnits: number;
  available: boolean;
  activityCount: number;
};

export type TeamSelectionResult = {
  selectedAgentIds: readonly string[];
  preferredBy: 'best_qualified';
  notPreferredBy: readonly ['most_active', 'most_expensive'];
  domain: string;
  reason: string;
};

export const AGENT_REPUTATION_DOMAIN_TRUST_GRAPH_CYCLE = [
  'honesty_locks',
  'agent_reputation_domain_trust_graph_bootstrap',
  // A — Structure
  'trust_states_encoded',
  'trust_record_fields_encoded',
  'domain_trust_model_encoded',
  'trust_routing_path_encoded',
  'increase_decrease_signals_encoded',
  'truth_boundary_encoded',
  // B — Domain isolation + scoring
  'register_domain_trust_record',
  'enforce_domain_isolation',
  'apply_trust_increase',
  'apply_trust_decrease',
  'deny_cross_domain_trust_transfer',
  // C — Routing + dissent
  'route_mission_via_trust_graph',
  'prefer_best_qualified_not_most_active_or_expensive',
  'weight_dissent_without_suppressing_stronger_evidence',
  'evidence_remains_primary',
  // D — Security boundary
  'deny_self_modify_trust_score',
  'deny_self_modify_certification',
  'deny_self_modify_reviewer_history',
  'deny_trust_grants_permissions',
  'deny_trust_grants_authority',
  'deny_bypass_guardian_rls',
  'deny_expand_tenant_universe_access',
  // E — Autonomy / soft-wires
  'guardian_rls_tenant_universe_isolation',
  'recommend_neq_act',
  'l4_autonomy_false',
  'es29_multi_agent_consensus_soft_wire',
  'es28_prior_tip_soft_wire',
  'es25_skill_certification_soft_wire',
  'es16_home_base_soft_wire',
  'db_candidates_not_applied',
  'evidence',
] as const;

export type Es30Hop =
  (typeof AGENT_REPUTATION_DOMAIN_TRUST_GRAPH_CYCLE)[number];

export type Es30EvidenceState =
  | 'PASS'
  | 'FAIL'
  | 'UNAVAILABLE'
  | 'DENIED'
  | 'REJECTED'
  | 'BLOCKED'
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
  | 'WAITING_NODE'
  | 'ADVISORY_ONLY'
  | 'REGISTERED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'UNVERIFIED'
  | 'PARTIAL'
  | 'UNKNOWN';

export type Es30HopRecord = {
  hop: Es30Hop;
  state: Es30EvidenceState;
  summary: string;
  at: string;
};

export type Es30ActorKind =
  | 'trust_graph_authority'
  | 'home_base'
  | 'evaluator'
  | 'human_reviewer'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'consensus_agent'
  | 'certified_skill_registry'
  | 'subject_agent'
  | 'proposal';

export type Es30Actor = {
  kind: Es30ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export const ES30_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  TIP_LAND: false as const,
  PRODUCTION_AUTHORIZATION: false as const,
  PRODUCTION_WRITE: false as const,
  DB_CANDIDATES_APPLIED: false as const,
  FULL_PRODUCTION_TRUST_GRAPH_SHIPPED: false as const,
  MANAGE_PULL_REQUEST: false as const,

  SELF_MODIFY_TRUST_SCORE: false as const,
  SELF_MODIFY_CERTIFICATION: false as const,
  SELF_MODIFY_REVIEWER_HISTORY: false as const,
  TRUST_GRANTS_PERMISSIONS: false as const,
  TRUST_GRANTS_AUTHORITY: false as const,
  CROSS_DOMAIN_TRUST_TRANSFER: false as const,
  AUTO_SUPPRESS_LOWER_TRUST_WITH_STRONGER_EVIDENCE: false as const,
  PREFER_MOST_ACTIVE_OVER_BEST_QUALIFIED: false as const,
  PREFER_MOST_EXPENSIVE_OVER_BEST_QUALIFIED: false as const,

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
});

export const ES30_AGENT_BOUNDS = Object.freeze({
  mayRegisterDomainTrustRecords: true as const,
  mayApplyTrustIncreaseSignals: true as const,
  mayApplyTrustDecreaseSignals: true as const,
  mayRouteViaTrustGraph: true as const,
  mayPreferBestQualified: true as const,
  mayWeightDissentWithReputation: true as const,
  maySelfModifyOwnTrustScore: false as const,
  maySelfModifyOwnCertification: false as const,
  maySelfModifyOwnReviewerHistory: false as const,
  mayTransferTrustAcrossDomains: false as const,
  mayAutoSuppressLowerTrustStrongerEvidence: false as const,
  mayGrantPermissionsFromTrust: false as const,
  mayGrantAuthorityFromTrust: false as const,
  mayBypassGuardianRls: false as const,
  mayExpandTenantUniverseAccess: false as const,
  mayAutoDeployChanges: false as const,
  automaticAuthority: false as const,
  mayRecommendOnly: true as const,
});

export const ES30_MAY = Object.freeze([
  'register_domain_scoped_trust_profiles_for_agents_and_certified_skills',
  'increase_or_decrease_trust_from_evidence_backed_signals',
  'route_missions_preferring_best_qualified_agents_per_domain',
  'weight_dissent_confidence_without_suppressing_stronger_evidence',
  'soft_wire_es29_consensus_es25_certification_es16_home_base_when_present',
] as const);

export const ES30_MUST_NOT = Object.freeze([
  'allow_agent_to_modify_own_trust_score_certification_or_reviewer_history',
  'transfer_trust_across_domains',
  'auto_suppress_lower_trust_agent_with_stronger_evidence',
  'grant_new_permissions_or_authority_from_trust_state',
  'prefer_most_active_or_most_expensive_over_best_qualified',
  'bypass_guardian_rls_or_expand_tenant_universe_access',
  'treat_soft_wire_presence_as_verified',
  'enable_l4_autonomy',
  'tip_land_or_manage_pull_request',
  'treat_recommend_as_act',
] as const);

export const AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY = Object.freeze({
  documentedNeqImplemented: true as const,
  implementedNeqVerified: true as const,
  verifiedNeqProductionAuthorized: true as const,
  domainTrustIsIsolated: true as const,
  evidenceRemainsPrimaryOverReputation: true as const,
  mayAutoSuppressLowerTrustWithStrongerEvidence: false as const,
  maySelfModifyTrust: false as const,
  trustGrantsPermissions: false as const,
  trustGrantsAuthority: false as const,
  softWirePresenceNeqVerified: true as const,
  l4AutonomyEnabled: false as const,
  mayTipLand: false as const,
  mayManagePullRequest: false as const,
});

/** Numeric rank for trust states (routing preference; not authority). */
export const TRUST_STATE_RANK: Readonly<Record<TrustState, number>> = {
  SUSPENDED: 0,
  UNVERIFIED: 1,
  REVALIDATION_REQUIRED: 2,
  DEGRADED: 3,
  LIMITED_TRUST: 4,
  DOMAIN_VERIFIED: 5,
  HIGH_TRUST: 6,
};

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es30SoftWireSnapshot = {
  es29MultiAgentConsensus: SoftWirePresence;
  es29Report: SoftWirePresence;
  es28PriorTip: SoftWirePresence;
  es28Report: SoftWirePresence;
  es25SkillCertification: SoftWirePresence;
  es25Report: SoftWirePresence;
  es16HomeBase: SoftWirePresence;
  es16Report: SoftWirePresence;
  homeBaseComputeSurface: SoftWirePresence;
};

export function assertEs30LocksIntact(): boolean {
  return (
    ES30_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES30_LOCKS.SELF_MODIFY_TRUST_SCORE === false &&
    ES30_LOCKS.SELF_MODIFY_CERTIFICATION === false &&
    ES30_LOCKS.SELF_MODIFY_REVIEWER_HISTORY === false &&
    ES30_LOCKS.TRUST_GRANTS_PERMISSIONS === false &&
    ES30_LOCKS.TRUST_GRANTS_AUTHORITY === false &&
    ES30_LOCKS.CROSS_DOMAIN_TRUST_TRANSFER === false &&
    ES30_LOCKS.AUTO_SUPPRESS_LOWER_TRUST_WITH_STRONGER_EVIDENCE === false &&
    ES30_LOCKS.PREFER_MOST_ACTIVE_OVER_BEST_QUALIFIED === false &&
    ES30_LOCKS.PREFER_MOST_EXPENSIVE_OVER_BEST_QUALIFIED === false &&
    ES30_LOCKS.BYPASS_GUARDIAN_RLS === false &&
    ES30_LOCKS.EXPAND_TENANT_UNIVERSE_ACCESS === false &&
    ES30_LOCKS.AUTO_DEPLOY_CHANGES === false &&
    ES30_LOCKS.AGENT_AUTO_AUTHORITY === false &&
    ES30_LOCKS.RECOMMEND_EQ_ACT === false &&
    ES30_LOCKS.RECOMMEND_EQ_AUTHORIZE === false &&
    ES30_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false &&
    ES30_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED === true &&
    ES30_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED === true &&
    ES30_LOCKS.DOCUMENTED_EQ_IMPLEMENTED === false &&
    ES30_LOCKS.IMPLEMENTED_EQ_VERIFIED === false &&
    ES30_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED === false &&
    ES30_LOCKS.HUMAN_APPROVAL_REQUIRED_BEFORE_CONSEQUENTIAL_ACTIONS === true &&
    ES30_LOCKS.TIP_LAND === false &&
    ES30_LOCKS.PRODUCTION_AUTHORIZATION === false &&
    ES30_LOCKS.DB_CANDIDATES_APPLIED === false &&
    ES30_LOCKS.FULL_PRODUCTION_TRUST_GRAPH_SHIPPED === false &&
    ES30_LOCKS.MANAGE_PULL_REQUEST === false &&
    AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY.domainTrustIsIsolated ===
      true &&
    AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY.evidenceRemainsPrimaryOverReputation ===
      true &&
    AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY.mayAutoSuppressLowerTrustWithStrongerEvidence ===
      false &&
    AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY.maySelfModifyTrust === false &&
    AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY.trustGrantsPermissions ===
      false &&
    AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY.trustGrantsAuthority ===
      false &&
    AGENT_REPUTATION_DOMAIN_TRUST_TRUTH_BOUNDARY.l4AutonomyEnabled === false &&
    ES30_AGENT_BOUNDS.maySelfModifyOwnTrustScore === false &&
    ES30_AGENT_BOUNDS.mayGrantPermissionsFromTrust === false &&
    ES30_AGENT_BOUNDS.automaticAuthority === false
  );
}

export function isTrustAuthority(actor: Es30Actor): boolean {
  return (
    actor.kind === 'trust_graph_authority' ||
    actor.kind === 'home_base' ||
    actor.kind === 'evaluator' ||
    actor.kind === 'human_reviewer' ||
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'guardian'
  );
}

export function isSubjectAgent(actor: Es30Actor): boolean {
  return actor.kind === 'subject_agent' || actor.kind === 'consensus_agent';
}

export function domainsAreIsolated(a: string, b: string): boolean {
  return a.trim().toLowerCase() !== b.trim().toLowerCase();
}

export function trustTransfersAcrossDomains(): boolean {
  return ES30_LOCKS.CROSS_DOMAIN_TRUST_TRANSFER;
}

export function mayAutoSuppressLowerTrustWithStrongerEvidence(): boolean {
  return ES30_LOCKS.AUTO_SUPPRESS_LOWER_TRUST_WITH_STRONGER_EVIDENCE;
}

export function trustGrantsPermissionsOrAuthority(): boolean {
  return (
    ES30_LOCKS.TRUST_GRANTS_PERMISSIONS === true ||
    ES30_LOCKS.TRUST_GRANTS_AUTHORITY === true
  );
}

export function computeCompositeTrustScore(record: DomainTrustRecord): number {
  const stateRank = TRUST_STATE_RANK[record.trustState];
  const accuracy = clamp01(record.factualAccuracy.value);
  const citations = clamp01(record.citationQuality.value);
  const escalation = clamp01(record.escalationQuality.value);
  const policy = clamp01(record.policyCompliance.value);
  const lowContradiction = clamp01(1 - record.contradictionRate.value);
  const lowFailure = clamp01(1 - record.failureRate.value);
  const signal =
    (accuracy + citations + escalation + policy + lowContradiction + lowFailure) /
    6;
  return Number((stateRank * 10 + signal * 10).toFixed(4));
}

export function nextTrustStateAfterIncrease(
  current: TrustState,
): TrustState {
  if (current === 'SUSPENDED') return 'REVALIDATION_REQUIRED';
  if (current === 'UNVERIFIED') return 'LIMITED_TRUST';
  if (current === 'LIMITED_TRUST') return 'DOMAIN_VERIFIED';
  if (current === 'DOMAIN_VERIFIED') return 'HIGH_TRUST';
  if (current === 'DEGRADED') return 'LIMITED_TRUST';
  if (current === 'REVALIDATION_REQUIRED') return 'LIMITED_TRUST';
  return 'HIGH_TRUST';
}

export function nextTrustStateAfterDecrease(
  current: TrustState,
): TrustState {
  if (current === 'HIGH_TRUST') return 'DEGRADED';
  if (current === 'DOMAIN_VERIFIED') return 'DEGRADED';
  if (current === 'LIMITED_TRUST') return 'REVALIDATION_REQUIRED';
  if (current === 'DEGRADED') return 'SUSPENDED';
  if (current === 'REVALIDATION_REQUIRED') return 'SUSPENDED';
  if (current === 'UNVERIFIED') return 'UNVERIFIED';
  return 'SUSPENDED';
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
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

function softWireFirstPresent(
  candidates: readonly SoftWirePresence[],
): SoftWirePresence {
  for (const c of candidates) {
    if (c.present) return c;
  }
  return candidates[candidates.length - 1]!;
}

export function softWireHopState(
  presence: SoftWirePresence,
): Es30EvidenceState {
  return presence.present ? 'AVAILABLE' : 'WAITING_DATA';
}

export function es30SoftWireSnapshot(repoRoot?: string): Es30SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    es29MultiAgentConsensus: softWireFirstPresent([
      softWireFile(
        './multi-agent-reliability-consensus-types.ts',
        'ES29 Multi-Agent Reliability Consensus PRESENT (soft-wire).',
        'ES29 Multi-Agent Consensus absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './multi-agent-consensus-types.ts',
        'ES29 Multi-Agent Consensus PRESENT (soft-wire).',
        'ES29 Multi-Agent Consensus absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './multi-agent-consensus.ts',
        'ES29 Multi-Agent Consensus PRESENT (soft-wire).',
        'ES29 Multi-Agent Consensus absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es29Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES29_MULTI_AGENT_RELIABILITY_CONSENSUS_REPORT.md',
        'ES29 report PRESENT.',
        'ES29 report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES29_MULTI_AGENT_CONSENSUS_REPORT.md',
        'ES29 report PRESENT.',
        'ES29 report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es28PriorTip: softWireFirstPresent([
      softWireFile(
        './capability-composition-engine-types.ts',
        'ES27/ES28-chain composition tip PRESENT (soft-wire).',
        'ES28 prior tip absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-capability-marketplace-types.ts',
        'ES26 marketplace tip PRESENT (soft-wire; prior tip in ES chain).',
        'ES28 prior tip absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es28Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES28_AGENT_RUNTIME_OBSERVABILITY_REPORT.md',
        'ES28 report PRESENT.',
        'ES28 report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES27_CAPABILITY_COMPOSITION_ENGINE_REPORT.md',
        'ES27 report PRESENT as ES28-chain soft-wire.',
        'ES28 report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES26_AGENT_CAPABILITY_MARKETPLACE_REPORT.md',
        'ES26 report PRESENT as ES-chain soft-wire.',
        'ES28 report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es25SkillCertification: softWireFirstPresent([
      softWireFile(
        './skill-certification-types.ts',
        'ES25 Skill Certification PRESENT (soft-wire).',
        'ES25 Skill Certification absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-skill-certification-types.ts',
        'ES25 Skill Certification PRESENT (soft-wire).',
        'ES25 Skill Certification absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './certified-skill-registry-types.ts',
        'ES25 Skill Certification PRESENT (soft-wire).',
        'ES25 Skill Certification absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-capability-marketplace-types.ts',
        'ES26 marketplace (certification-adjacent) PRESENT as ES25-chain soft-wire.',
        'ES25 Skill Certification absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es25Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES25_SKILL_CERTIFICATION_REPORT.md',
        'ES25 report PRESENT.',
        'ES25 report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES26_AGENT_CAPABILITY_MARKETPLACE_REPORT.md',
        'ES26 report PRESENT as certification-chain soft-wire.',
        'ES25 report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es16HomeBase: softWireFirstPresent([
      softWireFile(
        './agent-home-base-types.ts',
        'ES16 Home Base types PRESENT (soft-wire).',
        'ES16 Home Base absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-home-base-contract.ts',
        'ES16 Home Base contract PRESENT (soft-wire).',
        'ES16 Home Base absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es16Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES16_HOME_BASE_REPORT.md',
      'ES16 report PRESENT.',
      'ES16 report absent — soft-wire WAITING_DATA.',
    ),
    homeBaseComputeSurface: softWireFirstPresent([
      softWireFile(
        './agent-compute-home-base.ts',
        'Home Base compute surface PRESENT (soft-wire; presence ≠ VERIFIED).',
        'Home Base compute surface absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-compute-home-base-types.ts',
        'Home Base compute types PRESENT (soft-wire; presence ≠ VERIFIED).',
        'Home Base compute surface absent — soft-wire WAITING_DATA.',
      ),
    ]),
  };
}
