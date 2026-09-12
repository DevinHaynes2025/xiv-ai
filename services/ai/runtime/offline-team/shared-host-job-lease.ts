/**
 * Shared host-level lease contract for mutually exclusive LOCAL_MODEL_INFERENCE work.
 *
 * This is a pure contract: no daemon, filesystem mutation, database mutation, provider call,
 * process kill, or automatic recovery. A presence reference is required but is not verified here;
 * callers must obtain it from an authenticated presence collector such as 12D-95.
 */
export type SharedHostLane = 'HOMEBASE' | 'OFFLINE_SHIFT';
export type SharedHostLeaseState = 'ACTIVE' | 'STOPPED_CONFIRMED' | 'STOPPED_UNCONFIRMED' | 'RELEASED';
export type SharedHostLeaseDecision =
  | 'ALLOW_NO_EXISTING_LEASE'
  | 'ALLOW_RELEASED_LEASE'
  | 'DENY_INVALID_EXISTING_RECORD'
  | 'DENY_HOST_SCOPE_MISMATCH'
  | 'DENY_DUPLICATE_LEASE_ID'
  | 'DENY_ACTIVE_LEASE'
  | 'DENY_EXPIRED_UNSETTLED'
  | 'DENY_OPERATOR_REVIEW_HOLD'
  | 'DENY_RELEASE_REQUIRED';

export const SHARED_HOST_JOB_LEASE_POLICY = Object.freeze({
  schemaVersion: 1 as const,
  resourceClass: 'LOCAL_MODEL_INFERENCE' as const,
  defaultTtlMs: 10_000,
  maxTtlMs: 30_000,
  automaticExpiredActiveRecovery: false,
  automaticUnacknowledgedRelease: false,
  providerProcessTerminationAttested: false,
  presenceReferenceIsExecutionAttestation: false,
});

export interface SharedHostLeaseRecord {
  schemaVersion: 1;
  resourceClass: 'LOCAL_MODEL_INFERENCE';
  hostScopeId: string;
  leaseId: string;
  tenantId: string;
  holderInstanceId: string;
  lane: SharedHostLane;
  workId: string;
  providerId: string;
  modelId: string;
  presenceEvidenceRef: string;
  sourceCommit: string;
  acquiredAtMs: number;
  heartbeatAtMs: number;
  expiresAtMs: number;
  revision: number;
  state: SharedHostLeaseState;
  stopEvidenceRef: string | null;
  releaseEvidenceRef: string | null;
  productionAuthorityGranted: false;
  privateDataAuthorityGranted: false;
  providerProcessTerminationAttested: false;
}

const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:@/-]{0,127}$/.test(v);
const ref = (v: unknown): v is string => typeof v === 'string' && v.trim() === v && v.length > 0 && v.length <= 256;
const hex = (v: unknown, n: number): v is string => typeof v === 'string' && new RegExp(`^[a-f0-9]{${n}}$`).test(v);
const time = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const obj = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const states: readonly SharedHostLeaseState[] = Object.freeze(['ACTIVE', 'STOPPED_CONFIRMED', 'STOPPED_UNCONFIRMED', 'RELEASED']);
const lanes: readonly SharedHostLane[] = Object.freeze(['HOMEBASE', 'OFFLINE_SHIFT']);

function ttlOk(acquiredAtMs: number, heartbeatAtMs: number, expiresAtMs: number): boolean {
  return acquiredAtMs <= heartbeatAtMs && heartbeatAtMs < expiresAtMs
    && expiresAtMs - heartbeatAtMs <= SHARED_HOST_JOB_LEASE_POLICY.maxTtlMs;
}

function validRecord(v: unknown): v is SharedHostLeaseRecord {
  if (!obj(v)) return false;
  const expected = [
    'schemaVersion','resourceClass','hostScopeId','leaseId','tenantId','holderInstanceId','lane','workId','providerId','modelId',
    'presenceEvidenceRef','sourceCommit','acquiredAtMs','heartbeatAtMs','expiresAtMs','revision','state','stopEvidenceRef','releaseEvidenceRef',
    'productionAuthorityGranted','privateDataAuthorityGranted','providerProcessTerminationAttested',
  ] as const;
  if (Object.keys(v).length !== expected.length || !expected.every(k => Object.hasOwn(v, k))) return false;
  if (v.schemaVersion !== 1 || v.resourceClass !== 'LOCAL_MODEL_INFERENCE' || !hex(v.hostScopeId, 32)
    || !id(v.leaseId) || !id(v.tenantId) || !id(v.holderInstanceId) || !lanes.includes(v.lane as SharedHostLane)
    || !id(v.workId) || !id(v.providerId) || !id(v.modelId) || !ref(v.presenceEvidenceRef) || !hex(v.sourceCommit, 40)
    || !time(v.acquiredAtMs) || !time(v.heartbeatAtMs) || !time(v.expiresAtMs) || !ttlOk(v.acquiredAtMs as number, v.heartbeatAtMs as number, v.expiresAtMs as number)
    || !Number.isSafeInteger(v.revision) || (v.revision as number) < 1 || !states.includes(v.state as SharedHostLeaseState)
    || !(v.stopEvidenceRef === null || ref(v.stopEvidenceRef)) || !(v.releaseEvidenceRef === null || ref(v.releaseEvidenceRef))
    || v.productionAuthorityGranted !== false || v.privateDataAuthorityGranted !== false || v.providerProcessTerminationAttested !== false) return false;
  if (v.state === 'ACTIVE' && (v.stopEvidenceRef !== null || v.releaseEvidenceRef !== null)) return false;
  if (v.state === 'STOPPED_CONFIRMED' && v.stopEvidenceRef === null) return false;
  if (v.state === 'STOPPED_UNCONFIRMED' && v.releaseEvidenceRef !== null) return false;
  if (v.state === 'RELEASED' && (v.stopEvidenceRef === null || v.releaseEvidenceRef === null)) return false;
  return true;
}

export function parseSharedHostLeaseRecord(value: unknown): Readonly<SharedHostLeaseRecord> | null {
  if (!validRecord(value)) return null;
  return Object.freeze({ ...value });
}

function checkedTtl(ttlMs: number): number {
  if (!Number.isSafeInteger(ttlMs) || ttlMs < 1 || ttlMs > SHARED_HOST_JOB_LEASE_POLICY.maxTtlMs) throw new Error('invalid shared host lease TTL');
  return ttlMs;
}

export function createSharedHostLease(input: {
  hostScopeId: string;
  leaseId: string;
  tenantId: string;
  holderInstanceId: string;
  lane: SharedHostLane;
  workId: string;
  providerId: string;
  modelId: string;
  presenceEvidenceRef: string;
  sourceCommit: string;
  nowMs: number;
  ttlMs?: number;
}): Readonly<SharedHostLeaseRecord> {
  const ttl = checkedTtl(input.ttlMs ?? SHARED_HOST_JOB_LEASE_POLICY.defaultTtlMs);
  const candidate: SharedHostLeaseRecord = {
    schemaVersion: 1, resourceClass: 'LOCAL_MODEL_INFERENCE', hostScopeId: input.hostScopeId,
    leaseId: input.leaseId, tenantId: input.tenantId, holderInstanceId: input.holderInstanceId,
    lane: input.lane, workId: input.workId, providerId: input.providerId, modelId: input.modelId,
    presenceEvidenceRef: input.presenceEvidenceRef, sourceCommit: input.sourceCommit,
    acquiredAtMs: input.nowMs, heartbeatAtMs: input.nowMs, expiresAtMs: input.nowMs + ttl,
    revision: 1, state: 'ACTIVE', stopEvidenceRef: null, releaseEvidenceRef: null,
    productionAuthorityGranted: false, privateDataAuthorityGranted: false, providerProcessTerminationAttested: false,
  };
  const parsed = parseSharedHostLeaseRecord(candidate);
  if (!parsed) throw new Error('invalid shared host lease claim');
  return parsed;
}

export function renewSharedHostLease(input: {
  lease: SharedHostLeaseRecord;
  holderInstanceId: string;
  nowMs: number;
  ttlMs?: number;
}): Readonly<SharedHostLeaseRecord> {
  const current = parseSharedHostLeaseRecord(input.lease);
  const ttl = checkedTtl(input.ttlMs ?? SHARED_HOST_JOB_LEASE_POLICY.defaultTtlMs);
  if (!current || current.state !== 'ACTIVE' || input.holderInstanceId !== current.holderInstanceId
    || !time(input.nowMs) || input.nowMs < current.heartbeatAtMs || input.nowMs >= current.expiresAtMs) throw new Error('shared host lease cannot be renewed');
  return Object.freeze({ ...current, heartbeatAtMs: input.nowMs, expiresAtMs: input.nowMs + ttl, revision: current.revision + 1 });
}

export function markSharedHostLeaseStopped(input: {
  lease: SharedHostLeaseRecord;
  nowMs: number;
  providerAcknowledged: boolean;
  stopEvidenceRef?: string;
}): Readonly<SharedHostLeaseRecord> {
  const current = parseSharedHostLeaseRecord(input.lease);
  if (!current || current.state !== 'ACTIVE' || !time(input.nowMs) || input.nowMs < current.heartbeatAtMs || input.nowMs >= current.expiresAtMs) {
    throw new Error('shared host lease cannot record stop');
  }
  if (input.providerAcknowledged === true && !ref(input.stopEvidenceRef)) throw new Error('confirmed stop evidence required');
  if (input.providerAcknowledged !== true && input.stopEvidenceRef !== undefined && !ref(input.stopEvidenceRef)) throw new Error('invalid stop evidence');
  return Object.freeze({ ...current, heartbeatAtMs: input.nowMs, revision: current.revision + 1,
    state: input.providerAcknowledged ? 'STOPPED_CONFIRMED' : 'STOPPED_UNCONFIRMED',
    stopEvidenceRef: input.stopEvidenceRef ?? null });
}

export function releaseSharedHostLease(input: {
  lease: SharedHostLeaseRecord;
  nowMs: number;
  releaseEvidenceRef: string;
}): Readonly<SharedHostLeaseRecord> {
  const current = parseSharedHostLeaseRecord(input.lease);
  if (!current || current.state !== 'STOPPED_CONFIRMED' || !time(input.nowMs) || input.nowMs < current.heartbeatAtMs
    || !ref(input.releaseEvidenceRef)) throw new Error('confirmed stopped lease and release evidence required');
  return Object.freeze({ ...current, heartbeatAtMs: input.nowMs,
    expiresAtMs: Math.max(input.nowMs + 1, current.expiresAtMs), revision: current.revision + 1,
    state: 'RELEASED', releaseEvidenceRef: input.releaseEvidenceRef });
}

export function assessSharedHostLeaseAcquisition(input: {
  existing: unknown | null;
  candidate: SharedHostLeaseRecord;
  nowMs: number;
}): Readonly<{ allowed: boolean; decision: SharedHostLeaseDecision; operatorReviewRequired: boolean }> {
  const candidate = parseSharedHostLeaseRecord(input.candidate);
  if (!candidate || candidate.state !== 'ACTIVE' || !time(input.nowMs)) throw new Error('valid active candidate and clock required');
  if (input.existing === null) return Object.freeze({ allowed: true, decision: 'ALLOW_NO_EXISTING_LEASE', operatorReviewRequired: false });
  const existing = parseSharedHostLeaseRecord(input.existing);
  if (!existing) return Object.freeze({ allowed: false, decision: 'DENY_INVALID_EXISTING_RECORD', operatorReviewRequired: true });
  if (existing.hostScopeId !== candidate.hostScopeId) return Object.freeze({ allowed: false, decision: 'DENY_HOST_SCOPE_MISMATCH', operatorReviewRequired: true });
  if (existing.leaseId === candidate.leaseId) return Object.freeze({ allowed: false, decision: 'DENY_DUPLICATE_LEASE_ID', operatorReviewRequired: true });
  if (existing.state === 'RELEASED') return Object.freeze({ allowed: true, decision: 'ALLOW_RELEASED_LEASE', operatorReviewRequired: false });
  if (existing.state === 'STOPPED_UNCONFIRMED') return Object.freeze({ allowed: false, decision: 'DENY_OPERATOR_REVIEW_HOLD', operatorReviewRequired: true });
  if (existing.state === 'STOPPED_CONFIRMED') return Object.freeze({ allowed: false, decision: 'DENY_RELEASE_REQUIRED', operatorReviewRequired: true });
  if (input.nowMs < existing.expiresAtMs) return Object.freeze({ allowed: false, decision: 'DENY_ACTIVE_LEASE', operatorReviewRequired: false });
  return Object.freeze({ allowed: false, decision: 'DENY_EXPIRED_UNSETTLED', operatorReviewRequired: true });
}
