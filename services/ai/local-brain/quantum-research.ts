export type QuantumAlgorithm = 'qaoa' | 'vqe' | 'amplitude_estimation' | 'quantum_walk' | 'custom_research';
export type QuantumBackend = 'classical_simulator' | 'quantum_simulator' | 'quantum_qpu';
export type ExperimentState = 'DRAFT' | 'READY_FOR_SIMULATION' | 'UNAVAILABLE' | 'COMPLETED' | 'REJECTED';

export type QuantumExperiment = {
  id: string;
  objective: string;
  algorithm: QuantumAlgorithm;
  backend: QuantumBackend;
  qubitCount: number;
  shots: number;
  state: ExperimentState;
  classicalBaselineRequired: true;
  claimsQuantumAdvantage: false;
  productionAuthorization: false;
  evidenceRefs: string[];
  notes: string[];
};

const MAX_RESEARCH_QUBITS = 40;
const MAX_SHOTS = 100_000;

export function createQuantumExperiment(input: {
  id: string;
  objective: string;
  algorithm: QuantumAlgorithm;
  backend?: QuantumBackend;
  qubitCount: number;
  shots?: number;
  backendVerified?: boolean;
}): QuantumExperiment {
  if (!input.objective.trim()) throw new Error('QUANTUM_OBJECTIVE_REQUIRED');
  if (!Number.isInteger(input.qubitCount) || input.qubitCount < 1 || input.qubitCount > MAX_RESEARCH_QUBITS) {
    throw new Error('QUBIT_COUNT_OUT_OF_BOUNDED_RESEARCH_RANGE');
  }
  const shots = Math.max(1, Math.min(input.shots ?? 1024, MAX_SHOTS));
  const backend = input.backend ?? 'classical_simulator';
  const backendNeedsExternalProof = backend !== 'classical_simulator';
  const state: ExperimentState = backendNeedsExternalProof && !input.backendVerified
    ? 'UNAVAILABLE'
    : 'READY_FOR_SIMULATION';

  return {
    id: input.id,
    objective: input.objective.trim(),
    algorithm: input.algorithm,
    backend,
    qubitCount: input.qubitCount,
    shots,
    state,
    classicalBaselineRequired: true,
    claimsQuantumAdvantage: false,
    productionAuthorization: false,
    evidenceRefs: [],
    notes: [
      'Quantum research output is experimental decision support, not proof of quantum advantage.',
      'Every experiment must compare against a reproducible classical baseline.',
      'Real QPU execution remains unavailable until a provider is configured, authorized and verified.',
    ],
  };
}

export type QuantOptimizationProblem = {
  id: string;
  variables: number;
  objective: 'minimize_cost' | 'minimize_latency' | 'maximize_throughput' | 'balance_risk_return';
  constraints: string[];
  provenanceRefs: string[];
};

export function validateQuantProblem(problem: QuantOptimizationProblem) {
  if (!Number.isSafeInteger(problem.variables) || problem.variables < 1 || problem.variables > 100_000) {
    throw new Error('QUANT_VARIABLE_COUNT_INVALID');
  }
  if (problem.provenanceRefs.length === 0) throw new Error('QUANT_PROVENANCE_REQUIRED');
  return { valid: true, classicalBaselineRequired: true, quantumExecutionAuthorized: false } as const;
}
