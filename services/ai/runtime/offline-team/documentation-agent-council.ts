export type DocCouncilRole = 'TECHNICAL_WRITER' | 'ARCHITECT' | 'SECURITY' | 'QA' | 'PRODUCT' | 'API_EDITOR' | 'POLICY_REVIEWER' | 'USER_ADVOCATE';

export interface DocCouncilMember {
  agentId: string;
  role: DocCouncilRole;
  evidenceRefs: string[];
  recommendation: string;
  confidence: number;
  dissent?: string;
}

export interface DocCouncilDecision {
  members: DocCouncilMember[];
  publishApprovedByHuman: boolean;
  containsSecrets: boolean;
  consequentialPolicyChange: boolean;
}

export function evaluateDocCouncil(decision: DocCouncilDecision) {
  const validSize = decision.members.length >= 2 && decision.members.length <= 8;
  const evidenceComplete = decision.members.every((m) => m.evidenceRefs.length > 0);
  const publishAllowed = validSize && evidenceComplete && !decision.containsSecrets && decision.publishApprovedByHuman;
  return {
    validSize,
    evidenceComplete,
    publishAllowed,
    preservedDissent: decision.members.filter((m) => Boolean(m.dissent)).map((m) => ({ agentId: m.agentId, dissent: m.dissent! })),
  };
}

export const documentationCouncilPolicy = {
  minAgents: 2,
  maxAgents: 8,
  secretPublicationAllowed: false,
  autonomousPolicyPublicationAllowed: false,
  dissentMustBePreserved: true,
};
