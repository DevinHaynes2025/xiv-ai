import { evaluateOfflineTask, type OfflineTaskRequirement } from './offline-policy';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type ResearchJobState = 'queued' | 'running' | 'completed' | 'waiting_data' | 'unavailable' | 'denied' | 'failed';

export type ResearchJob = {
  id: string;
  tenantId: string;
  universeId: string;
  objective: string;
  state: ResearchJobState;
  preferOffline: true;
  productionAuthorization: false;
  createdAt: string;
  updatedAt: string;
  reason?: string;
};

type Store = { jobs: ResearchJob[] };

function jobsPath(root: string) {
  return xivLocalPath(root, 'research-resilience-jobs.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(jobsPath(root), { jobs: [] });
  return Array.isArray(parsed.jobs) ? parsed.jobs : [];
}

async function save(root: string, jobs: ResearchJob[]) {
  await writeJsonFileAtomic(jobsPath(root), { jobs: jobs.slice(-5_000) });
}

export async function enqueueResearchJob(input: {
  tenantId: string;
  universeId: string;
  objective: string;
  requirement?: Partial<OfflineTaskRequirement>;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const decision = evaluateOfflineTask({
    needsInternet: input.requirement?.needsInternet === true,
    needsCloudProvider: input.requirement?.needsCloudProvider === true,
    needsExternalFreshness: input.requirement?.needsExternalFreshness === true,
    needsProductionWrite: input.requirement?.needsProductionWrite === true,
    needsPermissionChange: input.requirement?.needsPermissionChange === true,
    classification: input.requirement?.classification ?? 'internal',
  });
  const now = new Date().toISOString();
  const job: ResearchJob = {
    id: cortexId('rjob'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    objective: input.objective,
    state: decision.allowed ? 'queued' : decision.state === 'WAITING_DATA' ? 'waiting_data' : decision.state === 'DENIED' ? 'denied' : 'unavailable',
    preferOffline: true,
    productionAuthorization: false,
    createdAt: now,
    updatedAt: now,
    reason: decision.reason,
  };
  const root = input.root ?? process.cwd();
  const jobs = await load(root);
  jobs.push(job);
  await save(root, jobs);
  return job;
}

export async function recoverInterruptedResearchJobs(root = process.cwd()) {
  const jobs = await load(root);
  let recovered = 0;
  for (const job of jobs) {
    if (job.state === 'running') {
      job.state = 'queued';
      job.updatedAt = new Date().toISOString();
      recovered += 1;
    }
  }
  await save(root, jobs);
  return recovered;
}

export async function completeResearchJob(id: string, tenantId: string, universeId: string, root?: string) {
  const resolvedRoot = root ?? process.cwd();
  const jobs = await load(resolvedRoot);
  const job = jobs.find((item) => item.id === id && item.tenantId === tenantId && item.universeId === universeId);
  if (!job) throw new Error('RESEARCH_JOB_NOT_FOUND');
  if (job.state === 'denied' || job.state === 'waiting_data' || job.state === 'unavailable') return job;
  job.state = 'completed';
  job.updatedAt = new Date().toISOString();
  await save(resolvedRoot, jobs);
  return job;
}

export async function listResearchJobs(root = process.cwd()) {
  return load(root);
}

export async function markResearchJobRunning(id: string, root?: string) {
  const resolvedRoot = root ?? process.cwd();
  const jobs = await load(resolvedRoot);
  const job = jobs.find((item) => item.id === id);
  if (!job) throw new Error('RESEARCH_JOB_NOT_FOUND');
  if (job.state === 'queued') {
    job.state = 'running';
    job.updatedAt = new Date().toISOString();
    await save(resolvedRoot, jobs);
  }
  return job;
}
