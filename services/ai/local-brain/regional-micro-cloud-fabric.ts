/**
 * 62L-CO Regional Micro-Cloud Fabric — enrolled regional micro-clouds only.
 * Builds on CK/CL/CM cells/clouds when present; no raw private pooling by default.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CO_LOCKS,
  HONESTY_BANNER,
  type CoActor,
} from './global-knowledge-exchange-os-types';

export type MicroCloudNode = {
  id: string;
  regionId: string;
  label: string;
  enrolled: boolean;
  buildsOnClCell: boolean;
  isolationDefault: true;
  rawPrivatePoolingDefault: false;
  createdAt: string;
  reason: string;
};

export type FabricPoolAttempt = {
  id: string;
  fromRegionId: string;
  toRegionId: string;
  mode: 'raw_private' | 'authorized_aggregate';
  accepted: boolean;
  reason: string;
  at: string;
};

type Store = {
  nodes: MicroCloudNode[];
  poolAttempts: FabricPoolAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'regional-micro-cloud-fabric.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [], poolAttempts: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function microCloudFabricHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CO_LOCKS.L4_AUTONOMY_ENABLED,
    rawPrivatePoolingDefault: CO_LOCKS.RAW_PRIVATE_POOLING_DEFAULT,
    localFirst: CO_LOCKS.LOCAL_FIRST,
    founderSealedDenyByDefault: CO_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
  };
}

export async function enrollRegionalMicroCloud(input: {
  regionId: string;
  label: string;
  root: string;
  actor: CoActor;
}): Promise<MicroCloudNode> {
  const store = await load(input.root);
  const node: MicroCloudNode = {
    id: id('rmc'),
    regionId: input.regionId,
    label: input.label,
    enrolled: true,
    buildsOnClCell: true,
    isolationDefault: true,
    rawPrivatePoolingDefault: false,
    createdAt: new Date().toISOString(),
    reason: 'REGIONAL_MICRO_CLOUD_ENROLLED_ISOLATION_DEFAULT',
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function attemptFabricPrivatePooling(input: {
  fromRegionId: string;
  toRegionId: string;
  mode?: 'raw_private' | 'authorized_aggregate';
  root: string;
  actor: CoActor;
}): Promise<FabricPoolAttempt> {
  const store = await load(input.root);
  const mode = input.mode ?? 'raw_private';
  const now = new Date().toISOString();

  if (mode === 'raw_private' || CO_LOCKS.RAW_PRIVATE_POOLING_DEFAULT === false) {
    if (mode === 'raw_private') {
      const attempt: FabricPoolAttempt = {
        id: id('pool'),
        fromRegionId: input.fromRegionId,
        toRegionId: input.toRegionId,
        mode: 'raw_private',
        accepted: false,
        reason: 'RAW_PRIVATE_POOLING_DENIED_BY_DEFAULT',
        at: now,
      };
      store.poolAttempts.push(attempt);
      await save(input.root, store);
      return attempt;
    }
  }

  const attempt: FabricPoolAttempt = {
    id: id('pool'),
    fromRegionId: input.fromRegionId,
    toRegionId: input.toRegionId,
    mode: 'authorized_aggregate',
    accepted: true,
    reason: 'AUTHORIZED_AGGREGATE_ONLY_NO_RAW_PRIVATE_POOL',
    at: now,
  };
  store.poolAttempts.push(attempt);
  await save(input.root, store);
  return attempt;
}
