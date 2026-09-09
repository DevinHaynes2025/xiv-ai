/**
 * 62L-DV Module A — Universal Data & Industry Cortex foundation.
 * Deny-by-default; label alone ≠ access; unconfigured providers UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CORTEX_DENIED,
  LABEL_NEQ_CORTEX_ACCESS,
  MAX_CORTEX_NODES,
  UNCONFIGURED_CORTEX_PROVIDER,
  type DvActor,
} from './universal-data-industry-cortex-types';

export type CortexNode = {
  id: string;
  name: string;
  domain: 'data' | 'industry' | 'hybrid';
  sealed: boolean;
  grantsAccess: false;
  createdAt: string;
};

export type CortexAccess = {
  id: string;
  nodeId: string;
  labelPresent: boolean;
  explicitGrant: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

export type CortexProviderProbe = {
  providerId: string;
  configured: boolean;
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  status: 'ok' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  nodes: CortexNode[];
  access: CortexAccess[];
  providerProbes: CortexProviderProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-data-industry-cortex-foundation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    nodes: [],
    access: [],
    providerProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function cortexFoundationHonesty() {
  return {
    denyByDefault: true,
    labelAloneEqAccess: false,
    unconfiguredProviderInventedAvailable: false,
    l4AutonomyEnabled: false,
  };
}

export async function registerCortexNode(input: {
  name: string;
  domain: CortexNode['domain'];
  sealed?: boolean;
  root: string;
  actor: DvActor;
}): Promise<CortexNode> {
  const store = await load(input.root);
  void input.actor;
  if (store.nodes.length >= MAX_CORTEX_NODES) {
    throw new Error('MAX_CORTEX_NODES_REACHED');
  }
  const node: CortexNode = {
    id: id('dvcortex'),
    name: input.name.trim(),
    domain: input.domain,
    sealed: input.sealed !== false,
    grantsAccess: false,
    createdAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

export async function accessCortexNode(input: {
  nodeId: string;
  labelPresent: boolean;
  explicitGrant: boolean;
  root: string;
  actor: DvActor;
}): Promise<CortexAccess> {
  const store = await load(input.root);
  void input.actor;
  let status: 'allowed' | 'denied';
  let reason: string;
  if (input.explicitGrant) {
    status = 'allowed';
    reason = 'CORTEX_EXPLICIT_GRANT';
  } else if (input.labelPresent) {
    status = 'denied';
    reason = LABEL_NEQ_CORTEX_ACCESS;
  } else {
    status = 'denied';
    reason = CORTEX_DENIED;
  }
  const access: CortexAccess = {
    id: id('dvacc'),
    nodeId: input.nodeId,
    labelPresent: input.labelPresent,
    explicitGrant: input.explicitGrant,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.access.push(access);
  await save(input.root, store);
  return access;
}

export async function probeCortexProvider(input: {
  providerId: string;
  configured: boolean;
  claimAvailable?: boolean;
  root: string;
  actor: DvActor;
}): Promise<CortexProviderProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: CortexProviderProbe = input.configured
    ? {
        providerId: input.providerId,
        configured: true,
        availability: 'AVAILABLE',
        status: 'ok',
        reason: 'CORTEX_PROVIDER_CONFIGURED_NOT_PRODUCTION_AUTHORIZED',
        at: new Date().toISOString(),
      }
    : {
        providerId: input.providerId,
        configured: false,
        availability: 'UNAVAILABLE',
        status: 'denied',
        reason: UNCONFIGURED_CORTEX_PROVIDER,
        at: new Date().toISOString(),
      };
  if (!input.configured && input.claimAvailable) {
    probe.status = 'denied';
    probe.availability = 'UNAVAILABLE';
    probe.reason = UNCONFIGURED_CORTEX_PROVIDER;
  }
  store.providerProbes.push(probe);
  await save(input.root, store);
  return probe;
}
