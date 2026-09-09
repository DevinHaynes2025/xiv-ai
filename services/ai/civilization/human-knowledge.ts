import { refuse } from './errors';
import {
  now,
  organizationOf,
  recordGovernanceEvent,
  requireMember,
  requireSupervisor,
  visibleTo,
  type CivilizationState,
} from './store';
import type {
  ActorContext,
  ClaimKind,
  HumanKnowledgeCategory,
  HumanKnowledgeRecord,
  SecurityClassification,
} from './types';

// What a person tells XIV is filed as the kind of thing it is. The distinction
// that matters most is the one between what someone saw and what someone thinks:
// an observation can ground a decision, an opinion cannot, and no amount of
// agents repeating the opinion back changes that.
export const HUMAN_KNOWLEDGE_CATEGORIES = [
  'HUMAN_OBSERVATION',
  'HUMAN_EXPERIENCE',
  'HUMAN_OPINION',
  'HUMAN_DECISION',
  'HUMAN_CORRECTION',
  'HUMAN_APPROVAL',
] as const;

// How each category enters agent reasoning. human_fact is the strongest claim
// kind in the evidence model, so only the categories that describe something the
// person actually witnessed or decided map onto it.
const CATEGORY_CLAIM_KIND: Record<HumanKnowledgeCategory, ClaimKind> = {
  HUMAN_OBSERVATION: 'human_fact',
  HUMAN_EXPERIENCE: 'human_fact',
  HUMAN_OPINION: 'human_opinion',
  HUMAN_DECISION: 'human_fact',
  HUMAN_CORRECTION: 'human_fact',
  HUMAN_APPROVAL: 'human_fact',
};

// Categories that may ever be promoted into the organization's trusted record,
// and then only deliberately, by a supervisor, on a record that names them.
const ELEVATABLE = new Set<HumanKnowledgeCategory>([
  'HUMAN_OBSERVATION',
  'HUMAN_EXPERIENCE',
  'HUMAN_CORRECTION',
]);

export function claimKindForCategory(category: HumanKnowledgeCategory): ClaimKind {
  return CATEGORY_CLAIM_KIND[category];
}

export function isElevatable(category: HumanKnowledgeCategory) {
  return ELEVATABLE.has(category);
}

export type HumanKnowledgeInput = {
  category: HumanKnowledgeCategory;
  statement: string;
  meetingId?: string | null;
  context?: string | null;
  subjectAgentId?: string | null;
  correctsEvidenceId?: string | null;
  approvesDecisionId?: string | null;
  confidence?: number | null;
  knowledgeSourceId?: string | null;
  securityClassification?: SecurityClassification;
  retentionPolicy?: string;
};

// A human knowledge record is first-person by construction. It is what this
// person said, so the actor is always the author; there is no path by which one
// member files a statement in another member's name.
export function recordHumanKnowledge(
  state: CivilizationState,
  actor: ActorContext,
  input: HumanKnowledgeInput,
): HumanKnowledgeRecord {
  requireMember(state, actor);

  if (!input.statement.trim()) {
    refuse('human_knowledge_requires_target', 'a human knowledge record needs a statement');
  }
  if (input.category === 'HUMAN_CORRECTION' && !input.correctsEvidenceId) {
    refuse('human_knowledge_requires_target', 'a correction must name the evidence it corrects');
  }
  if (input.category === 'HUMAN_APPROVAL' && !input.approvesDecisionId) {
    refuse('human_knowledge_requires_target', 'an approval must name the decision it approves');
  }

  const record: HumanKnowledgeRecord = {
    id: state.nextId(),
    universeId: actor.universeId,
    organizationId: organizationOf(state, actor.universeId),
    meetingId: input.meetingId ?? null,
    userId: actor.userId,
    category: input.category,
    statement: input.statement,
    context: input.context ?? null,
    subjectAgentId: input.subjectAgentId ?? null,
    correctsEvidenceId: input.correctsEvidenceId ?? null,
    approvesDecisionId: input.approvesDecisionId ?? null,
    elevatesToFact: false,
    elevatedBy: null,
    confidence: input.confidence ?? null,
    knowledgeSourceId: input.knowledgeSourceId ?? null,
    securityClassification: input.securityClassification ?? 'confidential',
    retentionPolicy: input.retentionPolicy ?? 'retain-7y-then-review',
    provenance: { recordedBy: actor.userId, slice: '2I-AI-62B' },
    auditEventId: null,
    createdAt: now(state),
  };
  state.humanKnowledge.push(record);

  const event = recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'human_knowledge_recorded',
    actorUserId: actor.userId,
    subjectAgentId: record.subjectAgentId,
    decision: record.category,
    detail: { meetingId: record.meetingId, category: record.category, claimKind: claimKindForCategory(record.category) },
  });
  record.auditEventId = event.id;

  return record;
}

// Promotion is a deliberate, attributable supervisor act on a category that can
// carry it. An opinion is refused outright rather than downgraded quietly, so the
// caller learns that the model does not accept the move at all.
export function elevateToFact(
  state: CivilizationState,
  actor: ActorContext,
  input: { recordId: string; justification: string },
): HumanKnowledgeRecord {
  requireSupervisor(state, actor);
  const record = requireHumanKnowledge(state, actor.universeId, input.recordId);

  if (!isElevatable(record.category)) {
    refuse('human_opinion_cannot_become_fact', `${record.category} cannot be promoted to organizational fact`);
  }
  if (!input.justification.trim()) {
    refuse('human_knowledge_requires_target', 'promotion needs a justification');
  }

  record.elevatesToFact = true;
  record.elevatedBy = actor.userId;

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'human_knowledge_elevated',
    actorUserId: actor.userId,
    decision: record.category,
    detail: { recordId: record.id, justification: input.justification },
  });

  return record;
}

export function listHumanKnowledge(state: CivilizationState, actor: ActorContext): HumanKnowledgeRecord[] {
  return visibleTo(state, actor, state.humanKnowledge);
}

export function humanKnowledgeForMeeting(
  state: CivilizationState,
  actor: ActorContext,
  meetingId: string,
): HumanKnowledgeRecord[] {
  return listHumanKnowledge(state, actor).filter((item) => item.meetingId === meetingId);
}

export function requireHumanKnowledge(
  state: CivilizationState,
  universeId: string,
  recordId: string,
): HumanKnowledgeRecord {
  const record = state.humanKnowledge.find((item) => item.id === recordId);
  if (!record) refuse('knowledge_source_unknown', recordId);
  if (record.universeId !== universeId) refuse('tenancy_cross_universe_blocked', recordId);
  return record;
}
