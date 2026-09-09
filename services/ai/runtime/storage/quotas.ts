import type { StorageQuota, StorageTierName, StorageUsage } from './types';

export const STORAGE_TIERS: Record<StorageTierName, StorageQuota> = {
  consumer: {
    tier: 'consumer',
    maxBytes: 2 * 1024 * 1024 * 1024,
    maxObjectBytes: 25 * 1024 * 1024,
    reservedBytes: 0,
    mediaTypeLimits: { image: 15 * 1024 * 1024, video: 25 * 1024 * 1024 },
  },
  professional: {
    tier: 'professional',
    maxBytes: 20 * 1024 * 1024 * 1024,
    maxObjectBytes: 100 * 1024 * 1024,
    reservedBytes: 0,
    mediaTypeLimits: { image: 25 * 1024 * 1024, video: 100 * 1024 * 1024 },
  },
  business: {
    tier: 'business',
    maxBytes: 200 * 1024 * 1024 * 1024,
    maxObjectBytes: 500 * 1024 * 1024,
    reservedBytes: 0,
    mediaTypeLimits: { image: 50 * 1024 * 1024, video: 500 * 1024 * 1024 },
  },
  enterprise: {
    tier: 'enterprise',
    maxBytes: 2 * 1024 * 1024 * 1024 * 1024,
    maxObjectBytes: 2 * 1024 * 1024 * 1024,
    reservedBytes: 0,
    mediaTypeLimits: { image: 100 * 1024 * 1024, video: 2 * 1024 * 1024 * 1024 },
  },
  sovereign: {
    tier: 'sovereign',
    maxBytes: 2 * 1024 * 1024 * 1024 * 1024,
    maxObjectBytes: 2 * 1024 * 1024 * 1024,
    reservedBytes: 0,
    mediaTypeLimits: { image: 100 * 1024 * 1024, video: 2 * 1024 * 1024 * 1024 },
  },
};

export function canReserveStorage(usage: StorageUsage, quota: StorageQuota, incomingBytes: number) {
  if (incomingBytes <= 0) return { allowed: false as const, reason: 'Invalid reservation size.' };
  if (incomingBytes > quota.maxObjectBytes) {
    return { allowed: false as const, reason: 'Object exceeds maxObjectBytes. Storage is not unlimited.' };
  }
  if (usage.usedBytes + quota.reservedBytes + incomingBytes > quota.maxBytes) {
    return { allowed: false as const, reason: 'Quota exceeded. Storage is not unlimited.' };
  }
  return { allowed: true as const, reason: 'Reservation is within quota.' };
}
