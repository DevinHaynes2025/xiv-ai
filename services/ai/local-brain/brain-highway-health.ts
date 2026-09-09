import { BRAIN_HIGHWAY_LANES, type GlobalBrainHighways } from './global-brain-highways';
import { providerSlots } from './provider-fabric';
import { listSharedToolCapabilities } from './tool-capability-exchange';

export type HighwayHealthStatus = 'HEALTHY' | 'DEGRADED' | 'CONGESTED' | 'UNAVAILABLE';

export type BrainHighwayHealthMap = {
  generatedAt: string;
  lanes: Array<{
    lane: (typeof BRAIN_HIGHWAY_LANES)[number];
    status: HighwayHealthStatus;
    packets: number;
    reason: string;
  }>;
  fabric: ReturnType<GlobalBrainHighways['stats']>;
  providersUnavailable: string[];
  toolsUnavailable: string[];
  congestionThreshold: number;
  productionAuthorization: false;
};

export function inspectBrainHighwayHealth(highways: GlobalBrainHighways, input: {
  tenantId: string;
  universeId: string;
  congestionThreshold?: number;
}): BrainHighwayHealthMap {
  const threshold = input.congestionThreshold ?? 100;
  const packets = highways.packetsFor(input.tenantId, input.universeId);
  const fabric = highways.stats();
  const providersUnavailable = providerSlots()
    .filter((slot) => slot.state !== 'AVAILABLE')
    .map((slot) => slot.provider);
  const toolsUnavailable = listSharedToolCapabilities()
    .filter((tool) => tool.state !== 'AVAILABLE')
    .map((tool) => tool.id);

  const lanes = BRAIN_HIGHWAY_LANES.map((lane) => {
    const lanePackets = packets.filter((packet) => packet.fromLane === lane || packet.toLane === lane).length;
    if (lanePackets >= threshold) {
      return { lane, status: 'CONGESTED' as const, packets: lanePackets, reason: 'Packet volume exceeded congestion threshold.' };
    }
    if (lane === 'tool_model' && toolsUnavailable.includes('local_model')) {
      return { lane, status: 'UNAVAILABLE' as const, packets: lanePackets, reason: 'Local model is not configured/verified.' };
    }
    if (lanePackets === 0) {
      return { lane, status: 'DEGRADED' as const, packets: 0, reason: 'Lane registered but idle in this scope.' };
    }
    return { lane, status: 'HEALTHY' as const, packets: lanePackets, reason: 'Lane accepted scoped packets.' };
  });

  return {
    generatedAt: new Date().toISOString(),
    lanes,
    fabric,
    providersUnavailable,
    toolsUnavailable,
    congestionThreshold: threshold,
    productionAuthorization: false,
  };
}
