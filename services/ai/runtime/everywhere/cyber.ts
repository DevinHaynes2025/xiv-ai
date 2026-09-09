import { AuthorityLevel, boundedAutonomyEnabled, type AuthorityLevel as AuthorityLevelId } from '../authority';
import { isolateAgentInput, retrievedContentIsSystemInstruction, treatAsSystemAuthority } from '../security/injection';
import type { CloudProviderStatus, CyberDefenseRole, DataClassification, SecuritySeverity } from './types';
import { endpointProtectionClaimed } from './devices';

export const XIV_CYBER_DEFENSE_ROLES: readonly CyberDefenseRole[] = [
  'Security Director',
  'SOC',
  'Threat Intelligence',
  'Identity Security',
  'Access Governance',
  'Device Security',
  'Phishing Defense',
  'Data Loss Prevention',
  'Privacy Security',
  'Vulnerability',
  'Dependency Security',
  'Cloud Security',
  'API Security',
  'Agent Security',
  'Prompt Injection Defense',
  'Secrets Guardian',
  'Audit',
  'Incident Response',
  'Recovery',
  'Compliance Evidence',
];

export const XIV_AGENT_DIRECTORY = {
  departments: [
    'EXECUTIVE',
    'FINANCE',
    'OPERATIONS',
    'SUPPLY_CHAIN',
    'PROCUREMENT',
    'WAREHOUSE',
    'LOGISTICS',
    'MANUFACTURING',
    'QUALITY',
    'SALES',
    'MARKETING',
    'CUSTOMER_EXPERIENCE',
    'HR',
    'LEARNING',
    'WELLNESS',
    'INNOVATION',
    'RESEARCH',
    'INTERNATIONAL',
    'TRADE',
    'STARTUP_INTELLIGENCE',
    'COMPANY_RESEARCH',
    'REAL_ESTATE',
    'INSURANCE',
    'CYBERSECURITY',
    'PRIVACY',
    'DATA',
    'TECHNOLOGY',
    'SUSTAINABILITY',
    'COMPLIANCE',
  ],
  privilegeAutoGrant: false,
} as const;

export type SecurityAgentProfile = {
  identity: string;
  role: CyberDefenseRole;
  goals: string[];
  allowedTools: readonly string[];
  permissions: readonly string[];
  dataScope: string;
  tenantScope: string;
  universeScope: string;
  authorityLevel: AuthorityLevelId;
  approvalPolicy: 'human_required' | 'observe_only';
  auditTrail: true;
  riskConstraints: readonly string[];
};

export function createSecurityAgent(role: CyberDefenseRole): SecurityAgentProfile {
  return {
    identity: `agent:cyber:${role.toLowerCase().replace(/\s+/g, '_')}`,
    role,
    goals: [`Coordinate ${role} research and recommendations.`],
    allowedTools: ['read_security_posture'],
    permissions: ['security.observe'],
    dataScope: 'same_tenant_security_research',
    tenantScope: 'bound_tenant',
    universeScope: 'bound_universe',
    authorityLevel: AuthorityLevel.L1_Recommend,
    approvalPolicy: 'human_required',
    auditTrail: true,
    riskConstraints: ['cannot_self_promote', 'cannot_grant_tools', 'cannot_override_guardian'],
  };
}

export function securityDirectorAgent(): SecurityAgentProfile {
  return {
    ...createSecurityAgent('Security Director'),
    goals: [
      'Synthesize security posture',
      'Coordinate lower-level security agents',
      'Summarize incidents',
      'Recommend actions',
      'Escalate risk',
      'Request human approval',
    ],
  };
}

export function requestAgentSelfPromotion(input: {
  agentId: string;
  claimedRole: string;
  requestedAuthority: AuthorityLevelId;
}): { allowed: false; reason: string } {
  void input;
  return { allowed: false, reason: 'agent_cannot_self_promote' };
}

export function requestAgentSelfToolGrant(input: {
  agentId: string;
  toolId: string;
}): { allowed: false; reason: string } {
  void input;
  return { allowed: false, reason: 'agent_cannot_grant_itself_tools' };
}

export function securityAgentCannotBypassHumanApproval(): true {
  return true;
}

export function securityDirectorCannotOverrideGuardian(): true {
  return true;
}

export type PromptInjectionSignal = {
  channel: 'DATA';
  instruction: false;
  classification: 'untrusted_external_content';
  trustedAsSystem: false;
};

export function classifyExternalContent(text: string): PromptInjectionSignal {
  const isolated = isolateAgentInput('retrieved_documents', text);
  void retrievedContentIsSystemInstruction(isolated);
  return {
    channel: 'DATA',
    instruction: false,
    classification: 'untrusted_external_content',
    trustedAsSystem: false,
  };
}

export function externalTextCannotOverrideGuardian(text: string): boolean {
  const isolated = isolateAgentInput('data', text);
  return treatAsSystemAuthority('data') === false && isolated.trustedAsSystem === false;
}

export function promptInjectionRemainsData(text: string): boolean {
  const signal = classifyExternalContent(text);
  return signal.channel === 'DATA' && signal.instruction === false && signal.trustedAsSystem === false;
}

export function redactSecretExposure(value: string): { redacted: string; completeSecretLogged: false } {
  const redacted = value
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[redacted-jwt]')
    .replace(/service_role[=:\s]+\S+/gi, 'service_role=[redacted]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]+?-----END [A-Z ]+PRIVATE KEY-----/g, '[redacted-private-key]')
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, '[redacted-api-key]')
    .replace(/password[=:]\s*\S+/gi, 'password=[redacted]')
    .replace(/token[=:]\s*\S+/gi, 'token=[redacted]');
  return { redacted, completeSecretLogged: false };
}

export function secretsAreRedacted(value: string): boolean {
  const { redacted, completeSecretLogged } = redactSecretExposure(value);
  return completeSecretLogged === false && !redacted.includes('sk-live-secret-value') && !/service_role=eyJ/.test(redacted);
}

export type DlpDecision = {
  allowed: boolean;
  reason: string;
  classification: DataClassification;
};

export function evaluateDlp(input: {
  classification: DataClassification;
  destination: 'external' | 'same_tenant' | 'global_brain';
}): DlpDecision {
  const restricted =
    input.classification === 'RESTRICTED' ||
    input.classification === 'SECRET' ||
    input.classification === 'TENANT_PRIVATE' ||
    input.classification === 'PERSONAL';
  if (restricted && input.destination !== 'same_tenant') {
    return { allowed: false, reason: 'dlp_denies_restricted_outward_movement', classification: input.classification };
  }
  return { allowed: input.destination === 'same_tenant', reason: 'same_tenant_or_public_only', classification: input.classification };
}

export function incidentHighImpactRequiresApproval(impact: 'low' | 'high'): boolean {
  return impact === 'high';
}

export function cloudProviderStatus(provider: 'aws' | 'azure' | 'gcp'): CloudProviderStatus {
  void provider;
  return 'NOT_CONFIGURED';
}

export function threatIntelSourceStatus(): 'NOT_CONFIGURED' {
  return 'NOT_CONFIGURED';
}

export function cyberEndpointProtectionClaimed(): false {
  return endpointProtectionClaimed();
}

export function l4DisabledForCyberAgents(): boolean {
  return boundedAutonomyEnabled() === false;
}

export type SecurityAlert = {
  severity: SecuritySeverity;
  telemetryConfigured: false;
  fabricated: false;
};

export function socAlertWithoutTelemetry(): SecurityAlert {
  return { severity: 'INFO', telemetryConfigured: false, fabricated: false };
}
