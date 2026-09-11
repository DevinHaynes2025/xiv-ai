import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import {
  approveSharedLearningSignal,
  type ConsentReceipt,
  type DataClassification,
  type LegalPolicyReceipt,
  type SensitiveDataClass,
  type SharedLearningSignal,
  type UniverseKeyMaterial,
  type UniverseKeyResolver,
} from './sovereign-universe-data-room-agent-twins';

export type AuthorizationEventKind = 'GRANT' | 'REVOKE' | 'ACCESS';
export type VendorAdapterStatus = 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED_PARTNER';
export type DeviceAdapterStatus = 'TARGET' | 'ADAPTER_BUILT' | 'TESTED' | 'VERIFIED';
export type SyncAdapterKind = 'DEVICE' | 'EXTERNAL';
export type RagExecutionMode = 'LOCAL_ONLY' | 'HYBRID';

export interface UniverseAuthorizationGrant {
  grantId: string;
  tenantId: string;
  userId: string;
  subjectId: string;
  universeId: string;
  scopes: string[];
  authorizationType: 'USER_EXPLICIT';
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  evidenceRefs: string[];
}

export interface AuthorizationLedgerEvent {
  eventId: string;
  tenantId: string;
  userId: string;
  sequence: number;
  previousHash: string;
  kind: AuthorizationEventKind;
  at: string;
  grant?: UniverseAuthorizationGrant;
  grantId?: string;
  actorId?: string;
  requestedScopes?: string[];
  resourceRef?: string;
  outcome?: 'ALLOWED' | 'DENIED';
  reason?: string;
  evidenceRefs: string[];
  hash: string;
}

export interface AuthorizationDecision {
  allowed: boolean;
  reasons: string[];
  grant?: UniverseAuthorizationGrant;
}

export interface ConsentPolicyBundle {
  bundleId: string;
  tenantId: string;
  userId: string;
  consentReceipt: ConsentReceipt;
  legalPolicyReceipt: LegalPolicyReceipt;
  evidenceRefs: string[];
  storedAt: string;
}

export interface ConsentPolicyVaultReceipt {
  receiptId: string;
  tenantId: string;
  userId: string;
  bundleId: string;
  encryptedAtRest: true;
  algorithm: 'AES-256-GCM';
  keyId: string;
  keyVersion: number;
  bytesOnDisk: number;
  envelopeSha256: string;
  evidenceRefs: string[];
  observedAt: string;
}

interface EncryptedEnvelope {
  version: 1;
  algorithm: 'AES-256-GCM';
  tenantId: string;
  userId: string;
  objectType: 'CONSENT_POLICY' | 'RAG_MEMORY';
  objectId: string;
  keyId: string;
  keyVersion: number;
  iv: string;
  authTag: string;
  ciphertext: string;
  plaintextSha256: string;
  metadataSha256: string;
  createdAt: string;
  evidenceRefs: string[];
}

export interface UniverseRagMemoryRecord {
  schemaVersion: 1;
  recordId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  agentMemoryNamespace: string;
  classification: DataClassification;
  dataClass: SensitiveDataClass;
  content: string;
  sourceEvidenceRefs: string[];
  authorizationGrantId: string;
  consentPolicyBundleId?: string;
  createdAt: string;
}

export interface LocalEmbeddingVerificationReceipt {
  receiptId: string;
  tenantId: string;
  adapterId: string;
  runtimeId: string;
  status: 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED';
  verifiedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  evidenceRefs: string[];
}

export interface RagMemoryPersistenceReceipt {
  receiptId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  recordId: string;
  agentMemoryNamespace: string;
  classification: DataClassification;
  encryptedAtRest: true;
  localFirst: true;
  ordinaryEmbeddingEligible: boolean;
  topSecretOrdinaryEmbeddingAllowed: false;
  keyVersion: number;
  path: string;
  evidenceRefs: string[];
  observedAt: string;
}

export interface RagRetrievalHit {
  recordId: string;
  score: number;
  classification: DataClassification;
  dataClass: SensitiveDataClass;
  agentMemoryNamespace: string;
  content: string;
  evidenceRefs: string[];
}

export interface RagRetrievalReceipt {
  receiptId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  agentMemoryNamespace: string;
  executionMode: RagExecutionMode;
  retrievalMode: 'DETERMINISTIC_LEXICAL';
  ordinaryEmbeddingsExecuted: false;
  verifiedEmbeddingAdapterObserved: boolean;
  topSecretHybridAllowed: false;
  querySha256: string;
  candidateCount: number;
  hitCount: number;
  evidenceRefs: string[];
  observedAt: string;
}

export interface LearningEvaluationReceipt {
  receiptId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  recordId: string;
  agentMemoryNamespace: string;
  evaluationScore: number;
  threshold: number;
  promotedToPrivateMemory: boolean;
  modelWeightsMutated: false;
  graphEdgeIsFact: false;
  correlationIsCausation: false;
  neuralPathwayMeaning: 'VERSIONED_CONFIGURATION_CAPABILITY_PROVENANCE_EDGE';
  evidenceRefs: string[];
  evaluatedAt: string;
}

export interface SyncAdapterVerificationReceipt {
  receiptId: string;
  tenantId: string;
  adapterId: string;
  kind: SyncAdapterKind;
  providerName: string;
  platform?: string;
  vendorStatus?: VendorAdapterStatus;
  deviceStatus?: DeviceAdapterStatus;
  supportedScopes: string[];
  jurisdictions: string[];
  verifiedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  evidenceRefs: string[];
}

export interface UniverseSyncDecision {
  allowed: boolean;
  reasons: string[];
  adapterVerified: boolean;
  explicitUserAuthorization: boolean;
  rawPrivateDataCentralizedByDefault: false;
  topSecretExternalRoutingAllowed: false;
  universalDeviceSupportClaim: false;
}

export const GROUNDING_INVARIANTS_12D72 = Object.freeze({
  dimensionMeaning: 'semantic/computational dimensions',
  parallelUniverseMeaning: 'deterministic simulations/digital twins',
  quantumDefault: 'simulator/adapter/research unless real QPU and benchmark evidence exist',
  dataDnaMeaning: 'versioned configuration/capability/provenance',
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
});

const GENESIS = '0'.repeat(64);

function sha256(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonical(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function assertIdentifier(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value)) throw new Error(`invalid ${label}`);
}

function assertEvidence(values: readonly string[], label: string): void {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => !value.trim())) throw new Error(`${label} evidence is required`);
}

function assertNonEmpty(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} is required`);
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

function eventHash(event: Omit<AuthorizationLedgerEvent, 'hash'>): string {
  return sha256(canonical(event));
}

async function ensurePrivateDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
}

async function atomicWrite(filePath: string, content: string): Promise<void> {
  await ensurePrivateDir(path.dirname(filePath));
  const temp = `${filePath}.${randomUUID()}.tmp`;
  await fs.writeFile(temp, content, { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temp, filePath);
}

async function appendPrivate(filePath: string, content: string): Promise<void> {
  await ensurePrivateDir(path.dirname(filePath));
  await fs.appendFile(filePath, content, { encoding: 'utf8', mode: 0o600 });
}

function normalizedTokens(value: string): string[] {
  return [...new Set(value.toLowerCase().split(/[^a-z0-9]+/g).filter((token) => token.length > 1))];
}

function lexicalScore(query: string, content: string): number {
  const queryTokens = normalizedTokens(query);
  if (queryTokens.length === 0) return 0;
  const contentTokens = new Set(normalizedTokens(content));
  const matches = queryTokens.filter((token) => contentTokens.has(token)).length;
  return matches / queryTokens.length;
}

async function resolveKey(keyResolver: UniverseKeyResolver, tenantId: string, userId: string, keyVersion?: number): Promise<UniverseKeyMaterial> {
  const key = await keyResolver.resolve(tenantId, userId, keyVersion);
  if (key.tenantId !== tenantId || key.userId !== userId) throw new Error('key tenant/user isolation mismatch');
  if (!Buffer.isBuffer(key.key) || key.key.length !== 32) throw new Error('AES-256-GCM key must be 32 bytes');
  if (!Number.isInteger(key.keyVersion) || key.keyVersion < 1) throw new Error('invalid key version');
  assertEvidence(key.evidenceRefs, 'key material');
  return key;
}

async function encryptEnvelope(input: {
  tenantId: string;
  userId: string;
  objectType: EncryptedEnvelope['objectType'];
  objectId: string;
  plaintext: string;
  evidenceRefs: string[];
  keyResolver: UniverseKeyResolver;
  now: Date;
}): Promise<EncryptedEnvelope> {
  const key = await resolveKey(input.keyResolver, input.tenantId, input.userId);
  const createdAt = input.now.toISOString();
  const metadata = {
    version: 1 as const,
    algorithm: 'AES-256-GCM' as const,
    tenantId: input.tenantId,
    userId: input.userId,
    objectType: input.objectType,
    objectId: input.objectId,
    keyId: key.keyId,
    keyVersion: key.keyVersion,
    createdAt,
    evidenceRefs: input.evidenceRefs,
  };
  const metadataSha256 = sha256(canonical(metadata));
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key.key, iv);
  cipher.setAAD(Buffer.from(metadataSha256, 'utf8'));
  const plaintextBuffer = Buffer.from(input.plaintext, 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()]);
  return {
    ...metadata,
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    plaintextSha256: sha256(plaintextBuffer),
    metadataSha256,
  };
}

async function decryptEnvelope(envelope: EncryptedEnvelope, keyResolver: UniverseKeyResolver): Promise<string> {
  const metadata = {
    version: envelope.version,
    algorithm: envelope.algorithm,
    tenantId: envelope.tenantId,
    userId: envelope.userId,
    objectType: envelope.objectType,
    objectId: envelope.objectId,
    keyId: envelope.keyId,
    keyVersion: envelope.keyVersion,
    createdAt: envelope.createdAt,
    evidenceRefs: envelope.evidenceRefs,
  };
  const metadataSha256 = sha256(canonical(metadata));
  if (metadataSha256 !== envelope.metadataSha256) throw new Error('encrypted envelope metadata integrity failure');
  const key = await resolveKey(keyResolver, envelope.tenantId, envelope.userId, envelope.keyVersion);
  if (key.keyId !== envelope.keyId || key.keyVersion !== envelope.keyVersion) throw new Error('encrypted envelope key identity mismatch');
  const decipher = createDecipheriv('aes-256-gcm', key.key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAAD(Buffer.from(metadataSha256, 'utf8'));
  decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]);
  if (sha256(plaintext) !== envelope.plaintextSha256) throw new Error('encrypted envelope plaintext integrity failure');
  return plaintext.toString('utf8');
}

export class UniverseAuthorizationLedger {
  readonly root: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly filePath: string;

  constructor(root: string, tenantId: string, userId: string) {
    assertIdentifier(tenantId, 'tenant id');
    assertIdentifier(userId, 'user id');
    this.root = path.resolve(root);
    this.tenantId = tenantId;
    this.userId = userId;
    this.filePath = path.join(this.root, tenantId, 'users', userId, 'authorization', 'universe-authorization.xivjsonl');
  }

  async load(): Promise<AuthorizationLedgerEvent[]> {
    let raw: string;
    try {
      raw = await fs.readFile(this.filePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const events = raw.split('\n').filter(Boolean).map((line) => JSON.parse(line) as AuthorizationLedgerEvent);
    let previousHash = GENESIS;
    let sequence = 1;
    for (const event of events) {
      if (event.tenantId !== this.tenantId || event.userId !== this.userId) throw new Error('authorization ledger tenant/user isolation failure');
      if (event.sequence !== sequence || event.previousHash !== previousHash) throw new Error('authorization ledger sequence/hash-chain failure');
      const { hash, ...unsigned } = event;
      if (eventHash(unsigned) !== hash) throw new Error('authorization ledger event integrity failure');
      previousHash = hash;
      sequence += 1;
    }
    return events;
  }

  private async append(unsigned: Omit<AuthorizationLedgerEvent, 'sequence' | 'previousHash' | 'hash'>): Promise<AuthorizationLedgerEvent> {
    const events = await this.load();
    const eventWithoutHash: Omit<AuthorizationLedgerEvent, 'hash'> = {
      ...unsigned,
      sequence: events.length + 1,
      previousHash: events.at(-1)?.hash ?? GENESIS,
    };
    const event: AuthorizationLedgerEvent = { ...eventWithoutHash, hash: eventHash(eventWithoutHash) };
    await appendPrivate(this.filePath, `${JSON.stringify(event)}\n`);
    return event;
  }

  async grant(grant: UniverseAuthorizationGrant, evidenceRefs: string[], now = new Date()): Promise<AuthorizationLedgerEvent> {
    if (grant.tenantId !== this.tenantId || grant.userId !== this.userId) throw new Error('authorization grant tenant/user mismatch');
    assertIdentifier(grant.grantId, 'grant id');
    assertIdentifier(grant.universeId, 'universe id');
    assertIdentifier(grant.subjectId, 'subject id');
    if (grant.authorizationType !== 'USER_EXPLICIT') throw new Error('only explicit user authorization is accepted');
    if (grant.scopes.length === 0) throw new Error('authorization grant requires minimum scopes');
    assertEvidence(grant.evidenceRefs, 'authorization grant');
    assertEvidence(evidenceRefs, 'authorization ledger');
    if (parseTime(grant.expiresAt) <= now.getTime()) throw new Error('authorization grant is already expired');
    return this.append({
      eventId: `auth:${randomUUID()}`,
      tenantId: this.tenantId,
      userId: this.userId,
      kind: 'GRANT',
      at: now.toISOString(),
      grant,
      evidenceRefs,
    });
  }

  async revoke(grantId: string, actorId: string, evidenceRefs: string[], reason: string, now = new Date()): Promise<AuthorizationLedgerEvent> {
    assertIdentifier(grantId, 'grant id');
    assertIdentifier(actorId, 'actor id');
    assertEvidence(evidenceRefs, 'authorization revocation');
    assertNonEmpty(reason, 'revocation reason');
    return this.append({
      eventId: `auth:${randomUUID()}`,
      tenantId: this.tenantId,
      userId: this.userId,
      kind: 'REVOKE',
      at: now.toISOString(),
      grantId,
      actorId,
      reason,
      evidenceRefs,
    });
  }

  async decide(grantId: string, subjectId: string, universeId: string, requestedScopes: string[], asOf = Date.now()): Promise<AuthorizationDecision> {
    const reasons: string[] = [];
    const events = await this.load();
    const grantEvent = [...events].reverse().find((event) => event.kind === 'GRANT' && event.grant?.grantId === grantId);
    const grant = grantEvent?.grant;
    if (!grant) reasons.push('Explicit user authorization grant was not found.');
    if (grant) {
      const revoked = events.some((event) => event.kind === 'REVOKE' && event.grantId === grantId && parseTime(event.at) <= asOf);
      if (revoked) reasons.push('Authorization grant has been revoked.');
      if (parseTime(grant.expiresAt) <= asOf) reasons.push('Authorization grant has expired.');
      if (grant.subjectId !== subjectId || grant.universeId !== universeId) reasons.push('Authorization grant subject or Universe mismatch.');
      if (!scopesCover(grant.scopes, requestedScopes)) reasons.push('Authorization grant does not cover minimum scopes.');
      if (grant.authorizationType !== 'USER_EXPLICIT') reasons.push('Authorization is not explicit user authorization.');
      if (grant.evidenceRefs.length === 0) reasons.push('Authorization grant is missing evidence.');
    }
    return { allowed: reasons.length === 0, reasons, grant: reasons.length === 0 ? grant : undefined };
  }

  async recordAccess(input: {
    grantId: string;
    actorId: string;
    universeId: string;
    requestedScopes: string[];
    resourceRef: string;
    evidenceRefs: string[];
    now?: Date;
  }): Promise<AuthorizationLedgerEvent> {
    const now = input.now ?? new Date();
    assertEvidence(input.evidenceRefs, 'access');
    assertNonEmpty(input.resourceRef, 'resource ref');
    const decision = await this.decide(input.grantId, input.actorId, input.universeId, input.requestedScopes, now.getTime());
    return this.append({
      eventId: `auth:${randomUUID()}`,
      tenantId: this.tenantId,
      userId: this.userId,
      kind: 'ACCESS',
      at: now.toISOString(),
      grantId: input.grantId,
      actorId: input.actorId,
      requestedScopes: input.requestedScopes,
      resourceRef: input.resourceRef,
      outcome: decision.allowed ? 'ALLOWED' : 'DENIED',
      reason: decision.allowed ? undefined : decision.reasons.join(' '),
      evidenceRefs: input.evidenceRefs,
    });
  }
}

export class ConsentPolicyVault {
  readonly root: string;
  readonly tenantId: string;
  readonly userId: string;
  private readonly keyResolver: UniverseKeyResolver;

  constructor(root: string, tenantId: string, userId: string, keyResolver: UniverseKeyResolver) {
    assertIdentifier(tenantId, 'tenant id');
    assertIdentifier(userId, 'user id');
    this.root = path.resolve(root);
    this.tenantId = tenantId;
    this.userId = userId;
    this.keyResolver = keyResolver;
  }

  private bundlePath(bundleId: string): string {
    assertIdentifier(bundleId, 'bundle id');
    return path.join(this.root, this.tenantId, 'users', this.userId, 'consent-policy', `${bundleId}.xivpolicy.json`);
  }

  private validateBundle(bundle: ConsentPolicyBundle): void {
    if (bundle.tenantId !== this.tenantId || bundle.userId !== this.userId) throw new Error('consent/policy bundle tenant/user mismatch');
    assertEvidence(bundle.evidenceRefs, 'consent/policy bundle');
    const consent = bundle.consentReceipt;
    const policy = bundle.legalPolicyReceipt;
    if (consent.tenantId !== this.tenantId || consent.subjectId !== this.userId) throw new Error('consent receipt tenant/subject mismatch');
    if (policy.tenantId !== this.tenantId) throw new Error('legal policy receipt tenant mismatch');
    if (consent.connectorId !== policy.connectorId || consent.dataClass !== policy.dataClass || consent.jurisdiction !== policy.jurisdiction) throw new Error('consent/legal policy receipt mismatch');
    if (!scopesCover(policy.approvedScopes, consent.scopes)) throw new Error('legal policy does not cover consent scopes');
    assertEvidence(consent.evidenceRefs, 'consent receipt');
    assertEvidence(policy.evidenceRefs, 'legal policy receipt');
  }

  async save(bundle: ConsentPolicyBundle, now = new Date()): Promise<ConsentPolicyVaultReceipt> {
    this.validateBundle(bundle);
    const envelope = await encryptEnvelope({
      tenantId: this.tenantId,
      userId: this.userId,
      objectType: 'CONSENT_POLICY',
      objectId: bundle.bundleId,
      plaintext: canonical(bundle),
      evidenceRefs: bundle.evidenceRefs,
      keyResolver: this.keyResolver,
      now,
    });
    const serialized = `${JSON.stringify(envelope)}\n`;
    const filePath = this.bundlePath(bundle.bundleId);
    await atomicWrite(filePath, serialized);
    return {
      receiptId: `consent-policy-save:${randomUUID()}`,
      tenantId: this.tenantId,
      userId: this.userId,
      bundleId: bundle.bundleId,
      encryptedAtRest: true,
      algorithm: 'AES-256-GCM',
      keyId: envelope.keyId,
      keyVersion: envelope.keyVersion,
      bytesOnDisk: Buffer.byteLength(serialized),
      envelopeSha256: sha256(serialized),
      evidenceRefs: [...bundle.evidenceRefs, ...envelope.evidenceRefs],
      observedAt: now.toISOString(),
    };
  }

  async load(bundleId: string): Promise<ConsentPolicyBundle> {
    const raw = await fs.readFile(this.bundlePath(bundleId), 'utf8');
    const envelope = JSON.parse(raw) as EncryptedEnvelope;
    if (envelope.tenantId !== this.tenantId || envelope.userId !== this.userId || envelope.objectType !== 'CONSENT_POLICY' || envelope.objectId !== bundleId) {
      throw new Error('consent/policy envelope isolation mismatch');
    }
    const bundle = JSON.parse(await decryptEnvelope(envelope, this.keyResolver)) as ConsentPolicyBundle;
    this.validateBundle(bundle);
    return bundle;
  }

  async validateForUse(bundleId: string, input: {
    connectorId: string;
    dataClass: SensitiveDataClass;
    jurisdiction: string;
    scopes: string[];
    requireExternalRouting: boolean;
    asOf?: number;
  }): Promise<string[]> {
    const bundle = await this.load(bundleId);
    const asOf = input.asOf ?? Date.now();
    const reasons: string[] = [];
    const consent = bundle.consentReceipt;
    const policy = bundle.legalPolicyReceipt;
    if (consent.connectorId !== input.connectorId || policy.connectorId !== input.connectorId) reasons.push('Connector does not match consent/policy bundle.');
    if (consent.dataClass !== input.dataClass || policy.dataClass !== input.dataClass) reasons.push('Data class does not match consent/policy bundle.');
    if (consent.jurisdiction !== input.jurisdiction || policy.jurisdiction !== input.jurisdiction) reasons.push('Jurisdiction does not match consent/policy bundle.');
    if (!isCurrent(consent.expiresAt, consent.revokedAt, asOf)) reasons.push('Consent receipt is expired or revoked.');
    if (!isCurrent(policy.expiresAt, policy.revokedAt, asOf)) reasons.push('Legal policy receipt is expired or revoked.');
    if (!scopesCover(consent.scopes, input.scopes)) reasons.push('Consent receipt does not cover minimum scopes.');
    if (!scopesCover(policy.approvedScopes, input.scopes)) reasons.push('Legal policy receipt does not approve minimum scopes.');
    if (input.requireExternalRouting && (!consent.externalRoutingAllowed || !policy.externalRoutingAllowed)) reasons.push('Consent/legal policy does not allow external routing.');
    return reasons;
  }
}

export class PrivacyPreservingUniverseRagBridge {
  readonly root: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly universeId: string;
  private readonly keyResolver: UniverseKeyResolver;
  private readonly authorizationLedger: UniverseAuthorizationLedger;
  private readonly consentPolicyVault: ConsentPolicyVault;
  private readonly embeddingReceipt?: LocalEmbeddingVerificationReceipt;

  constructor(input: {
    root: string;
    tenantId: string;
    userId: string;
    universeId: string;
    keyResolver: UniverseKeyResolver;
    authorizationLedger: UniverseAuthorizationLedger;
    consentPolicyVault: ConsentPolicyVault;
    embeddingReceipt?: LocalEmbeddingVerificationReceipt;
  }) {
    assertIdentifier(input.tenantId, 'tenant id');
    assertIdentifier(input.userId, 'user id');
    assertIdentifier(input.universeId, 'universe id');
    this.root = path.resolve(input.root);
    this.tenantId = input.tenantId;
    this.userId = input.userId;
    this.universeId = input.universeId;
    this.keyResolver = input.keyResolver;
    this.authorizationLedger = input.authorizationLedger;
    this.consentPolicyVault = input.consentPolicyVault;
    this.embeddingReceipt = input.embeddingReceipt;
  }

  private namespaceDir(namespace: string): string {
    assertNonEmpty(namespace, 'agent memory namespace');
    return path.join(this.root, this.tenantId, 'users', this.userId, 'universes', this.universeId, 'rag-memory', sha256(namespace));
  }

  private recordPath(namespace: string, recordId: string): string {
    assertIdentifier(recordId, 'record id');
    return path.join(this.namespaceDir(namespace), `${recordId}.xivrag.json`);
  }

  private embeddingReceiptVerified(asOf = Date.now()): boolean {
    const receipt = this.embeddingReceipt;
    return Boolean(
      receipt &&
      receipt.tenantId === this.tenantId &&
      receipt.status === 'VERIFIED' &&
      receipt.verifiedAt &&
      receipt.evidenceRefs.length > 0 &&
      isCurrent(receipt.expiresAt, receipt.revokedAt, asOf),
    );
  }

  async saveRecord(record: UniverseRagMemoryRecord, requestedScopes: string[], now = new Date()): Promise<RagMemoryPersistenceReceipt> {
    if (record.tenantId !== this.tenantId || record.userId !== this.userId || record.universeId !== this.universeId) throw new Error('RAG record tenant/user/Universe isolation mismatch');
    assertEvidence(record.sourceEvidenceRefs, 'RAG source');
    assertNonEmpty(record.content, 'RAG content');
    const auth = await this.authorizationLedger.decide(record.authorizationGrantId, this.userId, this.universeId, requestedScopes, now.getTime());
    if (!auth.allowed) throw new Error(`RAG memory authorization denied: ${auth.reasons.join(' ')}`);
    if (record.dataClass !== 'GENERAL') {
      if (!record.consentPolicyBundleId) throw new Error('Sensitive RAG memory requires encrypted consent/legal policy receipt bundle.');
      const reasons = await this.consentPolicyVault.validateForUse(record.consentPolicyBundleId, {
        connectorId: 'universe-local-rag',
        dataClass: record.dataClass,
        jurisdiction: 'LOCAL-SOVEREIGN',
        scopes: requestedScopes,
        requireExternalRouting: false,
        asOf: now.getTime(),
      });
      if (reasons.length) throw new Error(`Sensitive RAG memory policy denied: ${reasons.join(' ')}`);
    }
    const envelope = await encryptEnvelope({
      tenantId: this.tenantId,
      userId: this.userId,
      objectType: 'RAG_MEMORY',
      objectId: record.recordId,
      plaintext: canonical(record),
      evidenceRefs: record.sourceEvidenceRefs,
      keyResolver: this.keyResolver,
      now,
    });
    const filePath = this.recordPath(record.agentMemoryNamespace, record.recordId);
    await atomicWrite(filePath, `${JSON.stringify(envelope)}\n`);
    return {
      receiptId: `rag-save:${randomUUID()}`,
      tenantId: this.tenantId,
      userId: this.userId,
      universeId: this.universeId,
      recordId: record.recordId,
      agentMemoryNamespace: record.agentMemoryNamespace,
      classification: record.classification,
      encryptedAtRest: true,
      localFirst: true,
      ordinaryEmbeddingEligible: record.classification !== 'TOP_SECRET' && this.embeddingReceiptVerified(now.getTime()),
      topSecretOrdinaryEmbeddingAllowed: false,
      keyVersion: envelope.keyVersion,
      path: filePath,
      evidenceRefs: [...record.sourceEvidenceRefs, ...envelope.evidenceRefs],
      observedAt: now.toISOString(),
    };
  }

  async loadNamespace(agentMemoryNamespace: string): Promise<UniverseRagMemoryRecord[]> {
    const dir = this.namespaceDir(agentMemoryNamespace);
    let names: string[];
    try {
      names = await fs.readdir(dir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const records: UniverseRagMemoryRecord[] = [];
    for (const name of names.filter((value) => value.endsWith('.xivrag.json')).sort()) {
      const raw = await fs.readFile(path.join(dir, name), 'utf8');
      const envelope = JSON.parse(raw) as EncryptedEnvelope;
      if (envelope.tenantId !== this.tenantId || envelope.userId !== this.userId || envelope.objectType !== 'RAG_MEMORY') throw new Error('RAG envelope isolation mismatch');
      const record = JSON.parse(await decryptEnvelope(envelope, this.keyResolver)) as UniverseRagMemoryRecord;
      if (record.tenantId !== this.tenantId || record.userId !== this.userId || record.universeId !== this.universeId || record.agentMemoryNamespace !== agentMemoryNamespace) {
        throw new Error('RAG record isolation mismatch');
      }
      records.push(record);
    }
    return records;
  }

  async query(input: {
    agentMemoryNamespace: string;
    query: string;
    executionMode: RagExecutionMode;
    useOrdinaryEmbeddings: boolean;
    limit?: number;
    now?: Date;
  }): Promise<{ hits: RagRetrievalHit[]; receipt: RagRetrievalReceipt }> {
    assertNonEmpty(input.query, 'query');
    const now = input.now ?? new Date();
    const records = await this.loadNamespace(input.agentMemoryNamespace);
    const verifiedEmbedding = this.embeddingReceiptVerified(now.getTime());
    const candidates = records.filter((record) => {
      if (record.classification === 'TOP_SECRET') return input.executionMode === 'LOCAL_ONLY' && input.useOrdinaryEmbeddings === false;
      return true;
    });
    const hits = candidates
      .map((record) => ({ record, score: lexicalScore(input.query, record.content) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.record.recordId.localeCompare(b.record.recordId))
      .slice(0, Math.max(1, Math.min(input.limit ?? 5, 20)))
      .map(({ record, score }) => ({
        recordId: record.recordId,
        score,
        classification: record.classification,
        dataClass: record.dataClass,
        agentMemoryNamespace: record.agentMemoryNamespace,
        content: record.content,
        evidenceRefs: record.sourceEvidenceRefs,
      }));
    const evidenceRefs = [...new Set(hits.flatMap((hit) => hit.evidenceRefs))];
    return {
      hits,
      receipt: {
        receiptId: `rag-query:${randomUUID()}`,
        tenantId: this.tenantId,
        userId: this.userId,
        universeId: this.universeId,
        agentMemoryNamespace: input.agentMemoryNamespace,
        executionMode: input.executionMode,
        retrievalMode: 'DETERMINISTIC_LEXICAL',
        ordinaryEmbeddingsExecuted: false,
        verifiedEmbeddingAdapterObserved: verifiedEmbedding,
        topSecretHybridAllowed: false,
        querySha256: sha256(input.query),
        candidateCount: candidates.length,
        hitCount: hits.length,
        evidenceRefs,
        observedAt: now.toISOString(),
      },
    };
  }

  evaluatePromotion(input: {
    record: UniverseRagMemoryRecord;
    evaluationScore: number;
    threshold?: number;
    evidenceRefs: string[];
    now?: Date;
  }): LearningEvaluationReceipt {
    if (input.record.tenantId !== this.tenantId || input.record.userId !== this.userId || input.record.universeId !== this.universeId) throw new Error('learning evaluation record isolation mismatch');
    if (!Number.isFinite(input.evaluationScore) || input.evaluationScore < 0 || input.evaluationScore > 1) throw new Error('evaluation score must be between 0 and 1');
    const threshold = input.threshold ?? 0.8;
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new Error('evaluation threshold must be between 0 and 1');
    assertEvidence(input.evidenceRefs, 'learning evaluation');
    const now = input.now ?? new Date();
    return {
      receiptId: `learning-eval:${randomUUID()}`,
      tenantId: this.tenantId,
      userId: this.userId,
      universeId: this.universeId,
      recordId: input.record.recordId,
      agentMemoryNamespace: input.record.agentMemoryNamespace,
      evaluationScore: input.evaluationScore,
      threshold,
      promotedToPrivateMemory: input.evaluationScore >= threshold,
      modelWeightsMutated: false,
      graphEdgeIsFact: false,
      correlationIsCausation: false,
      neuralPathwayMeaning: 'VERSIONED_CONFIGURATION_CAPABILITY_PROVENANCE_EDGE',
      evidenceRefs: input.evidenceRefs,
      evaluatedAt: now.toISOString(),
    };
  }
}

export function buildApprovedSharedLearningSignal(input: {
  signalId: string;
  tenantId: string;
  sourceUniverseId: string;
  metric: string;
  cohortSize: number;
  aggregateValue: number;
  dimensions: Record<string, string>;
  classification: Exclude<DataClassification, 'TOP_SECRET'>;
  evidenceRefs: string[];
}): SharedLearningSignal {
  return approveSharedLearningSignal({
    ...input,
    anonymized: true,
    minimized: true,
    containsRawRecords: false,
    containsDirectIdentifiers: false,
  });
}

function verifiedSyncAdapter(receipt: SyncAdapterVerificationReceipt, tenantId: string, scopes: string[], jurisdiction: string, asOf: number): boolean {
  if (receipt.tenantId !== tenantId || receipt.evidenceRefs.length === 0 || !scopesCover(receipt.supportedScopes, scopes) || !receipt.jurisdictions.includes(jurisdiction)) return false;
  if (!isCurrent(receipt.expiresAt, receipt.revokedAt, asOf)) return false;
  if (!receipt.verifiedAt) return false;
  if (receipt.kind === 'EXTERNAL') return receipt.vendorStatus === 'VERIFIED_PARTNER';
  return receipt.deviceStatus === 'VERIFIED';
}

export async function decideUniverseSync(input: {
  ledger: UniverseAuthorizationLedger;
  grantId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  classification: DataClassification;
  requestedScopes: string[];
  jurisdiction: string;
  adapterReceipt: SyncAdapterVerificationReceipt;
  now?: Date;
}): Promise<UniverseSyncDecision> {
  const now = input.now ?? new Date();
  const authorization = await input.ledger.decide(input.grantId, input.userId, input.universeId, input.requestedScopes, now.getTime());
  const adapterVerified = verifiedSyncAdapter(input.adapterReceipt, input.tenantId, input.requestedScopes, input.jurisdiction, now.getTime());
  const reasons: string[] = [];
  if (!authorization.allowed) reasons.push(...authorization.reasons);
  if (!adapterVerified) reasons.push(input.adapterReceipt.kind === 'EXTERNAL' ? 'External adapter is not an evidence-backed current VERIFIED_PARTNER.' : 'Device adapter is not an evidence-backed current VERIFIED device adapter.');
  if (input.classification === 'TOP_SECRET') reasons.push('TOP_SECRET cannot be routed through external/device synchronization.');
  return {
    allowed: reasons.length === 0,
    reasons,
    adapterVerified,
    explicitUserAuthorization: authorization.allowed,
    rawPrivateDataCentralizedByDefault: false,
    topSecretExternalRoutingAllowed: false,
    universalDeviceSupportClaim: false,
  };
}
