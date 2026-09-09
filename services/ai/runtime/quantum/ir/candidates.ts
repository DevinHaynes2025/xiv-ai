/**
 * 62L-EX16 — Algorithm candidate factory.
 * Bounded parallel candidate generation. No auto-preferred winner.
 * Classical translations are first-class.
 */

import type { XivProblemIR } from './problem-ir.ts';
import { translateAlgorithm, type AlgorithmTranslation } from './translator.ts';
import {
  EX16_COMPILER_VERSION,
  EX16_LOCKS,
  type RepresentationTarget,
} from './types.ts';

export type AlgorithmCandidate = {
  candidateId: string;
  translation: AlgorithmTranslation;
  preferred: false;
  rankHint: number | null;
  classicalFirstClass: boolean;
};

export type CandidateBatch = {
  sourceIrId: string;
  candidates: AlgorithmCandidate[];
  autoPreferred: false;
  parallelBounded: true;
  maxParallel: number;
};

const DEFAULT_TARGETS: RepresentationTarget[] = [
  'CLASSICAL_GRAPH',
  'LINEAR_PROGRAM',
  'CONSTRAINT_PROGRAM',
  'QUBO_INSPIRED',
  'ISING_INSPIRED',
  'QUANTUM_CIRCUIT_IR',
];

export function generateAlgorithmCandidates(input: {
  problem: XivProblemIR;
  targets?: RepresentationTarget[];
  maxParallel?: number;
}): CandidateBatch {
  const maxParallel = Math.max(1, Math.min(input.maxParallel ?? 4, 8));
  const targets = (input.targets ?? DEFAULT_TARGETS).slice(0, maxParallel);
  const candidates: AlgorithmCandidate[] = targets.map((target, idx) => {
    const translation = translateAlgorithm({
      problem: input.problem,
      target,
      compilerVersion: EX16_COMPILER_VERSION,
    });
    const classicalFirstClass =
      translation.executionClass === 'CLASSICAL' ||
      target === 'CLASSICAL_GRAPH' ||
      target === 'LINEAR_PROGRAM' ||
      target === 'INTEGER_PROGRAM' ||
      target === 'MIXED_INTEGER_PROGRAM' ||
      target === 'CONSTRAINT_PROGRAM';
    return {
      candidateId: `cand_${translation.translationId}`,
      translation,
      preferred: false,
      rankHint: null,
      classicalFirstClass,
    };
  });

  return {
    sourceIrId: input.problem.irId,
    candidates,
    autoPreferred: EX16_LOCKS.AUTO_PREFERRED_CANDIDATE,
    parallelBounded: true,
    maxParallel,
  };
}

export function hasAutoPreferred(batch: CandidateBatch): false {
  return batch.autoPreferred;
}
