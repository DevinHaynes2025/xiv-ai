import { createHash, randomUUID } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { providerSlots } from './provider-fabric';
import { createBrainSnapshot, listBrainSnapshots, type BrainSnapshot } from './cognitive-memory-chip';
import {
  BD_LOCKS,
  DEGRADED_CONTRACT,
  OFFLINE_BOOT_OK,
  UNVERIFIED_PROVIDER,
} from './cognitive-memory-types';

export const OFFLINE_FABRIC_FILE = 'persistent-offline-brain-fabric.json';

export type OfflineBootMode = 'cold' | 'warm_snapshot' | 'degraded';

export type OfflineBootRecord = {
  id: string;
  tenantId: string;
  universeId: string;
  mode: OfflineBootMode;
  at: string;
  liveProvidersRequired: false;
  liveProvidersUsed: false;
  snapshotId?: string;
  degraded: boolean;
  reason: string;
  productionAuthorization: false;
};

export type DegradedContract = {
  id: string;
  tenantId: string;
  universeId: string;
  capabilities: string[];
  deniedCapabilities: string[];
  inventLiveProviderAvailability: false;
  at: string;
};

type FabricStore = {
  boots: OfflineBootRecord[];
  contracts: DegradedContract[];
  restoredSnapshotIds: string[];
};

function fabricPath(root: string) {
  return xivLocalPath(root, OFFLINE_FABRIC_FILE);
}

async function load(root: string): Promise<FabricStore> {
  const parsed = await readJsonFile<FabricStore>(fabricPath(root), {
    boots: [],
    contracts: [],
    restoredSnapshotIds: [],
  });
  return {
    boots: Array.isArray(parsed.boots) ? parsed.boots : [],
    contracts: Array.isArray(parsed.contracts) ? parsed.contracts : [],
    restoredSnapshotIds: Array.isArray(parsed.restoredSnapshotIds) ? parsed.restoredSnapshotIds : [],
  };
}

async function save(root: string, store: FabricStore) {
  await writeJsonFileAtomic(fabricPath(root), {
    boots: store.boots.slice(-2_000),
    contracts: store.contracts.slice(-2_000),
    restoredSnapshotIds: store.restoredSnapshotIds.slice(-2_000),
  });
}

export function observeProvidersHonesty() {
  const slots = providerSlots();
  const observed = Object.fromEntries(
    slots.map((slot) => [
      slot.provider,
      {
        state: slot.state ?? 'UNAVAILABLE',
        verified: false,
        inventedAvailability: false,
      },
    ]),
  );
  return {
    reason: UNVERIFIED_PROVIDER,
    providersUnavailableUntilVerified: BD_LOCKS.PROVIDERS_UNAVAILABLE_UNTIL_VERIFIED,
    observed,
    inventLiveProviderAvailability: false as const,
  };
}

/**
 * True offline boot: no live providers required or invented.
 */
export async function offlineBoot(input: {
  tenantId: string;
  universeId: string;
  mode?: OfflineBootMode;
  snapshotId?: string;
  root?: string;
  now?: number;
}) {
  if (!input.tenantId || !input.universeId) {
    return { ok: false as const, reason: 'TENANT_AND_UNIVERSE_REQUIRED' };
  }
  const root = input.root ?? process.cwd();
  const providers = observeProvidersHonesty();
  const mode = input.mode ?? (input.snapshotId ? 'warm_snapshot' : 'cold');

  let snapshot: BrainSnapshot | undefined;
  if (mode === 'warm_snapshot' || input.snapshotId) {
    const snaps = await listBrainSnapshots(root, input.tenantId, input.universeId);
    snapshot = input.snapshotId
      ? snaps.find((item) => item.id === input.snapshotId)
      : snaps[snaps.length - 1];
    if (!snapshot) {
      return {
        ok: false as const,
        reason: 'SNAPSHOT_MISSING',
        providers,
      };
    }
  }

  const record: OfflineBootRecord = {
    id: `boot_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    mode,
    at: new Date(input.now ?? Date.now()).toISOString(),
    liveProvidersRequired: false,
    liveProvidersUsed: false,
    snapshotId: snapshot?.id,
    degraded: mode === 'degraded',
    reason: OFFLINE_BOOT_OK,
    productionAuthorization: false,
  };

  const store = await load(root);
  store.boots.push(record);
  if (snapshot) store.restoredSnapshotIds.push(snapshot.id);
  await save(root, store);

  return {
    ok: true as const,
    record,
    snapshot,
    providers,
    reason: OFFLINE_BOOT_OK,
  };
}

export async function restoreBrainSnapshot(input: {
  tenantId: string;
  universeId: string;
  snapshotId: string;
  root?: string;
}) {
  const boot = await offlineBoot({
    tenantId: input.tenantId,
    universeId: input.universeId,
    mode: 'warm_snapshot',
    snapshotId: input.snapshotId,
    root: input.root,
  });
  return boot;
}

export async function enterDegradedOperation(input: {
  tenantId: string;
  universeId: string;
  root?: string;
  now?: number;
}) {
  const root = input.root ?? process.cwd();
  const providers = observeProvidersHonesty();
  const contract: DegradedContract = {
    id: `deg_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    capabilities: [
      'bounded_local_context',
      'local_agent_memory',
      'intelligent_cache_hash',
      'brain_snapshot_restore',
      'neural_bus_same_universe',
      'permissioned_knowledge_routes',
    ],
    deniedCapabilities: [
      'invent_live_provider_availability',
      'production_deploy',
      'authority_transfer',
      'founder_sealed_exfiltration',
      'trust_auth_bypass_wormhole',
    ],
    inventLiveProviderAvailability: false,
    at: new Date(input.now ?? Date.now()).toISOString(),
  };

  const boot = await offlineBoot({
    tenantId: input.tenantId,
    universeId: input.universeId,
    mode: 'degraded',
    root,
    now: input.now,
  });

  const store = await load(root);
  store.contracts.push(contract);
  await save(root, store);

  return {
    ok: boot.ok,
    contract,
    boot,
    providers,
    reason: DEGRADED_CONTRACT,
    inventLiveProviderAvailability: false as const,
  };
}

export async function ensureOfflineSnapshotSeed(input: {
  tenantId: string;
  universeId: string;
  label?: string;
  root?: string;
}) {
  const existing = await listBrainSnapshots(input.root, input.tenantId, input.universeId);
  if (existing.length > 0) return existing[existing.length - 1];
  return createBrainSnapshot({
    tenantId: input.tenantId,
    universeId: input.universeId,
    label: input.label ?? 'offline-seed',
    payload: `offline-seed:${input.tenantId}:${input.universeId}:${createHash('sha256').update('seed').digest('hex').slice(0, 12)}`,
    root: input.root,
  });
}

export async function listOfflineBoots(root = process.cwd()) {
  return (await load(root)).boots;
}

export function offlineFabricHonesty() {
  return {
    locks: BD_LOCKS,
    offlineBootWithoutLiveProviders: true as const,
    inventLiveProviderAvailability: false as const,
    productionAuthorization: false as const,
  };
}
