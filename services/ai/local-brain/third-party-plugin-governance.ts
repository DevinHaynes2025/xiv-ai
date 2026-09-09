/**
 * 62L-CP Third-party plugin/connector governance —
 * manifests, scopes, licensing/terms, health, circuit breakers, SBOMs,
 * secret refs, deny-by-default permissions.
 * Unconfigured/unhealthy → UNAVAILABLE; circuit opens on failure.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CP_LOCKS,
  HONESTY_BANNER,
  MISSING_SCOPE_DENIED,
  UNHEALTHY_PLUGIN_CIRCUIT_OPEN,
  type CpActor,
  type PluginHealthState,
} from './knowledge-supply-plugin-foundry-types';

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  scopes: string[];
  licensingTermsAccepted: boolean;
  sbomRef: string | null;
  secretRefs: string[];
  configured: boolean;
  health: PluginHealthState;
  circuitOpen: boolean;
  failureCount: number;
  status: 'available' | 'unavailable' | 'denied';
  reason: string;
  createdAt: string;
};

export type ScopeCheck = {
  id: string;
  pluginId: string;
  requestedScope: string;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

export type HealthEvent = {
  id: string;
  pluginId: string;
  health: PluginHealthState;
  circuitOpen: boolean;
  status: 'available' | 'unavailable';
  reason: string;
  at: string;
};

type Store = {
  plugins: PluginManifest[];
  scopeChecks: ScopeCheck[];
  healthEvents: HealthEvent[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'third-party-plugin-governance.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    plugins: [],
    scopeChecks: [],
    healthEvents: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function thirdPartyPluginHonesty() {
  return {
    banner: HONESTY_BANNER,
    denyByDefault: CP_LOCKS.DENY_BY_DEFAULT_PERMISSIONS,
    missingScopeAllowed: CP_LOCKS.MISSING_SCOPE_ALLOWED,
    unhealthyAvailable: CP_LOCKS.UNHEALTHY_PLUGIN_AVAILABLE,
    circuitOpensOnFailure: CP_LOCKS.CIRCUIT_OPENS_ON_FAILURE,
    registrationGrantsAuthority: CP_LOCKS.REGISTRATION_GRANTS_AUTHORITY,
  };
}

export async function registerThirdPartyPlugin(input: {
  name: string;
  version: string;
  scopes?: string[];
  licensingTermsAccepted?: boolean;
  sbomRef?: string | null;
  secretRefs?: string[];
  configured?: boolean;
  healthy?: boolean;
  root: string;
  actor: CpActor;
}): Promise<PluginManifest> {
  const store = await load(input.root);
  const configured = input.configured === true;
  const healthy = input.healthy === true;
  const termsOk = input.licensingTermsAccepted === true;
  const ok = configured && healthy && termsOk;
  const plugin: PluginManifest = {
    id: id('tpplug'),
    name: input.name.trim(),
    version: input.version.trim(),
    scopes: (input.scopes ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean),
    licensingTermsAccepted: termsOk,
    sbomRef: input.sbomRef ?? null,
    secretRefs: input.secretRefs ?? [],
    configured,
    health: ok ? 'healthy' : configured ? 'unhealthy' : 'unconfigured',
    circuitOpen: !ok,
    failureCount: ok ? 0 : 1,
    status: ok ? 'available' : 'unavailable',
    reason: ok
      ? 'THIRD_PARTY_PLUGIN_CONFIGURED_HEALTHY_TERMS_ACCEPTED'
      : UNHEALTHY_PLUGIN_CIRCUIT_OPEN,
    createdAt: new Date().toISOString(),
  };
  void input.actor;
  store.plugins.push(plugin);
  await save(input.root, store);
  return plugin;
}

export async function checkPluginScope(input: {
  pluginId: string;
  requestedScope: string;
  root: string;
  actor: CpActor;
}): Promise<ScopeCheck> {
  const store = await load(input.root);
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  const scope = input.requestedScope.trim().toLowerCase();
  void input.actor;

  if (!plugin || plugin.circuitOpen || plugin.status !== 'available') {
    const check: ScopeCheck = {
      id: id('scope'),
      pluginId: input.pluginId,
      requestedScope: scope,
      status: 'denied',
      reason: plugin?.circuitOpen
        ? UNHEALTHY_PLUGIN_CIRCUIT_OPEN
        : MISSING_SCOPE_DENIED,
      at: new Date().toISOString(),
    };
    store.scopeChecks.push(check);
    await save(input.root, store);
    return check;
  }

  if (!plugin.scopes.includes(scope)) {
    const check: ScopeCheck = {
      id: id('scope'),
      pluginId: plugin.id,
      requestedScope: scope,
      status: 'denied',
      reason: MISSING_SCOPE_DENIED,
      at: new Date().toISOString(),
    };
    store.scopeChecks.push(check);
    await save(input.root, store);
    return check;
  }

  const check: ScopeCheck = {
    id: id('scope'),
    pluginId: plugin.id,
    requestedScope: scope,
    status: 'allowed',
    reason: 'SCOPE_GRANTED_EXPLICIT_MANIFEST',
    at: new Date().toISOString(),
  };
  store.scopeChecks.push(check);
  await save(input.root, store);
  return check;
}

export async function recordPluginFailure(input: {
  pluginId: string;
  root: string;
  actor: CpActor;
}): Promise<HealthEvent> {
  const store = await load(input.root);
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  void input.actor;
  if (!plugin) {
    const event: HealthEvent = {
      id: id('health'),
      pluginId: input.pluginId,
      health: 'unconfigured',
      circuitOpen: true,
      status: 'unavailable',
      reason: UNHEALTHY_PLUGIN_CIRCUIT_OPEN,
      at: new Date().toISOString(),
    };
    store.healthEvents.push(event);
    await save(input.root, store);
    return event;
  }

  plugin.failureCount += 1;
  plugin.health = 'circuit_open';
  plugin.circuitOpen = CP_LOCKS.CIRCUIT_OPENS_ON_FAILURE;
  plugin.status = 'unavailable';
  plugin.reason = UNHEALTHY_PLUGIN_CIRCUIT_OPEN;

  const event: HealthEvent = {
    id: id('health'),
    pluginId: plugin.id,
    health: plugin.health,
    circuitOpen: plugin.circuitOpen,
    status: 'unavailable',
    reason: UNHEALTHY_PLUGIN_CIRCUIT_OPEN,
    at: new Date().toISOString(),
  };
  store.healthEvents.push(event);
  await save(input.root, store);
  return event;
}

export async function invokeGovernedPlugin(input: {
  pluginId: string;
  requestedScope: string;
  root: string;
  actor: CpActor;
}): Promise<{
  status: 'allowed' | 'denied' | 'unavailable';
  reason: string;
  circuitOpen: boolean;
}> {
  const store = await load(input.root);
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  void input.actor;
  if (!plugin || !plugin.configured || plugin.circuitOpen || plugin.health === 'unhealthy') {
    return {
      status: 'unavailable',
      reason: UNHEALTHY_PLUGIN_CIRCUIT_OPEN,
      circuitOpen: true,
    };
  }
  const scope = await checkPluginScope({
    pluginId: plugin.id,
    requestedScope: input.requestedScope,
    root: input.root,
    actor: input.actor,
  });
  if (scope.status === 'denied') {
    return { status: 'denied', reason: scope.reason, circuitOpen: plugin.circuitOpen };
  }
  return {
    status: 'allowed',
    reason: 'GOVERNED_PLUGIN_INVOKE_BOUNDED',
    circuitOpen: false,
  };
}
