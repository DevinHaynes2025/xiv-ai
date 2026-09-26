import {
  createHash,
} from "node:crypto";

import type {
  XviCodingAgentBackend,
} from "./xvi-coding-agent-prompt";

import {
  XviDurableCodingWorkQueue,
} from "./xvi-durable-coding-work-queue";

export interface XviAutonomousDispatch {
  readonly version:
    "xvi-autonomous-coding-dispatch-v1";

  readonly workId: string;
  readonly missionId: string;

  readonly backend:
    XviCodingAgentBackend;

  readonly workerId: string;

  readonly workDigest: string;
  readonly promptDigest: string;

  readonly attemptNumber: number;

  readonly leaseExpiresAtMs: number;

  readonly dispatchDigest: string;

  readonly autonomousPlanningAllowed: true;
  readonly autonomousLocalCodingAllowed: true;
  readonly autonomousTestingAllowed: true;
  readonly autonomousRecoveryAllowed: true;

  readonly automaticPushAllowed: false;
  readonly automaticDeployAllowed: false;
  readonly credentialAccessAllowed: false;
  readonly networkAllowed: false;
  readonly productionMutationAllowed: false;

  readonly humanApprovalRequired: true;
}

const refuse = (
  reason: string,
): never => {
  throw new Error(
    `XVI_AUTONOMOUS_CODING_SUPERVISOR_REFUSED: ${reason}`,
  );
};

export function verifyXviAutonomousDispatch(
  dispatch: Readonly<XviAutonomousDispatch>,
): boolean {
  if (
    dispatch === null ||
    typeof dispatch !== "object" ||
    dispatch.version !==
      "xvi-autonomous-coding-dispatch-v1" ||

    typeof dispatch.workId !== "string" ||
    !dispatch.workId ||

    typeof dispatch.missionId !== "string" ||
    !dispatch.missionId ||

    typeof dispatch.workerId !== "string" ||
    !dispatch.workerId ||

    !/^[a-f0-9]{64}$/.test(
      dispatch.workDigest,
    ) ||

    !/^[a-f0-9]{64}$/.test(
      dispatch.promptDigest,
    ) ||

    !/^[a-f0-9]{64}$/.test(
      dispatch.dispatchDigest,
    ) ||

    !Number.isSafeInteger(
      dispatch.attemptNumber,
    ) ||
    dispatch.attemptNumber < 1 ||

    !Number.isSafeInteger(
      dispatch.leaseExpiresAtMs,
    ) ||
    dispatch.leaseExpiresAtMs <= 0 ||

    dispatch.autonomousPlanningAllowed !==
      true ||

    dispatch.autonomousLocalCodingAllowed !==
      true ||

    dispatch.autonomousTestingAllowed !==
      true ||

    dispatch.autonomousRecoveryAllowed !==
      true ||

    dispatch.automaticPushAllowed !==
      false ||

    dispatch.automaticDeployAllowed !==
      false ||

    dispatch.credentialAccessAllowed !==
      false ||

    dispatch.networkAllowed !==
      false ||

    dispatch.productionMutationAllowed !==
      false ||

    dispatch.humanApprovalRequired !==
      true
  ) {
    return false;
  }

  const canonical =
    JSON.stringify([
      "xvi-autonomous-coding-dispatch-v1",

      dispatch.workId,
      dispatch.missionId,

      dispatch.backend,
      dispatch.workerId,

      dispatch.workDigest,
      dispatch.promptDigest,

      dispatch.attemptNumber,
      dispatch.leaseExpiresAtMs,
    ]);

  const expectedDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return (
    dispatch.dispatchDigest ===
    expectedDigest
  );
}

export function dispatchNextXviCodingWork(input: {
  readonly queue:
    XviDurableCodingWorkQueue;

  readonly backend:
    XviCodingAgentBackend;

  readonly workerId: string;

  readonly nowMs: number;
  readonly leaseMs: number;
}): Readonly<XviAutonomousDispatch> | null {
  const claimed =
    input.queue.claimNext({
      workerId:
        input.workerId,

      backend:
        input.backend,

      nowMs:
        input.nowMs,

      leaseMs:
        input.leaseMs,
    });

  if (!claimed) {
    return null;
  }

  if (
    claimed.state !== "CLAIMED" ||
    claimed.claimedBy !==
      input.workerId ||
    claimed.backend !==
      input.backend ||
    claimed.leaseExpiresAtMs ===
      null
  ) {
    refuse(
      "claim provenance mismatch",
    );
  }

  const running =
    input.queue.markRunning({
      workId:
        claimed.workId,

      workerId:
        input.workerId,

      nowMs:
        input.nowMs,
    });

  if (
    running.state !== "RUNNING" ||
    running.claimedBy !==
      input.workerId ||
    running.leaseExpiresAtMs ===
      null
  ) {
    refuse(
      "running transition mismatch",
    );
  }

  const canonical =
    JSON.stringify([
      "xvi-autonomous-coding-dispatch-v1",

      running.workId,
      running.missionId,

      running.backend,
      input.workerId,

      running.workDigest,
      running.promptDigest,

      running.attemptCount,
      running.leaseExpiresAtMs,
    ]);

  const dispatchDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return Object.freeze({
    version:
      "xvi-autonomous-coding-dispatch-v1" as const,

    workId:
      running.workId,

    missionId:
      running.missionId,

    backend:
      running.backend,

    workerId:
      input.workerId,

    workDigest:
      running.workDigest,

    promptDigest:
      running.promptDigest,

    attemptNumber:
      running.attemptCount,

    leaseExpiresAtMs:
      running.leaseExpiresAtMs,

    dispatchDigest,

    autonomousPlanningAllowed:
      true as const,

    autonomousLocalCodingAllowed:
      true as const,

    autonomousTestingAllowed:
      true as const,

    autonomousRecoveryAllowed:
      true as const,

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

    humanApprovalRequired:
      true as const,
  });
}
