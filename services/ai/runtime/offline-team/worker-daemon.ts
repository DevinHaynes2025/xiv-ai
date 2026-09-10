import type { OfflineAgentId } from './types';
import { OfflineWorkQueue } from './work-queue';
import { RecoveryJournal } from './recovery-journal';

export interface WorkerAdapter {
  agent: OfflineAgentId;
  canRunOffline: true;
  execute(job: { id: string; objective: string }): Promise<{ ok: boolean; evidence: readonly string[]; lesson?: string }>;
}

export interface WorkerTickResult {
  leased: number;
  completed: number;
  failed: number;
  lessons: readonly string[];
}

export const WORKER_DAEMON_GUARDRAILS = {
  offlineFirst: true,
  maxJobsPerTick: 8,
  productionMutationAllowed: false,
  destructiveActionAllowed: false,
  selfModifyAgentCodeAllowed: false,
} as const;

export async function runWorkerTick(input: {
  queue: OfflineWorkQueue;
  journal: RecoveryJournal;
  adapter: WorkerAdapter;
  now: string;
}): Promise<WorkerTickResult> {
  const leased = input.queue.lease(input.adapter.agent, WORKER_DAEMON_GUARDRAILS.maxJobsPerTick, input.now);
  let completed = 0;
  let failed = 0;
  const lessons: string[] = [];

  for (const job of leased) {
    try {
      const result = await input.adapter.execute({ id: job.id, objective: job.objective });
      if (result.ok) {
        input.queue.complete(job.id, input.adapter.agent, result.evidence, input.now);
        input.journal.append({
          event: 'COMPLETED',
          jobId: job.id,
          agent: input.adapter.agent,
          at: input.now,
          evidenceRefs: result.evidence,
        });
        completed += 1;
        if (result.lesson) lessons.push(result.lesson);
      } else {
        input.queue.fail(job.id, input.adapter.agent, 'adapter returned not-ok', input.now);
        input.journal.append({ event: 'FAILED', jobId: job.id, agent: input.adapter.agent, at: input.now, evidenceRefs: result.evidence });
        failed += 1;
      }
    } catch (error) {
      input.queue.fail(job.id, input.adapter.agent, error instanceof Error ? error.message : 'unknown worker failure', input.now);
      input.journal.append({ event: 'FAILED', jobId: job.id, agent: input.adapter.agent, at: input.now, evidenceRefs: [] });
      failed += 1;
    }
  }

  return Object.freeze({ leased: leased.length, completed, failed, lessons: Object.freeze(lessons) });
}
