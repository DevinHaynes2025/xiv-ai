import type { XviBrainId } from "./xvi-cognitive-brain-registry";
import {
  getXviModelForBrain,
  type XviModelDefinition,
} from "./xvi-model-fabric";
import {
  getXviQCore,
  type XviQCore,
  type XviQCoreId,
  type XviQuantumExecutionClass,
} from "./xvi-quantum-fabric";

export type XviMissionRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type XviMissionBudget = Readonly<{
  maxModelCalls: number;
  maxAgentSteps: number;
  maxRuntimeMs: number;
}>;

export type XviCognitiveMission = Readonly<{
  missionId: string;
  objective: string;

  primaryBrain: XviBrainId;

  risk: XviMissionRisk;

  qCore?: XviQCoreId;

  requestedQuantumExecution?: XviQuantumExecutionClass;

  budget: XviMissionBudget;
}>;

export type XviCognitiveRoute = Readonly<{
  missionId: string;

  primaryBrain: XviBrainId;

  model: XviModelDefinition;

  qCore?: XviQCore;

  quantumExecution:
    | XviQuantumExecutionClass
    | "NOT_REQUESTED";

  securityReviewRequired: boolean;

  verificationRequired: true;

  executionPermitted: false;

  authority: "NONE";
}>;

function requireNonEmpty(
  value: string,
  field: string,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} must be non-empty`);
  }

  return normalized;
}

function validateBudget(
  budget: XviMissionBudget,
): void {
  const entries = [
    ["maxModelCalls", budget.maxModelCalls],
    ["maxAgentSteps", budget.maxAgentSteps],
    ["maxRuntimeMs", budget.maxRuntimeMs],
  ] as const;

  for (const [name, value] of entries) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new Error(
        `${name} must be a positive safe integer`,
      );
    }
  }
}

export function routeXviCognitiveMission(
  mission: XviCognitiveMission,
): XviCognitiveRoute {
  const missionId = requireNonEmpty(
    mission.missionId,
    "missionId",
  );

  requireNonEmpty(
    mission.objective,
    "objective",
  );

  validateBudget(mission.budget);

  const model = getXviModelForBrain(
    mission.primaryBrain,
  );

  const qCore = mission.qCore
    ? getXviQCore(mission.qCore)
    : undefined;

  if (
    mission.requestedQuantumExecution &&
    !qCore
  ) {
    throw new Error(
      "quantum execution requires a Q-Core",
    );
  }

  if (
    qCore &&
    !mission.requestedQuantumExecution
  ) {
    throw new Error(
      "Q-Core requires an explicit quantum execution class",
    );
  }

  if (
    mission.requestedQuantumExecution ===
      "QPU_VERIFIED" &&
    qCore?.hardwareState !== undefined &&
    qCore.hardwareState !== "NOT_VERIFIED"
  ) {
    throw new Error(
      "unexpected Q-Core hardware state",
    );
  }

  if (
    mission.requestedQuantumExecution ===
    "QPU_VERIFIED"
  ) {
    throw new Error(
      "QPU_VERIFIED execution unavailable without verified hardware evidence",
    );
  }

  const securityReviewRequired =
    mission.risk === "HIGH" ||
    mission.risk === "CRITICAL";

  return Object.freeze({
    missionId,
    primaryBrain: mission.primaryBrain,
    model,
    ...(qCore ? { qCore } : {}),
    quantumExecution:
      mission.requestedQuantumExecution ??
      "NOT_REQUESTED",
    securityReviewRequired,
    verificationRequired: true,
    executionPermitted: false,
    authority: "NONE",
  });
}
