import assert from "node:assert/strict";
import test from "node:test";

import {
  createCapabilitySession,
} from "../offline-team/xvi-capability-contract";

import {
  bridgeXviCognitiveMissionToCapability,
} from "./xvi-cognitive-capability-bridge";

import {
  createXviCapabilityAdoption,
  verifyXviCapabilityAdoption,
} from "./xvi-capability-adoption";

import type {
  XviCognitiveMissionPipeline,
} from "./xvi-cognitive-mission-pipeline";

function pipeline():
  XviCognitiveMissionPipeline {
  return {
    missionId:
      "MISSION-ADOPT-001",

    workspace: {} as
      XviCognitiveMissionPipeline["workspace"],

    schedule: {} as
      XviCognitiveMissionPipeline["schedule"],

    resourcePlan: {} as
      XviCognitiveMissionPipeline["resourcePlan"],

    claimLedger: {} as
      XviCognitiveMissionPipeline["claimLedger"],

    temporalAssessments: [],

    state:
      "READY_FOR_BOUNDED_EXECUTION",

    executionPermitted: false,

    authority: "NONE",
  };
}

function fixture() {
  const session =
    createCapabilitySession(
      "tenant-1",
      "universe-1",
      "actor-1",
    );

  const proposal =
    bridgeXviCognitiveMissionToCapability({
      pipeline: pipeline(),

      requestId: "review-1",
      tenantId: "tenant-1",
      universeId: "universe-1",
      actorId: "actor-1",

      baseRevision: 0,
      consent: true,
    });

  const receipt =
    session.record(
      JSON.stringify(
        proposal.request,
      ),
    );

  return {
    proposal,
    receipt,
  };
}

test("approved review creates gateway-eligible adoption but executes nothing", () => {
  const {
    proposal,
    receipt,
  } = fixture();

  const adoption =
    createXviCapabilityAdoption({
      proposal,

      capabilityReceiptDigest:
        receipt.digest,

      capabilityReceiptOutcome:
        receipt.outcome,

      capabilityReceiptReason:
        receipt.reason,

      decision: "APPROVED",

      reviewedBy:
        "operator-1",

      reviewedAtMs:
        1_000,
    });

  assert.equal(
    adoption.gatewayEligible,
    true,
  );

  assert.equal(
    adoption.executesNothing,
    true,
  );

  assert.equal(
    adoption.grantsNoProductionAuthority,
    true,
  );

  assert.equal(
    adoption.authority,
    "NONE",
  );

  assert.match(
    adoption.adoptionDigest,
    /^[0-9a-f]{64}$/,
  );
});

test("rejected review is not gateway eligible", () => {
  const {
    proposal,
    receipt,
  } = fixture();

  const adoption =
    createXviCapabilityAdoption({
      proposal,

      capabilityReceiptDigest:
        receipt.digest,

      capabilityReceiptOutcome:
        receipt.outcome,

      capabilityReceiptReason:
        receipt.reason,

      decision: "REJECTED",

      reviewedBy:
        "operator-1",

      reviewedAtMs:
        1_000,
    });

  assert.equal(
    adoption.gatewayEligible,
    false,
  );
});

test("refused capability receipt cannot be adopted", () => {
  const {
    proposal,
    receipt,
  } = fixture();

  assert.throws(
    () =>
      createXviCapabilityAdoption({
        proposal,

        capabilityReceiptDigest:
          receipt.digest,

        capabilityReceiptOutcome:
          "REFUSED",

        capabilityReceiptReason:
          "VISIBLE_HUMAN_CONSENT_REQUIRED",

        decision:
          "APPROVED",

        reviewedBy:
          "operator-1",

        reviewedAtMs:
          1_000,
      }),
    /only a pending recorded capability proposal may be reviewed/,
  );
});

test("adoption verifies against exact proposal", () => {
  const {
    proposal,
    receipt,
  } = fixture();

  const adoption =
    createXviCapabilityAdoption({
      proposal,

      capabilityReceiptDigest:
        receipt.digest,

      capabilityReceiptOutcome:
        receipt.outcome,

      capabilityReceiptReason:
        receipt.reason,

      decision:
        "APPROVED",

      reviewedBy:
        "operator-1",

      reviewedAtMs:
        1_000,
    });

  const verified =
    verifyXviCapabilityAdoption({
      proposal,
      adoption,
    });

  assert.equal(
    verified.ok,
    true,
  );

  assert.equal(
    verified.gatewayEligible,
    true,
  );
});

test("tampered adoption digest fails closed", () => {
  const {
    proposal,
    receipt,
  } = fixture();

  const adoption =
    createXviCapabilityAdoption({
      proposal,

      capabilityReceiptDigest:
        receipt.digest,

      capabilityReceiptOutcome:
        receipt.outcome,

      capabilityReceiptReason:
        receipt.reason,

      decision:
        "APPROVED",

      reviewedBy:
        "operator-1",

      reviewedAtMs:
        1_000,
    });

  assert.throws(
    () =>
      verifyXviCapabilityAdoption({
        proposal,

        adoption: {
          ...adoption,
          adoptionDigest:
            "0".repeat(64),
        },
      }),
    /adoption digest mismatch/,
  );
});
