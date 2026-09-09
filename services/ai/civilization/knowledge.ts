import { refuse } from './errors';
import {
  now,
  recordGovernanceEvent,
  requireAgent,
  requireMember,
  visibleTo,
  type CivilizationState,
} from './store';
import type {
  ActorContext,
  ClaimKind,
  KnowledgeEra,
  KnowledgeLineageRecord,
  KnowledgeSource,
  LineageStage,
  SecurityClassification,
  StorageTier,
} from './types';

// Ancient -> classical -> medieval -> industrialization -> modern -> digital -> present.
export const KNOWLEDGE_ERAS: readonly KnowledgeEra[] = [
  'ancient',
  'classical',
  'medieval',
  'industrial',
  'modern',
  'digital',
  'present',
];

// Origin -> Acquisition -> Classification -> Storage -> Transformation ->
// Reasoning -> Validation -> Distribution -> Decision -> Retention/Deletion.
export const LINEAGE_STAGES: readonly LineageStage[] = [
  'origin',
  'acquisition',
  'classification',
  'storage',
  'transformation',
  'reasoning',
  'validation',
  'distribution',
  'decision',
  'retention',
  'deletion',
];

const HISTORICAL_ERAS = new Set<KnowledgeEra>(['ancient', 'classical', 'medieval', 'industrial']);

export type KnowledgeSourceInput = {
  title: string;
  claimKind: ClaimKind;
  discipline: string;
  origin: string;
  era?: KnowledgeEra;
  sourceDate?: string | null;
  civilizationOrLocation?: string | null;
  originalLanguage?: string | null;
  originalText?: string | null;
  translation?: string | null;
  interpretation?: string | null;
  confidence?: number;
  contradictions?: readonly string[];
  modernRelevance?: string | null;
  securityClassification?: SecurityClassification;
  storageTier?: StorageTier;
  retentionPolicy?: string;
  recordedByAgentId?: string | null;
};

// Storage tier follows classification, usefulness, retention and era rather than
// a fixed size target. Nothing here reserves capacity; it decides where a record
// should live so that lineage survives even when access speed does not.
export function suggestStorageTier(input: {
  era: KnowledgeEra;
  claimKind: ClaimKind;
  confidence: number;
  securityClassification: SecurityClassification;
}): StorageTier {
  if (input.era === 'present' || input.era === 'digital') {
    return input.confidence >= 0.5 ? 'hot' : 'warm';
  }
  if (input.era === 'modern') return 'warm';
  if (input.claimKind === 'historical_evidence') return 'cold';
  return 'archival';
}

export function recordKnowledgeSource(
  state: CivilizationState,
  actor: ActorContext,
  input: KnowledgeSourceInput,
): KnowledgeSource {
  requireMember(state, actor);
  const agent = input.recordedByAgentId ? requireAgent(state, actor.universeId, input.recordedByAgentId) : null;

  const era = input.era ?? 'present';

  // A historical belief is stored as a historical belief. Filing it as a
  // present-day claim is the exact failure this rule exists to prevent.
  if (input.claimKind === 'historical_evidence' && era === 'present') {
    refuse('knowledge_historical_claim_as_present', input.title);
  }
  if (HISTORICAL_ERAS.has(era) && input.claimKind === 'human_fact') {
    refuse('knowledge_historical_claim_as_present', `${input.title} is ${era} and cannot be a present human fact`);
  }

  // Translation and interpretation are derived views. The original must survive
  // both of them so a reader can always go back to the source.
  if ((input.translation || input.interpretation) && !input.originalText?.trim()) {
    refuse('knowledge_original_text_missing', input.title);
  }

  const confidence = clamp(input.confidence ?? 0.5);
  const securityClassification = input.securityClassification ?? 'internal';

  const source: KnowledgeSource = {
    id: state.nextId(),
    universeId: actor.universeId,
    title: input.title,
    claimKind: input.claimKind,
    discipline: input.discipline,
    era,
    origin: input.origin,
    sourceDate: input.sourceDate ?? null,
    civilizationOrLocation: input.civilizationOrLocation ?? null,
    originalLanguage: input.originalLanguage ?? null,
    originalText: input.originalText ?? null,
    translation: input.translation ?? null,
    interpretation: input.interpretation ?? null,
    confidence,
    contradictions: [...(input.contradictions ?? [])],
    modernRelevance: input.modernRelevance ?? null,
    securityClassification,
    storageTier:
      input.storageTier ?? suggestStorageTier({ era, claimKind: input.claimKind, confidence, securityClassification }),
    retentionPolicy: input.retentionPolicy ?? 'standard',
    recordedBy: actor.userId,
    recordedByAgentId: agent?.id ?? null,
    createdAt: now(state),
  };
  state.knowledgeSources.push(source);

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'knowledge_recorded',
    actorUserId: actor.userId,
    actorAgentId: agent?.id ?? null,
    detail: { title: source.title, claimKind: source.claimKind, era: source.era, storageTier: source.storageTier },
  });

  recordLineage(state, actor, {
    knowledgeSourceId: source.id,
    stage: 'origin',
    actorKind: agent ? 'agent' : 'human',
    actorAgentId: agent?.id ?? null,
    detail: `Origin: ${source.origin}`,
  });

  return source;
}

// A historical claim never becomes a modern fact by being useful. Asking what it
// means today produces a separate, explicitly labelled inference that keeps a
// pointer back to the belief it came from.
export function deriveModernRelevance(
  state: CivilizationState,
  actor: ActorContext,
  input: { knowledgeSourceId: string; relevance: string; confidence: number; derivedByAgentId?: string | null },
): KnowledgeSource {
  requireMember(state, actor);
  const historical = requireKnowledgeSource(state, actor.universeId, input.knowledgeSourceId);

  historical.modernRelevance = input.relevance;

  return recordKnowledgeSource(state, actor, {
    title: `Modern relevance of: ${historical.title}`,
    claimKind: 'agent_inference',
    discipline: historical.discipline,
    era: 'present',
    origin: `derived_from:${historical.id}`,
    confidence: clamp(input.confidence),
    interpretation: input.relevance,
    originalText: historical.originalText ?? historical.title,
    originalLanguage: historical.originalLanguage,
    recordedByAgentId: input.derivedByAgentId ?? null,
    securityClassification: historical.securityClassification,
  });
}

export function recordLineage(
  state: CivilizationState,
  actor: ActorContext,
  input: {
    knowledgeSourceId: string;
    stage: LineageStage;
    actorKind: 'human' | 'agent' | 'system';
    actorAgentId?: string | null;
    modelId?: string | null;
    detail: string;
    relatedTaskId?: string | null;
    relatedMeetingId?: string | null;
    relatedMessageId?: string | null;
  },
): KnowledgeLineageRecord {
  requireMember(state, actor);
  requireKnowledgeSource(state, actor.universeId, input.knowledgeSourceId);
  if (input.actorAgentId) requireAgent(state, actor.universeId, input.actorAgentId);

  const existing = state.lineage.filter((item) => item.knowledgeSourceId === input.knowledgeSourceId);
  const previous = existing[existing.length - 1];
  if (previous && LINEAGE_STAGES.indexOf(input.stage) < LINEAGE_STAGES.indexOf(previous.stage)) {
    refuse('knowledge_lineage_out_of_order', `${previous.stage} -> ${input.stage}`);
  }

  const record: KnowledgeLineageRecord = {
    id: state.nextId(),
    universeId: actor.universeId,
    knowledgeSourceId: input.knowledgeSourceId,
    stage: input.stage,
    sequence: existing.length + 1,
    actorKind: input.actorKind,
    actorAgentId: input.actorAgentId ?? null,
    actorUserId: input.actorKind === 'human' ? actor.userId : null,
    modelId: input.modelId ?? null,
    detail: input.detail,
    relatedTaskId: input.relatedTaskId ?? null,
    relatedMeetingId: input.relatedMeetingId ?? null,
    relatedMessageId: input.relatedMessageId ?? null,
    recordedAt: now(state),
  };
  state.lineage.push(record);

  recordGovernanceEvent(state, {
    universeId: actor.universeId,
    eventKind: 'lineage_recorded',
    actorUserId: actor.userId,
    actorAgentId: input.actorAgentId ?? null,
    detail: { knowledgeSourceId: input.knowledgeSourceId, stage: input.stage, sequence: record.sequence },
  });

  return record;
}

export type LineageTrace = {
  source: KnowledgeSource;
  whereItCameFrom: string;
  whoChangedIt: string[];
  whichAgentsUsedIt: string[];
  whichModelsInterpretedIt: string[];
  whichDecisionsDependedOnIt: string[];
  stages: LineageStage[];
};

// The five questions XIV must always be able to answer about any intelligence
// object it holds.
export function traceLineage(state: CivilizationState, actor: ActorContext, knowledgeSourceId: string): LineageTrace {
  requireMember(state, actor);
  const source = requireKnowledgeSource(state, actor.universeId, knowledgeSourceId);
  const records = state.lineage
    .filter((item) => item.knowledgeSourceId === knowledgeSourceId && item.universeId === actor.universeId)
    .sort((left, right) => left.sequence - right.sequence);

  return {
    source,
    whereItCameFrom: source.origin,
    whoChangedIt: unique(records.map((item) => item.actorUserId).filter(isString)),
    whichAgentsUsedIt: unique(records.map((item) => item.actorAgentId).filter(isString)),
    whichModelsInterpretedIt: unique(records.map((item) => item.modelId).filter(isString)),
    whichDecisionsDependedOnIt: unique(
      records
        .filter((item) => item.stage === 'decision')
        .map((item) => item.relatedTaskId ?? item.relatedMeetingId)
        .filter(isString),
    ),
    stages: records.map((item) => item.stage),
  };
}

export function listKnowledgeSources(state: CivilizationState, actor: ActorContext): KnowledgeSource[] {
  return visibleTo(state, actor, state.knowledgeSources);
}

export function requireKnowledgeSource(
  state: CivilizationState,
  universeId: string,
  knowledgeSourceId: string,
): KnowledgeSource {
  const source = state.knowledgeSources.find((item) => item.id === knowledgeSourceId);
  if (!source) refuse('knowledge_source_unknown', knowledgeSourceId);
  if (source.universeId !== universeId) refuse('tenancy_cross_universe_blocked', knowledgeSourceId);
  return source;
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function isString(value: string | null): value is string {
  return typeof value === 'string' && value.length > 0;
}

function unique(values: readonly string[]) {
  return [...new Set(values)];
}
