/**
 * 62L-DM Inclusive Business OS Ecosystem —
 * Opt-in community; recommendation ≠ charge/deploy;
 * ChatGPT/Cursor/plugin = verify-only; sealed silent share DENIED.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DM_LOCKS,
  HONESTY_BANNER,
  MAX_BUSINESS_SURFACES,
  PLUGIN_REGISTRATION_NEQ_AUTHORITY,
  SEALED_PRIVATE_SILENT_SHARE_DENIED,
  UNCONFIGURED_CAPABILITY_UNAVAILABLE,
  type DmActor,
  type DmEvidenceState,
  type ToolchainCapabilityId,
} from './global-neural-transit-civilization-atlas-types';

export type InclusiveBusinessOsEcosystem = {
  id: string;
  orgId: string;
  tenantId: string;
  universeId: string;
  optInRequired: true;
  recommendationEqCharge: false;
  recommendationEqDeploy: false;
  createdAt: string;
};

export type ToolchainCapability = {
  id: string;
  ecosystemId: string;
  capability: ToolchainCapabilityId;
  configured: boolean;
  registered: boolean;
  verified: boolean;
  status: DmEvidenceState;
  grantsAuthority: false;
  grantsCredentials: false;
  grantsBilling: false;
  reason: string;
  createdAt: string;
};

export type BusinessCommunitySurface = {
  id: string;
  ecosystemId: string;
  name: string;
  optIn: boolean;
  recommendationOnly: boolean;
  status: 'OPEN' | 'DENIED' | 'RECOMMENDATION_ONLY';
  reason: string;
  createdAt: string;
};

export type SealedShareAttempt = {
  id: string;
  ecosystemId: string;
  fromTenantId: string;
  toTenantId: string;
  sealed: boolean;
  silent: boolean;
  status: 'DENIED' | 'AUTHORIZED_EXPLICIT';
  reason: string;
  createdAt: string;
};

type Store = {
  ecosystems: InclusiveBusinessOsEcosystem[];
  capabilities: ToolchainCapability[];
  surfaces: BusinessCommunitySurface[];
  shares: SealedShareAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'inclusive-business-os-ecosystem.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    ecosystems: [],
    capabilities: [],
    surfaces: [],
    shares: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function inclusiveBusinessOsEcosystemHonesty() {
  return {
    banner: HONESTY_BANNER,
    chatgptCursorPluginVerifyOnly: DM_LOCKS.CHATGPT_CURSOR_PLUGIN_VERIFY_ONLY,
    unconfiguredCapabilityUnavailable: DM_LOCKS.UNCONFIGURED_CAPABILITY_UNAVAILABLE,
    pluginRegistrationEqAuthority: DM_LOCKS.PLUGIN_REGISTRATION_EQ_AUTHORITY,
    pluginRegistrationEqCredentials: DM_LOCKS.PLUGIN_REGISTRATION_EQ_CREDENTIALS,
    pluginRegistrationEqBilling: DM_LOCKS.PLUGIN_REGISTRATION_EQ_BILLING,
    businessOsOptInRequired: DM_LOCKS.BUSINESS_OS_OPT_IN_REQUIRED,
    recommendationEqCharge: DM_LOCKS.RECOMMENDATION_EQ_CHARGE,
    recommendationEqDeploy: DM_LOCKS.RECOMMENDATION_EQ_DEPLOY,
    sealedSilentPrivateShare: DM_LOCKS.SEALED_SILENT_PRIVATE_SHARE,
    privateCrossTenantSilentShare: DM_LOCKS.PRIVATE_CROSS_TENANT_SILENT_SHARE,
  };
}

export async function bootstrapInclusiveBusinessOsEcosystem(input: {
  orgId: string;
  tenantId: string;
  universeId: string;
  root: string;
  actor: DmActor;
}): Promise<InclusiveBusinessOsEcosystem> {
  void input.actor;
  const store = await load(input.root);
  const existing = store.ecosystems.find(
    (e) => e.orgId === input.orgId && e.tenantId === input.tenantId && e.universeId === input.universeId,
  );
  if (existing) return existing;
  const ecosystem: InclusiveBusinessOsEcosystem = {
    id: id('dmbiz'),
    orgId: input.orgId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    optInRequired: true,
    recommendationEqCharge: false,
    recommendationEqDeploy: false,
    createdAt: new Date().toISOString(),
  };
  store.ecosystems.push(ecosystem);
  await save(input.root, store);
  return ecosystem;
}

export async function registerToolchainCapability(input: {
  ecosystemId: string;
  capability: ToolchainCapabilityId;
  configured: boolean;
  registered: boolean;
  verified: boolean;
  claimAuthority?: boolean;
  claimCredentials?: boolean;
  claimBilling?: boolean;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; capability?: ToolchainCapability; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const ecosystem = store.ecosystems.find((e) => e.id === input.ecosystemId);
  if (!ecosystem) return { accepted: false, reason: 'ECOSYSTEM_NOT_FOUND', at: now };

  if (input.claimAuthority === true || input.claimCredentials === true || input.claimBilling === true) {
    const capability: ToolchainCapability = {
      id: id('dmcap'),
      ecosystemId: input.ecosystemId,
      capability: input.capability,
      configured: input.configured === true,
      registered: input.registered === true,
      verified: input.verified === true,
      status: 'DENIED',
      grantsAuthority: false,
      grantsCredentials: false,
      grantsBilling: false,
      reason: PLUGIN_REGISTRATION_NEQ_AUTHORITY,
      createdAt: now,
    };
    store.capabilities.push(capability);
    await save(input.root, store);
    return { accepted: false, reason: PLUGIN_REGISTRATION_NEQ_AUTHORITY, capability, at: now };
  }

  if (!input.configured || !input.verified) {
    const capability: ToolchainCapability = {
      id: id('dmcap'),
      ecosystemId: input.ecosystemId,
      capability: input.capability,
      configured: input.configured === true,
      registered: input.registered === true,
      verified: input.verified === true,
      status: 'UNAVAILABLE',
      grantsAuthority: false,
      grantsCredentials: false,
      grantsBilling: false,
      reason: UNCONFIGURED_CAPABILITY_UNAVAILABLE,
      createdAt: now,
    };
    store.capabilities.push(capability);
    await save(input.root, store);
    return { accepted: false, reason: UNCONFIGURED_CAPABILITY_UNAVAILABLE, capability, at: now };
  }

  const capability: ToolchainCapability = {
    id: id('dmcap'),
    ecosystemId: input.ecosystemId,
    capability: input.capability,
    configured: true,
    registered: input.registered === true,
    verified: true,
    status: 'VERIFY_ONLY',
    grantsAuthority: false,
    grantsCredentials: false,
    grantsBilling: false,
    reason: 'TOOLCHAIN_CAPABILITY_VERIFY_ONLY_AVAILABLE',
    createdAt: now,
  };
  store.capabilities.push(capability);
  await save(input.root, store);
  return { accepted: true, reason: capability.reason, capability, at: now };
}

export async function openBusinessCommunitySurface(input: {
  ecosystemId: string;
  name: string;
  optIn: boolean;
  asChargeOrDeploy?: boolean;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; surface?: BusinessCommunitySurface; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const ecosystem = store.ecosystems.find((e) => e.id === input.ecosystemId);
  if (!ecosystem) return { accepted: false, reason: 'ECOSYSTEM_NOT_FOUND', at: now };
  if (store.surfaces.length >= MAX_BUSINESS_SURFACES) {
    return { accepted: false, reason: 'MAX_BUSINESS_SURFACES_REACHED', at: now };
  }

  if (input.optIn !== true) {
    const surface: BusinessCommunitySurface = {
      id: id('dmsurf'),
      ecosystemId: input.ecosystemId,
      name: input.name,
      optIn: false,
      recommendationOnly: true,
      status: 'DENIED',
      reason: 'BUSINESS_OS_COMMUNITY_REQUIRES_OPT_IN',
      createdAt: now,
    };
    store.surfaces.push(surface);
    await save(input.root, store);
    return { accepted: false, reason: surface.reason, surface, at: now };
  }

  if (input.asChargeOrDeploy === true) {
    const surface: BusinessCommunitySurface = {
      id: id('dmsurf'),
      ecosystemId: input.ecosystemId,
      name: input.name,
      optIn: true,
      recommendationOnly: true,
      status: 'RECOMMENDATION_ONLY',
      reason: 'RECOMMENDATION_NOT_CHARGE_OR_DEPLOY',
      createdAt: now,
    };
    store.surfaces.push(surface);
    await save(input.root, store);
    return { accepted: false, reason: surface.reason, surface, at: now };
  }

  const surface: BusinessCommunitySurface = {
    id: id('dmsurf'),
    ecosystemId: input.ecosystemId,
    name: input.name.trim() || 'community',
    optIn: true,
    recommendationOnly: false,
    status: 'OPEN',
    reason: 'INCLUSIVE_BUSINESS_OS_COMMUNITY_OPT_IN_OPEN',
    createdAt: now,
  };
  store.surfaces.push(surface);
  await save(input.root, store);
  return { accepted: true, reason: surface.reason, surface, at: now };
}

export async function attemptSealedPrivateShare(input: {
  ecosystemId: string;
  fromTenantId: string;
  toTenantId: string;
  sealed: boolean;
  silent: boolean;
  explicitAuthorization?: boolean;
  root: string;
  actor: DmActor;
}): Promise<{ accepted: boolean; reason: string; attempt?: SealedShareAttempt; at: string }> {
  void input.actor;
  const store = await load(input.root);
  const now = new Date().toISOString();
  const ecosystem = store.ecosystems.find((e) => e.id === input.ecosystemId);
  if (!ecosystem) return { accepted: false, reason: 'ECOSYSTEM_NOT_FOUND', at: now };

  const crossTenant = input.fromTenantId !== input.toTenantId;
  if (
    (input.sealed === true && input.silent === true) ||
    (crossTenant && input.silent === true) ||
    input.explicitAuthorization !== true
  ) {
    const attempt: SealedShareAttempt = {
      id: id('dmshare'),
      ecosystemId: input.ecosystemId,
      fromTenantId: input.fromTenantId,
      toTenantId: input.toTenantId,
      sealed: input.sealed === true,
      silent: input.silent === true,
      status: 'DENIED',
      reason: SEALED_PRIVATE_SILENT_SHARE_DENIED,
      createdAt: now,
    };
    store.shares.push(attempt);
    await save(input.root, store);
    return { accepted: false, reason: SEALED_PRIVATE_SILENT_SHARE_DENIED, attempt, at: now };
  }

  const attempt: SealedShareAttempt = {
    id: id('dmshare'),
    ecosystemId: input.ecosystemId,
    fromTenantId: input.fromTenantId,
    toTenantId: input.toTenantId,
    sealed: input.sealed === true,
    silent: false,
    status: 'AUTHORIZED_EXPLICIT',
    reason: 'EXPLICIT_AUTHORIZED_NON_SILENT_SHARE',
    createdAt: now,
  };
  store.shares.push(attempt);
  await save(input.root, store);
  return { accepted: true, reason: attempt.reason, attempt, at: now };
}
