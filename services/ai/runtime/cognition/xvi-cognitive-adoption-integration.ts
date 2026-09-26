import {
  InstructionAdoptionGate,
  type InstructionAdoptionRecord,
} from "../offline-team/instruction-adoption-gate";

import type {
  ScalingDecisionRecord,
  ScalingPlanProvenance,
} from "../offline-team/measured-horizontal-scaling";

import type {
  FailoverDecisionRecord,
  FailoverPlanProvenance,
} from "../offline-team/measured-regional-failover";

import type {
  DecisionSafetyWorkflow,
  ExecutionInstruction,
} from "../offline-team/agent-decision-safety-workflow";

import type {
  RegionalCellPlacementPlan,
} from "../offline-team/regional-cell-contract";

import type {
  DistributedEventPlanePlan,
} from "../offline-team/event-plane-contract";

import type {
  CellPlacementOperativeAdoption,
  EventPlaneCellBinding,
} from "../offline-team/cell-placement-adapter";

import type {
  XviCognitiveLineageRoute,
} from "./xvi-cognitive-lineage-router";

export type XviScalingAdoptionPackage = Readonly<{
  scope: "SCALING";
  tenantId: string;
  universeId: string;
  storyId: string;
  sourceRevision: string;
  decisionRecord: Readonly<ScalingDecisionRecord>;
  decisionProvenance: Readonly<ScalingPlanProvenance>;
  executionGrant: Readonly<{
    operatorReceiptSha256: string;
    approvedBy: string;
  }>;
  instruction: Readonly<ExecutionInstruction>;
  workflow: Readonly<DecisionSafetyWorkflow>;
  cellPlacementPlan: Readonly<RegionalCellPlacementPlan>;
  cellAdoption: Readonly<CellPlacementOperativeAdoption>;
  eventPlanePlan: Readonly<DistributedEventPlanePlan>;
  cellBinding: Readonly<EventPlaneCellBinding>;
  operatorReceiptSha256: string;
  recordedAtMs: number;
}>;

export type XviFailoverAdoptionPackage = Readonly<{
  scope: "FAILOVER";
  tenantId: string;
  universeId: string;
  storyId: string;
  sourceRevision: string;
  decisionRecord: Readonly<FailoverDecisionRecord>;
  decisionProvenance: Readonly<FailoverPlanProvenance>;
  executionGrant: Readonly<{
    operatorReceiptSha256: string;
    approvedBy: string;
  }>;
  instruction: Readonly<ExecutionInstruction>;
  workflow: Readonly<DecisionSafetyWorkflow>;
  cellPlacementPlan: Readonly<RegionalCellPlacementPlan>;
  cellAdoption: Readonly<CellPlacementOperativeAdoption>;
  eventPlanePlan: Readonly<DistributedEventPlanePlan>;
  cellBinding: Readonly<EventPlaneCellBinding>;
  operatorReceiptSha256: string;
  recordedAtMs: number;
}>;

export type XviCognitiveAdoptionPackage =
  | XviScalingAdoptionPackage
  | XviFailoverAdoptionPackage;

export type XviCognitiveAdoptionResult = Readonly<{
  kind: "XVI_COGNITIVE_ADOPTION_RESULT";
  scope: "SCALING" | "FAILOVER";
  record: Readonly<InstructionAdoptionRecord>;
  executesNothing: true;
  grantsNoProductionAuthority: true;
  authority: "NONE";
}>;

function requireSupportedRoute(
  route: XviCognitiveLineageRoute,
): asserts route is Extract<
  XviCognitiveLineageRoute,
  { kind: "SUPPORTED_ADOPTION_LINEAGE" }
> {
  if (route.kind !== "SUPPORTED_ADOPTION_LINEAGE") {
    throw new Error(
      "cognitive adoption requires a supported adoption lineage",
    );
  }
}

function assertRouteMatchesPackage(
  route: Extract<
    XviCognitiveLineageRoute,
    { kind: "SUPPORTED_ADOPTION_LINEAGE" }
  >,
  adoptionPackage: XviCognitiveAdoptionPackage,
): void {
  if (route.scope !== adoptionPackage.scope) {
    throw new Error(
      "cognitive lineage route does not match adoption package scope",
    );
  }

  if (
    route.safetyWorkflowId !==
    adoptionPackage.workflow.workflowId
  ) {
    throw new Error(
      "cognitive lineage route does not match safety workflow",
    );
  }

  if (
    route.actionId !==
    adoptionPackage.instruction.actionId
  ) {
    throw new Error(
      "cognitive lineage route does not match instruction action",
    );
  }

  if (
    route.executesNothing !== true ||
    route.grantsNoProductionAuthority !== true ||
    route.authority !== "NONE"
  ) {
    throw new Error(
      "cognitive lineage route authority invariant violated",
    );
  }
}

export function adoptXviCognitiveInstruction(input: {
  route: XviCognitiveLineageRoute;
  adoptionPackage: XviCognitiveAdoptionPackage;
  gate: InstructionAdoptionGate;
}): XviCognitiveAdoptionResult {
  requireSupportedRoute(input.route);

  assertRouteMatchesPackage(
    input.route,
    input.adoptionPackage,
  );

  const record =
    input.adoptionPackage.scope === "SCALING"
      ? input.gate.adoptInstruction({
          scope: "SCALING",
          tenantId: input.adoptionPackage.tenantId,
          universeId: input.adoptionPackage.universeId,
          storyId: input.adoptionPackage.storyId,
          sourceRevision:
            input.adoptionPackage.sourceRevision,
          decisionRecord:
            input.adoptionPackage.decisionRecord,
          decisionProvenance:
            input.adoptionPackage.decisionProvenance,
          executionGrant:
            input.adoptionPackage.executionGrant,
          instruction:
            input.adoptionPackage.instruction,
          workflow:
            input.adoptionPackage.workflow,
          cellPlacementPlan:
            input.adoptionPackage.cellPlacementPlan,
          cellAdoption:
            input.adoptionPackage.cellAdoption,
          eventPlanePlan:
            input.adoptionPackage.eventPlanePlan,
          cellBinding:
            input.adoptionPackage.cellBinding,
          operatorReceiptSha256:
            input.adoptionPackage.operatorReceiptSha256,
          recordedAtMs:
            input.adoptionPackage.recordedAtMs,
        })
      : input.gate.adoptInstruction({
          scope: "FAILOVER",
          tenantId: input.adoptionPackage.tenantId,
          universeId: input.adoptionPackage.universeId,
          storyId: input.adoptionPackage.storyId,
          sourceRevision:
            input.adoptionPackage.sourceRevision,
          decisionRecord:
            input.adoptionPackage.decisionRecord,
          decisionProvenance:
            input.adoptionPackage.decisionProvenance,
          executionGrant:
            input.adoptionPackage.executionGrant,
          instruction:
            input.adoptionPackage.instruction,
          workflow:
            input.adoptionPackage.workflow,
          cellPlacementPlan:
            input.adoptionPackage.cellPlacementPlan,
          cellAdoption:
            input.adoptionPackage.cellAdoption,
          eventPlanePlan:
            input.adoptionPackage.eventPlanePlan,
          cellBinding:
            input.adoptionPackage.cellBinding,
          operatorReceiptSha256:
            input.adoptionPackage.operatorReceiptSha256,
          recordedAtMs:
            input.adoptionPackage.recordedAtMs,
        });

  if (
    record.executionStarted !== false ||
    record.productionMutationAllowed !== false ||
    record.trafficMoved !== false ||
    record.authorizedTrafficBps !== 0 ||
    record.realCellsProvisioned !== 0 ||
    record.databasesProvisioned !== 0 ||
    record.rowsMoved !== 0
  ) {
    throw new Error(
      "instruction adoption record authority invariant violated",
    );
  }

  return Object.freeze({
    kind: "XVI_COGNITIVE_ADOPTION_RESULT",
    scope: input.adoptionPackage.scope,
    record,
    executesNothing: true,
    grantsNoProductionAuthority: true,
    authority: "NONE",
  });
}
