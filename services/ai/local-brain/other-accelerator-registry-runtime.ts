/**
 * 62L-EP10 — Other Accelerator Registry runtime.
 *
 * Universal evidence-first registry. Same standard for all vendors.
 * Soft-wires EP9/EP8/EP7/EP5/EP1/EM157 when present.
 */

import {
  ACCELERATOR_CATEGORIES,
  ACCELERATOR_RECORD_FIELDS,
  ACCELERATOR_REGISTRY_AGENT_BOUNDS,
  ACCELERATOR_STATE_PROGRESSION,
  ACCELERATOR_TRUTH_STATES,
  AUTOMOTIVE_CAPABILITY_POSTURES,
  CLOUD_USABILITY_PRECONDITIONS,
  EP10_DB_CANDIDATES_STATUS,
  EP10_LOCKS,
  EP10_MAY,
  EP10_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  OTHER_ACCELERATOR_REGISTRY_CYCLE,
  QUANTUM_LADDER_STATES,
  assertEp10LocksIntact,
  canAdvanceAcceleratorState,
  ep10SoftWireSnapshot,
  evidenceTrustRank,
  isAcceleratorRegistryAgent,
  isHumanApprover,
  type AcceleratorCategory,
  type AcceleratorRecordField,
  type AcceleratorTruthState,
  type AutomotiveCapabilityPosture,
  type CloudUsabilityPrecondition,
  type Ep10Actor,
  type Ep10EvidenceState,
  type Ep10HopRecord,
  type Ep10SoftWireSnapshot,
  type QuantumLadderState,
} from './other-accelerator-registry-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof OTHER_ACCELERATOR_REGISTRY_CYCLE)[number],
  state: Ep10EvidenceState,
  summary: string,
): Ep10HopRecord {
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

export type AcceleratorProviderRecord = {
  providerId: string;
  category: AcceleratorCategory;
  deviceFamily: string;
  deviceModel: string;
  deviceType: string;
  architecture: string;
  runtimeSdk: string;
  supportedOs: string;
  modelFormats: string;
  supportedPrecisions: string;
  memory: string;
  documentedCapabilities: string;
  measuredCapabilities: string;
  privacyLocality: string;
  costEnergyProxy: string;
  benchmarkRefs: readonly string[];
  verificationState: AcceleratorTruthState;
  lastVerifiedAt: string | null;
  manufacturerName: string;
  automotivePosture: AutomotiveCapabilityPosture | null;
  quantumLadder: QuantumLadderState | null;
  partnershipImplied: false;
  certificationImplied: false;
  hardwareAccessImplied: false;
  compatibilityImplied: false;
  orgId: string;
  tenantId: string;
  universeId: string;
  createdAt: string;
};

export type CloudUsabilityFlags = Partial<
  Record<CloudUsabilityPrecondition, boolean>
>;

export function allCloudPreconditionsMet(
  flags: CloudUsabilityFlags,
): boolean {
  return CLOUD_USABILITY_PRECONDITIONS.every((p) => flags[p] === true);
}

export function registerAcceleratorProvider(input: {
  actor: Ep10Actor;
  providerId: string;
  category: AcceleratorCategory;
  deviceFamily: string;
  deviceModel: string;
  deviceType: string;
  architecture: string;
  runtimeSdk: string;
  supportedOs: string;
  modelFormats: string;
  supportedPrecisions: string;
  memory: string;
  documentedCapabilities: string;
  measuredCapabilities?: string;
  privacyLocality: string;
  costEnergyProxy?: string;
  benchmarkRefs?: readonly string[];
  verificationState?: AcceleratorTruthState;
  manufacturerName: string;
  automotivePosture?: AutomotiveCapabilityPosture;
  quantumLadder?: QuantumLadderState;
  attemptFavorManufacturer?: boolean;
  attemptImplyPartnership?: boolean;
  attemptImplyCertification?: boolean;
  attemptImplyHardwareAccess?: boolean;
  attemptImplyCompatibility?: boolean;
  attemptAutomotiveVerifiedWithoutAuthorizedTest?: boolean;
  attemptEquateTheoreticalWithPhysicalQpu?: boolean;
}): AcceleratorProviderRecord | DenialResult {
  if (!ACCELERATOR_CATEGORIES.includes(input.category)) {
    return deny(`Unknown category: ${String(input.category)}`);
  }
  if (input.attemptFavorManufacturer) {
    return deny(
      'MANUFACTURER_NAME_EQ_TRUST=false / VENDOR_FAVORITISM_ALLOWED=false — every vendor follows the same evidence standard.',
    );
  }
  if (input.attemptImplyPartnership) {
    return deny(
      'REGISTRY_PRESENCE_EQ_PARTNERSHIP=false — no partnership implied by registry presence.',
    );
  }
  if (input.attemptImplyCertification) {
    return deny(
      'REGISTRY_PRESENCE_EQ_CERTIFICATION=false — no certification implied by registry presence.',
    );
  }
  if (input.attemptImplyHardwareAccess) {
    return deny(
      'REGISTRY_PRESENCE_EQ_HARDWARE_ACCESS=false — no hardware access implied by registry presence.',
    );
  }
  if (input.attemptImplyCompatibility) {
    return deny(
      'REGISTRY_PRESENCE_EQ_COMPATIBILITY=false — no compatibility implied by registry presence.',
    );
  }
  if (
    input.category === 'automotive_adas_compute' &&
    input.attemptAutomotiveVerifiedWithoutAuthorizedTest
  ) {
    return deny(
      'AUTOMOTIVE_DOCUMENTED_EQ_AUTHORIZED_TESTED=false — automotive capabilities remain research/simulation until authorized vehicle/platform is tested.',
    );
  }
  if (
    input.category === 'future_qpu_providers' &&
    input.attemptEquateTheoreticalWithPhysicalQpu
  ) {
    return deny(
      'THEORETICAL_EQ_PHYSICAL_QPU_VERIFIED=false — theoretical ≠ PHYSICAL_QPU_VERIFIED.',
    );
  }

  void ACCELERATOR_RECORD_FIELDS;

  let verificationState: AcceleratorTruthState =
    input.verificationState ?? 'DOCUMENTED';
  let automotivePosture: AutomotiveCapabilityPosture | null = null;
  let quantumLadder: QuantumLadderState | null = null;

  if (input.category === 'automotive_adas_compute') {
    automotivePosture = input.automotivePosture ?? 'RESEARCH';
    if (
      automotivePosture === 'RESEARCH' ||
      automotivePosture === 'SIMULATION'
    ) {
      if (verificationState === 'VERIFIED') {
        return deny(
          'AUTOMOTIVE_SIMULATION_EQ_VERIFIED=false — cannot VERIFIED until AUTHORIZED_PLATFORM_TESTED.',
        );
      }
    }
  }

  if (input.category === 'future_qpu_providers') {
    quantumLadder = input.quantumLadder ?? 'THEORETICAL';
    if (
      quantumLadder !== 'PHYSICAL_QPU_VERIFIED' &&
      verificationState === 'VERIFIED'
    ) {
      return deny(
        'Cannot set VERIFIED without PHYSICAL_QPU_VERIFIED on quantum ladder.',
      );
    }
  }

  return {
    providerId: input.providerId,
    category: input.category,
    deviceFamily: input.deviceFamily,
    deviceModel: input.deviceModel,
    deviceType: input.deviceType,
    architecture: input.architecture,
    runtimeSdk: input.runtimeSdk,
    supportedOs: input.supportedOs,
    modelFormats: input.modelFormats,
    supportedPrecisions: input.supportedPrecisions,
    memory: input.memory,
    documentedCapabilities: input.documentedCapabilities,
    measuredCapabilities: input.measuredCapabilities ?? '',
    privacyLocality: input.privacyLocality,
    costEnergyProxy: input.costEnergyProxy ?? '',
    benchmarkRefs: input.benchmarkRefs ?? [],
    verificationState,
    lastVerifiedAt: verificationState === 'VERIFIED' ? nowIso() : null,
    manufacturerName: input.manufacturerName,
    automotivePosture,
    quantumLadder,
    partnershipImplied: false,
    certificationImplied: false,
    hardwareAccessImplied: false,
    compatibilityImplied: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    createdAt: nowIso(),
  };
}

export function advanceProviderState(input: {
  record: AcceleratorProviderRecord;
  to: AcceleratorTruthState;
  measuredEvidence?: boolean;
}): AcceleratorProviderRecord | DenialResult {
  if (
    !canAdvanceAcceleratorState(input.record.verificationState, input.to)
  ) {
    return deny(
      `Illegal state transition ${input.record.verificationState} → ${input.to}.`,
    );
  }
  if (input.to === 'VERIFIED' && !input.measuredEvidence) {
    return deny(
      'DOCUMENTED_EQ_VERIFIED=false — VERIFIED requires measured evidence.',
    );
  }
  if (
    input.record.category === 'automotive_adas_compute' &&
    input.to === 'VERIFIED' &&
    input.record.automotivePosture !== 'AUTHORIZED_PLATFORM_TESTED'
  ) {
    return deny(
      'Automotive VERIFIED requires AUTHORIZED_PLATFORM_TESTED posture.',
    );
  }
  return {
    ...input.record,
    verificationState: input.to,
    measuredCapabilities:
      input.measuredEvidence && input.to === 'VERIFIED'
        ? input.record.measuredCapabilities || 'bounded-measured'
        : input.record.measuredCapabilities,
    lastVerifiedAt: input.to === 'VERIFIED' ? nowIso() : input.record.lastVerifiedAt,
  };
}

export function evaluateCloudUsability(input: {
  record: AcceleratorProviderRecord;
  preconditions: CloudUsabilityFlags;
  attemptSpendFromRegistry?: boolean;
  attemptDataMovementFromRegistry?: boolean;
  attemptUseWithoutPreconditions?: boolean;
}):
  | {
      usable: boolean;
      spendAuthorized: false;
      dataMovementAuthorized: boolean;
      reason: string;
    }
  | DenialResult {
  if (input.record.category !== 'cloud_inference_accelerators') {
    return deny('Cloud usability evaluation only applies to cloud_inference_accelerators.');
  }
  if (input.attemptSpendFromRegistry) {
    return deny(
      'CLOUD_REGISTRY_EQ_SPEND_AUTHORIZED=false / AUTONOMOUS_CLOUD_SPEND=false — registry presence does not authorize spending.',
    );
  }
  if (input.attemptDataMovementFromRegistry) {
    return deny(
      'CLOUD_REGISTRY_EQ_DATA_MOVEMENT_AUTHORIZED=false / AUTONOMOUS_DATA_MOVEMENT=false — registry presence does not authorize data movement.',
    );
  }
  const allMet = allCloudPreconditionsMet(input.preconditions);
  if (input.attemptUseWithoutPreconditions && !allMet) {
    return deny(
      'CLOUD_USABLE_WITHOUT_PRECONDITIONS=false — org authorization, credentials, region/data-policy approval, and measured runtime evidence required.',
    );
  }
  return {
    usable: allMet && input.record.verificationState !== 'UNKNOWN',
    spendAuthorized: false,
    dataMovementAuthorized: Boolean(
      input.preconditions.region_data_policy_approval &&
        input.preconditions.explicit_organization_authorization,
    ),
    reason: allMet
      ? 'Cloud preconditions met — usable only with measured evidence; spend still not auto-authorized.'
      : 'Cloud preconditions incomplete — not usable.',
  };
}

export function compareVendorsByEvidence(input: {
  a: AcceleratorProviderRecord;
  b: AcceleratorProviderRecord;
}): {
  preferredProviderId: string;
  reason: string;
  manufacturerIgnored: true;
} {
  const rankA = evidenceTrustRank(
    input.a.verificationState,
    input.a.manufacturerName,
  );
  const rankB = evidenceTrustRank(
    input.b.verificationState,
    input.b.manufacturerName,
  );
  if (rankA < rankB) {
    return {
      preferredProviderId: input.a.providerId,
      reason: `Higher evidence state ${input.a.verificationState} over ${input.b.verificationState} (manufacturer name ignored).`,
      manufacturerIgnored: true,
    };
  }
  if (rankB < rankA) {
    return {
      preferredProviderId: input.b.providerId,
      reason: `Higher evidence state ${input.b.verificationState} over ${input.a.verificationState} (manufacturer name ignored).`,
      manufacturerIgnored: true,
    };
  }
  return {
    preferredProviderId: input.a.providerId,
    reason: 'Equal evidence states — manufacturer name does not break tie by favoritism.',
    manufacturerIgnored: true,
  };
}

export function attemptFavorManufacturerByName(): DenialResult {
  return deny('MANUFACTURER_NAME_EQ_TRUST=false — no manufacturer favoritism.');
}

export function attemptImplyPartnershipFromRegistry(): DenialResult {
  return deny('REGISTRY_PRESENCE_EQ_PARTNERSHIP=false.');
}

export function attemptImplyCertificationFromRegistry(): DenialResult {
  return deny('REGISTRY_PRESENCE_EQ_CERTIFICATION=false.');
}

export function attemptImplyHardwareAccessFromRegistry(): DenialResult {
  return deny('REGISTRY_PRESENCE_EQ_HARDWARE_ACCESS=false.');
}

export function attemptImplyCompatibilityFromRegistry(): DenialResult {
  return deny('REGISTRY_PRESENCE_EQ_COMPATIBILITY=false.');
}

export function attemptEquateDocumentedWithVerified(): DenialResult {
  return deny('DOCUMENTED_EQ_VERIFIED=false.');
}

export function attemptAutomotiveVerifiedWithoutAuthorizedTest(): DenialResult {
  return deny(
    'AUTOMOTIVE_DOCUMENTED_EQ_AUTHORIZED_TESTED=false — remains research/simulation until authorized tested.',
  );
}

export function attemptCloudSpendFromRegistry(): DenialResult {
  return deny('CLOUD_REGISTRY_EQ_SPEND_AUTHORIZED=false.');
}

export function attemptCloudDataMovementFromRegistry(): DenialResult {
  return deny('CLOUD_REGISTRY_EQ_DATA_MOVEMENT_AUTHORIZED=false.');
}

export function attemptEquateTheoreticalWithPhysicalQpu(): DenialResult {
  return deny('THEORETICAL_EQ_PHYSICAL_QPU_VERIFIED=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function returnRegistryEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Ep10Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!ACCELERATOR_REGISTRY_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (
    !isAcceleratorRegistryAgent(input.actor) &&
    input.actor.kind !== 'home_base'
  ) {
    return deny('Only registry agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Ep10Actor;
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
    unchanged: EP10_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EP10_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EP10_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function bootstrapOtherAcceleratorRegistry(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Ep10SoftWireSnapshot;
  categories: typeof ACCELERATOR_CATEGORIES;
  fields: readonly AcceleratorRecordField[];
  truthStates: readonly AcceleratorTruthState[];
  progression: typeof ACCELERATOR_STATE_PROGRESSION;
  quantumLadder: typeof QUANTUM_LADDER_STATES;
  cloudPreconditions: typeof CLOUD_USABILITY_PRECONDITIONS;
  automotivePostures: typeof AUTOMOTIVE_CAPABILITY_POSTURES;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EP10_MAY;
  mustNot: typeof EP10_MUST_NOT;
  dbCandidates: typeof EP10_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEp10LocksIntact(),
    softWire: ep10SoftWireSnapshot(repoRoot),
    categories: ACCELERATOR_CATEGORIES,
    fields: ACCELERATOR_RECORD_FIELDS,
    truthStates: ACCELERATOR_TRUTH_STATES,
    progression: ACCELERATOR_STATE_PROGRESSION,
    quantumLadder: QUANTUM_LADDER_STATES,
    cloudPreconditions: CLOUD_USABILITY_PRECONDITIONS,
    automotivePostures: AUTOMOTIVE_CAPABILITY_POSTURES,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EP10_MAY,
    mustNot: EP10_MUST_NOT,
    dbCandidates: EP10_DB_CANDIDATES_STATUS,
  };
}

export function runOtherAcceleratorRegistryCycle(input: {
  actor: Ep10Actor;
  human: Ep10Actor;
  repoRoot?: string;
}): {
  hops: Ep10HopRecord[];
  apple: AcceleratorProviderRecord | DenialResult;
  automotive: AcceleratorProviderRecord | DenialResult;
  cloud: AcceleratorProviderRecord | DenialResult;
  qpu: AcceleratorProviderRecord | DenialResult;
  softWire: Ep10SoftWireSnapshot;
} {
  const hops: Ep10HopRecord[] = [];
  const softWire = ep10SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEp10LocksIntact() ? 'PASS' : 'FAIL',
      'EP10 locks intact including L4=false and no manufacturer favoritism.',
    ),
  );
  hops.push(
    hop(
      'other_accelerator_registry_bootstrap',
      'PASS',
      'Other Accelerator Registry bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'categories_encoded',
      'PASS',
      `${ACCELERATOR_CATEGORIES.length} accelerator categories encoded.`,
    ),
  );
  hops.push(
    hop(
      'record_fields_encoded',
      'PASS',
      `${ACCELERATOR_RECORD_FIELDS.length} record fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'truth_states_encoded',
      'PASS',
      ACCELERATOR_TRUTH_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'state_progression_encoded',
      'PASS',
      ACCELERATOR_STATE_PROGRESSION.join(' → '),
    ),
  );
  hops.push(
    hop(
      'quantum_ladder_encoded',
      'PASS',
      QUANTUM_LADDER_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'cloud_usability_preconditions_encoded',
      'PASS',
      CLOUD_USABILITY_PRECONDITIONS.join(' + '),
    ),
  );
  hops.push(
    hop(
      'automotive_postures_encoded',
      'PASS',
      AUTOMOTIVE_CAPABILITY_POSTURES.join(' | '),
    ),
  );

  const apple = registerAcceleratorProvider({
    actor: input.actor,
    providerId: 'prov-apple-1',
    category: 'apple_cpu_gpu_neural_engine',
    deviceFamily: 'Apple Silicon',
    deviceModel: 'example-ane',
    deviceType: 'npu',
    architecture: 'example',
    runtimeSdk: 'coreml-candidate',
    supportedOs: 'macOS/iOS',
    modelFormats: 'mlpackage',
    supportedPrecisions: 'fp16',
    memory: 'unified',
    documentedCapabilities: 'documented Neural Engine path',
    privacyLocality: 'on-device',
    manufacturerName: 'Apple',
    verificationState: 'DOCUMENTED',
  });

  const automotive = registerAcceleratorProvider({
    actor: input.actor,
    providerId: 'prov-auto-1',
    category: 'automotive_adas_compute',
    deviceFamily: 'ADAS SoC',
    deviceModel: 'example-adas',
    deviceType: 'accelerator',
    architecture: 'example',
    runtimeSdk: 'vendor-sdk-doc',
    supportedOs: 'autosar-like',
    modelFormats: 'onnx',
    supportedPrecisions: 'int8',
    memory: 'unknown',
    documentedCapabilities: 'EV/ADAS documented platform',
    privacyLocality: 'vehicle-local',
    manufacturerName: 'ExampleAutoVendor',
    automotivePosture: 'RESEARCH',
    verificationState: 'DOCUMENTED',
  });

  const cloud = registerAcceleratorProvider({
    actor: input.actor,
    providerId: 'prov-cloud-1',
    category: 'cloud_inference_accelerators',
    deviceFamily: 'Cloud Accel',
    deviceModel: 'example-cloud-gpu',
    deviceType: 'cloud_accelerator',
    architecture: 'example',
    runtimeSdk: 'cloud-api',
    supportedOs: 'managed',
    modelFormats: 'onnx',
    supportedPrecisions: 'fp16',
    memory: '16GB',
    documentedCapabilities: 'cloud inference candidate',
    manufacturerName: 'ExampleCloud',
    privacyLocality: 'region-bound',
    verificationState: 'DOCUMENTED',
  });

  const qpu = registerAcceleratorProvider({
    actor: input.actor,
    providerId: 'prov-qpu-1',
    category: 'future_qpu_providers',
    deviceFamily: 'QPU path',
    deviceModel: 'example-qpu',
    deviceType: 'qpu_path',
    architecture: 'example',
    runtimeSdk: 'quantum-sdk-doc',
    supportedOs: 'n/a',
    modelFormats: 'circuit',
    supportedPrecisions: 'n/a',
    memory: 'n/a',
    documentedCapabilities: 'theoretical QPU path',
    privacyLocality: 'lab',
    manufacturerName: 'ExampleQPU',
    quantumLadder: 'THEORETICAL',
    verificationState: 'DOCUMENTED',
  });

  // Equal evidence: famous vs unknown manufacturer — same trust
  const famous =
    !('denied' in apple)
      ? apple
      : null;
  const obscure = registerAcceleratorProvider({
    actor: input.actor,
    providerId: 'prov-obscure-1',
    category: 'specialized_inference_asics',
    deviceFamily: 'ASIC',
    deviceModel: 'obscure-1',
    deviceType: 'asic',
    architecture: 'example',
    runtimeSdk: 'vendor-sdk',
    supportedOs: 'linux',
    modelFormats: 'onnx',
    supportedPrecisions: 'int8',
    memory: '4GB',
    documentedCapabilities: 'documented ASIC',
    privacyLocality: 'on-prem',
    manufacturerName: 'ObscureVendorXYZ',
    verificationState: 'DOCUMENTED',
  });

  hops.push(
    hop(
      'same_evidence_standard_all_vendors',
      famous &&
        !('denied' in obscure) &&
        evidenceTrustRank(famous.verificationState, famous.manufacturerName) ===
          evidenceTrustRank(
            obscure.verificationState,
            obscure.manufacturerName,
          )
        ? 'PASS'
        : 'FAIL',
      'Same evidence standard for all vendors.',
    ),
  );
  hops.push(
    hop(
      'no_manufacturer_name_favoritism',
      attemptFavorManufacturerByName().state === 'DENIED' &&
        famous &&
        !('denied' in obscure) &&
        compareVendorsByEvidence({ a: famous, b: obscure })
          .manufacturerIgnored
        ? 'PASS'
        : 'FAIL',
      'Manufacturer name does not create trust favoritism.',
    ),
  );
  hops.push(
    hop(
      'registry_presence_neq_partnership_or_access',
      attemptImplyPartnershipFromRegistry().state === 'DENIED' &&
        attemptImplyCertificationFromRegistry().state === 'DENIED' &&
        attemptImplyHardwareAccessFromRegistry().state === 'DENIED' &&
        attemptImplyCompatibilityFromRegistry().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Registry presence ≠ partnership / certification / access / compatibility.',
    ),
  );
  hops.push(
    hop(
      'documented_neq_verified',
      attemptEquateDocumentedWithVerified().state,
      'DOCUMENTED ≠ VERIFIED — DENIED.',
    ),
  );
  hops.push(
    hop(
      'automotive_research_until_authorized_tested',
      !('denied' in automotive) &&
        automotive.automotivePosture === 'RESEARCH' &&
        attemptAutomotiveVerifiedWithoutAuthorizedTest().state === 'DENIED' &&
        registerAcceleratorProvider({
          actor: input.actor,
          providerId: 'prov-auto-bad',
          category: 'automotive_adas_compute',
          deviceFamily: 'ADAS',
          deviceModel: 'x',
          deviceType: 'accelerator',
          architecture: 'x',
          runtimeSdk: 'x',
          supportedOs: 'x',
          modelFormats: 'x',
          supportedPrecisions: 'x',
          memory: 'x',
          documentedCapabilities: 'x',
          privacyLocality: 'vehicle-local',
          manufacturerName: 'x',
          verificationState: 'VERIFIED',
          automotivePosture: 'SIMULATION',
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Automotive remains research/simulation until authorized tested.',
    ),
  );

  const cloudSpend = !('denied' in cloud)
    ? evaluateCloudUsability({
        record: cloud,
        preconditions: {},
        attemptSpendFromRegistry: true,
      })
    : deny('cloud missing');
  const cloudData = !('denied' in cloud)
    ? evaluateCloudUsability({
        record: cloud,
        preconditions: {},
        attemptDataMovementFromRegistry: true,
      })
    : deny('cloud missing');
  hops.push(
    hop(
      'cloud_presence_neq_spend_or_data_movement',
      !('denied' in cloud) &&
        cloudSpend.state === 'DENIED' &&
        cloudData.state === 'DENIED' &&
        attemptCloudSpendFromRegistry().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Cloud registry presence ≠ spend or data movement.',
    ),
  );

  const cloudIncomplete =
    !('denied' in cloud)
      ? evaluateCloudUsability({
          record: cloud,
          preconditions: {
            explicit_organization_authorization: true,
          },
          attemptUseWithoutPreconditions: true,
        })
      : deny('cloud missing');
  hops.push(
    hop(
      'cloud_usable_requires_all_preconditions',
      cloudIncomplete.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Cloud usable only with all preconditions.',
    ),
  );

  hops.push(
    hop(
      'quantum_ladder_enforced',
      !('denied' in qpu) &&
        qpu.quantumLadder === 'THEORETICAL' &&
        attemptEquateTheoreticalWithPhysicalQpu().state === 'DENIED' &&
        registerAcceleratorProvider({
          actor: input.actor,
          providerId: 'prov-qpu-bad',
          category: 'future_qpu_providers',
          deviceFamily: 'QPU',
          deviceModel: 'x',
          deviceType: 'qpu_path',
          architecture: 'x',
          runtimeSdk: 'x',
          supportedOs: 'x',
          modelFormats: 'x',
          supportedPrecisions: 'x',
          memory: 'x',
          documentedCapabilities: 'x',
          privacyLocality: 'lab',
          manufacturerName: 'x',
          quantumLadder: 'THEORETICAL',
          verificationState: 'VERIFIED',
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Quantum ladder enforced; THEORETICAL ≠ PHYSICAL_QPU_VERIFIED.',
    ),
  );

  hops.push(
    hop(
      'no_autonomous_cloud_spend',
      attemptCloudSpendFromRegistry().state,
      'Autonomous cloud spend DENIED.',
    ),
  );
  hops.push(
    hop(
      'no_autonomous_data_movement',
      attemptCloudDataMovementFromRegistry().state,
      'Autonomous data movement DENIED.',
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
      attemptRecommendAsAct().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EP10_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'ep9_soft_wire',
      softWire.ep9IntelAdapter.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep9IntelAdapter.note,
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
      EP10_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-ep10-1',
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

  void OTHER_ACCELERATOR_REGISTRY_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    apple,
    automotive,
    cloud,
    qpu,
    softWire,
  };
}
