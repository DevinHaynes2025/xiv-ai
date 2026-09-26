import {
  createHash,
} from "node:crypto";

import type {
  XviOllamaInferenceResult,
} from "./xvi-ollama-inference-runner";

import {
  verifyXviOllamaInferenceResult,
} from "./xvi-ollama-inference-runner";

export type XviCodingResponseDisposition =
  | "PROPOSAL_ACCEPTED"
  | "REQUIRES_HUMAN_REVIEW"
  | "REJECTED";

export interface XviCodingResponseInspection {
  readonly version:
    "xvi-coding-response-inspection-v1";

  readonly workId: string;
  readonly missionId: string;

  readonly sourceResultDigest: string;

  readonly disposition:
    XviCodingResponseDisposition;

  readonly findings:
    readonly string[];

  readonly inspectionDigest: string;

  readonly executableAuthorityGranted: false;
  readonly filesystemAuthorityGranted: false;
  readonly shellAuthorityGranted: false;
  readonly credentialAuthorityGranted: false;
  readonly pushAuthorityGranted: false;
  readonly deploymentAuthorityGranted: false;
}

const SHA256 =
  /^[a-f0-9]{64}$/;

const refuse = (
  reason: string,
): never => {
  throw new Error(
    `XVI_CODING_RESPONSE_INSPECTION_REFUSED: ${reason}`,
  );
};

export function verifyXviCodingResponseInspection(
  inspection:
    Readonly<XviCodingResponseInspection>,
): boolean {
  if (
    inspection === null ||
    typeof inspection !== "object" ||

    inspection.version !==
      "xvi-coding-response-inspection-v1" ||

    typeof inspection.workId !== "string" ||
    !inspection.workId ||

    typeof inspection.missionId !== "string" ||
    !inspection.missionId ||

    !SHA256.test(
      inspection.sourceResultDigest,
    ) ||

    !SHA256.test(
      inspection.inspectionDigest,
    ) ||

    !Array.isArray(
      inspection.findings,
    ) ||

    (
      inspection.disposition !==
        "PROPOSAL_ACCEPTED" &&
      inspection.disposition !==
        "REQUIRES_HUMAN_REVIEW" &&
      inspection.disposition !==
        "REJECTED"
    ) ||

    inspection.executableAuthorityGranted !== false ||
    inspection.filesystemAuthorityGranted !== false ||
    inspection.shellAuthorityGranted !== false ||
    inspection.credentialAuthorityGranted !== false ||
    inspection.pushAuthorityGranted !== false ||
    inspection.deploymentAuthorityGranted !== false
  ) {
    return false;
  }

  if (
    inspection.findings.some(
      finding =>
        typeof finding !== "string" ||
        !finding,
    )
  ) {
    return false;
  }

  const canonical =
    JSON.stringify([
      "xvi-coding-response-inspection-v1",

      inspection.workId,
      inspection.missionId,

      inspection.sourceResultDigest,

      inspection.disposition,
      inspection.findings,
    ]);

  const expectedDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return (
    inspection.inspectionDigest ===
    expectedDigest
  );
}
export function inspectXviCodingResponse(
  result:
    Readonly<XviOllamaInferenceResult>,
): Readonly<XviCodingResponseInspection> {
  if (
    !verifyXviOllamaInferenceResult(
      result,
    )
  ) {
    refuse(
      "inference cryptographic verification failed",
    );
  }

  if (
    result === null ||
    typeof result !== "object" ||

    result.version !==
      "xvi-ollama-inference-result-v1" ||

    result.provider !==
      "OLLAMA" ||

    !SHA256.test(
      result.resultDigest,
    ) ||

    !SHA256.test(
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

    result.modelExecutedCommands !== false ||
    result.modelModifiedFiles !== false ||
    result.modelAccessedCredentials !== false ||
    result.modelPushedCode !== false ||
    result.modelDeployedCode !== false
  ) {
    refuse(
      "invalid inference result",
    );
  }

  if (
    result.response.includes("\u0000")
  ) {
    refuse(
      "NUL byte prohibited",
    );
  }

  const findings: string[] =
    [];

  const text =
    result.response.toLowerCase();

  const patterns = [
    [
      "PUSH_REQUEST",
      /\bgit\s+push\b/,
    ],
    [
      "DEPLOY_REQUEST",
      /\b(deploy|deployment)\b/,
    ],
    [
      "CREDENTIAL_REQUEST",
      /\b(password|api[_ -]?key|secret|credential|token)\b/,
    ],
    [
      "DESTRUCTIVE_SHELL",
      /\b(rm\s+-rf|format\s+[a-z]:|del\s+\/[fsq]|remove-item\s+.+-recurse)\b/,
    ],
    [
      "PRIVILEGE_ESCALATION",
      /\b(sudo|runas|administrator privileges)\b/,
    ],
  ] as const;

  for (
    const [finding, pattern]
    of patterns
  ) {
    if (pattern.test(text)) {
      findings.push(
        finding,
      );
    }
  }

  const frozenFindings =
    Object.freeze([
      ...findings,
    ]);

  const disposition:
    XviCodingResponseDisposition =
      findings.length === 0
        ? "PROPOSAL_ACCEPTED"
        : "REQUIRES_HUMAN_REVIEW";

  const canonical =
    JSON.stringify([
      "xvi-coding-response-inspection-v1",

      result.workId,
      result.missionId,

      result.resultDigest,

      disposition,
      frozenFindings,
    ]);

  const inspectionDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return Object.freeze({
    version:
      "xvi-coding-response-inspection-v1" as const,

    workId:
      result.workId,

    missionId:
      result.missionId,

    sourceResultDigest:
      result.resultDigest,

    disposition,

    findings:
      frozenFindings,

    inspectionDigest,

    executableAuthorityGranted:
      false as const,

    filesystemAuthorityGranted:
      false as const,

    shellAuthorityGranted:
      false as const,

    credentialAuthorityGranted:
      false as const,

    pushAuthorityGranted:
      false as const,

    deploymentAuthorityGranted:
      false as const,
  });
}
