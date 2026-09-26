import assert from "node:assert/strict";
import test from "node:test";

import type {
  GatewayExecutionRecord,
} from "../offline-team/gateway-executor";

import {
  bridgeXviExecutorInstructionToSafety,
} from "./xvi-cognitive-safety-bridge";

function instruction(
  actionClass = "RETRIEVE_DOCUMENTS",
  toolId = "doc-retriever",
): GatewayExecutionRecord {
  return Object.freeze({
    kind: "EXECUTION_INSTRUCTION_ISSUED",

    agentId: "xiv-logistics-agent",
    taskId: "task-18",

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
      humanDecision: "NOT_REQUIRED",

      requiresDecisionSafetyWorkflowBeforeAnyAction:
        false,

      executesNothing: true,
      materializesNothing: true,

      grantsNoProductionAuthority:
        true,
    }),
  });
}

function bridge(
  execution:
    GatewayExecutionRecord,
) {
  return bridgeXviExecutorInstructionToSafety({
    execution,

    identityId:
      "xiv-logistics-agent",

    approvedTools: [
      execution.toolId,
    ],

    dataBoundaries: [
      "approved-data",
    ],

    actionPolicy:
      "BOUNDED_AUTOMATION",

    purpose:
      "Govern cognitive instruction",

    nowMs:
      1_000_001_000,

    timeLimitMs:
      60_000,
  });
}

test("low-risk instruction becomes governed proposal and stops at risk check", () => {
  const envelope =
    bridge(
      instruction(),
    );

  assert.equal(
    envelope.riskClass,
    "LOW_RISK",
  );

  assert.equal(
    envelope.workflow.stage,
    "RISK_CHECK",
  );

  assert.equal(
    envelope.proposal.kind,
    "GOVERNED_ACTION_PROPOSAL",
  );

  assert.equal(
    envelope.proposal.productionExecutionAllowed,
    false,
  );

  assert.equal(
    envelope.authorized,
    false,
  );

  assert.equal(
    envelope.executesNothing,
    true,
  );

  assert.equal(
    envelope.grantsNoProductionAuthority,
    true,
  );

  assert.equal(
    envelope.authority,
    "NONE",
  );
});

test("production deployment maps to production configuration risk", () => {
  const envelope =
    bridge(
      instruction(
        "PRODUCTION_DEPLOYMENT",
        "deploy-tool",
      ),
    );

  assert.equal(
    envelope.riskClass,
    "PRODUCTION_CONFIGURATION",
  );

  assert.equal(
    envelope.workflow.stage,
    "RISK_CHECK",
  );

  assert.equal(
    envelope.authorized,
    false,
  );
});

test("tool outside admitted safety scope fails closed", () => {
  assert.throws(
    () =>
      bridgeXviExecutorInstructionToSafety({
        execution:
          instruction(),

        identityId:
          "xiv-logistics-agent",

        approvedTools: [
          "report-writer",
        ],

        dataBoundaries: [
          "approved-data",
        ],

        actionPolicy:
          "BOUNDED_AUTOMATION",

        purpose:
          "Govern documents",

        nowMs:
          1_000_001_000,

        timeLimitMs:
          60_000,
      }),
    /outside the agent's approved scope/,
  );
});

test("unknown action cannot silently downgrade to low risk", () => {
  assert.throws(
    () =>
      bridge(
        instruction(
          "UNKNOWN_FUTURE_ACTION",
          "doc-retriever",
        ),
      ),
    /no safety-risk mapping/,
  );
});

test("refused executor record cannot enter safety workflow", () => {
  const refused:
    GatewayExecutionRecord =
      Object.freeze({
        ...instruction(),

        kind:
          "REFUSED_REPLAY",

        instructionDigest: null,

        reason: "replay",
      });

  assert.throws(
    () =>
      bridge(refused),
    /only an issued gateway instruction/,
  );
});
