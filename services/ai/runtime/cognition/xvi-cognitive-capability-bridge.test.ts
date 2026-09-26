import assert from "node:assert/strict";
import test from "node:test";

import {
  createCapabilitySession,
} from "../offline-team/xvi-capability-contract";

import {
  bridgeXviCognitiveMissionToCapability,
} from "./xvi-cognitive-capability-bridge";

import type {
  XviCognitiveMissionPipeline,
} from "./xvi-cognitive-mission-pipeline";

function pipeline(
  state:
    XviCognitiveMissionPipeline["state"],
): XviCognitiveMissionPipeline {
  return {
    missionId:
      "MISSION-CAPABILITY-001",

    workspace: {} as
      XviCognitiveMissionPipeline["workspace"],

    schedule: {} as
      XviCognitiveMissionPipeline["schedule"],

    resourcePlan: {} as
      XviCognitiveMissionPipeline["resourcePlan"],

    claimLedger: {} as
      XviCognitiveMissionPipeline["claimLedger"],

    temporalAssessments: [],

    state,

    executionPermitted: false,

    authority: "NONE",
  };
}

test("ready cognitive mission becomes offline proposal only", () => {
  const proposal =
    bridgeXviCognitiveMissionToCapability({
      pipeline:
        pipeline(
          "READY_FOR_BOUNDED_EXECUTION",
        ),

      requestId: "request-1",
      tenantId: "tenant-1",
      universeId: "universe-1",
      actorId: "actor-1",

      baseRevision: 0,
      consent: true,
    });

  assert.equal(
    proposal.request.executionMode,
    "OFFLINE_ONLY",
  );

  assert.equal(
    proposal.request.operation,
    "PROPOSE_LOCAL_CHANGE",
  );

  assert.equal(
    proposal.request.targetMode,
    null,
  );

  assert.equal(
    proposal.approvalAttached,
    false,
  );

  assert.equal(
    proposal.executionPermitted,
    false,
  );

  assert.equal(
    proposal.authority,
    "NONE",
  );
});

test("proposal records as pending human review with no execution", () => {
  const session =
    createCapabilitySession(
      "tenant-1",
      "universe-1",
      "actor-1",
    );

  const proposal =
    bridgeXviCognitiveMissionToCapability({
      pipeline:
        pipeline(
          "READY_FOR_BOUNDED_EXECUTION",
        ),

      requestId: "request-2",
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

  assert.equal(
    receipt.outcome,
    "RECORDED",
  );

  assert.equal(
    receipt.reason,
    "PENDING_HUMAN_REVIEW_NO_EXECUTION",
  );

  assert.equal(
    receipt.executed,
    false,
  );

  assert.equal(
    session.snapshot()
      .pendingReviewCount,
    1,
  );
});

test("revalidation-required mission cannot cross bridge", () => {
  assert.throws(
    () =>
      bridgeXviCognitiveMissionToCapability({
        pipeline:
          pipeline(
            "REVALIDATION_REQUIRED",
          ),

        requestId: "request-3",
        tenantId: "tenant-1",
        universeId: "universe-1",
        actorId: "actor-1",

        baseRevision: 0,
        consent: true,
      }),
    /not ready for capability proposal/,
  );
});

test("blocked mission cannot cross bridge", () => {
  assert.throws(
    () =>
      bridgeXviCognitiveMissionToCapability({
        pipeline:
          pipeline("BLOCKED"),

        requestId: "request-4",
        tenantId: "tenant-1",
        universeId: "universe-1",
        actorId: "actor-1",

        baseRevision: 0,
        consent: true,
      }),
    /not ready for capability proposal/,
  );
});

test("missing consent remains visible to capability contract", () => {
  const session =
    createCapabilitySession(
      "tenant-1",
      "universe-1",
      "actor-1",
    );

  const proposal =
    bridgeXviCognitiveMissionToCapability({
      pipeline:
        pipeline(
          "READY_FOR_BOUNDED_EXECUTION",
        ),

      requestId: "request-5",
      tenantId: "tenant-1",
      universeId: "universe-1",
      actorId: "actor-1",

      baseRevision: 0,
      consent: false,
    });

  const receipt =
    session.record(
      JSON.stringify(
        proposal.request,
      ),
    );

  assert.equal(
    receipt.outcome,
    "REFUSED",
  );

  assert.equal(
    receipt.reason,
    "VISIBLE_HUMAN_CONSENT_REQUIRED",
  );
});

test("capability request replay is refused", () => {
  const session =
    createCapabilitySession(
      "tenant-1",
      "universe-1",
      "actor-1",
    );

  const proposal =
    bridgeXviCognitiveMissionToCapability({
      pipeline:
        pipeline(
          "READY_FOR_BOUNDED_EXECUTION",
        ),

      requestId: "request-6",
      tenantId: "tenant-1",
      universeId: "universe-1",
      actorId: "actor-1",

      baseRevision: 0,
      consent: true,
    });

  const serialized =
    JSON.stringify(
      proposal.request,
    );

  const first =
    session.record(serialized);

  assert.equal(
    first.outcome,
    "RECORDED",
  );

  const replay =
    session.record(serialized);

  assert.equal(
    replay.outcome,
    "REFUSED",
  );

  assert.ok(
    replay.reason ===
      "REPLAY_REFUSED" ||
    replay.reason ===
      "STALE_REVISION_REFUSED",
  );
});
