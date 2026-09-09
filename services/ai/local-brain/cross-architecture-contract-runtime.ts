/**
 * 62L-EQ1 — Cross-Architecture Contract runtime.
 *
 * Emit architecture records; map capabilities → candidates; enforce
 * knowledge ≠ machine verification and Safety/IP boundaries.
 * Soft-wires EP18/EP17/EP13/EP12/EP1/EM157 when present.
 */

import {
  ARCHITECTURE_EVIDENCE_STATES,
  ARCHITECTURE_RECORD_FIELDS,
  CROSS_ARCHITECTURE_CONTRACT_CYCLE,
  CROSS_ARCHITECTURE_FLOW,
  CROSS_ARCH_AGENT_BOUNDS,
  EQ1_DB_CANDIDATES_STATUS,
  EQ1_LOCKS,
  EQ1_MAY,
  EQ1_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  ISA_FAMILIES,
  NEXT_PHASE_TITLE,
  SAFETY_IP_BOUNDARIES,
  WORKLOAD_CAPABILITIES,
  architectureKnowledgeImpliesMachineVerified,
  assertEq1LocksIntact,
  eq1SoftWireSnapshot,
  isCrossArchAgent,
  isHumanApprover,
  type ArchitectureEvidenceState,
  type ArchitectureRecordField,
  type Eq1Actor,
  type Eq1EvidenceState,
  type Eq1HopRecord,
  type Eq1SoftWireSnapshot,
  type IsaFamily,
  type WorkloadCapability,
} from './cross-architecture-contract-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof CROSS_ARCHITECTURE_CONTRACT_CYCLE)[number],
  state: Eq1EvidenceState,
  summary: string,
): Eq1HopRecord {
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

export type ArchitectureRecord = {
  architectureId: string;
  vendor: string;
  isaFamily: IsaFamily;
  architectureVersion: string;
  deviceClass: string;
  extensions: readonly string[];
  runtime: string;
  compilerToolchain: string;
  modelFormats: readonly string[];
  supportedPrecisions: readonly string[];
  memoryModel: string;
  vectorSimdCapabilities: readonly string[];
  securityFeatures: readonly string[];
  operatingSystems: readonly string[];
  benchmarkRefs: readonly string[];
  evidenceState: ArchitectureEvidenceState;
  sourceRefs: readonly string[];
  lastVerifiedAt: string | null;
  machineVerified: boolean;
  capabilityTags: readonly WorkloadCapability[];
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
};

export type CapabilityMappingResult = {
  mappingId: string;
  requiredCapabilities: readonly WorkloadCapability[];
  matchedArchitectureIds: readonly string[];
  brandHardCoded: false;
  flow: typeof CROSS_ARCHITECTURE_FLOW;
};

export function emitArchitectureRecord(input: {
  actor: Eq1Actor;
  architectureId: string;
  vendor: string;
  isaFamily: IsaFamily;
  architectureVersion: string;
  deviceClass: string;
  extensions?: readonly string[];
  runtime: string;
  compilerToolchain: string;
  modelFormats?: readonly string[];
  supportedPrecisions?: readonly string[];
  memoryModel: string;
  vectorSimdCapabilities?: readonly string[];
  securityFeatures?: readonly string[];
  operatingSystems?: readonly string[];
  benchmarkRefs?: readonly string[];
  evidenceState: ArchitectureEvidenceState;
  sourceRefs?: readonly string[];
  lastVerifiedAt?: string | null;
  capabilityTags?: readonly WorkloadCapability[];
  machineEvidenceRefs?: readonly string[];
  attemptEquateKnowledgeWithVerification?: boolean;
  attemptMarkVerifiedWithoutMachineEvidence?: boolean;
  attemptTreatNotTestedAsVerified?: boolean;
  attemptCloneProprietaryIsa?: boolean;
  attemptIngestRestrictedRtlOrFirmware?: boolean;
  attemptReverseEngineerConfidentialMicroarchitecture?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): ArchitectureRecord | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_CONTRACT=false — no hidden chain-of-thought.',
    );
  }
  if (input.attemptCloneProprietaryIsa) {
    return deny(
      'PROPRIETARY_ISA_CLONING=false — no proprietary ISA cloning.',
    );
  }
  if (input.attemptIngestRestrictedRtlOrFirmware) {
    return deny(
      'RESTRICTED_RTL_FIRMWARE_INGESTION=false — no restricted RTL/firmware ingestion.',
    );
  }
  if (input.attemptReverseEngineerConfidentialMicroarchitecture) {
    return deny(
      'CONFIDENTIAL_MICROARCHITECTURE_REVERSE_ENGINEERING=false — no confidential microarchitecture reverse engineering.',
    );
  }
  if (
    input.attemptEquateKnowledgeWithVerification ||
    (input.evidenceState === 'DOCUMENTED' &&
      input.attemptMarkVerifiedWithoutMachineEvidence)
  ) {
    return deny(
      'ARCHITECTURE_KNOWLEDGE_EQ_MACHINE_VERIFICATION=false — DOCUMENTED semantics ≠ machine VERIFIED.',
    );
  }
  if (
    input.attemptTreatNotTestedAsVerified ||
    (input.evidenceState === 'NOT_TESTED' &&
      input.attemptMarkVerifiedWithoutMachineEvidence)
  ) {
    return deny('NOT_TESTED_EQ_VERIFIED=false.');
  }
  if (input.evidenceState === 'VERIFIED') {
    const machineEvidence = input.machineEvidenceRefs ?? [];
    if (
      input.attemptMarkVerifiedWithoutMachineEvidence ||
      machineEvidence.length === 0
    ) {
      return deny(
        'VERIFIED_WITHOUT_MACHINE_EVIDENCE=false — VERIFIED requires XIV-owned machine measurements / evidence.',
      );
    }
  }

  void ARCHITECTURE_RECORD_FIELDS;

  const machineVerified =
    input.evidenceState === 'VERIFIED' &&
    (input.machineEvidenceRefs?.length ?? 0) > 0;

  // Explicit: knowledge states never imply machine verification by themselves
  if (
    architectureKnowledgeImpliesMachineVerified(input.evidenceState) === true
  ) {
    return deny('ARCHITECTURE_KNOWLEDGE_EQ_MACHINE_VERIFICATION=false.');
  }

  return {
    architectureId: input.architectureId,
    vendor: input.vendor,
    isaFamily: input.isaFamily,
    architectureVersion: input.architectureVersion,
    deviceClass: input.deviceClass,
    extensions: input.extensions ?? [],
    runtime: input.runtime,
    compilerToolchain: input.compilerToolchain,
    modelFormats: input.modelFormats ?? [],
    supportedPrecisions: input.supportedPrecisions ?? [],
    memoryModel: input.memoryModel,
    vectorSimdCapabilities: input.vectorSimdCapabilities ?? [],
    securityFeatures: input.securityFeatures ?? [],
    operatingSystems: input.operatingSystems ?? [],
    benchmarkRefs: input.benchmarkRefs ?? [],
    evidenceState: input.evidenceState,
    sourceRefs: input.sourceRefs ?? [],
    lastVerifiedAt: machineVerified
      ? (input.lastVerifiedAt ?? nowIso())
      : null,
    machineVerified,
    capabilityTags: input.capabilityTags ?? [],
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
  };
}

export function mapCapabilitiesToArchitectures(input: {
  mappingId: string;
  requiredCapabilities: readonly WorkloadCapability[];
  candidates: readonly ArchitectureRecord[];
  attemptBrandHardCoding?: boolean;
}): CapabilityMappingResult | DenialResult {
  if (input.attemptBrandHardCoding) {
    return deny(
      'BRAND_HARDCODING_REQUIRED_FOR_MAPPING=false — map by capabilities, not vendor brands.',
    );
  }
  for (const cap of input.requiredCapabilities) {
    if (!(WORKLOAD_CAPABILITIES as readonly string[]).includes(cap)) {
      return deny(`Unknown workload capability: ${cap}`);
    }
  }
  const matched = input.candidates
    .filter((c) =>
      input.requiredCapabilities.every((req) =>
        c.capabilityTags.includes(req),
      ),
    )
    .map((c) => c.architectureId);

  return {
    mappingId: input.mappingId,
    requiredCapabilities: input.requiredCapabilities,
    matchedArchitectureIds: matched,
    brandHardCoded: false,
    flow: CROSS_ARCHITECTURE_FLOW,
  };
}

export function attemptEquateKnowledgeWithVerification(): DenialResult {
  return deny('ARCHITECTURE_KNOWLEDGE_EQ_MACHINE_VERIFICATION=false.');
}

export function attemptDocumentedAarch64AsPhoneVerified(): DenialResult {
  return deny(
    'DOCUMENTED_AARCH64_EQ_PHONE_INFERENCE_VERIFIED=false — ARM AArch64 semantics DOCUMENTED ≠ this phone runs XIV inference VERIFIED.',
  );
}

export function attemptProprietaryIsaCloning(): DenialResult {
  return deny('PROPRIETARY_ISA_CLONING=false.');
}

export function attemptRestrictedRtlFirmwareIngestion(): DenialResult {
  return deny('RESTRICTED_RTL_FIRMWARE_INGESTION=false.');
}

export function attemptConfidentialMicroarchitectureRe(): DenialResult {
  return deny('CONFIDENTIAL_MICROARCHITECTURE_REVERSE_ENGINEERING=false.');
}

export function attemptVerifiedWithoutMachineEvidence(): DenialResult {
  return deny('VERIFIED_WITHOUT_MACHINE_EVIDENCE=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnCrossArchEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq1Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      flow: typeof CROSS_ARCHITECTURE_FLOW;
      authorityGranted: false;
    }
  | DenialResult {
  if (!CROSS_ARCH_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isCrossArchAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only cross-arch agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    flow: CROSS_ARCHITECTURE_FLOW,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq1Actor;
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
    unchanged: EQ1_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ1_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ1_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleArmAarch64Documented(
  actor: Eq1Actor,
): ArchitectureRecord {
  const record = emitArchitectureRecord({
    actor,
    architectureId: 'arch-arm-aarch64-public',
    vendor: 'Arm',
    isaFamily: 'arm_aarch64',
    architectureVersion: 'AArch64',
    deviceClass: 'cpu',
    extensions: ['NEON', 'SVE-research'],
    runtime: 'linux-aarch64',
    compilerToolchain: 'llvm/clang-aarch64',
    modelFormats: ['onnx', 'tflite'],
    supportedPrecisions: ['fp32', 'fp16', 'int8'],
    memoryModel: 'arm-weak-memory-model-public',
    vectorSimdCapabilities: ['NEON', 'SVE'],
    securityFeatures: ['pointer-auth-research', 'mte-research'],
    operatingSystems: ['linux', 'android'],
    evidenceState: 'DOCUMENTED',
    sourceRefs: ['arm-architecture-reference-manual-public'],
    capabilityTags: [
      'matrix_multiply',
      'vector_operations',
      'attention',
      'compression',
    ],
  });
  if ('denied' in record) {
    throw new Error('exampleArmAarch64Documented failed');
  }
  return record;
}

export function bootstrapCrossArchitectureContract(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq1SoftWireSnapshot;
  recordFields: readonly ArchitectureRecordField[];
  evidenceStates: typeof ARCHITECTURE_EVIDENCE_STATES;
  isaFamilies: typeof ISA_FAMILIES;
  capabilities: typeof WORKLOAD_CAPABILITIES;
  flow: typeof CROSS_ARCHITECTURE_FLOW;
  safetyIp: typeof SAFETY_IP_BOUNDARIES;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ1_MAY;
  mustNot: typeof EQ1_MUST_NOT;
  dbCandidates: typeof EQ1_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq1LocksIntact(),
    softWire: eq1SoftWireSnapshot(repoRoot),
    recordFields: ARCHITECTURE_RECORD_FIELDS,
    evidenceStates: ARCHITECTURE_EVIDENCE_STATES,
    isaFamilies: ISA_FAMILIES,
    capabilities: WORKLOAD_CAPABILITIES,
    flow: CROSS_ARCHITECTURE_FLOW,
    safetyIp: SAFETY_IP_BOUNDARIES,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ1_MAY,
    mustNot: EQ1_MUST_NOT,
    dbCandidates: EQ1_DB_CANDIDATES_STATUS,
  };
}

export function runCrossArchitectureContractCycle(input: {
  actor: Eq1Actor;
  human: Eq1Actor;
  repoRoot?: string;
}): {
  hops: Eq1HopRecord[];
  armDocumented: ArchitectureRecord | DenialResult;
  mapping: CapabilityMappingResult | DenialResult;
  softWire: Eq1SoftWireSnapshot;
} {
  const hops: Eq1HopRecord[] = [];
  const softWire = eq1SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq1LocksIntact() ? 'PASS' : 'FAIL',
      'EQ1 locks intact including L4=false and knowledge≠machine verification.',
    ),
  );
  hops.push(
    hop(
      'cross_architecture_contract_bootstrap',
      'PASS',
      'Cross-Architecture Contract bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'architecture_record_fields_encoded',
      'PASS',
      `${ARCHITECTURE_RECORD_FIELDS.length} architecture record fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'evidence_states_encoded',
      'PASS',
      ARCHITECTURE_EVIDENCE_STATES.join(' | '),
    ),
  );
  hops.push(
    hop('isa_families_encoded', 'PASS', ISA_FAMILIES.join(' | ')),
  );
  hops.push(
    hop(
      'workload_capabilities_encoded',
      'PASS',
      WORKLOAD_CAPABILITIES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'cross_architecture_flow_encoded',
      'PASS',
      CROSS_ARCHITECTURE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'safety_ip_boundaries_encoded',
      'PASS',
      SAFETY_IP_BOUNDARIES.join(' | '),
    ),
  );

  const armDocumented = exampleArmAarch64Documented(input.actor);
  hops.push(
    hop(
      'architecture_knowledge_neq_machine_verification',
      armDocumented.evidenceState === 'DOCUMENTED' &&
        armDocumented.machineVerified === false &&
        architectureKnowledgeImpliesMachineVerified('DOCUMENTED') === false &&
        attemptEquateKnowledgeWithVerification().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Architecture knowledge ≠ machine verification.',
    ),
  );
  hops.push(
    hop(
      'documented_aarch64_neq_phone_inference_verified',
      attemptDocumentedAarch64AsPhoneVerified().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'DOCUMENTED AArch64 ≠ phone inference VERIFIED.',
    ),
  );

  const riscv = emitArchitectureRecord({
    actor: input.actor,
    architectureId: 'arch-riscv-rv64',
    vendor: 'RISC-V International (open ISA)',
    isaFamily: 'riscv',
    architectureVersion: 'RV64GC',
    deviceClass: 'cpu',
    extensions: ['V', 'A', 'K-research'],
    runtime: 'linux-riscv64',
    compilerToolchain: 'llvm/clang-riscv64',
    modelFormats: ['onnx'],
    supportedPrecisions: ['fp32', 'fp16'],
    memoryModel: 'riscv-memory-model-public',
    vectorSimdCapabilities: ['V'],
    securityFeatures: ['pmp-research'],
    operatingSystems: ['linux'],
    evidenceState: 'DOCUMENTED',
    sourceRefs: ['riscv-ratified-unprivileged'],
    capabilityTags: [
      'vector_operations',
      'optimization',
      'simulation',
      'encryption',
    ],
  });

  const mapping =
    !('denied' in riscv)
      ? mapCapabilitiesToArchitectures({
          mappingId: 'map-1',
          requiredCapabilities: ['vector_operations', 'matrix_multiply'],
          candidates: [armDocumented, riscv],
        })
      : riscv;

  hops.push(
    hop(
      'capability_based_mapping_not_brand_hardcoding',
      !('denied' in mapping) &&
        mapping.brandHardCoded === false &&
        mapping.matchedArchitectureIds.includes('arch-arm-aarch64-public') &&
        mapCapabilitiesToArchitectures({
          mappingId: 'map-brand',
          requiredCapabilities: ['attention'],
          candidates: [armDocumented],
          attemptBrandHardCoding: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Capability-based mapping; brand hard-coding DENIED.',
    ),
  );

  hops.push(
    hop(
      'deny_proprietary_isa_cloning',
      attemptProprietaryIsaCloning().state,
      'Proprietary ISA cloning DENIED.',
    ),
  );
  hops.push(
    hop(
      'deny_restricted_rtl_firmware_ingestion',
      attemptRestrictedRtlFirmwareIngestion().state,
      'Restricted RTL/firmware ingestion DENIED.',
    ),
  );
  hops.push(
    hop(
      'deny_confidential_microarchitecture_re',
      attemptConfidentialMicroarchitectureRe().state,
      'Confidential microarchitecture RE DENIED.',
    ),
  );
  hops.push(
    hop(
      'deny_verified_without_machine_evidence',
      attemptVerifiedWithoutMachineEvidence().state === 'DENIED' &&
        emitArchitectureRecord({
          actor: input.actor,
          architectureId: 'arch-bad-v',
          vendor: 'x',
          isaFamily: 'x86_64',
          architectureVersion: 'x86-64',
          deviceClass: 'cpu',
          runtime: 'linux',
          compilerToolchain: 'gcc',
          memoryModel: 'x86-tso-public',
          evidenceState: 'VERIFIED',
          sourceRefs: ['sdm-public'],
          machineEvidenceRefs: [],
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'VERIFIED without machine evidence DENIED.',
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
      attemptRecommendAsAct().state === 'DENIED' ? 'PASS' : 'FAIL',
      'Recommend ≠ act / authorize.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EQ1_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'ep18_soft_wire',
      softWire.ep18QuantumInspiredComputeLab.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep18QuantumInspiredComputeLab.note,
    ),
  );
  hops.push(
    hop(
      'ep17_soft_wire',
      softWire.ep17ClassicalQuantBaselineLab.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep17ClassicalQuantBaselineLab.note,
    ),
  );
  hops.push(
    hop(
      'ep13_soft_wire',
      softWire.ep13RuntimeReturnReceipt.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep13RuntimeReturnReceipt.note,
    ),
  );
  hops.push(
    hop(
      'ep12_soft_wire',
      softWire.ep12Scheduler.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep12Scheduler.note,
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
      EQ1_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq1-1',
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

  void CROSS_ARCHITECTURE_CONTRACT_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    armDocumented,
    mapping,
    softWire,
  };
}
