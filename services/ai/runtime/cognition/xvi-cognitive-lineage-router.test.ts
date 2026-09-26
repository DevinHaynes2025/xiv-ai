import assert from "node:assert/strict";
import test from "node:test";

import type {
  XviCognitiveSafetyAuthorization,
} from "./xvi-cognitive-safety-authorization";

import {
  routeXviCognitiveAuthorizationToLineage,
} from "./xvi-cognitive-lineage-router";

function authorization(
  actionId: string,
): XviCognitiveSafetyAuthorization {
  return Object.freeze({
    sourceInstructionDigest: "a".repeat(64),
    safetyWorkflowId: "b".repeat(64),
    riskClass: "LOW_RISK",

    instruction: Object.freeze({
      kind: "EXECUTION_INSTRUCTION",
      workflowId: "b".repeat(64),
      actionId,
      minimumAction: "bounded lineage test instruction",
      executedByThisRuntime: false,
      productionExecutionAllowed: false,
      validUntilMs: 1_000_060_000,
      humanDecision: "REQUIRED",
      automaticRecovery: false,
    }),

    receiptRequired: false,
    realActionExecuted: false,
    productionExecutionAllowed: false,
    authority: "NONE",
  });
}

test(
  "canonical scaling execution identity routes to scaling lineage",
  () => {
    const route =
      routeXviCognitiveAuthorizationToLineage(
        authorization(
          "scaling.exec.0123456789abcdef.2",
        ),
      );

    assert.equal(
      route.kind,
      "SUPPORTED_ADOPTION_LINEAGE",
    );
    assert.equal(route.scope, "SCALING");
    assert.equal(route.executesNothing, true);
    assert.equal(
      route.grantsNoProductionAuthority,
      true,
    );
    assert.equal(route.authority, "NONE");
  },
);

test(
  "canonical failover execution identity routes to failover lineage",
  () => {
    const route =
      routeXviCognitiveAuthorizationToLineage(
        authorization(
          "failover.exec.0123456789abcdef.300",
        ),
      );

    assert.equal(
      route.kind,
      "SUPPORTED_ADOPTION_LINEAGE",
    );
    assert.equal(route.scope, "FAILOVER");
    assert.equal(route.executesNothing, true);
    assert.equal(
      route.grantsNoProductionAuthority,
      true,
    );
  },
);

test(
  "generic cognitive instruction has no supported adoption lineage",
  () => {
    const route =
      routeXviCognitiveAuthorizationToLineage(
        authorization("xvi-task-20"),
      );

    assert.equal(
      route.kind,
      "REFUSED_NO_SUPPORTED_ADOPTION_LINEAGE",
    );
    assert.equal(route.scope, null);
    assert.equal(route.executesNothing, true);
    assert.equal(route.authority, "NONE");
  },
);

test(
  "near-prefix scaling identity does not qualify",
  () => {
    const route =
      routeXviCognitiveAuthorizationToLineage(
        authorization(
          "scaling.0123456789abcdef.2",
        ),
      );

    assert.equal(
      route.kind,
      "REFUSED_NO_SUPPORTED_ADOPTION_LINEAGE",
    );
    assert.equal(route.scope, null);
  },
);

test(
  "near-prefix failover identity does not qualify",
  () => {
    const route =
      routeXviCognitiveAuthorizationToLineage(
        authorization(
          "failover.0123456789abcdef.300",
        ),
      );

    assert.equal(
      route.kind,
      "REFUSED_NO_SUPPORTED_ADOPTION_LINEAGE",
    );
    assert.equal(route.scope, null);
  },
);

test(
  "supported lineage route still grants no execution authority",
  () => {
    const route =
      routeXviCognitiveAuthorizationToLineage(
        authorization(
          "scaling.exec.abcdef0123456789.4",
        ),
      );

    assert.equal(
      route.kind,
      "SUPPORTED_ADOPTION_LINEAGE",
    );
    assert.equal(route.executesNothing, true);
    assert.equal(
      route.grantsNoProductionAuthority,
      true,
    );
    assert.equal(route.authority, "NONE");
  },
);
