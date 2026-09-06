export type StorageNamespace =
  | 'consumer'
  | 'organizations'
  | 'universes'
  | 'documents'
  | 'images'
  | 'video'
  | 'avatars'
  | 'agent-artifacts'
  | 'business-data';

export type StorageTierName = 'consumer' | 'professional' | 'business' | 'enterprise' | 'sovereign';

export type StorageQuota = {
  tier: StorageTierName;
  maxBytes: number;
  maxObjectBytes: number;
  reservedBytes: number;
  mediaTypeLimits: Readonly<Record<string, number>>;
};

export type StorageUsage = {
  usedBytes: number;
  objectCount: number;
  namespace: StorageNamespace;
};

export type OpaqueStorageReference = {
  referenceId: string;
  namespace: StorageNamespace;
  provider: 'abstract' | 's3_compatible' | 'gcs_compatible';
  credentialsReturned: false;
};

export type UploadAuthorization = {
  authorizationId: string;
  reference: OpaqueStorageReference;
  expiresAt: string;
  credentialsReturned: false;
  uploadEnabled: false;
};

export type StorageProvider = {
  createUploadAuthorization(input: {
    namespace: StorageNamespace;
    sizeBytes: number;
    ownerId: string;
  }): UploadAuthorization;
  completeUpload(authorizationId: string): { ok: boolean; reason: string; credentialsReturned: false };
  getSignedDownload(referenceId: string): { downloadReference: string; expiresAt: string; credentialsReturned: false };
  getMetadata(referenceId: string): { referenceId: string; namespace: StorageNamespace; sizeBytes: number } | null;
  deleteObject(referenceId: string): { ok: false; reason: string; governed: true };
  checkQuota(usage: StorageUsage, quota: StorageQuota, incomingBytes: number): { allowed: boolean; reason: string };
};
