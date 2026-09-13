/**
 * 12D-111: Governed taskforce roster expansion proposals.
 *
 * The CEO directed that the XIV taskforce and brain expand. The governed way to expand
 * is NOT to spin up live agents — it is to extend the ROSTER (the sparse logical
 * workforce of `enterprise-workforce.ts`) through the same admission discipline the
 * enterprise workforce already enforces.
 *
 * HONEST STATE: this module proposes and gates roster expansion; it starts no process,
 * makes no model call, and adds no role to the live factory. Every proposed role stays
 * sparse and logical until a human ratifies the expansion AND a staffing plan exists.
 * Expansion cannot create its own reviewers: a proposed role must be reviewed by
 * designated reviewers that already exist in the live enterprise factory, and reviewer
 * wiring is advisory until a human ratifies it.
 */
import { ENTERPRISE_WORKFORCE } from './enterprise-workforce';

export interface ProposedTaskforceRole {
  roleId: string;
  mission: string;
  /** Must reference designated reviewer roles that ALREADY exist in the live enterprise factory. */
  requestedReviewerRoleIds: readonly string[];
  evidenceRefs: readonly string[];
}

export interface TaskforceExpansionInput {
  epoch: number;
  proposedBy: string;
  roles: readonly ProposedTaskforceRole[];
}

export const TASKFORCE_EXPANSION_POLICY = Object.freeze({
  maxProposedRolesPerRequest: 8,
  maxRosterGrowthPerEpoch: 24,
  requiredDistinctReviewerRoles: 2,
  minExpansionEpoch: 1,
  maxExpansionEpoch: 10_000,
  maxRoleIdChars: 64,
  maxMissionChars: 600,
  maxEvidenceRefsPerRole: 8,
  maxEvidenceRefChars: 256,
  maxProposedByChars: 128,
});

export const TASKFORCE_EXPANSION_GUARDRAILS = Object.freeze({
  startsNoAgentProcess: true,
  modelCallsAllowed: 0,
  remoteCallsAllowed: false,
  rolesAreSparseLogicalUntilStaffed: true,
  humanDecision: 'REQUIRED' as const,
});

/** Role ids the live factory designates as reviewers (every reviewerIds edge in the catalog). */
export const DESIGNATED_REVIEWER_ROLE_IDS: readonly string[] = Object.freeze(
  [...new Set(ENTERPRISE_WORKFORCE.flatMap(r => r.reviewerIds))].sort(),
);

const liveRoleIds: ReadonlySet<string> = new Set(ENTERPRISE_WORKFORCE.map(r => r.id));
const designatedReviewers: ReadonlySet<string> = new Set(DESIGNATED_REVIEWER_ROLE_IDS);

const roleId = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9_-]{2,64}$/.test(v);
const boundedText = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

export interface TaskforceExpansionProposal {
  kind: 'TASKFORCE_ROSTER_EXPANSION_PROPOSAL';
  proposalId: string;
  epoch: number;
  proposedBy: string;
  roles: readonly Readonly<{ roleId: string; mission: string; requestedReviewerRoleIds: readonly string[]; evidenceRefs: readonly string[] }>[];
  status: 'PROPOSED_AWAITING_HUMAN_DECISION';
  humanDecision: 'REQUIRED';
  guardrails: typeof TASKFORCE_EXPANSION_GUARDRAILS;
}

const proposalsByEpoch = new Map<number, TaskforceExpansionProposal>();

/** Validate and hold one bounded, human-gated roster expansion proposal. Starts nothing. */
export function proposeTaskforceExpansion(input: TaskforceExpansionInput): TaskforceExpansionProposal {
  if (!input || !Number.isSafeInteger(input.epoch)
    || input.epoch < TASKFORCE_EXPANSION_POLICY.minExpansionEpoch
    || input.epoch > TASKFORCE_EXPANSION_POLICY.maxExpansionEpoch) {
    throw new Error(`expansion epoch must be an integer within ${TASKFORCE_EXPANSION_POLICY.minExpansionEpoch}..${TASKFORCE_EXPANSION_POLICY.maxExpansionEpoch}`);
  }
  if (!boundedText(input.proposedBy, TASKFORCE_EXPANSION_POLICY.maxProposedByChars)) throw new Error('proposedBy identity required and bounded');
  if (!Array.isArray(input.roles) || input.roles.length < 1
    || input.roles.length > TASKFORCE_EXPANSION_POLICY.maxProposedRolesPerRequest) {
    throw new Error(`bounded proposal batch required: 1..${TASKFORCE_EXPANSION_POLICY.maxProposedRolesPerRequest} roles per request`);
  }
  if (proposalsByEpoch.has(input.epoch)) throw new Error(`expansion epoch ${input.epoch} already holds a proposal; use the next epoch`);

  const seenRoleIds = new Set<string>();
  const proposedIds = new Set<string>();
  for (const r of input.roles) {
    if (!r || !roleId(r.roleId)) throw new Error('proposed roleId must be a bounded kebab/snake id');
    if (liveRoleIds.has(r.roleId)) throw new Error(`roleId collides with an existing live factory role: ${r.roleId}`);
    if (seenRoleIds.has(r.roleId)) throw new Error(`duplicate roleId inside one proposal: ${r.roleId}; submit a deduplicated batch`);
    seenRoleIds.add(r.roleId);
    proposedIds.add(r.roleId);
  }
  for (const r of input.roles) {
    if (!boundedText(r.mission, TASKFORCE_EXPANSION_POLICY.maxMissionChars)) throw new Error('proposed mission must be non-empty bounded text');
    if (!Array.isArray(r.evidenceRefs) || r.evidenceRefs.length < 1
      || r.evidenceRefs.length > TASKFORCE_EXPANSION_POLICY.maxEvidenceRefsPerRole
      || !r.evidenceRefs.every((e: string) => boundedText(e, TASKFORCE_EXPANSION_POLICY.maxEvidenceRefChars))) {
      throw new Error(`each proposed role needs 1..${TASKFORCE_EXPANSION_POLICY.maxEvidenceRefsPerRole} bounded evidence refs`);
    }
    if (!Array.isArray(r.requestedReviewerRoleIds)
      || r.requestedReviewerRoleIds.length < TASKFORCE_EXPANSION_POLICY.requiredDistinctReviewerRoles
      || new Set(r.requestedReviewerRoleIds).size !== r.requestedReviewerRoleIds.length) {
      throw new Error(`each proposed role needs ${TASKFORCE_EXPANSION_POLICY.requiredDistinctReviewerRoles} distinct requested reviewers`);
    }
    for (const reviewerId of r.requestedReviewerRoleIds) {
      if (!roleId(reviewerId)) throw new Error('requested reviewer id must be a bounded kebab/snake id');
      if (proposedIds.has(reviewerId)) throw new Error(`self-review rejected: ${reviewerId} is itself a proposed role; expansion cannot create its own reviewers`);
      if (!liveRoleIds.has(reviewerId)) throw new Error(`unknown reviewer role: ${reviewerId}; reviewers must already exist in the live enterprise factory`);
      if (!designatedReviewers.has(reviewerId)) throw new Error(`reviewer ${reviewerId} exists but is not a designated reviewer role in the live factory`);
    }
  }

  const proposal: TaskforceExpansionProposal = Object.freeze({
    kind: 'TASKFORCE_ROSTER_EXPANSION_PROPOSAL',
    proposalId: `taskforce-expansion:epoch-${input.epoch}`,
    epoch: input.epoch,
    proposedBy: input.proposedBy,
    roles: Object.freeze(input.roles.map(r => Object.freeze({
      roleId: r.roleId, mission: r.mission,
      requestedReviewerRoleIds: Object.freeze([...r.requestedReviewerRoleIds]),
      evidenceRefs: Object.freeze([...r.evidenceRefs]),
    }))),
    status: 'PROPOSED_AWAITING_HUMAN_DECISION',
    humanDecision: 'REQUIRED',
    guardrails: TASKFORCE_EXPANSION_GUARDRAILS,
  });
  proposalsByEpoch.set(input.epoch, proposal);
  return proposal;
}

export interface ProposedRoleReadiness {
  roleId: string;
  ready: boolean;
  gaps: readonly ('HUMAN_APPROVAL_REQUIRED' | 'STAFFING_PLAN_REQUIRED' | 'REVIEWER_WIRING_ADVISORY_UNTIL_HUMAN_RATIFICATION')[];
}

export interface ExpansionReadiness {
  proposalId: string;
  epoch: number;
  perRole: readonly Readonly<ProposedRoleReadiness>[];
  readyRoleCount: number;
  allReady: false;
  humanDecision: 'REQUIRED';
}

/**
 * Pure evaluation: no proposal is ever "ready" here. Human approval comes first, then a
 * staffing plan; reviewer wiring stays advisory until a human ratifies it. Returns
 * explicit per-role gaps instead of a boolean shrug.
 */
export function expansionReadiness(proposal: TaskforceExpansionProposal): ExpansionReadiness {
  if (!proposal || proposal.kind !== 'TASKFORCE_ROSTER_EXPANSION_PROPOSAL') throw new Error('a taskforce expansion proposal is required');
  const perRole = proposal.roles.map(r => Object.freeze({
    roleId: r.roleId,
    ready: false,
    gaps: Object.freeze([
      'HUMAN_APPROVAL_REQUIRED',
      'STAFFING_PLAN_REQUIRED',
      'REVIEWER_WIRING_ADVISORY_UNTIL_HUMAN_RATIFICATION',
    ] as const),
  }));
  return Object.freeze({
    proposalId: proposal.proposalId,
    epoch: proposal.epoch,
    perRole: Object.freeze(perRole),
    readyRoleCount: 0,
    allReady: false as const,
    humanDecision: 'REQUIRED' as const,
  });
}

/** Honest platform-wide snapshot. Never fabricates a live count this module cannot know. */
export function expansionSnapshot() {
  const heldProposals = [...proposalsByEpoch.values()].sort((a, b) => a.epoch - b.epoch);
  return Object.freeze({
    proposedRolesLive: 0,
    agentsStarted: 0,
    liveAgentCount: null,
    proposalsHeld: heldProposals.length,
    heldProposalIds: Object.freeze(heldProposals.map(p => p.proposalId)),
    liveFactoryRolesUnchanged: ENTERPRISE_WORKFORCE.length,
    humanDecision: 'REQUIRED' as const,
    guardrails: TASKFORCE_EXPANSION_GUARDRAILS,
  });
}