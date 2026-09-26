import type {
  AgentToolCallRequest,
} from "../offline-team/agent-policy-gateway";

import type {
  XviCognitiveCapabilityProposal,
} from "./xvi-cognitive-capability-bridge";

import {
  verifyXviCapabilityAdoption,
  type XviCapabilityAdoptionRecord,
} from "./xvi-capability-adoption";

export type XviGatewayCandidate =
  Readonly<{
    request:
      Readonly<AgentToolCallRequest>;

    missionId: string;

    adoptionDigest: string;

    approvalAttached: false;

    executesNothing: true;

    grantsNoProductionAuthority: true;

    authority: "NONE";
  }>;

function identifier(
  value: string,
  field: string,
  maxLength: number,
): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > maxLength ||
    !/^[A-Za-z0-9_.:@-]+$/.test(value)
  ) {
    throw new Error(
      `${field} has invalid gateway identifier format`,
    );
  }

  return value;
}

function nonNegativeSafeInteger(
  value: number,
  field: string,
): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${field} must be a non-negative safe integer`,
    );
  }

  return value;
}

function nonNegativeFinite(
  value: number,
  field: string,
): number {
  if (
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `${field} must be a non-negative finite number`,
    );
  }

  return value;
}

export function adaptXviCapabilityToGateway(
  input: {
    proposal:
      XviCognitiveCapabilityProposal;

    adoption:
      XviCapabilityAdoptionRecord;

    agentId: string;
    taskId: string;
    toolId: string;
    actionClass: string;

    attemptIndex: number;

    tokenEstimate: number;
    costEstimate: number;

    nowMs: number;
  },
): XviGatewayCandidate {
  const verified =
    verifyXviCapabilityAdoption({
      proposal:
        input.proposal,

      adoption:
        input.adoption,
    });

  if (
    verified.gatewayEligible !== true ||
    input.adoption.decision !==
      "APPROVED"
  ) {
    throw new Error(
      "capability adoption is not gateway eligible",
    );
  }

  if (
    input.proposal.executionPermitted !==
      false ||
    input.proposal.authority !==
      "NONE"
  ) {
    throw new Error(
      "cognitive capability authority invariant violated",
    );
  }

  const request:
    Readonly<AgentToolCallRequest> =
      Object.freeze({
        agentId:
          identifier(
            input.agentId,
            "agentId",
            128,
          ),

        taskId:
          identifier(
            input.taskId,
            "taskId",
            64,
          ),

        toolId:
          identifier(
            input.toolId,
            "toolId",
            128,
          ),

        actionClass:
          identifier(
            input.actionClass,
            "actionClass",
            128,
          ),

        attemptIndex:
          nonNegativeSafeInteger(
            input.attemptIndex,
            "attemptIndex",
          ),

        tokenEstimate:
          nonNegativeSafeInteger(
            input.tokenEstimate,
            "tokenEstimate",
          ),

        costEstimate:
          nonNegativeFinite(
            input.costEstimate,
            "costEstimate",
          ),

        auditLogged: true,

        nowMs:
          nonNegativeSafeInteger(
            input.nowMs,
            "nowMs",
          ),

        // Gate 14 review is NOT action authorization.
        approval: null,
      });

  return Object.freeze({
    request,

    missionId:
      input.proposal.missionId,

    adoptionDigest:
      verified.adoptionDigest,

    approvalAttached: false,

    executesNothing: true,

    grantsNoProductionAuthority:
      true,

    authority: "NONE",
  });
}
