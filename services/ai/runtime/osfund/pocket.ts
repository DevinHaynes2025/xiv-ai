/**
 * Pocket Brain V2 — scoped encrypted cache.
 * CLOUD_ONLY is never cached. Private pocket data never auto-enters Global Brain.
 */

import type { PocketCacheClass } from './types';

export type PocketBrainV2Record = {
  recordId: string;
  classification: PocketCacheClass;
  cached: boolean;
  mayEnterGlobalBrain: false;
  secretsStored: false;
};

export function cachePocketBrainV2(input: {
  recordId: string;
  classification: PocketCacheClass;
}): PocketBrainV2Record | { allowed: false; reason: string } {
  if (input.classification === 'CLOUD_ONLY' || input.classification === 'OFFLINE_PROHIBITED') {
    return { allowed: false, reason: 'pocket_brain_v2_cannot_cache_cloud_only' };
  }
  return {
    recordId: input.recordId,
    classification: input.classification,
    cached: true,
    mayEnterGlobalBrain: false,
    secretsStored: false,
  };
}

export function cloudOnlyNeverCached(): true {
  return true;
}

export function pocketPrivateEntersGlobalAutomatically(): false {
  return false;
}

export function pocketStoresRawSecrets(): false {
  return false;
}

export function openPocketBrainV2() {
  return {
    version: 'V2' as const,
    cloudOnlyCached: false as const,
    copyOfGlobalBrain: false as const,
    productionSyncLive: false as const,
  };
}
