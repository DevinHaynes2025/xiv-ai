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

import {
  coordinateXviCodingDurableResume,
} from "./xvi-coding-durable-resume-coordinator";

const BASE =
  "bd948e3c03dd8eabb82af23f33a59aa43b4fe181";

const ROLES: readonly XviCodingAgentRole[] = [
  "BUILDER",
  "TESTER",
  "REVIEWER",
  "SECURITY",
];

function controller() {
  return createXviCodingMissionController({
    missionId: "gate37-durable-resume",
    baseCommitSha: BASE,

    permittedPaths: [
      "services/ai/runtime/cognition/xvi-coding-durable-resume-coordinator.ts",
      "services/ai/runtime/cognition/xvi-coding-durable-resume-coordinator.test.ts",
    ],

    prohibitedPaths: [".git"],

    allowedTestCommands: [
      "gate37:focused",
    ],

    worktreePathForRole: {
      BUILDER: "C:\\xvi\\gate37\\builder",
      TESTER: "C:\\xvi\\gate37\\tester",
      REVIEWER: "C:\\xvi\\gate37\\reviewer",
      SECURITY: "C:\\xvi\\gate37\\security",
    },

    branchForRole: {
      BUILDER: "xvi/agent/gate37-builder",
      TESTER: "xvi/agent/gate37-tester",
      REVIEWER: "xvi/agent/gate37-reviewer",
      SECURITY: "xvi/agent/gate37-security",
    },
  });
}

function tempJournalPath() {
  const root =
    mkdtempSync(
      join(tmpdir(), "xvi-gate37-"),
    );

  const path =
    join(root, "mission.sqlite");

  XviCodingMissionJournal.initialize(path);

  return {
    root,
    path,
  };
}

function pendingEnvelope() {
  const active =
    activateXviCodingMissionController({
      envelope: controller(),
      nowMs: 1000,
    });

  return submitXviCodingMissionRoleEvidence({
    envelope: active,
    role: "BUILDER",

    changedPaths: [
      "services/ai/runtime/cognition/xvi-coding-durable-resume-coordinator.ts",
    ],

    testCommands: [
      "gate37:focused",
    ],

    testPassed: true,
    findings: [],
    submittedAtMs: 1100,
    currentHeadSha: BASE,
  });
}

function blockedEnvelope() {
  const active =
    activateXviCodingMissionController({
      envelope: controller(),
      nowMs: 1000,
    });

  return submitXviCodingMissionRoleEvidence({
    envelope: active,
    role: "SECURITY",
    changedPaths: [],
    testCommands: ["gate37:focused"],
    testPassed: true,
    findings: ["security-block"],
    submittedAtMs: 1100,
    currentHeadSha: BASE,
  });
}

function readyEnvelope() {
  let envelope =
    activateXviCodingMissionController({
      envelope: controller(),
      nowMs: 1000,
    });

  for (const [index, role] of ROLES.entries()) {
    envelope =
      submitXviCodingMissionRoleEvidence({
        envelope,
        role,

        changedPaths:
          role === "BUILDER"
            ? [
                "services/ai/runtime/cognition/xvi-coding-durable-resume-coordinator.ts",
              ]
            : [],

        testCommands: [
          "gate37:focused",
        ],

        testPassed: true,
        findings: [],
        submittedAtMs: 1100 + index,
        currentHeadSha: BASE,
      });
  }

  return reconcileXviCodingMissionController(
    envelope,
  );
}

test("CREATED mission is activated and durably persisted", () => {
  const { root, path } = tempJournalPath();

  try {
    const created = controller();

    const journal =
      new XviCodingMissionJournal(path);

    try {
      journal.put({
        envelope: created,
        updatedAtMs: 1000,
      });

      const result =
        coordinateXviCodingDurableResume({
          journal,
          missionId:
            created.mission.missionId,
          nowMs: 2000,
        });

      assert.equal(
        result.disposition,
        "ACTIVATED",
      );

      assert.equal(
        result.persistence,
        "PERSISTED_ACTIVATION",
      );

      assert.equal(
        result.stateMutated,
        true,
      );

      assert.equal(
        result.journalWritePerformed,
        true,
      );

      const restored =
        journal.read(
          created.mission.missionId,
        );

      assert.ok(restored);
      assert.equal(
        restored.state,
        "ACTIVE",
      );

      assert.equal(
        result.persistedEnvelopeDigest,
        restored.envelopeDigest,
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});

test("second coordinator run after activation performs no additional activation write", () => {
  const { root, path } = tempJournalPath();

  try {
    const created = controller();

    const journal =
      new XviCodingMissionJournal(path);

    try {
      journal.put({
        envelope: created,
        updatedAtMs: 1000,
      });

      const first =
        coordinateXviCodingDurableResume({
          journal,
          missionId:
            created.mission.missionId,
          nowMs: 2000,
        });

      assert.equal(
        first.persistence,
        "PERSISTED_ACTIVATION",
      );

      const activeBefore =
        journal.read(
          created.mission.missionId,
        );

      assert.ok(activeBefore);

      const second =
        coordinateXviCodingDurableResume({
          journal,
          missionId:
            created.mission.missionId,
          nowMs: 3000,
        });

      assert.equal(
        second.disposition,
        "COLLECT_EVIDENCE_REQUIRED",
      );

      assert.equal(
        second.persistence,
        "NO_WRITE",
      );

      assert.equal(
        second.journalWritePerformed,
        false,
      );

      const activeAfter =
        journal.read(
          created.mission.missionId,
        );

      assert.ok(activeAfter);

      assert.equal(
        activeAfter.envelopeDigest,
        activeBefore.envelopeDigest,
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});

test("EVIDENCE_PENDING performs no durable write", () => {
  const { root, path } = tempJournalPath();

  try {
    const pending =
      pendingEnvelope();

    const journal =
      new XviCodingMissionJournal(path);

    try {
      journal.put({
        envelope: pending,
        updatedAtMs: 1200,
      });

      const before =
        journal.read(
          pending.mission.missionId,
        );

      assert.ok(before);

      const result =
        coordinateXviCodingDurableResume({
          journal,
          missionId:
            pending.mission.missionId,
          nowMs: 2000,
        });

      assert.equal(
        result.disposition,
        "COLLECT_MISSING_EVIDENCE_REQUIRED",
      );

      assert.equal(
        result.persistence,
        "NO_WRITE",
      );

      assert.equal(
        result.journalWritePerformed,
        false,
      );

      const after =
        journal.read(
          pending.mission.missionId,
        );

      assert.ok(after);

      assert.equal(
        after.envelopeDigest,
        before.envelopeDigest,
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});

test("BLOCKED performs no durable write", () => {
  const { root, path } = tempJournalPath();

  try {
    const blocked =
      blockedEnvelope();

    const journal =
      new XviCodingMissionJournal(path);

    try {
      journal.put({
        envelope: blocked,
        updatedAtMs: 1200,
      });

      const before =
        journal.read(
          blocked.mission.missionId,
        );

      assert.ok(before);

      const result =
        coordinateXviCodingDurableResume({
          journal,
          missionId:
            blocked.mission.missionId,
          nowMs: 2000,
        });

      assert.equal(
        result.disposition,
        "BLOCKED_NO_OP",
      );

      assert.equal(
        result.persistence,
        "NO_WRITE",
      );

      assert.equal(
        result.journalWritePerformed,
        false,
      );

      const after =
        journal.read(
          blocked.mission.missionId,
        );

      assert.ok(after);

      assert.equal(
        after.envelopeDigest,
        before.envelopeDigest,
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});

test("READY_FOR_HUMAN_REVIEW performs no durable write", () => {
  const { root, path } = tempJournalPath();

  try {
    const ready =
      readyEnvelope();

    const journal =
      new XviCodingMissionJournal(path);

    try {
      journal.put({
        envelope: ready,
        updatedAtMs: 2000,
      });

      const before =
        journal.read(
          ready.mission.missionId,
        );

      assert.ok(before);

      const result =
        coordinateXviCodingDurableResume({
          journal,
          missionId:
            ready.mission.missionId,
          nowMs: 3000,
        });

      assert.equal(
        result.disposition,
        "HUMAN_APPROVAL_REQUIRED",
      );

      assert.equal(
        result.persistence,
        "NO_WRITE",
      );

      assert.equal(
        result.stateMutated,
        false,
      );

      assert.equal(
        result.journalWritePerformed,
        false,
      );

      const after =
        journal.read(
          ready.mission.missionId,
        );

      assert.ok(after);

      assert.equal(
        after.state,
        "READY_FOR_HUMAN_REVIEW",
      );

      assert.equal(
        after.envelopeDigest,
        before.envelopeDigest,
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});

test("missing durable mission fails closed", () => {
  const { root, path } = tempJournalPath();

  try {
    const journal =
      new XviCodingMissionJournal(path);

    try {
      assert.throws(
        () =>
          coordinateXviCodingDurableResume({
            journal,
            missionId:
              "missing-gate37-mission",
            nowMs: 2000,
          }),
        /durable mission not found/,
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});

test("invalid coordination timestamp fails closed", () => {
  const { root, path } = tempJournalPath();

  try {
    const created = controller();

    const journal =
      new XviCodingMissionJournal(path);

    try {
      journal.put({
        envelope: created,
        updatedAtMs: 1000,
      });

      assert.throws(
        () =>
          coordinateXviCodingDurableResume({
            journal,
            missionId:
              created.mission.missionId,
            nowMs: 0,
          }),
        /invalid coordination timestamp/,
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});

test("coordinator result denies external authority", () => {
  const { root, path } = tempJournalPath();

  try {
    const ready =
      readyEnvelope();

    const journal =
      new XviCodingMissionJournal(path);

    try {
      journal.put({
        envelope: ready,
        updatedAtMs: 2000,
      });

      const result =
        coordinateXviCodingDurableResume({
          journal,
          missionId:
            ready.mission.missionId,
          nowMs: 3000,
        });

      assert.equal(
        result.humanApprovalRequired,
        true,
      );

      assert.equal(
        result.automaticMergeAllowed,
        false,
      );

      assert.equal(
        result.automaticPushAllowed,
        false,
      );

      assert.equal(
        result.automaticDeployAllowed,
        false,
      );

      assert.equal(
        result.credentialAccessAllowed,
        false,
      );

      assert.equal(
        result.networkAllowed,
        false,
      );

      assert.equal(
        result.productionMutationAllowed,
        false,
      );

      assert.equal(
        result.arbitraryCommandExecutionAllowed,
        false,
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});

test("persisted activation digest matches durable ACTIVE envelope", () => {
  const { root, path } = tempJournalPath();

  try {
    const created = controller();

    const journal =
      new XviCodingMissionJournal(path);

    try {
      journal.put({
        envelope: created,
        updatedAtMs: 1000,
      });

      const result =
        coordinateXviCodingDurableResume({
          journal,
          missionId:
            created.mission.missionId,
          nowMs: 2000,
        });

      const persisted =
        journal.read(
          created.mission.missionId,
        );

      assert.ok(persisted);

      assert.equal(
        result.persistedEnvelopeDigest,
        persisted.envelopeDigest,
      );

      assert.equal(
        persisted.state,
        "ACTIVE",
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});

test("persisted activation survives journal restart", () => {
  const { root, path } = tempJournalPath();

  try {
    const created = controller();

    let journal =
      new XviCodingMissionJournal(path);

    try {
      journal.put({
        envelope: created,
        updatedAtMs: 1000,
      });

      const result =
        coordinateXviCodingDurableResume({
          journal,
          missionId:
            created.mission.missionId,
          nowMs: 2000,
        });

      assert.equal(
        result.persistence,
        "PERSISTED_ACTIVATION",
      );
    } finally {
      journal.close();
    }

    journal =
      new XviCodingMissionJournal(path);

    try {
      const restored =
        journal.read(
          created.mission.missionId,
        );

      assert.ok(restored);

      assert.equal(
        restored.state,
        "ACTIVE",
      );

      assert.equal(
        restored.humanApprovalRequired,
        true,
      );

      assert.equal(
        restored.automaticMergeAllowed,
        false,
      );

      assert.equal(
        restored.automaticPushAllowed,
        false,
      );

      assert.equal(
        restored.automaticDeployAllowed,
        false,
      );
    } finally {
      journal.close();
    }
  } finally {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});