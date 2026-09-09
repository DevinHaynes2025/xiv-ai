import { SEALED_REDACTION } from './ceo-sealed-vault';
import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import { markInstallOrSync } from './compromised-node-quarantine';
import { isFederated } from './logical-universe-graph';
import type { PackageKind } from './distributed-app-network-types';

export const UNIVERSE_SYNC_FILE = 'peer-universe-sync.json';

export type SyncRecord = {
  id: string;
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  address: string;
  kind: PackageKind;
  version: number;
  updatedAt: string;
  sealed: false;
};

export type ConflictResolution = {
  winner: SyncRecord;
  loser: SyncRecord;
  rule: 'higher_version' | 'lexicographic_address';
  sealedExcluded: true;
};

type SyncStore = { records: SyncRecord[]; conflicts: ConflictResolution[] };

function storePath(root: string) {
  return xivLocalPath(root, UNIVERSE_SYNC_FILE);
}

async function load(root: string): Promise<SyncStore> {
  const parsed = await readJsonFile<SyncStore>(storePath(root), { records: [], conflicts: [] });
  return {
    records: Array.isArray(parsed.records) ? parsed.records : [],
    conflicts: Array.isArray(parsed.conflicts) ? parsed.conflicts : [],
  };
}

async function save(root: string, store: SyncStore) {
  await writeJsonFileAtomic(storePath(root), {
    records: store.records.slice(-4_000),
    conflicts: store.conflicts.slice(-1_000),
  });
}

function pickWinner(left: SyncRecord, right: SyncRecord): ConflictResolution {
  if (left.version !== right.version) {
    const winner = left.version > right.version ? left : right;
    const loser = winner === left ? right : left;
    return { winner, loser, rule: 'higher_version', sealedExcluded: true };
  }
  const winner = left.address >= right.address ? left : right;
  const loser = winner === left ? right : left;
  return { winner, loser, rule: 'lexicographic_address', sealedExcluded: true };
}

export async function syncPeerUniverseRecord(input: {
  tenantId: string;
  fromUniverseId: string;
  toUniverseId: string;
  address: string;
  kind: PackageKind;
  version: number;
  sealed?: boolean;
  nodeId?: string;
  root?: string;
}) {
  if (!input.tenantId || !input.fromUniverseId || !input.toUniverseId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const root = input.root ?? process.cwd();
  if (input.sealed) {
    return {
      synced: false as const,
      state: 'DENIED' as const,
      reason: 'CEO Sealed Vault stays outside ordinary Universe synchronization.',
      redacted: SEALED_REDACTION,
    };
  }
  if (input.fromUniverseId !== input.toUniverseId) {
    const federated = await isFederated({
      tenantId: input.tenantId,
      fromUniverseId: input.fromUniverseId,
      toUniverseId: input.toUniverseId,
      root,
    });
    if (!federated) {
      return { synced: false as const, state: 'DENIED' as const, reason: 'Peer Universe sync requires an explicit logical federation link.' };
    }
  }
  const incoming: SyncRecord = {
    id: `${input.toUniverseId}:${input.address}`,
    tenantId: input.tenantId,
    fromUniverseId: input.fromUniverseId,
    toUniverseId: input.toUniverseId,
    address: input.address,
    kind: input.kind,
    version: input.version,
    updatedAt: new Date().toISOString(),
    sealed: false,
  };
  const store = await load(root);
  const existing = store.records.find(
    (item) =>
      item.tenantId === input.tenantId &&
      item.toUniverseId === input.toUniverseId &&
      item.address === input.address,
  );
  let conflict: ConflictResolution | null = null;
  if (existing) {
    conflict = pickWinner(existing, incoming);
    store.conflicts.push(conflict);
    store.records = store.records.filter((item) => item !== existing);
    store.records.push(conflict.winner);
  } else {
    store.records.push(incoming);
  }
  await save(root, store);
  const authority = input.nodeId
    ? await markInstallOrSync({
        nodeId: input.nodeId,
        tenantId: input.tenantId,
        universeId: input.fromUniverseId,
        kind: 'sync',
        root,
      })
    : { authorityGranted: false as const, l4AutonomyEnabled: false as const, reason: 'Sync never grants authority.' };
  return {
    synced: true as const,
    state: 'PASS' as const,
    record: existing ? conflict!.winner : incoming,
    conflict,
    authorityGranted: authority.authorityGranted,
    reason: authority.reason,
  };
}

export async function listUniverseSync(root = process.cwd()) {
  return load(root);
}
