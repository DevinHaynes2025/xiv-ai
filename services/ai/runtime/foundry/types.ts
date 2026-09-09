export type UnmetNeed = { needId: string; statement: string };
export type HistoricalSolution = { solutionId: string; summary: string; evidenceId: string };
export type FailedApproach = { approachId: string; summary: string; evidenceId: string };
export type EmergingTechnology = { technologyId: string; label: string };
export type MarketMovement = { movementId: string; label: string };
export type OperationalCapability = { capabilityId: string; label: string };
export type EconomicCondition = { conditionId: string; label: string };

export type ConceptStance = 'hypothesis' | 'validated_fact';

export type OpportunityHypothesis = {
  hypothesisId: string;
  statement: string;
  stance: 'hypothesis';
  evidenceIds: readonly string[];
};

export type BusinessConcept = {
  conceptId: string;
  title: string;
  stance: ConceptStance;
  evidenceIds: readonly string[];
};

export type BusinessModelHypothesis = {
  modelId: string;
  statement: string;
  stance: 'hypothesis';
};

export type ConceptRisk = { riskId: string; statement: string };
export type ConceptEvidence = { evidenceId: string; summary: string; sourceId: string | null };
export type PrototypePlan = { planId: string; steps: readonly string[]; executed: false };
export type ExperimentPlan = { experimentId: string; hypothesisId: string; executed: false };
export type ExperimentOutcome = { experimentId: string; measured: false; fabricated: false };

export function distinguishFoundryStance(stance: ConceptStance) {
  return {
    hypothesis: stance === 'hypothesis',
    validatedFact: stance === 'validated_fact',
  };
}

export function createOpportunityHypothesis(input: {
  statement: string;
  evidenceIds: readonly string[];
}): OpportunityHypothesis | { allowed: false; reason: string } {
  if (input.evidenceIds.length === 0) {
    return { allowed: false, reason: 'Idea Foundry hypotheses require evidence.' };
  }
  return {
    hypothesisId: 'hyp_declared',
    statement: input.statement,
    stance: 'hypothesis',
    evidenceIds: input.evidenceIds,
  };
}

export function foundryTreatsHypothesisAsFact() {
  return false;
}
