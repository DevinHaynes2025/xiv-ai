/**
 * Offline Pocket Brain — Cloud Brain → scoped encrypted sync → Pocket Brain.
 * Offline ≠ authorization. Reconnect requires full validation path.
 */

import { OFFLINE_SYNC_STAGES, type OfflineSyncStage, type PocketSyncScope } from './types';

export type PocketBrainSession = {
  sessionId: string;
  encryptedSync: true;
  offlineIsAuthorization: false;
  canAccessUnauthorizedData: false;
  canBypassServerAuthority: false;
  scopes: readonly PocketSyncScope[];
  productionLive: false;
};

export type OfflineEvent = {
  eventId: string;
  signed: boolean;
  queued: true;
};

export function openPocketBrain(scopes: readonly PocketSyncScope[] = [
  'APPROVED_LOCAL_CONTEXT',
  'TASKS',
  'DOCS',
  'CONVERSATIONS',
  'WAREHOUSE_WORKFLOWS',
  'RESEARCH_CACHE',
  'PENDING_EVENTS',
]): PocketBrainSession {
  return {
    sessionId: 'pocket-brain',
    encryptedSync: true,
    offlineIsAuthorization: false,
    canAccessUnauthorizedData: false,
    canBypassServerAuthority: false,
    scopes,
    productionLive: false,
  };
}

export function listOfflineSyncStages(): readonly OfflineSyncStage[] {
  return OFFLINE_SYNC_STAGES;
}

export function queueSignedLocalEvent(input: { eventId: string; signed: boolean }) {
  if (!input.signed) {
    return { allowed: false as const, reason: 'unsigned_local_event_rejected' };
  }
  return {
    allowed: true as const,
    event: {
      eventId: input.eventId,
      signed: true as const,
      queued: true as const,
    } satisfies OfflineEvent,
  };
}

export function synchronizeOfflineQueue(input: {
  authenticated: boolean;
  deviceValidated: boolean;
  tenantValidated: boolean;
  conflictResolved: boolean;
  serverAuthorized: boolean;
  auditEnabled: boolean;
}) {
  if (!input.authenticated) {
    return { allowed: false as const, reason: 'authenticate_required', stage: 'AUTHENTICATE' as const };
  }
  if (!input.deviceValidated) {
    return { allowed: false as const, reason: 'device_validation_required', stage: 'DEVICE_VALIDATION' as const };
  }
  if (!input.tenantValidated) {
    return { allowed: false as const, reason: 'tenant_validation_required', stage: 'TENANT_VALIDATION' as const };
  }
  if (!input.conflictResolved) {
    return { allowed: false as const, reason: 'conflict_detection_required', stage: 'CONFLICT_DETECTION' as const };
  }
  if (!input.serverAuthorized) {
    return { allowed: false as const, reason: 'server_authorization_required', stage: 'SERVER_AUTHORIZATION' as const };
  }
  if (!input.auditEnabled) {
    return { allowed: false as const, reason: 'audit_required', stage: 'AUDIT' as const };
  }
  return { allowed: true as const, stages: OFFLINE_SYNC_STAGES };
}

export function offlineEqualsAuthorization(): false {
  return false;
}

export function offlineBypassesServerAuthority(): false {
  return false;
}

export function offlineGrantsNewPermissions(): false {
  return false;
}
