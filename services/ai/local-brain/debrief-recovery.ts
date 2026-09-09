import { LocalCheckpointStore } from './checkpoint-store';
import { appendLearning } from './learning-ledger';
import { appendEvidenceEvent } from './evidence-ledger';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import type { LocalCheckpoint } from './types';

export const DEBRIEF_PHASES = [
  'checkpoint',
  'summarize',
  'lessons',
  'suspend',
  'next_priorities',
] as const;

export type DebriefPhase = (typeof DEBRIEF_PHASES)[number];

export type DebriefRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  storyId: string;
  phase: DebriefPhase;
  accomplishments: string[];
  failures: string[];
  assumptions: string[];
  resourceUse: {
    modelCalls: number;
    residentAgents: number;
    notes: string;
  };
  lessons: string[];
  nextPriorities: string[];
  suspended: boolean;
  productionAuthorization: false;
  createdAt: string;
};

type DebriefStore = { cycles: DebriefRecord[] };

function debriefPath(root: string) {
  return xivLocalPath(root, 'debrief-cycles.json');
}

export async function runDebriefRecoveryCycle(input: {
  tenantId: string;
  universeId: string;
  storyId: string;
  taskId: string;
  accomplishments: string[];
  failures: string[];
  assumptions: string[];
  resourceUse: { modelCalls: number; residentAgents: number; notes?: string };
  lessons: string[];
  nextPriorities: string[];
  root?: string;
}) {
  if (!input.tenantId || !input.universeId || !input.storyId || !input.taskId) {
    throw new Error('DEBRIEF_SCOPE_REQUIRED');
  }
  const root = input.root ?? process.cwd();
  const store = new LocalCheckpointStore(xivLocalPath(root, 'brain-state.json'));

  const checkpoint: LocalCheckpoint = {
    taskId: input.taskId,
    at: new Date().toISOString(),
    state: 'completed',
    attempt: 1,
    summary: `Debrief checkpoint for ${input.storyId}`,
    nextAction: input.nextPriorities[0],
    evidence: [...input.accomplishments, ...input.failures].slice(0, 20),
  };
  await store.checkpoint(checkpoint);

  const summary = [
    `accomplishments=${input.accomplishments.length}`,
    `failures=${input.failures.length}`,
    `assumptions=${input.assumptions.length}`,
    `resourceUse.modelCalls=${input.resourceUse.modelCalls}`,
    `resourceUse.residentAgents=${input.resourceUse.residentAgents}`,
  ].join('; ');

  const learning = await appendLearning({
    domain: 'technology',
    subject: `debrief:${input.storyId}`,
    claimState: 'MODEL_INFERENCE',
    summary: `Lessons: ${input.lessons.join(' | ') || 'none recorded'}. ${summary}`,
    sourceRefs: [`story:${input.storyId}`, `task:${input.taskId}`],
    evidence: input.accomplishments,
    confidence: 0.4,
    taskId: input.taskId,
  }, root);

  const record: DebriefRecord = {
    id: learning.id.replace('learn_', 'debrief_'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    storyId: input.storyId,
    phase: 'next_priorities',
    accomplishments: [...input.accomplishments],
    failures: [...input.failures],
    assumptions: [...input.assumptions],
    resourceUse: {
      modelCalls: input.resourceUse.modelCalls,
      residentAgents: input.resourceUse.residentAgents,
      notes: input.resourceUse.notes ?? '',
    },
    lessons: [...input.lessons],
    nextPriorities: [...input.nextPriorities],
    suspended: true,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };

  const existing = await readJsonFile<DebriefStore>(debriefPath(root), { cycles: [] });
  const cycles = Array.isArray(existing.cycles) ? existing.cycles : [];
  cycles.push(record);
  await writeJsonFileAtomic(debriefPath(root), { cycles: cycles.slice(-2_000) });

  await appendEvidenceEvent({
    kind: 'evidence',
    storyId: input.storyId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: `Debrief/recovery cycle completed for ${input.storyId}`,
    payload: {
      phases: DEBRIEF_PHASES,
      checkpoint: checkpoint.summary,
      suspended: true,
      nextPriorities: record.nextPriorities,
      learningId: learning.id,
    },
  }, root);

  return {
    record,
    checkpoint,
    learning,
    phases: DEBRIEF_PHASES,
    productionAuthorization: false as const,
  };
}

export async function listDebriefCycles(tenantId: string, universeId: string, root = process.cwd()) {
  const existing = await readJsonFile<DebriefStore>(debriefPath(root), { cycles: [] });
  return (existing.cycles ?? []).filter((cycle) => cycle.tenantId === tenantId && cycle.universeId === universeId);
}
