import { populationStats } from './agent-population';
import { NeuralFabric } from './neural-fabric';

// "Trillions of Devins" is an ADDRESSABLE logical context/pathway capacity, never resident processes.
export const ADDRESSABLE_LOGICAL_CONTEXT_CAPACITY = 1_000_000_000_000;
export const ADDRESSABLE_LOGICAL_PATHWAY_CAPACITY = 1_000_000_000_000;
export const MAX_RESIDENT_CONTEXTS = 256;

export type LogicalContextAddress = {
  tenantId: string;
  universeId: string;
  highway: string;
  department: string;
  pathwayIndex: number;
};

export type VirtualPopulationSimulation = {
  addressableLogicalContexts: number;
  addressableLogicalPathways: number;
  residentContexts: number;
  residentProcesses: number;
  honesty: string;
  productionAuthorization: false;
  runningProgramsAreNotTrillions: true;
};

const resident = new Map<string, LogicalContextAddress>();

function addressKey(address: LogicalContextAddress) {
  return `${address.tenantId}/${address.universeId}/${address.highway}/${address.department}/${address.pathwayIndex}`;
}

export function resetVirtualPopulation() {
  resident.clear();
}

export function addressLogicalContext(address: LogicalContextAddress) {
  if (!address.tenantId || !address.universeId) throw new Error('POPULATION_SCOPE_REQUIRED');
  if (address.pathwayIndex < 0 || address.pathwayIndex >= ADDRESSABLE_LOGICAL_PATHWAY_CAPACITY) {
    throw new Error('PATHWAY_INDEX_OUT_OF_ADDRESS_SPACE');
  }
  const key = addressKey(address);
  if (resident.has(key)) return { materialized: false as const, reused: true as const, address, residentCount: resident.size };
  if (resident.size >= MAX_RESIDENT_CONTEXTS) {
    return { materialized: false as const, reused: false as const, address, residentCount: resident.size, reason: 'Resident context budget reached. Address remains logical only.' };
  }
  resident.set(key, address);
  return { materialized: true as const, reused: false as const, address, residentCount: resident.size };
}

export function simulateVirtualPopulation(fabric?: NeuralFabric): VirtualPopulationSimulation {
  const stats = fabric?.stats();
  const population = populationStats();
  return {
    addressableLogicalContexts: ADDRESSABLE_LOGICAL_CONTEXT_CAPACITY,
    addressableLogicalPathways: ADDRESSABLE_LOGICAL_PATHWAY_CAPACITY,
    residentContexts: resident.size,
    residentProcesses: population.active,
    honesty: 'Trillions of Devins means trillions of addressable logical contexts/pathways over sparse indexes, not trillions of running programs.',
    productionAuthorization: false,
    runningProgramsAreNotTrillions: true,
    ...(stats ? { fabricLogicalPathways: stats.logicalPathways } : {}),
  };
}
