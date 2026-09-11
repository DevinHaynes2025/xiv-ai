import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export type QueueJob = {
  id: string;
  tenantId: string;
  status: 'QUEUED' | 'RUNNING' | 'FAILED' | 'COMPLETED' | 'PAUSED_REVIEW';
  attempts: number;
  maxAttempts: number;
  checkpointId?: string;
  evidenceRefs: string[];
  requiresHumanApproval: boolean;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
};

const FILE = resolve(process.cwd(), '.xiv-runtime', 'queue', 'jobs.json');

export async function loadQueue(): Promise<QueueJob[]> {
  try { return JSON.parse(await readFile(FILE, 'utf8')) as QueueJob[]; } catch { return []; }
}

export async function saveQueue(jobs: QueueJob[]): Promise<void> {
  await mkdir(dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(jobs, null, 2), 'utf8');
}

export async function runOneQueueCycle(execute: (job: QueueJob) => Promise<boolean>): Promise<QueueJob[]> {
  const jobs = await loadQueue();
  const job = jobs.find(j => j.status === 'QUEUED' || j.status === 'FAILED');
  if (!job) return jobs;
  if (job.requiresHumanApproval || job.classification === 'TOP_SECRET') {
    job.status = 'PAUSED_REVIEW';
  } else if (job.attempts >= job.maxAttempts) {
    job.status = 'PAUSED_REVIEW';
  } else {
    job.status = 'RUNNING'; job.attempts += 1;
    try { job.status = (await execute(job)) ? 'COMPLETED' : 'FAILED'; } catch { job.status = 'FAILED'; }
  }
  await saveQueue(jobs);
  return jobs;
}
