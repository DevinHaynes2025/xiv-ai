import {
  createHash,
} from "node:crypto";

export interface XviCodingResumeIntegrityInput {
  readonly missionId: string;

  readonly sourceEnvelopeDigest: string;
  readonly resumePlanDigest: string;
  readonly executionResultDigest: string;
  readonly coordinatorDigest: string;

  readonly expectedBranch: string;
  readonly actualBranch: string;

  readonly expectedHead: string;
  readonly actualHead: string;

  readonly expectedWorktree: string;
  readonly actualWorktree: string;

  readonly missionPaths: readonly string[];

  readonly dirtyBaselineDigest: string;
  readonly dirtyCurrentDigest: string;

  readonly replayNonce: string;

  readonly observedAtMs: number;
}

export interface XviCodingResumeIntegrityReceipt {
  readonly version:
    "xvi-coding-resume-integrity-v1";

  readonly missionId: string;

  readonly sourceEnvelopeDigest: string;
  readonly resumePlanDigest: string;
  readonly executionResultDigest: string;
  readonly coordinatorDigest: string;

  readonly repositoryHead: string;
  readonly branch: string;
  readonly worktree: string;

  readonly missionPaths:
    readonly string[];

  readonly dirtyStateDigest: string;

  readonly replayNonce: string;

  readonly observedAtMs: number;

  readonly integrityDigest: string;

  readonly resumeIntegrityVerified: true;
  readonly localMutationEligible: true;

  readonly remoteWriteAuthority: false;
  readonly deploymentAuthority: false;
  readonly credentialAuthority: false;
  readonly productionAuthority: false;
}

export const XVI_CODING_RESUME_INTEGRITY_POLICY =
  Object.freeze({
    remoteWriteAuthority: false,
    deploymentAuthority: false,
    credentialAuthority: false,
    productionAuthority: false,

    requiresExactHead: true,
    requiresExactBranch: true,
    requiresExactWorktree: true,
    requiresStableDirtyBaseline: true,
    requiresMissionPathBoundary: true,
    requiresReplayNonce: true,
  });

const ID =
  /^[A-Za-z0-9][A-Za-z0-9_.:@/-]{0,127}$/;

const SHA256 =
  /^[a-f0-9]{64}$/;

const GIT_SHA =
  /^[a-f0-9]{40}$/;

const NONCE =
  /^[A-Za-z0-9][A-Za-z0-9_.:@/-]{15,127}$/;

const refuse = (): never => {
  throw new Error(
    "XVI_CODING_RESUME_INTEGRITY_REFUSED",
  );
};

function exactInput(
  value: unknown,
): PropertyDescriptorMap {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !==
      Object.prototype
  ) {
    refuse();
  }

  const expected = [
    "missionId",
    "sourceEnvelopeDigest",
    "resumePlanDigest",
    "executionResultDigest",
    "coordinatorDigest",
    "expectedBranch",
    "actualBranch",
    "expectedHead",
    "actualHead",
    "expectedWorktree",
    "actualWorktree",
    "missionPaths",
    "dirtyBaselineDigest",
    "dirtyCurrentDigest",
    "replayNonce",
    "observedAtMs",
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(value);

  const keys =
    Reflect.ownKeys(value);

  if (
    keys.length !== expected.length ||
    keys.some(
      key =>
        typeof key !== "string" ||
        !expected.includes(
          key as
            (typeof expected)[number],
        ),
    )
  ) {
    refuse();
  }

  for (const key of expected) {
    const descriptor =
      descriptors[key];

    if (
      !descriptor ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      refuse();
    }
  }

  return descriptors;
}

function exactString(
  value: unknown,
  pattern: RegExp,
): string {
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    !pattern.test(value)
  ) {
    refuse();
  }

  return value;
}

function exactWorktree(
  value: unknown,
): string {
  if (
    typeof value !== "string" ||
    value.length < 3 ||
    value.length > 512 ||
    value !== value.trim() ||
    !/^[A-Za-z]:\/[A-Za-z0-9 ._/-]+$/.test(
      value,
    ) ||
    value.includes("..")
  ) {
    refuse();
  }

  return value;
}

function exactPath(
  value: unknown,
): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 512 ||
    value !== value.trim() ||
    value.includes("\\") ||
    value.startsWith("/") ||
    value.includes("..") ||
    !/^[A-Za-z0-9._/-]+$/.test(value)
  ) {
    refuse();
  }

  return value;
}

export function createXviCodingResumeIntegrityReceipt(
  input: XviCodingResumeIntegrityInput,
): Readonly<XviCodingResumeIntegrityReceipt> {
  const d =
    exactInput(input);

  const missionId =
    exactString(
      d.missionId.value,
      ID,
    );

  const sourceEnvelopeDigest =
    exactString(
      d.sourceEnvelopeDigest.value,
      SHA256,
    );

  const resumePlanDigest =
    exactString(
      d.resumePlanDigest.value,
      SHA256,
    );

  const executionResultDigest =
    exactString(
      d.executionResultDigest.value,
      SHA256,
    );

  const coordinatorDigest =
    exactString(
      d.coordinatorDigest.value,
      SHA256,
    );

  const expectedBranch =
    exactString(
      d.expectedBranch.value,
      ID,
    );

  const actualBranch =
    exactString(
      d.actualBranch.value,
      ID,
    );

  if (
    expectedBranch !== actualBranch
  ) {
    refuse();
  }

  const expectedHead =
    exactString(
      d.expectedHead.value,
      GIT_SHA,
    );

  const actualHead =
    exactString(
      d.actualHead.value,
      GIT_SHA,
    );

  if (
    expectedHead !== actualHead
  ) {
    refuse();
  }

  const expectedWorktree =
    exactWorktree(
      d.expectedWorktree.value,
    );

  const actualWorktree =
    exactWorktree(
      d.actualWorktree.value,
    );

  if (
    expectedWorktree !== actualWorktree
  ) {
    refuse();
  }

  const rawPaths =
    d.missionPaths.value;

  if (
    !Array.isArray(rawPaths) ||
    rawPaths.length < 1 ||
    rawPaths.length > 256
  ) {
    refuse();
  }

  const missionPaths =
    rawPaths.map(
      path => exactPath(path),
    );

  if (
    new Set(missionPaths).size !==
      missionPaths.length
  ) {
    refuse();
  }

  /*
   * Canonical ordering prevents the same
   * path set from producing multiple
   * integrity identities.
   */
  const sortedPaths =
    [...missionPaths].sort();

  for (
    let index = 0;
    index < missionPaths.length;
    index += 1
  ) {
    if (
      missionPaths[index] !==
        sortedPaths[index]
    ) {
      refuse();
    }
  }

  const frozenPaths =
    Object.freeze([
      ...missionPaths,
    ]);

  const dirtyBaselineDigest =
    exactString(
      d.dirtyBaselineDigest.value,
      SHA256,
    );

  const dirtyCurrentDigest =
    exactString(
      d.dirtyCurrentDigest.value,
      SHA256,
    );

  /*
   * Existing unrelated dirt is permitted,
   * but it must remain exactly the same.
   */
  if (
    dirtyBaselineDigest !==
      dirtyCurrentDigest
  ) {
    refuse();
  }

  const replayNonce =
    exactString(
      d.replayNonce.value,
      NONCE,
    );

  const observedAtMs =
    d.observedAtMs.value;

  if (
    !Number.isSafeInteger(
      observedAtMs,
    ) ||
    observedAtMs < 0
  ) {
    refuse();
  }

  const canonical =
    JSON.stringify([
      "xvi-coding-resume-integrity-v1",

      missionId,

      sourceEnvelopeDigest,
      resumePlanDigest,
      executionResultDigest,
      coordinatorDigest,

      actualBranch,
      actualHead,
      actualWorktree,

      frozenPaths,

      dirtyCurrentDigest,

      replayNonce,

      observedAtMs,
    ]);

  const integrityDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return Object.freeze({
    version:
      "xvi-coding-resume-integrity-v1" as const,

    missionId,

    sourceEnvelopeDigest,
    resumePlanDigest,
    executionResultDigest,
    coordinatorDigest,

    repositoryHead:
      actualHead,

    branch:
      actualBranch,

    worktree:
      actualWorktree,

    missionPaths:
      frozenPaths,

    dirtyStateDigest:
      dirtyCurrentDigest,

    replayNonce,

    observedAtMs,

    integrityDigest,

    resumeIntegrityVerified:
      true as const,

    localMutationEligible:
      true as const,

    remoteWriteAuthority:
      false as const,

    deploymentAuthority:
      false as const,

    credentialAuthority:
      false as const,

    productionAuthority:
      false as const,
  });
}

