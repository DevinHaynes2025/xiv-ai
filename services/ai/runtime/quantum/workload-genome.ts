/**
 * 62L-EX9 — QuantumWorkloadGenome contract + builders.
 * Genome describes the problem DNA; it does NOT imply physical QPU execution.
 * QUBO/Ising representation stays research / quantum-inspired.
 */

import { createHash } from 'node:crypto';

import {
  deriveProblemPrimitives,
  type ProblemDefinitionInput,
  type ProblemPrimitives,
} from './problem-primitives.ts';
import {
  EXECUTION_CLASSES,
  ex9Deny,
  QUANTUM_ADVANTAGE_VERIFIED,
  type EvidenceState,
  type ExecutionClass,
  type Ex9Denial,
  type GenomeStatus,
  type QuantumSuitabilityLevel,
} from './types.ts';

export type ObjectiveType =
  | 'MINIMIZE'
  | 'MAXIMIZE'
  | 'SATISFY'
  | 'SAMPLE'
  | 'SIMULATE'
  | 'COMPARE';

export type GraphGenomeProperties = {
  nodeCount: number;
  edgeCount: number;
  directed: boolean;
  weighted: boolean;
  sparse: boolean;
  density: number;
};

export type MatrixGenomeProperties = {
  rows: number;
  cols: number;
  sparse: boolean;
  symmetric: boolean;
  positiveDefinite: boolean | 'UNKNOWN';
  conditionEstimate: number | 'UNKNOWN';
};

export type ProbabilityGenomeProperties = {
  distributionFamily: string;
  sampleCount: number;
  seedRequired: boolean;
};

export type OptimizationGenomeProperties = {
  variableCount: number;
  constraintCount: number;
  objectiveCount: number;
  quboRepresentable: boolean;
  isingRepresentable: boolean;
  /** QUBO/Ising ≠ physical quantum execution. */
  quboImpliesPhysicalQpu: false;
};

export type QuantumWorkloadGenome = {
  genomeId: string;
  version: string;
  missionId: string;
  taskId: string;
  parentTaskId: string | null;
  tenantId: string;
  universeId: string;
  problemId: string;
  problemClass: string;
  problemVersion: string;
  objective: string;
  objectiveType: ObjectiveType;
  inputSchema: string;
  inputSchemaHash: string;
  datasetVersion: string;
  sizes: {
    n: number;
    m: number;
    k: number;
  };
  counts: {
    variables: number;
    constraints: number;
    objectives: number;
  };
  graph: GraphGenomeProperties | null;
  matrix: MatrixGenomeProperties | null;
  probability: ProbabilityGenomeProperties | null;
  optimization: OptimizationGenomeProperties | null;
  searchSpaceEstimate: number | 'UNKNOWN';
  precision: string;
  tolerance: number | null;
  deterministic: boolean;
  stochastic: boolean;
  seedRequired: boolean;
  parallelismProfile: string;
  memoryProfileMb: number;
  computeProfile: string;
  latencyTargetMs: number | null;
  throughputTargetOps: number | null;
  privacyClass: string;
  dataClass: string;
  localOnly: boolean;
  candidateAlgorithmFamilies: readonly string[];
  executionClasses: readonly ExecutionClass[];
  baselineRequired: true;
  evidenceRequirement: EvidenceState;
  benchmarkRequirement: true;
  primitives: ProblemPrimitives;
  quantumSuitability: QuantumSuitabilityLevel;
  quantumAdvantageVerified: false;
  impliesPhysicalQpuExecution: false;
  status: GenomeStatus;
  createdAt: string;
  expiresAt: string | null;
};

export type BuildGenomeInput = {
  genomeId?: string;
  version?: string;
  missionId: string;
  taskId: string;
  parentTaskId?: string | null;
  tenantId: string;
  universeId: string;
  problemId: string;
  problemClass?: string;
  problemVersion?: string;
  objective: string;
  objectiveType: ObjectiveType;
  inputSchema: string;
  datasetVersion: string;
  sizes?: { n?: number; m?: number; k?: number };
  counts?: { variables?: number; constraints?: number; objectives?: number };
  graph?: GraphGenomeProperties | null;
  matrix?: MatrixGenomeProperties | null;
  probability?: ProbabilityGenomeProperties | null;
  optimization?: Omit<OptimizationGenomeProperties, 'quboImpliesPhysicalQpu'> | null;
  searchSpaceEstimate?: number | 'UNKNOWN';
  precision?: string;
  tolerance?: number | null;
  deterministic?: boolean;
  stochastic?: boolean;
  seedRequired?: boolean;
  parallelismProfile?: string;
  memoryProfileMb?: number;
  computeProfile?: string;
  latencyTargetMs?: number | null;
  throughputTargetOps?: number | null;
  privacyClass?: string;
  dataClass?: string;
  localOnly?: boolean;
  candidateAlgorithmFamilies?: readonly string[];
  executionClasses?: readonly ExecutionClass[];
  evidenceRequirement?: EvidenceState;
  problemDefinition: ProblemDefinitionInput;
  quantumSuitability?: QuantumSuitabilityLevel;
  status?: GenomeStatus;
  createdAt?: string;
  expiresAt?: string | null;
  /** When dataset is known stale relative to genome. */
  datasetStale?: boolean;
  /** Caller attempted to claim physical from genome alone. */
  attemptClaimPhysicalFromGenome?: boolean;
  /** Caller attempted to treat QUBO as physical. */
  attemptClaimQuboPhysical?: boolean;
  /** Caller attempted quantum-advantage from suitability. */
  attemptClaimAdvantageFromSuitability?: boolean;
};

function hashSchema(schema: string): string {
  return createHash('sha256').update(schema).digest('hex').slice(0, 16);
}

function defaultSearchSpace(counts: {
  variables: number;
  constraints: number;
}): number | 'UNKNOWN' {
  if (counts.variables <= 0) return 'UNKNOWN';
  if (counts.variables > 40) return 'UNKNOWN';
  // Rough discrete 2^n estimate only for tiny problems; honesty via UNKNOWN for large.
  return 2 ** counts.variables;
}

export function buildQuantumWorkloadGenome(
  input: BuildGenomeInput,
): QuantumWorkloadGenome | Ex9Denial {
  if (!input.tenantId || !input.universeId) {
    return ex9Deny('tenantId and universeId are required.');
  }
  if (input.attemptClaimPhysicalFromGenome) {
    return ex9Deny(
      'GENOME_IMPLIES_PHYSICAL_QPU=false — genome does not imply physical QPU execution.',
    );
  }
  if (input.attemptClaimQuboPhysical) {
    return ex9Deny(
      'QUBO_EQUALS_PHYSICAL_QPU=false — QUBO/Ising stays research/quantum-inspired.',
    );
  }
  if (input.attemptClaimAdvantageFromSuitability) {
    return ex9Deny(
      'QUANTUM_SUITABILITY_EQUALS_ADVANTAGE=false — suitability ≠ QUANTUM_ADVANTAGE_VERIFIED.',
    );
  }

  const primitives = deriveProblemPrimitives(input.problemDefinition);
  if ('denied' in primitives && primitives.denied) {
    return primitives;
  }

  // Prefer explicit optimization / problemDefinition constraint counts when
  // provided so optimization workloads preserve constraint semantics.
  const counts = {
    variables:
      input.optimization?.variableCount ??
      input.counts?.variables ??
      input.sizes?.n ??
      0,
    constraints:
      input.optimization?.constraintCount ??
      input.problemDefinition.constraintCount ??
      input.counts?.constraints ??
      0,
    objectives:
      input.optimization?.objectiveCount ??
      input.counts?.objectives ??
      1,
  };

  const optimization: OptimizationGenomeProperties | null = input.optimization
    ? {
        ...input.optimization,
        constraintCount: input.optimization.constraintCount,
        quboImpliesPhysicalQpu: false,
      }
    : counts.constraints > 0 || counts.variables > 0
      ? {
          variableCount: counts.variables,
          constraintCount: counts.constraints,
          objectiveCount: counts.objectives,
          quboRepresentable: false,
          isingRepresentable: false,
          quboImpliesPhysicalQpu: false,
        }
      : null;

  let status: GenomeStatus = input.status ?? 'CURRENT';
  if (input.datasetStale) {
    status = 'STALE';
  }

  const executionClasses = (input.executionClasses ?? ['CLASSICAL', 'QUANTUM_INSPIRED']).filter(
    (c) => (EXECUTION_CLASSES as readonly string[]).includes(c),
  ) as ExecutionClass[];

  if (executionClasses.length === 0) {
    return ex9Deny('At least one valid execution class is required.');
  }

  // PHYSICAL_QPU_VERIFIED cannot be asserted by genome construction alone.
  const safeClasses = executionClasses.filter((c) => c !== 'PHYSICAL_QPU_VERIFIED');
  const classesOut: ExecutionClass[] =
    safeClasses.length > 0 ? safeClasses : (['CLASSICAL'] as ExecutionClass[]);

  const genome: QuantumWorkloadGenome = {
    genomeId: input.genomeId ?? `gwg-${input.problemId}-${input.taskId}`,
    version: input.version ?? '1.0.0',
    missionId: input.missionId,
    taskId: input.taskId,
    parentTaskId: input.parentTaskId ?? null,
    tenantId: input.tenantId,
    universeId: input.universeId,
    problemId: input.problemId,
    problemClass: input.problemClass ?? input.problemDefinition.domainClass,
    problemVersion: input.problemVersion ?? '1',
    objective: input.objective,
    objectiveType: input.objectiveType,
    inputSchema: input.inputSchema,
    inputSchemaHash: hashSchema(input.inputSchema),
    datasetVersion: input.datasetVersion,
    sizes: {
      n: input.sizes?.n ?? counts.variables,
      m: input.sizes?.m ?? counts.constraints,
      k: input.sizes?.k ?? counts.objectives,
    },
    counts,
    graph: input.graph ?? null,
    matrix: input.matrix ?? null,
    probability: input.probability ?? null,
    optimization,
    searchSpaceEstimate:
      input.searchSpaceEstimate ?? defaultSearchSpace(counts),
    precision: input.precision ?? 'float64',
    tolerance: input.tolerance ?? null,
    deterministic: input.deterministic ?? !input.stochastic,
    stochastic: input.stochastic ?? false,
    seedRequired: input.seedRequired ?? Boolean(input.stochastic),
    parallelismProfile: input.parallelismProfile ?? 'none',
    memoryProfileMb: input.memoryProfileMb ?? 256,
    computeProfile: input.computeProfile ?? 'cpu-bound',
    latencyTargetMs: input.latencyTargetMs ?? null,
    throughputTargetOps: input.throughputTargetOps ?? null,
    privacyClass: input.privacyClass ?? 'TENANT_PRIVATE',
    dataClass: input.dataClass ?? 'TENANT_AUTHORIZED',
    localOnly: input.localOnly ?? true,
    candidateAlgorithmFamilies: input.candidateAlgorithmFamilies ?? [],
    executionClasses: classesOut,
    baselineRequired: true,
    evidenceRequirement: input.evidenceRequirement ?? 'DOCUMENTED',
    benchmarkRequirement: true,
    primitives,
    quantumSuitability: input.quantumSuitability ?? 'UNKNOWN',
    quantumAdvantageVerified: QUANTUM_ADVANTAGE_VERIFIED,
    impliesPhysicalQpuExecution: false,
    status,
    createdAt: input.createdAt ?? new Date().toISOString(),
    expiresAt: input.expiresAt ?? null,
  };

  return genome;
}

/** Mark genome STALE or REBUILD_REQUIRED when dataset drifts. */
export function refreshGenomeVersionStatus(input: {
  genome: QuantumWorkloadGenome;
  currentDatasetVersion: string;
  rebuildRequired?: boolean;
}): QuantumWorkloadGenome {
  if (input.rebuildRequired) {
    return { ...input.genome, status: 'REBUILD_REQUIRED' };
  }
  if (input.currentDatasetVersion !== input.genome.datasetVersion) {
    return { ...input.genome, status: 'STALE' };
  }
  return { ...input.genome, status: 'CURRENT' };
}

/** Explicit QUBO research representation — never physical. */
export function attachQuboResearchRepresentation(
  genome: QuantumWorkloadGenome,
  opts: { variableCount: number; constraintCount: number },
): QuantumWorkloadGenome | Ex9Denial {
  return {
    ...genome,
    optimization: {
      variableCount: opts.variableCount,
      constraintCount: opts.constraintCount,
      objectiveCount: genome.counts.objectives,
      quboRepresentable: true,
      isingRepresentable: true,
      quboImpliesPhysicalQpu: false,
    },
    executionClasses: genome.executionClasses.includes('QUANTUM_INSPIRED')
      ? genome.executionClasses
      : [...genome.executionClasses, 'QUANTUM_INSPIRED'],
    quantumAdvantageVerified: false,
    impliesPhysicalQpuExecution: false,
  };
}
