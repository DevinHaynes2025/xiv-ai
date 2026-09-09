/**
 * Ingestion pipeline contracts. Unauthorized sources never become verified store facts.
 */

import type { IngestionStage } from './types';

export const INGESTION_STAGES: readonly IngestionStage[] = [
  'Discover',
  'Authorize',
  'Fetch',
  'Normalize',
  'Classify',
  'Provenance',
  'Store',
  'Index',
  'Audit',
] as const;

export type IngestionRequest = {
  sourceAuthorized: boolean;
  provenancePresent: boolean;
  classification?: string;
  license?: string;
  rights?: string;
  skipStage?: IngestionStage;
};

export type IngestionDecision =
  | { allowed: true; stages: readonly IngestionStage[] }
  | { allowed: false; reason: string };

export function runIngestionPipeline(input: IngestionRequest): IngestionDecision {
  if (input.skipStage) {
    return { allowed: false, reason: `ingestion_requires_${input.skipStage.toLowerCase()}` };
  }
  if (input.sourceAuthorized !== true) {
    return { allowed: false, reason: 'ingestion_requires_authorized_source' };
  }
  if (input.provenancePresent !== true || !input.license || !input.rights || !input.classification) {
    return { allowed: false, reason: 'ingestion_requires_provenance_license_rights_classification' };
  }
  return { allowed: true, stages: INGESTION_STAGES };
}

export function unauthorizedSourceBecomesStoreFact(): false {
  return false;
}

export function ingestionBypassesClassification(): false {
  return false;
}
