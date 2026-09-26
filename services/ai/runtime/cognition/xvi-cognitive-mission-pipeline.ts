import {
  createXviCognitiveWorkspace,
  type XviBrainWorkPacket,
  type XviCognitiveWorkspace,
} from "./xvi-cognitive-workspace";

import {
  scheduleXviCognitiveWorkspace,
  type XviCognitiveSchedule,
} from "./xvi-cognitive-scheduler";

import {
  createXviCognitiveResourcePlan,
  type XviCognitiveResourcePlan,
  type XviPacketComputePlan,
} from "./xvi-cognitive-resource-plan";

import {
  createXviClaimLedger,
  type XviClaim,
  type XviClaimLedger,
} from "./xvi-evidence-claim-fabric";

import {
  assessXviTemporalClaim,
  type XviTemporalAssessment,
  type XviTemporalEvidenceEnvelope,
} from "./xvi-temporal-evidence";

export type XviMissionPipelineState =
  | "READY_FOR_BOUNDED_EXECUTION"
  | "REVALIDATION_REQUIRED"
  | "BLOCKED";

export type XviTemporalBinding = Readonly<{
  claim: XviClaim;
  temporal: XviTemporalEvidenceEnvelope;
}>;

export type XviCognitiveMissionPipeline = Readonly<{
  missionId: string;

  workspace: XviCognitiveWorkspace;
  schedule: XviCognitiveSchedule;
  resourcePlan: XviCognitiveResourcePlan;
  claimLedger: XviClaimLedger;

  temporalAssessments:
    readonly XviTemporalAssessment[];

  state: XviMissionPipelineState;

  executionPermitted: false;
  authority: "NONE";
}>;

function requireNonEmpty(
  value: string,
  field: string,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(
      `${field} must be non-empty`,
    );
  }

  return normalized;
}

export function buildXviCognitiveMissionPipeline(input: {
  missionId: string;

  packets: readonly XviBrainWorkPacket[];

  packetPlans: readonly XviPacketComputePlan[];

  claims: readonly XviClaim[];

  temporalBindings:
    readonly XviTemporalBinding[];

  now: string;

  securityRequired?: boolean;
}): XviCognitiveMissionPipeline {
  const missionId = requireNonEmpty(
    input.missionId,
    "missionId",
  );

  const workspace =
    createXviCognitiveWorkspace({
      missionId,
      packets: input.packets,
      securityRequired:
        input.securityRequired,
    });

  const schedule =
    scheduleXviCognitiveWorkspace(
      workspace,
    );

  const resourcePlan =
    createXviCognitiveResourcePlan({
      workspace,
      packetPlans:
        input.packetPlans,
    });

  const claimLedger =
    createXviClaimLedger(
      missionId,
      input.claims,
    );

  const claimIds = new Set(
    input.claims.map(
      (claim) => claim.claimId,
    ),
  );

  const temporalIds = new Set(
    input.temporalBindings.map(
      (binding) =>
        binding.claim.claimId,
    ),
  );

  if (
    temporalIds.size !==
    input.temporalBindings.length
  ) {
    throw new Error(
      "temporal bindings contain duplicate claims",
    );
  }

  for (
    const binding of
    input.temporalBindings
  ) {
    if (
      !claimIds.has(
        binding.claim.claimId,
      )
    ) {
      throw new Error(
        `temporal binding references unknown claim: ${binding.claim.claimId}`,
      );
    }

    if (
      binding.claim.missionId !==
      missionId
    ) {
      throw new Error(
        `temporal claim ${binding.claim.claimId} belongs to another mission`,
      );
    }
  }

  const temporalAssessments =
    input.temporalBindings.map(
      (binding) =>
        assessXviTemporalClaim({
          claim: binding.claim,
          temporal:
            binding.temporal,
          now: input.now,
        }),
    );

  let state:
    XviMissionPipelineState;

  if (
    claimLedger.contestedCount > 0
  ) {
    state = "BLOCKED";
  } else if (
    temporalAssessments.some(
      (assessment) =>
        assessment.requiresRevalidation,
    )
  ) {
    state =
      "REVALIDATION_REQUIRED";
  } else {
    state =
      "READY_FOR_BOUNDED_EXECUTION";
  }

  return Object.freeze({
    missionId,
    workspace,
    schedule,
    resourcePlan,
    claimLedger,

    temporalAssessments:
      Object.freeze([
        ...temporalAssessments,
      ]),

    state,

    // READY does not itself grant authority.
    executionPermitted: false,

    authority: "NONE",
  });
}
