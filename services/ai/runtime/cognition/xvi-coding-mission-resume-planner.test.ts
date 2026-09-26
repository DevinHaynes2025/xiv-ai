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
  verifyXviCodingMissionResumePlan,
} from "./xvi-coding-mission-resume-planner";

const BASE =
  "752219ed2ab4440b1b3b025daf30c9f10ab5be8c";

const ROLES: readonly XviCodingAgentRole[] = [
  "BUILDER",
  "TESTER",
  "REVIEWER",
  "SECURITY",
];

function createdEnvelope() {
  return createXviCodingMissionController({
    missionId: "gate35-resume-mission",
    baseCommitSha: BASE,

    permittedPaths: [
      "services/ai/runtime/cognition/xvi-coding-mission-resume-planner.ts",
      "services/ai/runtime/cognition/xvi-coding-mission-resume-planner.test.ts",
    ],

    prohibitedPaths: [
      ".git",
    ],

    allowedTestCommands: [
      "gate35:focused",
    ],

    worktreePathForRole: {
      BUILDER: "C:\\xvi\\gate35\\builder",
      TESTER: "C:\\xvi\\gate35\\tester",
      REVIEWER: "C:\\xvi\\gate35\\reviewer",
      SECURITY: "C:\\xvi\\gate35\\security",
    },

    branchForRole: {
      BUILDER: "xvi/agent/gate35-builder",
      TESTER: "xvi/agent/gate35-tester",
      REVIEWER: "xvi/agent/gate35-reviewer",
      SECURITY: "xvi/agent/gate35-security",
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
      "services/ai/runtime/cognition/xvi-coding-mission-resume-planner.ts",
    ],

    testCommands: [
      "gate35:focused",
    ],

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

    testCommands: [
      "gate35:focused",
    ],

    testPassed: true,

    findings: [
      "security-block",
    ],

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
                "services/ai/runtime/cognition/xvi-coding-mission-resume-planner.ts",
              ]
            : [],

        testCommands: [
          "gate35:focused",
        ],

        testPassed: true,
        findings: [],
        submittedAtMs: 1100 + index,
        currentHeadSha: BASE,
      });
  }

  return reconcileXviCodingMissionController(envelope);
}

test("CREATED maps only to ACTIVATE", () => {
  const envelope = createdEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  assert.equal(plan.sourceState, "CREATED");
  assert.equal(plan.action, "ACTIVATE");
  assert.equal(plan.evidenceCount, 0);
  assert.equal(plan.missingEvidenceCount, 4);

  assert.equal(
    verifyXviCodingMissionResumePlan({
      envelope,
      plan,
    }),
    true,
  );
});

test("ACTIVE maps only to COLLECT_EVIDENCE", () => {
  const envelope = activeEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  assert.equal(plan.sourceState, "ACTIVE");
  assert.equal(plan.action, "COLLECT_EVIDENCE");

  assert.equal(
    verifyXviCodingMissionResumePlan({
      envelope,
      plan,
    }),
    true,
  );
});

test("EVIDENCE_PENDING maps only to COLLECT_MISSING_EVIDENCE", () => {
  const envelope = pendingEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  assert.equal(
    plan.sourceState,
    "EVIDENCE_PENDING",
  );

  assert.equal(
    plan.action,
    "COLLECT_MISSING_EVIDENCE",
  );

  assert.equal(plan.evidenceCount, 1);
  assert.equal(plan.missingEvidenceCount, 3);
});

test("BLOCKED remains blocked", () => {
  const envelope = blockedEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  assert.equal(plan.sourceState, "BLOCKED");
  assert.equal(plan.action, "REMAIN_BLOCKED");

  assert.equal(plan.automaticMergeAllowed, false);
  assert.equal(plan.automaticPushAllowed, false);
  assert.equal(plan.automaticDeployAllowed, false);
});

test("READY_FOR_HUMAN_REVIEW maps only to AWAIT_HUMAN_APPROVAL", () => {
  const envelope = readyEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  assert.equal(
    envelope.state,
    "READY_FOR_HUMAN_REVIEW",
  );

  assert.equal(
    plan.action,
    "AWAIT_HUMAN_APPROVAL",
  );

  assert.equal(plan.humanApprovalRequired, true);
  assert.equal(plan.automaticMergeAllowed, false);
  assert.equal(plan.automaticPushAllowed, false);
  assert.equal(plan.automaticDeployAllowed, false);
  assert.equal(plan.credentialAccessAllowed, false);
  assert.equal(plan.networkAllowed, false);
  assert.equal(plan.productionMutationAllowed, false);
});

test("resume plan binds exact persisted envelope digest", () => {
  const envelope = pendingEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  const changedEnvelope = {
    ...envelope,
    envelopeDigest:
      "a".repeat(64),
  };

  assert.throws(
    () =>
      verifyXviCodingMissionResumePlan({
        envelope:
          changedEnvelope as typeof envelope,
        plan,
      }),
    /source binding mismatch|digest mismatch/,
  );
});

test("tampered resume authority is refused", () => {
  const envelope = readyEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  const tampered = {
    ...plan,
    automaticMergeAllowed: true,
  };

  assert.throws(
    () =>
      verifyXviCodingMissionResumePlan({
        envelope,
        plan:
          tampered as unknown as typeof plan,
      }),
    /authority violation/,
  );
});

test("tampered resume decision is refused", () => {
  const envelope = blockedEnvelope();
  const plan = createXviCodingMissionResumePlan(envelope);

  const tampered = {
    ...plan,
    action: "ACTIVATE",
  };

  assert.throws(
    () =>
      verifyXviCodingMissionResumePlan({
        envelope,
        plan:
          tampered as unknown as typeof plan,
      }),
    /resume decision mismatch/,
  );
});