/**
 * 62L-DN Civilization Memory Graph —
 * Lawful civilization-memory graphs (extends DM atlas when PRESENT).
 * Intake without provenance/rights → DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CIVILIZATION_MEMORY_REGIONS,
  CIVILIZATION_WITHOUT_PROVENANCE_DENIED,
  DN_LOCKS,
  HONESTY_BANNER,
  MAX_CIVILIZATION_NODES,
  type CivilizationMemoryRegion,
  type DnActor,
} from './universal-agent-runtime-os-types';

export type CivilizationMemoryGraph = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  provenanceRequired: true;
  rightsRequired: true;
  extendsDmAtlas: true;
  createdAt: string;
};

export type CivilizationMemoryNode = {
  id: string;
  graphId: string;
  region: CivilizationMemoryRegion;
  title: string;
  provenanceRef: string | null;
  rightsRef: string | null;
  authorized: boolean;
  status: 'ACCEPTED' | 'DENIED';
  reason: string;
  createdAt: string;
};

type Store = { graphs: CivilizationMemoryGraph[]; nodes: CivilizationMemoryNode[] };

function storePath(root: string) {
  return xivLocalPath(root, 'civilization-memory-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { graphs: [], nodes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function civilizationMemoryGraphHonesty() {
  return {
    banner: HONESTY_BANNER,
    requiresProvenanceAndRights: DN_LOCKS.CIVILIZATION_MEMORY_REQUIRES_PROVENANCE_AND_RIGHTS,
    withoutProvenanceAllowed: DN_LOCKS.CIVILIZATION_WITHOUT_PROVENANCE_ALLOWED,
    regions: CIVILIZATION_MEMORY_REGIONS,
  };
}

export async function bootstrapCivilizationMemoryGraph(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DnActor;
}): Promise<CivilizationMemoryGraph> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.graphs.find(
    (g) =>
      g.orgId === input.orgId &&
      g.tenantId === input.tenantId &&
      g.universeId === input.universeId,
  );
  if (existing) return existing;
  const graph: CivilizationMemoryGraph = {
    id: id('dncmg'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    provenanceRequired: true,
    rightsRequired: true,
    extendsDmAtlas: true,
    createdAt: new Date().toISOString(),
  };
  store.graphs.push(graph);
  await save(input.root, store);
  return graph;
}

export async function ingestCivilizationMemory(input: {
  graphId: string;
  region: CivilizationMemoryRegion;
  title: string;
  authorized?: boolean;
  provenanceRef?: string;
  rightsRef?: string;
  root: string;
  actor: DnActor;
}): Promise<{ accepted: boolean; reason: string; node?: CivilizationMemoryNode }> {
  void input.actor;
  const store = await load(input.root);
  const graph = store.graphs.find((g) => g.id === input.graphId);
  if (!graph) return { accepted: false, reason: 'CIVILIZATION_MEMORY_GRAPH_NOT_FOUND' };
  if (store.nodes.length >= MAX_CIVILIZATION_NODES) {
    return { accepted: false, reason: 'MAX_CIVILIZATION_NODES_REACHED' };
  }

  const hasProv = Boolean(input.provenanceRef?.trim());
  const hasRights = Boolean(input.rightsRef?.trim());
  const authorized = input.authorized === true;
  if (!authorized || !hasProv || !hasRights) {
    const node: CivilizationMemoryNode = {
      id: id('dncmn'),
      graphId: input.graphId,
      region: input.region,
      title: input.title,
      provenanceRef: input.provenanceRef?.trim() || null,
      rightsRef: input.rightsRef?.trim() || null,
      authorized,
      status: 'DENIED',
      reason: CIVILIZATION_WITHOUT_PROVENANCE_DENIED,
      createdAt: new Date().toISOString(),
    };
    store.nodes.push(node);
    await save(input.root, store);
    return { accepted: false, reason: node.reason, node };
  }

  const node: CivilizationMemoryNode = {
    id: id('dncmn'),
    graphId: input.graphId,
    region: input.region,
    title: input.title,
    provenanceRef: input.provenanceRef!.trim(),
    rightsRef: input.rightsRef!.trim(),
    authorized: true,
    status: 'ACCEPTED',
    reason: 'CIVILIZATION_MEMORY_ACCEPTED_WITH_PROVENANCE_AND_RIGHTS',
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return { accepted: true, reason: node.reason, node };
}
