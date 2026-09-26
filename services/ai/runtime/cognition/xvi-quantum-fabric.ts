export const XVI_Q_CORE_IDS = [
  "Q_OPTIMIZATION",
  "Q_ROUTING",
  "Q_SCHEDULING",
  "Q_GRAPHS",
  "Q_SAMPLING",
  "Q_SEARCH",
  "Q_RISK",
  "Q_RESOURCE_ALLOCATION",
  "Q_SIMULATION",
  "Q_PATTERN_RESEARCH",
  "Q_SCIENTIFIC_DISCOVERY",
  "Q_EXPERIMENTAL",
] as const;

export type XviQCoreId =
  typeof XVI_Q_CORE_IDS[number];

export const XVI_Q_BRAIN_ROLES = [
  "PROBLEM_ENCODING",
  "CONSTRAINT_MAPPING",
  "VARIABLE_REDUCTION",
  "ALGORITHM_SELECTION",
  "PARAMETER_SEARCH",
  "SAMPLING",
  "OPTIMIZATION",
  "ERROR_ANALYSIS",
  "NOISE_MODELING",
  "CLASSICAL_BENCHMARK",
  "RESULT_VERIFICATION",
  "EXPERIMENT_MEMORY",
] as const;

export type XviQBrainRole =
  typeof XVI_Q_BRAIN_ROLES[number];

export type XviQuantumExecutionClass =
  | "CLASSICAL"
  | "QUANTUM_INSPIRED"
  | "QUANTUM_SIMULATED"
  | "QPU_VERIFIED";

export type XviQBrain = Readonly<{
  qCoreId: XviQCoreId;
  role: XviQBrainRole;
  authority: "NONE";
}>;

export type XviQCore = Readonly<{
  id: XviQCoreId;
  brains: readonly XviQBrain[];

  // Logical architecture only.
  hardwareState: "NOT_VERIFIED";

  authority: "NONE";
}>;

function createQCore(id: XviQCoreId): XviQCore {
  const brains = XVI_Q_BRAIN_ROLES.map(
    (role): XviQBrain =>
      Object.freeze({
        qCoreId: id,
        role,
        authority: "NONE",
      }),
  );

  return Object.freeze({
    id,
    brains: Object.freeze(brains),
    hardwareState: "NOT_VERIFIED",
    authority: "NONE",
  });
}

export const XVI_Q_CORE_REGISTRY: readonly XviQCore[] =
  Object.freeze(XVI_Q_CORE_IDS.map(createQCore));

export function countXviQBrains(): number {
  return XVI_Q_CORE_REGISTRY.reduce(
    (total, core) => total + core.brains.length,
    0,
  );
}

export function getXviQCore(
  id: XviQCoreId,
): XviQCore {
  const core = XVI_Q_CORE_REGISTRY.find(
    (candidate) => candidate.id === id,
  );

  if (!core) {
    throw new Error(`unknown XVI Q-Core: ${id}`);
  }

  return core;
}

export function canClaimVerifiedQpuExecution(
  executionClass: XviQuantumExecutionClass,
  hardwareVerified: boolean,
): boolean {
  return (
    executionClass === "QPU_VERIFIED" &&
    hardwareVerified === true
  );
}
