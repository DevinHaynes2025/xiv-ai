export type CaseIndustry = 'ECOMMERCE' | 'RETAIL' | 'HOSPITAL_ADMIN' | 'MANUFACTURING' | 'SUPPLY_CHAIN' | 'STARTUP' | 'ENTERPRISE' | 'OTHER';
export type CaseConfidentiality = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';

export interface CaseStudyInput {
  caseId: string;
  tenantId: string;
  industry: CaseIndustry;
  problem: string;
  evidenceRefs: string[];
  confidentiality: CaseConfidentiality;
}

export interface CaseRolePrompt {
  role: string;
  prompt: string;
  networkAllowed: boolean;
}

const roles = ['DOMAIN_EXPERT','DATA_ANALYST','AI_ENGINEER','FINANCE','SECURITY','UX','QA','CONTRARIAN'] as const;

export function buildCaseRolePrompts(input: CaseStudyInput): CaseRolePrompt[] {
  if (!input.tenantId || !input.caseId) throw new Error('case and tenant required');
  if (!input.evidenceRefs.length) throw new Error('evidence required');
  const networkAllowed = input.confidentiality !== 'TOP_SECRET';
  return roles.map(role => ({
    role,
    networkAllowed,
    prompt: `You are XIV ${role}. Analyze case ${input.caseId} in ${input.industry}. Problem: ${input.problem}. Use only authorized evidence refs. Return recommendation, risks, assumptions, evidence needed, and one challenge to another role. Do not claim facts not supported by evidence.`,
  }));
}

export const CASE_STUDY_OLLAMA_GUARDRAILS = {
  offlineFirst: true,
  preferredModel: 'qwen2.5-coder:7b',
  maxParallelRoles: 8,
  topSecretNetworkAllowed: false,
  productionMutationAllowed: false,
  consequentialActionsRequireHumanApproval: true,
};
