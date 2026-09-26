import {
  recordXviCodingExperience,
  type XviCodingExperience,
  type XviCodingOutcome,
} from "./xvi-coding-experience";

export type XviWorkLoopMode =
  | "OBSERVE"
  | "ADVISE"
  | "DRAFT";

export type XviWorkItem = Readonly<{
  workItemId: string;
  missionId: string;
  objective: string;
  mode: XviWorkLoopMode;
  filesAllowed: readonly string[];
  maxSteps: number;
}>;

export type XviWorkStepResult = Readonly<{
  outcome: XviCodingOutcome;
  filesExamined?: readonly string[];
  filesChanged?: readonly string[];
  testsRun?: readonly string[];
  lessons?: readonly string[];
  failureCause?: string;
  nextStep?: string;
}>;

export type XviWorkExecutor = (
  workItem: XviWorkItem,
) => Promise<XviWorkStepResult>;

export type XviWorkLoopReceipt = Readonly<{
  workItemId: string;
  missionId: string;
  mode: XviWorkLoopMode;
  experience: XviCodingExperience;

  // A work-loop receipt records what happened.
  // It is never execution or approval authority.
  authority: "NONE";
}>;

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${field} must be non-empty`);
  }

  return normalized;
}

function validateWorkItem(workItem: XviWorkItem): XviWorkItem {
  if (!Number.isSafeInteger(workItem.maxSteps) || workItem.maxSteps < 1) {
    throw new Error("maxSteps must be a positive safe integer");
  }

  return Object.freeze({
    ...workItem,
    workItemId: requireNonEmpty(workItem.workItemId, "workItemId"),
    missionId: requireNonEmpty(workItem.missionId, "missionId"),
    objective: requireNonEmpty(workItem.objective, "objective"),
    filesAllowed: Object.freeze(
      [...new Set(workItem.filesAllowed.map((path) => path.trim()).filter(Boolean))]
    ),
  });
}

function assertChangedFilesAllowed(
  changed: readonly string[],
  allowed: readonly string[],
): void {
  const allowedSet = new Set(allowed);

  for (const path of changed) {
    if (!allowedSet.has(path)) {
      throw new Error(`work loop attempted change outside allowed scope: ${path}`);
    }
  }
}

export async function runXviAutonomousWorkLoop(
  input: XviWorkItem,
  executor: XviWorkExecutor,
): Promise<XviWorkLoopReceipt> {
  const workItem = validateWorkItem(input);

  // OBSERVE and ADVISE are read-only modes.
  if (
    (workItem.mode === "OBSERVE" || workItem.mode === "ADVISE") &&
    workItem.filesAllowed.length > 0
  ) {
    throw new Error(`${workItem.mode} mode cannot authorize file changes`);
  }

  const result = await executor(workItem);

  const changed = result.filesChanged ?? [];

  if (workItem.mode !== "DRAFT" && changed.length > 0) {
    throw new Error(`${workItem.mode} mode produced file changes`);
  }

  assertChangedFilesAllowed(changed, workItem.filesAllowed);

  const experience = recordXviCodingExperience({
    experienceId: `EXP-${workItem.workItemId}`,
    missionId: workItem.missionId,
    objective: workItem.objective,
    outcome: result.outcome,
    filesExamined: result.filesExamined ?? [],
    filesChanged: changed,
    testsRun: result.testsRun ?? [],
    lessons: result.lessons ?? [],
    failureCause: result.failureCause,
    nextStep: result.nextStep,
  });

  return Object.freeze({
    workItemId: workItem.workItemId,
    missionId: workItem.missionId,
    mode: workItem.mode,
    experience,
    authority: "NONE",
  });
}
