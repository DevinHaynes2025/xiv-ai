export type UniverseNodeType = 'USER' | 'AGENT' | 'VENTURE' | 'OFFICE' | 'PROJECT_ROOM' | 'MARKETPLACE' | 'EVENT' | 'SIMULATION';
export type UniverseEdgeType = 'MEMBER_OF' | 'WORKS_WITH' | 'OWNS' | 'USES' | 'LISTS' | 'JOINS' | 'SIMULATES';

export interface UniverseGraphNode {
  id: string;
  tenantId: string;
  universeId: string;
  type: UniverseNodeType;
  label: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  evidenceRefs: string[];
}

export interface UniverseGraphEdge {
  fromId: string;
  toId: string;
  type: UniverseEdgeType;
  tenantId: string;
  universeId: string;
  approved: boolean;
  evidenceRefs: string[];
}

export class VirtualOfficeMarketplaceGraph {
  private nodes = new Map<string, UniverseGraphNode>();
  private edges: UniverseGraphEdge[] = [];

  addNode(node: UniverseGraphNode): void {
    if (!node.evidenceRefs.length) throw new Error('evidence required');
    this.nodes.set(node.id, node);
  }

  addEdge(edge: UniverseGraphEdge): void {
    const from = this.nodes.get(edge.fromId);
    const to = this.nodes.get(edge.toId);
    if (!from || !to) throw new Error('edge endpoints must exist');
    if (from.tenantId !== to.tenantId || from.universeId !== to.universeId) throw new Error('cross-tenant/universe edge denied');
    if (!edge.approved || !edge.evidenceRefs.length) throw new Error('approved evidence-backed edge required');
    this.edges.push(edge);
  }

  snapshot(tenantId: string, universeId: string) {
    return {
      nodes: [...this.nodes.values()].filter((n) => n.tenantId === tenantId && n.universeId === universeId),
      edges: this.edges.filter((e) => e.tenantId === tenantId && e.universeId === universeId),
    };
  }
}

export const virtualMarketplacePolicy = {
  rawPrivateMemoryListingAllowed: false,
  unauthorizedIdentityTradingAllowed: false,
  topSecretMarketplaceExposureAllowed: false,
  graphEdgeIsFact: false,
};
