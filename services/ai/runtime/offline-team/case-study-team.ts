export type CaseStudyRole = 'LEAD' | 'DOMAIN_EXPERT' | 'DATA_ANALYST' | 'AI_ENGINEER' | 'UX_RESEARCHER' | 'SECURITY_REVIEWER' | 'FINANCE_ANALYST' | 'CONTRARIAN' | 'QA_REVIEWER';

export interface CaseStudyProblem {
  caseId: string;
  tenantId: string;
  industry: string;
  problem: string;
  evidenceRefs: string[];
  confidentiality: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
}

export interface CaseStudyAssignment {
  caseId: string;
  roles: CaseStudyRole[];
  maxParallel: number;
  requiresHumanApproval: boolean;
}

export function buildCaseStudyTeam(problem: CaseStudyProblem): CaseStudyAssignment {
  if (!problem.tenantId) throw new Error('tenantId required');
  if (!problem.evidenceRefs.length) throw new Error('case study evidence required');
  const roles: CaseStudyRole[] = ['LEAD','DOMAIN_EXPERT','DATA_ANALYST','AI_ENGINEER','SECURITY_REVIEWER','CONTRARIAN','QA_REVIEWER'];
  if (/revenue|cost|margin|finance/i.test(problem.problem)) roles.splice(4, 0, 'FINANCE_ANALYST');
  if (/user|customer|workflow|experience|mobile/i.test(problem.problem)) roles.splice(4, 0, 'UX_RESEARCHER');
  return {
    caseId: problem.caseId,
    roles: [...new Set(roles)].slice(0, 8),
    maxParallel: 8,
    requiresHumanApproval: problem.confidentiality === 'TOP_SECRET',
  };
}

export const CASE_STUDY_GUARDRAILS = {
  evidenceRequired: true,
  preserveContrarianReview: true,
  maxParallelAgents: 8,
  productionMutationAllowed: false,
  consequentialActionsRequireHumanApproval: true,
};
