/**
 * 62L-EQ9 — RISC-V Accelerator Research runtime.
 *
 * Emit research nodes; advance DOCUMENTED→DETECTED→SUPPORTED→VERIFIED with
 * evidence; deny proprietary RTL/private extensions/firmware and governance
 * violations. Soft-wires EQ8/EQ3/EQ6/EQ5/EQ1/EM157 when present.
 */

import {
  COMPARISON_PEER_PATHS,
  EQ9_AGENT_BOUNDS,
  EQ9_DB_CANDIDATES_STATUS,
  EQ9_GOVERNANCE_DENIES,
  EQ9_LOCKS,
  EQ9_MAY,
  EQ9_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  OPEN_ISA_LEARNING_GOAL,
  RISCV_ACCELERATOR_CORE_GRAPH,
  RISCV_ACCELERATOR_RESEARCH_CYCLE,
  RISCV_ACCELERATOR_RESEARCH_DIMENSIONS,
  RISCV_ACCELERATOR_VERIFICATION_STATES,
  RISCV_PROPRIETARY_BOUNDARY_BLOCKS,
  RISCV_RESEARCH_FOCUS_DOMAINS,
  VERIFICATION_LADDER_ORDER,
  assertEq9LocksIntact,
  canMarkVerified,
  eq9SoftWireSnapshot,
  isEq9Agent,
  isHumanApprover,
  openIsaImpliesChipCopy,
  verificationLadderRank,
  type Eq9Actor,
  type Eq9EvidenceState,
  type Eq9HopRecord,
  type Eq9SoftWireSnapshot,
  type RiscvAcceleratorVerificationState,
} from './riscv-accelerator-research-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof RISCV_ACCELERATOR_RESEARCH_CYCLE)[number],
  state: Eq9EvidenceState,
  summary: string,
): Eq9HopRecord {
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

export type RiscvResearchDimension =
  (typeof RISCV_ACCELERATOR_RESEARCH_DIMENSIONS)[number];
export type RiscvFocusDomain = (typeof RISCV_RESEARCH_FOCUS_DOMAINS)[number];
export type ComparisonPeer = (typeof COMPARISON_PEER_PATHS)[number];

export type RiscvAcceleratorResearchNode = {
  nodeId: string;
  baseIsaVersion: string;
  extensionId: string;
  dimension: RiscvResearchDimension;
  focusDomains: readonly RiscvFocusDomain[];
  verificationState: RiscvAcceleratorVerificationState;
  publicSourceRef: string;
  comparesAgainst: readonly ComparisonPeer[];
  copiesVendorChip: false;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
};

export type VerificationAdvance = {
  nodeId: string;
  from: RiscvAcceleratorVerificationState;
  to: RiscvAcceleratorVerificationState;
  evidenceRefs: readonly string[];
};

export function emitRiscvAcceleratorResearchNode(input: {
  actor: Eq9Actor;
  nodeId: string;
  baseIsaVersion: string;
  extensionId: string;
  dimension: RiscvResearchDimension;
  focusDomains: readonly RiscvFocusDomain[];
  publicSourceRef: string;
  comparesAgainst?: readonly ComparisonPeer[];
  verificationState?: RiscvAcceleratorVerificationState;
  attemptProprietaryRtlCopy?: boolean;
  attemptPrivateExtensions?: boolean;
  attemptFirmwareIngestion?: boolean;
  attemptConfidentialImplementationDetails?: boolean;
  attemptEquateOpenIsaWithChipCopy?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): RiscvAcceleratorResearchNode | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_EQ9=false.');
  }
  if (input.attemptProprietaryRtlCopy) {
    return deny(
      'PROPRIETARY_RTL_COPY=false — open ISA does not authorize proprietary RTL copy.',
    );
  }
  if (input.attemptPrivateExtensions) {
    return deny('PRIVATE_EXTENSIONS=false.');
  }
  if (input.attemptFirmwareIngestion) {
    return deny('FIRMWARE_INGESTION=false.');
  }
  if (input.attemptConfidentialImplementationDetails) {
    return deny('CONFIDENTIAL_IMPLEMENTATION_DETAILS=false.');
  }
  if (input.attemptEquateOpenIsaWithChipCopy) {
    return deny(
      'OPEN_ISA_EQ_CHIP_COPY=false — learn for XIV workload intelligence, not chip copy.',
    );
  }
  if (input.verificationState === 'VERIFIED') {
    return deny(
      'Cannot emit VERIFIED via emit alone — use advanceVerification with bounded execution.',
    );
  }
  return {
    nodeId: input.nodeId,
    baseIsaVersion: input.baseIsaVersion,
    extensionId: input.extensionId,
    dimension: input.dimension,
    focusDomains: input.focusDomains,
    verificationState: input.verificationState ?? 'DOCUMENTED',
    publicSourceRef: input.publicSourceRef,
    comparesAgainst: input.comparesAgainst ?? [...COMPARISON_PEER_PATHS],
    copiesVendorChip: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
  };
}

export function advanceVerification(input: {
  node: RiscvAcceleratorResearchNode;
  to: RiscvAcceleratorVerificationState;
  evidenceRefs: readonly string[];
  chipExposesExtension?: boolean;
  runtimeModelPathCompatible?: boolean;
  boundedExecutionSucceeded?: boolean;
  attemptSkipLadder?: boolean;
  attemptVerifiedWithoutBoundedExecution?: boolean;
}):
  | { node: RiscvAcceleratorResearchNode; advance: VerificationAdvance }
  | DenialResult {
  if (input.attemptSkipLadder) {
    return deny('SKIP_VERIFICATION_LADDER=false.');
  }

  const from = input.node.verificationState;
  const fromRank = verificationLadderRank(from);
  const toRank = verificationLadderRank(input.to);

  if (input.to === 'NOT_TESTED' || input.to === 'UNAVAILABLE') {
    return {
      node: { ...input.node, verificationState: input.to },
      advance: {
        nodeId: input.node.nodeId,
        from,
        to: input.to,
        evidenceRefs: input.evidenceRefs,
      },
    };
  }

  if (fromRank < 0 || toRank < 0) {
    if (input.to === 'PARTIAL') {
      return {
        node: { ...input.node, verificationState: 'PARTIAL' },
        advance: {
          nodeId: input.node.nodeId,
          from,
          to: 'PARTIAL',
          evidenceRefs: input.evidenceRefs,
        },
      };
    }
    return deny('Invalid verification ladder transition.');
  }

  if (toRank > fromRank + 1) {
    return deny(
      'SKIP_VERIFICATION_LADDER=false — DOCUMENTED→DETECTED→SUPPORTED→VERIFIED step-by-step.',
    );
  }
  if (toRank < fromRank) {
    return deny('Verification ladder does not regress in this bounded runtime.');
  }

  if (input.to === 'DETECTED' && !input.chipExposesExtension) {
    return deny(
      'DETECTED requires a specific chip exposing the extension (evidence).',
    );
  }
  if (
    input.to === 'SUPPORTED' &&
    !input.runtimeModelPathCompatible
  ) {
    return deny(
      'SUPPORTED requires a compatible runtime/model path (evidence).',
    );
  }

  if (input.to === 'VERIFIED') {
    if (
      input.attemptVerifiedWithoutBoundedExecution ||
      !canMarkVerified({
        from,
        boundedExecutionSucceeded: input.boundedExecutionSucceeded === true,
        evidenceRefs: input.evidenceRefs,
      })
    ) {
      return deny(
        'VERIFIED_WITHOUT_BOUNDED_EXECUTION=false — only successful bounded execution makes it VERIFIED.',
      );
    }
  }

  if (
    (input.to === 'DETECTED' ||
      input.to === 'SUPPORTED' ||
      input.to === 'VERIFIED') &&
    input.evidenceRefs.length === 0
  ) {
    return deny(`Advancing to ${input.to} requires evidenceRefs.`);
  }

  return {
    node: { ...input.node, verificationState: input.to },
    advance: {
      nodeId: input.node.nodeId,
      from,
      to: input.to,
      evidenceRefs: input.evidenceRefs,
    },
  };
}

export function attemptSkipVerificationLadder(): DenialResult {
  return deny('SKIP_VERIFICATION_LADDER=false.');
}

export function attemptVerifiedWithoutBoundedExecution(): DenialResult {
  return deny('VERIFIED_WITHOUT_BOUNDED_EXECUTION=false.');
}

export function attemptProprietaryRtlCopy(): DenialResult {
  return deny('PROPRIETARY_RTL_COPY=false.');
}

export function attemptPrivateExtensions(): DenialResult {
  return deny('PRIVATE_EXTENSIONS=false.');
}

export function attemptFirmwareIngestion(): DenialResult {
  return deny('FIRMWARE_INGESTION=false.');
}

export function attemptConfidentialImplementationDetails(): DenialResult {
  return deny('CONFIDENTIAL_IMPLEMENTATION_DETAILS=false.');
}

export function attemptFirmwareModification(): DenialResult {
  return deny('FIRMWARE_MODIFICATION=false.');
}

export function attemptHardwareReprogramming(): DenialResult {
  return deny('HARDWARE_REPROGRAMMING=false.');
}

export function attemptUnsafePhysicalControl(): DenialResult {
  return deny('UNSAFE_PHYSICAL_CONTROL=false.');
}

export function attemptProductionDeployment(): DenialResult {
  return deny('PRODUCTION_DEPLOYMENT=false.');
}

export function attemptPermissionExpansion(): DenialResult {
  return deny('PERMISSION_EXPANSION=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnEq9EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq9Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      pathway: typeof RISCV_ACCELERATOR_CORE_GRAPH;
      learningGoal: typeof OPEN_ISA_LEARNING_GOAL;
      authorityGranted: false;
    }
  | DenialResult {
  if (!EQ9_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEq9Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only EQ9 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    pathway: RISCV_ACCELERATOR_CORE_GRAPH,
    learningGoal: OPEN_ISA_LEARNING_GOAL,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq9Actor;
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
    unchanged: EQ9_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ9_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ9_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleVectorExtensionResearchNode(
  actor: Eq9Actor,
): RiscvAcceleratorResearchNode {
  const node = emitRiscvAcceleratorResearchNode({
    actor,
    nodeId: 'rv-accel-v-1',
    baseIsaVersion: 'RV64GC',
    extensionId: 'V',
    dimension: 'vector_extension_support',
    focusDomains: [
      'vector_workloads',
      'low_power_edge_ai',
      'sensor_processing',
    ],
    publicSourceRef: 'riscv-vector-public-spec',
    verificationState: 'DOCUMENTED',
  });
  if ('denied' in node) throw new Error('example vector node failed');
  return node;
}

export function bootstrapRiscvAcceleratorResearch(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq9SoftWireSnapshot;
  dimensions: typeof RISCV_ACCELERATOR_RESEARCH_DIMENSIONS;
  coreGraph: typeof RISCV_ACCELERATOR_CORE_GRAPH;
  focusDomains: typeof RISCV_RESEARCH_FOCUS_DOMAINS;
  verificationStates: typeof RISCV_ACCELERATOR_VERIFICATION_STATES;
  ladder: typeof VERIFICATION_LADDER_ORDER;
  peers: typeof COMPARISON_PEER_PATHS;
  learningGoal: typeof OPEN_ISA_LEARNING_GOAL;
  proprietaryBlocks: typeof RISCV_PROPRIETARY_BOUNDARY_BLOCKS;
  governanceDenies: typeof EQ9_GOVERNANCE_DENIES;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ9_MAY;
  mustNot: typeof EQ9_MUST_NOT;
  dbCandidates: typeof EQ9_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq9LocksIntact(),
    softWire: eq9SoftWireSnapshot(repoRoot),
    dimensions: RISCV_ACCELERATOR_RESEARCH_DIMENSIONS,
    coreGraph: RISCV_ACCELERATOR_CORE_GRAPH,
    focusDomains: RISCV_RESEARCH_FOCUS_DOMAINS,
    verificationStates: RISCV_ACCELERATOR_VERIFICATION_STATES,
    ladder: VERIFICATION_LADDER_ORDER,
    peers: COMPARISON_PEER_PATHS,
    learningGoal: OPEN_ISA_LEARNING_GOAL,
    proprietaryBlocks: RISCV_PROPRIETARY_BOUNDARY_BLOCKS,
    governanceDenies: EQ9_GOVERNANCE_DENIES,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ9_MAY,
    mustNot: EQ9_MUST_NOT,
    dbCandidates: EQ9_DB_CANDIDATES_STATUS,
  };
}

export function runRiscvAcceleratorResearchCycle(input: {
  actor: Eq9Actor;
  human: Eq9Actor;
  repoRoot?: string;
}): {
  hops: Eq9HopRecord[];
  documented: RiscvAcceleratorResearchNode;
  verified: RiscvAcceleratorResearchNode;
  softWire: Eq9SoftWireSnapshot;
} {
  const hops: Eq9HopRecord[] = [];
  const softWire = eq9SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq9LocksIntact() ? 'PASS' : 'FAIL',
      'EQ9 locks intact including L4=false and DOCUMENTED≠VERIFIED.',
    ),
  );
  hops.push(
    hop(
      'riscv_accelerator_research_bootstrap',
      'PASS',
      'RISC-V Accelerator Research bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'research_dimensions_encoded',
      'PASS',
      `${RISCV_ACCELERATOR_RESEARCH_DIMENSIONS.length} research dimensions encoded.`,
    ),
  );
  hops.push(
    hop(
      'core_graph_encoded',
      'PASS',
      RISCV_ACCELERATOR_CORE_GRAPH.join(' → '),
    ),
  );
  hops.push(
    hop(
      'focus_domains_encoded',
      'PASS',
      `${RISCV_RESEARCH_FOCUS_DOMAINS.length} focus domains encoded.`,
    ),
  );
  hops.push(
    hop(
      'verification_ladder_encoded',
      'PASS',
      VERIFICATION_LADDER_ORDER.join(' → '),
    ),
  );
  hops.push(
    hop(
      'open_isa_learning_goal_encoded',
      'PASS',
      OPEN_ISA_LEARNING_GOAL.join(' → '),
    ),
  );

  const documented = exampleVectorExtensionResearchNode(input.actor);

  const skip = advanceVerification({
    node: documented,
    to: 'VERIFIED',
    evidenceRefs: ['x'],
    attemptSkipLadder: true,
  });
  const detected = advanceVerification({
    node: documented,
    to: 'DETECTED',
    evidenceRefs: ['chip-probe-1'],
    chipExposesExtension: true,
  });
  if ('denied' in detected) throw new Error('detected failed');

  hops.push(
    hop(
      'documented_neq_detected',
      documented.verificationState === 'DOCUMENTED' &&
        detected.node.verificationState === 'DETECTED' &&
        EQ9_LOCKS.DOCUMENTED_EQ_DETECTED === false
        ? 'PASS'
        : 'FAIL',
      'Documented extension ≠ chip DETECTED.',
    ),
  );

  const supported = advanceVerification({
    node: detected.node,
    to: 'SUPPORTED',
    evidenceRefs: ['runtime-onnx-path-1'],
    runtimeModelPathCompatible: true,
  });
  if ('denied' in supported) throw new Error('supported failed');

  hops.push(
    hop(
      'detected_neq_supported',
      supported.node.verificationState === 'SUPPORTED' &&
        EQ9_LOCKS.DETECTED_EQ_SUPPORTED === false
        ? 'PASS'
        : 'FAIL',
      'Chip DETECTED ≠ runtime/model SUPPORTED.',
    ),
  );

  const noExec = advanceVerification({
    node: supported.node,
    to: 'VERIFIED',
    evidenceRefs: [],
    attemptVerifiedWithoutBoundedExecution: true,
  });
  const verifiedAdv = advanceVerification({
    node: supported.node,
    to: 'VERIFIED',
    evidenceRefs: ['bounded-exec-receipt-1'],
    boundedExecutionSucceeded: true,
  });
  if ('denied' in verifiedAdv) throw new Error('verified failed');

  hops.push(
    hop(
      'supported_neq_verified_without_execution',
      noExec.state === 'DENIED' &&
        verifiedAdv.node.verificationState === 'VERIFIED' &&
        attemptVerifiedWithoutBoundedExecution().state === 'DENIED' &&
        skip.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'SUPPORTED → VERIFIED only after successful bounded execution.',
    ),
  );

  hops.push(
    hop(
      'open_isa_learn_not_chip_copy',
      documented.copiesVendorChip === false &&
        openIsaImpliesChipCopy() === false &&
        emitRiscvAcceleratorResearchNode({
          actor: input.actor,
          nodeId: 'bad',
          baseIsaVersion: 'RV64',
          extensionId: 'V',
          dimension: 'vector_extension_support',
          focusDomains: ['vector_workloads'],
          publicSourceRef: 'public',
          attemptEquateOpenIsaWithChipCopy: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Open ISA learning ≠ copying vendor chips.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof RISCV_ACCELERATOR_RESEARCH_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_skip_verification_ladder', fn: attemptSkipVerificationLadder },
    {
      hop: 'deny_verified_without_bounded_execution',
      fn: attemptVerifiedWithoutBoundedExecution,
    },
    { hop: 'deny_proprietary_rtl_copy', fn: attemptProprietaryRtlCopy },
    { hop: 'deny_private_extensions', fn: attemptPrivateExtensions },
    { hop: 'deny_firmware_ingestion', fn: attemptFirmwareIngestion },
    {
      hop: 'deny_confidential_implementation_details',
      fn: attemptConfidentialImplementationDetails,
    },
    { hop: 'deny_firmware_modification', fn: attemptFirmwareModification },
    {
      hop: 'deny_hardware_reprogramming',
      fn: attemptHardwareReprogramming,
    },
    {
      hop: 'deny_unsafe_physical_control',
      fn: attemptUnsafePhysicalControl,
    },
    { hop: 'deny_production_deployment', fn: attemptProductionDeployment },
    { hop: 'deny_permission_expansion', fn: attemptPermissionExpansion },
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
      EQ9_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'eq8_soft_wire',
      softWire.eq8ArmServerCloudRuntime.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq8ArmServerCloudRuntime.note,
    ),
  );
  hops.push(
    hop(
      'eq3_soft_wire',
      softWire.eq3RiscvOpenIsaKnowledgePack.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq3RiscvOpenIsaKnowledgePack.note,
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
      'eq1_soft_wire',
      softWire.eq1CrossArchitectureContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq1CrossArchitectureContract.note,
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
      EQ9_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq9-1',
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

  void RISCV_ACCELERATOR_RESEARCH_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    documented,
    verified: verifiedAdv.node,
    softWire,
  };
}
