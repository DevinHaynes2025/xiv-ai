import type {
  XviBrainId,
} from "./xvi-cognitive-brain-registry";

export type XviEpistemicState =
  | "OBSERVED"
  | "VERIFIED"
  | "CORROBORATED"
  | "INFERRED"
  | "PREDICTED"
  | "SIMULATED"
  | "CONTESTED"
  | "STALE"
  | "UNKNOWN"
  | "REJECTED";

export type XviEvidenceRef = Readonly<{
  evidenceId: string;
  sourceId: string;
  sourceRevision: string;
}>;

export type XviClaim = Readonly<{
  claimId: string;
  missionId: string;

  sourceBrain: XviBrainId;

  statement: string;

  state: XviEpistemicState;

  confidence: number;

  evidenceRefs: readonly XviEvidenceRef[];

  contradictionRefs: readonly string[];

  parentClaimRefs: readonly string[];

  expiresAt?: string;

  authority: "NONE";
}>;

function requireNonEmpty(
  value: string,
  field: string,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(
      `${field} must be non-empty`,
    );
  }

  return normalized;
}

function validateConfidence(
  confidence: number,
): number {
  if (
    !Number.isFinite(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    throw new Error(
      "confidence must be between 0 and 1",
    );
  }

  return confidence;
}

function uniqueStrings(
  values: readonly string[],
): readonly string[] {
  return Object.freeze([
    ...new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ]);
}

export function createXviClaim(
  input: XviClaim,
): XviClaim {
  if (
    (
      input.state === "VERIFIED" ||
      input.state === "CORROBORATED" ||
      input.state === "OBSERVED"
    ) &&
    input.evidenceRefs.length === 0
  ) {
    throw new Error(
      `${input.state} claim requires evidence`,
    );
  }

  if (
    input.state === "UNKNOWN" &&
    input.confidence !== 0
  ) {
    throw new Error(
      "UNKNOWN claim must have zero confidence",
    );
  }

  const evidenceRefs = input.evidenceRefs.map(
    (evidence) =>
      Object.freeze({
        evidenceId: requireNonEmpty(
          evidence.evidenceId,
          "evidenceId",
        ),

        sourceId: requireNonEmpty(
          evidence.sourceId,
          "sourceId",
        ),

        sourceRevision: requireNonEmpty(
          evidence.sourceRevision,
          "sourceRevision",
        ),
      }),
  );

  return Object.freeze({
    claimId: requireNonEmpty(
      input.claimId,
      "claimId",
    ),

    missionId: requireNonEmpty(
      input.missionId,
      "missionId",
    ),

    sourceBrain: input.sourceBrain,

    statement: requireNonEmpty(
      input.statement,
      "statement",
    ),

    state: input.state,

    confidence: validateConfidence(
      input.confidence,
    ),

    evidenceRefs: Object.freeze(
      evidenceRefs,
    ),

    contradictionRefs: uniqueStrings(
      input.contradictionRefs,
    ),

    parentClaimRefs: uniqueStrings(
      input.parentClaimRefs,
    ),

    ...(input.expiresAt
      ? {
          expiresAt: requireNonEmpty(
            input.expiresAt,
            "expiresAt",
          ),
        }
      : {}),

    authority: "NONE",
  });
}

export type XviClaimLedger = Readonly<{
  missionId: string;
  claims: readonly XviClaim[];

  verifiedCount: number;
  contestedCount: number;
  unknownCount: number;

  authority: "NONE";
}>;

export function createXviClaimLedger(
  missionId: string,
  claims: readonly XviClaim[],
): XviClaimLedger {
  const normalizedMissionId =
    requireNonEmpty(
      missionId,
      "missionId",
    );

  const ids = claims.map(
    (claim) => claim.claimId,
  );

  if (new Set(ids).size !== ids.length) {
    throw new Error(
      "claim IDs must be unique",
    );
  }

  for (const claim of claims) {
    if (
      claim.missionId !==
      normalizedMissionId
    ) {
      throw new Error(
        `claim ${claim.claimId} belongs to another mission`,
      );
    }
  }

  return Object.freeze({
    missionId: normalizedMissionId,

    claims: Object.freeze([
      ...claims,
    ]),

    verifiedCount: claims.filter(
      (claim) =>
        claim.state === "VERIFIED" ||
        claim.state === "CORROBORATED",
    ).length,

    contestedCount: claims.filter(
      (claim) =>
        claim.state === "CONTESTED",
    ).length,

    unknownCount: claims.filter(
      (claim) =>
        claim.state === "UNKNOWN",
    ).length,

    authority: "NONE",
  });
}
