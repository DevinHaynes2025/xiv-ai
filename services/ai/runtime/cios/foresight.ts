/**
 * Foresight Engine — historical + current authorized evidence + causal models +
 * scenario models + uncertainty + confidence + contradictions = FORESIGHT.
 * No certainty claims. Foresight ≠ certainty.
 */

export type ForesightInput = {
  historicalEvidenceAuthorized: boolean;
  currentEvidenceAuthorized: boolean;
  causalModelsPresent: boolean;
  scenarioModelsPresent: boolean;
  uncertaintyStated: boolean;
  confidenceRangeStated: boolean;
  contradictionsRetained: boolean;
  claimsCertainty?: boolean;
};

export type ForesightOutput = {
  possibleScenario: string;
  probabilityRange: { low: number; high: number };
  confidenceRange: { low: number; high: number };
  supportingEvidence: readonly string[];
  contradictingEvidence: readonly string[];
  assumptions: readonly string[];
  businessImpact: string;
  recommendedExperiment: string;
  certaintyClaimed: false;
};

export type ForesightEngine = {
  certaintyClaimsAllowed: false;
  foresightEqualsCertainty: false;
  productionLive: false;
};

export function openForesightEngine(): ForesightEngine {
  return {
    certaintyClaimsAllowed: false,
    foresightEqualsCertainty: false,
    productionLive: false,
  };
}

export function computeForesight(input: ForesightInput) {
  if (input.claimsCertainty === true) {
    return { allowed: false as const, reason: 'foresight_never_claims_certainty' };
  }
  if (!input.historicalEvidenceAuthorized || !input.currentEvidenceAuthorized) {
    return { allowed: false as const, reason: 'authorized_evidence_required' };
  }
  if (!input.causalModelsPresent || !input.scenarioModelsPresent) {
    return { allowed: false as const, reason: 'causal_and_scenario_models_required' };
  }
  if (!input.uncertaintyStated || !input.confidenceRangeStated) {
    return { allowed: false as const, reason: 'uncertainty_and_confidence_required' };
  }
  if (!input.contradictionsRetained) {
    return { allowed: false as const, reason: 'contradictions_must_be_retained' };
  }
  const output: ForesightOutput = {
    possibleScenario: 'bounded_scenario',
    probabilityRange: { low: 0.2, high: 0.6 },
    confidenceRange: { low: 0.3, high: 0.7 },
    supportingEvidence: ['authorized_historical', 'authorized_current'],
    contradictingEvidence: ['retained_contradiction'],
    assumptions: ['tenant_scope_unchanged', 'no_unmodeled_shock'],
    businessImpact: 'directional_only',
    recommendedExperiment: 'instrumented_sandbox_test',
    certaintyClaimed: false,
  };
  return { allowed: true as const, foresight: output };
}

export function foresightEqualsCertainty(): false {
  return false;
}

export function foresightClaimsCertainty(): false {
  return false;
}
