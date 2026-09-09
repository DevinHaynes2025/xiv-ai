/**
 * 62L-CG Global Archive Graph Federation —
 * Federated historical archive graph across authorized archives/Universes.
 * Authorized sources only; no raw private pooling by default.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CG_LOCKS,
  HONESTY_BANNER,
  RAW_PRIVATE_POOLING_DENIED,
  UNAUTHORIZED_ARCHIVE_FEDERATION_DENIED,
  type CgActor,
} from './deep-knowledge-refinery-os-types';

export type ArchiveNodeKind =
  | 'business_law'
  | 'civilization_memory'
  | 'universe_archive'
  | 'governance'
  | 'other';

export type FederatedArchiveNode = {
  id: string;
  label: string;
  kind: ArchiveNodeKind;
  universeId: string;
  authorized: boolean;
  consentKnown: boolean;
  licenseKnown: boolean;
  jurisdictionKnown: boolean;
  status: 'enrolled' | 'denied' | 'waiting_data';
  reason: string;
  rawPrivatePooling: false;
  productionAuthorized: false;
  enrolledAt: string;
};

export type FederationEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  status: 'linked' | 'denied';
  reason: string;
  at: string;
};

export type PoolingAttempt = {
  id: string;
  mode: 'raw_private' | 'derived_authorized';
  status: 'denied' | 'accepted_derived';
  reason: string;
  at: string;
};

type Store = {
  nodes: FederatedArchiveNode[];
  edges: FederationEdge[];
  pooling: PoolingAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'global-archive-graph-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { nodes: [], edges: [], pooling: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function archiveFederationHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CG_LOCKS.L4_AUTONOMY_ENABLED,
    rawPrivateArchivePooling: CG_LOCKS.RAW_PRIVATE_ARCHIVE_POOLING,
    unauthorizedArchiveFederation: CG_LOCKS.UNAUTHORIZED_ARCHIVE_FEDERATION,
    founderSealedDenyByDefault: CG_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    productionAuthorization: CG_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}

export async function enrollArchiveNode(input: {
  label: string;
  kind: ArchiveNodeKind;
  universeId: string;
  authorized: boolean;
  consentKnown?: boolean;
  licenseKnown?: boolean;
  jurisdictionKnown?: boolean;
  root: string;
  actor: CgActor;
}): Promise<FederatedArchiveNode> {
  const store = await load(input.root);
  const consentKnown = input.consentKnown === true;
  const licenseKnown = input.licenseKnown === true;
  const jurisdictionKnown = input.jurisdictionKnown === true;

  let status: FederatedArchiveNode['status'] = 'enrolled';
  let reason = 'AUTHORIZED_ARCHIVE_NODE_ENROLLED';

  if (!input.authorized) {
    status = 'denied';
    reason = UNAUTHORIZED_ARCHIVE_FEDERATION_DENIED;
  } else if (!consentKnown || !licenseKnown || !jurisdictionKnown) {
    status = 'waiting_data';
    reason = 'UNKNOWN_CONSENT_LICENSE_OR_JURISDICTION_WAITING_DATA';
  }

  const node: FederatedArchiveNode = {
    id: id('archnode'),
    label: input.label,
    kind: input.kind,
    universeId: input.universeId,
    authorized: input.authorized,
    consentKnown,
    licenseKnown,
    jurisdictionKnown,
    status,
    reason,
    rawPrivatePooling: false,
    productionAuthorized: false,
    enrolledAt: new Date().toISOString(),
  };
  store.nodes.push(node);
  await save(input.root, store);
  return node;
}

/**
 * Link two enrolled authorized nodes. Unauthorized or non-enrolled edges DENIED.
 */
export async function linkArchiveFederationEdge(input: {
  fromNodeId: string;
  toNodeId: string;
  root: string;
  actor: CgActor;
}): Promise<FederationEdge> {
  const store = await load(input.root);
  const from = store.nodes.find((n) => n.id === input.fromNodeId);
  const to = store.nodes.find((n) => n.id === input.toNodeId);

  let status: FederationEdge['status'] = 'linked';
  let reason = 'AUTHORIZED_FEDERATION_EDGE_LINKED';

  if (!from || !to) {
    status = 'denied';
    reason = UNAUTHORIZED_ARCHIVE_FEDERATION_DENIED;
  } else if (from.status !== 'enrolled' || to.status !== 'enrolled') {
    status = 'denied';
    reason = UNAUTHORIZED_ARCHIVE_FEDERATION_DENIED;
  } else if (!from.authorized || !to.authorized) {
    status = 'denied';
    reason = UNAUTHORIZED_ARCHIVE_FEDERATION_DENIED;
  }

  const edge: FederationEdge = {
    id: id('archedge'),
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    status,
    reason,
    at: new Date().toISOString(),
  };
  store.edges.push(edge);
  await save(input.root, store);
  return edge;
}

export async function attemptArchivePooling(input: {
  mode: 'raw_private' | 'derived_authorized';
  root: string;
  actor: CgActor;
}): Promise<PoolingAttempt> {
  const store = await load(input.root);
  const attempt: PoolingAttempt =
    input.mode === 'raw_private'
      ? {
          id: id('pool'),
          mode: 'raw_private',
          status: 'denied',
          reason: RAW_PRIVATE_POOLING_DENIED,
          at: new Date().toISOString(),
        }
      : {
          id: id('pool'),
          mode: 'derived_authorized',
          status: 'accepted_derived',
          reason: 'DERIVED_AUTHORIZED_SIGNAL_POOLING_ONLY',
          at: new Date().toISOString(),
        };
  store.pooling.push(attempt);
  await save(input.root, store);
  return attempt;
}
