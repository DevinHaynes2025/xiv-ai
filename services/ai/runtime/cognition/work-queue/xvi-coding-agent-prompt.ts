import {
  createHash,
} from "node:crypto";

import type {
  XviCodingWorkItem,
} from "./xvi-coding-work-item";

export type XviCodingAgentBackend =
  | "CODEX"
  | "OLLAMA"
  | "LOCAL_MODEL"
  | "HUMAN_ASSISTED";

export interface XviCodingAgentPrompt {
  readonly version:
    "xvi-coding-agent-prompt-v1";

  readonly backend:
    XviCodingAgentBackend;

  readonly workId: string;
  readonly missionId: string;
  readonly workDigest: string;

  readonly systemPrompt: string;
  readonly missionPrompt: string;

  readonly permittedPaths:
    readonly string[];

  readonly permittedTests:
    readonly string[];

  readonly maxAttempts: number;

  readonly promptDigest: string;

  readonly autonomousPlanningAllowed: true;
  readonly autonomousLocalCodingAllowed: true;
  readonly autonomousTestingAllowed: true;
  readonly autonomousRecoveryAllowed: true;

  readonly automaticMergeAllowed: false;
  readonly automaticPushAllowed: false;
  readonly automaticDeployAllowed: false;

  readonly credentialAccessAllowed: false;
  readonly networkAllowed: false;
  readonly productionMutationAllowed: false;

  readonly humanApprovalRequired: true;
}

const BACKENDS =
  new Set<XviCodingAgentBackend>([
    "CODEX",
    "OLLAMA",
    "LOCAL_MODEL",
    "HUMAN_ASSISTED",
  ]);

const refuse = (): never => {
  throw new Error(
    "XVI_CODING_AGENT_PROMPT_REFUSED",
  );
};

export function createXviCodingAgentPrompt(input: {
  readonly backend:
    XviCodingAgentBackend;

  readonly work:
    Readonly<XviCodingWorkItem>;
}): Readonly<XviCodingAgentPrompt> {
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.getPrototypeOf(input) !==
      Object.prototype
  ) {
    refuse();
  }

  const descriptors =
    Object.getOwnPropertyDescriptors(
      input,
    );

  const keys =
    Reflect.ownKeys(input);

  if (
    keys.length !== 2 ||
    !keys.includes("backend") ||
    !keys.includes("work")
  ) {
    refuse();
  }

  for (
    const key of [
      "backend",
      "work",
    ]
  ) {
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

  const backend =
    descriptors.backend.value as
      XviCodingAgentBackend;

  if (
    !BACKENDS.has(backend)
  ) {
    refuse();
  }

  const work =
    descriptors.work.value as
      Readonly<XviCodingWorkItem>;

  if (
    !work ||
    work.version !==
      "xvi-coding-work-item-v1" ||

    work.localWorkOnly !== true ||

    work.automaticMergeAllowed !==
      false ||

    work.automaticPushAllowed !==
      false ||

    work.automaticDeployAllowed !==
      false ||

    work.credentialAccessAllowed !==
      false ||

    work.networkAllowed !==
      false ||

    work.productionMutationAllowed !==
      false ||

    work.humanApprovalRequired !==
      true
  ) {
    refuse();
  }

  const systemPrompt =
    [
      "You are an XVI governed autonomous coding agent.",
      `Backend: ${backend}.`,
      "",
      "Operate autonomously inside the assigned local mission.",
      "Plan, inspect, edit, test, debug, learn from failures, and retry when safe.",
      "",
      "You MUST remain inside the declared permitted paths.",
      "You MUST run only declared test commands.",
      "You MUST preserve unrelated working-tree changes.",
      "You MUST journal important decisions, failures, and evidence.",
      "You MUST stop when the attempt budget is exhausted.",
      "",
      "You do NOT have authority to push, merge, deploy, access credentials, mutate production, or expand your own permissions.",
      "External or irreversible actions require human approval.",
      "",
      "Fail closed when mission identity, repository state, provenance, or authorization cannot be verified.",
    ].join("\n");

  const missionPrompt =
    [
      `XVI WORK ID: ${work.workId}`,
      `MISSION ID: ${work.missionId}`,
      `BASE COMMIT: ${work.baseCommitSha}`,
      `WORK DIGEST: ${work.workDigest}`,
      `PRIORITY: ${work.priority}`,
      `MAX ATTEMPTS: ${work.maxAttempts}`,
      "",
      "PERMITTED PATHS:",
      ...work.permittedPaths.map(
        path => `- ${path}`,
      ),
      "",
      "PERMITTED TESTS:",
      ...work.testCommands.map(
        command => `- ${command}`,
      ),
      "",
      "Complete as much of this bounded mission as possible autonomously.",
      "Do not wait for unnecessary confirmation for reversible local work.",
      "Stop at approval boundaries.",
    ].join("\n");

  const promptDigest =
    createHash("sha256")
      .update(
        JSON.stringify([
          "xvi-coding-agent-prompt-v1",

          backend,

          work.workId,
          work.missionId,
          work.workDigest,

          systemPrompt,
          missionPrompt,
        ]),
      )
      .digest("hex");

  return Object.freeze({
    version:
      "xvi-coding-agent-prompt-v1" as const,

    backend,

    workId:
      work.workId,

    missionId:
      work.missionId,

    workDigest:
      work.workDigest,

    systemPrompt,
    missionPrompt,

    permittedPaths:
      work.permittedPaths,

    permittedTests:
      work.testCommands,

    maxAttempts:
      work.maxAttempts,

    promptDigest,

    autonomousPlanningAllowed:
      true as const,

    autonomousLocalCodingAllowed:
      true as const,

    autonomousTestingAllowed:
      true as const,

    autonomousRecoveryAllowed:
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

    humanApprovalRequired:
      true as const,
  });
}
