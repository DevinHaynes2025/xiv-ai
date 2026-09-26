import {
  createHash,
} from "node:crypto";

export type XviCodingWorkPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export interface XviCodingWorkItemInput {
  readonly workId: string;
  readonly missionId: string;

  readonly baseCommitSha: string;

  readonly permittedPaths:
    readonly string[];

  readonly testCommands:
    readonly string[];

  readonly priority:
    XviCodingWorkPriority;

  readonly maxAttempts: number;

  readonly createdAtMs: number;
}

export interface XviCodingWorkItem {
  readonly version:
    "xvi-coding-work-item-v1";

  readonly workId: string;
  readonly missionId: string;

  readonly baseCommitSha: string;

  readonly permittedPaths:
    readonly string[];

  readonly testCommands:
    readonly string[];

  readonly priority:
    XviCodingWorkPriority;

  readonly maxAttempts: number;

  readonly createdAtMs: number;

  readonly workDigest: string;

  readonly localWorkOnly: true;

  readonly automaticMergeAllowed: false;
  readonly automaticPushAllowed: false;
  readonly automaticDeployAllowed: false;

  readonly credentialAccessAllowed: false;
  readonly networkAllowed: false;
  readonly productionMutationAllowed: false;
  readonly arbitraryCommandExecutionAllowed: false;

  readonly humanApprovalRequired: true;
}

export const XVI_CODING_WORK_ITEM_POLICY =
  Object.freeze({
    localWorkOnly: true,

    maximumAttempts: 8,
    maximumPaths: 128,
    maximumTests: 64,

    automaticMergeAllowed: false,
    automaticPushAllowed: false,
    automaticDeployAllowed: false,

    credentialAccessAllowed: false,
    networkAllowed: false,
    productionMutationAllowed: false,
    arbitraryCommandExecutionAllowed: false,

    humanApprovalRequired: true,
  });

const ID =
  /^[A-Za-z0-9][A-Za-z0-9_.:@/-]{0,127}$/;

const SHA =
  /^[a-f0-9]{40}$/;

const PRIORITIES =
  new Set<XviCodingWorkPriority>([
    "LOW",
    "NORMAL",
    "HIGH",
    "CRITICAL",
  ]);

const refuse = (): never => {
  throw new Error(
    "XVI_CODING_WORK_ITEM_REFUSED",
  );
};

function boundedPath(
  value: unknown,
): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 512 ||
    value !== value.trim() ||
    value.startsWith("/") ||
    value.includes("\\") ||
    value.includes("..") ||
    !/^[A-Za-z0-9._/-]+$/.test(value)
  ) {
    refuse();
  }

  return value;
}

export function createXviCodingWorkItem(
  input: XviCodingWorkItemInput,
): Readonly<XviCodingWorkItem> {
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !==
      Object.prototype
  ) {
    refuse();
  }

  const expected = [
    "workId",
    "missionId",
    "baseCommitSha",
    "permittedPaths",
    "testCommands",
    "priority",
    "maxAttempts",
    "createdAtMs",
  ] as const;

  const descriptors =
    Object.getOwnPropertyDescriptors(
      input,
    );

  const keys =
    Reflect.ownKeys(input);

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

  const workId =
    descriptors.workId.value;

  const missionId =
    descriptors.missionId.value;

  const baseCommitSha =
    descriptors.baseCommitSha.value;

  if (
    typeof workId !== "string" ||
    !ID.test(workId) ||
    typeof missionId !== "string" ||
    !ID.test(missionId) ||
    typeof baseCommitSha !== "string" ||
    !SHA.test(baseCommitSha)
  ) {
    refuse();
  }

  const rawPaths =
    descriptors.permittedPaths.value;

  if (
    !Array.isArray(rawPaths) ||
    rawPaths.length < 1 ||
    rawPaths.length >
      XVI_CODING_WORK_ITEM_POLICY.maximumPaths
  ) {
    refuse();
  }

  const permittedPaths =
    rawPaths.map(
      path =>
        boundedPath(path),
    );

  if (
    new Set(permittedPaths).size !==
      permittedPaths.length
  ) {
    refuse();
  }

  const canonicalPaths =
    [...permittedPaths].sort();

  if (
    canonicalPaths.some(
      (path, index) =>
        path !== permittedPaths[index],
    )
  ) {
    refuse();
  }

  const rawTests =
    descriptors.testCommands.value;

  if (
    !Array.isArray(rawTests) ||
    rawTests.length < 1 ||
    rawTests.length >
      XVI_CODING_WORK_ITEM_POLICY.maximumTests
  ) {
    refuse();
  }

  const testCommands =
    rawTests.map(
      command => {
        if (
          typeof command !== "string" ||
          command.length < 1 ||
          command.length > 256 ||
          command !== command.trim()
        ) {
          refuse();
        }

        return command;
      },
    );

  if (
    new Set(testCommands).size !==
      testCommands.length
  ) {
    refuse();
  }

  const priority =
    descriptors.priority.value as
      XviCodingWorkPriority;

  if (
    !PRIORITIES.has(priority)
  ) {
    refuse();
  }

  const maxAttempts =
    descriptors.maxAttempts.value;

  if (
    !Number.isSafeInteger(maxAttempts) ||
    maxAttempts < 1 ||
    maxAttempts >
      XVI_CODING_WORK_ITEM_POLICY.maximumAttempts
  ) {
    refuse();
  }

  const createdAtMs =
    descriptors.createdAtMs.value;

  if (
    !Number.isSafeInteger(createdAtMs) ||
    createdAtMs <= 0
  ) {
    refuse();
  }

  const frozenPaths =
    Object.freeze([
      ...permittedPaths,
    ]);

  const frozenTests =
    Object.freeze([
      ...testCommands,
    ]);

  const canonical =
    JSON.stringify([
      "xvi-coding-work-item-v1",

      workId,
      missionId,
      baseCommitSha,

      frozenPaths,
      frozenTests,

      priority,
      maxAttempts,
      createdAtMs,
    ]);

  const workDigest =
    createHash("sha256")
      .update(canonical)
      .digest("hex");

  return Object.freeze({
    version:
      "xvi-coding-work-item-v1" as const,

    workId,
    missionId,

    baseCommitSha,

    permittedPaths:
      frozenPaths,

    testCommands:
      frozenTests,

    priority,
    maxAttempts,
    createdAtMs,

    workDigest,

    localWorkOnly:
      true as const,

    automaticMergeAllowed:
      false as const,

    automaticPushAllowed:
      false as const,

    automaticDeployAllowed:
      false as const,

    credentialAccessAllowed:
      false as const,

    networkAllowed:
      false as const,

    productionMutationAllowed:
      false as const,

    arbitraryCommandExecutionAllowed:
      false as const,

    humanApprovalRequired:
      true as const,
  });
}
