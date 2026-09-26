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

import {
  createXviCodingProviderExecutionRequest,
} from "./xvi-coding-provider-execution";

function fixture() {
  const root =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate39f-",
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

function setup(
  backend:
    "CODEX" | "OLLAMA" | "LOCAL_MODEL" =
      "CODEX",

  suffix =
    "001",
) {
  const f =
    fixture();

  const work =
    createXviCodingWorkItem({
      workId:
        `gate39f-${backend.toLowerCase()}-${suffix}`,

      missionId:
        `gate39f-${backend.toLowerCase()}-${suffix}-mission`,

      baseCommitSha:
        "95f3b9c3446ce72cff135972ced276fe2746d220",

      permittedPaths: [
        "services/ai/runtime/cognition/work-queue/xvi-coding-provider-execution.ts",
      ],

      testCommands: [
        "gate39:focused",
      ],

      priority:
        "HIGH",

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

  const queue =
    new XviDurableCodingWorkQueue(
      f.path,
    );

  queue.enqueue({
    work,
    prompt,
    nowMs:
      1000,
  });

  const dispatch =
    dispatchNextXviCodingWork({
      queue,

      backend,

      workerId:
        `${backend.toLowerCase()}-worker-01`,

      nowMs:
        2000,

      leaseMs:
        5000,
    });

  assert.ok(dispatch);

  return {
    f,
    work,
    prompt,
    queue,
    dispatch,
  };
}

test("Codex receives provenance-bound execution request", () => {
  const s =
    setup("CODEX");

  try {
    const request =
      createXviCodingProviderExecutionRequest({
        dispatch:
          s.dispatch,

        prompt:
          s.prompt,
      });

    assert.equal(
      request.provider,
      "CODEX",
    );

    assert.equal(
      request.workDigest,
      s.work.workDigest,
    );

    assert.equal(
      request.promptDigest,
      s.prompt.promptDigest,
    );

    assert.equal(
      request.dispatchDigest,
      s.dispatch.dispatchDigest,
    );

    assert.match(
      request.executionDigest,
      /^[a-f0-9]{64}$/,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("Ollama receives same governed execution contract", () => {
  const s =
    setup("OLLAMA");

  try {
    const request =
      createXviCodingProviderExecutionRequest({
        dispatch:
          s.dispatch,

        prompt:
          s.prompt,
      });

    assert.equal(
      request.provider,
      "OLLAMA",
    );

    assert.equal(
      request.localExecutionOnly,
      true,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("local model receives same governed execution contract", () => {
  const s =
    setup("LOCAL_MODEL");

  try {
    const request =
      createXviCodingProviderExecutionRequest({
        dispatch:
          s.dispatch,

        prompt:
          s.prompt,
      });

    assert.equal(
      request.provider,
      "LOCAL_MODEL",
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("prompt from another mission fails closed", () => {
  const first =
    setup("CODEX", "001");

  const second =
    setup("CODEX", "002");

  try {
    assert.throws(
      () =>
        createXviCodingProviderExecutionRequest({
          dispatch:
            first.dispatch,

          prompt:
            second.prompt,
        }),
      /XVI_CODING_PROVIDER_EXECUTION_REFUSED/,
    );
  }
  finally {
    first.queue.close();
    second.queue.close();

    rmSync(
      first.f.root,
      {
        recursive: true,
        force: true,
      },
    );

    rmSync(
      second.f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("forged dispatch digest fails closed", () => {
  const s =
    setup("CODEX");

  try {
    assert.throws(
      () =>
        createXviCodingProviderExecutionRequest({
          dispatch: {
            ...s.dispatch,

            dispatchDigest:
              "f".repeat(64),
          },

          prompt:
            s.prompt,
        }),
      /XVI_CODING_PROVIDER_EXECUTION_REFUSED/,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("provider mismatch fails closed", () => {
  const s =
    setup("CODEX");

  try {
    assert.throws(
      () =>
        createXviCodingProviderExecutionRequest({
          dispatch: {
            ...s.dispatch,

            backend:
              "OLLAMA",
          },

          prompt:
            s.prompt,
        }),
      /XVI_CODING_PROVIDER_EXECUTION_REFUSED/,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("execution request grants zero external authority", () => {
  const s =
    setup("CODEX");

  try {
    const request =
      createXviCodingProviderExecutionRequest({
        dispatch:
          s.dispatch,

        prompt:
          s.prompt,
      });

    assert.equal(
      request.arbitraryCommandExecutionAllowed,
      false,
    );

    assert.equal(
      request.automaticPushAllowed,
      false,
    );

    assert.equal(
      request.automaticMergeAllowed,
      false,
    );

    assert.equal(
      request.automaticDeployAllowed,
      false,
    );

    assert.equal(
      request.credentialAccessAllowed,
      false,
    );

    assert.equal(
      request.networkExpansionAllowed,
      false,
    );

    assert.equal(
      request.productionMutationAllowed,
      false,
    );

    assert.equal(
      request.humanApprovalRequired,
      true,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("execution collections are detached and frozen", () => {
  const s =
    setup("CODEX");

  try {
    const request =
      createXviCodingProviderExecutionRequest({
        dispatch:
          s.dispatch,

        prompt:
          s.prompt,
      });

    assert.equal(
      Object.isFrozen(request),
      true,
    );

    assert.equal(
      Object.isFrozen(
        request.permittedPaths,
      ),
      true,
    );

    assert.equal(
      Object.isFrozen(
        request.permittedTests,
      ),
      true,
    );

    assert.notEqual(
      request.permittedPaths,
      s.prompt.permittedPaths,
    );

    assert.notEqual(
      request.permittedTests,
      s.prompt.permittedTests,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("altered worker identity invalidates dispatch digest", () => {
  const s =
    setup("CODEX");

  try {
    assert.throws(
      () =>
        createXviCodingProviderExecutionRequest({
          dispatch: {
            ...s.dispatch,

            workerId:
              "forged-worker",
          },

          prompt:
            s.prompt,
        }),
      /XVI_CODING_PROVIDER_EXECUTION_REFUSED/,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("altered lease invalidates dispatch digest", () => {
  const s =
    setup("CODEX");

  try {
    assert.throws(
      () =>
        createXviCodingProviderExecutionRequest({
          dispatch: {
            ...s.dispatch,

            leaseExpiresAtMs:
              s.dispatch.leaseExpiresAtMs + 1,
          },

          prompt:
            s.prompt,
        }),
      /XVI_CODING_PROVIDER_EXECUTION_REFUSED/,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});
