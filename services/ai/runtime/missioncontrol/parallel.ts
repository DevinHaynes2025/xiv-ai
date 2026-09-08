/**
 * Parallel brain task forces + simulation before action.
 * Simulation ≠ reality. Consensus ≠ truth.
 */

import type { ParallelBrainId, SimulationResult } from './types';

export const PARALLEL_BRAINS: readonly ParallelBrainId[] = [
  'FINANCE_BRAIN',
  'SUPPLY_CHAIN_BRAIN',
  'CUSTOMER_BRAIN',
  'ENGINEERING_BRAIN',
  'RESEARCH_BRAIN',
  'SECURITY_BRAIN',
  'CONTRADICTION_BRAIN',
] as const;

export type ParallelBrainResult = {
  brainId: ParallelBrainId;
  independent: true;
  findings: readonly string[];
  confidence: number;
};

export function conveneParallelBrains(input: {
  missionId: string;
  brains?: readonly ParallelBrainId[];
}): {
  missionId: string;
  results: readonly ParallelBrainResult[];
  synthesisPending: true;
} {
  const brains = input.brains ?? PARALLEL_BRAINS;
  return {
    missionId: input.missionId,
    results: brains.map((brainId) => ({
      brainId,
      independent: true as const,
      findings: [`${brainId} independent analysis`],
      confidence: 0.5,
    })),
    synthesisPending: true,
  };
}

export function synthesizeParallelResults(
  results: readonly ParallelBrainResult[],
): {
  agreements: readonly string[];
  disagreements: readonly string[];
  recommendation: string;
  consensusEqualsTruth: false;
} {
  const findings = results.flatMap((r) => r.findings);
  return {
    agreements: findings.slice(0, 1),
    disagreements: findings.slice(1),
    recommendation: 'preserve disagreements; require evidence before action',
    consensusEqualsTruth: false,
  };
}

export function eachBrainReasonsIndependently(): true {
  return true;
}

export function consensusEqualsTruth(): false {
  return false;
}

export function runSimulation(input: {
  simulationId: string;
  proposal: string;
  expectedOutcomes: readonly string[];
  failureModes: readonly string[];
  risk: string;
  cost: number;
  recommendation: string;
}): SimulationResult {
  return {
    simulationId: input.simulationId,
    proposal: input.proposal,
    expectedOutcomes: input.expectedOutcomes,
    failureModes: input.failureModes,
    risk: input.risk,
    cost: input.cost,
    recommendation: input.recommendation,
    simulationEqualsReality: false,
  };
}

export function simulationEqualsReality(_s: SimulationResult): false {
  return false;
}
