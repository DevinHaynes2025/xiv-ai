import test from "node:test";
import assert from "node:assert/strict";

import {
  createXviCodingResumeIntegrityReceipt,
} from "./xvi-coding-resume-integrity";

function input() {
  return {
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
      "services/ai/runtime/cognition/example-b.ts",
    ],

    dirtyBaselineDigest:
      "c".repeat(64),

    dirtyCurrentDigest:
      "c".repeat(64),

    replayNonce:
      "resume-nonce-00000001",

    observedAtMs:
      1_000_000,
  };
}

test("matching repository state authorizes bounded local resume", () => {
  const receipt =
    createXviCodingResumeIntegrityReceipt(
      input(),
    );

  assert.equal(
    receipt.resumeIntegrityVerified,
    true,
  );

  assert.equal(
    receipt.localMutationEligible,
    true,
  );

  assert.match(
    receipt.integrityDigest,
    /^[a-f0-9]{64}$/,
  );
});

test("identical repository state is deterministic", () => {
  const first =
    createXviCodingResumeIntegrityReceipt(
      input(),
    );

  const second =
    createXviCodingResumeIntegrityReceipt(
      input(),
    );

  assert.equal(
    first.integrityDigest,
    second.integrityDigest,
  );
});

test("stale HEAD fails closed", () => {
  assert.throws(
    () =>
      createXviCodingResumeIntegrityReceipt({
        ...input(),

        actualHead:
          "d".repeat(40),
      }),
    /XVI_CODING_RESUME_INTEGRITY_REFUSED/,
  );
});

test("wrong branch fails closed", () => {
  assert.throws(
    () =>
      createXviCodingResumeIntegrityReceipt({
        ...input(),

        actualBranch:
          "other/branch",
      }),
    /XVI_CODING_RESUME_INTEGRITY_REFUSED/,
  );
});

test("wrong worktree fails closed", () => {
  assert.throws(
    () =>
      createXviCodingResumeIntegrityReceipt({
        ...input(),

        actualWorktree:
          "C:/Users/Devin/other-worktree",
      }),
    /XVI_CODING_RESUME_INTEGRITY_REFUSED/,
  );
});

test("changed unrelated dirty state fails closed", () => {
  assert.throws(
    () =>
      createXviCodingResumeIntegrityReceipt({
        ...input(),

        dirtyCurrentDigest:
          "d".repeat(64),
      }),
    /XVI_CODING_RESUME_INTEGRITY_REFUSED/,
  );
});

test("duplicate mission paths fail closed", () => {
  assert.throws(
    () =>
      createXviCodingResumeIntegrityReceipt({
        ...input(),

        missionPaths: [
          "services/ai/runtime/cognition/example-a.ts",
          "services/ai/runtime/cognition/example-a.ts",
        ],
      }),
    /XVI_CODING_RESUME_INTEGRITY_REFUSED/,
  );
});

test("noncanonical path order fails closed", () => {
  assert.throws(
    () =>
      createXviCodingResumeIntegrityReceipt({
        ...input(),

        missionPaths: [
          "services/ai/runtime/cognition/example-b.ts",
          "services/ai/runtime/cognition/example-a.ts",
        ],
      }),
    /XVI_CODING_RESUME_INTEGRITY_REFUSED/,
  );
});

test("path traversal fails closed", () => {
  assert.throws(
    () =>
      createXviCodingResumeIntegrityReceipt({
        ...input(),

        missionPaths: [
          "../outside.ts",
        ],
      }),
    /XVI_CODING_RESUME_INTEGRITY_REFUSED/,
  );
});

test("changed plan digest changes integrity identity", () => {
  const first =
    createXviCodingResumeIntegrityReceipt(
      input(),
    );

  const second =
    createXviCodingResumeIntegrityReceipt({
      ...input(),

      resumePlanDigest:
        "d".repeat(64),
    });

  assert.notEqual(
    first.integrityDigest,
    second.integrityDigest,
  );
});

test("changed coordinator digest changes integrity identity", () => {
  const first =
    createXviCodingResumeIntegrityReceipt(
      input(),
    );

  const second =
    createXviCodingResumeIntegrityReceipt({
      ...input(),

      coordinatorDigest:
        "d".repeat(64),
    });

  assert.notEqual(
    first.integrityDigest,
    second.integrityDigest,
  );
});

test("replay nonce changes integrity identity", () => {
  const first =
    createXviCodingResumeIntegrityReceipt(
      input(),
    );

  const second =
    createXviCodingResumeIntegrityReceipt({
      ...input(),

      replayNonce:
        "resume-nonce-00000002",
    });

  assert.notEqual(
    first.integrityDigest,
    second.integrityDigest,
  );
});

test("undeclared authority fails closed", () => {
  assert.throws(
    () =>
      createXviCodingResumeIntegrityReceipt({
        ...input(),

        remoteWriteAuthority:
          true,
      } as never),
    /XVI_CODING_RESUME_INTEGRITY_REFUSED/,
  );
});

test("resume receipt grants no remote or production authority", () => {
  const receipt =
    createXviCodingResumeIntegrityReceipt(
      input(),
    );

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

  assert.equal(
    Object.isFrozen(
      receipt.missionPaths,
    ),
    true,
  );
});

test("changed source envelope digest changes integrity identity", () => {
  const first =
    createXviCodingResumeIntegrityReceipt(
      input(),
    );

  const second =
    createXviCodingResumeIntegrityReceipt({
      ...input(),

      sourceEnvelopeDigest:
        "f".repeat(64),
    });

  assert.notEqual(
    first.integrityDigest,
    second.integrityDigest,
  );
});

test("changed execution result digest changes integrity identity", () => {
  const first =
    createXviCodingResumeIntegrityReceipt(
      input(),
    );

  const second =
    createXviCodingResumeIntegrityReceipt({
      ...input(),

      executionResultDigest:
        "f".repeat(64),
    });

  assert.notEqual(
    first.integrityDigest,
    second.integrityDigest,
  );
});
