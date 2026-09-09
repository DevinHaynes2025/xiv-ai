/**
 * 62L-BY Superbrain Synapse Compiler — compile approved device/agent/knowledge/
 * workflow relationships into sparse governed execution routes.
 * Unapproved relationships → DENIED. Not silent privilege expansion.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BY_LOCKS,
  HONESTY_BANNER,
  HIDDEN_REASONING_TRACE_REJECTED,
  UNAPPROVED_SYNAPSE_DENIED,
  containsForbiddenPrivateFields,
  type ByActor,
} from './hardware-cortex-synapse-compiler-types';

export type SynapseRelationshipKind =
  | 'device'
  | 'agent'
  | 'knowledge'
  | 'workflow'
  | 'hardware'
  | 'bi_stream';

export type SynapseRelationship = {
  id: string;
  kind: SynapseRelationshipKind;
  fromId: string;
  toId: string;
  approved: boolean;
  privilegeExpansion: false;
  createdAt: string;
  actorId: string;
};

export type SynapseRoute = {
  id: string;
  relationshipId: string;
  fromId: string;
  toId: string;
  kind: SynapseRelationshipKind;
  sparse: true;
  governed: true;
  privilegeExpanded: false;
  status: 'compiled' | 'denied';
  createdAt: string;
  actorId: string;
  reason: string;
};

type Store = {
  relationships: SynapseRelationship[];
  routes: SynapseRoute[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'superbrain-synapse-compiler.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { relationships: [], routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function synapseCompilerHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4: BY_LOCKS.L4_AUTONOMY_ENABLED,
    unapprovedCompile: BY_LOCKS.UNAPPROVED_SYNAPSE_COMPILE,
    silentPrivilegeExpansion: BY_LOCKS.SYNAPSE_SILENT_PRIVILEGE_EXPANSION,
    approvedOnly: BY_LOCKS.SYNAPSE_APPROVED_RELATIONSHIPS_ONLY,
    sparseGoverned: BY_LOCKS.SPARSE_GOVERNED_ROUTES,
  };
}

export async function registerSynapseRelationship(input: {
  kind: SynapseRelationshipKind;
  fromId: string;
  toId: string;
  approved?: boolean;
  payload?: Record<string, unknown>;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (containsForbiddenPrivateFields(input.payload)) {
    return {
      accepted: false as const,
      reason: HIDDEN_REASONING_TRACE_REJECTED,
      relationship: null,
    };
  }
  const relationship: SynapseRelationship = {
    id: id('rel'),
    kind: input.kind,
    fromId: input.fromId,
    toId: input.toId,
    approved: Boolean(input.approved),
    privilegeExpansion: false,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
  };
  const store = await load(root);
  store.relationships.push(relationship);
  await save(root, store);
  return { accepted: true as const, reason: 'RELATIONSHIP_REGISTERED', relationship };
}

/**
 * Compile an approved relationship into a sparse governed route.
 * Unapproved → DENIED. Never expands privileges.
 */
export async function compileSynapseRoute(input: {
  relationshipId: string;
  attemptPrivilegeExpansion?: boolean;
  payload?: Record<string, unknown>;
  actor: ByActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  if (containsForbiddenPrivateFields(input.payload)) {
    return {
      accepted: false as const,
      status: 'denied' as const,
      reason: HIDDEN_REASONING_TRACE_REJECTED,
      route: null,
    };
  }

  const store = await load(root);
  const relationship = store.relationships.find((r) => r.id === input.relationshipId) ?? null;

  if (!relationship || !relationship.approved) {
    const route: SynapseRoute = {
      id: id('syn'),
      relationshipId: input.relationshipId,
      fromId: relationship?.fromId ?? '',
      toId: relationship?.toId ?? '',
      kind: relationship?.kind ?? 'agent',
      sparse: true,
      governed: true,
      privilegeExpanded: false,
      status: 'denied',
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
      reason: UNAPPROVED_SYNAPSE_DENIED,
    };
    store.routes.push(route);
    await save(root, store);
    return {
      accepted: false as const,
      status: 'denied' as const,
      reason: UNAPPROVED_SYNAPSE_DENIED,
      route,
      privilegeExpanded: false as const,
    };
  }

  if (input.attemptPrivilegeExpansion) {
    const route: SynapseRoute = {
      id: id('syn'),
      relationshipId: relationship.id,
      fromId: relationship.fromId,
      toId: relationship.toId,
      kind: relationship.kind,
      sparse: true,
      governed: true,
      privilegeExpanded: false,
      status: 'denied',
      createdAt: new Date().toISOString(),
      actorId: input.actor.id,
      reason: UNAPPROVED_SYNAPSE_DENIED,
    };
    store.routes.push(route);
    await save(root, store);
    return {
      accepted: false as const,
      status: 'denied' as const,
      reason: UNAPPROVED_SYNAPSE_DENIED,
      route,
      privilegeExpanded: false as const,
    };
  }

  const route: SynapseRoute = {
    id: id('syn'),
    relationshipId: relationship.id,
    fromId: relationship.fromId,
    toId: relationship.toId,
    kind: relationship.kind,
    sparse: true,
    governed: true,
    privilegeExpanded: false,
    status: 'compiled',
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
    reason: 'SYNAPSE_ROUTE_COMPILED_SPARSE_GOVERNED',
  };
  store.routes.push(route);
  await save(root, store);
  return {
    accepted: true as const,
    status: 'compiled' as const,
    reason: route.reason,
    route,
    privilegeExpanded: false as const,
  };
}

export async function listSynapseRoutes(root = process.cwd()) {
  return (await load(root)).routes;
}

export async function listSynapseRelationships(root = process.cwd()) {
  return (await load(root)).relationships;
}
