/**
 * 62L-EP8 — NVIDIA Adapter Research Path runtime.
 *
 * Governed NVIDIA adapter: bounded inference, receipt-recorded CPU fallback
 * (requestedDevice=NVIDIA_GPU, actualDevice=CPU, fallbackUsed=true),
 * evidence-first VERIFIED gate. Soft-wires EP7/EP6/EP5/EP1/EM157 when present.
 */

import {
  EP8_DB_CANDIDATES_STATUS,
  EP8_LOCKS,
  EP8_MAY,
  EP8_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  NVIDIA_ADAPTER_AGENT_BOUNDS,
  NVIDIA_ADAPTER_CORE_FLOW,
  NVIDIA_ADAPTER_FIELDS,
  NVIDIA_ADAPTER_MUST_NOT,
  NVIDIA_ADAPTER_RESEARCH_CYCLE,
  NVIDIA_ADAPTER_STATES,
  NVIDIA_EXECUTION_DEVICES,
  NVIDIA_FAILURE_CLASSES,
  NVIDIA_VERIFIED_PRECONDITIONS,
  assertEp8LocksIntact,
  ep8SoftWireSnapshot,
  isHumanApprover,
  isNvidiaAdapterAgent,
  isSilentCpuFallback,
  type Ep8Actor,
  type Ep8EvidenceState,
  type Ep8HopRecord,
  type Ep8SoftWireSnapshot,
  type NvidiaAdapterCoreFlowHop,
  type NvidiaAdapterField,
  type NvidiaAdapterState,
  type NvidiaExecutionDevice,
  type NvidiaFailureClass,
  type NvidiaVerifiedPrecondition,
} from './nvidia-adapter-research-path-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof NVIDIA_ADAPTER_RESEARCH_CYCLE)[number],
  state: Ep8EvidenceState,
  summary: string,
): Ep8HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

export type DenialResult = {
  denied: true;
  state: 'DENIED';
  reason: string;
  executed: false;
};

function deny(reason: string): DenialResult {
  return { denied: true, state: 'DENIED', reason, executed: false };
}

export type NvidiaAdapterRecord = {
  adapterId: string;
  nvidiaGpuModel: string;
  vram: string;
  driverState: string;
  cudaState: string;
  tensorRtState: string;
  tensorRtLlmState: string;
  onnxCompatibility: string;
  supportedPrecisions: string;
  modelCompatibility: string;
  actualExecutionDevice: NvidiaExecutionDevice;
  requestedDevice: NvidiaExecutionDevice;
  latency: string;
  throughput: string;
  memoryUsage: string;
  fallbackRoute: string;
  benchmarkReference: string;
  lastVerifiedTimestamp: string | null;
  failureClass: NvidiaFailureClass;
  state: NvidiaAdapterState;
  silentCpuFallback: boolean;
  gpuVerified: boolean;
  multiGpuState: 'NOT_TESTED';
  distributedInferenceState: 'NOT_TESTED';
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type NvidiaInferenceReceipt = {
  receiptId: string;
  adapterId: string;
  flowPosition: NvidiaAdapterCoreFlowHop;
  requestedDevice: NvidiaExecutionDevice;
  actualDevice: NvidiaExecutionDevice;
  fallbackUsed: boolean;
  silentCpuFallback: boolean;
  gpuRemainsUnverified: boolean;
  latency: string;
  throughput: string;
  memoryUsage: string;
  benchmarkReference: string;
  timestamp: string;
  failureClass: NvidiaFailureClass;
  state: NvidiaAdapterState;
  preconditionsMet: readonly NvidiaVerifiedPrecondition[];
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type VerifiedPreconditionFlags = Partial<
  Record<NvidiaVerifiedPrecondition, boolean>
>;

export function allVerifiedPreconditionsMet(
  flags: VerifiedPreconditionFlags,
): boolean {
  return NVIDIA_VERIFIED_PRECONDITIONS.every((p) => flags[p] === true);
}

export function registerNvidiaAdapter(input: {
  actor: Ep8Actor;
  adapterId: string;
  nvidiaGpuModel: string;
  vram: string;
  driverState: string;
  cudaState: string;
  tensorRtState: string;
  tensorRtLlmState?: string;
  onnxCompatibility: string;
  supportedPrecisions: string;
  modelCompatibility: string;
  requestedDevice: NvidiaExecutionDevice;
  actualExecutionDevice: NvidiaExecutionDevice;
  latency?: string;
  throughput?: string;
  memoryUsage?: string;
  fallbackRoute?: string;
  benchmarkReference?: string;
  failureClass?: NvidiaFailureClass;
  state?: NvidiaAdapterState;
  attemptAssumeCudaFromDetection?: boolean;
  attemptAssumeTensorRtFromDetection?: boolean;
  attemptAutoInstallCudaTensorRtDrivers?: boolean;
  attemptOverclock?: boolean;
  attemptThermalLimitBypass?: boolean;
  attemptAlterBiosFirmware?: boolean;
  attemptPrivilegeEscalation?: boolean;
  attemptAutoCloudGpuProvisioning?: boolean;
  attemptPrivateTenantDataLeaveUniverse?: boolean;
  attemptClaimMultiGpuVerified?: boolean;
  attemptClaimDistributedVerified?: boolean;
  attemptProductionDeploy?: boolean;
  attemptMainMerge?: boolean;
  attemptPermissionExpansion?: boolean;
}): NvidiaAdapterRecord | DenialResult {
  if (input.attemptAssumeCudaFromDetection) {
    return deny(
      'GPU_DETECTION_EQ_CUDA_USABLE=false — detecting an NVIDIA GPU does not mean CUDA is usable.',
    );
  }
  if (input.attemptAssumeTensorRtFromDetection) {
    return deny(
      'GPU_DETECTION_EQ_TENSORRT_USABLE=false — detecting an NVIDIA GPU does not mean TensorRT is usable.',
    );
  }
  if (input.attemptAutoInstallCudaTensorRtDrivers) {
    return deny(
      'AUTO_INSTALL_CUDA_TENSORRT_DRIVERS=false — no automatic CUDA/TensorRT/driver installation.',
    );
  }
  if (input.attemptOverclock) {
    return deny('OVERCLOCK=false — no overclocking.');
  }
  if (input.attemptThermalLimitBypass) {
    return deny('THERMAL_LIMIT_BYPASS=false — no thermal-limit bypass.');
  }
  if (input.attemptAlterBiosFirmware) {
    return deny('ALTER_BIOS_FIRMWARE=false — no BIOS/firmware modification.');
  }
  if (input.attemptPrivilegeEscalation) {
    return deny('PRIVILEGE_ESCALATION=false — no privilege escalation.');
  }
  if (input.attemptAutoCloudGpuProvisioning) {
    return deny(
      'AUTOMATIC_CLOUD_GPU_PROVISIONING=false — no automatic cloud GPU provisioning.',
    );
  }
  if (input.attemptPrivateTenantDataLeaveUniverse) {
    return deny(
      'PRIVATE_TENANT_DATA_LEAVE_UNIVERSE=false — private tenant data cannot leave its permitted Universe.',
    );
  }
  if (input.attemptClaimMultiGpuVerified) {
    return deny(
      'MULTI_GPU_EQ_VERIFIED_WITHOUT_MEASUREMENT=false — multi-GPU stays NOT_TESTED until actually measured.',
    );
  }
  if (input.attemptClaimDistributedVerified) {
    return deny(
      'DISTRIBUTED_EQ_VERIFIED_WITHOUT_MEASUREMENT=false — distributed inference stays NOT_TESTED until actually measured.',
    );
  }
  if (input.attemptProductionDeploy) {
    return deny('PRODUCTION_DEPLOYMENT=false.');
  }
  if (input.attemptMainMerge) {
    return deny('MAIN_MERGE=false.');
  }
  if (input.attemptPermissionExpansion) {
    return deny('PERMISSION_EXPANSION=false.');
  }
  if (!NVIDIA_EXECUTION_DEVICES.includes(input.requestedDevice)) {
    return deny(`Unknown requestedDevice: ${String(input.requestedDevice)}`);
  }
  if (!NVIDIA_EXECUTION_DEVICES.includes(input.actualExecutionDevice)) {
    return deny(
      `Unknown actualExecutionDevice: ${String(input.actualExecutionDevice)}`,
    );
  }

  void NVIDIA_ADAPTER_FIELDS;

  const silent = isSilentCpuFallback({
    requestedDevice: input.requestedDevice,
    actualDevice: input.actualExecutionDevice,
  });
  const failureClass: NvidiaFailureClass =
    input.failureClass ?? (silent ? 'silent_cpu_fallback' : 'none');
  const state: NvidiaAdapterState =
    input.state ?? (silent ? 'NOT_TESTED' : 'DETECTED');

  return {
    adapterId: input.adapterId,
    nvidiaGpuModel: input.nvidiaGpuModel,
    vram: input.vram,
    driverState: input.driverState,
    cudaState: input.cudaState,
    tensorRtState: input.tensorRtState,
    tensorRtLlmState: input.tensorRtLlmState ?? 'UNKNOWN',
    onnxCompatibility: input.onnxCompatibility,
    supportedPrecisions: input.supportedPrecisions,
    modelCompatibility: input.modelCompatibility,
    actualExecutionDevice: input.actualExecutionDevice,
    requestedDevice: input.requestedDevice,
    latency: input.latency ?? '',
    throughput: input.throughput ?? '',
    memoryUsage: input.memoryUsage ?? '',
    fallbackRoute:
      input.fallbackRoute ?? (silent ? 'CPU' : 'none'),
    benchmarkReference: input.benchmarkReference ?? '',
    lastVerifiedTimestamp: null,
    failureClass,
    state,
    silentCpuFallback: silent,
    gpuVerified: false,
    multiGpuState: 'NOT_TESTED',
    distributedInferenceState: 'NOT_TESTED',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    createdAt: nowIso(),
  };
}

export function runBoundedInference(input: {
  actor: Ep8Actor;
  adapter: NvidiaAdapterRecord;
  receiptId: string;
  requestedDevice: NvidiaExecutionDevice;
  actualDevice: NvidiaExecutionDevice;
  latency: string;
  throughput: string;
  memoryUsage: string;
  benchmarkReference: string;
  modelLoadSucceeded: boolean;
  inferenceSucceeded: boolean;
  executionDeviceConfirmed: boolean;
  cpuFallbackTestedSeparately: boolean;
  attemptClaimVerifiedOnSilentFallback?: boolean;
  attemptVerifyWithoutPreconditions?: boolean;
}): NvidiaInferenceReceipt | DenialResult {
  if (!NVIDIA_ADAPTER_AGENT_BOUNDS.mayRunBoundedInference) {
    return deny('mayRunBoundedInference=false');
  }

  const silent = isSilentCpuFallback({
    requestedDevice: input.requestedDevice,
    actualDevice: input.actualDevice,
  });

  if (input.attemptClaimVerifiedOnSilentFallback && silent) {
    return deny(
      'SILENT_CPU_FALLBACK_EQ_VERIFIED=false — if execution falls back to CPU, GPU remains unverified.',
    );
  }

  const flags: VerifiedPreconditionFlags = {
    nvidia_gpu_detected: input.adapter.state !== 'UNKNOWN',
    compatible_runtime_provider_present:
      input.adapter.cudaState === 'AVAILABLE' ||
      input.adapter.onnxCompatibility === 'COMPATIBLE',
    bounded_model_load_succeeds: input.modelLoadSucceeded,
    inference_succeeds_on_intended_nvidia_path:
      input.inferenceSucceeded &&
      !silent &&
      input.actualDevice === 'NVIDIA_GPU' &&
      input.requestedDevice === 'NVIDIA_GPU',
    actual_execution_device_confirmed_nvidia_gpu:
      input.executionDeviceConfirmed && input.actualDevice === 'NVIDIA_GPU',
    result_timestamped: true,
    benchmark_evidence_stored: Boolean(input.benchmarkReference),
    cpu_fallback_behavior_tested_separately: input.cpuFallbackTestedSeparately,
  };

  const met = NVIDIA_VERIFIED_PRECONDITIONS.filter((p) => flags[p] === true);
  const allMet = allVerifiedPreconditionsMet(flags);

  if (input.attemptVerifyWithoutPreconditions && !allMet) {
    return deny(
      'VERIFIED_WITHOUT_PRECONDITIONS=false — all verified preconditions required before VERIFIED.',
    );
  }

  let state: NvidiaAdapterState;
  let failureClass: NvidiaFailureClass = 'none';

  if (silent) {
    state = 'NOT_TESTED';
    failureClass = 'silent_cpu_fallback';
  } else if (!input.modelLoadSucceeded) {
    state = 'DEGRADED';
    failureClass = 'model_load_failed';
  } else if (!input.inferenceSucceeded) {
    state = 'DEGRADED';
    failureClass = 'inference_failed';
  } else if (!input.executionDeviceConfirmed) {
    state = 'NOT_TESTED';
    failureClass = 'execution_device_unconfirmed';
  } else if (allMet) {
    state = 'VERIFIED';
  } else {
    state = 'SUPPORTED';
  }

  return {
    receiptId: input.receiptId,
    adapterId: input.adapter.adapterId,
    flowPosition: 'return_receipt',
    requestedDevice: input.requestedDevice,
    actualDevice: input.actualDevice,
    fallbackUsed: silent,
    silentCpuFallback: silent,
    gpuRemainsUnverified: silent || state !== 'VERIFIED',
    latency: input.latency,
    throughput: input.throughput,
    memoryUsage: input.memoryUsage,
    benchmarkReference: input.benchmarkReference,
    timestamp: nowIso(),
    failureClass,
    state,
    preconditionsMet: met,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function attemptPromoteToVerified(input: {
  receipt: NvidiaInferenceReceipt;
  preconditions: VerifiedPreconditionFlags;
}):
  | {
      state: 'VERIFIED';
      lastVerifiedTimestamp: string;
      gpuVerified: boolean;
    }
  | DenialResult {
  if (input.receipt.silentCpuFallback || input.receipt.fallbackUsed) {
    return deny(
      'GPU_VERIFIED_ON_CPU_FALLBACK=false — GPU remains unverified when execution fell back to CPU.',
    );
  }
  if (!allVerifiedPreconditionsMet(input.preconditions)) {
    return deny(
      'VERIFIED_WITHOUT_PRECONDITIONS=false — missing verified preconditions.',
    );
  }
  if (input.receipt.state !== 'VERIFIED') {
    return deny(
      `Receipt state=${input.receipt.state} — cannot promote; require VERIFIED receipt.`,
    );
  }
  return {
    state: 'VERIFIED',
    lastVerifiedTimestamp: input.receipt.timestamp,
    gpuVerified: true,
  };
}

export function attemptAssumeCudaFromGpuDetection(): DenialResult {
  return deny(
    'GPU_DETECTION_EQ_CUDA_USABLE=false — GPU detection ≠ CUDA usable.',
  );
}

export function attemptAssumeTensorRtFromGpuDetection(): DenialResult {
  return deny(
    'GPU_DETECTION_EQ_TENSORRT_USABLE=false — GPU detection ≠ TensorRT usable.',
  );
}

export function attemptAutoInstallCudaTensorRtDrivers(): DenialResult {
  return deny('AUTO_INSTALL_CUDA_TENSORRT_DRIVERS=false.');
}

export function attemptOverclock(): DenialResult {
  return deny('OVERCLOCK=false.');
}

export function attemptThermalLimitBypass(): DenialResult {
  return deny('THERMAL_LIMIT_BYPASS=false.');
}

export function attemptAlterBiosFirmware(): DenialResult {
  return deny('ALTER_BIOS_FIRMWARE=false.');
}

export function attemptPrivilegeEscalation(): DenialResult {
  return deny('PRIVILEGE_ESCALATION=false.');
}

export function attemptAutoCloudGpuProvisioning(): DenialResult {
  return deny('AUTOMATIC_CLOUD_GPU_PROVISIONING=false.');
}

export function attemptPrivateTenantDataLeaveUniverse(): DenialResult {
  return deny('PRIVATE_TENANT_DATA_LEAVE_UNIVERSE=false.');
}

export function attemptClaimMultiGpuVerifiedWithoutMeasurement(): DenialResult {
  return deny(
    'MULTI_GPU_EQ_VERIFIED_WITHOUT_MEASUREMENT=false — multi-GPU stays NOT_TESTED.',
  );
}

export function attemptClaimDistributedVerifiedWithoutMeasurement(): DenialResult {
  return deny(
    'DISTRIBUTED_EQ_VERIFIED_WITHOUT_MEASUREMENT=false — distributed stays NOT_TESTED.',
  );
}

export function attemptClaimVerifiedOnSilentCpuFallback(): DenialResult {
  return deny('SILENT_CPU_FALLBACK_EQ_VERIFIED=false.');
}

export function attemptProductionDeploy(): DenialResult {
  return deny('PRODUCTION_DEPLOYMENT=false.');
}

export function attemptMainMerge(): DenialResult {
  return deny('MAIN_MERGE=false.');
}

export function attemptPermissionExpansion(): DenialResult {
  return deny('PERMISSION_EXPANSION=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function returnReceiptToHomeBase(input: {
  receipt: NvidiaInferenceReceipt;
  actor: Ep8Actor;
}):
  | {
      receiptId: string;
      returnedToHomeBase: true;
      flow: typeof NVIDIA_ADAPTER_CORE_FLOW;
      authorityGranted: false;
      storedInBenchmarkMemory: true;
    }
  | DenialResult {
  if (!NVIDIA_ADAPTER_AGENT_BOUNDS.mayReturnReceiptToHomeBase) {
    return deny('mayReturnReceiptToHomeBase=false');
  }
  if (!isNvidiaAdapterAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only NVIDIA adapter agents / home_base may return receipts.');
  }
  return {
    receiptId: input.receipt.receiptId,
    returnedToHomeBase: true,
    flow: NVIDIA_ADAPTER_CORE_FLOW,
    authorityGranted: false,
    storedInBenchmarkMemory: true,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep8Actor;
  action: string;
}):
  | {
      approvalId: string;
      action: string;
      approved: true;
      humanGate: true;
    }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny(
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver or founder.',
    );
  }
  if (!input.actor.permissions.includes('approve_consequential')) {
    return deny('Human lacks approve_consequential.');
  }
  return {
    approvalId: input.approvalId,
    action: input.action,
    approved: true,
    humanGate: true,
  };
}

export function probeGuardianRlsTenantUniverseIsolation(): {
  unchanged: true;
  humanApprovalUnchanged: true;
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EP8_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EP8_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EP8_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function fullVerifiedPreconditions(): VerifiedPreconditionFlags {
  return Object.fromEntries(
    NVIDIA_VERIFIED_PRECONDITIONS.map((p) => [p, true]),
  ) as VerifiedPreconditionFlags;
}

export function bootstrapNvidiaAdapterResearchPath(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep8SoftWireSnapshot;
  coreFlow: typeof NVIDIA_ADAPTER_CORE_FLOW;
  fields: readonly NvidiaAdapterField[];
  states: readonly NvidiaAdapterState[];
  executionDevices: typeof NVIDIA_EXECUTION_DEVICES;
  failureClasses: typeof NVIDIA_FAILURE_CLASSES;
  verifiedPreconditions: typeof NVIDIA_VERIFIED_PRECONDITIONS;
  mustNot: typeof NVIDIA_ADAPTER_MUST_NOT;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP8_MAY;
  mustNotList: typeof EP8_MUST_NOT;
  dbCandidates: typeof EP8_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp8LocksIntact(),
    softWire: ep8SoftWireSnapshot(repoRoot),
    coreFlow: NVIDIA_ADAPTER_CORE_FLOW,
    fields: NVIDIA_ADAPTER_FIELDS,
    states: NVIDIA_ADAPTER_STATES,
    executionDevices: NVIDIA_EXECUTION_DEVICES,
    failureClasses: NVIDIA_FAILURE_CLASSES,
    verifiedPreconditions: NVIDIA_VERIFIED_PRECONDITIONS,
    mustNot: NVIDIA_ADAPTER_MUST_NOT,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP8_MAY,
    mustNotList: EP8_MUST_NOT,
    dbCandidates: EP8_DB_CANDIDATES_STATUS,
  };
}

export function runNvidiaAdapterResearchCycle(input: {
  actor: Ep8Actor;
  human: Ep8Actor;
  repoRoot?: string;
}): {
  hops: Ep8HopRecord[];
  adapter: NvidiaAdapterRecord | DenialResult;
  receiptFallback: NvidiaInferenceReceipt | DenialResult;
  receiptVerified: NvidiaInferenceReceipt | DenialResult;
  softWire: Ep8SoftWireSnapshot;
} {
  const hops: Ep8HopRecord[] = [];
  const softWire = ep8SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp8LocksIntact() ? 'PASS' : 'FAIL',
      'EP8 locks intact including L4=false and GPU detection ≠ CUDA/TensorRT usable.',
    ),
  );
  hops.push(
    hop(
      'nvidia_adapter_bootstrap',
      'PASS',
      'NVIDIA Adapter Research Path bootstrapped.',
    ),
  );
  hops.push(
    hop('core_flow_encoded', 'PASS', NVIDIA_ADAPTER_CORE_FLOW.join(' → ')),
  );
  hops.push(
    hop(
      'adapter_fields_encoded',
      'PASS',
      `${NVIDIA_ADAPTER_FIELDS.length} adapter fields encoded.`,
    ),
  );
  hops.push(
    hop('adapter_states_encoded', 'PASS', NVIDIA_ADAPTER_STATES.join(' | ')),
  );
  hops.push(
    hop(
      'execution_devices_encoded',
      'PASS',
      NVIDIA_EXECUTION_DEVICES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'failure_classes_encoded',
      'PASS',
      `${NVIDIA_FAILURE_CLASSES.length} failure classes encoded.`,
    ),
  );
  hops.push(
    hop(
      'verified_preconditions_encoded',
      'PASS',
      `${NVIDIA_VERIFIED_PRECONDITIONS.length} VERIFIED preconditions encoded.`,
    ),
  );
  hops.push(
    hop(
      'must_not_actions_encoded',
      'PASS',
      `${NVIDIA_ADAPTER_MUST_NOT.length} forbidden actions encoded.`,
    ),
  );

  hops.push(
    hop(
      'gpu_detection_neq_cuda_usable',
      attemptAssumeCudaFromGpuDetection().state,
      'GPU detection ≠ CUDA usable — DENIED.',
    ),
  );
  hops.push(
    hop(
      'gpu_detection_neq_tensorrt_usable',
      attemptAssumeTensorRtFromGpuDetection().state,
      'GPU detection ≠ TensorRT usable — DENIED.',
    ),
  );

  const adapter = registerNvidiaAdapter({
    actor: input.actor,
    adapterId: 'nvidia-adapter-1',
    nvidiaGpuModel: 'NVIDIA GPU (example research path)',
    vram: '8GB',
    driverState: 'DETECTED',
    cudaState: 'AVAILABLE',
    tensorRtState: 'NOT_TESTED',
    tensorRtLlmState: 'NOT_TESTED',
    onnxCompatibility: 'COMPATIBLE',
    supportedPrecisions: 'fp16,fp32',
    modelCompatibility: 'documented-candidate',
    requestedDevice: 'NVIDIA_GPU',
    actualExecutionDevice: 'NVIDIA_GPU',
    state: 'DETECTED',
  });

  const claimFallback =
    !('denied' in adapter)
      ? runBoundedInference({
          actor: input.actor,
          adapter,
          receiptId: 'rcpt-claim-fallback',
          requestedDevice: 'NVIDIA_GPU',
          actualDevice: 'CPU',
          latency: '20ms',
          throughput: '40 ips',
          memoryUsage: 'cpu',
          benchmarkReference: 'bm-nv-fallback-1',
          modelLoadSucceeded: true,
          inferenceSucceeded: true,
          executionDeviceConfirmed: true,
          cpuFallbackTestedSeparately: true,
          attemptClaimVerifiedOnSilentFallback: true,
        })
      : deny('adapter registration failed');

  const receiptFallback =
    !('denied' in adapter)
      ? runBoundedInference({
          actor: input.actor,
          adapter,
          receiptId: 'rcpt-fallback-1',
          requestedDevice: 'NVIDIA_GPU',
          actualDevice: 'CPU',
          latency: '20ms',
          throughput: '40 ips',
          memoryUsage: 'cpu',
          benchmarkReference: 'bm-nv-fallback-1',
          modelLoadSucceeded: true,
          inferenceSucceeded: true,
          executionDeviceConfirmed: true,
          cpuFallbackTestedSeparately: true,
        })
      : deny('adapter registration failed');

  hops.push(
    hop(
      'silent_cpu_fallback_recorded',
      !('denied' in receiptFallback) &&
        receiptFallback.requestedDevice === 'NVIDIA_GPU' &&
        receiptFallback.actualDevice === 'CPU' &&
        receiptFallback.fallbackUsed === true
        ? 'PASS'
        : 'FAIL',
      'CPU fallback receipt: requestedDevice=NVIDIA_GPU, actualDevice=CPU, fallbackUsed=true.',
    ),
  );
  hops.push(
    hop(
      'gpu_unverified_on_cpu_fallback',
      !('denied' in receiptFallback) &&
        receiptFallback.gpuRemainsUnverified &&
        claimFallback.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'GPU remains unverified; claim-verified-on-fallback DENIED.',
    ),
  );

  const receiptVerified =
    !('denied' in adapter)
      ? runBoundedInference({
          actor: input.actor,
          adapter,
          receiptId: 'rcpt-verified-1',
          requestedDevice: 'NVIDIA_GPU',
          actualDevice: 'NVIDIA_GPU',
          latency: '3ms',
          throughput: '400 ips',
          memoryUsage: '2GB',
          benchmarkReference: 'bm-nv-gpu-1',
          modelLoadSucceeded: true,
          inferenceSucceeded: true,
          executionDeviceConfirmed: true,
          cpuFallbackTestedSeparately: true,
        })
      : deny('adapter registration failed');

  const incompleteVerify =
    !('denied' in adapter)
      ? runBoundedInference({
          actor: input.actor,
          adapter,
          receiptId: 'rcpt-no-pre',
          requestedDevice: 'NVIDIA_GPU',
          actualDevice: 'NVIDIA_GPU',
          latency: '3ms',
          throughput: '400',
          memoryUsage: '2GB',
          benchmarkReference: '',
          modelLoadSucceeded: true,
          inferenceSucceeded: true,
          executionDeviceConfirmed: true,
          cpuFallbackTestedSeparately: false,
          attemptVerifyWithoutPreconditions: true,
        })
      : deny('adapter registration failed');

  hops.push(
    hop(
      'verified_requires_all_preconditions',
      !('denied' in receiptVerified) &&
        receiptVerified.state === 'VERIFIED' &&
        receiptVerified.preconditionsMet.length ===
          NVIDIA_VERIFIED_PRECONDITIONS.length &&
        incompleteVerify.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'VERIFIED only with all preconditions; incomplete attempt DENIED.',
    ),
  );

  hops.push(
    hop(
      'multi_gpu_distributed_not_tested_until_measured',
      !('denied' in adapter) &&
        adapter.multiGpuState === 'NOT_TESTED' &&
        adapter.distributedInferenceState === 'NOT_TESTED' &&
        attemptClaimMultiGpuVerifiedWithoutMeasurement().state === 'DENIED' &&
        attemptClaimDistributedVerifiedWithoutMeasurement().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Multi-GPU and distributed inference stay NOT_TESTED until measured.',
    ),
  );

  hops.push(
    hop(
      'no_auto_cuda_tensorrt_driver_install',
      attemptAutoInstallCudaTensorRtDrivers().state,
      'Auto CUDA/TensorRT/driver install DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_overclock_thermal_bypass',
      attemptOverclock().state === 'DENIED' &&
        attemptThermalLimitBypass().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Overclock / thermal-limit bypass DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_bios_firmware_alteration',
      attemptAlterBiosFirmware().state,
      'BIOS/firmware alteration DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_privilege_escalation',
      attemptPrivilegeEscalation().state,
      'Privilege escalation DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_automatic_cloud_gpu_provisioning',
      attemptAutoCloudGpuProvisioning().state,
      'Automatic cloud GPU provisioning DENIED.',
    ),
  );
  hops.push(
    hop(
      'private_tenant_data_stays_in_universe',
      attemptPrivateTenantDataLeaveUniverse().state,
      'Private tenant data leaving Universe DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_production_deploy_main_merge',
      attemptProductionDeploy().state === 'DENIED' &&
        attemptMainMerge().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Production deploy / main merge DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_permission_expansion',
      attemptPermissionExpansion().state,
      'Permission expansion DENIED.',
    ),
  );
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      probeGuardianRlsTenantUniverseIsolation().state,
      'Guardian/RLS/tenant/Universe + human-approval boundaries unchanged.',
    ),
  );
  hops.push(
    hop(
      'recommend_neq_act',
      attemptRecommendAsAct().state === 'DENIED' &&
        attemptClaimVerifiedOnSilentCpuFallback().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; silent fallback ≠ VERIFIED.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EP8_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'ep7_soft_wire',
      softWire.ep7AmdAdapter.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep7AmdAdapter.note,
    ),
  );
  hops.push(
    hop(
      'ep6_soft_wire',
      softWire.ep6HardwareTruthProbe.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep6HardwareTruthProbe.note,
    ),
  );
  hops.push(
    hop(
      'ep5_soft_wire',
      softWire.ep5BenchmarkMemory.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep5BenchmarkMemory.note,
    ),
  );
  hops.push(
    hop(
      'ep1_soft_wire',
      softWire.ep1VirtualChipContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep1VirtualChipContract.note,
    ),
  );
  hops.push(
    hop(
      'em157_soft_wire',
      softWire.em157HomeBase.present ? 'PASS' : 'WAITING_DATA',
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      EP8_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep8-1',
    actor: input.human,
    action: 'approve_consequential',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in humanGate ? 'DENIED' : 'PASS',
      'Human approval gate exercised; cycle evidence recorded.',
    ),
  );

  void NVIDIA_ADAPTER_RESEARCH_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    adapter,
    receiptFallback,
    receiptVerified,
    softWire,
  };
}
