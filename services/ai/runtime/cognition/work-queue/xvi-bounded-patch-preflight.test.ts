import test from "node:test";
import assert from "node:assert/strict";

import {
  createHash,
} from "node:crypto";

import {
  mkdirSync,
  mkdtempSync,
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
        "xvi-gate40a-",
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

  const currentContent =
    "export const value = 1;\n";

  writeFileSync(
    absolutePath,
    currentContent,
    "utf8",
  );

  return {
    root,
    relativePath,
    absolutePath,
    currentContent,
  };
}

function proposal(input: {
  path?: string;
  expectedContentDigest?: string;
  replacementContent?: string;
  proposalDigest?: string;
} = {}): Readonly<XviCodingPatchProposal> {
  const path =
    input.path ??
    "services/ai/example.ts";

  const expectedContentDigest =
    input.expectedContentDigest ??
    digest(
      "export const value = 1;\n",
    );

  const replacementContent =
    input.replacementContent ??
    "export const value = 2;\n";

  const workId =
    "gate40a-work-001";

  const missionId =
    "gate40a-mission-001";

  const sourceInspectionDigest =
    "a".repeat(64);

  const files =
    Object.freeze([
      Object.freeze({
        path,
        expectedContentDigest,
        replacementContent,
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
    input.proposalDigest ??
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

test("matching content produces bounded preflight", () => {
  const f = fixture();

  try {
    const result =
      createXviBoundedPatchPreflight({
        repositoryRoot:
          f.root,

        proposal:
          proposal(),
      });

    assert.equal(
      result.files.length,
      1,
    );

    assert.equal(
      result.files[0].path,
      f.relativePath,
    );

    assert.equal(
      result.files[0].safeToWrite,
      true,
    );

    assert.equal(
      result.files[0].currentContentDigest,
      digest(f.currentContent),
    );

    assert.equal(
      result.filesystemMutationPerformed,
      false,
    );

    assert.match(
      result.preflightDigest,
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

test("stale expected content digest fails closed", () => {
  const f = fixture();

  try {
    assert.throws(
      () =>
        createXviBoundedPatchPreflight({
          repositoryRoot:
            f.root,

          proposal:
            proposal({
              expectedContentDigest:
                "b".repeat(64),
            }),
        }),
      /XVI_BOUNDED_PATCH_PREFLIGHT_REFUSED/,
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

test("missing target fails closed", () => {
  const f = fixture();

  try {
    assert.throws(
      () =>
        createXviBoundedPatchPreflight({
          repositoryRoot:
            f.root,

          proposal:
            proposal({
              path:
                "services/ai/missing.ts",
            }),
        }),
      /XVI_BOUNDED_PATCH_PREFLIGHT_REFUSED/,
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

test("directory target fails closed", () => {
  const f = fixture();

  try {
    assert.throws(
      () =>
        createXviBoundedPatchPreflight({
          repositoryRoot:
            f.root,

          proposal:
            proposal({
              path:
                "services/ai",
            }),
        }),
      /XVI_BOUNDED_PATCH_PREFLIGHT_REFUSED/,
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

test("path traversal fails closed", () => {
  const f = fixture();

  try {
    assert.throws(
      () =>
        createXviBoundedPatchPreflight({
          repositoryRoot:
            f.root,

          proposal:
            proposal({
              path:
                "../outside.ts",
            }),
        }),
      /XVI_BOUNDED_PATCH_PREFLIGHT_REFUSED/,
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

test("absolute path fails closed", () => {
  const f = fixture();

  try {
    assert.throws(
      () =>
        createXviBoundedPatchPreflight({
          repositoryRoot:
            f.root,

          proposal:
            proposal({
              path:
                f.absolutePath,
            }),
        }),
      /XVI_BOUNDED_PATCH_PREFLIGHT_REFUSED/,
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

test("symbolic link target fails closed", () => {
  const f = fixture();

  const outside =
    mkdtempSync(
      join(
        tmpdir(),
        "xvi-gate40a-outside-",
      ),
    );

  try {
    const outsideFile =
      join(
        outside,
        "outside.ts",
      );

    writeFileSync(
      outsideFile,
      f.currentContent,
      "utf8",
    );

    const link =
      join(
        f.root,
        "services",
        "ai",
        "link.ts",
      );

    try {
      symlinkSync(
        outsideFile,
        link,
        "file",
      );
    }
    catch {
      /*
       * Some Windows configurations prohibit
       * symlink creation without Developer Mode.
       */
      return;
    }

    assert.throws(
      () =>
        createXviBoundedPatchPreflight({
          repositoryRoot:
            f.root,

          proposal:
            proposal({
              path:
                "services/ai/link.ts",
            }),
        }),
      /XVI_BOUNDED_PATCH_PREFLIGHT_REFUSED/,
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

test("forged proposal digest fails closed", () => {
  const f = fixture();

  try {
    assert.throws(
      () =>
        createXviBoundedPatchPreflight({
          repositoryRoot:
            f.root,

          proposal:
            proposal({
              proposalDigest:
                "f".repeat(64),
            }),
        }),
      /XVI_BOUNDED_PATCH_PREFLIGHT_REFUSED/,
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

test("altered replacement with original proposal digest fails closed", () => {
  const f = fixture();

  try {
    const source =
      proposal();

    const forged =
      Object.freeze({
        ...source,

        files:
          Object.freeze([
            Object.freeze({
              ...source.files[0],

              replacementContent:
                "export const value = 999;\n",
            }),
          ]),
      });

    assert.throws(
      () =>
        createXviBoundedPatchPreflight({
          repositoryRoot:
            f.root,

          proposal:
            forged,
        }),
      /XVI_BOUNDED_PATCH_PREFLIGHT_REFUSED/,
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

test("preflight receipt is deeply frozen and grants no execution", () => {
  const f = fixture();

  try {
    const result =
      createXviBoundedPatchPreflight({
        repositoryRoot:
          f.root,

        proposal:
          proposal(),
      });

    assert.equal(
      Object.isFrozen(result),
      true,
    );

    assert.equal(
      Object.isFrozen(result.files),
      true,
    );

    assert.equal(
      Object.isFrozen(result.files[0]),
      true,
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

test("altered mission identity with original proposal digest fails closed", () => {
  const f = fixture();

  try {
    const source =
      proposal();

    assert.throws(
      () =>
        createXviBoundedPatchPreflight({
          repositoryRoot:
            f.root,

          proposal: {
            ...source,

            missionId:
              "forged-mission",
          },
        }),
      /XVI_BOUNDED_PATCH_PREFLIGHT_REFUSED/,
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

test("altered expected digest with original proposal digest fails closed", () => {
  const f = fixture();

  try {
    const source =
      proposal();

    const forged =
      Object.freeze({
        ...source,

        files:
          Object.freeze([
            Object.freeze({
              ...source.files[0],

              expectedContentDigest:
                "c".repeat(64),
            }),
          ]),
      });

    assert.throws(
      () =>
        createXviBoundedPatchPreflight({
          repositoryRoot:
            f.root,

          proposal:
            forged,
        }),
      /XVI_BOUNDED_PATCH_PREFLIGHT_REFUSED/,
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
