import test from "node:test";
import assert from "node:assert/strict";

import {
  mkdtempSync,
  rmSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  createXviCodingMissionController,
} from "./xvi-coding-mission-controller";

import {
  XviCodingMissionJournal,
} from "./xvi-coding-mission-journal";

import {
  coordinateXviCodingDurableResume,
} from "./xvi-coding-durable-resume-coordinator";

import {
  createXviCodingResumeIntegrityReceipt,
} from "./xvi-coding-resume-integrity";

import {
  XviCodingDurableReplayStore,
} from "./xvi-coding-durable-replay-store";

const BASE =
  "6defa8882a713472732a8c61281123e9132135d6";

const BRANCH =
  "local/12d-606-offline-system-console";

const WORKTREE =
  "C:/Users/Devin/xiv-build-12d-99";

const DIRTY =
  "c".repeat(64);

function controller() {
  return createXviCodingMissionController({
    missionId:
      "gate38-resume-lifecycle",

    baseCommitSha:
      BASE,

    permittedPaths: [
      "services/ai/runtime/cognition/xvi-coding-resume-integrity.ts",
      "services/ai/runtime/cognition/xvi-coding-durable-replay-store.ts",
    ],

    prohibitedPaths: [
      ".git",
    ],

    allowedTestCommands: [
      "gate38:focused",
    ],

    worktreePathForRole: {
      BUILDER:
        "C:\\xvi\\gate38\\builder",
      TESTER:
        "C:\\xvi\\gate38\\tester",
      REVIEWER:
        "C:\\xvi\\gate38\\reviewer",
      SECURITY:
        "C:\\xvi\\gate38\\security",
    },

    branchForRole: {
      BUILDER:
        "xvi/agent/gate38-builder",
      TESTER:
        "xvi/agent/gate38-tester",
      REVIEWER:
        "xvi/agent/gate38-reviewer",
      SECURITY:
        "xvi/agent/gate38-security",
    },
  });
}

function fixture() {
  const root =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate38-",
      ),
    );

  return {
    root,

    journalPath:
      join(
        root,
        "mission.sqlite",
      ),

    replayPath:
      join(
        root,
        "replay.sqlite",
      ),
  };
}

test("durable resume authorization survives restart and rejects replay", () => {
  const paths =
    fixture();

  try {
    const created =
      controller();

    XviCodingMissionJournal.initialize(
      paths.journalPath,
    );

    let journal =
      new XviCodingMissionJournal(
        paths.journalPath,
      );

    journal.put({
      envelope:
        created,

      updatedAtMs:
        1000,
    });

    const coordinated =
      coordinateXviCodingDurableResume({
        journal,

        missionId:
          created.mission.missionId,

        nowMs:
          2000,
      });

    assert.equal(
      coordinated.disposition,
      "ACTIVATED",
    );

    assert.equal(
      coordinated.persistence,
      "PERSISTED_ACTIVATION",
    );

    assert.equal(
      coordinated.humanApprovalRequired,
      true,
    );

    assert.equal(
      coordinated.automaticMergeAllowed,
      false,
    );

    assert.equal(
      coordinated.automaticPushAllowed,
      false,
    );

    assert.equal(
      coordinated.automaticDeployAllowed,
      false,
    );

    assert.equal(
      coordinated.credentialAccessAllowed,
      false,
    );

    assert.equal(
      coordinated.networkAllowed,
      false,
    );

    assert.equal(
      coordinated.productionMutationAllowed,
      false,
    );

    assert.equal(
      coordinated.arbitraryCommandExecutionAllowed,
      false,
    );

    const integrity =
      createXviCodingResumeIntegrityReceipt({
        missionId:
          coordinated.missionId,

        sourceEnvelopeDigest:
          coordinated.sourceEnvelopeDigest,

        resumePlanDigest:
          coordinated.resumePlanDigest,

        executionResultDigest:
          coordinated.executionResultDigest,

        coordinatorDigest:
          coordinated.coordinatorDigest,

        expectedBranch:
          BRANCH,

        actualBranch:
          BRANCH,

        expectedHead:
          BASE,

        actualHead:
          BASE,

        expectedWorktree:
          WORKTREE,

        actualWorktree:
          WORKTREE,

        missionPaths: [
          "services/ai/runtime/cognition/xvi-coding-durable-replay-store.ts",
          "services/ai/runtime/cognition/xvi-coding-resume-integrity.ts",
        ],

        dirtyBaselineDigest:
          DIRTY,

        dirtyCurrentDigest:
          DIRTY,

        replayNonce:
          "gate38-replay-nonce-000001",

        observedAtMs:
          2100,
      });

    const replay =
      new XviCodingDurableReplayStore(
        paths.replayPath,
      );

    const consumed =
      replay.consume({
        integrity,

        consumedAtMs:
          2200,
      });

    assert.equal(
      consumed.durable,
      true,
    );

    assert.equal(
      consumed.consumedExactlyOnce,
      true,
    );

    replay.close();
    journal.close();

    /*
     * Simulate process restart:
     * both durable resources are reopened.
     */
    journal =
      new XviCodingMissionJournal(
        paths.journalPath,
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

    const reopenedReplay =
      new XviCodingDurableReplayStore(
        paths.replayPath,
      );

    assert.equal(
      reopenedReplay.hasConsumed(
        integrity.missionId,
        integrity.replayNonce,
      ),
      true,
    );

    assert.throws(
      () =>
        reopenedReplay.consume({
          integrity,

          consumedAtMs:
            2300,
        }),
      /XVI_CODING_DURABLE_REPLAY_REFUSED/,
    );

    assert.equal(
      reopenedReplay.size,
      1,
    );

    reopenedReplay.close();
    journal.close();
  }
  finally {
    rmSync(
      paths.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});
