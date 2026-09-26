import test from "node:test";
import assert from "node:assert/strict";
import {
  createHash,
} from "node:crypto";

import {
  createXviCodingPatchProposal,
} from "./xvi-coding-patch-proposal";

import type {
  XviCodingResponseInspection,
} from "./xvi-coding-response-inspector";

const PATH =
  "services/ai/runtime/cognition/work-queue/example.ts";

function inspection():
  Readonly<XviCodingResponseInspection> {
  const workId =
    "gate39i-work-001";

  const missionId =
    "gate39i-mission-001";

  const sourceResultDigest =
    "a".repeat(64);

  const disposition =
    "PROPOSAL_ACCEPTED" as const;

  const findings =
    Object.freeze([] as string[]);

  const canonical =
    JSON.stringify([
      "xvi-coding-response-inspection-v1",
      workId,
      missionId,
      sourceResultDigest,
      disposition,
      findings,
    ]);

  const inspectionDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return Object.freeze({
    version:
      "xvi-coding-response-inspection-v1" as const,

    workId,
    missionId,
    sourceResultDigest,
    disposition,
    findings,
    inspectionDigest,

    executableAuthorityGranted:
      false as const,

    filesystemAuthorityGranted:
      false as const,

    shellAuthorityGranted:
      false as const,

    credentialAuthorityGranted:
      false as const,

    pushAuthorityGranted:
      false as const,

    deploymentAuthorityGranted:
      false as const,
  });
}

function file() {
  return {
    path:
      PATH,

    expectedContentDigest:
      "b".repeat(64),

    replacementContent:
      "export const value = 2;\n",
  };
}

function proposal(
  override: Record<string, unknown> = {},
) {
  return createXviCodingPatchProposal({
    inspection:
      inspection(),

    permittedPaths: [
      PATH,
    ],

    files: [
      {
        ...file(),
        ...override,
      },
    ],
  });
}

test("bounded permitted patch proposal is created", () => {
  const result =
    proposal();

  assert.equal(
    result.files.length,
    1,
  );

  assert.equal(
    result.files[0].path,
    PATH,
  );

  assert.match(
    result.proposalDigest,
    /^[a-f0-9]{64}$/,
  );
});

test("proposal performs no mutation or execution", () => {
  const result =
    proposal();

  assert.equal(
    result.filesystemMutationPerformed,
    false,
  );

  assert.equal(
    result.shellExecutionPerformed,
    false,
  );

  assert.equal(
    result.testsExecuted,
    false,
  );

  assert.equal(
    result.automaticPushAllowed,
    false,
  );

  assert.equal(
    result.automaticMergeAllowed,
    false,
  );

  assert.equal(
    result.automaticDeployAllowed,
    false,
  );

  assert.equal(
    result.humanApprovalRequired,
    true,
  );
});

test("path traversal fails closed", () => {
  assert.throws(
    () =>
      proposal({
        path:
          "../outside.ts",
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("absolute path fails closed", () => {
  assert.throws(
    () =>
      proposal({
        path:
          "/etc/example.ts",
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("Windows backslash path fails closed", () => {
  assert.throws(
    () =>
      proposal({
        path:
          "services\\ai\\example.ts",
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("path outside mission fails closed", () => {
  assert.throws(
    () =>
      proposal({
        path:
          "services/ai/runtime/outside.ts",
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("invalid expected content digest fails closed", () => {
  assert.throws(
    () =>
      proposal({
        expectedContentDigest:
          "not-a-digest",
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("NUL replacement content fails closed", () => {
  assert.throws(
    () =>
      proposal({
        replacementContent:
          "safe\u0000hidden",
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("duplicate proposal target fails closed", () => {
  assert.throws(
    () =>
      createXviCodingPatchProposal({
        inspection:
          inspection(),

        permittedPaths: [
          PATH,
        ],

        files: [
          file(),
          file(),
        ],
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("duplicate permitted path fails closed", () => {
  assert.throws(
    () =>
      createXviCodingPatchProposal({
        inspection:
          inspection(),

        permittedPaths: [
          PATH,
          PATH,
        ],

        files: [
          file(),
        ],
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("oversized replacement fails closed", () => {
  assert.throws(
    () =>
      proposal({
        replacementContent:
          "x".repeat(
            256 * 1024 + 1,
          ),
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("human-review inspection cannot become patch proposal", () => {
  const source =
    inspection();

  assert.throws(
    () =>
      createXviCodingPatchProposal({
        inspection: {
          ...source,

          disposition:
            "REQUIRES_HUMAN_REVIEW",
        },

        permittedPaths: [
          PATH,
        ],

        files: [
          file(),
        ],
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("forged inspection digest fails closed", () => {
  const source =
    inspection();

  assert.throws(
    () =>
      createXviCodingPatchProposal({
        inspection: {
          ...source,

          inspectionDigest:
            "f".repeat(64),
        },

        permittedPaths: [
          PATH,
        ],

        files: [
          file(),
        ],
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("altered inspection identity with original digest fails closed", () => {
  const source =
    inspection();

  assert.throws(
    () =>
      createXviCodingPatchProposal({
        inspection: {
          ...source,

          missionId:
            "forged-mission",
        },

        permittedPaths: [
          PATH,
        ],

        files: [
          file(),
        ],
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("proposal and nested file collections are frozen", () => {
  const result =
    proposal();

  assert.equal(
    Object.isFrozen(result),
    true,
  );

  assert.equal(
    Object.isFrozen(
      result.files,
    ),
    true,
  );

  assert.equal(
    Object.isFrozen(
      result.files[0],
    ),
    true,
  );
});

test("altered inspection findings with original digest fail closed", () => {
  const source =
    inspection();

  assert.throws(
    () =>
      createXviCodingPatchProposal({
        inspection: {
          ...source,

          findings: [
            "FORGED_FINDING",
          ],
        },

        permittedPaths: [
          PATH,
        ],

        files: [
          file(),
        ],
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});

test("altered inspection disposition with original digest fails closed", () => {
  const source =
    inspection();

  assert.throws(
    () =>
      createXviCodingPatchProposal({
        inspection: {
          ...source,

          disposition:
            "REJECTED",
        },

        permittedPaths: [
          PATH,
        ],

        files: [
          file(),
        ],
      }),
    /XVI_CODING_PATCH_PROPOSAL_REFUSED/,
  );
});
