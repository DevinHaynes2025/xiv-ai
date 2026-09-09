import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { dependencyReadiness, rootById, type RootNode } from './root-graph';
import type { RootIdentityKind } from './information-supply-chain-types';

export type RootIdentity = {
  id: string;
  kind: RootIdentityKind;
  label: string;
  tenantId: string;
  universeId: string;
  capabilityRootId?: string;
  location: 'local' | 'edge' | 'remote_unverified';
  privateMemoryExposed: false;
  productionAuthorization: false;
  createdAt: string;
  lastCachedAt: string;
};

type IdentityStore = { identities: RootIdentity[] };

const MAX_IDENTITIES = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, 'root-identities.json');
}

async function load(root: string): Promise<RootIdentity[]> {
  const parsed = await readJsonFile<IdentityStore>(storePath(root), { identities: [] });
  return Array.isArray(parsed.identities) ? parsed.identities : [];
}

async function save(root: string, identities: RootIdentity[]) {
  await writeJsonFileAtomic(storePath(root), { identities: identities.slice(-MAX_IDENTITIES) });
}

export async function registerRootIdentity(input: {
  kind: RootIdentityKind;
  label: string;
  tenantId: string;
  universeId: string;
  capabilityRootId?: string;
  location?: RootIdentity['location'];
  root?: string;
}): Promise<RootIdentity> {
  if (!input.tenantId || !input.universeId || !input.label.trim()) {
    throw new Error('ROOT_IDENTITY_SCOPE_REQUIRED');
  }
  if (input.location === 'remote_unverified') {
    throw new Error('REMOTE_UNVERIFIED_ROOT_DENIED');
  }
  const diskRoot = input.root ?? process.cwd();
  const now = new Date().toISOString();
  const identity: RootIdentity = {
    id: `rootid_${randomUUID()}`,
    kind: input.kind,
    label: input.label.trim(),
    tenantId: input.tenantId,
    universeId: input.universeId,
    capabilityRootId: input.capabilityRootId,
    location: input.location ?? 'local',
    privateMemoryExposed: false,
    productionAuthorization: false,
    createdAt: now,
    lastCachedAt: now,
  };
  const identities = await load(diskRoot);
  identities.push(identity);
  await save(diskRoot, identities);
  return identity;
}

export async function listRootIdentities(input: {
  tenantId: string;
  universeId: string;
  kind?: RootIdentityKind;
  root?: string;
}) {
  const identities = await load(input.root ?? process.cwd());
  return identities.filter(
    (item) =>
      item.tenantId === input.tenantId &&
      item.universeId === input.universeId &&
      (!input.kind || item.kind === input.kind),
  );
}

export async function cacheRootIdentitiesOffline(input: {
  tenantId: string;
  universeId: string;
  root?: string;
  now?: string;
}) {
  const diskRoot = input.root ?? process.cwd();
  const identities = await load(diskRoot);
  const now = input.now ?? new Date().toISOString();
  let cached = 0;
  for (const identity of identities) {
    if (identity.tenantId !== input.tenantId || identity.universeId !== input.universeId) continue;
    identity.lastCachedAt = now;
    cached += 1;
  }
  await save(diskRoot, identities);
  return {
    cached,
    location: 'local' as const,
    movementBytes: 0 as const,
    privateMemoryExposed: false as const,
  };
}

export function inspectCapabilityRoot(id: string): {
  node: RootNode | null;
  readiness: ReturnType<typeof dependencyReadiness>;
} {
  return {
    node: rootById(id),
    readiness: dependencyReadiness(id),
  };
}
