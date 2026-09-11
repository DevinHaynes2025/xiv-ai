import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

export type DataClassification74 = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'TOP_SECRET';
export type SensitiveDataClass74 = 'GENERAL' | 'HEALTH' | 'FINANCIAL' | 'GENETIC' | 'COMMUNICATIONS' | 'SOCIAL_ACCOUNT';
export type ApiExposure74 = 'LOCAL_LOOPBACK' | 'PRIVATE_NETWORK' | 'HYBRID_OUTBOUND';
export type RetrievalRoute74 = 'LOCAL_ONLY' | 'LOCAL_RESTRICTED' | 'HYBRID';
export type RuntimeBackend74 = 'CPU' | 'GPU';
export type RuntimeHealth74 = 'VERIFIED' | 'UNVERIFIED' | 'BLOCKED';
export type AdapterStatus74 = 'TARGET' | 'RESEARCH' | 'API_READY' | 'VERIFIED_PARTNER';
export type GatewaySessionStatus74 = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface ApiDefinition74 {
  apiId: string;
  tenantId: string;
  exposure: ApiExposure74;
  connectorId?: string;
  dataClass: SensitiveDataClass74;
  maxClassification: DataClassification74;
  requiredScopes: string[];
  enabled: boolean;
}

export interface ApiInvocationDecision74 {
  allowed: boolean;
  reasons: string[];
  exposure: ApiExposure74;
  requiredScopes: string[];
  externalRoutingAllowed: boolean;
  secretRenderingAllowed: false;
  embeddingAllowed: boolean;
  clientRenderingAllowed: boolean;
}

export interface ApiStudioBridge74 {
  get(tenantId: string, apiId: string): ApiDefinition74 | undefined;
  decide(request: {
    tenantId: string;
    apiId: string;
    subjectId: string;
    scopes: string[];
    jurisdiction: string;
    classification: DataClassification74;
    dataClass: SensitiveDataClass74;
    consentReceipt?: any;
    legalPolicyReceipt?: any;
  }, asOf?: number): ApiInvocationDecision74;
}

export interface RetrievalAccessReceipt74 {
  receiptId: string;
  sessionId: string;
  authorized: true;
  evidenceRefs: string[];
  observedAt: string;
}

export interface AuthorizedRetrievalBridge74 {
  authorizeRead(input: {
    sessionId: string;
    scope: string;
    memoryNamespace: string;
    classification: DataClassification74;
    route: RetrievalRoute74;
    query: string;
    candidateCount: number;
    hitCount: number;
    evidenceRefs: string[];
    now?: Date;
  }): Promise<RetrievalAccessReceipt74>;
  invalidateByGrant(grantId: string, reason?: string): number;
  invalidateByConsent(consentReceiptId: string, reason?: string): number;
  invalidateByPolicy(policyReceiptId: string, reason?: string): number;
}

export interface BrainExecutionPlan74 {
  tenantId: string;
  workloadId: string;
  selectedBackend: RuntimeBackend74;
  status: RuntimeHealth74;
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

export interface BrainPlannerBridge74 {
  plan(request: {
    tenantId: string;
    workloadId: string;
    requestedBackend?: RuntimeBackend74;
    classification: DataClassification74;
    estimatedMemoryMb: number;
    evidenceRefs: string[];
  }, asOf?: number): BrainExecutionPlan74;
}

export interface VaultCredentialReference74 {
  tenantId: string;
  secretId: string;
  intendedApiId: string;
  requiredScopes: string[];
  evidenceRefs: string[];
}

export interface VaultCredentialAttestation74 {
  attestationId: string;
  tenantId: string;
  secretId: string;
  intendedApiId: string;
  scopes: string[];
  current: boolean;
  expiresAt?: string;
  revokedAt?: string;
  auditReceiptId: string;
  evidenceRefs: string[];
  secretValueRendered: false;
  secretValueLogged: false;
  ordinaryEmbeddingEligible: false;
  clientRenderingAllowed: false;
}

export interface VaultCredentialBroker74 {
  attest(reference: VaultCredentialReference74, asOf?: Date): Promise<VaultCredentialAttestation74>;
}

export interface GovernedApiSession74 {
  sessionId: string;
  tenantId: string;
  userId: string;
  universeId: string;
  agentId: string;
  apiId: string;
  retrievalSessionId: string;
  memoryNamespace: string;
  grantId: string;
  consentReceiptId?: string;
  policyReceiptId?: string;
  scopes: string[];
  jurisdiction: string;
  credentialRef?: VaultCredentialReference74;
  startedAt: string;
  expiresAt: string;
  status: GatewaySessionStatus74;
  invalidationReason?: string;
  evidenceRefs: string[];
}

export interface GovernedApiInvocationReceipt74 {
  receiptId: string;
  tenantId: string;
  apiSessionId: string;
  apiId: string;
  allowed: boolean;
  reasons: string[];
  classification: DataClassification74;
  dataClass: SensitiveDataClass74;
  route: RetrievalRoute74;
  querySha256: string;
  retrievalReceiptId?: string;
  credentialAttestationId?: string;
  execution: BrainExecutionPlan74;
  evidenceRefs: string[];
  observedAt: string;
  handling: {
    rawQueryLogged: false;
    rawPayloadLogged: false;
    ordinaryEmbeddingsExecuted: false;
    topSecretClientRenderingAllowed: false;
    credentialRendered: false;
    credentialLogged: false;
    credentialEmbeddingAllowed: false;
    topSecretExternalRoutingAllowed: false;
  };
  authority: {
    canDeploy: false;
    canPublish: false;
    canMoveMoney: false;
    canOpenAccounts: false;
    canSignContracts: false;
    unrestrictedBankAccess: false;
  };
}

export interface RevocationEvent74 {
  tenantId: string;
  kind: 'GRANT' | 'CONSENT' | 'POLICY';
  targetId: string;
  reason: string;
  evidenceRefs: string[];
  observedAt?: string;
}

export interface RevocationReceipt74 {
  receiptId: string;
  tenantId: string;
  kind: RevocationEvent74['kind'];
  targetId: string;
  apiSessionsInvalidated: string[];
  retrievalSessionsInvalidated: number;
  evidenceRefs: string[];
  observedAt: string;
}

export type UsageEventKind74 = 'VIEW' | 'FEATURE_USE';

export interface ContentFreeUsageEvent74 {
  eventId: string;
  tenantId: string;
  pseudonymousSubject: string;
  apiSessionId: string;
  apiId: string;
  kind: UsageEventKind74;
  featureId?: string;
  surfaceId?: string;
  observedAt: string;
  evidenceRefs: string[];
  rawContentLogged: false;
  rawQueryLogged: false;
  payloadLogged: false;
  sequence: number;
  previousHash: string;
  hash: string;
}

export interface ContentFreeUsageView74 {
  views: number;
  uniqueUsers: number;
  sessions: number;
  featureUsage: Record<string, number>;
  surfaceViews: Record<string, number>;
  eventCount: number;
  contentLogged: false;
  evidenceHeadHash: string;
}

export interface StrategicTask74 {
  taskId: string;
  tenantId: string;
  title: string;
  ownerRole: string;
  status: 'QUEUED' | 'ACTIVE' | 'BLOCKED' | 'COMPLETED';
  evidenceRefs: string[];
  productionAuthority: false;
}

export interface MeetingDecision74 {
  decisionId: string;
  summary: string;
  ownerRole: string;
  productionImpact: boolean;
  humanApprovalReceiptId?: string;
  humanApprovalEvidenceRefs?: string[];
  status: 'RECOMMENDATION_ONLY' | 'HUMAN_APPROVED_RECOMMENDATION';
}

export interface EvaluationMeeting74 {
  meetingId: string;
  tenantId: string;
  recurrence: 'HOURLY' | 'DAILY' | 'WEEKLY';
  scheduledFor: string;
  nextScheduledFor: string;
  participantRoles: string[];
  taskIds: string[];
  minutesEvidenceRefs: string[];
  decisions: MeetingDecision74[];
  dissent: Array<{ role: string; statement: string; evidenceRefs: string[] }>;
  autonomousDeploymentAllowed: false;
  consciousnessClaim: false;
  freeWillClaim: false;
}

export const GROUNDING_INVARIANTS_12D74 = Object.freeze({
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
  autonomousCounterattackAllowed: false,
  financialAutonomousMoneyMovementAllowed: false,
  financialAccountOpeningAllowed: false,
  financialContractSigningAllowed: false,
});

const GENESIS = '0'.repeat(64);

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
  if (!Array.isArray(refs) || refs.length === 0 || refs.some((ref) => !ref.trim())) throw new Error(`${label} evidence is required`);
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

function current(expiresAt: string | undefined, revokedAt: string | undefined, now: number): boolean {
  if (revokedAt && parseTime(revokedAt) <= now) return false;
  if (expiresAt && parseTime(expiresAt) <= now) return false;
  return true;
}

function safeTenantPath(root: string, tenantId: string, ...parts: string[]): string {
  assertId(tenantId, 'tenant id');
  for (const part of parts) assertId(part, 'path segment');
  const base = path.resolve(root);
  const target = path.resolve(base, tenantId, ...parts);
  const relative = path.relative(base, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('path traversal rejected');
  return target;
}

export class CpuFirstBrainExecutionGate74 {
  constructor(private readonly planner: BrainPlannerBridge74) {}

  select(request: {
    tenantId: string;
    workloadId: string;
    requestedBackend?: RuntimeBackend74;
    classification: DataClassification74;
    estimatedMemoryMb: number;
    evidenceRefs: string[];
  }, asOf = Date.now()): BrainExecutionPlan74 {
    assertEvidence(request.evidenceRefs, 'brain workload');
    const requested = request.requestedBackend ?? 'CPU';
    if (requested === 'CPU') return this.planner.plan({ ...request, requestedBackend: 'CPU' }, asOf);

    const accelerated = this.planner.plan({ ...request, requestedBackend: 'GPU' }, asOf);
    const gpuVerified = accelerated.selectedBackend === 'GPU'
      && accelerated.status === 'VERIFIED'
      && accelerated.accelerationVerified
      && accelerated.claims.gpuRunning
      && accelerated.evidenceRefs.length > 0;
    if (gpuVerified) return accelerated;

    const cpu = this.planner.plan({ ...request, requestedBackend: 'CPU' }, asOf);
    return {
      ...cpu,
      reasons: [
        'GPU was requested but is not eligible without current hardware/runtime/benchmark evidence; CPU remains the sovereign baseline.',
        ...accelerated.reasons,
        ...cpu.reasons,
      ],
      claims: { ...cpu.claims, gpuRunning: false, ollamaRunning: false, physicalDeviceRunning: false },
      accelerationVerified: false,
    };
  }
}

export class ContentFreeUsageLedger74 {
  readonly filePath: string;

  constructor(private readonly root: string, readonly tenantId: string) {
    this.filePath = safeTenantPath(root, tenantId, 'analytics', 'brain-gateway-usage.xivjsonl');
  }

  async load(): Promise<ContentFreeUsageEvent74[]> {
    let raw: string;
    try { raw = await fs.readFile(this.filePath, 'utf8'); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    const events = raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line) as ContentFreeUsageEvent74);
    let previousHash = GENESIS;
    for (let index = 0; index < events.length; index += 1) {
      const event = events[index];
      if (event.tenantId !== this.tenantId || event.sequence !== index + 1 || event.previousHash !== previousHash) throw new Error('usage ledger tenant/sequence/hash-chain failure');
      const { hash, ...unsigned } = event;
      if (sha256(canonical(unsigned)) !== hash) throw new Error('usage event integrity failure');
      if (event.rawContentLogged || event.rawQueryLogged || event.payloadLogged) throw new Error('content-bearing usage event rejected');
      previousHash = hash;
    }
    return events;
  }

  async record(input: Omit<ContentFreeUsageEvent74, 'eventId' | 'sequence' | 'previousHash' | 'hash' | 'rawContentLogged' | 'rawQueryLogged' | 'payloadLogged'>): Promise<ContentFreeUsageEvent74> {
    if (input.tenantId !== this.tenantId) throw new Error('usage ledger tenant mismatch');
    assertEvidence(input.evidenceRefs, 'usage event');
    const events = await this.load();
    const unsigned = {
      ...input,
      eventId: randomUUID(),
      rawContentLogged: false as const,
      rawQueryLogged: false as const,
      payloadLogged: false as const,
      sequence: events.length + 1,
      previousHash: events.at(-1)?.hash ?? GENESIS,
    };
    const event: ContentFreeUsageEvent74 = { ...unsigned, hash: sha256(canonical(unsigned)) };
    await fs.mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    await fs.appendFile(this.filePath, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 });
    return event;
  }

  async materialize(): Promise<ContentFreeUsageView74> {
    const events = await this.load();
    const users = new Set(events.map((event) => event.pseudonymousSubject));
    const sessions = new Set(events.map((event) => event.apiSessionId));
    const featureUsage: Record<string, number> = {};
    const surfaceViews: Record<string, number> = {};
    for (const event of events) {
      if (event.kind === 'FEATURE_USE' && event.featureId) featureUsage[event.featureId] = (featureUsage[event.featureId] ?? 0) + 1;
      if (event.kind === 'VIEW' && event.surfaceId) surfaceViews[event.surfaceId] = (surfaceViews[event.surfaceId] ?? 0) + 1;
    }
    return {
      views: events.filter((event) => event.kind === 'VIEW').length,
      uniqueUsers: users.size,
      sessions: sessions.size,
      featureUsage,
      surfaceViews,
      eventCount: events.length,
      contentLogged: false,
      evidenceHeadHash: events.at(-1)?.hash ?? GENESIS,
    };
  }
}

export class StrategicEvaluationCouncil74 {
  private readonly tasks = new Map<string, StrategicTask74>();
  private readonly meetings: EvaluationMeeting74[] = [];

  assignTask(input: Omit<StrategicTask74, 'taskId' | 'productionAuthority'>): StrategicTask74 {
    assertId(input.tenantId, 'tenant id');
    assertEvidence(input.evidenceRefs, 'strategic task');
    if (!input.title.trim() || !input.ownerRole.trim()) throw new Error('task title and owner role are required');
    const task: StrategicTask74 = { ...input, taskId: randomUUID(), productionAuthority: false };
    this.tasks.set(task.taskId, task);
    return task;
  }

  recordMeeting(input: Omit<EvaluationMeeting74, 'meetingId' | 'decisions' | 'autonomousDeploymentAllowed' | 'consciousnessClaim' | 'freeWillClaim'> & {
    decisions: Array<Omit<MeetingDecision74, 'decisionId' | 'status'>>;
  }): EvaluationMeeting74 {
    assertId(input.tenantId, 'tenant id');
    assertEvidence(input.minutesEvidenceRefs, 'meeting minutes');
    const roles = [...new Set(input.participantRoles.map((role) => role.trim()).filter(Boolean))];
    if (roles.length < 2 || roles.length > 8) throw new Error('evaluation meeting requires 2-8 distinct active roles');
    if (parseTime(input.nextScheduledFor) <= parseTime(input.scheduledFor)) throw new Error('recurring meeting must have a future next occurrence');
    for (const taskId of input.taskIds) if (!this.tasks.has(taskId)) throw new Error('meeting references unknown strategic task');
    for (const dissent of input.dissent) {
      if (!roles.includes(dissent.role)) throw new Error('dissent role must be an active meeting participant');
      if (!dissent.statement.trim()) throw new Error('dissent statement is required');
      assertEvidence(dissent.evidenceRefs, 'meeting dissent');
    }
    const decisions = input.decisions.map((decision): MeetingDecision74 => {
      if (!roles.includes(decision.ownerRole)) throw new Error('decision owner must be an active meeting participant');
      if (!decision.summary.trim()) throw new Error('decision summary is required');
      if (decision.humanApprovalReceiptId) assertEvidence(decision.humanApprovalEvidenceRefs ?? [], 'human approval');
      return {
        ...decision,
        decisionId: randomUUID(),
        status: decision.humanApprovalReceiptId ? 'HUMAN_APPROVED_RECOMMENDATION' : 'RECOMMENDATION_ONLY',
      };
    });
    const meeting: EvaluationMeeting74 = {
      ...input,
      participantRoles: roles,
      meetingId: randomUUID(),
      decisions,
      autonomousDeploymentAllowed: false,
      consciousnessClaim: false,
      freeWillClaim: false,
    };
    this.meetings.push(meeting);
    return meeting;
  }

  listMeetings(): EvaluationMeeting74[] {
    return this.meetings.map((meeting) => ({ ...meeting, participantRoles: [...meeting.participantRoles], taskIds: [...meeting.taskIds] }));
  }
}

export class CpuFirstBrainRetrievalGateway74 {
  private readonly sessions = new Map<string, GovernedApiSession74>();

  constructor(
    private readonly apiStudio: ApiStudioBridge74,
    private readonly retrieval: AuthorizedRetrievalBridge74,
    private readonly executionGate: CpuFirstBrainExecutionGate74,
    private readonly usageLedger: ContentFreeUsageLedger74,
    private readonly credentialBroker?: VaultCredentialBroker74,
  ) {}

  openSession(input: Omit<GovernedApiSession74, 'sessionId' | 'startedAt' | 'expiresAt' | 'status'> & { ttlMs: number; now?: Date }): GovernedApiSession74 {
    assertId(input.tenantId, 'tenant id');
    assertEvidence(input.evidenceRefs, 'API session');
    if (!Number.isFinite(input.ttlMs) || input.ttlMs <= 0) throw new Error('positive API session ttl required');
    if (input.tenantId !== this.usageLedger.tenantId) throw new Error('usage ledger tenant mismatch');
    const definition = this.apiStudio.get(input.tenantId, input.apiId);
    if (!definition || !definition.enabled) throw new Error('API definition missing or disabled');
    if (!scopesCover(input.scopes, definition.requiredScopes)) throw new Error('API session lacks minimum endpoint scopes');
    if (input.credentialRef) {
      if (input.credentialRef.tenantId !== input.tenantId || input.credentialRef.intendedApiId !== input.apiId) throw new Error('credential reference scope mismatch');
      assertEvidence(input.credentialRef.evidenceRefs, 'credential reference');
    }
    const now = input.now ?? new Date();
    const session: GovernedApiSession74 = {
      tenantId: input.tenantId,
      userId: input.userId,
      universeId: input.universeId,
      agentId: input.agentId,
      apiId: input.apiId,
      retrievalSessionId: input.retrievalSessionId,
      memoryNamespace: input.memoryNamespace,
      grantId: input.grantId,
      consentReceiptId: input.consentReceiptId,
      policyReceiptId: input.policyReceiptId,
      scopes: [...new Set(input.scopes)],
      jurisdiction: input.jurisdiction,
      credentialRef: input.credentialRef,
      evidenceRefs: [...input.evidenceRefs],
      sessionId: randomUUID(),
      startedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + input.ttlMs).toISOString(),
      status: 'ACTIVE',
    };
    this.sessions.set(session.sessionId, session);
    return { ...session };
  }

  async recordView(apiSessionId: string, surfaceId: string, evidenceRefs: string[], now = new Date()): Promise<ContentFreeUsageEvent74> {
    const session = this.requireActive(apiSessionId, now);
    assertId(surfaceId, 'surface id');
    assertEvidence(evidenceRefs, 'view');
    return this.usageLedger.record({
      tenantId: session.tenantId,
      pseudonymousSubject: sha256(`${session.tenantId}:${session.userId}`),
      apiSessionId: session.sessionId,
      apiId: session.apiId,
      kind: 'VIEW',
      surfaceId,
      observedAt: now.toISOString(),
      evidenceRefs: [...session.evidenceRefs, ...evidenceRefs],
    });
  }

  async invoke(input: {
    apiSessionId: string;
    classification: DataClassification74;
    dataClass: SensitiveDataClass74;
    query: string;
    retrievalScope: string;
    candidateCount: number;
    hitCount: number;
    requestedBackend?: RuntimeBackend74;
    estimatedMemoryMb: number;
    consentReceipt?: any;
    legalPolicyReceipt?: any;
    evidenceRefs: string[];
    now?: Date;
  }): Promise<GovernedApiInvocationReceipt74> {
    const now = input.now ?? new Date();
    const session = this.requireActive(input.apiSessionId, now);
    assertEvidence(input.evidenceRefs, 'API invocation');
    const definition = this.apiStudio.get(session.tenantId, session.apiId);
    if (!definition || !definition.enabled) return this.deniedReceipt(session, input, 'LOCAL_ONLY', ['API definition missing or disabled.'], now);

    const route: RetrievalRoute74 = input.classification === 'TOP_SECRET'
      ? 'LOCAL_RESTRICTED'
      : definition.exposure === 'HYBRID_OUTBOUND' ? 'HYBRID' : 'LOCAL_ONLY';

    if (input.classification === 'TOP_SECRET' && definition.exposure !== 'LOCAL_LOOPBACK') {
      return this.deniedReceipt(session, input, route, ['TOP_SECRET is local-restricted only and cannot use private-network or hybrid external routing.'], now);
    }

    const decision = this.apiStudio.decide({
      tenantId: session.tenantId,
      apiId: session.apiId,
      subjectId: session.userId,
      scopes: session.scopes,
      jurisdiction: session.jurisdiction,
      classification: input.classification,
      dataClass: input.dataClass,
      consentReceipt: input.consentReceipt,
      legalPolicyReceipt: input.legalPolicyReceipt,
    }, now.getTime());
    if (!decision.allowed) return this.deniedReceipt(session, input, route, decision.reasons, now);
    if (definition.exposure === 'HYBRID_OUTBOUND' && (!decision.externalRoutingAllowed || route !== 'HYBRID')) {
      return this.deniedReceipt(session, input, route, ['Hybrid route lacks explicit governed external-routing authorization.'], now);
    }

    let credentialAttestation: VaultCredentialAttestation74 | undefined;
    const credentialRequired = definition.exposure !== 'LOCAL_LOOPBACK' || Boolean(definition.connectorId);
    if (credentialRequired) {
      if (!session.credentialRef || !this.credentialBroker) return this.deniedReceipt(session, input, route, ['Vault-backed credential attestation is required for private/hybrid connector access.'], now);
      credentialAttestation = await this.credentialBroker.attest(session.credentialRef, now);
      const attestationValid = credentialAttestation.tenantId === session.tenantId
        && credentialAttestation.secretId === session.credentialRef.secretId
        && credentialAttestation.intendedApiId === session.apiId
        && credentialAttestation.current
        && current(credentialAttestation.expiresAt, credentialAttestation.revokedAt, now.getTime())
        && scopesCover(credentialAttestation.scopes, definition.requiredScopes)
        && credentialAttestation.evidenceRefs.length > 0
        && !credentialAttestation.secretValueRendered
        && !credentialAttestation.secretValueLogged
        && !credentialAttestation.ordinaryEmbeddingEligible
        && !credentialAttestation.clientRenderingAllowed;
      if (!attestationValid) return this.deniedReceipt(session, input, route, ['Vault credential attestation is missing, stale, revoked, over-scoped, or unsafe.'], now);
    }

    const execution = this.executionGate.select({
      tenantId: session.tenantId,
      workloadId: `api-${session.apiId}-${session.sessionId}`,
      requestedBackend: input.requestedBackend ?? 'CPU',
      classification: input.classification,
      estimatedMemoryMb: input.estimatedMemoryMb,
      evidenceRefs: [...session.evidenceRefs, ...input.evidenceRefs],
    }, now.getTime());

    let retrievalReceipt: RetrievalAccessReceipt74;
    try {
      retrievalReceipt = await this.retrieval.authorizeRead({
        sessionId: session.retrievalSessionId,
        scope: input.retrievalScope,
        memoryNamespace: session.memoryNamespace,
        classification: input.classification,
        route,
        query: input.query,
        candidateCount: input.candidateCount,
        hitCount: input.hitCount,
        evidenceRefs: [...session.evidenceRefs, ...input.evidenceRefs],
        now,
      });
    } catch (error) {
      session.status = 'REVOKED';
      session.invalidationReason = `retrieval authorization denied: ${(error as Error).message}`;
      return this.deniedReceipt(session, input, route, [session.invalidationReason], now, execution);
    }

    const receipt: GovernedApiInvocationReceipt74 = {
      receiptId: randomUUID(),
      tenantId: session.tenantId,
      apiSessionId: session.sessionId,
      apiId: session.apiId,
      allowed: true,
      reasons: ['API Studio, retrieval authorization, credential handling, classification, and execution gates passed.'],
      classification: input.classification,
      dataClass: input.dataClass,
      route,
      querySha256: sha256(input.query),
      retrievalReceiptId: retrievalReceipt.receiptId,
      credentialAttestationId: credentialAttestation?.attestationId,
      execution,
      evidenceRefs: [...new Set([...session.evidenceRefs, ...input.evidenceRefs, ...retrievalReceipt.evidenceRefs, ...(credentialAttestation?.evidenceRefs ?? [])])],
      observedAt: now.toISOString(),
      handling: { rawQueryLogged: false, rawPayloadLogged: false, ordinaryEmbeddingsExecuted: false, topSecretClientRenderingAllowed: false, credentialRendered: false, credentialLogged: false, credentialEmbeddingAllowed: false, topSecretExternalRoutingAllowed: false },
      authority: { canDeploy: false, canPublish: false, canMoveMoney: false, canOpenAccounts: false, canSignContracts: false, unrestrictedBankAccess: false },
    };

    await this.usageLedger.record({
      tenantId: session.tenantId,
      pseudonymousSubject: sha256(`${session.tenantId}:${session.userId}`),
      apiSessionId: session.sessionId,
      apiId: session.apiId,
      kind: 'FEATURE_USE',
      featureId: `api:${session.apiId}`,
      observedAt: now.toISOString(),
      evidenceRefs: receipt.evidenceRefs,
    });
    return receipt;
  }

  applyRevocation(event: RevocationEvent74): RevocationReceipt74 {
    assertId(event.tenantId, 'tenant id');
    assertEvidence(event.evidenceRefs, 'revocation');
    let retrievalSessionsInvalidated = 0;
    if (event.kind === 'GRANT') retrievalSessionsInvalidated = this.retrieval.invalidateByGrant(event.targetId, event.reason);
    if (event.kind === 'CONSENT') retrievalSessionsInvalidated = this.retrieval.invalidateByConsent(event.targetId, event.reason);
    if (event.kind === 'POLICY') retrievalSessionsInvalidated = this.retrieval.invalidateByPolicy(event.targetId, event.reason);

    const invalidated: string[] = [];
    for (const session of this.sessions.values()) {
      if (session.tenantId !== event.tenantId || session.status !== 'ACTIVE') continue;
      const matches = event.kind === 'GRANT' ? session.grantId === event.targetId
        : event.kind === 'CONSENT' ? session.consentReceiptId === event.targetId
        : session.policyReceiptId === event.targetId;
      if (!matches) continue;
      session.status = 'REVOKED';
      session.invalidationReason = event.reason;
      invalidated.push(session.sessionId);
    }
    return {
      receiptId: randomUUID(),
      tenantId: event.tenantId,
      kind: event.kind,
      targetId: event.targetId,
      apiSessionsInvalidated: invalidated,
      retrievalSessionsInvalidated,
      evidenceRefs: [...event.evidenceRefs],
      observedAt: event.observedAt ?? new Date().toISOString(),
    };
  }

  private requireActive(sessionId: string, now: Date): GovernedApiSession74 {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'ACTIVE') throw new Error('API session inactive');
    if (parseTime(session.expiresAt) <= now.getTime()) {
      session.status = 'EXPIRED';
      session.invalidationReason = 'API session expired';
      throw new Error('API session expired');
    }
    return session;
  }

  private deniedReceipt(
    session: GovernedApiSession74,
    input: { classification: DataClassification74; dataClass: SensitiveDataClass74; query: string; requestedBackend?: RuntimeBackend74; estimatedMemoryMb: number; evidenceRefs: string[] },
    route: RetrievalRoute74,
    reasons: string[],
    now: Date,
    execution?: BrainExecutionPlan74,
  ): GovernedApiInvocationReceipt74 {
    const plan = execution ?? this.executionGate.select({
      tenantId: session.tenantId,
      workloadId: `denied-api-${session.apiId}-${session.sessionId}`,
      requestedBackend: 'CPU',
      classification: input.classification,
      estimatedMemoryMb: input.estimatedMemoryMb,
      evidenceRefs: [...session.evidenceRefs, ...input.evidenceRefs],
    }, now.getTime());
    return {
      receiptId: randomUUID(), tenantId: session.tenantId, apiSessionId: session.sessionId, apiId: session.apiId,
      allowed: false, reasons, classification: input.classification, dataClass: input.dataClass, route,
      querySha256: sha256(input.query), execution: plan, evidenceRefs: [...new Set([...session.evidenceRefs, ...input.evidenceRefs])], observedAt: now.toISOString(),
      handling: { rawQueryLogged: false, rawPayloadLogged: false, ordinaryEmbeddingsExecuted: false, topSecretClientRenderingAllowed: false, credentialRendered: false, credentialLogged: false, credentialEmbeddingAllowed: false, topSecretExternalRoutingAllowed: false },
      authority: { canDeploy: false, canPublish: false, canMoveMoney: false, canOpenAccounts: false, canSignContracts: false, unrestrictedBankAccess: false },
    };
  }
}
