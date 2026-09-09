import { LocalCheckpointStore } from './checkpoint-store';
import { appendLearning } from './learning-ledger';
import { rememberCortexTrace } from './memory-cortex';
import { setDebriefLock, type ResourceLedger } from './resource-governance';
import { cortexId } from './cortex-store';

export type DebriefRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  whatWorked: string[];
  whatFailed: string[];
  contradictions: string[];
  evidenceLearned: string[];
  resourceUsage: ResourceLedger['used'] | null;
  agentPerformance: string[];
  remainingUnknowns: string[];
  nextSafeStep: string;
  recruitmentHalted: true;
  productionAuthorization: false;
};

export async function runDebriefRestCycle(input: {
  tenantId: string;
  universeId: string;
  storyId: string;
  ledger?: ResourceLedger;
  whatWorked: string[];
  whatFailed: string[];
  contradictions?: string[];
  evidenceLearned?: string[];
  agentPerformance?: string[];
  remainingUnknowns?: string[];
  nextSafeStep: string;
  root?: string;
}): Promise<DebriefRecord> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (input.ledger) {
    await setDebriefLock({
      id: input.ledger.id,
      tenantId: input.tenantId,
      universeId: input.universeId,
      locked: true,
      root: input.root,
    });
  }
  const store = new LocalCheckpointStore(
    `${input.root ?? process.cwd()}/.xiv-local/brain-state.json`,
  );
  const debrief: DebriefRecord = {
    id: cortexId('debrief'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    whatWorked: [...input.whatWorked],
    whatFailed: [...input.whatFailed],
    contradictions: [...(input.contradictions ?? [])],
    evidenceLearned: [...(input.evidenceLearned ?? [])],
    resourceUsage: input.ledger ? { ...input.ledger.used } : null,
    agentPerformance: [...(input.agentPerformance ?? [])],
    remainingUnknowns: [...(input.remainingUnknowns ?? [])],
    nextSafeStep: input.nextSafeStep,
    recruitmentHalted: true,
    productionAuthorization: false,
  };
  await store.checkpoint({
    taskId: input.storyId,
    at: new Date().toISOString(),
    state: 'completed',
    attempt: 1,
    summary: `Debrief ${debrief.id}: worked=${debrief.whatWorked.length} failed=${debrief.whatFailed.length}`,
    nextAction: input.nextSafeStep,
    evidence: debrief.evidenceLearned,
  });
  await appendLearning({
    domain: 'operations',
    subject: `debrief:${input.storyId}`,
    claimState: 'MODEL_INFERENCE',
    summary: `nextSafeStep=${input.nextSafeStep}`,
    sourceRefs: debrief.evidenceLearned,
    evidence: debrief.evidenceLearned,
    taskId: input.storyId,
  }, input.root);
  await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: 'lesson',
    claimState: 'MODEL_INFERENCE',
    label: `Debrief ${input.storyId}`,
    summary: `Recruitment halted. Next: ${input.nextSafeStep}`,
    evidenceRefs: debrief.evidenceLearned,
    sourceRefs: [`debrief:${debrief.id}`],
    retentionClass: 'durable',
    root: input.root,
  });
  return debrief;
}

export async function releaseDebriefLock(input: {
  ledger: ResourceLedger;
  root?: string;
}) {
  return setDebriefLock({
    id: input.ledger.id,
    tenantId: input.ledger.tenantId,
    universeId: input.ledger.universeId,
    locked: false,
    root: input.root,
  });
}
