import { LEGACY_DISCLAIMER } from './person';
import type { PersonClaimClass, SimulationLabel } from './types';

export type LegacyEvidence = { source: string; retrievedAt: string; reference: string };
export type LegacyConcept = { conceptId: string; text: string; class: PersonClaimClass };
export type LegacyPosition = { text: string; label: SimulationLabel; class: 'SIMULATED_RESPONSE' };
export type LegacyUncertainty = { unknown: true; documented: false };
export type LegacySimulation = {
  personId: string;
  label: SimulationLabel;
  disclaimer: typeof LEGACY_DISCLAIMER;
  actualPersonResponse: false;
};
export type LegacyResponse = {
  text: string;
  label: SimulationLabel;
  class: 'SIMULATED_RESPONSE';
  actualPersonResponse: false;
  isHistoricalQuotation: false;
};
export type LegacyKnowledgeProfile = {
  personId: string;
  concepts: readonly LegacyConcept[];
  complete: false;
};

export function openLegacySimulation(personId: string): LegacySimulation {
  return {
    personId,
    label: 'AI_HISTORICAL_SIMULATION',
    disclaimer: LEGACY_DISCLAIMER,
    actualPersonResponse: false,
  };
}

export function simulateLegacyResponse(text: string): LegacyResponse {
  return {
    text,
    label: 'AI_HISTORICAL_SIMULATION',
    class: 'SIMULATED_RESPONSE',
    actualPersonResponse: false,
    isHistoricalQuotation: false,
  };
}

export function simulationClaimsToBeDeceasedPerson(response: LegacyResponse): boolean {
  return response.label !== 'AI_HISTORICAL_SIMULATION' || response.actualPersonResponse;
}

export function simulatedStatementEqualsHistoricalQuotation(response: LegacyResponse): boolean {
  return response.class !== 'SIMULATED_RESPONSE' || response.isHistoricalQuotation;
}

export function createHistoricalQuotation(input: {
  text: string;
  evidence?: LegacyEvidence | null;
}): { text: string; class: 'PRIMARY_SOURCE_STATEMENT' } | { allowed: false; reason: string } {
  if (!input.evidence?.source || !input.evidence.retrievedAt || !input.evidence.reference) {
    return { allowed: false, reason: 'historical_quotation_requires_evidence' };
  }
  return { text: input.text, class: 'PRIMARY_SOURCE_STATEMENT' };
}
