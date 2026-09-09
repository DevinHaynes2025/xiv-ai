export const CLOSED_INTELLIGENCE_LOOP = [
  'think',
  'challenge',
  'research',
  'simulate',
  'test',
  'measure',
  'learn',
  'recalibrate',
  'remember',
  'think_better_next_time',
] as const;

export type ClosedLoopStep = (typeof CLOSED_INTELLIGENCE_LOOP)[number];

export type BoundedFeedbackRecord = {
  steps: ClosedLoopStep[];
  completed: ClosedLoopStep[];
  haltedAt: ClosedLoopStep | null;
  reason: string;
  inventedFacts: false;
  productionAuthorization: false;
};

export function walkClosedIntelligenceLoop(input: {
  haltOn?: ClosedLoopStep;
  missingEvidence?: boolean;
}): BoundedFeedbackRecord {
  const completed: ClosedLoopStep[] = [];
  for (const step of CLOSED_INTELLIGENCE_LOOP) {
    if (input.haltOn && step === input.haltOn) {
      return {
        steps: [...CLOSED_INTELLIGENCE_LOOP],
        completed,
        haltedAt: step,
        reason: `Loop halted at ${step} pending evidence or a human gate.`,
        inventedFacts: false,
        productionAuthorization: false,
      };
    }
    if (input.missingEvidence && (step === 'research' || step === 'measure')) {
      return {
        steps: [...CLOSED_INTELLIGENCE_LOOP],
        completed,
        haltedAt: step,
        reason: 'Missing local evidence: research/measure becomes WAITING_DATA or UNKNOWN, never fabricated.',
        inventedFacts: false,
        productionAuthorization: false,
      };
    }
    completed.push(step);
  }
  return {
    steps: [...CLOSED_INTELLIGENCE_LOOP],
    completed,
    haltedAt: null,
    reason: 'Closed loop completed as think → challenge → research → simulate → test → measure → learn → recalibrate → remember → think better next time.',
    inventedFacts: false,
    productionAuthorization: false,
  };
}
