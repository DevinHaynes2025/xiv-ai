import type { XivAgentId } from '../agents';
import type { AgentHealthScore, HealthDimension, MeasuredScore } from './types';

const DIMENSIONS: readonly HealthDimension[] = [
  'availability',
  'policy_compliance',
  'grounding',
  'provenance',
  'latency',
  'tool_reliability',
  'handoff_reliability',
  'outcome_quality',
  'cost_efficiency',
];

export function unmeasuredHealthScore(agentId: XivAgentId | 'unknown'): AgentHealthScore {
  const dimensions = Object.fromEntries(DIMENSIONS.map((key) => [key, 'not_measured' as MeasuredScore])) as Record<
    HealthDimension,
    MeasuredScore
  >;
  return {
    agentId,
    dimensions,
    evidenceCount: 0,
    invented: false,
  };
}

export function scoreDoesNotInventNumbers(score: AgentHealthScore) {
  return score.invented === false && score.evidenceCount === 0
    ? Object.values(score.dimensions).every((value) => value === 'not_measured')
    : true;
}
