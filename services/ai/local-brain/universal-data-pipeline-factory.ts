/**
 * 62L-CE Universal Data Pipeline Factory — stages move approved information only.
 * Unapproved sources rejected before enrichment. Unauthorized archive mining DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CE_LOCKS,
  HONESTY_BANNER,
  PIPELINE_STAGES,
  PIPELINE_UNAPPROVED_REJECTED,
  type CeActor,
  type PipelineStage,
} from './knowledge-excavation-memory-lake-types';

export type PipelineJob = {
  id: string;
  sourceLabel: string;
  approved: boolean;
  currentStage: PipelineStage | 'rejected' | 'complete';
  stagesCompleted: PipelineStage[];
  status: 'running' | 'rejected' | 'complete' | 'denied';
  reason: string;
  enrichmentReached: false | true;
  createdAt: string;
  updatedAt: string;
};

type Store = {
  jobs: PipelineJob[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-data-pipeline-factory.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { jobs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const PRE_ENRICHMENT: PipelineStage[] = ['extraction', 'normalization', 'validation', 'dedupe'];
const POST_VALIDATION: PipelineStage[] = ['enrichment', 'indexing', 'retention', 'recovery'];

export function pipelineFactoryHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CE_LOCKS.L4_AUTONOMY_ENABLED,
    pipelineApprovedOnly: CE_LOCKS.PIPELINE_APPROVED_ONLY,
    unapprovedEnrichment: CE_LOCKS.PIPELINE_UNAPPROVED_ENRICHMENT,
    stages: PIPELINE_STAGES,
  };
}

export async function startPipelineJob(input: {
  sourceLabel: string;
  approved: boolean;
  root: string;
  actor: CeActor;
}): Promise<PipelineJob> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const job: PipelineJob = {
    id: id('pipe'),
    sourceLabel: input.sourceLabel,
    approved: input.approved === true,
    currentStage: 'extraction',
    stagesCompleted: [],
    status: 'running',
    reason: 'PIPELINE_STARTED',
    enrichmentReached: false,
    createdAt: now,
    updatedAt: now,
  };
  store.jobs.push(job);
  await save(input.root, store);
  return job;
}

export async function advancePipeline(input: {
  jobId: string;
  root: string;
  actor: CeActor;
}): Promise<PipelineJob> {
  const store = await load(input.root);
  const job = store.jobs.find((j) => j.id === input.jobId);
  if (!job) throw new Error('PIPELINE_JOB_NOT_FOUND');
  if (job.status === 'rejected' || job.status === 'complete' || job.status === 'denied') {
    return job;
  }

  const nextIndex = job.stagesCompleted.length;
  if (nextIndex >= PIPELINE_STAGES.length) {
    job.status = 'complete';
    job.currentStage = 'complete';
    job.reason = 'PIPELINE_COMPLETE_APPROVED';
    job.updatedAt = new Date().toISOString();
    await save(input.root, store);
    return job;
  }

  const stage = PIPELINE_STAGES[nextIndex];

  // Reject unapproved before enrichment (after validation/dedupe gate)
  if (stage === 'enrichment' && !job.approved) {
    job.status = 'rejected';
    job.currentStage = 'rejected';
    job.reason = PIPELINE_UNAPPROVED_REJECTED;
    job.enrichmentReached = false;
    job.updatedAt = new Date().toISOString();
    await save(input.root, store);
    return job;
  }

  // Also reject if somehow trying to skip into enrichment+ without approval
  if ((POST_VALIDATION as readonly string[]).includes(stage) && !job.approved) {
    job.status = 'rejected';
    job.currentStage = 'rejected';
    job.reason = PIPELINE_UNAPPROVED_REJECTED;
    job.enrichmentReached = false;
    job.updatedAt = new Date().toISOString();
    await save(input.root, store);
    return job;
  }

  job.stagesCompleted.push(stage);
  job.currentStage = stage;
  if (stage === 'enrichment') job.enrichmentReached = true;
  job.reason = `STAGE_${stage.toUpperCase()}_OK`;
  job.updatedAt = new Date().toISOString();

  if (job.stagesCompleted.length === PIPELINE_STAGES.length) {
    job.status = 'complete';
    job.currentStage = 'complete';
    job.reason = 'PIPELINE_COMPLETE_APPROVED';
  }

  await save(input.root, store);
  return job;
}

export async function runPipelineToEnrichmentOrReject(input: {
  sourceLabel: string;
  approved: boolean;
  root: string;
  actor: CeActor;
}): Promise<PipelineJob> {
  let job = await startPipelineJob(input);
  // Run through pre-enrichment stages
  for (let i = 0; i < PRE_ENRICHMENT.length; i++) {
    job = await advancePipeline({ jobId: job.id, root: input.root, actor: input.actor });
  }
  // Next advance attempts enrichment — unapproved rejected here
  job = await advancePipeline({ jobId: job.id, root: input.root, actor: input.actor });
  return job;
}

export async function runFullApprovedPipeline(input: {
  sourceLabel: string;
  root: string;
  actor: CeActor;
}): Promise<PipelineJob> {
  let job = await startPipelineJob({
    sourceLabel: input.sourceLabel,
    approved: true,
    root: input.root,
    actor: input.actor,
  });
  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    job = await advancePipeline({ jobId: job.id, root: input.root, actor: input.actor });
  }
  return job;
}
