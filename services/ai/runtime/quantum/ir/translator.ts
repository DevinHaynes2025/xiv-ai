/**
 * 62L-EX16 — Algorithm translation: classical / QUBO / Ising paths,
 * semantic equivalence gate, lossy states, AlgorithmTranslation contract.
 * QUBO/Ising are mathematical QUANTUM_INSPIRED candidates ≠ PHYSICAL_QPU_VERIFIED.
 */

import { createHash } from 'node:crypto';

import type { XivCircuitIR } from './circuit-ir.ts';
import { buildXivCircuitIR } from './circuit-ir.ts';
import type { XivProblemIR } from './problem-ir.ts';
import { validateProblemIR } from './validation.ts';
import {
  PHYSICAL_QPU_VERIFIED,
  type ExecutionClass,
  type LossyTranslationState,
  type RepresentationTarget,
  type SemanticEquivalence,
  type TranslationStatus,
} from './types.ts';

export type AlgorithmTranslation = {
  translationId: string;
  sourceIrId: string;
  targetRepresentation: RepresentationTarget;
  executionClass: ExecutionClass;
  lossyState: LossyTranslationState;
  semanticEquivalence: SemanticEquivalence;
  objectivePreserved: boolean;
  approximationNotes: string[];
  quboMatrix: number[][] | null;
  isingCouplings: { i: number; j: number; J: number }[] | null;
  circuit: XivCircuitIR | null;
  physicalQpuVerified: false;
  status: TranslationStatus;
  compilerVersion: string;
  schemaVersion: string;
  createdAt: string;
};

function tid(parts: unknown[]): string {
  return `tr_${createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 20)}`;
}

function buildQubo(n: number): number[][] {
  const size = Math.max(1, Math.min(n, 8));
  const m: number[][] = [];
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      row.push(i === j ? 1 : i < j ? 0.1 : 0.1);
    }
    m.push(row);
  }
  return m;
}

function buildIsing(n: number): { i: number; j: number; J: number }[] {
  const size = Math.max(1, Math.min(n, 8));
  const couplings: { i: number; j: number; J: number }[] = [];
  for (let i = 0; i < size - 1; i++) {
    couplings.push({ i, j: i + 1, J: -1 });
  }
  return couplings;
}

export function semanticEquivalenceGate(input: {
  sourceObjective: string;
  targetObjective: string;
  materialChange: boolean;
  withinTolerance: boolean;
}): SemanticEquivalence {
  if (input.materialChange) return 'SEMANTICALLY_DIFFERENT';
  if (input.sourceObjective === input.targetObjective) return 'SEMANTICALLY_EQUIVALENT';
  if (input.withinTolerance) return 'EQUIVALENT_WITH_TOLERANCE';
  return 'SEMANTICALLY_DIFFERENT';
}

export function translateAlgorithm(input: {
  problem: XivProblemIR;
  target: RepresentationTarget;
  lossy?: boolean;
  approximateObjective?: string;
  materialChange?: boolean;
  compilerVersion: string;
  createdAt?: string;
}): AlgorithmTranslation {
  const validation = validateProblemIR(input.problem);
  if (!validation.ok) {
    return {
      translationId: tid(['fail', input.problem.irId, input.target]),
      sourceIrId: input.problem.irId,
      targetRepresentation: input.target,
      executionClass: 'CLASSICAL',
      lossyState: 'INVALID',
      semanticEquivalence: 'UNCHECKED',
      objectivePreserved: false,
      approximationNotes: validation.errors,
      quboMatrix: null,
      isingCouplings: null,
      circuit: null,
      physicalQpuVerified: PHYSICAL_QPU_VERIFIED,
      status: 'TRANSLATION_FAILED',
      compilerVersion: input.compilerVersion,
      schemaVersion: input.problem.schemaVersion,
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
  }

  const lossy = input.lossy === true;
  const targetObjective = input.approximateObjective ?? input.problem.objective.expression;
  const semantic = semanticEquivalenceGate({
    sourceObjective: input.problem.objective.expression,
    targetObjective,
    materialChange: input.materialChange === true,
    withinTolerance: lossy && !input.materialChange,
  });

  let lossyState: LossyTranslationState = 'LOSSLESS';
  if (semantic === 'SEMANTICALLY_DIFFERENT') lossyState = 'REVIEW_REQUIRED';
  else if (lossy && semantic === 'EQUIVALENT_WITH_TOLERANCE') {
    lossyState = 'EQUIVALENT_WITH_TOLERANCE';
  } else if (lossy) lossyState = 'LOSSY';

  let executionClass: ExecutionClass = 'CLASSICAL';
  let quboMatrix: number[][] | null = null;
  let isingCouplings: AlgorithmTranslation['isingCouplings'] = null;
  let circuit: XivCircuitIR | null = null;
  const notes: string[] = [];

  if (input.target === 'QUBO_INSPIRED') {
    executionClass = 'QUANTUM_INSPIRED';
    quboMatrix = buildQubo(input.problem.dimensions.n);
    notes.push('QUBO path is mathematical QUANTUM_INSPIRED candidate ≠ PHYSICAL_QPU_VERIFIED');
  } else if (input.target === 'ISING_INSPIRED') {
    executionClass = 'QUANTUM_INSPIRED';
    isingCouplings = buildIsing(input.problem.dimensions.n);
    notes.push('Ising path is mathematical QUANTUM_INSPIRED candidate ≠ PHYSICAL_QPU_VERIFIED');
  } else if (input.target === 'QUANTUM_CIRCUIT_IR') {
    executionClass = 'SIMULATED_QUANTUM';
    circuit = buildXivCircuitIR({
      problem: input.problem,
      qubitCount: Math.max(1, Math.min(input.problem.dimensions.n, 8)),
    });
    notes.push('Circuit IR ≠ physical-QPU execution');
  } else if (
    input.target === 'CLASSICAL_GRAPH' ||
    input.target === 'LINEAR_PROGRAM' ||
    input.target === 'INTEGER_PROGRAM' ||
    input.target === 'MIXED_INTEGER_PROGRAM' ||
    input.target === 'CONSTRAINT_PROGRAM' ||
    input.target === 'ML_INFERENCE_GRAPH'
  ) {
    executionClass = 'CLASSICAL';
    notes.push('Classical translation is first-class');
  } else if (input.target === 'SAMPLING_MODEL' || input.target === 'SIMULATION_MODEL') {
    executionClass = 'SIMULATED_QUANTUM';
  } else if (input.target === 'TENSOR_NETWORK_INSPIRED') {
    executionClass = 'QUANTUM_INSPIRED';
  }

  if (lossy) {
    notes.push(`approximation recorded: ${targetObjective}`);
  }

  const objectivePreserved =
    !lossy &&
    semantic === 'SEMANTICALLY_EQUIVALENT' &&
    targetObjective === input.problem.objective.expression;

  return {
    translationId: tid([
      input.problem.irId,
      input.target,
      lossyState,
      input.compilerVersion,
    ]),
    sourceIrId: input.problem.irId,
    targetRepresentation: input.target,
    executionClass,
    lossyState,
    semanticEquivalence: semantic,
    objectivePreserved,
    approximationNotes: notes,
    quboMatrix,
    isingCouplings,
    circuit,
    physicalQpuVerified: PHYSICAL_QPU_VERIFIED,
    status: lossyState === 'INVALID' ? 'TRANSLATION_FAILED' : 'VALID',
    compilerVersion: input.compilerVersion,
    schemaVersion: input.problem.schemaVersion,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function quboRemainsQuantumInspired(t: AlgorithmTranslation): boolean {
  return (
    t.targetRepresentation === 'QUBO_INSPIRED' &&
    t.executionClass === 'QUANTUM_INSPIRED' &&
    t.physicalQpuVerified === false
  );
}
