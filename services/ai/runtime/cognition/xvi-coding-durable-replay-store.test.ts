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
  createXviCodingResumeIntegrityReceipt,
} from "./xvi-coding-resume-integrity";

import {
  XviCodingDurableReplayStore,
} from "./xvi-coding-durable-replay-store";

function integrity(
  replayNonce =
    "resume-nonce-00000001",
) {
  return createXviCodingResumeIntegrityReceipt({
    missionId:
      "mission-38-001",

    sourceEnvelopeDigest:
      "d".repeat(64),

    resumePlanDigest:
      "a".repeat(64),

    executionResultDigest:
      "e".repeat(64),

    coordinatorDigest:
      "b".repeat(64),

    expectedBranch:
      "local/12d-606-offline-system-console",

    actualBranch:
      "local/12d-606-offline-system-console",

    expectedHead:
      "6defa8882a713472732a8c61281123e9132135d6",

    actualHead:
      "6defa8882a713472732a8c61281123e9132135d6",

    expectedWorktree:
      "C:/Users/Devin/xiv-build-12d-99",

    actualWorktree:
      "C:/Users/Devin/xiv-build-12d-99",

    missionPaths: [
      "services/ai/runtime/cognition/example-a.ts",
    ],

    dirtyBaselineDigest:
      "c".repeat(64),

    dirtyCurrentDigest:
      "c".repeat(64),

    replayNonce,

    observedAtMs:
      1_000_000,
  });
}

function databaseFixture() {
  const directory =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-replay-",
      ),
    );

  return {
    directory,

    databasePath:
      join(
        directory,
        "replay.sqlite",
      ),
  };
}

test("durable replay receipt persists consumption", () => {
  const fixture =
    databaseFixture();

  try {
    const store =
      new XviCodingDurableReplayStore(
        fixture.databasePath,
      );

    const receipt =
      store.consume({
        integrity:
          integrity(),

        consumedAtMs:
          1_000_001,
      });

    assert.equal(
      receipt.durable,
      true,
    );

    assert.equal(
      receipt.consumedExactlyOnce,
      true,
    );

    assert.equal(
      store.size,
      1,
    );

    store.close();
  }
  finally {
    rmSync(
      fixture.directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("consumption survives process-style reopen", () => {
  const fixture =
    databaseFixture();

  try {
    const first =
      new XviCodingDurableReplayStore(
        fixture.databasePath,
      );

    first.consume({
      integrity:
        integrity(),

      consumedAtMs:
        1_000_001,
    });

    first.close();

    const second =
      new XviCodingDurableReplayStore(
        fixture.databasePath,
      );

    assert.equal(
      second.hasConsumed(
        "mission-38-001",
        "resume-nonce-00000001",
      ),
      true,
    );

    assert.equal(
      second.size,
      1,
    );

    second.close();
  }
  finally {
    rmSync(
      fixture.directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("same authorization remains rejected after reopen", () => {
  const fixture =
    databaseFixture();

  try {
    const receipt =
      integrity();

    const first =
      new XviCodingDurableReplayStore(
        fixture.databasePath,
      );

    first.consume({
      integrity:
        receipt,

      consumedAtMs:
        1_000_001,
    });

    first.close();

    const second =
      new XviCodingDurableReplayStore(
        fixture.databasePath,
      );

    assert.throws(
      () =>
        second.consume({
          integrity:
            receipt,

          consumedAtMs:
            1_000_002,
        }),
      /XVI_CODING_DURABLE_REPLAY_REFUSED/,
    );

    assert.equal(
      second.size,
      1,
    );

    second.close();
  }
  finally {
    rmSync(
      fixture.directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("different nonce persists independently", () => {
  const fixture =
    databaseFixture();

  try {
    const store =
      new XviCodingDurableReplayStore(
        fixture.databasePath,
      );

    store.consume({
      integrity:
        integrity(
          "resume-nonce-00000001",
        ),

      consumedAtMs:
        1_000_001,
    });

    store.consume({
      integrity:
        integrity(
          "resume-nonce-00000002",
        ),

      consumedAtMs:
        1_000_002,
    });

    assert.equal(
      store.size,
      2,
    );

    store.close();
  }
  finally {
    rmSync(
      fixture.directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("consumption before integrity observation fails closed", () => {
  const fixture =
    databaseFixture();

  try {
    const store =
      new XviCodingDurableReplayStore(
        fixture.databasePath,
      );

    assert.throws(
      () =>
        store.consume({
          integrity:
            integrity(),

          consumedAtMs:
            999_999,
        }),
      /XVI_CODING_DURABLE_REPLAY_REFUSED/,
    );

    assert.equal(
      store.size,
      0,
    );

    store.close();
  }
  finally {
    rmSync(
      fixture.directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("durable receipt exposes no remote authority", () => {
  const fixture =
    databaseFixture();

  try {
    const store =
      new XviCodingDurableReplayStore(
        fixture.databasePath,
      );

    const receipt =
      store.consume({
        integrity:
          integrity(),

        consumedAtMs:
          1_000_001,
      });

    assert.equal(
      receipt.remoteWriteAuthority,
      false,
    );

    assert.equal(
      receipt.deploymentAuthority,
      false,
    );

    assert.equal(
      receipt.credentialAuthority,
      false,
    );

    assert.equal(
      receipt.productionAuthority,
      false,
    );

    assert.equal(
      Object.isFrozen(receipt),
      true,
    );

    store.close();
  }
  finally {
    rmSync(
      fixture.directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("malformed replay lookup fails closed", () => {
  const fixture =
    databaseFixture();

  try {
    const store =
      new XviCodingDurableReplayStore(
        fixture.databasePath,
      );

    assert.throws(
      () =>
        store.hasConsumed(
          "../mission",
          "resume-nonce-00000001",
        ),
      /XVI_CODING_DURABLE_REPLAY_REFUSED/,
    );

    store.close();
  }
  finally {
    rmSync(
      fixture.directory,
      {
        recursive: true,
        force: true,
      },
    );
  }
});
