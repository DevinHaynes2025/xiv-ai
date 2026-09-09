/**
 * 62L-EX11 — Deterministic evidence integrity hashing.
 * No secrets in the hash payload. Invalid hash → REJECTED / UNVERIFIED.
 */

import { createHash } from 'node:crypto';

import type {
  EvidenceClassification,
  EvidenceType,
  QuantumEvidenceItem,
  SourceType,
} from './evidence-types.ts';

const SECRET_KEY_PATTERN =
  /(password|secret|token|api[_-]?key|credential|private[_-]?key|authorization)/i;

export type IntegrityPayload = {
  evidenceId: string;
  version: number;
  missionId: string;
  taskId: string;
  parentEvidenceId: string | null;
  agentId: string;
  tenantId: string;
  universeId: string;
  evidenceType: EvidenceType;
  classification: EvidenceClassification;
  sourceType: SourceType;
  sourceRef: string;
  experimentId: string | null;
  receiptId: string | null;
  benchmarkId: string | null;
  comparisonId: string | null;
  algorithmVersion: string | null;
  runtimeVersion: string | null;
  requestedDevice: string | null;
  actualDevice: string | null;
  provider: string | null;
  backend: string | null;
  inputHash: string;
  outputHash: string;
  createdAt: string;
  measuredAt: string | null;
  confidence: number;
  rightsClass: string;
  dataClass: string;
  replicationPolicy: string;
  limitations: readonly string[];
  supersedesEvidenceId: string | null;
  historicalOnly: boolean;
};

/** Strip any accidental secret-like fields before hashing. */
export function sanitizeForIntegrity(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (SECRET_KEY_PATTERN.test(value) && value.length > 32) {
      return '[REDACTED_SECRET_LIKE]';
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitizeForIntegrity);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY_PATTERN.test(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = sanitizeForIntegrity(v);
      }
    }
    return out;
  }
  return value;
}

export function buildIntegrityPayload(
  item: Omit<QuantumEvidenceItem, 'integrityHash' | 'contradictions' | 'freshnessState' | 'reviewState' | 'evidenceState' | 'syncDisposition' | 'hiddenCot' | 'reproducibility'> & {
    reproducibility?: QuantumEvidenceItem['reproducibility'];
  },
): IntegrityPayload {
  return {
    evidenceId: item.evidenceId,
    version: item.version,
    missionId: item.missionId,
    taskId: item.taskId,
    parentEvidenceId: item.parentEvidenceId,
    agentId: item.agentId,
    tenantId: item.tenantId,
    universeId: item.universeId,
    evidenceType: item.evidenceType,
    classification: item.classification,
    sourceType: item.sourceType,
    sourceRef: item.sourceRef,
    experimentId: item.experimentId,
    receiptId: item.receiptId,
    benchmarkId: item.benchmarkId,
    comparisonId: item.comparisonId,
    algorithmVersion: item.algorithmVersion,
    runtimeVersion: item.runtimeVersion,
    requestedDevice: item.requestedDevice,
    actualDevice: item.actualDevice,
    provider: item.provider,
    backend: item.backend,
    inputHash: item.inputHash,
    outputHash: item.outputHash,
    createdAt: item.createdAt,
    measuredAt: item.measuredAt,
    confidence: item.confidence,
    rightsClass: item.rightsClass,
    dataClass: item.dataClass,
    replicationPolicy: item.replicationPolicy,
    limitations: item.limitations,
    supersedesEvidenceId: item.supersedesEvidenceId,
    historicalOnly: item.historicalOnly,
  };
}

/** Canonical JSON with sorted keys for determinism. */
export function canonicalJson(value: unknown): string {
  const walk = (v: unknown): unknown => {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(walk);
    const obj = v as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = walk(obj[key]);
    }
    return sorted;
  };
  return JSON.stringify(walk(sanitizeForIntegrity(value)));
}

export function computeIntegrityHash(payload: IntegrityPayload): string {
  return createHash('sha256').update(canonicalJson(payload)).digest('hex');
}

export function computeIntegrityHashForItem(
  item: Parameters<typeof buildIntegrityPayload>[0],
): string {
  return computeIntegrityHash(buildIntegrityPayload(item));
}

export function verifyIntegrityHash(
  item: QuantumEvidenceItem,
): { valid: true } | { valid: false; expected: string; actual: string } {
  const expected = computeIntegrityHashForItem(item);
  if (expected === item.integrityHash) return { valid: true };
  return { valid: false, expected, actual: item.integrityHash };
}

export function hashContradiction(parts: {
  tenantId: string;
  universeId: string;
  leftEvidenceId: string;
  rightEvidenceId: string;
  topic: string;
  summary: string;
  createdAt: string;
}): string {
  return createHash('sha256').update(canonicalJson(parts)).digest('hex');
}

export function hashReview(parts: {
  reviewId: string;
  evidenceId: string;
  tenantId: string;
  universeId: string;
  reviewerId: string;
  decision: string;
  rationaleSummary: string;
  createdAt: string;
}): string {
  return createHash('sha256').update(canonicalJson({ ...parts, cotTranscript: null })).digest('hex');
}
