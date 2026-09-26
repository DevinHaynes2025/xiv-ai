import {
  sha256,
} from "../offline-team/xvi-canonical-sha256";

import {
  deriveProposalDigest,
} from "../offline-team/agent-decision-safety-workflow";

import {
  SCALING_EXECUTION_POLICY,
} from "../offline-team/scaling-execution-bridge";

import {
  FAILOVER_EXECUTION_POLICY,
} from "../offline-team/failover-execution-bridge";

import type {
  InstructionAdoptionRecord,
} from "../offline-team/instruction-adoption-gate";

import {
  adoptXviCognitiveInstruction,
  type XviCognitiveAdoptionPackage,
  type XviCognitiveAdoptionResult,
} from "./xvi-cognitive-adoption-integration";

import type {
  XviCognitiveLineageRoute,
} from "./xvi-cognitive-lineage-router";

import {
  deriveXviDurableAdoptionReplayKey,
  type XviDurableAdoptionReplayClaim,
} from "./xvi-durable-adoption-replay-ledger";

import {
  XviDurableAdoptionCoordinator,
  type XviDurableAdoptionCommit,
} from "./xvi-durable-adoption-coordinator";

import type {
  InstructionAdoptionGate,
} from "../offline-team/instruction-adoption-gate";

export const XVI_COORDINATED_COGNITIVE_ADOPTION_GUARDRAILS =
  Object.freeze({
    requiresSupportedLineage: true,
    reservesBeforeAdoption: true,
    verificationFailureAbortsReservation: true,
    uncertainCrashLeavesReservationForRecovery: true,
    automaticRetryAllowed: false,
    executesNothing: true,
    productionAuthority: false,
    networkCalls: 0,
    remoteCalls: 0,
  });

export type XviCoordinatedCognitiveAdoptionResult =
  Readonly<{
    kind:
      "XVI_COORDINATED_COGNITIVE_ADOPTION_RESULT";

    replayKey: string;

    adoption:
      XviCognitiveAdoptionResult;

    commit:
      Readonly<XviDurableAdoptionCommit>;

    adoptionRecordDigest: string;

    executesNothing: true;
    productionAuthority: false;
    automaticRetryAllowed: false;
    authority: "NONE";
  }>;

function requireSupportedRoute(
  route: XviCognitiveLineageRoute,
): asserts route is Extract<
  XviCognitiveLineageRoute,
  { kind: "SUPPORTED_ADOPTION_LINEAGE" }
> {
  if (
    route.kind !==
    "SUPPORTED_ADOPTION_LINEAGE"
  ) {
    throw new Error(
      "coordinated adoption requires supported lineage",
    );
  }
}

function assertRecordNonExecuting(
  record:
    Readonly<InstructionAdoptionRecord>,
): void {
  if (
    record.trafficMoved !== false ||
    record.authorizedTrafficBps !== 0 ||
    record.executionStarted !== false ||
    record.productionMutationAllowed !== false ||
    record.realCellsProvisioned !== 0 ||
    record.databasesProvisioned !== 0 ||
    record.rowsMoved !== 0 ||
    record.remoteCalls !== 0 ||
    record.automaticRecovery !== false
  ) {
    throw new Error(
      "adoption record authority invariant violated",
    );
  }
}

function boundedText(
  value: unknown,
  field: string,
  max: number = 4096,
): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > max
  ) {
    throw new Error(
      `${field} must be bounded non-empty text`,
    );
  }

  return value;
}

function safeInteger(
  value: unknown,
  field: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${field} must be a non-negative safe integer`,
    );
  }

  return value;
}

function hex(
  value: unknown,
  chars: number,
  field: string,
): string {
  if (
    typeof value !== "string" ||
    !new RegExp(
      `^[0-9a-f]{${chars}}$`,
    ).test(value)
  ) {
    throw new Error(
      `${field} must be ${chars}-hex`,
    );
  }

  return value;
}

/*
 * Fixed-order, length-prefixed serialization.
 *
 * We intentionally do NOT call JSON.stringify(record)
 * and call it canonical. Each field is explicitly named,
 * validated, ordered and length-prefixed.
 */
function part(
  name: string,
  value: string | number | boolean,
): string {
  const text =
    typeof value === "string"
      ? value
      : String(value);

  return `${name}:${text.length}:${text}`;
}

export function canonicalizeXviInstructionAdoptionRecord(
  record:
    Readonly<InstructionAdoptionRecord>,
): string {
  assertRecordNonExecuting(
    record,
  );

  const fields = [
    part(
      "kind",
      boundedText(
        record.kind,
        "kind",
      ),
    ),

    part(
      "tenantId",
      boundedText(
        record.tenantId,
        "tenantId",
      ),
    ),

    part(
      "universeId",
      boundedText(
        record.universeId,
        "universeId",
      ),
    ),

    part(
      "storyId",
      boundedText(
        record.storyId,
        "storyId",
      ),
    ),

    part(
      "storyIdIsAnUnverifiedCallerAssertion",
      record.storyIdIsAnUnverifiedCallerAssertion,
    ),

    part(
      "sourceRevision",
      boundedText(
        record.sourceRevision,
        "sourceRevision",
      ),
    ),

    part(
      "instructionId",
      boundedText(
        record.instructionId,
        "instructionId",
      ),
    ),

    part(
      "workflowId",
      boundedText(
        record.workflowId,
        "workflowId",
      ),
    ),

    part(
      "actionId",
      boundedText(
        record.actionId,
        "actionId",
      ),
    ),

    part(
      "instructionDigest",
      hex(
        record.instructionDigest,
        64,
        "instructionDigest",
      ),
    ),

    part(
      "cellPlanDigest",
      hex(
        record.cellPlanDigest,
        64,
        "cellPlanDigest",
      ),
    ),

    part(
      "cellAdoptionDigest",
      hex(
        record.cellAdoptionDigest,
        64,
        "cellAdoptionDigest",
      ),
    ),

    part(
      "eventPlaneDigest",
      hex(
        record.eventPlaneDigest,
        64,
        "eventPlaneDigest",
      ),
    ),

    part(
      "bindingDigest",
      hex(
        record.bindingDigest,
        64,
        "bindingDigest",
      ),
    ),

    part(
      "operatorReceiptSha256",
      hex(
        record.operatorReceiptSha256,
        64,
        "operatorReceiptSha256",
      ),
    ),

    part(
      "policyVersion",
      boundedText(
        record.policyVersion,
        "policyVersion",
      ),
    ),

    part(
      "adoptedAtMs",
      safeInteger(
        record.adoptedAtMs,
        "adoptedAtMs",
      ),
    ),

    part(
      "expiresAtMs",
      safeInteger(
        record.expiresAtMs,
        "expiresAtMs",
      ),
    ),

    part(
      "trafficMoved",
      record.trafficMoved,
    ),

    part(
      "authorizedTrafficBps",
      record.authorizedTrafficBps,
    ),

    part(
      "executionStarted",
      record.executionStarted,
    ),

    part(
      "productionMutationAllowed",
      record.productionMutationAllowed,
    ),

    part(
      "realCellsProvisioned",
      record.realCellsProvisioned,
    ),

    part(
      "databasesProvisioned",
      record.databasesProvisioned,
    ),

    part(
      "rowsMoved",
      record.rowsMoved,
    ),

    part(
      "humanDecision",
      boundedText(
        record.humanDecision,
        "humanDecision",
      ),
    ),

    part(
      "learningPromoted",
      record.learningPromoted,
    ),

    part(
      "modelCalls",
      record.modelCalls,
    ),

    part(
      "remoteCalls",
      record.remoteCalls,
    ),

    part(
      "billionUsersProven",
      record.billionUsersProven,
    ),

    part(
      "automaticRecovery",
      record.automaticRecovery,
    ),
  ];

  return [
    "xvi-instruction-adoption-record-v1",
    ...fields,
  ].join("|");
}

export function digestXviInstructionAdoptionRecord(
  record:
    Readonly<InstructionAdoptionRecord>,
): string {
  return sha256(
    canonicalizeXviInstructionAdoptionRecord(
      record,
    ),
  );
}

function deriveCellAdoptionDigest(
  adoption:
    XviCognitiveAdoptionPackage["cellAdoption"],
): string {
  return sha256(
    JSON.stringify({
      planDigestSha256:
        adoption.planDigestSha256,
      epoch:
        adoption.epoch,
      cellCount:
        adoption.cellCount,
      shardCount:
        adoption.shardCount,
      totals:
        adoption.totals,
      adoptedBy:
        adoption.adoptedBy,
      adoptedAtMs:
        adoption.adoptedAtMs,
      operatorReceiptSha256:
        adoption.operatorReceiptSha256,
    }),
  );
}

function deriveBindingDigest(
  binding:
    XviCognitiveAdoptionPackage["cellBinding"],
): string {
  return sha256(
    JSON.stringify({
      kind:
        binding.kind,
      planEpoch:
        binding.planEpoch,
      cellPlanDigestSha256:
        binding.cellPlanDigestSha256,
      cellCount:
        binding.cellCount,
      shardCount:
        binding.shardCount,
      streamCount:
        binding.streamCount,
      replicatedStreamCount:
        binding.replicatedStreamCount,
    }),
  );
}

function replayClaimFromPackage(
  input: {
    route:
      Extract<
        XviCognitiveLineageRoute,
        {
          kind:
            "SUPPORTED_ADOPTION_LINEAGE";
        }
      >;

    adoptionPackage:
      XviCognitiveAdoptionPackage;
  },
): XviDurableAdoptionReplayClaim {
  if (
    input.route.scope !==
    input.adoptionPackage.scope
  ) {
    throw new Error(
      "lineage scope does not match adoption package",
    );
  }

  /*
   * These three digests are the exact replay identity
   * dimensions used by the existing instruction adoption
   * contract. They are supplied by the already-adopted
   * placement/binding lineage and reverified downstream.
   */
  const cellAdoptionDigest =
    deriveCellAdoptionDigest(
      input.adoptionPackage.cellAdoption,
    );

  const bindingDigest =
    deriveBindingDigest(
      input.adoptionPackage.cellBinding,
    );

  const canonicalExecutionPolicy =
    input.route.scope === "SCALING"
      ? SCALING_EXECUTION_POLICY
      : FAILOVER_EXECUTION_POLICY;

  const instructionDigest =
    deriveProposalDigest({
      workflowId:
        input.adoptionPackage
          .workflow.workflowId,

      actionId:
        input.adoptionPackage
          .instruction.actionId,

      description:
        input.adoptionPackage
          .instruction.minimumAction,

      toolId:
        canonicalExecutionPolicy
          .executionToolId,

      riskClass:
        canonicalExecutionPolicy
          .requiredRiskClass,
    });

  return Object.freeze({
    scope:
      input.route.scope,

    tenantId:
      input.adoptionPackage.tenantId,

    universeId:
      input.adoptionPackage.universeId,

    instructionDigest,

    cellAdoptionDigest:
      hex(
        cellAdoptionDigest,
        64,
        "cellAdoptionDigest",
      ),

    bindingDigest:
      hex(
        bindingDigest,
        64,
        "bindingDigest",
      ),

    workflowId:
      input.adoptionPackage
        .workflow.workflowId,

    actionId:
      input.adoptionPackage
        .instruction.actionId,

    sourceRevision:
      hex(
        input.adoptionPackage
          .sourceRevision,
        40,
        "sourceRevision",
      ),

    adoptedAtMs:
      input.adoptionPackage
        .recordedAtMs,
  });
}

export function coordinateXviCognitiveAdoption(
  input: {
    route:
      XviCognitiveLineageRoute;

    adoptionPackage:
      XviCognitiveAdoptionPackage;

    gate:
      InstructionAdoptionGate;

    coordinator:
      XviDurableAdoptionCoordinator;

    reservationAtMs:
      number;

    commitAtMs:
      number;

    abortAtMs:
      number;
  },
): XviCoordinatedCognitiveAdoptionResult {
  requireSupportedRoute(
    input.route,
  );

  const replayClaim =
    replayClaimFromPackage({
      route:
        input.route,

      adoptionPackage:
        input.adoptionPackage,
    });

  const replayKey =
    deriveXviDurableAdoptionReplayKey(
      replayClaim,
    );

  const reservation =
    input.coordinator.reserve(
      replayKey,
      input.reservationAtMs,
    );

  let adoption:
    XviCognitiveAdoptionResult;

  try {
    adoption =
      adoptXviCognitiveInstruction({
        route:
          input.route,

        adoptionPackage:
          input.adoptionPackage,

        gate:
          input.gate,
      });
  } catch (error) {
    /*
     * This catch covers a known, synchronous verification
     * failure while the process is still alive.
     *
     * A process crash cannot execute this catch; therefore
     * the durable state remains RESERVED and requires
     * explicit reviewed recovery.
     */
    input.coordinator.abort({
      replayKey,
      reservationId:
        reservation.reservationId,
      nowMs:
        input.abortAtMs,
    });

    throw error;
  }

  assertRecordNonExecuting(
    adoption.record,
  );

  const canonicalRecord =
    canonicalizeXviInstructionAdoptionRecord(
      adoption.record,
    );

  const adoptionRecordDigest =
    sha256(
      canonicalRecord,
    );

  const commit =
    input.coordinator.commit({
      replayKey,
      reservationId:
        reservation.reservationId,
      adoptionRecordCanonicalJson:
        canonicalRecord,
      nowMs:
        input.commitAtMs,
    });

  if (
    commit.adoptionRecordDigest !==
    adoptionRecordDigest
  ) {
    throw new Error(
      "durable commit digest mismatch",
    );
  }

  return Object.freeze({
    kind:
      "XVI_COORDINATED_COGNITIVE_ADOPTION_RESULT",

    replayKey,

    adoption,

    commit,

    adoptionRecordDigest,

    executesNothing:
      true,

    productionAuthority:
      false,

    automaticRetryAllowed:
      false,

    authority:
      "NONE",
  });
}
