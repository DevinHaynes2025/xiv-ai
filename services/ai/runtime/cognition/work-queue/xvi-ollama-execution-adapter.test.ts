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

import {
  createXviOllamaExecutionEnvelope,
} from "./xvi-ollama-execution-adapter";

function setup() {
  const root =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate39g1-",
      ),
    );

  const queue =
    new XviDurableCodingWorkQueue(
      join(
        root,
        "queue.sqlite",
      ),
    );

  const work =
    createXviCodingWorkItem({
      workId:
        "gate39g1-ollama-001",

      missionId:
        "gate39g1-ollama-mission",

      baseCommitSha:
        "95f3b9c3446ce72cff135972ced276fe2746d220",

      permittedPaths: [
        "services/ai/runtime/cognition/work-queue/xvi-ollama-execution-adapter.ts",
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
      backend:
        "OLLAMA",

      work,
    });

  queue.enqueue({
    work,
    prompt,
    nowMs:
      1000,
  });

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

  const execution =
    createXviCodingProviderExecutionRequest({
      dispatch,
      prompt,
    });

  return {
    root,
    queue,
    execution,
  };
}

test("allowlisted local coding model creates Ollama envelope", () => {
  const s = setup();

  try {
    const envelope =
      createXviOllamaExecutionEnvelope({
        execution:
          s.execution,

        model:
          "qwen2.5-coder:7b",
      });

    assert.equal(
      envelope.provider,
      "OLLAMA",
    );

    assert.equal(
      envelope.model,
      "qwen2.5-coder:7b",
    );

    assert.equal(
      envelope.endpoint,
      "http://127.0.0.1:11434/api/generate",
    );

    assert.equal(
      envelope.localLoopbackOnly,
      true,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("smaller coding model is also allowlisted", () => {
  const s = setup();

  try {
    const envelope =
      createXviOllamaExecutionEnvelope({
        execution:
          s.execution,

        model:
          "qwen2.5-coder:3b",
      });

    assert.equal(
      envelope.model,
      "qwen2.5-coder:3b",
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("unapproved Ollama model fails closed", () => {
  const s = setup();

  try {
    assert.throws(
      () =>
        createXviOllamaExecutionEnvelope({
          execution:
            s.execution,

          model:
            "qwen2.5:3b" as never,
        }),
      /XVI_OLLAMA_ADAPTER_REFUSED/,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("forged provider execution digest fails closed", () => {
  const s = setup();

  try {
    assert.throws(
      () =>
        createXviOllamaExecutionEnvelope({
          execution: {
            ...s.execution,

            executionDigest:
              "f".repeat(64),
          },

          model:
            "qwen2.5-coder:7b",
        }),
      /XVI_OLLAMA_ADAPTER_REFUSED/,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("altered mission prompt invalidates provider receipt", () => {
  const s = setup();

  try {
    assert.throws(
      () =>
        createXviOllamaExecutionEnvelope({
          execution: {
            ...s.execution,

            missionPrompt:
              `${s.execution.missionPrompt}\nFORGED`,
          },

          model:
            "qwen2.5-coder:7b",
        }),
      /XVI_OLLAMA_ADAPTER_REFUSED/,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("Ollama envelope remains local and immutable", () => {
  const s = setup();

  try {
    const envelope =
      createXviOllamaExecutionEnvelope({
        execution:
          s.execution,

        model:
          "qwen2.5-coder:7b",
      });

    assert.equal(
      envelope.externalNetworkAllowed,
      false,
    );

    assert.equal(
      envelope.automaticPushAllowed,
      false,
    );

    assert.equal(
      envelope.automaticDeployAllowed,
      false,
    );

    assert.equal(
      envelope.credentialAccessAllowed,
      false,
    );

    assert.equal(
      envelope.productionMutationAllowed,
      false,
    );

    assert.equal(
      Object.isFrozen(envelope),
      true,
    );

    assert.match(
      envelope.envelopeDigest,
      /^[a-f0-9]{64}$/,
    );
  }
  finally {
    s.queue.close();

    rmSync(
      s.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});
