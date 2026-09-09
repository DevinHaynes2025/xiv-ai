/**
 * 62L-EX9 — Genome matcher: candidate algorithms only (no auto-winner).
 * Similarity never bypasses benchmarking.
 * Cross-tenant / cross-Universe → DENIED.
 */

import type { ProblemPrimitives } from './problem-primitives.ts';
import {
  EX9_LOCKS,
  ex9Deny,
  type Ex9Denial,
  type ExecutionClass,
  type QuantumSuitabilityLevel,
} from './types.ts';
import type { QuantumWorkloadGenome } from './workload-genome.ts';

export type AlgorithmCandidate = {
  candidateId: string;
  family: string;
  executionClass: ExecutionClass;
  rationale: string;
  /** Candidates only — never auto-selected as winner. */
  autoSelectedWinner: false;
  vendorHardCoded: false;
  requiresBenchmark: true;
  historicalSupport: 'NONE' | 'SIMILAR' | 'PRIOR_RUN';
};

export type CandidateSet = {
  genomeId: string;
  candidates: readonly AlgorithmCandidate[];
  winnerSelected: false;
  autoSelectDisabled: true;
  requiresBenchmarkBeforePromotion: true;
  quantumAdvantageVerified: false;
};

export type SimilarityMatch = {
  sourceGenomeId: string;
  similarGenomeId: string;
  score: number;
  /** Similarity never skips benchmark. */
  bypassesBenchmark: false;
  promotionAllowed: false;
  note: string;
};

export type HistoricalKnowledgeRecord = {
  genomeId: string;
  tenantId: string;
  universeId: string;
  family: string;
  outcomeSummary: string;
  benchmarked: boolean;
};

const FAMILY_BY_INTENT: Record<string, readonly string[]> = {
  ROUTING: ['classical_heuristic_routing', 'quantum_inspired_annealing', 'ilp_exact'],
  SCHEDULING: ['classical_list_scheduling', 'cp_sat', 'quantum_inspired_qaoa_classical'],
  PARTITIONING: ['spectral_partition', 'multilevel_partition', 'qubo_research_mapping'],
  CLUSTERING: ['kmeans', 'spectral_clustering', 'quantum_inspired_sampling'],
  SEARCH: ['classical_search', 'monte_carlo_tree', 'grover_inspired_classical'],
  SAMPLING: ['mcmc', 'quantum_inspired_boltzmann', 'local_simulator_sampling'],
  SIMULATION: ['classical_ode', 'tensor_network_sim', 'local_circuit_simulator'],
  LINEAR_ALGEBRA: ['dense_blas', 'sparse_iterative', 'quantum_inspired_hhl_classical'],
  NONLINEAR_OPTIMIZATION: ['gradient_based', 'evolutionary', 'quantum_inspired_pso'],
  CONSTRAINT_SOLVING: ['sat_cp', 'ilp', 'qubo_research_mapping'],
  MATCHING: ['hungarian', 'min_cost_flow', 'quantum_inspired_matching'],
};

function familiesForPrimitives(primitives: ProblemPrimitives): string[] {
  const out = new Set<string>();
  for (const intent of primitives.intents) {
    const families = FAMILY_BY_INTENT[intent] ?? ['classical_generic'];
    for (const f of families) out.add(f);
  }
  if (primitives.structural.includes('GRAPH')) {
    out.add('graph_classical');
    out.add('quantum_inspired_graph');
  }
  if (primitives.structural.includes('MATRIX')) {
    out.add('matrix_classical');
  }
  return [...out];
}

function executionClassForFamily(family: string): ExecutionClass {
  if (family.includes('simulator') || family.includes('tensor_network')) {
    return 'SIMULATED_QUANTUM';
  }
  if (family.includes('quantum_inspired') || family.includes('qubo_research')) {
    return 'QUANTUM_INSPIRED';
  }
  return 'CLASSICAL';
}

export function generateAlgorithmCandidates(input: {
  genome: QuantumWorkloadGenome;
  historical?: readonly HistoricalKnowledgeRecord[];
  attemptAutoSelectWinner?: boolean;
  attemptHardCodeVendor?: boolean;
}): CandidateSet | Ex9Denial {
  if (input.attemptAutoSelectWinner || EX9_LOCKS.AUTO_SELECT_ALGORITHM_WINNER) {
    return ex9Deny(
      'AUTO_SELECT_ALGORITHM_WINNER=false — candidates only; no auto-winner.',
    );
  }
  if (input.attemptHardCodeVendor || EX9_LOCKS.HARD_CODE_VENDOR_WINNER) {
    return ex9Deny(
      'HARD_CODE_VENDOR_WINNER=false — genome first, then candidates; no vendor hard-code.',
    );
  }

  const families =
    input.genome.candidateAlgorithmFamilies.length > 0
      ? [...input.genome.candidateAlgorithmFamilies]
      : familiesForPrimitives(input.genome.primitives);

  const hist = input.historical ?? [];
  const candidates: AlgorithmCandidate[] = families.map((family, i) => {
    const prior = hist.find(
      (h) =>
        h.family === family &&
        h.tenantId === input.genome.tenantId &&
        h.universeId === input.genome.universeId,
    );
    return {
      candidateId: `${input.genome.genomeId}-cand-${i}-${family}`,
      family,
      executionClass: executionClassForFamily(family),
      rationale: `Matched from genome primitives/intents for ${input.genome.problemClass}.`,
      autoSelectedWinner: false,
      vendorHardCoded: false,
      requiresBenchmark: true,
      historicalSupport: prior
        ? prior.benchmarked
          ? 'PRIOR_RUN'
          : 'SIMILAR'
        : 'NONE',
    };
  });

  return {
    genomeId: input.genome.genomeId,
    candidates,
    winnerSelected: false,
    autoSelectDisabled: true,
    requiresBenchmarkBeforePromotion: true,
    quantumAdvantageVerified: false,
  };
}

export function scoreGenomeSimilarity(input: {
  a: QuantumWorkloadGenome;
  b: QuantumWorkloadGenome;
  attemptBypassBenchmark?: boolean;
}): SimilarityMatch | Ex9Denial {
  if (input.a.tenantId !== input.b.tenantId) {
    return ex9Deny('CROSS_TENANT_ACCESS=false — similarity denied across tenants.');
  }
  if (input.a.universeId !== input.b.universeId) {
    return ex9Deny('CROSS_UNIVERSE_ACCESS=false — similarity denied across Universes.');
  }
  if (input.attemptBypassBenchmark || EX9_LOCKS.SIMILARITY_BYPASSES_BENCHMARK) {
    return ex9Deny(
      'SIMILARITY_BYPASSES_BENCHMARK=false — similarity does not bypass benchmarking.',
    );
  }

  let score = 0;
  if (input.a.problemClass === input.b.problemClass) score += 0.35;
  if (input.a.primitives.domainClass === input.b.primitives.domainClass) score += 0.2;
  const sharedStructural = input.a.primitives.structural.filter((s) =>
    input.b.primitives.structural.includes(s),
  );
  score += Math.min(0.25, sharedStructural.length * 0.08);
  if (input.a.sizes.n === input.b.sizes.n) score += 0.1;
  if (input.a.objectiveType === input.b.objectiveType) score += 0.1;

  return {
    sourceGenomeId: input.a.genomeId,
    similarGenomeId: input.b.genomeId,
    score: Math.min(1, score),
    bypassesBenchmark: false,
    promotionAllowed: false,
    note: 'Similarity is advisory only; benchmark still required before any promotion.',
  };
}

export function assertTenantUniverseAccess(input: {
  actorTenantId: string;
  actorUniverseId: string;
  genome: QuantumWorkloadGenome;
}): true | Ex9Denial {
  if (input.actorTenantId !== input.genome.tenantId) {
    return ex9Deny('CROSS_TENANT_DENIED — genome tenant isolation.');
  }
  if (input.actorUniverseId !== input.genome.universeId) {
    return ex9Deny('CROSS_UNIVERSE_DENIED — genome Universe isolation.');
  }
  return true;
}

export function suitabilityToAdvantageClaim(
  level: QuantumSuitabilityLevel,
): { level: QuantumSuitabilityLevel; quantumAdvantageVerified: false } | Ex9Denial {
  void level;
  if (EX9_LOCKS.QUANTUM_SUITABILITY_EQUALS_ADVANTAGE) {
    return ex9Deny('Lock violated.');
  }
  return { level, quantumAdvantageVerified: false };
}
