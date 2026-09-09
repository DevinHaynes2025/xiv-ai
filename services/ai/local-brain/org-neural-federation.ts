import { createHash, randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AUTHORITY_NON_TRANSFER,
  BM_LOCKS,
  FOUNDER_SEALED_DENIED,
  SPARSE_BOUNDS,
  type BmActor,
} from './org-neural-federation-types';

export const ORG_NEURAL_FEDERATION_FILE = 'org-neural-federation.json';

export type FederationMember = {
  orgId: string;
  universeId: string;
  tenantId: string;
  /** Private org data stays local — never pooled by joining. */
  privateDataPooled: false;
  /** Joining federation never transfers authority. */
  authorityTransferred: false;
  joinedAt: string;
};

export type OrgNeuralFederation = {
  id: string;
  name: string;
  members: FederationMember[];
  isolatedPrivateBoundaries: true;
  authorityBoundariesPreserved: true;
  rawPrivateGlobalPool: false;
  founderSealedDenyByDefault: true;
  productionAuthorized: false;
  createdAt: string;
};

export type FederationAuthorityProbe = {
  id: string;
  at: string;
  federationId: string;
  fromOrgId: string;
  toOrgId: string;
  allowed: false;
  authorityTransferred: false;
  reason: typeof AUTHORITY_NON_TRANSFER;
};

export type FounderSealedFederationDeny = {
  id: string;
  at: string;
  federationId: string;
  actorId: string;
  surface: 'ordinary_org' | 'cloud' | 'peer' | 'telemetry' | 'federation_synapse';
  allowed: false;
  payloadWritten: false;
  reason: typeof FOUNDER_SEALED_DENIED;
};

type FederationStore = {
  federations: OrgNeuralFederation[];
  authorityProbes: FederationAuthorityProbe[];
  sealedDenies: FounderSealedFederationDeny[];
};

const MAX_FEDERATIONS = 256;
const MAX_PROBES = 10_000;

function storePath(root: string) {
  return xivLocalPath(root, ORG_NEURAL_FEDERATION_FILE);
}

async function load(root: string): Promise<FederationStore> {
  const parsed = await readJsonFile<FederationStore>(storePath(root), {
    federations: [],
    authorityProbes: [],
    sealedDenies: [],
  });
  return {
    federations: Array.isArray(parsed.federations) ? parsed.federations : [],
    authorityProbes: Array.isArray(parsed.authorityProbes) ? parsed.authorityProbes : [],
    sealedDenies: Array.isArray(parsed.sealedDenies) ? parsed.sealedDenies : [],
  };
}

async function save(root: string, store: FederationStore) {
  await writeJsonFileAtomic(storePath(root), {
    federations: store.federations.slice(-MAX_FEDERATIONS),
    authorityProbes: store.authorityProbes.slice(-MAX_PROBES),
    sealedDenies: store.sealedDenies.slice(-MAX_PROBES),
  });
}

function federationIdFor(name: string) {
  const digest = createHash('sha256').update(`org-neural-fed:${name}`).digest('hex').slice(0, 16);
  return `onf_${digest}`;
}

/**
 * Declare a governed Organization Neural Federation.
 * Members keep private data and authority boundaries; joining ≠ pooling.
 */
export async function declareOrgNeuralFederation(input: {
  name: string;
  actor: BmActor;
  root?: string;
  now?: number;
}) {
  if (!input.name.trim()) {
    return { accepted: false as const, reason: 'FEDERATION_NAME_REQUIRED' };
  }
  if (input.actor.kind === 'impersonator') {
    return { accepted: false as const, reason: 'IMPERSONATOR_CANNOT_DECLARE_FEDERATION' };
  }

  const root = input.root ?? process.cwd();
  const store = await load(root);
  const id = federationIdFor(input.name.trim());
  const existing = store.federations.find((item) => item.id === id);
  if (existing) {
    return { accepted: true as const, federation: existing, reason: 'FEDERATION_ALREADY_DECLARED' };
  }

  const federation: OrgNeuralFederation = {
    id,
    name: input.name.trim(),
    members: [],
    isolatedPrivateBoundaries: true,
    authorityBoundariesPreserved: true,
    rawPrivateGlobalPool: false,
    founderSealedDenyByDefault: true,
    productionAuthorized: false,
    createdAt: new Date(input.now ?? Date.now()).toISOString(),
  };
  store.federations.push(federation);
  await save(root, store);

  return {
    accepted: true as const,
    federation,
    reason: 'ORG_NEURAL_FEDERATION_DECLARED',
    locks: {
      RAW_PRIVATE_GLOBAL_POOL_DEFAULT: BM_LOCKS.RAW_PRIVATE_GLOBAL_POOL_DEFAULT,
      FEDERATION_TRANSFERS_ORG_AUTHORITY: BM_LOCKS.FEDERATION_TRANSFERS_ORG_AUTHORITY,
    },
  };
}

/**
 * Bind an isolated org Universe as a federation member.
 * Private data is never pooled; authority is never transferred.
 */
export async function bindFederationMember(input: {
  federationId: string;
  orgId: string;
  universeId: string;
  tenantId: string;
  actor: BmActor;
  root?: string;
  now?: number;
}) {
  if (input.actor.orgId !== input.orgId) {
    return { accepted: false as const, reason: 'CROSS_ORG_MEMBER_BIND_DENIED' };
  }

  const root = input.root ?? process.cwd();
  const store = await load(root);
  const federation = store.federations.find((item) => item.id === input.federationId);
  if (!federation) {
    return { accepted: false as const, reason: 'FEDERATION_NOT_FOUND' };
  }
  if (federation.members.length >= SPARSE_BOUNDS.maxFederationMembers) {
    return { accepted: false as const, reason: 'FEDERATION_MEMBER_BUDGET_REACHED' };
  }
  const existing = federation.members.find((m) => m.orgId === input.orgId);
  if (existing) {
    return { accepted: true as const, member: existing, federation, reason: 'MEMBER_ALREADY_BOUND' };
  }

  const member: FederationMember = {
    orgId: input.orgId,
    universeId: input.universeId,
    tenantId: input.tenantId,
    privateDataPooled: false,
    authorityTransferred: false,
    joinedAt: new Date(input.now ?? Date.now()).toISOString(),
  };
  federation.members.push(member);
  await save(root, store);

  return {
    accepted: true as const,
    member,
    federation,
    reason: 'FEDERATION_MEMBER_BOUND_PRIVATE_DATA_NOT_POOLED',
  };
}

export async function getFederation(input: { federationId: string; root?: string }) {
  const store = await load(input.root ?? process.cwd());
  return store.federations.find((item) => item.id === input.federationId) ?? null;
}

/**
 * Probe: federation synapse must never transfer cross-org authority.
 */
export async function probeFederationAuthorityTransfer(input: {
  federationId: string;
  fromOrgId: string;
  toOrgId: string;
  actor: BmActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const probe: FederationAuthorityProbe = {
    id: `authprobe_${randomUUID()}`,
    at: new Date().toISOString(),
    federationId: input.federationId,
    fromOrgId: input.fromOrgId,
    toOrgId: input.toOrgId,
    allowed: false,
    authorityTransferred: false,
    reason: AUTHORITY_NON_TRANSFER,
  };
  store.authorityProbes.push(probe);
  await save(root, store);

  return {
    allowed: false as const,
    authorityTransferred: false as const,
    reason: AUTHORITY_NON_TRANSFER,
    probe,
    locks: {
      FEDERATION_TRANSFERS_ORG_AUTHORITY: BM_LOCKS.FEDERATION_TRANSFERS_ORG_AUTHORITY,
      LEARNING_IS_AUTHORITY: BM_LOCKS.LEARNING_IS_AUTHORITY,
    },
  };
}

/**
 * Sealed founder route remains deny-by-default from org federation synapses.
 */
export async function denyFounderSealedFromFederation(input: {
  federationId: string;
  actor: BmActor;
  surface?: FounderSealedFederationDeny['surface'];
  payload?: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const deny: FounderSealedFederationDeny = {
    id: `sealdeny_${randomUUID()}`,
    at: new Date().toISOString(),
    federationId: input.federationId,
    actorId: input.actor.id,
    surface: input.surface ?? 'federation_synapse',
    allowed: false,
    payloadWritten: false,
    reason: FOUNDER_SEALED_DENIED,
  };
  store.sealedDenies.push(deny);
  await save(root, store);

  return {
    allowed: false as const,
    payloadWritten: false as const,
    reason: FOUNDER_SEALED_DENIED,
    deny,
    payloadEcho: null,
    locks: { FOUNDER_SEALED_DENY_BY_DEFAULT: BM_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT },
  };
}

export function orgNeuralFederationHonesty() {
  return {
    banner: 'DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED',
    locks: BM_LOCKS,
    sparseBounds: SPARSE_BOUNDS,
    rawPrivateGlobalPool: false as const,
    authorityTransfer: false as const,
    productionAuthorization: false as const,
  };
}
