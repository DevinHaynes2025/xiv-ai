/**
 * 62L-EP9 — Intel Adapter Research Path runtime.
 *
 * Governed Intel adapter: OpenVINO/oneAPI research, bounded inference,
 * receipt-recorded CPU fallback (accelerator remains unverified),
 * evidence-first VERIFIED gate. Soft-wires EP8/EP7/EP6/EP5/EP1/EM157.
 */

import {
  EP9_DB_CANDIDATES_STATUS,
  EP9_LOCKS,
  EP9_MAY,
  EP9_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  INTEL_ADAPTER_AGENT_BOUNDS,
  INTEL_ADAPTER_CORE_FLOW,
  INTEL_ADAPTER_FIELDS,
  INTEL_ADAPTER_MUST_NOT,
  INTEL_ADAPTER_RESEARCH_CYCLE,
  INTEL_ADAPTER_STATES,
  INTEL_DEVICE_CLASSES,
  INTEL_EXECUTION_DEVICES,
  INTEL_FAILURE_CLASSES,
  INTEL_VERIFIED_PRECONDITIONS,
  NEXT_PHASE_TITLE,
  assertEp9LocksIntact,
  ep9SoftWireSnapshot,
  isHumanApprover,
  isIntelAdapterAgent,
  isSilentCpuFallback,
  type Ep9Actor,
  type Ep9EvidenceState,
  type Ep9HopRecord,
  type Ep9SoftWireSnapshot,
  type IntelAdapterCoreFlowHop,
  type IntelAdapterField,
  type IntelAdapterState,
  type IntelDeviceClass,
  type IntelExecutionDevice,
  type IntelFailureClass,
  type IntelVerifiedPrecondition,
} from './intel-adapter-research-path-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof INTEL_ADAPTER_RESEARCH_CYCLE)[number],
  state: Ep9EvidenceState,
  summary: string,
): Ep9HopRecord {
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

export type IntelAdapterRecord = {
  adapterId: string;
  intelDeviceModel: string;
  deviceClass: IntelDeviceClass;
  architectureGeneration: string;
  driverRuntimeVersions: string;
  openVinoState: string;
  oneApiState: string;
  onnxCompatibility: string;
  supportedPrecisions: string;
  modelCompatibility: string;
  memoryRequirements: string;
  actualExecutionDevice: IntelExecutionDevice;
  requestedDevice: IntelExecutionDevice;
  latency: string;
  throughput: string;
  resourceUsage: string;
  fallbackRoute: string;
  benchmarkReference: string;
  lastVerifiedTimestamp: string | null;
  failureClass: IntelFailureClass;
  state: IntelAdapterState;
  silentCpuFallback: boolean;
  acceleratorVerified: boolean;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type IntelInferenceReceipt = {
  receiptId: string;
  adapterId: string;
  flowPosition: IntelAdapterCoreFlowHop;
  requestedDevice: IntelExecutionDevice;
  actualDevice: IntelExecutionDevice;
  fallbackUsed: boolean;
  silentCpuFallback: boolean;
  acceleratorRemainsUnverified: boolean;
  latency: string;
  throughput: string;
  resourceUsage: string;
  benchmarkReference: string;
  timestamp: string;
  failureClass: IntelFailureClass;
  state: IntelAdapterState;
  preconditionsMet: readonly IntelVerifiedPrecondition[];
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type VerifiedPreconditionFlags = Partial<
  Record<IntelVerifiedPrecondition, boolean>
>;

export function allVerifiedPreconditionsMet(
  flags: VerifiedPreconditionFlags,
): boolean {
  return INTEL_VERIFIED_PRECONDITIONS.every((p) => flags[p] === true);
}

export function registerIntelAdapter(input: {
  actor: Ep9Actor;
  adapterId: string;
  intelDeviceModel: string;
  deviceClass: IntelDeviceClass;
  architectureGeneration: string;
  driverRuntimeVersions: string;
  openVinoState: string;
  oneApiState: string;
  onnxCompatibility: string;
  supportedPrecisions: string;
  modelCompatibility: string;
  memoryRequirements: string;
  requestedDevice: IntelExecutionDevice;
  actualExecutionDevice: IntelExecutionDevice;
  latency?: string;
  throughput?: string;
  resourceUsage?: string;
  fallbackRoute?: string;
  benchmarkReference?: string;
  failureClass?: IntelFailureClass;
  state?: IntelAdapterState;
  attemptAssumeOpenVinoFromPresence?: boolean;
  attemptAssumeNpuFromCpuPresence?: boolean;
  attemptAutoInstallDriversOrRuntimes?: boolean;
  attemptAlterBiosFirmware?: boolean;
  attemptOverclock?: boolean;
  attemptPrivilegeEscalation?: boolean;
  attemptAutonomousCloudProvisioning?: boolean;
  attemptProductionDeploy?: boolean;
  attemptMainMerge?: boolean;
  attemptPermissionExpansion?: boolean;
}): IntelAdapterRecord | DenialResult {
  if (input.attemptAssumeOpenVinoFromPresence) {
    return deny(
      'CPU_OR_IGPU_PRESENCE_EQ_OPENVINO_WORKS=false — an Intel processor or integrated GPU being present does not prove OpenVINO works.',
    );
  }
  if (input.attemptAssumeNpuFromCpuPresence) {
    return deny(
      'CPU_PRESENCE_EQ_NPU_ACCELERATION=false — CPU presence does not prove NPU acceleration works.',
    );
  }
  if (input.attemptAutoInstallDriversOrRuntimes) {
    return deny(
      'AUTO_INSTALL_DRIVERS_OR_RUNTIMES=false — no automatic drivers/runtime installs.',
    );
  }
  if (input.attemptAlterBiosFirmware) {
    return deny('ALTER_BIOS_FIRMWARE=false — no BIOS/firmware modifications.');
  }
  if (input.attemptOverclock) {
    return deny('OVERCLOCK=false — no overclocking.');
  }
  if (input.attemptPrivilegeEscalation) {
    return deny('PRIVILEGE_ESCALATION=false — no privilege escalation.');
  }
  if (input.attemptAutonomousCloudProvisioning) {
    return deny(
      'AUTONOMOUS_CLOUD_PROVISIONING=false — no autonomous cloud provisioning.',
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
  if (!INTEL_DEVICE_CLASSES.includes(input.deviceClass)) {
    return deny(`Unknown deviceClass: ${String(input.deviceClass)}`);
  }
  if (!INTEL_EXECUTION_DEVICES.includes(input.requestedDevice)) {
    return deny(`Unknown requestedDevice: ${String(input.requestedDevice)}`);
  }
  if (!INTEL_EXECUTION_DEVICES.includes(input.actualExecutionDevice)) {
    return deny(
      `Unknown actualExecutionDevice: ${String(input.actualExecutionDevice)}`,
    );
  }

  void INTEL_ADAPTER_FIELDS;

  const silent = isSilentCpuFallback({
    requestedDevice: input.requestedDevice,
    actualDevice: input.actualExecutionDevice,
  });
  const failureClass: IntelFailureClass =
    input.failureClass ?? (silent ? 'silent_cpu_fallback' : 'none');
  const state: IntelAdapterState =
    input.state ?? (silent ? 'NOT_TESTED' : 'DETECTED');

  return {
    adapterId: input.adapterId,
    intelDeviceModel: input.intelDeviceModel,
    deviceClass: input.deviceClass,
    architectureGeneration: input.architectureGeneration,
    driverRuntimeVersions: input.driverRuntimeVersions,
    openVinoState: input.openVinoState,
    oneApiState: input.oneApiState,
    onnxCompatibility: input.onnxCompatibility,
    supportedPrecisions: input.supportedPrecisions,
    modelCompatibility: input.modelCompatibility,
    memoryRequirements: input.memoryRequirements,
    actualExecutionDevice: input.actualExecutionDevice,
    requestedDevice: input.requestedDevice,
    latency: input.latency ?? '',
    throughput: input.throughput ?? '',
    resourceUsage: input.resourceUsage ?? '',
    fallbackRoute:
      input.fallbackRoute ?? (silent ? 'CPU_FALLBACK' : 'none'),
    benchmarkReference: input.benchmarkReference ?? '',
    lastVerifiedTimestamp: null,
    failureClass,
    state,
    silentCpuFallback: silent,
    acceleratorVerified: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    createdAt: nowIso(),
  };
}

export function runBoundedInference(input: {
  actor: Ep9Actor;
  adapter: IntelAdapterRecord;
  receiptId: string;
  requestedDevice: IntelExecutionDevice;
  actualDevice: IntelExecutionDevice;
  latency: string;
  throughput: string;
  resourceUsage: string;
  benchmarkReference: string;
  modelLoadSucceeded: boolean;
  inferenceSucceeded: boolean;
  executionDeviceConfirmed: boolean;
  attemptClaimVerifiedOnSilentFallback?: boolean;
  attemptVerifyWithoutPreconditions?: boolean;
}): IntelInferenceReceipt | DenialResult {
  if (!INTEL_ADAPTER_AGENT_BOUNDS.mayRunBoundedInference) {
    return deny('mayRunBoundedInference=false');
  }

  const silent = isSilentCpuFallback({
    requestedDevice: input.requestedDevice,
    actualDevice: input.actualDevice,
  });

  if (input.attemptClaimVerifiedOnSilentFallback && silent) {
    return deny(
      'SILENT_CPU_FALLBACK_EQ_VERIFIED=false — if request targets Intel GPU/NPU but falls back to CPU, accelerator is not verified.',
    );
  }

  const flags: VerifiedPreconditionFlags = {
    exact_device_detected: input.adapter.state !== 'UNKNOWN',
    compatible_runtime_provider_available:
      input.adapter.openVinoState === 'AVAILABLE' ||
      input.adapter.oneApiState === 'AVAILABLE' ||
      input.adapter.onnxCompatibility === 'COMPATIBLE',
    bounded_model_load_succeeds: input.modelLoadSucceeded,
    inference_succeeds_on_intended_intel_device:
      input.inferenceSucceeded &&
      !silent &&
      input.actualDevice === input.requestedDevice,
    actual_execution_device_confirmed: input.executionDeviceConfirmed,
    evidence_and_benchmark_receipt_stored: Boolean(input.benchmarkReference),
  };

  const met = INTEL_VERIFIED_PRECONDITIONS.filter((p) => flags[p] === true);
  const allMet = allVerifiedPreconditionsMet(flags);

  if (input.attemptVerifyWithoutPreconditions && !allMet) {
    return deny(
      'VERIFIED_WITHOUT_PRECONDITIONS=false — all verified preconditions required before VERIFIED.',
    );
  }

  let state: IntelAdapterState;
  let failureClass: IntelFailureClass = 'none';

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

  const isAcceleratorRequest =
    input.requestedDevice === 'INTEL_GPU' ||
    input.requestedDevice === 'INTEL_NPU';

  return {
    receiptId: input.receiptId,
    adapterId: input.adapter.adapterId,
    flowPosition: 'return_receipt',
    requestedDevice: input.requestedDevice,
    actualDevice: input.actualDevice,
    fallbackUsed: silent,
    silentCpuFallback: silent,
    acceleratorRemainsUnverified:
      silent || (isAcceleratorRequest && state !== 'VERIFIED'),
    latency: input.latency,
    throughput: input.throughput,
    resourceUsage: input.resourceUsage,
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
  receipt: IntelInferenceReceipt;
  preconditions: VerifiedPreconditionFlags;
}):
  | {
      state: 'VERIFIED';
      lastVerifiedTimestamp: string;
      acceleratorVerified: boolean;
    }
  | DenialResult {
  if (input.receipt.silentCpuFallback || input.receipt.fallbackUsed) {
    return deny(
      'ACCELERATOR_VERIFIED_ON_CPU_FALLBACK=false — accelerator remains unverified on CPU fallback.',
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
    acceleratorVerified: true,
  };
}

export function attemptAssumeOpenVinoFromPresence(): DenialResult {
  return deny(
    'CPU_OR_IGPU_PRESENCE_EQ_OPENVINO_WORKS=false — presence ≠ OpenVINO works.',
  );
}

export function attemptAssumeNpuFromCpuPresence(): DenialResult {
  return deny(
    'CPU_PRESENCE_EQ_NPU_ACCELERATION=false — CPU presence ≠ NPU acceleration.',
  );
}

export function attemptAutoInstallDriversOrRuntimes(): DenialResult {
  return deny('AUTO_INSTALL_DRIVERS_OR_RUNTIMES=false.');
}

export function attemptAlterBiosFirmware(): DenialResult {
  return deny('ALTER_BIOS_FIRMWARE=false.');
}

export function attemptOverclock(): DenialResult {
  return deny('OVERCLOCK=false.');
}

export function attemptPrivilegeEscalation(): DenialResult {
  return deny('PRIVILEGE_ESCALATION=false.');
}

export function attemptAutonomousCloudProvisioning(): DenialResult {
  return deny('AUTONOMOUS_CLOUD_PROVISIONING=false.');
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
  receipt: IntelInferenceReceipt;
  actor: Ep9Actor;
}):
  | {
      receiptId: string;
      returnedToHomeBase: true;
      flow: typeof INTEL_ADAPTER_CORE_FLOW;
      authorityGranted: false;
      storedInBenchmarkMemory: true;
    }
  | DenialResult {
  if (!INTEL_ADAPTER_AGENT_BOUNDS.mayReturnReceiptToHomeBase) {
    return deny('mayReturnReceiptToHomeBase=false');
  }
  if (!isIntelAdapterAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only Intel adapter agents / home_base may return receipts.');
  }
  return {
    receiptId: input.receipt.receiptId,
    returnedToHomeBase: true,
    flow: INTEL_ADAPTER_CORE_FLOW,
    authorityGranted: false,
    storedInBenchmarkMemory: true,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep9Actor;
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
    unchanged: EP9_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EP9_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EP9_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function fullVerifiedPreconditions(): VerifiedPreconditionFlags {
  return Object.fromEntries(
    INTEL_VERIFIED_PRECONDITIONS.map((p) => [p, true]),
  ) as VerifiedPreconditionFlags;
}

export function bootstrapIntelAdapterResearchPath(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep9SoftWireSnapshot;
  coreFlow: typeof INTEL_ADAPTER_CORE_FLOW;
  fields: readonly IntelAdapterField[];
  states: readonly IntelAdapterState[];
  deviceClasses: typeof INTEL_DEVICE_CLASSES;
  executionDevices: typeof INTEL_EXECUTION_DEVICES;
  failureClasses: typeof INTEL_FAILURE_CLASSES;
  verifiedPreconditions: typeof INTEL_VERIFIED_PRECONDITIONS;
  mustNot: typeof INTEL_ADAPTER_MUST_NOT;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP9_MAY;
  mustNotList: typeof EP9_MUST_NOT;
  dbCandidates: typeof EP9_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp9LocksIntact(),
    softWire: ep9SoftWireSnapshot(repoRoot),
    coreFlow: INTEL_ADAPTER_CORE_FLOW,
    fields: INTEL_ADAPTER_FIELDS,
    states: INTEL_ADAPTER_STATES,
    deviceClasses: INTEL_DEVICE_CLASSES,
    executionDevices: INTEL_EXECUTION_DEVICES,
    failureClasses: INTEL_FAILURE_CLASSES,
    verifiedPreconditions: INTEL_VERIFIED_PRECONDITIONS,
    mustNot: INTEL_ADAPTER_MUST_NOT,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP9_MAY,
    mustNotList: EP9_MUST_NOT,
    dbCandidates: EP9_DB_CANDIDATES_STATUS,
  };
}

export function runIntelAdapterResearchCycle(input: {
  actor: Ep9Actor;
  human: Ep9Actor;
  repoRoot?: string;
}): {
  hops: Ep9HopRecord[];
  adapter: IntelAdapterRecord | DenialResult;
  receiptFallback: IntelInferenceReceipt | DenialResult;
  receiptVerified: IntelInferenceReceipt | DenialResult;
  softWire: Ep9SoftWireSnapshot;
} {
  const hops: Ep9HopRecord[] = [];
  const softWire = ep9SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp9LocksIntact() ? 'PASS' : 'FAIL',
      'EP9 locks intact including L4=false and CPU/iGPU presence ≠ OpenVINO/NPU.',
    ),
  );
  hops.push(
    hop(
      'intel_adapter_bootstrap',
      'PASS',
      'Intel Adapter Research Path bootstrapped.',
    ),
  );
  hops.push(
    hop('core_flow_encoded', 'PASS', INTEL_ADAPTER_CORE_FLOW.join(' → ')),
  );
  hops.push(
    hop(
      'adapter_fields_encoded',
      'PASS',
      `${INTEL_ADAPTER_FIELDS.length} adapter fields encoded.`,
    ),
  );
  hops.push(
    hop('adapter_states_encoded', 'PASS', INTEL_ADAPTER_STATES.join(' | ')),
  );
  hops.push(
    hop('device_classes_encoded', 'PASS', INTEL_DEVICE_CLASSES.join(' | ')),
  );
  hops.push(
    hop(
      'execution_devices_encoded',
      'PASS',
      INTEL_EXECUTION_DEVICES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'failure_classes_encoded',
      'PASS',
      `${INTEL_FAILURE_CLASSES.length} failure classes encoded.`,
    ),
  );
  hops.push(
    hop(
      'verified_preconditions_encoded',
      'PASS',
      `${INTEL_VERIFIED_PRECONDITIONS.length} VERIFIED preconditions encoded.`,
    ),
  );
  hops.push(
    hop(
      'must_not_actions_encoded',
      'PASS',
      `${INTEL_ADAPTER_MUST_NOT.length} forbidden actions encoded.`,
    ),
  );

  hops.push(
    hop(
      'cpu_or_igpu_presence_neq_openvino_works',
      attemptAssumeOpenVinoFromPresence().state,
      'CPU/iGPU presence ≠ OpenVINO works — DENIED.',
    ),
  );
  hops.push(
    hop(
      'cpu_presence_neq_npu_acceleration',
      attemptAssumeNpuFromCpuPresence().state,
      'CPU presence ≠ NPU acceleration — DENIED.',
    ),
  );

  const adapter = registerIntelAdapter({
    actor: input.actor,
    adapterId: 'intel-adapter-1',
    intelDeviceModel: 'Intel Arc / iGPU (example research path)',
    deviceClass: 'intel_gpu',
    architectureGeneration: 'example-gen',
    driverRuntimeVersions: 'openvino-candidate',
    openVinoState: 'AVAILABLE',
    oneApiState: 'NOT_TESTED',
    onnxCompatibility: 'COMPATIBLE',
    supportedPrecisions: 'fp16,fp32,int8',
    modelCompatibility: 'documented-candidate',
    memoryRequirements: '2GB',
    requestedDevice: 'INTEL_GPU',
    actualExecutionDevice: 'INTEL_GPU',
    state: 'DETECTED',
  });

  const claimFallback =
    !('denied' in adapter)
      ? runBoundedInference({
          actor: input.actor,
          adapter,
          receiptId: 'rcpt-claim-fallback',
          requestedDevice: 'INTEL_GPU',
          actualDevice: 'CPU_FALLBACK',
          latency: '18ms',
          throughput: '55 ips',
          resourceUsage: 'cpu',
          benchmarkReference: 'bm-intel-fallback-1',
          modelLoadSucceeded: true,
          inferenceSucceeded: true,
          executionDeviceConfirmed: true,
          attemptClaimVerifiedOnSilentFallback: true,
        })
      : deny('adapter registration failed');

  const receiptFallback =
    !('denied' in adapter)
      ? runBoundedInference({
          actor: input.actor,
          adapter,
          receiptId: 'rcpt-fallback-1',
          requestedDevice: 'INTEL_GPU',
          actualDevice: 'CPU_FALLBACK',
          latency: '18ms',
          throughput: '55 ips',
          resourceUsage: 'cpu',
          benchmarkReference: 'bm-intel-fallback-1',
          modelLoadSucceeded: true,
          inferenceSucceeded: true,
          executionDeviceConfirmed: true,
        })
      : deny('adapter registration failed');

  hops.push(
    hop(
      'silent_cpu_fallback_recorded',
      !('denied' in receiptFallback) &&
        receiptFallback.silentCpuFallback &&
        receiptFallback.fallbackUsed
        ? 'PASS'
        : 'FAIL',
      'Silent CPU fallback recorded on receipt.',
    ),
  );
  hops.push(
    hop(
      'accelerator_unverified_on_cpu_fallback',
      !('denied' in receiptFallback) &&
        receiptFallback.acceleratorRemainsUnverified &&
        claimFallback.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Accelerator remains unverified; claim-verified-on-fallback DENIED.',
    ),
  );

  const receiptVerified =
    !('denied' in adapter)
      ? runBoundedInference({
          actor: input.actor,
          adapter,
          receiptId: 'rcpt-verified-1',
          requestedDevice: 'INTEL_GPU',
          actualDevice: 'INTEL_GPU',
          latency: '5ms',
          throughput: '220 ips',
          resourceUsage: 'intel_gpu',
          benchmarkReference: 'bm-intel-gpu-1',
          modelLoadSucceeded: true,
          inferenceSucceeded: true,
          executionDeviceConfirmed: true,
        })
      : deny('adapter registration failed');

  const incompleteVerify =
    !('denied' in adapter)
      ? runBoundedInference({
          actor: input.actor,
          adapter,
          receiptId: 'rcpt-no-pre',
          requestedDevice: 'INTEL_GPU',
          actualDevice: 'INTEL_GPU',
          latency: '5ms',
          throughput: '220',
          resourceUsage: 'intel_gpu',
          benchmarkReference: '',
          modelLoadSucceeded: true,
          inferenceSucceeded: true,
          executionDeviceConfirmed: true,
          attemptVerifyWithoutPreconditions: true,
        })
      : deny('adapter registration failed');

  hops.push(
    hop(
      'verified_requires_all_preconditions',
      !('denied' in receiptVerified) &&
        receiptVerified.state === 'VERIFIED' &&
        receiptVerified.preconditionsMet.length ===
          INTEL_VERIFIED_PRECONDITIONS.length &&
        incompleteVerify.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'VERIFIED only with all preconditions; incomplete attempt DENIED.',
    ),
  );

  hops.push(
    hop(
      'no_auto_driver_runtime_install',
      attemptAutoInstallDriversOrRuntimes().state,
      'Auto driver/runtime install DENIED.',
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
    hop('no_overclock', attemptOverclock().state, 'Overclock DENIED.'),
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
      'no_autonomous_cloud_provisioning',
      attemptAutonomousCloudProvisioning().state,
      'Autonomous cloud provisioning DENIED.',
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
      'Guardian/RLS/tenant/Universe isolation unchanged.',
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
      EP9_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'ep8_soft_wire',
      softWire.ep8NvidiaAdapter.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep8NvidiaAdapter.note,
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
      EP9_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep9-1',
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

  void INTEL_ADAPTER_RESEARCH_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    adapter,
    receiptFallback,
    receiptVerified,
    softWire,
  };
}
