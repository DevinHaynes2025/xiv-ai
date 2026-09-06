export { canReserveStorage, STORAGE_TIERS } from './quotas';
export { authorizationHasCredentials, createAbstractStorageProvider } from './provider';
export type {
  OpaqueStorageReference,
  StorageNamespace,
  StorageProvider,
  StorageQuota,
  StorageTierName,
  StorageUsage,
  UploadAuthorization,
} from './types';
