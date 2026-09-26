import { createHash } from "node:crypto";

import {
  XviCodingMissionJournal,
} from "./xvi-coding-mission-journal";

import {
  createXviCodingMissionResumePlan,
  verifyXviCodingMissionResumePlan,
} from "./xvi-coding-mission-resume-planner";

import {
  executeXviCodingMissionResumePlan,
  type XviCodingMissionResumeExecutionDisposition,
} from "./xvi-coding-mission-resume-executor";

export const XVI_CODING_DURABLE_RESUME_COORDINATOR_POLICY =
  Object.freeze({
    policyVersion:
      "xvi-coding-durable-resume-coordinator-v1",

    automaticMergeAllowed: false,
    automaticPushAllowed: false,
    automaticDeployAllowed: false,
    credentialAccessAllowed: false,
    networkAllowed: false,
    productionMutationAllowed: false,
    arbitraryCommandExecutionAllowed: false,
  } as const);

export type XviCodingDurableResumePersistence =
  | "PERSISTED_ACTIVATION"
  | "NO_WRITE";

export interface XviCodingDurableResumeCoordinatorResult {
  readonly kind:
    "XVI_CODING_DURABLE_RESUME_COORDINATOR_RESULT";

  readonly coordinatorVersion:
    "xvi-coding-durable-resume-coordinator-v1";

  readonly missionId: string;

  readonly sourceEnvelopeDigest: string;
  readonly resumePlanDigest: string;
  readonly executionResultDigest: string;

  readonly disposition:
    XviCodingMissionResumeExecutionDisposition;

  readonly persistence:
    XviCodingDurableResumePersistence;

  readonly stateMutated: boolean;
  readonly journalWritePerformed: boolean;

  readonly persistedEnvelopeDigest:
    string | null;

  readonly humanApprovalRequired: true;

  readonly automaticMergeAllowed: false;
  readonly automaticPushAllowed: false;
  readonly automaticDeployAllowed: false;
  readonly credentialAccessAllowed: false;
  readonly networkAllowed: false;
  readonly productionMutationAllowed: false;
  readonly arbitraryCommandExecutionAllowed: false;

  readonly coordinatorDigest: string;
}

function refuse(reason: string): never {
  throw new Error(
    `XVI_CODING_DURABLE_RESUME_COORDINATOR_REFUSED: ${reason}`,
  );
}

function canonicalResultBody(input: {
  missionId: string;
  sourceEnvelopeDigest: string;
  resumePlanDigest: string;
  executionResultDigest: string;
  disposition: XviCodingMissionResumeExecutionDisposition;
  persistence: XviCodingDurableResumePersistence;
  stateMutated: boolean;
  journalWritePerformed: boolean;
  persistedEnvelopeDigest: string | null;
}) {
  return {
    kind:
      "XVI_CODING_DURABLE_RESUME_COORDINATOR_RESULT" as const,

    coordinatorVersion:
      XVI_CODING_DURABLE_RESUME_COORDINATOR_POLICY.policyVersion,

    missionId:
      input.missionId,

    sourceEnvelopeDigest:
      input.sourceEnvelopeDigest,

    resumePlanDigest:
      input.resumePlanDigest,

    executionResultDigest:
      input.executionResultDigest,

    disposition:
      input.disposition,

    persistence:
      input.persistence,

    stateMutated:
      input.stateMutated,

    journalWritePerformed:
      input.journalWritePerformed,

    persistedEnvelopeDigest:
      input.persistedEnvelopeDigest,

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

function finalizeResult(
  input: Parameters<typeof canonicalResultBody>[0],
): Readonly<XviCodingDurableResumeCoordinatorResult> {
  const body =
    canonicalResultBody(input);

  const coordinatorDigest =
    createHash("sha256")
      .update(
        JSON.stringify(body),
        "utf8",
      )
      .digest("hex");

  return Object.freeze({
    ...body,
    coordinatorDigest,
  });
}

export function coordinateXviCodingDurableResume(input: {
  journal: XviCodingMissionJournal;
  missionId: string;
  nowMs: number;
}): Readonly<XviCodingDurableResumeCoordinatorResult> {
  if (
    !input.missionId ||
    !input.missionId.trim()
  ) {
    refuse("mission identity required");
  }

  if (
    !Number.isSafeInteger(input.nowMs) ||
    input.nowMs <= 0
  ) {
    refuse("invalid coordination timestamp");
  }

  const envelope =
    input.journal.read(input.missionId);

  if (!envelope) {
    refuse("durable mission not found");
  }

  if (
    envelope.mission.missionId !==
    input.missionId
  ) {
    refuse("durable mission identity mismatch");
  }

  const plan =
    createXviCodingMissionResumePlan(
      envelope,
    );

  verifyXviCodingMissionResumePlan({
    envelope,
    plan,
  });

  const execution =
    executeXviCodingMissionResumePlan({
      envelope,
      plan,
      nowMs: input.nowMs,
    });

  if (
    execution.sourceEnvelopeDigest !==
      envelope.envelopeDigest ||
    execution.sourcePlanDigest !==
      plan.planDigest
  ) {
    refuse("execution provenance mismatch");
  }

  if (execution.disposition === "ACTIVATED") {
    if (
      execution.stateMutated !== true ||
      execution.envelope.state !== "ACTIVE"
    ) {
      refuse(
        "ACTIVATED result lacks valid ACTIVE mutation",
      );
    }

    input.journal.put({
      envelope:
        execution.envelope,
      updatedAtMs:
        input.nowMs,
    });

    const persisted =
      input.journal.read(input.missionId);

    if (!persisted) {
      refuse(
        "persisted activation disappeared after write",
      );
    }

    if (
      persisted.envelopeDigest !==
      execution.envelope.envelopeDigest
    ) {
      refuse(
        "persisted activation digest mismatch",
      );
    }

    if (persisted.state !== "ACTIVE") {
      refuse(
        "persisted activation did not remain ACTIVE",
      );
    }

    return finalizeResult({
      missionId:
        input.missionId,

      sourceEnvelopeDigest:
        envelope.envelopeDigest,

      resumePlanDigest:
        plan.planDigest,

      executionResultDigest:
        execution.resultDigest,

      disposition:
        execution.disposition,

      persistence:
        "PERSISTED_ACTIVATION",

      stateMutated:
        true,

      journalWritePerformed:
        true,

      persistedEnvelopeDigest:
        persisted.envelopeDigest,
    });
  }

  if (execution.stateMutated !== false) {
    refuse(
      "non-activation result attempted state mutation",
    );
  }

  return finalizeResult({
    missionId:
      input.missionId,

    sourceEnvelopeDigest:
      envelope.envelopeDigest,

    resumePlanDigest:
      plan.planDigest,

    executionResultDigest:
      execution.resultDigest,

    disposition:
      execution.disposition,

    persistence:
      "NO_WRITE",

    stateMutated:
      false,

    journalWritePerformed:
      false,

    persistedEnvelopeDigest:
      null,
  });
}