import { boundedAutonomyEnabled } from '../authority';
import type { MindHealth, MindKind } from './types';
import { MIND_KINDS } from './types';

export type GovernedMind = {
  mindId: string;
  mindType: MindKind;
  tenantScope: string;
  universeScope: string;
  purpose: string;
  knowledgeScope: readonly string[];
  classificationCeiling: string;
  allowedAgents: readonly string[];
  allowedModels: readonly string[];
  allowedTools: readonly string[];
  memoryPolicy: 'SCOPED' | 'NONE_SHARED_BY_DEFAULT';
  authorityLevel: 'BOUNDED';
  securityState: 'GUARDED';
  healthState: MindHealth;
  provenancePolicy: 'REQUIRED';
  grantsUnrestrictedAccess: false;
  canSelfGrantAuthority: false;
  canExpandOwnScope: false;
  canDisableGuardian: false;
  canDisableAudit: false;
};

export function declareMind(input: {
  mindType: MindKind;
  tenantId: string;
  universeId: string;
  purpose: string;
  knowledgeScope?: readonly string[];
}): GovernedMind {
  void MIND_KINDS;
  return {
    mindId: `mind:${input.mindType}:${input.tenantId}`,
    mindType: input.mindType,
    tenantScope: input.tenantId,
    universeScope: input.universeId,
    purpose: input.purpose,
    knowledgeScope: input.knowledgeScope ?? [input.purpose],
    classificationCeiling: 'TENANT_PRIVATE',
    allowedAgents: [],
    allowedModels: [],
    allowedTools: [],
    memoryPolicy: 'SCOPED',
    authorityLevel: 'BOUNDED',
    securityState: 'GUARDED',
    healthState: 'UNKNOWN',
    provenancePolicy: 'REQUIRED',
    grantsUnrestrictedAccess: false,
    canSelfGrantAuthority: false,
    canExpandOwnScope: false,
    canDisableGuardian: false,
    canDisableAudit: false,
  };
}

export function mindSelfGrantsAuthority(_mind: GovernedMind): false {
  void boundedAutonomyEnabled();
  return false;
}

export function mindExpandsOwnScope(mind: GovernedMind, requested: string) {
  if (!mind.knowledgeScope.includes(requested)) {
    return { allowed: false as const, reason: 'mind_cannot_expand_own_scope' };
  }
  return { allowed: true as const, scope: requested };
}

export function mindDisablesGuardian(): false {
  return false;
}

export function mindDisablesAudit(): false {
  return false;
}

export function unknownMindHealthIsHealthy(health: MindHealth): boolean {
  return health === 'HEALTHY';
}

export function treatUnknownMindHealthAsHealthy(): false {
  return false;
}
