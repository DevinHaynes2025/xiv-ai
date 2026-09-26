import assert from "node:assert/strict";
import test from "node:test";

import type {
  XviCodingAgentRole,
} from "./xvi-coding-agent-contract";

import {
  activateXviCodingMissionController,
  createXviCodingMissionController,
  reconcileXviCodingMissionController,
  submitXviCodingMissionRoleEvidence,
} from "./xvi-coding-mission-controller";

import {
  createXviCodingMissionResumePlan,
} from "./xvi-coding-mission-resume-planner";

import {
  executeXviCodingMissionResumePlan,
} from "./xvi-coding-mission-resume-executor";

const BASE =
  "2b1d387d2a25c3db7aee3ec7b9ede033b4f82078";

const ROLES: readonly XviCodingAgentRole[] = [
  "BUILDER",
  "TESTER",
  "REVIEWER",
  "SECURITY",
];

function createdEnvelope() {
  return createXviCodingMissionController({
    missionId: "gate36-resume-executor",
    baseCommitSha: BASE,

    permittedPaths: [
      "services/ai/runtime/cognition/xvi-coding-mission-resume-executor.ts",
      "services/ai/runtime/cognition/xvi-coding-mission-resume-executor.test.ts",
    ],

    prohibitedPaths: [".git"],

    allowedTestCommands: [
      "gate36:focused",
    ],

    worktreePathForRole: {
      BUILDER: "C:\\xvi\\gate36\\builder",
      TESTER: "C:\\xvi\\gate36\\tester",
      REVIEWER: "C:\\xvi\\gate36\\reviewer",
      SECURITY: "C:\\xvi\\gate36\\security",
    },

    branchForRole: {
      BUILDER: "xvi/agent/gate36-builder",
      TESTER: "xvi/agent/gate36-tester",
      REVIEWER: "xvi/agent/gate36-reviewer",
      SECURITY: "xvi/agent/gate36-security",
    },
  });
}

function activeEnvelope() {
  return activateXviCodingMissionController({
    envelope: createdEnvelope(),
    nowMs: 1000,
  });
}

function pendingEnvelope() {
  return submitXviCodingMissionRoleEvidence({
    envelope: activeEnvelope(),
    role: "BUILDER",
    changedPaths: [
      "services/ai/runtime/cognition/xvi-coding-mission-resume-executor.ts",
    ],
    testCommands: ["gate36:focused"],
    testPassed: true,
    findings: [],
    submittedAtMs: 1100,
    currentHeadSha: BASE,
  });
}

function blockedEnvelope() {
  return submitXviCodingMissionRoleEvidence({
    envelope: activeEnvelope(),
    role: "SECURITY",
    changedPaths: [],
    testCommands: ["gate36:focused"],
    testPassed: true,
    findings: ["security-block"],
    submittedAtMs: 1100,
    currentHeadSha: BASE,
  });
}

function readyEnvelope() {
  let envelope = activeEnvelope();

  for (const [index, role] of ROLES.entries()) {
    envelope =
      submitXviCodingMissionRoleEvidence({
        envelope,
        role,
        changedPaths:
          role === "BUILDER"
            ? [
                "services/ai/runtime/cognition/xvi-coding-mission-resume-executor.ts",
              ]
            : [],
        testCommands: ["gate36:focused"],
        testPassed: true,
        findings: [],
        submittedAtMs: 1100 + index,
        currentHeadSha: BASE,
      });
  }

  return reconcileXviCodingMissionController(envelope);
}

test("ACTIVATE is the only resume action that mutates controller state", () => {
  const envelope = createdEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  const result =
    executeXviCodingMissionResumePlan({
      envelope,
      plan,
      nowMs: 2000,
    });

  assert.equal(result.disposition, "ACTIVATED");
  assert.equal(result.stateMutated, true);
  assert.equal(envelope.state, "CREATED");
  assert.equal(result.envelope.state, "ACTIVE");
});

test("COLLECT_EVIDENCE returns instruction and leaves envelope unchanged", () => {
  const envelope = activeEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  const result =
    executeXviCodingMissionResumePlan({
      envelope,
      plan,
      nowMs: 2000,
    });

  assert.equal(
    result.disposition,
    "COLLECT_EVIDENCE_REQUIRED",
  );

  assert.equal(result.stateMutated, false);
  assert.strictEqual(result.envelope, envelope);
});

test("COLLECT_MISSING_EVIDENCE preserves exact missing evidence count", () => {
  const envelope = pendingEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  const result =
    executeXviCodingMissionResumePlan({
      envelope,
      plan,
      nowMs: 2000,
    });

  assert.equal(
    result.disposition,
    "COLLECT_MISSING_EVIDENCE_REQUIRED",
  );

  assert.equal(result.missingEvidenceCount, 3);
  assert.equal(result.stateMutated, false);
  assert.strictEqual(result.envelope, envelope);
});

test("BLOCKED is a strict no-op", () => {
  const envelope = blockedEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  const result =
    executeXviCodingMissionResumePlan({
      envelope,
      plan,
      nowMs: 2000,
    });

  assert.equal(result.disposition, "BLOCKED_NO_OP");
  assert.equal(result.stateMutated, false);
  assert.strictEqual(result.envelope, envelope);
  assert.equal(result.envelope.state, "BLOCKED");
});

test("AWAIT_HUMAN_APPROVAL is a strict no-op", () => {
  const envelope = readyEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  const result =
    executeXviCodingMissionResumePlan({
      envelope,
      plan,
      nowMs: 2000,
    });

  assert.equal(
    result.disposition,
    "HUMAN_APPROVAL_REQUIRED",
  );

  assert.equal(result.stateMutated, false);
  assert.strictEqual(result.envelope, envelope);

  assert.equal(
    result.envelope.state,
    "READY_FOR_HUMAN_REVIEW",
  );
});

test("tampered planner authority is refused before execution", () => {
  const envelope = readyEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  const tampered = {
    ...plan,
    automaticMergeAllowed: true,
  };

  assert.throws(
    () =>
      executeXviCodingMissionResumePlan({
        envelope,
        plan: tampered as unknown as typeof plan,
        nowMs: 2000,
      }),
    /authority violation/,
  );
});

test("tampered planner action is refused before execution", () => {
  const envelope = blockedEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  const tampered = {
    ...plan,
    action: "ACTIVATE",
  };

  assert.throws(
    () =>
      executeXviCodingMissionResumePlan({
        envelope,
        plan: tampered as unknown as typeof plan,
        nowMs: 2000,
      }),
    /resume decision mismatch/,
  );
});

test("invalid execution timestamp fails closed", () => {
  const envelope = createdEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  assert.throws(
    () =>
      executeXviCodingMissionResumePlan({
        envelope,
        plan,
        nowMs: -1,
      }),
    /invalid execution timestamp/,
  );
});

test("every execution result denies external authority", () => {
  const envelope = readyEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  const result =
    executeXviCodingMissionResumePlan({
      envelope,
      plan,
      nowMs: 2000,
    });

  assert.equal(result.humanApprovalRequired, true);
  assert.equal(result.automaticMergeAllowed, false);
  assert.equal(result.automaticPushAllowed, false);
  assert.equal(result.automaticDeployAllowed, false);
  assert.equal(result.credentialAccessAllowed, false);
  assert.equal(result.networkAllowed, false);
  assert.equal(result.productionMutationAllowed, false);

  assert.equal(
    result.arbitraryCommandExecutionAllowed,
    false,
  );
});

test("result digest binds exact source envelope and verified plan", () => {
  const envelope = activeEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  const first =
    executeXviCodingMissionResumePlan({
      envelope,
      plan,
      nowMs: 2000,
    });

  const second =
    executeXviCodingMissionResumePlan({
      envelope,
      plan,
      nowMs: 3000,
    });

  assert.equal(
    first.sourceEnvelopeDigest,
    envelope.envelopeDigest,
  );

  assert.equal(
    first.sourcePlanDigest,
    plan.planDigest,
  );

  assert.equal(
    first.resultDigest,
    second.resultDigest,
  );
});