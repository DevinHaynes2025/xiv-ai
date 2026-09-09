/**
 * 62L-CJ Local/Cloud Model Federation — local-first.
 * Sealed never silent cloud fallback; unconfigured → UNAVAILABLE.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CJ_LOCKS,
  HONESTY_BANNER,
  SEALED_FEDERATION_CLOUD_DENIED,
  UNCONFIGURED_FEDERATION_UNAVAILABLE,
  type CjActor,
} from './intelligence-resource-grid-apprenticeship-types';

export type FederationMemberKind = 'local' | 'cloud' | 'edge';

export type FederationMember = {
  id: string;
  name: string;
  kind: FederationMemberKind;
  configured: boolean;
  authorized: boolean;
  verified: boolean;
  status: 'available' | 'unavailable' | 'denied';
  reason: string;
  createdAt: string;
};

export type FederationRoute = {
  id: string;
  memberId: string | null;
  contentClass: 'open' | 'local_only' | 'sealed';
  accepted: boolean;
  reason: string;
  silentCloudFallback: false;
  localPreferred: boolean;
  at: string;
};

type Store = {
  members: FederationMember[];
  routes: FederationRoute[];
};

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

export function modelFederationHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: CJ_LOCKS.L4_AUTONOMY_ENABLED,
    localFirstFederation: CJ_LOCKS.LOCAL_FIRST_FEDERATION,
    sealedSilentCloudFallback: CJ_LOCKS.SEALED_SILENT_CLOUD_FALLBACK,
    unconfiguredProviderAvailable: CJ_LOCKS.UNCONFIGURED_PROVIDER_AVAILABLE,
  };
}

export async function registerFederationMember(input: {
  name: string;
  kind: FederationMemberKind;
  configured: boolean;
  authorized: boolean;
  verified?: boolean;
  root: string;
}): Promise<FederationMember> {
  const store = await load(input.root);
  const ok =
    input.configured === true &&
    input.authorized === true &&
    input.verified === true;
  const now = new Date().toISOString();
  const member: FederationMember = {
    id: id('fed'),
    name: input.name,
    kind: input.kind,
    configured: input.configured === true,
    authorized: input.authorized === true,
    verified: input.verified === true,
    status: ok ? 'available' : 'unavailable',
    reason: ok
      ? 'FEDERATION_MEMBER_AVAILABLE'
      : UNCONFIGURED_FEDERATION_UNAVAILABLE,
    createdAt: now,
  };
  store.members.push(member);
  await save(input.root, store);
  return member;
}

export async function routeFederationRequest(input: {
  memberId?: string;
  contentClass: 'open' | 'local_only' | 'sealed';
  preferLocal?: boolean;
  /** Probe: attempt silent cloud fallback when sealed/local-only. */
  attemptSilentCloudFallback?: boolean;
  root: string;
  actor: CjActor;
}): Promise<FederationRoute> {
  const store = await load(input.root);
  const preferLocal = input.preferLocal !== false;
  let member =
    (input.memberId
      ? store.members.find((m) => m.id === input.memberId)
      : undefined) ?? null;

  if (!member && preferLocal) {
    member =
      store.members.find((m) => m.kind === 'local' && m.status === 'available') ??
      null;
  }

  const route: FederationRoute = {
    id: id('froute'),
    memberId: member?.id ?? null,
    contentClass: input.contentClass,
    accepted: false,
    reason: UNCONFIGURED_FEDERATION_UNAVAILABLE,
    silentCloudFallback: false,
    localPreferred: preferLocal,
    at: new Date().toISOString(),
  };

  const sealedOrLocal =
    input.contentClass === 'sealed' || input.contentClass === 'local_only';

  // Sealed/local-only must never silent-route to cloud — even if probe requests it.
  if (sealedOrLocal && (member?.kind === 'cloud' || input.attemptSilentCloudFallback)) {
    if (input.attemptSilentCloudFallback && (!member || member.kind !== 'local')) {
      const cloud =
        store.members.find((m) => m.kind === 'cloud' && m.status === 'available') ??
        null;
      route.memberId = cloud?.id ?? member?.id ?? null;
    }
    route.accepted = false;
    route.reason = SEALED_FEDERATION_CLOUD_DENIED;
    route.silentCloudFallback = false;
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  if (!member) {
    route.accepted = false;
    route.reason = UNCONFIGURED_FEDERATION_UNAVAILABLE;
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  if (member.status !== 'available') {
    route.accepted = false;
    route.reason = UNCONFIGURED_FEDERATION_UNAVAILABLE;
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  // Local-first: if preferLocal and a local is available, prefer it over cloud.
  if (preferLocal && member.kind === 'cloud') {
    const local =
      store.members.find((m) => m.kind === 'local' && m.status === 'available') ??
      null;
    if (local) {
      route.memberId = local.id;
      route.accepted = true;
      route.reason = 'LOCAL_FIRST_FEDERATION_ROUTE';
      store.routes.push(route);
      await save(input.root, store);
      return route;
    }
  }

  route.accepted = true;
  route.reason = 'FEDERATION_ROUTE_ACCEPTED';
  store.routes.push(route);
  await save(input.root, store);
  return route;
}
