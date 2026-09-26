import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type {
  XviCodingAgentRole,
} from "./xvi-coding-agent-contract";
import {
  activateXviCodingMissionController,
  createXviCodingMissionController,
  reconcileXviCodingMissionController,
  submitXviCodingMissionRoleEvidence,
} from "./xvi-coding-mission-controller";
import {
  XviCodingMissionJournal,
} from "./xvi-coding-mission-journal";

const BASE =
  "aeed20174841e35f2bb62b811fec4d1ef03ca1f2";

const ROLES: readonly XviCodingAgentRole[] =
  ["BUILDER", "TESTER", "REVIEWER", "SECURITY"];

function controller() {
  return createXviCodingMissionController({
    missionId: "gate34-durable-mission",
    baseCommitSha: BASE,
    permittedPaths: [
      "services/ai/runtime/cognition/xvi-coding-mission-journal.ts",
      "services/ai/runtime/cognition/xvi-coding-mission-journal.test.ts",
    ],
    prohibitedPaths: [".git"],
    allowedTestCommands: ["gate34:focused"],
    worktreePathForRole: {
      BUILDER: "C:\\xvi\\gate34\\builder",
      TESTER: "C:\\xvi\\gate34\\tester",
      REVIEWER: "C:\\xvi\\gate34\\reviewer",
      SECURITY: "C:\\xvi\\gate34\\security",
    },
    branchForRole: {
      BUILDER: "xvi/agent/gate34-builder",
      TESTER: "xvi/agent/gate34-tester",
      REVIEWER: "xvi/agent/gate34-reviewer",
      SECURITY: "xvi/agent/gate34-security",
    },
  });
}

function tempJournalPath() {
  const root = mkdtempSync(join(tmpdir(), "xvi-gate34-"));
  const path = join(root, "mission.sqlite");
  XviCodingMissionJournal.initialize(path);
  return { root, path };
}

test("CREATED mission survives journal restart", () => {
  const { root, path } = tempJournalPath();

  try {
    const created = controller();
    let journal = new XviCodingMissionJournal(path);

    journal.put({
      envelope: created,
      updatedAtMs: 1000,
    });
    journal.close();

    journal = new XviCodingMissionJournal(path);

    try {
      const restored = journal.read(created.mission.missionId);
      assert.ok(restored);
      assert.equal(restored.state, "CREATED");
      assert.equal(restored.envelopeDigest, created.envelopeDigest);
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("ACTIVE mission survives restart with zero integration authority", () => {
  const { root, path } = tempJournalPath();

  try {
    const active = activateXviCodingMissionController({
      envelope: controller(),
      nowMs: 1000,
    });

    let journal = new XviCodingMissionJournal(path);
    journal.put({ envelope: active, updatedAtMs: 1100 });
    journal.close();

    journal = new XviCodingMissionJournal(path);

    try {
      const restored = journal.read(active.mission.missionId);
      assert.ok(restored);
      assert.equal(restored.state, "ACTIVE");
      assert.equal(restored.humanApprovalRequired, true);
      assert.equal(restored.automaticMergeAllowed, false);
      assert.equal(restored.automaticPushAllowed, false);
      assert.equal(restored.automaticDeployAllowed, false);
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("EVIDENCE_PENDING mission survives restart", () => {
  const { root, path } = tempJournalPath();

  try {
    let envelope = activateXviCodingMissionController({
      envelope: controller(),
      nowMs: 1000,
    });

    envelope = submitXviCodingMissionRoleEvidence({
      envelope,
      role: "BUILDER",
      changedPaths: [
        "services/ai/runtime/cognition/xvi-coding-mission-journal.ts",
      ],
      testCommands: ["gate34:focused"],
      testPassed: true,
      findings: [],
      submittedAtMs: 1100,
      currentHeadSha: BASE,
    });

    let journal = new XviCodingMissionJournal(path);
    journal.put({ envelope, updatedAtMs: 1200 });
    journal.close();

    journal = new XviCodingMissionJournal(path);

    try {
      const restored = journal.read(envelope.mission.missionId);
      assert.ok(restored);
      assert.equal(restored.state, "EVIDENCE_PENDING");
      assert.equal(restored.evidence.length, 1);
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("BLOCKED mission is durable and cannot roll back", () => {
  const { root, path } = tempJournalPath();

  try {
    const active = activateXviCodingMissionController({
      envelope: controller(),
      nowMs: 1000,
    });

    const blocked = submitXviCodingMissionRoleEvidence({
      envelope: active,
      role: "SECURITY",
      testCommands: ["gate34:focused"],
      testPassed: true,
      findings: ["security-block"],
      submittedAtMs: 1100,
      currentHeadSha: BASE,
    });

    const journal = new XviCodingMissionJournal(path);

    try {
      journal.put({ envelope: blocked, updatedAtMs: 1200 });

      assert.throws(
        () => journal.put({ envelope: active, updatedAtMs: 1300 }),
        /mission state cannot roll back/,
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("READY_FOR_HUMAN_REVIEW survives restart without automatic authority", () => {
  const { root, path } = tempJournalPath();

  try {
    let envelope = activateXviCodingMissionController({
      envelope: controller(),
      nowMs: 1000,
    });

    for (const [index, role] of ROLES.entries()) {
      envelope = submitXviCodingMissionRoleEvidence({
        envelope,
        role,
        changedPaths:
          role === "BUILDER"
            ? [
                "services/ai/runtime/cognition/xvi-coding-mission-journal.ts",
              ]
            : [],
        testCommands: ["gate34:focused"],
        testPassed: true,
        findings: [],
        submittedAtMs: 1100 + index,
        currentHeadSha: BASE,
      });
    }

    const ready = reconcileXviCodingMissionController(envelope);

    let journal = new XviCodingMissionJournal(path);
    journal.put({ envelope: ready, updatedAtMs: 2000 });
    journal.close();

    journal = new XviCodingMissionJournal(path);

    try {
      const restored = journal.read(ready.mission.missionId);
      assert.ok(restored);
      assert.equal(restored.state, "READY_FOR_HUMAN_REVIEW");
      assert.equal(restored.humanApprovalRequired, true);
      assert.equal(restored.automaticMergeAllowed, false);
      assert.equal(restored.automaticPushAllowed, false);
      assert.equal(restored.automaticDeployAllowed, false);
      assert.equal(restored.credentialAccessAllowed, false);
      assert.equal(restored.productionMutationAllowed, false);
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("mission base identity cannot change", () => {
  const { root, path } = tempJournalPath();

  try {
    const created = controller();
    const journal = new XviCodingMissionJournal(path);

    try {
      journal.put({ envelope: created, updatedAtMs: 1000 });

      const changed = {
        ...created,
        mission: {
          ...created.mission,
          baseCommitSha: "a".repeat(40),
        },
      };

      assert.throws(
        () =>
          journal.put({
            envelope: changed as typeof created,
            updatedAtMs: 1100,
          }),
        /envelope digest mismatch|mission cannot change base commit/,
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("evidence count cannot decrease", () => {
  const { root, path } = tempJournalPath();

  try {
    const active = activateXviCodingMissionController({
      envelope: controller(),
      nowMs: 1000,
    });

    const pending = submitXviCodingMissionRoleEvidence({
      envelope: active,
      role: "BUILDER",
      changedPaths: [
        "services/ai/runtime/cognition/xvi-coding-mission-journal.ts",
      ],
      testCommands: ["gate34:focused"],
      testPassed: true,
      findings: [],
      submittedAtMs: 1100,
      currentHeadSha: BASE,
    });

    const journal = new XviCodingMissionJournal(path);

    try {
      journal.put({ envelope: pending, updatedAtMs: 1200 });

      assert.throws(
        () => journal.put({ envelope: active, updatedAtMs: 1300 }),
        /mission state cannot roll back|mission evidence cannot decrease/,
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("journal initialization refuses overwrite", () => {
  const root = mkdtempSync(join(tmpdir(), "xvi-gate34-init-"));
  const path = join(root, "mission.sqlite");

  try {
    XviCodingMissionJournal.initialize(path);

    assert.throws(
      () => XviCodingMissionJournal.initialize(path),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
