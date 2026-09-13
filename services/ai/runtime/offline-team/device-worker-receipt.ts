import type { DeviceEnrollmentRecord, DeviceEnrollmentState } from './device-fleet-enrollment';

export type DeviceCapabilityLevel = 'TARGETED' | 'ENROLLED' | 'VERIFIED' | 'OBSERVED_LOCAL_WORKER';

export const DEVICE_RECEIPT_POLICY = Object.freeze({
  maxObservedReceiptAgeMs: 24 * 60 * 60 * 1000,
  maxOutputHashes: 8,
  maxAttestationRefs: 8,
  allowedSecurityClass: 'ORDINARY' as const,
});

export const DEVICE_RECEIPT_GUARDRAILS = Object.freeze({
  observationOnly: true,
  startsNoWorker: true,
  issuesCapabilityWithoutEvidence: false,
  conflatesTargetedWithObserved: false,
  remoteCallsAllowed: false,
  automaticRecovery: false,
  humanDecision: 'REQUIRED' as const,
});

export interface DeviceWorkerObservationRequest {
  tenantId: string;
  userId: string;
  deviceId: string;
  observedAtMs: number;
  /** Evidence that a supervised worker actually ran on this device (e.g. a queue or shift run ref). */
  workerRunRef: string;
  /** SHA-256 hashes of outputs the device's worker settled during the observed run. */
  outputHashes: readonly string[];
  health: Readonly<{ batteryPercent: number; thermalState: 'NOMINAL' | 'WARM' | 'HOT' | 'CRITICAL'; networkAvailable: boolean; localModelAvailable: boolean }>;
  /** Distinct operator/telemetry attestations backing this observation. */
  attestationRefs: readonly string[];
}

export interface DeviceWorkerReceipt {
  kind: 'DEVICE_WORKER_OBSERVATION_RECEIPT';
  tenantId: string;
  userId: string;
  deviceId: string;
  observedAtMs: number;
  expiresAtMs: number;
  workerRunRef: string;
  outputHashes: readonly string[];
  health: DeviceWorkerObservationRequest['health'];
  attestationRefs: readonly string[];
  capabilityAtObservation: 'OBSERVED_LOCAL_WORKER';
  humanDecision: 'REQUIRED';
  learningPromoted: false;
}

const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(v);
const sha256 = (v: unknown): v is string => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const ref = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 256;
const distinct = (v: readonly string[]) => new Set(v.map(s => s.trim())).size === v.length;

/**
 * Records a runtime observation that a supervised local worker ACTUALLY ran on a device, backed
 * by run evidence, settled output hashes, and operator attestations. This receipt is the only
 * object in the ladder that may carry the OBSERVED_LOCAL_WORKER level, and it expires: an
 * observation older than the policy age degrades back to whatever compatibility evidence alone
 * supports. Issuing a receipt starts no worker and grants no production authority.
 */
export function issueWorkerObservationReceipt(req: DeviceWorkerObservationRequest): DeviceWorkerReceipt {
  if (!req || ![req.tenantId, req.userId, req.deviceId].every(id)) throw new Error('scoped device identity required');
  if (!Number.isSafeInteger(req.observedAtMs) || req.observedAtMs < 0) throw new Error('observation time required');
  if (!ref(req.workerRunRef)) throw new Error('worker run evidence required');
  if (!Array.isArray(req.outputHashes) || req.outputHashes.length < 1 || req.outputHashes.length > DEVICE_RECEIPT_POLICY.maxOutputHashes
    || !req.outputHashes.every(sha256)) throw new Error('settled output hashes required');
  if (!Array.isArray(req.attestationRefs) || req.attestationRefs.length < 1
    || req.attestationRefs.length > DEVICE_RECEIPT_POLICY.maxAttestationRefs
    || !req.attestationRefs.every(ref) || !distinct(req.attestationRefs)) throw new Error('distinct attestation refs required');
  const h = req.health;
  if (!h || !Number.isFinite(h.batteryPercent) || h.batteryPercent < 0 || h.batteryPercent > 100
    || !['NOMINAL', 'WARM', 'HOT', 'CRITICAL'].includes(h.thermalState)
    || typeof h.networkAvailable !== 'boolean' || typeof h.localModelAvailable !== 'boolean') {
    throw new Error('bounded device health context required');
  }
  return Object.freeze({
    kind: 'DEVICE_WORKER_OBSERVATION_RECEIPT' as const,
    tenantId: req.tenantId,
    userId: req.userId,
    deviceId: req.deviceId,
    observedAtMs: req.observedAtMs,
    expiresAtMs: req.observedAtMs + DEVICE_RECEIPT_POLICY.maxObservedReceiptAgeMs,
    workerRunRef: req.workerRunRef.trim(),
    outputHashes: Object.freeze([...req.outputHashes]),
    health: Object.freeze({ ...h }),
    attestationRefs: Object.freeze([...req.attestationRefs.map(r => r.trim())]),
    capabilityAtObservation: 'OBSERVED_LOCAL_WORKER' as const,
    humanDecision: 'REQUIRED' as const,
    learningPromoted: false as const,
  });
}

/**
 * The only sanctioned way to move an enrollment to verified compatibility: the replacement
 * profile must actually be VERIFIED, and the enrollment state is re-derived from matrix truth
 * instead of being hand-assigned by callers.
 */
export function withVerifiedCompatibility(
  record: DeviceEnrollmentRecord,
  verified: DeviceEnrollmentRecord['compatibility'],
): DeviceEnrollmentRecord {
  if (!record || verified?.state !== 'VERIFIED') throw new Error('verified compatibility evidence required');
  return Object.freeze({ ...record, compatibility: verified, state: 'ENROLLED_NOT_ACTIVE' as const });
}

/**
 * The capability ladder. The four levels are strictly distinct and never summed into one
 * "device count": TARGETED (matrix row only) → ENROLLED (consent record) → VERIFIED
 * (compatibility evidence) → OBSERVED_LOCAL_WORKER (unexpired run receipt). An expired
 * observation degrades honestly to the compatibility-supported level.
 */
export function effectiveCapability(input: {
  record: DeviceEnrollmentRecord;
  observation?: DeviceWorkerReceipt;
  nowMs: number;
}): { level: DeviceCapabilityLevel; reason: string } {
  if (!input || !Number.isSafeInteger(input.nowMs) || input.nowMs < 0) throw new Error('evaluation time required');
  const rec = input.record;
  if (!rec) throw new Error('enrollment record required');
  if (rec.state === 'UNVERIFIED_COMPATIBILITY') return { level: 'TARGETED', reason: 'compatibility targeted but not verified' };
  if (rec.state === 'REVOKED') return { level: 'TARGETED', reason: 'consent revoked; only the matrix target remains' };
  if (rec.state === 'EXPIRED') return { level: 'TARGETED', reason: 'enrollment expired; only the matrix target remains' };
  if (rec.compatibility.state !== 'VERIFIED') return { level: 'ENROLLED', reason: 'consent held but compatibility is not verified' };
  const obs = input.observation;
  if (!obs) return { level: 'VERIFIED', reason: 'verified compatibility; no worker run observed' };
  if (obs.kind !== 'DEVICE_WORKER_OBSERVATION_RECEIPT') throw new Error('unexpected receipt kind');
  if (obs.tenantId !== rec.tenantId || obs.userId !== rec.userId || obs.deviceId !== rec.deviceId) {
    throw new Error('receipt identity does not match the enrolled record');
  }
  if (input.nowMs >= obs.expiresAtMs) {
    return { level: 'VERIFIED', reason: 'worker-run observation expired; receipt age exceeded policy' };
  }
  return { level: 'OBSERVED_LOCAL_WORKER', reason: `recent supervised worker run evidenced by ${obs.workerRunRef}` };
}