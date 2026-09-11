export interface AgentIdentityProfile {
  agentId: string;
  tenantId: string;
  role: string;
  goals: string[];
  memoryNamespace: string;
  policyVersion: string;
  decisionStyle: 'CAUTIOUS' | 'BALANCED' | 'EXPLORATORY';
  autonomyLevel: 0 | 1 | 2 | 3 | 4 | 5;
}

export function validateAgentIdentity(profile: AgentIdentityProfile): string[] {
  const errors: string[] = [];
  if (!profile.agentId) errors.push('agentId required');
  if (!profile.tenantId) errors.push('tenantId required');
  if (!profile.memoryNamespace.startsWith(profile.tenantId + ':')) errors.push('memory namespace must be tenant scoped');
  if (profile.autonomyLevel >= 4) errors.push('high autonomy requires separate bounded-action approval policy');
  return errors;
}

export const AGENT_INDIVIDUALITY_GUARDRAILS = {
  distinctRolesMemoriesGoalsAllowed: true,
  claimsConsciousness: false,
  claimsLiteralFreeWill: false,
  unrestrictedSelfRewriteAllowed: false,
  humanAuthorityRetained: true,
} as const;
