/**
 * 62L-EX6 — Physical QPU execution receipt creation + integrity.
 * No credentials in receipts. Never fabricate physical QPU from simulator/mock.
 */

import { createHash } from 'node:crypto';

import {
  RECEIPT_VERSION,
  type BackendClassification,
  type EvidenceEnvironment,
  type ExecutionClass,
  type Ex6MeshRole,
  type MeasurementSummary,
  type PhysicalEvidenceChecklist,
  type PhysicalQpuExecutionReceipt,
  type PhysicalQpuState,
  type ProviderMetadataSafe,
  type QualityMetrics,
  type ReceiptKind,
  type VerificationState,
} from './types.ts';

/** Forbidden raw-secret key names (exact-ish). credentialRefId is allowed. */
const SECRET_KEY_RE =
  /^(password|secret|token|api[_-]?key|credentials?|private[_-]?key|auth[_-]?header|bearer|rawCredentials)$/i;

const SAFE_KEY_ALLOWLIST = new Set([
  'credentialrefid',
  'credential_ref_id',
  'credentialreference',
]);

export type ReceiptCreateInput = {
  receiptId: string;
  receiptKind?: ReceiptKind;
  missionId: string;
  taskId: string;
  parentTaskId?: string | null;
  tenantId: string;
  universeId: string;
  agentId: string;
  agentRole?: Ex6MeshRole;
  providerId: string;
  backendId: string;
  providerJobId?: string | null;
  requestedExecutionClass: ExecutionClass;
  /** If omitted, derived from backendClassification + mock + environment. */
  actualExecutionClass?: ExecutionClass;
  backendClassification: BackendClassification;
  evidenceEnvironment: EvidenceEnvironment;
  physicalQpuState?: PhysicalQpuState;
  algorithmHash?: string | null;
  circuitHash?: string | null;
  problemHash?: string | null;
  shots?: number | null;
  seed?: string | number | null;
  precision?: string | null;
  submittedAt?: string | null;
  acceptedAt?: string | null;
  queuedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  durationMs?: number | null;
  providerMetadata?: Partial<ProviderMetadataSafe> & {
    /** Forbidden — will cause DENIED if present. */
    rawCredentials?: unknown;
    apiKey?: unknown;
    token?: unknown;
    password?: unknown;
    secret?: unknown;
  };
  resultHash?: string | null;
  measurements?: MeasurementSummary | null;
  quality?: QualityMetrics | null;
  baselineReceiptId?: string | null;
  comparisonReceiptId?: string | null;
  costState?: PhysicalQpuExecutionReceipt['cost']['costState'];
  costAmount?: number | null;
  costCurrency?: string | null;
  costEvidenceRef?: string | null;
  evidenceRefs?: readonly string[];
  auditEvidenceRef?: string | null;
  verificationState?: VerificationState;
  limitations?: readonly string[];
  returnPath?: string;
  neuralPathwayId?: string | null;
  reputationDelta?: number;
  mockProvider?: boolean;
  /** Provider authorized for this tenant/universe. */
  providerAuthorized?: boolean;
  jobAccepted?: boolean;
  jobCompleted?: boolean;
  providerResultReturned?: boolean;
  backendIdentityConfirmed?: boolean;
  createdAt?: string;
  /** Offline / no physical path — forces WAITING_PROVIDER for new physical requests. */
  offlineDisconnected?: boolean;
  physicalProviderAvailable?: boolean;
};

export type ReceiptCreateResult =
  | { ok: true; receipt: PhysicalQpuExecutionReceipt }
  | { ok: false; reason: string; verificationState: VerificationState };

function nowIso(): string {
  return new Date().toISOString();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/** Hash body excluding receiptHash itself. */
export function computeReceiptHash(
  body: Omit<PhysicalQpuExecutionReceipt, 'receiptHash'>,
): string {
  return createHash('sha256').update(stableStringify(body)).digest('hex');
}

export function verifyReceiptHash(receipt: PhysicalQpuExecutionReceipt): boolean {
  const { receiptHash, ...rest } = receipt;
  return computeReceiptHash(rest) === receiptHash;
}

function containsSecretMaterial(value: unknown, depth = 0): boolean {
  if (depth > 6 || value == null) return false;
  if (typeof value === 'string') {
    // Do not flag vault refs / hashes by substring; only structured keys matter.
    return false;
  }
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) {
    return value.some((v) => containsSecretMaterial(v, depth + 1));
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SAFE_KEY_ALLOWLIST.has(k.toLowerCase())) continue;
    if (SECRET_KEY_RE.test(k)) return true;
    if (containsSecretMaterial(v, depth + 1)) return true;
  }
  return false;
}

/**
 * Derive actualExecutionClass from reality — never upgrade simulator/mock to PHYSICAL_QPU.
 */
export function deriveActualExecutionClass(input: {
  requestedExecutionClass: ExecutionClass;
  backendClassification: BackendClassification;
  evidenceEnvironment: EvidenceEnvironment;
  mockProvider: boolean;
}): ExecutionClass {
  if (input.mockProvider) {
    // Mocks never prove physical; classify as simulated/classical honesty.
    if (input.backendClassification === 'SIMULATOR') return 'SIMULATED_QUANTUM';
    return 'SIMULATED_QUANTUM';
  }
  if (input.backendClassification === 'SIMULATOR') {
    return 'SIMULATED_QUANTUM';
  }
  if (
    input.evidenceEnvironment === 'UNIT_TEST' ||
    input.evidenceEnvironment === 'LOCAL_SIMULATION'
  ) {
    if (input.requestedExecutionClass === 'PHYSICAL_QPU') {
      // Requested physical but environment is sim/test → actual is simulated.
      return 'SIMULATED_QUANTUM';
    }
    return input.requestedExecutionClass === 'CLASSICAL'
      ? 'CLASSICAL'
      : input.requestedExecutionClass === 'QUANTUM_INSPIRED'
        ? 'QUANTUM_INSPIRED'
        : 'SIMULATED_QUANTUM';
  }
  if (input.backendClassification === 'PHYSICAL_QPU') {
    // Staging still not physical proof class for verification, but actual class
    // can be PHYSICAL_QPU only when backend is PHYSICAL_QPU and env is PHYSICAL_PROVIDER.
    if (input.evidenceEnvironment === 'PHYSICAL_PROVIDER') {
      return 'PHYSICAL_QPU';
    }
    // STAGING_PROVIDER with physical-labeled backend remains non-verified physical attempt
    // recorded as PHYSICAL_QPU actual only if staging claims physical backend — still
    // cannot reach PHYSICAL_QPU_VERIFIED (gated by evidenceEnvironment).
    if (input.evidenceEnvironment === 'STAGING_PROVIDER') {
      return 'PHYSICAL_QPU';
    }
  }
  if (input.requestedExecutionClass === 'CLASSICAL') return 'CLASSICAL';
  if (input.requestedExecutionClass === 'QUANTUM_INSPIRED') return 'QUANTUM_INSPIRED';
  return 'SIMULATED_QUANTUM';
}

function emptyChecklist(): PhysicalEvidenceChecklist {
  return {
    providerAuthorized: false,
    backendClassificationPhysical: false,
    providerJobIdPresent: false,
    jobAccepted: false,
    jobCompleted: false,
    providerResultReturned: false,
    backendIdentityConfirmed: false,
    timestampsPresent: false,
    resultHashPresent: false,
    auditEvidencePresent: false,
    receiptHashValid: false,
  };
}

export function buildEvidenceChecklist(args: {
  providerAuthorized: boolean;
  backendClassification: BackendClassification;
  providerJobId: string | null;
  jobAccepted: boolean;
  jobCompleted: boolean;
  providerResultReturned: boolean;
  backendIdentityConfirmed: boolean;
  submittedAt: string | null;
  completedAt: string | null;
  resultHash: string | null;
  auditEvidenceRef: string | null;
  receiptHashValid: boolean;
}): PhysicalEvidenceChecklist {
  return {
    providerAuthorized: args.providerAuthorized === true,
    backendClassificationPhysical: args.backendClassification === 'PHYSICAL_QPU',
    providerJobIdPresent: typeof args.providerJobId === 'string' && args.providerJobId.length > 0,
    jobAccepted: args.jobAccepted === true,
    jobCompleted: args.jobCompleted === true,
    providerResultReturned: args.providerResultReturned === true,
    backendIdentityConfirmed: args.backendIdentityConfirmed === true,
    timestampsPresent: Boolean(args.submittedAt) && Boolean(args.completedAt),
    resultHashPresent: typeof args.resultHash === 'string' && args.resultHash.length > 0,
    auditEvidencePresent:
      typeof args.auditEvidenceRef === 'string' && args.auditEvidenceRef.length > 0,
    receiptHashValid: args.receiptHashValid === true,
  };
}

export function allPhysicalEvidencePass(checklist: PhysicalEvidenceChecklist): boolean {
  return (
    checklist.providerAuthorized &&
    checklist.backendClassificationPhysical &&
    checklist.providerJobIdPresent &&
    checklist.jobAccepted &&
    checklist.jobCompleted &&
    checklist.providerResultReturned &&
    checklist.backendIdentityConfirmed &&
    checklist.timestampsPresent &&
    checklist.resultHashPresent &&
    checklist.auditEvidencePresent &&
    checklist.receiptHashValid
  );
}

function scrubProviderMetadata(
  input: ReceiptCreateInput,
): { ok: true; meta: ProviderMetadataSafe } | { ok: false; reason: string } {
  const raw = input.providerMetadata ?? {};
  if (
    raw.rawCredentials != null ||
    raw.apiKey != null ||
    raw.token != null ||
    raw.password != null ||
    raw.secret != null
  ) {
    return { ok: false, reason: 'RAW_CREDENTIALS_FORBIDDEN_IN_RECEIPT' };
  }
  if (containsSecretMaterial(raw)) {
    return { ok: false, reason: 'SECRET_MATERIAL_DETECTED_IN_PROVIDER_METADATA' };
  }
  const extra = { ...(raw.extraSafeFields ?? {}) };
  if (containsSecretMaterial(extra)) {
    return { ok: false, reason: 'SECRET_MATERIAL_DETECTED_IN_EXTRA_FIELDS' };
  }
  return {
    ok: true,
    meta: {
      providerId: raw.providerId ?? input.providerId,
      backendId: raw.backendId ?? input.backendId,
      backendDisplayName: raw.backendDisplayName ?? null,
      region: raw.region ?? null,
      queuePosition: raw.queuePosition ?? null,
      credentialRefId: raw.credentialRefId ?? null,
      rawCredentialsPresent: false,
      extraSafeFields: extra,
    },
  };
}

/**
 * Create a physical/sim/mock QPU execution receipt.
 * Offline new PHYSICAL_QPU requests → WAITING_PROVIDER (no fabrication).
 */
export function createPhysicalQpuReceipt(input: ReceiptCreateInput): ReceiptCreateResult {
  if (!input.tenantId || !input.universeId) {
    return { ok: false, reason: 'TENANT_AND_UNIVERSE_REQUIRED', verificationState: 'DENIED' };
  }
  if (!input.receiptId || !input.missionId || !input.taskId || !input.agentId) {
    return { ok: false, reason: 'RECEIPT_IDENTITY_REQUIRED', verificationState: 'DENIED' };
  }

  const mockProvider = input.mockProvider === true;
  const scrub = scrubProviderMetadata(input);
  if (!scrub.ok) {
    return { ok: false, reason: scrub.reason, verificationState: 'DENIED' };
  }

  const actualExecutionClass =
    input.actualExecutionClass ??
    deriveActualExecutionClass({
      requestedExecutionClass: input.requestedExecutionClass,
      backendClassification: input.backendClassification,
      evidenceEnvironment: input.evidenceEnvironment,
      mockProvider,
    });

  // Hard gate: SIMULATOR backend → always SIMULATED_QUANTUM actual.
  if (
    input.backendClassification === 'SIMULATOR' &&
    actualExecutionClass === 'PHYSICAL_QPU'
  ) {
    return {
      ok: false,
      reason: 'SIMULATOR_CANNOT_CLAIM_PHYSICAL_QPU_ACTUAL',
      verificationState: 'DENIED',
    };
  }

  const offlinePhysicalRequest =
    input.requestedExecutionClass === 'PHYSICAL_QPU' &&
    (input.offlineDisconnected === true || input.physicalProviderAvailable === false);

  if (offlinePhysicalRequest && !mockProvider && input.backendClassification !== 'SIMULATOR') {
    const createdAt = input.createdAt ?? nowIso();
    const checklist = emptyChecklist();
    const body: Omit<PhysicalQpuExecutionReceipt, 'receiptHash'> = {
      receiptId: input.receiptId,
      receiptKind: 'PHYSICAL_ATTEMPT',
      receiptVersion: RECEIPT_VERSION,
      missionId: input.missionId,
      taskId: input.taskId,
      parentTaskId: input.parentTaskId ?? null,
      tenantId: input.tenantId,
      universeId: input.universeId,
      agentId: input.agentId,
      agentRole: input.agentRole ?? 'HardwareEvidenceAgent',
      providerId: input.providerId,
      backendId: input.backendId,
      providerJobId: null,
      requestedExecutionClass: input.requestedExecutionClass,
      actualExecutionClass: 'PHYSICAL_QPU',
      backendClassification: input.backendClassification,
      evidenceEnvironment: input.evidenceEnvironment,
      physicalQpuState: 'NOT_TESTED',
      algorithmHash: input.algorithmHash ?? null,
      circuitHash: input.circuitHash ?? null,
      problemHash: input.problemHash ?? null,
      shots: input.shots ?? null,
      seed: input.seed ?? null,
      precision: input.precision ?? null,
      submittedAt: null,
      acceptedAt: null,
      queuedAt: null,
      startedAt: null,
      completedAt: null,
      durationMs: null,
      providerMetadata: scrub.meta,
      resultHash: null,
      measurements: null,
      quality: null,
      baselineReceiptId: input.baselineReceiptId ?? null,
      comparisonReceiptId: null,
      cost: {
        costState: 'NOT_APPLICABLE',
        amount: null,
        currency: null,
        costEvidenceRef: null,
      },
      evidenceRefs: [...(input.evidenceRefs ?? [])],
      auditEvidenceRef: input.auditEvidenceRef ?? null,
      verificationState: 'WAITING_PROVIDER',
      physicalQpuVerified: false,
      quantumAdvantageVerified: false,
      evidenceChecklist: checklist,
      limitations: [
        'PHYSICAL_QPU_UNAVAILABLE_OR_OFFLINE',
        'NO_FABRICATED_RECEIPT',
        ...(input.limitations ?? []),
      ],
      returnPath: input.returnPath ?? 'xiv://home-base/quantum/receipts',
      neuralPathwayId: null,
      reputationDelta: 0,
      reputationLiftsPermissions: false,
      createdAt,
      fabricated: false,
      l4Enabled: false,
      guardianRlsUnchanged: true,
      mockProvider: false,
    };
    const receiptHash = computeReceiptHash(body);
    return { ok: true, receipt: { ...body, receiptHash } };
  }

  let receiptKind: ReceiptKind =
    input.receiptKind ??
    (mockProvider
      ? 'MOCK'
      : input.backendClassification === 'SIMULATOR'
        ? 'SIMULATED'
        : 'PHYSICAL_ATTEMPT');

  if (mockProvider) receiptKind = input.receiptKind === 'TEST_RECEIPT' ? 'TEST_RECEIPT' : 'MOCK';

  const providerJobId = input.providerJobId ?? null;
  const submittedAt = input.submittedAt ?? null;
  const completedAt = input.completedAt ?? null;
  const resultHash = input.resultHash ?? null;
  const auditEvidenceRef = input.auditEvidenceRef ?? null;

  let verificationState: VerificationState =
    input.verificationState ??
    (mockProvider
      ? 'TEST_RECEIPT'
      : completedAt
        ? 'COMPLETED_UNVERIFIED'
        : 'NOT_STARTED');

  // Mocks never PHYSICAL_QPU_VERIFIED.
  if (mockProvider && verificationState === 'PHYSICAL_QPU_VERIFIED') {
    verificationState = 'COMPLETED_UNVERIFIED';
  }
  if (
    input.backendClassification === 'SIMULATOR' &&
    verificationState === 'PHYSICAL_QPU_VERIFIED'
  ) {
    verificationState = 'COMPLETED_UNVERIFIED';
  }

  const physicalQpuState: PhysicalQpuState =
    input.physicalQpuState ??
    (input.backendClassification === 'PHYSICAL_QPU' &&
    input.evidenceEnvironment === 'PHYSICAL_PROVIDER'
      ? 'CONNECTED_UNVERIFIED'
      : 'NOT_TESTED');

  const createdAt = input.createdAt ?? nowIso();

  const bodyWithoutHash: Omit<PhysicalQpuExecutionReceipt, 'receiptHash' | 'evidenceChecklist'> & {
    evidenceChecklist: PhysicalEvidenceChecklist;
  } = {
    receiptId: input.receiptId,
    receiptKind,
    receiptVersion: RECEIPT_VERSION,
    missionId: input.missionId,
    taskId: input.taskId,
    parentTaskId: input.parentTaskId ?? null,
    tenantId: input.tenantId,
    universeId: input.universeId,
    agentId: input.agentId,
    agentRole: input.agentRole ?? 'HardwareEvidenceAgent',
    providerId: input.providerId,
    backendId: input.backendId,
    providerJobId,
    requestedExecutionClass: input.requestedExecutionClass,
    actualExecutionClass,
    backendClassification: input.backendClassification,
    evidenceEnvironment: input.evidenceEnvironment,
    physicalQpuState,
    algorithmHash: input.algorithmHash ?? null,
    circuitHash: input.circuitHash ?? null,
    problemHash: input.problemHash ?? null,
    shots: input.shots ?? null,
    seed: input.seed ?? null,
    precision: input.precision ?? null,
    submittedAt,
    acceptedAt: input.acceptedAt ?? null,
    queuedAt: input.queuedAt ?? null,
    startedAt: input.startedAt ?? null,
    completedAt,
    durationMs: input.durationMs ?? null,
    providerMetadata: scrub.meta,
    resultHash,
    measurements: input.measurements ?? null,
    quality: input.quality ?? null,
    baselineReceiptId: input.baselineReceiptId ?? null,
    comparisonReceiptId: input.comparisonReceiptId ?? null,
    cost: {
      costState: input.costState ?? 'UNKNOWN',
      amount: input.costAmount ?? null,
      currency: input.costCurrency ?? null,
      costEvidenceRef: input.costEvidenceRef ?? null,
    },
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    auditEvidenceRef,
    verificationState,
    physicalQpuVerified: false,
    quantumAdvantageVerified: false,
    evidenceChecklist: emptyChecklist(),
    limitations: [...(input.limitations ?? [])],
    returnPath: input.returnPath ?? 'xiv://home-base/quantum/receipts',
    neuralPathwayId: input.neuralPathwayId ?? null,
    reputationDelta: input.reputationDelta ?? 0,
    reputationLiftsPermissions: false,
    createdAt,
    fabricated: false,
    l4Enabled: false,
    guardianRlsUnchanged: true,
    mockProvider,
  };

  const receiptHash = computeReceiptHash(bodyWithoutHash);
  const evidenceChecklist = buildEvidenceChecklist({
    providerAuthorized: input.providerAuthorized === true,
    backendClassification: input.backendClassification,
    providerJobId,
    jobAccepted: input.jobAccepted === true,
    jobCompleted: input.jobCompleted === true,
    providerResultReturned: input.providerResultReturned === true,
    backendIdentityConfirmed: input.backendIdentityConfirmed === true,
    submittedAt,
    completedAt,
    resultHash,
    auditEvidenceRef,
    receiptHashValid: true,
  });

  // Recompute hash with final checklist.
  const finalBody: Omit<PhysicalQpuExecutionReceipt, 'receiptHash'> = {
    ...bodyWithoutHash,
    evidenceChecklist,
    physicalQpuVerified: false,
  };
  const finalHash = computeReceiptHash(finalBody);

  return {
    ok: true,
    receipt: {
      ...finalBody,
      receiptHash: finalHash,
    },
  };
}

/** Assert receipt JSON / object never carries raw credential fields. */
export function receiptContainsRawCredentials(receipt: PhysicalQpuExecutionReceipt): boolean {
  if (receipt.providerMetadata.rawCredentialsPresent !== false) return true;
  return containsSecretMaterial(receipt);
}
