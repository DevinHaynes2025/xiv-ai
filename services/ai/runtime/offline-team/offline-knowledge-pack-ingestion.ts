export type KnowledgeSourceKind = 'LOCAL_FILE' | 'APPROVED_EXPORT' | 'GITHUB_REPO' | 'OPEN_SOURCE_DOC' | 'USER_NOTE';
export type IngestDecision = 'ACCEPT_LOCAL' | 'REVIEW' | 'REJECT';

export interface KnowledgePackItem {
  id: string;
  tenantId: string;
  sourceKind: KnowledgeSourceKind;
  sourceRef: string;
  licenseRef?: string;
  consentRef?: string;
  contentHash: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  provenanceComplete: boolean;
}

export function decideKnowledgeIngest(item: KnowledgePackItem): IngestDecision {
  if (!item.sourceRef || !item.contentHash || !item.provenanceComplete) return 'REJECT';
  if (item.sourceKind === 'GITHUB_REPO' || item.sourceKind === 'OPEN_SOURCE_DOC') {
    if (!item.licenseRef) return 'REVIEW';
  }
  if ((item.sourceKind === 'APPROVED_EXPORT' || item.sourceKind === 'USER_NOTE') && !item.consentRef) return 'REVIEW';
  return 'ACCEPT_LOCAL';
}

export const offlineKnowledgeIngestionPolicy = {
  robotsAndLicenseReviewForNetworkSources: true,
  deduplicateByContentHash: true,
  preserveProvenance: true,
  topSecretExternalFetchAllowed: false,
  automaticTrustPromotion: false,
};
