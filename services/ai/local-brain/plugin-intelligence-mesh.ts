/**
 * 62L-DO Plugin Intelligence Mesh (major) —
 * Full plugin architecture: registry, manifests, capability graph, sandbox
 * testing, least-privilege permissions, security checks, offline fallbacks,
 * composition, agent-to-plugin routing, conflict resolution, version/schema
 * drift monitoring, health dashboards, audit logs, revocation/kill switches,
 * and sandbox factory for agent-built plugin adapters.
 *
 * Installed/configured ≠ trusted until XIV verifies.
 * Registration ≠ authority/credentials/billing/deploy.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  AGENT_BUILT_SANDBOX_UNTIL_GATES,
  COMPOSITION_UNAPPROVED_DENIED,
  DO_LOCKS,
  DRIFT_NOT_SILENTLY_TRUSTED,
  HONESTY_BANNER,
  KILL_SWITCH_INVOCATION_STOPPED,
  MAX_AUDIT_EVENTS,
  MAX_PLUGIN_COMPOSITIONS,
  MAX_PLUGINS,
  MISSING_SCOPE_DENIED,
  OFFLINE_NO_INVENTED_CLOUD,
  PLUGIN_CATEGORIES,
  PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED,
  PLUGIN_TRUST_MODEL,
  REGISTRATION_NO_BILLING_CREDS_DEPLOY,
  UNVERIFIED_SEALED_DATA_DENIED,
  type DoActor,
  type PluginCategory,
  type PluginPermissionScope,
  type PluginTrustState,
} from './distributed-cognitive-runtime-plugin-mesh-types';

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  schemaVersion: string;
  category: PluginCategory;
  scopes: PluginPermissionScope[];
  installed: boolean;
  configured: boolean;
  verified: boolean;
  approved: boolean;
  trustState: PluginTrustState;
  sandbox: boolean;
  agentBuilt: boolean;
  killed: boolean;
  revoked: boolean;
  driftDetected: boolean;
  expectedVersion: string;
  expectedSchemaVersion: string;
  grantsAuthority: false;
  grantsCredentials: false;
  grantsBilling: false;
  grantsDeploy: false;
  grantsBroaderDataAccess: false;
  offlineFallbackMode: 'local_only' | 'none';
  cloudConfigured: boolean;
  reason: string;
  createdAt: string;
};

export type PluginAuditEvent = {
  id: string;
  pluginId: string | null;
  action: string;
  status: 'allowed' | 'denied' | 'unavailable' | 'recorded';
  reason: string;
  at: string;
};

export type PluginInvokeResult = {
  id: string;
  pluginId: string;
  requestedScope: PluginPermissionScope;
  sealedData: boolean;
  status: 'allowed' | 'denied' | 'unavailable';
  reason: string;
  at: string;
};

export type PluginComposition = {
  id: string;
  pluginIds: string[];
  status: 'allowed' | 'denied';
  reason: string;
  createdAt: string;
};

export type AgentPluginRoute = {
  id: string;
  agentId: string;
  pluginId: string;
  status: 'routed' | 'denied';
  reason: string;
  at: string;
};

export type OfflineFallbackProbe = {
  id: string;
  pluginId: string;
  claimedLiveCloud: boolean;
  status: 'denied' | 'local_only';
  reason: string;
  cloudAvailability: 'UNAVAILABLE' | 'LOCAL_ONLY';
  at: string;
};

export type ConflictResolution = {
  id: string;
  pluginIds: string[];
  strategy: 'deny_conflicting' | 'prefer_verified_approved';
  status: 'resolved' | 'denied';
  winnerId: string | null;
  reason: string;
  at: string;
};

export type PluginHealthDashboard = {
  total: number;
  verified: number;
  sandbox: number;
  revokedOrKilled: number;
  driftDetected: number;
  audited: number;
  denyByDefault: true;
  generatedAt: string;
};

type Store = {
  plugins: PluginManifest[];
  invokes: PluginInvokeResult[];
  compositions: PluginComposition[];
  routes: AgentPluginRoute[];
  audits: PluginAuditEvent[];
  offlineProbes: OfflineFallbackProbe[];
  conflicts: ConflictResolution[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'plugin-intelligence-mesh.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    plugins: [],
    invokes: [],
    compositions: [],
    routes: [],
    audits: [],
    offlineProbes: [],
    conflicts: [],
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
  pluginId: string | null,
  action: string,
  status: PluginAuditEvent['status'],
  reason: string,
) {
  if (store.audits.length >= MAX_AUDIT_EVENTS) store.audits.shift();
  store.audits.push({
    id: id('doaudit'),
    pluginId,
    action,
    status,
    reason,
    at: new Date().toISOString(),
  });
}

function resolveTrust(p: {
  installed: boolean;
  configured: boolean;
  verified: boolean;
  approved: boolean;
  sandbox: boolean;
  agentBuilt: boolean;
  killed: boolean;
  revoked: boolean;
  driftDetected: boolean;
}): PluginTrustState {
  if (p.killed) return 'killed';
  if (p.revoked) return 'revoked';
  if (p.driftDetected) return 'drift_detected';
  if (p.agentBuilt && !p.verified) return 'sandbox';
  if (p.sandbox && !p.verified) return 'sandbox';
  if (p.verified && p.approved) return 'approved';
  if (p.verified) return 'verified';
  if (p.configured) return 'configured';
  if (p.installed) return 'installed';
  return 'registered';
}

export function pluginIntelligenceMeshHonesty() {
  return {
    banner: HONESTY_BANNER,
    l4AutonomyEnabled: DO_LOCKS.L4_AUTONOMY_ENABLED,
    denyByDefault: DO_LOCKS.DENY_BY_DEFAULT_PERMISSIONS,
    leastPrivilege: DO_LOCKS.LEAST_PRIVILEGE,
    installedEqTrusted: DO_LOCKS.INSTALLED_EQ_TRUSTED,
    configuredEqTrusted: DO_LOCKS.CONFIGURED_EQ_TRUSTED,
    trustedOnlyAfterXivVerify: DO_LOCKS.PLUGIN_TRUSTED_ONLY_AFTER_XIV_VERIFY,
    registrationGrantsAuthority: DO_LOCKS.REGISTRATION_GRANTS_AUTHORITY,
    registrationGrantsCredentials: DO_LOCKS.REGISTRATION_GRANTS_CREDENTIALS,
    registrationGrantsBilling: DO_LOCKS.REGISTRATION_GRANTS_BILLING,
    registrationGrantsDeploy: DO_LOCKS.REGISTRATION_GRANTS_DEPLOY,
    agentBuiltSelfPromote: DO_LOCKS.AGENT_BUILT_SELF_PROMOTE_PRODUCTION,
    driftSilentlyTrusted: DO_LOCKS.DRIFT_SILENTLY_TRUSTED,
    offlineInventsCloud: DO_LOCKS.OFFLINE_FALLBACK_INVENTS_CLOUD_AVAILABILITY,
    categories: PLUGIN_CATEGORIES,
    trustModel: PLUGIN_TRUST_MODEL,
  };
}

export async function registerPluginManifest(input: {
  name: string;
  version: string;
  schemaVersion?: string;
  category: PluginCategory;
  scopes?: PluginPermissionScope[];
  installed?: boolean;
  configured?: boolean;
  verified?: boolean;
  approved?: boolean;
  agentBuilt?: boolean;
  cloudConfigured?: boolean;
  root: string;
  actor: DoActor;
}): Promise<PluginManifest> {
  const store = await load(input.root);
  void input.actor;
  if (store.plugins.length >= MAX_PLUGINS) {
    throw new Error('MAX_PLUGINS_REACHED');
  }

  const installed = input.installed === true;
  const configured = input.configured === true;
  const verified = input.verified === true;
  const approved = input.approved === true && verified;
  const agentBuilt = input.agentBuilt === true;
  const sandbox = agentBuilt || !verified;
  const version = input.version.trim();
  const schemaVersion = (input.schemaVersion ?? '1.0.0').trim();

  const plugin: PluginManifest = {
    id: id('doplug'),
    name: input.name.trim(),
    version,
    schemaVersion,
    category: input.category,
    scopes: (input.scopes ?? []).filter(Boolean),
    installed,
    configured,
    verified,
    approved,
    trustState: resolveTrust({
      installed,
      configured,
      verified,
      approved,
      sandbox,
      agentBuilt,
      killed: false,
      revoked: false,
      driftDetected: false,
    }),
    sandbox,
    agentBuilt,
    killed: false,
    revoked: false,
    driftDetected: false,
    expectedVersion: version,
    expectedSchemaVersion: schemaVersion,
    grantsAuthority: false,
    grantsCredentials: false,
    grantsBilling: false,
    grantsDeploy: false,
    grantsBroaderDataAccess: false,
    offlineFallbackMode: 'local_only',
    cloudConfigured: input.cloudConfigured === true,
    reason:
      verified && approved
        ? 'PLUGIN_XIV_VERIFIED_APPROVED'
        : installed || configured
          ? PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED
          : REGISTRATION_NO_BILLING_CREDS_DEPLOY,
    createdAt: new Date().toISOString(),
  };

  store.plugins.push(plugin);
  await audit(
    store,
    plugin.id,
    'register',
    'recorded',
    plugin.reason,
  );
  await save(input.root, store);
  return plugin;
}

export async function xivVerifyPlugin(input: {
  pluginId: string;
  approve?: boolean;
  root: string;
  actor: DoActor;
}): Promise<{ accepted: boolean; reason: string; plugin?: PluginManifest }> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  if (!plugin) return { accepted: false, reason: 'PLUGIN_NOT_FOUND' };
  if (plugin.killed || plugin.revoked) {
    return { accepted: false, reason: KILL_SWITCH_INVOCATION_STOPPED };
  }
  if (plugin.driftDetected) {
    return { accepted: false, reason: DRIFT_NOT_SILENTLY_TRUSTED };
  }
  if (plugin.agentBuilt && input.approve !== true) {
    // verification alone does not auto-promote agent-built; gates required
    plugin.verified = true;
    plugin.sandbox = true;
    plugin.approved = false;
    plugin.trustState = 'sandbox';
    plugin.reason = AGENT_BUILT_SANDBOX_UNTIL_GATES;
    await audit(store, plugin.id, 'xiv_verify_sandbox', 'recorded', plugin.reason);
    await save(input.root, store);
    return { accepted: true, reason: plugin.reason, plugin };
  }

  plugin.verified = true;
  plugin.approved = input.approve === true;
  plugin.sandbox = !plugin.approved;
  plugin.trustState = resolveTrust(plugin);
  plugin.reason = plugin.approved
    ? 'PLUGIN_XIV_VERIFIED_APPROVED'
    : 'PLUGIN_XIV_VERIFIED_PENDING_APPROVAL';
  await audit(store, plugin.id, 'xiv_verify', 'allowed', plugin.reason);
  await save(input.root, store);
  return { accepted: true, reason: plugin.reason, plugin };
}

export async function promoteAgentBuiltAdapter(input: {
  pluginId: string;
  unitTestsPass: boolean;
  integrationTestsPass: boolean;
  securityTestsPass: boolean;
  humanReviewPass: boolean;
  root: string;
  actor: DoActor;
}): Promise<{ accepted: boolean; reason: string; plugin?: PluginManifest }> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  if (!plugin) return { accepted: false, reason: 'PLUGIN_NOT_FOUND' };
  if (!plugin.agentBuilt) return { accepted: false, reason: 'NOT_AGENT_BUILT_ADAPTER' };
  if (plugin.killed || plugin.revoked) {
    return { accepted: false, reason: KILL_SWITCH_INVOCATION_STOPPED };
  }

  const gates =
    input.unitTestsPass &&
    input.integrationTestsPass &&
    input.securityTestsPass &&
    input.humanReviewPass &&
    plugin.verified;

  if (!gates) {
    plugin.sandbox = true;
    plugin.approved = false;
    plugin.trustState = 'sandbox';
    plugin.reason = AGENT_BUILT_SANDBOX_UNTIL_GATES;
    await audit(store, plugin.id, 'promote_denied', 'denied', plugin.reason);
    await save(input.root, store);
    return { accepted: false, reason: plugin.reason, plugin };
  }

  plugin.sandbox = false;
  plugin.approved = true;
  plugin.trustState = 'approved';
  plugin.reason = 'AGENT_BUILT_ADAPTER_PROMOTED_AFTER_GATES';
  await audit(store, plugin.id, 'promote', 'allowed', plugin.reason);
  await save(input.root, store);
  return { accepted: true, reason: plugin.reason, plugin };
}

export async function invokePlugin(input: {
  pluginId: string;
  requestedScope: PluginPermissionScope;
  sealedData?: boolean;
  root: string;
  actor: DoActor;
}): Promise<PluginInvokeResult> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  const now = new Date().toISOString();
  const sealed = input.sealedData === true;

  const deny = async (reason: string, status: PluginInvokeResult['status'] = 'denied') => {
    const result: PluginInvokeResult = {
      id: id('doinv'),
      pluginId: input.pluginId,
      requestedScope: input.requestedScope,
      sealedData: sealed,
      status,
      reason,
      at: now,
    };
    store.invokes.push(result);
    await audit(store, input.pluginId, 'invoke', status, reason);
    await save(input.root, store);
    return result;
  };

  if (!plugin) return deny(MISSING_SCOPE_DENIED);
  if (plugin.killed || plugin.revoked) return deny(KILL_SWITCH_INVOCATION_STOPPED);
  if (plugin.driftDetected) return deny(DRIFT_NOT_SILENTLY_TRUSTED);
  if (!plugin.verified) return deny(PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED);
  if (plugin.agentBuilt && plugin.sandbox && !plugin.approved) {
    return deny(AGENT_BUILT_SANDBOX_UNTIL_GATES);
  }
  if (sealed && (!plugin.verified || !plugin.scopes.includes('read_sealed'))) {
    return deny(UNVERIFIED_SEALED_DATA_DENIED);
  }
  if (!plugin.scopes.includes(input.requestedScope)) {
    return deny(MISSING_SCOPE_DENIED);
  }
  if (
    (input.requestedScope === 'billing' ||
      input.requestedScope === 'credentials' ||
      input.requestedScope === 'deploy') &&
    !plugin.verified
  ) {
    return deny(REGISTRATION_NO_BILLING_CREDS_DEPLOY);
  }

  const result: PluginInvokeResult = {
    id: id('doinv'),
    pluginId: plugin.id,
    requestedScope: input.requestedScope,
    sealedData: sealed,
    status: 'allowed',
    reason: 'PLUGIN_INVOKE_ALLOWED_VERIFIED_LEAST_PRIVILEGE',
    at: now,
  };
  store.invokes.push(result);
  await audit(store, plugin.id, 'invoke', 'allowed', result.reason);
  await save(input.root, store);
  return result;
}

export async function killSwitchPlugin(input: {
  pluginId: string;
  revoke?: boolean;
  root: string;
  actor: DoActor;
}): Promise<{ accepted: boolean; reason: string; plugin?: PluginManifest }> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  if (!plugin) return { accepted: false, reason: 'PLUGIN_NOT_FOUND' };
  plugin.killed = true;
  if (input.revoke !== false) plugin.revoked = true;
  plugin.trustState = 'killed';
  plugin.approved = false;
  plugin.reason = KILL_SWITCH_INVOCATION_STOPPED;
  await audit(store, plugin.id, 'kill_switch', 'recorded', plugin.reason);
  await save(input.root, store);
  return { accepted: true, reason: plugin.reason, plugin };
}

export async function reportPluginDrift(input: {
  pluginId: string;
  observedVersion: string;
  observedSchemaVersion: string;
  root: string;
  actor: DoActor;
}): Promise<{ accepted: boolean; reason: string; plugin?: PluginManifest }> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  if (!plugin) return { accepted: false, reason: 'PLUGIN_NOT_FOUND' };

  const drifted =
    input.observedVersion !== plugin.expectedVersion ||
    input.observedSchemaVersion !== plugin.expectedSchemaVersion;

  if (!drifted) {
    return { accepted: true, reason: 'NO_DRIFT', plugin };
  }

  plugin.driftDetected = true;
  plugin.verified = false;
  plugin.approved = false;
  plugin.trustState = 'drift_detected';
  plugin.reason = DRIFT_NOT_SILENTLY_TRUSTED;
  await audit(store, plugin.id, 'drift', 'denied', plugin.reason);
  await save(input.root, store);
  return { accepted: true, reason: plugin.reason, plugin };
}

export async function composePlugins(input: {
  pluginIds: string[];
  root: string;
  actor: DoActor;
}): Promise<PluginComposition> {
  const store = await load(input.root);
  void input.actor;
  if (store.compositions.length >= MAX_PLUGIN_COMPOSITIONS) {
    const denied: PluginComposition = {
      id: id('docomp'),
      pluginIds: input.pluginIds,
      status: 'denied',
      reason: 'MAX_PLUGIN_COMPOSITIONS_REACHED',
      createdAt: new Date().toISOString(),
    };
    store.compositions.push(denied);
    await save(input.root, store);
    return denied;
  }

  const plugins = input.pluginIds.map((pid) => store.plugins.find((p) => p.id === pid));
  const allApproved =
    plugins.length > 0 &&
    plugins.every(
      (p) =>
        p &&
        p.verified &&
        p.approved &&
        !p.killed &&
        !p.revoked &&
        !p.driftDetected &&
        p.scopes.includes('compose'),
    );

  const composition: PluginComposition = {
    id: id('docomp'),
    pluginIds: input.pluginIds,
    status: allApproved ? 'allowed' : 'denied',
    reason: allApproved
      ? 'COMPOSITION_ALLOWED_ALL_VERIFIED_APPROVED'
      : COMPOSITION_UNAPPROVED_DENIED,
    createdAt: new Date().toISOString(),
  };
  store.compositions.push(composition);
  await audit(
    store,
    input.pluginIds[0] ?? null,
    'compose',
    composition.status === 'allowed' ? 'allowed' : 'denied',
    composition.reason,
  );
  await save(input.root, store);
  return composition;
}

export async function routeAgentToPlugin(input: {
  agentId: string;
  pluginId: string;
  root: string;
  actor: DoActor;
}): Promise<AgentPluginRoute> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  const now = new Date().toISOString();

  if (
    !plugin ||
    !plugin.verified ||
    plugin.killed ||
    plugin.revoked ||
    plugin.driftDetected ||
    (plugin.agentBuilt && plugin.sandbox && !plugin.approved)
  ) {
    const route: AgentPluginRoute = {
      id: id('doroute'),
      agentId: input.agentId,
      pluginId: input.pluginId,
      status: 'denied',
      reason: !plugin
        ? MISSING_SCOPE_DENIED
        : plugin.killed || plugin.revoked
          ? KILL_SWITCH_INVOCATION_STOPPED
          : plugin.driftDetected
            ? DRIFT_NOT_SILENTLY_TRUSTED
            : plugin.agentBuilt && plugin.sandbox
              ? AGENT_BUILT_SANDBOX_UNTIL_GATES
              : PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED,
      at: now,
    };
    store.routes.push(route);
    await save(input.root, store);
    return route;
  }

  const route: AgentPluginRoute = {
    id: id('doroute'),
    agentId: input.agentId,
    pluginId: plugin.id,
    status: 'routed',
    reason: 'AGENT_TO_PLUGIN_ROUTE_VERIFIED',
    at: now,
  };
  store.routes.push(route);
  await save(input.root, store);
  return route;
}

export async function probeOfflineFallback(input: {
  pluginId: string;
  claimLiveCloudAvailable: boolean;
  root: string;
  actor: DoActor;
}): Promise<OfflineFallbackProbe> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  const now = new Date().toISOString();

  if (input.claimLiveCloudAvailable && (!plugin || !plugin.cloudConfigured)) {
    const probe: OfflineFallbackProbe = {
      id: id('dooff'),
      pluginId: input.pluginId,
      claimedLiveCloud: true,
      status: 'denied',
      reason: OFFLINE_NO_INVENTED_CLOUD,
      cloudAvailability: 'UNAVAILABLE',
      at: now,
    };
    store.offlineProbes.push(probe);
    await audit(store, input.pluginId, 'offline_fallback', 'denied', probe.reason);
    await save(input.root, store);
    return probe;
  }

  const probe: OfflineFallbackProbe = {
    id: id('dooff'),
    pluginId: input.pluginId,
    claimedLiveCloud: false,
    status: 'local_only',
    reason: 'OFFLINE_FALLBACK_LOCAL_ONLY',
    cloudAvailability: plugin?.cloudConfigured ? 'LOCAL_ONLY' : 'UNAVAILABLE',
    at: now,
  };
  store.offlineProbes.push(probe);
  await save(input.root, store);
  return probe;
}

export async function resolvePluginConflict(input: {
  pluginIds: string[];
  root: string;
  actor: DoActor;
}): Promise<ConflictResolution> {
  const store = await load(input.root);
  void input.actor;
  const plugins = input.pluginIds
    .map((pid) => store.plugins.find((p) => p.id === pid))
    .filter((p): p is PluginManifest => Boolean(p));

  const winners = plugins.filter(
    (p) => p.verified && p.approved && !p.killed && !p.revoked && !p.driftDetected,
  );

  const resolution: ConflictResolution = {
    id: id('doconf'),
    pluginIds: input.pluginIds,
    strategy: 'prefer_verified_approved',
    status: winners.length === 1 ? 'resolved' : 'denied',
    winnerId: winners.length === 1 ? winners[0].id : null,
    reason:
      winners.length === 1
        ? 'CONFLICT_RESOLVED_PREFER_VERIFIED_APPROVED'
        : 'CONFLICT_UNRESOLVED_DENY_AMBIGUOUS_OR_UNAPPROVED',
    at: new Date().toISOString(),
  };
  store.conflicts.push(resolution);
  await save(input.root, store);
  return resolution;
}

export async function createAgentBuiltSandboxAdapter(input: {
  name: string;
  category: PluginCategory;
  version?: string;
  scopes?: PluginPermissionScope[];
  root: string;
  actor: DoActor;
}): Promise<PluginManifest> {
  return registerPluginManifest({
    name: input.name,
    version: input.version ?? '0.0.1-sandbox',
    category: input.category,
    scopes: input.scopes ?? ['invoke'],
    installed: true,
    configured: true,
    verified: false,
    approved: false,
    agentBuilt: true,
    cloudConfigured: false,
    root: input.root,
    actor: input.actor,
  });
}

export async function probeRegistrationAuthority(input: {
  pluginId: string;
  claimBilling?: boolean;
  claimCredentials?: boolean;
  claimDeploy?: boolean;
  root: string;
  actor: DoActor;
}): Promise<{
  status: 'denied';
  reason: string;
  grantsAuthority: false;
  grantsBilling: false;
  grantsCredentials: false;
  grantsDeploy: false;
}> {
  const store = await load(input.root);
  void input.actor;
  void input.claimBilling;
  void input.claimCredentials;
  void input.claimDeploy;
  await audit(
    store,
    input.pluginId,
    'registration_authority_probe',
    'denied',
    REGISTRATION_NO_BILLING_CREDS_DEPLOY,
  );
  await save(input.root, store);
  return {
    status: 'denied',
    reason: REGISTRATION_NO_BILLING_CREDS_DEPLOY,
    grantsAuthority: false,
    grantsBilling: false,
    grantsCredentials: false,
    grantsDeploy: false,
  };
}

export async function buildPluginHealthDashboard(input: {
  root: string;
}): Promise<PluginHealthDashboard> {
  const store = await load(input.root);
  return {
    total: store.plugins.length,
    verified: store.plugins.filter((p) => p.verified).length,
    sandbox: store.plugins.filter((p) => p.sandbox).length,
    revokedOrKilled: store.plugins.filter((p) => p.revoked || p.killed).length,
    driftDetected: store.plugins.filter((p) => p.driftDetected).length,
    audited: store.audits.length,
    denyByDefault: true,
    generatedAt: new Date().toISOString(),
  };
}

export async function listPluginAuditLog(input: { root: string }) {
  const store = await load(input.root);
  return store.audits.slice(-200);
}
