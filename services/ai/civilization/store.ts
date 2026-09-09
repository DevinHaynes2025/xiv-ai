import { refuse } from './errors';
import type {
  ActorContext,
  AgentCapability,
  AgentEvaluation,
  AgentIdentity,
  AgentRelationship,
  AgentReputation,
  AgentTask,
  ControlAction,
  DirectoryEntry,
  GovernanceEvent,
  GovernanceEventKind,
  GuardianObservation,
  HumanKnowledgeRecord,
  KnowledgeLineageRecord,
  KnowledgeSource,
  Meeting,
  MeetingAction,
  MeetingBudget,
  MeetingDecisionRecord,
  MeetingEvidence,
  MeetingMessage,
  MeetingObjection,
  MeetingOutcome,
  MeetingParticipant,
  MeetingProposal,
  MeetingProposalVote,
  ResourceBudget,
  RuntimeCapability,
  RuntimeNode,
  TaskForce,
  Universe,
  UniverseMembership,
  XacpMessage,
} from './types';

// The in-memory tables are a one-to-one mirror of the slice migration. Keeping
// the names identical is what lets the schema-parity test compare them.
export const CIVILIZATION_TABLES = [
  'universe_lifecycle',
  'universe_memberships',
  'agent_registry',
  'agent_capabilities',
  'agent_relationships',
  'agent_messages',
  'agent_meetings',
  'agent_meeting_participants',
  'agent_task_forces',
  'agent_tasks',
  'agent_knowledge_sources',
  'knowledge_lineage',
  'agent_evaluations',
  'agent_resource_budgets',
  'runtime_nodes',
  'runtime_capabilities',
  'agent_governance_events',
  // 2I-AI-62B
  'agent_meeting_messages',
  'agent_meeting_evidence',
  'agent_meeting_proposals',
  'agent_meeting_objections',
  'agent_meeting_votes',
  'agent_meeting_decisions',
  'agent_meeting_actions',
  'agent_meeting_outcomes',
  'agent_meeting_budgets',
  'agent_reputation',
  'agent_directory',
  'agent_control_actions',
  'human_knowledge_records',
  'guardian_observations',
] as const;

export type CivilizationTable = (typeof CIVILIZATION_TABLES)[number];

export type Clock = () => Date;
export type IdFactory = () => string;

export type CivilizationState = {
  clock: Clock;
  nextId: IdFactory;
  universes: Universe[];
  memberships: UniverseMembership[];
  agents: AgentIdentity[];
  capabilities: AgentCapability[];
  relationships: AgentRelationship[];
  messages: XacpMessage[];
  meetings: Meeting[];
  meetingParticipants: MeetingParticipant[];
  taskForces: TaskForce[];
  tasks: AgentTask[];
  knowledgeSources: KnowledgeSource[];
  lineage: KnowledgeLineageRecord[];
  evaluations: AgentEvaluation[];
  budgets: ResourceBudget[];
  runtimeNodes: RuntimeNode[];
  runtimeCapabilities: RuntimeCapability[];
  governanceEvents: GovernanceEvent[];
  meetingMessages: MeetingMessage[];
  meetingEvidence: MeetingEvidence[];
  meetingProposals: MeetingProposal[];
  meetingObjections: MeetingObjection[];
  meetingVotes: MeetingProposalVote[];
  meetingDecisions: MeetingDecisionRecord[];
  meetingActions: MeetingAction[];
  meetingOutcomes: MeetingOutcome[];
  meetingBudgets: MeetingBudget[];
  reputations: AgentReputation[];
  directory: DirectoryEntry[];
  controlActions: ControlAction[];
  humanKnowledge: HumanKnowledgeRecord[];
  guardianObservations: GuardianObservation[];
};

function defaultIdFactory(): IdFactory {
  let counter = 0;
  return () => {
    counter += 1;
    const random = globalThis.crypto?.randomUUID?.();
    return random ?? `xiv-${counter.toString(16).padStart(8, '0')}-${Date.now().toString(16)}`;
  };
}

export function createState(options?: { clock?: Clock; nextId?: IdFactory }): CivilizationState {
  return {
    clock: options?.clock ?? (() => new Date()),
    nextId: options?.nextId ?? defaultIdFactory(),
    universes: [],
    memberships: [],
    agents: [],
    capabilities: [],
    relationships: [],
    messages: [],
    meetings: [],
    meetingParticipants: [],
    taskForces: [],
    tasks: [],
    knowledgeSources: [],
    lineage: [],
    evaluations: [],
    budgets: [],
    runtimeNodes: [],
    runtimeCapabilities: [],
    governanceEvents: [],
    meetingMessages: [],
    meetingEvidence: [],
    meetingProposals: [],
    meetingObjections: [],
    meetingVotes: [],
    meetingDecisions: [],
    meetingActions: [],
    meetingOutcomes: [],
    meetingBudgets: [],
    reputations: [],
    directory: [],
    controlActions: [],
    humanKnowledge: [],
    guardianObservations: [],
  };
}

// The organization always comes from the universe rather than the caller, which
// is the same rule xiv_apply_organization enforces in the database.
export function organizationOf(state: CivilizationState, universeId: string): string {
  return requireUniverse(state, universeId).organizationId;
}

export function now(state: CivilizationState) {
  return state.clock().toISOString();
}

export function requireUniverse(state: CivilizationState, universeId: string): Universe {
  const universe = state.universes.find((item) => item.id === universeId);
  if (!universe) refuse('tenancy_universe_unknown', universeId);
  return universe;
}

export function membershipFor(state: CivilizationState, actor: ActorContext) {
  return state.memberships.find(
    (item) => item.universeId === actor.universeId && item.userId === actor.userId && !item.revokedAt,
  );
}

// The predicate here is the same one the RLS policies use. Every read and write
// in this layer goes through it, so a service-role code path cannot quietly
// skip the check that the database would have applied.
export function requireMember(state: CivilizationState, actor: ActorContext) {
  const universe = requireUniverse(state, actor.universeId);
  const membership = membershipFor(state, actor);
  if (!membership) refuse('tenancy_not_a_member', `${actor.userId} in ${actor.universeId}`);
  return { universe, membership };
}

export function requireSupervisor(state: CivilizationState, actor: ActorContext) {
  const scope = requireMember(state, actor);
  if (!scope.membership.isSupervisor) {
    refuse('tenancy_not_a_supervisor', `${actor.userId} in ${actor.universeId}`);
  }
  return scope;
}

export function requireAgent(state: CivilizationState, universeId: string, agentId: string): AgentIdentity {
  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent) refuse('tenancy_agent_unknown', agentId);
  if (agent.universeId !== universeId) {
    refuse('tenancy_cross_universe_blocked', `${agentId} belongs to another universe`);
  }
  return agent;
}

export function assertSameUniverse(universeId: string, candidate: { universeId: string } | undefined | null) {
  if (candidate && candidate.universeId !== universeId) {
    refuse('tenancy_universe_mismatch', candidate.universeId);
  }
}

export function recordGovernanceEvent(
  state: CivilizationState,
  input: {
    universeId: string;
    eventKind: GovernanceEventKind;
    subjectAgentId?: string | null;
    actorUserId?: string | null;
    actorAgentId?: string | null;
    decision?: string | null;
    detail?: Record<string, unknown>;
    costMicroUsd?: number;
  },
): GovernanceEvent {
  const event: GovernanceEvent = {
    id: state.nextId(),
    universeId: input.universeId,
    eventKind: input.eventKind,
    subjectAgentId: input.subjectAgentId ?? null,
    actorUserId: input.actorUserId ?? null,
    actorAgentId: input.actorAgentId ?? null,
    decision: input.decision ?? null,
    detail: input.detail ?? {},
    costMicroUsd: input.costMicroUsd ?? 0,
    createdAt: now(state),
  };
  state.governanceEvents.push(event);
  return event;
}

export function visibleTo<T extends { universeId: string }>(
  state: CivilizationState,
  actor: ActorContext,
  rows: readonly T[],
): T[] {
  requireMember(state, actor);
  return rows.filter((row) => row.universeId === actor.universeId);
}
