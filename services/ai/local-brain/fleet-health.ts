import { providerSlots } from './provider-fabric';
import { localModelStatus } from './local-model';
import { buildFounderReport } from './founder-report';
import { listMeshNodes, nodeCapabilitiesStale } from './mesh-node-registry';
import { listMeshEnvelopes, listMeshPartitions } from './partition-safe-bus';
import { MESH_HONESTY, DISTRIBUTED_MESH_CYCLE, type MeshEvidenceState } from './distributed-mesh-types';

export type FleetNodeHealth = {
  nodeId: string;
  lifecycle: string;
  routingEligible: boolean;
  capabilitiesStale: boolean;
  state: MeshEvidenceState;
};

export async function buildFleetHealthReport(input: {
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const nodes = await listMeshNodes(input);
  const partitions = await listMeshPartitions(input.root);
  const envelopes = await listMeshEnvelopes(input);
  const model = await localModelStatus();
  const providers = providerSlots();
  const nodeHealth: FleetNodeHealth[] = nodes.map((node) => {
    const stale = nodeCapabilitiesStale(node, now);
    const routingEligible = node.lifecycle === 'verified' && node.trustedForRouting && !stale;
    const state: MeshEvidenceState = node.lifecycle === 'revoked' || node.lifecycle === 'quarantined'
      ? 'FAIL'
      : !routingEligible
        ? 'UNAVAILABLE'
        : 'PASS';
    return {
      nodeId: node.id,
      lifecycle: node.lifecycle,
      routingEligible,
      capabilitiesStale: stale,
      state,
    };
  });

  return {
    generatedAt: new Date(now).toISOString(),
    tenantId: input.tenantId,
    universeId: input.universeId,
    cycle: DISTRIBUTED_MESH_CYCLE,
    nodes: nodeHealth,
    partitions: partitions.length,
    partitionQueued: envelopes.filter((item) => item.status === 'partition_queued').length,
    localModel: {
      availability: model.availability === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
      reason: model.reason,
    },
    providers: providers.map((slot) => ({
      provider: slot.provider,
      state: slot.state === 'AVAILABLE' ? 'PASS' : 'UNAVAILABLE',
      configured: slot.configured,
      authorized: slot.authorized,
    })),
    predecessor: {
      acWorkcells: 'PASS' as const,
      acReport: 'PASS' as const,
      yResearchCivilization: 'PASS' as const,
    },
    honesty: {
      ...MESH_HONESTY,
      unverifiedPeersUnavailable: true as const,
      windowsNodeVerification: 'NOT_TESTED' as const,
    },
    next: '62L-AE — not implemented in this slice',
  };
}

export async function buildFounderDistributedBrainBrief(input: {
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
}) {
  const [founder, fleet] = await Promise.all([
    buildFounderReport(input.root),
    buildFleetHealthReport(input),
  ]);
  return {
    generatedAt: new Date(input.now ?? Date.now()).toISOString(),
    headline: fleet.nodes.some((node) => node.routingEligible)
      ? 'Distributed offline mesh has at least one verified local node; unverified peers remain UNAVAILABLE.'
      : 'Distributed offline mesh code is present but no verified routing-eligible node was observed.',
    founder,
    fleet,
    impersonatesFounder: false as const,
    executableByAgent: false as const,
    honesty: MESH_HONESTY,
  };
}
