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

import {
  runXviOllamaInference,
} from "./xvi-ollama-inference-runner";

test(
  "XVI performs bounded live local Ollama inference",
  {
    timeout:
      150_000,
  },
  async () => {
    const root =
      mkdtempSync(
        join(
          tmpdir(),
          "xvi-ollama-live-",
        ),
      );

    const queue =
      new XviDurableCodingWorkQueue(
        join(
          root,
          "queue.sqlite",
        ),
      );

    try {
      const work =
        createXviCodingWorkItem({
          workId:
            "gate39g1c-live-001",

          missionId:
            "gate39g1c-live-mission",

          baseCommitSha:
            "95f3b9c3446ce72cff135972ced276fe2746d220",

          permittedPaths: [
            "services/ai/runtime/cognition/work-queue/xvi-ollama-inference-runner.ts",
          ],

          testCommands: [
            "gate39:live-ollama",
          ],

          priority:
            "NORMAL",

          maxAttempts:
            1,

          createdAtMs:
            1000,
        });

      const governed =
        createXviCodingAgentPrompt({
          backend:
            "OLLAMA",

          work,
        });

      /*
       * Keep the first live inference tiny.
       * This is inference validation, not
       * autonomous repository modification.
       */
      const prompt = {
        ...governed,

        systemPrompt:
          [
            governed.systemPrompt,
            "",
            "For this probe, return only:",
            "XVI_LOCAL_INFERENCE_OK",
            "Do not provide commands or code.",
          ].join("\n"),
      };

      /*
       * Because promptDigest authenticates the
       * original governed prompt, do NOT pass
       * the altered prompt downstream.
       *
       * Instead the governed prompt itself is
       * used for provenance. The model may
       * return arbitrary text; assertions below
       * validate only the bounded result.
       */
      void prompt;

      queue.enqueue({
        work,
        prompt:
          governed,

        nowMs:
          1000,
      });

      const dispatch =
        dispatchNextXviCodingWork({
          queue,

          backend:
            "OLLAMA",

          workerId:
            "ollama-live-worker-01",

          nowMs:
            2000,

          leaseMs:
            120_000,
        });

      assert.ok(dispatch);

      const execution =
        createXviCodingProviderExecutionRequest({
          dispatch,
          prompt:
            governed,
        });

      const envelope =
        createXviOllamaExecutionEnvelope({
          execution,

          model:
            "qwen2.5-coder:7b",
        });

      const result =
        await runXviOllamaInference(
          envelope,
        );

      assert.equal(
        result.provider,
        "OLLAMA",
      );

      assert.equal(
        result.model,
        "qwen2.5-coder:7b",
      );

      assert.equal(
        result.workId,
        work.workId,
      );

      assert.equal(
        result.missionId,
        work.missionId,
      );

      assert.equal(
        result.sourceEnvelopeDigest,
        envelope.envelopeDigest,
      );

      assert.equal(
        typeof result.response,
        "string",
      );

      assert.ok(
        result.responseByteCount > 0,
      );

      assert.ok(
        result.responseByteCount <=
          256 * 1024,
      );

      assert.match(
        result.resultDigest,
        /^[a-f0-9]{64}$/,
      );

      assert.equal(
        result.modelExecutedCommands,
        false,
      );

      assert.equal(
        result.modelModifiedFiles,
        false,
      );

      assert.equal(
        result.modelAccessedCredentials,
        false,
      );

      assert.equal(
        result.modelPushedCode,
        false,
      );

      assert.equal(
        result.modelDeployedCode,
        false,
      );

      console.log(
        "XVI_LIVE_OLLAMA_RESPONSE_BYTES=" +
          result.responseByteCount,
      );

      console.log(
        "XVI_LIVE_OLLAMA_RESULT_DIGEST=" +
          result.resultDigest,
      );
    }
    finally {
      queue.close();

      rmSync(
        root,
        {
          recursive: true,
          force: true,
        },
      );
    }
  },
);
