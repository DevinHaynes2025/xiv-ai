import {
  createHash,
} from "node:crypto";

import type {
  XviOllamaExecutionEnvelope,
} from "./xvi-ollama-execution-adapter";

export interface XviOllamaInferenceResult {
  readonly version:
    "xvi-ollama-inference-result-v1";

  readonly provider:
    "OLLAMA";

  readonly model: string;

  readonly workId: string;
  readonly missionId: string;

  readonly sourceEnvelopeDigest: string;

  readonly response: string;
  readonly responseByteCount: number;

  readonly resultDigest: string;

  readonly modelExecutedCommands: false;
  readonly modelModifiedFiles: false;
  readonly modelAccessedCredentials: false;
  readonly modelPushedCode: false;
  readonly modelDeployedCode: false;
}

const refuse = (
  reason: string,
): never => {
  throw new Error(
    `XVI_OLLAMA_INFERENCE_REFUSED: ${reason}`,
  );
};

function verifyEnvelope(
  envelope:
    Readonly<XviOllamaExecutionEnvelope>,
): void {
  if (
    envelope.version !==
      "xvi-ollama-execution-envelope-v1" ||

    envelope.provider !==
      "OLLAMA" ||

    envelope.endpoint !==
      "http://127.0.0.1:11434/api/generate" ||

    envelope.localLoopbackOnly !==
      true ||

    envelope.externalNetworkAllowed !==
      false ||

    envelope.automaticPushAllowed !==
      false ||

    envelope.automaticDeployAllowed !==
      false ||

    envelope.credentialAccessAllowed !==
      false ||

    envelope.productionMutationAllowed !==
      false ||

    !/^[a-f0-9]{64}$/.test(
      envelope.envelopeDigest,
    )
  ) {
    refuse(
      "invalid Ollama execution envelope",
    );
  }

  const canonical =
    JSON.stringify([
      "xvi-ollama-execution-envelope-v1",

      envelope.endpoint,
      envelope.model,

      envelope.workId,
      envelope.missionId,

      envelope.providerExecutionDigest,

      envelope.prompt,
    ]);

  const expected =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  if (
    envelope.envelopeDigest !==
      expected
  ) {
    refuse(
      "Ollama envelope digest mismatch",
    );
  }
}

export function verifyXviOllamaInferenceResult(
  result:
    Readonly<XviOllamaInferenceResult>,
): boolean {
  if (
    result === null ||
    typeof result !== "object" ||

    result.version !==
      "xvi-ollama-inference-result-v1" ||

    result.provider !==
      "OLLAMA" ||

    typeof result.model !== "string" ||
    !result.model ||

    typeof result.workId !== "string" ||
    !result.workId ||

    typeof result.missionId !== "string" ||
    !result.missionId ||

    !/^[a-f0-9]{64}$/.test(
      result.sourceEnvelopeDigest,
    ) ||

    typeof result.response !== "string" ||

    !Number.isSafeInteger(
      result.responseByteCount,
    ) ||

    result.responseByteCount !==
      Buffer.byteLength(
        result.response,
        "utf8",
      ) ||

    result.responseByteCount >
      256 * 1024 ||

    !/^[a-f0-9]{64}$/.test(
      result.resultDigest,
    ) ||

    result.modelExecutedCommands !==
      false ||

    result.modelModifiedFiles !==
      false ||

    result.modelAccessedCredentials !==
      false ||

    result.modelPushedCode !==
      false ||

    result.modelDeployedCode !==
      false
  ) {
    return false;
  }

  const canonical =
    JSON.stringify([
      "xvi-ollama-inference-result-v1",

      result.model,

      result.workId,
      result.missionId,

      result.sourceEnvelopeDigest,

      result.response,
      result.responseByteCount,
    ]);

  const expectedDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return (
    result.resultDigest ===
    expectedDigest
  );
}

export async function runXviOllamaInference(
  envelope:
    Readonly<XviOllamaExecutionEnvelope>,
): Promise<Readonly<XviOllamaInferenceResult>> {
  verifyEnvelope(
    envelope,
  );

  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      120_000,
    );

  let response: Response;

  try {
    response =
      await fetch(
        "http://127.0.0.1:11434/api/generate",
        {
          method:
            "POST",

          headers: {
            "content-type":
              "application/json",
          },

          body:
            JSON.stringify({
              model:
                envelope.model,

              prompt:
                envelope.prompt,

              stream:
                false,

              options: {
                temperature:
                  0.1,

                num_predict:
                  1024,
              },
            }),

          signal:
            controller.signal,
        },
      );
  }
  catch {
    refuse(
      "local Ollama request failed",
    );
  }
  finally {
    clearTimeout(timer);
  }

  if (
    !response.ok
  ) {
    refuse(
      "local Ollama returned failure",
    );
  }

  let payload: unknown;

  try {
    payload =
      await response.json();
  }
  catch {
    refuse(
      "invalid Ollama response JSON",
    );
  }

  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    refuse(
      "invalid Ollama response object",
    );
  }

  const raw =
    payload as {
      response?: unknown;
      model?: unknown;
    };

  if (
    typeof raw.response !== "string" ||
    typeof raw.model !== "string"
  ) {
    refuse(
      "missing Ollama response fields",
    );
  }

  const responseText =
    raw.response;

  const responseByteCount =
    Buffer.byteLength(
      responseText,
      "utf8",
    );

  /*
   * Bound provider output before it can
   * enter later XVI coding stages.
   */
  if (
    responseByteCount >
      256 * 1024
  ) {
    refuse(
      "Ollama response exceeds bound",
    );
  }

  const canonical =
    JSON.stringify([
      "xvi-ollama-inference-result-v1",

      envelope.model,

      envelope.workId,
      envelope.missionId,

      envelope.envelopeDigest,

      responseText,
      responseByteCount,
    ]);

  const resultDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return Object.freeze({
    version:
      "xvi-ollama-inference-result-v1" as const,

    provider:
      "OLLAMA" as const,

    model:
      envelope.model,

    workId:
      envelope.workId,

    missionId:
      envelope.missionId,

    sourceEnvelopeDigest:
      envelope.envelopeDigest,

    response:
      responseText,

    responseByteCount,

    resultDigest,

    modelExecutedCommands:
      false as const,

    modelModifiedFiles:
      false as const,

    modelAccessedCredentials:
      false as const,

    modelPushedCode:
      false as const,

    modelDeployedCode:
      false as const,
  });
}
