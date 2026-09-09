/**
 * 62L-CU Distributed Experiment Memory — distributed experiment/checkpoint
 * memory; reproducible records; searchable negative results. Without
 * reproducibility metadata, never marked VERIFIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CU_LOCKS,
  EXPERIMENT_WITHOUT_REPRO_NOT_VERIFIED,
  HONESTY_BANNER,
  NEGATIVE_RESULT_KEPT_SEARCHABLE,
  type CuActor,
} from './cognitive-research-cloud-types';

export type ReproducibilityMetadata = {
  seed?: string | number;
  codeRef?: string;
  datasetRef?: string;
  envHash?: string;
  protocolRef?: string;
};

export type ExperimentRecord = {
  id: string;
  title: string;
  outcome: 'positive' | 'negative' | 'inconclusive';
  reproducibility: ReproducibilityMetadata | null;
  verificationState: 'DOCUMENTED' | 'IMPLEMENTED' | 'CANDIDATE' | 'VERIFIED' | 'NOT_VERIFIED';
  discarded: false;
  searchable: true;
  negativeKept: boolean;
  reason: string;
  createdAt: string;
};

export type ExperimentSearchHit = {
  id: string;
  title: string;
  outcome: ExperimentRecord['outcome'];
  verificationState: ExperimentRecord['verificationState'];
  negativeKept: boolean;
};

type Store = {
  experiments: ExperimentRecord[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-experiment-memory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { experiments: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function hasRepro(meta: ReproducibilityMetadata | null | undefined): boolean {
  if (!meta) return false;
  return Boolean(
    meta.seed !== undefined ||
      (meta.codeRef && meta.codeRef.trim()) ||
      (meta.datasetRef && meta.datasetRef.trim()) ||
      (meta.envHash && meta.envHash.trim()) ||
      (meta.protocolRef && meta.protocolRef.trim()),
  );
}

export function distributedExperimentMemoryHonesty() {
  return {
    banner: HONESTY_BANNER,
    requireRepro: CU_LOCKS.EXPERIMENTS_REQUIRE_REPRODUCIBILITY_METADATA,
    withoutReproMarkedVerified: CU_LOCKS.EXPERIMENT_WITHOUT_REPRO_MARKED_VERIFIED,
    negativeSearchable: CU_LOCKS.NEGATIVE_RESULTS_SEARCHABLE,
    negativeDiscarded: CU_LOCKS.NEGATIVE_RESULTS_DISCARDED,
  };
}

export async function recordExperiment(input: {
  title: string;
  outcome: 'positive' | 'negative' | 'inconclusive';
  reproducibility?: ReproducibilityMetadata | null;
  claimVerified?: boolean;
  root: string;
  actor: CuActor;
}): Promise<ExperimentRecord> {
  const store = await load(input.root);
  void input.actor;
  const repro = input.reproducibility ?? null;
  const reproOk = hasRepro(repro);
  const claimVerified = input.claimVerified === true;

  let verificationState: ExperimentRecord['verificationState'] = 'CANDIDATE';
  let reason = 'EXPERIMENT_RECORDED_WITH_REPRODUCIBILITY_METADATA';

  if (!reproOk) {
    verificationState = 'NOT_VERIFIED';
    reason = EXPERIMENT_WITHOUT_REPRO_NOT_VERIFIED;
  } else if (claimVerified && reproOk) {
    // Unit-level verified reproducibility metadata present — still not PRODUCTION_AUTHORIZED.
    verificationState = 'VERIFIED';
    reason = 'EXPERIMENT_REPRODUCIBILITY_METADATA_PRESENT_UNIT_VERIFIED';
  }

  if (input.outcome === 'negative') {
    reason =
      reproOk && verificationState === 'VERIFIED'
        ? NEGATIVE_RESULT_KEPT_SEARCHABLE
        : `${reason};${NEGATIVE_RESULT_KEPT_SEARCHABLE}`;
  }

  const record: ExperimentRecord = {
    id: id('exp'),
    title: input.title.trim(),
    outcome: input.outcome,
    reproducibility: repro,
    verificationState,
    discarded: false,
    searchable: true,
    negativeKept: input.outcome === 'negative',
    reason,
    createdAt: new Date().toISOString(),
  };
  store.experiments.push(record);
  await save(input.root, store);
  return record;
}

export async function searchExperiments(input: {
  query?: string;
  outcome?: 'positive' | 'negative' | 'inconclusive';
  includeNegative?: boolean;
  root: string;
  actor: CuActor;
}): Promise<ExperimentSearchHit[]> {
  const store = await load(input.root);
  void input.actor;
  const q = (input.query ?? '').trim().toLowerCase();
  const includeNegative = input.includeNegative !== false;

  return store.experiments
    .filter((e) => e.searchable && e.discarded === false)
    .filter((e) => (input.outcome ? e.outcome === input.outcome : true))
    .filter((e) => (includeNegative ? true : e.outcome !== 'negative'))
    .filter((e) => (q ? e.title.toLowerCase().includes(q) || e.id.includes(q) : true))
    .map((e) => ({
      id: e.id,
      title: e.title,
      outcome: e.outcome,
      verificationState: e.verificationState,
      negativeKept: e.negativeKept,
    }));
}

export async function discardNegativeResult(input: {
  experimentId: string;
  root: string;
  actor: CuActor;
}): Promise<{ status: 'denied'; reason: string; record: ExperimentRecord | null }> {
  const store = await load(input.root);
  void input.actor;
  const record = store.experiments.find((e) => e.id === input.experimentId) ?? null;
  // Hard deny discard of negative results — they remain searchable.
  return {
    status: 'denied',
    reason: NEGATIVE_RESULT_KEPT_SEARCHABLE,
    record,
  };
}
