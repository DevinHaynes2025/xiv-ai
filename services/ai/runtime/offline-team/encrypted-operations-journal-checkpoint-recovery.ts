import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import {
  buildReadOnlyExecutiveControlSnapshot,
  rebuildOperationsView,
  type OperationsEvent,
  type OperationsMaterializedView,
  type VerificationReceipt,
} from './operations-event-journal-view-rebuilder-receipts';

export type RecoveryStatus = 'HEALTHY' | 'DEGRADED' | 'BLOCKED' | 'UNVERIFIED';
export type EncryptedRecordType = 'OPERATIONS_EVENT' | 'VERIFICATION_RECEIPT';

export interface TenantOperationsKeyMaterial {
  tenantId: string;
  keyId: string;
  keyVersion: number;
  algorithm: 'AES-256-GCM';
  key: Buffer;
  evidenceRefs: string[];
}

export interface TenantOperationsKeyResolver {
  resolveKey(tenantId: string, keyVersion?: number): Promise<TenantOperationsKeyMaterial> | TenantOperationsKeyMaterial;
}

export interface EncryptedJournalEnvelope {
  version: 1;
  tenantId: string;
  recordType: EncryptedRecordType;
  sequence: number;
  keyId: string;
  keyVersion: number;
  algorithm: 'AES-256-GCM';
  previousEnvelopeHash: string;
  iv: string;
  authTag: string;
  ciphertext: string;
  aadHash: string;
  plaintextHash: string;
  envelopeHash: string;
  createdAt: string;
}

export interface JournalScanResult<T> {
  tenantId: string;
  recordType: EncryptedRecordType;
  records: T[];
  envelopes: EncryptedJournalEnvelope[];
  integrityVerified: boolean;
  corruptedTailLines: string[];
  firstCorruptLine?: number;
  journalFileExists: boolean;
  journalBytes: number;
  journalSha256?: string;
  keyVersionsObserved: number[];
}

export interface QuarantineReceipt {
  tenantId: string;
  recordType: EncryptedRecordType;
  createdAt: string;
  sourceJournalSha256?: string;
  firstCorruptLine: number;
  quarantinedLines: number;
  quarantinePath: string;
  quarantineSha256: string;
  originalJournalModified: false;
}

export interface OperationsCheckpointPayload {
  tenantId: string;
  checkpointId: string;
  createdAt: string;
  eventSequence: number;
  receiptSequence: number;
  eventHeadHash: string;
  receiptHeadHash: string;
  sourceEvents: OperationsEvent[];
  sourceReceipts: VerificationReceipt[];
  view: OperationsMaterializedView;
  viewHash: string;
}

export interface EncryptedCheckpointEnvelope {
  version: 1;
  tenantId: string;
  checkpointId: string;
  keyId: string;
  keyVersion: number;
  algorithm: 'AES-256-GCM';
  createdAt: string;
  iv: string;
  authTag: string;
  ciphertext: string;
  aadHash: string;
  plaintextHash: string;
  ciphertextChecksum: string;
  macSha256: string;
}

export interface CheckpointVerification {
  verified: boolean;
  reasons: string[];
}

export interface PlatformSyncTelemetry {
  platform: string;
  verifiedDeviceSubjects: number;
  success: number;
  error: number;
  attempts: number;
  successRate: number;
  latencySamples: number;
  p50LatencyMs?: number;
  p95LatencyMs?: number;
  measuredOnly: true;
  universalSupportClaim: false;
}

export interface RecoveryReceipt {
  receiptId: string;
  tenantId: string;
  status: RecoveryStatus;
  recoveredAt: string;
  checkpointId?: string;
  checkpointVerified: boolean;
  checkpointVerificationReasons: string[];
  eventRecordsRecovered: number;
  receiptRecordsRecovered: number;
  eventTailReplayed: number;
  receiptTailReplayed: number;
  eventCorruptTailLines: number;
  receiptCorruptTailLines: number;
  eventKeyVersionsObserved: number[];
  receiptKeyVersionsObserved: number[];
  freshnessMs: number;
  stale: boolean;
  integrityVerified: boolean;
  evidenceRefs: string[];
  source: {
    eventHeadHash: string;
    receiptHeadHash: string;
    eventJournalSha256?: string;
    receiptJournalSha256?: string;
  };
  authority: {
    canWriteProduction: false;
    canDeploy: false;
    canMoveMoney: false;
    canOpenAccounts: false;
    canSignContracts: false;
  };
}

const GENESIS = '0'.repeat(64);

function safeSegment(value: string, label: string): string {
  if (!value || value.length > 128 || value.includes('..') || /[\\/\0]/.test(value)) throw new Error(`invalid ${label}`);
  return value;
}

function assertTenantId(tenantId: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(tenantId)) throw new Error('invalid tenant id');
}

function assertKeyMaterial(material: TenantOperationsKeyMaterial, tenantId: string): void {
  if (material.tenantId !== tenantId) throw new Error('tenant key scope mismatch');
  if (material.algorithm !== 'AES-256-GCM') throw new Error('unsupported tenant key algorithm');
  if (!Buffer.isBuffer(material.key) || material.key.length !== 32) throw new Error('tenant operations key must be exactly 32 bytes');
  if (!Number.isInteger(material.keyVersion) || material.keyVersion < 1) throw new Error('invalid key version');
  safeSegment(material.keyId, 'keyId');
  if (!Array.isArray(material.evidenceRefs) || material.evidenceRefs.length === 0 || material.evidenceRefs.some((x) => !x.trim())) {
    throw new Error('tenant key evidence is required');
  }
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonical(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function equalHex(left: string, right: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

function parseTime(value: string): number {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new Error('invalid timestamp');
  return ms;
}

function percentile(values: number[], quantile: number): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index];
}

function isCurrentReceipt(receipt: VerificationReceipt, asOfMs: number): boolean {
  if (receipt.revokedAt && parseTime(receipt.revokedAt) <= asOfMs) return false;
  if (receipt.expiresAt && parseTime(receipt.expiresAt) <= asOfMs) return false;
  return parseTime(receipt.issuedAt) <= asOfMs;
}

function eventHead(events: readonly OperationsEvent[]): string {
  return events.at(-1)?.hash ?? GENESIS;
}

function receiptHead(receipts: readonly VerificationReceipt[]): string {
  return receipts.at(-1)?.hash ?? GENESIS;
}

function envelopeAad(input: Pick<EncryptedJournalEnvelope, 'version' | 'tenantId' | 'recordType' | 'sequence' | 'keyId' | 'keyVersion' | 'previousEnvelopeHash'>): Buffer {
  const scoped = {
    version: input.version, tenantId: input.tenantId, recordType: input.recordType, sequence: input.sequence,
    keyId: input.keyId, keyVersion: input.keyVersion, previousEnvelopeHash: input.previousEnvelopeHash,
  };
  return Buffer.from(canonical(scoped), 'utf8');
}

function checkpointAad(input: Pick<EncryptedCheckpointEnvelope, 'version' | 'tenantId' | 'checkpointId' | 'keyId' | 'keyVersion' | 'createdAt'>): Buffer {
  const scoped = { version: input.version, tenantId: input.tenantId, checkpointId: input.checkpointId, keyId: input.keyId, keyVersion: input.keyVersion, createdAt: input.createdAt };
  return Buffer.from(canonical(scoped), 'utf8');
}

function deriveEnvelopeHash(envelope: Omit<EncryptedJournalEnvelope, 'envelopeHash'>): string {
  return sha256(canonical(envelope));
}

export class EncryptedOperationsJournalStore<T extends OperationsEvent | VerificationReceipt> {
  constructor(
    private readonly rootDir: string,
    private readonly tenantId: string,
    private readonly recordType: EncryptedRecordType,
    private readonly fileName: string,
    private readonly keyResolver: TenantOperationsKeyResolver,
  ) {
    assertTenantId(tenantId);
    if (!/^[A-Za-z0-9._-]+\.xivenc\.jsonl$/.test(fileName)) throw new Error('invalid encrypted journal filename');
  }

  private filePath(): string {
    const tenantRoot = path.resolve(this.rootDir, this.tenantId);
    const target = path.resolve(tenantRoot, this.fileName);
    if (!target.startsWith(`${tenantRoot}${path.sep}`)) throw new Error('path traversal rejected');
    return target;
  }

  private async encryptRecord(record: T, previousEnvelopeHash: string): Promise<EncryptedJournalEnvelope> {
    if (record.tenantId !== this.tenantId) throw new Error('tenant isolation violation');
    if ('classification' in record && record.classification === 'TOP_SECRET') {
      throw new Error('TOP_SECRET is prohibited from the ordinary encrypted operations journal');
    }
    const material = await this.keyResolver.resolveKey(this.tenantId);
    assertKeyMaterial(material, this.tenantId);
    const base = {
      version: 1 as const,
      tenantId: this.tenantId,
      recordType: this.recordType,
      sequence: record.sequence,
      keyId: material.keyId,
      keyVersion: material.keyVersion,
      previousEnvelopeHash,
    };
    const aad = envelopeAad(base);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', material.key, iv);
    cipher.setAAD(aad);
    const plaintext = Buffer.from(JSON.stringify(record), 'utf8');
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const withoutHash: Omit<EncryptedJournalEnvelope, 'envelopeHash'> = {
      ...base,
      algorithm: 'AES-256-GCM',
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      aadHash: sha256(aad),
      plaintextHash: sha256(plaintext),
      createdAt: new Date().toISOString(),
    };
    return { ...withoutHash, envelopeHash: deriveEnvelopeHash(withoutHash) };
  }

  private async decryptEnvelope(envelope: EncryptedJournalEnvelope): Promise<T> {
    if (envelope.version !== 1 || envelope.algorithm !== 'AES-256-GCM') throw new Error('unsupported encrypted journal envelope');
    if (envelope.tenantId !== this.tenantId || envelope.recordType !== this.recordType) throw new Error('encrypted journal scope mismatch');
    const { envelopeHash, ...withoutHash } = envelope;
    if (!equalHex(deriveEnvelopeHash(withoutHash), envelopeHash)) throw new Error('encrypted journal envelope hash mismatch');
    const material = await this.keyResolver.resolveKey(this.tenantId, envelope.keyVersion);
    assertKeyMaterial(material, this.tenantId);
    if (material.keyId !== envelope.keyId || material.keyVersion !== envelope.keyVersion) throw new Error('encrypted journal key identity mismatch');
    const aad = envelopeAad(envelope);
    if (!equalHex(sha256(aad), envelope.aadHash)) throw new Error('encrypted journal AAD mismatch');
    const decipher = createDecipheriv('aes-256-gcm', material.key, Buffer.from(envelope.iv, 'base64'));
    decipher.setAAD(aad);
    decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
      decipher.final(),
    ]);
    if (!equalHex(sha256(plaintext), envelope.plaintextHash)) throw new Error('encrypted journal plaintext hash mismatch');
    const record = JSON.parse(plaintext.toString('utf8')) as T;
    if (record.tenantId !== this.tenantId || record.sequence !== envelope.sequence) throw new Error('decrypted journal record scope mismatch');
    if ('classification' in record && record.classification === 'TOP_SECRET') throw new Error('TOP_SECRET decrypted journal record rejected');
    return record;
  }

  async append(record: T): Promise<EncryptedJournalEnvelope> {
    const scan = await this.scan();
    if (!scan.integrityVerified || scan.corruptedTailLines.length > 0) throw new Error('journal contains a corrupted tail; quarantine/recovery is required before append');
    const expectedSequence = scan.envelopes.length + 1;
    if (record.sequence !== expectedSequence) throw new Error('journal record sequence mismatch');
    const previousEnvelopeHash = scan.envelopes.at(-1)?.envelopeHash ?? GENESIS;
    const envelope = await this.encryptRecord(record, previousEnvelopeHash);
    const target = this.filePath();
    await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await fs.appendFile(target, `${JSON.stringify(envelope)}\n`, { encoding: 'utf8', mode: 0o600 });
    try { await fs.chmod(target, 0o600); } catch { /* best effort */ }
    return envelope;
  }

  async scan(): Promise<JournalScanResult<T>> {
    const target = this.filePath();
    let raw = '';
    try {
      raw = await fs.readFile(target, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          tenantId: this.tenantId,
          recordType: this.recordType,
          records: [],
          envelopes: [],
          integrityVerified: true,
          corruptedTailLines: [],
          journalFileExists: false,
          journalBytes: 0,
          keyVersionsObserved: [],
        };
      }
      throw error;
    }

    const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
    const records: T[] = [];
    const envelopes: EncryptedJournalEnvelope[] = [];
    const keyVersions = new Set<number>();
    let previousEnvelopeHash = GENESIS;
    let firstCorruptLine: number | undefined;

    for (let index = 0; index < lines.length; index++) {
      try {
        const envelope = JSON.parse(lines[index]) as EncryptedJournalEnvelope;
        if (envelope.sequence !== index + 1) throw new Error('encrypted journal sequence mismatch');
        if (envelope.previousEnvelopeHash !== previousEnvelopeHash) throw new Error('encrypted journal chain mismatch');
        const record = await this.decryptEnvelope(envelope);
        records.push(record);
        envelopes.push(envelope);
        keyVersions.add(envelope.keyVersion);
        previousEnvelopeHash = envelope.envelopeHash;
      } catch {
        firstCorruptLine = index + 1;
        break;
      }
    }

    return {
      tenantId: this.tenantId,
      recordType: this.recordType,
      records,
      envelopes,
      integrityVerified: firstCorruptLine === undefined,
      corruptedTailLines: firstCorruptLine === undefined ? [] : lines.slice(firstCorruptLine - 1),
      firstCorruptLine,
      journalFileExists: true,
      journalBytes: Buffer.byteLength(raw, 'utf8'),
      journalSha256: sha256(Buffer.from(raw, 'utf8')),
      keyVersionsObserved: [...keyVersions].sort((a, b) => a - b),
    };
  }

  async quarantineCorruptedTail(scan: JournalScanResult<T>): Promise<QuarantineReceipt | undefined> {
    if (scan.tenantId !== this.tenantId || scan.recordType !== this.recordType) throw new Error('scan scope mismatch');
    if (!scan.firstCorruptLine || scan.corruptedTailLines.length === 0) return undefined;
    const target = this.filePath();
    const quarantineRoot = path.join(path.dirname(target), 'quarantine');
    await fs.mkdir(quarantineRoot, { recursive: true, mode: 0o700 });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const quarantinePath = path.join(quarantineRoot, `${path.basename(target)}.${stamp}.tail.jsonl`);
    const body = `${scan.corruptedTailLines.join('\n')}\n`;
    await fs.writeFile(quarantinePath, body, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
    return {
      tenantId: this.tenantId,
      recordType: this.recordType,
      createdAt: new Date().toISOString(),
      sourceJournalSha256: scan.journalSha256,
      firstCorruptLine: scan.firstCorruptLine,
      quarantinedLines: scan.corruptedTailLines.length,
      quarantinePath,
      quarantineSha256: sha256(Buffer.from(body, 'utf8')),
      originalJournalModified: false,
    };
  }
}

export class EncryptedOperationsCheckpointStore {
  constructor(
    private readonly rootDir: string,
    private readonly tenantId: string,
    private readonly keyResolver: TenantOperationsKeyResolver,
  ) {
    assertTenantId(tenantId);
  }

  private checkpointPath(): string {
    const tenantRoot = path.resolve(this.rootDir, this.tenantId);
    const target = path.resolve(tenantRoot, 'latest.xivcheckpoint.json');
    if (!target.startsWith(`${tenantRoot}${path.sep}`)) throw new Error('path traversal rejected');
    return target;
  }

  async save(payload: OperationsCheckpointPayload): Promise<EncryptedCheckpointEnvelope> {
    if (payload.tenantId !== this.tenantId) throw new Error('tenant isolation violation');
    if (!payload.checkpointId) throw new Error('checkpoint id is required');
    if (payload.eventSequence !== payload.sourceEvents.length || payload.receiptSequence !== payload.sourceReceipts.length) {
      throw new Error('checkpoint sequence/source length mismatch');
    }
    if (eventHead(payload.sourceEvents) !== payload.eventHeadHash || receiptHead(payload.sourceReceipts) !== payload.receiptHeadHash) {
      throw new Error('checkpoint source head mismatch');
    }
    if (payload.view.tenantId !== this.tenantId || payload.view.sourceHeadHash !== payload.eventHeadHash || payload.view.receiptHeadHash !== payload.receiptHeadHash) {
      throw new Error('checkpoint view/source mismatch');
    }
    const actualViewHash = sha256(canonical(payload.view));
    if (!equalHex(actualViewHash, payload.viewHash)) throw new Error('checkpoint view hash mismatch');

    const material = await this.keyResolver.resolveKey(this.tenantId);
    assertKeyMaterial(material, this.tenantId);
    const createdAt = new Date().toISOString();
    const base = {
      version: 1 as const,
      tenantId: this.tenantId,
      checkpointId: payload.checkpointId,
      keyId: material.keyId,
      keyVersion: material.keyVersion,
      createdAt,
    };
    const aad = checkpointAad(base);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', material.key, iv);
    cipher.setAAD(aad);
    const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const ciphertextChecksum = sha256(ciphertext);
    const macSha256 = createHmac('sha256', material.key).update(aad).update(ciphertext).digest('hex');
    const envelope: EncryptedCheckpointEnvelope = {
      ...base,
      algorithm: 'AES-256-GCM',
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      aadHash: sha256(aad),
      plaintextHash: sha256(plaintext),
      ciphertextChecksum,
      macSha256,
    };
    const destination = this.checkpointPath();
    await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    const temporary = `${destination}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(envelope), { encoding: 'utf8', mode: 0o600 });
    await fs.rename(temporary, destination);
    try { await fs.chmod(destination, 0o600); } catch { /* best effort */ }
    return envelope;
  }

  async load(): Promise<{ envelope: EncryptedCheckpointEnvelope; payload: OperationsCheckpointPayload } | undefined> {
    const source = this.checkpointPath();
    let raw: string;
    try { raw = await fs.readFile(source, 'utf8'); } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
    const envelope = JSON.parse(raw) as EncryptedCheckpointEnvelope;
    if (envelope.version !== 1 || envelope.algorithm !== 'AES-256-GCM' || envelope.tenantId !== this.tenantId) throw new Error('checkpoint envelope scope/version mismatch');
    const material = await this.keyResolver.resolveKey(this.tenantId, envelope.keyVersion);
    assertKeyMaterial(material, this.tenantId);
    if (material.keyId !== envelope.keyId || material.keyVersion !== envelope.keyVersion) throw new Error('checkpoint key identity mismatch');
    const aad = checkpointAad(envelope);
    if (!equalHex(sha256(aad), envelope.aadHash)) throw new Error('checkpoint AAD mismatch');
    const ciphertext = Buffer.from(envelope.ciphertext, 'base64');
    if (!equalHex(sha256(ciphertext), envelope.ciphertextChecksum)) throw new Error('checkpoint ciphertext checksum mismatch');
    const actualMac = createHmac('sha256', material.key).update(aad).update(ciphertext).digest('hex');
    if (!equalHex(actualMac, envelope.macSha256)) throw new Error('checkpoint MAC mismatch');
    const decipher = createDecipheriv('aes-256-gcm', material.key, Buffer.from(envelope.iv, 'base64'));
    decipher.setAAD(aad);
    decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    if (!equalHex(sha256(plaintext), envelope.plaintextHash)) throw new Error('checkpoint plaintext hash mismatch');
    const payload = JSON.parse(plaintext.toString('utf8')) as OperationsCheckpointPayload;
    if (payload.tenantId !== this.tenantId || payload.checkpointId !== envelope.checkpointId) throw new Error('checkpoint payload scope mismatch');
    return { envelope, payload };
  }
}

export function createOperationsCheckpoint(input: {
  tenantId: string;
  events: readonly OperationsEvent[];
  receipts: readonly VerificationReceipt[];
  asOfMs: number;
  staleAfterMs?: number;
}): OperationsCheckpointPayload {
  const view = rebuildOperationsView(input.tenantId, input.events, input.receipts, input.asOfMs, input.staleAfterMs);
  return {
    tenantId: input.tenantId,
    checkpointId: randomUUID(),
    createdAt: new Date(input.asOfMs).toISOString(),
    eventSequence: input.events.length,
    receiptSequence: input.receipts.length,
    eventHeadHash: eventHead(input.events),
    receiptHeadHash: receiptHead(input.receipts),
    sourceEvents: input.events.map((event) => ({ ...event, evidenceRefs: [...event.evidenceRefs], payload: { ...event.payload } })),
    sourceReceipts: input.receipts.map((receipt) => ({ ...receipt, evidenceRefs: [...receipt.evidenceRefs] })),
    view,
    viewHash: sha256(canonical(view)),
  };
}

export function verifyCheckpointAgainstPrefix(
  payload: OperationsCheckpointPayload,
  events: readonly OperationsEvent[],
  receipts: readonly VerificationReceipt[],
): CheckpointVerification {
  const reasons: string[] = [];
  if (events.length < payload.eventSequence) reasons.push('EVENT_PREFIX_SHORTER_THAN_CHECKPOINT');
  if (receipts.length < payload.receiptSequence) reasons.push('RECEIPT_PREFIX_SHORTER_THAN_CHECKPOINT');
  const eventPrefix = events.slice(0, payload.eventSequence);
  const receiptPrefix = receipts.slice(0, payload.receiptSequence);
  if (eventHead(eventPrefix) !== payload.eventHeadHash) reasons.push('EVENT_HEAD_MISMATCH');
  if (receiptHead(receiptPrefix) !== payload.receiptHeadHash) reasons.push('RECEIPT_HEAD_MISMATCH');
  if (payload.sourceEvents.length !== payload.eventSequence || payload.sourceReceipts.length !== payload.receiptSequence) reasons.push('CHECKPOINT_SOURCE_LENGTH_MISMATCH');
  if (eventHead(payload.sourceEvents) !== payload.eventHeadHash || receiptHead(payload.sourceReceipts) !== payload.receiptHeadHash) reasons.push('CHECKPOINT_EMBEDDED_SOURCE_HEAD_MISMATCH');
  if (!equalHex(sha256(canonical(payload.view)), payload.viewHash)) reasons.push('CHECKPOINT_VIEW_HASH_MISMATCH');
  if (payload.view.sourceHeadHash !== payload.eventHeadHash || payload.view.receiptHeadHash !== payload.receiptHeadHash) reasons.push('CHECKPOINT_VIEW_HEAD_MISMATCH');
  return { verified: reasons.length === 0, reasons };
}

export function buildPlatformSyncTelemetry(
  events: readonly OperationsEvent[],
  receipts: readonly VerificationReceipt[],
  asOfMs: number,
): Record<string, PlatformSyncTelemetry> {
  const verifiedDevices = new Set(
    receipts
      .filter((receipt) => receipt.kind === 'DEVICE' && receipt.status === 'VERIFIED' && isCurrentReceipt(receipt, asOfMs))
      .map((receipt) => receipt.subjectId),
  );
  const rows = new Map<string, { subjects: Set<string>; success: number; error: number; latencies: number[] }>();
  for (const event of events) {
    if (event.kind !== 'SYNC') continue;
    const platform = typeof event.payload.platform === 'string' ? event.payload.platform : '';
    const subject = typeof event.payload.deviceSubjectId === 'string' ? event.payload.deviceSubjectId : '';
    if (!platform || !subject || !verifiedDevices.has(subject)) continue;
    const row = rows.get(platform) ?? { subjects: new Set<string>(), success: 0, error: 0, latencies: [] };
    row.subjects.add(subject);
    if (event.payload.outcome === 'SUCCESS') row.success++;
    else if (event.payload.outcome === 'ERROR') row.error++;
    const latency = event.payload.latencyMs;
    if (typeof latency === 'number' && Number.isFinite(latency) && latency >= 0) row.latencies.push(latency);
    rows.set(platform, row);
  }
  const result: Record<string, PlatformSyncTelemetry> = {};
  for (const [platform, row] of rows) {
    const attempts = row.success + row.error;
    result[platform] = {
      platform,
      verifiedDeviceSubjects: row.subjects.size,
      success: row.success,
      error: row.error,
      attempts,
      successRate: attempts === 0 ? 0 : row.success / attempts,
      latencySamples: row.latencies.length,
      p50LatencyMs: percentile(row.latencies, 0.5),
      p95LatencyMs: percentile(row.latencies, 0.95),
      measuredOnly: true,
      universalSupportClaim: false,
    };
  }
  return result;
}

export class OperationsRecoverySupervisor {
  constructor(
    private readonly tenantId: string,
    private readonly eventStore: EncryptedOperationsJournalStore<OperationsEvent>,
    private readonly receiptStore: EncryptedOperationsJournalStore<VerificationReceipt>,
    private readonly checkpointStore: EncryptedOperationsCheckpointStore,
  ) {
    assertTenantId(tenantId);
  }

  async recover(input: { asOfMs: number; staleAfterMs?: number; quarantineCorruptedTails?: boolean }): Promise<{
    view?: OperationsMaterializedView;
    syncTelemetry: Record<string, PlatformSyncTelemetry>;
    receipt: RecoveryReceipt;
    quarantineReceipts: QuarantineReceipt[];
  }> {
    const eventScan = await this.eventStore.scan();
    const receiptScan = await this.receiptStore.scan();
    const quarantineReceipts: QuarantineReceipt[] = [];
    if (input.quarantineCorruptedTails) {
      const eventQuarantine = await this.eventStore.quarantineCorruptedTail(eventScan);
      const receiptQuarantine = await this.receiptStore.quarantineCorruptedTail(receiptScan);
      if (eventQuarantine) quarantineReceipts.push(eventQuarantine);
      if (receiptQuarantine) quarantineReceipts.push(receiptQuarantine);
    }

    let checkpointLoaded: Awaited<ReturnType<EncryptedOperationsCheckpointStore['load']>>;
    let checkpointLoadError: string | undefined;
    try { checkpointLoaded = await this.checkpointStore.load(); } catch (error) { checkpointLoadError = error instanceof Error ? error.message : String(error); }

    let checkpointVerified = false;
    let checkpointVerificationReasons: string[] = [];
    let combinedEvents = eventScan.records;
    let combinedReceipts = receiptScan.records;
    let eventTailReplayed = eventScan.records.length;
    let receiptTailReplayed = receiptScan.records.length;

    if (checkpointLoadError) checkpointVerificationReasons.push(`CHECKPOINT_LOAD_FAILED:${checkpointLoadError}`);
    if (checkpointLoaded) {
      const verification = verifyCheckpointAgainstPrefix(checkpointLoaded.payload, eventScan.records, receiptScan.records);
      checkpointVerified = verification.verified;
      checkpointVerificationReasons = [...checkpointVerificationReasons, ...verification.reasons];
      if (checkpointVerified) {
        const eventTail = eventScan.records.slice(checkpointLoaded.payload.eventSequence);
        const receiptTail = receiptScan.records.slice(checkpointLoaded.payload.receiptSequence);
        combinedEvents = [...checkpointLoaded.payload.sourceEvents, ...eventTail];
        combinedReceipts = [...checkpointLoaded.payload.sourceReceipts, ...receiptTail];
        eventTailReplayed = eventTail.length;
        receiptTailReplayed = receiptTail.length;
      }
    }

    const journalIntegrity = eventScan.integrityVerified && receiptScan.integrityVerified;
    const checkpointRequiredButInvalid = Boolean(checkpointLoaded) && !checkpointVerified;
    const canRebuild = !checkpointRequiredButInvalid && combinedEvents.every((event) => event.tenantId === this.tenantId) && combinedReceipts.every((receipt) => receipt.tenantId === this.tenantId);
    let view: OperationsMaterializedView | undefined;
    let rebuildError: string | undefined;
    if (canRebuild) {
      try { view = rebuildOperationsView(this.tenantId, combinedEvents, combinedReceipts, input.asOfMs, input.staleAfterMs); }
      catch (error) { rebuildError = error instanceof Error ? error.message : String(error); }
    }

    const syncTelemetry = view ? buildPlatformSyncTelemetry(combinedEvents, combinedReceipts, input.asOfMs) : {};
    const evidenceRefs = [
      eventScan.journalSha256 ? `sha256:event-journal:${eventScan.journalSha256}` : 'event-journal:absent',
      receiptScan.journalSha256 ? `sha256:receipt-journal:${receiptScan.journalSha256}` : 'receipt-journal:absent',
      ...quarantineReceipts.map((receipt) => `sha256:quarantine:${receipt.quarantineSha256}`),
    ];
    if (checkpointLoaded) evidenceRefs.push(`checkpoint:${checkpointLoaded.payload.checkpointId}:key-v${checkpointLoaded.envelope.keyVersion}`);
    if (rebuildError) checkpointVerificationReasons.push(`VIEW_REBUILD_FAILED:${rebuildError}`);

    let status: RecoveryStatus = 'HEALTHY';
    if (!view || checkpointRequiredButInvalid) status = 'BLOCKED';
    else if (!journalIntegrity || quarantineReceipts.length > 0 || view.stale) status = 'DEGRADED';
    else if (!eventScan.journalFileExists && !receiptScan.journalFileExists && !checkpointLoaded) status = 'UNVERIFIED';

    const recoveryReceipt: RecoveryReceipt = {
      receiptId: randomUUID(),
      tenantId: this.tenantId,
      status,
      recoveredAt: new Date(input.asOfMs).toISOString(),
      checkpointId: checkpointLoaded?.payload.checkpointId,
      checkpointVerified,
      checkpointVerificationReasons,
      eventRecordsRecovered: combinedEvents.length,
      receiptRecordsRecovered: combinedReceipts.length,
      eventTailReplayed,
      receiptTailReplayed,
      eventCorruptTailLines: eventScan.corruptedTailLines.length,
      receiptCorruptTailLines: receiptScan.corruptedTailLines.length,
      eventKeyVersionsObserved: eventScan.keyVersionsObserved,
      receiptKeyVersionsObserved: receiptScan.keyVersionsObserved,
      freshnessMs: view?.freshnessMs ?? Number.MAX_SAFE_INTEGER,
      stale: view?.stale ?? true,
      integrityVerified: Boolean(view?.integrityVerified) && (journalIntegrity || quarantineReceipts.length > 0) && !checkpointRequiredButInvalid,
      evidenceRefs,
      source: {
        eventHeadHash: view?.sourceHeadHash ?? eventHead(eventScan.records),
        receiptHeadHash: view?.receiptHeadHash ?? receiptHead(receiptScan.records),
        eventJournalSha256: eventScan.journalSha256,
        receiptJournalSha256: receiptScan.journalSha256,
      },
      authority: { canWriteProduction: false, canDeploy: false, canMoveMoney: false, canOpenAccounts: false, canSignContracts: false },
    };
    return { view, syncTelemetry, receipt: recoveryReceipt, quarantineReceipts };
  }
}

export function buildExecutiveRecoverySnapshot(
  view: OperationsMaterializedView,
  recovery: RecoveryReceipt,
  syncTelemetry: Record<string, PlatformSyncTelemetry>,
) {
  if (view.tenantId !== recovery.tenantId) throw new Error('tenant isolation violation');
  const base = buildReadOnlyExecutiveControlSnapshot(view);
  return {
    ...base,
    recovery: {
      status: recovery.status,
      checkpointId: recovery.checkpointId,
      checkpointVerified: recovery.checkpointVerified,
      eventRecordsRecovered: recovery.eventRecordsRecovered,
      receiptRecordsRecovered: recovery.receiptRecordsRecovered,
      eventTailReplayed: recovery.eventTailReplayed,
      receiptTailReplayed: recovery.receiptTailReplayed,
      eventCorruptTailLines: recovery.eventCorruptTailLines,
      receiptCorruptTailLines: recovery.receiptCorruptTailLines,
      freshnessMs: recovery.freshnessMs,
      stale: recovery.stale,
      integrityVerified: recovery.integrityVerified,
      evidenceRefs: [...recovery.evidenceRefs],
    },
    syncTelemetry,
    grounding: {
      dimensions12D: 'SEMANTIC_COMPUTATIONAL',
      parallelUniverses: 'DETERMINISTIC_SIMULATIONS_DIGITAL_TWINS',
      quantum: 'SIMULATOR_ADAPTER_RESEARCH_UNLESS_QPU_BENCHMARK_EVIDENCE',
      dataGenome: 'VERSIONED_CONFIGURATION_CAPABILITY_PROVENANCE',
      graphEdgesAreFacts: false,
      correlationIsCausation: false,
      topSecretOrdinaryExternalRoutingAllowed: false,
      universalDeviceSupportClaim: false,
      vendorTargetImpliesPartnership: false,
      autonomousCounterattackAllowed: false,
    },
    authority: {
      readOnly: true,
      canWrite: false,
      canDeploy: false,
      canPublish: false,
      canMoveMoney: false,
      canOpenAccounts: false,
      canSignContracts: false,
    },
  } as const;
}
