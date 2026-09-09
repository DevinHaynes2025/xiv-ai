import { refuse } from './errors';
import type {
  ActorContext,
  AgentCapability,
  AgentEvaluation,
  AgentIdentity,
  AgentRelationship,
  AgentTask,
  GovernanceEvent,
  GovernanceEventKind,
  KnowledgeLineageRecord,
  KnowledgeSource,
  Meeting,
  MeetingParticipant,
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
  };
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
