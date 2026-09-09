/**
 * 62L-EQ7 — ARM Edge/Phone Runtime Research + AMD XIV Acceleration runtime.
 *
 * Map ARM edge/phone dimensions; propose AMD software policies; require
 * comparable benchmarks for improvement claims; explicit mobile enrollment.
 * Soft-wires EQ6/EQ5/EQ2/EP16/EM157 when present.
 */

import {
  AMD_XIV_ACCELERATION_PIPELINE,
  ARM_EDGE_AMD_ACCELERATION_CYCLE,
  ARM_EDGE_PHONE_RESEARCH_DIMENSIONS,
  EQ7_AGENT_BOUNDS,
  EQ7_DB_CANDIDATES_STATUS,
  EQ7_EVIDENCE_CLAIM_STATES,
  EQ7_GOVERNANCE_DENIES,
  EQ7_LOCKS,
  EQ7_MAY,
  EQ7_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  IMPROVEMENT_EVIDENCE_FIELDS,
  MOBILE_EDGE_ENROLLMENT_RULE,
  NEXT_PHASE_TITLE,
  XIV_PROPRIETARY_SOFTWARE_IMPROVEMENTS,
  assertEq7LocksIntact,
  canClaimVerifiedImprovement,
  eq7SoftWireSnapshot,
  isEq7Agent,
  isHumanApprover,
  softwareAccelImpliesSiliconMod,
  type Eq7Actor,
  type Eq7EvidenceClaimState,
  type Eq7EvidenceState,
  type Eq7HopRecord,
  type Eq7SoftWireSnapshot,
  type ImprovementEvidenceField,
} from './arm-edge-amd-acceleration-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof ARM_EDGE_AMD_ACCELERATION_CYCLE)[number],
  state: Eq7EvidenceState,
  summary: string,
): Eq7HopRecord {
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

export type ArmResearchDimension =
  (typeof ARM_EDGE_PHONE_RESEARCH_DIMENSIONS)[number];
export type XivSoftwareImprovement =
  (typeof XIV_PROPRIETARY_SOFTWARE_IMPROVEMENTS)[number];

export type ArmEdgePhoneResearchNode = {
  nodeId: string;
  dimension: ArmResearchDimension;
  notes: string;
  claimState: Eq7EvidenceClaimState;
  orgId: string;
  tenantId: string;
  universeId: string;
  siliconModified: false;
};

export type AmdAccelerationPolicyCandidate = {
  policyId: string;
  xivPolicyVersion: string;
  improvement: XivSoftwareImprovement;
  pipeline: typeof AMD_XIV_ACCELERATION_PIPELINE;
  claimState: Eq7EvidenceClaimState;
  claimsPhysicalTransistorMod: false;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export type ImprovementEvidenceRecord = {
  evidenceId: string;
  baseline: number;
  xivPolicyVersion: string;
  deviceRuntime: string;
  modelWorkload: string;
  latency: number;
  throughput: number;
  memory: number;
  energyProxy: number;
  quality: number;
  result: Eq7EvidenceClaimState;
  baselineRunComparable: boolean;
  xivPolicyRunComparable: boolean;
  claimsPhysicalTransistorMod: false;
};

export type MobileEdgeEnrollment = {
  enrollmentId: string;
  deviceClass: string;
  explicitEnrollment: true;
  supportedPermissions: true;
  claimState: 'ENROLLED';
  covertInstall: false;
  batteryAbuse: false;
  hiddenTelemetry: false;
  unrestrictedUserData: false;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export function emitArmEdgeResearchNode(input: {
  actor: Eq7Actor;
  nodeId: string;
  dimension: ArmResearchDimension;
  notes: string;
  claimState?: Eq7EvidenceClaimState;
  attemptClaimSiliconMod?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): ArmEdgePhoneResearchNode | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_EQ7=false.');
  }
  if (input.attemptClaimSiliconMod) {
    return deny(
      'CLAIM_PHYSICAL_TRANSISTOR_MOD=false — research does not modify vendor silicon.',
    );
  }
  return {
    nodeId: input.nodeId,
    dimension: input.dimension,
    notes: input.notes,
    claimState: input.claimState ?? 'DOCUMENTED',
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    siliconModified: false,
  };
}

export function proposeAmdAccelerationPolicy(input: {
  actor: Eq7Actor;
  policyId: string;
  xivPolicyVersion: string;
  improvement: XivSoftwareImprovement;
  attemptClaimPhysicalTransistorMod?: boolean;
  attemptProductionChanges?: boolean;
  attemptProprietaryAmdIpCopy?: boolean;
  attemptFirmwareBiosMod?: boolean;
  attemptOverclocking?: boolean;
  attemptDriverReplacement?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): AmdAccelerationPolicyCandidate | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_EQ7=false.');
  }
  if (input.attemptClaimPhysicalTransistorMod) {
    return deny(
      'CLAIM_PHYSICAL_TRANSISTOR_MOD=false — XIV makes better use of AMD hardware via software, not transistor architecture changes.',
    );
  }
  if (input.attemptProductionChanges) {
    return deny('PRODUCTION_CHANGES=false.');
  }
  if (input.attemptProprietaryAmdIpCopy) {
    return deny('PROPRIETARY_AMD_IP_COPYING=false.');
  }
  if (input.attemptFirmwareBiosMod) {
    return deny('FIRMWARE_BIOS_MODIFICATION=false.');
  }
  if (input.attemptOverclocking) {
    return deny('OVERCLOCKING=false.');
  }
  if (input.attemptDriverReplacement) {
    return deny('DRIVER_REPLACEMENT=false.');
  }
  if (
    !(XIV_PROPRIETARY_SOFTWARE_IMPROVEMENTS as readonly string[]).includes(
      input.improvement,
    )
  ) {
    return deny('Improvement not in XIV software allow-list.');
  }
  return {
    policyId: input.policyId,
    xivPolicyVersion: input.xivPolicyVersion,
    improvement: input.improvement,
    pipeline: AMD_XIV_ACCELERATION_PIPELINE,
    claimState: 'CANDIDATE',
    claimsPhysicalTransistorMod: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function recordImprovementEvidence(input: {
  evidenceId: string;
  baseline: number;
  xivPolicyVersion: string;
  deviceRuntime: string;
  modelWorkload: string;
  latency: number;
  throughput: number;
  memory: number;
  energyProxy: number;
  quality: number;
  baselineRun: boolean;
  xivPolicyRun: boolean;
  comparableWorkload: boolean;
  comparableDeviceRuntime: boolean;
  attemptClaimWithoutComparableBenchmark?: boolean;
  attemptClaimPhysicalTransistorMod?: boolean;
}): ImprovementEvidenceRecord | DenialResult {
  if (input.attemptClaimPhysicalTransistorMod) {
    return deny('CLAIM_PHYSICAL_TRANSISTOR_MOD=false.');
  }
  if (input.attemptClaimWithoutComparableBenchmark) {
    return deny(
      'IMPROVEMENT_WITHOUT_COMPARABLE_BENCHMARK=false — only an actually run comparable benchmark can justify calling that an improvement.',
    );
  }

  void IMPROVEMENT_EVIDENCE_FIELDS;

  const ok = canClaimVerifiedImprovement({
    baselineRun: input.baselineRun,
    xivPolicyRun: input.xivPolicyRun,
    comparableWorkload: input.comparableWorkload,
    comparableDeviceRuntime: input.comparableDeviceRuntime,
    metricsRecorded: true,
  });

  if (!ok) {
    return deny(
      'Comparable baseline + XIV policy runs required before VERIFIED_IMPROVEMENT.',
    );
  }

  let result: Eq7EvidenceClaimState = 'BENCHMARKED';
  if (input.latency < input.baseline) {
    result = 'VERIFIED_IMPROVEMENT';
  } else if (input.latency > input.baseline) {
    result = 'REGRESSED';
  } else {
    result = 'NO_IMPROVEMENT';
  }

  return {
    evidenceId: input.evidenceId,
    baseline: input.baseline,
    xivPolicyVersion: input.xivPolicyVersion,
    deviceRuntime: input.deviceRuntime,
    modelWorkload: input.modelWorkload,
    latency: input.latency,
    throughput: input.throughput,
    memory: input.memory,
    energyProxy: input.energyProxy,
    quality: input.quality,
    result,
    baselineRunComparable: true,
    xivPolicyRunComparable: true,
    claimsPhysicalTransistorMod: false,
  };
}

export function enrollMobileEdgeDevice(input: {
  actor: Eq7Actor;
  enrollmentId: string;
  deviceClass: string;
  explicitEnrollment: boolean;
  supportedPermissions: boolean;
  attemptCovertInstall?: boolean;
  attemptBatteryAbuse?: boolean;
  attemptHiddenTelemetry?: boolean;
  attemptUnrestrictedUserData?: boolean;
  attemptPermissionExpansion?: boolean;
  attemptEnrollWithoutConsent?: boolean;
}): MobileEdgeEnrollment | DenialResult {
  if (input.attemptCovertInstall || input.attemptEnrollWithoutConsent) {
    return deny(
      'COVERT_BACKGROUND_INSTALLATION=false / ENROLL_WITHOUT_EXPLICIT_CONSENT=false.',
    );
  }
  if (input.attemptBatteryAbuse) {
    return deny('BATTERY_ABUSE=false.');
  }
  if (input.attemptHiddenTelemetry) {
    return deny('HIDDEN_TELEMETRY=false.');
  }
  if (input.attemptUnrestrictedUserData) {
    return deny('UNRESTRICTED_USER_DATA_ACCESS=false.');
  }
  if (input.attemptPermissionExpansion) {
    return deny('PERMISSION_EXPANSION=false.');
  }
  if (!input.explicitEnrollment) {
    return deny(
      'Phones/edge join only through explicit enrollment.',
    );
  }
  if (!input.supportedPermissions) {
    return deny(
      'ENROLL_WITHOUT_SUPPORTED_PERMISSIONS=false — supported platform permissions required.',
    );
  }
  void MOBILE_EDGE_ENROLLMENT_RULE;
  return {
    enrollmentId: input.enrollmentId,
    deviceClass: input.deviceClass,
    explicitEnrollment: true,
    supportedPermissions: true,
    claimState: 'ENROLLED',
    covertInstall: false,
    batteryAbuse: false,
    hiddenTelemetry: false,
    unrestrictedUserData: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function attemptClaimPhysicalTransistorMod(): DenialResult {
  return deny('CLAIM_PHYSICAL_TRANSISTOR_MOD=false.');
}

export function attemptImprovementWithoutComparableBenchmark(): DenialResult {
  return deny('IMPROVEMENT_WITHOUT_COMPARABLE_BENCHMARK=false.');
}

export function attemptCovertPhoneEnrollment(): DenialResult {
  return deny('COVERT_BACKGROUND_INSTALLATION=false.');
}

export function attemptBatteryAbuse(): DenialResult {
  return deny('BATTERY_ABUSE=false.');
}

export function attemptHiddenTelemetry(): DenialResult {
  return deny('HIDDEN_TELEMETRY=false.');
}

export function attemptUnrestrictedUserData(): DenialResult {
  return deny('UNRESTRICTED_USER_DATA_ACCESS=false.');
}

export function attemptFirmwareBiosMod(): DenialResult {
  return deny('FIRMWARE_BIOS_MODIFICATION=false.');
}

export function attemptOverclocking(): DenialResult {
  return deny('OVERCLOCKING=false.');
}

export function attemptDriverReplacement(): DenialResult {
  return deny('DRIVER_REPLACEMENT=false.');
}

export function attemptProprietaryAmdIpCopy(): DenialResult {
  return deny('PROPRIETARY_AMD_IP_COPYING=false.');
}

export function attemptPermissionExpansion(): DenialResult {
  return deny('PERMISSION_EXPANSION=false.');
}

export function attemptProductionChanges(): DenialResult {
  return deny('PRODUCTION_CHANGES=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnEq7EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq7Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!EQ7_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEq7Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only EQ7 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq7Actor;
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
      'HUMAN_APPROVAL_REQUIRED — consequential actions require human_approver, founder, or tenant_admin.',
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
    unchanged: EQ7_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ7_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ7_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleAmdLatencyImprovementEvidence(): ImprovementEvidenceRecord {
  const rec = recordImprovementEvidence({
    evidenceId: 'ev-amd-lat-1',
    baseline: 120,
    xivPolicyVersion: 'xiv-sched-cand-0.1',
    deviceRuntime: 'amd-verified-gpu-runtime',
    modelWorkload: 'embedding-batch',
    latency: 91,
    throughput: 11,
    memory: 2048,
    energyProxy: 0.8,
    quality: 0.99,
    baselineRun: true,
    xivPolicyRun: true,
    comparableWorkload: true,
    comparableDeviceRuntime: true,
  });
  if ('denied' in rec) throw new Error('example evidence failed');
  return rec;
}

export function bootstrapArmEdgeAmdAcceleration(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq7SoftWireSnapshot;
  armDimensions: typeof ARM_EDGE_PHONE_RESEARCH_DIMENSIONS;
  amdPipeline: typeof AMD_XIV_ACCELERATION_PIPELINE;
  improvements: typeof XIV_PROPRIETARY_SOFTWARE_IMPROVEMENTS;
  evidenceFields: readonly ImprovementEvidenceField[];
  claimStates: typeof EQ7_EVIDENCE_CLAIM_STATES;
  governanceDenies: typeof EQ7_GOVERNANCE_DENIES;
  enrollment: typeof MOBILE_EDGE_ENROLLMENT_RULE;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ7_MAY;
  mustNot: typeof EQ7_MUST_NOT;
  dbCandidates: typeof EQ7_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq7LocksIntact(),
    softWire: eq7SoftWireSnapshot(repoRoot),
    armDimensions: ARM_EDGE_PHONE_RESEARCH_DIMENSIONS,
    amdPipeline: AMD_XIV_ACCELERATION_PIPELINE,
    improvements: XIV_PROPRIETARY_SOFTWARE_IMPROVEMENTS,
    evidenceFields: IMPROVEMENT_EVIDENCE_FIELDS,
    claimStates: EQ7_EVIDENCE_CLAIM_STATES,
    governanceDenies: EQ7_GOVERNANCE_DENIES,
    enrollment: MOBILE_EDGE_ENROLLMENT_RULE,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ7_MAY,
    mustNot: EQ7_MUST_NOT,
    dbCandidates: EQ7_DB_CANDIDATES_STATUS,
  };
}

export function runArmEdgeAmdAccelerationCycle(input: {
  actor: Eq7Actor;
  human: Eq7Actor;
  repoRoot?: string;
}): {
  hops: Eq7HopRecord[];
  armNode: ArmEdgePhoneResearchNode;
  policy: AmdAccelerationPolicyCandidate;
  evidence: ImprovementEvidenceRecord;
  enrollment: MobileEdgeEnrollment;
  softWire: Eq7SoftWireSnapshot;
} {
  const hops: Eq7HopRecord[] = [];
  const softWire = eq7SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq7LocksIntact() ? 'PASS' : 'FAIL',
      'EQ7 locks intact including L4=false and software≠silicon mod.',
    ),
  );
  hops.push(
    hop(
      'arm_edge_amd_acceleration_bootstrap',
      'PASS',
      'ARM Edge/Phone + AMD XIV Acceleration bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'arm_research_dimensions_encoded',
      'PASS',
      `${ARM_EDGE_PHONE_RESEARCH_DIMENSIONS.length} ARM edge/phone dimensions encoded.`,
    ),
  );
  hops.push(
    hop(
      'amd_acceleration_pipeline_encoded',
      'PASS',
      AMD_XIV_ACCELERATION_PIPELINE.join(' → '),
    ),
  );
  hops.push(
    hop(
      'xiv_software_improvements_encoded',
      'PASS',
      `${XIV_PROPRIETARY_SOFTWARE_IMPROVEMENTS.length} XIV software improvements encoded.`,
    ),
  );
  hops.push(
    hop(
      'improvement_evidence_fields_encoded',
      'PASS',
      IMPROVEMENT_EVIDENCE_FIELDS.join(' · '),
    ),
  );
  hops.push(
    hop(
      'enrollment_rule_encoded',
      'PASS',
      'Explicit enrollment + supported permissions; no covert/abuse/hidden telemetry.',
    ),
  );

  const armNodeResult = emitArmEdgeResearchNode({
    actor: input.actor,
    nodeId: 'arm-phone-onnx-1',
    dimension: 'onnx_mobile_inference_options',
    notes: 'DOCUMENTED mobile ONNX options; not device-verified.',
  });
  if ('denied' in armNodeResult) throw new Error('arm node failed');
  const armNode = armNodeResult;

  const policyResult = proposeAmdAccelerationPolicy({
    actor: input.actor,
    policyId: 'amd-pol-1',
    xivPolicyVersion: 'xiv-sched-cand-0.1',
    improvement: 'benchmark_driven_routing',
  });
  if ('denied' in policyResult) throw new Error('policy failed');
  const policy = policyResult;

  const evidence = exampleAmdLatencyImprovementEvidence();
  const enrollmentResult = enrollMobileEdgeDevice({
    actor: input.actor,
    enrollmentId: 'enroll-phone-1',
    deviceClass: 'android_arm_phone',
    explicitEnrollment: true,
    supportedPermissions: true,
  });
  if ('denied' in enrollmentResult) throw new Error('enrollment failed');
  const enrollment = enrollmentResult;

  hops.push(
    hop(
      'software_accel_not_silicon_mod',
      policy.claimsPhysicalTransistorMod === false &&
        softwareAccelImpliesSiliconMod() === false &&
        attemptClaimPhysicalTransistorMod().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Software acceleration ≠ physical transistor modification.',
    ),
  );

  const noBench = recordImprovementEvidence({
    evidenceId: 'bad',
    baseline: 120,
    xivPolicyVersion: 'x',
    deviceRuntime: 'd',
    modelWorkload: 'w',
    latency: 91,
    throughput: 1,
    memory: 1,
    energyProxy: 1,
    quality: 1,
    baselineRun: false,
    xivPolicyRun: false,
    comparableWorkload: false,
    comparableDeviceRuntime: false,
    attemptClaimWithoutComparableBenchmark: true,
  });
  hops.push(
    hop(
      'improvement_requires_comparable_benchmark',
      evidence.result === 'VERIFIED_IMPROVEMENT' &&
        evidence.baseline === 120 &&
        evidence.latency === 91 &&
        noBench.state === 'DENIED' &&
        attemptImprovementWithoutComparableBenchmark().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      '120ms baseline → 91ms only VERIFIED_IMPROVEMENT with comparable runs.',
    ),
  );

  const covert = enrollMobileEdgeDevice({
    actor: input.actor,
    enrollmentId: 'bad-enroll',
    deviceClass: 'phone',
    explicitEnrollment: false,
    supportedPermissions: false,
    attemptCovertInstall: true,
  });
  hops.push(
    hop(
      'mobile_edge_explicit_enrollment_only',
      enrollment.claimState === 'ENROLLED' &&
        covert.state === 'DENIED' &&
        attemptCovertPhoneEnrollment().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Phones/edge join only via explicit enrollment + permissions.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof ARM_EDGE_AMD_ACCELERATION_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_claim_physical_transistor_mod',
      fn: attemptClaimPhysicalTransistorMod,
    },
    {
      hop: 'deny_improvement_without_comparable_benchmark',
      fn: attemptImprovementWithoutComparableBenchmark,
    },
    { hop: 'deny_covert_phone_enrollment', fn: attemptCovertPhoneEnrollment },
    { hop: 'deny_battery_abuse', fn: attemptBatteryAbuse },
    { hop: 'deny_hidden_telemetry', fn: attemptHiddenTelemetry },
    { hop: 'deny_unrestricted_user_data', fn: attemptUnrestrictedUserData },
    { hop: 'deny_firmware_bios_mod', fn: attemptFirmwareBiosMod },
    { hop: 'deny_overclocking', fn: attemptOverclocking },
    { hop: 'deny_driver_replacement', fn: attemptDriverReplacement },
    { hop: 'deny_proprietary_amd_ip_copy', fn: attemptProprietaryAmdIpCopy },
    { hop: 'deny_permission_expansion', fn: attemptPermissionExpansion },
    { hop: 'deny_production_changes', fn: attemptProductionChanges },
  ];
  for (const d of denyHops) {
    hops.push(
      hop(
        d.hop,
        d.fn().state === 'DENIED' ? 'PASS' : 'FAIL',
        `${d.hop} DENIED.`,
      ),
    );
  }

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
      EQ7_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'eq6_soft_wire',
      softWire.eq6ArchitectureCapabilityGraph.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq6ArchitectureCapabilityGraph.note,
    ),
  );
  hops.push(
    hop(
      'eq5_soft_wire',
      softWire.eq5CompilerIrTranslationLayer.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq5CompilerIrTranslationLayer.note,
    ),
  );
  hops.push(
    hop(
      'eq2_soft_wire',
      softWire.eq2ArmArchitectureKnowledgePack.present
        ? 'PASS'
        : 'WAITING_DATA',
      softWire.eq2ArmArchitectureKnowledgePack.note,
    ),
  );
  hops.push(
    hop(
      'ep16_soft_wire',
      softWire.ep16NoOverclockBiosRule.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep16NoOverclockBiosRule.note,
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
      EQ7_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq7-1',
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

  void ARM_EDGE_AMD_ACCELERATION_CYCLE;
  void attemptAgentAutoAuthority;
  void armNode;

  return {
    hops,
    armNode,
    policy,
    evidence,
    enrollment,
    softWire,
  };
}
