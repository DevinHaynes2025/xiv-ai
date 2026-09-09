/**
 * 62L-EX6 — Physical QPU verification gate.
 * Only actualExecutionClass=PHYSICAL_QPU + full physical evidence + PHYSICAL_PROVIDER
 * may yield PHYSICAL_QPU_VERIFIED. COMPLETED ≠ VERIFIED.
 */

import {
  allPhysicalEvidencePass,
  buildEvidenceChecklist,
  computeReceiptHash,
  verifyReceiptHash,
} from './qpu-receipt.ts';
import type {
  PhysicalEvidenceChecklist,
  PhysicalQpuExecutionReceipt,
  VerificationState,
} from './types.ts';

export type VerificationDecision = {
  allowed: boolean;
  verificationState: VerificationState;
  physicalQpuVerified: boolean;
  quantumAdvantageVerified: false;
  reasons: readonly string[];
  checklist: PhysicalEvidenceChecklist;
  receipt: PhysicalQpuExecutionReceipt;
};

function reasonsFromChecklist(checklist: PhysicalEvidenceChecklist): string[] {
  const reasons: string[] = [];
  if (!checklist.providerAuthorized) reasons.push('PROVIDER_NOT_AUTHORIZED');
  if (!checklist.backendClassificationPhysical) reasons.push('BACKEND_NOT_PHYSICAL_QPU');
  if (!checklist.providerJobIdPresent) reasons.push('MISSING_PROVIDER_JOB_ID');
  if (!checklist.jobAccepted) reasons.push('JOB_NOT_ACCEPTED');
  if (!checklist.jobCompleted) reasons.push('JOB_NOT_COMPLETED');
  if (!checklist.providerResultReturned) reasons.push('MISSING_PROVIDER_RESULT');
  if (!checklist.backendIdentityConfirmed) reasons.push('MISSING_BACKEND_IDENTITY');
  if (!checklist.timestampsPresent) reasons.push('MISSING_TIMESTAMPS');
  if (!checklist.resultHashPresent) reasons.push('MISSING_RESULT_HASH');
  if (!checklist.auditEvidencePresent) reasons.push('MISSING_AUDIT_EVIDENCE');
  if (!checklist.receiptHashValid) reasons.push('INVALID_RECEIPT_HASH');
  return reasons;
}

/**
 * Evaluate whether a receipt may be marked PHYSICAL_QPU_VERIFIED.
 * Never upgrades simulator/mock/unit-test/staging to physical verification.
 * Never implies quantum advantage.
 */
export function verifyPhysicalQpuReceipt(
  receipt: PhysicalQpuExecutionReceipt,
  opts?: {
    /** Override hash validity (e.g. after tamper). */
    forceHashInvalid?: boolean;
  },
): VerificationDecision {
  const reasons: string[] = [];
  let hashValid = verifyReceiptHash(receipt);
  if (opts?.forceHashInvalid) hashValid = false;

  const checklist = buildEvidenceChecklist({
    providerAuthorized: receipt.evidenceChecklist.providerAuthorized,
    backendClassification: receipt.backendClassification,
    providerJobId: receipt.providerJobId,
    jobAccepted: receipt.evidenceChecklist.jobAccepted,
    jobCompleted: receipt.evidenceChecklist.jobCompleted,
    providerResultReturned: receipt.evidenceChecklist.providerResultReturned,
    backendIdentityConfirmed: receipt.evidenceChecklist.backendIdentityConfirmed,
    submittedAt: receipt.submittedAt,
    completedAt: receipt.completedAt,
    resultHash: receipt.resultHash,
    auditEvidenceRef: receipt.auditEvidenceRef,
    receiptHashValid: hashValid,
  });

  if (receipt.mockProvider || receipt.receiptKind === 'MOCK' || receipt.receiptKind === 'TEST_RECEIPT') {
    reasons.push('MOCK_PROVIDER_CANNOT_PROVE_PHYSICAL_EXECUTION');
  }
  if (receipt.backendClassification === 'SIMULATOR') {
    reasons.push('SIMULATOR_CANNOT_BECOME_PHYSICAL_QPU_VERIFIED');
  }
  if (receipt.actualExecutionClass !== 'PHYSICAL_QPU') {
    reasons.push('ACTUAL_EXECUTION_CLASS_NOT_PHYSICAL_QPU');
  }
  if (receipt.evidenceEnvironment !== 'PHYSICAL_PROVIDER') {
    reasons.push('EVIDENCE_ENVIRONMENT_NOT_PHYSICAL_PROVIDER');
  }
  if (receipt.fabricated !== false) {
    reasons.push('FABRICATED_RECEIPT_DENIED');
  }

  reasons.push(...reasonsFromChecklist(checklist));

  const uniqueReasons = [...new Set(reasons)];
  const evidenceOk = allPhysicalEvidencePass(checklist);
  const environmentOk =
    !receipt.mockProvider &&
    receipt.receiptKind !== 'MOCK' &&
    receipt.receiptKind !== 'TEST_RECEIPT' &&
    receipt.backendClassification === 'PHYSICAL_QPU' &&
    receipt.actualExecutionClass === 'PHYSICAL_QPU' &&
    receipt.evidenceEnvironment === 'PHYSICAL_PROVIDER' &&
    receipt.fabricated === false;

  const mayVerify = evidenceOk && environmentOk;

  let verificationState: VerificationState;
  if (receipt.verificationState === 'FAILED') {
    verificationState = 'FAILED';
  } else if (receipt.verificationState === 'REVOKED') {
    verificationState = 'REVOKED';
  } else if (receipt.verificationState === 'STALE') {
    verificationState = 'STALE';
  } else if (receipt.verificationState === 'WAITING_PROVIDER') {
    verificationState = 'WAITING_PROVIDER';
  } else if (receipt.mockProvider || receipt.receiptKind === 'TEST_RECEIPT') {
    verificationState = receipt.receiptKind === 'TEST_RECEIPT' ? 'TEST_RECEIPT' : 'COMPLETED_UNVERIFIED';
  } else if (!hashValid) {
    verificationState = 'EVIDENCE_INCOMPLETE';
  } else if (mayVerify) {
    // Even with synthetic complete checklist in unit tests, PHYSICAL_PROVIDER
    // without real hardware remains honesty-bound: callers may only reach
    // PHYSICAL_QPU_VERIFIED when every gate passes. Unit-test harnesses that
    // synthesize checklist fields still must not claim production QPU.
    verificationState = 'PHYSICAL_QPU_VERIFIED';
  } else if (!evidenceOk) {
    verificationState = 'EVIDENCE_INCOMPLETE';
  } else {
    verificationState = 'COMPLETED_UNVERIFIED';
  }

  // Honesty: in UNIT_TEST / LOCAL_SIMULATION / STAGING, never PHYSICAL_QPU_VERIFIED
  // even if checklist fields are filled (defense in depth — environmentOk already gates).
  if (
    verificationState === 'PHYSICAL_QPU_VERIFIED' &&
    receipt.evidenceEnvironment !== 'PHYSICAL_PROVIDER'
  ) {
    verificationState = 'COMPLETED_UNVERIFIED';
  }

  const physicalQpuVerified = verificationState === 'PHYSICAL_QPU_VERIFIED';

  const next: Omit<PhysicalQpuExecutionReceipt, 'receiptHash'> = {
    ...receipt,
    evidenceChecklist: checklist,
    verificationState,
    physicalQpuVerified,
    quantumAdvantageVerified: false,
  };
  const receiptHash = computeReceiptHash(next);

  return {
    allowed: physicalQpuVerified,
    verificationState,
    physicalQpuVerified,
    quantumAdvantageVerified: false,
    reasons: physicalQpuVerified
      ? ['PHYSICAL_EVIDENCE_CHECKLIST_PASS']
      : uniqueReasons.length > 0
        ? uniqueReasons
        : ['VERIFICATION_DENIED'],
    checklist,
    receipt: { ...next, receiptHash },
  };
}

/**
 * Valid synthetic contract: all logical fields present but environment is UNIT_TEST
 * → COMPLETED_UNVERIFIED only (never physical proof).
 * Re-hash after environment clamp so integrity stays consistent.
 */
export function evaluateSyntheticContractReceipt(
  receipt: PhysicalQpuExecutionReceipt,
): VerificationDecision {
  const bodyPre: Omit<PhysicalQpuExecutionReceipt, 'receiptHash'> = {
    ...receipt,
    evidenceEnvironment: 'UNIT_TEST',
    mockProvider: false,
    receiptKind: receipt.receiptKind === 'MOCK' ? 'PHYSICAL_ATTEMPT' : receipt.receiptKind,
    physicalQpuVerified: false,
    quantumAdvantageVerified: false,
    verificationState: 'COMPLETED_UNVERIFIED',
    limitations: [
      ...receipt.limitations,
      'SYNTHETIC_CONTRACT_COMPLETED_UNVERIFIED_ONLY',
      'UNIT_TEST_NEQ_PHYSICAL_QPU_EVIDENCE',
    ],
  };
  const synthetic: PhysicalQpuExecutionReceipt = {
    ...bodyPre,
    receiptHash: computeReceiptHash(bodyPre),
  };

  const decision = verifyPhysicalQpuReceipt(synthetic);

  // Hard honesty: synthetic / unit-test contracts never leave COMPLETED_UNVERIFIED.
  const clampedState: VerificationState = 'COMPLETED_UNVERIFIED';
  const body: Omit<PhysicalQpuExecutionReceipt, 'receiptHash'> = {
    ...decision.receipt,
    evidenceEnvironment: 'UNIT_TEST',
    verificationState: clampedState,
    physicalQpuVerified: false,
    quantumAdvantageVerified: false,
    limitations: [
      ...new Set([
        ...decision.receipt.limitations,
        'SYNTHETIC_CONTRACT_COMPLETED_UNVERIFIED_ONLY',
      ]),
    ],
  };
  return {
    allowed: false,
    verificationState: clampedState,
    physicalQpuVerified: false,
    quantumAdvantageVerified: false,
    reasons: [
      'SYNTHETIC_UNIT_TEST_CANNOT_PROVE_PHYSICAL_QPU',
      ...decision.reasons.filter((r) => r !== 'PHYSICAL_EVIDENCE_CHECKLIST_PASS'),
    ],
    checklist: decision.checklist,
    receipt: { ...body, receiptHash: computeReceiptHash(body) },
  };
}
