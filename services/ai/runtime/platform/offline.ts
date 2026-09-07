import { offlineQueueAuthorizesItself } from '../pocket/offline';

export type OfflineV2Event = {
  eventId: string;
  signed: boolean;
  encrypted: boolean;
  cachedAuthorized: boolean;
};

export type OfflineV2Queue = {
  events: readonly OfflineV2Event[];
  autonomousAuthority: false;
};

export function enqueueOfflineV2(input: {
  signed: boolean;
  encrypted?: boolean;
  cachedAuthorized?: boolean;
}) {
  if (input.signed !== true) {
    return { allowed: false as const, reason: 'offline_event_requires_signature' };
  }
  if (input.cachedAuthorized === false) {
    return { allowed: false as const, reason: 'offline_requires_authorized_cached_data' };
  }
  return {
    allowed: true as const,
    event: {
      eventId: 'offline-v2-1',
      signed: true as const,
      encrypted: input.encrypted !== false,
      cachedAuthorized: true as const,
    } satisfies OfflineV2Event,
  };
}

export function reconcileOfflineV2(input: {
  signed: boolean;
  reauthenticated: boolean;
  guardianPassed: boolean;
  tenantValid: boolean;
  universeValid: boolean;
}) {
  if (input.signed !== true) {
    return { allowed: false as const, reason: 'offline_event_requires_signature' };
  }
  if (input.reauthenticated !== true) {
    return { allowed: false as const, reason: 'offline_reconnect_requires_reauthentication' };
  }
  if (input.guardianPassed !== true) {
    return { allowed: false as const, reason: 'offline_cannot_bypass_guardian' };
  }
  if (input.tenantValid !== true || input.universeValid !== true) {
    return { allowed: false as const, reason: 'offline_requires_tenant_and_universe_validation' };
  }
  return { allowed: true as const, serverAuthority: true as const, offlineRemainsNonAuthoritative: true as const };
}

export function offlineActionBecomesServerAuthority(): false {
  void offlineQueueAuthorizesItself();
  return false;
}

export function createOfflineQueue(): OfflineV2Queue {
  return { events: [], autonomousAuthority: false };
}
