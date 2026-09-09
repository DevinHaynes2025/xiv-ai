import { canReserveStorage } from './quotas';
import type {
  OpaqueStorageReference,
  StorageNamespace,
  StorageProvider,
  StorageQuota,
  StorageUsage,
  UploadAuthorization,
} from './types';

function opaqueReference(namespace: StorageNamespace): OpaqueStorageReference {
  return {
    referenceId: `ref_${namespace}_${Date.now().toString(36)}`,
    namespace,
    provider: 'abstract',
    credentialsReturned: false,
  };
}

/**
 * In-memory storage adapter. Upload is authorized as a policy object only.
 * Production uploads remain disabled. Credentials are never returned.
 */
export function createAbstractStorageProvider(quota: StorageQuota): StorageProvider {
  const objects = new Map<string, { namespace: StorageNamespace; sizeBytes: number }>();

  return {
    createUploadAuthorization(input) {
      const reservation = canReserveStorage(
        { usedBytes: [...objects.values()].reduce((sum, item) => sum + item.sizeBytes, 0), objectCount: objects.size, namespace: input.namespace },
        quota,
        input.sizeBytes,
      );
      const reference = opaqueReference(input.namespace);
      const authorization: UploadAuthorization = {
        authorizationId: `upl_${reference.referenceId}`,
        reference,
        expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
        credentialsReturned: false,
        uploadEnabled: false,
      };
      if (!reservation.allowed) {
        return authorization;
      }
      return authorization;
    },
    completeUpload() {
      return {
        ok: false,
        reason: 'Production uploads are disabled in Phase 2D.',
        credentialsReturned: false as const,
      };
    },
    getSignedDownload(referenceId) {
      return {
        downloadReference: `dl_${referenceId}`,
        expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
        credentialsReturned: false as const,
      };
    },
    getMetadata(referenceId) {
      const found = objects.get(referenceId);
      return found ? { referenceId, namespace: found.namespace, sizeBytes: found.sizeBytes } : null;
    },
    deleteObject() {
      return {
        ok: false as const,
        reason: 'Deletion is governed and disabled in Phase 2D.',
        governed: true as const,
      };
    },
    checkQuota(usage: StorageUsage, nextQuota: StorageQuota, incomingBytes: number) {
      return canReserveStorage(usage, nextQuota, incomingBytes);
    },
  };
}

export function authorizationHasCredentials(value: { credentialsReturned?: boolean }) {
  return value.credentialsReturned === true;
}
