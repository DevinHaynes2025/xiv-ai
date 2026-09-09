/**
 * 62L-DP Offline Plugin Runtime —
 * Offline plugin runtimes with honest fallbacks; no inventing live cloud.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  OFFLINE_NO_INVENTED_CLOUD,
  type DpActor,
} from './plugin-civilization-os-types';

export type OfflineRuntime = {
  id: string;
  pluginId: string;
  cloudConfigured: boolean;
  mode: 'local_only' | 'cloud_enabled';
  reason: string;
  createdAt: string;
};

export type OfflineProbe = {
  id: string;
  runtimeId: string;
  claimedLiveCloud: boolean;
  status: 'denied' | 'local_only' | 'cloud_ok';
  cloudAvailability: 'UNAVAILABLE' | 'LOCAL_ONLY' | 'CONFIGURED';
  reason: string;
  at: string;
};

type Store = {
  runtimes: OfflineRuntime[];
  probes: OfflineProbe[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'offline-plugin-runtime.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { runtimes: [], probes: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function offlinePluginRuntimeHonesty() {
  return {
    inventsLiveCloudWhenUnconfigured: false,
    offlineFallbacksHonest: true,
    localFirst: true,
  };
}

export async function createOfflinePluginRuntime(input: {
  pluginId: string;
  cloudConfigured?: boolean;
  root: string;
  actor: DpActor;
}): Promise<OfflineRuntime> {
  const store = await load(input.root);
  void input.actor;
  const cloudConfigured = input.cloudConfigured === true;
  const runtime: OfflineRuntime = {
    id: id('dpoff'),
    pluginId: input.pluginId,
    cloudConfigured,
    mode: cloudConfigured ? 'cloud_enabled' : 'local_only',
    reason: cloudConfigured ? 'OFFLINE_RUNTIME_CLOUD_CONFIGURED' : 'OFFLINE_RUNTIME_LOCAL_ONLY',
    createdAt: new Date().toISOString(),
  };
  store.runtimes.push(runtime);
  await save(input.root, store);
  return runtime;
}

export async function probeOfflineCloudClaim(input: {
  runtimeId: string;
  claimLiveCloudAvailable: boolean;
  root: string;
  actor: DpActor;
}): Promise<OfflineProbe> {
  const store = await load(input.root);
  void input.actor;
  const runtime = store.runtimes.find((r) => r.id === input.runtimeId);
  const now = new Date().toISOString();

  if (input.claimLiveCloudAvailable && (!runtime || !runtime.cloudConfigured)) {
    const probe: OfflineProbe = {
      id: id('dpoffp'),
      runtimeId: input.runtimeId,
      claimedLiveCloud: true,
      status: 'denied',
      cloudAvailability: 'UNAVAILABLE',
      reason: OFFLINE_NO_INVENTED_CLOUD,
      at: now,
    };
    store.probes.push(probe);
    await save(input.root, store);
    return probe;
  }

  const probe: OfflineProbe = {
    id: id('dpoffp'),
    runtimeId: input.runtimeId,
    claimedLiveCloud: input.claimLiveCloudAvailable,
    status: runtime?.cloudConfigured ? 'cloud_ok' : 'local_only',
    cloudAvailability: runtime?.cloudConfigured ? 'CONFIGURED' : 'LOCAL_ONLY',
    reason: runtime?.cloudConfigured
      ? 'OFFLINE_RUNTIME_CLOUD_CONFIGURED_OK'
      : 'OFFLINE_FALLBACK_LOCAL_ONLY',
    at: now,
  };
  store.probes.push(probe);
  await save(input.root, store);
  return probe;
}
