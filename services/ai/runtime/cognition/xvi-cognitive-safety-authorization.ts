 import {
  authorizeMinimumAction,
  type ExecutionInstruction,
} from "../offline-team/agent-decision-safety-workflow";

import type {
  XviCognitiveSafetyEnvelope,
} from "./xvi-cognitive-safety-bridge";

export type XviCognitiveSafetyAuthorization =
  Readonly<{
    sourceInstructionDigest: string;

    safetyWorkflowId: string;

    riskClass:
      XviCognitiveSafetyEnvelope["riskClass"];

    instruction:
      Readonly<ExecutionInstruction>;

    receiptRequired: boolean;

    realActionExecuted: false;
    productionExecutionAllowed: false;
    authority: "NONE";
  }>;

const RECEIPT_REQUIRED =
  new Set<string>([
    "PAYMENT",
    "PRIVILEGED_ACCESS",
    "DELETION",
    "PRODUCTION_CONFIGURATION",
    "EMPLOYEE_ACTION",
    "MATERIAL_FINANCIAL",
    "SENSITIVE_EXTERNAL_COMMUNICATION",
  ]);

function requireId(
  value: string,
  field: string,
): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 128 ||
    !/^[A-Za-z0-9_.:@-]+$/.test(value)
  ) {
    throw new Error(
      `${field} has invalid identifier format`,
    );
  }

  return value;
}

export function authorizeXviCognitiveSafety(
  input: {
    envelope:
      XviCognitiveSafetyEnvelope;

    approvedBy: string;

    operatorReceiptSha256:
      string | null;

    nowMs: number;
  },
): XviCognitiveSafetyAuthorization {
  if (
    input.envelope.authorized !== false ||
    input.envelope.authority !== "NONE" ||
    input.envelope.executesNothing !== true ||
    input.envelope
      .grantsNoProductionAuthority !== true
  ) {
    throw new Error(
      "safety envelope authority invariant violated",
    );
  }

  if (
    input.envelope.workflow.stage !==
    "RISK_CHECK"
  ) {
    throw new Error(
      "safety authorization requires workflow at RISK_CHECK",
    );
  }

  if (
    input.envelope.proposal.workflowId !==
    input.envelope.workflow.workflowId
  ) {
    throw new Error(
      "safety proposal does not belong to workflow",
    );
  }

  const receiptRequired =
    RECEIPT_REQUIRED.has(
      input.envelope.riskClass,
    ) ||
    input.envelope.workflow
      .identity.actionPolicy ===
      "ADVISE_ONLY";

  if (
    receiptRequired &&
    (
      input.operatorReceiptSha256 === null ||
      !/^[0-9a-f]{64}$/.test(
        input.operatorReceiptSha256,
      )
    )
  ) {
    throw new Error(
      "receipt-backed authorization required",
    );
  }

  if (
    !receiptRequired &&
    input.operatorReceiptSha256 !== null &&
    !/^[0-9a-f]{64}$/.test(
      input.operatorReceiptSha256,
    )
  ) {
    throw new Error(
      "operator receipt malformed",
    );
  }

  const result =
    authorizeMinimumAction(
      input.envelope.workflow,
      input.envelope.proposal,
      {
        operatorReceiptSha256:
          input.operatorReceiptSha256,

        approvedBy:
          requireId(
            input.approvedBy,
            "approvedBy",
          ),

        nowMs:
          input.nowMs,
      },
    );

  if (
    result.workflow.stage !==
    "EXECUTE_MINIMUM_ACTION"
  ) {
    throw new Error(
      "authorization did not reach minimum-action instruction stage",
    );
  }

  if (
    result.instruction
      .executedByThisRuntime !== false ||
    result.instruction
      .productionExecutionAllowed !== false ||
    result.instruction
      .automaticRecovery !== false
  ) {
    throw new Error(
      "minimum-action instruction authority invariant violated",
    );
  }

  return Object.freeze({
    sourceInstructionDigest:
      input.envelope
        .sourceInstructionDigest,

    safetyWorkflowId:
      result.workflow.workflowId,

    riskClass:
      input.envelope.riskClass,

    instruction:
      result.instruction,

    receiptRequired,

    realActionExecuted: false,

    productionExecutionAllowed:
      false,

    authority: "NONE",
  });
}