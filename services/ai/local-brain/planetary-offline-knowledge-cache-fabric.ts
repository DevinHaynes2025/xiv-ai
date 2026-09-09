/**
 * 62L-CM Planetary Offline Knowledge Cache Fabric.
 * Signed caches for enrolled devices only; revocable; unsigned/revoked rejected.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CM_LOCKS,
  HONESTY_BANNER,
  UNENROLLED_CACHE_INSTALL_DENIED,
  UNSIGNED_OR_REVOKED_CACHE_REJECTED,
  type CmActor,
} from './sovereign-regional-knowledge-clouds-types';

export type CacheDevice = {
  id: string;
  label: string;
  enrolled: boolean;
  createdAt: string;
  reason: string;
};

export type OfflineKnowledgeCache = {
  id: string;
  label: string;
  signed: boolean;
  signatureRef: string | null;
  revoked: boolean;
  createdAt: string;
};

export type CacheInstallResult = {
  id: string;
  cacheId: string;
  deviceId: string;
  accepted: boolean;
  reason: string;
  at: string;
};

type Store = {
  devices: CacheDevice[];
  caches: OfflineKnowledgeCache[];
  installs: CacheInstallResult[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'planetary-offline-knowledge-cache-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    devices: [],
    caches: [],
    installs: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function offlineCacheFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CM_LOCKS.L4_AUTONOMY_ENABLED,
    unsignedCacheInstall: CM_LOCKS.UNSIGNED_CACHE_INSTALL,
    revokedCacheInstall: CM_LOCKS.REVOKED_CACHE_INSTALL,
    unenrolledDeviceCacheInstall: CM_LOCKS.UNENROLLED_DEVICE_CACHE_INSTALL,
    offlineCacheRequiresSignature: CM_LOCKS.OFFLINE_CACHE_REQUIRES_SIGNATURE,
    offlineCacheRequiresEnrollment: CM_LOCKS.OFFLINE_CACHE_REQUIRES_ENROLLMENT,
    offlineCacheRevocable: CM_LOCKS.OFFLINE_CACHE_REVOCABLE,
  };
}

export async function enrollCacheDevice(input: {
  label: string;
  root: string;
  actor: CmActor;
}): Promise<CacheDevice> {
  const store = await load(input.root);
  const device: CacheDevice = {
    id: id('cdev'),
    label: input.label,
    enrolled: true,
    createdAt: new Date().toISOString(),
    reason: 'CACHE_DEVICE_ENROLLED',
  };
  store.devices.push(device);
  await save(input.root, store);
  return device;
}

export async function publishOfflineKnowledgeCache(input: {
  label: string;
  signed: boolean;
  signatureRef?: string;
  root: string;
  actor: CmActor;
}): Promise<OfflineKnowledgeCache> {
  const store = await load(input.root);
  const cache: OfflineKnowledgeCache = {
    id: id('okc'),
    label: input.label,
    signed: input.signed === true,
    signatureRef: input.signed ? (input.signatureRef ?? `sig:${id('sig')}`) : null,
    revoked: false,
    createdAt: new Date().toISOString(),
  };
  store.caches.push(cache);
  await save(input.root, store);
  return cache;
}

export async function revokeOfflineKnowledgeCache(input: {
  cacheId: string;
  root: string;
  actor: CmActor;
}): Promise<OfflineKnowledgeCache> {
  const store = await load(input.root);
  const cache = store.caches.find((c) => c.id === input.cacheId);
  if (!cache) throw new Error('OFFLINE_CACHE_NOT_FOUND');
  cache.revoked = true;
  await save(input.root, store);
  return cache;
}

export async function installOfflineKnowledgeCache(input: {
  cacheId: string;
  deviceId: string;
  root: string;
  actor: CmActor;
}): Promise<CacheInstallResult> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const cache = store.caches.find((c) => c.id === input.cacheId);
  const device = store.devices.find((d) => d.id === input.deviceId);

  if (!device || !device.enrolled) {
    const result: CacheInstallResult = {
      id: id('cinst'),
      cacheId: input.cacheId,
      deviceId: input.deviceId,
      accepted: false,
      reason: UNENROLLED_CACHE_INSTALL_DENIED,
      at: now,
    };
    store.installs.push(result);
    await save(input.root, store);
    return result;
  }

  if (!cache || !cache.signed || cache.revoked || !cache.signatureRef) {
    const result: CacheInstallResult = {
      id: id('cinst'),
      cacheId: input.cacheId,
      deviceId: input.deviceId,
      accepted: false,
      reason: UNSIGNED_OR_REVOKED_CACHE_REJECTED,
      at: now,
    };
    store.installs.push(result);
    await save(input.root, store);
    return result;
  }

  const result: CacheInstallResult = {
    id: id('cinst'),
    cacheId: cache.id,
    deviceId: device.id,
    accepted: true,
    reason: 'SIGNED_CACHE_INSTALLED_ON_ENROLLED_DEVICE',
    at: now,
  };
  store.installs.push(result);
  await save(input.root, store);
  return result;
}
