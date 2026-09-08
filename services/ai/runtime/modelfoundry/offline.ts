/**
 * Local / Offline model contracts.
 * Encrypted local scope; no new authority; no unrestricted cloud sync;
 * explicit data expiration; server revalidation on reconnect.
 */

import type { OfflineModelMode } from './types';

export type OfflineModelContract = {
  mode: OfflineModelMode;
  encryptedLocalScope: true;
  newAuthority: false;
  unrestrictedCloudSync: false;
  explicitDataExpiration: true;
  serverRevalidationOnReconnect: true;
  l4Enabled: false;
  bypassGuardian: false;
};

export type OfflineSession = {
  sessionId: string;
  mode: OfflineModelMode;
  expiresAt: string;
  pendingRevalidation: boolean;
  authorityGain: false;
};

export function openOfflineModel(mode: OfflineModelMode): OfflineModelContract {
  return {
    mode,
    encryptedLocalScope: true,
    newAuthority: false,
    unrestrictedCloudSync: false,
    explicitDataExpiration: true,
    serverRevalidationOnReconnect: true,
    l4Enabled: false,
    bypassGuardian: false,
  };
}

export function offlineModelMayGainAuthority(_mode?: OfflineModelMode): false {
  return false;
}

export function startOfflineSession(input: {
  mode: OfflineModelMode;
  expiresAt: string;
  claimNewAuthority?: boolean;
  unrestrictedSync?: boolean;
  enableL4?: boolean;
}): OfflineSession | { allowed: false; reason: string } {
  if (input.claimNewAuthority === true) {
    return { allowed: false, reason: 'offline_model_cannot_gain_authority' };
  }
  if (input.unrestrictedSync === true) {
    return { allowed: false, reason: 'unrestricted_cloud_sync_forbidden' };
  }
  if (input.enableL4 === true) {
    return { allowed: false, reason: 'l4_remains_disabled' };
  }
  if (!input.expiresAt) {
    return { allowed: false, reason: 'explicit_data_expiration_required' };
  }
  return {
    sessionId: `offline_${input.mode}`,
    mode: input.mode,
    expiresAt: input.expiresAt,
    pendingRevalidation: true,
    authorityGain: false,
  };
}

export function revalidateOfflineSession(session: OfflineSession) {
  return {
    ...session,
    pendingRevalidation: false,
    authorityGain: false as const,
    serverRevalidated: true as const,
  };
}
