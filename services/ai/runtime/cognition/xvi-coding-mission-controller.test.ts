import assert from "node:assert/strict";
import test from "node:test";

import {
  activateXviCodingMissionController,
  createXviCodingMissionController,
  reconcileXviCodingMissionController,
  submitXviCodingMissionRoleEvidence,
} from "./xvi-coding-mission-controller";
import type { XviCodingAgentRole } from "./xvi-coding-agent-contract";

const BASE = "483a433e576bd93e5e4b6236b248c04ed5e7331d";

const ROLES: readonly XviCodingAgentRole[] =
  ["BUILDER", "TESTER", "REVIEWER", "SECURITY"];

function createController() {
  return createXviCodingMissionController({
    missionId: "gate33-controller",
    baseCommitSha: BASE,
    permittedPaths: [
      "services/ai/runtime/cognition/xvi-coding-mission-controller.ts",
      "services/ai/runtime/cognition/xvi-coding-mission-controller.test.ts",
    ],
    prohibitedPaths: [".git"],
    allowedTestCommands: ["gate33:focused"],
    worktreePathForRole: {
      BUILDER: "C:\\xvi\\gate33\\builder",
      TESTER: "C:\\xvi\\gate33\\tester",
      REVIEWER: "C:\\xvi\\gate33\\reviewer",
      SECURITY: "C:\\xvi\\gate33\\security",
    },
    branchForRole: {
      BUILDER: "xvi/agent/gate33-builder",
      TESTER: "xvi/agent/gate33-tester",
      REVIEWER: "xvi/agent/gate33-reviewer",
      SECURITY: "xvi/agent/gate33-security",
    },
  });
}

test("controller creates four bounded role records and eight read-only Git plans", () => {
  const controller = createController();

  assert.equal(controller.state, "CREATED");
  assert.equal(controller.worktrees.length, 4);
  assert.equal(controller.gitPlans.length, 8);
  assert.equal(controller.humanApprovalRequired, true);
  assert.equal(controller.automaticMergeAllowed, false);
  assert.equal(controller.automaticPushAllowed, false);
  assert.equal(controller.automaticDeployAllowed, false);
  assert.equal(controller.credentialAccessAllowed, false);
  assert.equal(controller.productionMutationAllowed, false);

  for (const plan of controller.gitPlans) {
    assert.equal(plan.readOnly, true);
    assert.equal(plan.networkAllowed, false);
    assert.equal(plan.remoteMutationAllowed, false);
  }
});

test("activation consumes one bounded attempt for every role", () => {
  const active = activateXviCodingMissionController({
    envelope: createController(),
    nowMs: 1000,
  });

  assert.equal(active.state, "ACTIVE");
  assert.deepEqual(
    active.worktrees.map(record => record.attemptsUsed),
    [1, 1, 1, 1],
  );
});

test("clean four-role evidence reaches human review only", () => {
  let envelope = activateXviCodingMissionController({
    envelope: createController(),
    nowMs: 1000,
  });

  for (const [index, role] of ROLES.entries()) {
    envelope = submitXviCodingMissionRoleEvidence({
      envelope,
      role,
      changedPaths:
        role === "BUILDER"
          ? ["services/ai/runtime/cognition/xvi-coding-mission-controller.ts"]
          : [],
      testCommands: ["gate33:focused"],
      testPassed: true,
      findings: [],
      submittedAtMs: 2000 + index,
      currentHeadSha: BASE,
    });
  }

  const ready = reconcileXviCodingMissionController(envelope);

  assert.equal(ready.state, "READY_FOR_HUMAN_REVIEW");
  assert.equal(ready.mission.integrationReady, true);
  assert.equal(ready.humanApprovalRequired, true);
  assert.equal(ready.automaticMergeAllowed, false);
  assert.equal(ready.automaticPushAllowed, false);
  assert.equal(ready.automaticDeployAllowed, false);

  for (const record of ready.worktrees) {
    assert.equal(record.state, "READY_FOR_HUMAN_REVIEW");
  }
});

test("security finding blocks the mission", () => {
  let envelope = activateXviCodingMissionController({
    envelope: createController(),
    nowMs: 1000,
  });

  envelope = submitXviCodingMissionRoleEvidence({
    envelope,
    role: "SECURITY",
    testCommands: ["gate33:focused"],
    testPassed: true,
    findings: ["blocking-security-finding"],
    submittedAtMs: 2000,
    currentHeadSha: BASE,
  });

  assert.equal(envelope.state, "BLOCKED");
});

test("stale role HEAD blocks the mission", () => {
  let envelope = activateXviCodingMissionController({
    envelope: createController(),
    nowMs: 1000,
  });

  envelope = submitXviCodingMissionRoleEvidence({
    envelope,
    role: "TESTER",
    testCommands: ["gate33:focused"],
    testPassed: true,
    findings: [],
    submittedAtMs: 2000,
    currentHeadSha: "a".repeat(40),
  });

  assert.equal(envelope.state, "BLOCKED");
});

test("non-builder cannot submit changed paths through controller", () => {
  const active = activateXviCodingMissionController({
    envelope: createController(),
    nowMs: 1000,
  });

  assert.throws(
    () =>
      submitXviCodingMissionRoleEvidence({
        envelope: active,
        role: "REVIEWER",
        changedPaths: [
          "services/ai/runtime/cognition/xvi-coding-mission-controller.ts",
        ],
        testCommands: ["gate33:focused"],
        testPassed: true,
        findings: [],
        submittedAtMs: 2000,
        currentHeadSha: BASE,
      }),
    /non-builder agent cannot submit repository changes/,
  );
});

test("duplicate role evidence is refused", () => {
  let envelope = activateXviCodingMissionController({
    envelope: createController(),
    nowMs: 1000,
  });

  envelope = submitXviCodingMissionRoleEvidence({
    envelope,
    role: "BUILDER",
    testCommands: ["gate33:focused"],
    testPassed: true,
    findings: [],
    submittedAtMs: 2000,
    currentHeadSha: BASE,
  });

  assert.throws(
    () =>
      submitXviCodingMissionRoleEvidence({
        envelope,
        role: "BUILDER",
        testCommands: ["gate33:focused"],
        testPassed: true,
        findings: [],
        submittedAtMs: 2001,
        currentHeadSha: BASE,
      }),
    /duplicate evidence/,
  );
});

test("reconciliation refuses incomplete evidence", () => {
  const active = activateXviCodingMissionController({
    envelope: createController(),
    nowMs: 1000,
  });

  assert.throws(
    () => reconcileXviCodingMissionController(active),
    /all four role evidence records are required/,
  );
});

test("controller envelope digest changes with mission state", () => {
  const created = createController();
  const active = activateXviCodingMissionController({
    envelope: created,
    nowMs: 1000,
  });

  assert.match(created.envelopeDigest, /^[0-9a-f]{64}$/);
  assert.match(active.envelopeDigest, /^[0-9a-f]{64}$/);
  assert.notEqual(created.envelopeDigest, active.envelopeDigest);
});
