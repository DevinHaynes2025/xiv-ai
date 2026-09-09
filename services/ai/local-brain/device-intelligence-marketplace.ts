/**
 * 62L-BX Authorized Device/Plugin Marketplace —
 * Device intelligence marketplace: authorized adapters/plugins only.
 * Install ≠ authority; no silent arbitrary device enroll.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BX_LOCKS,
  HONESTY_BANNER,
  INSTALL_NO_PRODUCTION_AUTHORITY,
  UNAUTHORIZED_DEVICE_ENROLL_DENIED,
  type BxActor,
} from './neural-chip-os-semiconductor-twin-types';

export type MarketplacePlugin = {
  pluginId: string;
  name: string;
  kind: 'device_adapter' | 'chip_driver' | 'sensor_plugin' | 'intelligence_pack';
  authorized: boolean;
  configured: boolean;
  verified: boolean;
  label: 'UNAVAILABLE' | 'AUTHORIZED' | 'INSTALLED' | 'DENIED';
  productionAuthority: false;
  installedAt: string | null;
  evidenceRefs: string[];
};

type Store = {
  plugins: MarketplacePlugin[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'device-intelligence-marketplace.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { plugins: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/** Register a marketplace listing — unauthorized/unconfigured stay UNAVAILABLE. */
export async function registerMarketplacePlugin(input: {
  pluginId: string;
  name: string;
  kind: MarketplacePlugin['kind'];
  authorized: boolean;
  configured: boolean;
  verified?: boolean;
  evidenceRefs?: string[];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const id = normalizeKey(input.pluginId);

  let label: MarketplacePlugin['label'] = 'UNAVAILABLE';
  if (!input.authorized || !input.configured) {
    label = 'UNAVAILABLE';
  } else {
    label = 'AUTHORIZED';
  }

  const plugin: MarketplacePlugin = {
    pluginId: id,
    name: input.name.trim() || id,
    kind: input.kind,
    authorized: input.authorized,
    configured: input.configured,
    verified: Boolean(input.verified),
    label,
    productionAuthority: false,
    installedAt: null,
    evidenceRefs: input.evidenceRefs ?? [],
  };

  const idx = store.plugins.findIndex((p) => p.pluginId === id);
  if (idx >= 0) store.plugins[idx] = { ...plugin, installedAt: store.plugins[idx].installedAt };
  else store.plugins.push(plugin);
  await save(root, store);
  return { accepted: true as const, plugin };
}

/** Install an authorized+configured plugin. Install never grants production authority. */
export async function installMarketplacePlugin(input: {
  pluginId: string;
  actor: BxActor;
  forceUnauthorized?: boolean;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const id = normalizeKey(input.pluginId);
  const plugin = store.plugins.find((p) => p.pluginId === id);

  if (!plugin || input.forceUnauthorized || !plugin.authorized || !plugin.configured) {
    return {
      accepted: false as const,
      reason: UNAUTHORIZED_DEVICE_ENROLL_DENIED,
      productionAuthority: false as const,
      plugin: plugin ?? null,
      status: 'DENIED' as const,
    };
  }

  plugin.label = 'INSTALLED';
  plugin.installedAt = new Date().toISOString();
  plugin.productionAuthority = false;
  await save(root, store);

  return {
    accepted: true as const,
    reason: INSTALL_NO_PRODUCTION_AUTHORITY,
    productionAuthority: false as const,
    plugin,
    status: 'INSTALLED' as const,
    actorId: input.actor.id,
  };
}

/** Silent arbitrary enroll attempt — always DENIED. */
export async function attemptSilentDeviceEnroll(input: {
  pluginId: string;
  actor: BxActor;
  root?: string;
}) {
  return {
    accepted: false as const,
    reason: UNAUTHORIZED_DEVICE_ENROLL_DENIED,
    productionAuthority: false as const,
    status: 'DENIED' as const,
    actorId: input.actor.id,
    pluginId: normalizeKey(input.pluginId),
  };
}

export async function getMarketplacePlugin(pluginId: string, root = process.cwd()) {
  const store = await load(root);
  return store.plugins.find((p) => p.pluginId === normalizeKey(pluginId)) ?? null;
}

export function marketplaceHonesty() {
  return {
    banner: HONESTY_BANNER,
    L4_AUTONOMY_ENABLED: BX_LOCKS.L4_AUTONOMY_ENABLED,
    installGrantsAuthority: BX_LOCKS.MARKETPLACE_INSTALL_GRANTS_AUTHORITY,
    silentEnroll: BX_LOCKS.SILENT_ARBITRARY_DEVICE_ENROLL,
    productionAuthorization: BX_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}
