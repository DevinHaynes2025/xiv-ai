import { appendLearning, searchLearning } from './learning-ledger';
import { retrieveOfflineKnowledge } from './knowledge-retrieval';
import type { ClaimState } from './knowledge-domains';
import type { EnsEvidenceState } from './enterprise-nervous-types';

export const MAX_REASONING_STEPS = 8;
export const MAX_REASONING_ROUNDS = 4;
export const MAX_REASONING_CHARS = 8_000;

export type BoundedReasoningResult = {
  stepsUsed: number;
  roundsUsed: number;
  conclusion: string;
  inventedFacts: false;
  exceededBudget: boolean;
  state: EnsEvidenceState;
  evidenceRefs: string[];
  productionAuthorization: false;
};

export async function runBoundedAgentReasoning(input: {
  tenantId: string;
  universeId: string;
  question: string;
  requestedSteps?: number;
  requestedRounds?: number;
  root?: string;
}): Promise<BoundedReasoningResult> {
  const stepsCap = Math.max(1, Math.min(input.requestedSteps ?? 4, MAX_REASONING_STEPS));
  const roundsCap = Math.max(1, Math.min(input.requestedRounds ?? 2, MAX_REASONING_ROUNDS));
  const knowledge = await retrieveOfflineKnowledge(input.question, {
    tenantId: input.tenantId,
    universeId: input.universeId,
    root: input.root,
  });
  const evidenceRefs = knowledge.evidenceRefs.slice(0, stepsCap);
  const inventedFacts = false as const;
  const conclusion = evidenceRefs.length
    ? `Bounded reasoning over ${evidenceRefs.length} local evidence refs. UNKNOWN remains valid. Budget steps=${stepsCap} rounds=${roundsCap}.`
    : 'No local evidence yet. UNKNOWN is valid. Bounded reasoning does not invent facts.';
  return {
    stepsUsed: Math.min(1 + evidenceRefs.length, stepsCap),
    roundsUsed: 1,
    conclusion: conclusion.slice(0, MAX_REASONING_CHARS),
    inventedFacts,
    exceededBudget: (input.requestedSteps ?? 0) > MAX_REASONING_STEPS || (input.requestedRounds ?? 0) > MAX_REASONING_ROUNDS,
    state: evidenceRefs.length ? 'PASS' : 'WAITING_DATA',
    evidenceRefs,
    productionAuthorization: false,
  };
}

export async function recordMeasurableLearning(input: {
  tenantId: string;
  universeId: string;
  subject: string;
  summary: string;
  evidenceRefs: string[];
  claimState?: ClaimState;
  predictedConfidence?: number;
  observedOutcome?: number;
  root?: string;
}) {
  const predicted = input.predictedConfidence;
  const observed = input.observedOutcome;
  const calibrationError =
    predicted === undefined || observed === undefined
      ? undefined
      : Math.abs(Math.max(0, Math.min(1, predicted)) - Math.max(0, Math.min(1, observed)));
  const entry = await appendLearning(
    {
      domain: 'enterprise_nervous_system',
      subject: `${input.tenantId}:${input.universeId}:${input.subject}`,
      claimState: input.claimState ?? (input.evidenceRefs.length ? 'MODEL_INFERENCE' : 'UNKNOWN'),
      summary: input.summary,
      sourceRefs: [`tenant:${input.tenantId}`, `universe:${input.universeId}`],
      evidence: input.evidenceRefs,
      confidence: predicted,
    },
    input.root,
  );
  return {
    entry,
    calibrationError,
    agentCountIsNotIntelligence: true as const,
    permissionChange: false as const,
    productionChange: false as const,
    inventedFeelings: false as const,
  };
}

export async function searchMeasurableLearning(query: string, root?: string) {
  return searchLearning(query, root);
}
