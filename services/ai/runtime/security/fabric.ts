/**
 * Security Fabric expansion contracts. Provider-neutral. No extra agent authority.
 */
export type AgentFirewallDecision = {
  allowed: boolean;
  reason: string;
  unrestrictedDatabase: false;
  unrestrictedShell: false;
  unrestrictedCloud: false;
  unrestrictedDeploy: false;
  unrestrictedSecurityPolicy: false;
  unrestrictedBilling: false;
  unrestrictedTenantAdmin: false;
};

export type DataLossPreventionDecision = {
  outcome: 'allow' | 'redact' | 'block' | 'unavailable';
  claimedScanSuccessWhenUnavailable: false;
};

export type PromptInjectionFinding = {
  findingId: string;
  treatedAsSystemInstruction: false;
};

export type ToolRiskAssessment = {
  toolId: string;
  risk: 'low' | 'medium' | 'high';
  autoExecute: false;
};

export type ModuleSandboxPolicy = {
  executesDownloadedJavascript: false;
  unrestrictedDatabase: false;
};

export type SecretsAccessPolicy = {
  clientMayReceiveServiceRole: false;
  secretsInLogs: false;
};

export type BehavioralThreatSignal = {
  signalId: string;
  stance: 'hypothesized' | 'observed';
};

export type SecurityIncident = {
  incidentId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
};

export type RecoveryPoint = {
  recoveryId: string;
  configured: false;
};

export type RetentionPolicy = {
  policyId: string;
  days: number | null;
};

export type DeletionPolicy = {
  policyId: string;
  executed: false;
};

export type DataResidencyPolicy = {
  region: string | null;
  requirement: 'unspecified' | 'requires_legal_review';
};

export type ModelSecurityPolicy = {
  selfModification: false;
  promptInjectionTrusted: false;
};

export type SupplyChainSecurityFinding = {
  findingId: string;
  packageId: string | null;
};

export const AGENT_UNRESTRICTED_CAPABILITIES = [
  'database',
  'shell',
  'cloud',
  'deploy',
  'security_policy',
  'billing',
  'tenant_administration',
] as const;

export function agentMayReceiveUnrestricted(capability: (typeof AGENT_UNRESTRICTED_CAPABILITIES)[number]) {
  void capability;
  return false;
}

export function denyUnrestrictedAgentCapability(capability: string): AgentFirewallDecision {
  return {
    allowed: false,
    reason: `No AI agent receives unrestricted ${capability.replaceAll('_', ' ')}.`,
    unrestrictedDatabase: false,
    unrestrictedShell: false,
    unrestrictedCloud: false,
    unrestrictedDeploy: false,
    unrestrictedSecurityPolicy: false,
    unrestrictedBilling: false,
    unrestrictedTenantAdmin: false,
  };
}
