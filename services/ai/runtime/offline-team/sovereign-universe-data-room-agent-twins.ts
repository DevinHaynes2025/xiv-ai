import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'TOP_SECRET';
export type SensitiveDataClass = 'GENERAL' | 'HEALTH' | 'FINANCIAL' | 'GENETIC' | 'COMMUNICATIONS' | 'SOCIAL_ACCOUNT';
export type AdapterStatus = 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED_PARTNER';
export type FinancialCapability = 'BALANCES_READ' | 'TRANSACTIONS_READ' | 'DOCUMENTS_READ' | 'ANALYTICS';
export type DataRoomAction = 'CREATE_ROOM' | 'PUT_ASSET' | 'READ_ASSET' | 'LIST_ASSETS' | 'GRANT_ACCESS' | 'DENY';

export interface EvidenceRef {
  id: string;
  kind: string;
  observedAt: string;
  sha256?: string;
}

export interface UniverseKeyMaterial {
  tenantId: string;
  userId: string;
  keyId: string;
  keyVersion: number;
  key: Buffer;
  evidenceRefs: string[];
}

export interface UniverseKeyResolver {
  resolve(tenantId: string, userId: string, keyVersion?: number): Promise<UniverseKeyMaterial> | UniverseKeyMaterial;
}

export interface ConsentReceipt {
  receiptId: string;
  tenantId: string;
  subjectId: string;
  connectorId: string;
  dataClass: SensitiveDataClass;
  scopes: string[];
  jurisdiction: string;
  authorizedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  externalRoutingAllowed: boolean;
  evidenceRefs: string[];
}

export interface LegalPolicyReceipt {
  receiptId: string;
  tenantId: string;
  connectorId: string;
  dataClass: SensitiveDataClass;
  jurisdiction: string;
  reviewedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  approvedScopes: string[];
  externalRoutingAllowed: boolean;
  evidenceRefs: string[];
}

export interface SovereignUniverseState {
  schemaVersion: 1;
  tenantId: string;
  userId: string;
  universeId: string;
  classification: DataClassification;
  localFirst: true;
  centralizeRawPrivateDataByDefault: false;
  profile: Record<string, unknown>;
  privateMemory: Record<string, unknown>;
  preferences: Record<string, unknown>;
  evidenceRefs: string[];
  updatedAt: string;
}

export interface UniverseEnvelope {
  version: 1;
  algorithm: 'AES-256-GCM';
  tenantId: string;
  userId: string;
  universeId: string;
  classification: DataClassification;
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

export interface UniversePersistenceReceipt {
  receiptId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  path: string;
  encryptedAtRest: true;
  algorithm: 'AES-256-GCM';
  keyVersion: number;
  bytesOnDisk: number;
  envelopeSha256: string;
  evidenceRefs: string[];
  observedAt: string;
}

export interface ExternalRouteDecision {
  allowed: boolean;
  reasons: string[];
  minimizedOnly: boolean;
  rawPrivateDataAllowed: false;
  topSecretExternalAllowed: false;
}

export interface DataRoomGrant {
  grantId: string;
  tenantId: string;
  roomId: string;
  subjectId: string;
  scopes: string[];
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
  evidenceRefs: string[];
}

export interface DataRoomAssetInput {
  assetId: string;
  name: string;
  content: string;
  classification: Extract<DataClassification, 'CONFIDENTIAL' | 'RESTRICTED' | 'TOP_SECRET'>;
  dataClass: SensitiveDataClass;
  scopes: string[];
  connectorId?: string;
  jurisdiction?: string;
  evidenceRefs: string[];
  consentReceipt?: ConsentReceipt;
  legalPolicyReceipt?: LegalPolicyReceipt;
}

export interface DataRoomAssetMetadata {
  tenantId: string;
  roomId: string;
  ownerUserId: string;
  assetId: string;
  name: string;
  classification: DataRoomAssetInput['classification'];
  dataClass: SensitiveDataClass;
  scopes: string[];
  createdAt: string;
  keyId: string;
  keyVersion: number;
  valueRendered: false;
  evidenceRefs: string[];
}

export interface DataRoomAuditReceipt {
  receiptId: string;
  tenantId: string;
  roomId: string;
  sequence: number;
  previousHash: string;
  actorId: string;
  action: DataRoomAction;
  assetId?: string;
  scopes: string[];
  outcome: 'ALLOWED' | 'DENIED';
  reason?: string;
  evidenceRefs: string[];
  at: string;
  hash: string;
}

export interface GovernedTwinProfile {
  twinId: string;
  tenantId: string;
  userId: string;
  displayName: string;
  profileVersion: string;
  role: string;
  goals: string[];
  policies: string[];
  memoryNamespace: string;
  sourceProfileRefs: string[];
  dataDna: {
    configurationVersion: string;
    capabilityVersion: string;
    provenanceRefs: string[];
  };
  claims: {
    consciousness: false;
    freeWill: false;
    humanClone: false;
    literalHumanIdentity: false;
  };
  evidenceRefs: string[];
}

export interface AgentIdentityProfile {
  agentId: string;
  tenantId: string;
  universeId: string;
  role: string;
  memoryNamespace: string;
  goals: string[];
  policies: string[];
  active: boolean;
  evidenceRefs: string[];
  claims: {
    consciousness: false;
    freeWill: false;
    independentLegalAuthority: false;
  };
}

export interface SharedLearningSignal {
  signalId: string;
  tenantId: string;
  sourceUniverseId: string;
  metric: string;
  cohortSize: number;
  aggregateValue: number;
  dimensions: Record<string, string>;
  anonymized: boolean;
  minimized: boolean;
  containsRawRecords: boolean;
  containsDirectIdentifiers: boolean;
  classification: Exclude<DataClassification, 'TOP_SECRET'>;
  evidenceRefs: string[];
}

export interface AdapterRegistryEntry {
  adapterId: string;
  tenantId: string;
  providerName: string;
  industry: string;
  status: AdapterStatus;
  supportedDataClasses: SensitiveDataClass[];
  supportedScopes: string[];
  jurisdictions: string[];
  verifiedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  evidenceRefs: string[];
}

export interface FinancialConnectorRequest {
  tenantId: string;
  userId: string;
  adapterId: string;
  requestedCapabilities: FinancialCapability[];
  scopes: string[];
  classification: DataClassification;
  jurisdiction: string;
  consentReceipt: ConsentReceipt;
  legalPolicyReceipt: LegalPolicyReceipt;
}

export interface FinancialConnectorDecision {
  allowed: boolean;
  reasons: string[];
  capabilities: FinancialCapability[];
  authority: {
    canMoveMoney: false;
    canOpenAccounts: false;
    canSignContracts: false;
    unrestrictedBankAccess: false;
  };
}

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

function assertEvidence(evidenceRefs: readonly string[], label: string): void {
  if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0 || evidenceRefs.some((value) => !value.trim())) {
    throw new Error(`${label} evidence is required`);
  }
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

function scopesCover(granted: readonly string[], required: readonly string[]): boolean {
  const set = new Set(granted);
  return required.every((scope) => set.has(scope));
}

function safeSegment(value: string, label: string): string {
  assertIdentifier(value, label);
  return value;
}

async function atomicWrite(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temp = `${filePath}.${randomUUID()}.tmp`;
  await fs.writeFile(temp, content, { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temp, filePath);
}

function validateSensitiveReceipts(input: {
  tenantId: string;
  subjectId: string;
  connectorId?: string;
  dataClass: SensitiveDataClass;
  scopes: string[];
  jurisdiction?: string;
  consentReceipt?: ConsentReceipt;
  legalPolicyReceipt?: LegalPolicyReceipt;
  requireExternalRouting?: boolean;
  asOf?: number;
}): string[] {
  if (input.dataClass === 'GENERAL') return [];
  const reasons: string[] = [];
  const asOf = input.asOf ?? Date.now();
  if (!input.connectorId) reasons.push('Sensitive data requires an explicit connector id.');
  if (!input.jurisdiction) reasons.push('Sensitive data requires an explicit jurisdiction.');
  const consent = input.consentReceipt;
  const policy = input.legalPolicyReceipt;
  if (!consent) reasons.push('Explicit user authorization receipt is required.');
  if (!policy) reasons.push('Jurisdiction/legal policy review receipt is required.');
  if (consent) {
    if (consent.tenantId !== input.tenantId || consent.subjectId !== input.subjectId || consent.connectorId !== input.connectorId) reasons.push('Consent receipt identity or connector mismatch.');
    if (consent.dataClass !== input.dataClass || consent.jurisdiction !== input.jurisdiction) reasons.push('Consent receipt data class or jurisdiction mismatch.');
    if (!isCurrent(consent.expiresAt, consent.revokedAt, asOf)) reasons.push('Consent receipt is expired or revoked.');
    if (!scopesCover(consent.scopes, input.scopes)) reasons.push('Consent receipt does not cover minimum scopes.');
    if (consent.evidenceRefs.length === 0) reasons.push('Consent receipt is missing evidence.');
    if (input.requireExternalRouting && !consent.externalRoutingAllowed) reasons.push('Consent receipt does not permit external routing.');
  }
  if (policy) {
    if (policy.tenantId !== input.tenantId || policy.connectorId !== input.connectorId) reasons.push('Legal policy receipt tenant or connector mismatch.');
    if (policy.dataClass !== input.dataClass || policy.jurisdiction !== input.jurisdiction) reasons.push('Legal policy receipt data class or jurisdiction mismatch.');
    if (!isCurrent(policy.expiresAt, policy.revokedAt, asOf)) reasons.push('Legal policy receipt is expired or revoked.');
    if (!scopesCover(policy.approvedScopes, input.scopes)) reasons.push('Legal policy receipt does not approve minimum scopes.');
    if (policy.evidenceRefs.length === 0) reasons.push('Legal policy receipt is missing evidence.');
    if (input.requireExternalRouting && !policy.externalRoutingAllowed) reasons.push('Legal policy receipt does not permit external routing.');
  }
  return reasons;
}

export class SovereignUniverseStore {
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

  private universePath(universeId: string): string {
    return path.join(this.root, safeSegment(this.tenantId, 'tenant id'), 'users', safeSegment(this.userId, 'user id'), 'universes', `${safeSegment(universeId, 'universe id')}.xivuniverse.json`);
  }

  async save(state: SovereignUniverseState, now = new Date()): Promise<UniversePersistenceReceipt> {
    if (state.tenantId !== this.tenantId || state.userId !== this.userId) throw new Error('universe tenant/user isolation mismatch');
    assertIdentifier(state.universeId, 'universe id');
    assertEvidence(state.evidenceRefs, 'universe');
    if (state.localFirst !== true || state.centralizeRawPrivateDataByDefault !== false) throw new Error('sovereign universe must be local-first and raw-data decentralization preserving');
    const key = await this.keyResolver.resolve(this.tenantId, this.userId);
    if (key.tenantId !== this.tenantId || key.userId !== this.userId || key.key.length !== 32) throw new Error('invalid universe key material');
    assertEvidence(key.evidenceRefs, 'universe key');
    const plaintext = Buffer.from(canonical(state), 'utf8');
    const iv = randomBytes(12);
    const createdAt = now.toISOString();
    const metadata = {
      version: 1,
      tenantId: this.tenantId,
      userId: this.userId,
      universeId: state.universeId,
      classification: state.classification,
      keyId: key.keyId,
      keyVersion: key.keyVersion,
      algorithm: 'AES-256-GCM' as const,
      createdAt,
      evidenceRefs: state.evidenceRefs,
    };
    const metadataSha256 = sha256(canonical(metadata));
    const cipher = createCipheriv('aes-256-gcm', key.key, iv);
    cipher.setAAD(Buffer.from(metadataSha256, 'utf8'));
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const envelope: UniverseEnvelope = {
      ...metadata,
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      plaintextSha256: sha256(plaintext),
      metadataSha256,
    };
    const serialized = `${JSON.stringify(envelope)}\n`;
    const filePath = this.universePath(state.universeId);
    await atomicWrite(filePath, serialized);
    return {
      receiptId: `universe-save:${randomUUID()}`,
      tenantId: this.tenantId,
      userId: this.userId,
      universeId: state.universeId,
      path: filePath,
      encryptedAtRest: true,
      algorithm: 'AES-256-GCM',
      keyVersion: key.keyVersion,
      bytesOnDisk: Buffer.byteLength(serialized),
      envelopeSha256: sha256(serialized),
      evidenceRefs: [...state.evidenceRefs, ...key.evidenceRefs],
      observedAt: createdAt,
    };
  }

  async load(universeId: string): Promise<SovereignUniverseState> {
    const filePath = this.universePath(universeId);
    const envelope = JSON.parse(await fs.readFile(filePath, 'utf8')) as UniverseEnvelope;
    if (envelope.tenantId !== this.tenantId || envelope.userId !== this.userId || envelope.universeId !== universeId) throw new Error('universe envelope isolation mismatch');
    const key = await this.keyResolver.resolve(this.tenantId, this.userId, envelope.keyVersion);
    if (key.tenantId !== this.tenantId || key.userId !== this.userId || key.keyVersion !== envelope.keyVersion || key.key.length !== 32) throw new Error('universe key mismatch');
    const metadata = {
      version: envelope.version,
      tenantId: envelope.tenantId,
      userId: envelope.userId,
      universeId: envelope.universeId,
      classification: envelope.classification,
      keyId: envelope.keyId,
      keyVersion: envelope.keyVersion,
      algorithm: envelope.algorithm,
      createdAt: envelope.createdAt,
      evidenceRefs: envelope.evidenceRefs,
    };
    if (sha256(canonical(metadata)) !== envelope.metadataSha256) throw new Error('universe metadata integrity failure');
    const decipher = createDecipheriv('aes-256-gcm', key.key, Buffer.from(envelope.iv, 'base64'));
    decipher.setAAD(Buffer.from(envelope.metadataSha256, 'utf8'));
    decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]);
    if (sha256(plaintext) !== envelope.plaintextSha256) throw new Error('universe plaintext integrity failure');
    const state = JSON.parse(plaintext.toString('utf8')) as SovereignUniverseState;
    if (state.tenantId !== this.tenantId || state.userId !== this.userId || state.universeId !== universeId) throw new Error('universe state isolation mismatch');
    return state;
  }

  decideExternalRoute(state: SovereignUniverseState, minimized: boolean): ExternalRouteDecision {
    const reasons: string[] = [];
    if (state.tenantId !== this.tenantId || state.userId !== this.userId) reasons.push('Universe identity mismatch.');
    if (!minimized) reasons.push('Raw private Universe state cannot be centralized or routed externally by default.');
    if (state.classification === 'TOP_SECRET') reasons.push('TOP_SECRET Universe data cannot route externally.');
    return {
      allowed: reasons.length === 0,
      reasons,
      minimizedOnly: true,
      rawPrivateDataAllowed: false,
      topSecretExternalAllowed: false,
    };
  }
}

interface DataRoomAssetEnvelope {
  version: 1;
  algorithm: 'AES-256-GCM';
  tenantId: string;
  roomId: string;
  ownerUserId: string;
  assetId: string;
  name: string;
  classification: DataRoomAssetInput['classification'];
  dataClass: SensitiveDataClass;
  scopes: string[];
  keyId: string;
  keyVersion: number;
  createdAt: string;
  evidenceRefs: string[];
  iv: string;
  authTag: string;
  ciphertext: string;
  plaintextSha256: string;
  metadataSha256: string;
}

export class PrivateDataRoom {
  readonly root: string;
  readonly tenantId: string;
  readonly roomId: string;
  readonly ownerUserId: string;
  private readonly keyResolver: UniverseKeyResolver;
  private readonly grants = new Map<string, DataRoomGrant>();
  private auditHead = GENESIS;
  private auditSequence = 0;

  constructor(root: string, tenantId: string, roomId: string, ownerUserId: string, keyResolver: UniverseKeyResolver) {
    assertIdentifier(tenantId, 'tenant id');
    assertIdentifier(roomId, 'room id');
    assertIdentifier(ownerUserId, 'owner user id');
    this.root = path.resolve(root);
    this.tenantId = tenantId;
    this.roomId = roomId;
    this.ownerUserId = ownerUserId;
    this.keyResolver = keyResolver;
  }

  private roomRoot(): string {
    return path.join(this.root, this.tenantId, 'data-rooms', this.roomId);
  }

  private assetPath(assetId: string): string {
    return path.join(this.roomRoot(), 'assets', `${safeSegment(assetId, 'asset id')}.xivroomasset.json`);
  }

  private auditPath(): string {
    return path.join(this.roomRoot(), 'access-audit.xivjsonl');
  }

  async grantAccess(actorId: string, grant: DataRoomGrant, evidenceRefs: string[], now = new Date()): Promise<DataRoomAuditReceipt> {
    if (actorId !== this.ownerUserId) throw new Error('only data room owner can issue access grants');
    if (grant.tenantId !== this.tenantId || grant.roomId !== this.roomId) throw new Error('grant isolation mismatch');
    if (grant.issuedBy !== this.ownerUserId) throw new Error('grant issuer mismatch');
    assertEvidence(grant.evidenceRefs, 'data room grant');
    assertEvidence(evidenceRefs, 'grant operation');
    if (grant.scopes.length === 0) throw new Error('grant requires minimum scopes');
    if (parseTime(grant.expiresAt) <= now.getTime()) throw new Error('grant must expire in the future');
    this.grants.set(grant.grantId, { ...grant, scopes: [...new Set(grant.scopes)] });
    return this.appendAudit(actorId, 'GRANT_ACCESS', undefined, grant.scopes, 'ALLOWED', evidenceRefs, undefined, now);
  }

  async putAsset(actorId: string, input: DataRoomAssetInput, now = new Date()): Promise<{ metadata: DataRoomAssetMetadata; audit: DataRoomAuditReceipt }> {
    if (actorId !== this.ownerUserId) throw new Error('only data room owner can add private assets');
    assertIdentifier(input.assetId, 'asset id');
    assertEvidence(input.evidenceRefs, 'data room asset');
    if (input.scopes.length === 0) throw new Error('asset requires minimum scopes');
    const reasons = validateSensitiveReceipts({
      tenantId: this.tenantId,
      subjectId: this.ownerUserId,
      connectorId: input.connectorId,
      dataClass: input.dataClass,
      scopes: input.scopes,
      jurisdiction: input.jurisdiction,
      consentReceipt: input.consentReceipt,
      legalPolicyReceipt: input.legalPolicyReceipt,
      asOf: now.getTime(),
    });
    if (reasons.length > 0) throw new Error(reasons.join(' '));
    const key = await this.keyResolver.resolve(this.tenantId, this.ownerUserId);
    if (key.tenantId !== this.tenantId || key.userId !== this.ownerUserId || key.key.length !== 32) throw new Error('invalid data room key material');
    assertEvidence(key.evidenceRefs, 'data room key');
    const createdAt = now.toISOString();
    const metadata = {
      version: 1,
      algorithm: 'AES-256-GCM' as const,
      tenantId: this.tenantId,
      roomId: this.roomId,
      ownerUserId: this.ownerUserId,
      assetId: input.assetId,
      name: input.name,
      classification: input.classification,
      dataClass: input.dataClass,
      scopes: [...new Set(input.scopes)],
      keyId: key.keyId,
      keyVersion: key.keyVersion,
      createdAt,
      evidenceRefs: input.evidenceRefs,
    };
    const metadataSha256 = sha256(canonical(metadata));
    const plaintext = Buffer.from(input.content, 'utf8');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key.key, iv);
    cipher.setAAD(Buffer.from(metadataSha256, 'utf8'));
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const envelope: DataRoomAssetEnvelope = {
      ...metadata,
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      plaintextSha256: sha256(plaintext),
      metadataSha256,
    };
    await atomicWrite(this.assetPath(input.assetId), `${JSON.stringify(envelope)}\n`);
    const audit = await this.appendAudit(actorId, 'PUT_ASSET', input.assetId, input.scopes, 'ALLOWED', input.evidenceRefs, undefined, now);
    return {
      metadata: {
        tenantId: this.tenantId,
        roomId: this.roomId,
        ownerUserId: this.ownerUserId,
        assetId: input.assetId,
        name: input.name,
        classification: input.classification,
        dataClass: input.dataClass,
        scopes: [...new Set(input.scopes)],
        createdAt,
        keyId: key.keyId,
        keyVersion: key.keyVersion,
        valueRendered: false,
        evidenceRefs: [...input.evidenceRefs, ...key.evidenceRefs],
      },
      audit,
    };
  }

  async readAsset(actorId: string, assetId: string, scopes: string[], evidenceRefs: string[], now = new Date()): Promise<{ content: string; handling: { noEmbedding: boolean; noExternalPlugin: boolean; noPublicWeb: boolean; noClientRendering: boolean }; audit: DataRoomAuditReceipt }> {
    assertEvidence(evidenceRefs, 'data room access');
    const envelope = JSON.parse(await fs.readFile(this.assetPath(assetId), 'utf8')) as DataRoomAssetEnvelope;
    const allowed = actorId === this.ownerUserId || this.hasGrant(actorId, envelope.scopes, now.getTime());
    if (!allowed || !scopesCover(scopes, envelope.scopes)) {
      await this.appendAudit(actorId, 'DENY', assetId, scopes, 'DENIED', evidenceRefs, 'missing active scoped grant or minimum scopes', now);
      throw new Error('data room access denied: missing active scoped grant or minimum scopes');
    }
    const key = await this.keyResolver.resolve(this.tenantId, this.ownerUserId, envelope.keyVersion);
    const metadata = {
      version: envelope.version,
      algorithm: envelope.algorithm,
      tenantId: envelope.tenantId,
      roomId: envelope.roomId,
      ownerUserId: envelope.ownerUserId,
      assetId: envelope.assetId,
      name: envelope.name,
      classification: envelope.classification,
      dataClass: envelope.dataClass,
      scopes: envelope.scopes,
      keyId: envelope.keyId,
      keyVersion: envelope.keyVersion,
      createdAt: envelope.createdAt,
      evidenceRefs: envelope.evidenceRefs,
    };
    if (sha256(canonical(metadata)) !== envelope.metadataSha256) throw new Error('data room metadata integrity failure');
    const decipher = createDecipheriv('aes-256-gcm', key.key, Buffer.from(envelope.iv, 'base64'));
    decipher.setAAD(Buffer.from(envelope.metadataSha256, 'utf8'));
    decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]);
    if (sha256(plaintext) !== envelope.plaintextSha256) throw new Error('data room plaintext integrity failure');
    const audit = await this.appendAudit(actorId, 'READ_ASSET', assetId, scopes, 'ALLOWED', evidenceRefs, undefined, now);
    const topSecret = envelope.classification === 'TOP_SECRET';
    return {
      content: plaintext.toString('utf8'),
      handling: { noEmbedding: topSecret, noExternalPlugin: topSecret, noPublicWeb: topSecret, noClientRendering: topSecret },
      audit,
    };
  }

  private hasGrant(subjectId: string, requiredScopes: readonly string[], asOf: number): boolean {
    return [...this.grants.values()].some((grant) =>
      grant.tenantId === this.tenantId
      && grant.roomId === this.roomId
      && grant.subjectId === subjectId
      && isCurrent(grant.expiresAt, grant.revokedAt, asOf)
      && scopesCover(grant.scopes, requiredScopes)
      && grant.evidenceRefs.length > 0);
  }

  private async appendAudit(actorId: string, action: DataRoomAction, assetId: string | undefined, scopes: string[], outcome: 'ALLOWED' | 'DENIED', evidenceRefs: string[], reason: string | undefined, now: Date): Promise<DataRoomAuditReceipt> {
    this.auditSequence += 1;
    const body = {
      receiptId: `room-audit:${randomUUID()}`,
      tenantId: this.tenantId,
      roomId: this.roomId,
      sequence: this.auditSequence,
      previousHash: this.auditHead,
      actorId,
      action,
      assetId,
      scopes: [...new Set(scopes)],
      outcome,
      reason,
      evidenceRefs,
      at: now.toISOString(),
    };
    const receipt: DataRoomAuditReceipt = { ...body, hash: sha256(canonical(body)) };
    this.auditHead = receipt.hash;
    await fs.mkdir(path.dirname(this.auditPath()), { recursive: true, mode: 0o700 });
    await fs.appendFile(this.auditPath(), `${JSON.stringify(receipt)}\n`, { encoding: 'utf8', mode: 0o600 });
    return receipt;
  }
}

export function createGovernedTwinProfile(input: Omit<GovernedTwinProfile, 'claims'>): GovernedTwinProfile {
  assertIdentifier(input.tenantId, 'tenant id');
  assertIdentifier(input.userId, 'user id');
  assertIdentifier(input.twinId, 'twin id');
  assertEvidence(input.evidenceRefs, 'twin profile');
  assertEvidence(input.sourceProfileRefs, 'twin provenance');
  assertEvidence(input.dataDna.provenanceRefs, 'twin data DNA');
  if (!input.memoryNamespace.trim()) throw new Error('twin memory namespace is required');
  return {
    ...input,
    goals: [...input.goals],
    policies: [...input.policies],
    sourceProfileRefs: [...input.sourceProfileRefs],
    dataDna: { ...input.dataDna, provenanceRefs: [...input.dataDna.provenanceRefs] },
    claims: { consciousness: false, freeWill: false, humanClone: false, literalHumanIdentity: false },
  };
}

export class AgentIdentityRegistry {
  private readonly agents = new Map<string, AgentIdentityProfile>();

  register(profile: AgentIdentityProfile): AgentIdentityProfile {
    assertIdentifier(profile.tenantId, 'tenant id');
    assertIdentifier(profile.universeId, 'universe id');
    assertIdentifier(profile.agentId, 'agent id');
    assertEvidence(profile.evidenceRefs, 'agent profile');
    if (!profile.role.trim() || !profile.memoryNamespace.trim()) throw new Error('agent role and memory namespace are required');
    if (profile.claims.consciousness !== false || profile.claims.freeWill !== false || profile.claims.independentLegalAuthority !== false) throw new Error('agent claims must remain grounded');
    const key = `${profile.tenantId}:${profile.universeId}:${profile.agentId}`;
    const namespaceCollision = [...this.agents.values()].some((agent) => agent.tenantId === profile.tenantId && agent.universeId === profile.universeId && agent.memoryNamespace === profile.memoryNamespace && agent.agentId !== profile.agentId);
    if (namespaceCollision) throw new Error('active agent memory namespaces must be distinct');
    this.agents.set(key, { ...profile, goals: [...profile.goals], policies: [...profile.policies] });
    return profile;
  }

  activeTeam(tenantId: string, universeId: string): AgentIdentityProfile[] {
    const team = [...this.agents.values()].filter((agent) => agent.tenantId === tenantId && agent.universeId === universeId && agent.active);
    if (team.length < 2 || team.length > 8) throw new Error('active agent team must contain 2-8 governed roles');
    return team.map((agent) => ({ ...agent, goals: [...agent.goals], policies: [...agent.policies] }));
  }
}

export function approveSharedLearningSignal(signal: SharedLearningSignal): SharedLearningSignal {
  assertIdentifier(signal.tenantId, 'tenant id');
  assertIdentifier(signal.sourceUniverseId, 'source universe id');
  assertEvidence(signal.evidenceRefs, 'shared learning signal');
  if (!signal.anonymized || !signal.minimized) throw new Error('shared learning requires minimized and anonymized signals');
  if (signal.containsRawRecords) throw new Error('raw private records cannot enter shared learning');
  if (signal.containsDirectIdentifiers) throw new Error('direct identifiers cannot enter shared learning');
  if (!Number.isInteger(signal.cohortSize) || signal.cohortSize < 5) throw new Error('shared learning cohort must contain at least 5 subjects');
  if (!Number.isFinite(signal.aggregateValue)) throw new Error('aggregate value must be finite');
  return { ...signal, dimensions: { ...signal.dimensions }, evidenceRefs: [...signal.evidenceRefs] };
}

export class IndustryVendorAdapterRegistry {
  private readonly entries = new Map<string, AdapterRegistryEntry>();

  upsert(entry: AdapterRegistryEntry): AdapterRegistryEntry {
    assertIdentifier(entry.tenantId, 'tenant id');
    assertIdentifier(entry.adapterId, 'adapter id');
    assertEvidence(entry.evidenceRefs, 'adapter');
    if (entry.status === 'VERIFIED_PARTNER') {
      if (!entry.verifiedAt || !entry.expiresAt) throw new Error('VERIFIED_PARTNER requires verification and expiry receipts');
      if (entry.revokedAt) throw new Error('revoked adapter cannot be registered as VERIFIED_PARTNER');
      if (entry.supportedScopes.length === 0 || entry.jurisdictions.length === 0) throw new Error('VERIFIED_PARTNER requires bounded scopes and jurisdictions');
    }
    this.entries.set(`${entry.tenantId}:${entry.adapterId}`, { ...entry, supportedScopes: [...new Set(entry.supportedScopes)] });
    return entry;
  }

  get(tenantId: string, adapterId: string): AdapterRegistryEntry | undefined {
    return this.entries.get(`${tenantId}:${adapterId}`);
  }

  isVerifiedPartner(tenantId: string, adapterId: string, asOf = Date.now()): boolean {
    const entry = this.get(tenantId, adapterId);
    return Boolean(entry && entry.status === 'VERIFIED_PARTNER' && entry.verifiedAt && isCurrent(entry.expiresAt, entry.revokedAt, asOf) && entry.evidenceRefs.length > 0);
  }
}

export class FinancialDataGovernance {
  private readonly adapters: IndustryVendorAdapterRegistry;

  constructor(adapters: IndustryVendorAdapterRegistry) {
    this.adapters = adapters;
  }

  decide(request: FinancialConnectorRequest, asOf = Date.now()): FinancialConnectorDecision {
    const reasons: string[] = [];
    const adapter = this.adapters.get(request.tenantId, request.adapterId);
    if (!adapter || !this.adapters.isVerifiedPartner(request.tenantId, request.adapterId, asOf)) reasons.push('Financial connector requires a current evidence-backed VERIFIED_PARTNER adapter.');
    if (adapter && !adapter.supportedDataClasses.includes('FINANCIAL')) reasons.push('Adapter is not scoped for financial data.');
    if (adapter && !scopesCover(adapter.supportedScopes, request.scopes)) reasons.push('Requested financial scopes exceed adapter scope.');
    if (adapter && !adapter.jurisdictions.includes(request.jurisdiction)) reasons.push('Financial connector jurisdiction is not verified.');
    if (request.classification === 'TOP_SECRET') reasons.push('TOP_SECRET financial data cannot route to external connectors.');
    reasons.push(...validateSensitiveReceipts({
      tenantId: request.tenantId,
      subjectId: request.userId,
      connectorId: request.adapterId,
      dataClass: 'FINANCIAL',
      scopes: request.scopes,
      jurisdiction: request.jurisdiction,
      consentReceipt: request.consentReceipt,
      legalPolicyReceipt: request.legalPolicyReceipt,
      requireExternalRouting: true,
      asOf,
    }));
    const allowedCapabilities = new Set<FinancialCapability>(['BALANCES_READ', 'TRANSACTIONS_READ', 'DOCUMENTS_READ', 'ANALYTICS']);
    if (request.requestedCapabilities.some((capability) => !allowedCapabilities.has(capability))) reasons.push('Unsupported financial capability requested.');
    return {
      allowed: reasons.length === 0,
      reasons,
      capabilities: reasons.length === 0 ? [...new Set(request.requestedCapabilities)] : [],
      authority: {
        canMoveMoney: false,
        canOpenAccounts: false,
        canSignContracts: false,
        unrestrictedBankAccess: false,
      },
    };
  }
}
