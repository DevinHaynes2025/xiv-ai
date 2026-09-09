/**
 * 62L-EL7 — Single governed local inference adapter for Windows.
 *
 * Flow: Agent request → Policy check → Local Runtime Adapter →
 *       Verified execution provider → Model inference → Evidence → Result
 *
 * Never auto-downloads models, never auto-installs drivers/runtimes,
 * never bypasses auth/Guardian/RLS/tenant/Universe, never pretends success.
 */

import {
  EL7_DEFAULT_RESOURCE_BUDGET,
  EL7_HONESTY_BANNER,
  EL7_LOCKS,
} from './el7-locks';
import {
  defaultExecutionProviderRegistry,
  selectVerifiedOrCpuFallback,
  type ExecutionProviderId,
  type ExecutionProviderRecord,
} from './execution-providers';
import {
  checkLocalInferencePolicy,
  type LocalInferenceFailureClass,
  type LocalInferencePolicyInput,
} from './inference-policy';
import { evaluateResourceRequest, type ResourceBudget } from './resource-governor';
import type { CapabilityState, ComputeKind, RuntimeHeartbeat, RuntimeMode } from './types';
import { classifyHeartbeat } from './runtime-state';

export type LocalInferenceRequest = {
  taskId: string;
  modelId: string;
  modelVersion?: string;
  tenantId?: string;
  universeScope?: string;
  dataClass?: string;
  preferredDevice?: ComputeKind | 'auto';
  maxMemoryMb?: number;
  timeoutMs?: number;
  concurrentTasks?: number;
  /** Estimated memory for this workload (bytes). Defaults from maxMemoryMb. */
  estimatedMemoryBytes?: number;
  authorizeModelDownload?: boolean;
  authorizeDriverOrRuntimeInstall?: boolean;
  authorized?: boolean;
  authVerified?: boolean;
  guardianAllow?: boolean;
  rlsTenantInScope?: boolean;
  universeBoundaryOk?: boolean;
  /** Optional override registry (tests may inject measured-evidence fixtures). */
  providerRegistry?: ExecutionProviderRecord[];
  resourceBudget?: ResourceBudget;
  /** Optional heartbeat observation for node truth. */
  heartbeat?: { nodeId: string; observedAt?: string | null; running?: boolean | null };
  /**
   * Measured-evidence fixture boundary for EL8 prep / gated tests only.
   * When present with VERIFIED provider + successful bounded fields, inference may succeed.
   * Default unit paths must omit this — VERIFIED skip remains denied.
   */
  measuredEvidenceFixture?: MeasuredInferenceEvidenceFixture | null;
  /** Claimed execution mode from caller — adapter re-labels truthfully. */
  claimedExecutionMode?: RuntimeMode;
};

export type MeasuredInferenceEvidenceFixture = {
  /** Must be true only when a real (or explicit fixture-bounded) model load completed. */
  modelLoadCompleted: boolean;
  /** Must be true only when bounded inference on that provider succeeded. */
  boundedInferenceSucceeded: boolean;
  providerId: ExecutionProviderId;
  providerState: CapabilityState;
  latencyMs: number;
  output?: unknown;
  evidenceNotes?: string[];
};

export type InferenceEvidence = {
  modelId: string;
  modelVersion: string | null;
  executionProvider: ExecutionProviderId | 'none';
  device: ComputeKind | 'none';
  startTime: string;
  endTime: string;
  latencyMs: number | null;
  status: 'OK' | 'UNAVAILABLE' | 'DENIED' | 'REJECTED';
  failureClass: LocalInferenceFailureClass;
  providerState: CapabilityState;
  executionMode: RuntimeMode;
  notes: string[];
  honestyBanner: typeof EL7_HONESTY_BANNER;
  l4AutonomyEnabled: false;
  measuredEvidencePresent: boolean;
};

export type LocalInferenceResponse = {
  provider: ExecutionProviderId | 'none';
  device: ComputeKind | 'none';
  truthState: CapabilityState;
  executionMode: RuntimeMode;
  latencyMs: number | null;
  modelLoaded: boolean;
  output: unknown | null;
  evidence: InferenceEvidence;
  failureClass: LocalInferenceFailureClass;
  status: 'OK' | 'UNAVAILABLE' | 'DENIED' | 'REJECTED';
  heartbeat?: RuntimeHeartbeat;
};

function nowIso() {
  return new Date().toISOString();
}

function mbToBytes(mb: number | undefined): number | undefined {
  if (typeof mb !== 'number' || !Number.isFinite(mb) || mb < 0) return undefined;
  return Math.floor(mb * 1024 * 1024);
}

/**
 * Truthfully label LOCAL / HYBRID / CLOUD.
 * Local adapter never invents successful CLOUD execution; HYBRID only when caller
 * explicitly claims hybrid *and* local path is unavailable (candidate label only).
 */
export function labelExecutionMode(input: {
  localAttempted: boolean;
  localSucceeded: boolean;
  claimed?: RuntimeMode;
}): RuntimeMode {
  if (input.localSucceeded) return 'LOCAL';
  if (input.claimed === 'CLOUD') return 'CLOUD';
  if (input.claimed === 'HYBRID') return 'HYBRID';
  return 'LOCAL';
}

function buildEvidence(partial: Omit<InferenceEvidence, 'honestyBanner' | 'l4AutonomyEnabled'>): InferenceEvidence {
  return {
    ...partial,
    honestyBanner: EL7_HONESTY_BANNER,
    l4AutonomyEnabled: EL7_LOCKS.L4_AUTONOMY_ENABLED,
  };
}

function denyResponse(input: {
  start: string;
  request: LocalInferenceRequest;
  failureClass: LocalInferenceFailureClass;
  status: 'DENIED' | 'REJECTED' | 'UNAVAILABLE';
  reason: string;
  provider?: ExecutionProviderId | 'none';
  device?: ComputeKind | 'none';
  truthState?: CapabilityState;
  executionMode?: RuntimeMode;
  modelLoaded?: boolean;
  heartbeat?: RuntimeHeartbeat;
}): LocalInferenceResponse {
  const end = nowIso();
  const provider = input.provider ?? 'none';
  const device = input.device ?? 'none';
  const truthState = input.truthState ?? 'UNAVAILABLE';
  const executionMode = input.executionMode ?? 'LOCAL';
  const evidence = buildEvidence({
    modelId: input.request.modelId,
    modelVersion: input.request.modelVersion ?? null,
    executionProvider: provider,
    device,
    startTime: input.start,
    endTime: end,
    latencyMs: null,
    status: input.status,
    failureClass: input.failureClass,
    providerState: truthState,
    executionMode,
    notes: [input.reason],
    measuredEvidencePresent: false,
  });

  return {
    provider,
    device,
    truthState,
    executionMode,
    latencyMs: null,
    modelLoaded: input.modelLoaded ?? false,
    output: null,
    evidence,
    failureClass: input.failureClass,
    status: input.status,
    heartbeat: input.heartbeat,
  };
}

/**
 * Governed local inference entry point.
 */
export function runLocalInference(request: LocalInferenceRequest): LocalInferenceResponse {
  const start = nowIso();
  const startMs = Date.now();

  const policyInput: LocalInferencePolicyInput = {
    taskId: request.taskId,
    modelId: request.modelId,
    tenantId: request.tenantId,
    universeScope: request.universeScope,
    dataClass: request.dataClass,
    authorized: request.authorized,
    authVerified: request.authVerified,
    guardianAllow: request.guardianAllow,
    rlsTenantInScope: request.rlsTenantInScope,
    universeBoundaryOk: request.universeBoundaryOk,
    authorizeModelDownload: request.authorizeModelDownload,
    authorizeDriverOrRuntimeInstall: request.authorizeDriverOrRuntimeInstall,
  };

  const policy = checkLocalInferencePolicy(policyInput);
  if (!policy.allowed) {
    return denyResponse({
      start,
      request,
      failureClass: policy.failureClass,
      status: 'DENIED',
      reason: policy.reason,
      truthState: 'UNAVAILABLE',
    });
  }

  // Heartbeat soft check — stale/offline nodes cannot claim WORKING inference.
  let heartbeat: RuntimeHeartbeat | undefined;
  if (request.heartbeat) {
    heartbeat = classifyHeartbeat(request.heartbeat);
    if (heartbeat.state !== 'RUNNING_VERIFIED') {
      return denyResponse({
        start,
        request,
        failureClass: 'PROVIDER_UNAVAILABLE',
        status: 'UNAVAILABLE',
        reason: `Node heartbeat is ${heartbeat.state}; local inference unavailable.`,
        truthState: 'UNAVAILABLE',
        heartbeat,
      });
    }
  }

  const budget = request.resourceBudget ?? {
    maxConcurrentTasks: EL7_DEFAULT_RESOURCE_BUDGET.maxConcurrentTasks,
    maxMemoryBytes:
      mbToBytes(request.maxMemoryMb) ?? EL7_DEFAULT_RESOURCE_BUDGET.maxMemoryBytes,
  };

  const estimatedMemoryBytes =
    request.estimatedMemoryBytes ??
    mbToBytes(request.maxMemoryMb) ??
    512 * 1024 * 1024;

  const gov = evaluateResourceRequest(
    {
      concurrentTasks: request.concurrentTasks ?? 1,
      estimatedMemoryBytes,
    },
    budget,
  );

  if (!gov.allowed) {
    return denyResponse({
      start,
      request,
      failureClass: 'GOVERNOR_REJECTED',
      status: 'REJECTED',
      reason: `Resource governor rejected: ${gov.reasons.join('; ')}`,
      truthState: 'UNAVAILABLE',
      heartbeat,
    });
  }

  const registry = request.providerRegistry ?? defaultExecutionProviderRegistry();
  const preferred = request.preferredDevice ?? 'auto';
  const selection = selectVerifiedOrCpuFallback(registry, preferred);

  // GPU/NPU preferred but NOT_TESTED → CPU fallback selection (already applied),
  // then require measured evidence to actually run. Without it → UNAVAILABLE.
  const fixture = request.measuredEvidenceFixture ?? null;
  const fixtureMatches =
    fixture !== null &&
    fixture.modelLoadCompleted === true &&
    fixture.boundedInferenceSucceeded === true &&
    fixture.providerState === 'VERIFIED' &&
    fixture.providerId === selection.selected.id &&
    selection.selected.state === 'VERIFIED' &&
    selection.selected.measuredEvidencePresent === true;

  if (!fixtureMatches) {
    const notes = [
      selection.reason,
      'Local inference returns UNAVAILABLE rather than pretending success.',
      'GPU/NPU remain NOT_TESTED until real model-load + bounded inference evidence (EL8).',
      ...(selection.selected.evidence ?? []),
    ];
    if (fixture && fixture.providerState === 'VERIFIED' && selection.selected.state !== 'VERIFIED') {
      notes.push('VERIFIED_SKIP_DENIED: fixture claimed VERIFIED without registry measured evidence.');
    }
    if (
      request.providerRegistry?.some(
        (p) => p.state === 'VERIFIED' && p.measuredEvidencePresent !== true,
      )
    ) {
      notes.push('VERIFIED_SKIP_DENIED: VERIFIED without measuredEvidencePresent is rejected.');
    }

    const executionMode = labelExecutionMode({
      localAttempted: true,
      localSucceeded: false,
      claimed: request.claimedExecutionMode,
    });

    const end = nowIso();
    const evidence = buildEvidence({
      modelId: request.modelId,
      modelVersion: request.modelVersion ?? null,
      executionProvider: selection.selected.id,
      device: selection.selected.device,
      startTime: start,
      endTime: end,
      latencyMs: Date.now() - startMs,
      status: 'UNAVAILABLE',
      failureClass: selection.usedVerified ? 'MODEL_NOT_LOADED' : 'NOT_TESTED',
      providerState: selection.selected.state,
      executionMode,
      notes,
      measuredEvidencePresent: false,
    });

    return {
      provider: selection.selected.id,
      device: selection.selected.device,
      truthState: selection.selected.state === 'VERIFIED' ? 'UNAVAILABLE' : selection.selected.state,
      executionMode,
      latencyMs: evidence.latencyMs,
      modelLoaded: false,
      output: null,
      evidence,
      failureClass: evidence.failureClass,
      status: 'UNAVAILABLE',
      heartbeat,
    };
  }

  // Measured-evidence fixture path (explicit boundary only — not default unit PASS).
  const latencyMs = fixture!.latencyMs;
  const executionMode = labelExecutionMode({
    localAttempted: true,
    localSucceeded: true,
    claimed: request.claimedExecutionMode,
  });
  const end = nowIso();
  const evidence = buildEvidence({
    modelId: request.modelId,
    modelVersion: request.modelVersion ?? null,
    executionProvider: selection.selected.id,
    device: selection.selected.device,
    startTime: start,
    endTime: end,
    latencyMs,
    status: 'OK',
    failureClass: null,
    providerState: 'VERIFIED',
    executionMode,
    notes: [
      'Measured evidence fixture boundary satisfied (model load + bounded inference).',
      ...(fixture!.evidenceNotes ?? []),
      selection.reason,
    ],
    measuredEvidencePresent: true,
  });

  return {
    provider: selection.selected.id,
    device: selection.selected.device,
    truthState: 'VERIFIED',
    executionMode,
    latencyMs,
    modelLoaded: true,
    output: fixture!.output ?? { ok: true, taskId: request.taskId },
    evidence,
    failureClass: null,
    status: 'OK',
    heartbeat,
  };
}

export function el7AdapterHonesty() {
  return {
    banner: EL7_HONESTY_BANNER,
    locks: EL7_LOCKS,
    defaultGpuState: 'NOT_TESTED' as const,
    defaultNpuState: 'NOT_TESTED' as const,
    autoDownload: false as const,
    autoInstall: false as const,
    unitTestAutoVerified: false as const,
  };
}
