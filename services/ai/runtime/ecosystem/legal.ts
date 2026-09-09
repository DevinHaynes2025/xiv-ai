import type { LegalAssistanceClass, LegalPracticeArea } from './types';

export type LawyerProfile = {
  lawyerId: string;
  jurisdiction: string;
  credentialStatus: 'UNVERIFIED' | 'VERIFIED' | 'NOT_CONFIGURED';
  practiceAreas: readonly LegalPracticeArea[];
  impersonatesXivLegalAgent: false;
};

export type LegalWorkspace = {
  workspaceId: string;
  organizationId: string;
  counselSelectedByCompany: true;
};

export function legalAgentIsLicensedAttorney(): false {
  return false;
}

export function legalAgentImpersonatesAttorney(): false {
  return false;
}

export function classifyLegalAssistance(kind: LegalAssistanceClass): { attorneyAdvice: boolean } {
  return { attorneyAdvice: kind === 'ATTORNEY_ADVICE' };
}

export function legalAgentMayIssueAttorneyAdvice(): false {
  return false;
}

export const LEGAL_PRACTICE_AREAS: readonly LegalPracticeArea[] = [
  'Corporate',
  'Contracts',
  'Employment',
  'Intellectual Property',
  'Privacy',
  'Cybersecurity',
  'Technology',
  'AI Governance',
  'International Trade',
  'Customs',
  'Supply Chain',
  'Real Estate',
  'Insurance',
  'Securities',
  'M&A',
  'Venture Capital',
  'Tax',
  'Compliance',
  'Procurement',
  'Licensing',
  'Data Protection',
  'Product Liability',
  'Environmental',
  'Cross-border Commerce',
];
