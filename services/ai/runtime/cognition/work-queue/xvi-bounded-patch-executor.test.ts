import test from "node:test";
import assert from "node:assert/strict";

import {
  createHash,
} from "node:crypto";

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";

import {
  tmpdir,
} from "node:os";

import {
  join,
} from "node:path";

import {
  createXviBoundedPatchPreflight,
} from "./xvi-bounded-patch-preflight";

import {
  executeXviBoundedPatch,
  verifyXviBoundedPatchExecutionReceipt,
} from "./xvi-bounded-patch-executor";

import type {
  XviCodingPatchProposal,
} from "./xvi-coding-patch-proposal";

const digest = (
  value: string,
): string =>
  createHash("sha256")
    .update(value)
    .digest("hex");

function fixture() {
  const root =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate40b-",
      ),
    );

  const relativePath =
    "services/ai/example.ts";

  const directory =
    join(
      root,
      "services",
      "ai",
    );

  mkdirSync(
    directory,
    {
      recursive: true,
    },
  );

  const absolutePath =
    join(
      root,
      relativePath,
    );

  const before =
    "export const value = 1;\n";

  const after =
    "export const value = 2;\n";

  writeFileSync(
    absolutePath,
    before,
    "utf8",
  );

  return {
    root,
    relativePath,
    absolutePath,
    before,
    after,
  };
}

function proposal(
  path: string,
  before: string,
  after: string,
): Readonly<XviCodingPatchProposal> {
  const workId =
    "gate40b-work-001";

  const missionId =
    "gate40b-mission-001";

  const sourceInspectionDigest =
    "a".repeat(64);

  const files =
    Object.freeze([
      Object.freeze({
        path,

        expectedContentDigest:
          digest(before),

        replacementContent:
          after,
      }),
    ]);

  const canonical =
    JSON.stringify([
      "xvi-coding-patch-proposal-v1",

      workId,
      missionId,

      sourceInspectionDigest,

      files,
    ]);

  const proposalDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return Object.freeze({
    version:
      "xvi-coding-patch-proposal-v1" as const,

    workId,
    missionId,

    sourceInspectionDigest,

    files,

    proposalDigest,

    filesystemMutationPerformed:
      false as const,

    shellExecutionPerformed:
      false as const,

    testsExecuted:
      false as const,

    automaticPushAllowed:
      false as const,

    automaticMergeAllowed:
      false as const,

    automaticDeployAllowed:
      false as const,

    humanApprovalRequired:
      true as const,
  });
}

test("bounded executor performs first fixture-only atomic replacement", () => {
  const f =
    fixture();

  try {
    const p =
      proposal(
        f.relativePath,
        f.before,
        f.after,
      );

    const preflight =
      createXviBoundedPatchPreflight({
        repositoryRoot:
          f.root,

        proposal:
          p,
      });

    const receipt =
      executeXviBoundedPatch({
        repositoryRoot:
          f.root,

        proposal:
          p,

        preflight,

        fixtureExecutionAuthorized:
          true,
      });

    assert.equal(
      readFileSync(
        f.absolutePath,
        "utf8",
      ),
      f.after,
    );

    assert.equal(
      receipt.beforeDigest,
      digest(f.before),
    );

    assert.equal(
      receipt.afterDigest,
      digest(f.after),
    );

    assert.equal(
      receipt.filesystemMutationPerformed,
      true,
    );

    assert.equal(
      receipt.shellExecutionPerformed,
      false,
    );

    assert.equal(
      receipt.testsExecuted,
      false,
    );

    assert.match(
      receipt.executionDigest,
      /^[a-f0-9]{64}$/,
    );
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("target changed after preflight fails without overwrite", () => {
  const f =
    fixture();

  try {
    const p =
      proposal(
        f.relativePath,
        f.before,
        f.after,
      );

    const preflight =
      createXviBoundedPatchPreflight({
        repositoryRoot:
          f.root,

        proposal:
          p,
      });

    const changed =
      "export const value = 77;\n";

    writeFileSync(
      f.absolutePath,
      changed,
      "utf8",
    );

    assert.throws(
      () =>
        executeXviBoundedPatch({
          repositoryRoot:
            f.root,

          proposal:
            p,

          preflight,

          fixtureExecutionAuthorized:
            true,
        }),
      /XVI_BOUNDED_PATCH_EXECUTOR_REFUSED/,
    );

    assert.equal(
      readFileSync(
        f.absolutePath,
        "utf8",
      ),
      changed,
    );
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("forged proposal fails before mutation", () => {
  const f =
    fixture();

  try {
    const source =
      proposal(
        f.relativePath,
        f.before,
        f.after,
      );

    const preflight =
      createXviBoundedPatchPreflight({
        repositoryRoot:
          f.root,

        proposal:
          source,
      });

    const forged =
      Object.freeze({
        ...source,

        proposalDigest:
          "f".repeat(64),
      });

    assert.throws(
      () =>
        executeXviBoundedPatch({
          repositoryRoot:
            f.root,

          proposal:
            forged,

          preflight,

          fixtureExecutionAuthorized:
            true,
        }),
      /XVI_BOUNDED_PATCH_EXECUTOR_REFUSED/,
    );

    assert.equal(
      readFileSync(
        f.absolutePath,
        "utf8",
      ),
      f.before,
    );
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("forged preflight digest fails before mutation", () => {
  const f =
    fixture();

  try {
    const p =
      proposal(
        f.relativePath,
        f.before,
        f.after,
      );

    const source =
      createXviBoundedPatchPreflight({
        repositoryRoot:
          f.root,

        proposal:
          p,
      });

    const forged =
      Object.freeze({
        ...source,

        preflightDigest:
          "f".repeat(64),
      });

    assert.throws(
      () =>
        executeXviBoundedPatch({
          repositoryRoot:
            f.root,

          proposal:
            p,

          preflight:
            forged,

          fixtureExecutionAuthorized:
            true,
        }),
      /XVI_BOUNDED_PATCH_EXECUTOR_REFUSED/,
    );

    assert.equal(
      readFileSync(
        f.absolutePath,
        "utf8",
      ),
      f.before,
    );
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("target replaced by symlink after preflight fails closed", () => {
  const f =
    fixture();

  const outside =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate40b-outside-",
      ),
    );

  try {
    const p =
      proposal(
        f.relativePath,
        f.before,
        f.after,
      );

    const preflight =
      createXviBoundedPatchPreflight({
        repositoryRoot:
          f.root,

        proposal:
          p,
      });

    const outsideFile =
      join(
        outside,
        "outside.ts",
      );

    writeFileSync(
      outsideFile,
      f.before,
      "utf8",
    );

    rmSync(
      f.absolutePath,
      {
        force: true,
      },
    );

    try {
      symlinkSync(
        outsideFile,
        f.absolutePath,
        "file",
      );
    }
    catch {
      /*
       * Windows may prohibit symlink fixtures.
       * A dedicated reparse-point test follows
       * in the next hardening slice.
       */
      return;
    }

    assert.throws(
      () =>
        executeXviBoundedPatch({
          repositoryRoot:
            f.root,

          proposal:
            p,

          preflight,

          fixtureExecutionAuthorized:
            true,
        }),
      /XVI_BOUNDED_PATCH_EXECUTOR_REFUSED/,
    );

    assert.equal(
      readFileSync(
        outsideFile,
        "utf8",
      ),
      f.before,
    );
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );

    rmSync(
      outside,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("ancestor directory replaced by junction after preflight fails closed", () => {
  const root =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate40b-junction-",
      ),
    );

  const outside =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate40b-junction-outside-",
      ),
    );

  const relativePath =
    "safe/target.ts";

  const safeDirectory =
    join(
      root,
      "safe",
    );

  const targetPath =
    join(
      safeDirectory,
      "target.ts",
    );

  const outsideFile =
    join(
      outside,
      "target.ts",
    );

  const before =
    "export const value = 'before';";

  const after =
    "export const value = 'after';";

  try {
    mkdirSync(
      safeDirectory,
    );

    writeFileSync(
      targetPath,
      before,
      "utf8",
    );

    const p =
      proposal(
        relativePath,
        before,
        after,
      );

    const preflight =
      createXviBoundedPatchPreflight({
        repositoryRoot:
          root,

        proposal:
          p,
      });

    rmSync(
      safeDirectory,
      {
        recursive: true,
        force: true,
      },
    );

    writeFileSync(
      outsideFile,
      before,
      "utf8",
    );

    try {
      symlinkSync(
        outside,
        safeDirectory,
        "junction",
      );
    }
    catch {
      return;
    }

    assert.throws(
      () =>
        executeXviBoundedPatch({
          repositoryRoot:
            root,

          proposal:
            p,

          preflight,

          fixtureExecutionAuthorized:
            true,
        }),
      /XVI_BOUNDED_PATCH_EXECUTOR_REFUSED/,
    );

    assert.equal(
      readFileSync(
        outsideFile,
        "utf8",
      ),
      before,
    );

    assert.equal(
      readdirSync(outside)
        .some((name) => name.startsWith(".xvi-tmp-")),
      false,
    );
  }
  finally {
    rmSync(
      root,
      {
        recursive: true,
        force: true,
      },
    );

    rmSync(
      outside,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("execution receipt grants no external authority", () => {
  const f =
    fixture();

  try {
    const p =
      proposal(
        f.relativePath,
        f.before,
        f.after,
      );

    const preflight =
      createXviBoundedPatchPreflight({
        repositoryRoot:
          f.root,

        proposal:
          p,
      });

    const receipt =
      executeXviBoundedPatch({
        repositoryRoot:
          f.root,

        proposal:
          p,

        preflight,

        fixtureExecutionAuthorized:
          true,
      });

    assert.equal(
      Object.isFrozen(receipt),
      true,
    );

    assert.equal(
      receipt.automaticPushAllowed,
      false,
    );

    assert.equal(
      receipt.automaticMergeAllowed,
      false,
    );

    assert.equal(
      receipt.automaticDeployAllowed,
      false,
    );

    assert.equal(
      receipt.humanApprovalRequired,
      true,
    );
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("successful transaction leaves no XVI temporary artifacts", () => {
  const f =
    fixture();

  try {
    const p =
      proposal(
        f.relativePath,
        f.before,
        f.after,
      );

    const preflight =
      createXviBoundedPatchPreflight({
        repositoryRoot:
          f.root,

        proposal:
          p,
      });

    executeXviBoundedPatch({
      repositoryRoot:
        f.root,

      proposal:
        p,

      preflight,

      fixtureExecutionAuthorized:
        true,
    });

    const directory =
      join(
        f.root,
        "services",
        "ai",
      );

    const leftovers =
      readdirSync(directory)
        .filter(
          name =>
            name.startsWith(
              ".xvi-tmp-",
            ),
        );

    assert.deepEqual(
      leftovers,
      [],
    );

    assert.equal(
      readFileSync(
        f.absolutePath,
        "utf8",
      ),
      f.after,
    );
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("stale target refusal creates no transaction artifacts", () => {
  const f =
    fixture();

  try {
    const p =
      proposal(
        f.relativePath,
        f.before,
        f.after,
      );

    const preflight =
      createXviBoundedPatchPreflight({
        repositoryRoot:
          f.root,

        proposal:
          p,
      });

    const changed =
      "export const value = 88;\n";

    writeFileSync(
      f.absolutePath,
      changed,
      "utf8",
    );

    assert.throws(
      () =>
        executeXviBoundedPatch({
          repositoryRoot:
            f.root,

          proposal:
            p,

          preflight,

          fixtureExecutionAuthorized:
            true,
        }),
      /XVI_BOUNDED_PATCH_EXECUTOR_REFUSED/,
    );

    const leftovers =
      readdirSync(
        join(
          f.root,
          "services",
          "ai",
        ),
      ).filter(
        name =>
          name.startsWith(
            ".xvi-tmp-",
          ),
      );

    assert.deepEqual(
      leftovers,
      [],
    );

    assert.equal(
      readFileSync(
        f.absolutePath,
        "utf8",
      ),
      changed,
    );
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("execution receipt binds exact before and after content", () => {
  const f =
    fixture();

  try {
    const p =
      proposal(
        f.relativePath,
        f.before,
        f.after,
      );

    const preflight =
      createXviBoundedPatchPreflight({
        repositoryRoot:
          f.root,

        proposal:
          p,
      });

    const receipt =
      executeXviBoundedPatch({
        repositoryRoot:
          f.root,

        proposal:
          p,

        preflight,

        fixtureExecutionAuthorized:
          true,
      });

    assert.equal(
      receipt.beforeDigest,
      digest(f.before),
    );

    assert.equal(
      receipt.afterDigest,
      digest(f.after),
    );

    assert.equal(
      receipt.sourceProposalDigest,
      p.proposalDigest,
    );

    assert.equal(
      receipt.sourcePreflightDigest,
      preflight.preflightDigest,
    );
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("valid execution receipt verifies cryptographically", () => {
  const f = fixture();

  try {
    const p =
      proposal(
        f.relativePath,
        f.before,
        f.after,
      );

    const preflight =
      createXviBoundedPatchPreflight({
        repositoryRoot: f.root,
        proposal: p,
      });

    const receipt =
      executeXviBoundedPatch({
        repositoryRoot: f.root,
        proposal: p,
        preflight,
        fixtureExecutionAuthorized: true,
      });

    assert.equal(
      verifyXviBoundedPatchExecutionReceipt(
        receipt,
      ),
      true,
    );
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("altered after digest invalidates execution receipt", () => {
  const f = fixture();

  try {
    const p =
      proposal(
        f.relativePath,
        f.before,
        f.after,
      );

    const preflight =
      createXviBoundedPatchPreflight({
        repositoryRoot: f.root,
        proposal: p,
      });

    const receipt =
      executeXviBoundedPatch({
        repositoryRoot: f.root,
        proposal: p,
        preflight,
        fixtureExecutionAuthorized: true,
      });

    assert.equal(
      verifyXviBoundedPatchExecutionReceipt({
        ...receipt,

        afterDigest:
          "f".repeat(64),
      }),
      false,
    );
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});

test("altered mission invalidates execution receipt", () => {
  const f = fixture();

  try {
    const p =
      proposal(
        f.relativePath,
        f.before,
        f.after,
      );

    const preflight =
      createXviBoundedPatchPreflight({
        repositoryRoot: f.root,
        proposal: p,
      });

    const receipt =
      executeXviBoundedPatch({
        repositoryRoot: f.root,
        proposal: p,
        preflight,
        fixtureExecutionAuthorized: true,
      });

    assert.equal(
      verifyXviBoundedPatchExecutionReceipt({
        ...receipt,

        missionId:
          "forged-mission",
      }),
      false,
    );
  }
  finally {
    rmSync(
      f.root,
      {
        recursive: true,
        force: true,
      },
    );
  }
});
test(
  "replacement failure restores authenticated original and cleans transaction artifacts",
  () => {
    const f =
      fixture();

    try {
      const p =
        proposal(
          f.relativePath,
          f.before,
          f.after,
        );

      const preflight =
        createXviBoundedPatchPreflight({
          repositoryRoot:
            f.root,

          proposal:
            p,
        });

      let renameCount =
        0;

      const fileOperations = {
        rename(
          source: string,
          destination: string,
        ): void {
          renameCount += 1;

          /*
           * 1 = original -> rollback
           * 2 = pending -> target (forced failure)
           * 3 = rollback -> original
           */
          if (
            renameCount === 2
          ) {
            throw new Error(
              "FORCED_REPLACEMENT_FAILURE",
            );
          }

          renameSync(
            source,
            destination,
          );
        },

        remove(
          path: string,
        ): void {
          rmSync(
            path,
            {
              force: true,
            },
          );
        },
      };

      assert.throws(
        () =>
          executeXviBoundedPatch({
            repositoryRoot:
              f.root,

            proposal:
              p,

            preflight,

            fixtureExecutionAuthorized:
              true,

            fileOperations,
          }),
        /FORCED_REPLACEMENT_FAILURE/,
      );

      assert.equal(
        renameCount,
        3,
      );

      const restored =
        readFileSync(
          f.absolutePath,
          "utf8",
        );

      assert.equal(
        restored,
        f.before,
      );

      assert.equal(
        digest(restored),
        digest(f.before),
      );

      const directory =
        join(
          f.root,
          "services",
          "ai",
        );

      const leftovers =
        readdirSync(
          directory,
        ).filter(
          name =>
            name.startsWith(
              ".xvi-tmp-",
            ),
        );

      assert.deepEqual(
        leftovers,
        [],
      );
    }
    finally {
      rmSync(
        f.root,
        {
          recursive: true,
          force: true,
        },
      );
    }
  },
);