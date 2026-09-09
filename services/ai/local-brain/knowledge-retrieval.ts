import { searchKnowledgeGraph, type KnowledgeEdge, type KnowledgeNode } from './knowledge-graph';
import { searchLearning, type LearningEntry } from './learning-ledger';

export type KnowledgeRetrievalState = 'AVAILABLE' | 'WAITING_DATA';

export type KnowledgeRetrievalResult = {
  state: KnowledgeRetrievalState;
  query: string;
  tenantId: string;
  universeId: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  learning: LearningEntry[];
  evidenceRefs: string[];
  reason: string;
  inventedFacts: false;
};

export async function retrieveOfflineKnowledge(
  query: string,
  input: {
    tenantId: string;
    universeId: string;
    root?: string;
    needsExternalFreshness?: boolean;
  },
): Promise<KnowledgeRetrievalResult> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const q = query.trim();
  if (input.needsExternalFreshness) {
    return {
      state: 'WAITING_DATA',
      query: q,
      tenantId: input.tenantId,
      universeId: input.universeId,
      nodes: [],
      edges: [],
      learning: [],
      evidenceRefs: [],
      reason: 'Current external information is required; local retrieval will not invent freshness.',
      inventedFacts: false,
    };
  }

  const graph = await searchKnowledgeGraph(q, input.root);
  const learning = await searchLearning(q, input.root);
  const evidenceRefs = [
    ...graph.nodes.map((node) => `node:${node.id}`),
    ...graph.edges.map((edge) => `edge:${edge.id}`),
    ...learning.map((entry) => `learn:${entry.id}`),
  ];

  return {
    state: 'AVAILABLE',
    query: q,
    tenantId: input.tenantId,
    universeId: input.universeId,
    nodes: graph.nodes,
    edges: graph.edges,
    learning,
    evidenceRefs,
    reason: evidenceRefs.length
      ? 'Retrieved from the local knowledge graph and learning ledger only.'
      : 'No matching local knowledge. Do not invent facts or claim external freshness.',
    inventedFacts: false,
  };
}
