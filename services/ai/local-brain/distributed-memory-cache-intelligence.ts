/**
 * 62L-BZ Distributed Memory/Cache Intelligence — coherence contracts,
 * invalidation on change; stale cache ≠ fresh verified.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BZ_LOCKS,
  HONESTY_BANNER,
  STALE_CACHE_NOT_FRESH,
  type BzActor,
} from './global-compute-nervous-routing-types';

export type CacheFreshness = 'fresh' | 'stale' | 'unknown' | 'waiting_data' | 'invalidated';

export type CacheEntry = {
  id: string;
  key: string;
  valueDigest: string;
  freshness: CacheFreshness;
  verified: boolean;
  coherenceEpoch: number;
  sourceVersion: string;
  createdAt: string;
  updatedAt: string;
};

export type CoherenceContract = {
  id: string;
  name: string;
  requireInvalidationOnChange: true;
  staleNeverFreshVerified: true;
  trustBeatsSpeed: true;
};

export type CacheReadResult = {
  entry: CacheEntry | null;
  treatedAsFreshVerified: boolean;
  reason: string;
};

type Store = {
  entries: CacheEntry[];
  contracts: CoherenceContract[];
  invalidations: Array<{
    id: string;
    key: string;
    reason: string;
    epoch: number;
    at: string;
  }>;
  epoch: number;
};

function storePath(root: string) {
  return xivLocalPath(root, 'distributed-memory-cache-intelligence.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    entries: [],
    contracts: [],
    invalidations: [],
    epoch: 1,
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function cacheIntelligenceHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: BZ_LOCKS.L4_AUTONOMY_ENABLED,
    staleCacheLabeledFreshVerified: BZ_LOCKS.STALE_CACHE_LABELED_FRESH_VERIFIED,
    cacheCoherenceRequired: BZ_LOCKS.CACHE_COHERENCE_REQUIRED,
    trustPolicyBeatsSpeed: BZ_LOCKS.TRUST_POLICY_BEATS_SPEED,
  };
}

export async function declareCoherenceContract(input: {
  name: string;
  root: string;
}): Promise<CoherenceContract> {
  const store = await load(input.root);
  const contract: CoherenceContract = {
    id: id('coh'),
    name: input.name,
    requireInvalidationOnChange: true,
    staleNeverFreshVerified: true,
    trustBeatsSpeed: true,
  };
  store.contracts.push(contract);
  await save(input.root, store);
  return contract;
}

export async function putCacheEntry(input: {
  key: string;
  valueDigest: string;
  freshness: CacheFreshness;
  verified: boolean;
  sourceVersion: string;
  root: string;
  actor: BzActor;
}): Promise<CacheEntry> {
  const store = await load(input.root);
  const now = new Date().toISOString();
  const existing = store.entries.find((e) => e.key === input.key);
  if (existing) {
    existing.valueDigest = input.valueDigest;
    existing.freshness = input.freshness;
    existing.verified = input.verified === true && input.freshness === 'fresh';
    existing.sourceVersion = input.sourceVersion;
    existing.coherenceEpoch = store.epoch;
    existing.updatedAt = now;
    await save(input.root, store);
    return existing;
  }
  const entry: CacheEntry = {
    id: id('cache'),
    key: input.key,
    valueDigest: input.valueDigest,
    freshness: input.freshness,
    verified: input.verified === true && input.freshness === 'fresh',
    coherenceEpoch: store.epoch,
    sourceVersion: input.sourceVersion,
    createdAt: now,
    updatedAt: now,
  };
  store.entries.push(entry);
  await save(input.root, store);
  return entry;
}

export async function readCacheEntry(input: {
  key: string;
  forceTreatStaleAsFreshVerified?: boolean;
  root: string;
}): Promise<CacheReadResult> {
  const store = await load(input.root);
  const entry = store.entries.find((e) => e.key === input.key) ?? null;
  if (!entry) {
    return {
      entry: null,
      treatedAsFreshVerified: false,
      reason: 'CACHE_MISS',
    };
  }
  if (
    entry.freshness === 'stale' ||
    entry.freshness === 'invalidated' ||
    entry.freshness === 'waiting_data' ||
    entry.freshness === 'unknown'
  ) {
    return {
      entry,
      treatedAsFreshVerified: false,
      reason: STALE_CACHE_NOT_FRESH,
    };
  }
  if (input.forceTreatStaleAsFreshVerified) {
    return {
      entry,
      treatedAsFreshVerified: false,
      reason: STALE_CACHE_NOT_FRESH,
    };
  }
  return {
    entry,
    treatedAsFreshVerified: entry.verified === true && entry.freshness === 'fresh',
    reason:
      entry.verified && entry.freshness === 'fresh'
        ? 'FRESH_VERIFIED_CACHE'
        : 'FRESH_BUT_UNVERIFIED',
  };
}

export async function invalidateOnChange(input: {
  key: string;
  changeReason: string;
  newSourceVersion: string;
  root: string;
  actor: BzActor;
}): Promise<{ entry: CacheEntry | null; invalidated: boolean; epoch: number }> {
  const store = await load(input.root);
  store.epoch += 1;
  const entry = store.entries.find((e) => e.key === input.key) ?? null;
  store.invalidations.push({
    id: id('inv'),
    key: input.key,
    reason: input.changeReason,
    epoch: store.epoch,
    at: new Date().toISOString(),
  });
  if (entry) {
    entry.freshness = 'invalidated';
    entry.verified = false;
    entry.coherenceEpoch = store.epoch;
    entry.sourceVersion = input.newSourceVersion;
    entry.updatedAt = new Date().toISOString();
  }
  await save(input.root, store);
  return { entry, invalidated: true, epoch: store.epoch };
}

export async function listCacheEntries(root: string) {
  return (await load(root)).entries;
}
