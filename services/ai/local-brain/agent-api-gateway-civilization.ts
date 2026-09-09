/**
 * 62L-DQ Agent API Gateway Civilization —
 * Per-call authorization API gateway for agents/plugins.
 * API call without per-call auth → DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  API_CALL_WITHOUT_AUTH_DENIED,
  DQ_LOCKS,
  MAX_API_CALLS,
  UNTRUSTED_INSTALLED_ONLY_DENIED,
  type DqActor,
  type PermissionScope,
} from './universal-integration-brain-types';

export type ApiGatewayCall = {
  id: string;
  callerId: string;
  pluginId: string;
  scope: PermissionScope;
  perCallAuthToken: string | null;
  pluginInstalled: boolean;
  pluginTrusted: boolean;
  pluginVerified: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  calls: ApiGatewayCall[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-api-gateway-civilization.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { calls: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentApiGatewayCivilizationHonesty() {
  return {
    perCallAuthorizationRequired: DQ_LOCKS.PER_CALL_AUTHORIZATION_REQUIRED,
    apiCallWithoutPerCallAuth: DQ_LOCKS.API_CALL_WITHOUT_PER_CALL_AUTH,
    installedOnlyMayInvoke: DQ_LOCKS.INSTALLED_ONLY_PLUGIN_MAY_INVOKE,
    installedEqTrusted: DQ_LOCKS.INSTALLED_EQ_TRUSTED,
  };
}

export async function authorizeApiCall(input: {
  callerId: string;
  pluginId: string;
  scope: PermissionScope;
  perCallAuthToken?: string | null;
  pluginInstalled?: boolean;
  pluginTrusted?: boolean;
  pluginVerified?: boolean;
  root: string;
  actor: DqActor;
}): Promise<ApiGatewayCall> {
  const store = await load(input.root);
  void input.actor;
  if (store.calls.length >= MAX_API_CALLS) {
    throw new Error('MAX_API_CALLS');
  }
  const token = (input.perCallAuthToken ?? '').trim();
  const installed = input.pluginInstalled === true;
  const trusted = input.pluginTrusted === true;
  const verified = input.pluginVerified === true;
  const now = new Date().toISOString();

  const deny = async (reason: string): Promise<ApiGatewayCall> => {
    const call: ApiGatewayCall = {
      id: id('dqapi'),
      callerId: input.callerId,
      pluginId: input.pluginId,
      scope: input.scope,
      perCallAuthToken: token || null,
      pluginInstalled: installed,
      pluginTrusted: trusted,
      pluginVerified: verified,
      status: 'denied',
      reason,
      at: now,
    };
    store.calls.push(call);
    await save(input.root, store);
    return call;
  };

  if (!token) {
    return deny(API_CALL_WITHOUT_AUTH_DENIED);
  }

  if (installed && !trusted && !verified) {
    return deny(UNTRUSTED_INSTALLED_ONLY_DENIED);
  }
  if (!trusted && !verified) {
    return deny(UNTRUSTED_INSTALLED_ONLY_DENIED);
  }

  const call: ApiGatewayCall = {
    id: id('dqapi'),
    callerId: input.callerId,
    pluginId: input.pluginId,
    scope: input.scope,
    perCallAuthToken: token,
    pluginInstalled: installed,
    pluginTrusted: trusted,
    pluginVerified: verified,
    status: 'allowed',
    reason: 'PER_CALL_AUTH_OK_TRUSTED_PLUGIN',
    at: now,
  };
  store.calls.push(call);
  await save(input.root, store);
  return call;
}
