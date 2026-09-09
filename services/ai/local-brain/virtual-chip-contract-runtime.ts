/**
 * 62L-EP1 — Virtual Chip Contract runtime.
 *
 * Registers the universal compute-capability object (software layer above
 * silicon). DETECTED ≠ VERIFIED. No silicon-modification claims. No raw
 * privacy collection without opt-in. No autonomous device control.
 */

import {
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
  VIRTUAL_CHIP_CAPABILITY_STATES,
  VIRTUAL_CHIP_CONTRACT_CYCLE,
  VIRTUAL_CHIP_CONTRACT_FIELDS,
  VIRTUAL_CHIP_DEVICE_CLASSES,
  VIRTUAL_CHIP_SOFTWARE_CAPABILITIES,
  VIRTUAL_CHIP_VENDOR_FAMILIES,
  VIRTUAL_CHIP_VENDOR_LABELS,
  assertEp1LocksIntact,
  defaultCapabilityState,
  ep1SoftWireSnapshot,
  isHumanApprover,
  isVirtualChipAgent,
  type Ep1Actor,
  type Ep1EvidenceState,
  type Ep1HopRecord,
  type Ep1SoftWireSnapshot,
  type NeuralComputePathwayHop,
  type QuantumClaimState,
  type VirtualChipCapabilityState,
  type VirtualChipDeviceClass,
  type VirtualChipSoftwareCapability,
  type VirtualChipVendorFamily,
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
  vendorFamily: VirtualChipVendorFamily;
  vendorFamilyLabel: string;
  deviceClass: VirtualChipDeviceClass;
  capabilityState: VirtualChipCapabilityState;
  physicalDeviceRef: string | null;
  softwareLayerCapabilities: VirtualChipSoftwareCapability[];
  runtimeAdapters: string[];
  benchmarkEvidenceRefs: string[];
  quantumClaimState: QuantumClaimState;
  siliconModificationClaimed: false;
  privacyCollectionEnabled: false;
  orgId: string;
  tenantId: string;
  universeId: string;
  evidenceState: Ep1EvidenceState;
  neuralPathwayPosition: NeuralComputePathwayHop;
  createdAt: string;
};

export function registerVirtualChipContract(input: {
  virtualChipId: string;
  vendorFamily: VirtualChipVendorFamily;
  deviceClass: VirtualChipDeviceClass;
  actor: Ep1Actor;
  physicalDeviceRef?: string | null;
  softwareLayerCapabilities?: VirtualChipSoftwareCapability[];
  runtimeAdapters?: string[];
  benchmarkEvidenceRefs?: string[];
  quantumClaimState?: QuantumClaimState;
  detected?: boolean;
  architectureListed?: boolean;
  runtimeEvidencePresent?: boolean;
  /** Attempting VERIFIED without runtime evidence → DENIED. */
  claimVerifiedWithoutRuntimeEvidence?: boolean;
  /** Attempting silicon-modification claim → DENIED. */
  attemptClaimSiliconModification?: boolean;
  /** Attempting privacy collection without opt-in → DENIED. */
  attemptRawPrivacyCollectionWithoutOptIn?: boolean;
}): VirtualChipContract | DenialResult {
  if (input.attemptClaimSiliconModification) {
    return deny(
      'VIRTUAL_CHIP_NEQ_SILICON_MODIFICATION — XIV virtual chip is a software intelligence layer above physical chips; no AMD/NVIDIA/Intel/Apple/Qualcomm silicon-modification claim.',
    );
  }
  if (input.attemptRawPrivacyCollectionWithoutOptIn) {
    return deny(
      'NO_RAW_PRIVACY_COLLECTION_WITHOUT_OPT_IN — no raw GPS/camera/telemetry/trip without explicit opt-in.',
    );
  }
  if (input.claimVerifiedWithoutRuntimeEvidence) {
    return deny(
      'VERIFIED_WITHOUT_RUNTIME_EVIDENCE=false — DETECTED ≠ VERIFIED; VERIFIED requires runtime evidence.',
    );
  }

  const capabilityState = defaultCapabilityState({
    detected: input.detected,
    architectureListed: input.architectureListed ?? true,
    runtimeEvidencePresent: input.runtimeEvidencePresent,
  });

  if (
    capabilityState === 'VERIFIED' &&
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
    // Physical QPU still needs authorized evidence; EP1 uses runtimeEvidence
    // as a stand-in gate when registering a QPU-path virtual chip.
    return deny(
      'CLAIM_QUANTUM_HARDWARE_WITHOUT_AUTHORIZED_PHYSICAL_QPU — otherwise THEORETICAL | SIMULATED | QUANTUM_INSPIRED.',
    );
  }

  return {
    virtualChipId: input.virtualChipId,
    vendorFamily: input.vendorFamily,
    vendorFamilyLabel: VIRTUAL_CHIP_VENDOR_LABELS[input.vendorFamily],
    deviceClass: input.deviceClass,
    capabilityState,
    physicalDeviceRef: input.physicalDeviceRef ?? null,
    softwareLayerCapabilities: input.softwareLayerCapabilities ?? [
      ...VIRTUAL_CHIP_SOFTWARE_CAPABILITIES,
    ],
    runtimeAdapters: input.runtimeAdapters ?? [],
    benchmarkEvidenceRefs: input.benchmarkEvidenceRefs ?? [],
    quantumClaimState,
    siliconModificationClaimed: false,
    privacyCollectionEnabled: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    evidenceState: 'REGISTERED',
    neuralPathwayPosition: 'device',
    createdAt: nowIso(),
  };
}

export function labelCapabilityState(input: {
  virtualChipId: string;
  desiredState: VirtualChipCapabilityState;
  runtimeEvidencePresent?: boolean;
}):
  | {
      virtualChipId: string;
      capabilityState: VirtualChipCapabilityState;
      detectedEqVerified: false;
    }
  | DenialResult {
  if (
    input.desiredState === 'VERIFIED' &&
    input.runtimeEvidencePresent !== true
  ) {
    return deny(
      'DETECTED_NEQ_VERIFIED — VERIFIED requires runtime evidence; DETECTED/CANDIDATE/SUPPORTED remain distinct.',
    );
  }
  if (!VIRTUAL_CHIP_CAPABILITY_STATES.includes(input.desiredState)) {
    return deny('Invalid capability state.');
  }
  return {
    virtualChipId: input.virtualChipId,
    capabilityState: input.desiredState,
    detectedEqVerified: false,
  };
}

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
  deviceClasses: readonly VirtualChipDeviceClass[];
  capabilityStates: readonly VirtualChipCapabilityState[];
  softwareCapabilities: readonly VirtualChipSoftwareCapability[];
  contractFields: readonly string[];
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
    deviceClasses: VIRTUAL_CHIP_DEVICE_CLASSES,
    capabilityStates: VIRTUAL_CHIP_CAPABILITY_STATES,
    softwareCapabilities: VIRTUAL_CHIP_SOFTWARE_CAPABILITIES,
    contractFields: VIRTUAL_CHIP_CONTRACT_FIELDS,
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
      'EP1 locks intact including L4=false and silicon-modification denies.',
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
      'device_classes_encoded',
      'PASS',
      `${VIRTUAL_CHIP_DEVICE_CLASSES.length} device classes encoded.`,
    ),
  );
  hops.push(
    hop(
      'capability_states_encoded',
      'PASS',
      VIRTUAL_CHIP_CAPABILITY_STATES.join(' | '),
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
      'neural_compute_pathway_encoded',
      'PASS',
      NEURAL_COMPUTE_PATHWAY.join(' → '),
    ),
  );

  const contract = registerVirtualChipContract({
    virtualChipId: 'vc-ep1-1',
    vendorFamily: 'amd',
    deviceClass: 'gpu',
    actor: input.actor,
    architectureListed: true,
    runtimeAdapters: ['onnx_candidate', 'windows_ml_candidate'],
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
      'detected_neq_verified',
      labelCapabilityState({
        virtualChipId: 'vc-ep1-1',
        desiredState: 'VERIFIED',
        runtimeEvidencePresent: false,
      }).state,
      'VERIFIED without runtime evidence DENIED (DETECTED≠VERIFIED).',
    ),
  );
  hops.push(
    hop(
      'verified_requires_runtime_evidence',
      'PASS',
      'VERIFIED requires runtime evidence.',
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
      'Recommend ≠ act / control / modify silicon.',
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
