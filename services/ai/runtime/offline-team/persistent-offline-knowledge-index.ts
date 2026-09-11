import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import {
  OfflineRagRetrievalIndex,
  type ApprovedKnowledgeRecord,
  type RetrievalCitation,
  type RetrievalHit,
} from './offline-rag-retrieval-index';

export interface PersistentKnowledgeSnapshot {
  schemaVersion: '12D-63.1';
  tenantId: string;
  generatedAt: string;
  records: readonly ApprovedKnowledgeRecord[];
  integrityHash: string;
}

export interface KnowledgeRestoreReceipt {
  tenantId: string;
  restoredRecords: number;
  generatedAt: string;
  integrityVerified: true;
}

export const PERSISTENT_KNOWLEDGE_GUARDRAILS = {
  approvalRequired: true,
  provenanceRequired: true,
  evidenceRequired: true,
  tenantIsolationRequired: true,
  topSecretOrdinaryPersistenceAllowed: false,
  integrityVerificationRequired: true,
  atomicLocalWriteRequired: true,
  productionMutationAllowed: false,
} as const;

function cloneRecord(record: ApprovedKnowledgeRecord): ApprovedKnowledgeRecord {
  return { ...record, evidenceRefs: [...record.evidenceRefs] };
}

function snapshotPayload(tenantId: string, generatedAt: string, records: readonly ApprovedKnowledgeRecord[]): string {
  const normalized = [...records]
    .map(cloneRecord)
    .sort((a, b) => a.knowledgeId.localeCompare(b.knowledgeId));
  return JSON.stringify({ schemaVersion: '12D-63.1', tenantId, generatedAt, records: normalized });
}

function integrityHash(tenantId: string, generatedAt: string, records: readonly ApprovedKnowledgeRecord[]): string {
  return createHash('sha256').update(snapshotPayload(tenantId, generatedAt, records)).digest('hex');
}

function validateTenantId(tenantId: string): string {
  if (!/^[a-zA-Z0-9._-]{1,128}$/.test(tenantId)) throw new Error('invalid tenant id for local persistence');
  return tenantId;
}

export class PersistentOfflineKnowledgeIndex {
  private readonly rag = new OfflineRagRetrievalIndex();
  private readonly records = new Map<string, Map<string, ApprovedKnowledgeRecord>>();

  index(record: ApprovedKnowledgeRecord): RetrievalCitation {
    const citation = this.rag.index(record);
    const tenant = this.records.get(record.tenantId) ?? new Map<string, ApprovedKnowledgeRecord>();
    tenant.set(record.knowledgeId, cloneRecord(record));
    this.records.set(record.tenantId, tenant);
    return citation;
  }

  query(tenantId: string, queryText: string, maxResults = 5): RetrievalHit[] {
    return this.rag.query(tenantId, queryText, maxResults);
  }

  count(tenantId: string): number {
    return this.records.get(tenantId)?.size ?? 0;
  }

  createSnapshot(tenantId: string, generatedAt: string): PersistentKnowledgeSnapshot {
    validateTenantId(tenantId);
    if (!generatedAt || Number.isNaN(Date.parse(generatedAt))) throw new Error('valid snapshot timestamp required');
    const records = [...(this.records.get(tenantId)?.values() ?? [])]
      .map(cloneRecord)
      .sort((a, b) => a.knowledgeId.localeCompare(b.knowledgeId));
    return {
      schemaVersion: '12D-63.1',
      tenantId,
      generatedAt,
      records,
      integrityHash: integrityHash(tenantId, generatedAt, records),
    };
  }

  restoreSnapshot(snapshot: PersistentKnowledgeSnapshot): KnowledgeRestoreReceipt {
    validateTenantId(snapshot.tenantId);
    if (snapshot.schemaVersion !== '12D-63.1') throw new Error('unsupported knowledge snapshot schema');
    if (!snapshot.generatedAt || Number.isNaN(Date.parse(snapshot.generatedAt))) throw new Error('valid snapshot timestamp required');
    const expected = integrityHash(snapshot.tenantId, snapshot.generatedAt, snapshot.records);
    if (expected !== snapshot.integrityHash) throw new Error('knowledge snapshot integrity verification failed');

    for (const record of snapshot.records) {
      if (record.tenantId !== snapshot.tenantId) throw new Error('snapshot tenant scope mismatch');
      this.index(record);
    }
    return {
      tenantId: snapshot.tenantId,
      restoredRecords: snapshot.records.length,
      generatedAt: snapshot.generatedAt,
      integrityVerified: true,
    };
  }
}

export class FilesystemKnowledgeSnapshotStore {
  private readonly root: string;

  constructor(rootDirectory: string) {
    if (!rootDirectory) throw new Error('root directory required');
    this.root = resolve(rootDirectory);
  }

  private pathFor(tenantId: string): string {
    const safeTenant = validateTenantId(tenantId);
    const candidate = resolve(this.root, `${safeTenant}.knowledge.json`);
    if (candidate !== this.root && !candidate.startsWith(`${this.root}${sep}`)) throw new Error('persistence path escaped root');
    return candidate;
  }

  async write(snapshot: PersistentKnowledgeSnapshot): Promise<string> {
    if (snapshot.integrityHash !== integrityHash(snapshot.tenantId, snapshot.generatedAt, snapshot.records)) {
      throw new Error('refusing to persist invalid knowledge snapshot');
    }
    await mkdir(this.root, { recursive: true });
    const target = this.pathFor(snapshot.tenantId);
    const temporary = `${target}.tmp`;
    await writeFile(temporary, `${JSON.stringify(snapshot, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    await rename(temporary, target);
    return target;
  }

  async read(tenantId: string): Promise<PersistentKnowledgeSnapshot> {
    const raw = await readFile(this.pathFor(tenantId), 'utf8');
    const parsed = JSON.parse(raw) as PersistentKnowledgeSnapshot;
    if (parsed.tenantId !== tenantId) throw new Error('persisted snapshot tenant mismatch');
    const expected = integrityHash(parsed.tenantId, parsed.generatedAt, parsed.records);
    if (parsed.integrityHash !== expected) throw new Error('persisted knowledge snapshot integrity verification failed');
    return parsed;
  }
}
