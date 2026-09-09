import { createId, nowIso } from '../actions';
import type { LessonRecord, OutcomeRecord } from './types';

export function createOutcomeRecord(
  input: Omit<OutcomeRecord, 'outcomeId' | 'createdAt' | 'evaluatedAt' | 'live' | 'prototype' | 'actualOutcome' | 'confidenceAfter' | 'successState'> & {
    actualOutcome?: string | null;
  },
): OutcomeRecord {
  return {
    ...input,
    outcomeId: createId('out'),
    actualOutcome: input.actualOutcome ?? null,
    confidenceAfter: 'not_measured',
    successState: 'not_measured',
    createdAt: nowIso(),
    evaluatedAt: null,
    prototype: true,
    live: false,
  };
}

export function evaluateOutcome(
  record: OutcomeRecord,
  actualOutcome: string,
  successState: OutcomeRecord['successState'],
): OutcomeRecord {
  return {
    ...record,
    actualOutcome,
    successState,
    confidenceAfter: successState === 'improved' ? 'medium' : 'low',
    evaluatedAt: nowIso(),
  };
}

export function recordLesson(record: OutcomeRecord): LessonRecord {
  return {
    lessonId: createId('les'),
    outcomeId: record.outcomeId,
    summary: `Recorded product lesson for "${record.problem}". Future recommendation context may include this outcome. The model and agent code were not retrained.`,
    improvesFutureContext: true,
    retrainsModel: false,
    mutatesAgentCode: false,
    createdAt: nowIso(),
  };
}

export function feedbackDoesNotRetrain() {
  return {
    retrainsModel: false as const,
    mutatesAgentCode: false as const,
    reason: 'Outcome feedback updates recommendation context only. It does not retrain models or rewrite agent code.',
  };
}
