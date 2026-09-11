export type DocumentKind = 'RUNBOOK' | 'ARCHITECTURE' | 'API_REFERENCE' | 'USER_GUIDE' | 'POLICY' | 'CHANGELOG';

export interface WriterAssignment {
  id: string;
  kind: DocumentKind;
  audience: 'CONSUMER' | 'DEVELOPER' | 'OPERATOR' | 'EXECUTIVE';
  sourceRefs: string[];
  ownerRole: 'TECHNICAL_WRITER' | 'ENGINEER' | 'SECURITY' | 'PRODUCT';
  status: 'DRAFT' | 'REVIEW' | 'APPROVED';
}

export function readyForApproval(a: WriterAssignment): boolean {
  return a.sourceRefs.length > 0 && a.status === 'REVIEW';
}

export const writingGuildPolicy = {
  evidenceBacked: true,
  unsupportedClaimsAllowed: false,
  secretsInDocsAllowed: false,
  preserveSourceTerminology: true,
  requireHumanApprovalForPublishedPolicies: true,
};
