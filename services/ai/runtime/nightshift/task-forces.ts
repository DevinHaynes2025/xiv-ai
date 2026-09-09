/**
 * Intelligence Task Forces — temporary multi-agent teams.
 * Collaboration ≠ shared permissions. No permission transfer between members.
 */
import type { IntelligenceTaskForceKind } from './types';

export type IntelligenceTaskForceMember = {
  agentId: string;
  role: string;
  permissionsGrantedByMembership: false;
};

export type IntelligenceTaskForce = {
  forceId: string;
  kind: IntelligenceTaskForceKind;
  tenantId: string;
  universeId: string;
  members: readonly IntelligenceTaskForceMember[];
  temporary: true;
  grantsPermissions: false;
  transfersPermissions: false;
  disablesGuardian: false;
  grantsL4: false;
  productionLive: false;
};

export function conveneIntelligenceTaskForce(input: {
  kind: IntelligenceTaskForceKind;
  tenantId: string;
  universeId: string;
  members: readonly { agentId: string; role: string }[];
}): IntelligenceTaskForce {
  return {
    forceId: `itf:${input.kind}:${input.tenantId}`,
    kind: input.kind,
    tenantId: input.tenantId,
    universeId: input.universeId,
    members: input.members.map((m) => ({
      agentId: m.agentId,
      role: m.role,
      permissionsGrantedByMembership: false as const,
    })),
    temporary: true,
    grantsPermissions: false,
    transfersPermissions: false,
    disablesGuardian: false,
    grantsL4: false,
    productionLive: false,
  };
}

export function taskForceCollaborationSharesPermissions(_force: IntelligenceTaskForce): false {
  return false;
}

export function taskForceTransfersPermissions(
  force: IntelligenceTaskForce,
  fromAgentId: string,
  toAgentId: string,
) {
  void force;
  void fromAgentId;
  void toAgentId;
  return {
    allowed: false as const,
    reason: 'collaboration_does_not_transfer_permissions',
  };
}

export function taskForceMemberSelfGrantsAuthority(_force: IntelligenceTaskForce): false {
  return false;
}

export function intelligenceTaskForceDisablesGuardian(): false {
  return false;
}

export function intelligenceTaskForceGrantsL4(): false {
  return false;
}
