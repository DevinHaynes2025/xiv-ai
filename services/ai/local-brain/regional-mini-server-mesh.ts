/**
 * 62L-CN Regional Mini-Server Mesh —
 * Builds on CK/CL cell concepts when present; configured regional mini-servers only.
 * Unconfigured / undiscovered mesh peers DENIED/UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  ARBITRARY_DISCOVERY_DENIED,
  CN_LOCKS,
  HONESTY_BANNER,
  UNCONFIGURED_ENDPOINT_DENIED,
  type CnActor,
} from './world-knowledge-routing-os-types';

export type MiniServer = {
  id: string;
  label: string;
  region: string;
  cellRef: string | null;
  configured: boolean;
  enrolled: boolean;
  createdAt: string;
};

export type MeshHandoff = {
  id: string;
  fromServerId: string | null;
  toServerId: string | null;
  accepted: boolean;
  reason: string;
  at: string;
};

type Store = {
  servers: MiniServer[];
  handoffs: MeshHandoff[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'regional-mini-server-mesh.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { servers: [], handoffs: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function miniServerMeshHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CN_LOCKS.L4_AUTONOMY_ENABLED,
    localFirst: CN_LOCKS.LOCAL_FIRST,
    configuredEndpointsOnly: CN_LOCKS.CONFIGURED_ENDPOINTS_ONLY,
    arbitraryEndpointDiscovery: CN_LOCKS.ARBITRARY_ENDPOINT_DISCOVERY,
    note: 'CK/CL cell fabric WAITING_DATA when modules absent; mesh still enforces configured-only.',
  };
}

export async function registerMiniServer(input: {
  label: string;
  region: string;
  cellRef?: string;
  configured?: boolean;
  enrolled?: boolean;
  root: string;
  actor: CnActor;
}): Promise<MiniServer> {
  void input.actor;
  const store = await load(input.root);
  const server: MiniServer = {
    id: id('msrv'),
    label: input.label,
    region: input.region,
    cellRef: input.cellRef ?? null,
    configured: input.configured !== false,
    enrolled: input.enrolled !== false,
    createdAt: new Date().toISOString(),
  };
  store.servers.push(server);
  await save(input.root, store);
  return server;
}

export async function handoffMiniServer(input: {
  fromServerId: string;
  toServerId: string;
  attemptDiscoverPeer?: boolean;
  root: string;
  actor: CnActor;
}): Promise<MeshHandoff> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();

  if (input.attemptDiscoverPeer === true) {
    const handoff: MeshHandoff = {
      id: id('mhoff'),
      fromServerId: input.fromServerId,
      toServerId: null,
      accepted: false,
      reason: ARBITRARY_DISCOVERY_DENIED,
      at: now,
    };
    store.handoffs.push(handoff);
    await save(input.root, store);
    return handoff;
  }

  const from = store.servers.find((s) => s.id === input.fromServerId);
  const to = store.servers.find((s) => s.id === input.toServerId);

  if (
    !from ||
    !to ||
    !from.configured ||
    !to.configured ||
    !from.enrolled ||
    !to.enrolled
  ) {
    const handoff: MeshHandoff = {
      id: id('mhoff'),
      fromServerId: from?.id ?? input.fromServerId,
      toServerId: to?.id ?? input.toServerId,
      accepted: false,
      reason: UNCONFIGURED_ENDPOINT_DENIED,
      at: now,
    };
    store.handoffs.push(handoff);
    await save(input.root, store);
    return handoff;
  }

  const handoff: MeshHandoff = {
    id: id('mhoff'),
    fromServerId: from.id,
    toServerId: to.id,
    accepted: true,
    reason: 'MINI_SERVER_HANDOFF_ACCEPTED',
    at: now,
  };
  store.handoffs.push(handoff);
  await save(input.root, store);
  return handoff;
}
