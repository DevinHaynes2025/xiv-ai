import {
  createHash,
} from "node:crypto";

import {
  lstatSync,
  readFileSync,
  realpathSync,
} from "node:fs";

import {
  isAbsolute,
  relative,
  resolve,
} from "node:path";

import type {
  XviCodingPatchProposal,
  XviCodingFileProposal,
} from "./xvi-coding-patch-proposal";

import {
  verifyXviCodingPatchProposal,
} from "./xvi-coding-patch-proposal";

export interface XviPatchFilePreflight {
  readonly path: string;

  readonly absolutePath: string;

  readonly expectedContentDigest: string;
  readonly currentContentDigest: string;

  readonly replacementContentDigest: string;

  readonly currentByteCount: number;
  readonly replacementByteCount: number;

  readonly safeToWrite: true;
}

export interface XviBoundedPatchPreflight {
  readonly version:
    "xvi-bounded-patch-preflight-v1";

  readonly repositoryRoot: string;

  readonly proposalDigest: string;

  readonly files:
    readonly Readonly<XviPatchFilePreflight>[];

  readonly preflightDigest: string;

  readonly filesystemMutationPerformed: false;
  readonly shellExecutionPerformed: false;
  readonly testsExecuted: false;

  readonly automaticPushAllowed: false;
  readonly automaticMergeAllowed: false;
  readonly automaticDeployAllowed: false;

  readonly humanApprovalRequired: true;
}

const SHA256 =
  /^[a-f0-9]{64}$/;

const refuse = (
  reason: string,
): never => {
  throw new Error(
    `XVI_BOUNDED_PATCH_PREFLIGHT_REFUSED: ${reason}`,
  );
};

function digest(
  value: Buffer | string,
): string {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

function assertInsideRoot(
  root: string,
  candidate: string,
): void {
  const rel =
    relative(
      root,
      candidate,
    );

  if (
    rel === "" ||
    rel.startsWith("..") ||
    isAbsolute(rel)
  ) {
    /*
     * Root itself is not a valid file target,
     * and targets must never escape the root.
     */
    refuse(
      "target outside repository root",
    );
  }
}

function inspectFile(
  repositoryRoot: string,
  file:
    Readonly<XviCodingFileProposal>,
): Readonly<XviPatchFilePreflight> {
  if (
    isAbsolute(file.path)
  ) {
    refuse(
      "absolute target path prohibited",
    );
  }

  const lexical =
    resolve(
      repositoryRoot,
      file.path,
    );

  assertInsideRoot(
    repositoryRoot,
    lexical,
  );

  let stat;

  try {
    stat =
      lstatSync(
        lexical,
      );
  }
  catch {
    refuse(
      "target file missing",
    );
  }

  if (
    !stat.isFile()
  ) {
    refuse(
      "target must be regular file",
    );
  }

  if (
    stat.isSymbolicLink()
  ) {
    refuse(
      "symbolic link target prohibited",
    );
  }

  let physical: string;

  try {
    physical =
      realpathSync.native(
        lexical,
      );
  }
  catch {
    refuse(
      "target realpath unavailable",
    );
  }

  assertInsideRoot(
    repositoryRoot,
    physical,
  );

  const current =
    readFileSync(
      physical,
    );

  const currentContentDigest =
    digest(
      current,
    );

  if (
    currentContentDigest !==
      file.expectedContentDigest
  ) {
    refuse(
      "expected content digest mismatch",
    );
  }

  const replacementByteCount =
    Buffer.byteLength(
      file.replacementContent,
      "utf8",
    );

  if (
    replacementByteCount >
      256 * 1024
  ) {
    refuse(
      "replacement exceeds byte bound",
    );
  }

  const replacementContentDigest =
    digest(
      file.replacementContent,
    );

  return Object.freeze({
    path:
      file.path,

    absolutePath:
      physical,

    expectedContentDigest:
      file.expectedContentDigest,

    currentContentDigest,

    replacementContentDigest,

    currentByteCount:
      current.byteLength,

    replacementByteCount,

    safeToWrite:
      true as const,
  });
}

export function createXviBoundedPatchPreflight(input: {
  readonly repositoryRoot: string;

  readonly proposal:
    Readonly<XviCodingPatchProposal>;
}): Readonly<XviBoundedPatchPreflight> {
  if (
    typeof input.repositoryRoot !==
      "string" ||
    !input.repositoryRoot.trim()
  ) {
    refuse(
      "repository root required",
    );
  }

  let repositoryRoot: string;

  try {
    repositoryRoot =
      realpathSync.native(
        resolve(
          input.repositoryRoot,
        ),
      );
  }
  catch {
    refuse(
      "repository root unavailable",
    );
  }

  const proposal =
    input.proposal;

  if (
    !verifyXviCodingPatchProposal(
      proposal,
    )
  ) {
    refuse(
      "patch proposal cryptographic verification failed",
    );
  }

  if (
    proposal.version !==
      "xvi-coding-patch-proposal-v1" ||

    !SHA256.test(
      proposal.proposalDigest,
    ) ||

    proposal.filesystemMutationPerformed !==
      false ||

    proposal.shellExecutionPerformed !==
      false ||

    proposal.testsExecuted !==
      false ||

    proposal.automaticPushAllowed !==
      false ||

    proposal.automaticMergeAllowed !==
      false ||

    proposal.automaticDeployAllowed !==
      false ||

    proposal.humanApprovalRequired !==
      true ||

    !Array.isArray(
      proposal.files,
    ) ||

    proposal.files.length < 1
  ) {
    refuse(
      "invalid patch proposal",
    );
  }

  const files =
    Object.freeze(
      proposal.files.map(
        file =>
          inspectFile(
            repositoryRoot,
            file,
          ),
      ),
    );

  const canonical =
    JSON.stringify([
      "xvi-bounded-patch-preflight-v1",

      repositoryRoot,

      proposal.proposalDigest,

      files.map(
        file => [
          file.path,
          file.absolutePath,
          file.currentContentDigest,
          file.replacementContentDigest,
          file.currentByteCount,
          file.replacementByteCount,
        ],
      ),
    ]);

  const preflightDigest =
    digest(
      canonical,
    );

  return Object.freeze({
    version:
      "xvi-bounded-patch-preflight-v1" as const,

    repositoryRoot,

    proposalDigest:
      proposal.proposalDigest,

    files,

    preflightDigest,

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
