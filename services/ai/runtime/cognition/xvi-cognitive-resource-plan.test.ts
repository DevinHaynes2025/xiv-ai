import assert from "node:assert/strict";
import test from "node:test";

import {
  createXviBrainWorkPacket,
  createXviCognitiveWorkspace,
} from "./xvi-cognitive-workspace";

import {
  createXviCognitiveResourcePlan,
  createXviPacketComputePlan,
} from "./xvi-cognitive-resource-plan";

test("creates bounded resource plan for every cognitive packet", () => {
  const missionId = "MISSION-RESOURCE-001";

  const data = createXviBrainWorkPacket({
    packetId: "DATA",
    missionId,
    brain: "DATA",
  });

  const simulation = createXviBrainWorkPacket({
    packetId: "SIM",
    missionId,
    brain: "SIMULATION",
    dependsOn: ["DATA"],
  });

  const verification = createXviBrainWorkPacket({
    packetId: "VERIFY",
    missionId,
    brain: "VERIFICATION",
    dependsOn: ["SIM"],
  });

  const workspace =
    createXviCognitiveWorkspace({
      missionId,
      packets: [
        data,
        simulation,
        verification,
      ],
    });

  const plans = [
    createXviPacketComputePlan({
      packet: data,
      budget: {
        maxModelCalls: 2,
        maxAgentSteps: 3,
        maxRuntimeMs: 1000,
        maxMemoryMb: 256,
      },
    }),

    createXviPacketComputePlan({
      packet: simulation,
      budget: {
        maxModelCalls: 4,
        maxAgentSteps: 6,
        maxRuntimeMs: 3000,
        maxMemoryMb: 512,
      },
      qCore: "Q_SIMULATION",
      quantumExecution:
        "QUANTUM_SIMULATED",
    }),

    createXviPacketComputePlan({
      packet: verification,
      budget: {
        maxModelCalls: 2,
        maxAgentSteps: 2,
        maxRuntimeMs: 1500,
        maxMemoryMb: 256,
      },
    }),
  ];

  const resourcePlan =
    createXviCognitiveResourcePlan({
      workspace,
      packetPlans: plans,
    });

  assert.equal(
    resourcePlan.totalModelCallBudget,
    8,
  );

  assert.equal(
    resourcePlan.totalAgentStepBudget,
    11,
  );

  assert.equal(
    resourcePlan.totalRuntimeBudgetMs,
    5500,
  );

  assert.equal(
    resourcePlan.totalMemoryBudgetMb,
    1024,
  );

  assert.equal(
    resourcePlan.executionPermitted,
    false,
  );

  assert.equal(
    resourcePlan.authority,
    "NONE",
  );
});

test("quantum simulation requires explicit Q-Core", () => {
  const packet =
    createXviBrainWorkPacket({
      packetId: "SIM",
      missionId: "MISSION-Q-001",
      brain: "SIMULATION",
    });

  assert.throws(
    () =>
      createXviPacketComputePlan({
        packet,
        budget: {
          maxModelCalls: 1,
          maxAgentSteps: 1,
          maxRuntimeMs: 1000,
          maxMemoryMb: 128,
        },
        quantumExecution:
          "QUANTUM_SIMULATED",
      }),
    /requires a Q-Core/,
  );
});

test("Q-Core requires explicit execution class", () => {
  const packet =
    createXviBrainWorkPacket({
      packetId: "SIM",
      missionId: "MISSION-Q-002",
      brain: "SIMULATION",
    });

  assert.throws(
    () =>
      createXviPacketComputePlan({
        packet,
        budget: {
          maxModelCalls: 1,
          maxAgentSteps: 1,
          maxRuntimeMs: 1000,
          maxMemoryMb: 128,
        },
        qCore: "Q_SIMULATION",
      }),
    /requires explicit quantum execution class/,
  );
});

test("cannot plan verified QPU execution without hardware evidence", () => {
  const packet =
    createXviBrainWorkPacket({
      packetId: "SCI",
      missionId: "MISSION-Q-003",
      brain: "SCIENTIFIC",
    });

  assert.throws(
    () =>
      createXviPacketComputePlan({
        packet,
        budget: {
          maxModelCalls: 1,
          maxAgentSteps: 1,
          maxRuntimeMs: 1000,
          maxMemoryMb: 128,
        },
        qCore:
          "Q_SCIENTIFIC_DISCOVERY",
        quantumExecution:
          "QPU_VERIFIED",
      }),
    /cannot be planned without verified hardware evidence/,
  );
});

test("invalid memory budget fails closed", () => {
  const packet =
    createXviBrainWorkPacket({
      packetId: "DATA",
      missionId:
        "MISSION-BUDGET-001",
      brain: "DATA",
    });

  assert.throws(
    () =>
      createXviPacketComputePlan({
        packet,
        budget: {
          maxModelCalls: 1,
          maxAgentSteps: 1,
          maxRuntimeMs: 1000,
          maxMemoryMb: 0,
        },
      }),
    /maxMemoryMb must be a positive safe integer/,
  );
});

test("resource plan must cover every packet exactly once", () => {
  const missionId =
    "MISSION-COVERAGE-001";

  const data =
    createXviBrainWorkPacket({
      packetId: "DATA",
      missionId,
      brain: "DATA",
    });

  const verification =
    createXviBrainWorkPacket({
      packetId: "VERIFY",
      missionId,
      brain: "VERIFICATION",
      dependsOn: ["DATA"],
    });

  const workspace =
    createXviCognitiveWorkspace({
      missionId,
      packets: [
        data,
        verification,
      ],
    });

  const onlyData =
    createXviPacketComputePlan({
      packet: data,
      budget: {
        maxModelCalls: 1,
        maxAgentSteps: 1,
        maxRuntimeMs: 1000,
        maxMemoryMb: 128,
      },
    });

  assert.throws(
    () =>
      createXviCognitiveResourcePlan({
        workspace,
        packetPlans: [onlyData],
      }),
    /must cover every workspace packet exactly once/,
  );
});
