/**
 * 62L-EM5 — AMD Windows ML Adapter Path
 *
 * Flow:
 * Agent Compute Envelope → Policy Gate → Universal Compute Registry →
 * AMD Windows ML Adapter → Actual Execution Provider → Return Receipt → XIV Home Base
 *
 * CPU is the safe default. AMD GPU/NPU used only when provider state is VERIFIED
 * after bounded local inference succeeds on that exact execution provider.
 * DETECTED or SUPPORTED ≠ verified inference hardware.
 * Silent fallback to CPU is recorded explicitly (EL8 soft-wire).
 */

import type { CapabilityState, ComputeKind } from './types';
import {
  EM5_CORE_FLOW,
  EM5_HONESTY_BANNER,
  EM5_LOCKS,
  EM5_NOT_TESTED_CLAIMS,
} from './em5-honesty';
import { probeEm5SoftWires, type Em5SoftWireProbe } from './em5-soft-wire';
import { evaluateOnnxWindowsMlAdapter } from './onnx-windows-ml-adapter';
import {
  checkLocalInferencePolicy,
  type LocalInferenceFailureClass,
} from './inference-policy';
import { evaluateResourceRequest, type ResourceBudget } from './resource-governor';
import {
  defaultExecutionProviderRegistry,
  type ExecutionProviderId,
  type ExecutionProviderRecord,
} from './execution-providers';
import { createEmptyEvidence, detectSilentFallback } from './model-load-evidence';

export type AmdEpKind = 'cpu' | 'amd-gpu' | 'amd-npu' | 'windows-ml' | 'onnx-runtime';

export type FallbackPolicy = {
  /** Always allow CPU as safe default. */
  allowCpuFallback: true;
  /** Accelerator failure may fall back to CPU only when policy permits. */
  allowAcceleratorFailToCpu: boolean;
  /** Never silently claim accelerator VERIFIED after CPU fallback. */
  silentFallbackVerifiesAccelerator: false;
  /** Cloud escalation never automatic. */
  allowCloudEscalation: false;
};

export type AdapterResourceLimits = {
  maxMemoryMb: number;
  maxConcurrency: number;
  maxRuntimeMs: number;
};

export type BenchmarkEvidenceRecord = {
  evidenceId: string;
  providerId: AmdEpKind;
  latencyMs: number;
  recordedAt: string;
  modelId: string;
  modelVersionOrHash: string;
  notes: string[];
};

/**
 * Adapter tracking fields required by EM5 contract.
 */
export type AmdWindowsMlAdapterRecord = {
  adapterId: string;
  runtimeVersion: string;
  windowsMlState: CapabilityState;
  onnxRuntimeState: CapabilityState;
  deviceId: string;
  cpuState: CapabilityState;
  gpuState: CapabilityState;
  npuState: CapabilityState;
  supportedModels: string[];
  lastVerifiedAt: string | null;
  benchmarkEvidence: BenchmarkEvidenceRecord[];
  fallbackPolicy: FallbackPolicy;
  resourceLimits: AdapterResourceLimits;
};

export type Em5EnvelopeRequest = {
  requestId: string;
  agentId: string;
  homeUniverseId: string;
  tenantId: string;
  purpose: string;
  modelId: string;
  modelVersionOrHash?: string;
  requestedDevice: ComputeKind | 'auto';
  /** Models declared compatible with this request. */
  compatibleProviders?: AmdEpKind[];
  maxRuntimeMs?: number;
  maxMemoryMb?: number;
  maxConcurrency?: number;
  expiry?: string;
  returnPath?: string;
  /** Policy soft-wire signals (EL7). */
  authorized?: boolean;
  authVerified?: boolean;
  guardianAllow?: boolean;
  rlsTenantInScope?: boolean;
  universeBoundaryOk?: boolean;
  authorizeModelDownload?: boolean;
  authorizeDriverOrRuntimeInstall?: boolean;
  authorizeCloudEscalation?: boolean;
  authorizeBiosOrOverclock?: boolean;
  authorizePrivilegeEscalation?: boolean;
  authorizeHiddenPersistence?: boolean;
};

/**
 * Fixture boundary for unit tests — never invents live ASUS verification.
 * VERIFIED graduation requires exact EP match + bounded inference success.
 */
export type Em5MeasuredInferenceFixture = {
  providerId: AmdEpKind;
  providerState: CapabilityState;
  boundedInferenceSucceeded: boolean;
  modelLoadCompleted: boolean;
  latencyMs: number;
  modelVersionOrHash: string;
  output?: unknown;
  resourceEvidence?: {
    cpuPercentObserved?: number | null;
    memoryMbObserved?: number | null;
    notes?: string[];
  };
  /** When true, simulates accelerator execution failure before policy fallback. */
  acceleratorExecutionFailed?: boolean;
  evidenceNotes?: string[];
};

export type Em5FailureClass =
  | LocalInferenceFailureClass
  | 'MODEL_PROVIDER_INCOMPATIBLE'
  | 'ACCELERATOR_NOT_VERIFIED'
  | 'SILENT_FALLBACK_DENIED'
  | 'CLOUD_ESCALATION_DENIED'
  | 'DRIVER_BIOS_DENIED'
  | 'PRIVILEGE_ESCALATION_DENIED'
  | 'HIDDEN_PERSISTENCE_DENIED'
  | 'ACCELERATOR_EXECUTION_FAILED'
  | 'FALLBACK_POLICY_DENIED'
  | 'EXPIRED'
  | null;

export type Em5InferenceReceipt = {
  requestId: string;
  adapterId: string;
  latencyMs: number | null;
  actualDevice: ComputeKind | 'none';
  actualProvider: AmdEpKind | 'none';
  runtimeProvider: string;
  modelId: string;
  modelVersionOrHash: string | null;
  resourceEvidence: {
    cpuPercentObserved: number | null;
    memoryMbObserved: number | null;
    concurrencyObserved: number | null;
    governorState: string | null;
    notes: string[];
  };
  failureState: Em5FailureClass;
  status: 'OK' | 'UNAVAILABLE' | 'DENIED' | 'REJECTED' | 'FALLBACK_CPU';
  /** Explicit honesty: CPU used after GPU/NPU request. */
  fallbackUsed: boolean;
  /** Soft-wire EL8: silent fallback detected (and denied as accelerator verify). */
  silentFallbackDetected: boolean;
  acceleratorVerified: boolean;
  providerState: CapabilityState;
  requestedDevice: ComputeKind | 'auto';
  homeUniverseId: string;
  tenantId: string;
  agentId: string;
  returnPath: string;
  honestyBanner: typeof EM5_HONESTY_BANNER;
  l4AutonomyEnabled: false;
  notes: string[];
  startedAt: string;
  completedAt: string;
};

export type Em5AdapterRunResult = {
  adapter: AmdWindowsMlAdapterRecord;
  receipt: Em5InferenceReceipt;
  output: unknown | null;
  softWire: Em5SoftWireProbe;
  coreFlow: typeof EM5_CORE_FLOW;
  locks: typeof EM5_LOCKS;
};

const DEFAULT_ADAPTER_ID = 'amd-windows-ml-adapter-v1';
const DEFAULT_RUNTIME_VERSION = '0.1.0-em5';

function nowIso(): string {
  return new Date().toISOString();
}

function defaultFallbackPolicy(): FallbackPolicy {
  return {
    allowCpuFallback: true,
    allowAcceleratorFailToCpu: true,
    silentFallbackVerifiesAccelerator: false,
    allowCloudEscalation: false,
  };
}

/**
 * Default adapter posture: CPU DETECTED (safe routing), GPU/NPU/WindowsML/ORT NOT_TESTED.
 * Never claims live ASUS VERIFIED without measured evidence.
 */
export function defaultAmdWindowsMlAdapter(
  overrides: Partial<AmdWindowsMlAdapterRecord> = {},
): AmdWindowsMlAdapterRecord {
  return {
    adapterId: DEFAULT_ADAPTER_ID,
    runtimeVersion: DEFAULT_RUNTIME_VERSION,
    windowsMlState: 'NOT_TESTED',
    onnxRuntimeState: 'NOT_TESTED',
    deviceId: 'local-default-unmeasured',
    cpuState: 'DETECTED',
    gpuState: 'NOT_TESTED',
    npuState: 'NOT_TESTED',
    supportedModels: [],
    lastVerifiedAt: null,
    benchmarkEvidence: [],
    fallbackPolicy: defaultFallbackPolicy(),
    resourceLimits: {
      maxMemoryMb: 4096,
      maxConcurrency: 2,
      maxRuntimeMs: 60_000,
    },
    ...overrides,
  };
}

/**
 * Hard verification gate: AMD GPU/NPU becomes VERIFIED only after bounded
 * local inference succeeds on that exact execution provider with measured evidence.
 */
export function applyAmdProviderVerificationGate(input: {
  adapter: AmdWindowsMlAdapterRecord;
  providerId: AmdEpKind;
  /** Pre-gate capability (DETECTED / SUPPORTED / NOT_TESTED / …). */
  priorState: CapabilityState;
  fixture: Em5MeasuredInferenceFixture | null;
  claimVerifiedWithoutExactEpInference?: boolean;
}): {
  resultingState: CapabilityState;
  verified: boolean;
  denied: boolean;
  reason: string;
  updatedAdapter: AmdWindowsMlAdapterRecord;
} {
  const { adapter, providerId, priorState, fixture } = input;

  if (input.claimVerifiedWithoutExactEpInference === true) {
    return {
      resultingState: priorState === 'DETECTED' || priorState === 'SUPPORTED' ? priorState : 'NOT_TESTED',
      verified: false,
      denied: true,
      reason:
        'DENIED: AMD GPU/NPU VERIFIED requires bounded local inference on the exact execution provider — fake ASUS/live claim rejected.',
      updatedAdapter: adapter,
    };
  }

  if (providerId === 'cpu') {
    // CPU is safe default for routing; inference VERIFIED only with fixture evidence.
    if (
      fixture &&
      fixture.providerId === 'cpu' &&
      fixture.boundedInferenceSucceeded &&
      fixture.modelLoadCompleted &&
      fixture.providerState === 'VERIFIED'
    ) {
      const evidence: BenchmarkEvidenceRecord = {
        evidenceId: `cpu-${fixture.modelVersionOrHash}-${fixture.latencyMs}`,
        providerId: 'cpu',
        latencyMs: fixture.latencyMs,
        recordedAt: nowIso(),
        modelId: fixture.modelVersionOrHash,
        modelVersionOrHash: fixture.modelVersionOrHash,
        notes: fixture.evidenceNotes ?? ['CPU bounded inference fixture.'],
      };
      return {
        resultingState: 'VERIFIED',
        verified: true,
        denied: false,
        reason: 'CPU bounded inference fixture satisfied.',
        updatedAdapter: {
          ...adapter,
          cpuState: 'VERIFIED',
          lastVerifiedAt: evidence.recordedAt,
          benchmarkEvidence: [...adapter.benchmarkEvidence, evidence],
        },
      };
    }
    return {
      resultingState: adapter.cpuState,
      verified: false,
      denied: false,
      reason: 'CPU remains safe routing default without auto-VERIFIED inference claim.',
      updatedAdapter: adapter,
    };
  }

  // DETECTED / SUPPORTED never graduate without exact-EP measured inference.
  if (
    !fixture ||
    fixture.providerId !== providerId ||
    fixture.boundedInferenceSucceeded !== true ||
    fixture.modelLoadCompleted !== true ||
    fixture.providerState !== 'VERIFIED'
  ) {
    const stuck =
      priorState === 'DETECTED' || priorState === 'SUPPORTED' || priorState === 'NOT_TESTED'
        ? priorState
        : 'NOT_TESTED';
    return {
      resultingState: stuck,
      verified: false,
      denied: false,
      reason: `DETECTED/SUPPORTED≠VERIFIED — ${providerId} remains ${stuck} until exact-EP bounded inference evidence.`,
      updatedAdapter: adapter,
    };
  }

  const evidence: BenchmarkEvidenceRecord = {
    evidenceId: `${providerId}-${fixture.modelVersionOrHash}-${fixture.latencyMs}`,
    providerId,
    latencyMs: fixture.latencyMs,
    recordedAt: nowIso(),
    modelId: fixture.modelVersionOrHash,
    modelVersionOrHash: fixture.modelVersionOrHash,
    notes: [
      `Exact EP ${providerId} bounded inference succeeded.`,
      ...(fixture.evidenceNotes ?? []),
    ],
  };

  const updated: AmdWindowsMlAdapterRecord = {
    ...adapter,
    lastVerifiedAt: evidence.recordedAt,
    benchmarkEvidence: [...adapter.benchmarkEvidence, evidence],
    gpuState: providerId === 'amd-gpu' ? 'VERIFIED' : adapter.gpuState,
    npuState: providerId === 'amd-npu' ? 'VERIFIED' : adapter.npuState,
    windowsMlState:
      providerId === 'windows-ml' || providerId === 'amd-gpu' || providerId === 'amd-npu'
        ? adapter.windowsMlState === 'NOT_TESTED'
          ? 'SUPPORTED'
          : adapter.windowsMlState
        : adapter.windowsMlState,
    onnxRuntimeState:
      providerId === 'onnx-runtime' || providerId === 'amd-gpu' || providerId === 'amd-npu'
        ? adapter.onnxRuntimeState === 'NOT_TESTED'
          ? 'SUPPORTED'
          : adapter.onnxRuntimeState
        : adapter.onnxRuntimeState,
  };

  return {
    resultingState: 'VERIFIED',
    verified: true,
    denied: false,
    reason: `VERIFIED: bounded inference succeeded on exact provider ${providerId}.`,
    updatedAdapter: updated,
  };
}

function providerStateFromAdapter(
  adapter: AmdWindowsMlAdapterRecord,
  id: AmdEpKind,
): CapabilityState {
  switch (id) {
    case 'cpu':
      return adapter.cpuState;
    case 'amd-gpu':
      return adapter.gpuState;
    case 'amd-npu':
      return adapter.npuState;
    case 'windows-ml':
      return adapter.windowsMlState;
    case 'onnx-runtime':
      return adapter.onnxRuntimeState;
    default:
      return 'NOT_TESTED';
  }
}

function deviceOf(id: AmdEpKind): ComputeKind {
  if (id === 'amd-gpu') return 'gpu';
  if (id === 'amd-npu') return 'npu';
  return 'cpu';
}

function mapPreferredToProvider(
  preferred: ComputeKind | 'auto',
  adapter: AmdWindowsMlAdapterRecord,
): { selected: AmdEpKind; fellBackToCpu: boolean; reason: string } {
  const gpuVerified = adapter.gpuState === 'VERIFIED';
  const npuVerified = adapter.npuState === 'VERIFIED';

  if (preferred === 'gpu') {
    if (gpuVerified) {
      return { selected: 'amd-gpu', fellBackToCpu: false, reason: 'VERIFIED_AMD_GPU_SELECTED' };
    }
    return {
      selected: 'cpu',
      fellBackToCpu: true,
      reason: 'CPU_SAFE_FALLBACK_GPU_NOT_VERIFIED',
    };
  }
  if (preferred === 'npu') {
    if (npuVerified) {
      return { selected: 'amd-npu', fellBackToCpu: false, reason: 'VERIFIED_AMD_NPU_SELECTED' };
    }
    return {
      selected: 'cpu',
      fellBackToCpu: true,
      reason: 'CPU_SAFE_FALLBACK_NPU_NOT_VERIFIED',
    };
  }
  if (preferred === 'auto') {
    if (npuVerified) {
      return { selected: 'amd-npu', fellBackToCpu: false, reason: 'VERIFIED_AMD_NPU_SELECTED' };
    }
    if (gpuVerified) {
      return { selected: 'amd-gpu', fellBackToCpu: false, reason: 'VERIFIED_AMD_GPU_SELECTED' };
    }
  }
  return {
    selected: 'cpu',
    fellBackToCpu: preferred !== 'cpu' && preferred !== 'auto',
    reason: 'CPU_SAFE_DEFAULT',
  };
}

function modelCompatible(
  request: Em5EnvelopeRequest,
  provider: AmdEpKind,
): boolean {
  if (!request.compatibleProviders || request.compatibleProviders.length === 0) {
    // No explicit list → CPU always compatible; accelerators require explicit list or VERIFIED path.
    return provider === 'cpu';
  }
  return request.compatibleProviders.includes(provider);
}

function denyReceipt(input: {
  request: Em5EnvelopeRequest;
  adapter: AmdWindowsMlAdapterRecord;
  start: string;
  failureState: Em5FailureClass;
  status: Em5InferenceReceipt['status'];
  notes: string[];
  actualDevice?: ComputeKind | 'none';
  actualProvider?: AmdEpKind | 'none';
  fallbackUsed?: boolean;
  silentFallbackDetected?: boolean;
  providerState?: CapabilityState;
  latencyMs?: number | null;
}): Em5InferenceReceipt {
  return {
    requestId: input.request.requestId,
    adapterId: input.adapter.adapterId,
    latencyMs: input.latencyMs ?? null,
    actualDevice: input.actualDevice ?? 'none',
    actualProvider: input.actualProvider ?? 'none',
    runtimeProvider: `windows-ml/onnx-runtime/${input.adapter.runtimeVersion}`,
    modelId: input.request.modelId,
    modelVersionOrHash: input.request.modelVersionOrHash ?? null,
    resourceEvidence: {
      cpuPercentObserved: null,
      memoryMbObserved: null,
      concurrencyObserved: null,
      governorState: null,
      notes: input.notes,
    },
    failureState: input.failureState,
    status: input.status,
    fallbackUsed: input.fallbackUsed ?? false,
    silentFallbackDetected: input.silentFallbackDetected ?? false,
    acceleratorVerified: false,
    providerState: input.providerState ?? 'UNAVAILABLE',
    requestedDevice: input.request.requestedDevice,
    homeUniverseId: input.request.homeUniverseId,
    tenantId: input.request.tenantId,
    agentId: input.request.agentId,
    returnPath: input.request.returnPath ?? 'xiv-home-base',
    honestyBanner: EM5_HONESTY_BANNER,
    l4AutonomyEnabled: EM5_LOCKS.L4_AUTONOMY_ENABLED,
    notes: input.notes,
    startedAt: input.start,
    completedAt: nowIso(),
  };
}

export type RunAmdWindowsMlAdapterInput = {
  request: Em5EnvelopeRequest;
  adapter?: AmdWindowsMlAdapterRecord;
  /** Injected provider registry (EM3 soft-wire / EL7). */
  providerRegistry?: ExecutionProviderRecord[];
  resourceBudget?: ResourceBudget;
  /**
   * Unit-test fixture boundary only. Omit for default NOT_TESTED/UNAVAILABLE path.
   * Never fabricates live ASUS verification.
   */
  measuredEvidenceFixture?: Em5MeasuredInferenceFixture | null;
  /** Attempt to claim VERIFIED without exact-EP inference — must be denied. */
  claimVerifiedWithoutExactEpInference?: boolean;
  now?: string;
};

/**
 * Governed AMD Windows ML adapter entry point.
 */
export function runAmdWindowsMlAdapterPath(
  input: RunAmdWindowsMlAdapterInput,
): Em5AdapterRunResult {
  const start = nowIso();
  const startMs = Date.now();
  const softWire = probeEm5SoftWires();
  let adapter = input.adapter ?? defaultAmdWindowsMlAdapter();
  const request = input.request;
  const locks = EM5_LOCKS;

  const base = {
    softWire,
    coreFlow: EM5_CORE_FLOW,
    locks,
  };

  // --- Hard denies: driver/BIOS/privilege/persistence/cloud/auto-download ---
  if (request.authorizeDriverOrRuntimeInstall === true) {
    return {
      ...base,
      adapter,
      output: null,
      receipt: denyReceipt({
        request,
        adapter,
        start,
        failureState: 'AUTO_INSTALL_DENIED',
        status: 'DENIED',
        notes: ['DENIED: automatic driver/runtime install is forbidden (EM5).'],
      }),
    };
  }
  if (request.authorizeBiosOrOverclock === true) {
    return {
      ...base,
      adapter,
      output: null,
      receipt: denyReceipt({
        request,
        adapter,
        start,
        failureState: 'DRIVER_BIOS_DENIED',
        status: 'DENIED',
        notes: ['DENIED: BIOS/overclock/undervolt changes are forbidden (EM5).'],
      }),
    };
  }
  if (request.authorizePrivilegeEscalation === true) {
    return {
      ...base,
      adapter,
      output: null,
      receipt: denyReceipt({
        request,
        adapter,
        start,
        failureState: 'PRIVILEGE_ESCALATION_DENIED',
        status: 'DENIED',
        notes: ['DENIED: privilege escalation is forbidden (EM5).'],
      }),
    };
  }
  if (request.authorizeHiddenPersistence === true) {
    return {
      ...base,
      adapter,
      output: null,
      receipt: denyReceipt({
        request,
        adapter,
        start,
        failureState: 'HIDDEN_PERSISTENCE_DENIED',
        status: 'DENIED',
        notes: ['DENIED: hidden persistence is forbidden (EM5).'],
      }),
    };
  }
  if (request.authorizeCloudEscalation === true) {
    return {
      ...base,
      adapter,
      output: null,
      receipt: denyReceipt({
        request,
        adapter,
        start,
        failureState: 'CLOUD_ESCALATION_DENIED',
        status: 'DENIED',
        notes: ['DENIED: cloud escalation is forbidden without separate authorization (EM5).'],
      }),
    };
  }
  if (request.authorizeModelDownload === true) {
    return {
      ...base,
      adapter,
      output: null,
      receipt: denyReceipt({
        request,
        adapter,
        start,
        failureState: 'AUTO_DOWNLOAD_DENIED',
        status: 'DENIED',
        notes: ['DENIED: automatic model download is forbidden (EM5).'],
      }),
    };
  }

  if (request.expiry) {
    const now = input.now ?? start;
    if (Date.parse(request.expiry) <= Date.parse(now)) {
      return {
        ...base,
        adapter,
        output: null,
        receipt: denyReceipt({
          request,
          adapter,
          start,
          failureState: 'EXPIRED',
          status: 'DENIED',
          notes: ['DENIED: compute envelope expired.'],
        }),
      };
    }
  }

  // --- Policy gate (EL7 soft-wire) ---
  const policy = checkLocalInferencePolicy({
    taskId: request.requestId,
    modelId: request.modelId,
    tenantId: request.tenantId,
    universeScope: request.homeUniverseId,
    authorized: request.authorized,
    authVerified: request.authVerified,
    guardianAllow: request.guardianAllow,
    rlsTenantInScope: request.rlsTenantInScope,
    universeBoundaryOk: request.universeBoundaryOk,
    authorizeModelDownload: false,
    authorizeDriverOrRuntimeInstall: false,
  });

  if (!policy.allowed) {
    return {
      ...base,
      adapter,
      output: null,
      receipt: denyReceipt({
        request,
        adapter,
        start,
        failureState: policy.failureClass,
        status: 'DENIED',
        notes: [policy.reason, 'Guardian/RLS/auth/Universe soft-wire intact.'],
      }),
    };
  }

  // --- Resource governor (EL9 soft-wire) ---
  const maxMemoryMb = request.maxMemoryMb ?? adapter.resourceLimits.maxMemoryMb;
  const budget = input.resourceBudget ?? {
    maxConcurrentTasks: request.maxConcurrency ?? adapter.resourceLimits.maxConcurrency,
    maxMemoryBytes: maxMemoryMb * 1024 * 1024,
  };
  const gov = evaluateResourceRequest(
    {
      concurrentTasks: request.maxConcurrency ?? 1,
      estimatedMemoryBytes: maxMemoryMb * 1024 * 1024,
    },
    budget,
  );
  if (!gov.allowed) {
    return {
      ...base,
      adapter,
      output: null,
      receipt: denyReceipt({
        request,
        adapter,
        start,
        failureState: 'GOVERNOR_REJECTED',
        status: 'REJECTED',
        notes: [`Resource governor rejected: ${gov.reasons.join('; ')}`],
      }),
    };
  }

  // --- Soft-wire prior ONNX/Windows ML adapter status (does not invent VERIFIED) ---
  const onnxStatus = evaluateOnnxWindowsMlAdapter({
    windowsMlAvailable:
      adapter.windowsMlState === 'DETECTED' ||
      adapter.windowsMlState === 'SUPPORTED' ||
      adapter.windowsMlState === 'VERIFIED'
        ? true
        : adapter.windowsMlState === 'UNAVAILABLE'
          ? false
          : 'unknown',
    onnxRuntimeInstalled:
      adapter.onnxRuntimeState === 'DETECTED' ||
      adapter.onnxRuntimeState === 'SUPPORTED' ||
      adapter.onnxRuntimeState === 'VERIFIED'
        ? true
        : adapter.onnxRuntimeState === 'UNAVAILABLE'
          ? false
          : 'unknown',
    amdExecutionProviderConfigured:
      adapter.gpuState === 'DETECTED' ||
      adapter.gpuState === 'SUPPORTED' ||
      adapter.npuState === 'DETECTED' ||
      adapter.npuState === 'SUPPORTED'
        ? true
        : 'unknown',
  });

  // --- Registry soft-wire (EL7 default registry; EM3 when present is presence-only) ---
  const registry = input.providerRegistry ?? defaultExecutionProviderRegistry();
  void registry;

  // Apply verification gate for claimed fake VERIFIED.
  if (input.claimVerifiedWithoutExactEpInference === true) {
    const gate = applyAmdProviderVerificationGate({
      adapter,
      providerId: request.requestedDevice === 'npu' ? 'amd-npu' : 'amd-gpu',
      priorState:
        request.requestedDevice === 'npu' ? adapter.npuState : adapter.gpuState,
      fixture: null,
      claimVerifiedWithoutExactEpInference: true,
    });
    return {
      ...base,
      adapter: gate.updatedAdapter,
      output: null,
      receipt: denyReceipt({
        request,
        adapter: gate.updatedAdapter,
        start,
        failureState: 'ACCELERATOR_NOT_VERIFIED',
        status: 'DENIED',
        notes: [gate.reason, ...EM5_NOT_TESTED_CLAIMS.map((c) => `NOT_TESTED:${c}`)],
        providerState: gate.resultingState,
      }),
    };
  }

  // Optionally graduate adapter from fixture (exact EP) before selection.
  const fixture = input.measuredEvidenceFixture ?? null;
  if (fixture && fixture.providerId !== 'cpu') {
    const gate = applyAmdProviderVerificationGate({
      adapter,
      providerId: fixture.providerId,
      priorState: providerStateFromAdapter(adapter, fixture.providerId),
      fixture,
    });
    adapter = gate.updatedAdapter;
  }

  // --- Select actual execution provider (CPU safe default) ---
  const selection = mapPreferredToProvider(request.requestedDevice, adapter);

  // Model/provider compatibility before execution.
  if (!modelCompatible(request, selection.selected)) {
    // If preferred accelerator incompatible, try CPU if compatible.
    if (selection.selected !== 'cpu' && modelCompatible(request, 'cpu')) {
      // Will fall through to explicit CPU fallback with honesty flags below.
    } else if (!modelCompatible(request, 'cpu')) {
      return {
        ...base,
        adapter,
        output: null,
        receipt: denyReceipt({
          request,
          adapter,
          start,
          failureState: 'MODEL_PROVIDER_INCOMPATIBLE',
          status: 'DENIED',
          notes: [
            `Model ${request.modelId} incompatible with provider ${selection.selected} and CPU.`,
          ],
          actualProvider: selection.selected,
          actualDevice: deviceOf(selection.selected),
          providerState: providerStateFromAdapter(adapter, selection.selected),
        }),
      };
    }
  }

  // If selection fell back because accelerator not VERIFIED — record explicit fallback.
  const requestedAccelerator =
    request.requestedDevice === 'gpu' || request.requestedDevice === 'npu';

  // Accelerator requested but not VERIFIED → explicit CPU fallback (not silent).
  if (
    requestedAccelerator &&
    selection.fellBackToCpu &&
    selection.selected === 'cpu'
  ) {
    const silentEvidence = createEmptyEvidence({
      modelId: request.modelId,
      requestedProvider: request.requestedDevice === 'gpu' ? 'GPU' : 'NPU',
      actualProvider: 'CPU',
      deviceTruthState:
        request.requestedDevice === 'gpu' ? adapter.gpuState : adapter.npuState,
      failureClass: 'SILENT_FALLBACK_TO_CPU',
    });
    const silentDetected = detectSilentFallback(silentEvidence);

    // Soft-wire EL8: silent fallback must be flagged; never verifies accelerator.
    const notes = [
      selection.reason,
      'Explicit CPU fallback — accelerator was not VERIFIED.',
      'DETECTED/SUPPORTED ≠ verified inference hardware.',
      `ONNX adapter overall: ${onnxStatus.overallState} (inferenceVerified=${onnxStatus.inferenceVerified}).`,
      silentDetected
        ? 'EL8 soft-wire: silent-fallback pattern detected; accelerator VERIFIED denied.'
        : 'Fallback recorded on receipt (fallbackUsed=true).',
      'AMD GPU/NPU remain NOT_TESTED/prior state until exact-EP measured evidence.',
    ];

    // Without CPU measured fixture, return FALLBACK_CPU / UNAVAILABLE rather than pretend success.
    const cpuFixtureOk =
      fixture &&
      fixture.providerId === 'cpu' &&
      fixture.boundedInferenceSucceeded &&
      fixture.modelLoadCompleted;

    if (!cpuFixtureOk) {
      return {
        ...base,
        adapter,
        output: null,
        receipt: denyReceipt({
          request,
          adapter,
          start,
          failureState: 'ACCELERATOR_NOT_VERIFIED',
          status: 'FALLBACK_CPU',
          notes: [
            ...notes,
            'CPU fallback path recorded; inference UNAVAILABLE without CPU measured evidence fixture.',
          ],
          actualDevice: 'cpu',
          actualProvider: 'cpu',
          fallbackUsed: true,
          silentFallbackDetected: silentDetected || true,
          providerState: adapter.cpuState,
          latencyMs: Date.now() - startMs,
        }),
      };
    }

    // CPU fixture path after explicit accelerator→CPU fallback.
    const latencyMs = fixture!.latencyMs;
    return {
      ...base,
      adapter,
      output: fixture!.output ?? { ok: true, fallback: 'cpu' },
      receipt: {
        requestId: request.requestId,
        adapterId: adapter.adapterId,
        latencyMs,
        actualDevice: 'cpu',
        actualProvider: 'cpu',
        runtimeProvider: `windows-ml/onnx-runtime/${adapter.runtimeVersion}`,
        modelId: request.modelId,
        modelVersionOrHash: fixture!.modelVersionOrHash,
        resourceEvidence: {
          cpuPercentObserved: fixture!.resourceEvidence?.cpuPercentObserved ?? null,
          memoryMbObserved: fixture!.resourceEvidence?.memoryMbObserved ?? null,
          concurrencyObserved: request.maxConcurrency ?? 1,
          governorState: 'NORMAL',
          notes: [
            ...(fixture!.resourceEvidence?.notes ?? []),
            'CPU fallback after non-VERIFIED accelerator request.',
          ],
        },
        failureState: 'SILENT_FALLBACK_DENIED',
        status: 'FALLBACK_CPU',
        fallbackUsed: true,
        silentFallbackDetected: true,
        acceleratorVerified: false,
        providerState: 'VERIFIED',
        requestedDevice: request.requestedDevice,
        homeUniverseId: request.homeUniverseId,
        tenantId: request.tenantId,
        agentId: request.agentId,
        returnPath: request.returnPath ?? 'xiv-home-base',
        honestyBanner: EM5_HONESTY_BANNER,
        l4AutonomyEnabled: false,
        notes,
        startedAt: start,
        completedAt: nowIso(),
      },
    };
  }

  // Compatibility gate for selected provider.
  if (!modelCompatible(request, selection.selected)) {
    if (
      adapter.fallbackPolicy.allowCpuFallback &&
      modelCompatible(request, 'cpu') &&
      selection.selected !== 'cpu'
    ) {
      return {
        ...base,
        adapter,
        output: null,
        receipt: denyReceipt({
          request,
          adapter,
          start,
          failureState: 'MODEL_PROVIDER_INCOMPATIBLE',
          status: 'FALLBACK_CPU',
          notes: [
            `Model incompatible with ${selection.selected}; explicit CPU fallback recorded.`,
            'Accelerator not verified by CPU path.',
          ],
          actualDevice: 'cpu',
          actualProvider: 'cpu',
          fallbackUsed: true,
          silentFallbackDetected: true,
          providerState: adapter.cpuState,
        }),
      };
    }
    return {
      ...base,
      adapter,
      output: null,
      receipt: denyReceipt({
        request,
        adapter,
        start,
        failureState: 'MODEL_PROVIDER_INCOMPATIBLE',
        status: 'DENIED',
        notes: [`Model ${request.modelId} incompatible with ${selection.selected}.`],
        actualProvider: selection.selected,
        actualDevice: deviceOf(selection.selected),
      }),
    };
  }

  // Verified accelerator path — may still fail and fall back per policy.
  if (selection.selected === 'amd-gpu' || selection.selected === 'amd-npu') {
    const state = providerStateFromAdapter(adapter, selection.selected);
    if (state !== 'VERIFIED') {
      return {
        ...base,
        adapter,
        output: null,
        receipt: denyReceipt({
          request,
          adapter,
          start,
          failureState: 'ACCELERATOR_NOT_VERIFIED',
          status: 'UNAVAILABLE',
          notes: [`${selection.selected} state is ${state}; only VERIFIED may execute.`],
          actualProvider: selection.selected,
          actualDevice: deviceOf(selection.selected),
          providerState: state,
        }),
      };
    }

    // Fixture must match exact EP.
    if (
      !fixture ||
      fixture.providerId !== selection.selected ||
      fixture.boundedInferenceSucceeded !== true ||
      fixture.modelLoadCompleted !== true
    ) {
      return {
        ...base,
        adapter,
        output: null,
        receipt: denyReceipt({
          request,
          adapter,
          start,
          failureState: 'NOT_TESTED',
          status: 'UNAVAILABLE',
          notes: [
            'VERIFIED registry state without matching exact-EP fixture boundary → UNAVAILABLE (no pretend success).',
          ],
          actualProvider: selection.selected,
          actualDevice: deviceOf(selection.selected),
          providerState: state,
        }),
      };
    }

    if (fixture.acceleratorExecutionFailed === true) {
      if (!adapter.fallbackPolicy.allowAcceleratorFailToCpu) {
        return {
          ...base,
          adapter,
          output: null,
          receipt: denyReceipt({
            request,
            adapter,
            start,
            failureState: 'FALLBACK_POLICY_DENIED',
            status: 'DENIED',
            notes: ['Accelerator execution failed; fallback to CPU denied by policy.'],
            actualProvider: selection.selected,
            actualDevice: deviceOf(selection.selected),
            providerState: state,
          }),
        };
      }
      // Policy allows CPU fallback — record explicitly; do not verify accelerator via CPU.
      return {
        ...base,
        adapter,
        output: null,
        receipt: denyReceipt({
          request,
          adapter,
          start,
          failureState: 'ACCELERATOR_EXECUTION_FAILED',
          status: 'FALLBACK_CPU',
          notes: [
            'Accelerator execution failed; explicit CPU fallback per policy.',
            'CPU success does NOT verify the requested AMD GPU/NPU.',
            'fallbackUsed=true on receipt (EL8 soft-wire honesty).',
          ],
          actualDevice: 'cpu',
          actualProvider: 'cpu',
          fallbackUsed: true,
          silentFallbackDetected: true,
          providerState: adapter.cpuState,
          latencyMs: Date.now() - startMs,
        }),
      };
    }

    // Success on exact VERIFIED EP.
    const latencyMs = fixture.latencyMs;
    return {
      ...base,
      adapter,
      output: fixture.output ?? { ok: true, provider: selection.selected },
      receipt: {
        requestId: request.requestId,
        adapterId: adapter.adapterId,
        latencyMs,
        actualDevice: deviceOf(selection.selected),
        actualProvider: selection.selected,
        runtimeProvider: `windows-ml/onnx-runtime/${selection.selected}/${adapter.runtimeVersion}`,
        modelId: request.modelId,
        modelVersionOrHash: fixture.modelVersionOrHash,
        resourceEvidence: {
          cpuPercentObserved: fixture.resourceEvidence?.cpuPercentObserved ?? null,
          memoryMbObserved: fixture.resourceEvidence?.memoryMbObserved ?? null,
          concurrencyObserved: request.maxConcurrency ?? 1,
          governorState: 'NORMAL',
          notes: fixture.resourceEvidence?.notes ?? ['Measured accelerator inference.'],
        },
        failureState: null,
        status: 'OK',
        fallbackUsed: false,
        silentFallbackDetected: false,
        acceleratorVerified: true,
        providerState: 'VERIFIED',
        requestedDevice: request.requestedDevice,
        homeUniverseId: request.homeUniverseId,
        tenantId: request.tenantId,
        agentId: request.agentId,
        returnPath: request.returnPath ?? 'xiv-home-base',
        honestyBanner: EM5_HONESTY_BANNER,
        l4AutonomyEnabled: false,
        notes: [
          selection.reason,
          `Exact EP ${selection.selected} bounded inference succeeded.`,
          ...(fixture.evidenceNotes ?? []),
        ],
        startedAt: start,
        completedAt: nowIso(),
      },
    };
  }

  // CPU default path.
  const cpuFixtureOk =
    fixture &&
    fixture.providerId === 'cpu' &&
    fixture.boundedInferenceSucceeded &&
    fixture.modelLoadCompleted;

  if (!cpuFixtureOk) {
    return {
      ...base,
      adapter,
      output: null,
      receipt: denyReceipt({
        request,
        adapter,
        start,
        failureState: 'NOT_TESTED',
        status: 'UNAVAILABLE',
        notes: [
          selection.reason,
          'CPU is the safe default routing path; inference remains UNAVAILABLE without measured evidence.',
          `ONNX overall=${onnxStatus.overallState}; live ASUS AMD Windows ML remains NOT_TESTED.`,
          ...EM5_NOT_TESTED_CLAIMS.map((c) => `NOT_TESTED:${c}`),
        ],
        actualDevice: 'cpu',
        actualProvider: 'cpu',
        providerState: adapter.cpuState,
        latencyMs: Date.now() - startMs,
      }),
    };
  }

  const latencyMs = fixture!.latencyMs;
  return {
    ...base,
    adapter,
    output: fixture!.output ?? { ok: true, provider: 'cpu' },
    receipt: {
      requestId: request.requestId,
      adapterId: adapter.adapterId,
      latencyMs,
      actualDevice: 'cpu',
      actualProvider: 'cpu',
      runtimeProvider: `windows-ml/onnx-runtime/cpu/${adapter.runtimeVersion}`,
      modelId: request.modelId,
      modelVersionOrHash: fixture!.modelVersionOrHash,
      resourceEvidence: {
        cpuPercentObserved: fixture!.resourceEvidence?.cpuPercentObserved ?? null,
        memoryMbObserved: fixture!.resourceEvidence?.memoryMbObserved ?? null,
        concurrencyObserved: request.maxConcurrency ?? 1,
        governorState: 'NORMAL',
        notes: fixture!.resourceEvidence?.notes ?? ['CPU measured inference.'],
      },
      failureState: null,
      status: 'OK',
      fallbackUsed: false,
      silentFallbackDetected: false,
      acceleratorVerified: false,
      providerState: 'VERIFIED',
      requestedDevice: request.requestedDevice,
      homeUniverseId: request.homeUniverseId,
      tenantId: request.tenantId,
      agentId: request.agentId,
      returnPath: request.returnPath ?? 'xiv-home-base',
      honestyBanner: EM5_HONESTY_BANNER,
      l4AutonomyEnabled: false,
      notes: [selection.reason, 'CPU safe-default measured inference (fixture boundary).'],
      startedAt: start,
      completedAt: nowIso(),
    },
  };
}

export function em5AdapterHonesty() {
  return {
    banner: EM5_HONESTY_BANNER,
    locks: EM5_LOCKS,
    notTestedClaims: EM5_NOT_TESTED_CLAIMS,
    coreFlow: EM5_CORE_FLOW,
    defaultGpuState: 'NOT_TESTED' as const,
    defaultNpuState: 'NOT_TESTED' as const,
    defaultWindowsMlState: 'NOT_TESTED' as const,
    defaultOnnxRuntimeState: 'NOT_TESTED' as const,
    amdVerifiedClaimedWithoutEvidence: false as const,
    autoDownload: false as const,
    cloudEscalation: false as const,
  };
}
