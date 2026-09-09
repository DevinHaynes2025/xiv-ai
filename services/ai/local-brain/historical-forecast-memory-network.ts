/**
 * 62L-DI Historical Forecast Memory Network —
 * Learns from past prediction errors without rewriting history as fact.
 */
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DI_LOCKS, FORECAST_MEMORY_RELABEL_DENIED, HONESTY_BANNER, MAX_FORECAST_MEMORIES,
  PREDICTION_MUST_REMAIN_PROBABILISTIC, type DiActor, type ForecastEpistemicLabel,
} from './personalized-intelligence-companion-os-types';

export type ForecastMemoryRecord = {
  id: string; networkId: string; forecastId: string;
  originalLabel: ForecastEpistemicLabel; currentLabel: ForecastEpistemicLabel;
  probability: number; labeledVerifiedFact: false; errorLearned: boolean;
  calibrationNote: string | null; historyRewrittenAsFact: false;
  status: 'RECORDED' | 'UPDATED' | 'DENIED'; reason: string; createdAt: string; updatedAt: string;
};
export type HistoricalForecastMemoryNetwork = {
  id: string; orgId: string; tenantId: string; universeId: string; createdAt: string;
};
type Store = { networks: HistoricalForecastMemoryNetwork[]; memories: ForecastMemoryRecord[] };

function storePath(root: string) { return xivLocalPath(root, 'historical-forecast-memory-network.json'); }
async function load(root: string): Promise<Store> { return readJsonFile<Store>(storePath(root), { networks: [], memories: [] }); }
async function save(root: string, store: Store) { await writeJsonFileAtomic(storePath(root), store); }
function id(prefix: string) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
function clampProb(p: number): number { if (!Number.isFinite(p)) return 0.5; return Math.min(1, Math.max(0, p)); }

export function historicalForecastMemoryHonesty() {
  return {
    banner: HONESTY_BANNER,
    forecastMemoryRewritesHistoryAsFact: DI_LOCKS.FORECAST_MEMORY_REWRITES_HISTORY_AS_FACT,
    pastProbabilisticRelabelAsVerifiedFact: DI_LOCKS.PAST_PROBABILISTIC_FORECAST_RELABEL_AS_VERIFIED_FACT,
    predictionsRemainProbabilistic: DI_LOCKS.PREDICTIONS_REMAIN_PROBABILISTIC,
    forecastLabeledAsVerifiedFact: DI_LOCKS.FORECAST_LABELED_AS_VERIFIED_FACT,
  };
}

export async function bootstrapHistoricalForecastMemoryNetwork(input: {
  orgId: string; tenantId: string; universeId: string; root: string; actor: DiActor;
}): Promise<HistoricalForecastMemoryNetwork> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.networks.find((n) => n.orgId === input.orgId && n.tenantId === input.tenantId && n.universeId === input.universeId);
  if (existing) return existing;
  const network: HistoricalForecastMemoryNetwork = { id: id('difmn'), orgId: input.orgId, tenantId: input.tenantId, universeId: input.universeId, createdAt: new Date().toISOString() };
  store.networks.push(network); await save(input.root, store); return network;
}

export async function recordProbabilisticForecast(input: {
  networkId: string; forecastId: string; probability: number; label?: ForecastEpistemicLabel;
  claimVerifiedFact?: boolean; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; memory?: ForecastMemoryRecord }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const network = store.networks.find((n) => n.id === input.networkId);
  if (!network) return { accepted: false, reason: 'FORECAST_MEMORY_NETWORK_NOT_FOUND' };
  if (store.memories.length >= MAX_FORECAST_MEMORIES) return { accepted: false, reason: 'MAX_FORECAST_MEMORIES_BOUNDED' };
  if (input.claimVerifiedFact === true || input.label === 'VERIFIED_FACT') {
    const memory: ForecastMemoryRecord = {
      id: id('difm'), networkId: network.id, forecastId: input.forecastId,
      originalLabel: 'PROBABILISTIC', currentLabel: 'PROBABILISTIC', probability: clampProb(input.probability),
      labeledVerifiedFact: false, errorLearned: false, calibrationNote: null, historyRewrittenAsFact: false,
      status: 'DENIED', reason: PREDICTION_MUST_REMAIN_PROBABILISTIC, createdAt: now, updatedAt: now,
    };
    store.memories.push(memory); await save(input.root, store);
    return { accepted: false, reason: PREDICTION_MUST_REMAIN_PROBABILISTIC, memory };
  }
  const label: ForecastEpistemicLabel = input.label && input.label !== 'VERIFIED_FACT' ? input.label : 'PROBABILISTIC';
  const memory: ForecastMemoryRecord = {
    id: id('difm'), networkId: network.id, forecastId: input.forecastId,
    originalLabel: label, currentLabel: label, probability: clampProb(input.probability),
    labeledVerifiedFact: false, errorLearned: false, calibrationNote: null, historyRewrittenAsFact: false,
    status: 'RECORDED', reason: 'PROBABILISTIC_FORECAST_RECORDED', createdAt: now, updatedAt: now,
  };
  store.memories.push(memory); await save(input.root, store);
  return { accepted: true, reason: 'PROBABILISTIC_FORECAST_RECORDED', memory };
}

export async function updateForecastMemoryFromError(input: {
  memoryId: string; observedOutcome?: string; relabelAsVerifiedFact?: boolean; root: string; actor: DiActor;
}): Promise<{ accepted: boolean; reason: string; memory?: ForecastMemoryRecord }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const memory = store.memories.find((m) => m.id === input.memoryId);
  if (!memory) return { accepted: false, reason: 'FORECAST_MEMORY_NOT_FOUND' };
  if (input.relabelAsVerifiedFact === true) {
    memory.status = 'DENIED'; memory.updatedAt = now; memory.reason = FORECAST_MEMORY_RELABEL_DENIED;
    await save(input.root, store);
    return { accepted: false, reason: FORECAST_MEMORY_RELABEL_DENIED, memory };
  }
  memory.errorLearned = true;
  memory.calibrationNote = input.observedOutcome?.trim() || 'ERROR_LEARNED_CALIBRATION_UPDATE';
  memory.currentLabel = 'ERROR_LEARNED';
  memory.labeledVerifiedFact = false;
  memory.historyRewrittenAsFact = false;
  memory.status = 'UPDATED';
  memory.reason = 'FORECAST_MEMORY_ERROR_LEARNED_WITHOUT_FACT_REWRITE';
  memory.updatedAt = now;
  await save(input.root, store);
  return { accepted: true, reason: 'FORECAST_MEMORY_ERROR_LEARNED_WITHOUT_FACT_REWRITE', memory };
}
