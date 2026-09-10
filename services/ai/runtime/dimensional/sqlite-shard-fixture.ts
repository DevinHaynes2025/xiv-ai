/**
 * Local SQLite shard fixture — Pocket Brain metadata store for tests.
 * In-memory or temp-file via node:sqlite. Not production DDL.
 */
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isomorphicContentHash } from './datagene';
import type { MemoryHeatTier } from './database-city';
import { UNIVERSE_KERNEL_GUARDRAILS } from './universe-ethics';

export type PocketMetaRow = {
  entityId: string;
  kind: string;
  contentHash: string;
  heatTier: MemoryHeatTier;
  residency: string;
  provenance: string;
  updatedAt: string;
};

export type SqliteShardFixture = {
  mode: 'memory' | 'temp-file';
  path: string;
  db: DatabaseSync;
  close: () => void;
};

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS pocket_meta (
  entity_id TEXT PRIMARY KEY NOT NULL,
  kind TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  heat_tier TEXT NOT NULL,
  residency TEXT NOT NULL,
  provenance TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pocket_meta_heat ON pocket_meta(heat_tier);
CREATE INDEX IF NOT EXISTS idx_pocket_meta_residency ON pocket_meta(residency);
`;

export function openSqliteShardFixture(mode: 'memory' | 'temp-file' = 'memory'): SqliteShardFixture {
  if (UNIVERSE_KERNEL_GUARDRAILS.liveProductionDdlAllowed) {
    throw new Error('live production DDL must remain false');
  }
  if (mode === 'memory') {
    const db = new DatabaseSync(':memory:');
    db.exec(SCHEMA_SQL);
    return {
      mode,
      path: ':memory:',
      db,
      close: () => {
        db.close();
      },
    };
  }
  const dir = mkdtempSync(join(tmpdir(), 'xiv-12d05-shard-'));
  const path = join(dir, 'pocket-brain.sqlite');
  const db = new DatabaseSync(path);
  db.exec(SCHEMA_SQL);
  return {
    mode,
    path,
    db,
    close: () => {
      try {
        db.close();
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  };
}

export function upsertPocketMeta(fixture: SqliteShardFixture, row: PocketMetaRow): void {
  if (!row.entityId || !row.contentHash) throw new TypeError('entityId and contentHash required');
  fixture.db
    .prepare(
      `INSERT INTO pocket_meta(entity_id, kind, content_hash, heat_tier, residency, provenance, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(entity_id) DO UPDATE SET
         kind=excluded.kind,
         content_hash=excluded.content_hash,
         heat_tier=excluded.heat_tier,
         residency=excluded.residency,
         provenance=excluded.provenance,
         updated_at=excluded.updated_at`,
    )
    .run(
      row.entityId,
      row.kind,
      row.contentHash,
      row.heatTier,
      row.residency,
      row.provenance,
      row.updatedAt,
    );
}

export function listPocketMeta(fixture: SqliteShardFixture): PocketMetaRow[] {
  const rows = fixture.db
    .prepare(
      `SELECT entity_id, kind, content_hash, heat_tier, residency, provenance, updated_at
       FROM pocket_meta ORDER BY entity_id`,
    )
    .all() as Array<{
    entity_id: string;
    kind: string;
    content_hash: string;
    heat_tier: string;
    residency: string;
    provenance: string;
    updated_at: string;
  }>;
  return rows.map((r) => ({
    entityId: r.entity_id,
    kind: r.kind,
    contentHash: r.content_hash,
    heatTier: r.heat_tier as MemoryHeatTier,
    residency: r.residency,
    provenance: r.provenance,
    updatedAt: r.updated_at,
  }));
}

export function shardContentChecksum(fixture: SqliteShardFixture): string {
  const rows = listPocketMeta(fixture);
  return isomorphicContentHash(
    JSON.stringify(
      rows.map((r) => ({
        entityId: r.entityId,
        contentHash: r.contentHash,
        heatTier: r.heatTier,
        residency: r.residency,
      })),
    ),
  );
}
