import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createXviCodingAgentAssignment, createXviCodingAgentEvidence } from "./xvi-coding-agent-contract";
import {
  activateXviCodingWorktree, createXviCodingWorktreeRecord,
  markXviCodingWorktreeReadyForHumanReview, submitXviCodingEvidence,
  verifyXviCodingWorktree,
} from "./xvi-coding-worktree-lifecycle";
import { XviCodingAssignmentLedger } from "./xvi-coding-assignment-ledger";

const SHA = "a".repeat(40);
const assignment = () => createXviCodingAgentAssignment({
  taskId: "gate30.builder", role: "BUILDER", baseCommitSha: SHA,
  worktreeId: "gate30.builder", permittedPaths: ["services/ai/runtime/cognition"],
  maxAttempts: 2,
});

test("lifecycle reaches human review with no integration authority", () => {
  const a = assignment();
  let r = activateXviCodingWorktree({ record: createXviCodingWorktreeRecord(a), nowMs: 1000 });
  const e = createXviCodingAgentEvidence({
    assignment: a, changedPaths: ["services/ai/runtime/cognition/example.ts"],
    testPassed: true, submittedAtMs: 1100,
  });
  r = submitXviCodingEvidence({ record: r, evidence: e, currentHeadSha: SHA });
  r = verifyXviCodingWorktree({ record: r, accepted: true, blockingFindings: [] });
  r = markXviCodingWorktreeReadyForHumanReview(r);
  assert.equal(r.state, "READY_FOR_HUMAN_REVIEW");
  assert.equal(r.automaticMergeAllowed, false);
  assert.equal(r.automaticPushAllowed, false);
  assert.equal(r.automaticDeployAllowed, false);
});

test("stale base blocks verification", () => {
  const a = assignment();
  let r = activateXviCodingWorktree({ record: createXviCodingWorktreeRecord(a), nowMs: 1000 });
  const e = createXviCodingAgentEvidence({ assignment: a, testPassed: true, submittedAtMs: 1100 });
  r = submitXviCodingEvidence({ record: r, evidence: e, currentHeadSha: "b".repeat(40) });
  r = verifyXviCodingWorktree({ record: r, accepted: true, blockingFindings: [] });
  assert.equal(r.state, "BLOCKED");
  assert.equal(r.staleBase, true);
});

test("active worktree cannot be activated twice", () => {
  const first = activateXviCodingWorktree({
    record: createXviCodingWorktreeRecord(assignment()), nowMs: 1000,
  });
  assert.throws(() => activateXviCodingWorktree({ record: first, nowMs: 1100 }), /only CREATED/);
});

test("ledger persists active assignment across restart", () => {
  const dir = mkdtempSync(join(tmpdir(), "xvi-gate30-"));
  const path = join(dir, "assignments.sqlite");
  try {
    XviCodingAssignmentLedger.initialize(path);
    const first = new XviCodingAssignmentLedger(path);
    first.put(activateXviCodingWorktree({
      record: createXviCodingWorktreeRecord(assignment()), nowMs: 1000,
    }));
    first.close();
    const reopened = new XviCodingAssignmentLedger(path);
    try {
      const loaded = reopened.read("gate30.builder");
      assert.equal(loaded?.state, "ACTIVE");
      assert.equal(loaded?.attemptsUsed, 1);
      assert.equal(loaded?.baseCommitSha, SHA);
    } finally { reopened.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("ledger refuses worktree identity change", () => {
  const dir = mkdtempSync(join(tmpdir(), "xvi-gate30-"));
  const path = join(dir, "assignments.sqlite");
  try {
    XviCodingAssignmentLedger.initialize(path);
    const ledger = new XviCodingAssignmentLedger(path);
    try {
      const original = createXviCodingWorktreeRecord(assignment());
      ledger.put(original);
      assert.throws(() => ledger.put({ ...original, worktreeId: "different.worktree" }),
        /cannot change worktree identity/);
    } finally { ledger.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("ledger refuses decreasing attempt counter", () => {
  const dir = mkdtempSync(join(tmpdir(), "xvi-gate30-"));
  const path = join(dir, "assignments.sqlite");
  try {
    XviCodingAssignmentLedger.initialize(path);
    const ledger = new XviCodingAssignmentLedger(path);
    try {
      const active = activateXviCodingWorktree({
        record: createXviCodingWorktreeRecord(assignment()), nowMs: 1000,
      });
      ledger.put(active);
      assert.throws(() => ledger.put({ ...active, attemptsUsed: 0 }),
        /attempt counter cannot decrease/);
    } finally { ledger.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("ledger initialization refuses overwrite", () => {
  const dir = mkdtempSync(join(tmpdir(), "xvi-gate30-"));
  const path = join(dir, "assignments.sqlite");
  try {
    XviCodingAssignmentLedger.initialize(path);
    assert.throws(() => XviCodingAssignmentLedger.initialize(path));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
