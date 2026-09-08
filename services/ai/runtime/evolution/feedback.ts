/**
 * Feedback Loop V4 — store expected outcome before execution; measure expected vs actual.
 */

import { FEEDBACK_LOOP_STAGES, type FeedbackLoopStage } from './types';

export type ExpectedOutcome = {
  expectationId: string;
  hypothesisId: string;
  expected: string;
  storedBeforeExecution: true;
  storedAt: string;
};

export type ActualOutcome = {
  actualId: string;
  expectationId: string;
  actual: string;
  measuredAt: string;
};

export type FeedbackCycle = {
  cycleId: string;
  stage: FeedbackLoopStage;
  expectation: ExpectedOutcome | null;
  actual: ActualOutcome | null;
  lesson: string | null;
  newHypothesis: string | null;
};

export function listFeedbackLoopStages(): readonly FeedbackLoopStage[] {
  return FEEDBACK_LOOP_STAGES;
}

export function openFeedbackLoopV4(): {
  stages: readonly FeedbackLoopStage[];
  storeExpectedBeforeExecution: true;
  measureExpectedVsActual: true;
  productionLive: false;
} {
  return {
    stages: FEEDBACK_LOOP_STAGES,
    storeExpectedBeforeExecution: true,
    measureExpectedVsActual: true,
    productionLive: false,
  };
}

export function storeExpectedOutcome(input: {
  expectationId: string;
  hypothesisId: string;
  expected: string;
  storedAt: string;
}): ExpectedOutcome {
  return {
    expectationId: input.expectationId,
    hypothesisId: input.hypothesisId,
    expected: input.expected,
    storedBeforeExecution: true,
    storedAt: input.storedAt,
  };
}

export function measureActualOutcome(input: {
  actualId: string;
  expectation: ExpectedOutcome;
  actual: string;
  measuredAt: string;
}): ActualOutcome & { matched: boolean } {
  return {
    actualId: input.actualId,
    expectationId: input.expectation.expectationId,
    actual: input.actual,
    measuredAt: input.measuredAt,
    matched: input.actual === input.expectation.expected,
  };
}

export function advanceFeedbackStage(stage: FeedbackLoopStage): FeedbackLoopStage | null {
  const idx = FEEDBACK_LOOP_STAGES.indexOf(stage);
  if (idx < 0 || idx >= FEEDBACK_LOOP_STAGES.length - 1) return null;
  return FEEDBACK_LOOP_STAGES[idx + 1]!;
}

export function runFeedbackCycle(input: {
  cycleId: string;
  hypothesisId: string;
  expected: string;
  actual: string;
  at: string;
}): FeedbackCycle {
  const expectation = storeExpectedOutcome({
    expectationId: `exp-${input.cycleId}`,
    hypothesisId: input.hypothesisId,
    expected: input.expected,
    storedAt: input.at,
  });
  const actual = measureActualOutcome({
    actualId: `act-${input.cycleId}`,
    expectation,
    actual: input.actual,
    measuredAt: input.at,
  });
  return {
    cycleId: input.cycleId,
    stage: 'NEW_HYPOTHESIS',
    expectation,
    actual,
    lesson: actual.matched ? 'expectation_met' : 'expectation_missed',
    newHypothesis: actual.matched
      ? 'reinforce_prior_hypothesis'
      : 'revise_hypothesis_from_delta',
  };
}
