import assert from "node:assert/strict";
import test from "node:test";

import {
  AgentPolicyGateway,
} from "../offline-team/agent-policy-gateway";

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
      "MISSION-POLICY-001",

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

function createApprovedAdoption() {
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
        "policy-review-1",

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

      decision:
        "APPROVED",

      reviewedBy:
        "operator-1",

      reviewedAtMs:
        T0,
    });

  return {
    proposal,
    adoption,
  };
}

function createGateway() {
  const gateway =
    new AgentPolicyGateway(
      T0,
      "xvi-cognitive-policy-gate",
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

  return gateway;
}

function candidate(
  actionClass: string,
  toolId: string,
) {
  const {
    proposal,
    adoption,
  } = createApprovedAdoption();

  return adaptXviCapabilityToGateway({
    proposal,
    adoption,

    agentId:
      "xiv-logistics-agent",

    taskId:
      "mission-policy-001",

    toolId,

    actionClass,

    attemptIndex: 0,

    tokenEstimate: 100,

    costEstimate: 1,

    nowMs:
      T0 + 1_000,
  });
}

test("low-risk cognitive proposal reaches real gateway and is policy-cleared only", () => {
  const gateway =
    createGateway();

  const gatewayCandidate =
    candidate(
      "RETRIEVE_DOCUMENTS",
      "doc-retriever",
    );

  const decision =
    gateway.evaluateToolCall(
      gatewayCandidate.request,
    );

  assert.equal(
    decision.kind,
    "AUTO_RUN_CLEARED",
  );

  assert.equal(
    decision.flags.executesNothing,
    true,
  );

  assert.equal(
    decision.flags
      .grantsNoProductionAuthority,
    true,
  );

  assert.equal(
    decision.flags.humanDecision,
    "NOT_REQUIRED",
  );

  assert.match(
    decision.decisionDigest,
    /^[0-9a-f]{64}$/,
  );
});

test("production deployment pauses for separate human approval", () => {
  const gateway =
    createGateway();

  const gatewayCandidate =
    candidate(
      "PRODUCTION_DEPLOYMENT",
      "deploy-tool",
    );

  assert.equal(
    gatewayCandidate
      .request.approval,
    null,
  );

  const decision =
    gateway.evaluateToolCall(
      gatewayCandidate.request,
    );

  assert.equal(
    decision.kind,
    "REQUIRES_HUMAN_APPROVAL",
  );

  assert.equal(
    decision.flags.humanDecision,
    "REQUIRED",
  );

  assert.equal(
    decision.flags.executesNothing,
    true,
  );

  assert.equal(
    decision.flags
      .grantsNoProductionAuthority,
    true,
  );
});

test("prohibited cognitive proposal remains prohibited", () => {
  const gateway =
    createGateway();

  const gatewayCandidate =
    candidate(
      "REVEAL_CREDENTIALS",
      "delete-tool",
    );

  const decision =
    gateway.evaluateToolCall(
      gatewayCandidate.request,
    );

  assert.equal(
    decision.kind,
    "REFUSED_PROHIBITED",
  );

  assert.equal(
    decision.flags.executesNothing,
    true,
  );

  assert.equal(
    decision.flags
      .grantsNoProductionAuthority,
    true,
  );
});

test("unregistered cognitive tool fails closed", () => {
  const gateway =
    createGateway();

  const gatewayCandidate =
    candidate(
      "RETRIEVE_DOCUMENTS",
      "shadow-tool",
    );

  const decision =
    gateway.evaluateToolCall(
      gatewayCandidate.request,
    );

  assert.equal(
    decision.kind,
    "REFUSED_UNREGISTERED_TOOL",
  );
});

test("adapter review does not substitute for high-impact action approval", () => {
  const gateway =
    createGateway();

  const gatewayCandidate =
    candidate(
      "PRODUCTION_DEPLOYMENT",
      "deploy-tool",
    );

  assert.equal(
    gatewayCandidate
      .approvalAttached,
    false,
  );

  assert.equal(
    gatewayCandidate
      .request.approval,
    null,
  );

  const decision =
    gateway.evaluateToolCall(
      gatewayCandidate.request,
    );

  assert.equal(
    decision.kind,
    "REQUIRES_HUMAN_APPROVAL",
  );
});
