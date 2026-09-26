import {
  createHash,
} from "node:crypto";

import type {
  XviCodingProviderExecutionRequest,
} from "./xvi-coding-provider-execution";

import {
  verifyXviCodingProviderExecutionRequest,
} from "./xvi-coding-provider-execution";

export type XviOllamaCodingModel =
  | "qwen2.5-coder:7b"
  | "qwen2.5-coder:3b";

export interface XviOllamaExecutionEnvelope {
  readonly version:
    "xvi-ollama-execution-envelope-v1";

  readonly provider:
    "OLLAMA";

  readonly endpoint:
    "http://127.0.0.1:11434/api/generate";

  readonly model:
    XviOllamaCodingModel;

  readonly workId: string;
  readonly missionId: string;

  readonly providerExecutionDigest:
    string;

  readonly prompt: string;

  readonly stream: false;

  readonly localLoopbackOnly: true;
  readonly externalNetworkAllowed: false;

  readonly automaticPushAllowed: false;
  readonly automaticDeployAllowed: false;
  readonly credentialAccessAllowed: false;
  readonly productionMutationAllowed: false;

  readonly envelopeDigest: string;
}

const MODELS =
  new Set<XviOllamaCodingModel>([
    "qwen2.5-coder:7b",
    "qwen2.5-coder:3b",
  ]);

const refuse = (
  reason: string,
): never => {
  throw new Error(
    `XVI_OLLAMA_ADAPTER_REFUSED: ${reason}`,
  );
};

export function createXviOllamaExecutionEnvelope(
  input: {
    readonly execution:
      Readonly<XviCodingProviderExecutionRequest>;

    readonly model:
      XviOllamaCodingModel;
  },
): Readonly<XviOllamaExecutionEnvelope> {
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !==
      Object.prototype
  ) {
    refuse("invalid adapter input");
  }

  const execution =
    input.execution;

  if (
    !verifyXviCodingProviderExecutionRequest(
      execution,
    )
  ) {
    refuse(
      "provider execution verification failed",
    );
  }

  if (
    execution.provider !==
      "OLLAMA"
  ) {
    refuse(
      "provider must be OLLAMA",
    );
  }

  if (
    !MODELS.has(input.model)
  ) {
    refuse(
      "model not allowlisted",
    );
  }

  if (
    execution.localExecutionOnly !==
      true ||

    execution.arbitraryCommandExecutionAllowed !==
      false ||

    execution.automaticPushAllowed !==
      false ||

    execution.automaticMergeAllowed !==
      false ||

    execution.automaticDeployAllowed !==
      false ||

    execution.credentialAccessAllowed !==
      false ||

    execution.networkExpansionAllowed !==
      false ||

    execution.productionMutationAllowed !==
      false ||

    execution.humanApprovalRequired !==
      true
  ) {
    refuse(
      "execution authority mismatch",
    );
  }

  if (
    !/^[a-f0-9]{64}$/.test(
      execution.executionDigest,
    )
  ) {
    refuse(
      "invalid provider execution digest",
    );
  }

  const endpoint =
    "http://127.0.0.1:11434/api/generate" as const;

  const prompt =
    [
      execution.systemPrompt,
      "",
      execution.missionPrompt,
    ].join("\n");

  const canonical =
    JSON.stringify([
      "xvi-ollama-execution-envelope-v1",

      endpoint,
      input.model,

      execution.workId,
      execution.missionId,

      execution.executionDigest,

      prompt,
    ]);

  const envelopeDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return Object.freeze({
    version:
      "xvi-ollama-execution-envelope-v1" as const,

    provider:
      "OLLAMA" as const,

    endpoint,

    model:
      input.model,

    workId:
      execution.workId,

    missionId:
      execution.missionId,

    providerExecutionDigest:
      execution.executionDigest,

    prompt,

    stream:
      false as const,

    localLoopbackOnly:
      true as const,

    externalNetworkAllowed:
      false as const,

    automaticPushAllowed:
      false as const,

    automaticDeployAllowed:
      false as const,

    credentialAccessAllowed:
      false as const,

    productionMutationAllowed:
      false as const,

    envelopeDigest,
  });
}
