import assert from "node:assert/strict";
import test from "node:test";

import {
  runXviAutonomousWorkLoop,
} from "./xvi-autonomous-work-loop";

test("draft work records bounded experience", async () => {
  const receipt = await runXviAutonomousWorkLoop(
    {
      workItemId: "WORK-001",
      missionId: "MISSION-001",
      objective: "Implement bounded work loop",
      mode: "DRAFT",
      filesAllowed: ["safe.ts"],
      maxSteps: 1,
    },
    async () => ({
      outcome: "SUCCESS",
      filesExamined: ["safe.ts"],
      filesChanged: ["safe.ts"],
      testsRun: ["focused test"],
      lessons: ["Keep work bounded."],
    }),
  );

  assert.equal(receipt.authority, "NONE");
  assert.equal(receipt.experience.authority, "NONE");
  assert.deepEqual(receipt.experience.filesChanged, ["safe.ts"]);
});

test("observe mode cannot declare writable files", async () => {
  await assert.rejects(
    runXviAutonomousWorkLoop(
      {
        workItemId: "WORK-002",
        missionId: "MISSION-002",
        objective: "Observe only",
        mode: "OBSERVE",
        filesAllowed: ["unsafe.ts"],
        maxSteps: 1,
      },
      async () => ({
        outcome: "SUCCESS",
      }),
    ),
    /OBSERVE mode cannot authorize file changes/,
  );
});

test("advise mode rejects produced file changes", async () => {
  await assert.rejects(
    runXviAutonomousWorkLoop(
      {
        workItemId: "WORK-003",
        missionId: "MISSION-003",
        objective: "Advise only",
        mode: "ADVISE",
        filesAllowed: [],
        maxSteps: 1,
      },
      async () => ({
        outcome: "SUCCESS",
        filesChanged: ["unexpected.ts"],
      }),
    ),
    /ADVISE mode produced file changes/,
  );
});

test("draft mode rejects changes outside allowlist", async () => {
  await assert.rejects(
    runXviAutonomousWorkLoop(
      {
        workItemId: "WORK-004",
        missionId: "MISSION-004",
        objective: "Stay inside scope",
        mode: "DRAFT",
        filesAllowed: ["allowed.ts"],
        maxSteps: 1,
      },
      async () => ({
        outcome: "FAILURE",
        filesChanged: ["outside.ts"],
      }),
    ),
    /outside allowed scope/,
  );
});

test("rejects invalid step budget", async () => {
  await assert.rejects(
    runXviAutonomousWorkLoop(
      {
        workItemId: "WORK-005",
        missionId: "MISSION-005",
        objective: "Invalid budget",
        mode: "DRAFT",
        filesAllowed: [],
        maxSteps: 0,
      },
      async () => ({
        outcome: "SUCCESS",
      }),
    ),
    /maxSteps must be a positive safe integer/,
  );
});
