/**
 * 62L-CT B — Multi-Model Training Federation
 * Local-first multi-model training/evaluation; sealed never silent cloud.
 * Unknown-rights training DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CT_LOCKS,
  HONESTY_BANNER,
  SEALED_SILENT_CLOUD_TRAINING_DENIED,
  UNKNOWN_RIGHTS_TRAINING_DENIED,
  type CtActor,
  type RightsClass,
} from './ai-research-civilization-os-types';

export type TrainingDataset = {
  id: string;
  label: string;
  rights: RightsClass;
  sealed: boolean;
  status: 'accepted' | 'denied';
  reason: string;
  createdAt: string;
};

export type TrainingJob = {
  id: string;
  modelId: string;
  datasetId: string;
  mode: 'local' | 'sealed' | 'cloud_requested';
  silentCloudFallbackRequested: boolean;
  status: 'queued_local' | 'denied' | 'evaluated_local';
  reason: string;
  createdAt: string;
};

export type EvalJob = {
  id: string;
  modelId: string;
  mode: 'local' | 'sealed' | 'cloud_requested';
  silentCloudFallbackRequested: boolean;
  status: 'evaluated_local' | 'denied';
  reason: string;
  createdAt: string;
};

type Store = {
  datasets: TrainingDataset[];
  jobs: TrainingJob[];
  evals: EvalJob[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-model-training-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { datasets: [], jobs: [], evals: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function trainingFederationHonesty() {
  return {
    banner: HONESTY_BANNER,
    localFirst: CT_LOCKS.LOCAL_FIRST,
    unknownRightsTraining: CT_LOCKS.UNKNOWN_RIGHTS_TRAINING,
    sealedSilentCloud: CT_LOCKS.SEALED_SILENT_CLOUD_TRAINING_EVAL,
    l4AutonomyEnabled: CT_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

export async function registerTrainingDataset(input: {
  label: string;
  rights: RightsClass;
  sealed?: boolean;
  root: string;
  actor: CtActor;
}): Promise<TrainingDataset> {
  const store = await load(input.root);
  const unknown =
    input.rights === 'unknown' ||
    input.rights === 'restricted' ||
    input.rights === 'stolen';
  const row: TrainingDataset = {
    id: id('ds'),
    label: input.label,
    rights: input.rights,
    sealed: Boolean(input.sealed),
    status: unknown ? 'denied' : 'accepted',
    reason: unknown
      ? UNKNOWN_RIGHTS_TRAINING_DENIED
      : 'TRAINING_DATASET_RIGHTS_KNOWN_LOCAL_FIRST',
    createdAt: new Date().toISOString(),
  };
  store.datasets.push(row);
  await save(input.root, store);
  void input.actor;
  return row;
}

export async function enqueueTrainingJob(input: {
  modelId: string;
  datasetId: string;
  mode: 'local' | 'sealed' | 'cloud_requested';
  silentCloudFallbackRequested?: boolean;
  root: string;
  actor: CtActor;
}): Promise<TrainingJob> {
  const store = await load(input.root);
  const ds = store.datasets.find((d) => d.id === input.datasetId);
  if (!ds || ds.status === 'denied') {
    const denied: TrainingJob = {
      id: id('train'),
      modelId: input.modelId,
      datasetId: input.datasetId,
      mode: input.mode,
      silentCloudFallbackRequested: Boolean(input.silentCloudFallbackRequested),
      status: 'denied',
      reason: UNKNOWN_RIGHTS_TRAINING_DENIED,
      createdAt: new Date().toISOString(),
    };
    store.jobs.push(denied);
    await save(input.root, store);
    return denied;
  }

  const silentCloud =
    Boolean(input.silentCloudFallbackRequested) &&
    (input.mode === 'sealed' || input.mode === 'cloud_requested' || ds.sealed);

  if (silentCloud || (ds.sealed && input.mode === 'cloud_requested')) {
    const denied: TrainingJob = {
      id: id('train'),
      modelId: input.modelId,
      datasetId: input.datasetId,
      mode: input.mode,
      silentCloudFallbackRequested: Boolean(input.silentCloudFallbackRequested),
      status: 'denied',
      reason: SEALED_SILENT_CLOUD_TRAINING_DENIED,
      createdAt: new Date().toISOString(),
    };
    store.jobs.push(denied);
    await save(input.root, store);
    return denied;
  }

  const job: TrainingJob = {
    id: id('train'),
    modelId: input.modelId,
    datasetId: input.datasetId,
    mode: input.mode === 'cloud_requested' ? 'local' : input.mode,
    silentCloudFallbackRequested: false,
    status: 'queued_local',
    reason: 'LOCAL_FIRST_TRAINING_QUEUED',
    createdAt: new Date().toISOString(),
  };
  store.jobs.push(job);
  await save(input.root, store);
  void input.actor;
  return job;
}

export async function runLocalEval(input: {
  modelId: string;
  mode: 'local' | 'sealed' | 'cloud_requested';
  silentCloudFallbackRequested?: boolean;
  sealed?: boolean;
  root: string;
  actor: CtActor;
}): Promise<EvalJob> {
  const store = await load(input.root);
  const sealed = Boolean(input.sealed) || input.mode === 'sealed';
  if (
    Boolean(input.silentCloudFallbackRequested) &&
    (sealed || input.mode === 'cloud_requested')
  ) {
    const denied: EvalJob = {
      id: id('eval'),
      modelId: input.modelId,
      mode: input.mode,
      silentCloudFallbackRequested: true,
      status: 'denied',
      reason: SEALED_SILENT_CLOUD_TRAINING_DENIED,
      createdAt: new Date().toISOString(),
    };
    store.evals.push(denied);
    await save(input.root, store);
    return denied;
  }
  const row: EvalJob = {
    id: id('eval'),
    modelId: input.modelId,
    mode: 'local',
    silentCloudFallbackRequested: false,
    status: 'evaluated_local',
    reason: 'LOCAL_FIRST_EVAL_COMPLETE',
    createdAt: new Date().toISOString(),
  };
  store.evals.push(row);
  await save(input.root, store);
  void input.actor;
  return row;
}
