import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export type DataClassification75 = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'TOP_SECRET';
export type SensitiveDataClass75 = 'GENERAL' | 'HEALTH' | 'FINANCIAL' | 'GENETIC' | 'COMMUNICATIONS' | 'SOCIAL_ACCOUNT';
export type ApiExposure75 = 'LOCAL_LOOPBACK' | 'PRIVATE_NETWORK' | 'HYBRID_OUTBOUND';
export type VendorStatus75 = 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED_PARTNER';
export type RuntimeComponent75 = 'CPU_BRAIN' | 'RAG' | 'API_STUDIO';
export type RuntimeHealth75 = 'HEALTHY' | 'DEGRADED' | 'OFFLINE' | 'UNVERIFIED';
export type SessionState75 = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type SessionEventKind75 = 'SESSION_OPENED' | 'SESSION_REVOKED' | 'AUTHORITY_REVOKED';
export type AuthorityKind75 = 'GRANT' | 'CONSENT' | 'POLICY';

export const GROUNDING_INVARIANTS_12D75 = Object.freeze({
  dimensionMeaning: 'semantic/computational dimensions',
  parallelUniverseMeaning: 'deterministic simulations/digital twins',
  quantumDefault: 'simulator/adapter/research unless real QPU and benchmark evidence exist',
  dataDnaMeaning: 'versioned configuration/capability/provenance',
  historicalPeopleMeaning: 'source-backed profiles, not revived persons',
  trillionScaleMeaning: 'architecture targets unless measured',
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
  topSecretExternalRoutingAllowed: false,
  autonomousCounterattackAllowed: false,
  financialAutonomousMoneyMovementAllowed: false,
  financialAccountOpeningAllowed: false,
  financialContractSigningAllowed: false,
});

const GENESIS = '0'.repeat(64);
const MAX_CREDENTIAL_TTL_MS = 5 * 60 * 1000;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
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

function assertEvidence(refs: readonly string[], label: string): void {
  if (!Array.isArray(refs) || refs.length === 0 || refs.some((ref) => typeof ref !== 'string' || !ref.trim())) {
    throw new Error(`${label} evidence is required`);
  }
}

function assertId(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value)) throw new Error(`invalid ${label}`);
}

function parseTime(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error('invalid timestamp');
  return parsed;
}

function scopesCover(granted: readonly string[], required: readonly string[]): boolean {
  const set = new Set(granted);
  return required.every((scope) => set.has(scope));
}

function safeScopedPath(root: string, tenantId: string, userId: string | undefined, ...parts: string[]): string {
  assertId(tenantId, 'tenant id');
  if (userId) assertId(userId, 'user id');
  for (const part of parts) assertId(part, 'path segment');
  const base = path.resolve(root);
  const segments = userId ? [tenantId, userId, ...parts] : [tenantId, ...parts];
  const target = path.resolve(base, ...segments);
  const relative = path.relative(base, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('path traversal rejected');
  return target;
}

async function atomicWriteJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const temp = `${filePath}.${randomUUID()}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temp, filePath);
}

export interface GovernedApiSession75 {
  sessionId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  agentId: string;
  apiId: string;
  exposure: ApiExposure75;
  classification: DataClassification75;
  dataClass: SensitiveDataClass75;
  scopes: string[];
  grantId: string;
  consentReceiptId?: string;
  policyReceiptId?: string;
  vendorId?: string;
  startedAt: string;
  expiresAt: string;
  state: SessionState75;
  evidenceRefs: string[];
  rawContentPersisted: false;
  secretMaterialPersisted: false;
}

export interface GovernedApiSessionEvent75 {
  eventId: string;
  tenantId: string;
  userId: string;
  sessionId: string;
  kind: SessionEventKind75;
  session?: GovernedApiSession75;
  authorityKind?: AuthorityKind75;
  authorityId?: string;
  reason?: string;
  evidenceRefs: string[];
  observedAt: string;
  sequence: number;
  previousHash: string;
  hash: string;
}

export class PersistentGovernedApiSessionJournal75 {
  readonly filePath: string;

  constructor(private readonly root: string, readonly tenantId: string, readonly userId: string) {
    this.filePath = safeScopedPath(root, tenantId, userId, 'api', 'governed-sessions.xivjsonl');
  }

  async load(): Promise<GovernedApiSessionEvent75[]> {
    let raw: string;
    try { raw = await fs.readFile(this.filePath, 'utf8'); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const events = raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as GovernedApiSessionEvent75);
    let previousHash = GENESIS;
    for (let index = 0; index < events.length; index += 1) {
      const event = events[index];
      if (event.tenantId !== this.tenantId || event.userId !== this.userId) throw new Error('API session journal subject mismatch');
      if (event.sequence !== index + 1 || event.previousHash !== previousHash) throw new Error('API session journal sequence/hash-chain failure');
      assertEvidence(event.evidenceRefs, 'API session event');
      const { hash, ...unsigned } = event;
      if (sha256(canonical(unsigned)) !== hash) throw new Error('API session event integrity failure');
      if (event.session) {
        if (event.session.tenantId !== this.tenantId || event.session.userId !== this.userId) throw new Error('API session journal embedded subject mismatch');
        if (event.session.rawContentPersisted || event.session.secretMaterialPersisted) throw new Error('content-bearing or secret-bearing API session rejected');
      }
      previousHash = hash;
    }
    return events;
  }

  private async append(input: Omit<GovernedApiSessionEvent75, 'eventId' | 'sequence' | 'previousHash' | 'hash'>): Promise<GovernedApiSessionEvent75> {
    if (input.tenantId !== this.tenantId || input.userId !== this.userId) throw new Error('API session journal subject mismatch');
    assertEvidence(input.evidenceRefs, 'API session event');
    const events = await this.load();
    const unsigned = {
      ...input,
      eventId: randomUUID(),
      sequence: events.length + 1,
      previousHash: events.at(-1)?.hash ?? GENESIS,
    };
    const event: GovernedApiSessionEvent75 = { ...unsigned, hash: sha256(canonical(unsigned)) };
    await fs.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    await fs.appendFile(this.filePath, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 });
    return event;
  }

  async open(input: Omit<GovernedApiSession75, 'sessionId' | 'startedAt' | 'expiresAt' | 'state' | 'rawContentPersisted' | 'secretMaterialPersisted'> & { ttlMs: number; now?: Date }): Promise<GovernedApiSession75> {
    if (input.tenantId !== this.tenantId || input.userId !== this.userId) throw new Error('API session subject mismatch');
    assertEvidence(input.evidenceRefs, 'API session');
    if (!Number.isFinite(input.ttlMs) || input.ttlMs <= 0) throw new Error('positive API session ttl required');
    if (input.classification === 'TOP_SECRET' && input.exposure !== 'LOCAL_LOOPBACK') throw new Error('TOP_SECRET API sessions must remain local-loopback');
    if (input.exposure === 'HYBRID_OUTBOUND' && !input.vendorId) throw new Error('hybrid API session requires an explicit vendor target id');
    const now = input.now ?? new Date();
    const session: GovernedApiSession75 = {
      tenantId: input.tenantId,
      userId: input.userId,
      universeId: input.universeId,
      agentId: input.agentId,
      apiId: input.apiId,
      exposure: input.exposure,
      classification: input.classification,
      dataClass: input.dataClass,
      scopes: [...new Set(input.scopes)],
      grantId: input.grantId,
      consentReceiptId: input.consentReceiptId,
      policyReceiptId: input.policyReceiptId,
      vendorId: input.vendorId,
      evidenceRefs: [...input.evidenceRefs],
      sessionId: randomUUID(),
      startedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + input.ttlMs).toISOString(),
      state: 'ACTIVE',
      rawContentPersisted: false,
      secretMaterialPersisted: false,
    };
    await this.append({ tenantId: this.tenantId, userId: this.userId, sessionId: session.sessionId, kind: 'SESSION_OPENED', session, evidenceRefs: session.evidenceRefs, observedAt: now.toISOString() });
    return session;
  }

  async revoke(sessionId: string, reason: string, evidenceRefs: string[], now = new Date()): Promise<GovernedApiSessionEvent75> {
    assertId(sessionId, 'session id');
    if (!reason.trim()) throw new Error('revocation reason is required');
    assertEvidence(evidenceRefs, 'API session revocation');
    const sessions = await this.materialize(now);
    if (!sessions.has(sessionId)) throw new Error('unknown API session');
    return this.append({ tenantId: this.tenantId, userId: this.userId, sessionId, kind: 'SESSION_REVOKED', reason, evidenceRefs, observedAt: now.toISOString() });
  }

  async invalidateAuthority(kind: AuthorityKind75, authorityId: string, reason: string, evidenceRefs: string[], now = new Date()): Promise<string[]> {
    assertId(authorityId, 'authority id');
    assertEvidence(evidenceRefs, 'authority revocation');
    const sessions = await this.materialize(now);
    const invalidated: string[] = [];
    for (const session of sessions.values()) {
      if (session.state !== 'ACTIVE') continue;
      const matches = kind === 'GRANT' ? session.grantId === authorityId
        : kind === 'CONSENT' ? session.consentReceiptId === authorityId
          : session.policyReceiptId === authorityId;
      if (!matches) continue;
      await this.append({
        tenantId: this.tenantId,
        userId: this.userId,
        sessionId: session.sessionId,
        kind: 'AUTHORITY_REVOKED',
        authorityKind: kind,
        authorityId,
        reason,
        evidenceRefs,
        observedAt: now.toISOString(),
      });
      invalidated.push(session.sessionId);
    }
    return invalidated;
  }

  async materialize(now = new Date()): Promise<Map<string, GovernedApiSession75>> {
    const events = await this.load();
    const sessions = new Map<string, GovernedApiSession75>();
    for (const event of events) {
      if (event.kind === 'SESSION_OPENED') {
        if (!event.session) throw new Error('SESSION_OPENED event missing session payload');
        sessions.set(event.sessionId, { ...event.session, scopes: [...event.session.scopes], evidenceRefs: [...event.session.evidenceRefs] });
        continue;
      }
      const session = sessions.get(event.sessionId);
      if (!session) throw new Error('revocation references unknown API session');
      session.state = 'REVOKED';
    }
    for (const session of sessions.values()) {
      if (session.state === 'ACTIVE' && parseTime(session.expiresAt) <= now.getTime()) session.state = 'EXPIRED';
    }
    return sessions;
  }

  async requireActive(sessionId: string, requiredScopes: string[], now = new Date()): Promise<GovernedApiSession75> {
    const sessions = await this.materialize(now);
    const session = sessions.get(sessionId);
    if (!session) throw new Error('unknown API session');
    if (session.state !== 'ACTIVE') throw new Error(`API session is ${session.state.toLowerCase()}`);
    if (!scopesCover(session.scopes, requiredScopes)) throw new Error('API session lacks required scopes');
    return { ...session, scopes: [...session.scopes], evidenceRefs: [...session.evidenceRefs] };
  }
}

export interface VaultAuditEvidence75 {
  auditReceiptId: string;
  tenantId: string;
  userId: string;
  secretId: string;
  secretVersion: number;
  actorRole: 'CEO' | 'DELEGATE';
  delegatedScopes?: string[];
  allowedScopes: string[];
  intendedApiId: string;
  verifiedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  evidenceRefs: string[];
  secretValueRendered: false;
  secretValueLogged: false;
  ordinaryEmbeddingEligible: false;
  clientRenderingAllowed: false;
}

export interface OpaqueCredentialHandle75 {
  handle: string;
  handleId: string;
  tenantId: string;
  userId: string;
  secretId: string;
  secretVersion: number;
  intendedApiId: string;
  scopes: string[];
  issuedAt: string;
  expiresAt: string;
  vaultAuditReceiptId: string;
  evidenceRefs: string[];
  plaintextIncluded: false;
  loggable: false;
  embeddingEligible: false;
  clientRenderable: false;
  restartInvalidatesHandle: true;
}

export interface CredentialBrokerReceipt75 {
  receiptId: string;
  tenantId: string;
  userId: string;
  handleId: string;
  handleSha256: string;
  secretId: string;
  secretVersion: number;
  apiId: string;
  action: 'ISSUED' | 'USED' | 'REVOKED';
  scopes: string[];
  evidenceRefs: string[];
  observedAt: string;
  sequence: number;
  previousHash: string;
  hash: string;
  plaintextStored: false;
}

export class VaultCredentialBroker75 {
  readonly journalPath: string;
  private readonly handles = new Map<string, OpaqueCredentialHandle75>();

  constructor(private readonly root: string, readonly tenantId: string, readonly userId: string) {
    this.journalPath = safeScopedPath(root, tenantId, userId, 'vault-broker', 'credential-receipts.xivjsonl');
  }

  async loadReceipts(): Promise<CredentialBrokerReceipt75[]> {
    let raw: string;
    try { raw = await fs.readFile(this.journalPath, 'utf8'); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const receipts = raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as CredentialBrokerReceipt75);
    let previousHash = GENESIS;
    for (let index = 0; index < receipts.length; index += 1) {
      const receipt = receipts[index];
      if (receipt.tenantId !== this.tenantId || receipt.userId !== this.userId) throw new Error('credential receipt subject mismatch');
      if (receipt.sequence !== index + 1 || receipt.previousHash !== previousHash) throw new Error('credential receipt sequence/hash-chain failure');
      if (receipt.plaintextStored) throw new Error('credential broker receipt cannot contain plaintext');
      const { hash, ...unsigned } = receipt;
      if (sha256(canonical(unsigned)) !== hash) throw new Error('credential receipt integrity failure');
      previousHash = hash;
    }
    return receipts;
  }

  private async append(input: Omit<CredentialBrokerReceipt75, 'receiptId' | 'sequence' | 'previousHash' | 'hash' | 'plaintextStored'>): Promise<CredentialBrokerReceipt75> {
    assertEvidence(input.evidenceRefs, 'credential broker');
    const receipts = await this.loadReceipts();
    const unsigned = {
      ...input,
      receiptId: randomUUID(),
      sequence: receipts.length + 1,
      previousHash: receipts.at(-1)?.hash ?? GENESIS,
      plaintextStored: false as const,
    };
    const receipt: CredentialBrokerReceipt75 = { ...unsigned, hash: sha256(canonical(unsigned)) };
    await fs.mkdir(path.dirname(this.journalPath), { recursive: true, mode: 0o700 });
    await fs.appendFile(this.journalPath, `${JSON.stringify(receipt)}\n`, { encoding: 'utf8', mode: 0o600 });
    return receipt;
  }

  async issue(input: { audit: VaultAuditEvidence75; requestedScopes: string[]; ttlMs: number; evidenceRefs: string[]; now?: Date }): Promise<OpaqueCredentialHandle75> {
    const now = input.now ?? new Date();
    const audit = input.audit;
    if (audit.tenantId !== this.tenantId || audit.userId !== this.userId) throw new Error('vault audit subject mismatch');
    if (audit.secretValueRendered || audit.secretValueLogged || audit.ordinaryEmbeddingEligible || audit.clientRenderingAllowed) throw new Error('unsafe vault audit evidence rejected');
    assertEvidence(audit.evidenceRefs, 'vault audit');
    assertEvidence(input.evidenceRefs, 'credential issuance');
    if (audit.revokedAt && parseTime(audit.revokedAt) <= now.getTime()) throw new Error('vault audit authorization revoked');
    if (audit.expiresAt && parseTime(audit.expiresAt) <= now.getTime()) throw new Error('vault audit authorization expired');
    if (!Number.isInteger(audit.secretVersion) || audit.secretVersion < 1) throw new Error('positive secret version required');
    if (audit.actorRole === 'DELEGATE' && !scopesCover(audit.delegatedScopes ?? [], input.requestedScopes)) throw new Error('delegated actor lacks requested secret scopes');
    if (!scopesCover(audit.allowedScopes, input.requestedScopes)) throw new Error('requested secret scopes exceed vault authorization');
    if (!Number.isFinite(input.ttlMs) || input.ttlMs <= 0 || input.ttlMs > MAX_CREDENTIAL_TTL_MS) throw new Error('credential handle ttl must be between 1ms and five minutes');

    const handle = `xivcred_${randomBytes(32).toString('base64url')}`;
    const handleId = randomUUID();
    const credential: OpaqueCredentialHandle75 = {
      handle,
      handleId,
      tenantId: this.tenantId,
      userId: this.userId,
      secretId: audit.secretId,
      secretVersion: audit.secretVersion,
      intendedApiId: audit.intendedApiId,
      scopes: [...new Set(input.requestedScopes)],
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + input.ttlMs).toISOString(),
      vaultAuditReceiptId: audit.auditReceiptId,
      evidenceRefs: [...new Set([...audit.evidenceRefs, ...input.evidenceRefs])],
      plaintextIncluded: false,
      loggable: false,
      embeddingEligible: false,
      clientRenderable: false,
      restartInvalidatesHandle: true,
    };
    this.handles.set(handle, credential);
    await this.append({
      tenantId: this.tenantId,
      userId: this.userId,
      handleId,
      handleSha256: sha256(handle),
      secretId: audit.secretId,
      secretVersion: audit.secretVersion,
      apiId: audit.intendedApiId,
      action: 'ISSUED',
      scopes: credential.scopes,
      evidenceRefs: credential.evidenceRefs,
      observedAt: now.toISOString(),
    });
    return { ...credential, scopes: [...credential.scopes], evidenceRefs: [...credential.evidenceRefs] };
  }

  async authorizeUse(input: { handle: string; apiId: string; requiredScopes: string[]; evidenceRefs: string[]; now?: Date }): Promise<{ authorized: true; handleId: string; secretId: string; secretVersion: number; plaintextReturned: false }> {
    const now = input.now ?? new Date();
    assertEvidence(input.evidenceRefs, 'credential use');
    const credential = this.handles.get(input.handle);
    if (!credential) throw new Error('unknown or restart-invalidated credential handle');
    if (parseTime(credential.expiresAt) <= now.getTime()) throw new Error('credential handle expired');
    if (credential.intendedApiId !== input.apiId) throw new Error('credential handle API mismatch');
    if (!scopesCover(credential.scopes, input.requiredScopes)) throw new Error('credential handle scope mismatch');
    await this.append({
      tenantId: this.tenantId,
      userId: this.userId,
      handleId: credential.handleId,
      handleSha256: sha256(input.handle),
      secretId: credential.secretId,
      secretVersion: credential.secretVersion,
      apiId: input.apiId,
      action: 'USED',
      scopes: input.requiredScopes,
      evidenceRefs: [...credential.evidenceRefs, ...input.evidenceRefs],
      observedAt: now.toISOString(),
    });
    return { authorized: true, handleId: credential.handleId, secretId: credential.secretId, secretVersion: credential.secretVersion, plaintextReturned: false };
  }

  async revoke(handle: string, evidenceRefs: string[], now = new Date()): Promise<void> {
    const credential = this.handles.get(handle);
    if (!credential) return;
    assertEvidence(evidenceRefs, 'credential revocation');
    this.handles.delete(handle);
    await this.append({
      tenantId: this.tenantId,
      userId: this.userId,
      handleId: credential.handleId,
      handleSha256: sha256(handle),
      secretId: credential.secretId,
      secretVersion: credential.secretVersion,
      apiId: credential.intendedApiId,
      action: 'REVOKED',
      scopes: credential.scopes,
      evidenceRefs: [...credential.evidenceRefs, ...evidenceRefs],
      observedAt: now.toISOString(),
    });
  }
}

export interface RuntimeProbeSample75 {
  tenantId: string;
  component: RuntimeComponent75;
  observedAt: string;
  reachable: boolean;
  httpStatus?: number;
  latencyMs: number;
  queueDepth?: number;
  storageUsedBytes?: number;
  storageCapacityBytes?: number;
  evidenceRefs: string[];
}

export interface RuntimeComponentHealth75 {
  component: RuntimeComponent75;
  status: RuntimeHealth75;
  sampleCount: number;
  successCount: number;
  failureCount: number;
  uptimeRatio: number | null;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  latestQueueDepth: number | null;
  latestStorageUtilization: number | null;
  evidenceRefs: string[];
  configuredImpliesRunning: false;
}

export interface GpuEvidenceReceipt75 {
  tenantId: string;
  deviceId: string;
  kind: 'HARDWARE' | 'RUNTIME' | 'BENCHMARK' | 'EXECUTION';
  receiptId: string;
  observedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  evidenceRefs: string[];
}

export interface BrainRuntimeSnapshot75 {
  tenantId: string;
  observedAt: string;
  components: Record<RuntimeComponent75, RuntimeComponentHealth75>;
  execution: {
    sovereignBaseline: 'CPU';
    cpuRuntimeVerified: boolean;
    gpuAccelerationEligible: boolean;
    gpuExecutionObserved: boolean;
    selectedBackend: 'CPU' | 'GPU_ELIGIBLE_NOT_OBSERVED' | 'GPU_OBSERVED';
    ollamaRunning: false;
    androidDeviceVerified: false;
    cloudIntegrationVerified: false;
  };
  evidenceRefs: string[];
  snapshotHash: string;
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

export class PrivateBrainRuntimeSupervisor75 {
  constructor(readonly tenantId: string) { assertId(tenantId, 'tenant id'); }

  evaluateComponent(component: RuntimeComponent75, samples: RuntimeProbeSample75[], options: { asOf?: Date; maxAgeMs?: number; maxP95LatencyMs?: number; maxQueueDepth?: number; maxStorageUtilization?: number; minUptimeRatio?: number } = {}): RuntimeComponentHealth75 {
    const asOf = options.asOf ?? new Date();
    const maxAgeMs = options.maxAgeMs ?? 5 * 60 * 1000;
    const currentSamples = samples.filter((sample) => {
      if (sample.tenantId !== this.tenantId || sample.component !== component) return false;
      assertEvidence(sample.evidenceRefs, 'runtime probe');
      const age = asOf.getTime() - parseTime(sample.observedAt);
      return age >= 0 && age <= maxAgeMs;
    });
    if (currentSamples.length === 0) {
      return { component, status: 'UNVERIFIED', sampleCount: 0, successCount: 0, failureCount: 0, uptimeRatio: null, p50LatencyMs: null, p95LatencyMs: null, latestQueueDepth: null, latestStorageUtilization: null, evidenceRefs: [], configuredImpliesRunning: false };
    }
    const successful = currentSamples.filter((sample) => sample.reachable && (sample.httpStatus === undefined || (sample.httpStatus >= 200 && sample.httpStatus < 400)));
    const latencies = successful.map((sample) => sample.latencyMs).filter((value) => Number.isFinite(value) && value >= 0);
    const latest = [...currentSamples].sort((a, b) => parseTime(b.observedAt) - parseTime(a.observedAt))[0];
    const storage = latest.storageCapacityBytes && latest.storageCapacityBytes > 0 && latest.storageUsedBytes !== undefined ? latest.storageUsedBytes / latest.storageCapacityBytes : null;
    const uptime = successful.length / currentSamples.length;
    const p95 = percentile(latencies, 95);
    let status: RuntimeHealth75;
    if (successful.length === 0) status = 'OFFLINE';
    else if (
      uptime < (options.minUptimeRatio ?? 0.99)
      || (p95 !== null && p95 > (options.maxP95LatencyMs ?? 1500))
      || (latest.queueDepth !== undefined && latest.queueDepth > (options.maxQueueDepth ?? 100))
      || (storage !== null && storage > (options.maxStorageUtilization ?? 0.9))
    ) status = 'DEGRADED';
    else status = 'HEALTHY';
    return {
      component,
      status,
      sampleCount: currentSamples.length,
      successCount: successful.length,
      failureCount: currentSamples.length - successful.length,
      uptimeRatio: uptime,
      p50LatencyMs: percentile(latencies, 50),
      p95LatencyMs: p95,
      latestQueueDepth: latest.queueDepth ?? null,
      latestStorageUtilization: storage,
      evidenceRefs: [...new Set(currentSamples.flatMap((sample) => sample.evidenceRefs))],
      configuredImpliesRunning: false,
    };
  }

  evaluateGpu(receipts: GpuEvidenceReceipt75[], asOf = new Date()): { eligible: boolean; executionObserved: boolean; evidenceRefs: string[] } {
    const current = receipts.filter((receipt) => {
      if (receipt.tenantId !== this.tenantId) return false;
      assertEvidence(receipt.evidenceRefs, 'GPU receipt');
      if (receipt.revokedAt && parseTime(receipt.revokedAt) <= asOf.getTime()) return false;
      if (receipt.expiresAt && parseTime(receipt.expiresAt) <= asOf.getTime()) return false;
      return parseTime(receipt.observedAt) <= asOf.getTime();
    });
    const deviceIds = new Set(current.map((receipt) => receipt.deviceId));
    let eligible = false;
    let executionObserved = false;
    for (const deviceId of deviceIds) {
      const kinds = new Set(current.filter((receipt) => receipt.deviceId === deviceId).map((receipt) => receipt.kind));
      const verified = kinds.has('HARDWARE') && kinds.has('RUNTIME') && kinds.has('BENCHMARK');
      eligible ||= verified;
      executionObserved ||= verified && kinds.has('EXECUTION');
    }
    return { eligible, executionObserved, evidenceRefs: [...new Set(current.flatMap((receipt) => receipt.evidenceRefs))] };
  }

  snapshot(samples: RuntimeProbeSample75[], gpuReceipts: GpuEvidenceReceipt75[], asOf = new Date()): BrainRuntimeSnapshot75 {
    const components = {
      CPU_BRAIN: this.evaluateComponent('CPU_BRAIN', samples, { asOf }),
      RAG: this.evaluateComponent('RAG', samples, { asOf }),
      API_STUDIO: this.evaluateComponent('API_STUDIO', samples, { asOf }),
    };
    const gpu = this.evaluateGpu(gpuReceipts, asOf);
    const unsigned = {
      tenantId: this.tenantId,
      observedAt: asOf.toISOString(),
      components,
      execution: {
        sovereignBaseline: 'CPU' as const,
        cpuRuntimeVerified: components.CPU_BRAIN.status === 'HEALTHY' || components.CPU_BRAIN.status === 'DEGRADED',
        gpuAccelerationEligible: gpu.eligible,
        gpuExecutionObserved: gpu.executionObserved,
        selectedBackend: (gpu.executionObserved ? 'GPU_OBSERVED' : gpu.eligible ? 'GPU_ELIGIBLE_NOT_OBSERVED' : 'CPU') as BrainRuntimeSnapshot75['execution']['selectedBackend'],
        ollamaRunning: false as const,
        androidDeviceVerified: false as const,
        cloudIntegrationVerified: false as const,
      },
      evidenceRefs: [...new Set([...Object.values(components).flatMap((component) => component.evidenceRefs), ...gpu.evidenceRefs])],
    };
    return { ...unsigned, snapshotHash: sha256(canonical(unsigned)) };
  }

  async persistSnapshot(root: string, snapshot: BrainRuntimeSnapshot75): Promise<string> {
    if (snapshot.tenantId !== this.tenantId) throw new Error('runtime snapshot tenant mismatch');
    const { snapshotHash, ...unsigned } = snapshot;
    if (sha256(canonical(unsigned)) !== snapshotHash) throw new Error('runtime snapshot integrity failure');
    const filePath = safeScopedPath(root, this.tenantId, undefined, 'runtime', 'private-brain-health.json');
    await atomicWriteJson(filePath, snapshot);
    return filePath;
  }
}

export interface ContentFreeUsageRollup75 {
  tenantId: string;
  sourceEventCount: number;
  sourceHeadHash: string;
  views: number;
  uniqueUsers: number;
  sessions: number;
  featureUsage: Record<string, number>;
  surfaceViews: Record<string, number>;
  rawContentLogged: false;
  rawQueryLogged: false;
  payloadLogged: false;
  evidenceRefs: string[];
}

export interface UsageCheckpoint75 extends ContentFreeUsageRollup75 {
  checkpointId: string;
  createdAt: string;
  checkpointHash: string;
}

export class UsageRollupCheckpointStore75 {
  readonly filePath: string;
  constructor(private readonly root: string, readonly tenantId: string) {
    this.filePath = safeScopedPath(root, tenantId, undefined, 'analytics', 'usage-rollup-checkpoint.json');
  }

  async save(rollup: ContentFreeUsageRollup75, now = new Date()): Promise<UsageCheckpoint75> {
    if (rollup.tenantId !== this.tenantId) throw new Error('usage checkpoint tenant mismatch');
    if (rollup.rawContentLogged || rollup.rawQueryLogged || rollup.payloadLogged) throw new Error('content-bearing usage rollup rejected');
    assertEvidence(rollup.evidenceRefs, 'usage rollup');
    if (!/^[a-f0-9]{64}$/i.test(rollup.sourceHeadHash)) throw new Error('usage source head hash required');
    const unsigned = { ...rollup, checkpointId: randomUUID(), createdAt: now.toISOString() };
    const checkpoint: UsageCheckpoint75 = { ...unsigned, checkpointHash: sha256(canonical(unsigned)) };
    await atomicWriteJson(this.filePath, checkpoint);
    return checkpoint;
  }

  async load(): Promise<UsageCheckpoint75 | undefined> {
    let raw: string;
    try { raw = await fs.readFile(this.filePath, 'utf8'); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
    const checkpoint = JSON.parse(raw) as UsageCheckpoint75;
    if (checkpoint.tenantId !== this.tenantId) throw new Error('usage checkpoint tenant mismatch');
    const { checkpointHash, ...unsigned } = checkpoint;
    if (sha256(canonical(unsigned)) !== checkpointHash) throw new Error('usage checkpoint integrity failure');
    if (checkpoint.rawContentLogged || checkpoint.rawQueryLogged || checkpoint.payloadLogged) throw new Error('content-bearing usage checkpoint rejected');
    return checkpoint;
  }
}

export interface StrategicTaskRecord75 {
  taskId: string;
  tenantId: string;
  title: string;
  ownerRole: string;
  status: 'QUEUED' | 'ACTIVE' | 'BLOCKED' | 'COMPLETED';
  evidenceRefs: string[];
  productionAuthority: false;
}

export interface GovernedMeetingRecord75 {
  meetingId: string;
  tenantId: string;
  recurrence: 'HOURLY' | 'DAILY' | 'WEEKLY';
  scheduledFor: string;
  nextScheduledFor: string;
  participantRoles: string[];
  taskIds: string[];
  minutesEvidenceRefs: string[];
  decisions: Array<{ summary: string; ownerRole: string; evidenceRefs: string[] }>;
  dissent: Array<{ role: string; statement: string; evidenceRefs: string[] }>;
  authority: {
    canDeploy: false;
    canPublish: false;
    canMoveMoney: false;
    canOpenAccounts: false;
    canSignContracts: false;
  };
  consciousnessClaim: false;
  freeWillClaim: false;
}

export interface WorkCouncilJournalEntry75 {
  entryId: string;
  tenantId: string;
  kind: 'TASK' | 'MEETING';
  task?: StrategicTaskRecord75;
  meeting?: GovernedMeetingRecord75;
  observedAt: string;
  evidenceRefs: string[];
  sequence: number;
  previousHash: string;
  hash: string;
}

export class PersistentWorkCouncil75 {
  readonly filePath: string;
  constructor(private readonly root: string, readonly tenantId: string) {
    this.filePath = safeScopedPath(root, tenantId, undefined, 'operations', 'work-council.xivjsonl');
  }

  async load(): Promise<WorkCouncilJournalEntry75[]> {
    let raw: string;
    try { raw = await fs.readFile(this.filePath, 'utf8'); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const entries = raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as WorkCouncilJournalEntry75);
    let previousHash = GENESIS;
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      if (entry.tenantId !== this.tenantId || entry.sequence !== index + 1 || entry.previousHash !== previousHash) throw new Error('work council tenant/sequence/hash-chain failure');
      const { hash, ...unsigned } = entry;
      if (sha256(canonical(unsigned)) !== hash) throw new Error('work council integrity failure');
      previousHash = hash;
    }
    return entries;
  }

  private async append(input: Omit<WorkCouncilJournalEntry75, 'entryId' | 'sequence' | 'previousHash' | 'hash'>): Promise<WorkCouncilJournalEntry75> {
    assertEvidence(input.evidenceRefs, 'work council');
    const entries = await this.load();
    const unsigned = { ...input, entryId: randomUUID(), sequence: entries.length + 1, previousHash: entries.at(-1)?.hash ?? GENESIS };
    const entry: WorkCouncilJournalEntry75 = { ...unsigned, hash: sha256(canonical(unsigned)) };
    await fs.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    await fs.appendFile(this.filePath, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', mode: 0o600 });
    return entry;
  }

  async assignTask(input: Omit<StrategicTaskRecord75, 'taskId' | 'productionAuthority'>, now = new Date()): Promise<StrategicTaskRecord75> {
    if (input.tenantId !== this.tenantId) throw new Error('task tenant mismatch');
    if (!input.title.trim() || !input.ownerRole.trim()) throw new Error('task title and owner role required');
    assertEvidence(input.evidenceRefs, 'strategic task');
    const task: StrategicTaskRecord75 = { ...input, taskId: randomUUID(), productionAuthority: false };
    await this.append({ tenantId: this.tenantId, kind: 'TASK', task, observedAt: now.toISOString(), evidenceRefs: task.evidenceRefs });
    return task;
  }

  async recordMeeting(input: Omit<GovernedMeetingRecord75, 'meetingId' | 'authority' | 'consciousnessClaim' | 'freeWillClaim'>, now = new Date()): Promise<GovernedMeetingRecord75> {
    if (input.tenantId !== this.tenantId) throw new Error('meeting tenant mismatch');
    const roles = [...new Set(input.participantRoles.map((role) => role.trim()).filter(Boolean))];
    if (roles.length < 2 || roles.length > 8) throw new Error('meeting requires 2-8 distinct active roles');
    if (parseTime(input.nextScheduledFor) <= parseTime(input.scheduledFor)) throw new Error('next meeting must be after scheduled meeting');
    assertEvidence(input.minutesEvidenceRefs, 'meeting minutes');
    for (const decision of input.decisions) {
      if (!roles.includes(decision.ownerRole)) throw new Error('decision owner must be an active meeting role');
      assertEvidence(decision.evidenceRefs, 'meeting decision');
    }
    for (const dissent of input.dissent) {
      if (!roles.includes(dissent.role)) throw new Error('dissent role must be an active meeting role');
      if (!dissent.statement.trim()) throw new Error('dissent statement required');
      assertEvidence(dissent.evidenceRefs, 'meeting dissent');
    }
    const meeting: GovernedMeetingRecord75 = {
      ...input,
      participantRoles: roles,
      meetingId: randomUUID(),
      authority: { canDeploy: false, canPublish: false, canMoveMoney: false, canOpenAccounts: false, canSignContracts: false },
      consciousnessClaim: false,
      freeWillClaim: false,
    };
    await this.append({ tenantId: this.tenantId, kind: 'MEETING', meeting, observedAt: now.toISOString(), evidenceRefs: meeting.minutesEvidenceRefs });
    return meeting;
  }
}

export interface UserAuthorizationReceipt75 {
  receiptId: string;
  tenantId: string;
  userId: string;
  vendorId: string;
  scopes: string[];
  dataClasses: SensitiveDataClass75[];
  jurisdiction: string;
  externalRoutingAllowed: boolean;
  expiresAt?: string;
  revokedAt?: string;
  evidenceRefs: string[];
}

export interface LegalPolicyReceipt75 {
  receiptId: string;
  tenantId: string;
  jurisdiction: string;
  vendorId: string;
  allowedDataClasses: SensitiveDataClass75[];
  externalRoutingAllowed: boolean;
  expiresAt?: string;
  revokedAt?: string;
  evidenceRefs: string[];
}

export interface VendorVerificationReceipt75 {
  receiptId: string;
  tenantId: string;
  vendorId: string;
  status: VendorStatus75;
  supportedApi: boolean;
  expiresAt?: string;
  revokedAt?: string;
  evidenceRefs: string[];
}

export interface HybridRouteDecision75 {
  allowed: boolean;
  reasons: string[];
  vendorStatus: VendorStatus75;
  partnershipClaimAllowed: boolean;
  topSecretExternalRoutingAllowed: false;
  rawPrivateDataCentralizedByDefault: false;
  financialAuthority: {
    unrestrictedBankAccess: false;
    canMoveMoney: false;
    canOpenAccounts: false;
    canSignContracts: false;
  };
}

function receiptCurrent(expiresAt: string | undefined, revokedAt: string | undefined, now: number): boolean {
  if (revokedAt && parseTime(revokedAt) <= now) return false;
  if (expiresAt && parseTime(expiresAt) <= now) return false;
  return true;
}

export async function evaluateHybridRoute75(input: {
  sessionJournal: PersistentGovernedApiSessionJournal75;
  sessionId: string;
  requiredScopes: string[];
  authorization: UserAuthorizationReceipt75;
  legalPolicy: LegalPolicyReceipt75;
  vendor: VendorVerificationReceipt75;
  dataClass: SensitiveDataClass75;
  classification: DataClassification75;
  jurisdiction: string;
  now?: Date;
}): Promise<HybridRouteDecision75> {
  const now = input.now ?? new Date();
  const reasons: string[] = [];
  const session = await input.sessionJournal.requireActive(input.sessionId, input.requiredScopes, now);
  if (session.exposure !== 'HYBRID_OUTBOUND') reasons.push('API session is not a hybrid-outbound session.');
  if (input.classification === 'TOP_SECRET' || session.classification === 'TOP_SECRET') reasons.push('TOP_SECRET cannot be routed externally.');
  if (session.vendorId !== input.vendor.vendorId) reasons.push('API session vendor target does not match vendor verification receipt.');
  if (input.authorization.tenantId !== session.tenantId || input.authorization.userId !== session.userId || input.authorization.vendorId !== input.vendor.vendorId) reasons.push('User authorization subject/vendor mismatch.');
  if (!receiptCurrent(input.authorization.expiresAt, input.authorization.revokedAt, now.getTime())) reasons.push('User authorization is expired or revoked.');
  if (!input.authorization.externalRoutingAllowed || !scopesCover(input.authorization.scopes, input.requiredScopes) || !input.authorization.dataClasses.includes(input.dataClass) || input.authorization.jurisdiction !== input.jurisdiction) reasons.push('User authorization does not permit the requested minimum external scope/data class/jurisdiction.');
  if (input.legalPolicy.tenantId !== session.tenantId || input.legalPolicy.vendorId !== input.vendor.vendorId || input.legalPolicy.jurisdiction !== input.jurisdiction) reasons.push('Legal-policy receipt scope mismatch.');
  if (!receiptCurrent(input.legalPolicy.expiresAt, input.legalPolicy.revokedAt, now.getTime())) reasons.push('Legal-policy receipt is expired or revoked.');
  if (!input.legalPolicy.externalRoutingAllowed || !input.legalPolicy.allowedDataClasses.includes(input.dataClass)) reasons.push('Legal-policy receipt does not permit this external data class.');
  if (input.vendor.tenantId !== session.tenantId) reasons.push('Vendor verification tenant mismatch.');
  if (!receiptCurrent(input.vendor.expiresAt, input.vendor.revokedAt, now.getTime())) reasons.push('Vendor verification is expired or revoked.');
  if (input.vendor.status !== 'VERIFIED_PARTNER') reasons.push(`Vendor status ${input.vendor.status} is not VERIFIED_PARTNER.`);
  if (input.dataClass === 'FINANCIAL' && !input.vendor.supportedApi) reasons.push('Financial connector must use a user-authorized supported API.');
  assertEvidence(input.authorization.evidenceRefs, 'user authorization');
  assertEvidence(input.legalPolicy.evidenceRefs, 'legal policy');
  assertEvidence(input.vendor.evidenceRefs, 'vendor verification');
  return {
    allowed: reasons.length === 0,
    reasons,
    vendorStatus: input.vendor.status,
    partnershipClaimAllowed: reasons.length === 0 && input.vendor.status === 'VERIFIED_PARTNER',
    topSecretExternalRoutingAllowed: false,
    rawPrivateDataCentralizedByDefault: false,
    financialAuthority: { unrestrictedBankAccess: false, canMoveMoney: false, canOpenAccounts: false, canSignContracts: false },
  };
}
