/**
 * Agent mesh sync, conflict resolution, recovery — server-side authorization required.
 * Slice 2 / V741: revocation-first reconnect, stale checkpoint rejection,
 * Guardian-required recovery, audit completeness, idempotent/replay-safe sync.
 */

import { AGENT_MESH_SYNC_STAGES, type AgentConflictKind, type AgentConflictResolution, type AgentMeshSyncStage } from './types';
import {
  checkpointIntegrityHash,
  type AgentCheckpoint,
  type AgentConflict,
  type AgentRecovery,
} from './runtime';

/** Ordered reconnect stages (revocation checked before synchronize). */
export const AGENT_MESH_RECONNECT_STAGES: readonly AgentMeshSyncStage[] = [
  'RECONNECT',
  'REAUTH',
  'DEVICE_VALIDATION',
  'TENANT_VALIDATION',
  'UNIVERSE_VALIDATION',
  'CONFLICT_DETECTION',
  'SERVER_AUTHORIZATION',
  'SYNCHRONIZE',
  'AUDIT',
] as const;

export type SyncReplayReceipt = {
  syncId: string;
  replaySafe: true;
  idempotent: true;
  applied: boolean;
  duplicate: boolean;
};

const seenSyncIds = new Set<string>();

/** Test/reset helper — clears in-process idempotency ledger (non-persistent). */
export function resetSyncIdempotencyLedger(): void {
  seenSyncIds.clear();
}

export function listAgentMeshSyncStages(): readonly AgentMeshSyncStage[] {
  return AGENT_MESH_SYNC_STAGES;
}

export function listAgentMeshReconnectStages(): readonly AgentMeshSyncStage[] {
  return AGENT_MESH_RECONNECT_STAGES;
}

export function synchronizeAgentMesh(input: {
  authenticated: boolean;
  deviceValidated: boolean;
  tenantValidated: boolean;
  universeValidated: boolean;
  conflictResolved: boolean;
  serverAuthorized: boolean;
  auditEnabled: boolean;
  /** Revocation-first: revoked agents cannot sync. */
  revoked?: boolean;
  syncId?: string;
}):
  | { allowed: true; stages: readonly AgentMeshSyncStage[]; receipt: SyncReplayReceipt }
  | { allowed: false; reason: string; stage: AgentMeshSyncStage } {
  // Revocation-first — before any reconnect progress.
  if (input.revoked === true) {
    return { allowed: false, reason: 'agent_revoked', stage: 'RECONNECT' };
  }
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

  const syncId = input.syncId ?? `sync-anonymous-${AGENT_MESH_SYNC_STAGES.length}`;
  const duplicate = seenSyncIds.has(syncId);
  if (!duplicate) {
    seenSyncIds.add(syncId);
  }

  return {
    allowed: true,
    stages: AGENT_MESH_SYNC_STAGES,
    receipt: {
      syncId,
      replaySafe: true,
      idempotent: true,
      applied: !duplicate,
      duplicate,
    },
  };
}

export function detectSyncConflict(input: {
  conflictId: string;
  localTenantId: string;
  serverTenantId: string;
  localUniverseId: string;
  serverUniverseId: string;
  localCheckpointVersion?: number;
  serverCheckpointVersion?: number;
  authorityDrift?: boolean;
  duplicateEvent?: boolean;
}): { conflict: true; kind: AgentConflictKind } | { conflict: false } {
  if (input.localTenantId !== input.serverTenantId) {
    return { conflict: true, kind: 'TENANT_MISMATCH' };
  }
  if (input.localUniverseId !== input.serverUniverseId) {
    return { conflict: true, kind: 'UNIVERSE_MISMATCH' };
  }
  if (input.authorityDrift === true) {
    return { conflict: true, kind: 'AUTHORITY_DRIFT' };
  }
  if (input.duplicateEvent === true) {
    return { conflict: true, kind: 'DUPLICATE_EVENT' };
  }
  if (
    input.localCheckpointVersion !== undefined &&
    input.serverCheckpointVersion !== undefined &&
    input.localCheckpointVersion < input.serverCheckpointVersion
  ) {
    return { conflict: true, kind: 'STALE_CHECKPOINT' };
  }
  if (
    input.localCheckpointVersion !== undefined &&
    input.serverCheckpointVersion !== undefined &&
    input.localCheckpointVersion !== input.serverCheckpointVersion
  ) {
    return { conflict: true, kind: 'VERSION_SKEW' };
  }
  return { conflict: false };
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
  if (
    input.kind === 'AUTHORITY_DRIFT' ||
    input.kind === 'TENANT_MISMATCH' ||
    input.kind === 'UNIVERSE_MISMATCH' ||
    input.kind === 'STALE_CHECKPOINT'
  ) {
    resolution = 'DROP_UNAUTHORIZED';
    if (!input.localAuthorized || input.kind === 'STALE_CHECKPOINT') {
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
  if (input.kind === 'DUPLICATE_EVENT') {
    return {
      allowed: true,
      conflict: {
        conflictId: input.conflictId,
        kind: input.kind,
        resolution: 'REPLAY_BOUNDED',
        serverSideAuthorizationRequired: true,
      },
    };
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

export function validateCheckpointForRecovery(checkpoint: AgentCheckpoint): {
  valid: boolean;
  reason?: string;
} {
  if (checkpoint.transfersAuthority !== false) {
    return { valid: false, reason: 'checkpoint_transfers_authority' };
  }
  if (!checkpoint.tenantId || !checkpoint.universeId || !checkpoint.runtimeId) {
    return { valid: false, reason: 'checkpoint_scope_incomplete' };
  }
  if (!checkpoint.integrityHash || !checkpoint.createdAt || checkpoint.version < 1) {
    return { valid: false, reason: 'checkpoint_integrity_incomplete' };
  }
  const expected = checkpointIntegrityHash({
    checkpointId: checkpoint.checkpointId,
    runtimeId: checkpoint.runtimeId,
    tenantId: checkpoint.tenantId,
    universeId: checkpoint.universeId,
    version: checkpoint.version,
    lastCompletedStep: checkpoint.lastCompletedStep,
    evidenceRefs: checkpoint.evidenceRefs,
    runtimePackageVersion: checkpoint.runtimePackageVersion,
    createdAt: checkpoint.createdAt,
  });
  if (expected !== checkpoint.integrityHash) {
    return { valid: false, reason: 'checkpoint_integrity_mismatch' };
  }
  return { valid: true };
}

export function recoverFromCheckpoint(input: {
  recoveryId: string;
  checkpoint: AgentCheckpoint;
  guardianActive: boolean;
  serverAuthorized: boolean;
  /** Server-known minimum acceptable checkpoint version (stale rejection). */
  serverMinVersion?: number;
}): { allowed: true; recovery: AgentRecovery } | { allowed: false; reason: string } {
  if (!input.guardianActive) {
    return { allowed: false, reason: 'guardian_required' };
  }
  if (!input.serverAuthorized) {
    return { allowed: false, reason: 'server_authorization_required' };
  }
  const integrity = validateCheckpointForRecovery(input.checkpoint);
  if (!integrity.valid) {
    return { allowed: false, reason: integrity.reason ?? 'checkpoint_invalid' };
  }
  if (
    input.serverMinVersion !== undefined &&
    input.checkpoint.version < input.serverMinVersion
  ) {
    return { allowed: false, reason: 'stale_checkpoint_rejected' };
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
  stage?: AgentMeshSyncStage;
}): {
  eventId: string;
  actor: string;
  tenantId: string;
  universeId: string;
  action: string;
  stage: AgentMeshSyncStage | 'AUDIT';
  audited: true;
  complete: true;
  guardianBypassed: false;
} {
  return {
    eventId: input.eventId,
    actor: input.actor,
    tenantId: input.tenantId,
    universeId: input.universeId,
    action: input.action,
    stage: input.stage ?? 'AUDIT',
    audited: true,
    complete: true,
    guardianBypassed: false,
  };
}

export function syncMaySkipAudit(): false {
  return false;
}

export function syncMayBypassServerAuth(): false {
  return false;
}

export function syncMayBypassGuardian(): false {
  return false;
}

export function syncMayIgnoreRevocation(): false {
  return false;
}
