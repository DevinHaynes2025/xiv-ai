/**
 * 62L-EX barrel — EX2 Classical Baseline First + EX3 Quantum-Inspired Algorithm Lab.
 * Extends Home Base + Agent Mesh + Classical Baseline Lab + Cross-Chip Graph +
 * Benchmark Ledger + Evidence System. Not a second autonomous AI framework.
 *
 * EX3 additions use EX3_* / Qi* names to avoid clobbering EX2 SoT exports.
 */

export * from './types.ts';
export * from './baseline.ts';
export * from './comparison.ts';
export * from './benchmark.ts';
export * from './reproducibility.ts';
export * from './pathways.ts';
export * from './agent.ts';

export * from './ex3-types.ts';
export * from './soft-wire.ts';
export * from './algorithm-registry.ts';
export * from './problem-genome.ts';
export * from './quantum-inspired.ts';
export * from './experiment.ts';
export * from './algorithm-dna.ts';

import {
  createAlgorithmRegistry,
  seedExampleQiAlgorithms,
  type AlgorithmRegistry,
} from './algorithm-registry.ts';
import {
  createHistoricalBrain,
  type HistoricalAlgorithmBrain,
} from './algorithm-dna.ts';
import {
  EX3_CANONICAL_FLOW,
  EX3_DB_CANDIDATES_STATUS,
  EX3_LOCKS,
  EX3_NEXT_PHASE_TITLE,
  EX3_SOT_ISSUE,
  EX3_SOT_LABEL,
  EX3_HONESTY_BANNER,
  assertEx3LocksIntact,
  type Ex3TenantScope,
} from './ex3-types.ts';
import { buildWorkloadGenome, routeByGenome } from './problem-genome.ts';
import { ex3SoftWireHopState, ex3SoftWireSnapshot } from './soft-wire.ts';

export type Ex3LabState = {
  registry: AlgorithmRegistry;
  brain: HistoricalAlgorithmBrain;
};

export function createEx3Lab(): Ex3LabState {
  return {
    registry: createAlgorithmRegistry(),
    brain: createHistoricalBrain(),
  };
}

export type Ex3CycleHop = {
  hop: string;
  state: 'PASS' | 'WAITING_DATA' | 'DENIED' | 'COMPLETED';
  summary: string;
};

export type Ex3CycleReport = {
  label: typeof EX3_SOT_LABEL;
  issue: typeof EX3_SOT_ISSUE;
  honesty: typeof EX3_HONESTY_BANNER;
  locksIntact: boolean;
  l4Enabled: false;
  dbCandidates: typeof EX3_DB_CANDIDATES_STATUS;
  nextPhase: typeof EX3_NEXT_PHASE_TITLE;
  flow: typeof EX3_CANONICAL_FLOW;
  hops: Ex3CycleHop[];
  softWires: ReturnType<typeof ex3SoftWireSnapshot>;
};

export function runQuantumInspiredAlgorithmLabCycle(input?: {
  scope?: Ex3TenantScope;
  repoRoot?: string;
}): Ex3CycleReport {
  const scope: Ex3TenantScope = input?.scope ?? {
    orgId: 'org-ex3',
    tenantId: 'ten-ex3',
    universeId: 'uni-ex3',
  };
  const soft = ex3SoftWireSnapshot(input?.repoRoot);
  const lab = createEx3Lab();
  seedExampleQiAlgorithms(lab.registry, scope);

  const genome = buildWorkloadGenome({
    problemClass: 'VEHICLE_ROUTING',
    variables: 40,
    constraints: 12,
    objectiveFunctions: ['min_cost'],
    graphStructure: 'sparse',
    matrixStructure: 'sparse',
    sparsity: 0.85,
    searchSpaceSize: 1e6,
    precision: 'float64',
    stochasticity: 'seeded_stochastic',
    parallelism: 'data',
    memoryRequirementMb: 512,
    latencyTargetMs: 100,
    problemSize: 40,
  });

  const hops: Ex3CycleHop[] = [
    {
      hop: 'honesty_locks',
      state: assertEx3LocksIntact() ? 'PASS' : 'DENIED',
      summary: `L4=${EX3_LOCKS.L4_AUTONOMY_ENABLED}; second_framework=${EX3_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK}`,
    },
    {
      hop: 'soft_wire_ex1',
      state: ex3SoftWireHopState(soft.ex1Mission),
      summary: soft.ex1Mission.note,
    },
    {
      hop: 'soft_wire_ex2_baseline',
      state: ex3SoftWireHopState(soft.ex2Baseline),
      summary: soft.ex2Baseline.note,
    },
    {
      hop: 'soft_wire_ex2_comparison',
      state: ex3SoftWireHopState(soft.ex2Comparison),
      summary: soft.ex2Comparison.note,
    },
    {
      hop: 'soft_wire_agent_mesh',
      state: ex3SoftWireHopState(soft.agentMesh),
      summary: soft.agentMesh.note,
    },
    {
      hop: 'soft_wire_chipgraph',
      state: ex3SoftWireHopState(soft.chipgraph),
      summary: soft.chipgraph.note,
    },
    {
      hop: 'soft_wire_benchmarks',
      state: ex3SoftWireHopState(soft.benchmarks),
      summary: soft.benchmarks.note,
    },
    {
      hop: 'soft_wire_guardian',
      state: ex3SoftWireHopState(soft.guardian),
      summary: soft.guardian.note,
    },
  ];

  if (!('denied' in genome)) {
    hops.push({
      hop: 'workload_genome',
      state: 'PASS',
      summary: `genome=${genome.genomeId} size=${genome.problemSize}`,
    });
    const advice = routeByGenome(genome);
    hops.push({
      hop: 'genome_route',
      state: advice.vendorHardCoded ? 'DENIED' : 'PASS',
      summary: advice.rationale,
    });
  }

  hops.push({
    hop: 'canonical_flow_encoded',
    state: 'PASS',
    summary: EX3_CANONICAL_FLOW.join(' → '),
  });

  return {
    label: EX3_SOT_LABEL,
    issue: EX3_SOT_ISSUE,
    honesty: EX3_HONESTY_BANNER,
    locksIntact: assertEx3LocksIntact(),
    l4Enabled: false,
    dbCandidates: EX3_DB_CANDIDATES_STATUS,
    nextPhase: EX3_NEXT_PHASE_TITLE,
    flow: EX3_CANONICAL_FLOW,
    hops,
    softWires: soft,
  };
}
