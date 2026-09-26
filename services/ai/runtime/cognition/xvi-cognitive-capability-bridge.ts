import {
  CAPABILITY_POLICY_VERSION,
  type CapabilityRequest,
} from "../offline-team/xvi-capability-contract";

import type {
  XviCognitiveMissionPipeline,
} from "./xvi-cognitive-mission-pipeline";

export type XviCognitiveCapabilityProposal =
  Readonly<{
    request: Readonly<CapabilityRequest>;

    missionId: string;

    pipelineState:
      "READY_FOR_BOUNDED_EXECUTION";

    cognitiveAuthority: "NONE";

    executionPermitted: false;

    approvalAttached: false;

    authority: "NONE";
  }>;

function requireIdentifier(
  value: string,
  field: string,
): string {
  if (
    !/^[a-z][a-z0-9-]{0,31}$/.test(
      value,
    )
  ) {
    throw new Error(
      `${field} must satisfy capability identifier format`,
    );
  }

  return value;
}

function requireRequestId(
  value: string,
): string {
  return requireIdentifier(
    value,
    "requestId",
  );
}

export function bridgeXviCognitiveMissionToCapability(
  input: {
    pipeline:
      XviCognitiveMissionPipeline;

    requestId: string;

    tenantId: string;
    universeId: string;
    actorId: string;

    baseRevision: number;

    consent: boolean;
  },
): XviCognitiveCapabilityProposal {
  if (
    input.pipeline.state !==
    "READY_FOR_BOUNDED_EXECUTION"
  ) {
    throw new Error(
      "cognitive mission is not ready for capability proposal",
    );
  }

  if (
    input.pipeline.executionPermitted !==
      false ||
    input.pipeline.authority !== "NONE"
  ) {
    throw new Error(
      "cognitive pipeline authority invariant violated",
    );
  }

  if (
    !Number.isSafeInteger(
      input.baseRevision,
    ) ||
    input.baseRevision < 0
  ) {
    throw new Error(
      "baseRevision must be a non-negative safe integer",
    );
  }

  const request:
    Readonly<CapabilityRequest> =
      Object.freeze({
        requestId:
          requireRequestId(
            input.requestId,
          ),

        executionMode:
          "OFFLINE_ONLY",

        tenantId:
          requireIdentifier(
            input.tenantId,
            "tenantId",
          ),

        universeId:
          requireIdentifier(
            input.universeId,
            "universeId",
          ),

        actorId:
          requireIdentifier(
            input.actorId,
            "actorId",
          ),

        purpose:
          "REVIEW_CAPABILITIES",

        policyVersion:
          CAPABILITY_POLICY_VERSION,

        baseRevision:
          input.baseRevision,

        operation:
          "PROPOSE_LOCAL_CHANGE",

        targetMode: null,

        consent:
          input.consent,
      });

  return Object.freeze({
    request,

    missionId:
      input.pipeline.missionId,

    pipelineState:
      "READY_FOR_BOUNDED_EXECUTION",

    cognitiveAuthority:
      "NONE",

    executionPermitted:
      false,

    approvalAttached:
      false,

    authority:
      "NONE",
  });
}
