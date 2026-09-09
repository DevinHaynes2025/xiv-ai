/**
 * 62L-DL Zero-Trust Privacy Universe Gateway —
 * Deny-by-default Privacy Universe gateways.
 * Wormhole/fast path cannot bypass gateway. Moderated anonymity if present.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DL_LOCKS,
  HONESTY_BANNER,
  MAX_PRIVACY_GATEWAYS,
  WORMHOLE_ZERO_TRUST_BYPASS_DENIED,
  type DlActor,
} from './neural-transportation-os-types';

export type ZeroTrustPrivacyUniverseGateway = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  denyByDefault: true;
  createdAt: string;
};

export type PrivacyGatewayChannel = {
  id: string;
  gatewayId: string;
  name: string;
  anonymous: boolean;
  moderationEnabled: boolean;
  revocationEnabled: boolean;
  status: 'ENABLED' | 'REJECTED' | 'REVOKED';
  reason: string;
  createdAt: string;
};

export type GatewayTransitAttempt = {
  id: string;
  gatewayId: string;
  wormholeBypassAttempted: boolean;
  sealedScope: boolean;
  authorized: boolean;
  status: 'CLEARED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  gateways: ZeroTrustPrivacyUniverseGateway[];
  channels: PrivacyGatewayChannel[];
  transits: GatewayTransitAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'zero-trust-privacy-universe-gateway.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    gateways: [],
    channels: [],
    transits: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function zeroTrustPrivacyUniverseGatewayHonesty() {
  return {
    banner: HONESTY_BANNER,
    privacyGatewayDenyByDefault: DL_LOCKS.PRIVACY_GATEWAY_DENY_BY_DEFAULT,
    anonymousWithoutModeration: DL_LOCKS.ANONYMOUS_WITHOUT_MODERATION,
    wormholeBypassZeroTrustGateway: DL_LOCKS.WORMHOLE_BYPASS_ZERO_TRUST_GATEWAY,
  };
}

export async function bootstrapZeroTrustPrivacyUniverseGateway(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DlActor;
}): Promise<ZeroTrustPrivacyUniverseGateway> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.gateways.find(
    (g) =>
      g.orgId === input.orgId &&
      g.tenantId === input.tenantId &&
      g.universeId === input.universeId,
  );
  if (existing) return existing;
  if (store.gateways.length >= MAX_PRIVACY_GATEWAYS) {
    throw new Error('MAX_PRIVACY_GATEWAYS_REACHED');
  }
  const gateway: ZeroTrustPrivacyUniverseGateway = {
    id: id('dlzt'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    denyByDefault: true,
    createdAt: new Date().toISOString(),
  };
  store.gateways.push(gateway);
  await save(input.root, store);
  return gateway;
}

export async function enableModeratedAnonymousChannel(input: {
  gatewayId: string;
  name: string;
  moderationEnabled: boolean;
  revocationEnabled: boolean;
  root: string;
  actor: DlActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  channel?: PrivacyGatewayChannel;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const gateway = store.gateways.find((g) => g.id === input.gatewayId);
  if (!gateway) return { accepted: false, reason: 'GATEWAY_NOT_FOUND', at: now };

  if (!input.moderationEnabled || !input.revocationEnabled) {
    const channel: PrivacyGatewayChannel = {
      id: id('dlch'),
      gatewayId: input.gatewayId,
      name: input.name.trim() || 'anon',
      anonymous: true,
      moderationEnabled: input.moderationEnabled === true,
      revocationEnabled: input.revocationEnabled === true,
      status: 'REJECTED',
      reason: 'ANONYMOUS_CHANNEL_WITHOUT_MODERATION_OR_REVOCATION_REJECTED',
      createdAt: now,
    };
    store.channels.push(channel);
    await save(input.root, store);
    return { accepted: false, reason: channel.reason, channel, at: now };
  }

  const channel: PrivacyGatewayChannel = {
    id: id('dlch'),
    gatewayId: input.gatewayId,
    name: input.name.trim() || 'anon',
    anonymous: true,
    moderationEnabled: true,
    revocationEnabled: true,
    status: 'ENABLED',
    reason: 'MODERATED_REVOKABLE_ANONYMOUS_CHANNEL_ENABLED',
    createdAt: now,
  };
  store.channels.push(channel);
  await save(input.root, store);
  return { accepted: true, reason: channel.reason, channel, at: now };
}

export async function clearZeroTrustGatewayTransit(input: {
  gatewayId: string;
  authorized: boolean;
  sealedScope?: boolean;
  wormholeBypassAttempted?: boolean;
  root: string;
  actor: DlActor;
}): Promise<{
  cleared: boolean;
  reason: string;
  transit?: GatewayTransitAttempt;
  at: string;
}> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const gateway = store.gateways.find((g) => g.id === input.gatewayId);
  if (!gateway) return { cleared: false, reason: 'GATEWAY_NOT_FOUND', at: now };

  if (input.wormholeBypassAttempted === true || input.authorized !== true) {
    const transit: GatewayTransitAttempt = {
      id: id('dltr'),
      gatewayId: input.gatewayId,
      wormholeBypassAttempted: input.wormholeBypassAttempted === true,
      sealedScope: input.sealedScope === true,
      authorized: input.authorized === true,
      status: 'DENIED',
      reason: WORMHOLE_ZERO_TRUST_BYPASS_DENIED,
      at: now,
    };
    store.transits.push(transit);
    await save(input.root, store);
    return { cleared: false, reason: WORMHOLE_ZERO_TRUST_BYPASS_DENIED, transit, at: now };
  }

  const transit: GatewayTransitAttempt = {
    id: id('dltr'),
    gatewayId: input.gatewayId,
    wormholeBypassAttempted: false,
    sealedScope: input.sealedScope === true,
    authorized: true,
    status: 'CLEARED',
    reason: 'ZERO_TRUST_GATEWAY_CLEARED_AUTHORIZED_PATH',
    at: now,
  };
  store.transits.push(transit);
  await save(input.root, store);
  return { cleared: true, reason: transit.reason, transit, at: now };
}
