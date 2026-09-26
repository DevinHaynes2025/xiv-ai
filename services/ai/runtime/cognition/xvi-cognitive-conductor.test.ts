import assert from "node:assert/strict";
import test from "node:test";

import {
  routeXviCognitiveMission,
} from "./xvi-cognitive-conductor";

test("routes business mission to business model", () => {
  const route = routeXviCognitiveMission({
    missionId: "MISSION-001",
    objective: "Analyze operations",
    primaryBrain: "BUSINESS",
    risk: "LOW",
    budget: {
      maxModelCalls: 4,
      maxAgentSteps: 8,
      maxRuntimeMs: 5000,
    },
  });

  assert.equal(
    route.model.modelFamily,
    "XVI_BUSINESS_MODEL",
  );

  assert.equal(
    route.quantumExecution,
    "NOT_REQUESTED",
  );

  assert.equal(
    route.verificationRequired,
    true,
  );

  assert.equal(
    route.executionPermitted,
    false,
  );

  assert.equal(
    route.authority,
    "NONE",
  );
});

test("routes simulated optimization through Q-Core", () => {
  const route = routeXviCognitiveMission({
    missionId: "MISSION-002",
    objective: "Simulate route optimization",
    primaryBrain: "SIMULATION",
    risk: "MEDIUM",
    qCore: "Q_OPTIMIZATION",
    requestedQuantumExecution:
      "QUANTUM_SIMULATED",
    budget: {
      maxModelCalls: 6,
      maxAgentSteps: 12,
      maxRuntimeMs: 10000,
    },
  });

  assert.equal(
    route.qCore?.id,
    "Q_OPTIMIZATION",
  );

  assert.equal(
    route.quantumExecution,
    "QUANTUM_SIMULATED",
  );
});

test("high-risk missions require security review", () => {
  const route = routeXviCognitiveMission({
    missionId: "MISSION-003",
    objective: "Review security-sensitive architecture",
    primaryBrain: "SECURITY",
    risk: "HIGH",
    budget: {
      maxModelCalls: 3,
      maxAgentSteps: 5,
      maxRuntimeMs: 4000,
    },
  });

  assert.equal(
    route.securityReviewRequired,
    true,
  );
});

test("quantum execution requires Q-Core", () => {
  assert.throws(
    () =>
      routeXviCognitiveMission({
        missionId: "MISSION-004",
        objective: "Invalid quantum route",
        primaryBrain: "SCIENTIFIC",
        risk: "LOW",
        requestedQuantumExecution:
          "QUANTUM_SIMULATED",
        budget: {
          maxModelCalls: 2,
          maxAgentSteps: 2,
          maxRuntimeMs: 1000,
        },
      }),
    /quantum execution requires a Q-Core/,
  );
});

test("Q-Core requires explicit execution class", () => {
  assert.throws(
    () =>
      routeXviCognitiveMission({
        missionId: "MISSION-005",
        objective: "Incomplete quantum route",
        primaryBrain: "SCIENTIFIC",
        risk: "LOW",
        qCore: "Q_SCIENTIFIC_DISCOVERY",
        budget: {
          maxModelCalls: 2,
          maxAgentSteps: 2,
          maxRuntimeMs: 1000,
        },
      }),
    /Q-Core requires an explicit quantum execution class/,
  );
});

test("cannot claim verified QPU without hardware evidence", () => {
  assert.throws(
    () =>
      routeXviCognitiveMission({
        missionId: "MISSION-006",
        objective: "Attempt QPU execution",
        primaryBrain: "SCIENTIFIC",
        risk: "HIGH",
        qCore: "Q_SCIENTIFIC_DISCOVERY",
        requestedQuantumExecution:
          "QPU_VERIFIED",
        budget: {
          maxModelCalls: 2,
          maxAgentSteps: 2,
          maxRuntimeMs: 1000,
        },
      }),
    /QPU_VERIFIED execution unavailable/,
  );
});

test("invalid resource budget fails closed", () => {
  assert.throws(
    () =>
      routeXviCognitiveMission({
        missionId: "MISSION-007",
        objective: "Invalid budget",
        primaryBrain: "REASONING",
        risk: "LOW",
        budget: {
          maxModelCalls: 0,
          maxAgentSteps: 1,
          maxRuntimeMs: 1000,
        },
      }),
    /maxModelCalls must be a positive safe integer/,
  );
});
