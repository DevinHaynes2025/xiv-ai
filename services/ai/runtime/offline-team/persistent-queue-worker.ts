export type PersistentJobStatus = 'QUEUED' | 'RUNNING' | 'RETRY_WAIT' | 'COMPLETED' | 'FAILED' | 'PAUSED';

export interface PersistentJob {
  tenantId: string;
  jobId: string;
  kind: string;
  status: PersistentJobStatus;
  attempts: number;
  maxAttempts: number;
  checkpointId?: string;
  requiresHumanApproval: boolean;
  productionMutationAllowed: false;
  evidenceRefs: string[];
}

export function nextJobState(job: PersistentJob, ok: boolean): PersistentJob {
  if (ok) return { ...job, status: 'COMPLETED' };
  const attempts = job.attempts + 1;
  return {
    ...job,
    attempts,
    status: attempts < job.maxAttempts ? 'RETRY_WAIT' : 'FAILED',
  };
}

export const PERSISTENT_QUEUE_POLICY = {
  offlineFirst: true,
  resumeAfterRestart: true,
  productionMutationAllowed: false,
  consequentialActionsHumanGated: true,
  topSecretExternalRoutingAllowed: false,
} as const;
