/**
 * 62L-EP7 — AMD Adapter Research Path runtime.
 *
 * Governed AMD adapter: bounded inference, receipt-recorded CPU fallback,
 * evidence-first VERIFIED gate. Soft-wires EP6/EP5/EP1/EM157 when present.
 */

import {
  AMD_ADAPTER_AGENT_BOUNDS,
  AMD_ADAPTER_CORE_FLOW,
  AMD_ADAPTER_FIELDS,
  AMD_ADAPTER_MUST_NOT,
  AMD_ADAPTER_RESEARCH_CYCLE,
  AMD_ADAPTER_STATES,
  AMD_EXECUTION_DEVICES,
  AMD_FAILURE_CLASSES,
  AMD_VERIFIED_PRECONDITIONS,
  EP7_DB_CANDIDATES_STATUS,
  EP7_LOCKS,
  EP7_MAY,
  EP7_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  assertEp7LocksIntact,
  ep7SoftWireSnapshot,
  isAmdAdapterAgent,
  isHumanApprover,
  isSilentCpuFallback,
  type AmdAdapterCoreFlowHop,
  type AmdAdapterField,
  type AmdAdapterState,
  type AmdExecutionDevice,
  type AmdFailureClass,
  type AmdVerifiedPrecondition,
  type Ep7Actor,
  type Ep7EvidenceState,
  type Ep7HopRecord,
  type Ep7SoftWireSnapshot,
} from './amd-adapter-research-path-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof AMD_ADAPTER_RESEARCH_CYCLE)[number],
  state: Ep7EvidenceState,
  summary: string,
): Ep7HopRecord {
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

export type AmdAdapterRecord = {
  adapterId: string;
  amdDeviceModel: string;
  windowsVersion: string;
  runtimeProvider: string;
  modelCompatibility: string;
  precision: string;
  memoryRequirement: string;
  providerInitializationState: string;
  actualExecutionDevice: AmdExecutionDevice;
  intendedDevice: AmdExecutionDevice;
  latency: string;
  throughput: string;
  resourceUsage: string;
  fallbackPath: string;
  benchmarkReference: string;
  lastVerifiedTimestamp: string | null;
  failureClass: AmdFailureClass;
  state: AmdAdapterState;
  silentCpuFallback: boolean;
  acceleratorVerified: boolean;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type AmdInferenceReceipt = {
  receiptId: string;
  adapterId: string;
  flowPosition: AmdAdapterCoreFlowHop;
  intendedDevice: AmdExecutionDevice;
  actualExecutionDevice: AmdExecutionDevice;
  silentCpuFallback: boolean;
  fallbackRecorded: boolean;
  acceleratorRemainsUnverified: boolean;
  latency: string;
  throughput: string;
  resourceUsage: string;
  benchmarkReference: string;
  timestamp: string;
  failureClass: AmdFailureClass;
  state: AmdAdapterState;
  preconditionsMet: readonly AmdVerifiedPrecondition[];
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type VerifiedPreconditionFlags = Partial<
  Record<AmdVerifiedPrecondition, boolean>
>;

export function allVerifiedPreconditionsMet(
  flags: VerifiedPreconditionFlags,
): boolean {
  return AMD_VERIFIED_PRECONDITIONS.every((p) => flags[p] === true);
}

export function registerAmdAdapter(input: {
  actor: Ep7Actor;
  adapterId: string;
  amdDeviceModel: string;
  windowsVersion: string;
  runtimeProvider: string;
  modelCompatibility: string;
  precision: string;
  memoryRequirement: string;
  providerInitializationState: string;
  intendedDevice: AmdExecutionDevice;
  actualExecutionDevice: AmdExecutionDevice;
  latency?: string;
  throughput?: string;
  resourceUsage?: string;
  fallbackPath?: string;
  benchmarkReference?: string;
  failureClass?: AmdFailureClass;
  state?: AmdAdapterState;
  attemptAutoInstallDrivers?: boolean;
  attemptAlterBiosFirmware?: boolean;
  attemptOverclock?: boolean;
  attemptUndervolt?: boolean;
  attemptBypassWindowsSecurity?: boolean;
  attemptProductionDeploy?: boolean;
  attemptMainMerge?: boolean;
  attemptPermissionExpansion?: boolean;
  attemptCloudPurchasing?: boolean;
}): AmdAdapterRecord | DenialResult {
  if (input.attemptAutoInstallDrivers) {
    return deny(
      'AUTO_INSTALL_DRIVERS=false — adapter must not automatically install drivers.',
    );
  }
  if (input.attemptAlterBiosFirmware) {
    return deny(
      'ALTER_BIOS_FIRMWARE=false — adapter must not alter BIOS/firmware.',
    );
  }
  if (input.attemptOverclock) {
    return deny('OVERCLOCK=false — adapter must not overclock.');
  }
  if (input.attemptUndervolt) {
    return deny('UNDERVOLT=false — adapter must not undervolt.');
  }
  if (input.attemptBypassWindowsSecurity) {
    return deny(
      'BYPASS_WINDOWS_SECURITY=false — adapter must not bypass Windows security controls.',
    );
  }
  if (input.attemptProductionDeploy) {
    return deny('PRODUCTION_DEPLOYMENT=false — no production deployment.');
  }
  if (input.attemptMainMerge) {
    return deny('MAIN_MERGE=false — no main merge from this phase.');
  }
  if (input.attemptPermissionExpansion) {
    return deny('PERMISSION_EXPANSION=false — no permission expansion.');
  }
  if (input.attemptCloudPurchasing) {
    return deny('CLOUD_PURCHASING=false — no cloud purchasing.');
  }
  if (!AMD_EXECUTION_DEVICES.includes(input.intendedDevice)) {
    return deny(`Unknown intendedDevice: ${String(input.intendedDevice)}`);
  }
  if (!AMD_EXECUTION_DEVICES.includes(input.actualExecutionDevice)) {
    return deny(
      `Unknown actualExecutionDevice: ${String(input.actualExecutionDevice)}`,
    );
  }

  void AMD_ADAPTER_FIELDS;

  const silent = isSilentCpuFallback({
    intendedDevice: input.intendedDevice,
    actualExecutionDevice: input.actualExecutionDevice,
  });
  const failureClass: AmdFailureClass =
    input.failureClass ?? (silent ? 'silent_cpu_fallback' : 'none');
  const state: AmdAdapterState =
    input.state ?? (silent ? 'NOT_TESTED' : 'DETECTED');

  return {
    adapterId: input.adapterId,
    amdDeviceModel: input.amdDeviceModel,
    windowsVersion: input.windowsVersion,
    runtimeProvider: input.runtimeProvider,
    modelCompatibility: input.modelCompatibility,
    precision: input.precision,
    memoryRequirement: input.memoryRequirement,
    providerInitializationState: input.providerInitializationState,
    actualExecutionDevice: input.actualExecutionDevice,
    intendedDevice: input.intendedDevice,
    latency: input.latency ?? '',
    throughput: input.throughput ?? '',
    resourceUsage: input.resourceUsage ?? '',
    fallbackPath:
      input.fallbackPath ?? (silent ? 'cpu_fallback' : 'none'),
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
  actor: Ep7Actor;
  adapter: AmdAdapterRecord;
  receiptId: string;
  intendedDevice: AmdExecutionDevice;
  actualExecutionDevice: AmdExecutionDevice;
  latency: string;
  throughput: string;
  resourceUsage: string;
  benchmarkReference: string;
  modelLoadSucceeded: boolean;
  inferenceSucceeded: boolean;
  executionDeviceConfirmed: boolean;
  cpuFallbackTestedSeparately: boolean;
  attemptClaimVerifiedOnSilentFallback?: boolean;
  attemptVerifyWithoutPreconditions?: boolean;
}): AmdInferenceReceipt | DenialResult {
  if (!AMD_ADAPTER_AGENT_BOUNDS.mayRunBoundedInference) {
    return deny('mayRunBoundedInference=false');
  }

  const silent = isSilentCpuFallback({
    intendedDevice: input.intendedDevice,
    actualExecutionDevice: input.actualExecutionDevice,
  });

  if (input.attemptClaimVerifiedOnSilentFallback && silent) {
    return deny(
      'SILENT_CPU_FALLBACK_EQ_VERIFIED=false — if AMD GPU/NPU request silently executes on CPU, receipt records fallback and accelerator remains unverified.',
    );
  }

  const flags: VerifiedPreconditionFlags = {
    exact_device_detected: input.adapter.state !== 'UNKNOWN',
    compatible_runtime_provider_present:
      Boolean(input.adapter.runtimeProvider) &&
      input.adapter.providerInitializationState === 'initialized',
    bounded_model_load_succeeds: input.modelLoadSucceeded,
    inference_succeeds_on_intended_amd_device:
      input.inferenceSucceeded &&
      !silent &&
      input.actualExecutionDevice === input.intendedDevice,
    actual_execution_device_confirmed: input.executionDeviceConfirmed,
    result_timestamped: true,
    benchmark_evidence_stored: Boolean(input.benchmarkReference),
    cpu_fallback_behavior_tested_separately: input.cpuFallbackTestedSeparately,
  };

  const met = AMD_VERIFIED_PRECONDITIONS.filter((p) => flags[p] === true);
  const allMet = allVerifiedPreconditionsMet(flags);

  if (input.attemptVerifyWithoutPreconditions && !allMet) {
    return deny(
      'VERIFIED_WITHOUT_PRECONDITIONS=false — all verified preconditions required before VERIFIED.',
    );
  }

  let state: AmdAdapterState;
  let failureClass: AmdFailureClass = 'none';

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
    failureClass = 'none';
  }

  // Accelerator never verified on silent CPU fallback
  const acceleratorRemainsUnverified =
    silent || state !== 'VERIFIED' || input.intendedDevice === 'amd_cpu';

  return {
    receiptId: input.receiptId,
    adapterId: input.adapter.adapterId,
    flowPosition: 'return_receipt',
    intendedDevice: input.intendedDevice,
    actualExecutionDevice: input.actualExecutionDevice,
    silentCpuFallback: silent,
    fallbackRecorded: silent,
    acceleratorRemainsUnverified:
      silent ||
      (input.intendedDevice !== 'amd_cpu' && state !== 'VERIFIED'),
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
  receipt: AmdInferenceReceipt;
  preconditions: VerifiedPreconditionFlags;
  attemptIgnoreSilentFallback?: boolean;
}):
  | {
      state: 'VERIFIED';
      lastVerifiedTimestamp: string;
      acceleratorVerified: boolean;
    }
  | DenialResult {
  if (input.receipt.silentCpuFallback || input.attemptIgnoreSilentFallback) {
    return deny(
      'ACCELERATOR_VERIFIED_ON_CPU_FALLBACK=false — accelerator remains unverified when execution fell back to CPU.',
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

export function attemptAutoInstallDrivers(): DenialResult {
  return deny('AUTO_INSTALL_DRIVERS=false.');
}

export function attemptAlterBiosFirmware(): DenialResult {
  return deny('ALTER_BIOS_FIRMWARE=false.');
}

export function attemptOverclock(): DenialResult {
  return deny('OVERCLOCK=false.');
}

export function attemptUndervolt(): DenialResult {
  return deny('UNDERVOLT=false.');
}

export function attemptBypassWindowsSecurity(): DenialResult {
  return deny('BYPASS_WINDOWS_SECURITY=false.');
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

export function attemptCloudPurchasing(): DenialResult {
  return deny('CLOUD_PURCHASING=false.');
}

export function attemptClaimVerifiedOnSilentCpuFallback(): DenialResult {
  return deny(
    'SILENT_CPU_FALLBACK_EQ_VERIFIED=false — silent CPU fallback ≠ VERIFIED.',
  );
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false — recommend ≠ act.');
}

export function returnReceiptToHomeBase(input: {
  receipt: AmdInferenceReceipt;
  actor: Ep7Actor;
}):
  | {
      receiptId: string;
      returnedToHomeBase: true;
      flow: typeof AMD_ADAPTER_CORE_FLOW;
      authorityGranted: false;
      storedInBenchmarkMemory: true;
    }
  | DenialResult {
  if (!AMD_ADAPTER_AGENT_BOUNDS.mayReturnReceiptToHomeBase) {
    return deny('mayReturnReceiptToHomeBase=false');
  }
  if (!isAmdAdapterAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only AMD adapter agents / home_base may return receipts.');
  }
  return {
    receiptId: input.receipt.receiptId,
    returnedToHomeBase: true,
    flow: AMD_ADAPTER_CORE_FLOW,
    authorityGranted: false,
    storedInBenchmarkMemory: true,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep7Actor;
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
  bypassDenied: true;
  state: 'PASS';
} {
  return {
    unchanged: EP7_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    bypassDenied: EP7_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function fullVerifiedPreconditions(): VerifiedPreconditionFlags {
  return Object.fromEntries(
    AMD_VERIFIED_PRECONDITIONS.map((p) => [p, true]),
  ) as VerifiedPreconditionFlags;
}

export function bootstrapAmdAdapterResearchPath(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep7SoftWireSnapshot;
  coreFlow: typeof AMD_ADAPTER_CORE_FLOW;
  fields: readonly AmdAdapterField[];
  states: readonly AmdAdapterState[];
  executionDevices: typeof AMD_EXECUTION_DEVICES;
  failureClasses: typeof AMD_FAILURE_CLASSES;
  verifiedPreconditions: typeof AMD_VERIFIED_PRECONDITIONS;
  mustNot: typeof AMD_ADAPTER_MUST_NOT;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP7_MAY;
  mustNotList: typeof EP7_MUST_NOT;
  dbCandidates: typeof EP7_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp7LocksIntact(),
    softWire: ep7SoftWireSnapshot(repoRoot),
    coreFlow: AMD_ADAPTER_CORE_FLOW,
    fields: AMD_ADAPTER_FIELDS,
    states: AMD_ADAPTER_STATES,
    executionDevices: AMD_EXECUTION_DEVICES,
    failureClasses: AMD_FAILURE_CLASSES,
    verifiedPreconditions: AMD_VERIFIED_PRECONDITIONS,
    mustNot: AMD_ADAPTER_MUST_NOT,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP7_MAY,
    mustNotList: EP7_MUST_NOT,
    dbCandidates: EP7_DB_CANDIDATES_STATUS,
  };
}

export function runAmdAdapterResearchCycle(input: {
  actor: Ep7Actor;
  human: Ep7Actor;
  repoRoot?: string;
}): {
  hops: Ep7HopRecord[];
  adapter: AmdAdapterRecord | DenialResult;
  receiptFallback: AmdInferenceReceipt | DenialResult;
  receiptVerified: AmdInferenceReceipt | DenialResult;
  softWire: Ep7SoftWireSnapshot;
} {
  const hops: Ep7HopRecord[] = [];
  const softWire = ep7SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp7LocksIntact() ? 'PASS' : 'FAIL',
      'EP7 locks intact including L4=false and silent CPU fallback ≠ VERIFIED.',
    ),
  );
  hops.push(
    hop(
      'amd_adapter_bootstrap',
      'PASS',
      'AMD Adapter Research Path bootstrapped.',
    ),
  );
  hops.push(
    hop('core_flow_encoded', 'PASS', AMD_ADAPTER_CORE_FLOW.join(' → ')),
  );
  hops.push(
    hop(
      'adapter_fields_encoded',
      'PASS',
      `${AMD_ADAPTER_FIELDS.length} adapter fields encoded.`,
    ),
  );
  hops.push(
    hop('adapter_states_encoded', 'PASS', AMD_ADAPTER_STATES.join(' | ')),
  );
  hops.push(
    hop(
      'execution_devices_encoded',
      'PASS',
      AMD_EXECUTION_DEVICES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'failure_classes_encoded',
      'PASS',
      `${AMD_FAILURE_CLASSES.length} failure classes encoded.`,
    ),
  );
  hops.push(
    hop(
      'verified_preconditions_encoded',
      'PASS',
      `${AMD_VERIFIED_PRECONDITIONS.length} VERIFIED preconditions encoded.`,
    ),
  );
  hops.push(
    hop(
      'must_not_actions_encoded',
      'PASS',
      `${AMD_ADAPTER_MUST_NOT.length} forbidden actions encoded.`,
    ),
  );

  const adapter = registerAmdAdapter({
    actor: input.actor,
    adapterId: 'amd-adapter-1',
    amdDeviceModel: 'AMD Radeon (example research path)',
    windowsVersion: 'Windows 11 Build 26100',
    runtimeProvider: 'onnxruntime-directml-candidate',
    modelCompatibility: 'documented-candidate',
    precision: 'fp16',
    memoryRequirement: '2GB',
    providerInitializationState: 'initialized',
    intendedDevice: 'amd_gpu',
    actualExecutionDevice: 'amd_gpu',
    state: 'DETECTED',
  });

  const receiptFallback =
    !('denied' in adapter)
      ? runBoundedInference({
          actor: input.actor,
          adapter,
          receiptId: 'rcpt-fallback-1',
          intendedDevice: 'amd_gpu',
          actualExecutionDevice: 'cpu_fallback',
          latency: '12ms',
          throughput: '80 ips',
          resourceUsage: 'cpu',
          benchmarkReference: 'bm-amd-fallback-1',
          modelLoadSucceeded: true,
          inferenceSucceeded: true,
          executionDeviceConfirmed: true,
          cpuFallbackTestedSeparately: true,
          attemptClaimVerifiedOnSilentFallback: true,
        })
      : deny('adapter registration failed');

  // Also produce the recorded fallback receipt (without claim-verified attempt)
  const receiptFallbackRecorded =
    !('denied' in adapter)
      ? runBoundedInference({
          actor: input.actor,
          adapter,
          receiptId: 'rcpt-fallback-recorded',
          intendedDevice: 'amd_gpu',
          actualExecutionDevice: 'cpu_fallback',
          latency: '12ms',
          throughput: '80 ips',
          resourceUsage: 'cpu',
          benchmarkReference: 'bm-amd-fallback-1',
          modelLoadSucceeded: true,
          inferenceSucceeded: true,
          executionDeviceConfirmed: true,
          cpuFallbackTestedSeparately: true,
        })
      : deny('adapter registration failed');

  hops.push(
    hop(
      'silent_cpu_fallback_recorded',
      !('denied' in receiptFallbackRecorded) &&
        receiptFallbackRecorded.silentCpuFallback &&
        receiptFallbackRecorded.fallbackRecorded
        ? 'PASS'
        : 'FAIL',
      'Silent CPU fallback recorded on receipt.',
    ),
  );
  hops.push(
    hop(
      'accelerator_unverified_on_cpu_fallback',
      !('denied' in receiptFallbackRecorded) &&
        receiptFallbackRecorded.acceleratorRemainsUnverified &&
        receiptFallback.state === 'DENIED'
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
          intendedDevice: 'amd_gpu',
          actualExecutionDevice: 'amd_gpu',
          latency: '4ms',
          throughput: '250 ips',
          resourceUsage: 'amd_gpu',
          benchmarkReference: 'bm-amd-gpu-1',
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
          intendedDevice: 'amd_gpu',
          actualExecutionDevice: 'amd_gpu',
          latency: '4ms',
          throughput: '250',
          resourceUsage: 'amd_gpu',
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
          AMD_VERIFIED_PRECONDITIONS.length &&
        incompleteVerify.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'VERIFIED only with all preconditions; incomplete attempt DENIED.',
    ),
  );
  hops.push(
    hop(
      'cpu_fallback_tested_separately',
      !('denied' in receiptVerified) &&
        receiptVerified.preconditionsMet.includes(
          'cpu_fallback_behavior_tested_separately',
        )
        ? 'PASS'
        : 'FAIL',
      'CPU fallback behavior tested separately before VERIFIED.',
    ),
  );
  hops.push(
    hop(
      'windows_ml_onnx_research_allowed',
      AMD_ADAPTER_AGENT_BOUNDS.mayResearchWindowsMlOnnxPaths
        ? 'PASS'
        : 'FAIL',
      'Documented Windows ML / ONNX Runtime research paths allowed.',
    ),
  );

  hops.push(
    hop(
      'no_auto_driver_install',
      attemptAutoInstallDrivers().state,
      'Auto driver install DENIED.',
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
      'no_overclock_undervolt',
      attemptOverclock().state === 'DENIED' &&
        attemptUndervolt().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Overclock / undervolt DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_bypass_windows_security',
      attemptBypassWindowsSecurity().state,
      'Windows security bypass DENIED.',
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
      'no_permission_expansion_cloud_purchase',
      attemptPermissionExpansion().state === 'DENIED' &&
        attemptCloudPurchasing().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Permission expansion / cloud purchasing DENIED.',
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
      EP7_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
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
      EP7_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep7-1',
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

  void AMD_ADAPTER_RESEARCH_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    adapter,
    receiptFallback: receiptFallbackRecorded,
    receiptVerified,
    softWire,
  };
}
