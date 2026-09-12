import { DatabaseSync } from 'node:sqlite';
import { closeSync, lstatSync, openSync, realpathSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  assessSharedHostLeaseAcquisition, createSharedHostLease, markSharedHostLeaseStopped,
  parseSharedHostLeaseRecord, releaseSharedHostLease, renewSharedHostLease,
  type SharedHostLane, type SharedHostLeaseRecord,
} from './shared-host-job-lease';

export interface HostLeaseBinding {
  tenantId: string; holderInstanceId: string; lane: SharedHostLane; workId: string;
  providerId: string; modelId: string; presenceEvidenceRef: string; sourceCommit: string;
  ttlMs?: number;
}
/** Private controller handle. Never expose this bearer secret in a UI, prompt or telemetry. */
export interface HostLeaseHandle {
  leaseId: string; tenantId: string; holderInstanceId: string; revision: number; ownerSecret: string;
}
export const HOST_STORE_POLICY = Object.freeze({ schemaVersion: 1, maxRecordBytes: 8192,
  busyTimeoutMs: 250, automaticRecovery: false, callsProviders: false,
  hostAdoptionVerified: false, presenceReferenceAuthenticatedHere: false });
const digest = (v: string): string => createHash('sha256').update(v).digest('hex');
const hex = (v: unknown, n: number): v is string => typeof v === 'string' && v.length === n && new RegExp(`^[a-f0-9]{${n}}$`).test(v);
const identifier = (v: unknown): v is string => typeof v === 'string' && v === v.trim() && /^[A-Za-z0-9][A-Za-z0-9_.:@/-]{0,127}$/.test(v);
const validTime = (n: number): boolean => Number.isSafeInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER - 30_001;
function checkPath(path: string): void {
  if (typeof path !== 'string' || !isAbsolute(path) || path.length > 4096 || path.includes('\0')) throw new Error('absolute local ledger path required');
}
function checkRecord(record: unknown): Readonly<SharedHostLeaseRecord> {
  const parsed = parseSharedHostLeaseRecord(record);
  if (!parsed || !validTime(parsed.heartbeatAtMs) || !Number.isSafeInteger(parsed.revision + 1)
    || (parsed.state === 'STOPPED_CONFIRMED' && parsed.releaseEvidenceRef !== null)
    || (parsed.state === 'STOPPED_UNCONFIRMED' && parsed.stopEvidenceRef !== null)) throw new Error('invalid host ledger record; operator review required');
  return parsed;
}

/**
 * Durable cooperative mutex, not an OS sandbox, authentication service or authorization grant.
 * All participating runtimes MUST use the SAME operator-controlled local file and host ID.
 * File contents/ACLs and clocks are trusted. No network filesystem or hostile file-owner claim.
 * Missing/corrupt state is an error. Never recreate a missing ledger to clear a stuck lease.
 */
export class SharedHostLeaseStore {
  readonly #db: DatabaseSync;
  readonly #host: string;
  readonly #clock: () => number;
  constructor(path: string, hostScopeId: string, clock: () => number = Date.now) {
    checkPath(path);
    if (!hex(hostScopeId, 32) || typeof clock !== 'function') throw new Error('host scope and clock required');
    const stat = lstatSync(path); // Do not let DatabaseSync silently create a missing ledger.
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('regular existing host ledger required');
    this.#host = hostScopeId; this.#clock = clock;
    this.#db = new DatabaseSync(realpathSync(path), { allowExtension: false });
    try {
      this.#db.exec('PRAGMA trusted_schema=OFF; PRAGMA busy_timeout=250; PRAGMA synchronous=FULL');
      this.#transaction(() => this.#read());
    } catch (error) { this.#db.close(); throw error; }
  }
  /** Explicit first-time provisioning only; refuses EVERY existing path, including symlinks. */
  static initialize(path: string, hostScopeId: string): void {
    checkPath(path);
    if (!hex(hostScopeId, 32)) throw new Error('host scope required');
    closeSync(openSync(path, 'wx', 0o600));
    const db = new DatabaseSync(path, { allowExtension: false });
    try {
      db.exec(`PRAGMA trusted_schema=OFF; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
        CREATE TABLE xiv_host_lease(
          singleton INTEGER PRIMARY KEY CHECK(singleton=1), schema_version INTEGER NOT NULL CHECK(schema_version=1),
          host_scope TEXT NOT NULL, last_clock_ms INTEGER NOT NULL CHECK(last_clock_ms>=0),
          record TEXT, owner_digest TEXT,
          CHECK((record IS NULL AND owner_digest IS NULL) OR (record IS NOT NULL AND owner_digest IS NOT NULL)),
          CHECK(record IS NULL OR length(record)<=8192), CHECK(owner_digest IS NULL OR length(owner_digest)=64)
        ) STRICT;`);
      db.prepare('INSERT INTO xiv_host_lease VALUES(1,1,?,0,NULL,NULL)').run(hostScopeId);
    } finally { db.close(); }
  }
  #transaction<T>(fn: () => T): T {
    this.#db.exec('BEGIN IMMEDIATE');
    try { const r = fn(); this.#db.exec('COMMIT'); return r; }
    catch (error) { try { this.#db.exec('ROLLBACK'); } catch { /* Original failure remains the blocker. */ } throw error; }
  }
  #read() {
    const row = this.#db.prepare('SELECT * FROM xiv_host_lease WHERE singleton=1').get();
    if (!row || row.schema_version !== 1 || row.host_scope !== this.#host || !Number.isSafeInteger(row.last_clock_ms)
      || Number(row.last_clock_ms) < 0) throw new Error('host ledger missing, incompatible or misbound');
    let record: Readonly<SharedHostLeaseRecord> | null = null;
    if (row.record !== null) {
      if (typeof row.record !== 'string' || Buffer.byteLength(row.record) > HOST_STORE_POLICY.maxRecordBytes
        || !hex(row.owner_digest, 64)) throw new Error('corrupt host ledger');
      record = checkRecord(JSON.parse(row.record));
      if (record.hostScopeId !== this.#host || record.heartbeatAtMs > Number(row.last_clock_ms)) throw new Error('host record binding or clock invalid');
    } else if (row.owner_digest !== null) throw new Error('corrupt empty ledger');
    return { record, ownerDigest: row.owner_digest as string | null, lastClock: Number(row.last_clock_ms) };
  }
  #now(last: number): number {
    const n = this.#clock();
    if (!validTime(n) || n < last) throw new Error('invalid or backward shared clock');
    this.#db.prepare('UPDATE xiv_host_lease SET last_clock_ms=? WHERE singleton=1').run(n);
    return n;
  }
  #write(record: SharedHostLeaseRecord, ownerDigest: string): void {
    const value = JSON.stringify(checkRecord(record));
    if (Buffer.byteLength(value) > HOST_STORE_POLICY.maxRecordBytes) throw new Error('host record too large');
    this.#db.prepare('UPDATE xiv_host_lease SET record=?,owner_digest=? WHERE singleton=1').run(value, ownerDigest);
  }
  #handle(record: SharedHostLeaseRecord, ownerSecret: string): Readonly<HostLeaseHandle> {
    return Object.freeze({ leaseId: record.leaseId, tenantId: record.tenantId,
      holderInstanceId: record.holderInstanceId, revision: record.revision, ownerSecret });
  }

  acquire(binding: HostLeaseBinding) {
    // This authenticates neither an enrollment nor a caller; binding is supplied by the trusted controller.
    if (!binding || ![binding.tenantId, binding.holderInstanceId, binding.workId, binding.providerId, binding.modelId].every(identifier)
      || !hex(binding.sourceCommit, 40)) throw new Error('invalid controller binding');
    return this.#transaction(() => {
      const row = this.#read(), now = this.#now(row.lastClock);
      const candidate = createSharedHostLease({ ...binding, hostScopeId: this.#host, leaseId: randomUUID(), nowMs: now });
      // Candidate time is generated INSIDE the transaction, not accepted from a stale request.
      const assessment = assessSharedHostLeaseAcquisition({ existing: row.record, candidate, nowMs: now });
      if (!assessment.allowed) return Object.freeze({ status: 'BLOCKED' as const, decision: assessment.decision,
        operatorReviewRequired: assessment.operatorReviewRequired, handle: null });
      const secret = randomBytes(32).toString('hex');
      this.#write(candidate, digest(secret));
      return Object.freeze({ status: 'RESERVED_NOT_STARTED' as const, decision: assessment.decision,
        operatorReviewRequired: false, handle: this.#handle(candidate, secret) });
    });
  }
  #checkOwner(handle: HostLeaseHandle, current: Readonly<SharedHostLeaseRecord> | null, ownerDigest: string | null): void {
    if (!handle || !hex(handle.ownerSecret, 64) || !current || !ownerDigest
      || !timingSafeEqual(Buffer.from(digest(handle.ownerSecret), 'hex'), Buffer.from(ownerDigest, 'hex'))
      || handle.leaseId !== current.leaseId || handle.tenantId !== current.tenantId
      || handle.holderInstanceId !== current.holderInstanceId || handle.revision !== current.revision) throw new Error('host lease ownership or revision mismatch');
  }
  assertBinding(handle: HostLeaseHandle, expected: Omit<HostLeaseBinding, 'ttlMs'>): void {
    this.#transaction(() => {
      const row = this.#read();
      this.#checkOwner(handle, row.record, row.ownerDigest);
      this.#now(row.lastClock);
      for (const key of ['tenantId', 'holderInstanceId', 'lane', 'workId', 'providerId', 'modelId', 'presenceEvidenceRef', 'sourceCommit'] as const) {
        if (row.record![key] !== expected[key]) throw new Error('host/story binding mismatch');
      }
    });
  }
  #transition(handle: HostLeaseHandle, transform: (record: SharedHostLeaseRecord, now: number) => SharedHostLeaseRecord) {
    return this.#transaction(() => {
      const row = this.#read(), current = row.record;
      this.#checkOwner(handle, current, row.ownerDigest);
      const next = transform(current!, this.#now(row.lastClock));
      this.#write(next, row.ownerDigest!);
      return this.#handle(next, handle.ownerSecret);
    });
  }
  renew(handle: HostLeaseHandle, ttlMs = 10_000) {
    return this.#transition(handle, (lease, nowMs) => renewSharedHostLease({ lease, nowMs, holderInstanceId: handle.holderInstanceId, ttlMs }));
  }
  markStopped(handle: HostLeaseHandle, providerAcknowledged: boolean, stopEvidenceRef?: string) {
    // Never treat a string such as "false" as a confirmed provider stop.
    if (typeof providerAcknowledged !== 'boolean' || (!providerAcknowledged && stopEvidenceRef !== undefined)) throw new Error('strict settlement evidence required');
    return this.#transition(handle, (lease, nowMs) => markSharedHostLeaseStopped({ lease, nowMs, providerAcknowledged, stopEvidenceRef }));
  }
  release(handle: HostLeaseHandle, releaseEvidenceRef: string) {
    return this.#transition(handle, (lease, nowMs) => releaseSharedHostLease({ lease, nowMs, releaseEvidenceRef }));
  }
  snapshot(tenantId: string) {
    if (!identifier(tenantId)) throw new Error('tenant required');
    return this.#transaction(() => {
      const row = this.#read(), now = this.#now(row.lastClock), r = row.record;
      const held = r !== null && r.state !== 'RELEASED';
      return Object.freeze({ observedAtMs: now, held, state: r?.tenantId === tenantId ? r.state : held ? 'HELD_BY_OTHER_SCOPE' : 'AVAILABLE',
        expiredUnsettled: Boolean(held && r && now >= r.expiresAtMs), ownerSecretExposed: false,
        hostAdoptionVerified: false, modelExecutionVerified: false, liveAgentCount: null });
    });
  }
  close(): void { this.#db.close(); }
}
