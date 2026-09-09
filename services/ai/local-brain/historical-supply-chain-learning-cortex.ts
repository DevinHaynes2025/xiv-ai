/**
 * 62L-EE Module C — Historical Supply Chain Learning Cortex.
 * Historical learning; temporal graphs; causation honesty.
 * Correlation ≠ causation; pathway outcome links evidence-labeled.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  HISTORICAL_LEARNING_LABELED,
  MAX_LEARNING_EVENTS,
  PATHWAY_OUTCOME_CORRELATION,
  TEMPORAL_CORRELATION_ONLY,
  type EeActor,
  type EeEvidenceState,
} from './data-nervous-system-types';

export type HistoricalLearningEvent = {
  id: string;
  subject: string;
  sourceAuthorized: boolean;
  causationClaimed: boolean;
  status: 'ok' | 'denied';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

export type TemporalGraphEdge = {
  id: string;
  fromNode: string;
  toNode: string;
  claimCausation: boolean;
  status: 'ok' | 'denied';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

export type PathwayOutcomeLink = {
  id: string;
  pathwayId: string;
  outcomeId: string;
  claimCausation: boolean;
  status: 'ok' | 'denied';
  state: EeEvidenceState;
  reason: string;
  at: string;
};

type Store = {
  learning: HistoricalLearningEvent[];
  edges: TemporalGraphEdge[];
  outcomes: PathwayOutcomeLink[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'historical-supply-chain-learning-cortex.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    learning: [],
    edges: [],
    outcomes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function historicalSupplyChainLearningCortexHonesty() {
  return {
    historicalLearningEvidenceLabeled: true,
    temporalGraphCorrelationNeqCausation: true,
    pathwayOutcomeCorrelationOnly: true,
    correlationNeqCausation: true,
  };
}

export async function recordHistoricalLearning(input: {
  subject: string;
  sourceAuthorized: boolean;
  causationClaimed?: boolean;
  root: string;
  actor: EeActor;
}): Promise<HistoricalLearningEvent> {
  const store = await load(input.root);
  void input.actor;
  if (store.learning.length >= MAX_LEARNING_EVENTS) {
    throw new Error('MAX_LEARNING_EVENTS_REACHED');
  }
  const causation = Boolean(input.causationClaimed);
  const authorized = input.sourceAuthorized;
  const event: HistoricalLearningEvent = {
    id: id('eehist'),
    subject: input.subject.trim(),
    sourceAuthorized: authorized,
    causationClaimed: causation,
    status: !authorized || causation ? 'denied' : 'ok',
    state: !authorized
      ? 'DENIED'
      : causation
        ? 'ATTRIBUTION_UNSAFE'
        : 'CORRELATION_ONLY',
    reason: HISTORICAL_LEARNING_LABELED,
    at: new Date().toISOString(),
  };
  store.learning.push(event);
  await save(input.root, store);
  return event;
}

export async function addTemporalGraphEdge(input: {
  fromNode: string;
  toNode: string;
  claimCausation?: boolean;
  root: string;
  actor: EeActor;
}): Promise<TemporalGraphEdge> {
  const store = await load(input.root);
  void input.actor;
  if (store.edges.length >= MAX_LEARNING_EVENTS) {
    throw new Error('MAX_LEARNING_EVENTS_REACHED');
  }
  const claim = Boolean(input.claimCausation);
  const edge: TemporalGraphEdge = {
    id: id('eetemp'),
    fromNode: input.fromNode.trim(),
    toNode: input.toNode.trim(),
    claimCausation: claim,
    status: claim ? 'denied' : 'ok',
    state: claim ? 'ATTRIBUTION_UNSAFE' : 'CORRELATION_ONLY',
    reason: TEMPORAL_CORRELATION_ONLY,
    at: new Date().toISOString(),
  };
  store.edges.push(edge);
  await save(input.root, store);
  return edge;
}

export async function linkPathwayOutcome(input: {
  pathwayId: string;
  outcomeId: string;
  claimCausation?: boolean;
  root: string;
  actor: EeActor;
}): Promise<PathwayOutcomeLink> {
  const store = await load(input.root);
  void input.actor;
  if (store.outcomes.length >= MAX_LEARNING_EVENTS) {
    throw new Error('MAX_LEARNING_EVENTS_REACHED');
  }
  const claim = Boolean(input.claimCausation);
  const link: PathwayOutcomeLink = {
    id: id('eeout'),
    pathwayId: input.pathwayId.trim(),
    outcomeId: input.outcomeId.trim(),
    claimCausation: claim,
    status: claim ? 'denied' : 'ok',
    state: claim ? 'ATTRIBUTION_UNSAFE' : 'CORRELATION_ONLY',
    reason: PATHWAY_OUTCOME_CORRELATION,
    at: new Date().toISOString(),
  };
  store.outcomes.push(link);
  await save(input.root, store);
  return link;
}
