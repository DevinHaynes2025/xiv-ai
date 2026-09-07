import { applyOfflineMutation, enqueueOfflineMutation } from '../workspace/offline';

export type PocketSyncEnvelope = {
  signed: true;
  deviceAuthorized: boolean;
  tenantAuthorized: boolean;
  universeAuthorized: boolean;
  permissionAuthorized: boolean;
};

export function queueOfflineEvent(input: { organizationId: string; policy: 'OFFLINE_ENCRYPTED' | 'CLOUD_ONLY' }) {
  return enqueueOfflineMutation({
    mutationId: 'pocket-event-1',
    organizationId: input.organizationId,
    capability: 'tasks',
    policy: input.policy,
  });
}

export function offlineQueueAuthorizesItself(): false {
  return false;
}

export function reconnectOfflineEvent(input: {
  tenantAuthorized: boolean;
  deviceVerified: boolean;
  universeAuthorized: boolean;
  permissionAuthorized: boolean;
}) {
  const queued = enqueueOfflineMutation({
    mutationId: 'pocket-reconnect-1',
    organizationId: 'tenant-a',
    capability: 'tasks',
    policy: 'OFFLINE_ENCRYPTED',
  });
  if (!queued.allowed) return queued;
  if (!input.tenantAuthorized || !input.deviceVerified || !input.universeAuthorized || !input.permissionAuthorized) {
    return { allowed: false as const, reason: 'reconnect_requires_tenant_authorization' };
  }
  return applyOfflineMutation({
    ...queued.mutation,
    serverAuthorized: true,
    tenantValidated: input.tenantAuthorized,
  });
}
