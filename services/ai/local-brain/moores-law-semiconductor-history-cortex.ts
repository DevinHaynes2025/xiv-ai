/**
 * 62L-EG Module B — Moore's Law & Semiconductor History Cortex.
 * History, trends, compute economics; authorized sources only;
 * trend ≠ guaranteed future; analytical ≠ fab remote control.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  COMPUTE_ECONOMICS_ANALYTICAL,
  MAX_HISTORY_EVENTS,
  SEMICONDUCTOR_AUTHORIZED_SOURCES,
  TREND_NEQ_GUARANTEED_FUTURE,
  type EgActor,
  type EgEvidenceState,
} from './cognitive-operations-backbone-types';

export type SemiconductorHistoryRecord = {
  id: string;
  topic: string;
  sourceAuthorized: boolean;
  status: 'ok' | 'denied';
  state: EgEvidenceState;
  reason: string;
  at: string;
};

export type TrendProjection = {
  id: string;
  topic: string;
  claimGuaranteedFuture: boolean;
  status: 'labeled_trend' | 'denied';
  state: EgEvidenceState;
  reason: string;
  guaranteed: false;
  at: string;
};

export type ComputeEconomicsAnalysis = {
  id: string;
  subject: string;
  claimFabControl: boolean;
  status: 'advisory_only' | 'denied';
  state: EgEvidenceState;
  reason: string;
  fabControlEnabled: false;
  at: string;
};

type Store = {
  history: SemiconductorHistoryRecord[];
  trends: TrendProjection[];
  economics: ComputeEconomicsAnalysis[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'moores-law-semiconductor-history-cortex.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    history: [],
    trends: [],
    economics: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function mooresLawSemiconductorHistoryCortexHonesty() {
  return {
    authorizedSourcesOnly: true,
    trendNeqGuaranteedFuture: true,
    computeEconomicsAnalyticalOnly: true,
    fabControlEnabled: false,
  };
}

export async function recordSemiconductorHistory(input: {
  topic: string;
  sourceAuthorized: boolean;
  root: string;
  actor: EgActor;
}): Promise<SemiconductorHistoryRecord> {
  const store = await load(input.root);
  void input.actor;
  if (store.history.length >= MAX_HISTORY_EVENTS) {
    throw new Error('MAX_HISTORY_EVENTS_REACHED');
  }
  const ok = input.sourceAuthorized;
  const rec: SemiconductorHistoryRecord = {
    id: id('egsemi'),
    topic: input.topic.trim(),
    sourceAuthorized: ok,
    status: ok ? 'ok' : 'denied',
    state: ok ? 'HISTORICAL_ANALYTICAL' : 'DENIED',
    reason: SEMICONDUCTOR_AUTHORIZED_SOURCES,
    at: new Date().toISOString(),
  };
  store.history.push(rec);
  await save(input.root, store);
  return rec;
}

export async function projectSemiconductorTrend(input: {
  topic: string;
  claimGuaranteedFuture?: boolean;
  root: string;
  actor: EgActor;
}): Promise<TrendProjection> {
  const store = await load(input.root);
  void input.actor;
  if (store.trends.length >= MAX_HISTORY_EVENTS) {
    throw new Error('MAX_HISTORY_EVENTS_REACHED');
  }
  const claim = Boolean(input.claimGuaranteedFuture);
  const trend: TrendProjection = {
    id: id('egtrend'),
    topic: input.topic.trim(),
    claimGuaranteedFuture: claim,
    status: claim ? 'denied' : 'labeled_trend',
    state: claim ? 'DENIED' : 'LABELED_TREND',
    reason: TREND_NEQ_GUARANTEED_FUTURE,
    guaranteed: false,
    at: new Date().toISOString(),
  };
  store.trends.push(trend);
  await save(input.root, store);
  return trend;
}

export async function analyzeComputeEconomics(input: {
  subject: string;
  claimFabControl?: boolean;
  root: string;
  actor: EgActor;
}): Promise<ComputeEconomicsAnalysis> {
  const store = await load(input.root);
  void input.actor;
  if (store.economics.length >= MAX_HISTORY_EVENTS) {
    throw new Error('MAX_HISTORY_EVENTS_REACHED');
  }
  const claim = Boolean(input.claimFabControl);
  const analysis: ComputeEconomicsAnalysis = {
    id: id('egecon'),
    subject: input.subject.trim(),
    claimFabControl: claim,
    status: claim ? 'denied' : 'advisory_only',
    state: claim ? 'DENIED' : 'ADVISORY_ONLY',
    reason: COMPUTE_ECONOMICS_ANALYTICAL,
    fabControlEnabled: false,
    at: new Date().toISOString(),
  };
  store.economics.push(analysis);
  await save(input.root, store);
  return analysis;
}
