import { randomUUID } from 'node:crypto';

import { readCeoSealedRecord } from './ceo-sealed-vault';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import type { SealedActor } from './hybrid-edge-cloud-types';

export type AgenticRow = {
  id: string;
  tenantId: string;
  universeId: string;
  table: string;
  document: Record<string, unknown>;
  sealed: boolean;
  productionAuthorization: false;
  createdAt: string;
};

type DbStore = { rows: AgenticRow[] };

const MAX_ROWS = 10_000;

function dbPath(root: string) {
  return xivLocalPath(root, 'agentic-database.json');
}

export async function agenticPut(input: {
  tenantId: string;
  universeId: string;
  table: string;
  document: Record<string, unknown>;
  sealed?: boolean;
  root?: string;
}) {
  if (!input.tenantId || !input.universeId || !input.table.trim()) throw new Error('AGENTIC_DB_SCOPE_REQUIRED');
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<DbStore>(dbPath(root), { rows: [] });
  const rows = Array.isArray(store.rows) ? store.rows : [];
  const row: AgenticRow = {
    id: `adb_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    table: input.table.trim(),
    document: { ...input.document },
    sealed: input.sealed === true,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  rows.push(row);
  await writeJsonFileAtomic(dbPath(root), { rows: rows.slice(-MAX_ROWS) });
  return row;
}

export async function agenticQuery(input: {
  tenantId: string;
  universeId: string;
  table?: string;
  actor: SealedActor;
  root?: string;
}) {
  const store = await readJsonFile<DbStore>(dbPath(input.root ?? process.cwd()), { rows: [] });
  const rows = Array.isArray(store.rows) ? store.rows : [];
  const scoped = rows.filter(
    (row) =>
      row.tenantId === input.tenantId &&
      row.universeId === input.universeId &&
      (!input.table || row.table === input.table),
  );
  const visible: AgenticRow[] = [];
  for (const row of scoped) {
    if (!row.sealed) {
      visible.push(row);
      continue;
    }
    if (input.actor.kind !== 'ceo_principal') continue;
    visible.push(row);
  }
  return {
    rows: visible,
    hiddenSealed: scoped.filter((row) => row.sealed && input.actor.kind !== 'ceo_principal').length,
    productionWrite: false as const,
  };
}

export async function federateAgenticQuery(input: {
  tenantId: string;
  universeIds: string[];
  table?: string;
  actor: SealedActor;
  federated: boolean;
  root?: string;
}) {
  if (!input.federated) {
    return { state: 'DENIED' as const, rows: [], reason: 'Database federation requires an explicit logical Universe link.' };
  }
  const rows: AgenticRow[] = [];
  for (const universeId of input.universeIds) {
    const result = await agenticQuery({
      tenantId: input.tenantId,
      universeId,
      table: input.table,
      actor: input.actor,
      root: input.root,
    });
    rows.push(...result.rows);
  }
  return { state: 'AVAILABLE' as const, rows, productionWrite: false as const };
}

export async function denyProductionDatabaseWrite() {
  return {
    allowed: false as const,
    state: 'DENIED' as const,
    reason: 'Agentic databases are local/logical only. Production database writes are denied.',
    productionAuthorization: false as const,
  };
}

export async function sealedRowRequiresVault(input: {
  recordId: string;
  tenantId: string;
  universeId: string;
  actor: SealedActor;
  root?: string;
}) {
  return readCeoSealedRecord(input);
}
