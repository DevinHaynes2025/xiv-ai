import assert from "node:assert/strict";
import test from "node:test";

import {
  createXviClaim,
  createXviClaimLedger,
} from "./xvi-evidence-claim-fabric";

test("creates evidence-backed verified claim", () => {
  const claim = createXviClaim({
    claimId: "CLAIM-001",
    missionId: "MISSION-001",
    sourceBrain: "DATA",
    statement:
      "Dataset row count matches source manifest.",
    state: "VERIFIED",
    confidence: 0.99,
    evidenceRefs: [
      {
        evidenceId: "EVIDENCE-001",
        sourceId: "DATASET-A",
        sourceRevision: "REV-7",
      },
    ],
    contradictionRefs: [],
    parentClaimRefs: [],
    authority: "NONE",
  });

  assert.equal(
    claim.state,
    "VERIFIED",
  );

  assert.equal(
    claim.evidenceRefs.length,
    1,
  );

  assert.equal(
    claim.authority,
    "NONE",
  );
});

test("verified claim without evidence fails closed", () => {
  assert.throws(
    () =>
      createXviClaim({
        claimId: "CLAIM-002",
        missionId: "MISSION-001",
        sourceBrain: "REASONING",
        statement:
          "Unsupported verified statement.",
        state: "VERIFIED",
        confidence: 0.9,
        evidenceRefs: [],
        contradictionRefs: [],
        parentClaimRefs: [],
        authority: "NONE",
      }),
    /VERIFIED claim requires evidence/,
  );
});

test("observed claim requires evidence", () => {
  assert.throws(
    () =>
      createXviClaim({
        claimId: "CLAIM-003",
        missionId: "MISSION-001",
        sourceBrain: "DATA",
        statement:
          "Observation without source.",
        state: "OBSERVED",
        confidence: 0.8,
        evidenceRefs: [],
        contradictionRefs: [],
        parentClaimRefs: [],
        authority: "NONE",
      }),
    /OBSERVED claim requires evidence/,
  );
});

test("unknown claim requires zero confidence", () => {
  assert.throws(
    () =>
      createXviClaim({
        claimId: "CLAIM-004",
        missionId: "MISSION-001",
        sourceBrain: "REASONING",
        statement:
          "Unknown outcome.",
        state: "UNKNOWN",
        confidence: 0.5,
        evidenceRefs: [],
        contradictionRefs: [],
        parentClaimRefs: [],
        authority: "NONE",
      }),
    /UNKNOWN claim must have zero confidence/,
  );
});

test("confidence must stay between zero and one", () => {
  assert.throws(
    () =>
      createXviClaim({
        claimId: "CLAIM-005",
        missionId: "MISSION-001",
        sourceBrain: "SIMULATION",
        statement:
          "Invalid confidence.",
        state: "SIMULATED",
        confidence: 1.5,
        evidenceRefs: [],
        contradictionRefs: [],
        parentClaimRefs: [],
        authority: "NONE",
      }),
    /confidence must be between 0 and 1/,
  );
});

test("ledger counts epistemic states", () => {
  const verified = createXviClaim({
    claimId: "CLAIM-V",
    missionId: "MISSION-L",
    sourceBrain: "VERIFICATION",
    statement: "Verified.",
    state: "VERIFIED",
    confidence: 1,
    evidenceRefs: [
      {
        evidenceId: "EV-V",
        sourceId: "SRC-V",
        sourceRevision: "1",
      },
    ],
    contradictionRefs: [],
    parentClaimRefs: [],
    authority: "NONE",
  });

  const contested = createXviClaim({
    claimId: "CLAIM-C",
    missionId: "MISSION-L",
    sourceBrain: "REASONING",
    statement: "Contested.",
    state: "CONTESTED",
    confidence: 0.5,
    evidenceRefs: [],
    contradictionRefs: ["CLAIM-V"],
    parentClaimRefs: [],
    authority: "NONE",
  });

  const unknown = createXviClaim({
    claimId: "CLAIM-U",
    missionId: "MISSION-L",
    sourceBrain: "KNOWLEDGE",
    statement: "Unknown.",
    state: "UNKNOWN",
    confidence: 0,
    evidenceRefs: [],
    contradictionRefs: [],
    parentClaimRefs: [],
    authority: "NONE",
  });

  const ledger =
    createXviClaimLedger(
      "MISSION-L",
      [
        verified,
        contested,
        unknown,
      ],
    );

  assert.equal(
    ledger.verifiedCount,
    1,
  );

  assert.equal(
    ledger.contestedCount,
    1,
  );

  assert.equal(
    ledger.unknownCount,
    1,
  );

  assert.equal(
    ledger.authority,
    "NONE",
  );
});

test("cross-mission claim fails closed", () => {
  const claim = createXviClaim({
    claimId: "CLAIM-X",
    missionId: "MISSION-B",
    sourceBrain: "DATA",
    statement: "Cross mission.",
    state: "INFERRED",
    confidence: 0.4,
    evidenceRefs: [],
    contradictionRefs: [],
    parentClaimRefs: [],
    authority: "NONE",
  });

  assert.throws(
    () =>
      createXviClaimLedger(
        "MISSION-A",
        [claim],
      ),
    /belongs to another mission/,
  );
});
