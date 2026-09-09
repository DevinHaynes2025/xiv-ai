import {
  connectChipCompute,
  registerChipComputeNode,
  snapshotChipComputeGraph,
  CHIP_COMPUTE_HONESTY,
} from './chip-compute-graph';
import {
  getSignalPathway,
  satelliteOrbitalGateway,
  signalInfrastructureHonesty,
  simulateSignalPathway,
} from './signal-infrastructure';
import { InfrastructurePathwayGraph } from './infrastructure-pathways';

export function inspectChipDataCenterNetwork(input: {
  tenantId: string;
  universeId: string;
}) {
  const graph = snapshotChipComputeGraph({
    tenantId: input.tenantId,
    universeId: input.universeId,
    requiredCapability: 'local_research',
    allowedFamilies: ['cpu_x86_64'],
  });
  const pathways = new InfrastructurePathwayGraph();
  const honesty = {
    ...CHIP_COMPUTE_HONESTY,
    ...signalInfrastructureHonesty(),
    darkMatterAsInfrastructure: false as const,
    darkEnergyAsInfrastructure: false as const,
    autoPurchase: false as const,
    physicalControl: false as const,
    productionAuthorization: false as const,
  };
  return {
    chip: graph,
    network: {
      terrestrial: getSignalPathway('terrestrial_network'),
      satellite: satelliteOrbitalGateway(),
    },
    dataCenterModel: pathways.snapshot(),
    honesty,
  };
}

export function runBoundedSignalResearch(input: {
  kind: 'radio' | 'optical_laser' | 'acoustic' | 'satellite_orbital';
  from: string;
  to: string;
  distanceKm?: number;
}) {
  const sim = simulateSignalPathway(input);
  return {
    ...sim,
    researchOnly: true as const,
    isHardwareControl: false as const,
    isReality: false as const,
    productionAuthorization: false as const,
  };
}

export { registerChipComputeNode, connectChipCompute };
