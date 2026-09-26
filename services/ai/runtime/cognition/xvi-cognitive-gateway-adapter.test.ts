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
} from "./xvi-capability-adoption";

import {
  adaptXviCapabilityToGateway,
} from "./xvi-cognitive-gateway-adapter";

import type {
  XviCognitiveMissionPipeline,
} from "./xvi-cognitive-mission-pipeline";

function pipeline():
  XviCognitiveMissionPipeline {
  return {
    missionId:
      "MISSION-GATEWAY-001",

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

function fixture(
  decision:
    "APPROVED" | "REJECTED" =
      "APPROVED",
) {
  const session =
    createCapabilitySession(
      "tenant-1",
      "universe-1",
      "actor-1",
    );

  const proposal =
    bridgeXviCognitiveMissionToCapability({
      pipeline: pipeline(),

      requestId: "gateway-1",
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

  const adoption =
    createXviCapabilityAdoption({
      proposal,

      capabilityReceiptDigest:
        receipt.digest,

      capabilityReceiptOutcome:
        receipt.outcome,

      capabilityReceiptReason:
        receipt.reason,

      decision,

      reviewedBy:
        "operator-1",

      reviewedAtMs:
        1_000,
    });

  return {
    proposal,
    adoption,
  };
}

test("approved adoption becomes gateway candidate with no action approval", () => {
  const {
    proposal,
    adoption,
  } = fixture();

  const candidate =
    adaptXviCapabilityToGateway({
      proposal,
      adoption,

      agentId:
        "xiv-logistics-agent",

      taskId:
        "shipment-review-1042",

      toolId:
        "doc-retriever",

      actionClass:
        "RETRIEVE_DOCUMENTS",

      attemptIndex: 0,

      tokenEstimate: 100,
      costEstimate: 0,

      nowMs: 2_000,
    });

  assert.equal(
    candidate.request.approval,
    null,
  );

  assert.equal(
    candidate.request.auditLogged,
    true,
  );

  assert.equal(
    candidate.approvalAttached,
    false,
  );

  assert.equal(
    candidate.executesNothing,
    true,
  );

  assert.equal(
    candidate
      .grantsNoProductionAuthority,
    true,
  );

  assert.equal(
    candidate.authority,
    "NONE",
  );
});

test("rejected adoption cannot become gateway candidate", () => {
  const {
    proposal,
    adoption,
  } = fixture("REJECTED");

  assert.throws(
    () =>
      adaptXviCapabilityToGateway({
        proposal,
        adoption,

        agentId:
          "xiv-logistics-agent",

        taskId:
          "shipment-review-1042",

        toolId:
          "doc-retriever",

        actionClass:
          "RETRIEVE_DOCUMENTS",

        attemptIndex: 0,

        tokenEstimate: 100,
        costEstimate: 0,

        nowMs: 2_000,
      }),
    /not gateway eligible/,
  );
});

test("gateway adapter cannot manufacture human approval", () => {
  const {
    proposal,
    adoption,
  } = fixture();

  const candidate =
    adaptXviCapabilityToGateway({
      proposal,
      adoption,

      agentId:
        "xiv-agent",

      taskId:
        "production-review",

      toolId:
        "deploy-tool",

      actionClass:
        "PRODUCTION_DEPLOYMENT",

      attemptIndex: 0,

      tokenEstimate: 100,
      costEstimate: 0,

      nowMs: 2_000,
    });

  assert.equal(
    candidate.request.approval,
    null,
  );
});

test("invalid attempt fails closed", () => {
  const {
    proposal,
    adoption,
  } = fixture();

  assert.throws(
    () =>
      adaptXviCapabilityToGateway({
        proposal,
        adoption,

        agentId: "xiv-agent",
        taskId: "task-1",
        toolId: "tool-1",

        actionClass:
          "GENERATE_REPORTS",

        attemptIndex: -1,

        tokenEstimate: 100,
        costEstimate: 0,

        nowMs: 2_000,
      }),
    /attemptIndex must be a non-negative safe integer/,
  );
});
