import { evaluateOfflineTask, type OfflineTaskRequirement } from './offline-policy';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import type { EvidenceState } from './evidence-promotion-gate';

export type SyncJobState = 'queued' | 'local_executable' | 'waiting_data' | 'unavailable' | 'denied';

export type OfflineSyncJob = {
  id: string;
  tenantId: string;
  universeId: string;
  summary: string;
  requirement: OfflineTaskRequirement;
  state: SyncJobState;
  evidenceState: EvidenceState;
  createdAt: string;
  productionAuthorization: false;
};

type Store = { jobs: OfflineSyncJob[] };

function storePath(root: string) {
  return xivLocalPath(root, 'offline-sync-queue.json');
}

async function load(root: string) {
  const parsed = await readJsonFile<Store>(storePath(root), { jobs: [] });
  return Array.isArray(parsed.jobs) ? parsed.jobs : [];
}

async function save(root: string, jobs: OfflineSyncJob[]) {
  await writeJsonFileAtomic(storePath(root), { jobs: jobs.slice(-10_000) });
}

function toJobState(decision: ReturnType<typeof evaluateOfflineTask>): { state: SyncJobState; evidenceState: EvidenceState } {
  if (decision.allowed) return { state: 'local_executable', evidenceState: 'NOT_TESTED' };
  if (decision.state === 'WAITING_DATA') return { state: 'waiting_data', evidenceState: 'WAITING_DATA' };
  if (decision.state === 'DENIED') return { state: 'denied', evidenceState: 'FAIL' };
  return { state: 'unavailable', evidenceState: 'UNAVAILABLE' };
}

export async function enqueueOfflineSync(input: {
  tenantId: string;
  universeId: string;
  summary: string;
  requirement: OfflineTaskRequirement;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  const decision = evaluateOfflineTask(input.requirement);
  const mapped = toJobState(decision);
  const job: OfflineSyncJob = {
    id: cortexId('sync'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: input.summary.trim(),
    requirement: { ...input.requirement },
    state: mapped.state === 'local_executable' ? 'queued' : mapped.state,
    evidenceState: mapped.evidenceState,
    createdAt: new Date().toISOString(),
    productionAuthorization: false,
  };
  const jobs = await load(root);
  jobs.push(job);
  await save(root, jobs);
  return { job, decision };
}

export async function drainOfflineSyncQueue(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const jobs = await load(root);
  const drained: OfflineSyncJob[] = [];
  for (const job of jobs) {
    if (job.tenantId !== input.tenantId || job.universeId !== input.universeId) continue;
    if (job.state !== 'queued') continue;
    const decision = evaluateOfflineTask(job.requirement);
    if (decision.allowed) {
      job.state = 'local_executable';
      job.evidenceState = 'PASS';
    } else {
      const mapped = toJobState(decision);
      job.state = mapped.state;
      job.evidenceState = mapped.evidenceState;
    }
    drained.push(job);
  }
  await save(root, jobs);
  return drained;
}

export async function listOfflineSyncJobs(input: {
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const jobs = await load(input.root ?? process.cwd());
  return jobs.filter((job) => job.tenantId === input.tenantId && job.universeId === input.universeId);
}
