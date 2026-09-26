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
        "xvi-gate39c-",
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
  backend:
    "CODEX" | "OLLAMA",
  workId: string,
  createdAtMs: number,
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

      maxAttempts:
        3,

      createdAtMs,
    });

  const prompt =
    createXviCodingAgentPrompt({
      backend,
      work,
    });

  return queue.enqueue({
    work,
    prompt,
    nowMs:
      createdAtMs,
  });
}

test("Codex atomically claims queued Codex work", () => {
  const f =
    fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    enqueue(
      queue,
      "CODEX",
      "gate39c-work-001",
      1000,
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
          5000,
      });

    assert.ok(claimed);

    assert.equal(
      claimed.state,
      "CLAIMED",
    );

    assert.equal(
      claimed.claimedBy,
      "codex-worker-01",
    );

    assert.equal(
      claimed.attemptCount,
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

test("second worker cannot claim same work", () => {
  const f =
    fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    enqueue(
      queue,
      "CODEX",
      "gate39c-work-001",
      1000,
    );

    const first =
      queue.claimNext({
        workerId:
          "codex-worker-01",

        backend:
          "CODEX",

        nowMs:
          2000,

        leaseMs:
          5000,
      });

    const second =
      queue.claimNext({
        workerId:
          "codex-worker-02",

        backend:
          "CODEX",

        nowMs:
          2001,

        leaseMs:
          5000,
      });

    assert.ok(first);

    assert.equal(
      second,
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

test("backend assignment is respected", () => {
  const f =
    fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    enqueue(
      queue,
      "OLLAMA",
      "gate39c-ollama-001",
      1000,
    );

    const codex =
      queue.claimNext({
        workerId:
          "codex-worker-01",

        backend:
          "CODEX",

        nowMs:
          2000,

        leaseMs:
          5000,
      });

    assert.equal(
      codex,
      null,
    );

    const ollama =
      queue.claimNext({
        workerId:
          "ollama-worker-01",

        backend:
          "OLLAMA",

        nowMs:
          2001,

        leaseMs:
          5000,
      });

    assert.ok(ollama);

    assert.equal(
      ollama.backend,
      "OLLAMA",
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

test("expired lease can be recovered by another worker", () => {
  const f =
    fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    enqueue(
      queue,
      "CODEX",
      "gate39c-recover-001",
      1000,
    );

    const first =
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

    assert.ok(first);

    const recovered =
      queue.claimNext({
        workerId:
          "codex-worker-02",

        backend:
          "CODEX",

        nowMs:
          2200,

        leaseMs:
          100,
      });

    assert.ok(recovered);

    assert.equal(
      recovered.claimedBy,
      "codex-worker-02",
    );

    assert.equal(
      recovered.attemptCount,
      2,
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

test("valid claim transitions to RUNNING", () => {
  const f =
    fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    enqueue(
      queue,
      "CODEX",
      "gate39c-running-001",
      1000,
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
          5000,
      });

    assert.ok(claimed);

    const running =
      queue.markRunning({
        workId:
          claimed.workId,

        workerId:
          "codex-worker-01",

        nowMs:
          2001,
      });

    assert.equal(
      running.state,
      "RUNNING",
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

test("wrong worker cannot start claimed work", () => {
  const f =
    fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    enqueue(
      queue,
      "CODEX",
      "gate39c-owner-001",
      1000,
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
          5000,
      });

    assert.ok(claimed);

    assert.throws(
      () =>
        queue.markRunning({
          workId:
            claimed.workId,

          workerId:
            "codex-worker-02",

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
