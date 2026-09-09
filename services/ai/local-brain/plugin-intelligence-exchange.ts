/**
 * 62L-DN Plugin Intelligence Exchange —
 * Compatibility testing/exchange; installed ≠ trusted.
 * Registration ≠ credentials / billing / deploy.
 * Installed without compat/trust gate cannot elevate permissions.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DN_LOCKS,
  HONESTY_BANNER,
  MAX_PLUGIN_EXCHANGE_ENTRIES,
  PLUGIN_ELEVATE_DENIED,
  PLUGIN_NOT_AUTO_TRUSTED,
  PLUGIN_REGISTRATION_NEQ_CREDENTIALS_BILLING_DEPLOY,
  type DnActor,
  type PluginTrustState,
} from './universal-agent-runtime-os-types';

export type PluginIntelligenceExchange = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  installedAutoTrusted: false;
  registrationEqCredentials: false;
  registrationEqBilling: false;
  registrationEqDeploy: false;
  createdAt: string;
};

export type PluginExchangeEntry = {
  id: string;
  exchangeId: string;
  pluginId: string;
  name: string;
  installed: boolean;
  compatibilityTested: boolean;
  trustState: PluginTrustState;
  permissions: string[];
  status: 'REGISTERED' | 'UNTRUSTED' | 'TRUSTED_COMPAT' | 'DENIED';
  reason: string;
  createdAt: string;
};

export type PluginPermissionElevationAttempt = {
  id: string;
  entryId: string;
  requestedPermissions: string[];
  status: 'DENIED' | 'ALLOWED';
  reason: string;
  at: string;
};

export type PluginCredentialClaimAttempt = {
  id: string;
  entryId: string;
  claim: 'credentials' | 'billing' | 'deploy';
  status: 'DENIED';
  reason: string;
  at: string;
};

type Store = {
  exchanges: PluginIntelligenceExchange[];
  entries: PluginExchangeEntry[];
  elevations: PluginPermissionElevationAttempt[];
  credentialClaims: PluginCredentialClaimAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'plugin-intelligence-exchange.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    exchanges: [],
    entries: [],
    elevations: [],
    credentialClaims: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function pluginIntelligenceExchangeHonesty() {
  return {
    banner: HONESTY_BANNER,
    installedPluginAutoTrusted: DN_LOCKS.INSTALLED_PLUGIN_AUTO_TRUSTED,
    compatTrustGateRequired: DN_LOCKS.PLUGIN_COMPAT_TRUST_GATE_REQUIRED,
    pluginElevateWithoutTrust: DN_LOCKS.PLUGIN_ELEVATE_WITHOUT_TRUST,
    registrationEqAuthority: DN_LOCKS.PLUGIN_REGISTRATION_EQ_AUTHORITY,
    registrationEqCredentials: DN_LOCKS.PLUGIN_REGISTRATION_EQ_CREDENTIALS,
    registrationEqBilling: DN_LOCKS.PLUGIN_REGISTRATION_EQ_BILLING,
    registrationEqDeploy: DN_LOCKS.PLUGIN_REGISTRATION_EQ_DEPLOY,
  };
}

export async function bootstrapPluginIntelligenceExchange(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DnActor;
}): Promise<PluginIntelligenceExchange> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.exchanges.find(
    (e) =>
      e.orgId === input.orgId &&
      e.tenantId === input.tenantId &&
      e.universeId === input.universeId,
  );
  if (existing) return existing;
  const exchange: PluginIntelligenceExchange = {
    id: id('dnplx'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    installedAutoTrusted: false,
    registrationEqCredentials: false,
    registrationEqBilling: false,
    registrationEqDeploy: false,
    createdAt: new Date().toISOString(),
  };
  store.exchanges.push(exchange);
  await save(input.root, store);
  return exchange;
}

export async function registerPluginOnExchange(input: {
  exchangeId: string;
  pluginId: string;
  name: string;
  installed?: boolean;
  compatibilityTested?: boolean;
  trusted?: boolean;
  root: string;
  actor: DnActor;
}): Promise<{ accepted: boolean; reason: string; entry?: PluginExchangeEntry }> {
  void input.actor;
  const store = await load(input.root);
  const exchange = store.exchanges.find((e) => e.id === input.exchangeId);
  if (!exchange) return { accepted: false, reason: 'PLUGIN_EXCHANGE_NOT_FOUND' };
  if (store.entries.length >= MAX_PLUGIN_EXCHANGE_ENTRIES) {
    return { accepted: false, reason: 'MAX_PLUGIN_EXCHANGE_ENTRIES_REACHED' };
  }

  const installed = input.installed === true;
  const compat = input.compatibilityTested === true;
  const trusted = input.trusted === true && compat;
  let trustState: PluginTrustState;
  let status: PluginExchangeEntry['status'];
  let reason: string;

  if (installed && !compat) {
    trustState = 'INSTALLED_UNTRUSTED';
    status = 'UNTRUSTED';
    reason = PLUGIN_NOT_AUTO_TRUSTED;
  } else if (trusted && compat) {
    trustState = 'TRUSTED_COMPAT';
    status = 'TRUSTED_COMPAT';
    reason = 'PLUGIN_COMPAT_TRUST_GATE_PASSED_CONTRACT_ONLY';
  } else if (!compat) {
    trustState = 'COMPAT_PENDING';
    status = 'REGISTERED';
    reason = PLUGIN_REGISTRATION_NEQ_CREDENTIALS_BILLING_DEPLOY;
  } else {
    trustState = 'REGISTERED_ONLY';
    status = 'REGISTERED';
    reason = PLUGIN_REGISTRATION_NEQ_CREDENTIALS_BILLING_DEPLOY;
  }

  const entry: PluginExchangeEntry = {
    id: id('dnple'),
    exchangeId: input.exchangeId,
    pluginId: input.pluginId,
    name: input.name,
    installed,
    compatibilityTested: compat,
    trustState,
    permissions: [],
    status,
    reason,
    createdAt: new Date().toISOString(),
  };
  store.entries.push(entry);
  await save(input.root, store);
  return {
    accepted: status === 'TRUSTED_COMPAT' || status === 'REGISTERED' || status === 'UNTRUSTED',
    reason: entry.reason,
    entry,
  };
}

export async function attemptPluginPermissionElevation(input: {
  entryId: string;
  requestedPermissions: string[];
  root: string;
  actor: DnActor;
}): Promise<{
  accepted: boolean;
  reason: string;
  attempt: PluginPermissionElevationAttempt;
  entry?: PluginExchangeEntry;
}> {
  void input.actor;
  const store = await load(input.root);
  const entry = store.entries.find((e) => e.id === input.entryId);
  const now = new Date().toISOString();
  if (!entry) {
    const attempt: PluginPermissionElevationAttempt = {
      id: id('dnplev'),
      entryId: input.entryId,
      requestedPermissions: input.requestedPermissions,
      status: 'DENIED',
      reason: 'PLUGIN_ENTRY_NOT_FOUND',
      at: now,
    };
    store.elevations.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt };
  }

  if (entry.trustState !== 'TRUSTED_COMPAT') {
    const attempt: PluginPermissionElevationAttempt = {
      id: id('dnplev'),
      entryId: entry.id,
      requestedPermissions: input.requestedPermissions,
      status: 'DENIED',
      reason: PLUGIN_ELEVATE_DENIED,
      at: now,
    };
    store.elevations.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: attempt.reason, attempt, entry };
  }

  entry.permissions = [
    ...new Set([...entry.permissions, ...input.requestedPermissions.map((p) => p.trim())]),
  ].filter(Boolean);
  const attempt: PluginPermissionElevationAttempt = {
    id: id('dnplev'),
    entryId: entry.id,
    requestedPermissions: input.requestedPermissions,
    status: 'ALLOWED',
    reason: 'TRUSTED_COMPAT_PERMISSION_ELEVATION_BOUNDED',
    at: now,
  };
  store.elevations.push(attempt);
  await save(input.root, store);
  return { accepted: true, reason: attempt.reason, attempt, entry };
}

export async function claimPluginExchangeCredentialsOrBilling(input: {
  entryId: string;
  claim: PluginCredentialClaimAttempt['claim'];
  root: string;
  actor: DnActor;
}): Promise<{ accepted: false; reason: string; attempt: PluginCredentialClaimAttempt }> {
  void input.actor;
  const store = await load(input.root);
  const attempt: PluginCredentialClaimAttempt = {
    id: id('dnplcred'),
    entryId: input.entryId,
    claim: input.claim,
    status: 'DENIED',
    reason: PLUGIN_REGISTRATION_NEQ_CREDENTIALS_BILLING_DEPLOY,
    at: new Date().toISOString(),
  };
  store.credentialClaims.push(attempt);
  await save(input.root, store);
  return { accepted: false, reason: attempt.reason, attempt };
}
