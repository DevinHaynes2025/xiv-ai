import test from "node:test";
import assert from "node:assert/strict";

import {
  createXviCodingResumeIntegrityReceipt,
} from "./xvi-coding-resume-integrity";

import {
  XviCodingResumeReplayLedger,
} from "./xvi-coding-resume-replay-ledger";

function integrity(
  nonce =
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

    replayNonce:
      nonce,

    observedAtMs:
      1_000_000,
  });
}

test("valid integrity receipt can be consumed once", () => {
  const ledger =
    new XviCodingResumeReplayLedger();

  const receipt =
    ledger.consume({
      integrity:
        integrity(),

      consumedAtMs:
        1_000_001,
    });

  assert.equal(
    receipt.consumedExactlyOnce,
    true,
  );

  assert.equal(
    ledger.size,
    1,
  );
});

test("same mission and nonce cannot be consumed twice", () => {
  const ledger =
    new XviCodingResumeReplayLedger();

  const receipt =
    integrity();

  ledger.consume({
    integrity: receipt,
    consumedAtMs: 1_000_001,
  });

  assert.throws(
    () =>
      ledger.consume({
        integrity: receipt,
        consumedAtMs: 1_000_002,
      }),
    /XVI_CODING_RESUME_REPLAY_REFUSED/,
  );

  assert.equal(
    ledger.size,
    1,
  );
});

test("different nonce can authorize later resume", () => {
  const ledger =
    new XviCodingResumeReplayLedger();

  ledger.consume({
    integrity:
      integrity(
        "resume-nonce-00000001",
      ),

    consumedAtMs:
      1_000_001,
  });

  ledger.consume({
    integrity:
      integrity(
        "resume-nonce-00000002",
      ),

    consumedAtMs:
      1_000_002,
  });

  assert.equal(
    ledger.size,
    2,
  );
});

test("consumption before observation fails closed", () => {
  const ledger =
    new XviCodingResumeReplayLedger();

  assert.throws(
    () =>
      ledger.consume({
        integrity:
          integrity(),

        consumedAtMs:
          999_999,
      }),
    /XVI_CODING_RESUME_REPLAY_REFUSED/,
  );
});

test("ledger reports consumed identity", () => {
  const ledger =
    new XviCodingResumeReplayLedger();

  ledger.consume({
    integrity:
      integrity(),

    consumedAtMs:
      1_000_001,
  });

  assert.equal(
    ledger.hasConsumed(
      "mission-38-001",
      "resume-nonce-00000001",
    ),
    true,
  );
});

test("consumption receipt has no external authority", () => {
  const ledger =
    new XviCodingResumeReplayLedger();

  const receipt =
    ledger.consume({
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
});
