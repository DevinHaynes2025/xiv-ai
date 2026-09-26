import type {
  GatewayExecutionRecord,
} from "../offline-team/gateway-executor";

import {
  openDecisionWorkflow,
  proposeGovernedAction,
  type ActionProposal,
  type AgentIdentity,
  type DecisionSafetyWorkflow,
} from "../offline-team/agent-decision-safety-workflow";

export type XviSafetyRiskClass =
  | "LOW_RISK"
  | "PAYMENT"
  | "PRIVILEGED_ACCESS"
  | "DELETION"
  | "PRODUCTION_CONFIGURATION"
  | "EMPLOYEE_ACTION"
  | "MATERIAL_FINANCIAL"
  | "SENSITIVE_EXTERNAL_COMMUNICATION";

export type XviCognitiveSafetyEnvelope = Readonly<{
  sourceInstructionDigest: string;
  riskClass: XviSafetyRiskClass;

  workflow: Readonly<DecisionSafetyWorkflow>;
  proposal: Readonly<ActionProposal>;

  authorized: false;
  executesNothing: true;
  grantsNoProductionAuthority: true;
  authority: "NONE";
}>;

function mapGatewayActionToRisk(
  actionClass: string,
): XviSafetyRiskClass {
  switch (actionClass) {
    case "PRODUCTION_DEPLOYMENT":
      return "PRODUCTION_CONFIGURATION";

    case "FINANCIAL_TRANSACTION":
      return "MATERIAL_FINANCIAL";

    case "PERMANENT_DATA_DELETION":
      return "DELETION";

    case "EXTERNAL_COMMUNICATIONS":
      return "SENSITIVE_EXTERNAL_COMMUNICATION";

    case "PERMISSION_EXPANSION":
    case "PERSONAL_DATA_EXPORT":
      return "PRIVILEGED_ACCESS";

    case "ANALYZE_APPROVED_DATA":
    case "RETRIEVE_DOCUMENTS":
    case "GENERATE_REPORTS":
    case "UPDATE_AGENT_MEMORY":
    case "CREATE_TEST_CASES":
    case "EXECUTE_SANDBOX_TESTS":
    case "RETRY_RECOVERABLE_FAILURES":
    case "DEPLOY_TO_STAGING":
    case "ROLLBACK_FAILED_VERSIONS":
      return "LOW_RISK";

    default:
      throw new Error(
        `no safety-risk mapping for gateway action class: ${actionClass}`,
      );
  }
}

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
      `${field} has invalid safety identifier format`,
    );
  }

  return value;
}

export function bridgeXviExecutorInstructionToSafety(input: {
  execution: Readonly<GatewayExecutionRecord>;

  identityId: string;
  approvedTools: readonly string[];
  dataBoundaries: readonly string[];

  actionPolicy:
    | "ADVISE_ONLY"
    | "BOUNDED_AUTOMATION";

  purpose: string;

  nowMs: number;
  timeLimitMs: number;
}): XviCognitiveSafetyEnvelope {
  if (
    input.execution.kind !==
    "EXECUTION_INSTRUCTION_ISSUED"
  ) {
    throw new Error(
      "only an issued gateway instruction may enter cognitive safety",
    );
  }

  if (
    input.execution.instructionDigest === null ||
    !/^[0-9a-f]{64}$/.test(
      input.execution.instructionDigest,
    )
  ) {
    throw new Error(
      "gateway instruction digest required",
    );
  }

  if (
    input.execution.flags.executesNothing !== true ||
    input.execution.flags.materializesNothing !== true ||
    input.execution.flags.grantsNoProductionAuthority !== true
  ) {
    throw new Error(
      "gateway instruction safety invariant violated",
    );
  }

  const identity: AgentIdentity = {
    identityId: requireId(
      input.identityId,
      "identityId",
    ),

    approvedTools: Object.freeze([
      ...input.approvedTools,
    ]),

    dataBoundaries: Object.freeze([
      ...input.dataBoundaries,
    ]),

    actionPolicy: input.actionPolicy,
  };

  const workflow =
    openDecisionWorkflow({
      identity,
      purpose: input.purpose,
      nowMs: input.nowMs,
      timeLimitMs: input.timeLimitMs,
    });

  const riskClass =
    mapGatewayActionToRisk(
      input.execution.actionClass,
    );

  const actionId = requireId(
    `xvi-${input.execution.taskId}`,
    "actionId",
  );

  const governed =
    proposeGovernedAction(
      workflow,
      {
        actionId,

        description:
          `Governed cognitive proposal for ${input.execution.actionClass}`,

        toolId:
          input.execution.toolId,

        riskClass,

        proposedAtMs:
          input.nowMs,
      },
    );

  if (
    governed.workflow.stage !==
    "RISK_CHECK"
  ) {
    throw new Error(
      "cognitive safety bridge must stop at RISK_CHECK",
    );
  }

  if (
    governed.proposal.productionExecutionAllowed !== false ||
    governed.proposal.automaticRecovery !== false
  ) {
    throw new Error(
      "governed proposal authority invariant violated",
    );
  }

  return Object.freeze({
    sourceInstructionDigest:
      input.execution.instructionDigest,

    riskClass,

    workflow: governed.workflow,
    proposal: governed.proposal,

    authorized: false,

    executesNothing: true,

    grantsNoProductionAuthority: true,

    authority: "NONE",
  });
}
