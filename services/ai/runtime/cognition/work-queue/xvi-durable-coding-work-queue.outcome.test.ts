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

function fixture() {
  const root =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate39e-",
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

function enqueue(
  queue: XviDurableCodingWorkQueue,
  workId: string,
  maxAttempts = 3,
) {
  const work =
    createXviCodingWorkItem({
      workId,

      missionId:
        `${workId}-mission`,

      baseCommitSha:
        "95f3b9c3446ce72cff135972ced276fe2746d220",

      permittedPaths: [
        `services/ai/runtime/cognition/work-queue/${workId}.ts`,
      ],

      testCommands: [
        "gate39:focused",
      ],

      priority:
        "NORMAL",

      maxAttempts,

      createdAtMs:
        1000,
    });

  const prompt =
    createXviCodingAgentPrompt({
      backend:
        "CODEX",

      work,
    });

  queue.enqueue({
    work,
    prompt,
    nowMs:
      1000,
  });
}

function start(
  queue: XviDurableCodingWorkQueue,
  nowMs: number,
) {
  const claimed =
    queue.claimNext({
      workerId:
        "codex-worker-01",

      backend:
        "CODEX",

      nowMs,

      leaseMs:
        5000,
    });

  assert.ok(claimed);

  return queue.markRunning({
    workId:
      claimed.workId,

    workerId:
      "codex-worker-01",

    nowMs:
      nowMs + 1,
  });
}

test("successful autonomous work becomes ready for human review", () => {
  const f = fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    enqueue(
      queue,
      "gate39e-success-001",
    );

    const running =
      start(queue, 2000);

    const completed =
      queue.completeForReview({
        workId:
          running.workId,

        workerId:
          "codex-worker-01",

        nowMs:
          2002,
      });

    assert.equal(
      completed.state,
      "READY_FOR_HUMAN_REVIEW",
    );

    assert.equal(
      completed.claimedBy,
      null,
    );

    assert.equal(
      completed.leaseExpiresAtMs,
      null,
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

test("recoverable failure returns work to queue", () => {
  const f = fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    enqueue(
      queue,
      "gate39e-retry-001",
      3,
    );

    const running =
      start(queue, 2000);

    const failed =
      queue.recordFailure({
        workId:
          running.workId,

        workerId:
          "codex-worker-01",

        nowMs:
          2002,
      });

    assert.equal(
      failed.state,
      "QUEUED",
    );

    assert.equal(
      failed.attemptCount,
      1,
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

test("attempt budget exhaustion becomes FAILED", () => {
  const f = fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    enqueue(
      queue,
      "gate39e-exhaust-001",
      1,
    );

    const running =
      start(queue, 2000);

    const failed =
      queue.recordFailure({
        workId:
          running.workId,

        workerId:
          "codex-worker-01",

        nowMs:
          2002,
      });

    assert.equal(
      failed.state,
      "FAILED",
    );

    assert.equal(
      failed.attemptCount,
      1,
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

test("wrong worker cannot report success", () => {
  const f = fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    enqueue(
      queue,
      "gate39e-owner-001",
    );

    const running =
      start(queue, 2000);

    assert.throws(
      () =>
        queue.completeForReview({
          workId:
            running.workId,

          workerId:
            "codex-worker-02",

          nowMs:
            2002,
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

test("expired worker cannot report completion", () => {
  const f = fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    enqueue(
      queue,
      "gate39e-expired-001",
    );

    const claimed =
      queue.claimNext({
        workerId:
          "codex-worker-01",

        backend:
          "CODEX",

        nowMs:
          2000,

        leaseMs:
          100,
      });

    assert.ok(claimed);

    queue.markRunning({
      workId:
        claimed.workId,

      workerId:
        "codex-worker-01",

      nowMs:
        2001,
    });

    assert.throws(
      () =>
        queue.completeForReview({
          workId:
            claimed.workId,

          workerId:
            "codex-worker-01",

          nowMs:
            2200,
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
