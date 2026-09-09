/**
 * Performance memory + computational degradation (not human fatigue).
 * Then: CHECKPOINT → DEBRIEF → RELEASE → NEW WORKER → RESUME
 */

import type { ComputationalDegradation, PerformanceMemory } from './types';

export function recordPerformance(input: {
  agentDirectoryId: string;
  taskClass: string;
  success?: number;
  failure?: number;
  accuracy?: number;
  groundedness?: number;
  toolSuccess?: number;
  securityCompliance?: number;
  latencyMs?: number;
  cost?: number;
  humanCorrections?: number;
  outcomeQuality?: number;
}): PerformanceMemory {
  return {
    agentDirectoryId: input.agentDirectoryId,
    taskClass: input.taskClass,
    success: input.success ?? 0,
    failure: input.failure ?? 0,
    accuracy: input.accuracy ?? 0,
    groundedness: input.groundedness ?? 0,
    toolSuccess: input.toolSuccess ?? 0,
    securityCompliance: input.securityCompliance ?? 1,
    latencyMs: input.latencyMs ?? 0,
    cost: input.cost ?? 0,
    humanCorrections: input.humanCorrections ?? 0,
    outcomeQuality: input.outcomeQuality ?? 0,
  };
}

export function routingShouldUseMeasuredResults(): true {
  return true;
}

export function assessDegradation(input: {
  agentDirectoryId: string;
  contextSaturation: number;
  errorRate: number;
  latencyMs: number;
  resourcePressure: number;
  toolFailures: number;
  modelDegradation: number;
  excessiveRetries: number;
}): ComputationalDegradation {
  return {
    agentDirectoryId: input.agentDirectoryId,
    contextSaturation: input.contextSaturation,
    errorRate: input.errorRate,
    latencyMs: input.latencyMs,
    resourcePressure: input.resourcePressure,
    toolFailures: input.toolFailures,
    modelDegradation: input.modelDegradation,
    excessiveRetries: input.excessiveRetries,
    humanFatigueModel: false,
  };
}

export function usesHumanFatigueModel(_d: ComputationalDegradation): false {
  return false;
}

export function shouldReplaceWorker(d: ComputationalDegradation): boolean {
  return (
    d.contextSaturation >= 0.85 ||
    d.errorRate >= 0.4 ||
    d.resourcePressure >= 0.9 ||
    d.excessiveRetries >= 5 ||
    d.modelDegradation >= 0.7
  );
}

export function degradationRecoverySteps(): readonly string[] {
  return ['CHECKPOINT', 'DEBRIEF', 'RELEASE', 'NEW_WORKER', 'RESUME'];
}
