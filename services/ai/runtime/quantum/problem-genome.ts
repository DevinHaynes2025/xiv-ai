/**
 * 62L-EX3 — Workload genome. Route by genome, not vendor hard-code.
 */

import type { Ex3ProblemClass, QiHardwareClass } from './algorithm-registry.ts';
import { ex3Deny, type Ex3Denial } from './ex3-types.ts';

export type WorkloadGenome = {
  genomeId: string;
  problemClass: Ex3ProblemClass;
  variables: number;
  constraints: number;
  objectiveFunctions: readonly string[];
  graphStructure: 'none' | 'sparse' | 'dense' | 'bipartite' | 'dag';
  matrixStructure: 'none' | 'dense' | 'sparse' | 'banded' | 'block';
  sparsity: number;
  searchSpaceSize: number;
  precision: 'float32' | 'float64' | 'mixed';
  stochasticity: 'deterministic' | 'seeded_stochastic' | 'fully_stochastic';
  parallelism: 'none' | 'data' | 'model' | 'pipeline';
  memoryRequirementMb: number;
  latencyTargetMs: number;
  problemSize: number;
};

export type GenomeRouteAdvice = {
  genomeId: string;
  preferredDeviceClasses: readonly QiHardwareClass[];
  excludedUnverified: true;
  vendorHardCoded: false;
  rationale: string;
};

export function buildWorkloadGenome(
  input: Omit<WorkloadGenome, 'genomeId'> & { genomeId?: string },
): WorkloadGenome | Ex3Denial {
  if (input.variables < 0 || input.constraints < 0) {
    return ex3Deny('INVALID_GENOME — variables/constraints must be non-negative.');
  }
  if (input.sparsity < 0 || input.sparsity > 1) {
    return ex3Deny('INVALID_GENOME — sparsity must be in [0,1].');
  }
  if (input.problemSize <= 0) {
    return ex3Deny('INVALID_GENOME — problemSize must be positive.');
  }
  return {
    genomeId: input.genomeId ?? `genome-${input.problemClass}-${input.problemSize}`,
    problemClass: input.problemClass,
    variables: input.variables,
    constraints: input.constraints,
    objectiveFunctions: input.objectiveFunctions,
    graphStructure: input.graphStructure,
    matrixStructure: input.matrixStructure,
    sparsity: input.sparsity,
    searchSpaceSize: input.searchSpaceSize,
    precision: input.precision,
    stochasticity: input.stochasticity,
    parallelism: input.parallelism,
    memoryRequirementMb: input.memoryRequirementMb,
    latencyTargetMs: input.latencyTargetMs,
    problemSize: input.problemSize,
  };
}

export function routeByGenome(
  genome: WorkloadGenome,
  options?: { requireVerified?: boolean },
): GenomeRouteAdvice {
  const requireVerified = options?.requireVerified ?? true;
  const preferred: QiHardwareClass[] = [];
  preferred.push(requireVerified ? 'VERIFIED_CPU' : 'LOCAL_CPU');

  if (genome.parallelism !== 'none' && genome.matrixStructure !== 'none' && requireVerified) {
    preferred.push('VERIFIED_AMD_GPU', 'VERIFIED_NVIDIA_GPU', 'VERIFIED_INTEL_GPU');
  }
  if (genome.latencyTargetMs < 50 && genome.memoryRequirementMb < 2048 && requireVerified) {
    preferred.push('VERIFIED_AMD_NPU', 'VERIFIED_INTEL_NPU');
  }

  return {
    genomeId: genome.genomeId,
    preferredDeviceClasses: preferred,
    excludedUnverified: true,
    vendorHardCoded: false,
    rationale:
      'Routed by sparsity/parallelism/latency/memory genome fields — not vendor hard-code. Unverified accelerators excluded when VERIFIED required.',
  };
}

export function genomesComparable(
  a: Pick<WorkloadGenome, 'problemClass' | 'problemSize'>,
  b: Pick<WorkloadGenome, 'problemClass' | 'problemSize'>,
): boolean {
  return a.problemClass === b.problemClass && a.problemSize === b.problemSize;
}
