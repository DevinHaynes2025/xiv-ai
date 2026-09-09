/**
 * 62L-DX Module E — Personal/Enterprise Memory Cortex.
 * Governed memory; sealed deny unenrolled.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_MEMORY_EVENTS,
  MEMORY_ACL_DENIED,
  MEMORY_UNENROLLED_DENIED,
  type DxActor,
} from './autonomous-supply-chain-ops-types';

export type MemoryAccess = {
  id: string;
  subjectId: string;
  enrolled: boolean;
  explicitGrant: boolean;
  status: 'allowed_governed' | 'denied';
  reason: string;
  at: string;
};

type Store = { accesses: MemoryAccess[] };

function storePath(root: string) {
  return xivLocalPath(root, 'personal-enterprise-memory-cortex.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { accesses: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function personalEnterpriseMemoryCortexHonesty() {
  return {
    denyUnenrolled: true,
    governedAcl: true,
    sealedDenyByDefault: true,
  };
}

export async function accessMemoryCortex(input: {
  subjectId: string;
  enrolled: boolean;
  explicitGrant?: boolean;
  root: string;
  actor: DxActor;
}): Promise<MemoryAccess> {
  const store = await load(input.root);
  void input.actor;
  if (store.accesses.length >= MAX_MEMORY_EVENTS) {
    throw new Error('MAX_MEMORY_EVENTS_REACHED');
  }

  let status: MemoryAccess['status'] = 'denied';
  let reason = MEMORY_ACL_DENIED;

  if (!input.enrolled) {
    reason = MEMORY_UNENROLLED_DENIED;
  } else if (input.explicitGrant !== true) {
    reason = MEMORY_ACL_DENIED;
  } else {
    status = 'allowed_governed';
    reason = 'MEMORY_CORTEX_GOVERNED_ACCESS_RECORDED';
  }

  const record: MemoryAccess = {
    id: id('dxmem'),
    subjectId: input.subjectId,
    enrolled: input.enrolled,
    explicitGrant: input.explicitGrant === true,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.accesses.push(record);
  await save(input.root, store);
  return record;
}
