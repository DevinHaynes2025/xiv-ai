import { randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';

export const LOGICAL_UNIVERSE_ASSETS = [
  'policies',
  'agents',
  'memory',
  'evidence',
  'simulations',
  'knowledge_packs',
  'sandbox_lineage',
] as const;

export type LogicalUniverseAsset = (typeof LOGICAL_UNIVERSE_ASSETS)[number];

export type LogicalUniverse = {
  id: string;
  tenantId: string;
  label: string;
  clonedFrom?: string;
  assets: LogicalUniverseAsset[];
  physicalAlternateUniverse: false;
  productionAuthorization: false;
  createdAt: string;
};

export type UniverseFederationLink = {
  id: string;
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  assets: LogicalUniverseAsset[];
  createdAt: string;
};

type GraphStore = {
  universes: LogicalUniverse[];
  links: UniverseFederationLink[];
};

function graphPath(root: string) {
  return xivLocalPath(root, 'logical-universe-graph.json');
}

async function load(root: string): Promise<GraphStore> {
  const parsed = await readJsonFile<GraphStore>(graphPath(root), { universes: [], links: [] });
  return {
    universes: Array.isArray(parsed.universes) ? parsed.universes : [],
    links: Array.isArray(parsed.links) ? parsed.links : [],
  };
}

export async function ensureLogicalUniverse(input: {
  tenantId: string;
  universeId: string;
  label?: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  let universe = store.universes.find((item) => item.id === input.universeId && item.tenantId === input.tenantId);
  if (!universe) {
    universe = {
      id: input.universeId,
      tenantId: input.tenantId,
      label: input.label ?? input.universeId,
      assets: [...LOGICAL_UNIVERSE_ASSETS],
      physicalAlternateUniverse: false,
      productionAuthorization: false,
      createdAt: new Date().toISOString(),
    };
    store.universes.push(universe);
    await writeJsonFileAtomic(graphPath(root), store);
  }
  return universe;
}

export async function cloneLogicalUniverse(input: {
  tenantId: string;
  fromUniverseId: string;
  label: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const parent = await ensureLogicalUniverse({ tenantId: input.tenantId, universeId: input.fromUniverseId, root });
  const store = await load(root);
  const clone: LogicalUniverse = {
    id: `univ_${randomUUID()}`,
    tenantId: input.tenantId,
    label: input.label,
    clonedFrom: parent.id,
    assets: [...LOGICAL_UNIVERSE_ASSETS],
    physicalAlternateUniverse: false,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  store.universes.push(clone);
  await writeJsonFileAtomic(graphPath(root), store);
  return clone;
}

export async function federateLogicalUniverses(input: {
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  assets?: LogicalUniverseAsset[];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  await ensureLogicalUniverse({ tenantId: input.tenantId, universeId: input.fromUniverseId, root });
  await ensureLogicalUniverse({ tenantId: input.tenantId, universeId: input.toUniverseId, root });
  const store = await load(root);
  const link: UniverseFederationLink = {
    id: `ulink_${randomUUID()}`,
    tenantId: input.tenantId,
    fromUniverseId: input.fromUniverseId,
    toUniverseId: input.toUniverseId,
    assets: input.assets ?? [...LOGICAL_UNIVERSE_ASSETS],
    createdAt: new Date().toISOString(),
  };
  store.links.push(link);
  await writeJsonFileAtomic(graphPath(root), store);
  return link;
}

export async function isFederated(input: {
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  root?: string;
}) {
  const store = await load(input.root ?? process.cwd());
  return store.links.some(
    (link) =>
      link.tenantId === input.tenantId &&
      ((link.fromUniverseId === input.fromUniverseId && link.toUniverseId === input.toUniverseId) ||
        (link.fromUniverseId === input.toUniverseId && link.toUniverseId === input.fromUniverseId)),
  );
}

export async function listLogicalUniverses(input: { tenantId: string; root?: string }) {
  const store = await load(input.root ?? process.cwd());
  return store.universes.filter((item) => item.tenantId === input.tenantId);
}
