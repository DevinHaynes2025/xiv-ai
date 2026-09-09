/**
 * 62L-EM8 — Home Base ingest gate for compute return receipts.
 *
 * Soft-wires EM1 Home Base acceptance: no accept without a valid signed receipt.
 * High-consequence outputs still need human approval even if compute PASS.
 * L4_AUTONOMY_ENABLED=false.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classifyReceiptOrUnverified,
  verifySignedReceipt,
} from './compute-return-receipt';
import type {
  HomeBaseIngestDecision,
  OriginatingComputeRequest,
  SignedComputeReturnReceipt,
} from './compute-return-receipt-types';
import { EM8_LOCKS } from './em8-honesty';
import { em8SoftWireSnapshot } from './em8-soft-wire';

function em1ContractPresent(): boolean {
  const here = dirname(fileURLToPath(import.meta.url));
  return existsSync(
    join(here, '../local-brain/agent-home-base-contract.ts'),
  );
}

/**
 * Soft-wire EM1 Home Base acceptance gate:
 * no accept without valid signed compute return receipt.
 */
export function evaluateHomeBaseReceiptIngest(input: {
  receipt: SignedComputeReturnReceipt | null | undefined;
  secret: string;
  origin: OriginatingComputeRequest;
  now?: Date;
}): HomeBaseIngestDecision {
  const softWire = em8SoftWireSnapshot();
  const softWireEm1Gate =
    softWire.em1HomeBase === 'PRESENT' || em1ContractPresent();

  if (EM8_LOCKS.L4_AUTONOMY_ENABLED !== false) {
    return {
      accepted: false,
      verificationStatus: 'REJECTED',
      reasons: ['L4_AUTONOMY_ENABLED must remain false.'],
      receiptRef: null,
      requestedHardwareVerified: false,
      requiresHumanApproval: true,
      softWireEm1Gate,
    };
  }

  // Soft-wire EM1 rule: no accept without valid signed receipt.
  if (!input.receipt) {
    return {
      accepted: false,
      verificationStatus: 'UNVERIFIED',
      reasons: [
        'EM1 Home Base acceptance gate: no accept without valid signed receipt.',
        'Missing compute return receipt → results UNVERIFIED.',
      ],
      receiptRef: null,
      requestedHardwareVerified: false,
      requiresHumanApproval: Boolean(input.origin.highConsequence),
      softWireEm1Gate,
    };
  }

  const classified = classifyReceiptOrUnverified(
    input.receipt,
    input.secret,
    input.origin,
  );

  if (classified.verificationStatus === 'UNVERIFIED') {
    return {
      accepted: false,
      verificationStatus: 'UNVERIFIED',
      reasons: [
        'EM1 Home Base acceptance gate: no accept without valid signed receipt.',
        ...classified.reasons,
      ],
      receiptRef: null,
      requestedHardwareVerified: false,
      requiresHumanApproval: Boolean(
        input.origin.highConsequence || input.receipt.payload.highConsequence,
      ),
      softWireEm1Gate,
    };
  }

  const verified = verifySignedReceipt(
    input.receipt,
    input.secret,
    input.origin,
    input.now,
  );

  const highConsequence =
    input.receipt.payload.highConsequence ||
    Boolean(input.origin.highConsequence);
  const requiresHumanApproval = highConsequence;
  const humanOk = !highConsequence || input.receipt.payload.humanAuthorized;

  const reasons: string[] = [...verified.reasons];
  if (!humanOk) {
    reasons.push(
      'High-consequence compute PASS still requires human approval at Home Base.',
    );
  }

  const accepted = verified.ok && humanOk;
  const receiptRef = accepted
    ? `em8:${input.receipt.payload.requestId}:${input.receipt.signedAt}`
    : null;

  return {
    accepted,
    verificationStatus: accepted ? 'VERIFIED_RECEIPT' : 'REJECTED',
    reasons: accepted
      ? [
          'Home Base accepted signed compute return receipt.',
          ...(input.receipt.payload.fallbackUsed
            ? [
                `Fallback honest: requested=${input.receipt.payload.requestedDevice} actual=${input.receipt.payload.actualDevice} (requested hardware NOT verified).`,
              ]
            : []),
        ]
      : reasons,
    receiptRef,
    requestedHardwareVerified: verified.requestedHardwareVerified && accepted,
    requiresHumanApproval,
    softWireEm1Gate,
  };
}
