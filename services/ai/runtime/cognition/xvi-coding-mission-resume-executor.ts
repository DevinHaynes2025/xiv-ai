import { createHash } from "node:crypto";

import {
  activateXviCodingMissionController,
  type XviCodingMissionControllerEnvelope,
} from "./xvi-coding-mission-controller";

import {
  verifyXviCodingMissionResumePlan,
  type XviCodingMissionResumePlan,
} from "./xvi-coding-mission-resume-planner";

export const XVI_CODING_MISSION_RESUME_EXECUTOR_POLICY =
  Object.freeze({
    policyVersion:
      "xvi-coding-mission-resume-executor-v1",

    automaticMergeAllowed: false,
    automaticPushAllowed: false,
    automaticDeployAllowed: false,
    credentialAccessAllowed: false,
    networkAllowed: false,
    productionMutationAllowed: false,
    arbitraryCommandExecutionAllowed: false,
  } as const);

export type XviCodingMissionResumeExecutionDisposition =
  | "ACTIVATED"
  | "COLLECT_EVIDENCE_REQUIRED"
  | "COLLECT_MISSING_EVIDENCE_REQUIRED"
  | "BLOCKED_NO_OP"
  | "HUMAN_APPROVAL_REQUIRED";

export interface XviCodingMissionResumeExecutionResult {
  readonly kind:
    "XVI_CODING_MISSION_RESUME_EXECUTION_RESULT";

  readonly executorVersion:
    "xvi-coding-mission-resume-executor-v1";

  readonly missionId: string;
  readonly sourceEnvelopeDigest: string;
  readonly sourcePlanDigest: string;

  readonly disposition:
    XviCodingMissionResumeExecutionDisposition;

  readonly envelope:
    Readonly<XviCodingMissionControllerEnvelope>;

  readonly missingEvidenceCount: number;

  readonly stateMutated: boolean;

  readonly humanApprovalRequired: true;

  readonly automaticMergeAllowed: false;
  readonly automaticPushAllowed: false;
  readonly automaticDeployAllowed: false;
  readonly credentialAccessAllowed: false;
  readonly networkAllowed: false;
  readonly productionMutationAllowed: false;
  readonly arbitraryCommandExecutionAllowed: false;

  readonly resultDigest: string;
}

function refuse(reason: string): never {
  throw new Error(
    `XVI_CODING_MISSION_RESUME_EXECUTOR_REFUSED: ${reason}`,
  );
}

function canonicalResultBody(input: {
  envelope:
    Readonly<XviCodingMissionControllerEnvelope>;

  plan:
    Readonly<XviCodingMissionResumePlan>;

  disposition:
    XviCodingMissionResumeExecutionDisposition;

  outputEnvelope:
    Readonly<XviCodingMissionControllerEnvelope>;

  stateMutated: boolean;
}) {
  return {
    kind:
      "XVI_CODING_MISSION_RESUME_EXECUTION_RESULT" as const,

    executorVersion:
      XVI_CODING_MISSION_RESUME_EXECUTOR_POLICY.policyVersion,

    missionId:
      input.envelope.mission.missionId,

    sourceEnvelopeDigest:
      input.envelope.envelopeDigest,

    sourcePlanDigest:
      input.plan.planDigest,

    disposition:
      input.disposition,

    envelope:
      input.outputEnvelope,

    missingEvidenceCount:
      input.plan.missingEvidenceCount,

    stateMutated:
      input.stateMutated,

    humanApprovalRequired:
      true as const,

    automaticMergeAllowed:
      false as const,

    automaticPushAllowed:
      false as const,

    automaticDeployAllowed:
      false as const,

    credentialAccessAllowed:
      false as const,

    networkAllowed:
      false as const,

    productionMutationAllowed:
      false as const,

    arbitraryCommandExecutionAllowed:
      false as const,
  };
}

function finalizeResult(input: {
  envelope:
    Readonly<XviCodingMissionControllerEnvelope>;

  plan:
    Readonly<XviCodingMissionResumePlan>;

  disposition:
    XviCodingMissionResumeExecutionDisposition;

  outputEnvelope:
    Readonly<XviCodingMissionControllerEnvelope>;

  stateMutated: boolean;
}): Readonly<XviCodingMissionResumeExecutionResult> {
  const body =
    canonicalResultBody(input);

  const resultDigest =
    createHash("sha256")
      .update(
        JSON.stringify(body),
        "utf8",
      )
      .digest("hex");

  return Object.freeze({
    ...body,
    resultDigest,
  });
}

export function executeXviCodingMissionResumePlan(input: {
  envelope:
    Readonly<XviCodingMissionControllerEnvelope>;

  plan:
    Readonly<XviCodingMissionResumePlan>;

  nowMs: number;
}): Readonly<XviCodingMissionResumeExecutionResult> {
  verifyXviCodingMissionResumePlan({
    envelope: input.envelope,
    plan: input.plan,
  });

  if (
    !Number.isSafeInteger(input.nowMs) ||
    input.nowMs < 0
  ) {
    refuse("invalid execution timestamp");
  }

  switch (input.plan.action) {
    case "ACTIVATE": {
      if (input.envelope.state !== "CREATED") {
        refuse("ACTIVATE requires CREATED envelope");
      }

      const activated =
        activateXviCodingMissionController({
          envelope: input.envelope,
          nowMs: input.nowMs,
        });

      if (activated.state !== "ACTIVE") {
        refuse("controller activation did not reach ACTIVE");
      }

      return finalizeResult({
        envelope: input.envelope,
        plan: input.plan,
        disposition: "ACTIVATED",
        outputEnvelope: activated,
        stateMutated: true,
      });
    }

    case "COLLECT_EVIDENCE":
      if (input.envelope.state !== "ACTIVE") {
        refuse(
          "COLLECT_EVIDENCE requires ACTIVE envelope",
        );
      }

      return finalizeResult({
        envelope: input.envelope,
        plan: input.plan,
        disposition:
          "COLLECT_EVIDENCE_REQUIRED",
        outputEnvelope: input.envelope,
        stateMutated: false,
      });

    case "COLLECT_MISSING_EVIDENCE":
      if (
        input.envelope.state !==
        "EVIDENCE_PENDING"
      ) {
        refuse(
          "COLLECT_MISSING_EVIDENCE requires EVIDENCE_PENDING envelope",
        );
      }

      return finalizeResult({
        envelope: input.envelope,
        plan: input.plan,
        disposition:
          "COLLECT_MISSING_EVIDENCE_REQUIRED",
        outputEnvelope: input.envelope,
        stateMutated: false,
      });

    case "REMAIN_BLOCKED":
      if (input.envelope.state !== "BLOCKED") {
        refuse(
          "REMAIN_BLOCKED requires BLOCKED envelope",
        );
      }

      return finalizeResult({
        envelope: input.envelope,
        plan: input.plan,
        disposition: "BLOCKED_NO_OP",
        outputEnvelope: input.envelope,
        stateMutated: false,
      });

    case "AWAIT_HUMAN_APPROVAL":
      if (
        input.envelope.state !==
        "READY_FOR_HUMAN_REVIEW"
      ) {
        refuse(
          "AWAIT_HUMAN_APPROVAL requires READY_FOR_HUMAN_REVIEW envelope",
        );
      }

      return finalizeResult({
        envelope: input.envelope,
        plan: input.plan,
        disposition:
          "HUMAN_APPROVAL_REQUIRED",
        outputEnvelope: input.envelope,
        stateMutated: false,
      });
  }
}