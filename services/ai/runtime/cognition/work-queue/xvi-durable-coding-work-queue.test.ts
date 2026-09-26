import test from "node:test";
import assert from "node:assert/strict";

import {
  mkdtempSync,
  rmSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  createXviCodingWorkItem,
} from "./xvi-coding-work-item";

import {
  createXviCodingAgentPrompt,
} from "./xvi-coding-agent-prompt";

import {
  XviDurableCodingWorkQueue,
} from "./xvi-durable-coding-work-queue";

function work() {
  return createXviCodingWorkItem({
    workId:
      "gate39-work-001",

    missionId:
      "gate39-mission-001",

    baseCommitSha:
      "95f3b9c3446ce72cff135972ced276fe2746d220",

    permittedPaths: [
      "services/ai/runtime/cognition/work-queue/xvi-durable-coding-work-queue.ts",
    ],

    testCommands: [
      "gate39:focused",
    ],

    priority:
      "HIGH",

    maxAttempts:
      4,

    createdAtMs:
      1000,
  });
}

function fixture() {
  const root =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate39-",
      ),
    );

  return {
    root,

    path:
      join(
        root,
        "queue.sqlite",
      ),
  };
}

test("Codex work persists in durable queue", () => {
  const f =
    fixture();

  try {
    const item =
      work();

    const prompt =
      createXviCodingAgentPrompt({
        backend:
          "CODEX",

        work:
          item,
      });

    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    const queued =
      queue.enqueue({
        work:
          item,

        prompt,

        nowMs:
          2000,
      });

    assert.equal(
      queued.backend,
      "CODEX",
    );

    assert.equal(
      queued.state,
      "QUEUED",
    );

    assert.equal(
      queued.attemptCount,
      0,
    );

    queue.close();
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("queued Codex work survives restart", () => {
  const f =
    fixture();

  try {
    const item =
      work();

    const prompt =
      createXviCodingAgentPrompt({
        backend:
          "CODEX",

        work:
          item,
      });

    let queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    queue.enqueue({
      work:
        item,

      prompt,

      nowMs:
        2000,
    });

    queue.close();

    queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    const restored =
      queue.read(
        item.workId,
      );

    assert.ok(restored);

    assert.equal(
      restored.state,
      "QUEUED",
    );

    assert.equal(
      restored.backend,
      "CODEX",
    );

    assert.equal(
      restored.workDigest,
      item.workDigest,
    );

    assert.equal(
      restored.promptDigest,
      prompt.promptDigest,
    );

    queue.close();
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("duplicate work cannot be silently enqueued", () => {
  const f =
    fixture();

  try {
    const item =
      work();

    const prompt =
      createXviCodingAgentPrompt({
        backend:
          "CODEX",

        work:
          item,
      });

    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    queue.enqueue({
      work:
        item,

      prompt,

      nowMs:
        2000,
    });

    assert.throws(
      () =>
        queue.enqueue({
          work:
            item,

          prompt,

          nowMs:
            2001,
        }),
      /XVI_DURABLE_CODING_QUEUE_REFUSED/,
    );

    queue.close();
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("durable queued work preserves approval boundary", () => {
  const f =
    fixture();

  try {
    const item =
      work();

    const prompt =
      createXviCodingAgentPrompt({
        backend:
          "OLLAMA",

        work:
          item,
      });

    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    const queued =
      queue.enqueue({
        work:
          item,

        prompt,

        nowMs:
          2000,
      });

    assert.equal(
      queued.humanApprovalRequired,
      true,
    );

    assert.equal(
      queued.automaticPushAllowed,
      false,
    );

    assert.equal(
      queued.automaticDeployAllowed,
      false,
    );

    assert.equal(
      queued.productionMutationAllowed,
      false,
    );

    queue.close();
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});
