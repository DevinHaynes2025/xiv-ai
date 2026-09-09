import { refuse } from './errors';
import {
  now,
  organizationOf,
  recordGovernanceEvent,
  requireMember,
  requireSupervisor,
  type CivilizationState,
} from './store';
import type { ActorContext, BudgetDimension, MeetingBudget } from './types';

// The resource governor. Every meeting is created with one of these, so a room
// that could deliberate forever cannot: it hits a ceiling and terminates into the
// human checkpoint. The story's list of budgeted resources is the list of
// dimensions here, and max_subagents defaults to zero because a meeting creating
// its own agents is not something 62B authorises at all.
export const DEFAULT_MEETING_BUDGET = {
  maxTokens: 250_000,
  maxComputeMs: 600_000,
  maxGpuMs: 0,
  maxStorageBytes: 10 * 1024 * 1024,
  maxToolCalls: 100,
  maxDurationSeconds: 3600,
  maxExternalRequests: 25,
  maxParticipantAgents: 12,
  maxSubagents: 0,
  maxMessages: 500,
} as const;

// participant_agents is deliberately absent: it is not a running total but a
// headcount read from the participant list, so the meeting engine checks it
// against maxParticipantAgents directly rather than accumulating it here.
type ChargeableDimension = Exclude<BudgetDimension, 'participant_agents'>;

const CEILINGS: Record<ChargeableDimension, { max: keyof MeetingBudget; consumed: keyof MeetingBudget }> = {
  tokens: { max: 'maxTokens', consumed: 'consumedTokens' },
  compute_ms: { max: 'maxComputeMs', consumed: 'consumedComputeMs' },
  gpu_ms: { max: 'maxGpuMs', consumed: 'consumedGpuMs' },
  storage_bytes: { max: 'maxStorageBytes', consumed: 'consumedStorageBytes' },
  tool_calls: { max: 'maxToolCalls', consumed: 'consumedToolCalls' },
  duration_seconds: { max: 'maxDurationSeconds', consumed: 'consumedDurationSeconds' },
  external_requests: { max: 'maxExternalRequests', consumed: 'consumedExternalRequests' },
  subagents: { max: 'maxSubagents', consumed: 'consumedSubagents' },
  messages: { max: 'maxMessages', consumed: 'consumedMessages' },
};

const CHARGEABLE = new Set<string>(Object.keys(CEILINGS));

export type MeetingBudgetInput = Partial<{
  [K in keyof typeof DEFAULT_MEETING_BUDGET]: number;
}>;

export function setMeetingBudget(
  state: CivilizationState,
  actor: ActorContext,
  input: { meetingId: string } & MeetingBudgetInput,
): MeetingBudget {
  requireSupervisor(state, actor);

  const existing = state.meetingBudgets.find((item) => item.meetingId === input.meetingId);
  const budget: MeetingBudget = existing ?? {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: organizationOf(state, actor.universeId),
    meetingId: input.meetingId,
    ...DEFAULT_MEETING_BUDGET,
    consumedTokens: 0,
    consumedComputeMs: 0,
    consumedGpuMs: 0,
    consumedStorageBytes: 0,
    consumedToolCalls: 0,
    consumedDurationSeconds: 0,
    consumedExternalRequests: 0,
    consumedSubagents: 0,
    consumedMessages: 0,
    exhausted: false,
    exhaustedDimension: null,
    terminatedAt: null,
    provenance: { setBy: actor.userId, slice: '2I-AI-62B' },
    securityClassification: 'internal',
    retentionPolicy: 'retain-2y',
    auditEventId: null,
    createdAt: now(state),
  };

  for (const key of Object.keys(DEFAULT_MEETING_BUDGET) as (keyof typeof DEFAULT_MEETING_BUDGET)[]) {
    const value = input[key];
    if (typeof value === 'number') {
      if (value < 0) refuse('quota_budget_missing', `${key} cannot be negative`);
      (budget as unknown as Record<string, number>)[key] = value;
    }
  }

  if (!existing) state.meetingBudgets.push(budget);

  const event = recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'meeting_budget_set',
    actorUserId: actor.userId,
    detail: { meetingId: budget.meetingId, maxMessages: budget.maxMessages, maxSubagents: budget.maxSubagents },
  });
  budget.auditEventId = event.id;

  return budget;
}

export function meetingBudget(state: CivilizationState, meetingId: string): MeetingBudget {
  const budget = state.meetingBudgets.find((item) => item.meetingId === meetingId);
  if (!budget) refuse('meeting_budget_missing', meetingId);
  return budget;
}

export function readMeetingBudget(
  state: CivilizationState,
  actor: ActorContext,
  meetingId: string,
): MeetingBudget {
  requireMember(state, actor);
  const budget = meetingBudget(state, meetingId);
  if (budget.universeId !== actor.universeId) refuse('tenancy_cross_universe_blocked', meetingId);
  return budget;
}

export function assertBudgetAvailable(state: CivilizationState, meetingId: string) {
  const budget = meetingBudget(state, meetingId);
  if (budget.exhausted) {
    refuse('meeting_budget_exhausted', `${meetingId}:${budget.exhaustedDimension ?? 'unknown'}`);
  }
  return budget;
}

export type BudgetCharge = Partial<Record<BudgetDimension, number>>;

export type ChargeResult = {
  budget: MeetingBudget;
  exhausted: boolean;
  dimension: BudgetDimension | null;
};

// Charging is checked before it is applied. A charge that would cross a ceiling
// terminates the meeting instead of being written and then noticed: the caller
// gets a refusal, the budget is marked exhausted with the dimension that ran out,
// and an audit event records it. Nothing is silently truncated.
export function chargeMeeting(
  state: CivilizationState,
  input: { meetingId: string; actorUserId?: string | null; charge: BudgetCharge; terminateOnExhaustion?: boolean },
): ChargeResult {
  const budget = assertBudgetAvailable(state, input.meetingId);
  const record = budget as unknown as Record<string, number>;

  const charges = (Object.entries(input.charge) as [BudgetDimension, number][]).filter(
    (entry): entry is [ChargeableDimension, number] => Boolean(entry[1]) && CHARGEABLE.has(entry[0]),
  );

  for (const [dimension, amount] of charges) {
    const ceiling = CEILINGS[dimension];
    if (record[ceiling.consumed as string] + amount > record[ceiling.max as string]) {
      return exhaust(state, budget, dimension, input.actorUserId ?? null);
    }
  }

  for (const [dimension, amount] of charges) {
    record[CEILINGS[dimension].consumed as string] += amount;
  }

  return { budget, exhausted: false, dimension: null };
}

export function exhaust(
  state: CivilizationState,
  budget: MeetingBudget,
  dimension: BudgetDimension,
  actorUserId: string | null,
): ChargeResult {
  budget.exhausted = true;
  budget.exhaustedDimension = dimension;
  budget.terminatedAt = now(state);

  recordGovernanceEvent(state, {
    universeId: budget.universeId,
    eventKind: 'meeting_budget_exhausted',
    actorUserId,
    decision: dimension,
    detail: { meetingId: budget.meetingId, dimension },
  });

  return { budget, exhausted: true, dimension };
}

export type BudgetUtilisation = {
  dimension: BudgetDimension;
  consumed: number;
  max: number;
  fraction: number;
};

export function budgetUtilisation(budget: MeetingBudget): BudgetUtilisation[] {
  const record = budget as unknown as Record<string, number>;
  return (Object.keys(CEILINGS) as ChargeableDimension[]).map((dimension) => {
    const ceiling = CEILINGS[dimension];
    const max = record[ceiling.max as string];
    const consumed = record[ceiling.consumed as string];
    return { dimension, consumed, max, fraction: max > 0 ? consumed / max : 0 };
  });
}
