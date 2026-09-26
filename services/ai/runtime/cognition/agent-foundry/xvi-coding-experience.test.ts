import assert from "node:assert/strict";
import test from "node:test";

import {
  recordXviCodingExperience,
} from "./xvi-coding-experience";

test("records a bounded coding experience with zero authority", () => {
  const experience = recordXviCodingExperience({
    experienceId: "EXP-001",
    missionId: "MISSION-001",
    objective: "Implement governed coding experience",
    outcome: "SUCCESS",
    filesExamined: ["a.ts", "a.ts", " b.ts "],
    filesChanged: ["xvi-coding-experience.ts"],
    testsRun: ["coding experience tests"],
    lessons: ["Evidence must not grant authority."],
    nextStep: "Integrate with autonomous work loop.",
  });

  assert.equal(experience.experienceId, "EXP-001");
  assert.equal(experience.missionId, "MISSION-001");
  assert.equal(experience.outcome, "SUCCESS");
  assert.equal(experience.authority, "NONE");

  assert.deepEqual(experience.filesExamined, [
    "a.ts",
    "b.ts",
  ]);

  assert.equal(Object.isFrozen(experience), true);
});

test("rejects an empty experience id", () => {
  assert.throws(
    () =>
      recordXviCodingExperience({
        experienceId: " ",
        missionId: "MISSION-001",
        objective: "Test",
        outcome: "FAILURE",
        filesExamined: [],
        filesChanged: [],
        testsRun: [],
        lessons: [],
      }),
    /experienceId must be non-empty/,
  );
});

test("rejects an empty mission id", () => {
  assert.throws(
    () =>
      recordXviCodingExperience({
        experienceId: "EXP-002",
        missionId: "",
        objective: "Test",
        outcome: "BLOCKED",
        filesExamined: [],
        filesChanged: [],
        testsRun: [],
        lessons: [],
      }),
    /missionId must be non-empty/,
  );
});

test("experience cannot silently claim execution authority", () => {
  const experience = recordXviCodingExperience({
    experienceId: "EXP-003",
    missionId: "MISSION-003",
    objective: "Preserve authority boundary",
    outcome: "PARTIAL",
    filesExamined: [],
    filesChanged: [],
    testsRun: [],
    lessons: [],
  });

  assert.equal(experience.authority, "NONE");
});
