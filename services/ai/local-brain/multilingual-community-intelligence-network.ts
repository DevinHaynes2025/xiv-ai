/**
 * 62L-DG Multilingual Community Intelligence Network —
 * Multilingual community/expert discovery; opt-in sharing only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  COMMUNITY_SHARE_OPT_IN_DENIED,
  DG_LOCKS,
  HONESTY_BANNER,
  MAX_COMMUNITY_SHARES,
  type DgActor,
} from './universal-personal-business-ai-os-types';

export type CommunityIntelligenceNetwork = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type ExpertDiscovery = {
  id: string;
  networkId: string;
  locale: string;
  query: string;
  status: 'BOUNDED' | 'DENIED';
  reason: string;
  at: string;
};

export type CommunityShareAttempt = {
  id: string;
  networkId: string;
  payloadRef: string;
  optIn: boolean;
  status: 'SHARED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  networks: CommunityIntelligenceNetwork[];
  discoveries: ExpertDiscovery[];
  shares: CommunityShareAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multilingual-community-intelligence-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    networks: [],
    discoveries: [],
    shares: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function multilingualCommunityIntelligenceHonesty() {
  return {
    banner: HONESTY_BANNER,
    communityShareWithoutOptIn: DG_LOCKS.COMMUNITY_SHARE_WITHOUT_OPT_IN,
    communitySharingOptInOnly: DG_LOCKS.COMMUNITY_SHARING_OPT_IN_ONLY,
  };
}

export async function bootstrapMultilingualCommunityIntelligenceNetwork(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DgActor;
}): Promise<CommunityIntelligenceNetwork> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.networks.find(
    (n) =>
      n.orgId === input.orgId &&
      n.tenantId === input.tenantId &&
      n.universeId === input.universeId,
  );
  if (existing) return existing;
  const network: CommunityIntelligenceNetwork = {
    id: id('dgcin'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    createdAt: new Date().toISOString(),
  };
  store.networks.push(network);
  await save(input.root, store);
  return network;
}

export async function discoverCommunityExpert(input: {
  networkId: string;
  locale: string;
  query: string;
  root: string;
  actor: DgActor;
}): Promise<ExpertDiscovery> {
  void input.actor;
  const store = await load(input.root);
  const discovery: ExpertDiscovery = {
    id: id('dgdisc'),
    networkId: input.networkId,
    locale: input.locale,
    query: input.query,
    status: input.query.trim() ? 'BOUNDED' : 'DENIED',
    reason: input.query.trim()
      ? 'MULTILINGUAL_EXPERT_DISCOVERY_BOUNDED'
      : 'EMPTY_DISCOVERY_QUERY_DENIED',
    at: new Date().toISOString(),
  };
  store.discoveries.push(discovery);
  await save(input.root, store);
  return discovery;
}

export async function attemptCommunityShare(input: {
  networkId: string;
  payloadRef: string;
  optIn: boolean;
  root: string;
  actor: DgActor;
}): Promise<{ accepted: boolean; reason: string; share: CommunityShareAttempt }> {
  void input.actor;
  const store = await load(input.root);
  if (store.shares.filter((s) => s.networkId === input.networkId).length >= MAX_COMMUNITY_SHARES) {
    const capped: CommunityShareAttempt = {
      id: id('dgshare'),
      networkId: input.networkId,
      payloadRef: input.payloadRef,
      optIn: input.optIn,
      status: 'DENIED',
      reason: 'MAX_COMMUNITY_SHARES',
      at: new Date().toISOString(),
    };
    store.shares.push(capped);
    await save(input.root, store);
    return { accepted: false, reason: capped.reason, share: capped };
  }

  const ok = input.optIn === true;
  const share: CommunityShareAttempt = {
    id: id('dgshare'),
    networkId: input.networkId,
    payloadRef: input.payloadRef,
    optIn: input.optIn,
    status: ok ? 'SHARED' : 'DENIED',
    reason: ok ? 'COMMUNITY_SHARE_OPT_IN_ACCEPTED' : COMMUNITY_SHARE_OPT_IN_DENIED,
    at: new Date().toISOString(),
  };
  store.shares.push(share);
  await save(input.root, store);
  return { accepted: ok, reason: share.reason, share };
}
