import type { StorageProvider } from '../storage/types';

/** Media uses the shared storage provider. No credentials are held here. */
export function bindMediaStorage(provider: StorageProvider) {
  return provider;
}
