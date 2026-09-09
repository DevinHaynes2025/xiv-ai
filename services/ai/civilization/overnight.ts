import { refuse } from './errors';
import { convene, hasReached, type ConveneInput } from './meeting-engine';
import { recordGovernanceEvent, requireMember, requireSupervisor, visibleTo, type CivilizationState } from './store';
import type { ActorContext, Meeting, MeetingAction, MeetingTriggerKind } from './types';

// Offline and asynchronous meetings.
//
// The executive leaves at 20:00 and the agents keep working. What "keep working"
// means here is narrow on purpose: they may read what they were already
// authorised to read, compare it, disagree about it and write down a
// recommendation. Every action that would touch anything lands in the queue with
// requires_human_approval set, which meeting-engine.queueAction forces for any
// asynchronous room, so the morning brief can report zero unauthorized actions as
// a measurement rather than a promise.

export type OvernightWindow = {
  start: string;
  end: string;
};

export function openOvernightMeeting(
  state: CivilizationState,
  actor: ActorContext,
  input: Omit<ConveneInput, 'meetingMode' | 'asyncWindowStart' | 'asyncWindowEnd'> & {
    window: OvernightWindow;
    triggerKind?: MeetingTriggerKind;
  },
): Meeting {
  requireSupervisor(state, actor);

  if (Date.parse(input.window.end) <= Date.parse(input.window.start)) {
    refuse('meeting_async_window_invalid', 'the window must end after it starts');
  }

  return convene(state, actor, {
    ...input,
    triggerKind: input.triggerKind ?? 'scheduled_review',
    meetingMode: 'asynchronous',
    asyncWindowStart: input.window.start,
    asyncWindowEnd: input.window.end,
  });
}

export type OvernightBrief = {
  window: OvernightWindow;
  meetingsCompleted: number;
  issuesInvestigated: number;
  opportunitiesIdentified: number;
  anomaliesDetected: number;
  decisionsRequiringApproval: number;
  unauthorizedActionsExecuted: number;
  pendingActions: MeetingAction[];
  meetings: { id: string; title: string; stage: Meeting['lifecycleStage']; confidence: number | null }[];
};

// Every number in the brief is counted from stored rows, and the definitions are
// written down here rather than left to the reader, because a brief whose numbers
// cannot be re-derived is a story about the night rather than a record of it.
export function overnightBrief(
  state: CivilizationState,
  actor: ActorContext,
  window: OvernightWindow,
): OvernightBrief {
  requireMember(state, actor);

  const startMs = Date.parse(window.start);
  const endMs = Date.parse(window.end);

  const meetings = visibleTo(state, actor, state.meetings).filter((meeting) => {
    if (meeting.meetingMode !== 'asynchronous') return false;
    if (!meeting.asyncWindowStart || !meeting.asyncWindowEnd) return false;
    // Overlap rather than containment: a room that started before midnight and
    // ran into the window still belongs to the morning brief.
    return Date.parse(meeting.asyncWindowStart) < endMs && Date.parse(meeting.asyncWindowEnd) > startMs;
  });

  const meetingIds = new Set(meetings.map((meeting) => meeting.id));

  // Completed means the room actually reached a position, not merely that it
  // opened.
  const meetingsCompleted = meetings.filter((meeting) =>
    hasReached(meeting, 'consensus_or_disagreement'),
  ).length;

  // One issue per distinct thing the evidence was about.
  const issuesInvestigated = new Set(
    state.meetingEvidence.filter((item) => meetingIds.has(item.meetingId)).map((item) => item.subject),
  ).size;

  // One opportunity per option the room was willing to put its name to.
  const opportunitiesIdentified = state.meetingProposals.filter((item) => meetingIds.has(item.meetingId)).length;

  const anomaliesDetected = meetings.filter(
    (meeting) => meeting.triggerKind === 'anomaly_detected' || meeting.triggerKind === 'threshold_breach',
  ).length;

  const actions = state.meetingActions.filter((item) => meetingIds.has(item.meetingId));
  const pendingActions = actions.filter((item) => item.requiresHumanApproval && !item.approvedBy && item.status === 'queued');

  // Counted, not assumed. An action that ran while still needing approval would
  // show up here, which is the point of computing it.
  const unauthorizedActionsExecuted = actions.filter(
    (item) => item.executedAt !== null && item.requiresHumanApproval && !item.approvedBy,
  ).length;

  const brief: OvernightBrief = {
    window,
    meetingsCompleted,
    issuesInvestigated,
    opportunitiesIdentified,
    anomaliesDetected,
    decisionsRequiringApproval: pendingActions.length,
    unauthorizedActionsExecuted,
    pendingActions,
    meetings: meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      stage: meeting.lifecycleStage,
      confidence: meeting.recommendationConfidence,
    })),
  };

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'overnight_cycle_completed',
    actorUserId: actor.userId,
    detail: {
      window,
      meetingsCompleted,
      issuesInvestigated,
      opportunitiesIdentified,
      anomaliesDetected,
      decisionsRequiringApproval: brief.decisionsRequiringApproval,
      unauthorizedActionsExecuted,
    },
  });

  return brief;
}

export function formatBrief(brief: OvernightBrief): string {
  return [
    'XIV Overnight Intelligence Brief',
    `${brief.meetingsCompleted} agent meetings completed`,
    `${brief.issuesInvestigated} issues investigated`,
    `${brief.opportunitiesIdentified} opportunities identified`,
    `${brief.anomaliesDetected} anomalies detected`,
    `${brief.decisionsRequiringApproval} decisions require approval`,
    `${brief.unauthorizedActionsExecuted} unauthorized actions executed`,
  ].join('\n');
}
