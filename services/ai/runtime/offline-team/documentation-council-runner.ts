export type DocumentationRole = 'TECHNICAL_WRITER' | 'ARCHITECTURE' | 'SECURITY' | 'QA' | 'PRODUCT' | 'API_EDITOR' | 'POLICY_REVIEWER' | 'USER_ADVOCATE';

export interface CouncilInput {
  topic: string;
  roles: DocumentationRole[];
  evidenceRefs: string[];
  containsSecrets: boolean;
  consequential: boolean;
}

export interface CouncilResult {
  status: 'READY_FOR_REVIEW' | 'BLOCKED';
  reviewers: DocumentationRole[];
  dissentRequired: boolean;
  humanApprovalRequired: boolean;
  reasons: string[];
}

export function runDocumentationCouncil(input: CouncilInput): CouncilResult {
  const roles = [...new Set(input.roles)];
  const reasons: string[] = [];
  if (roles.length < 2 || roles.length > 8) reasons.push('council must contain 2-8 distinct roles');
  if (input.evidenceRefs.length === 0) reasons.push('evidence required');
  if (input.containsSecrets) reasons.push('secret-bearing draft cannot be published');
  return {
    status: reasons.length ? 'BLOCKED' : 'READY_FOR_REVIEW',
    reviewers: roles,
    dissentRequired: true,
    humanApprovalRequired: true,
    reasons,
  };
}

export const documentationCouncilPolicy = {
  autonomousPublishingAllowed: false,
  preserveDissent: true,
  secretPublicationAllowed: false,
  maxActiveReviewers: 8,
};
