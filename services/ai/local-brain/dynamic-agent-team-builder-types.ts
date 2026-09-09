/**
 * 62L-ES31 — Dynamic Agent Team Builder (park-and-implement).
 *
 * Layer: 62L-ES Autonomous Research & Productization Factory /
 * Certified Skill Marketplace → Multi-Agent Consensus → Reputation & Trust →
 * Dynamic Agent Team Builder.
 *
 * Assemble the smallest qualified team for each mission using domain trust,
 * certified skills, permissions, compute requirements, availability, cost,
 * and evidence needs — not spawn every department.
 *
 * Core flow:
 * Mission → task decomposition → required domains/skills → eligible agents →
 * trust/capability check → permission intersection → cost/compute check →
 * team proposal → Home Base
 *
 * Soft-wire when PRESENT (existsSync): ES30 trust graph, ES29 consensus,
 * ES25 skills, ES27 composition, ER16 Home Base, ER14/ER34 runtime surfaces.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 *
 * SoT: 62L-ES family / GitHub SoT unresolved in this environment — no issue
 * number invented. GitLab mirror: needsAuth; no number invented.
 *
 * Honesty: DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
 * L4_AUTONOMY_ENABLED=false. Guardian/RLS/tenant/Universe unchanged.
 * DB candidates NOT_APPLIED. tip-land=NO. No PR / ManagePullRequest.
 * Next (report only): ES32 — Mission Decomposition & Dependency Planner.
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
export const GITHUB_SOT_LABEL = '62L-ES31' as const;
export const GITHUB_SOT_FAMILY = '62L-ES' as const;
export const GITHUB_SOT_TITLE =
  '62L-ES31 Dynamic Agent Team Builder — smallest qualified team; scoring+hard constraints; child bounds; cost guard; no-authority; L4=false' as const;

export const GITLAB_MIRROR_NOTE =
  'GitLab mirror: search attempted; MCP needsAuth / not resolved in this environment — no issue number invented.' as const;

export const ES31_DB_CANDIDATES_STATUS = 'NOT_APPLIED' as const;

export const ES_LAYER_TITLE =
  '62L-ES Autonomous Research & Productization Factory / Certified Skill Marketplace → Multi-Agent Consensus → Reputation & Trust → Dynamic Agent Team Builder' as const;

export const NEXT_PHASE_TITLE =
  'ES32 — Mission Decomposition & Dependency Planner — decompose missions into ordered task graphs with dependencies without expanding permissions or autonomy.' as const;

/**
 * Core team-building flow (exact order from user story).
 */
export const DYNAMIC_AGENT_TEAM_CORE_FLOW = [
  'mission',
  'task_decomposition',
  'required_domains_skills',
  'eligible_agents',
  'trust_capability_check',
  'permission_intersection',
  'cost_compute_check',
  'team_proposal',
  'home_base',
] as const;

export type DynamicAgentTeamCoreFlowHop =
  (typeof DYNAMIC_AGENT_TEAM_CORE_FLOW)[number];

/**
 * Team tracking fields (exact set from user story).
 */
export const TEAM_TRACKING_FIELDS = [
  'teamId',
  'mission',
  'leadAgent',
  'memberAgents',
  'requiredDomains',
  'requiredCertifiedSkills',
  'tenantUniverseScope',
  'allowedDataClasses',
  'allowedToolsApis',
  'computeBudget',
  'expectedRuntime',
  'evidenceRequirements',
  'escalationPoints',
  'humanApprovalCheckpoints',
  'returnPath',
  'expiry',
  'revocationState',
] as const;

export type TeamTrackingField = (typeof TEAM_TRACKING_FIELDS)[number];

/**
 * Selection scoring dimensions (soft preferences).
 */
export const SELECTION_SCORE_DIMENSIONS = [
  'domain_trust',
  'skill_certification',
  'availability',
  'evidence_quality',
  'cost_efficiency',
  'runtime_compatibility',
] as const;

export type SelectionScoreDimension =
  (typeof SELECTION_SCORE_DIMENSIONS)[number];

/**
 * Hard constraints that cannot be scored away.
 */
export const HARD_CONSTRAINTS = [
  'permissions',
  'tenant_scope',
  'data_rights',
  'compute_budget',
] as const;

export type HardConstraint = (typeof HARD_CONSTRAINTS)[number];

/**
 * Runtime awareness classes (soft-wire ER14/ER34 when present).
 */
export const RUNTIME_AWARENESS_STATES = [
  'LOCAL',
  'OFFLINE',
  'EDGE',
  'CLOUD',
  'WAITING_NODE',
] as const;

export type RuntimeAwarenessState = (typeof RUNTIME_AWARENESS_STATES)[number];

/**
 * Team / proposal lifecycle states.
 */
export const TEAM_PROPOSAL_STATES = [
  'DECOMPOSING',
  'SCORING',
  'CONSTRAINED',
  'PROPOSED',
  'TEAM_PROPOSAL_BLOCKED',
  'WAITING_DATA',
  'ESCALATED',
  'EXPIRED',
  'REVOKED',
] as const;

export type TeamProposalState = (typeof TEAM_PROPOSAL_STATES)[number];

export const REVOCATION_STATES = [
  'ACTIVE',
  'REVALIDATION_REQUIRED',
  'REVOKED',
  'EXPIRED',
] as const;

export type RevocationState = (typeof REVOCATION_STATES)[number];

/**
 * Example gov logistics smallest-team departments (prefer these, not overspawn).
 */
export const GOV_LOGISTICS_SMALLEST_TEAM_ROLES = [
  'Capture',
  'Logistics',
  'Quant',
  'Pricing_CFO',
  'Compliance_Reviewer',
] as const;

export type GovLogisticsSmallestTeamRole =
  (typeof GOV_LOGISTICS_SMALLEST_TEAM_ROLES)[number];

/**
 * High-consequence actions a team proposal MUST NOT authorize.
 */
export const FORBIDDEN_TEAM_AUTHORITY_ACTIONS = [
  'sign_contracts',
  'submit_bids',
  'move_money',
  'change_production',
  'widen_permissions',
  'control_vehicles_infrastructure',
] as const;

export type ForbiddenTeamAuthorityAction =
  (typeof FORBIDDEN_TEAM_AUTHORITY_ACTIONS)[number];

/** What teams MAY do (research / analyze / simulate / draft / recommend). */
export const ALLOWED_TEAM_ACTIONS = [
  'research',
  'analyze',
  'simulate',
  'draft',
  'recommend',
] as const;

export type AllowedTeamAction = (typeof ALLOWED_TEAM_ACTIONS)[number];

export const DYNAMIC_AGENT_TEAM_TRUTH_BOUNDARY = Object.freeze({
  preferSmallestQualifiedTeam: true as const,
  mayOverspawnEveryDepartment: false as const,
  scoringIsSoftPreference: true as const,
  hardConstraintsCannotBeScoredAway: true as const,
  childTaskRequiresNeedNarrowerBudgetReturnStop: true as const,
  mayUncontrolledChildReplication: false as const,
  strongDisagreementMayAddIndependentEvaluator: true as const,
  mayRelyOnlyOnHigherTrustOpinionInStrongDisagreement: false as const,
  avoidUnavailableRuntimes: true as const,
  costEstimateRequiredBeforeActivation: true as const,
  aboveBudgetYieldsBlockedOrSmallerAlternative: true as const,
  teamProposalNeqContractAuthority: true as const,
  teamProposalNeqBidSubmission: true as const,
  teamProposalNeqMoveMoney: true as const,
  teamProposalNeqProductionChange: true as const,
  teamProposalNeqPermissionWiden: true as const,
  teamProposalNeqVehicleInfrastructureControl: true as const,
  mayResearchAnalyzeSimulateDraftRecommend: true as const,
  softWirePresenceNeqVerified: true as const,
  absentSoftWireIsWaitingDataNotFail: true as const,
  l4AutonomyEnabled: false as const,
  mayTipLand: false as const,
  mayManagePullRequest: false as const,
});

export const ES31_LOCKS = Object.freeze({
  L4_AUTONOMY_ENABLED: false as const,
  OVERSPAWN_EVERY_DEPARTMENT: false as const,
  UNCONTROLLED_CHILD_REPLICATION: false as const,
  CHILD_WITHOUT_STOP_CONDITION: false as const,
  IGNORE_HARD_CONSTRAINTS: false as const,
  ACTIVATE_ABOVE_BUDGET: false as const,
  SIGN_CONTRACTS: false as const,
  SUBMIT_BIDS: false as const,
  MOVE_MONEY: false as const,
  CHANGE_PRODUCTION: false as const,
  WIDEN_PERMISSIONS: false as const,
  CONTROL_VEHICLES_INFRASTRUCTURE: false as const,
  RELY_ONLY_ON_HIGHER_TRUST_IN_STRONG_DISAGREEMENT: false as const,
  ROUTE_TO_UNAVAILABLE_RUNTIME: false as const,
  TIP_LAND: false as const,
  MANAGE_PULL_REQUEST: false as const,
  MERGE_MAIN: false as const,
  DEPLOY_PROD: false as const,
  APPLY_PROD_MIGRATIONS: false as const,
  EXPAND_PERMISSIONS: false as const,
  PROVISION_PAID_INFRA: false as const,
  PUBLISH_EXTERNALLY: false as const,
  OPEN_REMOTE_PR_MR: false as const,
  BYPASS_GUARDIAN_RLS: false as const,
});

export const ES31_AGENT_BOUNDS = Object.freeze({
  mayAssembleSmallestQualifiedTeamProposal: true as const,
  mayScoreEligibleAgents: true as const,
  mayEnforceHardConstraints: true as const,
  mayProposeChildTaskWhenBoundsMet: true as const,
  mayAddIndependentEvaluatorOnStrongDisagreement: true as const,
  mayEstimateCostBeforeActivation: true as const,
  mayResearchAnalyzeSimulateDraftRecommend: true as const,
  mayOverspawnEveryDepartment: false as const,
  mayUncontrolledChildReplication: false as const,
  mayProposeChildWithoutStopCondition: false as const,
  mayActivateAboveBudget: false as const,
  maySignContracts: false as const,
  maySubmitBids: false as const,
  mayMoveMoney: false as const,
  mayChangeProduction: false as const,
  mayWidenPermissions: false as const,
  mayControlVehiclesInfrastructure: false as const,
  mayRouteToUnavailableRuntime: false as const,
  mayTipLand: false as const,
  mayManagePullRequest: false as const,
  mayBypassGuardianRls: false as const,
  automaticAuthority: false as const,
  l4AutonomyEnabled: false as const,
});

export const ES31_MAY = Object.freeze([
  'decompose_mission_into_required_domains_and_skills',
  'score_eligible_agents_by_trust_skill_availability_evidence_cost_runtime',
  'enforce_hard_constraints_permissions_tenant_data_compute',
  'prefer_smallest_qualified_team_not_every_department',
  'propose_child_task_only_when_needed_narrower_budget_return_stop',
  'add_independent_evaluator_on_strong_disagreement',
  'avoid_unavailable_runtimes_local_offline_edge_cloud_waiting_node',
  'estimate_cost_before_activation_and_block_or_shrink_when_over_budget',
  'research_analyze_simulate_draft_recommend_only',
  'return_team_proposal_to_Home_Base',
] as const);

export const ES31_MUST_NOT = Object.freeze([
  'overspawn_every_department',
  'ignore_hard_constraints',
  'uncontrolled_child_replication',
  'propose_child_without_stop_condition',
  'activate_above_budget',
  'sign_contracts',
  'submit_bids',
  'move_money',
  'change_production',
  'widen_permissions',
  'control_vehicles_or_infrastructure',
  'rely_only_on_higher_trust_opinion_in_strong_disagreement',
  'route_to_unavailable_runtime',
  'treat_team_proposal_as_contract_authority',
  'tip_land',
  'manage_pull_request',
  'bypass_guardian_rls',
  'enable_l4_autonomy',
] as const);

export type Es31ActorKind =
  | 'team_builder'
  | 'mission_agent'
  | 'lead_agent'
  | 'member_agent'
  | 'independent_evaluator'
  | 'home_base'
  | 'human_approver'
  | 'founder'
  | 'guardian'
  | 'tenant_admin';

export type Es31Actor = {
  kind: Es31ActorKind;
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  permissions: readonly string[];
};

export type Es31EvidenceState =
  | 'PASS'
  | 'DENIED'
  | 'BLOCKED'
  | 'WAITING_DATA'
  | 'TEAM_PROPOSAL_BLOCKED'
  | 'ESCALATED'
  | 'PARTIAL';

export type Es31HopRecord = {
  hop: string;
  state: Es31EvidenceState;
  summary: string;
  at: string;
};

export type SoftWirePresence = {
  present: boolean;
  pathChecked: string;
  note: string;
};

export type Es31SoftWireSnapshot = {
  es30TrustGraph: SoftWirePresence;
  es30Report: SoftWirePresence;
  es29Consensus: SoftWirePresence;
  es29Report: SoftWirePresence;
  es25SkillCertification: SoftWirePresence;
  es25Report: SoftWirePresence;
  es27Composition: SoftWirePresence;
  es27Report: SoftWirePresence;
  er16HomeBase: SoftWirePresence;
  er16HomeBaseReport: SoftWirePresence;
  er14OfflineBrain: SoftWirePresence;
  er14Report: SoftWirePresence;
  er34CapabilityManifest: SoftWirePresence;
  er34Report: SoftWirePresence;
};

export type TenantUniverseScope = {
  tenantId: string;
  universeId: string;
  orgId: string;
  crossTenantSharing: false;
};

export type AgentCostEstimate = {
  agentUnits: number;
  modelUnits: number;
  apiUnits: number;
  computeUnits: number;
  storageUnits: number;
  networkUnits: number;
  totalUnits: number;
  budgetUnits: number;
  withinBudget: boolean;
};

export type SelectionScores = Readonly<
  Record<SelectionScoreDimension, number>
> & {
  composite: number;
};

export type HardConstraintResult = Readonly<
  Record<HardConstraint, boolean>
> & {
  ok: boolean;
  blockers: readonly string[];
};

export type ChildAgentProposal = {
  needed: boolean;
  narrowerThanParent: boolean;
  computeDataBudgetExists: boolean;
  returnPathDefined: boolean;
  stopConditionExists: boolean;
  allowed: boolean;
  reason: string;
};

export type ConflictHandlingDecision = {
  strongDisagreement: boolean;
  addIndependentEvaluator: boolean;
  reliedOnlyOnHigherTrust: false;
  evaluatorAgentId: string | null;
  reason: string;
  es29SoftWire: SoftWirePresence;
};

export type EligibleAgentCandidate = {
  agentId: string;
  role: string;
  domains: readonly string[];
  certifiedSkills: readonly string[];
  permissions: readonly string[];
  allowedDataClasses: readonly string[];
  allowedToolsApis: readonly string[];
  tenantId: string;
  universeId: string;
  trustScore: number;
  skillCertificationScore: number;
  availabilityScore: number;
  evidenceQualityScore: number;
  costEfficiencyScore: number;
  runtimeCompatibilityScore: number;
  runtimeState: RuntimeAwarenessState;
  costEstimate: AgentCostEstimate;
  available: boolean;
};

export type MissionTeamRequest = {
  missionId: string;
  mission: string;
  tasks: readonly string[];
  requiredDomains: readonly string[];
  requiredCertifiedSkills: readonly string[];
  requiredPermissions: readonly string[];
  requiredDataClasses: readonly string[];
  requiredToolsApis: readonly string[];
  tenantUniverseScope: TenantUniverseScope;
  computeBudgetUnits: number;
  expectedRuntime: RuntimeAwarenessState | 'ANY_AVAILABLE';
  evidenceRequirements: readonly string[];
  escalationPoints: readonly string[];
  humanApprovalCheckpoints: readonly string[];
  returnPath: string;
  expiry: string;
  candidates: readonly EligibleAgentCandidate[];
  preferRoles?: readonly string[];
  maxTeamSize?: number;
  strongDisagreement?: boolean;
  childProposal?: Omit<ChildAgentProposal, 'allowed' | 'reason'> & {
    childAgentId?: string;
  };
  attemptOverspawn?: boolean;
  attemptSignContract?: boolean;
  attemptSubmitBid?: boolean;
  attemptMoveMoney?: boolean;
  attemptChangeProduction?: boolean;
  attemptWidenPermissions?: boolean;
  attemptControlVehicles?: boolean;
  attemptActivateAboveBudget?: boolean;
  attemptRouteUnavailableRuntime?: boolean;
};

export type TeamProposal = {
  teamId: string;
  mission: string;
  leadAgent: string;
  memberAgents: readonly string[];
  requiredDomains: readonly string[];
  requiredCertifiedSkills: readonly string[];
  tenantUniverseScope: TenantUniverseScope;
  allowedDataClasses: readonly string[];
  allowedToolsApis: readonly string[];
  computeBudget: number;
  expectedRuntime: RuntimeAwarenessState | 'ANY_AVAILABLE';
  evidenceRequirements: readonly string[];
  escalationPoints: readonly string[];
  humanApprovalCheckpoints: readonly string[];
  returnPath: string;
  expiry: string;
  revocationState: RevocationState;
  state: TeamProposalState;
  scoresByAgent: Readonly<Record<string, SelectionScores>>;
  hardConstraints: HardConstraintResult;
  costEstimate: AgentCostEstimate;
  conflictHandling: ConflictHandlingDecision;
  childAgent: ChildAgentProposal | null;
  selectedRoles: readonly string[];
  overspawnDenied: boolean;
  authorityLocksIntact: true;
  l4AutonomyEnabled: false;
  contractAuthority: false;
  notes: readonly string[];
};

export const DYNAMIC_AGENT_TEAM_BUILDER_CYCLE = [
  'honesty_locks',
  'dynamic_agent_team_builder_bootstrap',
  'team_tracking_fields_encoded',
  'core_flow_encoded',
  'selection_scoring_encoded',
  'hard_constraints_encoded',
  'runtime_awareness_encoded',
  'child_agent_bounds_encoded',
  'conflict_evaluator_rule_encoded',
  'cost_guard_encoded',
  'no_authority_locks_encoded',
  'truth_boundary_encoded',
  'decompose_mission_tasks',
  'derive_required_domains_skills',
  'filter_eligible_agents',
  'score_candidates',
  'enforce_hard_constraints',
  'prefer_smallest_qualified_team',
  'deny_overspawn',
  'runtime_availability_check',
  'cost_estimate_before_activation',
  'budget_guard_block_or_shrink',
  'child_agent_bound_check',
  'conflict_independent_evaluator',
  'deny_forbidden_authority_actions',
  'build_team_proposal',
  'return_proposal_to_home_base',
  'es30_trust_graph_soft_wire',
  'es29_consensus_soft_wire',
  'es25_skills_soft_wire',
  'es27_composition_soft_wire',
  'er16_home_base_soft_wire',
  'er14_er34_runtime_soft_wire',
] as const;

export type DynamicAgentTeamBuilderCycleHop =
  (typeof DYNAMIC_AGENT_TEAM_BUILDER_CYCLE)[number];

export function assertEs31LocksIntact(): boolean {
  return (
    ES31_LOCKS.L4_AUTONOMY_ENABLED === false &&
    ES31_LOCKS.OVERSPAWN_EVERY_DEPARTMENT === false &&
    ES31_LOCKS.UNCONTROLLED_CHILD_REPLICATION === false &&
    ES31_LOCKS.CHILD_WITHOUT_STOP_CONDITION === false &&
    ES31_LOCKS.IGNORE_HARD_CONSTRAINTS === false &&
    ES31_LOCKS.ACTIVATE_ABOVE_BUDGET === false &&
    ES31_LOCKS.SIGN_CONTRACTS === false &&
    ES31_LOCKS.SUBMIT_BIDS === false &&
    ES31_LOCKS.MOVE_MONEY === false &&
    ES31_LOCKS.CHANGE_PRODUCTION === false &&
    ES31_LOCKS.WIDEN_PERMISSIONS === false &&
    ES31_LOCKS.CONTROL_VEHICLES_INFRASTRUCTURE === false &&
    ES31_LOCKS.RELY_ONLY_ON_HIGHER_TRUST_IN_STRONG_DISAGREEMENT === false &&
    ES31_LOCKS.ROUTE_TO_UNAVAILABLE_RUNTIME === false &&
    ES31_LOCKS.TIP_LAND === false &&
    ES31_LOCKS.MANAGE_PULL_REQUEST === false &&
    ES31_AGENT_BOUNDS.l4AutonomyEnabled === false &&
    ES31_AGENT_BOUNDS.automaticAuthority === false &&
    DYNAMIC_AGENT_TEAM_TRUTH_BOUNDARY.l4AutonomyEnabled === false &&
    DYNAMIC_AGENT_TEAM_TRUTH_BOUNDARY.teamProposalNeqContractAuthority === true
  );
}

export function isEs31TeamBuilder(actor: Es31Actor): boolean {
  return (
    actor.kind === 'team_builder' ||
    actor.kind === 'mission_agent' ||
    actor.kind === 'home_base'
  );
}

export function isHumanApprover(actor: Es31Actor): boolean {
  return (
    actor.kind === 'human_approver' ||
    actor.kind === 'founder' ||
    actor.kind === 'tenant_admin' ||
    actor.kind === 'guardian'
  );
}

export function isRuntimeAvailable(state: RuntimeAwarenessState): boolean {
  return state !== 'WAITING_NODE';
}

export function childProposalAllowed(
  proposal: Omit<ChildAgentProposal, 'allowed' | 'reason'>,
): ChildAgentProposal {
  const allowed =
    proposal.needed &&
    proposal.narrowerThanParent &&
    proposal.computeDataBudgetExists &&
    proposal.returnPathDefined &&
    proposal.stopConditionExists;
  return {
    ...proposal,
    allowed,
    reason: allowed
      ? 'Child task bounds met (needed, narrower, budget, return path, stop).'
      : 'Child task denied — require needed + narrower + budget + return path + stop condition; no uncontrolled replication.',
  };
}

export function computeSelectionScores(
  candidate: EligibleAgentCandidate,
): SelectionScores {
  const domain_trust = clamp01(candidate.trustScore);
  const skill_certification = clamp01(candidate.skillCertificationScore);
  const availability = clamp01(candidate.availabilityScore);
  const evidence_quality = clamp01(candidate.evidenceQualityScore);
  const cost_efficiency = clamp01(candidate.costEfficiencyScore);
  const runtime_compatibility = clamp01(candidate.runtimeCompatibilityScore);
  const composite = Number(
    (
      (domain_trust +
        skill_certification +
        availability +
        evidence_quality +
        cost_efficiency +
        runtime_compatibility) /
      6
    ).toFixed(4),
  );
  return {
    domain_trust,
    skill_certification,
    availability,
    evidence_quality,
    cost_efficiency,
    runtime_compatibility,
    composite,
  };
}

export function evaluateHardConstraints(input: {
  candidate: EligibleAgentCandidate;
  requiredPermissions: readonly string[];
  requiredDataClasses: readonly string[];
  scope: TenantUniverseScope;
  computeBudgetUnits: number;
}): HardConstraintResult {
  const permissionsOk = input.requiredPermissions.every((p) =>
    input.candidate.permissions.includes(p),
  );
  const tenantOk =
    input.candidate.tenantId === input.scope.tenantId &&
    input.candidate.universeId === input.scope.universeId;
  const dataOk = input.requiredDataClasses.every((d) =>
    input.candidate.allowedDataClasses.includes(d),
  );
  const computeOk =
    input.candidate.costEstimate.totalUnits <= input.computeBudgetUnits &&
    input.candidate.costEstimate.withinBudget;
  const blockers: string[] = [];
  if (!permissionsOk) blockers.push('permissions');
  if (!tenantOk) blockers.push('tenant_scope');
  if (!dataOk) blockers.push('data_rights');
  if (!computeOk) blockers.push('compute_budget');
  return {
    permissions: permissionsOk,
    tenant_scope: tenantOk,
    data_rights: dataOk,
    compute_budget: computeOk,
    ok: blockers.length === 0,
    blockers,
  };
}

export function sumCostEstimates(
  estimates: readonly AgentCostEstimate[],
  budgetUnits: number,
): AgentCostEstimate {
  const sum = estimates.reduce(
    (acc, e) => ({
      agentUnits: acc.agentUnits + e.agentUnits,
      modelUnits: acc.modelUnits + e.modelUnits,
      apiUnits: acc.apiUnits + e.apiUnits,
      computeUnits: acc.computeUnits + e.computeUnits,
      storageUnits: acc.storageUnits + e.storageUnits,
      networkUnits: acc.networkUnits + e.networkUnits,
      totalUnits: acc.totalUnits + e.totalUnits,
    }),
    {
      agentUnits: 0,
      modelUnits: 0,
      apiUnits: 0,
      computeUnits: 0,
      storageUnits: 0,
      networkUnits: 0,
      totalUnits: 0,
    },
  );
  return {
    ...sum,
    budgetUnits,
    withinBudget: sum.totalUnits <= budgetUnits,
  };
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

/**
 * Soft-wire probes. Presence ≠ VERIFIED. Absent → WAITING_DATA (not FAIL).
 */
export function es31SoftWireSnapshot(repoRoot?: string): Es31SoftWireSnapshot {
  const root =
    repoRoot ?? join(dirname(fileURLToPath(import.meta.url)), '../../..');

  return {
    es30TrustGraph: softWireFirstPresent([
      softWireFile(
        './agent-reputation-domain-trust-graph-types.ts',
        'ES30 Agent Reputation & Domain Trust Graph PRESENT (soft-wire).',
        'ES30 Agent Reputation & Domain Trust Graph absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-reputation-domain-trust-graph.ts',
        'ES30 Agent Reputation & Domain Trust Graph PRESENT (soft-wire).',
        'ES30 Agent Reputation & Domain Trust Graph absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es30Report: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES30_AGENT_REPUTATION_DOMAIN_TRUST_GRAPH_REPORT.md',
        'ES30 report PRESENT.',
        'ES30 report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_ES30_AGENT_REPUTATION_TRUST_GRAPH_REPORT.md',
        'ES30 report PRESENT.',
        'ES30 report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es29Consensus: softWireFirstPresent([
      softWireFile(
        './multi-agent-reliability-consensus-types.ts',
        'ES29 Multi-Agent Reliability & Consensus PRESENT (soft-wire).',
        'ES29 Multi-Agent Reliability & Consensus absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './multi-agent-reliability-consensus.ts',
        'ES29 Multi-Agent Reliability & Consensus PRESENT (soft-wire).',
        'ES29 Multi-Agent Reliability & Consensus absent — soft-wire WAITING_DATA.',
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
        'docs/operations/62L_ES25_AGENT_SKILL_CERTIFICATION_REPORT.md',
        'ES25 report PRESENT.',
        'ES25 report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es27Composition: softWireFirstPresent([
      softWireFile(
        './capability-composition-engine-types.ts',
        'ES27 Capability Composition Engine PRESENT (soft-wire).',
        'ES27 Capability Composition Engine absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './capability-composition-engine.ts',
        'ES27 Capability Composition Engine PRESENT (soft-wire).',
        'ES27 Capability Composition Engine absent — soft-wire WAITING_DATA.',
      ),
    ]),
    es27Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ES27_CAPABILITY_COMPOSITION_ENGINE_REPORT.md',
      'ES27 report PRESENT.',
      'ES27 report absent — soft-wire WAITING_DATA.',
    ),
    er16HomeBase: softWireFirstPresent([
      softWireFile(
        './agent-compute-home-base-types.ts',
        'ER16 / Home Base (agent-compute-home-base) PRESENT (soft-wire).',
        'ER16 / Home Base absent — soft-wire WAITING_DATA.',
      ),
      softWireFile(
        './agent-home-base-types.ts',
        'ER16 / Home Base PRESENT (soft-wire).',
        'ER16 / Home Base absent — soft-wire WAITING_DATA.',
      ),
    ]),
    er16HomeBaseReport: softWireFirstPresent([
      softWireRepoRelative(
        root,
        'docs/operations/62L_EM_AGENT_COMPUTE_HOME_BASE_REPORT.md',
        'Home Base report PRESENT.',
        'Home Base report absent — soft-wire WAITING_DATA.',
      ),
      softWireRepoRelative(
        root,
        'docs/operations/62L_EM1_AGENT_HOME_BASE_CONTRACT_REPORT.md',
        'Home Base report PRESENT.',
        'Home Base report absent — soft-wire WAITING_DATA.',
      ),
    ]),
    er14OfflineBrain: softWireFile(
      './offline-brain-packager-types.ts',
      'ER14 Offline Brain Packager PRESENT (soft-wire).',
      'ER14 Offline Brain Packager absent — soft-wire WAITING_DATA.',
    ),
    er14Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER14_OFFLINE_BRAIN_PACKAGER_REPORT.md',
      'ER14 report PRESENT.',
      'ER14 report absent — soft-wire WAITING_DATA.',
    ),
    er34CapabilityManifest: softWireFile(
      './capability-manifest-types.ts',
      'ER34 Capability Manifest PRESENT (soft-wire).',
      'ER34 Capability Manifest absent — soft-wire WAITING_DATA.',
    ),
    er34Report: softWireRepoRelative(
      root,
      'docs/operations/62L_ER34_CAPABILITY_MANIFEST_REPORT.md',
      'ER34 report PRESENT.',
      'ER34 report absent — soft-wire WAITING_DATA.',
    ),
  };
}

export function softWireHopState(present: boolean): Es31EvidenceState {
  return present ? 'PASS' : 'WAITING_DATA';
}
