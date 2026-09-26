import assert from "node:assert/strict";
import test from "node:test";

import {
  assertXviGitObservedIdentity,
  createXviGitOperationPlan,
  verifyXviGitOperationPlan,
  type XviGitWorktreeIdentity,
} from "./xvi-git-worktree-adapter";

const BASE =
  "eae6d04ada33ea18c1a5d0b7e936bdbd7b8f27d2";

const IDENTITY: Readonly<XviGitWorktreeIdentity> =
  Object.freeze({
    worktreeId: "gate32-builder",
    worktreePath:
      "C:\\Users\\Devin\\xvi-agent-worktrees\\gate32-builder",
    branch: "xvi/agent/gate32-builder",
    baseCommitSha: BASE,
  });

test("status plan is fixed, read-only, and authority-free", () => {
  const plan =
    createXviGitOperationPlan({
      identity: IDENTITY,
      operation: "STATUS_SHORT",
    });

  assert.deepEqual(
    plan.args,
    ["status", "--short"],
  );

  assert.equal(plan.executable, "git");
  assert.equal(plan.readOnly, true);
  assert.equal(plan.networkAllowed, false);
  assert.equal(plan.credentialAccessAllowed, false);
  assert.equal(plan.remoteMutationAllowed, false);
  assert.equal(plan.mergeAllowed, false);
  assert.equal(plan.pushAllowed, false);
  assert.equal(plan.deployAllowed, false);
  assert.equal(plan.destructiveResetAllowed, false);
  assert.match(plan.planDigest, /^[0-9a-f]{64}$/);
  assert.equal(verifyXviGitOperationPlan(plan), true);
});

test("all four operations have exact fixed command shapes", () => {
  const cases = [
    ["STATUS_SHORT", ["status", "--short"]],
    ["REV_PARSE_HEAD", ["rev-parse", "HEAD"]],
    ["DIFF_NAME_ONLY", ["diff", "--name-only"]],
    [
      "WORKTREE_LIST_PORCELAIN",
      ["worktree", "list", "--porcelain"],
    ],
  ] as const;

  for (const [operation, expected] of cases) {
    const plan =
      createXviGitOperationPlan({
        identity: IDENTITY,
        operation,
      });

    assert.deepEqual(plan.args, expected);
    assert.equal(
      verifyXviGitOperationPlan(plan),
      true,
    );
  }
});

test("arbitrary command text cannot enter the planner", () => {
  assert.throws(
    () =>
      createXviGitOperationPlan({
        identity: IDENTITY,
        operation: "push" as never,
      }),
    /not allowlisted/,
  );
});

test("tampering fixed args into push is refused", () => {
  const plan =
    createXviGitOperationPlan({
      identity: IDENTITY,
      operation: "STATUS_SHORT",
    });

  assert.throws(
    () =>
      verifyXviGitOperationPlan({
        ...plan,
        args: ["push", "origin", "main"],
      }),
    /command shape/,
  );
});

test("tampering authority flags is refused", () => {
  const plan =
    createXviGitOperationPlan({
      identity: IDENTITY,
      operation: "REV_PARSE_HEAD",
    });

  assert.throws(
    () =>
      verifyXviGitOperationPlan({
        ...plan,
        pushAllowed: true as never,
      }),
    /authority flags/,
  );
});

test("tampering plan digest is refused", () => {
  const plan =
    createXviGitOperationPlan({
      identity: IDENTITY,
      operation: "DIFF_NAME_ONLY",
    });

  assert.throws(
    () =>
      verifyXviGitOperationPlan({
        ...plan,
        planDigest: "0".repeat(64),
      }),
    /digest mismatch/,
  );
});

test("observed exact Builder identity is accepted", () => {
  const plan =
    createXviGitOperationPlan({
      identity: IDENTITY,
      operation: "REV_PARSE_HEAD",
    });

  assert.equal(
    assertXviGitObservedIdentity({
      plan,
      observedHeadSha: BASE,
      observedBranch:
        "xvi/agent/gate32-builder",
    }),
    true,
  );
});

test("stale observed HEAD fails closed", () => {
  const plan =
    createXviGitOperationPlan({
      identity: IDENTITY,
      operation: "REV_PARSE_HEAD",
    });

  assert.throws(
    () =>
      assertXviGitObservedIdentity({
        plan,
        observedHeadSha: "b".repeat(40),
        observedBranch:
          "xvi/agent/gate32-builder",
      }),
    /HEAD does not match/,
  );
});

test("wrong observed branch fails closed", () => {
  const plan =
    createXviGitOperationPlan({
      identity: IDENTITY,
      operation: "REV_PARSE_HEAD",
    });

  assert.throws(
    () =>
      assertXviGitObservedIdentity({
        plan,
        observedHeadSha: BASE,
        observedBranch: "main",
      }),
    /branch does not match/,
  );
});
