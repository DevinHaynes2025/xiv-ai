export type DocumentKind = 'RUNBOOK' | 'ARCHITECTURE' | 'API_REFERENCE' | 'USER_GUIDE' | 'POLICY' | 'CHANGELOG';
export type DocumentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED';

export interface DocumentationJob {
  id: string;
  tenantId: string;
  kind: DocumentKind;
  sourceRefs: string[];
  evidenceRefs: string[];
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  status: DocumentStatus;
  humanApprovalRef?: string;
}

export function canPublishDocumentation(job: DocumentationJob): boolean {
  if (job.classification === 'TOP_SECRET') return false;
  return job.status === 'APPROVED' && Boolean(job.humanApprovalRef) && job.sourceRefs.length > 0;
}

export const technicalDocumentationFactoryPolicy = {
  sourceBacked: true,
  secretsInDocsAllowed: false,
  policyPublicationHumanApprovalRequired: true,
  generatedClaimsRequireEvidence: true,
};
