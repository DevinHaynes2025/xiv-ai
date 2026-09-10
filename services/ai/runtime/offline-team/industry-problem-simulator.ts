import { createHash } from 'node:crypto';

export interface InterventionScenario {
  scenarioId: string;
  caseId: string;
  title: string;
  assumptions: string[];
  evidenceRefs: string[];
  costScore: number;
  riskScore: number;
  customerImpactScore: number;
  operationalImpactScore: number;
  simulated: true;
}

export function buildInterventionScenarios(caseId: string, titles: string[], evidenceRefs: string[]): InterventionScenario[] {
  if (!evidenceRefs.length) throw new Error('evidence required');
  return titles.slice(0, 32).map((title, index) => ({
    scenarioId: createHash('sha256').update(`${caseId}:${index}:${title}`).digest('hex'),
    caseId,
    title,
    assumptions: [],
    evidenceRefs,
    costScore: 0.5,
    riskScore: 0.5,
    customerImpactScore: 0.5,
    operationalImpactScore: 0.5,
    simulated: true,
  }));
}

export function rankScenario(s: InterventionScenario): number {
  return ((1 - s.costScore) + (1 - s.riskScore) + s.customerImpactScore + s.operationalImpactScore) / 4;
}

export const INDUSTRY_SIM_GUARDRAILS = {
  maxScenariosPerCase: 32,
  simulationIsNotReality: true,
  correlationIsNotCausation: true,
  quantumMode: 'SIMULATOR_OR_VERIFIED_ADAPTER_ONLY',
};
