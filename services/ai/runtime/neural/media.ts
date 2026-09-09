export type MediaObject = { objectId: string; inPostgres: false };
export type MediaUpload = { signed: boolean };
export type MediaAsset = { assetId: string };
export type MediaVariant = { variantId: string };
export type MediaMetadata = { metadataId: string };
export type MediaRights = { checked: boolean };
export type MediaClassification = { classification: string };
export type MediaModeration = { state: 'PENDING' | 'ALLOWED' | 'BLOCKED' | 'REVIEW' };
export type MediaTranscript = { transcriptId: string; verifiedFact: false };
export type MediaEmbedding = { embeddingId: string };
export type MediaEvidence = { evidenceId: string };
export type MediaRetention = { policyId: string };
export type MediaDeletionState = 'ACTIVE' | 'PENDING_DELETE' | 'DELETED';

export type PostAnalysis = {
  topic?: string;
  entities?: readonly string[];
  language?: string;
  summary?: string;
  claims?: readonly string[];
  businessRelevance?: string;
  confidence: 'low' | 'medium' | 'high' | 'unknown';
  becomesUserIdentityClaim: false;
  separatesContentFromInference: true;
};

export function uploadMediaPipeline(input: {
  signedUpload: boolean;
  malwareValidated: boolean;
  encryptedObjectStorage: boolean;
  storeBinaryInPostgres: boolean;
}) {
  if (input.storeBinaryInPostgres) return { allowed: false as const, reason: 'media_not_in_postgres' };
  if (!(input.signedUpload && input.malwareValidated && input.encryptedObjectStorage)) {
    return { allowed: false as const, reason: 'media_pipeline_incomplete' };
  }
  return { allowed: true as const, productionScaleClaimed: false as const };
}

export function analyzeAuthorizedPost(input: { authorized: boolean }): PostAnalysis | { allowed: false; reason: string } {
  if (!input.authorized) return { allowed: false, reason: 'post_analysis_requires_authorization' };
  return {
    confidence: 'unknown',
    becomesUserIdentityClaim: false,
    separatesContentFromInference: true,
  };
}

export function mediaProductionScaleClaimed(): false {
  return false;
}
