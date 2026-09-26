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

import {
  dispatchNextXviCodingWork,
} from "./xvi-autonomous-coding-supervisor";

function fixture() {
  const root =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate39d-",
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

      createdAtMs:
        1000,
    });

  const prompt =
    createXviCodingAgentPrompt({
      backend,
      work,
    });

  queue.enqueue({
    work,
    prompt,
    nowMs:
      1000,
  });

  return {
    work,
    prompt,
  };
}

test("Codex supervisor dispatches work into RUNNING state", () => {
  const f =
    fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    const source =
      enqueue(
        queue,
        "CODEX",
        "gate39d-codex-001",
      );

    const dispatch =
      dispatchNextXviCodingWork({
        queue,

        backend:
          "CODEX",

        workerId:
          "codex-worker-01",

        nowMs:
          2000,

        leaseMs:
          5000,
      });

    assert.ok(dispatch);

    assert.equal(
      dispatch.backend,
      "CODEX",
    );

    assert.equal(
      dispatch.workerId,
      "codex-worker-01",
    );

    assert.equal(
      dispatch.workDigest,
      source.work.workDigest,
    );

    assert.equal(
      dispatch.promptDigest,
      source.prompt.promptDigest,
    );

    const persisted =
      queue.read(
        dispatch.workId,
      );

    assert.ok(persisted);

    assert.equal(
      persisted.state,
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

test("Ollama supervisor dispatches only Ollama work", () => {
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
      "gate39d-codex-001",
    );

    enqueue(
      queue,
      "OLLAMA",
      "gate39d-ollama-001",
    );

    const dispatch =
      dispatchNextXviCodingWork({
        queue,

        backend:
          "OLLAMA",

        workerId:
          "ollama-worker-01",

        nowMs:
          2000,

        leaseMs:
          5000,
      });

    assert.ok(dispatch);

    assert.equal(
      dispatch.backend,
      "OLLAMA",
    );

    assert.equal(
      dispatch.workId,
      "gate39d-ollama-001",
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

test("empty backend queue returns null", () => {
  const f =
    fixture();

  try {
    const queue =
      new XviDurableCodingWorkQueue(
        f.path,
      );

    const dispatch =
      dispatchNextXviCodingWork({
        queue,

        backend:
          "CODEX",

        workerId:
          "codex-worker-01",

        nowMs:
          2000,

        leaseMs:
          5000,
      });

    assert.equal(
      dispatch,
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

test("dispatch digest binds autonomous execution identity", () => {
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
      "gate39d-digest-001",
    );

    const dispatch =
      dispatchNextXviCodingWork({
        queue,

        backend:
          "CODEX",

        workerId:
          "codex-worker-01",

        nowMs:
          2000,

        leaseMs:
          5000,
      });

    assert.ok(dispatch);

    assert.match(
      dispatch.dispatchDigest,
      /^[a-f0-9]{64}$/,
    );

    assert.equal(
      dispatch.attemptNumber,
      1,
    );

    assert.equal(
      dispatch.leaseExpiresAtMs,
      7000,
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

test("autonomous dispatch grants no external authority", () => {
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
      "gate39d-authority-001",
    );

    const dispatch =
      dispatchNextXviCodingWork({
        queue,

        backend:
          "CODEX",

        workerId:
          "codex-worker-01",

        nowMs:
          2000,

        leaseMs:
          5000,
      });

    assert.ok(dispatch);

    assert.equal(
      dispatch.autonomousPlanningAllowed,
      true,
    );

    assert.equal(
      dispatch.autonomousLocalCodingAllowed,
      true,
    );

    assert.equal(
      dispatch.autonomousTestingAllowed,
      true,
    );

    assert.equal(
      dispatch.autonomousRecoveryAllowed,
      true,
    );

    assert.equal(
      dispatch.automaticPushAllowed,
      false,
    );

    assert.equal(
      dispatch.automaticDeployAllowed,
      false,
    );

    assert.equal(
      dispatch.credentialAccessAllowed,
      false,
    );

    assert.equal(
      dispatch.networkAllowed,
      false,
    );

    assert.equal(
      dispatch.productionMutationAllowed,
      false,
    );

    assert.equal(
      dispatch.humanApprovalRequired,
      true,
    );

    assert.equal(
      Object.isFrozen(dispatch),
      true,
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
