import { refuse } from './errors';
import type { MeetingParticipant, XarpRole } from './types';

// XARP — the XIV Agent Reasoning Protocol.
//
// XACP (62A) governs how agents talk to each other: phases, provenance, who may
// address whom. XARP governs how a room reasons: which jobs must be filled
// before a recommendation is allowed to leave it.
//
// A role is a duty, never a permission. Holding 'challenger' does not widen what
// an agent may read or do; it obliges the agent to try to break the leading
// hypothesis. Capability grants stay entirely with the supervisor.
export const XARP_ROLES = [
  'investigator',
  'specialist',
  'challenger',
  'historian',
  'cultural',
  'risk',
  'security',
  'financial',
  'human_liaison',
  'synthesizer',
] as const;

export const XARP_ROLE_DUTIES: Record<XarpRole, string> = {
  investigator: 'Collects evidence and records where each piece came from.',
  specialist: 'Analyses the problem from a single professional domain.',
  challenger: 'Attempts to disprove the leading hypothesis.',
  historian: 'Looks for historical parallels and says how they differ from today.',
  cultural: 'Examines regional, language and cultural considerations where relevant.',
  risk: 'Determines the downside scenarios and their severity.',
  security: 'Checks security and authorization boundaries.',
  financial: 'Evaluates the economic consequences.',
  human_liaison: 'Determines where human knowledge or human approval is required.',
  synthesizer: 'Produces the final recommendation from the evidence and the disagreements.',
};

// The five roles a consequential recommendation cannot be assembled without.
// Investigator supplies the evidence, challenger attacks it, risk prices the
// downside, human_liaison names the point a person is needed, and synthesizer is
// accountable for the answer. A room missing any of them is not deliberating,
// it is agreeing.
export const REQUIRED_SYNTHESIS_ROLES: readonly XarpRole[] = [
  'investigator',
  'challenger',
  'risk',
  'human_liaison',
  'synthesizer',
];

// Roles that a domain adds when it is genuinely in scope. A room discussing a
// foreign-language supplier needs the cultural role filled; one that does not
// touch money does not need the financial role.
export const CONTEXTUAL_ROLES: readonly XarpRole[] = ['specialist', 'historian', 'cultural', 'security', 'financial'];

const ROLE_SET = new Set<string>(XARP_ROLES);

export function isXarpRole(value: string): value is XarpRole {
  return ROLE_SET.has(value);
}

export function rolesPresent(participants: readonly MeetingParticipant[]): XarpRole[] {
  const present = new Set<XarpRole>();
  for (const participant of participants) {
    if (participant.leftAt) continue;
    for (const role of participant.xarpRoles) present.add(role);
  }
  return XARP_ROLES.filter((role) => present.has(role));
}

export type RoleCoverage = {
  present: XarpRole[];
  missing: XarpRole[];
  complete: boolean;
};

export function synthesisRoleCoverage(
  participants: readonly MeetingParticipant[],
  extraRequired: readonly XarpRole[] = [],
): RoleCoverage {
  const present = rolesPresent(participants);
  const presentSet = new Set(present);
  const required = [...new Set([...REQUIRED_SYNTHESIS_ROLES, ...extraRequired])];
  const missing = required.filter((role) => !presentSet.has(role));
  return { present, missing, complete: missing.length === 0 };
}

export function assertSynthesisRoleCoverage(
  participants: readonly MeetingParticipant[],
  extraRequired: readonly XarpRole[] = [],
): RoleCoverage {
  const coverage = synthesisRoleCoverage(participants, extraRequired);
  if (!coverage.complete) {
    refuse('xarp_role_coverage_incomplete', coverage.missing.join(','));
  }
  return coverage;
}

// A participant speaks in a role it actually holds. This is not a security
// boundary on its own — the operator binding is — but it stops the transcript
// from recording an analysis as if a challenger had produced it.
export function assertHoldsRole(participant: MeetingParticipant, role: XarpRole | null | undefined) {
  if (!role) return;
  if (!participant.xarpRoles.includes(role)) {
    refuse('xarp_role_not_held', `${participant.agentId ?? participant.userId ?? participant.id} lacks ${role}`);
  }
}

// Anti-spoofing. An agent holds no credential of its own, so every agent-authored
// row names the human relaying it. Authorship is only accepted when the caller is
// the operator recorded on that agent's participant grant. The same predicate is
// enforced by xiv_assert_speaking_grant in the database, so a direct PostgREST
// write cannot skip it.
export function assertSpeakingGrant(input: {
  participant: MeetingParticipant | undefined;
  callerUserId: string;
  claimedOperatorUserId?: string | null;
}) {
  const { participant, callerUserId } = input;
  if (!participant || participant.leftAt) {
    refuse('xarp_no_speaking_grant', 'the agent holds no speaking grant in this room');
  }
  if (participant.participantKind !== 'agent') return participant;

  const granted = participant.operatorUserId;
  if (!granted) {
    refuse('xarp_no_speaking_grant', `${participant.agentId ?? participant.id} has no operator`);
  }
  const claimed = input.claimedOperatorUserId ?? callerUserId;
  if (claimed !== granted || callerUserId !== granted) {
    refuse('xarp_agent_impersonation_blocked', `${participant.agentId ?? participant.id}`);
  }
  return participant;
}
