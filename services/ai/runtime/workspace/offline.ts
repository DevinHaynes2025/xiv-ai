/**
 * Phase 2I-G offline foundation. Not a production sync engine.
 * Queued mutations still require server/tenant authorization on reconnect.
 */
export const OFFLINE_STATES = [
  'ONLINE',
  'OFFLINE',
  'RECONNECTING',
  'SYNCING',
  'SYNCED',
  'PENDING_SYNC',
  'CONFLICT',
  'EXPIRED',
  'BLOCKED',
  'READ_ONLY',
] as const;
export type OfflineState = (typeof OFFLINE_STATES)[number];

export const OFFLINE_POLICIES = [
  'CLOUD_ONLY',
  'OFFLINE_READ_ONLY',
  'OFFLINE_ENCRYPTED',
  'OFFLINE_EDITABLE',
  'OFFLINE_PROHIBITED',
] as const;
export type OfflinePolicy = (typeof OFFLINE_POLICIES)[number];

export type OfflineStorageClassification = 'never_local' | 'encrypted_local' | 'read_only_local' | 'editable_local';
export type OfflineEncryptionPolicy = { algorithm: 'aes-256-gcm-planned'; secretsStoredLocally: false };
export type OfflineCapability =
  | 'saved_intelligence'
  | 'drafts'
  | 'meeting_notes'
  | 'tasks'
  | 'documents'
  | 'sheets'
  | 'articles'
  | 'research_snapshots'
  | 'dashboards';

export type OfflineRecord = {
  recordId: string;
  organizationId: string;
  classification: OfflineStorageClassification;
  policy: OfflinePolicy;
  encrypted: boolean;
  demo: boolean;
};

export type OfflineMutation = {
  mutationId: string;
  organizationId: string;
  capability: OfflineCapability;
  policy: OfflinePolicy;
  queued: true;
  requiresServerAuthorization: true;
  serverAuthorized: boolean;
  tenantValidated: boolean;
};

export type OfflineMutationQueue = { items: readonly OfflineMutation[]; encrypted: true };
export type OfflineConflict = { mutationId: string; reason: string; resolved: false };
export type OfflineSyncResult = { accepted: boolean; reason: string; productionEngine: false };
export type OfflineSession = { state: OfflineState; policy: OfflinePolicy };
export type OfflineCacheManifest = { allowedRecordIds: readonly string[]; secretsExcluded: true };
export type OfflineSyncMetadata = { lastAttempt: string | null; productionLive: false };

export function offlineSyncEngineProductionLive() {
  return false;
}

export function classificationForPolicy(policy: OfflinePolicy): OfflineStorageClassification {
  if (policy === 'CLOUD_ONLY' || policy === 'OFFLINE_PROHIBITED') return 'never_local';
  if (policy === 'OFFLINE_READ_ONLY') return 'read_only_local';
  if (policy === 'OFFLINE_ENCRYPTED') return 'encrypted_local';
  return 'editable_local';
}

export function enqueueOfflineMutation(input: {
  mutationId: string;
  organizationId: string;
  capability: OfflineCapability;
  policy: OfflinePolicy;
}) {
  if (input.policy === 'CLOUD_ONLY' || input.policy === 'OFFLINE_PROHIBITED') {
    return { allowed: false as const, reason: 'CLOUD_ONLY / OFFLINE_PROHIBITED records cannot be cached offline.' };
  }
  const mutation: OfflineMutation = {
    mutationId: input.mutationId,
    organizationId: input.organizationId,
    capability: input.capability,
    policy: input.policy,
    queued: true,
    requiresServerAuthorization: true,
    serverAuthorized: false,
    tenantValidated: false,
  };
  return { allowed: true as const, mutation, productionEngine: false as const };
}

export function applyOfflineMutation(mutation: OfflineMutation) {
  if (!mutation.requiresServerAuthorization) {
    return { allowed: false as const, reason: 'Offline queue must remain server-authorized.' };
  }
  if (!mutation.serverAuthorized || !mutation.tenantValidated) {
    return { allowed: false as const, reason: 'Offline queued actions still require server authorization and tenant validation.' };
  }
  return { allowed: true as const, productionEngine: false as const };
}

export function offlineBypassesTenantPolicy() {
  return false;
}

export function offlineEncryptionPolicy(): OfflineEncryptionPolicy {
  return { algorithm: 'aes-256-gcm-planned', secretsStoredLocally: false };
}
