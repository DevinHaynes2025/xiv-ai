import type {
  XviBrainWorkPacket,
  XviCognitiveWorkspace,
} from "./xvi-cognitive-workspace";

import type {
  XviQCoreId,
  XviQuantumExecutionClass,
} from "./xvi-quantum-fabric";

export type XviPacketResourceBudget = Readonly<{
  maxModelCalls: number;
  maxAgentSteps: number;
  maxRuntimeMs: number;
  maxMemoryMb: number;
}>;

export type XviPacketComputePlan = Readonly<{
  packetId: string;
  brain: XviBrainWorkPacket["brain"];

  budget: XviPacketResourceBudget;

  qCore?: XviQCoreId;

  quantumExecution:
    | XviQuantumExecutionClass
    | "NOT_REQUESTED";

  executionPermitted: false;
  authority: "NONE";
}>;

export type XviCognitiveResourcePlan = Readonly<{
  missionId: string;
  packets: readonly XviPacketComputePlan[];

  totalModelCallBudget: number;
  totalAgentStepBudget: number;
  totalRuntimeBudgetMs: number;
  totalMemoryBudgetMb: number;

  executionPermitted: false;
  authority: "NONE";
}>;

function positiveSafeInteger(
  value: number,
  field: string,
): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(
      `${field} must be a positive safe integer`,
    );
  }

  return value;
}

function validateBudget(
  budget: XviPacketResourceBudget,
): XviPacketResourceBudget {
  return Object.freeze({
    maxModelCalls: positiveSafeInteger(
      budget.maxModelCalls,
      "maxModelCalls",
    ),

    maxAgentSteps: positiveSafeInteger(
      budget.maxAgentSteps,
      "maxAgentSteps",
    ),

    maxRuntimeMs: positiveSafeInteger(
      budget.maxRuntimeMs,
      "maxRuntimeMs",
    ),

    maxMemoryMb: positiveSafeInteger(
      budget.maxMemoryMb,
      "maxMemoryMb",
    ),
  });
}

export function createXviPacketComputePlan(input: {
  packet: XviBrainWorkPacket;
  budget: XviPacketResourceBudget;
  qCore?: XviQCoreId;
  quantumExecution?: XviQuantumExecutionClass;
}): XviPacketComputePlan {
  if (
    input.quantumExecution &&
    !input.qCore
  ) {
    throw new Error(
      "quantum execution requires a Q-Core",
    );
  }

  if (
    input.qCore &&
    !input.quantumExecution
  ) {
    throw new Error(
      "Q-Core requires explicit quantum execution class",
    );
  }

  if (
    input.quantumExecution ===
    "QPU_VERIFIED"
  ) {
    throw new Error(
      "QPU_VERIFIED compute cannot be planned without verified hardware evidence",
    );
  }

  return Object.freeze({
    packetId: input.packet.packetId,
    brain: input.packet.brain,

    budget: validateBudget(
      input.budget,
    ),

    ...(input.qCore
      ? { qCore: input.qCore }
      : {}),

    quantumExecution:
      input.quantumExecution ??
      "NOT_REQUESTED",

    executionPermitted: false,

    authority: "NONE",
  });
}

export function createXviCognitiveResourcePlan(input: {
  workspace: XviCognitiveWorkspace;
  packetPlans: readonly XviPacketComputePlan[];
}): XviCognitiveResourcePlan {
  const expectedIds = new Set(
    input.workspace.packets.map(
      (packet) => packet.packetId,
    ),
  );

  const suppliedIds = input.packetPlans.map(
    (plan) => plan.packetId,
  );

  if (
    new Set(suppliedIds).size !==
    suppliedIds.length
  ) {
    throw new Error(
      "resource plan contains duplicate packet IDs",
    );
  }

  if (
    suppliedIds.length !== expectedIds.size
  ) {
    throw new Error(
      "resource plan must cover every workspace packet exactly once",
    );
  }

  for (const packetId of suppliedIds) {
    if (!expectedIds.has(packetId)) {
      throw new Error(
        `resource plan contains unknown packet: ${packetId}`,
      );
    }
  }

  const sum = (
    selector: (
      plan: XviPacketComputePlan,
    ) => number,
  ): number =>
    input.packetPlans.reduce(
      (total, plan) =>
        total + selector(plan),
      0,
    );

  return Object.freeze({
    missionId:
      input.workspace.missionId,

    packets: Object.freeze([
      ...input.packetPlans,
    ]),

    totalModelCallBudget: sum(
      (plan) =>
        plan.budget.maxModelCalls,
    ),

    totalAgentStepBudget: sum(
      (plan) =>
        plan.budget.maxAgentSteps,
    ),

    totalRuntimeBudgetMs: sum(
      (plan) =>
        plan.budget.maxRuntimeMs,
    ),

    totalMemoryBudgetMb: sum(
      (plan) =>
        plan.budget.maxMemoryMb,
    ),

    executionPermitted: false,

    authority: "NONE",
  });
}
