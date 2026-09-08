/**
 * Agent mesh sync, conflict resolution, recovery — server-side authorization required.
 */

import { AGENT_MESH_SYNC_STAGES, type AgentConflictKind, type AgentConflictResolution, type AgentMeshSyncStage } from './types';
import type { AgentCheckpoint, AgentConflict, AgentRecovery } from './runtime';

export function listAgentMeshSyncStages(): readonly AgentMeshSyncStage[] {
  return AGENT_MESH_SYNC_STAGES;
}

export function synchronizeAgentMesh(input: {
  authenticated: boolean;
  deviceValidated: boolean;
  tenantValidated: boolean;
  universeValidated: boolean;
  conflictResolved: boolean;
  serverAuthorized: boolean;
  auditEnabled: boolean;
}): { allowed: true; stages: readonly AgentMeshSyncStage[] } | { allowed: false; reason: string; stage: AgentMeshSyncStage } {
  if (!input.authenticated) {
    return { allowed: false, reason: 'reauth_required', stage: 'REAUTH' };
  }
  if (!input.deviceValidated) {
    return { allowed: false, reason: 'device_validation_required', stage: 'DEVICE_VALIDATION' };
  }
  if (!input.tenantValidated) {
    return { allowed: false, reason: 'tenant_validation_required', stage: 'TENANT_VALIDATION' };
  }
  if (!input.universeValidated) {
    return { allowed: false, reason: 'universe_validation_required', stage: 'UNIVERSE_VALIDATION' };
  }
  if (!input.conflictResolved) {
    return { allowed: false, reason: 'conflict_detection_required', stage: 'CONFLICT_DETECTION' };
  }
  if (!input.serverAuthorized) {
    return { allowed: false, reason: 'server_authorization_required', stage: 'SERVER_AUTHORIZATION' };
  }
  if (!input.auditEnabled) {
    return { allowed: false, reason: 'audit_required', stage: 'AUDIT' };
  }
  return { allowed: true, stages: AGENT_MESH_SYNC_STAGES };
}

export function resolveConflict(input: {
  conflictId: string;
  kind: AgentConflictKind;
  localAuthorized: boolean;
  serverAuthorized: boolean;
  humanApproved?: boolean;
}): { allowed: true; conflict: AgentConflict } | { allowed: false; reason: string } {
  if (!input.serverAuthorized) {
    return { allowed: false, reason: 'server_side_authorization_required' };
  }
  let resolution: AgentConflictResolution = 'SERVER_WINS';
  if (input.kind === 'AUTHORITY_DRIFT' || input.kind === 'TENANT_MISMATCH' || input.kind === 'UNIVERSE_MISMATCH') {
    resolution = 'DROP_UNAUTHORIZED';
    if (!input.localAuthorized) {
      return {
        allowed: true,
        conflict: {
          conflictId: input.conflictId,
          kind: input.kind,
          resolution,
          serverSideAuthorizationRequired: true,
        },
      };
    }
  }
  if (input.kind === 'VERSION_SKEW') {
    if (input.humanApproved !== true) {
      return { allowed: false, reason: 'human_required_for_version_skew' };
    }
    resolution = 'REPLAY_BOUNDED';
  }
  return {
    allowed: true,
    conflict: {
      conflictId: input.conflictId,
      kind: input.kind,
      resolution,
      serverSideAuthorizationRequired: true,
    },
  };
}

export function recoverFromCheckpoint(input: {
  recoveryId: string;
  checkpoint: AgentCheckpoint;
  guardianActive: boolean;
  serverAuthorized: boolean;
}): { allowed: true; recovery: AgentRecovery } | { allowed: false; reason: string } {
  if (!input.guardianActive) {
    return { allowed: false, reason: 'guardian_required' };
  }
  if (!input.serverAuthorized) {
    return { allowed: false, reason: 'server_authorization_required' };
  }
  return {
    allowed: true,
    recovery: {
      recoveryId: input.recoveryId,
      checkpointId: input.checkpoint.checkpointId,
      bypassesGuardian: false,
      escalatesPrivilege: false,
    },
  };
}

export function auditSyncEvent(input: {
  eventId: string;
  actor: string;
  tenantId: string;
  universeId: string;
  action: string;
}): {
  eventId: string;
  actor: string;
  tenantId: string;
  universeId: string;
  action: string;
  audited: true;
  complete: true;
} {
  return {
    ...input,
    audited: true,
    complete: true,
  };
}

export function syncMaySkipAudit(): false {
  return false;
}

export function syncMayBypassServerAuth(): false {
  return false;
}
