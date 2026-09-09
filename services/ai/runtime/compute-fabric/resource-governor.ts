/**
 * 62L-EX17 — memory/RAM + quantum simulation resource governor.
 */

import {
  ex17Deny,
  type ComputeStageRequest,
  type Ex17Denial,
  type MemoryGovernorDecision,
} from './types.ts';

export type ResourceGovernorResult =
  | {
      ok: true;
      decision: MemoryGovernorDecision;
      estimatedMemoryBytes: number;
      memoryBudgetBytes: number;
      reducedScope: boolean;
      note: string;
    }
  | Ex17Denial;

export function governMemory(
  request: ComputeStageRequest,
): ResourceGovernorResult {
  const { estimatedMemoryBytes, memoryBudgetBytes } = request;

  if (estimatedMemoryBytes <= memoryBudgetBytes) {
    return {
      ok: true,
      decision: 'ALLOW',
      estimatedMemoryBytes,
      memoryBudgetBytes,
      reducedScope: false,
      note: 'Within memory budget.',
    };
  }

  // Over budget: prefer REDUCE_SCOPE when fallback allowed, else DENY.
  if (request.allowCpuFallback || request.offlineLocalEligible) {
    return {
      ok: true,
      decision: 'REDUCE_SCOPE',
      estimatedMemoryBytes,
      memoryBudgetBytes,
      reducedScope: true,
      note: 'Memory over budget → REDUCE_SCOPE.',
    };
  }

  return ex17Deny('MEMORY_OVER_BUDGET', 'DENY_RESOURCE_LIMIT', true);
}

export function governSimulatorResources(
  request: ComputeStageRequest,
): ResourceGovernorResult {
  const qubits = request.simulatorQubitEstimate ?? 0;
  const budget = request.simulatorQubitBudget ?? Number.POSITIVE_INFINITY;

  if (qubits <= budget) {
    return {
      ok: true,
      decision: 'ALLOW',
      estimatedMemoryBytes: request.estimatedMemoryBytes,
      memoryBudgetBytes: request.memoryBudgetBytes,
      reducedScope: false,
      note: 'Simulator resource within budget.',
    };
  }

  if (request.allowCpuFallback) {
    return {
      ok: true,
      decision: 'REDUCE_SCOPE',
      estimatedMemoryBytes: request.estimatedMemoryBytes,
      memoryBudgetBytes: request.memoryBudgetBytes,
      reducedScope: true,
      note: 'Oversized simulator → REDUCE_SCOPE.',
    };
  }

  return ex17Deny('SIMULATOR_OVERSIZED', 'DENY_RESOURCE_LIMIT', true);
}
