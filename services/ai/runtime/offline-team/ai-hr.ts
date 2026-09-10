export interface AgentCapabilityProfile {
  agentId: string;
  tenantId: string;
  role: string;
  skills: readonly string[];
  trainingCompleted: readonly string[];
  performanceEvidence: readonly string[];
  status: 'READY' | 'TRAINING' | 'REVIEW_REQUIRED' | 'INACTIVE';
}

export const AI_HR_GUARDRAILS = {
  humanApprovalForRoleExpansion: true,
  noEmploymentOrLegalPersonhoodClaim: true,
  noAutonomousCredentialGrant: true,
  performanceRequiresEvidence: true,
} as const;

export function assessAgentReadiness(profile: Omit<AgentCapabilityProfile, 'status'>): AgentCapabilityProfile {
  const status = profile.performanceEvidence.length > 0 && profile.trainingCompleted.length > 0 ? 'READY' : 'TRAINING';
  return Object.freeze({ ...profile, status });
}
