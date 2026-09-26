import assert from "node:assert/strict";
import test from "node:test";

import type {
  GatewayExecutionRecord,
} from "../offline-team/gateway-executor";

import {
  bridgeXviExecutorInstructionToSafety,
} from "./xvi-cognitive-safety-bridge";

import {
  authorizeXviCognitiveSafety,
} from "./xvi-cognitive-safety-authorization";

function execution(
  actionClass = "RETRIEVE_DOCUMENTS",
  toolId = "doc-retriever",
): GatewayExecutionRecord {
  return Object.freeze({
    kind:
      "EXECUTION_INSTRUCTION_ISSUED",

    agentId:
      "xiv-logistics-agent",

    taskId:
      "task-19",

    toolId,
    actionClass,

    decisionDigest:
      "a".repeat(64),

    instructionDigest:
      "b".repeat(64),

    executedAtMs:
      1_000_000_000,

    reason: null,

    flags: Object.freeze({
      humanDecision:
        "NOT_REQUIRED",

      requiresDecisionSafetyWorkflowBeforeAnyAction:
        false,

      executesNothing: true,

      materializesNothing: true,

      grantsNoProductionAuthority:
        true,
    }),
  });
}

function safety(
  actionClass = "RETRIEVE_DOCUMENTS",
  toolId = "doc-retriever",
  actionPolicy:
    "ADVISE_ONLY" |
    "BOUNDED_AUTOMATION" =
      "BOUNDED_AUTOMATION",
) {
  return bridgeXviExecutorInstructionToSafety({
    execution:
      execution(
        actionClass,
        toolId,
      ),

    identityId:
      "xiv-logistics-agent",

    approvedTools: [
      toolId,
    ],

    dataBoundaries: [
      "approved-data",
    ],

    actionPolicy,

    purpose:
      "Gate 19 governed authorization",

    nowMs:
      1_000_001_000,

    timeLimitMs:
      60_000,
  });
}

test("bounded low-risk automation may receive minimum-action instruction without operator receipt", () => {
  const envelope =
    safety();

  const authorization =
    authorizeXviCognitiveSafety({
      envelope,

      approvedBy:
        "policy-delegation",

      operatorReceiptSha256:
        null,

      nowMs:
        1_000_002_000,
    });

  assert.equal(
    authorization.receiptRequired,
    false,
  );

  assert.equal(
    authorization.instruction.kind,
    "EXECUTION_INSTRUCTION",
  );

  assert.equal(
    authorization.instruction
      .executedByThisRuntime,
    false,
  );

  assert.equal(
    authorization.instruction
      .productionExecutionAllowed,
    false,
  );

  assert.equal(
    authorization.realActionExecuted,
    false,
  );

  assert.equal(
    authorization.authority,
    "NONE",
  );
});

test("production configuration requires receipt-backed authorization", () => {
  const envelope =
    safety(
      "PRODUCTION_DEPLOYMENT",
      "deploy-tool",
    );

  assert.throws(
    () =>
      authorizeXviCognitiveSafety({
        envelope,

        approvedBy:
          "operator-1",

        operatorReceiptSha256:
          null,

        nowMs:
          1_000_002_000,
      }),
    /receipt-backed authorization required/,
  );
});

test("valid high-impact receipt permits minimum-action instruction but no execution", () => {
  const envelope =
    safety(
      "PRODUCTION_DEPLOYMENT",
      "deploy-tool",
    );

  const authorization =
    authorizeXviCognitiveSafety({
      envelope,

      approvedBy:
        "operator-1",

      operatorReceiptSha256:
        "c".repeat(64),

      nowMs:
        1_000_002_000,
    });

  assert.equal(
    authorization.receiptRequired,
    true,
  );

  assert.equal(
    authorization.instruction
      .executedByThisRuntime,
    false,
  );

  assert.equal(
    authorization
      .productionExecutionAllowed,
    false,
  );

  assert.equal(
    authorization.realActionExecuted,
    false,
  );
});

test("advise-only identity requires receipt even for low risk", () => {
  const envelope =
    safety(
      "RETRIEVE_DOCUMENTS",
      "doc-retriever",
      "ADVISE_ONLY",
    );

  assert.throws(
    () =>
      authorizeXviCognitiveSafety({
        envelope,

        approvedBy:
          "operator-1",

        operatorReceiptSha256:
          null,

        nowMs:
          1_000_002_000,
      }),
    /receipt-backed authorization required/,
  );
});

test("malformed receipt fails closed", () => {
  const envelope =
    safety(
      "PRODUCTION_DEPLOYMENT",
      "deploy-tool",
    );

  assert.throws(
    () =>
      authorizeXviCognitiveSafety({
        envelope,

        approvedBy:
          "operator-1",

        operatorReceiptSha256:
          "not-a-receipt",

        nowMs:
          1_000_002_000,
      }),
    /receipt-backed authorization required/,
  );
});
