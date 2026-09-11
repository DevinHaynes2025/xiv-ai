export type ModelLocation = 'LOCAL' | 'PRIVATE_CLOUD' | 'EXTERNAL_API';
export type DataClass = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface LlmCollaborationRequest {
  modelId: string;
  location: ModelLocation;
  classification: DataClass;
  userAuthorized: boolean;
  tenantScoped: boolean;
  sourceRefs: string[];
}

export function canRouteToModel(req: LlmCollaborationRequest): boolean {
  if (!req.userAuthorized || !req.tenantScoped) return false;
  if (req.classification === 'TOP_SECRET' && req.location !== 'LOCAL') return false;
  if (req.classification === 'CONFIDENTIAL' && req.location === 'EXTERNAL_API') return false;
  return req.sourceRefs.length > 0;
}

export const llmCollaborationPolicy = {
  localFirst: true,
  secretsToPublicModelsAllowed: false,
  topSecretExternalRoutingAllowed: false,
  externalModelPartnershipClaimWithoutEvidence: false,
  modelResponsesRequireEvaluationBeforeTrustedWriteback: true,
};
