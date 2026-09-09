import { randomUUID } from 'node:crypto';

import { NeuralFabric, type NeuralNodeKind } from './neural-fabric';

export const BRAIN_HIGHWAY_LANES = [
  'founder_twin',
  'department',
  'agent_team',
  'tool_model',
  'knowledge',
  'debate',
  'decision',
  'build',
  'test',
  'evidence',
  'outcome',
  'learning',
  'debrief',
  'next_story',
] as const;

export type BrainHighwayLane = (typeof BRAIN_HIGHWAY_LANES)[number];

export type BrainHighwayPacket = {
  id: string;
  tenantId: string;
  universeId: string;
  fromLane: BrainHighwayLane;
  toLane: BrainHighwayLane;
  topic: string;
  body: string;
  evidenceRefs: string[];
  createdAt: string;
  productionAuthorization: false;
};

export type HighwayRouteResult =
  | { accepted: true; packet: BrainHighwayPacket; pathway: { from: string; to: string } }
  | { accepted: false; reason: string };

const LANE_KIND: Record<BrainHighwayLane, NeuralNodeKind> = {
  founder_twin: 'agent',
  department: 'workflow',
  agent_team: 'agent',
  tool_model: 'compute',
  knowledge: 'knowledge',
  debate: 'decision',
  decision: 'decision',
  build: 'workflow',
  test: 'evidence',
  evidence: 'evidence',
  outcome: 'evidence',
  learning: 'knowledge',
  debrief: 'workflow',
  next_story: 'workflow',
};

function laneNodeId(tenantId: string, universeId: string, lane: BrainHighwayLane) {
  return `highway:${tenantId}:${universeId}:${lane}`;
}

export class GlobalBrainHighways {
  readonly fabric = new NeuralFabric();
  private packets: BrainHighwayPacket[] = [];
  private readonly maxPackets = 10_000;

  ensureScope(tenantId: string, universeId: string) {
    if (!tenantId || !universeId) throw new Error('HIGHWAY_SCOPE_REQUIRED');
    for (const lane of BRAIN_HIGHWAY_LANES) {
      const id = laneNodeId(tenantId, universeId, lane);
      try {
        this.fabric.registerNode({
          id,
          kind: LANE_KIND[lane],
          label: `Global Brain Highway ${lane}`,
          tenantId,
          universeId,
          trust: 'SYNTHETIC',
          provenanceRefs: ['62L-V:highway-lane'],
        });
      } catch {
        // already registered for this fabric instance
      }
    }
    const spineStart = laneNodeId(tenantId, universeId, BRAIN_HIGHWAY_LANES[0]);
    if (this.fabric.neighbors(spineStart).length === 0) {
      for (let index = 0; index < BRAIN_HIGHWAY_LANES.length - 1; index += 1) {
        const from = BRAIN_HIGHWAY_LANES[index];
        const to = BRAIN_HIGHWAY_LANES[index + 1];
        this.fabric.connect({
          from: laneNodeId(tenantId, universeId, from),
          to: laneNodeId(tenantId, universeId, to),
          relation: 'highway_next',
          weight: 0.5,
          confidence: 0.7,
          evidenceRefs: ['62L-V:default-spine'],
        });
      }
    }
  }

  route(input: {
    tenantId: string;
    universeId: string;
    fromLane: BrainHighwayLane;
    toLane: BrainHighwayLane;
    topic: string;
    body: string;
    evidenceRefs?: string[];
  }): HighwayRouteResult {
    if (!input.tenantId || !input.universeId) return { accepted: false, reason: 'HIGHWAY_SCOPE_REQUIRED' };
    if (!input.topic.trim() || !input.body.trim()) return { accepted: false, reason: 'HIGHWAY_PACKET_EMPTY' };
    this.ensureScope(input.tenantId, input.universeId);

    const from = laneNodeId(input.tenantId, input.universeId, input.fromLane);
    const to = laneNodeId(input.tenantId, input.universeId, input.toLane);
    const neighbors = this.fabric.neighbors(from);
    const connected = neighbors.some((path) => path.to === to) || input.fromLane === input.toLane;
    if (!connected) {
      this.fabric.connect({
        from,
        to,
        relation: 'highway_sparse_route',
        weight: 0.2,
        confidence: 0.5,
        evidenceRefs: input.evidenceRefs ?? ['62L-V:sparse-route'],
      });
    }

    const packet: BrainHighwayPacket = {
      id: `pkt_${randomUUID()}`,
      tenantId: input.tenantId,
      universeId: input.universeId,
      fromLane: input.fromLane,
      toLane: input.toLane,
      topic: input.topic.trim(),
      body: input.body.trim().slice(0, 16_000),
      evidenceRefs: [...(input.evidenceRefs ?? [])],
      createdAt: new Date().toISOString(),
      productionAuthorization: false,
    };
    this.packets.push(packet);
    if (this.packets.length > this.maxPackets) this.packets.splice(0, this.packets.length - this.maxPackets);
    return { accepted: true, packet, pathway: { from, to } };
  }

  packetsFor(tenantId: string, universeId: string) {
    return this.packets.filter((packet) => packet.tenantId === tenantId && packet.universeId === universeId);
  }

  stats() {
    return {
      ...this.fabric.stats(),
      bufferedPackets: this.packets.length,
      lanes: BRAIN_HIGHWAY_LANES.length,
      productionAuthorization: false as const,
    };
  }
}

export const GLOBAL_BRAIN_PIPELINE = [
  'Founder',
  'Digital Twin',
  'Global Brain Highway',
  'Departments',
  'Agent Teams',
  'Tools/Models',
  'Knowledge',
  'Debate',
  'Decision',
  'Build',
  'Test',
  'Evidence',
  'Outcome',
  'Learning',
  'Debrief',
  'Next Story',
] as const;
