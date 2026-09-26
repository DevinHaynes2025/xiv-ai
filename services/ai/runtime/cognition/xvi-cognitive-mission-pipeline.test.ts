import assert from "node:assert/strict";
import test from "node:test";

import {
  createXviBrainWorkPacket,
} from "./xvi-cognitive-workspace";

import {
  createXviPacketComputePlan,
} from "./xvi-cognitive-resource-plan";

import {
  createXviClaim,
} from "./xvi-evidence-claim-fabric";

import {
  createXviTemporalEvidenceEnvelope,
} from "./xvi-temporal-evidence";

import {
  buildXviCognitiveMissionPipeline,
} from "./xvi-cognitive-mission-pipeline";

function createFixture() {
  const missionId =
    "MISSION-PIPELINE-001";

  const data =
    createXviBrainWorkPacket({
      packetId: "DATA",
      missionId,
      brain: "DATA",
    });

  const reasoning =
    createXviBrainWorkPacket({
      packetId: "REASON",
      missionId,
      brain: "REASONING",
      dependsOn: ["DATA"],
    });

  const simulation =
    createXviBrainWorkPacket({
      packetId: "SIM",
      missionId,
      brain: "SIMULATION",
      dependsOn: ["REASON"],
    });

  const verification =
    createXviBrainWorkPacket({
      packetId: "VERIFY",
      missionId,
      brain: "VERIFICATION",
      dependsOn: ["SIM"],
    });

  const packets = [
    data,
    reasoning,
    simulation,
    verification,
  ];

  const packetPlans = [
    createXviPacketComputePlan({
      packet: data,
      budget: {
        maxModelCalls: 2,
        maxAgentSteps: 2,
        maxRuntimeMs: 1000,
        maxMemoryMb: 256,
      },
    }),

    createXviPacketComputePlan({
      packet: reasoning,
      budget: {
        maxModelCalls: 3,
        maxAgentSteps: 4,
        maxRuntimeMs: 2000,
        maxMemoryMb: 256,
      },
    }),

    createXviPacketComputePlan({
      packet: simulation,
      budget: {
        maxModelCalls: 4,
        maxAgentSteps: 5,
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

  const claim = createXviClaim({
    claimId: "CLAIM-PIPELINE-001",
    missionId,
    sourceBrain: "DATA",

    statement:
      "Input evidence is current.",

    state: "VERIFIED",
    confidence: 0.98,

    evidenceRefs: [
      {
        evidenceId: "EV-001",
        sourceId: "SOURCE-001",
        sourceRevision: "REV-10",
      },
    ],

    contradictionRefs: [],
    parentClaimRefs: [],

    authority: "NONE",
  });

  return {
    missionId,
    packets,
    packetPlans,
    claim,
  };
}

test("builds integrated bounded cognitive mission pipeline", () => {
  const fixture = createFixture();

  const temporal =
    createXviTemporalEvidenceEnvelope({
      claimId:
        fixture.claim.claimId,

      observedAt:
        "2026-09-25T14:00:00Z",

      validFrom:
        "2026-09-25T14:00:00Z",

      expiresAt:
        "2026-09-26T14:00:00Z",

      sourceRevision: "REV-10",

      freshnessWindowMs:
        60 * 60 * 1000,

      authority: "NONE",
    });

  const pipeline =
    buildXviCognitiveMissionPipeline({
      missionId:
        fixture.missionId,

      packets:
        fixture.packets,

      packetPlans:
        fixture.packetPlans,

      claims: [
        fixture.claim,
      ],

      temporalBindings: [
        {
          claim: fixture.claim,
          temporal,
        },
      ],

      now:
        "2026-09-25T14:30:00Z",
    });

  assert.equal(
    pipeline.state,
    "READY_FOR_BOUNDED_EXECUTION",
  );

  assert.equal(
    pipeline.schedule.waves.length,
    4,
  );

  assert.equal(
    pipeline.resourcePlan
      .totalModelCallBudget,
    11,
  );

  assert.equal(
    pipeline.claimLedger
      .verifiedCount,
    1,
  );

  assert.equal(
    pipeline.temporalAssessments[0]
      ?.state,
    "FRESH",
  );

  assert.equal(
    pipeline.executionPermitted,
    false,
  );

  assert.equal(
    pipeline.authority,
    "NONE",
  );
});

test("stale evidence requires revalidation", () => {
  const fixture = createFixture();

  const temporal =
    createXviTemporalEvidenceEnvelope({
      claimId:
        fixture.claim.claimId,

      observedAt:
        "2026-09-25T10:00:00Z",

      validFrom:
        "2026-09-25T10:00:00Z",

      expiresAt:
        "2026-09-26T10:00:00Z",

      sourceRevision: "REV-10",

      freshnessWindowMs:
        60 * 60 * 1000,

      authority: "NONE",
    });

  const pipeline =
    buildXviCognitiveMissionPipeline({
      missionId:
        fixture.missionId,

      packets:
        fixture.packets,

      packetPlans:
        fixture.packetPlans,

      claims: [
        fixture.claim,
      ],

      temporalBindings: [
        {
          claim: fixture.claim,
          temporal,
        },
      ],

      now:
        "2026-09-25T13:00:00Z",
    });

  assert.equal(
    pipeline.state,
    "REVALIDATION_REQUIRED",
  );
});

test("contested knowledge blocks mission pipeline", () => {
  const fixture = createFixture();

  const contested =
    createXviClaim({
      claimId:
        "CLAIM-CONTESTED",

      missionId:
        fixture.missionId,

      sourceBrain:
        "REASONING",

      statement:
        "Conflicting interpretation.",

      state:
        "CONTESTED",

      confidence: 0.5,

      evidenceRefs: [],

      contradictionRefs: [
        fixture.claim.claimId,
      ],

      parentClaimRefs: [],

      authority: "NONE",
    });

  const pipeline =
    buildXviCognitiveMissionPipeline({
      missionId:
        fixture.missionId,

      packets:
        fixture.packets,

      packetPlans:
        fixture.packetPlans,

      claims: [
        fixture.claim,
        contested,
      ],

      temporalBindings: [],

      now:
        "2026-09-25T14:30:00Z",
    });

  assert.equal(
    pipeline.state,
    "BLOCKED",
  );
});

test("temporal binding cannot reference unknown claim", () => {
  const fixture = createFixture();

  const other =
    createXviClaim({
      claimId: "CLAIM-OTHER",
      missionId:
        fixture.missionId,

      sourceBrain: "DATA",

      statement: "Other claim.",

      state: "INFERRED",
      confidence: 0.5,

      evidenceRefs: [],
      contradictionRefs: [],
      parentClaimRefs: [],

      authority: "NONE",
    });

  const temporal =
    createXviTemporalEvidenceEnvelope({
      claimId: other.claimId,

      observedAt:
        "2026-09-25T14:00:00Z",

      validFrom:
        "2026-09-25T14:00:00Z",

      expiresAt:
        "2026-09-26T14:00:00Z",

      sourceRevision: "REV-X",

      freshnessWindowMs:
        60 * 60 * 1000,

      authority: "NONE",
    });

  assert.throws(
    () =>
      buildXviCognitiveMissionPipeline({
        missionId:
          fixture.missionId,

        packets:
          fixture.packets,

        packetPlans:
          fixture.packetPlans,

        claims: [
          fixture.claim,
        ],

        temporalBindings: [
          {
            claim: other,
            temporal,
          },
        ],

        now:
          "2026-09-25T14:30:00Z",
      }),
    /references unknown claim/,
  );
});
