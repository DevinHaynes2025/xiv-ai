/**
 * 62L-EX18 — Deterministic workload fingerprint.
 * Different fingerprint → NO_DIRECT_REUSE.
 */

import { createHash } from 'node:crypto';

export type FingerprintInput = {
  tenantId: string;
  universeId: string;
  missionId?: string;
  genomeId?: string;
  problemIrHash?: string;
  wormholeType: string;
  inputPayload: string;
  datasetVersion?: string;
  modelVersion?: string;
  runtimeVersion?: string;
};

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Stable workload fingerprint (tenant+universe scoped). */
export function computeWorkloadFingerprint(input: FingerprintInput): string {
  const canonical = [
    'v1',
    input.tenantId,
    input.universeId,
    input.missionId ?? '',
    input.genomeId ?? '',
    input.problemIrHash ?? '',
    input.wormholeType,
    input.datasetVersion ?? '',
    input.modelVersion ?? '',
    input.runtimeVersion ?? '',
  ].join('|');
  return sha256Hex(canonical);
}

/** Content hash of the concrete input. */
export function computeInputHash(inputPayload: string): string {
  return sha256Hex(`input:${inputPayload}`);
}

/** Integrity hash of a registered wormhole artifact. */
export function computeIntegrityHash(parts: {
  wormholeId: string;
  workloadFingerprint: string;
  inputHash: string;
  payloadDigest: string;
}): string {
  return sha256Hex(
    [
      parts.wormholeId,
      parts.workloadFingerprint,
      parts.inputHash,
      parts.payloadDigest,
    ].join('|'),
  );
}

export function fingerprintsCompatible(
  a: string,
  b: string,
): a is string & { __compatible: true } {
  return a === b && a.length > 0;
}

export type FingerprintCompareResult =
  | { compatible: true; disposition: 'COMPATIBLE' }
  | { compatible: false; disposition: 'NO_DIRECT_REUSE'; reason: string };

export function compareFingerprints(
  registered: string,
  request: string,
): FingerprintCompareResult {
  if (!registered || !request || registered !== request) {
    return {
      compatible: false,
      disposition: 'NO_DIRECT_REUSE',
      reason: 'Workload fingerprint mismatch → NO_DIRECT_REUSE.',
    };
  }
  return { compatible: true, disposition: 'COMPATIBLE' };
}

export function compareInputHashes(
  registered: string,
  request: string,
): FingerprintCompareResult {
  if (!registered || !request || registered !== request) {
    return {
      compatible: false,
      disposition: 'NO_DIRECT_REUSE',
      reason: 'Input hash mismatch → NORMAL_PATH_REQUIRED / NO_DIRECT_REUSE.',
    };
  }
  return { compatible: true, disposition: 'COMPATIBLE' };
}
