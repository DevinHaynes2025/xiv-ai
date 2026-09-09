/**
 * 62L-EX16 — CPU/GPU/NPU translation into execution primitives →
 * Cross-Chip Capability Graph. No hard-coded GPU/NPU=better.
 * Mobile/edge FULL_WORKLOAD → EDGE_PROFILE with recorded reductions.
 */

import type { XivProblemIR } from './problem-ir.ts';
import {
  EX16_LOCKS,
  type ChipKind,
} from './types.ts';

export type ExecutionPrimitive = {
  id: string;
  op: 'MATMUL' | 'REDUCE' | 'SAMPLE' | 'SEARCH' | 'SCHEDULE' | 'ENCODE' | 'MEASURE';
  chipHints: ChipKind[];
  costHint: number | null;
};

export type CrossChipCapabilityNode = {
  chip: ChipKind;
  capableOps: ExecutionPrimitive['op'][];
  /** Capability score is evidence-backed later; never auto GPU>CPU. */
  preferredByDefault: false;
};

export type CrossChipCapabilityGraph = {
  workloadIrId: string;
  nodes: CrossChipCapabilityNode[];
  edges: { from: ChipKind; to: ChipKind; relation: 'ALTERNATE' | 'FALLBACK' }[];
  hardCodedGpuNpuBetter: false;
};

export type EdgeProfile = {
  profileId: string;
  sourceWorkloadIrId: string;
  mode: 'EDGE_PROFILE';
  from: 'FULL_WORKLOAD';
  reductions: string[];
  retainedOps: ExecutionPrimitive['op'][];
};

export function lowerToExecutionPrimitives(problem: XivProblemIR): ExecutionPrimitive[] {
  const primitives: ExecutionPrimitive[] = [
    {
      id: 'ep_search',
      op: 'SEARCH',
      chipHints: ['CPU', 'GPU', 'NPU', 'EDGE'],
      costHint: null,
    },
  ];
  if (problem.matrices.length > 0 || problem.dimensions.m > 0) {
    primitives.push({
      id: 'ep_matmul',
      op: 'MATMUL',
      chipHints: ['CPU', 'GPU', 'NPU'],
      costHint: null,
    });
  }
  if (problem.preferredExecutionClasses.includes('SIMULATED_QUANTUM')) {
    primitives.push({
      id: 'ep_sample',
      op: 'SAMPLE',
      chipHints: ['CPU', 'SIMULATOR'],
      costHint: null,
    });
  }
  primitives.push({
    id: 'ep_measure',
    op: 'MEASURE',
    chipHints: ['CPU', 'SIMULATOR', 'QPU_CANDIDATE'],
    costHint: null,
  });
  return primitives;
}

export function buildCrossChipCapabilityGraph(problem: XivProblemIR): CrossChipCapabilityGraph {
  const primitives = lowerToExecutionPrimitives(problem);
  const chips: ChipKind[] = ['CPU', 'GPU', 'NPU', 'EDGE', 'SIMULATOR'];
  const nodes: CrossChipCapabilityNode[] = chips.map((chip) => ({
    chip,
    capableOps: primitives.filter((p) => p.chipHints.includes(chip)).map((p) => p.op),
    preferredByDefault: false,
  }));
  return {
    workloadIrId: problem.irId,
    nodes,
    edges: [
      { from: 'CPU', to: 'GPU', relation: 'ALTERNATE' },
      { from: 'CPU', to: 'NPU', relation: 'ALTERNATE' },
      { from: 'GPU', to: 'CPU', relation: 'FALLBACK' },
      { from: 'NPU', to: 'CPU', relation: 'FALLBACK' },
      { from: 'EDGE', to: 'CPU', relation: 'FALLBACK' },
    ],
    hardCodedGpuNpuBetter: EX16_LOCKS.GPU_NPU_HARDCODED_BETTER,
  };
}

export function cpuGpuNpuShareWorkloadIr(problem: XivProblemIR): {
  sharedIrId: string;
  paths: { chip: ChipKind; irId: string }[];
} {
  return {
    sharedIrId: problem.irId,
    paths: (['CPU', 'GPU', 'NPU'] as ChipKind[]).map((chip) => ({
      chip,
      irId: problem.irId,
    })),
  };
}

export function reduceFullWorkloadToEdgeProfile(problem: XivProblemIR): EdgeProfile {
  const primitives = lowerToExecutionPrimitives(problem);
  const retained = primitives
    .filter((p) => p.chipHints.includes('EDGE') || p.op === 'SEARCH' || p.op === 'MEASURE')
    .map((p) => p.op);
  const reductions: string[] = [];
  if (problem.dimensions.n > 64) reductions.push(`n ${problem.dimensions.n}→64`);
  if (problem.matrices.length > 0) reductions.push('drop heavy MATMUL batches');
  if (problem.tensors.length > 0) reductions.push('tensor ops deferred');
  reductions.push('FULL_WORKLOAD→EDGE_PROFILE');
  return {
    profileId: `edge_${problem.irId}`,
    sourceWorkloadIrId: problem.irId,
    mode: 'EDGE_PROFILE',
    from: 'FULL_WORKLOAD',
    reductions,
    retainedOps: retained,
  };
}
