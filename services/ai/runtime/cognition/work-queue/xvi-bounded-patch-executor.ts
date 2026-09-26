import {
  createHash,
} from "node:crypto";

import {
  closeSync,
  constants,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import {
  dirname,
  isAbsolute,
  relative,
  resolve,
} from "node:path";

import type {
  XviCodingPatchProposal,
} from "./xvi-coding-patch-proposal";

import {
  verifyXviCodingPatchProposal,
} from "./xvi-coding-patch-proposal";

import type {
  XviBoundedPatchPreflight,
} from "./xvi-bounded-patch-preflight";


export interface XviBoundedPatchExecutionReceipt {
  readonly version:
    "xvi-bounded-patch-execution-v1";

  readonly repositoryRoot: string;

  readonly workId: string;
  readonly missionId: string;

  readonly sourceProposalDigest: string;
  readonly sourcePreflightDigest: string;

  readonly path: string;

  readonly beforeDigest: string;
  readonly afterDigest: string;

  readonly replacementByteCount: number;

  readonly filesystemMutationPerformed: true;

  readonly shellExecutionPerformed: false;
  readonly testsExecuted: false;

  readonly automaticPushAllowed: false;
  readonly automaticMergeAllowed: false;
  readonly automaticDeployAllowed: false;

  readonly humanApprovalRequired: true;

  readonly executionDigest: string;
}


export interface XviBoundedPatchFileOperations {
  readonly rename: (
    source: string,
    destination: string,
  ) => void;

  readonly remove: (
    path: string,
  ) => void;
}


const DEFAULT_FILE_OPERATIONS:
  Readonly<XviBoundedPatchFileOperations> =
    Object.freeze({
      rename(
        source: string,
        destination: string,
      ): void {
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
    });


const SHA256 =
  /^[a-f0-9]{64}$/;


const refuse = (
  reason: string,
): never => {
  throw new Error(
    `XVI_BOUNDED_PATCH_EXECUTOR_REFUSED: ${reason}`,
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
    refuse(
      "target outside repository root",
    );
  }
}


function verifyPreflight(
  preflight:
    Readonly<XviBoundedPatchPreflight>,

  proposal:
    Readonly<XviCodingPatchProposal>,

  repositoryRoot: string,
): void {
  if (
    preflight.version !==
      "xvi-bounded-patch-preflight-v1" ||

    preflight.repositoryRoot !==
      repositoryRoot ||

    preflight.proposalDigest !==
      proposal.proposalDigest ||

    !SHA256.test(
      preflight.preflightDigest,
    ) ||

    preflight.filesystemMutationPerformed !==
      false ||

    preflight.shellExecutionPerformed !==
      false ||

    preflight.testsExecuted !==
      false ||

    preflight.automaticPushAllowed !==
      false ||

    preflight.automaticMergeAllowed !==
      false ||

    preflight.automaticDeployAllowed !==
      false ||

    preflight.humanApprovalRequired !==
      true ||

    !Array.isArray(
      preflight.files,
    ) ||

    preflight.files.length !==
      1
  ) {
    refuse(
      "invalid preflight receipt",
    );
  }

  const canonical =
    JSON.stringify([
      "xvi-bounded-patch-preflight-v1",

      preflight.repositoryRoot,

      preflight.proposalDigest,

      preflight.files.map(
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

  const expected =
    digest(
      canonical,
    );

  if (
    expected !==
      preflight.preflightDigest
  ) {
    refuse(
      "preflight cryptographic verification failed",
    );
  }
}


export function verifyXviBoundedPatchExecutionReceipt(
  receipt:
    Readonly<XviBoundedPatchExecutionReceipt>,
): boolean {
  if (
    receipt === null ||
    typeof receipt !== "object" ||

    receipt.version !==
      "xvi-bounded-patch-execution-v1" ||

    typeof receipt.repositoryRoot !==
      "string" ||
    !receipt.repositoryRoot ||

    typeof receipt.workId !==
      "string" ||
    !receipt.workId ||

    typeof receipt.missionId !==
      "string" ||
    !receipt.missionId ||

    !SHA256.test(
      receipt.sourceProposalDigest,
    ) ||

    !SHA256.test(
      receipt.sourcePreflightDigest,
    ) ||

    typeof receipt.path !==
      "string" ||
    !receipt.path ||

    !SHA256.test(
      receipt.beforeDigest,
    ) ||

    !SHA256.test(
      receipt.afterDigest,
    ) ||

    !Number.isSafeInteger(
      receipt.replacementByteCount,
    ) ||

    receipt.replacementByteCount <
      0 ||

    receipt.filesystemMutationPerformed !==
      true ||

    receipt.shellExecutionPerformed !==
      false ||

    receipt.testsExecuted !==
      false ||

    receipt.automaticPushAllowed !==
      false ||

    receipt.automaticMergeAllowed !==
      false ||

    receipt.automaticDeployAllowed !==
      false ||

    receipt.humanApprovalRequired !==
      true ||

    !SHA256.test(
      receipt.executionDigest,
    )
  ) {
    return false;
  }

  const canonical =
    JSON.stringify([
      "xvi-bounded-patch-execution-v1",

      receipt.repositoryRoot,

      receipt.workId,
      receipt.missionId,

      receipt.sourceProposalDigest,
      receipt.sourcePreflightDigest,

      receipt.path,

      receipt.beforeDigest,
      receipt.afterDigest,

      receipt.replacementByteCount,
    ]);

  const expectedDigest =
    digest(
      canonical,
    );

  return (
    receipt.executionDigest ===
    expectedDigest
  );
}


export function executeXviBoundedPatch(input: {
  readonly repositoryRoot: string;

  readonly proposal:
    Readonly<XviCodingPatchProposal>;

  readonly preflight:
    Readonly<XviBoundedPatchPreflight>;

  /*
   * Gate 40B is fixture-only.
   * This does not authorize writes to the
   * actual XVI repository.
   */
  readonly fixtureExecutionAuthorized:
    true;

  /*
   * Allows fixture tests to force filesystem
   * failures and prove rollback behavior.
   */
  readonly fileOperations?:
    Readonly<XviBoundedPatchFileOperations>;
}): Readonly<XviBoundedPatchExecutionReceipt> {
  const fileOperations =
    input.fileOperations ??
    DEFAULT_FILE_OPERATIONS;

  if (
    input.fixtureExecutionAuthorized !==
      true
  ) {
    refuse(
      "fixture execution authorization required",
    );
  }

  if (
    !verifyXviCodingPatchProposal(
      input.proposal,
    )
  ) {
    refuse(
      "patch proposal verification failed",
    );
  }

  if (
    input.proposal.files.length !==
      1
  ) {
    refuse(
      "Gate 40B permits exactly one file",
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

  verifyPreflight(
    input.preflight,
    input.proposal,
    repositoryRoot,
  );

  const proposalFile =
    input.proposal.files[0];

  const preflightFile =
    input.preflight.files[0];

  if (
    proposalFile.path !==
      preflightFile.path ||

    proposalFile.expectedContentDigest !==
      preflightFile.expectedContentDigest
  ) {
    refuse(
      "proposal and preflight file mismatch",
    );
  }

  if (
    isAbsolute(
      proposalFile.path,
    )
  ) {
    refuse(
      "absolute path prohibited",
    );
  }

  const lexical =
    resolve(
      repositoryRoot,
      proposalFile.path,
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
      "target unavailable before execution",
    );
  }

  if (
    !stat.isFile() ||
    stat.isSymbolicLink()
  ) {
    refuse(
      "target no longer regular file",
    );
  }

  if (
    process.platform === "win32" &&
    (
      stat.mode &
      constants.S_IFMT
    ) !==
      constants.S_IFREG
  ) {
    refuse(
      "non-regular Windows target prohibited",
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

  if (
    physical !==
      preflightFile.absolutePath
  ) {
    refuse(
      "target identity changed after preflight",
    );
  }

  /*
   * TOCTOU defense:
   * re-read immediately before mutation.
   */
  const before =
    readFileSync(
      physical,
    );

  const beforeDigest =
    digest(
      before,
    );

  if (
    beforeDigest !==
      proposalFile.expectedContentDigest ||

    beforeDigest !==
      preflightFile.currentContentDigest
  ) {
    refuse(
      "target changed after preflight",
    );
  }

  const replacementDigest =
    digest(
      proposalFile.replacementContent,
    );

  if (
    replacementDigest !==
      preflightFile.replacementContentDigest
  ) {
    refuse(
      "replacement changed after preflight",
    );
  }

  const directory =
    dirname(
      physical,
    );

  /*
   * Deterministic transaction identity derived
   * from authenticated transaction inputs.
   */
  const transactionDigest =
    digest(
      JSON.stringify([
        "xvi-bounded-patch-transaction-v1",

        repositoryRoot,

        input.proposal.proposalDigest,
        input.preflight.preflightDigest,

        proposalFile.path,

        beforeDigest,
        replacementDigest,
      ]),
    );

  const temporary =
    resolve(
      directory,
      `.xvi-tmp-${transactionDigest}.pending`,
    );

  const backup =
    resolve(
      directory,
      `.xvi-tmp-${transactionDigest}.rollback`,
    );

  assertInsideRoot(
    repositoryRoot,
    temporary,
  );

  assertInsideRoot(
    repositoryRoot,
    backup,
  );

  let fd:
    number | null =
      null;

  try {
    /*
     * Exclusive creation prevents reuse of an
     * existing transaction artifact.
     */
    fd =
      openSync(
        temporary,
        "wx",
        stat.mode,
      );

    writeFileSync(
      fd,
      proposalFile.replacementContent,
      {
        encoding:
          "utf8",
      },
    );

    fsyncSync(
      fd,
    );

    closeSync(
      fd,
    );

    fd =
      null;

    const tempDigest =
      digest(
        readFileSync(
          temporary,
        ),
      );

    if (
      tempDigest !==
        replacementDigest
    ) {
      refuse(
        "temporary replacement verification failed",
      );
    }

    /*
     * Transaction phase 1:
     * move authenticated original to rollback.
     */
    fileOperations.rename(
      physical,
      backup,
    );

    try {
      /*
       * Transaction phase 2:
       * install authenticated pending content.
       */
      fileOperations.rename(
        temporary,
        physical,
      );
    }
    catch (error) {
      /*
       * Installation failed after the original
       * moved. Restore the original.
       */
      try {
        fileOperations.rename(
          backup,
          physical,
        );
      }
      catch {
        try {
          fileOperations.remove(
            temporary,
          );
        }
        catch {
          // Best-effort cleanup.
        }

        refuse(
          "replacement failed and rollback restoration failed",
        );
      }

      /*
       * Rollback succeeded.
       * Clean the pending artifact.
       */
      try {
        fileOperations.remove(
          temporary,
        );
      }
      catch {
        // Best-effort cleanup.
      }

      throw error;
    }
  }
  catch (error) {
    if (
      fd !== null
    ) {
      try {
        closeSync(
          fd,
        );
      }
      catch {
        // Best-effort descriptor cleanup.
      }
    }

    try {
      fileOperations.remove(
        temporary,
      );
    }
    catch {
      // Best-effort transaction cleanup.
    }

    throw error;
  }

  /*
   * Independently verify installed bytes.
   */
  const after =
    readFileSync(
      physical,
    );

  const afterDigest =
    digest(
      after,
    );

  if (
    afterDigest !==
      replacementDigest
  ) {
    /*
     * Installed replacement failed
     * authentication. Restore original.
     */
    try {
      fileOperations.remove(
        physical,
      );

      fileOperations.rename(
        backup,
        physical,
      );
    }
    catch {
      try {
        fileOperations.remove(
          temporary,
        );
      }
      catch {
        // Best-effort cleanup.
      }

      refuse(
        "post-write verification failed and rollback failed",
      );
    }

    try {
      fileOperations.remove(
        temporary,
      );
    }
    catch {
      // Best-effort cleanup.
    }

    refuse(
      "post-write digest verification failed; original restored",
    );
  }

  /*
   * Replacement is verified.
   * Rollback copy is no longer required.
   */
  fileOperations.remove(
    backup,
  );

  /*
   * Successful transactions leave no pending
   * artifact.
   */
  fileOperations.remove(
    temporary,
  );

  const canonical =
    JSON.stringify([
      "xvi-bounded-patch-execution-v1",

      repositoryRoot,

      input.proposal.workId,
      input.proposal.missionId,

      input.proposal.proposalDigest,
      input.preflight.preflightDigest,

      proposalFile.path,

      beforeDigest,
      afterDigest,

      preflightFile.replacementByteCount,
    ]);

  const executionDigest =
    digest(
      canonical,
    );

  return Object.freeze({
    version:
      "xvi-bounded-patch-execution-v1" as const,

    repositoryRoot,

    workId:
      input.proposal.workId,

    missionId:
      input.proposal.missionId,

    sourceProposalDigest:
      input.proposal.proposalDigest,

    sourcePreflightDigest:
      input.preflight.preflightDigest,

    path:
      proposalFile.path,

    beforeDigest,
    afterDigest,

    replacementByteCount:
      preflightFile.replacementByteCount,

    filesystemMutationPerformed:
      true as const,

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

    executionDigest,
  });
}