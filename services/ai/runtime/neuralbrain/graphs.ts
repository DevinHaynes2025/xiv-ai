/**
 * Named intelligence graphs for Phase 2I-AC completion.
 * Knowledge / Evidence / Decision / Outcome / AgentCollaboration / DataLineage.
 * Capability ≠ privilege. L4 disabled. Production not live.
 */

import { KNOWLEDGE_NODE_KINDS, type KnowledgeNodeKind } from './types';

export type NamedIntelligenceGraphKind =
  | 'KnowledgeGraph'
  | 'EvidenceGraph'
  | 'DecisionGraph'
  | 'OutcomeGraph'
  | 'AgentCollaborationGraph'
  | 'DataLineageGraph';

export const NAMED_INTELLIGENCE_GRAPH_KINDS = [
  'KnowledgeGraph',
  'EvidenceGraph',
  'DecisionGraph',
  'OutcomeGraph',
  'AgentCollaborationGraph',
  'DataLineageGraph',
] as const satisfies readonly NamedIntelligenceGraphKind[];

export type IntelligenceGraphNode = {
  nodeId: string;
  kind: KnowledgeNodeKind | 'CollaborationNode' | 'LineageAssetNode';
  label: string;
  tenantId: string;
  universeId: string;
  confidence: number;
  permissions: 'TENANT_SCOPED';
};

export type IntelligenceGraphEdge = {
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  relation: string;
};

export type NamedIntelligenceGraph = {
  kind: NamedIntelligenceGraphKind;
  nodes: readonly IntelligenceGraphNode[];
  edges: readonly IntelligenceGraphEdge[];
  inspectable: true;
  crossTenantLinksAllowed: false;
  l4Enabled: false;
  productionLive: false;
};

export function listNamedIntelligenceGraphs(): readonly NamedIntelligenceGraphKind[] {
  return NAMED_INTELLIGENCE_GRAPH_KINDS;
}

function openNamedGraph(kind: NamedIntelligenceGraphKind): NamedIntelligenceGraph {
  return {
    kind,
    nodes: [],
    edges: [],
    inspectable: true,
    crossTenantLinksAllowed: false,
    l4Enabled: false,
    productionLive: false,
  };
}

export function openKnowledgeGraph(): NamedIntelligenceGraph {
  return openNamedGraph('KnowledgeGraph');
}

export function openEvidenceGraph(): NamedIntelligenceGraph {
  return openNamedGraph('EvidenceGraph');
}

export function openDecisionGraph(): NamedIntelligenceGraph {
  return openNamedGraph('DecisionGraph');
}

export function openOutcomeGraph(): NamedIntelligenceGraph {
  return openNamedGraph('OutcomeGraph');
}

export function openAgentCollaborationGraph(): NamedIntelligenceGraph {
  return openNamedGraph('AgentCollaborationGraph');
}

export function openDataLineageGraph(): NamedIntelligenceGraph {
  return openNamedGraph('DataLineageGraph');
}

export function createIntelligenceGraphNode(input: {
  nodeId: string;
  kind: IntelligenceGraphNode['kind'];
  label: string;
  tenantId: string;
  universeId: string;
  confidence?: number;
}): IntelligenceGraphNode {
  return {
    nodeId: input.nodeId,
    kind: input.kind,
    label: input.label,
    tenantId: input.tenantId,
    universeId: input.universeId,
    confidence: input.confidence ?? 0,
    permissions: 'TENANT_SCOPED',
  };
}

export function linkIntelligenceGraphNodes(input: {
  edgeId: string;
  from: IntelligenceGraphNode;
  to: IntelligenceGraphNode;
  relation: string;
}): IntelligenceGraphEdge | { allowed: false; reason: string } {
  if (input.from.tenantId !== input.to.tenantId) {
    return { allowed: false, reason: 'cross_tenant_graph_link_denied' };
  }
  return {
    edgeId: input.edgeId,
    fromNodeId: input.from.nodeId,
    toNodeId: input.to.nodeId,
    relation: input.relation,
  };
}

/** Knowledge node kinds used by named graphs remain the brain contract set. */
export function namedGraphsUseKnowledgeNodeKinds(): readonly KnowledgeNodeKind[] {
  return KNOWLEDGE_NODE_KINDS;
}
