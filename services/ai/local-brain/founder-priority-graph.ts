import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

export type PriorityNodeKind = 'intent' | 'story' | 'blocker' | 'next_safe_step';

export type FounderPriorityNode = {
  id: string;
  kind: PriorityNodeKind;
  label: string;
  weight: number;
  evidenceRefs: string[];
  twinIsRealFounder: false;
};

export type FounderPriorityEdge = {
  id: string;
  from: string;
  to: string;
  relation: 'depends_on' | 'blocks' | 'unlocks' | 'supersedes';
};

export type FounderPriorityGraphSnapshot = {
  tenantId: string;
  universeId: string;
  nodes: FounderPriorityNode[];
  edges: FounderPriorityEdge[];
  ordered: string[];
  twinIsRealFounder: false;
  founderApprovalFabricated: false;
  productionAuthorization: false;
};

type Store = { graphs: FounderPriorityGraphSnapshot[] };

function storePath(root: string) {
  return xivLocalPath(root, 'founder-priority-graph.json');
}

export class FounderPriorityGraph {
  private readonly nodes = new Map<string, FounderPriorityNode>();
  private readonly edges = new Map<string, FounderPriorityEdge>();

  constructor(
    private readonly tenantId: string,
    private readonly universeId: string,
  ) {
    if (!tenantId || !universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  }

  addNode(input: Omit<FounderPriorityNode, 'twinIsRealFounder'> & { twinIsRealFounder?: false }) {
    if (!input.label.trim()) throw new Error('PRIORITY_NODE_LABEL_REQUIRED');
    const node: FounderPriorityNode = {
      ...input,
      weight: Math.max(0, Math.min(1, input.weight)),
      evidenceRefs: [...input.evidenceRefs],
      twinIsRealFounder: false,
    };
    this.nodes.set(node.id, node);
    return node;
  }

  connect(edge: FounderPriorityEdge) {
    if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) throw new Error('PRIORITY_EDGE_ENDPOINT_MISSING');
    this.edges.set(edge.id, { ...edge });
    return edge;
  }

  orderedIds() {
    const remaining = new Set(this.nodes.keys());
    const incoming = new Map<string, number>();
    for (const id of remaining) incoming.set(id, 0);
    for (const edge of this.edges.values()) {
      incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    }
    const ordered: string[] = [];
    while (remaining.size) {
      const ready = [...remaining].filter((id) => (incoming.get(id) ?? 0) === 0);
      if (ready.length === 0) {
        ordered.push(...[...remaining].sort());
        break;
      }
      ready.sort((a, b) => (this.nodes.get(b)?.weight ?? 0) - (this.nodes.get(a)?.weight ?? 0));
      const next = ready[0];
      ordered.push(next);
      remaining.delete(next);
      for (const edge of this.edges.values()) {
        if (edge.from === next) incoming.set(edge.to, Math.max(0, (incoming.get(edge.to) ?? 0) - 1));
      }
    }
    return ordered;
  }

  snapshot(): FounderPriorityGraphSnapshot {
    return {
      tenantId: this.tenantId,
      universeId: this.universeId,
      nodes: [...this.nodes.values()],
      edges: [...this.edges.values()],
      ordered: this.orderedIds(),
      twinIsRealFounder: false,
      founderApprovalFabricated: false,
      productionAuthorization: false,
    };
  }

  async persist(root = process.cwd()) {
    const snapshot = this.snapshot();
    const parsed = await readJsonFile<Store>(storePath(root), { graphs: [] });
    const graphs = Array.isArray(parsed.graphs) ? parsed.graphs : [];
    graphs.push(snapshot);
    await writeJsonFileAtomic(storePath(root), { graphs: graphs.slice(-1_000) });
    return snapshot;
  }
}

export function mintPriorityNode(kind: PriorityNodeKind, label: string, weight: number, evidenceRefs: string[] = []): Omit<FounderPriorityNode, 'twinIsRealFounder'> {
  return {
    id: cortexId('prio'),
    kind,
    label,
    weight,
    evidenceRefs,
  };
}
