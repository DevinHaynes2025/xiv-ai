import type { XivAgentId } from '../agents';
import type { CollaborationFailure } from './types';

export function detectCycle(path: readonly string[], nextAgent: string): boolean {
  return path.includes(nextAgent);
}

export function hopLimitExceeded(hopCount: number, maxHopCount: number) {
  return hopCount > maxHopCount;
}

export function evaluateLoopGuard(input: {
  path: readonly XivAgentId[];
  nextAgent: XivAgentId;
  hopCount: number;
  maxHopCount: number;
  allowBoundedCycle?: boolean;
}): CollaborationFailure | null {
  if (hopLimitExceeded(input.hopCount, input.maxHopCount)) {
    return { code: 'budget_exceeded', reason: 'Hop limit enforced: DENY' };
  }
  if (!detectCycle(input.path, input.nextAgent)) return null;
  if (input.allowBoundedCycle && input.hopCount < input.maxHopCount) {
    return null;
  }
  return {
    code: 'loop_detected',
    reason: `Cycle detected (${[...input.path, input.nextAgent].join(' → ')}). Default is stop with a partial result.`,
  };
}

export function isDuplicateRequest(previousKeys: readonly string[], purpose: string, targetAgent?: string) {
  const normalized = `${targetAgent ?? ''}::${purpose}`.trim().toLowerCase();
  return previousKeys.some((item) => item.trim().toLowerCase() === normalized);
}
