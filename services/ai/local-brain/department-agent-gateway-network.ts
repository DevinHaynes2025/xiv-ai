/**
 * 62L-DD Department Agent Gateway Network —
 * Governed department-agent gateways.
 * Cannot bypass sealed/auth scopes.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DD_LOCKS,
  GATEWAY_BYPASS_DENIED,
  HONESTY_BANNER,
  MAX_GATEWAYS,
  type DdActor,
} from './cognitive-service-mesh-types';

export type GatewayRegistration = {
  id: string;
  departmentId: string;
  name: string;
  sealedScopeEnforced: true;
  authScopeEnforced: true;
  authorizedScopes: string[];
  status: 'REGISTERED' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type GatewayInvokeAttempt = {
  id: string;
  gatewayId: string;
  requestedScope: string;
  bypassSealedAttempted: boolean;
  bypassAuthAttempted: boolean;
  status: 'ALLOWED' | 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  gateways: GatewayRegistration[];
  invokes: GatewayInvokeAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'department-agent-gateway-network.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { gateways: [], invokes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function departmentAgentGatewayHonesty() {
  return {
    banner: HONESTY_BANNER,
    gatewayBypassSealedAuth: DD_LOCKS.GATEWAY_BYPASS_SEALED_AUTH,
    founderSealedDenyByDefault: DD_LOCKS.FOUNDER_SEALED_DENY_BY_DEFAULT,
    learningGrantsPermission: DD_LOCKS.LEARNING_GRANTS_PERMISSION,
  };
}

export async function registerDepartmentGateway(input: {
  departmentId: string;
  name: string;
  authorizedScopes: string[];
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; gateway?: GatewayRegistration; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  if (store.gateways.length >= MAX_GATEWAYS) {
    return { accepted: false, reason: 'MAX_GATEWAYS_BOUNDED', at: now };
  }
  const gateway: GatewayRegistration = {
    id: id('dagw'),
    departmentId: input.departmentId.trim(),
    name: input.name.trim() || 'unnamed-gateway',
    sealedScopeEnforced: true,
    authScopeEnforced: true,
    authorizedScopes: (input.authorizedScopes ?? []).map((s) => s.trim()).filter(Boolean),
    status: 'REGISTERED',
    reason: 'DEPARTMENT_GATEWAY_REGISTERED_GOVERNED',
    createdAt: now,
  };
  store.gateways.push(gateway);
  await save(input.root, store);
  return { accepted: true, reason: gateway.reason, gateway, at: now };
}

export async function invokeDepartmentGateway(input: {
  gatewayId: string;
  requestedScope: string;
  bypassSealed?: boolean;
  bypassAuth?: boolean;
  root: string;
  actor: DdActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: GatewayInvokeAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const gateway = store.gateways.find((g) => g.id === input.gatewayId);
  const bypassSealed = input.bypassSealed === true;
  const bypassAuth = input.bypassAuth === true;
  const scope = (input.requestedScope ?? '').trim();

  if (!gateway) {
    const attempt: GatewayInvokeAttempt = {
      id: id('dagi'),
      gatewayId: input.gatewayId,
      requestedScope: scope,
      bypassSealedAttempted: bypassSealed,
      bypassAuthAttempted: bypassAuth,
      status: 'DENIED',
      reason: 'GATEWAY_NOT_FOUND',
      at: now,
    };
    store.invokes.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt, at: now };
  }

  if (bypassSealed || bypassAuth || DD_LOCKS.GATEWAY_BYPASS_SEALED_AUTH) {
    const attempt: GatewayInvokeAttempt = {
      id: id('dagi'),
      gatewayId: gateway.id,
      requestedScope: scope,
      bypassSealedAttempted: bypassSealed,
      bypassAuthAttempted: bypassAuth,
      status: 'DENIED',
      reason: GATEWAY_BYPASS_DENIED,
      at: now,
    };
    store.invokes.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt, at: now };
  }

  if (!gateway.authorizedScopes.includes(scope)) {
    const attempt: GatewayInvokeAttempt = {
      id: id('dagi'),
      gatewayId: gateway.id,
      requestedScope: scope,
      bypassSealedAttempted: false,
      bypassAuthAttempted: false,
      status: 'DENIED',
      reason: GATEWAY_BYPASS_DENIED,
      at: now,
    };
    store.invokes.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt, at: now };
  }

  const attempt: GatewayInvokeAttempt = {
    id: id('dagi'),
    gatewayId: gateway.id,
    requestedScope: scope,
    bypassSealedAttempted: false,
    bypassAuthAttempted: false,
    status: 'ALLOWED',
    reason: 'GATEWAY_INVOKE_WITHIN_AUTHORIZED_SCOPE',
    at: now,
  };
  store.invokes.push(attempt);
  await save(input.root, store);
  return { accepted: true, reason: attempt.reason, attempt, at: now };
}
