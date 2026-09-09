export type NeuralNodeKind = 'agent' | 'knowledge' | 'kpi' | 'workflow' | 'evidence' | 'compute' | 'infrastructure' | 'decision';
export type NeuralTrust = 'VERIFIED' | 'STALE' | 'UNKNOWN' | 'SYNTHETIC';

export type NeuralNode = {
  id: string;
  kind: NeuralNodeKind;
  label: string;
  tenantId: string;
  universeId: string;
  trust: NeuralTrust;
  provenanceRefs: string[];
};

export type NeuralPathway = {
  from: string;
  to: string;
  relation: string;
  weight: number;
  confidence: number;
  evidenceRefs: string[];
};

// This is a sparse logical fabric. "Trillions of neurons" means addressable logical
// relationships over partitioned indexes/object stores, never trillions of resident processes.
export class NeuralFabric {
  private nodes = new Map<string, NeuralNode>();
  private outgoing = new Map<string, NeuralPathway[]>();

  registerNode(node: NeuralNode) {
    if (!node.tenantId || !node.universeId) throw new Error('tenantId and universeId are required');
    if ((node.trust === 'VERIFIED') && node.provenanceRefs.length === 0) throw new Error('verified neural nodes require provenance');
    this.nodes.set(node.id, { ...node, provenanceRefs: [...node.provenanceRefs] });
  }

  connect(path: NeuralPathway) {
    const from = this.nodes.get(path.from);
    const to = this.nodes.get(path.to);
    if (!from || !to) throw new Error('both neural nodes must be registered');
    if (from.tenantId !== to.tenantId || from.universeId !== to.universeId) throw new Error('cross-Universe neural pathway denied');
    if (!Number.isFinite(path.weight) || path.weight < -1 || path.weight > 1) throw new Error('weight must be finite in [-1,1]');
    if (!Number.isFinite(path.confidence) || path.confidence < 0 || path.confidence > 1) throw new Error('confidence must be finite in [0,1]');
    const list = this.outgoing.get(path.from) ?? [];
    list.push({ ...path, evidenceRefs: [...path.evidenceRefs] });
    this.outgoing.set(path.from, list);
  }

  neighbors(id: string) {
    return [...(this.outgoing.get(id) ?? [])];
  }

  stats() {
    let pathways = 0;
    for (const values of this.outgoing.values()) pathways += values.length;
    return { logicalNodes: this.nodes.size, logicalPathways: pathways, productionAuthorization: false as const };
  }
}
