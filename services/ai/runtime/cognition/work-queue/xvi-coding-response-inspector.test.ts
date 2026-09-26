import test from "node:test";
import assert from "node:assert/strict";
import {
  createHash,
} from "node:crypto";

import {
  inspectXviCodingResponse,
} from "./xvi-coding-response-inspector";

import type {
  XviOllamaInferenceResult,
} from "./xvi-ollama-inference-runner";

function result(
  response =
    "Proposed bounded local refactor only.",
): Readonly<XviOllamaInferenceResult> {
  const model =
    "qwen2.5-coder:7b";

  const workId =
    "gate39h-work-001";

  const missionId =
    "gate39h-mission-001";

  const sourceEnvelopeDigest =
    "a".repeat(64);

  const responseByteCount =
    Buffer.byteLength(
      response,
      "utf8",
    );

  const canonical =
    JSON.stringify([
      "xvi-ollama-inference-result-v1",
      model,
      workId,
      missionId,
      sourceEnvelopeDigest,
      response,
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

    model,

    workId,
    missionId,

    sourceEnvelopeDigest,

    response,
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

test("clean model proposal is accepted as proposal only", () => {
  const inspection =
    inspectXviCodingResponse(
      result(),
    );

  assert.equal(
    inspection.disposition,
    "PROPOSAL_ACCEPTED",
  );

  assert.deepEqual(
    inspection.findings,
    [],
  );

  assert.equal(
    inspection.executableAuthorityGranted,
    false,
  );

  assert.equal(
    inspection.filesystemAuthorityGranted,
    false,
  );

  assert.equal(
    inspection.shellAuthorityGranted,
    false,
  );
});

test("git push request requires human review", () => {
  const inspection =
    inspectXviCodingResponse(
      result(
        "Run git push origin main",
      ),
    );

  assert.equal(
    inspection.disposition,
    "REQUIRES_HUMAN_REVIEW",
  );

  assert.ok(
    inspection.findings.includes(
      "PUSH_REQUEST",
    ),
  );
});

test("deployment request requires human review", () => {
  const inspection =
    inspectXviCodingResponse(
      result(
        "Deploy this directly to production.",
      ),
    );

  assert.ok(
    inspection.findings.includes(
      "DEPLOY_REQUEST",
    ),
  );
});

test("credential request requires human review", () => {
  const inspection =
    inspectXviCodingResponse(
      result(
        "Read the API key and secret token.",
      ),
    );

  assert.ok(
    inspection.findings.includes(
      "CREDENTIAL_REQUEST",
    ),
  );
});

test("destructive shell request requires human review", () => {
  const inspection =
    inspectXviCodingResponse(
      result(
        "Use rm -rf ./workspace",
      ),
    );

  assert.ok(
    inspection.findings.includes(
      "DESTRUCTIVE_SHELL",
    ),
  );
});

test("privilege escalation requires human review", () => {
  const inspection =
    inspectXviCodingResponse(
      result(
        "Run this using sudo.",
      ),
    );

  assert.ok(
    inspection.findings.includes(
      "PRIVILEGE_ESCALATION",
    ),
  );
});

test("NUL injection fails closed", () => {
  assert.throws(
    () =>
      inspectXviCodingResponse(
        result(
          "safe\u0000hidden",
        ),
      ),
    /XVI_CODING_RESPONSE_INSPECTION_REFUSED/,
  );
});

test("forged byte count fails closed", () => {
  const source =
    result();

  assert.throws(
    () =>
      inspectXviCodingResponse({
        ...source,

        responseByteCount:
          source.responseByteCount + 1,
      }),
    /XVI_CODING_RESPONSE_INSPECTION_REFUSED/,
  );
});

test("forged inference digest fails closed", () => {
  const source =
    result();

  assert.throws(
    () =>
      inspectXviCodingResponse({
        ...source,

        resultDigest:
          "f".repeat(64),
      }),
    /XVI_CODING_RESPONSE_INSPECTION_REFUSED/,
  );
});

test("altered response with original digest fails closed", () => {
  const source =
    result();

  const forgedResponse =
    source.response +
    " git push origin main";

  assert.throws(
    () =>
      inspectXviCodingResponse({
        ...source,

        response:
          forgedResponse,

        responseByteCount:
          Buffer.byteLength(
            forgedResponse,
            "utf8",
          ),
      }),
    /XVI_CODING_RESPONSE_INSPECTION_REFUSED/,
  );
});

test("inspection receipt is immutable and grants no authority", () => {
  const inspection =
    inspectXviCodingResponse(
      result(),
    );

  assert.equal(
    Object.isFrozen(inspection),
    true,
  );

  assert.equal(
    Object.isFrozen(
      inspection.findings,
    ),
    true,
  );

  assert.equal(
    inspection.credentialAuthorityGranted,
    false,
  );

  assert.equal(
    inspection.pushAuthorityGranted,
    false,
  );

  assert.equal(
    inspection.deploymentAuthorityGranted,
    false,
  );

  assert.match(
    inspection.inspectionDigest,
    /^[a-f0-9]{64}$/,
  );
});

test("altered model invalidates inference receipt", () => {
  const source =
    result();

  assert.throws(
    () =>
      inspectXviCodingResponse({
        ...source,

        model:
          "forged-model",
      }),
    /XVI_CODING_RESPONSE_INSPECTION_REFUSED/,
  );
});

test("altered source envelope invalidates inference receipt", () => {
  const source =
    result();

  assert.throws(
    () =>
      inspectXviCodingResponse({
        ...source,

        sourceEnvelopeDigest:
          "b".repeat(64),
      }),
    /XVI_CODING_RESPONSE_INSPECTION_REFUSED/,
  );
});
