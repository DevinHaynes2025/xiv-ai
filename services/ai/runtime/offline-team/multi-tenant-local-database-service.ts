import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

export type LocalDatabaseClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
export type LocalDatabaseRow = Record<string, unknown> & { rowId: string };

export interface TenantDatabaseSnapshot {
  tenantId: string;
  schemaVersion: number;
  updatedAt: string;
  tables: Record<string, LocalDatabaseRow[]>;
}

export interface TenantDatabaseMigration {
  version: number;
  name: string;
  apply(snapshot: TenantDatabaseSnapshot): TenantDatabaseSnapshot;
}

export interface DatabaseRecoveryReceipt {
  tenantId: string;
  schemaVersion: number;
  integrityVerified: boolean;
  rowCount: number;
  bytesOnDisk: number;
  measuredAt: string;
  evidenceRef: string;
}

interface EncryptedTenantEnvelope {
  version: 1;
  algorithm: 'aes-256-gcm';
  tenantId: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

export class MultiTenantLocalDatabaseService {
  constructor(
    private readonly rootPath: string,
    private readonly keyResolver: (tenantId: string) => Buffer,
  ) {}

  private tenantPath(tenantId: string) {
    if (!/^[a-zA-Z0-9._-]+$/.test(tenantId)) throw new Error('invalid tenant id');
    const root = resolve(this.rootPath);
    const candidate = resolve(join(root, `${tenantId}.xivdb`));
    if (!candidate.startsWith(`${root}/`) && candidate !== join(root, `${tenantId}.xivdb`)) {
      throw new Error('tenant path escapes database root');
    }
    return candidate;
  }

  private key(tenantId: string) {
    const key = this.keyResolver(tenantId);
    if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error('tenant database key must be 32 bytes');
    return key;
  }

  private encrypt(snapshot: TenantDatabaseSnapshot): EncryptedTenantEnvelope {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(snapshot.tenantId), iv);
    cipher.setAAD(Buffer.from(`xiv-local-db:${snapshot.tenantId}:v1`, 'utf8'));
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(snapshot), 'utf8'), cipher.final()]);
    return {
      version: 1,
      algorithm: 'aes-256-gcm',
      tenantId: snapshot.tenantId,
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    };
  }

  private decrypt(envelope: EncryptedTenantEnvelope): TenantDatabaseSnapshot {
    if (envelope.algorithm !== 'aes-256-gcm' || envelope.version !== 1) throw new Error('unsupported tenant database envelope');
    const decipher = createDecipheriv('aes-256-gcm', this.key(envelope.tenantId), Buffer.from(envelope.iv, 'base64'));
    decipher.setAAD(Buffer.from(`xiv-local-db:${envelope.tenantId}:v1`, 'utf8'));
    decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
      decipher.final(),
    ]).toString('utf8');
    const snapshot = JSON.parse(plaintext) as TenantDatabaseSnapshot;
    if (snapshot.tenantId !== envelope.tenantId) throw new Error('tenant database envelope mismatch');
    return snapshot;
  }

  async load(tenantId: string): Promise<TenantDatabaseSnapshot> {
    const path = this.tenantPath(tenantId);
    try {
      const raw = await readFile(path, 'utf8');
      const envelope = JSON.parse(raw) as EncryptedTenantEnvelope;
      if (envelope.tenantId !== tenantId) throw new Error('cross-tenant database read blocked');
      return this.decrypt(envelope);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { tenantId, schemaVersion: 0, updatedAt: new Date(0).toISOString(), tables: {} };
      }
      throw error;
    }
  }

  async save(snapshot: TenantDatabaseSnapshot) {
    if (!snapshot.tenantId) throw new Error('tenant id required');
    const path = this.tenantPath(snapshot.tenantId);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
    const envelope = this.encrypt({ ...snapshot, updatedAt: new Date().toISOString() });
    await writeFile(tmp, JSON.stringify(envelope), { encoding: 'utf8', mode: 0o600 });
    await rename(tmp, path);
  }

  async upsert(tenantId: string, table: string, row: LocalDatabaseRow) {
    if (!/^[a-zA-Z0-9._-]+$/.test(table)) throw new Error('invalid table name');
    if (!row.rowId) throw new Error('row id required');
    const snapshot = await this.load(tenantId);
    const rows = snapshot.tables[table] ?? [];
    const index = rows.findIndex(existing => existing.rowId === row.rowId);
    if (index >= 0) rows[index] = row; else rows.push(row);
    snapshot.tables[table] = rows;
    await this.save(snapshot);
    return row;
  }

  async migrate(tenantId: string, migrations: TenantDatabaseMigration[]) {
    let snapshot = await this.load(tenantId);
    const ordered = [...migrations].sort((a, b) => a.version - b.version);
    for (const migration of ordered) {
      if (migration.version <= snapshot.schemaVersion) continue;
      if (migration.version !== snapshot.schemaVersion + 1) throw new Error('database migration versions must be contiguous');
      snapshot = migration.apply(snapshot);
      snapshot.schemaVersion = migration.version;
      snapshot.tenantId = tenantId;
    }
    await this.save(snapshot);
    return snapshot;
  }

  async recoveryReceipt(tenantId: string, evidenceRef: string): Promise<DatabaseRecoveryReceipt> {
    if (!evidenceRef) throw new Error('recovery evidence required');
    const snapshot = await this.load(tenantId);
    const path = this.tenantPath(tenantId);
    const info = await stat(path);
    const rowCount = Object.values(snapshot.tables).reduce((sum, rows) => sum + rows.length, 0);
    return {
      tenantId,
      schemaVersion: snapshot.schemaVersion,
      integrityVerified: true,
      rowCount,
      bytesOnDisk: info.size,
      measuredAt: new Date().toISOString(),
      evidenceRef,
    };
  }
}

export const MULTI_TENANT_DATABASE_GUARDRAILS = {
  tenantIsolationRequired: true,
  encryptedAtRest: true,
  atomicLocalWrites: true,
  migrationReceiptsRequiredForRecoveryClaims: true,
  externalReplicationEnabledByDefault: false,
  topSecretOrdinaryExternalReplicationAllowed: false,
};
