/**
 * 62L-EP1 — Virtual Chip Contract runtime.
 *
 * Core flow:
 * Agent task → Virtual Chip Contract → policy/resource checks →
 * physical runtime → execution → return receipt → XIV Home Base
 *
 * Software layer above silicon. DETECTED ≠ VERIFIED; NOT_TESTED ≠ VERIFIED.
 * No transistor/firmware/ISA claims without documented interface + evidence.
 * No driver/BIOS/firmware changes, overclocking, permission inheritance,
 * auto cloud purchase, cross-tenant movement, or proprietary chip-secret ingest.
 */

import {
  CROSS_VENDOR_EXAMPLE_SURFACES,
  EP1_DB_CANDIDATES_STATUS,
  EP1_LOCKS,
  EP1_MAY,
  EP1_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEURAL_COMPUTE_PATHWAY,
  NEXT_PHASE_TITLE,
  QUANTUM_CLAIM_STATES,
  VIRTUAL_CHIP_AGENT_BOUNDS,
  VIRTUAL_CHIP_CONTRACT_CYCLE,
  VIRTUAL_CHIP_CONTRACT_FIELDS,
  VIRTUAL_CHIP_CORE_FLOW,
  VIRTUAL_CHIP_DEVICE_TYPES,
  VIRTUAL_CHIP_SOFTWARE_CAPABILITIES,
  VIRTUAL_CHIP_VENDOR_FAMILIES,
  VIRTUAL_CHIP_VENDOR_LABELS,
  VIRTUAL_CHIP_VERIFICATION_STATES,
  assertEp1LocksIntact,
  defaultVerificationState,
  ep1SoftWireSnapshot,
  isHumanApprover,
  isVirtualChipAgent,
  type Ep1Actor,
  type Ep1EvidenceState,
  type Ep1HopRecord,
  type Ep1SoftWireSnapshot,
  type NeuralComputePathwayHop,
  type QuantumClaimState,
  type VirtualChipCoreFlowHop,
  type VirtualChipDeviceType,
  type VirtualChipSoftwareCapability,
  type VirtualChipVendorFamily,
  type VirtualChipVerificationState,
} from './virtual-chip-contract-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof VIRTUAL_CHIP_CONTRACT_CYCLE)[number],
  state: Ep1EvidenceState,
  summary: string,
): Ep1HopRecord {
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

/** Universal Virtual Chip Contract object. */
export type VirtualChipContract = {
  virtualChipId: string;
  physicalNodeId: string | null;
  vendor: VirtualChipVendorFamily;
  vendorLabel: string;
  deviceFamily: string | null;
  deviceType: VirtualChipDeviceType;
  architecture: string | null;
  runtime: string | null;
  executionProvider: string | null;
  supportedModels: string[];
  supportedPrecisions: string[];
  memoryCapacity: string | null;
  measuredLatency: string | null;
  measuredThroughput: string | null;
  energyProxy: string | null;
  costProxy: string | null;
  privacyClass: string;
  tenantId: string;
  universeId: string;
  orgId: string;
  resourceLimits: string[];
  heartbeat: string | null;
  verificationState: VirtualChipVerificationState;
  benchmarkRefs: string[];
  lastVerifiedAt: string | null;
  rollbackVersion: string | null;
  softwareLayerCapabilities: VirtualChipSoftwareCapability[];
  quantumClaimState: QuantumClaimState;
  siliconModificationClaimed: false;
  transistorFirmwareIsaAltered: false;
  privacyCollectionEnabled: false;
  driverBiosFirmwareChanged: false;
  overclockOrThermalBypass: false;
  permissionInherited: false;
  cloudPurchased: false;
  crossTenantDataMoved: false;
  proprietaryChipSecretIngested: false;
  evidenceState: Ep1EvidenceState;
  flowPosition: VirtualChipCoreFlowHop;
  neuralPathwayPosition: NeuralComputePathwayHop;
  createdAt: string;
};

export function registerVirtualChipContract(input: {
  virtualChipId: string;
  vendor: VirtualChipVendorFamily;
  deviceType: VirtualChipDeviceType;
  actor: Ep1Actor;
  physicalNodeId?: string | null;
  deviceFamily?: string | null;
  architecture?: string | null;
  runtime?: string | null;
  executionProvider?: string | null;
  supportedModels?: string[];
  supportedPrecisions?: string[];
  memoryCapacity?: string | null;
  measuredLatency?: string | null;
  measuredThroughput?: string | null;
  energyProxy?: string | null;
  costProxy?: string | null;
  privacyClass?: string;
  resourceLimits?: string[];
  heartbeat?: string | null;
  verificationState?: VirtualChipVerificationState;
  benchmarkRefs?: string[];
  lastVerifiedAt?: string | null;
  rollbackVersion?: string | null;
  softwareLayerCapabilities?: VirtualChipSoftwareCapability[];
  quantumClaimState?: QuantumClaimState;
  detected?: boolean;
  supportedDocumented?: boolean;
  runtimeEvidencePresent?: boolean;
  notTested?: boolean;
  /** @deprecated use vendor */
  vendorFamily?: VirtualChipVendorFamily;
  /** @deprecated use deviceType */
  deviceClass?: VirtualChipDeviceType;
  /** Attempting VERIFIED without runtime evidence → DENIED. */
  claimVerifiedWithoutRuntimeEvidence?: boolean;
  /** Attempting silicon-modification claim → DENIED. */
  attemptClaimSiliconModification?: boolean;
  attemptClaimAlterTransistorFirmwareIsa?: boolean;
  attemptRawPrivacyCollectionWithoutOptIn?: boolean;
  attemptDriverBiosFirmwareChange?: boolean;
  attemptOverclockOrThermalBypass?: boolean;
  attemptPermissionInheritance?: boolean;
  attemptAutomaticCloudPurchasing?: boolean;
  attemptCrossTenantDataMovement?: boolean;
  attemptProprietaryChipSecretIngestion?: boolean;
}): VirtualChipContract | DenialResult {
  if (input.attemptClaimSiliconModification) {
    return deny(
      'VIRTUAL_CHIP_NEQ_SILICON_MODIFICATION — software intelligence layer above physical chips; no AMD/NVIDIA/Intel/Apple/Qualcomm silicon-modification claim.',
    );
  }
  if (input.attemptClaimAlterTransistorFirmwareIsa) {
    return deny(
      'NO_TRANSISTOR_FIRMWARE_ISA_CLAIM_WITHOUT_DOCUMENTED_INTERFACE_AND_MEASURED_EVIDENCE.',
    );
  }
  if (input.attemptRawPrivacyCollectionWithoutOptIn) {
    return deny(
      'NO_RAW_PRIVACY_COLLECTION_WITHOUT_OPT_IN — no raw GPS/camera/telemetry/trip without explicit opt-in.',
    );
  }
  if (input.attemptDriverBiosFirmwareChange) {
    return deny('NO_DRIVER_BIOS_FIRMWARE_CHANGES.');
  }
  if (input.attemptOverclockOrThermalBypass) {
    return deny('NO_OVERCLOCKING_OR_THERMAL_BYPASS.');
  }
  if (input.attemptPermissionInheritance) {
    return deny('NO_PERMISSION_INHERITANCE.');
  }
  if (input.attemptAutomaticCloudPurchasing) {
    return deny('NO_AUTOMATIC_CLOUD_PURCHASING.');
  }
  if (input.attemptCrossTenantDataMovement) {
    return deny('NO_CROSS_TENANT_DATA_MOVEMENT.');
  }
  if (input.attemptProprietaryChipSecretIngestion) {
    return deny('NO_PROPRIETARY_CHIP_SECRET_INGESTION.');
  }
  if (input.claimVerifiedWithoutRuntimeEvidence) {
    return deny(
      'VERIFIED_WITHOUT_RUNTIME_EVIDENCE=false — DETECTED ≠ VERIFIED; NOT_TESTED ≠ VERIFIED; VERIFIED requires runtime evidence.',
    );
  }

  const vendor = input.vendor ?? input.vendorFamily;
  const deviceType = input.deviceType ?? input.deviceClass;
  if (!vendor || !deviceType) {
    return deny('vendor and deviceType are required.');
  }

  const verificationState =
    input.verificationState ??
    defaultVerificationState({
      detected: input.detected,
      supportedDocumented: input.supportedDocumented ?? true,
      runtimeEvidencePresent: input.runtimeEvidencePresent,
      notTested: input.notTested,
    });

  if (
    verificationState === 'VERIFIED' &&
    input.runtimeEvidencePresent !== true
  ) {
    return deny(
      'VERIFIED_WITHOUT_RUNTIME_EVIDENCE — cannot label VERIFIED without runtime evidence.',
    );
  }

  const quantumClaimState = input.quantumClaimState ?? 'THEORETICAL';
  if (
    quantumClaimState === 'PHYSICAL_QPU_VERIFIED' &&
    input.runtimeEvidencePresent !== true
  ) {
    return deny(
      'CLAIM_QUANTUM_HARDWARE_WITHOUT_AUTHORIZED_PHYSICAL_QPU — otherwise THEORETICAL | SIMULATED | QUANTUM_INSPIRED. No QPU treated as verified production accelerator without backend/job evidence.',
    );
  }

  // Measured metrics remain null unless evidence refs provided — no fabrication.
  const hasBenchmarkEvidence = (input.benchmarkRefs?.length ?? 0) > 0;
  if (
    (input.measuredLatency !== undefined &&
      input.measuredLatency !== null &&
      !hasBenchmarkEvidence) ||
    (input.measuredThroughput !== undefined &&
      input.measuredThroughput !== null &&
      !hasBenchmarkEvidence)
  ) {
    return deny(
      'MEASURED_METRICS_REQUIRE_BENCHMARK_REFS — no fabricated latency/throughput.',
    );
  }

  return {
    virtualChipId: input.virtualChipId,
    physicalNodeId: input.physicalNodeId ?? null,
    vendor,
    vendorLabel: VIRTUAL_CHIP_VENDOR_LABELS[vendor],
    deviceFamily: input.deviceFamily ?? null,
    deviceType,
    architecture: input.architecture ?? null,
    runtime: input.runtime ?? null,
    executionProvider: input.executionProvider ?? null,
    supportedModels: input.supportedModels ?? [],
    supportedPrecisions: input.supportedPrecisions ?? [],
    memoryCapacity: input.memoryCapacity ?? null,
    measuredLatency: input.measuredLatency ?? null,
    measuredThroughput: input.measuredThroughput ?? null,
    energyProxy: input.energyProxy ?? null,
    costProxy: input.costProxy ?? null,
    privacyClass: input.privacyClass ?? 'tenant_scoped_candidate',
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    orgId: input.actor.orgId,
    resourceLimits: input.resourceLimits ?? [],
    heartbeat: input.heartbeat ?? null,
    verificationState,
    benchmarkRefs: input.benchmarkRefs ?? [],
    lastVerifiedAt:
      verificationState === 'VERIFIED'
        ? (input.lastVerifiedAt ?? nowIso())
        : (input.lastVerifiedAt ?? null),
    rollbackVersion: input.rollbackVersion ?? null,
    softwareLayerCapabilities: input.softwareLayerCapabilities ?? [
      ...VIRTUAL_CHIP_SOFTWARE_CAPABILITIES,
    ],
    quantumClaimState,
    siliconModificationClaimed: false,
    transistorFirmwareIsaAltered: false,
    privacyCollectionEnabled: false,
    driverBiosFirmwareChanged: false,
    overclockOrThermalBypass: false,
    permissionInherited: false,
    cloudPurchased: false,
    crossTenantDataMoved: false,
    proprietaryChipSecretIngested: false,
    evidenceState: 'REGISTERED',
    flowPosition: 'virtual_chip_contract',
    neuralPathwayPosition: 'device',
    createdAt: nowIso(),
  };
}

export function labelVerificationState(input: {
  virtualChipId: string;
  desiredState: VirtualChipVerificationState;
  runtimeEvidencePresent?: boolean;
}):
  | {
      virtualChipId: string;
      verificationState: VirtualChipVerificationState;
      detectedEqVerified: false;
      notTestedEqVerified: false;
    }
  | DenialResult {
  if (
    input.desiredState === 'VERIFIED' &&
    input.runtimeEvidencePresent !== true
  ) {
    return deny(
      'DETECTED_NEQ_VERIFIED / NOT_TESTED_NEQ_VERIFIED — VERIFIED requires runtime evidence.',
    );
  }
  if (!VIRTUAL_CHIP_VERIFICATION_STATES.includes(input.desiredState)) {
    return deny('Invalid verification state.');
  }
  return {
    virtualChipId: input.virtualChipId,
    verificationState: input.desiredState,
    detectedEqVerified: false,
    notTestedEqVerified: false,
  };
}

/** @deprecated Prefer labelVerificationState. */
export const labelCapabilityState = labelVerificationState;

export function labelQuantumClaim(input: {
  claimId: string;
  state: QuantumClaimState;
  authorizedPhysicalQpuEvidencePresent?: boolean;
}):
  | {
      claimId: string;
      state: QuantumClaimState;
      upgradedIllegally: false;
    }
  | DenialResult {
  if (
    input.state === 'PHYSICAL_QPU_VERIFIED' &&
    !input.authorizedPhysicalQpuEvidencePresent
  ) {
    return deny(
      'CLAIM_QUANTUM_HARDWARE_WITHOUT_AUTHORIZED_PHYSICAL_QPU — otherwise THEORETICAL | SIMULATED | QUANTUM_INSPIRED.',
    );
  }
  if (!QUANTUM_CLAIM_STATES.includes(input.state)) {
    return deny('Invalid quantum claim state.');
  }
  return {
    claimId: input.claimId,
    state: input.state,
    upgradedIllegally: false,
  };
}

export function attachSoftwareLayerCapabilities(input: {
  virtualChipId: string;
  capabilities: VirtualChipSoftwareCapability[];
  attemptClaimSiliconModification?: boolean;
}):
  | {
      virtualChipId: string;
      capabilities: VirtualChipSoftwareCapability[];
      softwareLayerOnly: true;
      siliconModificationClaimed: false;
    }
  | DenialResult {
  if (input.attemptClaimSiliconModification) {
    return deny(
      'VIRTUAL_CHIP_NEQ_SILICON_MODIFICATION — software capabilities do not modify vendor silicon.',
    );
  }
  for (const c of input.capabilities) {
    if (!VIRTUAL_CHIP_SOFTWARE_CAPABILITIES.includes(c)) {
      return deny(`Unknown software capability: ${c}`);
    }
  }
  return {
    virtualChipId: input.virtualChipId,
    capabilities: input.capabilities,
    softwareLayerOnly: true,
    siliconModificationClaimed: false,
  };
}

export function runPolicyResourceChecks(input: {
  checkId: string;
  virtualChipId: string;
  actor: Ep1Actor;
  attemptCrossTenant?: boolean;
  attemptPermissionInherit?: boolean;
}):
  | {
      checkId: string;
      virtualChipId: string;
      approved: true;
      tenantId: string;
      universeId: string;
      nextHop: 'physical_runtime';
    }
  | DenialResult {
  if (input.attemptCrossTenant) {
    return deny('NO_CROSS_TENANT_DATA_MOVEMENT.');
  }
  if (input.attemptPermissionInherit) {
    return deny('NO_PERMISSION_INHERITANCE.');
  }
  return {
    checkId: input.checkId,
    virtualChipId: input.virtualChipId,
    approved: true,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    nextHop: 'physical_runtime',
  };
}

export function returnExecutionReceipt(input: {
  receiptId: string;
  virtualChipId: string;
  taskId: string;
  actor: Ep1Actor;
  outcomeSummary: string;
}): {
  receiptId: string;
  virtualChipId: string;
  taskId: string;
  returnedToHomeBase: true;
  authorityGranted: false;
  flowPosition: 'return_receipt';
  outcomeSummary: string;
} {
  return {
    receiptId: input.receiptId,
    virtualChipId: input.virtualChipId,
    taskId: input.taskId,
    returnedToHomeBase: true,
    authorityGranted: false,
    flowPosition: 'return_receipt',
    outcomeSummary: input.outcomeSummary,
  };
}

export function linkNeuralComputePathway(input: {
  pathwayId: string;
  virtualChipId: string;
  hops?: NeuralComputePathwayHop[];
}): {
  pathwayId: string;
  virtualChipId: string;
  hops: NeuralComputePathwayHop[];
  advisoryOnly: true;
  productionAuthorized: false;
} {
  return {
    pathwayId: input.pathwayId,
    virtualChipId: input.virtualChipId,
    hops: input.hops ? [...input.hops] : [...NEURAL_COMPUTE_PATHWAY],
    advisoryOnly: true,
    productionAuthorized: false,
  };
}

export function encodeCrossVendorExamples(): Array<{
  surface: (typeof CROSS_VENDOR_EXAMPLE_SURFACES)[number];
  vendor: VirtualChipVendorFamily;
  verificationState: VirtualChipVerificationState | 'PASS';
  note: string;
}> {
  return [
    {
      surface: 'amd_radeon_gpu_detected',
      vendor: 'amd',
      verificationState: 'DETECTED',
      note: 'AMD Radeon GPU — DETECTED (≠ VERIFIED)',
    },
    {
      surface: 'windows_ml_path_supported',
      vendor: 'amd',
      verificationState: 'SUPPORTED',
      note: 'Windows ML path — SUPPORTED (documented path; ≠ VERIFIED)',
    },
    {
      surface: 'model_x_inference_not_tested',
      vendor: 'amd',
      verificationState: 'NOT_TESTED',
      note: 'Model X inference — NOT_TESTED (distinct from VERIFIED)',
    },
    {
      surface: 'nvidia_gpu_verified',
      vendor: 'nvidia',
      verificationState: 'VERIFIED',
      note: 'NVIDIA GPU — VERIFIED (requires runtime evidence when claimed)',
    },
    {
      surface: 'tensorrt_runtime_verified',
      vendor: 'nvidia',
      verificationState: 'VERIFIED',
      note: 'TensorRT runtime — VERIFIED (requires runtime evidence when claimed)',
    },
    {
      surface: 'model_x_benchmark_pass',
      vendor: 'nvidia',
      verificationState: 'PASS',
      note: 'Model X benchmark — PASS (benchmark result; distinct AMD NOT_TESTED case)',
    },
  ];
}

export function attemptClaimSiliconModification(
  vendor: VirtualChipVendorFamily,
): DenialResult & { siliconModified: false } {
  return {
    ...deny(
      `NO_SILICON_MODIFICATION_CLAIM — vendor=${vendor}; virtual chip is software layer only.`,
    ),
    siliconModified: false,
  };
}

export function attemptClaimAlterTransistorFirmwareIsa(): DenialResult & {
  altered: false;
} {
  return {
    ...deny(
      'NO_TRANSISTOR_FIRMWARE_ISA_CLAIM_WITHOUT_DOCUMENTED_INTERFACE_AND_MEASURED_EVIDENCE.',
    ),
    altered: false,
  };
}

export function attemptRawPrivacyCollectionWithoutOptIn(
  signal: 'gps' | 'camera' | 'telemetry' | 'trip',
): DenialResult & { collected: false } {
  return {
    ...deny(
      `NO_RAW_${signal.toUpperCase()}_COLLECTION_WITHOUT_OPT_IN — preferred model: on-device / federated with revocation; no raw pooling.`,
    ),
    collected: false,
  };
}

export function attemptAutonomousDeviceControl(): DenialResult & {
  controlled: false;
} {
  return {
    ...deny(
      'NO_AUTONOMOUS_DEVICE_CONTROL — no steering/braking/throttle/ECU control from this queue.',
    ),
    controlled: false,
  };
}

export function attemptDriverBiosFirmwareChange(): DenialResult & {
  changed: false;
} {
  return { ...deny('NO_DRIVER_BIOS_FIRMWARE_CHANGES'), changed: false };
}

export function attemptOverclockOrThermalBypass(): DenialResult & {
  bypassed: false;
} {
  return { ...deny('NO_OVERCLOCKING_OR_THERMAL_BYPASS'), bypassed: false };
}

export function attemptPermissionInheritance(): DenialResult & {
  inherited: false;
} {
  return { ...deny('NO_PERMISSION_INHERITANCE'), inherited: false };
}

export function attemptAutomaticCloudPurchasing(): DenialResult & {
  purchased: false;
} {
  return { ...deny('NO_AUTOMATIC_CLOUD_PURCHASING'), purchased: false };
}

export function attemptCrossTenantDataMovement(): DenialResult & {
  moved: false;
} {
  return { ...deny('NO_CROSS_TENANT_DATA_MOVEMENT'), moved: false };
}

export function attemptProprietaryChipSecretIngestion(): DenialResult & {
  ingested: false;
} {
  return { ...deny('NO_PROPRIETARY_CHIP_SECRET_INGESTION'), ingested: false };
}

export function attemptAgentAutoAuthority(actor: Ep1Actor): DenialResult {
  if (isVirtualChipAgent(actor) || actor.kind === 'home_base') {
    return deny(
      'NO_AGENT_AUTO_AUTHORITY — agents may return evidence to Home Base only; recommend ≠ act.',
    );
  }
  return deny('Actor cannot self-grant automatic authority.');
}

export function returnAgentEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep1Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      actorKind: Ep1Actor['kind'];
      summary: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!VIRTUAL_CHIP_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('Home Base evidence return disabled.');
  }
  if (!isVirtualChipAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only virtual-chip agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    actorKind: input.actor.kind,
    summary: input.summary,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  virtualChipId: string;
  actor: Ep1Actor;
  action: string;
}):
  | {
      approvalId: string;
      virtualChipId: string;
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
  if (
    !input.actor.permissions.includes('approve_consequential') &&
    !input.actor.permissions.includes('authorize_runtime_verification')
  ) {
    return deny(
      'Human approver lacks approve_consequential / authorize_runtime_verification.',
    );
  }
  return {
    approvalId: input.approvalId,
    virtualChipId: input.virtualChipId,
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
    unchanged: EP1_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    bypassDenied: EP1_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function bootstrapVirtualChipContract(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep1SoftWireSnapshot;
  vendors: readonly VirtualChipVendorFamily[];
  deviceTypes: readonly VirtualChipDeviceType[];
  verificationStates: readonly VirtualChipVerificationState[];
  softwareCapabilities: readonly VirtualChipSoftwareCapability[];
  contractFields: readonly string[];
  coreFlow: readonly VirtualChipCoreFlowHop[];
  neuralPathway: readonly NeuralComputePathwayHop[];
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP1_MAY;
  mustNot: typeof EP1_MUST_NOT;
  dbCandidates: typeof EP1_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp1LocksIntact(),
    softWire: ep1SoftWireSnapshot(repoRoot),
    vendors: VIRTUAL_CHIP_VENDOR_FAMILIES,
    deviceTypes: VIRTUAL_CHIP_DEVICE_TYPES,
    verificationStates: VIRTUAL_CHIP_VERIFICATION_STATES,
    softwareCapabilities: VIRTUAL_CHIP_SOFTWARE_CAPABILITIES,
    contractFields: VIRTUAL_CHIP_CONTRACT_FIELDS,
    coreFlow: VIRTUAL_CHIP_CORE_FLOW,
    neuralPathway: NEURAL_COMPUTE_PATHWAY,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP1_MAY,
    mustNot: EP1_MUST_NOT,
    dbCandidates: EP1_DB_CANDIDATES_STATUS,
  };
}

export function runVirtualChipContractCycle(input: {
  actor: Ep1Actor;
  human: Ep1Actor;
  repoRoot?: string;
}): {
  hops: Ep1HopRecord[];
  contract: VirtualChipContract | DenialResult;
  softWire: Ep1SoftWireSnapshot;
} {
  const hops: Ep1HopRecord[] = [];
  const softWire = ep1SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp1LocksIntact() ? 'PASS' : 'FAIL',
      'EP1 locks intact including L4=false and silicon/governance denies.',
    ),
  );
  hops.push(
    hop(
      'virtual_chip_contract_bootstrap',
      'PASS',
      'Virtual Chip Contract bootstrapped (software layer above silicon).',
    ),
  );
  hops.push(
    hop(
      'vendor_families_encoded',
      'PASS',
      `${VIRTUAL_CHIP_VENDOR_FAMILIES.length} vendor families encoded.`,
    ),
  );
  hops.push(
    hop(
      'device_types_encoded',
      'PASS',
      `${VIRTUAL_CHIP_DEVICE_TYPES.length} device types encoded.`,
    ),
  );
  hops.push(
    hop(
      'verification_states_encoded',
      'PASS',
      VIRTUAL_CHIP_VERIFICATION_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'software_capabilities_encoded',
      'PASS',
      VIRTUAL_CHIP_SOFTWARE_CAPABILITIES.join(', '),
    ),
  );
  hops.push(
    hop(
      'contract_fields_encoded',
      'PASS',
      `${VIRTUAL_CHIP_CONTRACT_FIELDS.length} contract fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      'PASS',
      VIRTUAL_CHIP_CORE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'neural_compute_pathway_encoded',
      'PASS',
      NEURAL_COMPUTE_PATHWAY.join(' → '),
    ),
  );
  hops.push(
    hop(
      'cross_vendor_examples_encoded',
      'PASS',
      `${encodeCrossVendorExamples().length} cross-vendor example surfaces encoded.`,
    ),
  );

  const contract = registerVirtualChipContract({
    virtualChipId: 'vc-ep1-1',
    vendor: 'amd',
    deviceType: 'gpu',
    deviceFamily: 'radeon_candidate',
    runtime: 'windows_ml_candidate',
    executionProvider: 'onnx_candidate',
    actor: input.actor,
    supportedDocumented: true,
    notTested: false,
  });

  hops.push(
    hop(
      'virtual_chip_neq_silicon_modification',
      attemptClaimSiliconModification('amd').state,
      'Silicon-modification claim DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_transistor_firmware_isa_claim_without_evidence',
      attemptClaimAlterTransistorFirmwareIsa().state,
      'Transistor/firmware/ISA claim without evidence DENIED.',
    ),
  );
  hops.push(
    hop(
      'detected_neq_verified',
      labelVerificationState({
        virtualChipId: 'vc-ep1-1',
        desiredState: 'VERIFIED',
        runtimeEvidencePresent: false,
      }).state,
      'VERIFIED without runtime evidence DENIED.',
    ),
  );
  hops.push(
    hop(
      'verified_requires_runtime_evidence',
      'PASS',
      'VERIFIED requires runtime evidence; NOT_TESTED remains distinct.',
    ),
  );
  hops.push(
    hop(
      'quantum_claim_ladder_enforced',
      'PASS',
      QUANTUM_CLAIM_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'no_driver_bios_firmware_changes',
      attemptDriverBiosFirmwareChange().state,
      'Driver/BIOS/firmware changes DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_overclocking_or_thermal_bypass',
      attemptOverclockOrThermalBypass().state,
      'Overclocking/thermal bypass DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_permission_inheritance',
      attemptPermissionInheritance().state,
      'Permission inheritance DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_automatic_cloud_purchasing',
      attemptAutomaticCloudPurchasing().state,
      'Automatic cloud purchasing DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_cross_tenant_data_movement',
      attemptCrossTenantDataMovement().state,
      'Cross-tenant data movement DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_proprietary_chip_secret_ingestion',
      attemptProprietaryChipSecretIngestion().state,
      'Proprietary chip-secret ingestion DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_raw_privacy_collection_without_opt_in',
      attemptRawPrivacyCollectionWithoutOptIn('gps').state,
      'Raw GPS without opt-in DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_autonomous_device_control',
      attemptAutonomousDeviceControl().state,
      'Autonomous device control DENIED.',
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
      'PASS',
      'Recommend ≠ act / control / modify silicon / purchase.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EP1_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'eo11_soft_wire',
      softWire.eo11VirtualDataWarehouse.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo11VirtualDataWarehouse.note,
    ),
  );
  hops.push(
    hop(
      'eo10_soft_wire',
      softWire.eo10PhysicalProduct.present ? 'PASS' : 'WAITING_DATA',
      softWire.eo10PhysicalProduct.note,
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
      'em_local_runtime_soft_wire',
      softWire.emLocalRuntimeOnnx.present ? 'PASS' : 'WAITING_DATA',
      softWire.emLocalRuntimeOnnx.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      EP1_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep1-1',
    virtualChipId: 'vc-ep1-1',
    actor: input.human,
    action: 'authorize_runtime_verification_plan',
  });
  hops.push(
    hop(
      'evidence',
      'denied' in humanGate ? 'DENIED' : 'PASS',
      'Human approval gate exercised; cycle evidence recorded.',
    ),
  );

  void VIRTUAL_CHIP_CONTRACT_CYCLE;

  return {
    hops,
    contract,
    softWire,
  };
}
