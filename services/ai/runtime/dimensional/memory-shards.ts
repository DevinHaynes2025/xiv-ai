/**
 * Sparse memory shard model for dimensional knowledge fabric.
 * Device / enterprise / regional / global tiers — phones do not hold the global brain.
 */

import { ATOMIC_SCALE_STORAGE_CLAIM } from './fabric';

export type ShardTier = 'device' | 'enterprise' | 'regional' | 'global';

export type MemoryShardKind =
  | 'embeddings'
  | 'index'
  | 'policy'
  | 'compressed-knowledge'
  | 'pathway-cache';

export type MemoryShard = {
  shardId: string;
  tier: ShardTier;
  kind: MemoryShardKind;
  /** Soft byte cap for compressed local content on this shard. */
  compressedByteCap: number;
  /** Estimated resident bytes (compressed). */
  residentBytes: number;
  contentHashes: readonly string[];
  residencyRegion: string | null;
  offlineAllowed: boolean;
  /** Explicit: device shards never claim global-brain completeness. */
  holdsGlobalBrain: false;
};

/** Conservative compressed caps — research placeholders, not production SLAs. */
export const SHARD_COMPRESSED_CAPS: Readonly<Record<ShardTier, number>> = Object.freeze({
  device: 64 * 1024 * 1024, // 64 MiB — pocket indexes / policies / tiny models
  enterprise: 8 * 1024 * 1024 * 1024, // 8 GiB
  regional: 256 * 1024 * 1024 * 1024, // 256 GiB logical partition
  global: Number.POSITIVE_INFINITY, // federated aggregate; not a single handheld
});

export type CreateMemoryShardInput = {
  shardId: string;
  tier: ShardTier;
  kind: MemoryShardKind;
  contentHashes?: readonly string[];
  residencyRegion?: string | null;
  offlineAllowed?: boolean;
  residentBytes?: number;
  /** Optional override; must not exceed tier cap (except global). */
  compressedByteCap?: number;
};

export function createMemoryShard(input: CreateMemoryShardInput): MemoryShard {
  if (ATOMIC_SCALE_STORAGE_CLAIM) {
    throw new Error('ATOMIC_SCALE_STORAGE_CLAIM must remain false');
  }
  if (!input.shardId) {
    throw new TypeError('shardId is required');
  }
  const tierCap = SHARD_COMPRESSED_CAPS[input.tier];
  const compressedByteCap =
    input.compressedByteCap === undefined
      ? tierCap === Number.POSITIVE_INFINITY
        ? Number.MAX_SAFE_INTEGER
        : tierCap
      : input.compressedByteCap;

  if (input.tier !== 'global' && compressedByteCap > tierCap) {
    throw new RangeError(
      `${input.tier} shard compressedByteCap ${compressedByteCap} exceeds tier cap ${tierCap}`,
    );
  }

  const residentBytes = input.residentBytes ?? 0;
  if (residentBytes < 0 || !Number.isFinite(residentBytes)) {
    throw new RangeError('residentBytes must be a finite non-negative number');
  }
  if (input.tier !== 'global' && residentBytes > compressedByteCap) {
    throw new RangeError('residentBytes exceeds compressedByteCap');
  }

  // Hard honesty rule: no shard object may claim to hold the global brain.
  return {
    shardId: input.shardId,
    tier: input.tier,
    kind: input.kind,
    compressedByteCap,
    residentBytes,
    contentHashes: Object.freeze([...(input.contentHashes ?? [])]),
    residencyRegion: input.residencyRegion ?? null,
    offlineAllowed: input.offlineAllowed ?? input.tier === 'device',
    holdsGlobalBrain: false,
  };
}

/**
 * Pocket/device policy: a phone may carry a compressed local knowledge shard,
 * never the federated global brain.
 */
export function assertDeviceDoesNotHoldGlobalBrain(shard: MemoryShard): void {
  if (shard.tier === 'device' && shard.holdsGlobalBrain !== false) {
    throw new Error('device shard must not hold global brain');
  }
  if (shard.holdsGlobalBrain !== false) {
    throw new Error('no memory shard may claim holdsGlobalBrain=true');
  }
}

export function canMaterializeOnDevice(kind: MemoryShardKind): boolean {
  return kind === 'embeddings' || kind === 'index' || kind === 'policy' || kind === 'compressed-knowledge' || kind === 'pathway-cache';
}