/**
 * 62L-CU Universal Tool/Plugin Runtime — deny-by-default plugin/tool runtime.
 * Registration ≠ authority (reuse CP patterns). Missing scope → DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CU_LOCKS,
  HONESTY_BANNER,
  PLUGIN_MISSING_SCOPE_DENIED,
  REGISTRATION_NO_AUTHORITY,
  type CuActor,
} from './cognitive-research-cloud-types';

export type RuntimePlugin = {
  id: string;
  name: string;
  scopes: string[];
  registered: true;
  grantsAuthority: false;
  grantsCredentials: false;
  grantsBilling: false;
  grantsDeployment: false;
  status: 'registered' | 'unavailable' | 'denied';
  reason: string;
  createdAt: string;
};

export type RuntimeInvoke = {
  id: string;
  pluginId: string;
  requestedScope: string;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

export type AuthorityProbe = {
  id: string;
  pluginId: string;
  claimedAuthority: boolean;
  status: 'denied';
  reason: string;
  at: string;
};

type Store = {
  plugins: RuntimePlugin[];
  invokes: RuntimeInvoke[];
  authorityProbes: AuthorityProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'universal-tool-plugin-runtime.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    plugins: [],
    invokes: [],
    authorityProbes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function universalToolPluginRuntimeHonesty() {
  return {
    banner: HONESTY_BANNER,
    denyByDefault: CU_LOCKS.DENY_BY_DEFAULT_PLUGIN_PERMISSIONS,
    missingScopeAllowed: CU_LOCKS.MISSING_SCOPE_ALLOWED,
    registrationGrantsAuthority: CU_LOCKS.REGISTRATION_GRANTS_AUTHORITY,
    registrationEqAuthority: CU_LOCKS.REGISTRATION_EQ_AUTHORITY,
  };
}

export async function registerRuntimePlugin(input: {
  name: string;
  scopes?: string[];
  root: string;
  actor: CuActor;
}): Promise<RuntimePlugin> {
  const store = await load(input.root);
  void input.actor;
  const plugin: RuntimePlugin = {
    id: id('rtplug'),
    name: input.name.trim(),
    scopes: (input.scopes ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean),
    registered: true,
    grantsAuthority: false,
    grantsCredentials: false,
    grantsBilling: false,
    grantsDeployment: false,
    status: 'registered',
    reason: REGISTRATION_NO_AUTHORITY,
    createdAt: new Date().toISOString(),
  };
  store.plugins.push(plugin);
  await save(input.root, store);
  return plugin;
}

export async function invokeRuntimePlugin(input: {
  pluginId: string;
  requestedScope: string;
  root: string;
  actor: CuActor;
}): Promise<RuntimeInvoke> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  const scope = input.requestedScope.trim().toLowerCase();

  if (!plugin || plugin.status !== 'registered') {
    const invoke: RuntimeInvoke = {
      id: id('rtinv'),
      pluginId: input.pluginId,
      requestedScope: scope,
      status: 'denied',
      reason: PLUGIN_MISSING_SCOPE_DENIED,
      at: new Date().toISOString(),
    };
    store.invokes.push(invoke);
    await save(input.root, store);
    return invoke;
  }

  if (!plugin.scopes.includes(scope)) {
    const invoke: RuntimeInvoke = {
      id: id('rtinv'),
      pluginId: plugin.id,
      requestedScope: scope,
      status: 'denied',
      reason: PLUGIN_MISSING_SCOPE_DENIED,
      at: new Date().toISOString(),
    };
    store.invokes.push(invoke);
    await save(input.root, store);
    return invoke;
  }

  const invoke: RuntimeInvoke = {
    id: id('rtinv'),
    pluginId: plugin.id,
    requestedScope: scope,
    status: 'allowed',
    reason: 'SCOPE_EXPLICITLY_GRANTED_IN_MANIFEST',
    at: new Date().toISOString(),
  };
  store.invokes.push(invoke);
  await save(input.root, store);
  return invoke;
}

export async function probeRegistrationAuthority(input: {
  pluginId: string;
  root: string;
  actor: CuActor;
}): Promise<AuthorityProbe> {
  const store = await load(input.root);
  void input.actor;
  const probe: AuthorityProbe = {
    id: id('authprobe'),
    pluginId: input.pluginId,
    claimedAuthority: true,
    status: 'denied',
    reason: REGISTRATION_NO_AUTHORITY,
    at: new Date().toISOString(),
  };
  store.authorityProbes.push(probe);
  await save(input.root, store);
  return probe;
}
