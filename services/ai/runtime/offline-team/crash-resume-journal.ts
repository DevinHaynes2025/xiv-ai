import { appendRuntimeJsonl, writeRuntimeJson } from './runtime-disk-writer';

export type RuntimeEventType = 'BOOT' | 'CHECKPOINT' | 'CRASH' | 'RESUME' | 'SHUTDOWN' | 'RECOVERY_FAILED';

export interface RuntimeEvent {
  tenantId: string;
  agentId?: string;
  event: RuntimeEventType;
  at: string;
  checkpointId?: string;
  message?: string;
  evidenceRefs: string[];
}

export async function recordRuntimeEvent(event: RuntimeEvent): Promise<string> {
  if (!event.tenantId) throw new Error('tenantId required');
  return appendRuntimeJsonl('journals/crash-resume.jsonl', event);
}

export async function writeLatestCheckpoint(tenantId: string, checkpointId: string, agentIds: string[]): Promise<string> {
  return writeRuntimeJson('checkpoints/latest.json', {
    tenantId,
    classification: 'CONFIDENTIAL',
    createdAt: new Date().toISOString(),
    payload: { checkpointId, agentIds, productionMutationAllowed: false },
  });
}

export const recoveryPolicy = {
  autoResumeProductionMutations: false,
  requireKnownGoodCheckpoint: true,
  preserveCrashEvidence: true,
  resumeRequiresTenantMatch: true,
};
