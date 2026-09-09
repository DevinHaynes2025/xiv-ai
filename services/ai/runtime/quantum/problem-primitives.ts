/**
 * 62L-EX9 — Problem primitives + problem classes.
 * Genome describes structure first; vendors are never hard-coded winners.
 */

import { ex9Deny, type Ex9Denial } from './types.ts';

/** Structural primitives. */
export const STRUCTURAL_PRIMITIVES = [
  'GRAPH',
  'MATRIX',
  'VECTOR',
  'TENSOR',
  'SEQUENCE',
  'TREE',
] as const;

export type StructuralPrimitive = (typeof STRUCTURAL_PRIMITIVES)[number];

/** Optimization / search nature. */
export const OPTIMIZATION_NATURES = [
  'COMBINATORIAL',
  'CONTINUOUS',
  'DISCRETE',
  'MIXED_INTEGER',
] as const;

export type OptimizationNature = (typeof OPTIMIZATION_NATURES)[number];

/** Determinism / probability. */
export const PROBABILITY_NATURES = [
  'PROBABILISTIC',
  'DETERMINISTIC',
  'STOCHASTIC',
] as const;

export type ProbabilityNature = (typeof PROBABILITY_NATURES)[number];

/** Computational intents. */
export const COMPUTATIONAL_INTENTS = [
  'SEARCH',
  'SAMPLING',
  'SIMULATION',
  'LINEAR_ALGEBRA',
  'NONLINEAR_OPTIMIZATION',
  'CONSTRAINT_SOLVING',
  'SCHEDULING',
  'ROUTING',
  'CLUSTERING',
  'MATCHING',
  'PARTITIONING',
] as const;

export type ComputationalIntent = (typeof COMPUTATIONAL_INTENTS)[number];

/**
 * Domain problem classes.
 * Financial = research/simulation unless separately authorized.
 */
export const PROBLEM_DOMAIN_CLASSES = [
  'SUPPLY_CHAIN',
  'FREIGHT',
  'INVENTORY',
  'WAREHOUSE',
  'VRP',
  'JOB_SCHEDULING',
  'RESOURCE_SCHEDULING',
  'COMPUTE_SCHEDULING',
  'AGENT_PLACEMENT',
  'NETWORK_ROUTING',
  'GRAPH_PARTITIONING',
  'SEARCH_RETRIEVAL',
  'CLUSTERING',
  'FEATURE_SELECTION',
  'PRICING_SIMULATION',
  'PORTFOLIO_SIMULATION',
  'ENERGY_CAPACITY',
  'QUANTUM_RESEARCH',
  'CIRCUIT_SIMULATION',
  'OTHER',
] as const;

export type ProblemDomainClass = (typeof PROBLEM_DOMAIN_CLASSES)[number];

export type ProblemPrimitives = {
  structural: readonly StructuralPrimitive[];
  optimizationNature: readonly OptimizationNature[];
  probabilityNature: readonly ProbabilityNature[];
  intents: readonly ComputationalIntent[];
  domainClass: ProblemDomainClass;
  /** Financial domains stay research/simulation unless authorized. */
  financialAuthorizationRequired: boolean;
  constraintsPreserved: true;
};

export type ProblemDefinitionInput = {
  domainClass: ProblemDomainClass;
  structuralHints?: readonly StructuralPrimitive[];
  optimizationNature?: readonly OptimizationNature[];
  probabilityNature?: readonly ProbabilityNature[];
  intents?: readonly ComputationalIntent[];
  constraintCount?: number;
  financialSeparatelyAuthorized?: boolean;
};

const FINANCIAL_DOMAINS: ReadonlySet<ProblemDomainClass> = new Set([
  'PRICING_SIMULATION',
  'PORTFOLIO_SIMULATION',
]);

const DOMAIN_DEFAULT_STRUCTURE: Record<
  ProblemDomainClass,
  {
    structural: readonly StructuralPrimitive[];
    optimizationNature: readonly OptimizationNature[];
    probabilityNature: readonly ProbabilityNature[];
    intents: readonly ComputationalIntent[];
  }
> = {
  SUPPLY_CHAIN: {
    structural: ['GRAPH', 'MATRIX'],
    optimizationNature: ['MIXED_INTEGER', 'COMBINATORIAL'],
    probabilityNature: ['STOCHASTIC', 'DETERMINISTIC'],
    intents: ['ROUTING', 'SCHEDULING', 'CONSTRAINT_SOLVING'],
  },
  FREIGHT: {
    structural: ['GRAPH'],
    optimizationNature: ['COMBINATORIAL'],
    probabilityNature: ['STOCHASTIC'],
    intents: ['ROUTING', 'SCHEDULING'],
  },
  INVENTORY: {
    structural: ['VECTOR', 'MATRIX'],
    optimizationNature: ['CONTINUOUS', 'MIXED_INTEGER'],
    probabilityNature: ['STOCHASTIC'],
    intents: ['NONLINEAR_OPTIMIZATION', 'SIMULATION'],
  },
  WAREHOUSE: {
    structural: ['GRAPH', 'TREE'],
    optimizationNature: ['COMBINATORIAL'],
    probabilityNature: ['DETERMINISTIC'],
    intents: ['SCHEDULING', 'ROUTING', 'MATCHING'],
  },
  VRP: {
    structural: ['GRAPH'],
    optimizationNature: ['COMBINATORIAL'],
    probabilityNature: ['DETERMINISTIC', 'STOCHASTIC'],
    intents: ['ROUTING', 'CONSTRAINT_SOLVING'],
  },
  JOB_SCHEDULING: {
    structural: ['GRAPH', 'SEQUENCE'],
    optimizationNature: ['COMBINATORIAL', 'DISCRETE'],
    probabilityNature: ['DETERMINISTIC'],
    intents: ['SCHEDULING', 'CONSTRAINT_SOLVING'],
  },
  RESOURCE_SCHEDULING: {
    structural: ['GRAPH', 'MATRIX'],
    optimizationNature: ['MIXED_INTEGER'],
    probabilityNature: ['DETERMINISTIC'],
    intents: ['SCHEDULING', 'MATCHING'],
  },
  COMPUTE_SCHEDULING: {
    structural: ['GRAPH', 'VECTOR'],
    optimizationNature: ['COMBINATORIAL'],
    probabilityNature: ['STOCHASTIC'],
    intents: ['SCHEDULING', 'PARTITIONING'],
  },
  AGENT_PLACEMENT: {
    structural: ['GRAPH'],
    optimizationNature: ['COMBINATORIAL'],
    probabilityNature: ['DETERMINISTIC'],
    intents: ['MATCHING', 'PARTITIONING'],
  },
  NETWORK_ROUTING: {
    structural: ['GRAPH'],
    optimizationNature: ['COMBINATORIAL'],
    probabilityNature: ['DETERMINISTIC'],
    intents: ['ROUTING', 'SEARCH'],
  },
  GRAPH_PARTITIONING: {
    structural: ['GRAPH'],
    optimizationNature: ['COMBINATORIAL'],
    probabilityNature: ['DETERMINISTIC'],
    intents: ['PARTITIONING', 'CLUSTERING'],
  },
  SEARCH_RETRIEVAL: {
    structural: ['VECTOR', 'GRAPH'],
    optimizationNature: ['DISCRETE'],
    probabilityNature: ['PROBABILISTIC'],
    intents: ['SEARCH', 'CLUSTERING'],
  },
  CLUSTERING: {
    structural: ['MATRIX', 'VECTOR'],
    optimizationNature: ['CONTINUOUS', 'DISCRETE'],
    probabilityNature: ['PROBABILISTIC'],
    intents: ['CLUSTERING'],
  },
  FEATURE_SELECTION: {
    structural: ['VECTOR', 'MATRIX'],
    optimizationNature: ['COMBINATORIAL'],
    probabilityNature: ['DETERMINISTIC'],
    intents: ['SEARCH', 'CONSTRAINT_SOLVING'],
  },
  PRICING_SIMULATION: {
    structural: ['VECTOR', 'MATRIX', 'SEQUENCE'],
    optimizationNature: ['CONTINUOUS'],
    probabilityNature: ['STOCHASTIC', 'PROBABILISTIC'],
    intents: ['SIMULATION', 'SAMPLING'],
  },
  PORTFOLIO_SIMULATION: {
    structural: ['VECTOR', 'MATRIX'],
    optimizationNature: ['CONTINUOUS', 'MIXED_INTEGER'],
    probabilityNature: ['STOCHASTIC'],
    intents: ['SIMULATION', 'NONLINEAR_OPTIMIZATION'],
  },
  ENERGY_CAPACITY: {
    structural: ['GRAPH', 'MATRIX'],
    optimizationNature: ['MIXED_INTEGER'],
    probabilityNature: ['STOCHASTIC'],
    intents: ['SCHEDULING', 'CONSTRAINT_SOLVING'],
  },
  QUANTUM_RESEARCH: {
    structural: ['TENSOR', 'MATRIX', 'GRAPH'],
    optimizationNature: ['CONTINUOUS', 'COMBINATORIAL'],
    probabilityNature: ['PROBABILISTIC'],
    intents: ['SIMULATION', 'LINEAR_ALGEBRA', 'SAMPLING'],
  },
  CIRCUIT_SIMULATION: {
    structural: ['TENSOR', 'MATRIX'],
    optimizationNature: ['CONTINUOUS'],
    probabilityNature: ['PROBABILISTIC'],
    intents: ['SIMULATION', 'LINEAR_ALGEBRA'],
  },
  OTHER: {
    structural: ['VECTOR'],
    optimizationNature: ['DISCRETE'],
    probabilityNature: ['DETERMINISTIC'],
    intents: ['SEARCH'],
  },
};

export function deriveProblemPrimitives(
  input: ProblemDefinitionInput,
): ProblemPrimitives | Ex9Denial {
  if (!(PROBLEM_DOMAIN_CLASSES as readonly string[]).includes(input.domainClass)) {
    return ex9Deny(`Unknown problem domain class: ${String(input.domainClass)}`);
  }
  const defaults = DOMAIN_DEFAULT_STRUCTURE[input.domainClass];
  const financial = FINANCIAL_DOMAINS.has(input.domainClass);
  if (financial && !input.financialSeparatelyAuthorized) {
    // Still emit primitives, but flag research/simulation-only posture.
  }
  const constraintCount = input.constraintCount ?? 0;
  if (constraintCount < 0) {
    return ex9Deny('constraintCount must be non-negative.');
  }

  return {
    structural: input.structuralHints?.length
      ? input.structuralHints
      : defaults.structural,
    optimizationNature: input.optimizationNature?.length
      ? input.optimizationNature
      : defaults.optimizationNature,
    probabilityNature: input.probabilityNature?.length
      ? input.probabilityNature
      : defaults.probabilityNature,
    intents: input.intents?.length ? input.intents : defaults.intents,
    domainClass: input.domainClass,
    financialAuthorizationRequired: financial && !input.financialSeparatelyAuthorized,
    constraintsPreserved: true,
  };
}

/** Graph workloads must surface GRAPH among structural primitives. */
export function isGraphWorkload(primitives: ProblemPrimitives): boolean {
  return primitives.structural.includes('GRAPH');
}

/** Optimization workloads preserve constraint semantics in the genome. */
export function optimizationConstraintsNote(
  constraintCount: number,
): { constraintCount: number; constraintsPreserved: true } {
  return { constraintCount, constraintsPreserved: true };
}
