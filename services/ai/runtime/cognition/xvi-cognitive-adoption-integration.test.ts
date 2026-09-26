import assert from "node:assert/strict";
import test from "node:test";

import {
  adoptXviCognitiveInstruction,
  type XviCognitiveAdoptionPackage,
} from "./xvi-cognitive-adoption-integration";

import type {
  XviCognitiveLineageRoute,
} from "./xvi-cognitive-lineage-router";

class RefusingGate {
  adoptInstruction(): never {
    throw new Error(
      "DOWNSTREAM_ADOPTION_REACHED",
    );
  }
}

function unsupportedRoute():
  XviCognitiveLineageRoute {
  return Object.freeze({
    kind:
      "REFUSED_NO_SUPPORTED_ADOPTION_LINEAGE",
    scope: null,
    sourceInstructionDigest:
      "a".repeat(64),
    safetyWorkflowId:
      "b".repeat(64),
    actionId:
      "xvi-task-21",
    executesNothing: true,
    grantsNoProductionAuthority: true,
    authority: "NONE",
  });
}

function supportedRoute(
  scope: "SCALING" | "FAILOVER",
  actionId: string,
):
  XviCognitiveLineageRoute {
  return Object.freeze({
    kind:
      "SUPPORTED_ADOPTION_LINEAGE",
    scope,
    sourceInstructionDigest:
      "a".repeat(64),
    safetyWorkflowId:
      "b".repeat(64),
    actionId,
    executesNothing: true,
    grantsNoProductionAuthority: true,
    authority: "NONE",
  });
}

function minimalPackage(
  scope: "SCALING" | "FAILOVER",
  actionId: string,
): XviCognitiveAdoptionPackage {
  const common = {
    tenantId: "tenant.alpha",
    universeId: "universe.alpha-main",
    storyId: "12D-222",
    sourceRevision: "a".repeat(40),

    executionGrant: Object.freeze({
      operatorReceiptSha256:
        "c".repeat(64),
      approvedBy: "ceo",
    }),

    instruction: Object.freeze({
      kind:
        "EXECUTION_INSTRUCTION" as const,
      workflowId:
        "b".repeat(64),
      actionId,
      minimumAction:
        "bounded adoption integration test",
      executedByThisRuntime:
        false as const,
      productionExecutionAllowed:
        false as const,
      validUntilMs:
        1_000_060_000,
      humanDecision:
        "REQUIRED" as const,
      automaticRecovery:
        false as const,
    }),

    workflow: Object.freeze({
      kind:
        "DECISION_SAFETY_WORKFLOW" as const,
      workflowId:
        "b".repeat(64),
      identity: Object.freeze({
        identityId:
          "agent.test",
        approvedTools: Object.freeze([
          "test-tool",
        ]),
        dataBoundaries: Object.freeze([
          "test-boundary",
        ]),
        actionPolicy:
          "ADVISE_ONLY" as const,
      }),
      purpose:
        "Gate 21 structural integration test",
      stage:
        "EXECUTE_MINIMUM_ACTION",
      openedAtMs:
        1_000_000_000,
      expiresAtMs:
        1_000_060_000,
      events: Object.freeze([]),
      guardrails: Object.freeze({}) as never,
      humanDecision:
        "REQUIRED" as const,
      learningPromoted:
        false as const,
      modelCalls:
        0 as const,
      remoteCalls:
        0 as const,
      realActionsExecuted:
        0 as const,
      automaticRecovery:
        false as const,
    }),

    cellPlacementPlan:
      Object.freeze({}) as never,

    cellAdoption:
      Object.freeze({}) as never,

    eventPlanePlan:
      Object.freeze({}) as never,

    cellBinding:
      Object.freeze({}) as never,

    operatorReceiptSha256:
      "d".repeat(64),

    recordedAtMs:
      1_000_001_000,
  };

  if (scope === "SCALING") {
    return Object.freeze({
      scope: "SCALING" as const,
      ...common,
      decisionRecord:
        Object.freeze({}) as never,
      decisionProvenance:
        Object.freeze({}) as never,
    });
  }

  return Object.freeze({
    scope: "FAILOVER" as const,
    ...common,
    decisionRecord:
      Object.freeze({}) as never,
    decisionProvenance:
      Object.freeze({}) as never,
  });
}

test(
  "unsupported cognitive lineage is refused before downstream adoption",
  () => {
    const route =
      unsupportedRoute();

    const adoptionPackage =
      minimalPackage(
        "SCALING",
        "scaling.exec.0123456789abcdef.2",
      );

    assert.throws(
      () =>
        adoptXviCognitiveInstruction({
          route,
          adoptionPackage,
          gate:
            new RefusingGate() as never,
        }),
      /requires a supported adoption lineage/,
    );
  },
);

test(
  "scaling route cannot adopt a failover package",
  () => {
    const actionId =
      "scaling.exec.0123456789abcdef.2";

    const route =
      supportedRoute(
        "SCALING",
        actionId,
      );

    const adoptionPackage =
      minimalPackage(
        "FAILOVER",
        actionId,
      );

    assert.throws(
      () =>
        adoptXviCognitiveInstruction({
          route,
          adoptionPackage,
          gate:
            new RefusingGate() as never,
        }),
      /does not match adoption package scope/,
    );
  },
);

test(
  "route workflow must match package workflow before downstream adoption",
  () => {
    const actionId =
      "scaling.exec.0123456789abcdef.2";

    const route =
      Object.freeze({
        ...supportedRoute(
          "SCALING",
          actionId,
        ),
        safetyWorkflowId:
          "e".repeat(64),
      });

    const adoptionPackage =
      minimalPackage(
        "SCALING",
        actionId,
      );

    assert.throws(
      () =>
        adoptXviCognitiveInstruction({
          route,
          adoptionPackage,
          gate:
            new RefusingGate() as never,
        }),
      /does not match safety workflow/,
    );
  },
);

test(
  "route action must match package instruction before downstream adoption",
  () => {
    const route =
      supportedRoute(
        "SCALING",
        "scaling.exec.0123456789abcdef.2",
      );

    const adoptionPackage =
      minimalPackage(
        "SCALING",
        "scaling.exec.0123456789abcdef.3",
      );

    assert.throws(
      () =>
        adoptXviCognitiveInstruction({
          route,
          adoptionPackage,
          gate:
            new RefusingGate() as never,
        }),
      /does not match instruction action/,
    );
  },
);

test(
  "valid structural scaling route delegates to the existing adoption gate",
  () => {
    const actionId =
      "scaling.exec.0123456789abcdef.2";

    const route =
      supportedRoute(
        "SCALING",
        actionId,
      );

    const adoptionPackage =
      minimalPackage(
        "SCALING",
        actionId,
      );

    assert.throws(
      () =>
        adoptXviCognitiveInstruction({
          route,
          adoptionPackage,
          gate:
            new RefusingGate() as never,
        }),
      /DOWNSTREAM_ADOPTION_REACHED/,
    );
  },
);

test(
  "valid structural failover route delegates to the existing adoption gate",
  () => {
    const actionId =
      "failover.exec.0123456789abcdef.300";

    const route =
      supportedRoute(
        "FAILOVER",
        actionId,
      );

    const adoptionPackage =
      minimalPackage(
        "FAILOVER",
        actionId,
      );

    assert.throws(
      () =>
        adoptXviCognitiveInstruction({
          route,
          adoptionPackage,
          gate:
            new RefusingGate() as never,
        }),
      /DOWNSTREAM_ADOPTION_REACHED/,
    );
  },
);
