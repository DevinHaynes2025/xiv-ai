import test from "node:test";
import assert from "node:assert/strict";

import {
  createXviCodingWorkItem,
} from "./xvi-coding-work-item";

function input() {
  return {
    workId:
      "gate39-work-001",

    missionId:
      "gate39-mission-001",

    baseCommitSha:
      "95f3b9c3446ce72cff135972ced276fe2746d220",

    permittedPaths: [
      "services/ai/runtime/cognition/work-queue/xvi-coding-work-item.ts",
    ],

    testCommands: [
      "gate39:focused",
    ],

    priority:
      "NORMAL" as const,

    maxAttempts:
      3,

    createdAtMs:
      1000,
  };
}

test("bounded local work item is created", () => {
  const item =
    createXviCodingWorkItem(
      input(),
    );

  assert.equal(
    item.localWorkOnly,
    true,
  );

  assert.match(
    item.workDigest,
    /^[a-f0-9]{64}$/,
  );
});

test("identical work is deterministic", () => {
  const first =
    createXviCodingWorkItem(
      input(),
    );

  const second =
    createXviCodingWorkItem(
      input(),
    );

  assert.equal(
    first.workDigest,
    second.workDigest,
  );
});

test("base commit changes work identity", () => {
  const first =
    createXviCodingWorkItem(
      input(),
    );

  const second =
    createXviCodingWorkItem({
      ...input(),

      baseCommitSha:
        "a".repeat(40),
    });

  assert.notEqual(
    first.workDigest,
    second.workDigest,
  );
});

test("path traversal fails closed", () => {
  assert.throws(
    () =>
      createXviCodingWorkItem({
        ...input(),

        permittedPaths: [
          "../outside.ts",
        ],
      }),
    /XVI_CODING_WORK_ITEM_REFUSED/,
  );
});

test("duplicate paths fail closed", () => {
  const path =
    input().permittedPaths[0];

  assert.throws(
    () =>
      createXviCodingWorkItem({
        ...input(),

        permittedPaths: [
          path,
          path,
        ],
      }),
    /XVI_CODING_WORK_ITEM_REFUSED/,
  );
});

test("attempt budget is bounded", () => {
  assert.throws(
    () =>
      createXviCodingWorkItem({
        ...input(),

        maxAttempts:
          9,
      }),
    /XVI_CODING_WORK_ITEM_REFUSED/,
  );
});

test("undeclared authority fails closed", () => {
  assert.throws(
    () =>
      createXviCodingWorkItem({
        ...input(),

        networkAllowed:
          true,
      } as never),
    /XVI_CODING_WORK_ITEM_REFUSED/,
  );
});

test("work item grants zero external authority", () => {
  const item =
    createXviCodingWorkItem(
      input(),
    );

  assert.equal(
    item.automaticMergeAllowed,
    false,
  );

  assert.equal(
    item.automaticPushAllowed,
    false,
  );

  assert.equal(
    item.automaticDeployAllowed,
    false,
  );

  assert.equal(
    item.credentialAccessAllowed,
    false,
  );

  assert.equal(
    item.networkAllowed,
    false,
  );

  assert.equal(
    item.productionMutationAllowed,
    false,
  );

  assert.equal(
    item.arbitraryCommandExecutionAllowed,
    false,
  );

  assert.equal(
    item.humanApprovalRequired,
    true,
  );
});

test("returned work item is deeply frozen at collection boundaries", () => {
  const item =
    createXviCodingWorkItem(
      input(),
    );

  assert.equal(
    Object.isFrozen(item),
    true,
  );

  assert.equal(
    Object.isFrozen(
      item.permittedPaths,
    ),
    true,
  );

  assert.equal(
    Object.isFrozen(
      item.testCommands,
    ),
    true,
  );
});
