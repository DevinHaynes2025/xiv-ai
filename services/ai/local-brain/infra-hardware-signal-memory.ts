import { probeHardware, type HardwareCapability } from './hardware-probe';
import { InfrastructurePathwayGraph, type InfrastructureNode, type InfrastructureEdge } from './infrastructure-pathways';
import { getSignalPathway, listSignalPathways, signalInfrastructureHonesty, simulateSignalPathway, type SignalKind } from './signal-infrastructure';
import { inspectChipDataCenterNetwork } from './infra-intelligence';
import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';

type HardwareStore = { snapshots: Array<{ at: string; capabilities: HardwareCapability[] }> };

function hardwarePath(root: string) {
  return xivLocalPath(root, 'hardware-capability-memory.json');
}

export async function rememberHardwareCapabilities(root = process.cwd()) {
  const capabilities = await probeHardware();
  const parsed = await readJsonFile<HardwareStore>(hardwarePath(root), { snapshots: [] });
  const snapshots = Array.isArray(parsed.snapshots) ? parsed.snapshots : [];
  snapshots.push({ at: new Date().toISOString(), capabilities });
  await writeJsonFileAtomic(hardwarePath(root), { snapshots: snapshots.slice(-200) });
  return {
    capabilities,
    plannedAcceleratorsCounted: false as const,
    productionAuthorization: false as const,
  };
}

export async function latestHardwareMemory(root = process.cwd()) {
  const parsed = await readJsonFile<HardwareStore>(hardwarePath(root), { snapshots: [] });
  const snapshots = Array.isArray(parsed.snapshots) ? parsed.snapshots : [];
  return snapshots.at(-1) ?? null;
}

export function mapInfrastructureDependencies(input: {
  tenantId: string;
  universeId: string;
  nodes: InfrastructureNode[];
  edges: InfrastructureEdge[];
}) {
  const graph = new InfrastructurePathwayGraph();
  for (const node of input.nodes) graph.addNode(node);
  for (const edge of input.edges) graph.addEdge(edge);
  const snapshot = graph.snapshot();
  const chip = inspectChipDataCenterNetwork({ tenantId: input.tenantId, universeId: input.universeId });
  return {
    graph: snapshot,
    chip,
    autoPurchase: false as const,
    physicalControl: false as const,
    darkMatterAsInfrastructure: false as const,
    productionAuthorization: false as const,
    mapperId: cortexId('infra'),
  };
}

export function inspectSignalTransportKnowledge(kind: SignalKind) {
  const pathway = getSignalPathway(kind);
  const honesty = signalInfrastructureHonesty();
  return {
    pathway,
    honesty,
    isHardwareControl: false as const,
    isReality: false as const,
    satelliteControl: false as const,
    productionAuthorization: false as const,
  };
}

export function simulateSignalTransport(input: {
  kind: Extract<SignalKind, 'radio' | 'optical_laser' | 'acoustic' | 'satellite_orbital'>;
  from: string;
  to: string;
  distanceKm?: number;
}) {
  return {
    simulation: simulateSignalPathway(input),
    registry: listSignalPathways(),
    isReality: false as const,
    controlsPhysicalDevices: false as const,
  };
}
