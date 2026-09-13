import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';

type FeedbackState = 'ACTIVE_REVIEW_CANDIDATE' | 'CONSENT_WITHDRAWN' | 'DELETION_PENDING';
type StoredFeedback = {
  recordId: string; tenantId: string; universeId: string; userId: string;
  consentReceiptId: string; createdAt: string; state: FeedbackState;
  keyId: string; iv: string; authTag: string; ciphertext: string;
};
type LedgerEvent =
  | { kind: 'SUBMITTED'; at: string; record: StoredFeedback }
  | { kind: 'CONSENT_WITHDRAWN' | 'DELETION_REQUESTED'; at: string; recordId: string; tenantId: string; universeId: string; userId: string };

const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;

export const FEEDBACK_GOVERNANCE_STATUS = {
  encryptedLocalAdapter: 'IMPLEMENTED' as const,
  encryption: 'AES_256_GCM_INJECTED_KEY' as const,
  productionStorage: 'NOT_CONFIGURED' as const,
  productionWritesEnabled: false as const,
  consentWithdrawal: 'APPEND_ONLY_TOMBSTONE' as const,
  physicalDeletion: 'OPERATOR_WORKFLOW_REQUIRED' as const,
  automaticPathwayPromotion: false as const,
  modelWeightTraining: false as const,
};

function validateId(value: string, name: string) {
  if (!SAFE_ID.test(value)) throw new Error(`invalid_${name}`);
}

export class EncryptedFeedbackLedger {
  private readonly journalPath: string;
  private readonly records = new Map<string, StoredFeedback>();
  private readonly key: Buffer;
  private readonly keyId: string;
  private readonly now: () => Date;

  constructor(input: { rootDirectory: string; key: Buffer; keyId: string; now?: () => Date }) {
    if (input.key.length !== 32) throw new Error('invalid_encryption_key');
    validateId(input.keyId, 'key_id');
    const root = resolve(input.rootDirectory);
    if (root === resolve('/') || root === resolve(process.cwd())) throw new Error('unsafe_storage_root');
    mkdirSync(root, { recursive: true, mode: 0o700 });
    this.journalPath = join(root, 'feedback-events.jsonl');
    this.key = Buffer.from(input.key);
    this.keyId = input.keyId;
    this.now = input.now ?? (() => new Date());
    this.rehydrate();
  }

  submit(input: { tenantId: string; universeId: string; userId: string; consentReceiptId: string; feedback: string }) {
    for (const [name, value] of Object.entries(input).filter(([name]) => name !== 'feedback')) validateId(value, name);
    const feedback = input.feedback.trim();
    if (feedback.length < 10 || feedback.length > 2000) throw new Error('invalid_feedback_length');
    const recordId = randomUUID();
    const createdAt = this.now().toISOString();
    const aad = Buffer.from(`${input.tenantId}\u0000${input.universeId}\u0000${input.userId}\u0000${recordId}`);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    cipher.setAAD(aad);
    const ciphertext = Buffer.concat([cipher.update(feedback, 'utf8'), cipher.final()]);
    const record: StoredFeedback = {
      recordId, tenantId: input.tenantId, universeId: input.universeId, userId: input.userId,
      consentReceiptId: input.consentReceiptId, createdAt, state: 'ACTIVE_REVIEW_CANDIDATE', keyId: this.keyId,
      iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64'),
    };
    this.append({ kind: 'SUBMITTED', at: createdAt, record });
    return this.publicRecord(record);
  }

  readForOwner(scope: { tenantId: string; universeId: string; userId: string; recordId: string }) {
    const record = this.scopedRecord(scope);
    if (record.state !== 'ACTIVE_REVIEW_CANDIDATE') throw new Error('feedback_unavailable');
    if (record.keyId !== this.keyId) throw new Error('key_unavailable');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(record.iv, 'base64'));
    decipher.setAAD(Buffer.from(`${record.tenantId}\u0000${record.universeId}\u0000${record.userId}\u0000${record.recordId}`));
    decipher.setAuthTag(Buffer.from(record.authTag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(record.ciphertext, 'base64')), decipher.final()]).toString('utf8');
  }

  withdrawConsent(scope: { tenantId: string; universeId: string; userId: string; recordId: string }) {
    const record = this.scopedRecord(scope);
    if (record.state !== 'ACTIVE_REVIEW_CANDIDATE') throw new Error('feedback_not_active');
    this.append({ kind: 'CONSENT_WITHDRAWN', at: this.now().toISOString(), ...scope });
    return this.publicRecord(this.records.get(scope.recordId)!);
  }

  requestDeletion(scope: { tenantId: string; universeId: string; userId: string; recordId: string }) {
    const record = this.scopedRecord(scope);
    if (record.state !== 'CONSENT_WITHDRAWN') throw new Error('withdraw_consent_first');
    this.append({ kind: 'DELETION_REQUESTED', at: this.now().toISOString(), ...scope });
    return this.publicRecord(this.records.get(scope.recordId)!);
  }

  private scopedRecord(scope: { tenantId: string; universeId: string; userId: string; recordId: string }) {
    const record = this.records.get(scope.recordId);
    if (!record || record.tenantId !== scope.tenantId || record.universeId !== scope.universeId || record.userId !== scope.userId) throw new Error('feedback_not_found');
    return record;
  }

  private publicRecord(record: StoredFeedback) {
    return { recordId: record.recordId, tenantId: record.tenantId, universeId: record.universeId, userId: record.userId, consentReceiptId: record.consentReceiptId, createdAt: record.createdAt, state: record.state, encryptedAtRest: true as const, rawFeedbackReturned: false as const, pathwayPromoted: false as const, modelWeightsModified: false as const };
  }

  private append(event: LedgerEvent) {
    appendFileSync(this.journalPath, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 });
    this.apply(event);
  }

  private rehydrate() {
    let contents = '';
    try { contents = readFileSync(this.journalPath, 'utf8'); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    for (const line of contents.split('\n').filter(Boolean)) this.apply(JSON.parse(line) as LedgerEvent);
  }

  private apply(event: LedgerEvent) {
    if (event.kind === 'SUBMITTED') { this.records.set(event.record.recordId, event.record); return; }
    const record = this.records.get(event.recordId);
    if (!record || record.tenantId !== event.tenantId || record.universeId !== event.universeId || record.userId !== event.userId) throw new Error('corrupt_feedback_journal');
    record.state = event.kind === 'CONSENT_WITHDRAWN' ? 'CONSENT_WITHDRAWN' : 'DELETION_PENDING';
  }
}

export function evaluateFeedbackPathwayPromotion(input: { consentActive: boolean; moderationApproved: boolean; evaluationScore: number; independentReviewReferences: readonly string[]; humanApprovalReference?: string }) {
  const independent = new Set(input.independentReviewReferences.filter((value) => SAFE_ID.test(value))).size;
  const allowed = input.consentActive && input.moderationApproved && input.evaluationScore >= 0.92 && independent >= 2 && Boolean(input.humanApprovalReference && SAFE_ID.test(input.humanApprovalReference));
  return { allowed, state: allowed ? 'ELIGIBLE_FOR_SEPARATE_PROMOTION_WORKFLOW' as const : 'REVIEW_REQUIRED' as const, pathwayPromoted: false as const, modelWeightsModified: false as const, productionWritePerformed: false as const };
}
