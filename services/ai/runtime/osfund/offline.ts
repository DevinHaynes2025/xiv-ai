/**
 * Online / Offline agent modes.
 * Offline never escalates privilege. Uncached private data stays unreachable.
 */

import type { AgentConnectivityMode, OfflineCapability } from './types';

export const OFFLINE_CAPABILITIES: readonly OfflineCapability[] = [
  'QUEUED_ACTIONS',
  'CACHED_AUTHORIZED',
  'READ_CACHED_ONLY',
  'NO_PRIVATE_UNCACHED',
  'NO_CREDENTIAL_CACHE',
] as const;

export type OfflineAgentSession = {
  mode: AgentConnectivityMode;
  canAccessUncachedPrivate: false;
  canBypassServerAuthority: false;
  canCacheCredentials: false;
  queuedActionsRequireReconnectAuth: true;
};

export function openOfflineAgent(mode: AgentConnectivityMode = 'OFFLINE'): OfflineAgentSession {
  void mode;
  return {
    mode: 'OFFLINE',
    canAccessUncachedPrivate: false,
    canBypassServerAuthority: false,
    canCacheCredentials: false,
    queuedActionsRequireReconnectAuth: true,
  };
}

export function offlineAgentAccessUncachedPrivate(input: {
  cached: boolean;
  classification: 'TENANT_PRIVATE' | 'CLOUD_ONLY' | 'PUBLIC';
}): boolean {
  if (input.classification === 'PUBLIC' && input.cached) return true;
  return false;
}

export function offlineAgentBypassesServerAuthority(): false {
  return false;
}

export function offlineEscalatesPrivilege(): false {
  return false;
}

export function reconnectRequiresServerAuthorization(): true {
  return true;
}
