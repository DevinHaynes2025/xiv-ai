import { createHash } from 'node:crypto';

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import type { MemoryPartition } from './memory-cortex';

/** Logical neural-relationship ceiling. Addressable, not materialized. */
export const LOGICAL_RELATIONSHIP_CEILING = 1_000_000_000_000;
export const MATERIALIZED_RELATION_BUDGET = 10_000;
export const MATERIALIZED_PROCESS_BUDGET = 0;
export const LOGICAL_ADDRESS_SHARDS = 4096;

export type LogicalNeuralAddress = {
  scheme: 'xiv-lna';
  iri: string;
  tenantId: string;
  universeId: string;
  partition: MemoryPartition;
  region: number;
  slot: number;
  materialized: false;
};

export type MaterializedRelation = {
  id: string;
  iri: string;
  tenantId: string;
  universeId: string;
  fromIri: string;
  toIri: string;
  relation: string;
  evidenceRefs: string[];
  createdAt: string;
};

type AddressStore = { relations: MaterializedRelation[] };

function storePath(root: string) {
  return xivLocalPath(root, 'sparse-logical-relations.json');
}

function clampSlot(slot: number) {
  if (!Number.isInteger(slot) || slot < 0 || slot >= LOGICAL_RELATIONSHIP_CEILING) {
    throw new Error('LOGICAL_SLOT_OUT_OF_ADDRESS_SPACE');
  }
  return slot;
}

export function regionForSlot(slot: number) {
  return clampSlot(slot) % LOGICAL_ADDRESS_SHARDS;
}

export function encodeLogicalAddress(input: {
  tenantId: string;
  universeId: string;
  partition: MemoryPartition;
  slot: number;
}): LogicalNeuralAddress {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const slot = clampSlot(input.slot);
  const region = regionForSlot(slot);
  const iri = `xiv-lna://${encodeURIComponent(input.tenantId)}/${encodeURIComponent(input.universeId)}/${input.partition}/${region}/${slot}`;
  return {
    scheme: 'xiv-lna',
    iri,
    tenantId: input.tenantId,
    universeId: input.universeId,
    partition: input.partition,
    region,
    slot,
    materialized: false,
  };
}

export function addressHash(iri: string) {
  return createHash('sha256').update(iri).digest('hex');
}

async function load(root: string): Promise<AddressStore> {
  const parsed = await readJsonFile<AddressStore>(storePath(root), { relations: [] });
  return { relations: Array.isArray(parsed.relations) ? parsed.relations : [] };
}

export async function sparseAddressStats(root = process.cwd()) {
  const store = await load(root);
  return {
    logicalRelationshipCeiling: LOGICAL_RELATIONSHIP_CEILING,
    logicalShards: LOGICAL_ADDRESS_SHARDS,
    materializedRelations: store.relations.length,
    materializedProcesses: MATERIALIZED_PROCESS_BUDGET,
    materializedRowsBounded: store.relations.length <= MATERIALIZED_RELATION_BUDGET,
    trillionRowsMaterialized: false as const,
    productionAuthorization: false as const,
  };
}

/**
 * Address a slot anywhere in the logical ceiling. This never writes a row.
 * Trillion-scale means the IRI exists; it does not allocate a process or database row.
 */
export function addressLogicalRelationship(input: {
  tenantId: string;
  universeId: string;
  partition: MemoryPartition;
  slot: number;
}) {
  const address = encodeLogicalAddress(input);
  return {
    address,
    materialized: false as const,
    materializedRowWritten: false as const,
    processSpawned: false as const,
    hash: addressHash(address.iri),
  };
}

export async function materializeRelationIfBudgeted(input: {
  tenantId: string;
  universeId: string;
  fromIri: string;
  toIri: string;
  relation: string;
  evidenceRefs: string[];
  root?: string;
}): Promise<
  | { materialized: true; record: MaterializedRelation; overBudget: false }
  | { materialized: false; overBudget: true; reason: string; materializedCount: number }
> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (input.evidenceRefs.length === 0) {
    return {
      materialized: false,
      overBudget: true,
      reason: 'Materializing a neural relation requires verified evidence refs. Agreement is not evidence.',
      materializedCount: (await load(input.root ?? process.cwd())).relations.length,
    };
  }
  const root = input.root ?? process.cwd();
  const store = await load(root);
  const existing = store.relations.find(
    (item) =>
      item.tenantId === input.tenantId &&
      item.universeId === input.universeId &&
      item.fromIri === input.fromIri &&
      item.toIri === input.toIri &&
      item.relation === input.relation,
  );
  if (existing) return { materialized: true, record: existing, overBudget: false };
  if (store.relations.length >= MATERIALIZED_RELATION_BUDGET) {
    return {
      materialized: false,
      overBudget: true,
      reason: `Materialized relation budget ${MATERIALIZED_RELATION_BUDGET} reached. Logical addresses remain valid without new rows.`,
      materializedCount: store.relations.length,
    };
  }
  const record: MaterializedRelation = {
    id: `rel_${addressHash(`${input.fromIri}|${input.toIri}|${input.relation}`).slice(0, 16)}`,
    iri: `${input.fromIri}=>${input.toIri}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    fromIri: input.fromIri,
    toIri: input.toIri,
    relation: input.relation,
    evidenceRefs: [...input.evidenceRefs],
    createdAt: new Date().toISOString(),
  };
  store.relations.push(record);
  await writeJsonFileAtomic(storePath(root), { relations: store.relations.slice(-MATERIALIZED_RELATION_BUDGET) });
  return { materialized: true, record, overBudget: false };
}
