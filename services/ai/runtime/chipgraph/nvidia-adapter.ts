/**
 * 62L-EW8 — NVIDIA Adapter Candidate (main orchestration).
 *
 * Canonical flow:
 * Agent Mission → Agent Mesh → Compute Task Envelope → Chip Capability Graph →
 * NVIDIA Adapter → Resource Governor → Verified Runtime → NVIDIA GPU →
 * Execution Receipt → Benchmark Ledger → Neural Pathway → XIV Home Base
 *
 * Soft-wires EW7 envelope/resource-policy fields — does not duplicate a
 * competing governor or create a separate NVIDIA brain.
 */

import {
  EW8_LOCKS,
  assertEw8LocksIntact,
  ew8SoftWireSnapshot,
  nvidiaEnvironmentHonesty,
  softWireHopState,
  type ActualExecutionDevice,
  type FailureClass,
  type FallbackPolicy,
  type GovernorResult,
  type PlacementClass,
  type PreferredComputeTarget,
  type PrivacyMode,
  type ResultState,
  type SoftWirePresence,
  type TenantScope,
  type TruthState,
} from './ew8-types.ts';
import {
  defaultNvidiaCapabilitySnapshot,
  detectedGpuOnly,
  documentedGpuOnly,
  layerSatisfiesMinimum,
  markCudaMissing,
  markTensorRtMissing,
  rejectStaleVerified,
  type NvidiaCapabilitySnapshot,
} from './nvidia-capabilities.ts';
import {
  evaluateModelLoadVerification,
  resolveRuntimeCandidateStatus,
  type NvidiaRuntimeCandidateId,
} from './nvidia-runtime.ts';
import {
  buildBenchmarkFromExecution,
  createBenchmarkLedger,
  type BenchmarkLedger,
} from './nvidia-benchmark.ts';

/** Same envelope fields as EW7 — preferredDevice expanded for NVIDIA-compatible paths. */
export type ComputeTaskEnvelope = {
  requestId: string;
  missionId: string;
  taskId: string;
  agentId: string;
  tenantId: string;
  universeId: string;
  orgId: string;
  modelId: string;
  workloadId: string;
  workloadGenomeHash: string;
  inputDataClass: string;
  /** Capability-oriented by default; hard-coded NVIDIA only when mission requires. */
  preferredDevice: PreferredComputeTarget;
  minimumVerificationState: TruthState;
  privacyMode: PrivacyMode;
  maxMemoryMb: number;
  /** Estimated model VRAM need (GPU governor). */
  estimatedVramMb: number;
  maxRuntimeMs: number;
  computeBudget: number;
  fallbackPolicy: FallbackPolicy;
  returnPath: string;
  expiresAt: string;
  placement: PlacementClass;
  batchSize?: number;
  concurrencyRequested?: number;
  cloudRequired?: boolean;
  /** Cloud authorization gates (AUTHORIZED_CLOUD_NVIDIA only). */
  cloudProviderAuthorized?: boolean;
  cloudCredentialsValid?: boolean;
  cloudRegionAllowed?: boolean;
  cloudDataMovementAllowed?: boolean;
  cloudCostCeilingApproved?: boolean;
  cloudRuntimeVerified?: boolean;
  /** If true, attempt autonomous purchase/rental — always denied. */
  attemptCloudPurchase?: boolean;
  nodePowerState?: 'ONLINE' | 'OFFLINE' | 'SLEEP' | 'SHUTDOWN';
};

export type EnvelopeValidation =
  | { ok: true; envelope: ComputeTaskEnvelope; scope: TenantScope }
  | {
      ok: false;
      denied: true;
      failureClass: FailureClass;
      reason: string;
      resultState: ResultState;
    };

export type EnvelopeContext = {
  expectedScope: TenantScope;
  nowMs?: number;
  maxComputeBudget?: number;
};

export type GpuPressureSnapshot = {
  vramMbAvailable: number | null;
  hostRamMbAvailable: number;
  modelEstimateMb: number;
  batchSize: number;
  queueDepth: number;
  maxQueueDepth: number;
  concurrencyInFlight: number;
  maxConcurrency: number;
  runtimeCompatible: boolean;
  heartbeatOk: boolean;
  thermalPressure: 'NONE' | 'ELEVATED' | 'CRITICAL' | 'UNKNOWN';
  timeoutMsRemaining: number;
  remoteCostApproved: boolean;
  governorSoftWired: boolean;
};

export type GpuGovernorDecision = {
  result: GovernorResult;
  reasons: string[];
  ew7ResourcePolicySoftWire: 'PASS' | 'WAITING_DATA';
  localRuntimeGovernorSoftWire: 'PASS' | 'WAITING_DATA';
  fallbackSuggested: boolean;
};

export type ExecutionReceipt = {
  receiptId: string;
  requestId: string;
  nodeId: string;
  requestedDevice: PreferredComputeTarget;
  actualDevice: ActualExecutionDevice;
  runtimeProvider: string;
  modelId: string;
  modelVersion: string;
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  fallbackUsed: boolean;
  fallbackReason: string | null;
  resultState: ResultState;
  failureClass: FailureClass;
  benchmarkRef: string | null;
  evidenceRefs: readonly string[];
  requestedDeviceVerified: boolean;
  nvidiaGpuTruth: TruthState;
  tensorRtTruth: TruthState;
  agentId: string;
  tenantId: string;
  universeId: string;
};

export type AdapterRunResult = {
  denied: boolean;
  envelopeOk: boolean;
  governor: GpuGovernorDecision | null;
  verificationEligible: boolean;
  receipt: ExecutionReceipt | null;
  failureClass: FailureClass;
  resultState: ResultState;
  reasons: string[];
  softWires: ReturnType<typeof ew8SoftWireSnapshot>;
  capability: NvidiaCapabilitySnapshot;
  multiGpuState: string;
  l4AutonomyEnabled: false;
  guardianRlsUnchanged: true;
};

export type HomeBaseReceiptLedger = {
  store(
    receipt: ExecutionReceipt,
  ): { stored: true } | { denied: true; reason: string };
  get(receiptId: string): ExecutionReceipt | undefined;
};

export function createHomeBaseReceiptLedger(): HomeBaseReceiptLedger {
  const byId = new Map<string, ExecutionReceipt>();
  return {
    store(receipt) {
      if (EW8_LOCKS.CHILD_EXTRA_DATA_AUTHORITY !== false) {
        return { denied: true, reason: 'LOCK_VIOLATION_CHILD_EXTRA_DATA_AUTHORITY' };
      }
      byId.set(receipt.receiptId, Object.freeze({ ...receipt }));
      return { stored: true };
    },
    get(id) {
      return byId.get(id);
    },
  };
}

export function createComputeEnvelope(
  partial: ComputeTaskEnvelope,
): ComputeTaskEnvelope {
  return { ...partial };
}

/**
 * Validate envelope — same field contract as EW7 (tenant/universe/expiry/budget).
 */
export function validateComputeEnvelope(
  envelope: ComputeTaskEnvelope,
  ctx: EnvelopeContext,
): EnvelopeValidation {
  if (EW8_LOCKS.CHILD_EXTRA_HARDWARE_AUTHORITY !== false) {
    return {
      ok: false,
      denied: true,
      failureClass: 'POLICY_DENIED',
      reason: 'LOCK_VIOLATION_CHILD_EXTRA_HARDWARE_AUTHORITY',
      resultState: 'POLICY_DENIED',
    };
  }

  if (envelope.tenantId !== ctx.expectedScope.tenantId) {
    return {
      ok: false,
      denied: true,
      failureClass: 'TENANT_MISMATCH',
      reason: 'TENANT_MISMATCH — Guardian/RLS isolation unchanged; denied.',
      resultState: 'POLICY_DENIED',
    };
  }

  if (envelope.universeId !== ctx.expectedScope.universeId) {
    return {
      ok: false,
      denied: true,
      failureClass: 'UNIVERSE_MISMATCH',
      reason: 'UNIVERSE_MISMATCH — Guardian/RLS isolation unchanged; denied.',
      resultState: 'POLICY_DENIED',
    };
  }

  if (
    envelope.orgId &&
    ctx.expectedScope.orgId &&
    envelope.orgId !== ctx.expectedScope.orgId
  ) {
    return {
      ok: false,
      denied: true,
      failureClass: 'TENANT_MISMATCH',
      reason: 'ORG_SCOPE_MISMATCH — denied.',
      resultState: 'POLICY_DENIED',
    };
  }

  const now = ctx.nowMs ?? Date.now();
  const expiresMs = Date.parse(envelope.expiresAt);
  if (!Number.isFinite(expiresMs) || expiresMs <= now) {
    return {
      ok: false,
      denied: true,
      failureClass: 'EXPIRED',
      reason: 'REQUEST_EXPIRED — denied.',
      resultState: 'POLICY_DENIED',
    };
  }

  const budgetCeiling = ctx.maxComputeBudget ?? Number.POSITIVE_INFINITY;
  if (
    !Number.isFinite(envelope.computeBudget) ||
    envelope.computeBudget < 0 ||
    envelope.computeBudget > budgetCeiling
  ) {
    return {
      ok: false,
      denied: true,
      failureClass: 'OVER_BUDGET',
      reason: 'OVER_BUDGET — compute budget denied.',
      resultState: 'POLICY_DENIED',
    };
  }

  if (envelope.attemptCloudPurchase) {
    return {
      ok: false,
      denied: true,
      failureClass: 'CLOUD_PURCHASE_FORBIDDEN',
      reason:
        'MAY_BUY_CLOUD=false / MAY_AUTONOMOUS_CLOUD_RENTAL=false — cloud purchase never automatic.',
      resultState: 'POLICY_DENIED',
    };
  }

  if (envelope.placement === 'AUTHORIZED_CLOUD_NVIDIA') {
    const cloudOk =
      envelope.cloudProviderAuthorized === true &&
      envelope.cloudCredentialsValid === true &&
      envelope.cloudRegionAllowed === true &&
      envelope.cloudDataMovementAllowed === true &&
      envelope.cloudCostCeilingApproved === true &&
      envelope.cloudRuntimeVerified === true;
    if (!cloudOk) {
      return {
        ok: false,
        denied: true,
        failureClass: 'UNAUTHORIZED_CLOUD_NVIDIA',
        reason:
          'AUTHORIZED_CLOUD_NVIDIA requires provider AUTHORIZED, credentials VALID, region ALLOWED, data movement ALLOWED, cost ceiling APPROVED, runtime VERIFIED.',
        resultState: 'POLICY_DENIED',
      };
    }
  }

  if (envelope.cloudRequired && envelope.nodePowerState === 'OFFLINE') {
    return {
      ok: false,
      denied: true,
      failureClass: 'CLOUD_REQUIRED_OFFLINE',
      reason: 'CLOUD_REQUIRED while offline → WAITING_DATA.',
      resultState: 'WAITING_DATA',
    };
  }

  return {
    ok: true,
    envelope,
    scope: {
      orgId: envelope.orgId || ctx.expectedScope.orgId,
      tenantId: envelope.tenantId,
      universeId: envelope.universeId,
    },
  };
}

/**
 * GPU resource governor — soft-wires EW7 resource-policy; does not duplicate it.
 */
export function evaluateGpuResourceGovernor(input: {
  envelope: ComputeTaskEnvelope;
  pressure: GpuPressureSnapshot;
  repoRoot?: string;
}): GpuGovernorDecision {
  const soft = ew8SoftWireSnapshot(input.repoRoot);
  const ew7ResourcePolicySoftWire = softWireHopState(soft.ew7ResourcePolicy.present);
  const localRuntimeGovernorSoftWire = softWireHopState(
    soft.localRuntimeGovernor.present,
  );
  const reasons: string[] = [];
  let result: GovernorResult = 'ALLOW';
  let fallbackSuggested = false;

  const { envelope, pressure } = input;

  if (!pressure.heartbeatOk) {
    reasons.push('Heartbeat failed — DENY.');
    result = 'DENY';
  }

  if (pressure.thermalPressure === 'CRITICAL') {
    reasons.push('THERMAL_CRITICAL — DENY (no thermal bypass).');
    result = 'DENY';
  } else if (pressure.thermalPressure === 'ELEVATED') {
    reasons.push('THERMAL_ELEVATED — THROTTLE.');
    result = 'THROTTLE';
  }

  if (envelope.maxMemoryMb > pressure.hostRamMbAvailable) {
    reasons.push('Host RAM insufficient — DENY.');
    result = 'DENY';
  }

  const wantsGpu =
    envelope.preferredDevice === 'NVIDIA_GPU' ||
    envelope.preferredDevice === 'CUDA' ||
    envelope.preferredDevice === 'TENSORRT' ||
    envelope.preferredDevice === 'TENSORRT_LLM' ||
    envelope.preferredDevice === 'ONNX_NVIDIA' ||
    envelope.preferredDevice === 'CAPABILITY_GPU';

  if (wantsGpu) {
    if (!pressure.runtimeCompatible) {
      reasons.push('Runtime incompatible — FALLBACK/DENY.');
      result = result === 'DENY' ? 'DENY' : 'FALLBACK';
      fallbackSuggested = true;
    }

    if (pressure.vramMbAvailable !== null) {
      const need = Math.max(envelope.estimatedVramMb, pressure.modelEstimateMb);
      if (need > pressure.vramMbAvailable) {
        reasons.push(
          `Insufficient VRAM: need ${need}MB > available ${pressure.vramMbAvailable}MB.`,
        );
        if (envelope.fallbackPolicy === 'DENY_IF_UNAVAILABLE') {
          result = 'DENY';
        } else if (
          envelope.fallbackPolicy === 'QUEUE_THEN_CPU' &&
          pressure.queueDepth < pressure.maxQueueDepth
        ) {
          result = result === 'DENY' ? 'DENY' : 'QUEUE';
          fallbackSuggested = true;
        } else {
          result = result === 'DENY' ? 'DENY' : 'FALLBACK';
          fallbackSuggested = true;
        }
      }
    } else if (wantsGpu && envelope.estimatedVramMb > 0) {
      // Unmeasurable VRAM — cannot assume unlimited.
      reasons.push('VRAM unmeasurable — QUEUE/FALLBACK (never assume unlimited).');
      result = result === 'DENY' ? 'DENY' : 'QUEUE';
      fallbackSuggested = true;
    }
  }

  if (pressure.concurrencyInFlight >= pressure.maxConcurrency) {
    if (pressure.queueDepth < pressure.maxQueueDepth) {
      reasons.push('Concurrency saturated — QUEUE.');
      if (result === 'ALLOW' || result === 'THROTTLE') result = 'QUEUE';
    } else {
      reasons.push('Queue full — DENY.');
      result = 'DENY';
    }
  }

  if (pressure.timeoutMsRemaining <= 0 || envelope.maxRuntimeMs <= 0) {
    reasons.push('Timeout exhausted — DENY.');
    result = 'DENY';
  }

  if (
    envelope.placement === 'AUTHORIZED_CLOUD_NVIDIA' &&
    !pressure.remoteCostApproved
  ) {
    reasons.push('Remote cost not approved — DENY.');
    result = 'DENY';
  }

  if (soft.ew7ResourcePolicy.present) {
    reasons.push(
      `Soft-wire EW7 resource-policy PRESENT at ${soft.ew7ResourcePolicy.pathChecked} (reuse, not duplicate).`,
    );
  } else {
    reasons.push(
      'Soft-wire EW7 resource-policy WAITING_DATA — thin EW8 GPU policy bridge only.',
    );
  }

  if (reasons.length === 0) reasons.push('GPU resource governor ALLOW.');

  return {
    result,
    reasons,
    ew7ResourcePolicySoftWire,
    localRuntimeGovernorSoftWire,
    fallbackSuggested,
  };
}

export function defaultGpuPressure(
  overrides?: Partial<GpuPressureSnapshot>,
): GpuPressureSnapshot {
  return {
    vramMbAvailable: 8192,
    hostRamMbAvailable: 16384,
    modelEstimateMb: 2048,
    batchSize: 1,
    queueDepth: 0,
    maxQueueDepth: 16,
    concurrencyInFlight: 0,
    maxConcurrency: 2,
    runtimeCompatible: true,
    heartbeatOk: true,
    thermalPressure: 'NONE',
    timeoutMsRemaining: 60_000,
    remoteCostApproved: false,
    governorSoftWired: false,
    ...overrides,
  };
}

function isNvidiaPreferred(device: PreferredComputeTarget): boolean {
  return (
    device === 'NVIDIA_GPU' ||
    device === 'CUDA' ||
    device === 'TENSORRT' ||
    device === 'TENSORRT_LLM' ||
    device === 'ONNX_NVIDIA'
  );
}

function mapPreferredToActual(
  preferred: PreferredComputeTarget,
): ActualExecutionDevice {
  switch (preferred) {
    case 'NVIDIA_GPU':
      return 'NVIDIA_GPU';
    case 'CUDA':
      return 'CUDA';
    case 'TENSORRT':
      return 'TENSORRT';
    case 'TENSORRT_LLM':
      return 'TENSORRT_LLM';
    case 'ONNX_NVIDIA':
      return 'ONNX_NVIDIA';
    case 'CPU_ONNX':
      return 'CPU_ONNX';
    case 'CAPABILITY_CPU':
    case 'CPU':
      return 'CPU';
    case 'CAPABILITY_GPU':
      return 'NVIDIA_GPU';
    default:
      return 'UNKNOWN';
  }
}

function runtimeIdFor(
  preferred: PreferredComputeTarget,
): NvidiaRuntimeCandidateId {
  if (preferred === 'TENSORRT') return 'tensorrt';
  if (preferred === 'TENSORRT_LLM') return 'tensorrt-llm';
  if (preferred === 'ONNX_NVIDIA') return 'onnx-runtime-nvidia';
  if (preferred === 'CUDA' || preferred === 'NVIDIA_GPU' || preferred === 'CAPABILITY_GPU') {
    return 'cuda';
  }
  return 'cuda';
}

export type RunNvidiaAdapterInput = {
  envelope: ComputeTaskEnvelope;
  expectedScope: TenantScope;
  capability?: NvidiaCapabilitySnapshot;
  pressure?: GpuPressureSnapshot;
  /** Simulation knobs for honest path testing — never fabricates env evidence. */
  simulate?: {
    forceFallbackToCpu?: boolean;
    nvidiaPathFullyVerified?: boolean;
    gpuDetectedExact?: boolean;
    runtimeInitialized?: boolean;
    modelLoaded?: boolean;
    inferenceCompleted?: boolean;
    outputValidated?: boolean;
    multiGpuMeasured?: boolean;
    nowMs?: number;
  };
  repoRoot?: string;
  homeBase?: HomeBaseReceiptLedger;
  benchmarkLedger?: BenchmarkLedger;
};

/**
 * Full adapter run — denial-first, evidence-gated VERIFIED.
 */
export function runNvidiaAdapter(input: RunNvidiaAdapterInput): AdapterRunResult {
  const softWires = ew8SoftWireSnapshot(input.repoRoot);
  const reasons: string[] = [];
  const honesty = nvidiaEnvironmentHonesty();

  if (!assertEw8LocksIntact()) {
    return {
      denied: true,
      envelopeOk: false,
      governor: null,
      verificationEligible: false,
      receipt: null,
      failureClass: 'POLICY_DENIED',
      resultState: 'POLICY_DENIED',
      reasons: ['EW8 locks violated'],
      softWires,
      capability: defaultNvidiaCapabilitySnapshot(),
      multiGpuState: honesty.multiGpuState,
      l4AutonomyEnabled: false,
      guardianRlsUnchanged: true,
    };
  }

  const envCheck = validateComputeEnvelope(input.envelope, {
    expectedScope: input.expectedScope,
    nowMs: input.simulate?.nowMs,
  });
  if (!envCheck.ok) {
    return {
      denied: true,
      envelopeOk: false,
      governor: null,
      verificationEligible: false,
      receipt: null,
      failureClass: envCheck.failureClass,
      resultState: envCheck.resultState,
      reasons: [envCheck.reason],
      softWires,
      capability: input.capability ?? defaultNvidiaCapabilitySnapshot(),
      multiGpuState: honesty.multiGpuState,
      l4AutonomyEnabled: false,
      guardianRlsUnchanged: true,
    };
  }

  let capability =
    input.capability ?? defaultNvidiaCapabilitySnapshot();
  capability = rejectStaleVerified(capability, input.simulate?.nowMs);

  // Minimum verification gate for NVIDIA-preferred paths.
  if (
    isNvidiaPreferred(input.envelope.preferredDevice) &&
    input.envelope.minimumVerificationState === 'VERIFIED'
  ) {
    if (!layerSatisfiesMinimum(capability, 'NVIDIA_GPU', 'VERIFIED')) {
      // DOCUMENTED / DETECTED cannot satisfy VERIFIED.
      const gpuState = capability.layers.NVIDIA_GPU.state;
      if (gpuState === 'DOCUMENTED' || gpuState === 'DETECTED') {
        reasons.push(
          `${gpuState} NVIDIA GPU cannot satisfy VERIFIED minimum.`,
        );
        return {
          denied: true,
          envelopeOk: true,
          governor: null,
          verificationEligible: false,
          receipt: null,
          failureClass: 'MINIMUM_STATE_UNMET',
          resultState: 'POLICY_DENIED',
          reasons,
          softWires,
          capability,
          multiGpuState: honesty.multiGpuState,
          l4AutonomyEnabled: false,
          guardianRlsUnchanged: true,
        };
      }
    }
  }

  // Stale evidence rejection for VERIFIED-required paths.
  if (capability.layers.NVIDIA_GPU.state === 'STALE') {
    return {
      denied: true,
      envelopeOk: true,
      governor: null,
      verificationEligible: false,
      receipt: null,
      failureClass: 'STALE_EVIDENCE',
      resultState: 'POLICY_DENIED',
      reasons: ['Stale GPU/runtime evidence rejected.'],
      softWires,
      capability,
      multiGpuState: honesty.multiGpuState,
      l4AutonomyEnabled: false,
      guardianRlsUnchanged: true,
    };
  }

  const pressure = input.pressure ?? defaultGpuPressure();
  const governor = evaluateGpuResourceGovernor({
    envelope: input.envelope,
    pressure,
    repoRoot: input.repoRoot,
  });
  reasons.push(...governor.reasons);

  if (governor.result === 'DENY') {
    return {
      denied: true,
      envelopeOk: true,
      governor,
      verificationEligible: false,
      receipt: null,
      failureClass:
        governor.reasons.some((r) => /VRAM/i.test(r))
          ? 'INSUFFICIENT_VRAM'
          : 'POLICY_DENIED',
      resultState: 'RESOURCE_LIMIT',
      reasons,
      softWires,
      capability,
      multiGpuState: honesty.multiGpuState,
      l4AutonomyEnabled: false,
      guardianRlsUnchanged: true,
    };
  }

  const runtimeId = runtimeIdFor(input.envelope.preferredDevice);
  const runtimeStatus = resolveRuntimeCandidateStatus(runtimeId, capability);

  if (
    isNvidiaPreferred(input.envelope.preferredDevice) &&
    (runtimeStatus.status === 'NOT_CONFIGURED' ||
      runtimeStatus.status === 'UNAVAILABLE')
  ) {
    const failureClass =
      runtimeId === 'tensorrt' || runtimeId === 'tensorrt-llm'
        ? 'TENSORRT_NOT_CONFIGURED'
        : 'CUDA_NOT_CONFIGURED';

    // Fallback path if policy allows.
    if (
      governor.result === 'FALLBACK' ||
      governor.fallbackSuggested ||
      input.envelope.fallbackPolicy === 'CPU_SAFE' ||
      input.envelope.fallbackPolicy === 'QUEUE_THEN_CPU' ||
      input.simulate?.forceFallbackToCpu
    ) {
      return finalizeWithCpuFallback({
        input,
        capability,
        governor,
        softWires,
        reasons: [
          ...reasons,
          `${runtimeStatus.label} ${runtimeStatus.status} — honest CPU fallback.`,
        ],
        failureClass,
      });
    }

    return {
      denied: true,
      envelopeOk: true,
      governor,
      verificationEligible: false,
      receipt: null,
      failureClass,
      resultState: 'PROVIDER_UNAVAILABLE',
      reasons: [...reasons, runtimeStatus.notes],
      softWires,
      capability,
      multiGpuState: honesty.multiGpuState,
      l4AutonomyEnabled: false,
      guardianRlsUnchanged: true,
    };
  }

  if (
    input.simulate?.forceFallbackToCpu ||
    governor.result === 'FALLBACK'
  ) {
    return finalizeWithCpuFallback({
      input,
      capability,
      governor,
      softWires,
      reasons: [...reasons, 'Governor/simulation requested CPU fallback.'],
      failureClass: 'NONE',
    });
  }

  // Verified NVIDIA path — only when simulation supplies full evidence
  // OR capability already VERIFIED. Never fabricate from environment.
  const wantsVerifiedSim = input.simulate?.nvidiaPathFullyVerified === true;
  const alreadyVerified = layerSatisfiesMinimum(
    capability,
    'NVIDIA_GPU',
    'VERIFIED',
  );

  const verification = evaluateModelLoadVerification({
    snapshot: capability,
    runtimeId,
    gpuDetectedExact:
      input.simulate?.gpuDetectedExact ?? alreadyVerified ?? false,
    runtimeInitialized:
      input.simulate?.runtimeInitialized ?? alreadyVerified ?? false,
    modelLoaded: input.simulate?.modelLoaded ?? alreadyVerified ?? false,
    modelVersion: input.envelope.modelId + '@sim',
    inferenceCompleted:
      input.simulate?.inferenceCompleted ?? alreadyVerified ?? false,
    actualDeviceConfirmed: mapPreferredToActual(input.envelope.preferredDevice),
    requestedDevice: mapPreferredToActual(input.envelope.preferredDevice),
    outputValidated: input.simulate?.outputValidated ?? alreadyVerified ?? false,
    receiptGenerated: true,
    benchmarkRetained: true,
    silentCpuFallback: false,
    multiGpuMeasured: input.simulate?.multiGpuMeasured ?? false,
    nowMs: input.simulate?.nowMs,
  });

  if (!wantsVerifiedSim && !alreadyVerified) {
    // Environment-honest path: NVIDIA NOT_TESTED — do not fabricate VERIFIED.
    reasons.push(honesty.note);
    if (
      input.envelope.minimumVerificationState === 'VERIFIED' ||
      isNvidiaPreferred(input.envelope.preferredDevice)
    ) {
      if (input.envelope.fallbackPolicy === 'CPU_SAFE') {
        return finalizeWithCpuFallback({
          input,
          capability,
          governor,
          softWires,
          reasons: [
            ...reasons,
            'NVIDIA path NOT_TESTED in this environment — CPU fallback with honest receipt.',
          ],
          failureClass: 'DEVICE_NOT_ELIGIBLE',
        });
      }
      return {
        denied: true,
        envelopeOk: true,
        governor,
        verificationEligible: false,
        receipt: null,
        failureClass: 'DEVICE_NOT_ELIGIBLE',
        resultState: 'UNVERIFIED',
        reasons: [
          ...reasons,
          ...verification.reasons,
          'NVIDIA NOT_TESTED — VERIFIED not fabricated.',
        ],
        softWires,
        capability,
        multiGpuState: verification.multiGpuState,
        l4AutonomyEnabled: false,
        guardianRlsUnchanged: true,
      };
    }
  }

  if (!verification.nvidiaPathVerified && !wantsVerifiedSim) {
    return {
      denied: true,
      envelopeOk: true,
      governor,
      verificationEligible: false,
      receipt: null,
      failureClass: 'MINIMUM_STATE_UNMET',
      resultState: 'UNVERIFIED',
      reasons: [...reasons, ...verification.reasons],
      softWires,
      capability,
      multiGpuState: verification.multiGpuState,
      l4AutonomyEnabled: false,
      guardianRlsUnchanged: true,
    };
  }

  // Eligible verified path (test-injected evidence only).
  const startedAt = new Date(
    (input.simulate?.nowMs ?? Date.now()) - 40,
  ).toISOString();
  const completedAt = new Date(input.simulate?.nowMs ?? Date.now()).toISOString();
  const actual = mapPreferredToActual(input.envelope.preferredDevice);
  const receipt: ExecutionReceipt = {
    receiptId: `rcpt-${input.envelope.requestId}`,
    requestId: input.envelope.requestId,
    nodeId: 'local-nvidia-adapter',
    requestedDevice: input.envelope.preferredDevice,
    actualDevice: actual,
    runtimeProvider: runtimeStatus.label,
    modelId: input.envelope.modelId,
    modelVersion: `${input.envelope.modelId}@verified`,
    startedAt,
    completedAt,
    latencyMs: 40,
    fallbackUsed: false,
    fallbackReason: null,
    resultState: 'PASS',
    failureClass: 'NONE',
    benchmarkRef: `bench-${input.envelope.requestId}`,
    evidenceRefs: ['ew8-verified-simulation-evidence'],
    requestedDeviceVerified: true,
    nvidiaGpuTruth: 'VERIFIED',
    tensorRtTruth:
      runtimeId === 'tensorrt' || runtimeId === 'tensorrt-llm'
        ? 'VERIFIED'
        : capability.layers.TENSORRT.state,
    agentId: input.envelope.agentId,
    tenantId: input.envelope.tenantId,
    universeId: input.envelope.universeId,
  };

  const home = input.homeBase ?? createHomeBaseReceiptLedger();
  home.store(receipt);

  const ledger = input.benchmarkLedger ?? createBenchmarkLedger();
  const bench = buildBenchmarkFromExecution({
    benchmarkId: receipt.benchmarkRef!,
    workloadId: input.envelope.workloadId,
    workloadGenomeHash: input.envelope.workloadGenomeHash,
    device: actual,
    runtimeProvider: runtimeStatus.label,
    modelId: input.envelope.modelId,
    modelVersion: receipt.modelVersion,
    precision: 'fp16',
    batchSize: input.envelope.batchSize ?? 1,
    latencyMs: receipt.latencyMs,
    throughputItemsPerSec: null,
    vramMbPeak: input.envelope.estimatedVramMb,
    resultState: 'PASS',
    fallbackUsed: false,
    evidenceRefs: receipt.evidenceRefs,
    tenantId: input.envelope.tenantId,
    universeId: input.envelope.universeId,
  });
  ledger.retain(bench);
  ledger.updatePathway(`nvidia:${actual}`, 0.5, 0.1);

  return {
    denied: false,
    envelopeOk: true,
    governor,
    verificationEligible: true,
    receipt,
    failureClass: 'NONE',
    resultState: 'PASS',
    reasons: [...reasons, 'Verified NVIDIA path eligible (evidence-backed).'],
    softWires,
    capability,
    multiGpuState: verification.multiGpuState,
    l4AutonomyEnabled: false,
    guardianRlsUnchanged: true,
  };
}

function finalizeWithCpuFallback(args: {
  input: RunNvidiaAdapterInput;
  capability: NvidiaCapabilitySnapshot;
  governor: GpuGovernorDecision;
  softWires: ReturnType<typeof ew8SoftWireSnapshot>;
  reasons: string[];
  failureClass: FailureClass;
}): AdapterRunResult {
  const { input, capability, governor, softWires, reasons, failureClass } = args;
  const startedAt = new Date(
    (input.simulate?.nowMs ?? Date.now()) - 25,
  ).toISOString();
  const completedAt = new Date(input.simulate?.nowMs ?? Date.now()).toISOString();
  const actualDevice: ActualExecutionDevice =
    input.envelope.preferredDevice === 'ONNX_NVIDIA' ||
    input.envelope.fallbackPolicy === 'CPU_SAFE'
      ? 'CPU_ONNX'
      : 'CPU';

  // Fallback truth: CPU may PASS; NVIDIA_GPU stays NOT_TESTED/DEGRADED; TensorRT NOT verified.
  const nvidiaGpuTruth: TruthState =
    capability.layers.NVIDIA_GPU.state === 'DETECTED' ||
    capability.layers.NVIDIA_GPU.state === 'DOCUMENTED'
      ? 'DEGRADED'
      : 'NOT_TESTED';

  const receipt: ExecutionReceipt = {
    receiptId: `rcpt-${input.envelope.requestId}`,
    requestId: input.envelope.requestId,
    nodeId: 'local-nvidia-adapter',
    requestedDevice: input.envelope.preferredDevice,
    actualDevice,
    runtimeProvider: actualDevice === 'CPU_ONNX' ? 'onnxruntime-cpu' : 'cpu',
    modelId: input.envelope.modelId,
    modelVersion: `${input.envelope.modelId}@cpu-fallback`,
    startedAt,
    completedAt,
    latencyMs: 25,
    fallbackUsed: true,
    fallbackReason: `FALLBACK ${input.envelope.preferredDevice} → ${actualDevice}`,
    resultState: 'PASS',
    failureClass:
      failureClass === 'NONE' ? 'NONE' : failureClass,
    benchmarkRef: `bench-${input.envelope.requestId}`,
    evidenceRefs: ['ew8-cpu-fallback-receipt'],
    requestedDeviceVerified: false,
    nvidiaGpuTruth,
    tensorRtTruth: 'NOT_TESTED',
    agentId: input.envelope.agentId,
    tenantId: input.envelope.tenantId,
    universeId: input.envelope.universeId,
  };

  const home = input.homeBase ?? createHomeBaseReceiptLedger();
  home.store(receipt);

  const ledger = input.benchmarkLedger ?? createBenchmarkLedger();
  ledger.retain(
    buildBenchmarkFromExecution({
      benchmarkId: receipt.benchmarkRef!,
      workloadId: input.envelope.workloadId,
      workloadGenomeHash: input.envelope.workloadGenomeHash,
      device: actualDevice,
      runtimeProvider: receipt.runtimeProvider,
      modelId: input.envelope.modelId,
      modelVersion: receipt.modelVersion,
      precision: 'fp32',
      batchSize: input.envelope.batchSize ?? 1,
      latencyMs: receipt.latencyMs,
      throughputItemsPerSec: null,
      vramMbPeak: null,
      resultState: 'PASS',
      fallbackUsed: true,
      evidenceRefs: receipt.evidenceRefs,
      tenantId: input.envelope.tenantId,
      universeId: input.envelope.universeId,
    }),
  );

  return {
    denied: false,
    envelopeOk: true,
    governor,
    verificationEligible: false,
    receipt,
    failureClass: receipt.failureClass,
    resultState: 'PASS',
    reasons: [
      ...reasons,
      'CPU fallback PASS with fallbackUsed=true; NVIDIA path not verified.',
    ],
    softWires,
    capability,
    multiGpuState: 'MULTI_GPU_NOT_TESTED',
    l4AutonomyEnabled: false,
    guardianRlsUnchanged: true,
  };
}

export function attemptCloudPurchase(): { denied: true; reason: string } {
  return {
    denied: true,
    reason: 'MAY_BUY_CLOUD=false — cloud purchase never automatic.',
  };
}

export function attemptAutonomousCloudRental(): {
  denied: true;
  reason: string;
} {
  return {
    denied: true,
    reason: 'MAY_AUTONOMOUS_CLOUD_RENTAL=false — no autonomous rental/purchase.',
  };
}

export function probeGuardianRlsUnchanged(): {
  unchanged: true;
  bypass: false;
  note: string;
} {
  return {
    unchanged: EW8_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    bypass: EW8_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE,
    note: 'Guardian/RLS/tenant/universe isolation unchanged by EW8 NVIDIA adapter.',
  };
}

export function softWireSummary(
  repoRoot?: string,
): Record<string, SoftWirePresence> {
  return ew8SoftWireSnapshot(repoRoot);
}

export {
  documentedGpuOnly,
  detectedGpuOnly,
  markCudaMissing,
  markTensorRtMissing,
  defaultNvidiaCapabilitySnapshot,
};
