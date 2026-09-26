import {
  createHash,
} from "node:crypto";

import {
  XviDurableAdoptionCoordinator,
} from "./xvi-durable-adoption-coordinator";

import {
  applyReviewedXviDurableAdoptionRecovery,
  proposeXviDurableAdoptionRecovery,
  type XviRecoveryEvidence,
  type XviRecoveryProposal,
} from "./xvi-durable-adoption-recovery";

export interface XviRecoveryEvidenceReceipt {
  readonly kind:
    "XVI_RECOVERY_EVIDENCE_RECEIPT";
  readonly replayKey: string;
  readonly reservationId: string;
  readonly conclusion:
    XviRecoveryEvidence["conclusion"];
  readonly adoptionRecordDigest:
    string | null;
  readonly evidenceAtMs: number;
  readonly receiptDigest: string;
  readonly humanDecision: "REQUIRED";
  readonly automaticRetryAllowed: false;
  readonly executesNothing: true;
  readonly productionAuthority: false;
}

export const XVI_RECOVERY_EVIDENCE_POLICY =
  Object.freeze({
    policyVersion:
      "xvi-recovery-evidence-v1",
    maxCanonicalRecordChars:
      65_536,
  });

export const XVI_RECOVERY_EVIDENCE_GUARDRAILS =
  Object.freeze({
    bindsReplayKey: true,
    bindsReservationIdentity: true,
    bindsEvidenceConclusion: true,
    bindsCompletedRecordDigest: true,
    revalidatesBeforeResolution: true,
    ambiguousEvidenceNeverMutates: true,
    rejectedReviewNeverMutates: true,
    automaticRetryAllowed: false,
    executesNothing: true,
    productionAuthority: false,
  });

const hex64 = (
  value: unknown,
): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{64}$/.test(value);

function safePositiveInt(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function sha256(
  value: string,
): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function recordDigestOf(
  evidence:
    XviRecoveryEvidence,
): string | null {
  if (
    evidence.conclusion !==
      "ADOPTION_COMPLETED"
  ) {
    return null;
  }

  const record =
    evidence
      .adoptionRecordCanonicalJson;

  if (
    typeof record !== "string" ||
    !record.trim() ||
    record.length >
      XVI_RECOVERY_EVIDENCE_POLICY
        .maxCanonicalRecordChars
  ) {
    throw new Error(
      "completed recovery evidence requires bounded canonical record material",
    );
  }

  return sha256(
    record,
  );
}

function receiptMaterial(
  input: {
    replayKey: string;
    reservationId: string;
    conclusion:
      XviRecoveryEvidence["conclusion"];
    adoptionRecordDigest:
      string | null;
    evidenceAtMs: number;
  },
): string {
  return [
    XVI_RECOVERY_EVIDENCE_POLICY
      .policyVersion,
    input.replayKey,
    input.reservationId,
    input.conclusion,
    input.adoptionRecordDigest ??
      "NONE",
    String(
      input.evidenceAtMs,
    ),
  ].join("|");
}

export function createXviRecoveryEvidenceReceipt(
  input: {
    coordinator:
      XviDurableAdoptionCoordinator;
    replayKey: string;
    evidence:
      XviRecoveryEvidence;
    evidenceAtMs: number;
  },
): Readonly<XviRecoveryEvidenceReceipt> {
  if (
    !hex64(
      input.replayKey,
    )
  ) {
    throw new Error(
      "recovery evidence replay key invalid",
    );
  }

  if (
    !safePositiveInt(
      input.evidenceAtMs,
    )
  ) {
    throw new Error(
      "recovery evidence timestamp invalid",
    );
  }

  const descriptor =
    input.coordinator
      .recoveryDescriptor(
        input.replayKey,
      );

  if (
    descriptor.state !==
      "RESERVED" ||
    descriptor.reservationId ===
      null ||
    descriptor.reservedAtMs ===
      null
  ) {
    throw new Error(
      "recovery evidence requires durable RESERVED lineage",
    );
  }

  if (
    input.evidenceAtMs <
      descriptor.reservedAtMs
  ) {
    throw new Error(
      "recovery evidence predates reservation",
    );
  }

  const adoptionRecordDigest =
    recordDigestOf(
      input.evidence,
    );

  const receiptDigest =
    sha256(
      receiptMaterial({
        replayKey:
          descriptor.replayKey,
        reservationId:
          descriptor.reservationId,
        conclusion:
          input.evidence
            .conclusion,
        adoptionRecordDigest,
        evidenceAtMs:
          input.evidenceAtMs,
      }),
    );

  return Object.freeze({
    kind:
      "XVI_RECOVERY_EVIDENCE_RECEIPT",
    replayKey:
      descriptor.replayKey,
    reservationId:
      descriptor.reservationId,
    conclusion:
      input.evidence
        .conclusion,
    adoptionRecordDigest,
    evidenceAtMs:
      input.evidenceAtMs,
    receiptDigest,
    humanDecision:
      "REQUIRED",
    automaticRetryAllowed:
      false,
    executesNothing:
      true,
    productionAuthority:
      false,
  });
}

export function verifyXviRecoveryEvidenceReceipt(
  input: {
    coordinator:
      XviDurableAdoptionCoordinator;
    receipt:
      Readonly<XviRecoveryEvidenceReceipt>;
    evidence:
      XviRecoveryEvidence;
  },
): void {
  const descriptor =
    input.coordinator
      .recoveryDescriptor(
        input.receipt.replayKey,
      );

  if (
    descriptor.state !==
      "RESERVED" ||
    descriptor.reservationId ===
      null ||
    descriptor.reservedAtMs ===
      null
  ) {
    throw new Error(
      "recovery receipt no longer targets a RESERVED lineage",
    );
  }

  if (
    descriptor.reservationId !==
      input.receipt.reservationId
  ) {
    throw new Error(
      "recovery receipt reservation identity mismatch",
    );
  }

  if (
    input.receipt.evidenceAtMs <
      descriptor.reservedAtMs
  ) {
    throw new Error(
      "recovery receipt predates reservation",
    );
  }

  if (
    input.receipt.conclusion !==
      input.evidence.conclusion
  ) {
    throw new Error(
      "recovery evidence conclusion changed",
    );
  }

  const adoptionRecordDigest =
    recordDigestOf(
      input.evidence,
    );

  if (
    adoptionRecordDigest !==
      input.receipt
        .adoptionRecordDigest
  ) {
    throw new Error(
      "recovery adoption record digest changed",
    );
  }

  const expected =
    sha256(
      receiptMaterial({
        replayKey:
          input.receipt
            .replayKey,
        reservationId:
          input.receipt
            .reservationId,
        conclusion:
          input.receipt
            .conclusion,
        adoptionRecordDigest:
          input.receipt
            .adoptionRecordDigest,
        evidenceAtMs:
          input.receipt
            .evidenceAtMs,
      }),
    );

  if (
    !hex64(
      input.receipt
        .receiptDigest,
    ) ||
    expected !==
      input.receipt
        .receiptDigest
  ) {
    throw new Error(
      "recovery evidence receipt digest mismatch",
    );
  }
}

export function applyXviReceiptBoundRecovery(
  input: {
    coordinator:
      XviDurableAdoptionCoordinator;
    receipt:
      Readonly<XviRecoveryEvidenceReceipt>;
    evidence:
      XviRecoveryEvidence;
    reviewedDecision:
      "APPROVE" | "REJECT";
    nowMs: number;
  },
) {
  verifyXviRecoveryEvidenceReceipt({
    coordinator:
      input.coordinator,
    receipt:
      input.receipt,
    evidence:
      input.evidence,
  });

  const proposal:
    Readonly<XviRecoveryProposal> =
    proposeXviDurableAdoptionRecovery({
      coordinator:
        input.coordinator,
      replayKey:
        input.receipt.replayKey,
      evidence:
        input.evidence,
    });

  if (
    proposal.reservationId !==
      input.receipt.reservationId
  ) {
    throw new Error(
      "recovery proposal no longer matches evidence receipt",
    );
  }

  return applyReviewedXviDurableAdoptionRecovery({
    coordinator:
      input.coordinator,
    proposal,
    reviewedDecision:
      input.reviewedDecision,
    evidence:
      input.evidence,
    nowMs:
      input.nowMs,
  });
}
