/**
 * 62L-EM8 — Neural pathway ingestion preserves receipt reference.
 *
 * Pathways that ingest compute outcomes must carry the receiptRef so
 * downstream memory never silently drops device/fallback honesty.
 */

import type {
  HomeBaseIngestDecision,
  NeuralPathwayIngestRecord,
  SignedComputeReturnReceipt,
} from './compute-return-receipt-types';

export type NeuralPathwayIngestResult =
  | { ok: true; record: NeuralPathwayIngestRecord }
  | { ok: false; reasons: string[] };

/**
 * Ingest a compute outcome into a neural pathway while preserving receiptRef.
 */
export function ingestComputeOutcomeToNeuralPathway(input: {
  pathwayId: string;
  receipt: SignedComputeReturnReceipt | null | undefined;
  ingest: HomeBaseIngestDecision;
  now?: Date;
}): NeuralPathwayIngestResult {
  const reasons: string[] = [];
  if (!input.pathwayId || !input.pathwayId.trim()) {
    reasons.push('pathwayId is required.');
  }
  if (!input.ingest.receiptRef) {
    reasons.push(
      'Neural pathway ingestion requires a preserved receiptRef from Home Base ingest.',
    );
  }
  if (!input.receipt) {
    reasons.push('Neural pathway ingestion requires the signed receipt object.');
  }
  if (input.ingest.verificationStatus === 'UNVERIFIED') {
    reasons.push(
      'UNVERIFIED outcomes cannot be ingested as verified pathway memory.',
    );
  }
  if (reasons.length > 0) {
    return { ok: false, reasons };
  }

  const receipt = input.receipt!;
  const record: NeuralPathwayIngestRecord = Object.freeze({
    pathwayId: input.pathwayId,
    receiptRef: input.ingest.receiptRef!,
    requestId: receipt.payload.requestId,
    agentId: receipt.payload.agentId,
    preservedAt: (input.now ?? new Date()).toISOString(),
    verificationStatus: input.ingest.verificationStatus,
  });

  return { ok: true, record };
}
