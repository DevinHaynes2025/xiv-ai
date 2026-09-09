import { runDebriefRestCycle, type DebriefRecord } from './debrief-rest';
import { consolidateExecutiveMemory } from './executive-memory';
import { rememberCortexTrace } from './memory-cortex';
import type { ResourceLedger } from './resource-governance';

export async function consolidateDebriefMemory(input: {
  tenantId: string;
  universeId: string;
  storyId: string;
  ledger?: ResourceLedger;
  whatWorked: string[];
  whatFailed: string[];
  remainingUnknowns?: string[];
  nextSafeStep: string;
  contradictions?: string[];
  root?: string;
}): Promise<{ debrief: DebriefRecord; memoryId: string; consolidationId: string; routingSuspended: true }> {
  const debrief = await runDebriefRestCycle(input);
  const memory = await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: 'lesson',
    claimState: debrief.remainingUnknowns.length ? 'UNKNOWN' : 'VERIFIED_FACT',
    label: `debrief:${input.storyId}`,
    summary: `worked=${debrief.whatWorked.join('; ')}; failed=${debrief.whatFailed.join('; ')}; next=${debrief.nextSafeStep}`,
    evidenceRefs: debrief.evidenceLearned,
    sourceRefs: debrief.evidenceLearned,
    retentionClass: 'durable',
    root: input.root,
  });
  const consolidation = await consolidateExecutiveMemory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    query: input.storyId,
    root: input.root,
  });
  return {
    debrief,
    memoryId: memory.id,
    consolidationId: consolidation.id,
    routingSuspended: true,
  };
}
