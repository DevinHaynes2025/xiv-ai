import { createHash } from 'node:crypto';

export interface ScenarioBranch {
  scenarioId: string;
  parentMissionId: string;
  hypothesis: string;
  assumptions: string[];
  evidenceRefs: string[];
  status: 'SIMULATION';
}

export interface ScenarioLabResult {
  parentMissionId: string;
  scenarios: ScenarioBranch[];
  scaleTarget: 'BOUNDED_LOCAL' | 'SHARDED_MILLION' | 'SHARDED_BILLION' | 'SHARDED_TRILLION_TARGET';
  actualScenarioCount: number;
}

export function buildParallelScenarios(parentMissionId: string, hypotheses: string[], evidenceRefs: string[] = []): ScenarioLabResult {
  const bounded = hypotheses.slice(0, 32);
  const scenarios = bounded.map((hypothesis, index) => ({
    scenarioId: createHash('sha256').update(`${parentMissionId}:${index}:${hypothesis}`).digest('hex'),
    parentMissionId,
    hypothesis,
    assumptions: [],
    evidenceRefs,
    status: 'SIMULATION' as const,
  }));
  return {
    parentMissionId,
    scenarios,
    scaleTarget: 'SHARDED_TRILLION_TARGET',
    actualScenarioCount: scenarios.length,
  };
}
