import assert from "node:assert/strict";
import test from "node:test";

import {
  createXviClaim,
} from "./xvi-evidence-claim-fabric";

import {
  createXviClaimRelation,
  evaluateXviClaimPromotion,
} from "./xvi-claim-promotion";

test("evidence-backed inference may be promoted after verification", () => {
  const claim = createXviClaim({
    claimId: "CLAIM-001",
    missionId: "MISSION-001",
    sourceBrain: "REASONING",
    statement:
      "Observed evidence supports the conclusion.",
    state: "INFERRED",
    confidence: 0.8,
    evidenceRefs: [
      {
        evidenceId: "EV-001",
        sourceId: "SRC-001",
        sourceRevision: "REV-1",
      },
    ],
    contradictionRefs: [],
    parentClaimRefs: [],
    authority: "NONE",
  });

  const receipt =
    evaluateXviClaimPromotion({
      claim,
      requestedState: "VERIFIED",
      relations: [],
      verificationApproved: true,
    });

  assert.equal(
    receipt.decision,
    "PROMOTED",
  );

  assert.equal(
    receipt.authority,
    "NONE",
  );
});

test("model repetition without evidence cannot become verified", () => {
  const claim = createXviClaim({
    claimId: "CLAIM-002",
    missionId: "MISSION-001",
    sourceBrain: "REASONING",
    statement:
      "Repeated model output.",
    state: "INFERRED",
    confidence: 0.7,
    evidenceRefs: [],
    contradictionRefs: [],
    parentClaimRefs: [],
    authority: "NONE",
  });

  const receipt =
    evaluateXviClaimPromotion({
      claim,
      requestedState: "VERIFIED",
      relations: [],
      verificationApproved: true,
    });

  assert.equal(
    receipt.decision,
    "BLOCKED",
  );

  assert.match(
    receipt.reasons.join(" "),
    /requires evidence/,
  );
});

test("verification approval is required for verified promotion", () => {
  const claim = createXviClaim({
    claimId: "CLAIM-003",
    missionId: "MISSION-001",
    sourceBrain: "DATA",
    statement:
      "Evidence exists but verification is pending.",
    state: "OBSERVED",
    confidence: 0.9,
    evidenceRefs: [
      {
        evidenceId: "EV-003",
        sourceId: "SRC-003",
        sourceRevision: "1",
      },
    ],
    contradictionRefs: [],
    parentClaimRefs: [],
    authority: "NONE",
  });

  const receipt =
    evaluateXviClaimPromotion({
      claim,
      requestedState: "VERIFIED",
      relations: [],
      verificationApproved: false,
    });

  assert.equal(
    receipt.decision,
    "BLOCKED",
  );

  assert.match(
    receipt.reasons.join(" "),
    /verification approval/,
  );
});

test("contradiction blocks verified promotion", () => {
  const claim = createXviClaim({
    claimId: "CLAIM-A",
    missionId: "MISSION-001",
    sourceBrain: "DATA",
    statement:
      "Claim A.",
    state: "OBSERVED",
    confidence: 0.9,
    evidenceRefs: [
      {
        evidenceId: "EV-A",
        sourceId: "SRC-A",
        sourceRevision: "1",
      },
    ],
    contradictionRefs: [],
    parentClaimRefs: [],
    authority: "NONE",
  });

  const relation =
    createXviClaimRelation({
      relationId: "REL-1",
      fromClaimId: "CLAIM-B",
      toClaimId: "CLAIM-A",
      type: "CONTRADICTS",
    });

  const receipt =
    evaluateXviClaimPromotion({
      claim,
      requestedState: "VERIFIED",
      relations: [relation],
      verificationApproved: true,
    });

  assert.equal(
    receipt.decision,
    "BLOCKED",
  );

  assert.match(
    receipt.reasons.join(" "),
    /unresolved contradiction/,
  );
});

test("corroboration requires two independent sources", () => {
  const claim = createXviClaim({
    claimId: "CLAIM-004",
    missionId: "MISSION-001",
    sourceBrain: "KNOWLEDGE",
    statement:
      "Single-source claim.",
    state: "OBSERVED",
    confidence: 0.8,
    evidenceRefs: [
      {
        evidenceId: "EV-1",
        sourceId: "SRC-1",
        sourceRevision: "1",
      },
    ],
    contradictionRefs: [],
    parentClaimRefs: [],
    authority: "NONE",
  });

  const receipt =
    evaluateXviClaimPromotion({
      claim,
      requestedState:
        "CORROBORATED",
      relations: [],
      verificationApproved: false,
    });

  assert.equal(
    receipt.decision,
    "BLOCKED",
  );

  assert.match(
    receipt.reasons.join(" "),
    /two independent sources/,
  );
});

test("two independent sources allow corroboration", () => {
  const claim = createXviClaim({
    claimId: "CLAIM-005",
    missionId: "MISSION-001",
    sourceBrain: "KNOWLEDGE",
    statement:
      "Multi-source claim.",
    state: "OBSERVED",
    confidence: 0.9,
    evidenceRefs: [
      {
        evidenceId: "EV-1",
        sourceId: "SRC-1",
        sourceRevision: "1",
      },
      {
        evidenceId: "EV-2",
        sourceId: "SRC-2",
        sourceRevision: "4",
      },
    ],
    contradictionRefs: [],
    parentClaimRefs: [],
    authority: "NONE",
  });

  const receipt =
    evaluateXviClaimPromotion({
      claim,
      requestedState:
        "CORROBORATED",
      relations: [],
      verificationApproved: false,
    });

  assert.equal(
    receipt.decision,
    "PROMOTED",
  );
});

test("claim relation cannot self-reference", () => {
  assert.throws(
    () =>
      createXviClaimRelation({
        relationId: "REL-X",
        fromClaimId: "CLAIM-X",
        toClaimId: "CLAIM-X",
        type: "SUPPORTS",
      }),
    /cannot reference itself/,
  );
});
