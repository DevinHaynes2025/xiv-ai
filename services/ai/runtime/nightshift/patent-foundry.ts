/**
 * Patent & Innovation Foundry — prior art → counsel workspace.
 * Never claim patentability. No unauthorized patent DB ingest.
 */
import type { PatentWorkspaceStage } from './types';

export type PatentFoundry = {
  foundryId: string;
  claimsPatentability: false;
  unauthorizedDbIngest: false;
  productionLive: false;
};

export type PriorArtIntake = {
  intakeId: string;
  stage: PatentWorkspaceStage;
  patentabilityClaimed: false;
};

export function openPatentFoundry(): PatentFoundry {
  return {
    foundryId: 'patent-innovation-foundry',
    claimsPatentability: false,
    unauthorizedDbIngest: false,
    productionLive: false,
  };
}

export function intakePriorArt(input: {
  sourceAuthorized: boolean;
  patentDbAuthorized: boolean;
  claimsPatentability?: boolean;
}) {
  if (input.claimsPatentability === true) {
    return { allowed: false as const, reason: 'never_claim_patentability' };
  }
  if (!input.sourceAuthorized) {
    return { allowed: false as const, reason: 'prior_art_source_unauthorized' };
  }
  if (!input.patentDbAuthorized) {
    return { allowed: false as const, reason: 'unauthorized_patent_db_ingest_denied' };
  }
  return {
    allowed: true as const,
    intake: {
      intakeId: 'prior-art-intake',
      stage: 'PRIOR_ART_INTAKE' as const,
      patentabilityClaimed: false as const,
    } satisfies PriorArtIntake,
  };
}

export function promoteToCounselWorkspace(intake: PriorArtIntake) {
  return {
    ...intake,
    stage: 'COUNSEL_WORKSPACE' as const,
    patentabilityClaimed: false as const,
  };
}

export function patentFoundryClaimsPatentability(): false {
  return false;
}

export function unauthorizedPatentDbIngestAllowed(): false {
  return false;
}
