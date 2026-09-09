/**
 * 62L-EX17 — receipts, hybrid benchmarks, evidence, learning feedback.
 * Learning cannot modify permissions. Failed routes create evidence.
 */

import type {
  BottleneckClass,
  ComputeEvidence,
  ComputeStageRequest,
  FeedbackKind,
  FeedbackOutcome,
  HybridBenchmark,
  LearningUpdate,
  StageReceipt,
  TimingBreakdown,
} from './types.ts';

export function createStageReceipt(input: {
  request: ComputeStageRequest;
  status: StageReceipt['status'];
  actualDevice: StageReceipt['actualDevice'];
  fallbackUsed: boolean;
  fallbackReason: string | null;
  acceleratorVerified: false | true;
  decision: StageReceipt['decision'];
  note: string;
  nowIso: string;
}): StageReceipt {
  return {
    receiptId: `rcpt-${input.request.requestId}-${input.request.stage}`,
    requestId: input.request.requestId,
    stage: input.request.stage,
    status: input.status,
    requestedDevice: input.request.requestedDevice,
    actualDevice: input.actualDevice,
    fallbackUsed: input.fallbackUsed,
    fallbackReason: input.fallbackReason,
    acceleratorVerified: input.acceleratorVerified,
    decision: input.decision,
    note: input.note,
    createdAt: input.nowIso,
  };
}

export function createFailedRouteEvidence(
  request: ComputeStageRequest,
  note: string,
  nowIso: string,
): ComputeEvidence {
  return {
    evidenceId: `ev-fail-${request.requestId}`,
    requestId: request.requestId,
    kind: 'ROUTE_FAILURE',
    note,
    measured: true,
    createdAt: nowIso,
  };
}

export function createHybridBenchmark(input: {
  request: ComputeStageRequest;
  preprocessingMs: number;
  executionMs: number;
  postprocessingMs: number;
  queueMs?: number;
  networkMs?: number;
  bottleneck: BottleneckClass;
  feedbackKind: FeedbackKind;
  outcome?: FeedbackOutcome | null;
}): HybridBenchmark {
  const queueMs = input.queueMs ?? 0;
  const networkMs = input.networkMs ?? 0;
  const timing: TimingBreakdown = {
    preprocessingMs: input.preprocessingMs,
    executionMs: input.executionMs,
    postprocessingMs: input.postprocessingMs,
    queueMs,
    networkMs,
    totalMs:
      input.preprocessingMs +
      input.executionMs +
      input.postprocessingMs +
      queueMs +
      networkMs,
  };
  return {
    benchmarkId: `bench-${input.request.requestId}`,
    requestId: input.request.requestId,
    timing,
    bottleneck: input.bottleneck,
    feedbackKind: input.feedbackKind,
    outcome: input.outcome ?? null,
  };
}

export function applyLearningFeedback(input: {
  request: ComputeStageRequest;
  outcome: FeedbackOutcome;
  note: string;
}): LearningUpdate {
  // Explicit lock: learning never modifies permissions.
  return {
    updateId: `learn-${input.request.requestId}`,
    requestId: input.request.requestId,
    outcome: input.outcome,
    permissionsModified: false,
    note: input.note,
  };
}

export function classifyBottleneckFeedback(
  kind: FeedbackKind,
  measuredBottleneck: BottleneckClass | null,
  hypothesized: BottleneckClass,
): { kind: FeedbackKind; bottleneck: BottleneckClass; outcome: FeedbackOutcome } {
  if (kind === 'HYPOTHESIS') {
    return {
      kind: 'HYPOTHESIS',
      bottleneck: hypothesized,
      outcome: 'RETEST_REQUIRED',
    };
  }
  if (!measuredBottleneck) {
    return {
      kind: 'MEASURED',
      bottleneck: 'UNKNOWN',
      outcome: 'RETEST_REQUIRED',
    };
  }
  if (measuredBottleneck === hypothesized) {
    return {
      kind: 'MEASURED',
      bottleneck: measuredBottleneck,
      outcome: 'STRENGTHEN',
    };
  }
  return {
    kind: 'MEASURED',
    bottleneck: measuredBottleneck,
    outcome: 'REGRESSED',
  };
}
