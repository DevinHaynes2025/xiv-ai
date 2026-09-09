/**
 * 62L-EL8 — Audit/runtime evidence ledger (local, non-production).
 *
 * Stores evidence references so verification outcomes are citeable.
 * Does not expand production writes, permissions, or DB schema.
 */

import type { ModelLoadEvidence, VerificationStage } from './model-load-evidence';
import { EL8_LOCKS } from './el8-honesty';

export type EvidenceLedgerEntry = {
  evidenceRef: string;
  recordedAt: string;
  modelId: string;
  modelVersionOrHash: string;
  requestedProvider: ModelLoadEvidence['requestedProvider'];
  actualProvider: ModelLoadEvidence['actualProvider'];
  stage: VerificationStage;
  failureClass: ModelLoadEvidence['failureClass'];
  reason: string;
  /** Snapshot of required evidence fields for audit. */
  evidence: ModelLoadEvidence;
  locks: {
    L4_AUTONOMY_ENABLED: false;
    PRODUCTION_WRITE: false;
  };
};

export type RuntimeEvidenceLedger = {
  id: string;
  entries: EvidenceLedgerEntry[];
};

let refCounter = 0;

export function createEvidenceLedger(id = 'local-runtime-el8'): RuntimeEvidenceLedger {
  return { id, entries: [] };
}

export function nextEvidenceRef(ledgerId: string): string {
  refCounter += 1;
  return `el8:${ledgerId}:${refCounter}:${Date.now().toString(36)}`;
}

export function appendEvidenceToLedger(
  ledger: RuntimeEvidenceLedger,
  input: {
    evidence: ModelLoadEvidence;
    stage: VerificationStage;
    reason: string;
  },
): EvidenceLedgerEntry {
  const evidenceRef = input.evidence.evidenceRef ?? nextEvidenceRef(ledger.id);
  const entry: EvidenceLedgerEntry = {
    evidenceRef,
    recordedAt: new Date().toISOString(),
    modelId: input.evidence.modelId,
    modelVersionOrHash: input.evidence.modelVersionOrHash,
    requestedProvider: input.evidence.requestedProvider,
    actualProvider: input.evidence.actualProvider,
    stage: input.stage,
    failureClass: input.evidence.failureClass,
    reason: input.reason,
    evidence: { ...input.evidence, evidenceRef },
    locks: {
      L4_AUTONOMY_ENABLED: EL8_LOCKS.L4_AUTONOMY_ENABLED,
      PRODUCTION_WRITE: false,
    },
  };
  ledger.entries.push(entry);
  return entry;
}

export function findEvidenceByRef(
  ledger: RuntimeEvidenceLedger,
  evidenceRef: string,
): EvidenceLedgerEntry | undefined {
  return ledger.entries.find((e) => e.evidenceRef === evidenceRef);
}
