import { nowIso } from '../actions';
import { DEFAULT_COLLABORATION_BUDGET, type CollaborationBudget, type CollaborationFailure } from './types';

export function createCollaborationBudget(
  overrides?: Partial<typeof DEFAULT_COLLABORATION_BUDGET>,
): CollaborationBudget {
  return {
    ...DEFAULT_COLLABORATION_BUDGET,
    ...overrides,
    hopsUsed: 0,
    messagesUsed: 0,
    costUnitsUsed: 0,
    toolCallsUsed: 0,
    startedAt: nowIso(),
  };
}

export function consumeBudget(
  budget: CollaborationBudget,
  use: { hops?: number; messages?: number; costUnits?: number; toolCalls?: number; now?: string },
): { budget: CollaborationBudget; exceeded: CollaborationFailure | null } {
  const next: CollaborationBudget = {
    ...budget,
    hopsUsed: budget.hopsUsed + (use.hops ?? 0),
    messagesUsed: budget.messagesUsed + (use.messages ?? 0),
    costUnitsUsed: budget.costUnitsUsed + (use.costUnits ?? 0),
    toolCallsUsed: budget.toolCallsUsed + (use.toolCalls ?? 0),
  };
  const elapsed = Date.parse(use.now ?? nowIso()) - Date.parse(budget.startedAt);
  if (next.hopsUsed > next.maxHopCount) {
    return { budget: next, exceeded: { code: 'budget_exceeded', reason: 'Collaboration hop budget exceeded: DENY' } };
  }
  if (next.messagesUsed > next.maxMessages) {
    return { budget: next, exceeded: { code: 'budget_exceeded', reason: 'Collaboration message budget exceeded: DENY' } };
  }
  if (next.costUnitsUsed > next.maxCostUnits) {
    return { budget: next, exceeded: { code: 'budget_exceeded', reason: 'Collaboration cost budget exceeded: DENY' } };
  }
  if (next.toolCallsUsed > next.maxToolCalls) {
    return { budget: next, exceeded: { code: 'budget_exceeded', reason: 'Collaboration tool-call budget exceeded: DENY' } };
  }
  if (Number.isFinite(elapsed) && elapsed > next.maxDurationMs) {
    return { budget: next, exceeded: { code: 'timeout', reason: 'Collaboration duration budget exceeded: DENY' } };
  }
  return { budget: next, exceeded: null };
}
