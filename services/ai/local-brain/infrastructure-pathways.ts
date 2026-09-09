export type InfrastructureNodeKind =
  | 'chip_fab'
  | 'chip_supplier'
  | 'packaging_test'
  | 'data_center'
  | 'cloud_region'
  | 'warehouse'
  | 'port'
  | 'airport'
  | 'highway'
  | 'rail'
  | 'energy_source'
  | 'vehicle_plant'
  | 'aviation_plant'
  | 'research_lab'
  | 'network_exchange';

export type InfrastructureNode = {
  id: string;
  kind: InfrastructureNodeKind;
  label: string;
  country?: string;
  region?: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  provenanceRefs: string[];
  state: 'PLANNED' | 'KNOWN' | 'VERIFIED' | 'UNAVAILABLE';
};

export type InfrastructureEdge = {
  id: string;
  from: string;
  to: string;
  relation: 'supplies' | 'ships_to' | 'connects' | 'powers' | 'hosts' | 'tests' | 'depends_on' | 'exchanges_data_with';
  capacity?: number;
  unit?: string;
  provenanceRefs: string[];
};

export class InfrastructurePathwayGraph {
  private readonly nodes = new Map<string, InfrastructureNode>();
  private readonly edges = new Map<string, InfrastructureEdge>();

  addNode(node: InfrastructureNode) {
    if (!node.id || !node.label.trim()) throw new Error('INFRA_NODE_INVALID');
    if (node.state === 'VERIFIED' && node.provenanceRefs.length === 0) throw new Error('VERIFIED_NODE_REQUIRES_PROVENANCE');
    this.nodes.set(node.id, { ...node, provenanceRefs: [...node.provenanceRefs] });
  }

  addEdge(edge: InfrastructureEdge) {
    if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) throw new Error('INFRA_EDGE_ENDPOINT_MISSING');
    if (edge.provenanceRefs.length === 0) throw new Error('INFRA_EDGE_PROVENANCE_REQUIRED');
    this.edges.set(edge.id, { ...edge, provenanceRefs: [...edge.provenanceRefs] });
  }

  neighbors(nodeId: string) {
    return [...this.edges.values()].filter((edge) => edge.from === nodeId || edge.to === nodeId);
  }

  snapshot() {
    return {
      nodes: [...this.nodes.values()],
      edges: [...this.edges.values()],
      productionAuthorization: false,
      note: 'This graph models infrastructure and information logistics; it does not authorize construction, procurement, routing, or external commitments.',
    } as const;
  }
}
