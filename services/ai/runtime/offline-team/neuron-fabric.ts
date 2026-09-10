import { createHash } from 'node:crypto';

export type NeuronKind = 'ATOMIC_DATA_CELL' | 'AGENT' | 'LESSON' | 'DOCUMENT' | 'SIMULATION' | 'PLUGIN' | 'DEVICE';
export type EdgeKind = 'SUPPORTS' | 'CONTRADICTS' | 'DERIVED_FROM' | 'ASSIGNED_TO' | 'REVIEWED_BY' | 'SIMULATES' | 'ROUTES_TO';

export interface NeuronNode {
  neuronId: string;
  tenantId: string;
  kind: NeuronKind;
  contentHash: string;
  evidenceRefs: readonly string[];
}

export interface NeuronEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  confidence: number;
  evidenceRefs: readonly string[];
}

export const NEURON_FABRIC_GUARDRAILS = {
  literalBiologicalNeuronClaimAllowed: false,
  literalAtomicStorageClaimAllowed: false,
  graphEdgeIsFact: false,
  crossTenantEdgeAllowed: false,
  maxEdgesPerExpansion: 10000,
} as const;

export function makeNeuron(input: { tenantId: string; kind: NeuronKind; payload: unknown; evidenceRefs?: readonly string[] }): NeuronNode {
  const serialized = JSON.stringify(input.payload);
  const hash = createHash('sha256').update(serialized).digest('hex');
  return Object.freeze({
    neuronId: `n-${hash.slice(0, 24)}`,
    tenantId: input.tenantId,
    kind: input.kind,
    contentHash: hash,
    evidenceRefs: Object.freeze([...(input.evidenceRefs ?? [])]),
  });
}

export function connectNeurons(nodes: readonly NeuronNode[], edges: readonly NeuronEdge[]): readonly NeuronEdge[] {
  const byId = new Map(nodes.map((node) => [node.neuronId, node]));
  if (edges.length > NEURON_FABRIC_GUARDRAILS.maxEdgesPerExpansion) throw new Error('edge expansion exceeds bounded limit');
  return Object.freeze(edges.map((edge) => {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) throw new Error('edge references unknown neuron');
    if (from.tenantId !== to.tenantId) throw new Error('cross-tenant neuron edge blocked');
    if (edge.confidence < 0 || edge.confidence > 1) throw new Error('confidence must be 0..1');
    return Object.freeze({ ...edge, evidenceRefs: Object.freeze([...edge.evidenceRefs]) });
  }));
}
