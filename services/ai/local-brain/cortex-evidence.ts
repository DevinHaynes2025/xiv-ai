import { searchKnowledgeGraph } from './knowledge-graph';
import { searchLearning } from './learning-ledger';
import { listEvidenceEvents } from './evidence-ledger';
import { recallCortexTraces, type MemoryPartition } from './memory-cortex';
import { listContradictions, listPartitionedKnowledge } from './world-knowledge-graph';
import { evaluateOfflineTask } from './offline-policy';

export type EvidencePathwayState = 'AVAILABLE' | 'WAITING_DATA' | 'UNAVAILABLE';

export type EvidencePathwayHop =
  | 'founder_twin'
  | 'neural_highways'
  | 'agent_bus'
  | 'tool_mesh'
  | 'departments'
  | 'memory_cortex'
  | 'world_knowledge_graph'
  | 'evidence_ledger'
  | 'learning_ledger'
  | 'agent_councils';

export type EvidencePathwayResult = {
  state: EvidencePathwayState;
  query: string;
  tenantId: string;
  universeId: string;
  hops: EvidencePathwayHop[];
  memoryIds: string[];
  nodeIds: string[];
  evidenceEventIds: string[];
  learningIds: string[];
  contradictionIds: string[];
  evidenceRefs: string[];
  reason: string;
  inventedFacts: false;
  cloudFreshness: 'UNAVAILABLE' | 'WAITING_DATA' | 'NOT_REQUESTED';
};

export async function retrieveEvidencePathway(input: {
  tenantId: string;
  universeId: string;
  query: string;
  partition?: MemoryPartition;
  needsExternalFreshness?: boolean;
  needsCloudProvider?: boolean;
  root?: string;
}): Promise<EvidencePathwayResult> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const query = input.query.trim();
  const offline = evaluateOfflineTask({
    needsInternet: input.needsExternalFreshness === true,
    needsCloudProvider: input.needsCloudProvider === true,
    needsExternalFreshness: input.needsExternalFreshness === true,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: 'internal',
  });

  if (!offline.allowed) {
    return {
      state: offline.state === 'DENIED' ? 'UNAVAILABLE' : offline.state,
      query,
      tenantId: input.tenantId,
      universeId: input.universeId,
      hops: ['memory_cortex', 'world_knowledge_graph', 'evidence_ledger'],
      memoryIds: [],
      nodeIds: [],
      evidenceEventIds: [],
      learningIds: [],
      contradictionIds: [],
      evidenceRefs: [],
      reason: offline.reason,
      inventedFacts: false,
      cloudFreshness: offline.state === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'WAITING_DATA',
    };
  }

  const root = input.root ?? process.cwd();
  const [memories, graph, events, learning, partitions, contradictions] = await Promise.all([
    recallCortexTraces({
      tenantId: input.tenantId,
      universeId: input.universeId,
      query,
      partition: input.partition,
      root,
    }),
    searchKnowledgeGraph(query, root),
    listEvidenceEvents({ tenantId: input.tenantId, universeId: input.universeId, root }),
    searchLearning(query, root),
    listPartitionedKnowledge({ tenantId: input.tenantId, universeId: input.universeId, partition: input.partition, root }),
    listContradictions({ tenantId: input.tenantId, universeId: input.universeId, partition: input.partition, root }),
  ]);

  const partitionIds = new Set(partitions.map((node) => node.id));
  const scopedNodes = graph.nodes.filter((node) => partitionIds.has(node.id));
  const needle = query.toLowerCase();
  const scopedEvents = needle
    ? events.filter((event) => event.summary.toLowerCase().includes(needle))
    : events.slice(-50);

  const evidenceRefs = [
    ...memories.map((item) => `memory:${item.id}`),
    ...scopedNodes.map((node) => `node:${node.id}`),
    ...scopedEvents.map((event) => `evt:${event.id}`),
    ...learning.map((entry) => `learn:${entry.id}`),
    ...contradictions.map((item) => `ctr:${item.id}`),
  ];

  return {
    state: 'AVAILABLE',
    query,
    tenantId: input.tenantId,
    universeId: input.universeId,
    hops: ['memory_cortex', 'world_knowledge_graph', 'evidence_ledger', 'learning_ledger'],
    memoryIds: memories.map((item) => item.id),
    nodeIds: scopedNodes.map((node) => node.id),
    evidenceEventIds: scopedEvents.map((event) => event.id),
    learningIds: learning.map((entry) => entry.id),
    contradictionIds: contradictions.map((item) => item.id),
    evidenceRefs,
    reason: evidenceRefs.length
      ? 'Retrieved from local Memory Cortex, knowledge graph, evidence ledger, and learning ledger only.'
      : 'No matching local evidence. Do not invent facts or claim external freshness.',
    inventedFacts: false,
    cloudFreshness: 'NOT_REQUESTED',
  };
}
