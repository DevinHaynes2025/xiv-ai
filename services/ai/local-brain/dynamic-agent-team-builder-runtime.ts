/**
 * 62L-ES31 — Dynamic Agent Team Builder runtime.
 *
 * Mission → decompose → domains/skills → eligible agents → trust/capability →
 * permission intersection → cost/compute → smallest team proposal → Home Base.
 * Soft-wire ES30/ES29/ES25/ES27/ER16/ER14/ER34 when present.
 */

import { createHash } from 'node:crypto';
import {
  ALLOWED_TEAM_ACTIONS,
  DYNAMIC_AGENT_TEAM_BUILDER_CYCLE,
  DYNAMIC_AGENT_TEAM_CORE_FLOW,
  DYNAMIC_AGENT_TEAM_TRUTH_BOUNDARY,
  ES31_AGENT_BOUNDS,
  ES31_DB_CANDIDATES_STATUS,
  ES31_LOCKS,
  ES31_MAY,
  ES31_MUST_NOT,
  ES_LAYER_TITLE,
  FORBIDDEN_TEAM_AUTHORITY_ACTIONS,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_ISSUE_NOTE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  GOV_LOGISTICS_SMALLEST_TEAM_ROLES,
  HARD_CONSTRAINTS,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  RUNTIME_AWARENESS_STATES,
  SELECTION_SCORE_DIMENSIONS,
  TEAM_TRACKING_FIELDS,
  assertEs31LocksIntact,
  childProposalAllowed,
  computeSelectionScores,
  es31SoftWireSnapshot,
  evaluateHardConstraints,
  isEs31TeamBuilder,
  isHumanApprover,
  isRuntimeAvailable,
  softWireHopState,
  sumCostEstimates,
  type AgentCostEstimate,
  type ConflictHandlingDecision,
  type EligibleAgentCandidate,
  type Es31Actor,
  type Es31EvidenceState,
  type Es31HopRecord,
  type Es31SoftWireSnapshot,
  type ForbiddenTeamAuthorityAction,
  type MissionTeamRequest,
  type SelectionScores,
  type TeamProposal,
} from './dynamic-agent-team-builder-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof DYNAMIC_AGENT_TEAM_BUILDER_CYCLE)[number],
  state: Es31EvidenceState,
  summary: string,
): Es31HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'BLOCKED' | 'TEAM_PROPOSAL_BLOCKED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: DenialResult['state'] = 'DENIED',
): DenialResult {
  return {
    denied: true,
    state,
    reason,
    executed: false,
  };
}

export function attemptOverspawnEveryDepartment(): DenialResult {
  return deny(
    'Overspawn denied — prefer smallest qualified team; ES31_LOCKS.OVERSPAWN_EVERY_DEPARTMENT=false.',
  );
}

export function attemptChildWithoutStopCondition(): DenialResult {
  return deny(
    'Child agent denied — stop condition required; no uncontrolled replication.',
  );
}

export function attemptSignContracts(): DenialResult {
  return deny(
    'Team proposal ≠ contract authority — sign_contracts DENIED (L4=false).',
  );
}

export function attemptSubmitBids(): DenialResult {
  return deny('Team proposal ≠ bid submission — submit_bids DENIED.');
}

export function attemptMoveMoney(): DenialResult {
  return deny('Team proposal ≠ move money — move_money DENIED.');
}

export function attemptChangeProduction(): DenialResult {
  return deny('Team proposal ≠ production change — change_production DENIED.');
}

export function attemptWidenPermissions(): DenialResult {
  return deny('Team proposal ≠ widen permissions — widen_permissions DENIED.');
}

export function attemptControlVehiclesInfrastructure(): DenialResult {
  return deny(
    'Team proposal ≠ vehicle/infrastructure control — DENIED.',
  );
}

export function attemptActivateAboveBudget(): DenialResult {
  return deny(
    'Activation above budget denied — TEAM_PROPOSAL_BLOCKED or smaller alternative required.',
    'TEAM_PROPOSAL_BLOCKED',
  );
}

export function attemptTipLand(): DenialResult {
  return deny('Tip-land onto xiv-v2/main DENIED — park-and-implement only.');
}

export function attemptManagePullRequest(): DenialResult {
  return deny('ManagePullRequest / open PR DENIED unless founder explicitly asks.');
}

export function attemptEnableL4Autonomy(): DenialResult {
  return deny('L4_AUTONOMY_ENABLED=false — cannot enable L4 autonomy.');
}

export function handleStrongDisagreement(input: {
  strongDisagreement: boolean;
  softWire: Es31SoftWireSnapshot;
  evaluatorAgentId?: string;
}): ConflictHandlingDecision {
  const es29 = input.softWire.es29Consensus;
  if (!input.strongDisagreement) {
    return {
      strongDisagreement: false,
      addIndependentEvaluator: false,
      reliedOnlyOnHigherTrust: false,
      evaluatorAgentId: null,
      reason: 'No strong disagreement — evaluator not required.',
      es29SoftWire: es29,
    };
  }
  return {
    strongDisagreement: true,
    addIndependentEvaluator: true,
    reliedOnlyOnHigherTrust: false,
    evaluatorAgentId: input.evaluatorAgentId ?? 'independent-evaluator-1',
    reason: es29.present
      ? 'Strong disagreement — add independent evaluator (ES29 soft-wire PRESENT; presence≠VERIFIED). Must not rely only on higher-trust opinion.'
      : 'Strong disagreement — add independent evaluator (ES29 soft-wire WAITING_DATA). Must not rely only on higher-trust opinion.',
    es29SoftWire: es29,
  };
}

function coversRequiredDomains(
  selected: readonly EligibleAgentCandidate[],
  requiredDomains: readonly string[],
): boolean {
  const covered = new Set<string>();
  for (const a of selected) {
    for (const d of a.domains) covered.add(d);
  }
  return requiredDomains.every((d) => covered.has(d));
}

function coversRequiredSkills(
  selected: readonly EligibleAgentCandidate[],
  requiredSkills: readonly string[],
): boolean {
  const covered = new Set<string>();
  for (const a of selected) {
    for (const s of a.certifiedSkills) covered.add(s);
  }
  return requiredSkills.every((s) => covered.has(s));
}

function intersectPermissions(
  agents: readonly EligibleAgentCandidate[],
): readonly string[] {
  if (agents.length === 0) return [];
  return agents.reduce<string[]>(
    (acc, a) => acc.filter((p) => a.permissions.includes(p)),
    [...agents[0]!.permissions],
  );
}

function intersectDataClasses(
  agents: readonly EligibleAgentCandidate[],
): readonly string[] {
  if (agents.length === 0) return [];
  return agents.reduce<string[]>(
    (acc, a) => acc.filter((d) => a.allowedDataClasses.includes(d)),
    [...agents[0]!.allowedDataClasses],
  );
}

function intersectTools(
  agents: readonly EligibleAgentCandidate[],
): readonly string[] {
  if (agents.length === 0) return [];
  return agents.reduce<string[]>(
    (acc, a) => acc.filter((t) => a.allowedToolsApis.includes(t)),
    [...agents[0]!.allowedToolsApis],
  );
}

/**
 * Prefer smallest set of agents that cover required domains/skills under
 * hard constraints and available runtimes, ranked by composite score.
 */
export function selectSmallestQualifiedTeam(input: {
  candidates: readonly EligibleAgentCandidate[];
  requiredDomains: readonly string[];
  requiredCertifiedSkills: readonly string[];
  requiredPermissions: readonly string[];
  requiredDataClasses: readonly string[];
  scope: MissionTeamRequest['tenantUniverseScope'];
  computeBudgetUnits: number;
  maxTeamSize?: number;
  preferRoles?: readonly string[];
}): {
  selected: EligibleAgentCandidate[];
  scoresByAgent: Record<string, SelectionScores>;
  overspawnDenied: boolean;
  blocked: boolean;
  blockReason: string | null;
} {
  const scoresByAgent: Record<string, SelectionScores> = {};
  const eligible: EligibleAgentCandidate[] = [];

  for (const c of input.candidates) {
    scoresByAgent[c.agentId] = computeSelectionScores(c);
    if (!c.available) continue;
    if (!isRuntimeAvailable(c.runtimeState)) continue;
    const hc = evaluateHardConstraints({
      candidate: c,
      requiredPermissions: input.requiredPermissions,
      requiredDataClasses: input.requiredDataClasses,
      scope: input.scope,
      computeBudgetUnits: input.computeBudgetUnits,
    });
    // Soft per-agent compute: individual may be under budget; team sum checked later.
    // Still require permissions/tenant/data hard constraints per agent.
    if (!hc.permissions || !hc.tenant_scope || !hc.data_rights) continue;
    eligible.push(c);
  }

  eligible.sort((a, b) => {
    const sa = scoresByAgent[a.agentId]!.composite;
    const sb = scoresByAgent[b.agentId]!.composite;
    if (sb !== sa) return sb - sa;
    // Prefer preferRoles order when scores tie
    const prefer = input.preferRoles ?? [];
    const ia = prefer.indexOf(a.role);
    const ib = prefer.indexOf(b.role);
    if (ia === -1 && ib === -1) return a.agentId.localeCompare(b.agentId);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const maxSize =
    input.maxTeamSize ??
    Math.max(
      input.requiredDomains.length,
      input.requiredCertifiedSkills.length,
      1,
    );

  // Greedy smallest cover: add next best until domains+skills covered
  const selected: EligibleAgentCandidate[] = [];
  for (const c of eligible) {
    if (selected.length >= maxSize) break;
    selected.push(c);
    if (
      coversRequiredDomains(selected, input.requiredDomains) &&
      coversRequiredSkills(selected, input.requiredCertifiedSkills)
    ) {
      break;
    }
  }

  const covered =
    coversRequiredDomains(selected, input.requiredDomains) &&
    coversRequiredSkills(selected, input.requiredCertifiedSkills);

  if (!covered) {
    return {
      selected: [],
      scoresByAgent,
      overspawnDenied: true,
      blocked: true,
      blockReason:
        'No smallest qualified team covers required domains/skills under hard constraints and available runtimes.',
    };
  }

  return {
    selected,
    scoresByAgent,
    overspawnDenied: true, // always deny overspawn path
    blocked: false,
    blockReason: null,
  };
}

export function buildTeamProposal(
  actor: Es31Actor,
  request: MissionTeamRequest,
  repoRoot?: string,
): TeamProposal | DenialResult {
  if (!assertEs31LocksIntact()) {
    return deny('ES31 locks intact check failed.');
  }
  if (!isEs31TeamBuilder(actor) && !isHumanApprover(actor)) {
    return deny('Actor not authorized for team building.');
  }

  if (request.attemptOverspawn) {
    return attemptOverspawnEveryDepartment();
  }
  if (request.attemptSignContract) return attemptSignContracts();
  if (request.attemptSubmitBid) return attemptSubmitBids();
  if (request.attemptMoveMoney) return attemptMoveMoney();
  if (request.attemptChangeProduction) return attemptChangeProduction();
  if (request.attemptWidenPermissions) return attemptWidenPermissions();
  if (request.attemptControlVehicles) {
    return attemptControlVehiclesInfrastructure();
  }

  const softWire = es31SoftWireSnapshot(repoRoot);

  let childAgent = null as ReturnType<typeof childProposalAllowed> | null;
  if (request.childProposal) {
    childAgent = childProposalAllowed(request.childProposal);
    if (!childAgent.allowed) {
      return attemptChildWithoutStopCondition();
    }
  }

  const selection = selectSmallestQualifiedTeam({
    candidates: request.candidates,
    requiredDomains: request.requiredDomains,
    requiredCertifiedSkills: request.requiredCertifiedSkills,
    requiredPermissions: request.requiredPermissions,
    requiredDataClasses: request.requiredDataClasses,
    scope: request.tenantUniverseScope,
    computeBudgetUnits: request.computeBudgetUnits,
    maxTeamSize: request.maxTeamSize,
    preferRoles: request.preferRoles ?? [...GOV_LOGISTICS_SMALLEST_TEAM_ROLES],
  });

  if (selection.blocked || selection.selected.length === 0) {
    return deny(
      selection.blockReason ?? 'TEAM_PROPOSAL_BLOCKED — no qualified team.',
      'TEAM_PROPOSAL_BLOCKED',
    );
  }

  let selected = [...selection.selected];
  let costEstimate = sumCostEstimates(
    selected.map((a) => a.costEstimate),
    request.computeBudgetUnits,
  );

  // Cost guard: shrink by dropping lowest-score optional members while coverage holds
  if (!costEstimate.withinBudget || request.attemptActivateAboveBudget) {
    if (request.attemptActivateAboveBudget && !costEstimate.withinBudget) {
      return attemptActivateAboveBudget();
    }
    // Try smaller alternatives: drop lowest composite while still covering
    const ordered = [...selected].sort(
      (a, b) =>
        selection.scoresByAgent[a.agentId]!.composite -
        selection.scoresByAgent[b.agentId]!.composite,
    );
    for (const drop of ordered) {
      if (selected.length <= 1) break;
      if (costEstimate.withinBudget) break;
      const trial = selected.filter((a) => a.agentId !== drop.agentId);
      if (
        coversRequiredDomains(trial, request.requiredDomains) &&
        coversRequiredSkills(trial, request.requiredCertifiedSkills)
      ) {
        selected = trial;
        costEstimate = sumCostEstimates(
          selected.map((a) => a.costEstimate),
          request.computeBudgetUnits,
        );
      }
    }
    if (!costEstimate.withinBudget) {
      return deny(
        'Cost estimate exceeds compute budget — TEAM_PROPOSAL_BLOCKED (no smaller covering alternative).',
        'TEAM_PROPOSAL_BLOCKED',
      );
    }
  }

  // Runtime awareness: reject if any selected is WAITING_NODE (should already be filtered)
  if (selected.some((a) => !isRuntimeAvailable(a.runtimeState))) {
    return deny(
      'Unavailable runtime (WAITING_NODE) — cannot route team activation.',
      'BLOCKED',
    );
  }
  if (request.attemptRouteUnavailableRuntime) {
    return deny(
      'Routing to unavailable runtime DENIED — ES31_LOCKS.ROUTE_TO_UNAVAILABLE_RUNTIME=false.',
    );
  }

  const conflictHandling = handleStrongDisagreement({
    strongDisagreement: request.strongDisagreement === true,
    softWire,
  });

  const memberAgents = selected.map((a) => a.agentId);
  const leadAgent = memberAgents[0]!;
  const teamId = `team-${sha256(`${request.missionId}:${leadAgent}:${memberAgents.join(',')}`).slice(0, 16)}`;

  const teamHard = {
    permissions: selected.every((c) =>
      evaluateHardConstraints({
        candidate: c,
        requiredPermissions: request.requiredPermissions,
        requiredDataClasses: request.requiredDataClasses,
        scope: request.tenantUniverseScope,
        computeBudgetUnits: request.computeBudgetUnits,
      }).permissions,
    ),
    tenant_scope: selected.every(
      (c) =>
        c.tenantId === request.tenantUniverseScope.tenantId &&
        c.universeId === request.tenantUniverseScope.universeId,
    ),
    data_rights: selected.every((c) =>
      evaluateHardConstraints({
        candidate: c,
        requiredPermissions: request.requiredPermissions,
        requiredDataClasses: request.requiredDataClasses,
        scope: request.tenantUniverseScope,
        computeBudgetUnits: request.computeBudgetUnits,
      }).data_rights,
    ),
    compute_budget: costEstimate.withinBudget,
    ok: true as boolean,
    blockers: [] as string[],
  };
  teamHard.ok =
    teamHard.permissions &&
    teamHard.tenant_scope &&
    teamHard.data_rights &&
    teamHard.compute_budget;
  if (!teamHard.ok) {
    const blockers: string[] = [];
    if (!teamHard.permissions) blockers.push('permissions');
    if (!teamHard.tenant_scope) blockers.push('tenant_scope');
    if (!teamHard.data_rights) blockers.push('data_rights');
    if (!teamHard.compute_budget) blockers.push('compute_budget');
    teamHard.blockers = blockers;
    return deny(
      `Hard constraints failed: ${blockers.join(', ')}`,
      'TEAM_PROPOSAL_BLOCKED',
    );
  }

  const notes: string[] = [
    'Smallest qualified team preferred — overspawn denied.',
    'Team proposal may research/analyze/simulate/draft/recommend only.',
    'Team proposal ≠ contract/bid/money/production/permission/vehicle authority.',
    'L4_AUTONOMY_ENABLED=false.',
  ];
  if (conflictHandling.addIndependentEvaluator) {
    notes.push(conflictHandling.reason);
    if (
      conflictHandling.evaluatorAgentId &&
      !memberAgents.includes(conflictHandling.evaluatorAgentId)
    ) {
      memberAgents.push(conflictHandling.evaluatorAgentId);
    }
  }

  // Permission intersection for allowed tools/data on the team
  void intersectPermissions(selected);

  return {
    teamId,
    mission: request.mission,
    leadAgent,
    memberAgents,
    requiredDomains: request.requiredDomains,
    requiredCertifiedSkills: request.requiredCertifiedSkills,
    tenantUniverseScope: request.tenantUniverseScope,
    allowedDataClasses: intersectDataClasses(selected),
    allowedToolsApis: intersectTools(selected),
    computeBudget: request.computeBudgetUnits,
    expectedRuntime: request.expectedRuntime,
    evidenceRequirements: request.evidenceRequirements,
    escalationPoints: request.escalationPoints,
    humanApprovalCheckpoints: request.humanApprovalCheckpoints,
    returnPath: request.returnPath,
    expiry: request.expiry,
    revocationState: 'ACTIVE',
    state: 'PROPOSED',
    scoresByAgent: selection.scoresByAgent,
    hardConstraints: teamHard,
    costEstimate,
    conflictHandling,
    childAgent,
    selectedRoles: selected.map((a) => a.role),
    overspawnDenied: true,
    authorityLocksIntact: true,
    l4AutonomyEnabled: false,
    contractAuthority: false,
    notes,
  };
}

export type TeamBuilderCycleResult = {
  hops: Es31HopRecord[];
  softWire: Es31SoftWireSnapshot;
  proposal: TeamProposal | null;
  denial: DenialResult | null;
  honesty: typeof HONESTY_BANNER;
  locksIntact: boolean;
  l4AutonomyEnabled: false;
  coreFlow: typeof DYNAMIC_AGENT_TEAM_CORE_FLOW;
  trackingFields: typeof TEAM_TRACKING_FIELDS;
  nextPhase: typeof NEXT_PHASE_TITLE;
  sot: {
    family: typeof GITHUB_SOT_FAMILY;
    label: typeof GITHUB_SOT_LABEL;
    issue: typeof GITHUB_SOT_ISSUE;
    issueNote: typeof GITHUB_SOT_ISSUE_NOTE;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
  };
  meta: {
    layer: typeof ES_LAYER_TITLE;
    dbCandidates: typeof ES31_DB_CANDIDATES_STATUS;
    may: typeof ES31_MAY;
    mustNot: typeof ES31_MUST_NOT;
    allowedActions: typeof ALLOWED_TEAM_ACTIONS;
    forbiddenAuthority: typeof FORBIDDEN_TEAM_AUTHORITY_ACTIONS;
    scoreDimensions: typeof SELECTION_SCORE_DIMENSIONS;
    hardConstraints: typeof HARD_CONSTRAINTS;
    runtimeStates: typeof RUNTIME_AWARENESS_STATES;
    truthBoundary: typeof DYNAMIC_AGENT_TEAM_TRUTH_BOUNDARY;
    agentBounds: typeof ES31_AGENT_BOUNDS;
    locks: typeof ES31_LOCKS;
  };
};

export function runDynamicAgentTeamBuilderCycle(input: {
  actor: Es31Actor;
  request: MissionTeamRequest;
  repoRoot?: string;
}): TeamBuilderCycleResult {
  const softWire = es31SoftWireSnapshot(input.repoRoot);
  const hops: Es31HopRecord[] = [];
  const locksIntact = assertEs31LocksIntact();

  hops.push(
    hop(
      'honesty_locks',
      locksIntact ? 'PASS' : 'DENIED',
      locksIntact
        ? 'ES31 honesty locks intact; L4=false; DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION AUTHORIZED.'
        : 'ES31 locks broken.',
    ),
  );
  hops.push(
    hop(
      'dynamic_agent_team_builder_bootstrap',
      'PASS',
      'Dynamic Agent Team Builder bootstrap.',
    ),
  );
  hops.push(
    hop(
      'team_tracking_fields_encoded',
      'PASS',
      `Tracking fields: ${TEAM_TRACKING_FIELDS.join(', ')}`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      'PASS',
      `Core flow: ${DYNAMIC_AGENT_TEAM_CORE_FLOW.join(' → ')}`,
    ),
  );
  hops.push(
    hop(
      'selection_scoring_encoded',
      'PASS',
      `Scoring: ${SELECTION_SCORE_DIMENSIONS.join(', ')}`,
    ),
  );
  hops.push(
    hop(
      'hard_constraints_encoded',
      'PASS',
      `Hard constraints: ${HARD_CONSTRAINTS.join(', ')}`,
    ),
  );
  hops.push(
    hop(
      'runtime_awareness_encoded',
      'PASS',
      `Runtimes: ${RUNTIME_AWARENESS_STATES.join(', ')}`,
    ),
  );
  hops.push(
    hop(
      'child_agent_bounds_encoded',
      'PASS',
      'Child requires needed+narrower+budget+return+stop.',
    ),
  );
  hops.push(
    hop(
      'conflict_evaluator_rule_encoded',
      'PASS',
      'Strong disagreement → independent evaluator; not only higher-trust.',
    ),
  );
  hops.push(
    hop(
      'cost_guard_encoded',
      'PASS',
      'Estimate agent+model+API+compute+storage+network before activation.',
    ),
  );
  hops.push(
    hop(
      'no_authority_locks_encoded',
      'PASS',
      `Forbidden authority: ${FORBIDDEN_TEAM_AUTHORITY_ACTIONS.join(', ')}`,
    ),
  );
  hops.push(
    hop(
      'truth_boundary_encoded',
      'PASS',
      'Team proposal ≠ contract/bid/money/production/permission/vehicle authority.',
    ),
  );

  hops.push(
    hop(
      'decompose_mission_tasks',
      'PASS',
      `Tasks: ${input.request.tasks.join(', ') || '(none)'}`,
    ),
  );
  hops.push(
    hop(
      'derive_required_domains_skills',
      'PASS',
      `Domains=${input.request.requiredDomains.join(',')}; skills=${input.request.requiredCertifiedSkills.join(',')}`,
    ),
  );

  const result = buildTeamProposal(
    input.actor,
    input.request,
    input.repoRoot,
  );

  if ('denied' in result && result.denied) {
    const denyHop =
      result.state === 'TEAM_PROPOSAL_BLOCKED'
        ? 'budget_guard_block_or_shrink'
        : result.reason.includes('Child')
          ? 'child_agent_bound_check'
          : result.reason.includes('Overspawn')
            ? 'deny_overspawn'
            : result.reason.includes('contract') ||
                result.reason.includes('bid') ||
                result.reason.includes('money') ||
                result.reason.includes('production') ||
                result.reason.includes('permission') ||
                result.reason.includes('vehicle')
              ? 'deny_forbidden_authority_actions'
              : 'build_team_proposal';
    hops.push(hop(denyHop, result.state, result.reason));
    appendSoftWireHops(hops, softWire);
    return {
      hops,
      softWire,
      proposal: null,
      denial: result,
      honesty: HONESTY_BANNER,
      locksIntact,
      l4AutonomyEnabled: false,
      coreFlow: DYNAMIC_AGENT_TEAM_CORE_FLOW,
      trackingFields: TEAM_TRACKING_FIELDS,
      nextPhase: NEXT_PHASE_TITLE,
      sot: {
        family: GITHUB_SOT_FAMILY,
        label: GITHUB_SOT_LABEL,
        issue: GITHUB_SOT_ISSUE,
        issueNote: GITHUB_SOT_ISSUE_NOTE,
        title: GITHUB_SOT_TITLE,
        gitlab: GITLAB_MIRROR_NOTE,
      },
      meta: {
        layer: ES_LAYER_TITLE,
        dbCandidates: ES31_DB_CANDIDATES_STATUS,
        may: ES31_MAY,
        mustNot: ES31_MUST_NOT,
        allowedActions: ALLOWED_TEAM_ACTIONS,
        forbiddenAuthority: FORBIDDEN_TEAM_AUTHORITY_ACTIONS,
        scoreDimensions: SELECTION_SCORE_DIMENSIONS,
        hardConstraints: HARD_CONSTRAINTS,
        runtimeStates: RUNTIME_AWARENESS_STATES,
        truthBoundary: DYNAMIC_AGENT_TEAM_TRUTH_BOUNDARY,
        agentBounds: ES31_AGENT_BOUNDS,
        locks: ES31_LOCKS,
      },
    };
  }

  const proposal = result as TeamProposal;
  hops.push(
    hop(
      'filter_eligible_agents',
      'PASS',
      `Eligible/selected members: ${proposal.memberAgents.join(', ')}`,
    ),
  );
  hops.push(
    hop(
      'score_candidates',
      'PASS',
      `Scored ${Object.keys(proposal.scoresByAgent).length} candidates.`,
    ),
  );
  hops.push(
    hop(
      'enforce_hard_constraints',
      proposal.hardConstraints.ok ? 'PASS' : 'TEAM_PROPOSAL_BLOCKED',
      proposal.hardConstraints.ok
        ? 'Hard constraints satisfied.'
        : `Hard constraint blockers: ${proposal.hardConstraints.blockers.join(', ')}`,
    ),
  );
  hops.push(
    hop(
      'prefer_smallest_qualified_team',
      'PASS',
      `Selected ${proposal.memberAgents.length} agents / roles: ${proposal.selectedRoles.join(', ')}`,
    ),
  );
  hops.push(
    hop('deny_overspawn', 'PASS', 'Overspawn every department DENIED.'),
  );
  hops.push(
    hop(
      'runtime_availability_check',
      'PASS',
      'Unavailable runtimes (WAITING_NODE) avoided.',
    ),
  );
  hops.push(
    hop(
      'cost_estimate_before_activation',
      'PASS',
      `Cost total=${proposal.costEstimate.totalUnits} budget=${proposal.costEstimate.budgetUnits}`,
    ),
  );
  hops.push(
    hop(
      'budget_guard_block_or_shrink',
      proposal.costEstimate.withinBudget ? 'PASS' : 'TEAM_PROPOSAL_BLOCKED',
      proposal.costEstimate.withinBudget
        ? 'Within budget.'
        : 'Over budget.',
    ),
  );
  hops.push(
    hop(
      'child_agent_bound_check',
      proposal.childAgent === null
        ? 'PASS'
        : proposal.childAgent.allowed
          ? 'PASS'
          : 'DENIED',
      proposal.childAgent === null
        ? 'No child proposal.'
        : proposal.childAgent.reason,
    ),
  );
  hops.push(
    hop(
      'conflict_independent_evaluator',
      'PASS',
      proposal.conflictHandling.reason,
    ),
  );
  hops.push(
    hop(
      'deny_forbidden_authority_actions',
      'PASS',
      'No contract/bid/money/production/permission/vehicle authority granted.',
    ),
  );
  hops.push(
    hop(
      'build_team_proposal',
      'PASS',
      `Team ${proposal.teamId} state=${proposal.state}`,
    ),
  );
  hops.push(
    hop(
      'return_proposal_to_home_base',
      softWireHopState(softWire.er16HomeBase.present),
      softWire.er16HomeBase.present
        ? 'Return path to Home Base soft-wire PRESENT (presence≠VERIFIED).'
        : 'Home Base soft-wire WAITING_DATA — proposal still recorded locally.',
    ),
  );
  appendSoftWireHops(hops, softWire);

  return {
    hops,
    softWire,
    proposal,
    denial: null,
    honesty: HONESTY_BANNER,
    locksIntact,
    l4AutonomyEnabled: false,
    coreFlow: DYNAMIC_AGENT_TEAM_CORE_FLOW,
    trackingFields: TEAM_TRACKING_FIELDS,
    nextPhase: NEXT_PHASE_TITLE,
    sot: {
      family: GITHUB_SOT_FAMILY,
      label: GITHUB_SOT_LABEL,
      issue: GITHUB_SOT_ISSUE,
      issueNote: GITHUB_SOT_ISSUE_NOTE,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
    },
    meta: {
      layer: ES_LAYER_TITLE,
      dbCandidates: ES31_DB_CANDIDATES_STATUS,
      may: ES31_MAY,
      mustNot: ES31_MUST_NOT,
      allowedActions: ALLOWED_TEAM_ACTIONS,
      forbiddenAuthority: FORBIDDEN_TEAM_AUTHORITY_ACTIONS,
      scoreDimensions: SELECTION_SCORE_DIMENSIONS,
      hardConstraints: HARD_CONSTRAINTS,
      runtimeStates: RUNTIME_AWARENESS_STATES,
      truthBoundary: DYNAMIC_AGENT_TEAM_TRUTH_BOUNDARY,
      agentBounds: ES31_AGENT_BOUNDS,
      locks: ES31_LOCKS,
    },
  };
}

function appendSoftWireHops(
  hops: Es31HopRecord[],
  softWire: Es31SoftWireSnapshot,
): void {
  hops.push(
    hop(
      'es30_trust_graph_soft_wire',
      softWireHopState(softWire.es30TrustGraph.present),
      softWire.es30TrustGraph.note,
    ),
  );
  hops.push(
    hop(
      'es29_consensus_soft_wire',
      softWireHopState(softWire.es29Consensus.present),
      softWire.es29Consensus.note,
    ),
  );
  hops.push(
    hop(
      'es25_skills_soft_wire',
      softWireHopState(softWire.es25SkillCertification.present),
      softWire.es25SkillCertification.note,
    ),
  );
  hops.push(
    hop(
      'es27_composition_soft_wire',
      softWireHopState(softWire.es27Composition.present),
      softWire.es27Composition.note,
    ),
  );
  hops.push(
    hop(
      'er16_home_base_soft_wire',
      softWireHopState(softWire.er16HomeBase.present),
      softWire.er16HomeBase.note,
    ),
  );
  const runtimePresent =
    softWire.er14OfflineBrain.present || softWire.er34CapabilityManifest.present;
  hops.push(
    hop(
      'er14_er34_runtime_soft_wire',
      softWireHopState(runtimePresent),
      runtimePresent
        ? `ER14/ER34 runtime soft-wire PRESENT (ER14=${softWire.er14OfflineBrain.present}, ER34=${softWire.er34CapabilityManifest.present}).`
        : 'ER14/ER34 runtime soft-wire WAITING_DATA (not FAIL).',
    ),
  );
}

/** Example gov logistics candidates (smallest-team reference set). */
export function exampleGovLogisticsCandidates(
  scope: MissionTeamRequest['tenantUniverseScope'],
): EligibleAgentCandidate[] {
  const baseCost = (total: number): AgentCostEstimate => ({
    agentUnits: total * 0.3,
    modelUnits: total * 0.3,
    apiUnits: total * 0.1,
    computeUnits: total * 0.2,
    storageUnits: total * 0.05,
    networkUnits: total * 0.05,
    totalUnits: total,
    budgetUnits: 100,
    withinBudget: true,
  });

  const mk = (
    agentId: string,
    role: string,
    domain: string,
    skill: string,
    trust: number,
  ): EligibleAgentCandidate => ({
    agentId,
    role,
    domains: [domain],
    certifiedSkills: [skill],
    permissions: ['draft', 'analyze', 'recommend'],
    allowedDataClasses: ['opportunity', 'logistics', 'pricing'],
    allowedToolsApis: ['research_api', 'draft_api'],
    tenantId: scope.tenantId,
    universeId: scope.universeId,
    trustScore: trust,
    skillCertificationScore: 0.9,
    availabilityScore: 0.95,
    evidenceQualityScore: 0.88,
    costEfficiencyScore: 0.85,
    runtimeCompatibilityScore: 0.9,
    runtimeState: 'LOCAL',
    costEstimate: baseCost(12),
    available: true,
  });

  return [
    mk('agent-capture', 'Capture', 'capture', 'capture_skill', 0.92),
    mk('agent-logistics', 'Logistics', 'logistics', 'logistics_skill', 0.9),
    mk('agent-quant', 'Quant', 'quant', 'quant_skill', 0.88),
    mk('agent-pricing', 'Pricing_CFO', 'pricing', 'pricing_skill', 0.87),
    mk(
      'agent-compliance',
      'Compliance_Reviewer',
      'compliance',
      'compliance_skill',
      0.91,
    ),
    // Extra department agents — must not be auto-included (overspawn)
    mk('agent-hr', 'HR', 'hr', 'hr_skill', 0.5),
    mk('agent-marketing', 'Marketing', 'marketing', 'marketing_skill', 0.4),
    mk('agent-facilities', 'Facilities', 'facilities', 'facilities_skill', 0.3),
  ];
}

export function exampleGovLogisticsMission(
  scope: MissionTeamRequest['tenantUniverseScope'],
): MissionTeamRequest {
  return {
    missionId: 'gov-logistics-1',
    mission: 'Government logistics opportunity analysis (proposal candidate only)',
    tasks: [
      'capture_research',
      'logistics_solution',
      'quant_model',
      'pricing_scenario',
      'compliance_review',
    ],
    requiredDomains: [
      'capture',
      'logistics',
      'quant',
      'pricing',
      'compliance',
    ],
    requiredCertifiedSkills: [
      'capture_skill',
      'logistics_skill',
      'quant_skill',
      'pricing_skill',
      'compliance_skill',
    ],
    requiredPermissions: ['draft', 'analyze'],
    requiredDataClasses: ['opportunity', 'logistics'],
    requiredToolsApis: ['research_api'],
    tenantUniverseScope: scope,
    computeBudgetUnits: 100,
    expectedRuntime: 'LOCAL',
    evidenceRequirements: ['citations', 'assumption_log'],
    escalationPoints: ['compliance_blocker'],
    humanApprovalCheckpoints: ['proposal_candidate_review'],
    returnPath: 'home_base',
    expiry: '2099-01-01T00:00:00.000Z',
    candidates: exampleGovLogisticsCandidates(scope),
    preferRoles: [...GOV_LOGISTICS_SMALLEST_TEAM_ROLES],
    maxTeamSize: 5,
  };
}
