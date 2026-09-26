import assert from "node:assert/strict";
import test from "node:test";

import {
  createXviBrainWorkPacket,
  createXviCognitiveWorkspace,
} from "./xvi-cognitive-workspace";

test("creates multi-brain cognitive mission graph", () => {
  const missionId = "MISSION-GLOBAL-001";

  const data = createXviBrainWorkPacket({
    packetId: "P-DATA",
    missionId,
    brain: "DATA",
  });

  const reasoning = createXviBrainWorkPacket({
    packetId: "P-REASON",
    missionId,
    brain: "REASONING",
    dependsOn: ["P-DATA"],
  });

  const simulation = createXviBrainWorkPacket({
    packetId: "P-SIM",
    missionId,
    brain: "SIMULATION",
    dependsOn: ["P-REASON"],
  });

  const verification = createXviBrainWorkPacket({
    packetId: "P-VERIFY",
    missionId,
    brain: "VERIFICATION",
    dependsOn: ["P-SIM"],
  });

  const workspace = createXviCognitiveWorkspace({
    missionId,
    packets: [
      data,
      reasoning,
      simulation,
      verification,
    ],
  });

  assert.equal(workspace.packets.length, 4);

  assert.equal(
    workspace.packets[0]?.modelFamily,
    "XVI_DATA_MODEL",
  );

  assert.equal(
    workspace.packets[3]?.brain,
    "VERIFICATION",
  );

  assert.equal(
    workspace.executionPermitted,
    false,
  );

  assert.equal(
    workspace.authority,
    "NONE",
  );
});

test("security-required mission needs security brain", () => {
  const missionId = "MISSION-SEC-001";

  const verification = createXviBrainWorkPacket({
    packetId: "VERIFY",
    missionId,
    brain: "VERIFICATION",
  });

  assert.throws(
    () =>
      createXviCognitiveWorkspace({
        missionId,
        packets: [verification],
        securityRequired: true,
      }),
    /needs a SECURITY packet/,
  );
});

test("security review may precede final verification", () => {
  const missionId = "MISSION-SEC-002";

  const security = createXviBrainWorkPacket({
    packetId: "SECURITY",
    missionId,
    brain: "SECURITY",
  });

  const verification = createXviBrainWorkPacket({
    packetId: "VERIFY",
    missionId,
    brain: "VERIFICATION",
    dependsOn: ["SECURITY"],
  });

  const workspace = createXviCognitiveWorkspace({
    missionId,
    packets: [
      security,
      verification,
    ],
    securityRequired: true,
  });

  assert.equal(
    workspace.securityRequired,
    true,
  );
});

test("verification must be final", () => {
  const missionId = "MISSION-ORDER-001";

  const verification = createXviBrainWorkPacket({
    packetId: "VERIFY",
    missionId,
    brain: "VERIFICATION",
  });

  const data = createXviBrainWorkPacket({
    packetId: "DATA",
    missionId,
    brain: "DATA",
  });

  assert.throws(
    () =>
      createXviCognitiveWorkspace({
        missionId,
        packets: [
          verification,
          data,
        ],
      }),
    /VERIFICATION packet must be final/,
  );
});

test("unknown dependency fails closed", () => {
  const missionId = "MISSION-DEP-001";

  const reasoning = createXviBrainWorkPacket({
    packetId: "REASON",
    missionId,
    brain: "REASONING",
    dependsOn: ["MISSING"],
  });

  const verification = createXviBrainWorkPacket({
    packetId: "VERIFY",
    missionId,
    brain: "VERIFICATION",
    dependsOn: ["REASON"],
  });

  assert.throws(
    () =>
      createXviCognitiveWorkspace({
        missionId,
        packets: [
          reasoning,
          verification,
        ],
      }),
    /unknown packet dependency/,
  );
});

test("packet cannot depend on itself", () => {
  const missionId = "MISSION-SELF-001";

  const verification = createXviBrainWorkPacket({
    packetId: "VERIFY",
    missionId,
    brain: "VERIFICATION",
    dependsOn: ["VERIFY"],
  });

  assert.throws(
    () =>
      createXviCognitiveWorkspace({
        missionId,
        packets: [verification],
      }),
    /cannot depend on itself/,
  );
});

test("cross-mission packet fails closed", () => {
  const verification = createXviBrainWorkPacket({
    packetId: "VERIFY",
    missionId: "MISSION-B",
    brain: "VERIFICATION",
  });

  assert.throws(
    () =>
      createXviCognitiveWorkspace({
        missionId: "MISSION-A",
        packets: [verification],
      }),
    /belongs to another mission/,
  );
});
