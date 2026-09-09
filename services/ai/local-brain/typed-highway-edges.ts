import { NeuralFabric } from './neural-fabric';
import { GlobalBrainHighways } from './global-brain-highways';
import type { TypedHighwayRelation } from './information-supply-chain-types';

export type HighwayNodeKind = 'source' | 'store' | 'agent' | 'tool' | 'decision' | 'sealed_hold';

export type TypedHighwayNode = {
  id: string;
  kind: HighwayNodeKind;
  label: string;
  tenantId: string;
  universeId: string;
  holdsPrivateMemory: boolean;
  sealed: boolean;
};

export type TypedHighwayEdge = {
  from: string;
  to: string;
  relation: TypedHighwayRelation;
  stale: boolean;
  evidenceRefs: string[];
};

export type HighwayLoopResult =
  | { loop: false }
  | { loop: true; path: string[]; blocked: true };

const KIND_TO_NEURAL = {
  source: 'knowledge',
  store: 'knowledge',
  agent: 'agent',
  tool: 'compute',
  decision: 'decision',
  sealed_hold: 'evidence',
} as const;

export class TypedHighwayGraph {
  readonly fabric = new NeuralFabric();
  readonly brainHighways = new GlobalBrainHighways();
  private readonly nodes = new Map<string, TypedHighwayNode>();
  private readonly outgoing = new Map<string, TypedHighwayEdge[]>();

  registerNode(node: TypedHighwayNode) {
    if (!node.tenantId || !node.universeId) throw new Error('HIGHWAY_NODE_SCOPE_REQUIRED');
    this.nodes.set(node.id, { ...node });
    this.fabric.registerNode({
      id: node.id,
      kind: KIND_TO_NEURAL[node.kind],
      label: node.label,
      tenantId: node.tenantId,
      universeId: node.universeId,
      trust: node.sealed ? 'UNKNOWN' : 'SYNTHETIC',
      provenanceRefs: ['62L-AM:typed-highway'],
    });
  }

  connect(edge: TypedHighwayEdge): HighwayLoopResult | { loop: false; edge: TypedHighwayEdge; accepted: true } | { accepted: false; reason: string } {
    const from = this.nodes.get(edge.from);
    const to = this.nodes.get(edge.to);
    if (!from || !to) return { accepted: false, reason: 'HIGHWAY_ENDPOINT_MISSING' };
    if (from.tenantId !== to.tenantId || from.universeId !== to.universeId) {
      return { accepted: false, reason: 'CROSS_UNIVERSE_HIGHWAY_DENIED' };
    }
    if (from.holdsPrivateMemory || to.holdsPrivateMemory) {
      return { accepted: false, reason: 'PRIVATE_INTERNAL_MEMORY_NOT_ON_SHARED_HIGHWAY' };
    }
    if ((from.sealed || to.sealed) && edge.relation !== 'sealed_hold') {
      return { accepted: false, reason: 'SEALED_OUTSIDE_ORDINARY_MOVEMENT' };
    }
    const loop = this.detectLoop(edge.from, edge.to);
    if (loop.loop) return loop;
    const next: TypedHighwayEdge = { ...edge, evidenceRefs: [...edge.evidenceRefs] };
    const list = this.outgoing.get(edge.from) ?? [];
    list.push(next);
    this.outgoing.set(edge.from, list);
    this.fabric.connect({
      from: edge.from,
      to: edge.to,
      relation: edge.relation,
      weight: 0.4,
      confidence: edge.stale ? 0.2 : 0.8,
      evidenceRefs: next.evidenceRefs,
    });
    return { loop: false, edge: next, accepted: true };
  }

  detectLoop(from: string, to: string): HighwayLoopResult {
    if (from === to) return { loop: true, path: [from, to], blocked: true };
    const visiting = new Set<string>([from]);
    const path = [from];
    const visit = (id: string): HighwayLoopResult => {
      if (id === from && path.length > 1) return { loop: true, path: [...path, id], blocked: true };
      const edges = this.outgoing.get(id) ?? [];
      for (const edge of edges) {
        if (visiting.has(edge.to) || edge.to === from) {
          return { loop: true, path: [...path, edge.to], blocked: true };
        }
        visiting.add(edge.to);
        path.push(edge.to);
        const nested = visit(edge.to);
        if (nested.loop) return nested;
        path.pop();
        visiting.delete(edge.to);
      }
      return { loop: false };
    };
    visiting.add(to);
    path.push(to);
    return visit(to);
  }

  generatePathway(input: { from: string; to: string }): { found: boolean; path: string[]; deadRoute: boolean } {
    if (!this.nodes.has(input.from) || !this.nodes.has(input.to)) {
      return { found: false, path: [], deadRoute: true };
    }
    const queue: string[][] = [[input.from]];
    const seen = new Set<string>([input.from]);
    while (queue.length) {
      const current = queue.shift()!;
      const tip = current[current.length - 1]!;
      if (tip === input.to) return { found: true, path: current, deadRoute: false };
      for (const edge of this.outgoing.get(tip) ?? []) {
        if (edge.stale) continue;
        if (seen.has(edge.to)) continue;
        seen.add(edge.to);
        queue.push([...current, edge.to]);
      }
    }
    return { found: false, path: [], deadRoute: true };
  }

  highwayGaps() {
    const findings: Array<{ kind: 'stale_path' | 'dead_route' | 'disconnected_graph' | 'recursive_loop'; from: string; to?: string }> = [];
    for (const [from, edges] of this.outgoing) {
      for (const edge of edges) {
        if (edge.stale) findings.push({ kind: 'stale_path', from, to: edge.to });
        if (!this.nodes.has(edge.to)) findings.push({ kind: 'dead_route', from, to: edge.to });
      }
    }
    for (const node of this.nodes.values()) {
      if (node.kind === 'source') {
        const reachableStores = [...this.nodes.values()].filter((candidate) => candidate.kind === 'store');
        for (const store of reachableStores) {
          const path = this.generatePathway({ from: node.id, to: store.id });
          if (!path.found) findings.push({ kind: 'disconnected_graph', from: node.id, to: store.id });
        }
      }
    }
    return findings;
  }

  routeSharedHighway(input: {
    tenantId: string;
    universeId: string;
    fromLane: 'knowledge' | 'agent_team' | 'tool_model' | 'decision';
    toLane: 'knowledge' | 'agent_team' | 'tool_model' | 'decision';
    topic: string;
    body: string;
    privateMemory?: string;
    sealed?: boolean;
    relation: Extract<TypedHighwayRelation, 'a2a_interop' | 'mcp_tool_data' | 'query_to_data'>;
  }) {
    if (input.sealed) {
      return {
        accepted: false as const,
        reason: 'CEO-sealed content is outside ordinary sync/movement.',
        privateMemoryExposed: false as const,
        movementBytes: 0 as const,
      };
    }
    if (input.privateMemory) {
      return {
        accepted: false as const,
        reason: 'Shared A2A/MCP highways must not expose private internal memory.',
        privateMemoryExposed: false as const,
        movementBytes: 0 as const,
      };
    }
    const routed = this.brainHighways.route({
      tenantId: input.tenantId,
      universeId: input.universeId,
      fromLane: input.fromLane,
      toLane: input.toLane,
      topic: `${input.relation}:${input.topic}`,
      body: input.body,
      evidenceRefs: [`62L-AM:${input.relation}`],
    });
    return {
      ...routed,
      relation: input.relation,
      privateMemoryExposed: false as const,
      complementary: input.relation === 'a2a_interop' || input.relation === 'mcp_tool_data',
      movementBytes: 0 as const,
    };
  }
}
