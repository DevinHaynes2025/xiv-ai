import assert from "node:assert/strict";
import test from "node:test";
import {
  createXviCodingAgentAssignment,
  createXviCodingAgentEvidence,
} from "./xvi-coding-agent-contract";
import {
  assessXviCodingMission,
  createXviCodingMission,
} from "./xvi-coding-agent-orchestrator";

const SHA = "a".repeat(40);
const TEST = "npm.cmd exec -- tsx --test runtime/cognition/example.test.ts";

test("builder is bounded and receives no integration authority", () => {
  const assignment = createXviCodingAgentAssignment({
    taskId: "mission.builder", role: "BUILDER", baseCommitSha: SHA,
    worktreeId: "mission.builder",
    permittedPaths: ["services/ai/runtime/cognition"],
    prohibitedPaths: ["services/ai/runtime/cognition/secrets"],
    allowedTestCommands: [TEST],
  });
  const evidence = createXviCodingAgentEvidence({
    assignment,
    changedPaths: ["services/ai/runtime/cognition/example.ts"],
    testCommands: [TEST], testPassed: true, submittedAtMs: 1000,
  });
  assert.equal(assignment.repositoryWriteAllowed, true);
  assert.equal(assignment.mergeAllowed, false);
  assert.equal(assignment.pushAllowed, false);
  assert.equal(assignment.deployAllowed, false);
  assert.equal(assignment.credentialAccessAllowed, false);
  assert.match(evidence.evidenceDigest, /^[0-9a-f]{64}$/);
});

test("builder cannot escape permitted paths", () => {
  const assignment = createXviCodingAgentAssignment({
    taskId: "mission.builder", role: "BUILDER", baseCommitSha: SHA,
    worktreeId: "mission.builder", permittedPaths: ["services/ai/runtime/cognition"],
  });
  assert.throws(() => createXviCodingAgentEvidence({
    assignment, changedPaths: ["services/web/example.ts"],
    testPassed: true, submittedAtMs: 1000,
  }), /outside assignment/);
});

test("prohibited path overrides permitted parent", () => {
  const assignment = createXviCodingAgentAssignment({
    taskId: "mission.builder", role: "BUILDER", baseCommitSha: SHA,
    worktreeId: "mission.builder", permittedPaths: ["services/ai/runtime/cognition"],
    prohibitedPaths: ["services/ai/runtime/cognition/secrets"],
  });
  assert.throws(() => createXviCodingAgentEvidence({
    assignment, changedPaths: ["services/ai/runtime/cognition/secrets/key.ts"],
    testPassed: true, submittedAtMs: 1000,
  }), /outside assignment/);
});

test("non-builder cannot submit repository changes", () => {
  const assignment = createXviCodingAgentAssignment({
    taskId: "mission.security", role: "SECURITY", baseCommitSha: SHA,
    worktreeId: "mission.security", permittedPaths: ["services/ai/runtime/cognition"],
  });
  assert.throws(() => createXviCodingAgentEvidence({
    assignment, changedPaths: ["services/ai/runtime/cognition/example.ts"],
    testPassed: true, submittedAtMs: 1000,
  }), /non-builder/);
});

test("test command must be allowlisted", () => {
  const assignment = createXviCodingAgentAssignment({
    taskId: "mission.tester", role: "TESTER", baseCommitSha: SHA,
    worktreeId: "mission.tester", permittedPaths: ["services/ai/runtime/cognition"],
    allowedTestCommands: [TEST],
  });
  assert.throws(() => createXviCodingAgentEvidence({
    assignment, testCommands: ["npm.cmd run deploy"],
    testPassed: true, submittedAtMs: 1000,
  }), /outside allowlist/);
});

test("mission creates four isolated roles", () => {
  const mission = createXviCodingMission({
    missionId: "mission29", baseCommitSha: SHA,
    permittedPaths: ["services/ai/runtime/cognition"], allowedTestCommands: [TEST],
  });
  assert.deepEqual(mission.assignments.map(a => a.role),
    ["BUILDER", "TESTER", "REVIEWER", "SECURITY"]);
  assert.equal(new Set(mission.assignments.map(a => a.worktreeId)).size, 4);
  assert.equal(mission.integrationReady, false);
});

test("clean four-role evidence reaches human review only", () => {
  const mission = createXviCodingMission({
    missionId: "mission29", baseCommitSha: SHA,
    permittedPaths: ["services/ai/runtime/cognition"], allowedTestCommands: [TEST],
  });
  const evidence = mission.assignments.map((assignment, index) =>
    createXviCodingAgentEvidence({
      assignment,
      changedPaths: assignment.role === "BUILDER"
        ? ["services/ai/runtime/cognition/example.ts"] : [],
      testCommands: assignment.role === "TESTER" ? [TEST] : [],
      testPassed: true, findings: [], submittedAtMs: 1000 + index,
    }),
  );
  const result = assessXviCodingMission({ mission, evidence });
  assert.equal(result.integrationReady, true);
  assert.equal(result.humanApprovalRequired, true);
  assert.equal(result.automaticMergeAllowed, false);
  assert.equal(result.automaticPushAllowed, false);
  assert.equal(result.automaticDeployAllowed, false);
});

test("security finding blocks integration readiness", () => {
  const mission = createXviCodingMission({
    missionId: "mission29", baseCommitSha: SHA,
    permittedPaths: ["services/ai/runtime/cognition"],
  });
  const evidence = mission.assignments.map((assignment, index) =>
    createXviCodingAgentEvidence({
      assignment, testPassed: true,
      findings: assignment.role === "SECURITY" ? ["unresolved security finding"] : [],
      submittedAtMs: 1000 + index,
    }),
  );
  assert.equal(assessXviCodingMission({ mission, evidence }).integrationReady, false);
});

test("base commit mismatch fails closed", () => {
  const mission = createXviCodingMission({
    missionId: "mission29", baseCommitSha: SHA,
    permittedPaths: ["services/ai/runtime/cognition"],
  });
  const assignment = mission.assignments[0];
  if (!assignment) throw new Error("assignment missing");
  const evidence = createXviCodingAgentEvidence({
    assignment, testPassed: true, submittedAtMs: 1000,
  });
  const tampered = { ...evidence, baseCommitSha: "b".repeat(40) };
  assert.throws(() => assessXviCodingMission({
    mission, evidence: [tampered],
  }), /base commit mismatch/);
});
