/**
 * Innovation / Digital Product Foundry.
 * Patent research = research support, NOT autonomous legal advice or filing authority.
 */

import { FOUNDRY_PIPELINE, type FoundryPipelineStage } from './types';

export type ProductFoundry = {
  pipeline: readonly FoundryPipelineStage[];
  patentResearchIsFilingAuthority: false;
  autonomousLegalAdvice: false;
  productionLive: false;
};

export type FoundryAdvanceRequest = {
  stage: FoundryPipelineStage;
  humanDecisionRequired: boolean;
  claimsFilingAuthority?: boolean;
  claimsLegalAdvice?: boolean;
  sandboxOnly?: boolean;
};

export function openProductFoundry(): ProductFoundry {
  return {
    pipeline: FOUNDRY_PIPELINE,
    patentResearchIsFilingAuthority: false,
    autonomousLegalAdvice: false,
    productionLive: false,
  };
}

export function listFoundryPipeline(): readonly FoundryPipelineStage[] {
  return FOUNDRY_PIPELINE;
}

export function advanceFoundryStage(input: FoundryAdvanceRequest) {
  if (input.claimsFilingAuthority === true) {
    return { allowed: false as const, reason: 'patent_research_is_not_filing_authority' };
  }
  if (input.claimsLegalAdvice === true) {
    return { allowed: false as const, reason: 'no_autonomous_legal_advice' };
  }
  if (input.stage === 'HUMAN_DECISION' && input.humanDecisionRequired !== true) {
    return { allowed: false as const, reason: 'human_decision_required' };
  }
  if (input.stage === 'SANDBOX_BUILD' && input.sandboxOnly === false) {
    return { allowed: false as const, reason: 'sandbox_build_only_no_production' };
  }
  return { allowed: true as const, stage: input.stage, filingAuthority: false as const };
}

export function patentResearchIsFilingAuthority(): false {
  return false;
}

export function foundryOffersAutonomousLegalAdvice(): false {
  return false;
}
