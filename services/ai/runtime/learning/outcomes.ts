import { createOutcomeRecord, evaluateOutcome, type OutcomeRecord } from '../feedback';
import type { LearningState } from './types';

export function recordFailedOutcome(problem: string, expected: string): OutcomeRecord {
  return createOutcomeRecord({
    organizationId: null,
    universeId: null,
    problem,
    recommendationId: 'unmeasured',
    decision: 'not_taken',
    actionTaken: null,
    expectedOutcome: expected,
    measurementWindow: null,
    confidenceBefore: 'low',
    evidence: [],
    actualOutcome: null,
  });
}

export function learningStateFromOutcome(record: OutcomeRecord): LearningState {
  if (!record.evaluatedAt || record.successState === 'not_measured') return 'unmeasured';
  if (record.successState === 'unknown') return 'inconclusive';
  if (record.successState === 'improved') return 'successful';
  if (record.successState === 'unchanged') return 'partially_successful';
  return 'unsuccessful';
}

export function neverFabricateSuccess(record: OutcomeRecord) {
  if (!record.actualOutcome) {
    return evaluateOutcome(record, 'Outcome not measured.', 'not_measured');
  }
  return record;
}
