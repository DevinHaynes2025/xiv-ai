/**
 * 62L-BX Global Semiconductor Digital Twin —
 * Supply and lifecycle intelligence twin (sim/model with honesty labels).
 * Twin inventory ≠ verified physical inventory unless evidence says so.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  BX_LOCKS,
  HONESTY_BANNER,
  TWIN_NOT_PHYSICAL_VERIFIED,
  TRILLION_LOGICAL_ONLY,
  type BxActor,
  type InventoryHonestyLabel,
} from './neural-chip-os-semiconductor-twin-types';

export type TwinInventoryNode = {
  id: string;
  sku: string;
  familyKey: string;
  lifecycleStage: 'design' | 'fab' | 'test' | 'package' | 'deploy' | 'eol' | 'simulated';
  quantityLogical: number;
  honestyLabel: InventoryHonestyLabel;
  physicalEvidenceRefs: string[];
  productionAuthorized: false;
  createdAt: string;
  actorId: string;
};

export type TwinAddressSpace = {
  id: string;
  scaleClaim: 'trillion_logical' | 'benchmark_proven_physical';
  addressCountLogical: number;
  honestyLabel: 'LOGICAL' | 'PHYSICAL_CAPACITY_PROVEN';
  benchmarkEvidenceRefs: string[];
  note: string;
};

type Store = {
  inventory: TwinInventoryNode[];
  addressSpaces: TwinAddressSpace[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'semiconductor-digital-twin.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { inventory: [], addressSpaces: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Upsert twin inventory — without physical evidence stays MODEL_ONLY/SIMULATED, never PHYSICAL_VERIFIED. */
export async function upsertTwinInventory(input: {
  sku: string;
  familyKey: string;
  lifecycleStage: TwinInventoryNode['lifecycleStage'];
  quantityLogical: number;
  physicalEvidenceRefs?: string[];
  claimPhysicalVerified?: boolean;
  actor: BxActor;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const evidence = input.physicalEvidenceRefs ?? [];

  if (input.claimPhysicalVerified && evidence.length === 0) {
    return {
      accepted: false as const,
      reason: TWIN_NOT_PHYSICAL_VERIFIED,
      honestyLabel: 'MODEL_ONLY' as const,
      labeledPhysicalVerified: false as const,
    };
  }

  let honestyLabel: InventoryHonestyLabel = 'MODEL_ONLY';
  if (evidence.length > 0 && input.claimPhysicalVerified) {
    honestyLabel = 'PHYSICAL_VERIFIED';
  } else if (evidence.length > 0) {
    honestyLabel = 'EVIDENCE_BACKED';
  } else if (input.lifecycleStage === 'simulated') {
    honestyLabel = 'SIMULATED';
  } else {
    honestyLabel = 'MODEL_ONLY';
  }

  const node: TwinInventoryNode = {
    id: id('twin'),
    sku: input.sku.trim(),
    familyKey: input.familyKey.trim().toLowerCase(),
    lifecycleStage: input.lifecycleStage,
    quantityLogical: Math.max(0, Math.floor(input.quantityLogical)),
    honestyLabel,
    physicalEvidenceRefs: evidence,
    productionAuthorized: false,
    createdAt: new Date().toISOString(),
    actorId: input.actor.id,
  };

  store.inventory.push(node);
  if (store.inventory.length > 5_000) store.inventory = store.inventory.slice(-5_000);
  await save(root, store);

  return {
    accepted: true as const,
    node,
    labeledPhysicalVerified: honestyLabel === 'PHYSICAL_VERIFIED',
    reason: honestyLabel === 'PHYSICAL_VERIFIED' ? null : TWIN_NOT_PHYSICAL_VERIFIED,
  };
}

/** Register trillion-scale addressing — logical/simulated unless benchmark proves physical capacity. */
export async function registerTwinAddressSpace(input: {
  addressCountLogical: number;
  claimPhysicalCapacity?: boolean;
  benchmarkEvidenceRefs?: string[];
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const evidence = input.benchmarkEvidenceRefs ?? [];

  if (input.claimPhysicalCapacity && evidence.length === 0) {
    const space: TwinAddressSpace = {
      id: id('addr'),
      scaleClaim: 'trillion_logical',
      addressCountLogical: input.addressCountLogical,
      honestyLabel: 'LOGICAL',
      benchmarkEvidenceRefs: [],
      note: TRILLION_LOGICAL_ONLY,
    };
    store.addressSpaces.push(space);
    await save(root, store);
    return {
      accepted: true as const,
      space,
      physicalCapacityProven: false as const,
      reason: TRILLION_LOGICAL_ONLY,
    };
  }

  const proven = Boolean(input.claimPhysicalCapacity && evidence.length > 0);
  const space: TwinAddressSpace = {
    id: id('addr'),
    scaleClaim: proven ? 'benchmark_proven_physical' : 'trillion_logical',
    addressCountLogical: input.addressCountLogical,
    honestyLabel: proven ? 'PHYSICAL_CAPACITY_PROVEN' : 'LOGICAL',
    benchmarkEvidenceRefs: evidence,
    note: proven
      ? 'Physical capacity claimed only with benchmark evidence refs.'
      : TRILLION_LOGICAL_ONLY,
  };
  store.addressSpaces.push(space);
  await save(root, store);
  return {
    accepted: true as const,
    space,
    physicalCapacityProven: proven,
    reason: proven ? null : TRILLION_LOGICAL_ONLY,
  };
}

export async function listTwinInventory(root = process.cwd()) {
  const store = await load(root);
  return store.inventory;
}

export function semiconductorTwinHonesty() {
  return {
    banner: HONESTY_BANNER,
    L4_AUTONOMY_ENABLED: BX_LOCKS.L4_AUTONOMY_ENABLED,
    twinInventoryPhysicalByDefault: BX_LOCKS.TWIN_INVENTORY_IS_PHYSICAL_VERIFIED_BY_DEFAULT,
    trillionIsPhysicalCapacity: BX_LOCKS.TRILLION_ADDRESSING_IS_PHYSICAL_CAPACITY,
    productionAuthorization: BX_LOCKS.PRODUCTION_AUTHORIZATION,
  };
}
