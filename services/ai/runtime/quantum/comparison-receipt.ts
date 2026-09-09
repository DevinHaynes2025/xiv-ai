/**
 * 62L-EX10 — BenchmarkComparisonReceipt builder.
 */

import type { ComparabilityGateResult } from './comparability.ts';
import { normalizePair } from './benchmark-normalizer.ts';
import type {
  BenchmarkComparisonRequest,
  ExperimentSide,
  NormalizedMetrics,
} from './types.ts';

export type BenchmarkComparisonReceipt = {
  receiptId: string;
  comparisonId: string;
  tenantId: string;
  universeId: string;
  baselineReceiptId: string;
  candidateReceiptId: string;
  state: ComparabilityGateResult['state'];
  winnerState: ComparabilityGateResult['winnerState'];
  objectiveWinners: ComparabilityGateResult['objectiveWinners'];
  matchFlags: ComparabilityGateResult['matchFlags'];
  differenceClasses: ComparabilityGateResult['differenceClasses'];
  reasons: string[];
  normalizedMetrics: {
    baseline: NormalizedMetrics;
    candidate: NormalizedMetrics;
  };
  confidence: number;
  highConfidenceWinner: boolean;
  preciseCostComparison: boolean;
  preciseEnergyComparison: boolean;
  neuralUpdate: ComparabilityGateResult['neuralUpdate'];
  pathway: readonly string[];
  honesty: string;
  createdAt: string;
  expiresAt: string | null;
};

export function buildBenchmarkComparisonReceipt(input: {
  receiptId: string;
  request: BenchmarkComparisonRequest;
  baseline: ExperimentSide;
  candidate: ExperimentSide;
  gate: ComparabilityGateResult;
  pathway: readonly string[];
  honesty: string;
}): BenchmarkComparisonReceipt {
  const normalized = normalizePair(input.baseline, input.candidate);
  return {
    receiptId: input.receiptId,
    comparisonId: input.request.comparisonId,
    tenantId: input.request.tenantId,
    universeId: input.request.universeId,
    baselineReceiptId: input.request.baselineReceiptId,
    candidateReceiptId: input.request.candidateReceiptId,
    state: input.gate.state,
    winnerState: input.gate.winnerState,
    objectiveWinners: input.gate.objectiveWinners,
    matchFlags: input.gate.matchFlags,
    differenceClasses: input.gate.differenceClasses,
    reasons: input.gate.reasons,
    normalizedMetrics: {
      baseline: normalized.baseline.metrics,
      candidate: normalized.candidate.metrics,
    },
    confidence: input.gate.confidence,
    highConfidenceWinner: input.gate.highConfidenceWinner,
    preciseCostComparison: input.gate.preciseCostComparison,
    preciseEnergyComparison: input.gate.preciseEnergyComparison,
    neuralUpdate: input.gate.neuralUpdate,
    pathway: input.pathway,
    honesty: input.honesty,
    createdAt: input.gate.createdAt,
    expiresAt: input.request.expiresAt,
  };
}

export function requestFromSides(
  comparisonId: string,
  baseline: ExperimentSide,
  candidate: ExperimentSide,
  actorTenantId: string,
  actorUniverseId: string,
  extras?: Partial<BenchmarkComparisonRequest>,
): BenchmarkComparisonRequest {
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  return {
    comparisonId,
    missionId: baseline.missionId,
    taskId: baseline.taskId,
    tenantId: actorTenantId,
    universeId: actorUniverseId,
    baselineReceiptId: baseline.receiptId,
    candidateReceiptId: candidate.receiptId,
    problemClass: baseline.problemClass,
    problemVersion: baseline.problemVersion,
    problemSize: baseline.problemSize,
    inputHash: baseline.inputHash,
    datasetVersion: baseline.datasetVersion,
    datasetSize: baseline.datasetSize,
    baselineAlgorithmId: baseline.algorithmId,
    candidateAlgorithmId: candidate.algorithmId,
    baselineExecutionClass: baseline.executionClass,
    candidateExecutionClass: candidate.executionClass,
    baselineDevice: baseline.hardware,
    candidateDevice: candidate.hardware,
    baselineRuntime: {
      runtimeId: baseline.hardware.runtimeId,
      runtimeVersion: baseline.hardware.runtimeVersion,
    },
    candidateRuntime: {
      runtimeId: candidate.hardware.runtimeId,
      runtimeVersion: candidate.hardware.runtimeVersion,
    },
    precision: baseline.precision,
    tolerance: baseline.tolerance,
    seeds: { baseline: baseline.seed, candidate: candidate.seed },
    batchSizes: { baseline: baseline.batchSize, candidate: candidate.batchSize },
    successCriteria: baseline.successCriteria,
    qualityMetricSchema: baseline.qualityMetricSchema,
    runtimeAccountingMethod: baseline.timingScope,
    costAccountingMethod: baseline.costMethod,
    energyAccountingMethod: baseline.energyMethod,
    createdAt: now,
    expiresAt: expires,
    actorTenantId,
    actorUniverseId,
    ...extras,
  };
}
