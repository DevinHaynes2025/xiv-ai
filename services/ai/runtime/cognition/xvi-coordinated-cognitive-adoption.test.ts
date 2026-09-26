import assert from "node:assert/strict";
import test from "node:test";

import {
  mkdtempSync,
  rmSync,
} from "node:fs";

import {
  join,
} from "node:path";

import {
  tmpdir,
} from "node:os";

import {
  canonicalizeXviInstructionAdoptionRecord,
  digestXviInstructionAdoptionRecord,
} from "./xvi-coordinated-cognitive-adoption";

import {
  XviDurableAdoptionCoordinator,
} from "./xvi-durable-adoption-coordinator";

import type {
  InstructionAdoptionRecord,
} from "../offline-team/instruction-adoption-gate";

function record(
  overrides:
    Partial<InstructionAdoptionRecord> = {},
): InstructionAdoptionRecord {
  return Object.freeze({
    kind:
      "INSTRUCTION_ADOPTION_RECORD",

    tenantId:
      "tenant.alpha",

    universeId:
      "universe.alpha-main",

    storyId:
      "12D-222",

    storyIdIsAnUnverifiedCallerAssertion:
      true,

    sourceRevision:
      "d".repeat(40),

    instructionId:
      "workflow-24:scaling.exec.0123456789abcdef.2",

    workflowId:
      "workflow-24",

    actionId:
      "scaling.exec.0123456789abcdef.2",

    instructionDigest:
      "a".repeat(64),

    cellPlanDigest:
      "b".repeat(64),

    cellAdoptionDigest:
      "c".repeat(64),

    eventPlaneDigest:
      "e".repeat(64),

    bindingDigest:
      "f".repeat(64),

    operatorReceiptSha256:
      "1".repeat(64),

    policyVersion:
      "12d-222-v1",

    adoptedAtMs:
      1_000,

    expiresAtMs:
      2_000,

    trafficMoved:
      false,

    authorizedTrafficBps:
      0,

    executionStarted:
      false,

    productionMutationAllowed:
      false,

    realCellsProvisioned:
      0,

    databasesProvisioned:
      0,

    rowsMoved:
      0,

    guardrails:
      Object.freeze({
        executesNothing:
          true,
      }) as InstructionAdoptionRecord["guardrails"],

    humanDecision:
      "REQUIRED",

    learningPromoted:
      false,

    modelCalls:
      0,

    remoteCalls:
      0,

    billionUsersProven:
      false,

    automaticRecovery:
      false,

    ...overrides,
  });
}

test(
  "adoption record canonicalization is deterministic",
  () => {
    const first =
      canonicalizeXviInstructionAdoptionRecord(
        record(),
      );

    const second =
      canonicalizeXviInstructionAdoptionRecord(
        record(),
      );

    assert.equal(
      first,
      second,
    );

    assert.equal(
      digestXviInstructionAdoptionRecord(
        record(),
      ),
      digestXviInstructionAdoptionRecord(
        record(),
      ),
    );
  },
);

test(
  "changing a bound adoption field changes the digest",
  () => {
    const first =
      digestXviInstructionAdoptionRecord(
        record(),
      );

    const second =
      digestXviInstructionAdoptionRecord(
        record({
          bindingDigest:
            "2".repeat(64),
        }),
      );

    assert.notEqual(
      first,
      second,
    );
  },
);

test(
  "story assertion is explicitly bound into canonical record",
  () => {
    const canonical =
      canonicalizeXviInstructionAdoptionRecord(
        record(),
      );

    assert.match(
      canonical,
      /storyIdIsAnUnverifiedCallerAssertion:4:true/,
    );
  },
);

test(
  "non-executing structural values are required",
  () => {
    assert.throws(
      () =>
        canonicalizeXviInstructionAdoptionRecord(
          record({
            executionStarted:
              true as false,
          }),
        ),
      /adoption record authority invariant violated/,
    );

    assert.throws(
      () =>
        canonicalizeXviInstructionAdoptionRecord(
          record({
            productionMutationAllowed:
              true as false,
          }),
        ),
      /adoption record authority invariant violated/,
    );
  },
);

test(
  "canonical record digest may be durably committed by coordinator",
  () => {
    const dir =
      mkdtempSync(
        join(
          tmpdir(),
          "xvi-gate24-",
        ),
      );

    const path =
      join(
        dir,
        "coordinator.sqlite",
      );

    try {
      XviDurableAdoptionCoordinator
        .initialize(path);

      const coordinator =
        new XviDurableAdoptionCoordinator(
          path,
        );

      try {
        const replayKey =
          "9".repeat(64);

        const reservation =
          coordinator.reserve(
            replayKey,
            1_000,
          );

        const adoptionRecord =
          record();

        const canonical =
          canonicalizeXviInstructionAdoptionRecord(
            adoptionRecord,
          );

        const expectedDigest =
          digestXviInstructionAdoptionRecord(
            adoptionRecord,
          );

        const committed =
          coordinator.commit({
            replayKey,
            reservationId:
              reservation.reservationId,
            adoptionRecordCanonicalJson:
              canonical,
            nowMs:
              2_000,
          });

        assert.equal(
          committed.state,
          "COMMITTED",
        );

        assert.equal(
          committed.adoptionRecordDigest,
          expectedDigest,
        );

        assert.equal(
          committed.executesNothing,
          true,
        );

        assert.equal(
          committed.productionAuthority,
          false,
        );
      } finally {
        coordinator.close();
      }
    } finally {
      rmSync(
        dir,
        {
          recursive: true,
          force: true,
        },
      );
    }
  },
);
