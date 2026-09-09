import { appendLearning } from './learning-ledger';
import { rememberCortexTrace } from './memory-cortex';
import type { MeshAgentRole } from './agent-mesh';

export type AgentPerformanceRecord = {
  tenantId: string;
  universeId: string;
  role: MeshAgentRole;
  taskId: string;
  successful: boolean;
  notes: string;
  evidenceRefs: string[];
  productionAuthorization: false;
};

export async function recordAgentPerformance(input: {
  tenantId: string;
  universeId: string;
  role: MeshAgentRole;
  taskId: string;
  successful: boolean;
  notes: string;
  evidenceRefs?: string[];
  root?: string;
}): Promise<{ performance: AgentPerformanceRecord; learningId: string; memoryId: string }> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const evidenceRefs = [...(input.evidenceRefs ?? [])];
  const performance: AgentPerformanceRecord = {
    tenantId: input.tenantId,
    universeId: input.universeId,
    role: input.role,
    taskId: input.taskId,
    successful: input.successful,
    notes: input.notes,
    evidenceRefs,
    productionAuthorization: false,
  };
  const learning = await appendLearning({
    domain: 'operations',
    subject: `agent-performance:${input.role}`,
    claimState: evidenceRefs.length ? 'MODEL_INFERENCE' : 'UNKNOWN',
    summary: `${input.role} ${input.successful ? 'helped' : 'failed'} on ${input.taskId}: ${input.notes.slice(0, 160)}`,
    sourceRefs: evidenceRefs,
    evidence: evidenceRefs,
    taskId: input.taskId,
  }, input.root);
  const memory = await rememberCortexTrace({
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: 'business',
    kind: 'lesson',
    claimState: evidenceRefs.length ? 'MODEL_INFERENCE' : 'UNKNOWN',
    label: `Agent performance: ${input.role}`,
    summary: performance.notes.slice(0, 200),
    evidenceRefs,
    sourceRefs: [`learn:${learning.id}`],
    retentionClass: 'working',
    root: input.root,
  });
  return { performance, learningId: learning.id, memoryId: memory.id };
}
