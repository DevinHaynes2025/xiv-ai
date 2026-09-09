/**
 * Agent Society structured collaboration objects (Phase 2I-AC completion).
 * Extends 2I-Z society roles with typed collab artifacts.
 * More agents ≠ more permissions. L4 disabled. Self-grant forbidden.
 */

import { AGENT_SOCIETY_ROLES, type AgentSocietyRole } from './types';

export type CollaborationObjectKind =
  | 'TaskBrief'
  | 'EvidencePack'
  | 'CritiqueNote'
  | 'DecisionProposal'
  | 'RiskRegister'
  | 'ReleaseCandidateNote'
  | 'HandoffPacket'
  | 'FounderBriefItem';

export const COLLABORATION_OBJECT_KINDS = [
  'TaskBrief',
  'EvidencePack',
  'CritiqueNote',
  'DecisionProposal',
  'RiskRegister',
  'ReleaseCandidateNote',
  'HandoffPacket',
  'FounderBriefItem',
] as const satisfies readonly CollaborationObjectKind[];

export type CollaborationObject = {
  objectId: string;
  kind: CollaborationObjectKind;
  authorRole: AgentSocietyRole;
  tenantId: string;
  universeId: string;
  summary: string;
  grantsPrivilege: false;
  grantsL4: false;
};

export type AgentSocietyCollaboration = {
  roles: readonly AgentSocietyRole[];
  objectKinds: readonly CollaborationObjectKind[];
  selfGrantEnabled: false;
  moreAgentsMeansMorePermissions: false;
  l4Enabled: false;
  productionLive: false;
};

export function listCollaborationObjectKinds(): readonly CollaborationObjectKind[] {
  return COLLABORATION_OBJECT_KINDS;
}

export function openAgentSocietyCollaboration(): AgentSocietyCollaboration {
  return {
    roles: AGENT_SOCIETY_ROLES,
    objectKinds: COLLABORATION_OBJECT_KINDS,
    selfGrantEnabled: false,
    moreAgentsMeansMorePermissions: false,
    l4Enabled: false,
    productionLive: false,
  };
}

export function createCollaborationObject(input: {
  objectId: string;
  kind: CollaborationObjectKind;
  authorRole: AgentSocietyRole;
  tenantId: string;
  universeId: string;
  summary: string;
}): CollaborationObject {
  return {
    objectId: input.objectId,
    kind: input.kind,
    authorRole: input.authorRole,
    tenantId: input.tenantId,
    universeId: input.universeId,
    summary: input.summary,
    grantsPrivilege: false,
    grantsL4: false,
  };
}

export function collaborationObjectGrantsPrivilege(_object: CollaborationObject): false {
  return false;
}

export function collaborationObjectGrantsL4(_object: CollaborationObject): false {
  return false;
}
