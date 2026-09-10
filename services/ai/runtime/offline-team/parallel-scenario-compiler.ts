export interface ScenarioBranch {
  scenarioId: string;
  tenantId: string;
  parentScenarioId?: string;
  seed: number;
  assumptions: readonly string[];
  evidenceRefs: readonly string[];
  simulated: true;
  mayPromoteToFactAutomatically: false;
}

export const PARALLEL_SCENARIO_GUARDRAILS = {
  simulationOnly: true,
  physicalParallelUniverseClaimAllowed: false,
  automaticFactPromotionAllowed: false,
  deterministicReplayRequired: true,
  maxBranchesPerCompile: 32,
} as const;

export function compileParallelScenarios(input: {
  tenantId: string;
  baseScenarioId: string;
  baseSeed: number;
  branches: readonly { label: string; assumptions: readonly string[]; evidenceRefs?: readonly string[] }[];
}): readonly ScenarioBranch[] {
  if (input.branches.length > PARALLEL_SCENARIO_GUARDRAILS.maxBranchesPerCompile) throw new Error('scenario branch cap exceeded');
  return Object.freeze(input.branches.map((branch, index) => Object.freeze({
    scenarioId: `${input.baseScenarioId}:${index + 1}:${branch.label}`,
    tenantId: input.tenantId,
    parentScenarioId: input.baseScenarioId,
    seed: input.baseSeed + index,
    assumptions: Object.freeze([...branch.assumptions]),
    evidenceRefs: Object.freeze([...(branch.evidenceRefs ?? [])]),
    simulated: true,
    mayPromoteToFactAutomatically: false,
  })));
}
