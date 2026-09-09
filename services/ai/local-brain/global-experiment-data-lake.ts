/**
 * 62L-CV Global Experiment Data Lake —
 * Governed experiment data lake (checkpoints, results, negatives).
 * Unknown-rights intake DENIED. Negatives remain searchable.
 * Reproducibility metadata required for VERIFIED marking.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CV_LOCKS,
  HONESTY_BANNER,
  NEGATIVE_RESULT_KEPT_SEARCHABLE,
  UNKNOWN_RIGHTS_INTAKE_DENIED,
  type CvActor,
  type RightsClass,
} from './distributed-intelligence-laboratory-os-types';

export type ExperimentRecord = {
  id: string;
  experimentId: string;
  kind: 'checkpoint' | 'result' | 'negative';
  rightsClass: RightsClass;
  reproducibilityMetadata: Record<string, string>;
  searchable: boolean;
  verified: boolean;
  status: 'ACCEPTED' | 'DENIED' | 'SEARCHABLE_NEGATIVE';
  reason: string;
  createdAt: string;
};

export type LakeResult = {
  accepted: boolean;
  reason: string;
  record?: ExperimentRecord;
  at: string;
};

type Store = { records: ExperimentRecord[] };

function storePath(root: string) {
  return xivLocalPath(root, 'global-experiment-data-lake.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { records: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function experimentDataLakeHonesty() {
  return {
    banner: HONESTY_BANNER,
    unknownRightsIntake: CV_LOCKS.UNKNOWN_RIGHTS_DATASET_INTAKE,
    negativesSearchable: CV_LOCKS.NEGATIVE_RESULTS_SEARCHABLE,
    negativesDiscarded: CV_LOCKS.NEGATIVE_RESULTS_DISCARDED,
  };
}

export async function intakeExperimentDataset(input: {
  experimentId: string;
  kind: 'checkpoint' | 'result' | 'negative';
  rightsClass: RightsClass;
  reproducibilityMetadata?: Record<string, string>;
  root: string;
  actor: CvActor;
}): Promise<LakeResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const meta = input.reproducibilityMetadata ?? {};

  if (
    input.rightsClass === 'unknown_rights' ||
    input.rightsClass === 'restricted' ||
    input.rightsClass === 'stolen_or_leaked'
  ) {
    const denied: ExperimentRecord = {
      id: id('gedl'),
      experimentId: input.experimentId,
      kind: input.kind,
      rightsClass: input.rightsClass,
      reproducibilityMetadata: meta,
      searchable: false,
      verified: false,
      status: 'DENIED',
      reason: UNKNOWN_RIGHTS_INTAKE_DENIED,
      createdAt: now,
    };
    store.records.push(denied);
    await save(input.root, store);
    return { accepted: false, reason: UNKNOWN_RIGHTS_INTAKE_DENIED, record: denied, at: now };
  }

  const isNegative = input.kind === 'negative';
  const hasRepro = Object.keys(meta).length > 0;
  const record: ExperimentRecord = {
    id: id('gedl'),
    experimentId: input.experimentId,
    kind: input.kind,
    rightsClass: input.rightsClass,
    reproducibilityMetadata: meta,
    searchable: true,
    verified: hasRepro && !isNegative,
    status: isNegative ? 'SEARCHABLE_NEGATIVE' : 'ACCEPTED',
    reason: isNegative
      ? NEGATIVE_RESULT_KEPT_SEARCHABLE
      : hasRepro
        ? 'EXPERIMENT_RECORD_ACCEPTED_WITH_REPRO'
        : 'EXPERIMENT_ACCEPTED_NOT_VERIFIED_MISSING_REPRO',
    createdAt: now,
  };
  store.records.push(record);
  await save(input.root, store);
  return {
    accepted: true,
    reason: record.reason,
    record,
    at: now,
  };
}

export async function searchNegatives(input: {
  root: string;
  query?: string;
}): Promise<ExperimentRecord[]> {
  const store = await load(input.root);
  const q = (input.query ?? '').trim().toLowerCase();
  return store.records.filter(
    (r) =>
      r.kind === 'negative' &&
      r.searchable &&
      r.status === 'SEARCHABLE_NEGATIVE' &&
      (!q || r.experimentId.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q)),
  );
}
