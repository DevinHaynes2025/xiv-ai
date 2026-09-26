import assert from "node:assert/strict";
import test from "node:test";

import {
  createXviBrainWorkPacket,
  createXviCognitiveWorkspace,
} from "./xvi-cognitive-workspace";

import {
  scheduleXviCognitiveWorkspace,
} from "./xvi-cognitive-scheduler";

test("schedules dependency graph into deterministic waves", () => {
  const missionId = "MISSION-SCHEDULE-001";

  const data = createXviBrainWorkPacket({
    packetId: "DATA",
    missionId,
    brain: "DATA",
  });

  const knowledge = createXviBrainWorkPacket({
    packetId: "KNOWLEDGE",
    missionId,
    brain: "KNOWLEDGE",
  });

  const reasoning = createXviBrainWorkPacket({
    packetId: "REASONING",
    missionId,
    brain: "REASONING",
    dependsOn: ["DATA", "KNOWLEDGE"],
  });

  const simulation = createXviBrainWorkPacket({
    packetId: "SIMULATION",
    missionId,
    brain: "SIMULATION",
    dependsOn: ["REASONING"],
  });

  const verification = createXviBrainWorkPacket({
    packetId: "VERIFY",
    missionId,
    brain: "VERIFICATION",
    dependsOn: ["SIMULATION"],
  });

  const workspace = createXviCognitiveWorkspace({
    missionId,
    packets: [
      data,
      knowledge,
      reasoning,
      simulation,
      verification,
    ],
  });

  const schedule =
    scheduleXviCognitiveWorkspace(workspace);

  assert.deepEqual(
    schedule.waves.map(
      (wave) =>
        wave.packets.map(
          (packet) => packet.packetId,
        ),
    ),
    [
      ["DATA", "KNOWLEDGE"],
      ["REASONING"],
      ["SIMULATION"],
      ["VERIFY"],
    ],
  );

  assert.equal(
    schedule.executionPermitted,
    false,
  );

  assert.equal(schedule.authority, "NONE");
});

test("independent brains may share a wave", () => {
  const missionId = "MISSION-PARALLEL-001";

  const business = createXviBrainWorkPacket({
    packetId: "BUSINESS",
    missionId,
    brain: "BUSINESS",
  });

  const data = createXviBrainWorkPacket({
    packetId: "DATA",
    missionId,
    brain: "DATA",
  });

  const verification = createXviBrainWorkPacket({
    packetId: "VERIFY",
    missionId,
    brain: "VERIFICATION",
    dependsOn: ["BUSINESS", "DATA"],
  });

  const workspace = createXviCognitiveWorkspace({
    missionId,
    packets: [
      business,
      data,
      verification,
    ],
  });

  const schedule =
    scheduleXviCognitiveWorkspace(workspace);

  assert.deepEqual(
    schedule.waves[0]?.packets.map(
      (packet) => packet.packetId,
    ),
    ["BUSINESS", "DATA"],
  );
});

test("dependency cycle fails closed", () => {
  const missionId = "MISSION-CYCLE-001";

  const a = createXviBrainWorkPacket({
    packetId: "A",
    missionId,
    brain: "DATA",
    dependsOn: ["B"],
  });

  const b = createXviBrainWorkPacket({
    packetId: "B",
    missionId,
    brain: "REASONING",
    dependsOn: ["A"],
  });

  const verification = createXviBrainWorkPacket({
    packetId: "VERIFY",
    missionId,
    brain: "VERIFICATION",
    dependsOn: ["A"],
  });

  const workspace = createXviCognitiveWorkspace({
    missionId,
    packets: [
      a,
      b,
      verification,
    ],
  });

  assert.throws(
    () =>
      scheduleXviCognitiveWorkspace(
        workspace,
      ),
    /dependency cycle/,
  );
});

test("verification is isolated in final wave", () => {
  const missionId = "MISSION-VERIFY-001";

  const data = createXviBrainWorkPacket({
    packetId: "DATA",
    missionId,
    brain: "DATA",
  });

  const verification = createXviBrainWorkPacket({
    packetId: "VERIFY",
    missionId,
    brain: "VERIFICATION",
  });

  const workspace = createXviCognitiveWorkspace({
    missionId,
    packets: [
      data,
      verification,
    ],
  });

  const schedule =
    scheduleXviCognitiveWorkspace(workspace);

  const finalWave = schedule.waves.at(-1);

  assert.equal(
    finalWave?.packets.length,
    1,
  );

  assert.equal(
    finalWave?.packets[0]?.brain,
    "VERIFICATION",
  );
});
