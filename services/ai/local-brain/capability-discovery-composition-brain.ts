/**
 * 62L-DQ Capability Discovery & Composition Brain —
 * Reuse-first capability discovery/composition.
 * Composition ≠ permission escalation beyond constituent permissions.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  COMPOSITION_ESCALATION_DENIED,
  DQ_LOCKS,
  MAX_COMPOSITIONS,
  type DqActor,
  type PermissionScope,
} from './universal-integration-brain-types';

export type CapabilityNode = {
  id: string;
  name: string;
  scopes: PermissionScope[];
  reusable: boolean;
  reason: string;
  createdAt: string;
};

export type CapabilityComposition = {
  id: string;
  capabilityIds: string[];
  requestedScopes: PermissionScope[];
  intersectionScopes: PermissionScope[];
  status: 'allowed' | 'denied';
  reason: string;
  createdAt: string;
};

type Store = {
  capabilities: CapabilityNode[];
  compositions: CapabilityComposition[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'capability-discovery-composition-brain.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { capabilities: [], compositions: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function capabilityDiscoveryCompositionBrainHonesty() {
  return {
    compositionEscalatesPermissions: DQ_LOCKS.COMPOSITION_ESCALATES_PERMISSIONS,
    compositionReuseFirst: DQ_LOCKS.COMPOSITION_REUSE_FIRST,
  };
}

export async function discoverCapability(input: {
  name: string;
  scopes: PermissionScope[];
  reusable?: boolean;
  root: string;
  actor: DqActor;
}): Promise<CapabilityNode> {
  const store = await load(input.root);
  void input.actor;
  const node: CapabilityNode = {
    id: id('dqcap'),
    name: input.name.trim(),
    scopes: input.scopes,
    reusable: input.reusable !== false,
    reason: 'CAPABILITY_DISCOVERED_REUSE_FIRST',
    createdAt: new Date().toISOString(),
  };
  store.capabilities.push(node);
  await save(input.root, store);
  return node;
}

export async function composeCapabilities(input: {
  capabilityIds: string[];
  requestedScopes: PermissionScope[];
  root: string;
  actor: DqActor;
}): Promise<CapabilityComposition> {
  const store = await load(input.root);
  void input.actor;
  if (store.compositions.length >= MAX_COMPOSITIONS) {
    throw new Error('MAX_COMPOSITIONS');
  }
  const nodes = store.capabilities.filter((c) => input.capabilityIds.includes(c.id));
  const intersection =
    nodes.length === 0
      ? []
      : nodes.reduce<PermissionScope[]>((acc, node, idx) => {
          if (idx === 0) return [...node.scopes];
          return acc.filter((s) => node.scopes.includes(s));
        }, []);
  const escalates = input.requestedScopes.some((s) => !intersection.includes(s));
  const composition: CapabilityComposition = {
    id: id('dqcomp'),
    capabilityIds: input.capabilityIds,
    requestedScopes: input.requestedScopes,
    intersectionScopes: intersection,
    status: escalates ? 'denied' : 'allowed',
    reason: escalates
      ? COMPOSITION_ESCALATION_DENIED
      : 'COMPOSITION_WITHIN_CONSTITUENT_PERMISSIONS',
    createdAt: new Date().toISOString(),
  };
  store.compositions.push(composition);
  await save(input.root, store);
  return composition;
}
