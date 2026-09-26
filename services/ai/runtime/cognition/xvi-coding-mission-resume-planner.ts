import { createHash } from "node:crypto";

import type {
  XviCodingMissionControllerEnvelope,
} from "./xvi-coding-mission-controller";

export const XVI_CODING_MISSION_RESUME_POLICY = Object.freeze({
  policyVersion: "xvi-coding-mission-resume-planner-v1",
  automaticMergeAllowed: false,
  automaticPushAllowed: false,
  automaticDeployAllowed: false,
  credentialAccessAllowed: false,
  networkAllowed: false,
  productionMutationAllowed: false,
} as const);

export type XviCodingMissionResumeAction =
  | "ACTIVATE"
  | "COLLECT_EVIDENCE"
  | "COLLECT_MISSING_EVIDENCE"
  | "REMAIN_BLOCKED"
  | "AWAIT_HUMAN_APPROVAL";

export interface XviCodingMissionResumePlan {
  readonly kind: "XVI_CODING_MISSION_RESUME_PLAN";
  readonly policyVersion: "xvi-coding-mission-resume-planner-v1";
  readonly missionId: string;
  readonly baseCommitSha: string;
  readonly sourceEnvelopeDigest: string;
  readonly sourceState: XviCodingMissionControllerEnvelope["state"];
  readonly action: XviCodingMissionResumeAction;
  readonly evidenceCount: number;
  readonly missingEvidenceCount: number;
  readonly humanApprovalRequired: true;
  readonly automaticMergeAllowed: false;
  readonly automaticPushAllowed: false;
  readonly automaticDeployAllowed: false;
  readonly credentialAccessAllowed: false;
  readonly networkAllowed: false;
  readonly productionMutationAllowed: false;
  readonly planDigest: string;
}

function refuse(reason: string): never {
  throw new Error(
    `XVI_CODING_MISSION_RESUME_PLANNER_REFUSED: ${reason}`,
  );
}

function actionFor(
  envelope: Readonly<XviCodingMissionControllerEnvelope>,
): XviCodingMissionResumeAction {
  switch (envelope.state) {
    case "CREATED":
      return "ACTIVATE";
    case "ACTIVE":
      return "COLLECT_EVIDENCE";
    case "EVIDENCE_PENDING":
      return "COLLECT_MISSING_EVIDENCE";
    case "BLOCKED":
      return "REMAIN_BLOCKED";
    case "READY_FOR_HUMAN_REVIEW":
      return "AWAIT_HUMAN_APPROVAL";
  }
}

function verifySourceEnvelope(
  envelope: Readonly<XviCodingMissionControllerEnvelope>,
): true {
  if (
    envelope.kind !== "XVI_CODING_MISSION_CONTROLLER_ENVELOPE" ||
    envelope.controllerVersion !== "xvi-coding-mission-controller-v1"
  ) {
    refuse("invalid source envelope identity");
  }

  if (
    envelope.humanApprovalRequired !== true ||
    envelope.automaticMergeAllowed !== false ||
    envelope.automaticPushAllowed !== false ||
    envelope.automaticDeployAllowed !== false ||
    envelope.credentialAccessAllowed !== false ||
    envelope.productionMutationAllowed !== false
  ) {
    refuse("source envelope authority contract invalid");
  }

  return true;
}

function canonicalBody(input: {
  envelope: Readonly<XviCodingMissionControllerEnvelope>;
  action: XviCodingMissionResumeAction;
}) {
  const evidenceCount = input.envelope.evidence.length;

  if (
    !Number.isSafeInteger(evidenceCount) ||
    evidenceCount < 0 ||
    evidenceCount > 4
  ) {
    refuse("invalid evidence count");
  }

  return {
    kind: "XVI_CODING_MISSION_RESUME_PLAN" as const,
    policyVersion: XVI_CODING_MISSION_RESUME_POLICY.policyVersion,
    missionId: input.envelope.mission.missionId,
    baseCommitSha: input.envelope.mission.baseCommitSha,
    sourceEnvelopeDigest: input.envelope.envelopeDigest,
    sourceState: input.envelope.state,
    action: input.action,
    evidenceCount,
    missingEvidenceCount: 4 - evidenceCount,
    humanApprovalRequired: true as const,
    automaticMergeAllowed: false as const,
    automaticPushAllowed: false as const,
    automaticDeployAllowed: false as const,
    credentialAccessAllowed: false as const,
    networkAllowed: false as const,
    productionMutationAllowed: false as const,
  };
}

export function createXviCodingMissionResumePlan(
  envelope: Readonly<XviCodingMissionControllerEnvelope>,
): Readonly<XviCodingMissionResumePlan> {
  verifySourceEnvelope(envelope);

  const body = canonicalBody({
    envelope,
    action: actionFor(envelope),
  });

  const planDigest = createHash("sha256")
    .update(JSON.stringify(body), "utf8")
    .digest("hex");

  return Object.freeze({
    ...body,
    planDigest,
  });
}

export function verifyXviCodingMissionResumePlan(input: {
  envelope: Readonly<XviCodingMissionControllerEnvelope>;
  plan: Readonly<XviCodingMissionResumePlan>;
}): true {
  verifySourceEnvelope(input.envelope);

  const expectedBody = canonicalBody({
    envelope: input.envelope,
    action: actionFor(input.envelope),
  });

  const expectedDigest = createHash("sha256")
    .update(JSON.stringify(expectedBody), "utf8")
    .digest("hex");

  if (
    input.plan.kind !== "XVI_CODING_MISSION_RESUME_PLAN" ||
    input.plan.policyVersion !== XVI_CODING_MISSION_RESUME_POLICY.policyVersion
  ) {
    refuse("resume plan identity invalid");
  }

  if (
    input.plan.missionId !== input.envelope.mission.missionId ||
    input.plan.baseCommitSha !== input.envelope.mission.baseCommitSha ||
    input.plan.sourceEnvelopeDigest !== input.envelope.envelopeDigest ||
    input.plan.sourceState !== input.envelope.state
  ) {
    refuse("resume plan source binding mismatch");
  }

  if (
    input.plan.action !== expectedBody.action ||
    input.plan.evidenceCount !== expectedBody.evidenceCount ||
    input.plan.missingEvidenceCount !== expectedBody.missingEvidenceCount
  ) {
    refuse("resume decision mismatch");
  }

  if (
    input.plan.humanApprovalRequired !== true ||
    input.plan.automaticMergeAllowed !== false ||
    input.plan.automaticPushAllowed !== false ||
    input.plan.automaticDeployAllowed !== false ||
    input.plan.credentialAccessAllowed !== false ||
    input.plan.networkAllowed !== false ||
    input.plan.productionMutationAllowed !== false
  ) {
    refuse("resume plan authority violation");
  }

  if (input.plan.planDigest !== expectedDigest) {
    refuse("resume plan digest mismatch");
  }

  return true;
}