import {
  XviDurableAdoptionCoordinator,
  type XviDurableAdoptionRecoveryDescriptor,
} from "./xvi-durable-adoption-coordinator";

export type XviRecoveryEvidence =
  | Readonly<{
      conclusion: "ADOPTION_COMPLETED";
      adoptionRecordCanonicalJson: string;
    }>
  | Readonly<{
      conclusion: "ADOPTION_NOT_COMPLETED";
    }>
  | Readonly<{
      conclusion: "AMBIGUOUS";
    }>;

export type XviRecoveryResolution =
  | "COMMIT"
  | "ABORT"
  | "REMAIN_RESERVED";

export interface XviRecoveryProposal {
  readonly kind:
    "XVI_DURABLE_ADOPTION_RECOVERY_PROPOSAL";
  readonly replayKey: string;
  readonly reservationId: string;
  readonly currentState: "RESERVED";
  readonly proposedResolution:
    XviRecoveryResolution;
  readonly humanDecision: "REQUIRED";
  readonly automaticRetryAllowed: false;
  readonly executesNothing: true;
  readonly productionAuthority: false;
}

export const XVI_RECOVERY_RECONCILIATION_GUARDRAILS =
  Object.freeze({
    onlyReservedMayReconcile: true,
    ambiguousEvidenceRemainsReserved: true,
    explicitHumanDecisionRequiredForMutation: true,
    automaticRetryAllowed: false,
    executesNothing: true,
    productionAuthority: false,
    networkCalls: 0,
    remoteCalls: 0,
  });

function requireReserved(
  descriptor:
    Readonly<XviDurableAdoptionRecoveryDescriptor>,
): asserts descriptor is
  Readonly<XviDurableAdoptionRecoveryDescriptor> & {
    state: "RESERVED";
    reservationId: string;
    reservedAtMs: number;
  } {
  if (
    descriptor.state !== "RESERVED" ||
    descriptor.reservationId === null ||
    descriptor.reservedAtMs === null
  ) {
    throw new Error(
      "recovery reconciliation requires a durable RESERVED lineage",
    );
  }
}

export function proposeXviDurableAdoptionRecovery(
  input: {
    coordinator:
      XviDurableAdoptionCoordinator;
    replayKey: string;
    evidence:
      XviRecoveryEvidence;
  },
): Readonly<XviRecoveryProposal> {
  const descriptor =
    input.coordinator.recoveryDescriptor(
      input.replayKey,
    );

  requireReserved(
    descriptor,
  );

  let proposedResolution:
    XviRecoveryResolution;

  switch (
    input.evidence.conclusion
  ) {
    case "ADOPTION_COMPLETED":
      if (
        typeof input.evidence
          .adoptionRecordCanonicalJson !==
          "string" ||
        !input.evidence
          .adoptionRecordCanonicalJson
          .trim()
      ) {
        throw new Error(
          "completed-adoption evidence requires canonical record material",
        );
      }

      proposedResolution =
        "COMMIT";
      break;

    case "ADOPTION_NOT_COMPLETED":
      proposedResolution =
        "ABORT";
      break;

    case "AMBIGUOUS":
      proposedResolution =
        "REMAIN_RESERVED";
      break;

    default: {
      const neverEvidence:
        never =
        input.evidence;
      throw new Error(
        `unsupported recovery evidence: ${String(neverEvidence)}`,
      );
    }
  }

  return Object.freeze({
    kind:
      "XVI_DURABLE_ADOPTION_RECOVERY_PROPOSAL",
    replayKey:
      descriptor.replayKey,
    reservationId:
      descriptor.reservationId,
    currentState:
      "RESERVED",
    proposedResolution,
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

export function applyReviewedXviDurableAdoptionRecovery(
  input: {
    coordinator:
      XviDurableAdoptionCoordinator;
    proposal:
      Readonly<XviRecoveryProposal>;
    reviewedDecision:
      "APPROVE" | "REJECT";
    evidence:
      XviRecoveryEvidence;
    nowMs: number;
  },
):
  | Readonly<{
      outcome: "COMMITTED";
      replayKey: string;
      executesNothing: true;
      productionAuthority: false;
    }>
  | Readonly<{
      outcome: "ABORTED";
      replayKey: string;
      executesNothing: true;
      productionAuthority: false;
    }>
  | Readonly<{
      outcome: "REMAIN_RESERVED";
      replayKey: string;
      executesNothing: true;
      productionAuthority: false;
    }> {
  if (
    input.reviewedDecision !==
      "APPROVE"
  ) {
    return Object.freeze({
      outcome:
        "REMAIN_RESERVED" as const,
      replayKey:
        input.proposal.replayKey,
      executesNothing:
        true as const,
      productionAuthority:
        false as const,
    });
  }

  const current =
    input.coordinator.recoveryDescriptor(
      input.proposal.replayKey,
    );

  requireReserved(
    current,
  );

  if (
    current.reservationId !==
      input.proposal.reservationId
  ) {
    throw new Error(
      "recovery reservation identity changed; fail closed",
    );
  }

  if (
    input.proposal
      .proposedResolution ===
      "REMAIN_RESERVED"
  ) {
    return Object.freeze({
      outcome:
        "REMAIN_RESERVED" as const,
      replayKey:
        input.proposal.replayKey,
      executesNothing:
        true as const,
      productionAuthority:
        false as const,
    });
  }

  if (
    input.proposal
      .proposedResolution ===
      "COMMIT"
  ) {
    if (
      input.evidence.conclusion !==
        "ADOPTION_COMPLETED"
    ) {
      throw new Error(
        "commit recovery requires completed-adoption evidence",
      );
    }

    input.coordinator.commit({
      replayKey:
        input.proposal.replayKey,
      reservationId:
        input.proposal.reservationId,
      adoptionRecordCanonicalJson:
        input.evidence
          .adoptionRecordCanonicalJson,
      nowMs:
        input.nowMs,
    });

    return Object.freeze({
      outcome:
        "COMMITTED" as const,
      replayKey:
        input.proposal.replayKey,
      executesNothing:
        true as const,
      productionAuthority:
        false as const,
    });
  }

  if (
    input.evidence.conclusion !==
      "ADOPTION_NOT_COMPLETED"
  ) {
    throw new Error(
      "abort recovery requires not-completed evidence",
    );
  }

  input.coordinator.abort({
    replayKey:
      input.proposal.replayKey,
    reservationId:
      input.proposal.reservationId,
    nowMs:
      input.nowMs,
  });

  return Object.freeze({
    outcome:
      "ABORTED" as const,
    replayKey:
      input.proposal.replayKey,
    executesNothing:
      true as const,
    productionAuthority:
      false as const,
  });
}
