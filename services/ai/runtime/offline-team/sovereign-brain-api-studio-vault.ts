import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'TOP_SECRET';
export type SensitiveDataClass = 'GENERAL' | 'HEALTH' | 'FINANCIAL' | 'GENETIC' | 'COMMUNICATIONS' | 'SOCIAL_ACCOUNT';
export type RuntimeBackend = 'CPU' | 'GPU';
export type RuntimeHealth = 'VERIFIED' | 'UNVERIFIED' | 'BLOCKED';
export type ApiExposure = 'LOCAL_LOOPBACK' | 'PRIVATE_NETWORK' | 'HYBRID_OUTBOUND';
export type AdapterStatus = 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED_PARTNER';
export type VaultActorRole = 'CEO' | 'DELEGATE';

export interface EvidenceRef {
  id: string;
  kind: string;
  sha256?: string;
  observedAt: string;
}

export interface ComputeReceipt {
  receiptId: string;
  tenantId: string;
  backend: RuntimeBackend;
  observedAt: string;
  expiresAt?: string;
  hardwareVerified: boolean;
  runtimeVerified: boolean;
  benchmarkVerified: boolean;
  evidenceRefs: string[];
  deviceId?: string;
}

export interface BrainExecutionRequest {
  tenantId: string;
  workloadId: string;
  requestedBackend?: RuntimeBackend;
  classification: DataClassification;
  estimatedMemoryMb: number;
  evidenceRefs: string[];
}

export interface BrainExecutionPlan {
  tenantId: string;
  workloadId: string;
  selectedBackend: RuntimeBackend;
  status: RuntimeHealth;
  reasons: string[];
  evidenceRefs: string[];
  accelerationVerified: boolean;
  claims: {
    cpuBaseline: true;
    cpuRuntimeVerified: boolean;
    gpuRunning: boolean;
    ollamaRunning: false;
    physicalDeviceRunning: false;
  };
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
  approvedScopes: string[];
  externalRoutingAllowed: boolean;
  evidenceRefs: string[];
}

export interface ApiDefinition {
  apiId: string;
  tenantId: string;
  name: string;
  exposure: ApiExposure;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  route: string;
  connectorId?: string;
  dataClass: SensitiveDataClass;
  maxClassification: DataClassification;
  requiredScopes: string[];
  allowedJurisdictions: string[];
  enabled: boolean;
  evidenceRefs: string[];
}

export interface ApiInvocationRequest {
  tenantId: string;
  apiId: string;
  subjectId: string;
  scopes: string[];
  jurisdiction: string;
  classification: DataClassification;
  dataClass: SensitiveDataClass;
  consentReceipt?: ConsentReceipt;
  legalPolicyReceipt?: LegalPolicyReceipt;
}

export interface ApiInvocationDecision {
  allowed: boolean;
  reasons: string[];
  exposure: ApiExposure;
  requiredScopes: string[];
  externalRoutingAllowed: boolean;
  secretRenderingAllowed: false;
  embeddingAllowed: boolean;
  clientRenderingAllowed: boolean;
}

export interface DelegatedVaultGrant {
  grantId: string;
  tenantId: string;
  delegateId: string;
  scopes: string[];
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
  evidenceRefs: string[];
}

export interface VaultAccessContext {
  tenantId: string;
  actorId: string;
  role: VaultActorRole;
  scopes: string[];
  grant?: DelegatedVaultGrant;
  evidenceRefs: string[];
}

export interface SecretRecordInput {
  secretId: string;
  name: string;
  value: string;
  classification: Extract<DataClassification, 'CONFIDENTIAL' | 'RESTRICTED' | 'TOP_SECRET'>;
  scopes: string[];
  evidenceRefs: string[];
}

export interface SecretEnvelope {
  version: 1;
  tenantId: string;
  secretId: string;
  name: string;
  classification: SecretRecordInput['classification'];
  scopes: string[];
  keyId: string;
  keyVersion: number;
  algorithm: 'AES-256-GCM';
  iv: string;
  authTag: string;
  ciphertext: string;
  plaintextSha256: string;
  metadataSha256: string;
  createdAt: string;
  evidenceRefs: string[];
}

export interface SecretMetadataView {
  tenantId: string;
  secretId: string;
  name: string;
  classification: SecretRecordInput['classification'];
  scopes: string[];
  keyId: string;
  keyVersion: number;
  createdAt: string;
  evidenceRefs: string[];
  valueRendered: false;
}

export interface VaultKeyMaterial {
  tenantId: string;
  keyId: string;
  keyVersion: number;
  key: Buffer;
  evidenceRefs: string[];
}

export interface VaultKeyResolver {
  resolve(tenantId: string, keyVersion?: number): Promise<VaultKeyMaterial> | VaultKeyMaterial;
}

export interface VaultAuditReceipt {
  receiptId: string;
  tenantId: string;
  sequence: number;
  previousHash: string;
  actorId: string;
  actorRole: VaultActorRole;
  action: 'PUT_SECRET' | 'READ_SECRET' | 'LIST_METADATA' | 'DENY';
  secretId?: string;
  at: string;
  scopes: string[];
  evidenceRefs: string[];
  outcome: 'ALLOWED' | 'DENIED';
  reason?: string;
  hash: string;
}

export interface AdapterRegistryEntry {
  adapterId: string;
  tenantId: string;
  providerName: string;
  industry: string;
  status: AdapterStatus;
  apiBaseUrl?: string;
  supportedDataClasses: SensitiveDataClass[];
  supportedScopes: string[];
  jurisdictions: string[];
  verifiedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  evidenceRefs: string[];
}

const CLASSIFICATION_RANK: Record<DataClassification, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
  RESTRICTED: 3,
  TOP_SECRET: 4,
};
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

function assertTenantId(tenantId: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(tenantId)) throw new Error('invalid tenant id');
}

function assertEvidence(evidenceRefs: readonly string[], label: string): void {
  if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0 || evidenceRefs.some((value) => !value.trim())) {
    throw new Error(`${label} evidence is required`);
  }
}

function parseTime(value: string): number {
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) throw new Error('invalid timestamp');
  return ms;
}

function isCurrent(expiresAt: string | undefined, revokedAt: string | undefined, asOf: number): boolean {
  if (revokedAt && parseTime(revokedAt) <= asOf) return false;
  if (expiresAt && parseTime(expiresAt) <= asOf) return false;
  return true;
}

function scopesCover(granted: readonly string[], required: readonly string[]): boolean {
  const grantedSet = new Set(granted);
  return required.every((scope) => grantedSet.has(scope));
}

function assertRoute(route: string): void {
  if (!route.startsWith('/') || route.includes('..') || route.includes('://')) throw new Error('API Studio route must be a relative API path');
}

export class SovereignBrainRuntimePlanner {
  constructor(private readonly receipts: readonly ComputeReceipt[]) {}

  plan(request: BrainExecutionRequest, asOf = Date.now()): BrainExecutionPlan {
    assertTenantId(request.tenantId);
    assertEvidence(request.evidenceRefs, 'workload');
    if (!Number.isFinite(request.estimatedMemoryMb) || request.estimatedMemoryMb <= 0) throw new Error('estimated memory must be positive');

    const requested = request.requestedBackend ?? 'CPU';
    if (requested === 'CPU') {
      const cpu = this.receipts
        .filter((receipt) => receipt.tenantId === request.tenantId && receipt.backend === 'CPU')
        .filter((receipt) => isCurrent(receipt.expiresAt, undefined, asOf))
        .sort((a, b) => parseTime(b.observedAt) - parseTime(a.observedAt))[0];
      const verified = Boolean(cpu && cpu.hardwareVerified && cpu.runtimeVerified && cpu.evidenceRefs.length > 0);
      return {
        tenantId: request.tenantId,
        workloadId: request.workloadId,
        selectedBackend: 'CPU',
        status: verified ? 'VERIFIED' : 'UNVERIFIED',
        reasons: verified
          ? ['CPU sovereign baseline is eligible because current tenant-scoped hardware/runtime evidence is present.']
          : ['CPU is the sovereign baseline; no claim is made that a local worker is running without a current runtime receipt.'],
        evidenceRefs: cpu ? [...request.evidenceRefs, ...cpu.evidenceRefs] : [...request.evidenceRefs],
        accelerationVerified: false,
        claims: { cpuBaseline: true, cpuRuntimeVerified: verified, gpuRunning: false, ollamaRunning: false, physicalDeviceRunning: false },
      };
    }

    const gpu = this.receipts
      .filter((receipt) => receipt.tenantId === request.tenantId && receipt.backend === 'GPU')
      .filter((receipt) => isCurrent(receipt.expiresAt, undefined, asOf))
      .sort((a, b) => parseTime(b.observedAt) - parseTime(a.observedAt))[0];

    if (!gpu || !gpu.hardwareVerified || !gpu.runtimeVerified || !gpu.benchmarkVerified || gpu.evidenceRefs.length === 0) {
      return {
        tenantId: request.tenantId,
        workloadId: request.workloadId,
        selectedBackend: 'CPU',
        status: 'UNVERIFIED',
        reasons: ['GPU acceleration requested but current hardware, runtime, benchmark, and evidence receipts are incomplete; falling back to CPU plan.'],
        evidenceRefs: [...request.evidenceRefs],
        accelerationVerified: false,
        claims: { cpuBaseline: true, cpuRuntimeVerified: false, gpuRunning: false, ollamaRunning: false, physicalDeviceRunning: false },
      };
    }

    return {
      tenantId: request.tenantId,
      workloadId: request.workloadId,
      selectedBackend: 'GPU',
      status: 'VERIFIED',
      reasons: ['GPU acceleration is eligible only because current tenant-scoped hardware/runtime/benchmark evidence is present.'],
      evidenceRefs: [...request.evidenceRefs, ...gpu.evidenceRefs],
      accelerationVerified: true,
      claims: { cpuBaseline: true, cpuRuntimeVerified: false, gpuRunning: true, ollamaRunning: false, physicalDeviceRunning: false },
    };
  }
}

export class XIVApiStudioRegistry {
  private readonly definitions = new Map<string, ApiDefinition>();

  constructor(private readonly adapterRegistry?: IndustryVendorAdapterRegistry) {}

  register(definition: ApiDefinition): ApiDefinition {
    assertTenantId(definition.tenantId);
    assertEvidence(definition.evidenceRefs, 'API definition');
    assertRoute(definition.route);
    if (!definition.apiId.trim() || !definition.name.trim()) throw new Error('API id and name are required');
    if (definition.requiredScopes.some((scope) => !scope.trim())) throw new Error('invalid required scope');
    if ((definition.dataClass !== 'GENERAL' || definition.exposure === 'HYBRID_OUTBOUND') && !definition.connectorId) {
      throw new Error('sensitive or hybrid APIs require an explicit connector id');
    }
    if (definition.exposure === 'HYBRID_OUTBOUND' && definition.maxClassification === 'TOP_SECRET') {
      throw new Error('TOP_SECRET cannot be configured for hybrid outbound routing');
    }
    this.definitions.set(`${definition.tenantId}:${definition.apiId}`, { ...definition, requiredScopes: [...new Set(definition.requiredScopes)] });
    return definition;
  }

  get(tenantId: string, apiId: string): ApiDefinition | undefined {
    return this.definitions.get(`${tenantId}:${apiId}`);
  }

  decide(request: ApiInvocationRequest, asOf = Date.now()): ApiInvocationDecision {
    const definition = this.get(request.tenantId, request.apiId);
    if (!definition || !definition.enabled) {
      return this.denied(definition?.exposure ?? 'LOCAL_LOOPBACK', definition?.requiredScopes ?? [], ['API definition is missing or disabled.']);
    }

    const reasons: string[] = [];
    if (request.dataClass !== definition.dataClass) reasons.push('Invocation data class does not match API definition.');
    if (CLASSIFICATION_RANK[request.classification] > CLASSIFICATION_RANK[definition.maxClassification]) reasons.push('Invocation classification exceeds API maximum.');
    if (!scopesCover(request.scopes, definition.requiredScopes)) reasons.push('Invocation lacks minimum required scopes.');
    if (definition.allowedJurisdictions.length > 0 && !definition.allowedJurisdictions.includes(request.jurisdiction)) reasons.push('Jurisdiction is not approved for this API.');
    if (request.classification === 'TOP_SECRET' && definition.exposure === 'HYBRID_OUTBOUND') reasons.push('TOP_SECRET cannot route externally.');
    if (definition.exposure === 'HYBRID_OUTBOUND') {
      if (!definition.connectorId || !this.adapterRegistry?.isVerifiedPartner(request.tenantId, definition.connectorId, asOf)) {
        reasons.push('Hybrid outbound routing requires a current evidence-backed VERIFIED_PARTNER adapter receipt.');
      }
    }

    const regulated = request.dataClass !== 'GENERAL';
    if (regulated) {
      const consent = request.consentReceipt;
      const policy = request.legalPolicyReceipt;
      if (!consent) reasons.push('Explicit user consent receipt is required for sensitive or regulated data.');
      if (!policy) reasons.push('Jurisdiction/legal policy review receipt is required for sensitive or regulated data.');
      if (consent) {
        if (consent.tenantId !== request.tenantId || consent.subjectId !== request.subjectId || consent.connectorId !== definition.connectorId) reasons.push('Consent receipt scope mismatch.');
        if (consent.dataClass !== request.dataClass || consent.jurisdiction !== request.jurisdiction) reasons.push('Consent receipt data class or jurisdiction mismatch.');
        if (!isCurrent(consent.expiresAt, consent.revokedAt, asOf)) reasons.push('Consent receipt is expired or revoked.');
        if (!scopesCover(consent.scopes, definition.requiredScopes)) reasons.push('Consent receipt does not cover minimum API scopes.');
        if (consent.evidenceRefs.length === 0) reasons.push('Consent receipt is missing evidence.');
      }
      if (policy) {
        if (policy.tenantId !== request.tenantId || policy.connectorId !== definition.connectorId) reasons.push('Legal policy receipt scope mismatch.');
        if (policy.dataClass !== request.dataClass || policy.jurisdiction !== request.jurisdiction) reasons.push('Legal policy receipt data class or jurisdiction mismatch.');
        if (!isCurrent(policy.expiresAt, undefined, asOf)) reasons.push('Legal policy receipt is expired.');
        if (!scopesCover(policy.approvedScopes, definition.requiredScopes)) reasons.push('Legal policy receipt does not approve minimum API scopes.');
        if (policy.evidenceRefs.length === 0) reasons.push('Legal policy receipt is missing evidence.');
      }
      if (definition.exposure === 'HYBRID_OUTBOUND' && consent && !consent.externalRoutingAllowed) reasons.push('Consent does not authorize external routing.');
      if (definition.exposure === 'HYBRID_OUTBOUND' && policy && !policy.externalRoutingAllowed) reasons.push('Legal policy does not authorize external routing.');
    }

    const allowed = reasons.length === 0;
    return {
      allowed,
      reasons: allowed ? ['Invocation satisfies tenant, scope, classification, consent, and policy gates.'] : reasons,
      exposure: definition.exposure,
      requiredScopes: [...definition.requiredScopes],
      externalRoutingAllowed: allowed && definition.exposure === 'HYBRID_OUTBOUND' && request.classification !== 'TOP_SECRET',
      secretRenderingAllowed: false,
      embeddingAllowed: request.classification !== 'TOP_SECRET',
      clientRenderingAllowed: request.classification !== 'TOP_SECRET',
    };
  }

  private denied(exposure: ApiExposure, requiredScopes: string[], reasons: string[]): ApiInvocationDecision {
    return {
      allowed: false,
      reasons,
      exposure,
      requiredScopes,
      externalRoutingAllowed: false,
      secretRenderingAllowed: false,
      embeddingAllowed: false,
      clientRenderingAllowed: false,
    };
  }
}

export class IndustryVendorAdapterRegistry {
  private readonly entries = new Map<string, AdapterRegistryEntry>();

  upsert(entry: AdapterRegistryEntry): AdapterRegistryEntry {
    assertTenantId(entry.tenantId);
    assertEvidence(entry.evidenceRefs, 'adapter');
    if (!entry.adapterId.trim() || !entry.providerName.trim() || !entry.industry.trim()) throw new Error('adapter identity is required');
    if (entry.status === 'VERIFIED_PARTNER') {
      if (!entry.verifiedAt || entry.evidenceRefs.length === 0) throw new Error('VERIFIED_PARTNER requires dated partner evidence');
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

function vaultMetadata(envelope: Pick<SecretEnvelope, 'version' | 'tenantId' | 'secretId' | 'name' | 'classification' | 'scopes' | 'keyId' | 'keyVersion' | 'algorithm' | 'createdAt' | 'evidenceRefs'>): Buffer {
  const scoped = {
    version: envelope.version,
    tenantId: envelope.tenantId,
    secretId: envelope.secretId,
    name: envelope.name,
    classification: envelope.classification,
    scopes: envelope.scopes,
    keyId: envelope.keyId,
    keyVersion: envelope.keyVersion,
    algorithm: envelope.algorithm,
    createdAt: envelope.createdAt,
    evidenceRefs: envelope.evidenceRefs,
  };
  return Buffer.from(canonical(scoped), 'utf8');
}

function equalHex(left: string, right: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

export class TenantSecretVault {
  constructor(
    private readonly rootDir: string,
    private readonly tenantId: string,
    private readonly keyResolver: VaultKeyResolver,
  ) {
    assertTenantId(tenantId);
  }

  private tenantRoot(): string {
    const root = path.resolve(this.rootDir, this.tenantId);
    return root;
  }

  private secretPath(secretId: string): string {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(secretId) || secretId.includes('..')) throw new Error('invalid secret id');
    const root = this.tenantRoot();
    const target = path.resolve(root, 'secrets', `${secretId}.xivsecret.json`);
    if (!target.startsWith(`${root}${path.sep}`)) throw new Error('path traversal rejected');
    return target;
  }

  private auditPath(): string {
    return path.resolve(this.tenantRoot(), 'vault-audit.xivjsonl');
  }

  private async assertAccess(context: VaultAccessContext, requiredScopes: readonly string[], asOf = Date.now()): Promise<void> {
    if (context.tenantId !== this.tenantId) throw new Error('tenant isolation violation');
    assertEvidence(context.evidenceRefs, 'vault access');
    if (!scopesCover(context.scopes, requiredScopes)) throw new Error('vault access lacks minimum scopes');
    if (context.role === 'CEO') return;
    const grant = context.grant;
    if (!grant) throw new Error('delegated vault access requires a grant');
    if (grant.tenantId !== this.tenantId || grant.delegateId !== context.actorId) throw new Error('delegated grant scope mismatch');
    if (!isCurrent(grant.expiresAt, grant.revokedAt, asOf)) throw new Error('delegated grant expired or revoked');
    if (!scopesCover(grant.scopes, requiredScopes)) throw new Error('delegated grant lacks minimum scopes');
    assertEvidence(grant.evidenceRefs, 'delegated grant');
  }

  private async appendAudit(input: Omit<VaultAuditReceipt, 'receiptId' | 'sequence' | 'previousHash' | 'hash'>): Promise<VaultAuditReceipt> {
    const target = this.auditPath();
    await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    let existing: VaultAuditReceipt[] = [];
    try {
      const raw = await fs.readFile(target, 'utf8');
      existing = raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as VaultAuditReceipt);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    let previousHash = GENESIS;
    for (let index = 0; index < existing.length; index++) {
      const receipt = existing[index];
      const { hash, ...withoutHash } = receipt;
      if (receipt.sequence !== index + 1 || receipt.previousHash !== previousHash || !equalHex(sha256(canonical(withoutHash)), hash)) {
        throw new Error('vault audit chain failed integrity verification');
      }
      previousHash = hash;
    }
    const base = {
      ...input,
      receiptId: randomUUID(),
      sequence: existing.length + 1,
      previousHash,
    };
    const receipt: VaultAuditReceipt = { ...base, hash: sha256(canonical(base)) };
    await fs.appendFile(target, `${JSON.stringify(receipt)}\n`, { encoding: 'utf8', mode: 0o600 });
    try { await fs.chmod(target, 0o600); } catch { /* best effort */ }
    return receipt;
  }

  async putSecret(context: VaultAccessContext, input: SecretRecordInput): Promise<{ metadata: SecretMetadataView; audit: VaultAuditReceipt }> {
    try {
      await this.assertAccess(context, input.scopes);
      assertEvidence(input.evidenceRefs, 'secret');
      if (!input.value) throw new Error('secret value is required');
      const material = await this.keyResolver.resolve(this.tenantId);
      if (material.tenantId !== this.tenantId || material.key.length !== 32 || material.keyVersion < 1 || material.evidenceRefs.length === 0) {
        throw new Error('invalid tenant vault key material');
      }
      const createdAt = new Date().toISOString();
      const base = {
        version: 1 as const,
        tenantId: this.tenantId,
        secretId: input.secretId,
        name: input.name,
        classification: input.classification,
        scopes: [...new Set(input.scopes)],
        keyId: material.keyId,
        keyVersion: material.keyVersion,
        algorithm: 'AES-256-GCM' as const,
        createdAt,
        evidenceRefs: [...input.evidenceRefs],
      };
      const aad = vaultMetadata(base);
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', material.key, iv);
      cipher.setAAD(aad);
      const plaintext = Buffer.from(input.value, 'utf8');
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const envelope: SecretEnvelope = {
        ...base,
        iv: iv.toString('base64'),
        authTag: cipher.getAuthTag().toString('base64'),
        ciphertext: ciphertext.toString('base64'),
        plaintextSha256: sha256(plaintext),
        metadataSha256: sha256(aad),
      };
      const target = this.secretPath(input.secretId);
      await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
      const tmp = `${target}.${randomUUID()}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(envelope), { encoding: 'utf8', mode: 0o600 });
      await fs.rename(tmp, target);
      try { await fs.chmod(target, 0o600); } catch { /* best effort */ }
      const audit = await this.appendAudit({
        tenantId: this.tenantId,
        actorId: context.actorId,
        actorRole: context.role,
        action: 'PUT_SECRET',
        secretId: input.secretId,
        at: new Date().toISOString(),
        scopes: [...input.scopes],
        evidenceRefs: [...context.evidenceRefs, ...input.evidenceRefs],
        outcome: 'ALLOWED',
      });
      return { metadata: this.metadataFromEnvelope(envelope), audit };
    } catch (error) {
      await this.appendAudit({
        tenantId: this.tenantId,
        actorId: context.actorId,
        actorRole: context.role,
        action: 'DENY',
        secretId: input.secretId,
        at: new Date().toISOString(),
        scopes: [...context.scopes],
        evidenceRefs: context.evidenceRefs.length > 0 ? [...context.evidenceRefs] : ['missing-access-evidence'],
        outcome: 'DENIED',
        reason: (error as Error).message,
      });
      throw error;
    }
  }

  async readSecret(context: VaultAccessContext, secretId: string): Promise<{ value: string; metadata: SecretMetadataView; handling: { noLog: true; noEmbedding: true; noClientRendering: true }; audit: VaultAuditReceipt }> {
    const target = this.secretPath(secretId);
    const envelope = JSON.parse(await fs.readFile(target, 'utf8')) as SecretEnvelope;
    if (envelope.tenantId !== this.tenantId) throw new Error('tenant isolation violation');
    try {
      await this.assertAccess(context, envelope.scopes);
      const material = await this.keyResolver.resolve(this.tenantId, envelope.keyVersion);
      if (material.tenantId !== this.tenantId || material.keyId !== envelope.keyId || material.keyVersion !== envelope.keyVersion || material.key.length !== 32) {
        throw new Error('tenant vault key identity mismatch');
      }
      const aad = vaultMetadata(envelope);
      if (!equalHex(sha256(aad), envelope.metadataSha256)) throw new Error('secret metadata integrity mismatch');
      const decipher = createDecipheriv('aes-256-gcm', material.key, Buffer.from(envelope.iv, 'base64'));
      decipher.setAAD(aad);
      decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
      const plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]);
      if (!equalHex(sha256(plaintext), envelope.plaintextSha256)) throw new Error('secret plaintext integrity mismatch');
      const audit = await this.appendAudit({
        tenantId: this.tenantId,
        actorId: context.actorId,
        actorRole: context.role,
        action: 'READ_SECRET',
        secretId,
        at: new Date().toISOString(),
        scopes: [...envelope.scopes],
        evidenceRefs: [...context.evidenceRefs],
        outcome: 'ALLOWED',
      });
      return {
        value: plaintext.toString('utf8'),
        metadata: this.metadataFromEnvelope(envelope),
        handling: { noLog: true, noEmbedding: true, noClientRendering: true },
        audit,
      };
    } catch (error) {
      await this.appendAudit({
        tenantId: this.tenantId,
        actorId: context.actorId,
        actorRole: context.role,
        action: 'DENY',
        secretId,
        at: new Date().toISOString(),
        scopes: [...context.scopes],
        evidenceRefs: context.evidenceRefs.length > 0 ? [...context.evidenceRefs] : ['missing-access-evidence'],
        outcome: 'DENIED',
        reason: (error as Error).message,
      });
      throw error;
    }
  }

  async listMetadata(context: VaultAccessContext): Promise<{ secrets: SecretMetadataView[]; audit: VaultAuditReceipt }> {
    await this.assertAccess(context, []);
    const directory = path.resolve(this.tenantRoot(), 'secrets');
    let files: string[] = [];
    try { files = await fs.readdir(directory); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const secrets: SecretMetadataView[] = [];
    for (const file of files.filter((name) => name.endsWith('.xivsecret.json'))) {
      const envelope = JSON.parse(await fs.readFile(path.join(directory, file), 'utf8')) as SecretEnvelope;
      if (envelope.tenantId !== this.tenantId) throw new Error('tenant isolation violation');
      if (context.role === 'CEO' || scopesCover(context.scopes, envelope.scopes)) secrets.push(this.metadataFromEnvelope(envelope));
    }
    const audit = await this.appendAudit({
      tenantId: this.tenantId,
      actorId: context.actorId,
      actorRole: context.role,
      action: 'LIST_METADATA',
      at: new Date().toISOString(),
      scopes: [...context.scopes],
      evidenceRefs: [...context.evidenceRefs],
      outcome: 'ALLOWED',
    });
    return { secrets, audit };
  }

  private metadataFromEnvelope(envelope: SecretEnvelope): SecretMetadataView {
    return {
      tenantId: envelope.tenantId,
      secretId: envelope.secretId,
      name: envelope.name,
      classification: envelope.classification,
      scopes: [...envelope.scopes],
      keyId: envelope.keyId,
      keyVersion: envelope.keyVersion,
      createdAt: envelope.createdAt,
      evidenceRefs: [...envelope.evidenceRefs],
      valueRendered: false,
    };
  }
}

export interface NeuralPathwayGrowthReceipt {
  pathwayId: string;
  tenantId: string;
  sourceNode: string;
  targetNode: string;
  capabilityVersion: string;
  evidenceRefs: string[];
  evaluationScore: number;
  promoted: boolean;
  humanApprovalRequired: boolean;
  humanApprovalReceiptId?: string;
  dataDna: {
    configurationVersion: string;
    capabilityVersion: string;
    provenanceRefs: string[];
  };
  semantics: {
    graphEdgeIsFact: false;
    correlationIsCausation: false;
    consciousnessClaim: false;
    freeWillClaim: false;
  };
}

export function createNeuralPathwayGrowthReceipt(input: Omit<NeuralPathwayGrowthReceipt, 'semantics'>): NeuralPathwayGrowthReceipt {
  assertTenantId(input.tenantId);
  assertEvidence(input.evidenceRefs, 'neural pathway');
  assertEvidence(input.dataDna.provenanceRefs, 'data DNA provenance');
  if (!Number.isFinite(input.evaluationScore) || input.evaluationScore < 0 || input.evaluationScore > 1) throw new Error('evaluation score must be between 0 and 1');
  if (input.promoted && input.humanApprovalRequired && !input.humanApprovalReceiptId) throw new Error('promotion requires a human approval receipt');
  return {
    ...input,
    semantics: {
      graphEdgeIsFact: false,
      correlationIsCausation: false,
      consciousnessClaim: false,
      freeWillClaim: false,
    },
  };
}
