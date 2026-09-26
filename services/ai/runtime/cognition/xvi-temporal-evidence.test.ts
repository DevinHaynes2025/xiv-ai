import assert from "node:assert/strict";
import test from "node:test";

import {
  createXviClaim,
} from "./xvi-evidence-claim-fabric";

import {
  assessXviTemporalClaim,
  createXviTemporalEvidenceEnvelope,
} from "./xvi-temporal-evidence";

function verifiedClaim() {
  return createXviClaim({
    claimId: "CLAIM-TIME-001",
    missionId: "MISSION-TIME",
    sourceBrain: "DATA",
    statement:
      "Source reported this observation.",
    state: "VERIFIED",
    confidence: 0.95,

    evidenceRefs: [
      {
        evidenceId: "EV-TIME",
        sourceId: "SOURCE-TIME",
        sourceRevision: "REV-12",
      },
    ],

    contradictionRefs: [],
    parentClaimRefs: [],

    authority: "NONE",
  });
}

test("fresh evidence remains fresh", () => {
  const claim = verifiedClaim();

  const temporal =
    createXviTemporalEvidenceEnvelope({
      claimId: claim.claimId,

      observedAt:
        "2026-09-25T10:00:00Z",

      validFrom:
        "2026-09-25T10:00:00Z",

      expiresAt:
        "2026-09-26T10:00:00Z",

      sourceRevision: "REV-12",

      freshnessWindowMs:
        60 * 60 * 1000,

      authority: "NONE",
    });

  const assessment =
    assessXviTemporalClaim({
      claim,
      temporal,
      now:
        "2026-09-25T10:30:00Z",
    });

  assert.equal(
    assessment.state,
    "FRESH",
  );

  assert.equal(
    assessment.requiresRevalidation,
    false,
  );
});

test("evidence becomes stale after freshness window", () => {
  const claim = verifiedClaim();

  const temporal =
    createXviTemporalEvidenceEnvelope({
      claimId: claim.claimId,
      observedAt:
        "2026-09-25T10:00:00Z",
      validFrom:
        "2026-09-25T10:00:00Z",
      expiresAt:
        "2026-09-26T10:00:00Z",
      sourceRevision: "REV-12",
      freshnessWindowMs:
        60 * 60 * 1000,
      authority: "NONE",
    });

  const assessment =
    assessXviTemporalClaim({
      claim,
      temporal,
      now:
        "2026-09-25T12:00:00Z",
    });

  assert.equal(
    assessment.state,
    "STALE",
  );

  assert.equal(
    assessment.requiresRevalidation,
    true,
  );
});

test("expired evidence fails freshness", () => {
  const claim = verifiedClaim();

  const temporal =
    createXviTemporalEvidenceEnvelope({
      claimId: claim.claimId,
      observedAt:
        "2026-09-25T10:00:00Z",
      validFrom:
        "2026-09-25T10:00:00Z",
      expiresAt:
        "2026-09-25T11:00:00Z",
      sourceRevision: "REV-12",
      freshnessWindowMs:
        60 * 60 * 1000,
      authority: "NONE",
    });

  const assessment =
    assessXviTemporalClaim({
      claim,
      temporal,
      now:
        "2026-09-25T11:00:00Z",
    });

  assert.equal(
    assessment.state,
    "EXPIRED",
  );
});

test("future-valid evidence is not yet usable", () => {
  const claim = verifiedClaim();

  const temporal =
    createXviTemporalEvidenceEnvelope({
      claimId: claim.claimId,
      observedAt:
        "2026-09-25T10:00:00Z",
      validFrom:
        "2026-09-25T12:00:00Z",
      expiresAt:
        "2026-09-26T12:00:00Z",
      sourceRevision: "REV-12",
      freshnessWindowMs:
        24 * 60 * 60 * 1000,
      authority: "NONE",
    });

  const assessment =
    assessXviTemporalClaim({
      claim,
      temporal,
      now:
        "2026-09-25T11:00:00Z",
    });

  assert.equal(
    assessment.state,
    "NOT_YET_VALID",
  );
});

test("temporal envelope must match claim", () => {
  const claim = verifiedClaim();

  const temporal =
    createXviTemporalEvidenceEnvelope({
      claimId: "OTHER-CLAIM",
      observedAt:
        "2026-09-25T10:00:00Z",
      validFrom:
        "2026-09-25T10:00:00Z",
      expiresAt:
        "2026-09-26T10:00:00Z",
      sourceRevision: "REV-12",
      freshnessWindowMs:
        60 * 60 * 1000,
      authority: "NONE",
    });

  assert.throws(
    () =>
      assessXviTemporalClaim({
        claim,
        temporal,
        now:
          "2026-09-25T10:30:00Z",
      }),
    /does not match claim/,
  );
});

test("invalid freshness window fails closed", () => {
  assert.throws(
    () =>
      createXviTemporalEvidenceEnvelope({
        claimId: "CLAIM-X",
        observedAt:
          "2026-09-25T10:00:00Z",
        validFrom:
          "2026-09-25T10:00:00Z",
        expiresAt:
          "2026-09-26T10:00:00Z",
        sourceRevision: "REV-X",
        freshnessWindowMs: 0,
        authority: "NONE",
      }),
    /freshnessWindowMs must be a positive safe integer/,
  );
});
