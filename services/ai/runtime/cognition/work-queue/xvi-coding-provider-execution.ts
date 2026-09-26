import {
  createHash,
} from "node:crypto";

import type {
  XviAutonomousDispatch,
} from "./xvi-autonomous-coding-supervisor";

import {
  verifyXviAutonomousDispatch,
} from "./xvi-autonomous-coding-supervisor";

import type {
  XviCodingAgentPrompt,
} from "./xvi-coding-agent-prompt";

export type XviCodingProvider =
  | "CODEX"
  | "OLLAMA"
  | "LOCAL_MODEL";

export interface XviCodingProviderExecutionRequest {
  readonly version:
    "xvi-coding-provider-execution-v1";

  readonly provider:
    XviCodingProvider;

  readonly workId: string;
  readonly missionId: string;
  readonly workerId: string;

  readonly workDigest: string;
  readonly promptDigest: string;
  readonly dispatchDigest: string;

  readonly systemPrompt: string;
  readonly missionPrompt: string;

  readonly permittedPaths:
    readonly string[];

  readonly permittedTests:
    readonly string[];

  readonly attemptNumber: number;
  readonly leaseExpiresAtMs: number;

  readonly executionDigest: string;

  readonly localExecutionOnly: true;

  readonly arbitraryCommandExecutionAllowed: false;

  readonly automaticPushAllowed: false;
  readonly automaticMergeAllowed: false;
  readonly automaticDeployAllowed: false;

  readonly credentialAccessAllowed: false;
  readonly networkExpansionAllowed: false;
  readonly productionMutationAllowed: false;

  readonly humanApprovalRequired: true;
}

const PROVIDERS =
  new Set<XviCodingProvider>([
    "CODEX",
    "OLLAMA",
    "LOCAL_MODEL",
  ]);

const SHA256 =
  /^[a-f0-9]{64}$/;

const refuse = (
  reason: string,
): never => {
  throw new Error(
    `XVI_CODING_PROVIDER_EXECUTION_REFUSED: ${reason}`,
  );
};

export function verifyXviCodingProviderExecutionRequest(
  request:
    Readonly<XviCodingProviderExecutionRequest>,
): boolean {
  if (
    request === null ||
    typeof request !== "object" ||

    request.version !==
      "xvi-coding-provider-execution-v1" ||

    !PROVIDERS.has(
      request.provider,
    ) ||

    !SHA256.test(
      request.workDigest,
    ) ||

    !SHA256.test(
      request.promptDigest,
    ) ||

    !SHA256.test(
      request.dispatchDigest,
    ) ||

    !SHA256.test(
      request.executionDigest,
    ) ||

    !Array.isArray(
      request.permittedPaths,
    ) ||

    !Array.isArray(
      request.permittedTests,
    ) ||

    !Number.isSafeInteger(
      request.attemptNumber,
    ) ||
    request.attemptNumber < 1 ||

    !Number.isSafeInteger(
      request.leaseExpiresAtMs,
    ) ||
    request.leaseExpiresAtMs <= 0 ||

    request.localExecutionOnly !==
      true ||

    request.arbitraryCommandExecutionAllowed !==
      false ||

    request.automaticPushAllowed !==
      false ||

    request.automaticMergeAllowed !==
      false ||

    request.automaticDeployAllowed !==
      false ||

    request.credentialAccessAllowed !==
      false ||

    request.networkExpansionAllowed !==
      false ||

    request.productionMutationAllowed !==
      false ||

    request.humanApprovalRequired !==
      true
  ) {
    return false;
  }

  const canonical =
    JSON.stringify([
      "xvi-coding-provider-execution-v1",

      request.provider,

      request.workId,
      request.missionId,
      request.workerId,

      request.workDigest,
      request.promptDigest,
      request.dispatchDigest,

      request.systemPrompt,
      request.missionPrompt,

      request.permittedPaths,
      request.permittedTests,

      request.attemptNumber,
      request.leaseExpiresAtMs,
    ]);

  const expectedDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return (
    request.executionDigest ===
    expectedDigest
  );
}

export function createXviCodingProviderExecutionRequest(
  input: {
    readonly dispatch:
      Readonly<XviAutonomousDispatch>;

    readonly prompt:
      Readonly<XviCodingAgentPrompt>;
  },
): Readonly<XviCodingProviderExecutionRequest> {
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !==
      Object.prototype
  ) {
    refuse("invalid input");
  }

  const dispatch =
    input.dispatch;

  const prompt =
    input.prompt;

  if (
    !verifyXviAutonomousDispatch(
      dispatch,
    )
  ) {
    refuse(
      "dispatch cryptographic verification failed",
    );
  }

  if (
    dispatch.workId !==
      prompt.workId ||

    dispatch.missionId !==
      prompt.missionId ||

    dispatch.workDigest !==
      prompt.workDigest ||

    dispatch.promptDigest !==
      prompt.promptDigest ||

    dispatch.backend !==
      prompt.backend
  ) {
    refuse(
      "dispatch and prompt provenance mismatch",
    );
  }

  if (
    !PROVIDERS.has(
      dispatch.backend as XviCodingProvider,
    )
  ) {
    refuse(
      "unsupported execution provider",
    );
  }

  if (
    !SHA256.test(
      dispatch.dispatchDigest,
    ) ||
    !SHA256.test(
      dispatch.workDigest,
    ) ||
    !SHA256.test(
      dispatch.promptDigest,
    )
  ) {
    refuse(
      "invalid execution provenance digest",
    );
  }

  if (
    dispatch.automaticPushAllowed !== false ||
    dispatch.automaticDeployAllowed !== false ||
    dispatch.credentialAccessAllowed !== false ||
    dispatch.networkAllowed !== false ||
    dispatch.productionMutationAllowed !== false ||
    dispatch.humanApprovalRequired !== true ||

    prompt.automaticPushAllowed !== false ||
    prompt.automaticDeployAllowed !== false ||
    prompt.credentialAccessAllowed !== false ||
    prompt.networkAllowed !== false ||
    prompt.productionMutationAllowed !== false ||
    prompt.humanApprovalRequired !== true
  ) {
    refuse(
      "execution authority escalation",
    );
  }

  const provider =
    dispatch.backend as
      XviCodingProvider;

  const permittedPaths =
    Object.freeze([
      ...prompt.permittedPaths,
    ]);

  const permittedTests =
    Object.freeze([
      ...prompt.permittedTests,
    ]);

  const canonical =
    JSON.stringify([
      "xvi-coding-provider-execution-v1",

      provider,

      dispatch.workId,
      dispatch.missionId,
      dispatch.workerId,

      dispatch.workDigest,
      dispatch.promptDigest,
      dispatch.dispatchDigest,

      prompt.systemPrompt,
      prompt.missionPrompt,

      permittedPaths,
      permittedTests,

      dispatch.attemptNumber,
      dispatch.leaseExpiresAtMs,
    ]);

  const executionDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return Object.freeze({
    version:
      "xvi-coding-provider-execution-v1" as const,

    provider,

    workId:
      dispatch.workId,

    missionId:
      dispatch.missionId,

    workerId:
      dispatch.workerId,

    workDigest:
      dispatch.workDigest,

    promptDigest:
      dispatch.promptDigest,

    dispatchDigest:
      dispatch.dispatchDigest,

    systemPrompt:
      prompt.systemPrompt,

    missionPrompt:
      prompt.missionPrompt,

    permittedPaths,
    permittedTests,

    attemptNumber:
      dispatch.attemptNumber,

    leaseExpiresAtMs:
      dispatch.leaseExpiresAtMs,

    executionDigest,

    localExecutionOnly:
      true as const,

    arbitraryCommandExecutionAllowed:
      false as const,

    automaticPushAllowed:
      false as const,

    automaticMergeAllowed:
      false as const,

    automaticDeployAllowed:
      false as const,

    credentialAccessAllowed:
      false as const,

    networkExpansionAllowed:
      false as const,

    productionMutationAllowed:
      false as const,

    humanApprovalRequired:
      true as const,
  });
}
