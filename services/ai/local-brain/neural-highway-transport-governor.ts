/**
 * 62L-DL Neural Highway Transport Governor —
 * Governed transport of knowledge/tasks/events/handoffs/storage/community/
 * supply-chain intelligence with explicit route policies, congestion control,
 * recovery, revocation, and audit. Wormholes ≠ auth/sealed bypass.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CONGESTION_CONTROL_ENGAGED,
  DL_LOCKS,
  HONESTY_BANNER,
  MAX_ACTIVE_TRANSPORTS,
  MAX_ROUTE_POLICIES,
  MAX_TRANSPORT_AUDIT_EVENTS,
  REVOKED_ROUTE_REJECTED,
  ROUTE_WITHOUT_POLICY_DENIED,
  SEALED_SILENT_ROUTE_DENIED,
  UNSIGNED_UNAUDITED_REJECTED,
  WORMHOLE_ZERO_TRUST_BYPASS_DENIED,
  type DlActor,
  type TransportCargoKind,
} from './neural-transportation-os-types';

export type NeuralHighwayTransportGovernor = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  congestionBound: typeof MAX_ACTIVE_TRANSPORTS;
  createdAt: string;
};

export type RoutePolicy = {
  id: string;
  governorId: string;
  routeId: string;
  allowlist: string[];
  requireSignature: boolean;
  requireAudit: boolean;
  revoked: boolean;
  createdAt: string;
  revokedAt: string | null;
};

export type TransportAttempt = {
  id: string;
  governorId: string;
  routeId: string;
  cargoKind: TransportCargoKind;
  from: string;
  to: string;
  signed: boolean;
  audited: boolean;
  sealedOrRawPrivate: boolean;
  silentRouteAttempted: boolean;
  wormholeBypassGatewayAttempted: boolean;
  active: boolean;
  status: 'ALLOWED' | 'DENIED' | 'BOUNDED' | 'REVOKED' | 'REJECTED';
  reason: string;
  createdAt: string;
};

export type TransportAuditEvent = {
  id: string;
  governorId: string;
  transportId: string | null;
  event: string;
  at: string;
};

type Store = {
  governors: NeuralHighwayTransportGovernor[];
  policies: RoutePolicy[];
  transports: TransportAttempt[];
  audits: TransportAuditEvent[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'neural-highway-transport-governor.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    governors: [],
    policies: [],
    transports: [],
    audits: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function audit(
  store: Store,
  governorId: string,
  transportId: string | null,
  event: string,
) {
  if (store.audits.length >= MAX_TRANSPORT_AUDIT_EVENTS) return;
  store.audits.push({
    id: id('dlaud'),
    governorId,
    transportId,
    event,
    at: new Date().toISOString(),
  });
}

export function neuralHighwayTransportGovernorHonesty() {
  return {
    banner: HONESTY_BANNER,
    routeWithoutPolicyAllowlist: DL_LOCKS.ROUTE_WITHOUT_POLICY_ALLOWLIST,
    routeRequiresExplicitPolicy: DL_LOCKS.ROUTE_REQUIRES_EXPLICIT_POLICY,
    unboundedTransportSpawn: DL_LOCKS.UNBOUNDED_TRANSPORT_SPAWN,
    congestionControlRequired: DL_LOCKS.CONGESTION_CONTROL_REQUIRED,
    revokedRouteAccepted: DL_LOCKS.REVOKED_ROUTE_ACCEPTED,
    unsignedUnauditedWhereRequired: DL_LOCKS.UNSIGNED_UNAUDITED_TRANSPORT_WHERE_REQUIRED,
    sealedRawPrivateSilentRoute: DL_LOCKS.SEALED_RAW_PRIVATE_SILENT_ROUTE,
    wormholeBypassZeroTrustGateway: DL_LOCKS.WORMHOLE_BYPASS_ZERO_TRUST_GATEWAY,
    maxActiveTransports: MAX_ACTIVE_TRANSPORTS,
  };
}

export async function bootstrapNeuralHighwayTransportGovernor(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DlActor;
}): Promise<NeuralHighwayTransportGovernor> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.governors.find(
    (g) =>
      g.orgId === input.orgId &&
      g.tenantId === input.tenantId &&
      g.universeId === input.universeId,
  );
  if (existing) return existing;
  const governor: NeuralHighwayTransportGovernor = {
    id: id('dlgov'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    congestionBound: MAX_ACTIVE_TRANSPORTS,
    createdAt: new Date().toISOString(),
  };
  store.governors.push(governor);
  await save(input.root, store);
  return governor;
}

export async function registerRoutePolicy(input: {
  governorId: string;
  routeId: string;
  allowlist: string[];
  requireSignature?: boolean;
  requireAudit?: boolean;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; policy?: RoutePolicy; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const governor = store.governors.find((g) => g.id === input.governorId);
  if (!governor) return { accepted: false, reason: 'GOVERNOR_NOT_FOUND', at: now };

  if (store.policies.length >= MAX_ROUTE_POLICIES) {
    return { accepted: false, reason: 'MAX_ROUTE_POLICIES_REACHED', at: now };
  }

  const allowlist = (input.allowlist ?? []).map((x) => x.trim()).filter(Boolean);
  if (allowlist.length === 0) {
    return { accepted: false, reason: ROUTE_WITHOUT_POLICY_DENIED, at: now };
  }

  const policy: RoutePolicy = {
    id: id('dlpol'),
    governorId: input.governorId,
    routeId: input.routeId.trim(),
    allowlist,
    requireSignature: input.requireSignature !== false,
    requireAudit: input.requireAudit !== false,
    revoked: false,
    createdAt: now,
    revokedAt: null,
  };
  store.policies.push(policy);
  await audit(store, input.governorId, null, `POLICY_REGISTERED:${policy.routeId}`);
  await save(input.root, store);
  return { accepted: true, reason: 'ROUTE_POLICY_REGISTERED', policy, at: now };
}

export async function revokeRoutePolicy(input: {
  policyId: string;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; policy?: RoutePolicy; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const policy = store.policies.find((p) => p.id === input.policyId);
  if (!policy) return { accepted: false, reason: 'POLICY_NOT_FOUND', at: now };
  policy.revoked = true;
  policy.revokedAt = now;
  await audit(store, policy.governorId, null, `POLICY_REVOKED:${policy.routeId}`);
  await save(input.root, store);
  return { accepted: true, reason: 'ROUTE_POLICY_REVOKED', policy, at: now };
}

export async function transportOnHighway(input: {
  governorId: string;
  routeId: string;
  cargoKind: TransportCargoKind;
  from: string;
  to: string;
  actorId?: string;
  signed?: boolean;
  audited?: boolean;
  sealedOrRawPrivate?: boolean;
  silentRoute?: boolean;
  wormholeBypassGateway?: boolean;
  zeroTrustGatewayCleared?: boolean;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; transport?: TransportAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const governor = store.governors.find((g) => g.id === input.governorId);
  if (!governor) return { accepted: false, reason: 'GOVERNOR_NOT_FOUND', at: now };

  const pushDenied = async (reason: string, status: TransportAttempt['status'] = 'DENIED') => {
    const transport: TransportAttempt = {
      id: id('dlxprt'),
      governorId: input.governorId,
      routeId: input.routeId,
      cargoKind: input.cargoKind,
      from: input.from,
      to: input.to,
      signed: input.signed === true,
      audited: input.audited === true,
      sealedOrRawPrivate: input.sealedOrRawPrivate === true,
      silentRouteAttempted: input.silentRoute === true,
      wormholeBypassGatewayAttempted: input.wormholeBypassGateway === true,
      active: false,
      status,
      reason,
      createdAt: now,
    };
    store.transports.push(transport);
    await audit(store, input.governorId, transport.id, reason);
    await save(input.root, store);
    return { accepted: false, reason, transport, at: now };
  };

  if (input.wormholeBypassGateway === true) {
    return pushDenied(WORMHOLE_ZERO_TRUST_BYPASS_DENIED, 'REJECTED');
  }

  if (
    input.sealedOrRawPrivate === true &&
    (input.silentRoute === true || input.signed !== true || input.audited !== true)
  ) {
    return pushDenied(SEALED_SILENT_ROUTE_DENIED, 'DENIED');
  }

  const policy = store.policies.find(
    (p) => p.governorId === input.governorId && p.routeId === input.routeId,
  );
  if (!policy || policy.allowlist.length === 0) {
    return pushDenied(ROUTE_WITHOUT_POLICY_DENIED, 'DENIED');
  }
  if (policy.revoked) {
    return pushDenied(REVOKED_ROUTE_REJECTED, 'REVOKED');
  }

  const actorKey = (input.actorId ?? input.actor.id).trim();
  if (!policy.allowlist.includes(actorKey) && !policy.allowlist.includes('*')) {
    return pushDenied(ROUTE_WITHOUT_POLICY_DENIED, 'DENIED');
  }

  if (policy.requireSignature && input.signed !== true) {
    return pushDenied(UNSIGNED_UNAUDITED_REJECTED, 'REJECTED');
  }
  if (policy.requireAudit && input.audited !== true) {
    return pushDenied(UNSIGNED_UNAUDITED_REJECTED, 'REJECTED');
  }

  const activeCount = store.transports.filter(
    (t) => t.governorId === input.governorId && t.active,
  ).length;
  if (activeCount >= MAX_ACTIVE_TRANSPORTS) {
    return pushDenied(CONGESTION_CONTROL_ENGAGED, 'BOUNDED');
  }

  const transport: TransportAttempt = {
    id: id('dlxprt'),
    governorId: input.governorId,
    routeId: input.routeId,
    cargoKind: input.cargoKind,
    from: input.from,
    to: input.to,
    signed: input.signed === true,
    audited: input.audited === true,
    sealedOrRawPrivate: input.sealedOrRawPrivate === true,
    silentRouteAttempted: false,
    wormholeBypassGatewayAttempted: false,
    active: true,
    status: 'ALLOWED',
    reason: 'GOVERNED_TRANSPORT_ALLOWED_WITH_POLICY_AUDIT',
    createdAt: now,
  };
  store.transports.push(transport);
  await audit(store, input.governorId, transport.id, transport.reason);
  await save(input.root, store);
  return { accepted: true, reason: transport.reason, transport, at: now };
}

/** Fill active slots to exercise congestion control under pressure. */
export async function saturateActiveTransportsForCongestionTest(input: {
  governorId: string;
  routeId: string;
  count: number;
  root: string;
  actor: DlActor;
}): Promise<number> {
  let accepted = 0;
  for (let i = 0; i < input.count; i += 1) {
    const result = await transportOnHighway({
      governorId: input.governorId,
      routeId: input.routeId,
      cargoKind: 'task',
      from: `src-${i}`,
      to: `dst-${i}`,
      actorId: input.actor.id,
      signed: true,
      audited: true,
      root: input.root,
      actor: input.actor,
    });
    if (result.accepted) accepted += 1;
  }
  return accepted;
}

export async function recoverTransport(input: {
  transportId: string;
  root: string;
  actor: DlActor;
}): Promise<{ accepted: boolean; reason: string; transport?: TransportAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const transport = store.transports.find((t) => t.id === input.transportId);
  if (!transport) return { accepted: false, reason: 'TRANSPORT_NOT_FOUND', at: now };
  transport.active = false;
  transport.status = transport.status === 'ALLOWED' ? 'ALLOWED' : transport.status;
  transport.reason = 'TRANSPORT_RECOVERED_AND_RELEASED_SLOT';
  await audit(store, transport.governorId, transport.id, transport.reason);
  await save(input.root, store);
  return { accepted: true, reason: transport.reason, transport, at: now };
}
