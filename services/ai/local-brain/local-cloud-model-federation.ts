/**
 * 62L-DA Local/Cloud Model Federation —
 * Local-first federation; cloud members only when configured + verified.
 * Unconfigured providers/models → UNAVAILABLE.
 * Sealed/raw private cannot silently federate to cloud.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DA_LOCKS,
  HONESTY_BANNER,
  MAX_FEDERATION_MEMBERS,
  SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
  UNCONFIGURED_PROVIDER_UNAVAILABLE,
  type DaActor,
  type FederationMemberKind,
  type KnowledgeContentClass,
} from './superbrain-runtime-kernel-types';

export type FederationMember = {
  id: string;
  kind: FederationMemberKind;
  name: string;
  configured: boolean;
  verified: boolean;
  localPreferred: true;
  status: 'AVAILABLE' | 'UNAVAILABLE' | 'LOCAL_PREFERRED';
  reason: string;
  createdAt: string;
};

export type FederationRoute = {
  id: string;
  memberId: string | null;
  contentClass: KnowledgeContentClass;
  silentCloudFallback: boolean;
  status: 'FEDERATED' | 'UNAVAILABLE' | 'DENIED' | 'LOCAL_PREFERRED';
  reason: string;
  at: string;
};

type Store = { members: FederationMember[]; routes: FederationRoute[] };

function storePath(root: string) {
  return xivLocalPath(root, 'local-cloud-model-federation.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { members: [], routes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function localCloudModelFederationHonesty() {
  return {
    banner: HONESTY_BANNER,
    localFirst: DA_LOCKS.LOCAL_FIRST,
    unconfiguredCloudAvailable: DA_LOCKS.UNCONFIGURED_CLOUD_PROVIDER_AVAILABLE,
    unconfiguredModelAvailable: DA_LOCKS.UNCONFIGURED_MODEL_AVAILABLE,
    sealedSilentFederation: DA_LOCKS.SEALED_RAW_PRIVATE_SILENT_FEDERATION,
  };
}

export async function registerFederationMember(input: {
  kind: FederationMemberKind;
  name: string;
  configured?: boolean;
  verified?: boolean;
  root: string;
  actor: DaActor;
}): Promise<FederationMember> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.members.length >= MAX_FEDERATION_MEMBERS) {
    return {
      id: id('fmem'),
      kind: input.kind,
      name: input.name,
      configured: false,
      verified: false,
      localPreferred: true,
      status: 'UNAVAILABLE',
      reason: 'MAX_FEDERATION_MEMBERS_BOUNDED',
      createdAt: now,
    };
  }
  const configured = input.configured === true;
  const verified = input.verified === true;
  const isLocal = input.kind === 'local_model';
  const ok = isLocal ? configured : configured && verified;
  const member: FederationMember = {
    id: id('fmem'),
    kind: input.kind,
    name: input.name.trim() || input.kind,
    configured,
    verified: isLocal ? configured : verified,
    localPreferred: true,
    status: ok ? (isLocal ? 'LOCAL_PREFERRED' : 'AVAILABLE') : 'UNAVAILABLE',
    reason: ok
      ? isLocal
        ? 'LOCAL_MODEL_PREFERRED'
        : 'CLOUD_MEMBER_CONFIGURED_VERIFIED'
      : UNCONFIGURED_PROVIDER_UNAVAILABLE,
    createdAt: now,
  };
  store.members.push(member);
  await save(input.root, store);
  return member;
}

export async function routeFederationRequest(input: {
  memberId?: string | null;
  preferLocal?: boolean;
  contentClass?: KnowledgeContentClass;
  silentCloudFallback?: boolean;
  root: string;
  actor: DaActor;
}): Promise<FederationRoute> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const contentClass = input.contentClass ?? 'open';
  const silent = input.silentCloudFallback === true;

  if (silent && (contentClass === 'sealed' || contentClass === 'raw_private')) {
    const route: FederationRoute = {
      id: id('froute'),
      memberId: input.memberId ?? null,
      contentClass,
      silentCloudFallback: true,
      status: 'DENIED',
      reason: SEALED_RAW_PRIVATE_SILENT_ROUTE_DENIED,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  if (input.preferLocal !== false) {
    const local = store.members.find(
      (m) => m.kind === 'local_model' && m.status !== 'UNAVAILABLE',
    );
    if (local) {
      const route: FederationRoute = {
        id: id('froute'),
        memberId: local.id,
        contentClass,
        silentCloudFallback: false,
        status: 'LOCAL_PREFERRED',
        reason: 'LOCAL_FIRST_FEDERATION',
        at: now,
      };
      store.routes.push(route);
      await save(input.root, store);
      return route;
    }
  }

  const member = input.memberId
    ? store.members.find((m) => m.id === input.memberId)
    : store.members.find((m) => m.kind !== 'local_model' && m.status === 'AVAILABLE');

  if (!member || member.status === 'UNAVAILABLE' || !member.configured) {
    const route: FederationRoute = {
      id: id('froute'),
      memberId: member?.id ?? input.memberId ?? null,
      contentClass,
      silentCloudFallback: silent,
      status: 'UNAVAILABLE',
      reason: UNCONFIGURED_PROVIDER_UNAVAILABLE,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  const route: FederationRoute = {
    id: id('froute'),
    memberId: member.id,
    contentClass,
    silentCloudFallback: false,
    status: 'FEDERATED',
    reason: 'FEDERATION_ROUTE_ACCEPTED',
    at: now,
  };
  store.routes.push(route);
  await save(input.root, store);
  return route;
}
