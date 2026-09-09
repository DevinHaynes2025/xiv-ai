/**
 * 62L-EX3 — Algorithm families registry + algorithm contract.
 * Inspiration names only — no physical QPU implication.
 */

import { ex3Deny, type Ex3Denial, type Ex3TenantScope } from './ex3-types.ts';

export const ALGORITHM_FAMILIES = [
  'ANNEALING_INSPIRED',
  'QUBO_INSPIRED',
  'ISING_INSPIRED',
  'TENSOR_NETWORK_INSPIRED',
  'AMPLITUDE_INSPIRED_SEARCH',
  'PROBABILISTIC_SAMPLING',
  'GRAPH_OPTIMIZATION',
  'VARIATIONAL_INSPIRED_OPTIMIZATION',
  'HYBRID_HEURISTIC',
  'QUANTUM_WALK_INSPIRED',
  'LINEAR_ALGEBRA_ACCELERATION',
  'CONSTRAINT_OPTIMIZATION',
] as const;

export type AlgorithmFamily = (typeof ALGORITHM_FAMILIES)[number];

export const EX3_PROBLEM_CLASSES = [
  'SUPPLY_CHAIN_ROUTING',
  'FREIGHT_OPTIMIZATION',
  'WAREHOUSE_ALLOCATION',
  'INVENTORY_OPTIMIZATION',
  'VEHICLE_ROUTING',
  'JOB_SCHEDULING',
  'RESOURCE_ALLOCATION',
  'NETWORK_ROUTING',
  'GRAPH_PARTITIONING',
  'PORTFOLIO_SIMULATION',
  'PRICING_SIMULATION',
  'SEARCH',
  'CLUSTERING',
  'FEATURE_SELECTION',
  'ENERGY_SCHEDULING',
  'COMPUTE_PLACEMENT',
] as const;

export type Ex3ProblemClass = (typeof EX3_PROBLEM_CLASSES)[number];

/** Verified-local hardware labels (independent of EX2 DeviceClass CPU/GPU/NPU). */
export const QI_HARDWARE_CLASSES = [
  'VERIFIED_CPU',
  'VERIFIED_AMD_GPU',
  'VERIFIED_AMD_NPU',
  'VERIFIED_NVIDIA_GPU',
  'VERIFIED_INTEL_GPU',
  'VERIFIED_INTEL_NPU',
  'UNVERIFIED_GPU',
  'UNVERIFIED_NPU',
  'LOCAL_CPU',
] as const;

export type QiHardwareClass = (typeof QI_HARDWARE_CLASSES)[number];

export const ALGORITHM_STATUSES = [
  'CANDIDATE',
  'REGISTERED',
  'VALIDATED',
  'DEPRECATED',
  'REJECTED',
] as const;

export type AlgorithmStatus = (typeof ALGORITHM_STATUSES)[number];

export type AlgorithmContract = {
  algorithmId: string;
  algorithmFamily: AlgorithmFamily;
  version: string;
  problemClasses: readonly Ex3ProblemClass[];
  inputContract: string;
  outputContract: string;
  parameterSchema: Record<string, unknown>;
  deterministic: boolean;
  seedRequired: boolean;
  precisionRequirements: string;
  minimumHardwareState: 'VERIFIED' | 'NOT_TESTED' | 'DOCUMENTED';
  supportedDeviceClasses: readonly QiHardwareClass[];
  baselineAlgorithmId: string | null;
  baselineRequired: boolean;
  sourceClass: 'PUBLIC_LITERATURE' | 'LICENSED_REF' | 'XIV_PRIOR_EXPERIMENT' | 'VERIFIED_LESSON';
  sourceRefs: readonly string[];
  license: string;
  implementationOwner: string;
  createdAt: string;
  lastValidatedAt: string | null;
  status: AlgorithmStatus;
  inspirationOnly: true;
  physicalQpuImplied: false;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type AlgorithmRegistry = {
  algorithms: Map<string, AlgorithmContract>;
};

export function createAlgorithmRegistry(): AlgorithmRegistry {
  return { algorithms: new Map() };
}

export function registerAlgorithm(
  registry: AlgorithmRegistry,
  input: Omit<
    AlgorithmContract,
    'inspirationOnly' | 'physicalQpuImplied' | 'createdAt' | 'lastValidatedAt' | 'status'
  > & {
    status?: AlgorithmStatus;
    createdAt?: string;
    lastValidatedAt?: string | null;
  },
  scope: Ex3TenantScope,
): AlgorithmContract | Ex3Denial {
  if (
    input.orgId !== scope.orgId ||
    input.tenantId !== scope.tenantId ||
    input.universeId !== scope.universeId
  ) {
    return ex3Deny('CROSS_TENANT_OR_UNIVERSE_DENIED — algorithm registration scoped to caller.');
  }
  if (!(ALGORITHM_FAMILIES as readonly string[]).includes(input.algorithmFamily)) {
    return ex3Deny(`UNKNOWN_ALGORITHM_FAMILY: ${input.algorithmFamily}`);
  }
  for (const pc of input.problemClasses) {
    if (!(EX3_PROBLEM_CLASSES as readonly string[]).includes(pc)) {
      return ex3Deny(`UNKNOWN_PROBLEM_CLASS: ${pc}`);
    }
  }
  if (input.baselineRequired && !input.baselineAlgorithmId) {
    return ex3Deny('BASELINE_REQUIRED — baselineAlgorithmId must be set when baselineRequired=true.');
  }

  const contract: AlgorithmContract = {
    ...input,
    inspirationOnly: true,
    physicalQpuImplied: false,
    createdAt: input.createdAt ?? new Date().toISOString(),
    lastValidatedAt: input.lastValidatedAt ?? null,
    status: input.status ?? 'CANDIDATE',
  };
  registry.algorithms.set(contract.algorithmId, contract);
  return contract;
}

export function seedExampleQiAlgorithms(
  registry: AlgorithmRegistry,
  scope: Ex3TenantScope,
): AlgorithmContract[] {
  const annealing = registerAlgorithm(
    registry,
    {
      algorithmId: 'qi-annealing-v1',
      algorithmFamily: 'ANNEALING_INSPIRED',
      version: '1.0.0',
      problemClasses: ['VEHICLE_ROUTING', 'JOB_SCHEDULING', 'GRAPH_PARTITIONING'],
      inputContract: 'weighted_graph_or_qubo_like_matrix',
      outputContract: 'best_assignment_score_vector',
      parameterSchema: { temperatureSchedule: 'geometric', iterations: 'number', seed: 'number' },
      deterministic: true,
      seedRequired: true,
      precisionRequirements: 'float64_tolerance_1e-6',
      minimumHardwareState: 'VERIFIED',
      supportedDeviceClasses: ['VERIFIED_CPU', 'LOCAL_CPU', 'VERIFIED_AMD_GPU', 'VERIFIED_NVIDIA_GPU'],
      baselineAlgorithmId: 'classical-greedy-v1',
      baselineRequired: true,
      sourceClass: 'PUBLIC_LITERATURE',
      sourceRefs: ['open-literature:simulated-annealing-inspired-heuristic'],
      license: 'Apache-2.0-compatible-research',
      implementationOwner: 'xiv-ex3-algorithm-lab',
      orgId: scope.orgId,
      tenantId: scope.tenantId,
      universeId: scope.universeId,
    },
    scope,
  );
  const walk = registerAlgorithm(
    registry,
    {
      algorithmId: 'qi-qwalk-search-v1',
      algorithmFamily: 'QUANTUM_WALK_INSPIRED',
      version: '1.0.0',
      problemClasses: ['SEARCH', 'NETWORK_ROUTING', 'GRAPH_PARTITIONING'],
      inputContract: 'adjacency_list',
      outputContract: 'ranked_path_scores',
      parameterSchema: { hops: 'number', seed: 'number' },
      deterministic: true,
      seedRequired: true,
      precisionRequirements: 'float64_tolerance_1e-6',
      minimumHardwareState: 'VERIFIED',
      supportedDeviceClasses: ['VERIFIED_CPU', 'LOCAL_CPU'],
      baselineAlgorithmId: 'classical-bfs-v1',
      baselineRequired: true,
      sourceClass: 'PUBLIC_LITERATURE',
      sourceRefs: ['open-literature:quantum-walk-inspired-search'],
      license: 'Apache-2.0-compatible-research',
      implementationOwner: 'xiv-ex3-algorithm-lab',
      orgId: scope.orgId,
      tenantId: scope.tenantId,
      universeId: scope.universeId,
    },
    scope,
  );
  const out: AlgorithmContract[] = [];
  if (!('denied' in annealing)) out.push(annealing);
  if (!('denied' in walk)) out.push(walk);
  return out;
}

export function familyImpliesPhysicalQpu(_family: AlgorithmFamily): false {
  return false;
}
