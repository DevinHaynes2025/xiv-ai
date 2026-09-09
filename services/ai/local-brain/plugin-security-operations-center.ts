/**
 * 62L-DP Plugin Security Operations Center —
 * Incident response, kill switches, schema-drift detection, health/audit.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DRIFT_NOT_SILENTLY_TRUSTED,
  KILL_SWITCH_INVOCATION_STOPPED,
  MAX_AUDIT_EVENTS,
  type DpActor,
} from './plugin-civilization-os-types';

export type SecOpsPluginRecord = {
  id: string;
  name: string;
  version: string;
  schemaVersion: string;
  expectedVersion: string;
  expectedSchemaVersion: string;
  verified: boolean;
  killed: boolean;
  revoked: boolean;
  driftDetected: boolean;
  reason: string;
};

export type SecOpsAuditEvent = {
  id: string;
  pluginId: string | null;
  action: string;
  status: 'allowed' | 'denied' | 'recorded' | 'unavailable';
  reason: string;
  at: string;
};

export type IncidentRecord = {
  id: string;
  pluginId: string;
  kind: 'drift' | 'abuse' | 'kill' | 'health';
  status: 'open' | 'contained' | 'closed';
  reason: string;
  at: string;
};

export type InvokeProbe = {
  id: string;
  pluginId: string;
  status: 'allowed' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  plugins: SecOpsPluginRecord[];
  audits: SecOpsAuditEvent[];
  incidents: IncidentRecord[];
  invokes: InvokeProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'plugin-security-operations-center.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    plugins: [],
    audits: [],
    incidents: [],
    invokes: [],
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
  status: SecOpsAuditEvent['status'],
  reason: string,
) {
  if (store.audits.length >= MAX_AUDIT_EVENTS) store.audits.shift();
  store.audits.push({
    id: id('dpsaudit'),
    pluginId,
    action,
    status,
    reason,
    at: new Date().toISOString(),
  });
}

export function pluginSecurityOperationsCenterHonesty() {
  return {
    killSwitchStopsInvocations: true,
    driftSilentlyTrusted: false,
    incidentResponse: true,
    healthAudit: true,
  };
}

export async function registerSecOpsPlugin(input: {
  name: string;
  version: string;
  schemaVersion?: string;
  verified?: boolean;
  root: string;
  actor: DpActor;
}): Promise<SecOpsPluginRecord> {
  const store = await load(input.root);
  void input.actor;
  const version = input.version.trim();
  const schemaVersion = (input.schemaVersion ?? '1.0.0').trim();
  const plugin: SecOpsPluginRecord = {
    id: id('dpsec'),
    name: input.name.trim(),
    version,
    schemaVersion,
    expectedVersion: version,
    expectedSchemaVersion: schemaVersion,
    verified: input.verified === true,
    killed: false,
    revoked: false,
    driftDetected: false,
    reason: input.verified === true ? 'SECOPS_PLUGIN_VERIFIED' : 'SECOPS_PLUGIN_REGISTERED',
  };
  store.plugins.push(plugin);
  await audit(store, plugin.id, 'register', 'recorded', plugin.reason);
  await save(input.root, store);
  return plugin;
}

export async function killSwitchPlugin(input: {
  pluginId: string;
  revoke?: boolean;
  root: string;
  actor: DpActor;
}): Promise<{ accepted: boolean; reason: string; plugin?: SecOpsPluginRecord }> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  if (!plugin) return { accepted: false, reason: 'PLUGIN_NOT_FOUND' };
  plugin.killed = true;
  if (input.revoke !== false) plugin.revoked = true;
  plugin.reason = KILL_SWITCH_INVOCATION_STOPPED;
  store.incidents.push({
    id: id('dpinc'),
    pluginId: plugin.id,
    kind: 'kill',
    status: 'contained',
    reason: plugin.reason,
    at: new Date().toISOString(),
  });
  await audit(store, plugin.id, 'kill_switch', 'recorded', plugin.reason);
  await save(input.root, store);
  return { accepted: true, reason: plugin.reason, plugin };
}

export async function reportSchemaDrift(input: {
  pluginId: string;
  observedVersion: string;
  observedSchemaVersion: string;
  root: string;
  actor: DpActor;
}): Promise<{ accepted: boolean; reason: string; plugin?: SecOpsPluginRecord }> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  if (!plugin) return { accepted: false, reason: 'PLUGIN_NOT_FOUND' };
  const drifted =
    input.observedVersion !== plugin.expectedVersion ||
    input.observedSchemaVersion !== plugin.expectedSchemaVersion;
  if (!drifted) return { accepted: true, reason: 'NO_DRIFT', plugin };
  plugin.driftDetected = true;
  plugin.verified = false;
  plugin.reason = DRIFT_NOT_SILENTLY_TRUSTED;
  store.incidents.push({
    id: id('dpinc'),
    pluginId: plugin.id,
    kind: 'drift',
    status: 'open',
    reason: plugin.reason,
    at: new Date().toISOString(),
  });
  await audit(store, plugin.id, 'drift', 'denied', plugin.reason);
  await save(input.root, store);
  return { accepted: true, reason: plugin.reason, plugin };
}

export async function invokeUnderSecOps(input: {
  pluginId: string;
  sealedData?: boolean;
  root: string;
  actor: DpActor;
}): Promise<InvokeProbe> {
  const store = await load(input.root);
  void input.actor;
  const plugin = store.plugins.find((p) => p.id === input.pluginId);
  const now = new Date().toISOString();
  const deny = async (reason: string) => {
    const probe: InvokeProbe = {
      id: id('dpinv'),
      pluginId: input.pluginId,
      status: 'denied',
      reason,
      at: now,
    };
    store.invokes.push(probe);
    await audit(store, input.pluginId, 'invoke', 'denied', reason);
    await save(input.root, store);
    return probe;
  };
  if (!plugin) return deny('PLUGIN_NOT_FOUND');
  if (plugin.killed || plugin.revoked) return deny(KILL_SWITCH_INVOCATION_STOPPED);
  if (plugin.driftDetected) return deny(DRIFT_NOT_SILENTLY_TRUSTED);
  if (!plugin.verified) return deny('PLUGIN_NOT_TRUSTED_UNTIL_VERIFIED');
  const probe: InvokeProbe = {
    id: id('dpinv'),
    pluginId: plugin.id,
    status: 'allowed',
    reason: 'SECOPS_INVOKE_ALLOWED',
    at: now,
  };
  store.invokes.push(probe);
  await audit(store, plugin.id, 'invoke', 'allowed', probe.reason);
  await save(input.root, store);
  return probe;
}

export async function buildSecOpsHealthDashboard(input: { root: string }) {
  const store = await load(input.root);
  return {
    total: store.plugins.length,
    verified: store.plugins.filter((p) => p.verified).length,
    killed: store.plugins.filter((p) => p.killed).length,
    driftDetected: store.plugins.filter((p) => p.driftDetected).length,
    openIncidents: store.incidents.filter((i) => i.status === 'open').length,
    audited: store.audits.length,
    denyByDefault: true,
    generatedAt: new Date().toISOString(),
  };
}
