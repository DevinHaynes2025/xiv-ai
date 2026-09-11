import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'TOP_SECRET';
export type RetrievalRoute = 'LOCAL_ONLY' | 'LOCAL_RESTRICTED' | 'HYBRID';
export type DeviceAdapterStatus = 'TARGET' | 'ADAPTER_BUILT' | 'TESTED' | 'VERIFIED';
export type VendorAdapterStatus = 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED_PARTNER';
export type SyncAdapterKind = 'DEVICE' | 'VENDOR';

export interface RetrievalAuthoritySnapshot {
  tenantId: string;
  userId: string;
  universeId: string;
  grantId: string;
  grantCurrent: boolean;
  consentReceiptId?: string;
  consentCurrent: boolean;
  policyReceiptId?: string;
  policyCurrent: boolean;
  scopes: string[];
  authorizationVersion: number;
  evidenceRefs: string[];
}

export type RetrievalAuthorityResolver = (input: {
  tenantId: string;
  userId: string;
  universeId: string;
  grantId: string;
}) => Promise<RetrievalAuthoritySnapshot>;

export interface AgentMemoryPolicy {
  agentId: string;
  role: string;
  memoryNamespace: string;
  readableNamespaces: string[];
  writableNamespaces: string[];
  allowedScopes: string[];
  classificationCeiling: DataClassification;
  goals: string[];
  policyRefs: string[];
  evidenceRefs: string[];
  consciousness: false;
  freeWill: false;
  independentLegalAuthority: false;
}

export interface RetrievalSession {
  sessionId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  agentId: string;
  memoryNamespace: string;
  grantId: string;
  consentReceiptId?: string;
  policyReceiptId?: string;
  scopes: string[];
  authorizationVersion: number;
  startedAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  invalidationReason?: string;
  evidenceRefs: string[];
}

export interface RetrievalAccessReceipt {
  receiptId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  sessionId: string;
  agentId: string;
  memoryNamespace: string;
  scope: string;
  classification: DataClassification;
  route: RetrievalRoute;
  querySha256: string;
  candidateCount: number;
  hitCount: number;
  ordinaryEmbeddingEligible: boolean;
  ordinaryEmbeddingsExecuted: false;
  externalPluginAllowed: boolean;
  publicWebAllowed: boolean;
  clientRenderingAllowed: boolean;
  authorized: true;
  authorizationVersion: number;
  evidenceRefs: string[];
  observedAt: string;
  sequence: number;
  previousHash: string;
  hash: string;
}

export interface UniverseLearningKeyMaterial {
  tenantId: string;
  userId: string;
  keyId: string;
  keyVersion: number;
  key: Buffer;
  evidenceRefs: string[];
}

export interface UniverseLearningKeyResolver {
  resolve(tenantId: string, userId: string, keyVersion?: number): Promise<UniverseLearningKeyMaterial>;
}

export interface LearningEvaluationEntry {
  kind: 'EVALUATION';
  evaluationId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  agentId: string;
  memoryNamespace: string;
  subjectVersion: string;
  evaluationScore: number;
  threshold: number;
  promoted: boolean;
  promotionVersion?: string;
  provenanceRefs: string[];
  evidenceRefs: string[];
  evaluatedAt: string;
  modelWeightsMutated: false;
  graphEdgeIsFact: false;
  correlationIsCausation: false;
  neuralPathwayMeaning: 'VERSIONED_CONFIGURATION_CAPABILITY_PROVENANCE_EDGE';
}

export interface LearningRollbackEntry {
  kind: 'ROLLBACK';
  rollbackId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  agentId: string;
  memoryNamespace: string;
  evaluationId: string;
  promotionVersion: string;
  rollbackToVersion: string;
  reason: string;
  provenanceRefs: string[];
  evidenceRefs: string[];
  rolledBackAt: string;
  modelWeightsMutated: false;
}

export type LearningJournalEntry = LearningEvaluationEntry | LearningRollbackEntry;

interface EncryptedLearningEnvelope {
  schemaVersion: 1;
  tenantId: string;
  userId: string;
  sequence: number;
  previousHash: string;
  keyId: string;
  keyVersion: number;
  iv: string;
  authTag: string;
  ciphertext: string;
  plaintextSha256: string;
  createdAt: string;
  evidenceRefs: string[];
  hash: string;
}

export interface SharedLearningExportInput {
  tenantId: string;
  universeId: string;
  exportId: string;
  classification: DataClassification;
  cohortSize: number;
  aggregateOnly: boolean;
  minimized: boolean;
  anonymized: boolean;
  rawRecordsIncluded: boolean;
  directIdentifiersIncluded: boolean;
  metricNames: string[];
  evidenceRefs: string[];
  approvedByPolicy: boolean;
}

export interface SharedLearningExportReceipt {
  receiptId: string;
  tenantId: string;
  universeId: string;
  exportId: string;
  approved: true;
  cohortSize: number;
  minimumCohortSize: 5;
  aggregateOnly: true;
  minimized: true;
  anonymized: true;
  rawRecordsIncluded: false;
  directIdentifiersIncluded: false;
  topSecretIncluded: false;
  metricNames: string[];
  evidenceRefs: string[];
  emittedAt: string;
}

export interface SyncVerificationInput {
  adapterId: string;
  kind: SyncAdapterKind;
  providerName: string;
  platform?: string;
  deviceStatus?: DeviceAdapterStatus;
  vendorStatus?: VendorAdapterStatus;
  verificationReceiptId?: string;
  verifiedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  evidenceRefs: string[];
}

export interface SyncAttemptInput {
  tenantId: string;
  userId: string;
  universeId: string;
  authorizationGrantId: string;
  explicitUserAuthorization: boolean;
  classification: DataClassification;
  adapter: SyncVerificationInput;
  success: boolean;
  latencyMs: number;
  errorCode?: string;
  evidenceRefs: string[];
  attemptedAt?: string;
}

export interface PrivacyPreservingSyncReceipt {
  receiptId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  authorizationGrantId: string;
  adapterId: string;
  adapterKind: SyncAdapterKind;
  providerName: string;
  platform?: string;
  verificationReceiptId: string;
  classification: DataClassification;
  success: boolean;
  latencyMs: number;
  errorCode?: string;
  evidenceRefs: string[];
  attemptedAt: string;
  explicitUserAuthorization: true;
  rawPrivateDataCentralizedByDefault: false;
  universalDeviceSupportClaim: false;
  partnershipClaimInferred: false;
  sequence: number;
  previousHash: string;
  hash: string;
}

export interface SyncTelemetryBucket {
  key: string;
  attempts: number;
  successes: number;
  errors: number;
  successRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
}

export interface SyncTelemetrySummary {
  totalAttempts: number;
  expiredOrRevokedRejected: number;
  byPlatform: SyncTelemetryBucket[];
  byVendor: SyncTelemetryBucket[];
  universalDeviceSupportClaim: false;
  partnershipClaimInferred: false;
}

export const GROUNDING_INVARIANTS_12D73 = Object.freeze({
  dimensionMeaning: 'semantic/computational dimensions',
  parallelUniverseMeaning: 'deterministic simulations/digital twins',
  quantumDefault: 'simulator/adapter/research unless real QPU and benchmark evidence exist',
  dataDnaMeaning: 'versioned configuration/capability/provenance',
  historicalPeopleMeaning: 'source-backed profiles, not revived persons',
  offlineImpliesAuthorization: false,
  graphEdgesAreFacts: false,
  correlationIsCausation: false,
  consciousnessClaim: false,
  freeWillClaim: false,
  rawPrivateDataCentralizedByDefault: false,
  topSecretOrdinaryEmbeddingAllowed: false,
  topSecretExternalPluginAllowed: false,
  topSecretPublicWebAllowed: false,
  topSecretClientRenderingAllowed: false,
  autonomousCounterattackAllowed: false,
  financialAutonomousMoneyMovementAllowed: false,
  financialAccountOpeningAllowed: false,
  financialContractSigningAllowed: false,
});

const GENESIS = '0'.repeat(64);
const CLASSIFICATION_RANK: Record<DataClassification, number> = {
  PUBLIC: 0, INTERNAL: 1, CONFIDENTIAL: 2, RESTRICTED: 3, TOP_SECRET: 4,
};

function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).filter((key) => object[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonical(object[key])}`).join(',')}}`;
  }
  const serialized = JSON.stringify(value);
  return serialized === undefined ? 'null' : serialized;
}

function assertEvidence(values: readonly string[], label: string): void {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => !value.trim())) throw new Error(`${label} evidence is required`);
}

function assertIdentifier(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value)) throw new Error(`invalid ${label}`);
}

function parseTime(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error('invalid timestamp');
  return parsed;
}

function isCurrent(expiresAt: string | undefined, revokedAt: string | undefined, asOf: number): boolean {
  if (revokedAt && parseTime(revokedAt) <= asOf) return false;
  if (expiresAt && parseTime(expiresAt) <= asOf) return false;
  return true;
}

function scopesCover(granted: readonly string[], requested: readonly string[]): boolean {
  const set = new Set(granted);
  return requested.every((scope) => set.has(scope));
}

async function ensurePrivateDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
}

async function appendPrivate(filePath: string, content: string): Promise<void> {
  await ensurePrivateDir(path.dirname(filePath));
  await fs.appendFile(filePath, content, { encoding: 'utf8', mode: 0o600 });
}

function safePath(root: string, tenantId: string, userId: string, ...parts: string[]): string {
  assertIdentifier(tenantId, 'tenant id');
  assertIdentifier(userId, 'user id');
  for (const part of parts) assertIdentifier(part, 'path segment');
  const base = path.resolve(root);
  const target = path.join(base, tenantId, 'users', userId, ...parts);
  const relative = path.relative(base, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('path traversal rejected');
  return target;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function assertAgentPolicy(policy: AgentMemoryPolicy): void {
  assertIdentifier(policy.agentId, 'agent id');
  assertIdentifier(policy.memoryNamespace, 'memory namespace');
  assertEvidence(policy.evidenceRefs, 'agent memory policy');
  if (policy.consciousness || policy.freeWill || policy.independentLegalAuthority) throw new Error('agent grounding invariant violated');
}

export class RetrievalAccessJournal {
  readonly filePath: string;
  readonly tenantId: string;
  readonly userId: string;

  constructor(root: string, tenantId: string, userId: string) {
    this.tenantId = tenantId;
    this.userId = userId;
    this.filePath = safePath(root, tenantId, userId, 'retrieval', 'authorized-access.xivjsonl');
  }

  async load(): Promise<RetrievalAccessReceipt[]> {
    let raw: string;
    try { raw = await fs.readFile(this.filePath, 'utf8'); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const receipts = raw.split('\n').filter(Boolean).map((line) => JSON.parse(line) as RetrievalAccessReceipt);
    let previousHash = GENESIS;
    for (let index = 0; index < receipts.length; index += 1) {
      const receipt = receipts[index];
      if (receipt.tenantId !== this.tenantId || receipt.userId !== this.userId) throw new Error('retrieval journal tenant/user isolation failure');
      if (receipt.sequence !== index + 1 || receipt.previousHash !== previousHash) throw new Error('retrieval journal sequence/hash-chain failure');
      const { hash, ...unsigned } = receipt;
      if (sha256(canonical(unsigned)) !== hash) throw new Error('retrieval access receipt integrity failure');
      previousHash = hash;
    }
    return receipts;
  }

  async append(input: Omit<RetrievalAccessReceipt, 'receiptId' | 'sequence' | 'previousHash' | 'hash'>): Promise<RetrievalAccessReceipt> {
    if (input.tenantId !== this.tenantId || input.userId !== this.userId) throw new Error('retrieval journal tenant/user mismatch');
    const receipts = await this.load();
    const unsigned = { ...input, receiptId: randomUUID(), sequence: receipts.length + 1, previousHash: receipts.at(-1)?.hash ?? GENESIS };
    const receipt: RetrievalAccessReceipt = { ...unsigned, hash: sha256(canonical(unsigned)) };
    await appendPrivate(this.filePath, `${JSON.stringify(receipt)}\n`);
    return receipt;
  }
}

export class AuthorizedRetrievalSessionRegistry {
  private readonly sessions = new Map<string, RetrievalSession>();
  private readonly policies = new Map<string, AgentMemoryPolicy>();
  private readonly authorityResolver: RetrievalAuthorityResolver;
  private readonly journal: RetrievalAccessJournal;

  constructor(authorityResolver: RetrievalAuthorityResolver, journal: RetrievalAccessJournal, policies: AgentMemoryPolicy[]) {
    this.authorityResolver = authorityResolver;
    this.journal = journal;
    for (const policy of policies) {
      assertAgentPolicy(policy);
      if (this.policies.has(policy.agentId)) throw new Error('duplicate agent policy');
      this.policies.set(policy.agentId, policy);
    }
    if (this.policies.size < 2 || this.policies.size > 8) throw new Error('active agent team must contain 2-8 governed agents');
  }

  async startSession(input: {
    tenantId: string; userId: string; universeId: string; agentId: string; memoryNamespace: string;
    grantId: string; scopes: string[]; ttlMs: number; evidenceRefs: string[]; now?: Date;
  }): Promise<RetrievalSession> {
    assertEvidence(input.evidenceRefs, 'retrieval session');
    if (!Number.isFinite(input.ttlMs) || input.ttlMs <= 0) throw new Error('positive session ttl required');
    const policy = this.policies.get(input.agentId);
    if (!policy) throw new Error('unknown governed agent');
    if (!policy.readableNamespaces.includes(input.memoryNamespace)) throw new Error('agent read namespace denied');
    if (!scopesCover(policy.allowedScopes, input.scopes)) throw new Error('agent scope denied');
    const authority = await this.authorityResolver({ tenantId: input.tenantId, userId: input.userId, universeId: input.universeId, grantId: input.grantId });
    this.assertAuthority(authority, input, input.scopes);
    const now = input.now ?? new Date();
    const session: RetrievalSession = {
      sessionId: randomUUID(), tenantId: input.tenantId, userId: input.userId, universeId: input.universeId,
      agentId: input.agentId, memoryNamespace: input.memoryNamespace, grantId: input.grantId,
      consentReceiptId: authority.consentReceiptId, policyReceiptId: authority.policyReceiptId,
      scopes: [...input.scopes], authorizationVersion: authority.authorizationVersion,
      startedAt: now.toISOString(), expiresAt: new Date(now.getTime() + input.ttlMs).toISOString(), status: 'ACTIVE',
      evidenceRefs: [...new Set([...input.evidenceRefs, ...authority.evidenceRefs])],
    };
    this.sessions.set(session.sessionId, session);
    return { ...session };
  }

  invalidateByGrant(grantId: string, reason = 'authorization grant revoked'): number {
    return this.invalidate((session) => session.grantId === grantId, reason);
  }
  invalidateByConsent(consentReceiptId: string, reason = 'consent revoked'): number {
    return this.invalidate((session) => session.consentReceiptId === consentReceiptId, reason);
  }
  invalidateByPolicy(policyReceiptId: string, reason = 'policy invalidated'): number {
    return this.invalidate((session) => session.policyReceiptId === policyReceiptId, reason);
  }

  private invalidate(match: (session: RetrievalSession) => boolean, reason: string): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.status === 'ACTIVE' && match(session)) {
        session.status = 'REVOKED'; session.invalidationReason = reason; count += 1;
      }
    }
    return count;
  }

  private assertAuthority(authority: RetrievalAuthoritySnapshot, input: { tenantId: string; userId: string; universeId: string; grantId: string }, scopes: string[]): void {
    if (authority.tenantId !== input.tenantId || authority.userId !== input.userId || authority.universeId !== input.universeId || authority.grantId !== input.grantId) throw new Error('authorization subject mismatch');
    if (!authority.grantCurrent || !authority.consentCurrent || !authority.policyCurrent) throw new Error('authorization/consent/policy not current');
    if (!Number.isInteger(authority.authorizationVersion) || authority.authorizationVersion < 1) throw new Error('invalid authorization version');
    if (!scopesCover(authority.scopes, scopes)) throw new Error('authorization scopes denied');
    assertEvidence(authority.evidenceRefs, 'retrieval authority');
  }

  async authorizeRead(input: {
    sessionId: string; scope: string; memoryNamespace: string; classification: DataClassification; route: RetrievalRoute;
    query: string; candidateCount: number; hitCount: number; evidenceRefs: string[]; now?: Date;
  }): Promise<RetrievalAccessReceipt> {
    const session = this.sessions.get(input.sessionId);
    if (!session || session.status !== 'ACTIVE') throw new Error('retrieval session inactive');
    const now = input.now ?? new Date();
    if (parseTime(session.expiresAt) <= now.getTime()) { session.status = 'EXPIRED'; throw new Error('retrieval session expired'); }
    if (!session.scopes.includes(input.scope)) throw new Error('retrieval scope denied');
    const policy = this.policies.get(session.agentId)!;
    if (!policy.readableNamespaces.includes(input.memoryNamespace) || input.memoryNamespace !== session.memoryNamespace) throw new Error('agent read namespace denied');
    if (CLASSIFICATION_RANK[input.classification] > CLASSIFICATION_RANK[policy.classificationCeiling]) throw new Error('agent classification ceiling exceeded');
    const authority = await this.authorityResolver({ tenantId: session.tenantId, userId: session.userId, universeId: session.universeId, grantId: session.grantId });
    this.assertAuthority(authority, session, [input.scope]);
    if (authority.authorizationVersion !== session.authorizationVersion) {
      session.status = 'REVOKED'; session.invalidationReason = 'authorization version changed';
      throw new Error('retrieval session invalidated by authorization change');
    }
    if (input.classification === 'TOP_SECRET' && input.route !== 'LOCAL_RESTRICTED') throw new Error('TOP_SECRET retrieval must use LOCAL_RESTRICTED route');
    assertEvidence(input.evidenceRefs, 'retrieval read');
    return this.journal.append({
      tenantId: session.tenantId, userId: session.userId, universeId: session.universeId, sessionId: session.sessionId,
      agentId: session.agentId, memoryNamespace: input.memoryNamespace, scope: input.scope, classification: input.classification,
      route: input.route, querySha256: sha256(input.query), candidateCount: input.candidateCount, hitCount: input.hitCount,
      ordinaryEmbeddingEligible: input.classification !== 'TOP_SECRET', ordinaryEmbeddingsExecuted: false,
      externalPluginAllowed: input.classification !== 'TOP_SECRET' && input.route === 'HYBRID', publicWebAllowed: false,
      clientRenderingAllowed: input.classification !== 'TOP_SECRET', authorized: true, authorizationVersion: session.authorizationVersion,
      evidenceRefs: [...new Set([...session.evidenceRefs, ...authority.evidenceRefs, ...input.evidenceRefs])], observedAt: now.toISOString(),
    });
  }

  assertWriteAllowed(agentId: string, namespace: string, classification: DataClassification, scope: string): void {
    const policy = this.policies.get(agentId);
    if (!policy) throw new Error('unknown governed agent');
    if (!policy.writableNamespaces.includes(namespace)) throw new Error('agent write namespace denied');
    if (!policy.allowedScopes.includes(scope)) throw new Error('agent write scope denied');
    if (CLASSIFICATION_RANK[classification] > CLASSIFICATION_RANK[policy.classificationCeiling]) throw new Error('agent classification ceiling exceeded');
  }
}

function learningEnvelopeHash(envelope: Omit<EncryptedLearningEnvelope, 'hash'>): string {
  return sha256(canonical(envelope));
}

export class EncryptedLearningEvaluationJournal {
  readonly filePath: string;
  readonly tenantId: string;
  readonly userId: string;
  private readonly keyResolver: UniverseLearningKeyResolver;

  constructor(root: string, tenantId: string, userId: string, keyResolver: UniverseLearningKeyResolver) {
    this.tenantId = tenantId; this.userId = userId; this.keyResolver = keyResolver;
    this.filePath = safePath(root, tenantId, userId, 'learning', 'evaluations.xivencjsonl');
  }

  private async resolveKey(keyVersion?: number): Promise<UniverseLearningKeyMaterial> {
    const key = await this.keyResolver.resolve(this.tenantId, this.userId, keyVersion);
    if (key.tenantId !== this.tenantId || key.userId !== this.userId) throw new Error('learning key tenant/user mismatch');
    if (!Buffer.isBuffer(key.key) || key.key.length !== 32) throw new Error('learning key must be 32 bytes');
    assertEvidence(key.evidenceRefs, 'learning key');
    return key;
  }

  private async loadEnvelopes(): Promise<EncryptedLearningEnvelope[]> {
    let raw: string;
    try { raw = await fs.readFile(this.filePath, 'utf8'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
    const envelopes = raw.split('\n').filter(Boolean).map((line) => JSON.parse(line) as EncryptedLearningEnvelope);
    let previousHash = GENESIS;
    for (let index = 0; index < envelopes.length; index += 1) {
      const envelope = envelopes[index];
      if (envelope.tenantId !== this.tenantId || envelope.userId !== this.userId) throw new Error('learning journal tenant/user isolation failure');
      if (envelope.sequence !== index + 1 || envelope.previousHash !== previousHash) throw new Error('learning journal sequence/hash-chain failure');
      const { hash, ...unsigned } = envelope;
      if (learningEnvelopeHash(unsigned) !== hash) throw new Error('learning envelope integrity failure');
      previousHash = hash;
    }
    return envelopes;
  }

  async load(): Promise<LearningJournalEntry[]> {
    const envelopes = await this.loadEnvelopes();
    const entries: LearningJournalEntry[] = [];
    for (const envelope of envelopes) {
      const key = await this.resolveKey(envelope.keyVersion);
      if (key.keyId !== envelope.keyId) throw new Error('learning key identity mismatch');
      const aad = canonical({ schemaVersion: envelope.schemaVersion, tenantId: envelope.tenantId, userId: envelope.userId, sequence: envelope.sequence, previousHash: envelope.previousHash, keyId: envelope.keyId, keyVersion: envelope.keyVersion, createdAt: envelope.createdAt, evidenceRefs: envelope.evidenceRefs });
      const decipher = createDecipheriv('aes-256-gcm', key.key, Buffer.from(envelope.iv, 'base64'));
      decipher.setAAD(Buffer.from(aad, 'utf8')); decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
      const plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]);
      if (sha256(plaintext) !== envelope.plaintextSha256) throw new Error('learning plaintext integrity failure');
      entries.push(JSON.parse(plaintext.toString('utf8')) as LearningJournalEntry);
    }
    return entries;
  }

  private async append(entry: LearningJournalEntry): Promise<LearningJournalEntry> {
    if (entry.tenantId !== this.tenantId || entry.userId !== this.userId) throw new Error('learning entry tenant/user mismatch');
    assertEvidence(entry.evidenceRefs, 'learning entry'); assertEvidence(entry.provenanceRefs, 'learning provenance');
    const envelopes = await this.loadEnvelopes();
    const key = await this.resolveKey();
    const sequence = envelopes.length + 1;
    const previousHash = envelopes.at(-1)?.hash ?? GENESIS;
    const createdAt = entry.kind === 'EVALUATION' ? entry.evaluatedAt : entry.rolledBackAt;
    const aadObject = { schemaVersion: 1 as const, tenantId: this.tenantId, userId: this.userId, sequence, previousHash, keyId: key.keyId, keyVersion: key.keyVersion, createdAt, evidenceRefs: entry.evidenceRefs };
    const aad = canonical(aadObject);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key.key, iv); cipher.setAAD(Buffer.from(aad, 'utf8'));
    const plaintext = Buffer.from(JSON.stringify(entry), 'utf8');
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const unsigned: Omit<EncryptedLearningEnvelope, 'hash'> = {
      ...aadObject, iv: iv.toString('base64'), authTag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64'), plaintextSha256: sha256(plaintext),
    };
    const envelope: EncryptedLearningEnvelope = { ...unsigned, hash: learningEnvelopeHash(unsigned) };
    await appendPrivate(this.filePath, `${JSON.stringify(envelope)}\n`);
    return entry;
  }

  async recordEvaluation(input: Omit<LearningEvaluationEntry, 'kind' | 'evaluationId' | 'promoted' | 'promotionVersion' | 'modelWeightsMutated' | 'graphEdgeIsFact' | 'correlationIsCausation' | 'neuralPathwayMeaning'> & { promotionVersion?: string }): Promise<LearningEvaluationEntry> {
    if (!Number.isFinite(input.evaluationScore) || input.evaluationScore < 0 || input.evaluationScore > 1) throw new Error('evaluation score must be within 0..1');
    if (!Number.isFinite(input.threshold) || input.threshold < 0 || input.threshold > 1) throw new Error('evaluation threshold must be within 0..1');
    const promoted = input.evaluationScore >= input.threshold;
    if (promoted && !input.promotionVersion) throw new Error('promotion version required for promoted evaluation');
    const entry: LearningEvaluationEntry = { ...input, kind: 'EVALUATION', evaluationId: randomUUID(), promoted, promotionVersion: promoted ? input.promotionVersion : undefined, modelWeightsMutated: false, graphEdgeIsFact: false, correlationIsCausation: false, neuralPathwayMeaning: 'VERSIONED_CONFIGURATION_CAPABILITY_PROVENANCE_EDGE' };
    return this.append(entry) as Promise<LearningEvaluationEntry>;
  }

  async recordRollback(input: Omit<LearningRollbackEntry, 'kind' | 'rollbackId' | 'modelWeightsMutated'>): Promise<LearningRollbackEntry> {
    const entries = await this.load();
    const source = entries.find((entry): entry is LearningEvaluationEntry => entry.kind === 'EVALUATION' && entry.evaluationId === input.evaluationId);
    if (!source?.promoted || source.promotionVersion !== input.promotionVersion) throw new Error('rollback requires matching promoted evaluation');
    const entry: LearningRollbackEntry = { ...input, kind: 'ROLLBACK', rollbackId: randomUUID(), modelWeightsMutated: false };
    return this.append(entry) as Promise<LearningRollbackEntry>;
  }
}

export function approveSharedLearningExport(input: SharedLearningExportInput, now = new Date()): SharedLearningExportReceipt {
  assertEvidence(input.evidenceRefs, 'shared learning export');
  if (!input.approvedByPolicy) throw new Error('shared learning policy approval required');
  if (input.classification === 'TOP_SECRET') throw new Error('TOP_SECRET cannot enter shared learning export');
  if (input.cohortSize < 5) throw new Error('minimum privacy cohort is 5');
  if (!input.aggregateOnly || !input.minimized || !input.anonymized) throw new Error('shared learning must be aggregate, minimized, and anonymized');
  if (input.rawRecordsIncluded || input.directIdentifiersIncluded) throw new Error('raw records/direct identifiers prohibited');
  if (input.metricNames.length === 0 || input.metricNames.some((name) => !name.trim())) throw new Error('aggregate metric names required');
  return { receiptId: randomUUID(), tenantId: input.tenantId, universeId: input.universeId, exportId: input.exportId, approved: true, cohortSize: input.cohortSize, minimumCohortSize: 5, aggregateOnly: true, minimized: true, anonymized: true, rawRecordsIncluded: false, directIdentifiersIncluded: false, topSecretIncluded: false, metricNames: [...new Set(input.metricNames)], evidenceRefs: input.evidenceRefs, emittedAt: now.toISOString() };
}

export class PrivacyPreservingSyncReceiptJournal {
  readonly filePath: string;
  readonly tenantId: string;
  readonly userId: string;
  private rejectedExpiredOrRevoked = 0;

  constructor(root: string, tenantId: string, userId: string) {
    this.tenantId = tenantId; this.userId = userId;
    this.filePath = safePath(root, tenantId, userId, 'sync', 'privacy-preserving-sync.xivjsonl');
  }

  async load(): Promise<PrivacyPreservingSyncReceipt[]> {
    let raw: string;
    try { raw = await fs.readFile(this.filePath, 'utf8'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
    const receipts = raw.split('\n').filter(Boolean).map((line) => JSON.parse(line) as PrivacyPreservingSyncReceipt);
    let previousHash = GENESIS;
    for (let index = 0; index < receipts.length; index += 1) {
      const receipt = receipts[index];
      if (receipt.tenantId !== this.tenantId || receipt.userId !== this.userId) throw new Error('sync journal tenant/user isolation failure');
      if (receipt.sequence !== index + 1 || receipt.previousHash !== previousHash) throw new Error('sync journal sequence/hash-chain failure');
      const { hash, ...unsigned } = receipt;
      if (sha256(canonical(unsigned)) !== hash) throw new Error('sync receipt integrity failure');
      previousHash = hash;
    }
    return receipts;
  }

  async record(input: SyncAttemptInput): Promise<PrivacyPreservingSyncReceipt> {
    if (input.tenantId !== this.tenantId || input.userId !== this.userId) throw new Error('sync tenant/user mismatch');
    if (!input.explicitUserAuthorization) throw new Error('explicit user authorization required for sync');
    if (input.classification === 'TOP_SECRET') throw new Error('TOP_SECRET external/device sync prohibited');
    assertEvidence(input.evidenceRefs, 'sync attempt'); assertEvidence(input.adapter.evidenceRefs, 'sync adapter verification');
    const asOf = parseTime(input.attemptedAt ?? new Date().toISOString());
    if (!isCurrent(input.adapter.expiresAt, input.adapter.revokedAt, asOf)) { this.rejectedExpiredOrRevoked += 1; throw new Error('sync adapter verification expired or revoked'); }
    const statusVerified = input.adapter.kind === 'DEVICE' ? input.adapter.deviceStatus === 'VERIFIED' : input.adapter.vendorStatus === 'VERIFIED_PARTNER';
    if (!statusVerified || !input.adapter.verificationReceiptId || !input.adapter.verifiedAt) throw new Error('evidence-backed verified adapter required');
    if (parseTime(input.adapter.verifiedAt) > asOf) throw new Error('adapter verification cannot be in the future');
    if (!Number.isFinite(input.latencyMs) || input.latencyMs < 0) throw new Error('non-negative measured latency required');
    const receipts = await this.load();
    const unsigned = {
      receiptId: randomUUID(), tenantId: input.tenantId, userId: input.userId, universeId: input.universeId,
      authorizationGrantId: input.authorizationGrantId, adapterId: input.adapter.adapterId, adapterKind: input.adapter.kind,
      providerName: input.adapter.providerName, platform: input.adapter.platform, verificationReceiptId: input.adapter.verificationReceiptId,
      classification: input.classification, success: input.success, latencyMs: input.latencyMs, errorCode: input.errorCode,
      evidenceRefs: [...new Set([...input.evidenceRefs, ...input.adapter.evidenceRefs])], attemptedAt: input.attemptedAt ?? new Date().toISOString(),
      explicitUserAuthorization: true as const, rawPrivateDataCentralizedByDefault: false as const, universalDeviceSupportClaim: false as const,
      partnershipClaimInferred: false as const, sequence: receipts.length + 1, previousHash: receipts.at(-1)?.hash ?? GENESIS,
    };
    const receipt: PrivacyPreservingSyncReceipt = { ...unsigned, hash: sha256(canonical(unsigned)) };
    await appendPrivate(this.filePath, `${JSON.stringify(receipt)}\n`);
    return receipt;
  }

  async summarize(): Promise<SyncTelemetrySummary> {
    const receipts = await this.load();
    const build = (pairs: Array<[string, PrivacyPreservingSyncReceipt]>): SyncTelemetryBucket[] => {
      const grouped = new Map<string, PrivacyPreservingSyncReceipt[]>();
      for (const [key, receipt] of pairs) grouped.set(key, [...(grouped.get(key) ?? []), receipt]);
      return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => {
        const successes = values.filter((value) => value.success).length;
        const latencies = values.map((value) => value.latencyMs);
        return { key, attempts: values.length, successes, errors: values.length - successes, successRate: values.length ? successes / values.length : 0, p50LatencyMs: percentile(latencies, 50), p95LatencyMs: percentile(latencies, 95) };
      });
    };
    return {
      totalAttempts: receipts.length, expiredOrRevokedRejected: this.rejectedExpiredOrRevoked,
      byPlatform: build(receipts.filter((r) => r.adapterKind === 'DEVICE').map((r) => [r.platform ?? 'UNKNOWN', r])),
      byVendor: build(receipts.filter((r) => r.adapterKind === 'VENDOR').map((r) => [r.providerName, r])),
      universalDeviceSupportClaim: false, partnershipClaimInferred: false,
    };
  }
}
