/**
 * 62L-CM Sovereign Regional Knowledge Clouds — region-scoped isolation/enrollment.
 * Sovereign isolation defaults; no raw cross-region private pooling by default.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CM_LOCKS,
  CROSS_REGION_POOLING_DENIED,
  HONESTY_BANNER,
  type CmActor,
} from './sovereign-regional-knowledge-clouds-types';

export type RegionalCloud = {
  id: string;
  regionId: string;
  label: string;
  enrolled: boolean;
  isolationMode: 'sovereign' | 'federated_aggregate_only';
  privatePoolAllowed: false;
  createdAt: string;
  reason: string;
};

export type CrossRegionPoolAttempt = {
  id: string;
  fromRegionId: string;
  toRegionId: string;
  mode: 'raw_private' | 'authorized_aggregate';
  accepted: boolean;
  reason: string;
  at: string;
};

type Store = {
  clouds: RegionalCloud[];
  poolAttempts: CrossRegionPoolAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'sovereign-regional-knowledge-clouds.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { clouds: [], poolAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function regionalCloudHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CM_LOCKS.L4_AUTONOMY_ENABLED,
    crossRegionRawPrivatePooling: CM_LOCKS.CROSS_REGION_RAW_PRIVATE_POOLING,
    sovereignIsolationDefault: CM_LOCKS.SOVEREIGN_ISOLATION_DEFAULT,
  };
}

export async function enrollRegionalKnowledgeCloud(input: {
  regionId: string;
  label: string;
  root: string;
  actor: CmActor;
}): Promise<RegionalCloud> {
  const store = await load(input.root);
  const cloud: RegionalCloud = {
    id: id('rkc'),
    regionId: input.regionId,
    label: input.label,
    enrolled: true,
    isolationMode: 'sovereign',
    privatePoolAllowed: false,
    createdAt: new Date().toISOString(),
    reason: 'REGIONAL_KNOWLEDGE_CLOUD_ENROLLED_SOVEREIGN_ISOLATION',
  };
  store.clouds.push(cloud);
  await save(input.root, store);
  return cloud;
}

export async function attemptCrossRegionPrivatePooling(input: {
  fromRegionId: string;
  toRegionId: string;
  /** Probe for raw private pooling — always denied by default. */
  mode?: 'raw_private' | 'authorized_aggregate';
  root: string;
  actor: CmActor;
}): Promise<CrossRegionPoolAttempt> {
  const store = await load(input.root);
  const mode = input.mode ?? 'raw_private';
  const now = new Date().toISOString();

  if (mode === 'raw_private' || CM_LOCKS.CROSS_REGION_RAW_PRIVATE_POOLING === false) {
    if (mode === 'raw_private') {
      const attempt: CrossRegionPoolAttempt = {
        id: id('pool'),
        fromRegionId: input.fromRegionId,
        toRegionId: input.toRegionId,
        mode: 'raw_private',
        accepted: false,
        reason: CROSS_REGION_POOLING_DENIED,
        at: now,
      };
      store.poolAttempts.push(attempt);
      await save(input.root, store);
      return attempt;
    }
  }

  // Authorized aggregates only when explicitly requested — still not raw private pooling.
  const attempt: CrossRegionPoolAttempt = {
    id: id('pool'),
    fromRegionId: input.fromRegionId,
    toRegionId: input.toRegionId,
    mode: 'authorized_aggregate',
    accepted: true,
    reason: 'AUTHORIZED_AGGREGATE_EXCHANGE_ONLY_NO_RAW_PRIVATE_POOL',
    at: now,
  };
  store.poolAttempts.push(attempt);
  await save(input.root, store);
  return attempt;
}
