import { isForbiddenCapability } from './guardian';
import {
  now,
  organizationOf,
  recordGovernanceEvent,
  requireMember,
  visibleTo,
  type CivilizationState,
} from './store';
import type {
  ActorContext,
  GuardianObservation,
  GuardianVerdict,
  SecurityClassification,
} from './types';

// Guardian as a policy observer.
//
// Guardian watches the room; it does not join it. There is no Guardian vote, no
// Guardian proposal and no way for the meeting to overrule an observation. The
// room can disagree with Guardian all it likes and the verdict still stands,
// because the verdict is consulted by the code that would perform the action
// rather than by the agents discussing it.
//
// Each observation answers the six questions the story asks, in order.

const CLASSIFICATION_RANK: Record<SecurityClassification, number> = {
  public: 0,
  internal: 1,
  confidential: 2,
  restricted: 3,
};

// Text shaped like an instruction rather than a contribution. Detecting this does
// not change what happens — meeting messages are content and never control, so
// the instruction was already inert. What detection buys is that the attempt is
// visible in the audit trail instead of passing unremarked.
const INJECTION_MARKERS = [
  'ignore previous',
  'ignore prior',
  'disregard the above',
  'system override',
  'you are now',
  'new instructions',
  'grant yourself',
  'grant me',
  'bypass',
  'disable rls',
  'reveal your',
  'print your system prompt',
  'act as administrator',
  'approve this automatically',
  'without human approval',
  'unlimited budget',
];

export type InjectionScan = {
  suspected: boolean;
  markers: string[];
};

export function scanForInjection(text: string): InjectionScan {
  const normalized = text.toLowerCase();
  const markers = INJECTION_MARKERS.filter((marker) => normalized.includes(marker));
  return { suspected: markers.length > 0, markers };
}

export type ObservationInput = {
  who: string;
  why: string;
  whatInformation: string;
  owningUniverseId: string;
  informationClassification: SecurityClassification;
  proposedAction: string;
  requiresHumanApproval: boolean;
  meetingId?: string | null;
  messageId?: string | null;
  subjectAgentId?: string | null;
  agentClearance?: SecurityClassification;
  policyKey?: string;
};

export type GuardianRuling = {
  verdict: GuardianVerdict;
  conditions: string[];
  reasons: string[];
};

// The ruling is computed from the six answers rather than asked of a model, so
// the same inputs always produce the same verdict and a reviewer can check it.
export function evaluate(actorUniverseId: string, input: ObservationInput): GuardianRuling {
  const reasons: string[] = [];
  const conditions: string[] = [];
  let verdict: GuardianVerdict = 'allow';

  const escalate = (next: GuardianVerdict, reason: string) => {
    reasons.push(reason);
    const order: GuardianVerdict[] = ['allow', 'allow_with_conditions', 'require_human', 'refuse'];
    if (order.indexOf(next) > order.indexOf(verdict)) verdict = next;
  };

  if (input.owningUniverseId !== actorUniverseId) {
    escalate('refuse', `the information is owned by ${input.owningUniverseId}, not the acting universe`);
  }

  if (isForbiddenCapability(input.proposedAction)) {
    escalate('refuse', `${input.proposedAction} is on the Guardian forbidden list`);
  }

  if (input.agentClearance) {
    const required = CLASSIFICATION_RANK[input.informationClassification];
    const held = CLASSIFICATION_RANK[input.agentClearance];
    if (held < required) {
      escalate('refuse', `${input.who} is cleared to ${input.agentClearance}, the information is ${input.informationClassification}`);
    }
  }

  if (input.informationClassification === 'restricted') {
    escalate('require_human', 'restricted information leaving the room needs a person');
    conditions.push('A human supervisor must confirm the disclosure before the action proceeds.');
  }

  if (input.requiresHumanApproval) {
    escalate('require_human', 'the proposed action is approval-gated');
    conditions.push('The action stays queued until a named human approves it.');
  }

  if (verdict === 'allow' && conditions.length > 0) verdict = 'allow_with_conditions';
  if (reasons.length === 0) reasons.push('No policy condition applies to this exchange.');

  return { verdict, conditions, reasons };
}

export function observe(
  state: CivilizationState,
  actor: ActorContext,
  input: ObservationInput,
): GuardianObservation {
  requireMember(state, actor);
  const ruling = evaluate(actor.universeId, input);

  const observation: GuardianObservation = {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: organizationOf(state, actor.universeId),
    meetingId: input.meetingId ?? null,
    messageId: input.messageId ?? null,
    subjectAgentId: input.subjectAgentId ?? null,
    who: input.who,
    why: input.why,
    whatInformation: input.whatInformation,
    owningUniverseId: input.owningUniverseId,
    informationClassification: input.informationClassification,
    proposedAction: input.proposedAction,
    requiresHumanApproval: input.requiresHumanApproval,
    verdict: ruling.verdict,
    conditions: ruling.conditions,
    policyKey: input.policyKey ?? 'guardian.default.v1',
    securityClassification: 'restricted',
    retentionPolicy: 'retain-7y-then-review',
    provenance: { reasons: ruling.reasons, slice: '2I-AI-62B' },
    auditEventId: null,
    observedAt: now(state),
  };
  state.guardianObservations.push(observation);

  const event = recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'guardian_observation',
    actorUserId: actor.userId,
    subjectAgentId: observation.subjectAgentId,
    decision: observation.verdict,
    detail: {
      meetingId: observation.meetingId,
      who: observation.who,
      why: observation.why,
      proposedAction: observation.proposedAction,
      reasons: ruling.reasons,
    },
  });
  observation.auditEventId = event.id;

  return observation;
}

export function recordInjectionAttempt(
  state: CivilizationState,
  actor: ActorContext,
  input: { meetingId: string; messageId: string; subjectAgentId?: string | null; markers: readonly string[]; excerpt: string },
) {
  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'meeting_injection_detected',
    actorUserId: actor.userId,
    subjectAgentId: input.subjectAgentId ?? null,
    decision: 'content_only',
    detail: {
      meetingId: input.meetingId,
      messageId: input.messageId,
      markers: [...input.markers],
      excerpt: input.excerpt.slice(0, 240),
      // Recorded so a reviewer can see the attempt was noticed and had no effect.
      effect: 'none: meeting messages are content and cannot change meeting authority',
    },
  });
}

export function listObservations(state: CivilizationState, actor: ActorContext): GuardianObservation[] {
  return visibleTo(state, actor, state.guardianObservations);
}

export function observationsForMeeting(
  state: CivilizationState,
  actor: ActorContext,
  meetingId: string,
): GuardianObservation[] {
  return listObservations(state, actor).filter((item) => item.meetingId === meetingId);
}
