/**
 * Sync engine contracts. Offline queues are not production sync.
 * Conflicts never auto-grant higher privilege.
 */

import type { SyncConflictPolicy } from './types';

export type SyncEnvelope = {
  envelopeId: string;
  tenantId: string;
  universeId: string;
  policy: SyncConflictPolicy;
  containsSecret: boolean;
};

export type SyncDecision =
  | { allowed: true; serverAuthorizationRequired: true }
  | { allowed: false; reason: string };

export function openSyncEngine() {
  return {
    productionLive: false as const,
    offlineQueueFoundation: true as const,
    autoPrivilegeEscalation: false as const,
  };
}

export function enqueueSync(input: {
  tenantId: string;
  universeId: string;
  containsSecret?: boolean;
  cloudOnly?: boolean;
}): SyncDecision {
  if (input.containsSecret === true) {
    return { allowed: false, reason: 'sync_cannot_queue_secrets' };
  }
  if (input.cloudOnly === true) {
    return { allowed: false, reason: 'sync_cannot_queue_cloud_only' };
  }
  if (!input.tenantId || !input.universeId) {
    return { allowed: false, reason: 'sync_requires_tenant_and_universe' };
  }
  return { allowed: true, serverAuthorizationRequired: true };
}

export function resolveSyncConflict(input: {
  localPrivilegeHigher?: boolean;
  humanReviewed: boolean;
}) {
  if (input.localPrivilegeHigher === true) {
    return { allowed: false as const, reason: 'sync_conflict_cannot_escalate_privilege' };
  }
  if (input.humanReviewed !== true) {
    return { allowed: false as const, reason: 'sync_conflict_requires_human_or_server_policy' };
  }
  return { allowed: true as const, policy: 'SERVER_WINS_UNTIL_REVIEW' as const };
}

export function syncGrantsAuthority(): false {
  return false;
}

export function syncEngineIsProductionLive(): false {
  return false;
}
