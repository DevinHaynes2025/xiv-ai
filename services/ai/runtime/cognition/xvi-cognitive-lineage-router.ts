import type {
  XviCognitiveSafetyAuthorization,
} from "./xvi-cognitive-safety-authorization";

export type XviAdoptionLineageScope =
  | "SCALING"
  | "FAILOVER";

export type XviCognitiveLineageRoute =
  | Readonly<{
      kind: "SUPPORTED_ADOPTION_LINEAGE";
      scope: XviAdoptionLineageScope;
      sourceInstructionDigest: string;
      safetyWorkflowId: string;
      actionId: string;
      executesNothing: true;
      grantsNoProductionAuthority: true;
      authority: "NONE";
    }>
  | Readonly<{
      kind: "REFUSED_NO_SUPPORTED_ADOPTION_LINEAGE";
      scope: null;
      sourceInstructionDigest: string;
      safetyWorkflowId: string;
      actionId: string;
      executesNothing: true;
      grantsNoProductionAuthority: true;
      authority: "NONE";
    }>;

const SCALING_ACTION_PREFIX = "scaling.exec.";
const FAILOVER_ACTION_PREFIX = "failover.exec.";

function classifyLineage(
  authorization: XviCognitiveSafetyAuthorization,
): XviAdoptionLineageScope | null {
  const actionId = authorization.instruction.actionId;

  /*
   * Gate 20 performs lineage-family recognition only.
   *
   * It does NOT prove that the instruction has valid
   * scaling/failover provenance and does NOT authorize
   * adoption. The downstream InstructionAdoptionGate
   * must independently re-verify the complete lineage.
   */

  if (actionId.startsWith(SCALING_ACTION_PREFIX)) {
    return "SCALING";
  }

  if (actionId.startsWith(FAILOVER_ACTION_PREFIX)) {
    return "FAILOVER";
  }

  return null;
}

function assertAuthorizationInvariant(
  authorization: XviCognitiveSafetyAuthorization,
): void {
  if (authorization.authority !== "NONE") {
    throw new Error(
      "cognitive authorization must carry zero authority",
    );
  }

  if (authorization.realActionExecuted !== false) {
    throw new Error(
      "cognitive authorization cannot claim a real action",
    );
  }

  if (authorization.productionExecutionAllowed !== false) {
    throw new Error(
      "cognitive authorization cannot grant production execution",
    );
  }

  if (authorization.instruction.executedByThisRuntime !== false) {
    throw new Error(
      "minimum-action instruction cannot claim runtime execution",
    );
  }

  if (
    authorization.instruction.productionExecutionAllowed !== false
  ) {
    throw new Error(
      "minimum-action instruction cannot grant production execution",
    );
  }

  if (authorization.instruction.automaticRecovery !== false) {
    throw new Error(
      "minimum-action instruction cannot enable automatic recovery",
    );
  }

  if (
    authorization.instruction.workflowId !==
    authorization.safetyWorkflowId
  ) {
    throw new Error(
      "safety workflow identity mismatch",
    );
  }
}

export function routeXviCognitiveAuthorizationToLineage(
  authorization: XviCognitiveSafetyAuthorization,
): XviCognitiveLineageRoute {
  assertAuthorizationInvariant(authorization);

  const scope = classifyLineage(authorization);

  const common = Object.freeze({
    sourceInstructionDigest:
      authorization.sourceInstructionDigest,
    safetyWorkflowId:
      authorization.safetyWorkflowId,
    actionId:
      authorization.instruction.actionId,
    executesNothing: true as const,
    grantsNoProductionAuthority: true as const,
    authority: "NONE" as const,
  });

  if (scope === null) {
    return Object.freeze({
      kind:
        "REFUSED_NO_SUPPORTED_ADOPTION_LINEAGE" as const,
      scope: null,
      ...common,
    });
  }

  return Object.freeze({
    kind: "SUPPORTED_ADOPTION_LINEAGE" as const,
    scope,
    ...common,
  });
}
