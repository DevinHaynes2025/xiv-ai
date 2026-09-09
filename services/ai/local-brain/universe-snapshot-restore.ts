import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { CEO_SEALED_VAULT_FILE } from './ceo-sealed-vault';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';

export type SnapshotKind = 'local_restore' | 'distributable';

export type UniverseSnapshot = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: SnapshotKind;
  includesSealedVault: boolean;
  files: string[];
  payload: Record<string, unknown>;
  productionAuthorization: false;
  createdAt: string;
};

type SnapshotStore = { snapshots: UniverseSnapshot[] };

const SNAPSHOT_FILES = [
  'universe-os-kernel.json',
  'offline-service-fabric.json',
  'distributed-memory-journal.json',
  'logical-universe-graph.json',
  'agentic-database.json',
  'learning-ledger.json',
] as const;

function storePath(root: string) {
  return xivLocalPath(root, 'universe-snapshots.json');
}

async function tryReadJson(root: string, file: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(xivLocalPath(root, file), 'utf8'));
  } catch {
    return null;
  }
}

export async function snapshotUniverse(input: {
  tenantId: string;
  universeId: string;
  kind: SnapshotKind;
  root?: string;
}): Promise<UniverseSnapshot> {
  if (!input.tenantId || !input.universeId) throw new Error('SNAPSHOT_SCOPE_REQUIRED');
  const root = input.root ?? process.cwd();
  const files = [...SNAPSHOT_FILES];
  const includeSealed = input.kind === 'local_restore';
  if (includeSealed) files.push(CEO_SEALED_VAULT_FILE);
  const payload: Record<string, unknown> = {};
  for (const file of files) {
    payload[file] = await tryReadJson(root, file);
  }
  const snapshot: UniverseSnapshot = {
    id: `snap_${randomUUID()}`,
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: input.kind,
    includesSealedVault: includeSealed,
    files,
    payload,
    productionAuthorization: false,
    createdAt: new Date().toISOString(),
  };
  const store = await readJsonFile<SnapshotStore>(storePath(root), { snapshots: [] });
  const snapshots = Array.isArray(store.snapshots) ? store.snapshots : [];
  snapshots.push(snapshot);
  await writeJsonFileAtomic(storePath(root), { snapshots: snapshots.slice(-200) });
  return snapshot;
}

export async function restoreUniverse(input: {
  snapshotId: string;
  tenantId: string;
  universeId: string;
  root?: string;
}) {
  const root = input.root ?? process.cwd();
  const store = await readJsonFile<SnapshotStore>(storePath(root), { snapshots: [] });
  const snapshot = (store.snapshots ?? []).find(
    (item) =>
      item.id === input.snapshotId &&
      item.tenantId === input.tenantId &&
      item.universeId === input.universeId,
  );
  if (!snapshot) {
    return { restored: false as const, reason: 'SNAPSHOT_NOT_FOUND' };
  }
  for (const file of snapshot.files) {
    const value = snapshot.payload[file];
    if (value === null || value === undefined) continue;
    if (file === CEO_SEALED_VAULT_FILE && snapshot.kind === 'distributable') continue;
    await writeJsonFileAtomic(xivLocalPath(root, file), value);
  }
  return {
    restored: true as const,
    snapshotId: snapshot.id,
    includesSealedVault: snapshot.includesSealedVault && snapshot.kind === 'local_restore',
    kind: snapshot.kind,
  };
}

export async function listSnapshots(input: { tenantId: string; universeId: string; root?: string }) {
  const store = await readJsonFile<SnapshotStore>(storePath(input.root ?? process.cwd()), { snapshots: [] });
  return (store.snapshots ?? []).filter(
    (item) => item.tenantId === input.tenantId && item.universeId === input.universeId,
  );
}
