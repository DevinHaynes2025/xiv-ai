import type {
  XviClaim,
} from "./xvi-evidence-claim-fabric";

export type XviTemporalEvidenceEnvelope = Readonly<{
  claimId: string;

  observedAt: string;
  validFrom: string;
  expiresAt: string;

  sourceRevision: string;

  freshnessWindowMs: number;

  authority: "NONE";
}>;

export type XviTemporalClaimState =
  | "FRESH"
  | "NOT_YET_VALID"
  | "STALE"
  | "EXPIRED";

export type XviTemporalAssessment = Readonly<{
  claimId: string;
  state: XviTemporalClaimState;

  ageMs: number;

  requiresRevalidation: boolean;

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

function parseTimestamp(
  value: string,
  field: string,
): number {
  const parsed = Date.parse(
    requireNonEmpty(value, field),
  );

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `${field} must be a valid timestamp`,
    );
  }

  return parsed;
}

export function createXviTemporalEvidenceEnvelope(
  input: XviTemporalEvidenceEnvelope,
): XviTemporalEvidenceEnvelope {
  const observedAt = parseTimestamp(
    input.observedAt,
    "observedAt",
  );

  const validFrom = parseTimestamp(
    input.validFrom,
    "validFrom",
  );

  const expiresAt = parseTimestamp(
    input.expiresAt,
    "expiresAt",
  );

  if (
    !Number.isSafeInteger(
      input.freshnessWindowMs,
    ) ||
    input.freshnessWindowMs < 1
  ) {
    throw new Error(
      "freshnessWindowMs must be a positive safe integer",
    );
  }

  if (expiresAt <= validFrom) {
    throw new Error(
      "expiresAt must be after validFrom",
    );
  }

  if (observedAt > expiresAt) {
    throw new Error(
      "observedAt cannot be after expiresAt",
    );
  }

  return Object.freeze({
    claimId: requireNonEmpty(
      input.claimId,
      "claimId",
    ),

    observedAt: input.observedAt,
    validFrom: input.validFrom,
    expiresAt: input.expiresAt,

    sourceRevision: requireNonEmpty(
      input.sourceRevision,
      "sourceRevision",
    ),

    freshnessWindowMs:
      input.freshnessWindowMs,

    authority: "NONE",
  });
}

export function assessXviTemporalClaim(input: {
  claim: XviClaim;
  temporal: XviTemporalEvidenceEnvelope;
  now: string;
}): XviTemporalAssessment {
  if (
    input.claim.claimId !==
    input.temporal.claimId
  ) {
    throw new Error(
      "temporal envelope does not match claim",
    );
  }

  const now = parseTimestamp(
    input.now,
    "now",
  );

  const observedAt = parseTimestamp(
    input.temporal.observedAt,
    "observedAt",
  );

  const validFrom = parseTimestamp(
    input.temporal.validFrom,
    "validFrom",
  );

  const expiresAt = parseTimestamp(
    input.temporal.expiresAt,
    "expiresAt",
  );

  const ageMs = Math.max(
    0,
    now - observedAt,
  );

  let state: XviTemporalClaimState;

  if (now < validFrom) {
    state = "NOT_YET_VALID";
  } else if (now >= expiresAt) {
    state = "EXPIRED";
  } else if (
    ageMs >
    input.temporal.freshnessWindowMs
  ) {
    state = "STALE";
  } else {
    state = "FRESH";
  }

  return Object.freeze({
    claimId: input.claim.claimId,
    state,
    ageMs,

    requiresRevalidation:
      state !== "FRESH",

    authority: "NONE",
  });
}
