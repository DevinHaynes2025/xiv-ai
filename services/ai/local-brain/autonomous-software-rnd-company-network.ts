/**
 * 62L-DB Autonomous Software R&D Company Network —
 * Isolated software R&D workcells/network over DA software factory.
 * No self-promote / merge-to-prod; registration ≠ authority.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DB_LOCKS,
  HONESTY_BANNER,
  MAX_RND_WORKCELLS,
  REGISTRATION_NOT_AUTHORITY,
  RND_SELF_PROMOTE_DENIED,
  type DbActor,
} from './distributed-superbrain-runtime-mesh-types';

export type RndWorkcell = {
  id: string;
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  sandboxed: true;
  isolated: true;
  registered: boolean;
  productionAuthority: false;
  promoted: boolean;
  mergedToProd: boolean;
  status: 'SANDBOXED' | 'REGISTERED' | 'UNPROMOTED' | 'DENIED' | 'CANDIDATE' | 'ISOLATED';
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type RndResult = {
  accepted: boolean;
  reason: string;
  workcell?: RndWorkcell;
  at: string;
};

type Store = { workcells: RndWorkcell[] };

function storePath(root: string) {
  return xivLocalPath(root, 'autonomous-software-rnd-company-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { workcells: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function autonomousSoftwareRndCompanyNetworkHonesty() {
  return {
    banner: HONESTY_BANNER,
    selfPromote: DB_LOCKS.RND_WORKCELL_SELF_PROMOTE,
    mergeToProd: DB_LOCKS.RND_WORKCELL_MERGE_TO_PROD,
    registrationEqAuthority: DB_LOCKS.REGISTRATION_EQ_AUTHORITY,
    isolated: true as const,
  };
}

export async function registerRndWorkcell(input: {
  name: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DbActor;
}): Promise<RndResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.workcells.length >= MAX_RND_WORKCELLS) {
    return { accepted: false, reason: 'MAX_RND_WORKCELLS_BOUNDED', at: now };
  }
  const workcell: RndWorkcell = {
    id: id('asrn'),
    name: input.name.trim() || 'rnd-workcell',
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    sandboxed: true,
    isolated: true,
    registered: true,
    productionAuthority: false,
    promoted: false,
    mergedToProd: false,
    status: 'ISOLATED',
    reason: REGISTRATION_NOT_AUTHORITY,
    createdAt: now,
    updatedAt: now,
  };
  store.workcells.push(workcell);
  await save(input.root, store);
  return {
    accepted: true,
    reason: REGISTRATION_NOT_AUTHORITY,
    workcell,
    at: now,
  };
}

export async function requestRndSelfPromoteOrMerge(input: {
  workcellId: string;
  action: 'self_promote' | 'merge_to_prod';
  root: string;
  actor: DbActor;
}): Promise<RndResult> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const workcell = store.workcells.find((w) => w.id === input.workcellId);
  if (!workcell) {
    return { accepted: false, reason: 'RND_WORKCELL_NOT_FOUND', at: now };
  }
  workcell.promoted = false;
  workcell.mergedToProd = false;
  workcell.productionAuthority = false;
  workcell.status = 'DENIED';
  workcell.reason = RND_SELF_PROMOTE_DENIED;
  workcell.updatedAt = now;
  await save(input.root, store);
  return {
    accepted: false,
    reason: RND_SELF_PROMOTE_DENIED,
    workcell,
    at: now,
  };
}
