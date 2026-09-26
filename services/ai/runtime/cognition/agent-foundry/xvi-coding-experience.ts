export type XviCodingOutcome =
  | "SUCCESS"
  | "FAILURE"
  | "PARTIAL"
  | "BLOCKED";

export type XviCodingExperienceInput = Readonly<{
  experienceId: string;
  missionId: string;
  objective: string;
  outcome: XviCodingOutcome;
  filesExamined: readonly string[];
  filesChanged: readonly string[];
  testsRun: readonly string[];
  lessons: readonly string[];
  failureCause?: string;
  nextStep?: string;
}>;

export type XviCodingExperience = Readonly<{
  experienceId: string;
  missionId: string;
  objective: string;
  outcome: XviCodingOutcome;
  filesExamined: readonly string[];
  filesChanged: readonly string[];
  testsRun: readonly string[];
  lessons: readonly string[];
  failureCause?: string;
  nextStep?: string;

  // Experience is evidence only. It grants no execution authority.
  authority: "NONE";
}>;

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`${field} must be non-empty`);
  }

  return normalized;
}

function normalizeStrings(values: readonly string[]): readonly string[] {
  return Object.freeze(
    [...new Set(values.map((value) => value.trim()).filter(Boolean))]
  );
}

export function recordXviCodingExperience(
  input: XviCodingExperienceInput,
): XviCodingExperience {
  const experience: XviCodingExperience = {
    experienceId: requireNonEmpty(input.experienceId, "experienceId"),
    missionId: requireNonEmpty(input.missionId, "missionId"),
    objective: requireNonEmpty(input.objective, "objective"),
    outcome: input.outcome,
    filesExamined: normalizeStrings(input.filesExamined),
    filesChanged: normalizeStrings(input.filesChanged),
    testsRun: normalizeStrings(input.testsRun),
    lessons: normalizeStrings(input.lessons),
    ...(input.failureCause?.trim()
      ? { failureCause: input.failureCause.trim() }
      : {}),
    ...(input.nextStep?.trim()
      ? { nextStep: input.nextStep.trim() }
      : {}),
    authority: "NONE",
  };

  return Object.freeze(experience);
}
