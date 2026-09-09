import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import {
  type EpistemicClass,
  type EconomyEvidenceState,
  HASH_REF_BYTES,
} from './information-economy-types';
import { findSkuByFingerprint, type InformationSku } from './information-skus';

export type InventoryPosition = {
  skuId: string;
  tenantId: string;
  universeId: string;
  onHandRefs: number;
  safetyRefs: number;
  lastDemandAt?: string;
  movementBytes: number;
};

export type DemandForecast = {
  fingerprint: string;
  trailingDemand: number;
  forecastUnits: number;
  epistemicClass: EpistemicClass;
  verifiedFact: false;
};

export type ReplenishmentOrder = {
  id: string;
  skuId?: string;
  fingerprint: string;
  needed: boolean;
  copyAllToOnePlace: false;
  movementBytes: number;
  state: EconomyEvidenceState;
  reason: string;
};

type InventoryStore = {
  positions: InventoryPosition[];
  demandLog: Array<{ fingerprint: string; at: string; tenantId: string; universeId: string }>;
};

function storePath(root: string) {
  return xivLocalPath(root, 'information-inventory.json');
}

async function load(root: string): Promise<InventoryStore> {
  const parsed = await readJsonFile<InventoryStore>(storePath(root), { positions: [], demandLog: [] });
  return {
    positions: Array.isArray(parsed.positions) ? parsed.positions : [],
    demandLog: Array.isArray(parsed.demandLog) ? parsed.demandLog : [],
  };
}

async function save(root: string, store: InventoryStore) {
  await writeJsonFileAtomic(storePath(root), {
    positions: store.positions.slice(-10_000),
    demandLog: store.demandLog.slice(-20_000),
  });
}

export async function recordInformationDemand(input: {
  tenantId: string;
  universeId: string;
  fingerprint: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await load(root);
  store.demandLog.push({
    fingerprint: input.fingerprint,
    at: new Date().toISOString(),
    tenantId: input.tenantId,
    universeId: input.universeId,
  });
  await save(root, store);
}

export async function lookupInformationInventory(input: {
  tenantId: string;
  universeId: string;
  query: string;
  root?: string;
}): Promise<{ hit: boolean; sku: InformationSku | null; movementBytes: number }> {
  const sku = await findSkuByFingerprint(input);
  return {
    hit: Boolean(sku) && !sku?.sealed,
    sku: sku ?? null,
    movementBytes: sku && !sku.sealed ? 0 : 0,
  };
}

export function forecastInformationDemand(trailing: number): DemandForecast {
  return {
    fingerprint: '',
    trailingDemand: trailing,
    forecastUnits: trailing,
    epistemicClass: 'FORECAST',
    verifiedFact: false,
  };
}

export async function forecastFromLog(input: {
  tenantId: string;
  universeId: string;
  fingerprint: string;
  root?: string;
}): Promise<DemandForecast> {
  const store = await load(input.root ?? process.cwd());
  const trailing = store.demandLog.filter(
    (item) =>
      item.fingerprint === input.fingerprint &&
      item.tenantId === input.tenantId &&
      item.universeId === input.universeId,
  ).length;
  return {
    fingerprint: input.fingerprint,
    trailingDemand: trailing,
    forecastUnits: trailing,
    epistemicClass: 'FORECAST',
    verifiedFact: false,
  };
}

export async function replenishInformation(input: {
  tenantId: string;
  universeId: string;
  fingerprint: string;
  sku?: InformationSku | null;
  copyAllToOnePlace?: boolean;
  root?: string;
}): Promise<ReplenishmentOrder> {
  if (input.copyAllToOnePlace) {
    return {
      id: cortexId('irep'),
      skuId: input.sku?.id,
      fingerprint: input.fingerprint,
      needed: false,
      copyAllToOnePlace: false,
      movementBytes: 0,
      state: 'DENIED',
      reason: 'Query-to-data is required. Brute-force copy-all-to-one-place replenishment is denied.',
    };
  }
  if (input.sku && !input.sku.sealed) {
    const root = input.root ?? process.cwd();
    const store = await load(root);
    let position = store.positions.find((item) => item.skuId === input.sku!.id);
    if (!position) {
      position = {
        skuId: input.sku.id,
        tenantId: input.tenantId,
        universeId: input.universeId,
        onHandRefs: input.sku.onHandRefs,
        safetyRefs: 1,
        movementBytes: 0,
      };
      store.positions.push(position);
    }
    position.onHandRefs += 1;
    position.lastDemandAt = new Date().toISOString();
    position.movementBytes = 0;
    await save(root, store);
    return {
      id: cortexId('irep'),
      skuId: input.sku.id,
      fingerprint: input.fingerprint,
      needed: false,
      copyAllToOnePlace: false,
      movementBytes: 0,
      state: 'PASS',
      reason: 'Inventory hit. Replenishment is a ref increment, not a payload copy.',
    };
  }
  return {
    id: cortexId('irep'),
    fingerprint: input.fingerprint,
    needed: true,
    copyAllToOnePlace: false,
    movementBytes: HASH_REF_BYTES,
    state: 'WAITING_DATA',
    reason: 'Stockout of this fingerprint. Qualify a local source; do not centralize raw data.',
  };
}

export async function listInventoryPositions(input: { tenantId: string; universeId: string; root?: string }) {
  const store = await load(input.root ?? process.cwd());
  return store.positions.filter((item) => item.tenantId === input.tenantId && item.universeId === input.universeId);
}
