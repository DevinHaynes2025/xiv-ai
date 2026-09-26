import type {
  XviClaim,
  XviEpistemicState,
} from "./xvi-evidence-claim-fabric";

export type XviClaimRelationType =
  | "SUPPORTS"
  | "CONTRADICTS"
  | "DUPLICATES"
  | "SUPERSEDES";

export type XviClaimRelation = Readonly<{
  relationId: string;
  fromClaimId: string;
  toClaimId: string;
  type: XviClaimRelationType;
  authority: "NONE";
}>;

export type XviPromotionDecision =
  | "PROMOTED"
  | "BLOCKED";

export type XviClaimPromotionReceipt = Readonly<{
  claimId: string;
  fromState: XviEpistemicState;
  requestedState: XviEpistemicState;
  decision: XviPromotionDecision;
  reasons: readonly string[];
  authority: "NONE";
}>;

function requireNonEmpty(
  value: string,
  field: string,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} must be non-empty`);
  }

  return normalized;
}

export function createXviClaimRelation(input: {
  relationId: string;
  fromClaimId: string;
  toClaimId: string;
  type: XviClaimRelationType;
}): XviClaimRelation {
  const relationId = requireNonEmpty(
    input.relationId,
    "relationId",
  );

  const fromClaimId = requireNonEmpty(
    input.fromClaimId,
    "fromClaimId",
  );

  const toClaimId = requireNonEmpty(
    input.toClaimId,
    "toClaimId",
  );

  if (fromClaimId === toClaimId) {
    throw new Error(
      "claim relation cannot reference itself",
    );
  }

  return Object.freeze({
    relationId,
    fromClaimId,
    toClaimId,
    type: input.type,
    authority: "NONE",
  });
}

function countIndependentSources(
  claim: XviClaim,
): number {
  return new Set(
    claim.evidenceRefs.map(
      (evidence) => evidence.sourceId,
    ),
  ).size;
}

export function evaluateXviClaimPromotion(input: {
  claim: XviClaim;
  requestedState: XviEpistemicState;
  relations: readonly XviClaimRelation[];
  verificationApproved: boolean;
}): XviClaimPromotionReceipt {
  const reasons: string[] = [];

  const contradictions =
    input.relations.filter(
      (relation) =>
        relation.type === "CONTRADICTS" &&
        (
          relation.fromClaimId ===
            input.claim.claimId ||
          relation.toClaimId ===
            input.claim.claimId
        ),
    );

  if (
    input.requestedState === "VERIFIED"
  ) {
    if (
      input.claim.evidenceRefs.length === 0
    ) {
      reasons.push(
        "VERIFIED requires evidence",
      );
    }

    if (
      countIndependentSources(
        input.claim,
      ) < 1
    ) {
      reasons.push(
        "VERIFIED requires at least one evidence source",
      );
    }

    if (contradictions.length > 0) {
      reasons.push(
        "unresolved contradiction blocks VERIFIED promotion",
      );
    }

    if (
      input.verificationApproved !== true
    ) {
      reasons.push(
        "VERIFIED promotion requires verification approval",
      );
    }
  }

  if (
    input.requestedState ===
    "CORROBORATED"
  ) {
    if (
      countIndependentSources(
        input.claim,
      ) < 2
    ) {
      reasons.push(
        "CORROBORATED requires at least two independent sources",
      );
    }

    if (contradictions.length > 0) {
      reasons.push(
        "unresolved contradiction blocks CORROBORATED promotion",
      );
    }
  }

  const decision:
    XviPromotionDecision =
      reasons.length === 0
        ? "PROMOTED"
        : "BLOCKED";

  return Object.freeze({
    claimId: input.claim.claimId,
    fromState: input.claim.state,
    requestedState:
      input.requestedState,
    decision,
    reasons: Object.freeze(reasons),
    authority: "NONE",
  });
}
