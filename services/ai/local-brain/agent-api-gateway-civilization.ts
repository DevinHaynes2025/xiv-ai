/**
 * 62L-DQ Agent API Gateway Civilization —
 * Per-call authorization for API gateway. Installed-only plugins cannot invoke.
 * Registration ≠ billing/credentials/deploy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  API_CALL_WITHOUT_AUTH_DENIED,
  MAX_API_CALLS,
  REGISTRATION_NO_BILLING_CREDS_DEPLOY,
  UNTRUSTED_INSTALLED_ONLY_DENIED,
  type DqActor,
} from './universal-integration-brain-types';
import type { PermissionScope } from './plugin-civilization-os-types';

export type ApiGatewayPlugin = {
  id: string;
  name: string;
  installed: boolean;
  verified: boolean;
  approved: boolean;
  scopes: PermissionScope[];
  grantsAuthority: false;
  grantsCredentials: false;
  grantsBilling: false;
  grantsDeploy: false;
  reason: string;
  createdAt: string;
};

export type ApiCallAttempt = {
  id: string;
  pluginId: string;
  callId: string;
  perCallAuthorized: boolean;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  plugins: ApiGatewayPlugin[];
  calls: ApiCallAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'agent-api-gateway-civilization.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { plugins: [], calls: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function agentApiGatewayCivilizationHonesty() {
  return {
    perCallAuthorizationRequired: true,
    installedOnlyMayInvoke: false,
    registrationGrantsBilling: false,
    registrationGrantsCredentials: false,
    registrationGrantsDeploy: false,
  };
}

export async function registerGatewayPlugin(input: {
  name: string;
  installed?: boolean;
  verified?: boolean;
  approved?: boolean;
  scopes?: PermissionScope[];
  root: string;
  actor: DqActor;
}): Promise<ApiGatewayPlugin> {
  const store = await load(input.root);
  void input.actor;
  if (store.plugins.length >= MAX_API_CALLS) {
    throw new Error('MAX_API_GATEWAY_PLUGINS_REACHED');
  }
  const plugin: ApiGatewayPlugin = {
    id: id('dqgwplug'),
    name: input.name.trim(),
    installed: input.installed === true,
    verified: input.verified === true,
    approved: input.approved === true,
    scopes: input.scopes ?? ['invoke'],
    grantsAuthority: false,
    grantsCredentials: false,
    grantsBilling: false,
    grantsDeploy: false,
    reason: REGISTRATION_NO_BILLING_CREDS_DEPLOY,
    createdAt: new Date().toISOString(),
  };
  store.plugins.push(plugin);
  await save(input.root, store);
  return plugin;
}

export async function invokeApiGatewayCall(input: {
  pluginId: string;
  callId: string;
  perCallAuthorized: boolean;
  root: string;
  actor: DqActor;
}): Promise<ApiCallAttempt> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  const now = new Date().toISOString();

  const deny = async (reason: string): Promise<ApiCallAttempt> => {
    const attempt: ApiCallAttempt = {
      id: id('dqapicall'),
      pluginId: input.pluginId,
      callId: input.callId,
      perCallAuthorized: input.perCallAuthorized,
      status: 'denied',
      reason,
      at: now,
    };
    if (store.calls.length >= MAX_API_CALLS) store.calls.shift();
    store.calls.push(attempt);
    await save(input.root, store);
    return attempt;
  };

  if (!plugin) return deny('PLUGIN_NOT_REGISTERED');
  if (!input.perCallAuthorized) return deny(API_CALL_WITHOUT_AUTH_DENIED);
  if (plugin.installed && !plugin.verified) return deny(UNTRUSTED_INSTALLED_ONLY_DENIED);
  if (!plugin.verified || !plugin.approved) return deny(UNTRUSTED_INSTALLED_ONLY_DENIED);

  const attempt: ApiCallAttempt = {
    id: id('dqapicall'),
    pluginId: input.pluginId,
    callId: input.callId,
    perCallAuthorized: true,
    status: 'allowed',
    reason: 'API_CALL_PER_CALL_AUTHORIZED',
    at: now,
  };
  if (store.calls.length >= MAX_API_CALLS) store.calls.shift();
  store.calls.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function probeGatewayRegistrationAuthority(input: {
  pluginId: string;
  claimBilling?: boolean;
  claimCredentials?: boolean;
  claimDeploy?: boolean;
  root: string;
  actor: DqActor;
}): Promise<{
  grantsBilling: false;
  grantsCredentials: false;
  grantsDeploy: false;
  reason: string;
}> {
  void input;
  return {
    grantsBilling: false,
    grantsCredentials: false,
    grantsDeploy: false,
    reason: REGISTRATION_NO_BILLING_CREDS_DEPLOY,
  };
}
