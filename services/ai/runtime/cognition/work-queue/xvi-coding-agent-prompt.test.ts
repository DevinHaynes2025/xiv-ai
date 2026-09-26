import test from "node:test";
import assert from "node:assert/strict";

import {
  createXviCodingWorkItem,
} from "./xvi-coding-work-item";

import {
  createXviCodingAgentPrompt,
} from "./xvi-coding-agent-prompt";

function work() {
  return createXviCodingWorkItem({
    workId:
      "gate39-codex-001",

    missionId:
      "gate39-autonomous-001",

    baseCommitSha:
      "95f3b9c3446ce72cff135972ced276fe2746d220",

    permittedPaths: [
      "services/ai/runtime/cognition/work-queue/xvi-coding-agent-prompt.ts",
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

test("Codex receives governed autonomous prompt", () => {
  const prompt =
    createXviCodingAgentPrompt({
      backend:
        "CODEX",

      work:
        work(),
    });

  assert.equal(
    prompt.backend,
    "CODEX",
  );

  assert.equal(
    prompt.autonomousPlanningAllowed,
    true,
  );

  assert.equal(
    prompt.autonomousLocalCodingAllowed,
    true,
  );

  assert.match(
    prompt.systemPrompt,
    /autonomous coding agent/i,
  );
});

test("Codex prompt binds work identity", () => {
  const prompt =
    createXviCodingAgentPrompt({
      backend:
        "CODEX",

      work:
        work(),
    });

  assert.equal(
    prompt.workDigest,
    work().workDigest,
  );

  assert.match(
    prompt.promptDigest,
    /^[a-f0-9]{64}$/,
  );
});

test("Codex remains inside approval boundary", () => {
  const prompt =
    createXviCodingAgentPrompt({
      backend:
        "CODEX",

      work:
        work(),
    });

  assert.equal(
    prompt.automaticMergeAllowed,
    false,
  );

  assert.equal(
    prompt.automaticPushAllowed,
    false,
  );

  assert.equal(
    prompt.automaticDeployAllowed,
    false,
  );

  assert.equal(
    prompt.credentialAccessAllowed,
    false,
  );

  assert.equal(
    prompt.networkAllowed,
    false,
  );

  assert.equal(
    prompt.productionMutationAllowed,
    false,
  );

  assert.equal(
    prompt.humanApprovalRequired,
    true,
  );
});

test("Ollama can use same governed mission contract", () => {
  const prompt =
    createXviCodingAgentPrompt({
      backend:
        "OLLAMA",

      work:
        work(),
    });

  assert.equal(
    prompt.backend,
    "OLLAMA",
  );

  assert.equal(
    prompt.autonomousRecoveryAllowed,
    true,
  );
});

test("unknown backend fails closed", () => {
  assert.throws(
    () =>
      createXviCodingAgentPrompt({
        backend:
          "UNBOUNDED_AGENT" as never,

        work:
          work(),
      }),
    /XVI_CODING_AGENT_PROMPT_REFUSED/,
  );
});
