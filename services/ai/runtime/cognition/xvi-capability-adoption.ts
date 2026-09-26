import { createHash } from "node:crypto";

import type {
  XviCognitiveCapabilityProposal,
} from "./xvi-cognitive-capability-bridge";

export type XviCapabilityReviewDecision =
  | "APPROVED"
  | "REJECTED";

export type XviCapabilityAdoptionRecord =
  Readonly<{
    version:
      "xvi-cognitive-capability-adoption-v1";

    missionId: string;

    capabilityRequestDigest: string;
    capabilityReceiptDigest: string;

    decision:
      XviCapabilityReviewDecision;

    reviewedBy: string;
    reviewedAtMs: number;

    adoptionDigest: string;

    gatewayEligible: boolean;

    executesNothing: true;
    grantsNoProductionAuthority: true;

    authority: "NONE";
  }>;

function sha256(
  value: string,
): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function identifier(
  value: string,
  field: string,
): string {
  if (
    !/^[a-z][a-z0-9-]{0,31}$/.test(value)
  ) {
    throw new Error(
      `${field} must satisfy identifier format`,
    );
  }

  return value;
}

function hex64(
  value: string,
  field: string,
): string {
  if (
    !/^[0-9a-f]{64}$/.test(value)
  ) {
    throw new Error(
      `${field} must be lowercase sha256 hex`,
    );
  }

  return value;
}

export function deriveXviCapabilityRequestDigest(
  proposal:
    XviCognitiveCapabilityProposal,
): string {
  return sha256(
    JSON.stringify(
      proposal.request,
    ),
  );
}

export function createXviCapabilityAdoption(
  input: {
    proposal:
      XviCognitiveCapabilityProposal;

    capabilityReceiptDigest: string;

    capabilityReceiptOutcome:
      "RECORDED" | "REFUSED";

    capabilityReceiptReason: string;

    decision:
      XviCapabilityReviewDecision;

    reviewedBy: string;

    reviewedAtMs: number;
  },
): XviCapabilityAdoptionRecord {
  if (
    input.proposal.approvalAttached !==
      false ||
    input.proposal.executionPermitted !==
      false ||
    input.proposal.authority !== "NONE"
  ) {
    throw new Error(
      "capability proposal authority invariant violated",
    );
  }

  if (
    input.capabilityReceiptOutcome !==
      "RECORDED" ||
    input.capabilityReceiptReason !==
      "PENDING_HUMAN_REVIEW_NO_EXECUTION"
  ) {
    throw new Error(
      "only a pending recorded capability proposal may be reviewed",
    );
  }

  if (
    !Number.isSafeInteger(
      input.reviewedAtMs,
    ) ||
    input.reviewedAtMs < 0
  ) {
    throw new Error(
      "reviewedAtMs must be a non-negative safe integer",
    );
  }

  const reviewedBy =
    identifier(
      input.reviewedBy,
      "reviewedBy",
    );

  const capabilityReceiptDigest =
    hex64(
      input.capabilityReceiptDigest,
      "capabilityReceiptDigest",
    );

  const capabilityRequestDigest =
    deriveXviCapabilityRequestDigest(
      input.proposal,
    );

  const adoptionDigest =
    sha256(
      JSON.stringify({
        domain:
          "XVI_COGNITIVE_CAPABILITY_ADOPTION",

        version:
          "xvi-cognitive-capability-adoption-v1",

        missionId:
          input.proposal.missionId,

        capabilityRequestDigest,

        capabilityReceiptDigest,

        decision:
          input.decision,

        reviewedBy,

        reviewedAtMs:
          input.reviewedAtMs,
      }),
    );

  return Object.freeze({
    version:
      "xvi-cognitive-capability-adoption-v1",

    missionId:
      input.proposal.missionId,

    capabilityRequestDigest,

    capabilityReceiptDigest,

    decision:
      input.decision,

    reviewedBy,

    reviewedAtMs:
      input.reviewedAtMs,

    adoptionDigest,

    gatewayEligible:
      input.decision === "APPROVED",

    executesNothing: true,

    grantsNoProductionAuthority:
      true,

    authority: "NONE",
  });
}

export function verifyXviCapabilityAdoption(
  input: {
    proposal:
      XviCognitiveCapabilityProposal;

    adoption:
      XviCapabilityAdoptionRecord;
  },
): Readonly<{
  ok: true;
  gatewayEligible: boolean;
  adoptionDigest: string;
}> {
  const expectedRequestDigest =
    deriveXviCapabilityRequestDigest(
      input.proposal,
    );

  if (
    input.adoption.missionId !==
      input.proposal.missionId ||
    input.adoption
      .capabilityRequestDigest !==
      expectedRequestDigest
  ) {
    throw new Error(
      "adoption is not bound to this capability proposal",
    );
  }

  if (
    input.adoption.executesNothing !==
      true ||
    input.adoption
      .grantsNoProductionAuthority !==
      true ||
    input.adoption.authority !== "NONE"
  ) {
    throw new Error(
      "adoption authority invariant violated",
    );
  }

  const expectedDigest =
    sha256(
      JSON.stringify({
        domain:
          "XVI_COGNITIVE_CAPABILITY_ADOPTION",

        version:
          input.adoption.version,

        missionId:
          input.adoption.missionId,

        capabilityRequestDigest:
          input.adoption
            .capabilityRequestDigest,

        capabilityReceiptDigest:
          input.adoption
            .capabilityReceiptDigest,

        decision:
          input.adoption.decision,

        reviewedBy:
          input.adoption.reviewedBy,

        reviewedAtMs:
          input.adoption.reviewedAtMs,
      }),
    );

  if (
    expectedDigest !==
    input.adoption.adoptionDigest
  ) {
    throw new Error(
      "adoption digest mismatch",
    );
  }

  const expectedEligibility =
    input.adoption.decision ===
    "APPROVED";

  if (
    input.adoption.gatewayEligible !==
    expectedEligibility
  ) {
    throw new Error(
      "gateway eligibility does not match review decision",
    );
  }

  return Object.freeze({
    ok: true,
    gatewayEligible:
      expectedEligibility,
    adoptionDigest:
      expectedDigest,
  });
}
