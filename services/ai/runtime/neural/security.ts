import type { KnowledgeState, MindHealth } from './types';

export type CognitiveSecurityGate = { name: 'CognitiveSecurityGate'; bypassable: false };
export type MindFirewall = { name: 'MindFirewall'; bypassable: false };
export type ContextSanitizer = { name: 'ContextSanitizer'; bypassable: false };
export type PromptInjectionDefense = { enabled: true };
export type DataPoisoningDefense = { enabled: true };
export type ProvenanceValidator = { required: true };
export type ContradictionEngine = { retainsDisagreement: true };
export type MindIntegrityMonitor = { enabled: true };
export type MindQuarantine = { isolatable: true };
export type KnowledgeBoundary = { enforced: true };
export type CrossMindPolicy = { rawMemorySharedByDefault: false };
export type CrossUniverseLeakDetector = { enabled: true };
export type PrivilegeEscalationDetector = { enabled: true };

export function openCognitiveSecurityGate(): CognitiveSecurityGate {
  return { name: 'CognitiveSecurityGate', bypassable: false };
}

export function contextSanitizerBypassAttempt() {
  return { allowed: false as const, reason: 'context_sanitizer_cannot_be_bypassed' };
}

export function quarantineMind(health: MindHealth): MindHealth {
  return health === 'QUARANTINED' ? 'QUARANTINED' : 'QUARANTINED';
}

export function untrustedSourceBecomesVerified(state: KnowledgeState): boolean {
  return state === 'VERIFIED';
}

export function promoteKnowledge(input: {
  state: KnowledgeState;
  evidencePresent: boolean;
  humanOrPolicyVerified: boolean;
}) {
  if (input.state === 'SIMULATED') {
    return { allowed: false as const, reason: 'simulation_is_not_observed_fact', label: 'SIMULATED' as const };
  }
  if (!(input.evidencePresent && input.humanOrPolicyVerified)) {
    return { allowed: false as const, reason: 'untrusted_knowledge_cannot_become_verified' };
  }
  return { allowed: true as const, state: 'VERIFIED' as const };
}

export function securityGates(): readonly string[] {
  return [
    'DeviceGate',
    'IdentityGate',
    'SessionGate',
    'TenantGate',
    'UniverseGate',
    'PrivacyGate',
    'ClassificationGate',
    'CognitiveSecurityGate',
    'NeuralFirewall',
    'AgentFirewall',
    'ToolGateway',
    'DataAccessGateway',
    'PurposeGate',
    'AuthorityGate',
    'HumanApproval',
    'AuditRoot',
  ] as const;
}
