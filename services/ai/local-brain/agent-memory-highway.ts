/**
 * 62L-DW Module F — Agent Memory Highway.
 * Signed memory highways; deny unsigned / unenrolled peers.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  MAX_MEMORY_HOPS,
  UNENROLLED_PEER,
  UNSIGNED_HIGHWAY,
  type DwActor,
} from './supply-chain-superbrain-types';

export type MemoryHighwayHop = {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  signed: boolean;
  enrolledPeer: boolean;
  status: 'accepted' | 'denied';
  reason: string;
  createdAt: string;
};

type Store = {
  hops: MemoryHighwayHop[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-memory-highway.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { hops: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentMemoryHighwayHonesty() {
  return {
    unsignedMemoryHighwayAllowed: false,
    unenrolledPeerAllowed: false,
    sealedDenyOnUnsigned: true,
    learningNeqPermission: true,
  };
}

export async function sendSignedMemoryHop(input: {
  fromAgentId: string;
  toAgentId: string;
  signed: boolean;
  enrolledPeer: boolean;
  root: string;
  actor: DwActor;
}): Promise<MemoryHighwayHop> {
  const store = await load(input.root);
  void input.actor;
  if (store.hops.length >= MAX_MEMORY_HOPS) throw new Error('MAX_MEMORY_HOPS_REACHED');

  let status: 'accepted' | 'denied' = 'accepted';
  let reason = 'MEMORY_HIGHWAY_SIGNED_ENROLLED';
  if (!input.signed) {
    status = 'denied';
    reason = UNSIGNED_HIGHWAY;
  } else if (!input.enrolledPeer) {
    status = 'denied';
    reason = UNENROLLED_PEER;
  }

  const hop: MemoryHighwayHop = {
    id: id('dwmem'),
    fromAgentId: input.fromAgentId,
    toAgentId: input.toAgentId,
    signed: input.signed,
    enrolledPeer: input.enrolledPeer,
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.hops.push(hop);
  await save(input.root, store);
  return hop;
}
