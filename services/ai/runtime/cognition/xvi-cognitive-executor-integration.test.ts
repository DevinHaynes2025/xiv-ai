import assert from "node:assert/strict";
import test from "node:test";

import {
  AgentPolicyGateway,
} from "../offline-team/agent-policy-gateway";

import {
  GatewayExecutor,
} from "../offline-team/gateway-executor";

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

const T0 = 1_000_000_000;

const TOOLS = [
  "doc-retriever",
  "report-writer",
  "sandbox-runner",
  "deploy-tool",
  "delete-tool",
];

function pipeline():
  XviCognitiveMissionPipeline {
  return {
    missionId:
      "MISSION-EXECUTOR-001",

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

function cognitiveCandidate(
  actionClass: string,
  toolId: string,
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

      requestId:
        "executor-review-1",

      tenantId:
        "tenant-1",

      universeId:
        "universe-1",

      actorId:
        "actor-1",

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

      decision: "APPROVED",

      reviewedBy:
        "operator-1",

      reviewedAtMs: T0,
    });

  return adaptXviCapabilityToGateway({
    proposal,
    adoption,

    agentId:
      "xiv-logistics-agent",

    taskId:
      "executor-mission-001",

    toolId,
    actionClass,

    attemptIndex: 0,

    tokenEstimate: 100,
    costEstimate: 1,

    nowMs:
      T0 + 1_000,
  });
}

function runtime() {
  const gateway =
    new AgentPolicyGateway(
      T0,
      "cognitive-gateway-seed-1234567890",
    );

  gateway.declareTools(
    TOOLS,
  );

  gateway.registerAgent({
    agentId:
      "xiv-logistics-agent",

    parentId: null,

    permissions: [
      "CALL_ANALYZE_APPROVED_DATA",
      "CALL_RETRIEVE_DOCUMENTS",
      "CALL_GENERATE_REPORTS",
      "CALL_UPDATE_AGENT_MEMORY",
      "CALL_CREATE_TEST_CASES",
      "CALL_EXECUTE_SANDBOX_TESTS",
      "CALL_RETRY_RECOVERABLE_FAILURES",
      "CALL_DEPLOY_TO_STAGING",
      "CALL_ROLLBACK_FAILED_VERSIONS",
      "CALL_PRODUCTION_DEPLOYMENT",
      "CALL_EXTERNAL_COMMUNICATIONS",
    ],

    budgets: {
      maxToolCalls: 10,
      maxTokens: 10_000,
      maxCostUnits: 100,
      timeLimitMs:
        3_600_000,
    },

    isTemporary: false,

    nowMs: T0,
  });

  const executor =
    new GatewayExecutor(
      gateway,
      T0 + 5_000,
      "cognitive-executor-seed-1234567890",
    );

  return {
    gateway,
    executor,
  };
}

test("cognitive low-risk clearance reaches one execution instruction", () => {
  const {
    gateway,
    executor,
  } = runtime();

  const candidate =
    cognitiveCandidate(
      "RETRIEVE_DOCUMENTS",
      "doc-retriever",
    );

  const decision =
    gateway.evaluateToolCall(
      candidate.request,
    );

  assert.equal(
    decision.kind,
    "AUTO_RUN_CLEARED",
  );

  const instruction =
    executor.executeClearedCall({
      request:
        candidate.request,

      decision,

      executedAtMs:
        T0 + 6_000,
    });

  assert.equal(
    instruction.kind,
    "EXECUTION_INSTRUCTION_ISSUED",
  );

  assert.equal(
    instruction.decisionDigest,
    decision.decisionDigest,
  );

  assert.match(
    instruction.instructionDigest!,
    /^[0-9a-f]{64}$/,
  );

  assert.equal(
    instruction.flags.executesNothing,
    true,
  );

  assert.equal(
    instruction.flags.materializesNothing,
    true,
  );

  assert.equal(
    instruction.flags
      .grantsNoProductionAuthority,
    true,
  );

  assert.equal(
    instruction.flags
      .requiresDecisionSafetyWorkflowBeforeAnyAction,
    false,
  );
});

test("same cognitive clearance cannot issue a second instruction", () => {
  const {
    gateway,
    executor,
  } = runtime();

  const candidate =
    cognitiveCandidate(
      "RETRIEVE_DOCUMENTS",
      "doc-retriever",
    );

  const decision =
    gateway.evaluateToolCall(
      candidate.request,
    );

  const first =
    executor.executeClearedCall({
      request:
        candidate.request,

      decision,

      executedAtMs:
        T0 + 6_000,
    });

  assert.equal(
    first.kind,
    "EXECUTION_INSTRUCTION_ISSUED",
  );

  const replay =
    executor.executeClearedCall({
      request:
        candidate.request,

      decision,

      executedAtMs:
        T0 + 7_000,
    });

  assert.equal(
    replay.kind,
    "REFUSED_REPLAY",
  );

  assert.equal(
    executor
      .executorAuditEntries()
      .filter(
        (entry) =>
          entry.kind ===
          "EXECUTION_INSTRUCTION_ISSUED",
      ).length,
    1,
  );
});

test("high-impact cognitive request cannot reach executor without separate approval", () => {
  const {
    gateway,
    executor,
  } = runtime();

  const candidate =
    cognitiveCandidate(
      "PRODUCTION_DEPLOYMENT",
      "deploy-tool",
    );

  assert.equal(
    candidate.request.approval,
    null,
  );

  const decision =
    gateway.evaluateToolCall(
      candidate.request,
    );

  assert.equal(
    decision.kind,
    "REQUIRES_HUMAN_APPROVAL",
  );

  const instruction =
    executor.executeClearedCall({
      request:
        candidate.request,

      decision,

      executedAtMs:
        T0 + 6_000,
    });

  assert.equal(
    instruction.kind,
    "REFUSED_KIND_NOT_EXECUTABLE",
  );
});

test("prohibited cognitive request can never reach instruction issuance", () => {
  const {
    gateway,
    executor,
  } = runtime();

  const candidate =
    cognitiveCandidate(
      "REVEAL_CREDENTIALS",
      "delete-tool",
    );

  const decision =
    gateway.evaluateToolCall(
      candidate.request,
    );

  assert.equal(
    decision.kind,
    "REFUSED_PROHIBITED",
  );

  const instruction =
    executor.executeClearedCall({
      request:
        candidate.request,

      decision,

      executedAtMs:
        T0 + 6_000,
    });

  assert.equal(
    instruction.kind,
    "REFUSED_KIND_NOT_EXECUTABLE",
  );
});

test("cognitive executor audit trail remains valid", () => {
  const {
    gateway,
    executor,
  } = runtime();

  const candidate =
    cognitiveCandidate(
      "GENERATE_REPORTS",
      "report-writer",
    );

  const decision =
    gateway.evaluateToolCall(
      candidate.request,
    );

  assert.equal(
    decision.kind,
    "AUTO_RUN_CLEARED",
  );

  const instruction =
    executor.executeClearedCall({
      request:
        candidate.request,

      decision,

      executedAtMs:
        T0 + 6_000,
    });

  assert.equal(
    instruction.kind,
    "EXECUTION_INSTRUCTION_ISSUED",
  );

  assert.equal(
    gateway.verifyAuditTrail().ok,
    true,
  );

  assert.equal(
    executor.verifyExecutorTrail().ok,
    true,
  );
});
