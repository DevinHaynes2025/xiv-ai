/**
 * 62L-CR C — Multi-Cloud Storage Nervous System
 * AWS/GCP/local storage placement and recovery; defensive cloud-leak monitoring.
 * Unconfigured cloud → DENIED/UNAVAILABLE. Sealed never silent AWS/GCP.
 * Leak intake of stolen/restricted DENIED; monitoring defensive-only.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  CR_LOCKS,
  HONESTY_BANNER,
  LEAKED_INTAKE_DENIED,
  OFFENSIVE_HARVEST_DENIED,
  SEALED_SILENT_CLOUD_DENIED,
  UNCONFIGURED_STORAGE_DENIED,
  type CrActor,
} from './hybrid-supercompute-universe-os-types';

export type StorageProvider = 'local' | 'aws' | 'gcp';

export type StorageEndpoint = {
  id: string;
  provider: StorageProvider;
  configured: boolean;
  authorized: boolean;
  label: 'AVAILABLE' | 'UNAVAILABLE';
  reason: string;
};

export type PlacementAttempt = {
  id: string;
  provider: StorageProvider;
  contentMode: 'open' | 'sealed' | 'local_only';
  silentCloudFallbackRequested: boolean;
  status: 'placed' | 'denied' | 'unavailable';
  reason: string;
  at: string;
};

export type RecoveryAttempt = {
  id: string;
  provider: StorageProvider;
  status: 'recovered' | 'denied' | 'unavailable';
  reason: string;
  at: string;
};

export type LeakIntakeAttempt = {
  id: string;
  sourceClass: 'authorized_monitor' | 'stolen' | 'restricted' | 'leaked' | 'unknown';
  offensiveHarvestRequested: boolean;
  status: 'accepted_defensive' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  endpoints: StorageEndpoint[];
  placements: PlacementAttempt[];
  recoveries: RecoveryAttempt[];
  leakIntakes: LeakIntakeAttempt[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'multi-cloud-storage-nervous-system.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), {
    endpoints: [],
    placements: [],
    recoveries: [],
    leakIntakes: [],
  });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function storageNervousHonesty() {
  return {
    banner: HONESTY_BANNER,
    requiresConfiguredAuthorized: CR_LOCKS.STORAGE_REQUIRES_CONFIGURED_AUTHORIZED,
    unconfiguredPlacement: CR_LOCKS.UNCONFIGURED_CLOUD_PLACEMENT,
    sealedSilentAwsGcp: CR_LOCKS.SEALED_SILENT_AWS_GCP_FALLBACK,
    leakMonitorDefensiveOnly: CR_LOCKS.LEAK_MONITOR_DEFENSIVE_ONLY,
    offensiveHarvest: CR_LOCKS.OFFENSIVE_HARVEST_ALLOWED,
    leakedIntakeAllowed: CR_LOCKS.LEAKED_STOLEN_RESTRICTED_INTAKE_ALLOWED,
  };
}

export async function registerStorageEndpoint(input: {
  provider: StorageProvider;
  configured?: boolean;
  authorized?: boolean;
  root: string;
  actor: CrActor;
}): Promise<StorageEndpoint> {
  const store = await load(input.root);
  const configured = input.configured === true || input.provider === 'local';
  const authorized = input.authorized === true || input.provider === 'local';
  const ok = configured && authorized;
  const endpoint: StorageEndpoint = {
    id: id('stor'),
    provider: input.provider,
    configured,
    authorized,
    label: ok ? 'AVAILABLE' : 'UNAVAILABLE',
    reason: ok
      ? 'STORAGE_ENDPOINT_CONFIGURED_AUTHORIZED'
      : UNCONFIGURED_STORAGE_DENIED,
  };
  void input.actor;
  store.endpoints.push(endpoint);
  await save(input.root, store);
  return endpoint;
}

export async function placeStorage(input: {
  provider: StorageProvider;
  contentMode?: PlacementAttempt['contentMode'];
  silentCloudFallbackRequested?: boolean;
  root: string;
  actor: CrActor;
}): Promise<PlacementAttempt> {
  const store = await load(input.root);
  const contentMode = input.contentMode ?? 'open';
  const silent = input.silentCloudFallbackRequested === true;

  if (
    (contentMode === 'sealed' || contentMode === 'local_only') &&
    silent &&
    (input.provider === 'aws' || input.provider === 'gcp')
  ) {
    const denied: PlacementAttempt = {
      id: id('place'),
      provider: input.provider,
      contentMode,
      silentCloudFallbackRequested: true,
      status: 'denied',
      reason: SEALED_SILENT_CLOUD_DENIED,
      at: new Date().toISOString(),
    };
    void input.actor;
    store.placements.push(denied);
    await save(input.root, store);
    return denied;
  }

  const endpoint = store.endpoints.find(
    (e) => e.provider === input.provider && e.label === 'AVAILABLE',
  );
  if (!endpoint && input.provider !== 'local') {
    const unavailable: PlacementAttempt = {
      id: id('place'),
      provider: input.provider,
      contentMode,
      silentCloudFallbackRequested: silent,
      status: 'unavailable',
      reason: UNCONFIGURED_STORAGE_DENIED,
      at: new Date().toISOString(),
    };
    store.placements.push(unavailable);
    await save(input.root, store);
    return unavailable;
  }

  const placed: PlacementAttempt = {
    id: id('place'),
    provider: input.provider,
    contentMode,
    silentCloudFallbackRequested: silent,
    status: 'placed',
    reason:
      input.provider === 'local'
        ? 'LOCAL_STORAGE_PLACED'
        : 'CONFIGURED_AUTHORIZED_CLOUD_STORAGE_PLACED',
    at: new Date().toISOString(),
  };
  store.placements.push(placed);
  await save(input.root, store);
  return placed;
}

export async function recoverStorage(input: {
  provider: StorageProvider;
  root: string;
  actor: CrActor;
}): Promise<RecoveryAttempt> {
  const store = await load(input.root);
  const endpoint = store.endpoints.find(
    (e) => e.provider === input.provider && e.label === 'AVAILABLE',
  );
  const attempt: RecoveryAttempt = {
    id: id('recv'),
    provider: input.provider,
    status:
      endpoint || input.provider === 'local' ? 'recovered' : 'unavailable',
    reason:
      endpoint || input.provider === 'local'
        ? 'STORAGE_RECOVERY_FROM_CONFIGURED_ENDPOINT'
        : UNCONFIGURED_STORAGE_DENIED,
    at: new Date().toISOString(),
  };
  void input.actor;
  store.recoveries.push(attempt);
  await save(input.root, store);
  return attempt;
}

export async function intakeLeakSignal(input: {
  sourceClass: LeakIntakeAttempt['sourceClass'];
  offensiveHarvestRequested?: boolean;
  root: string;
  actor: CrActor;
}): Promise<LeakIntakeAttempt> {
  const store = await load(input.root);
  if (input.offensiveHarvestRequested === true) {
    const denied: LeakIntakeAttempt = {
      id: id('leak'),
      sourceClass: input.sourceClass,
      offensiveHarvestRequested: true,
      status: 'denied',
      reason: OFFENSIVE_HARVEST_DENIED,
      at: new Date().toISOString(),
    };
    void input.actor;
    store.leakIntakes.push(denied);
    await save(input.root, store);
    return denied;
  }
  if (
    input.sourceClass === 'stolen' ||
    input.sourceClass === 'restricted' ||
    input.sourceClass === 'leaked'
  ) {
    const denied: LeakIntakeAttempt = {
      id: id('leak'),
      sourceClass: input.sourceClass,
      offensiveHarvestRequested: false,
      status: 'denied',
      reason: LEAKED_INTAKE_DENIED,
      at: new Date().toISOString(),
    };
    store.leakIntakes.push(denied);
    await save(input.root, store);
    return denied;
  }
  const accepted: LeakIntakeAttempt = {
    id: id('leak'),
    sourceClass: input.sourceClass,
    offensiveHarvestRequested: false,
    status: 'accepted_defensive',
    reason: 'DEFENSIVE_CLOUD_LEAK_MONITOR_ONLY',
    at: new Date().toISOString(),
  };
  store.leakIntakes.push(accepted);
  await save(input.root, store);
  return accepted;
}
