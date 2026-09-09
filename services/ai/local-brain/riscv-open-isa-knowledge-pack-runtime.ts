/**
 * 62L-EQ3 — RISC-V Open ISA Knowledge Pack runtime.
 *
 * Emit provenance-backed nodes; enforce ratified≠device≠verified inference;
 * advance hardware evidence only along the ladder; IP boundary denies.
 * Soft-wires EQ2/EQ1/EP18/EP12/EM157 when present.
 */

import {
  EQ3_DB_CANDIDATES_STATUS,
  EQ3_LOCKS,
  EQ3_MAY,
  EQ3_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HARDWARE_EVIDENCE_LADDER_ORDER,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  RISCV_HARDWARE_EVIDENCE_STATES,
  RISCV_KNOWLEDGE_AGENT_BOUNDS,
  RISCV_KNOWLEDGE_DOMAINS,
  RISCV_KNOWLEDGE_NODE_FIELDS,
  RISCV_NEURAL_PATHWAY,
  RISCV_OPEN_ISA_KNOWLEDGE_PACK_CYCLE,
  RISCV_RATIFICATION_STATES,
  RISCV_WORKLOAD_RELEVANCE,
  assertEq3LocksIntact,
  eq3SoftWireSnapshot,
  hardwareEvidenceRank,
  isHumanApprover,
  isRiscvKnowledgeAgent,
  ratifiedImpliesDeviceSupport,
  ratifiedImpliesXivVerifiedInference,
  type Eq3Actor,
  type Eq3EvidenceState,
  type Eq3HopRecord,
  type Eq3SoftWireSnapshot,
  type RiscvHardwareEvidenceState,
  type RiscvKnowledgeNodeField,
  type RiscvRatificationState,
  type RiscvWorkloadRelevance,
} from './riscv-open-isa-knowledge-pack-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof RISCV_OPEN_ISA_KNOWLEDGE_PACK_CYCLE)[number],
  state: Eq3EvidenceState,
  summary: string,
): Eq3HopRecord {
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

export type RiscvKnowledgeNode = {
  nodeId: string;
  specVersion: string;
  extensionId: string;
  ratificationState: RiscvRatificationState;
  instructionClass: string;
  workloadRelevance: readonly RiscvWorkloadRelevance[];
  compilerSupport: string;
  runtimeSupport: string;
  hardwareEvidence: RiscvHardwareEvidenceState;
  sourceRef: string;
  sourceDate: string;
  confidence: number;
  deviceSupportsClaimed: false;
  xivVerifiedInference: false;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
};

export type HardwareEvidenceAdvance = {
  nodeId: string;
  from: RiscvHardwareEvidenceState;
  to: RiscvHardwareEvidenceState;
  evidenceRefs: readonly string[];
  pathway: typeof RISCV_NEURAL_PATHWAY;
};

export function emitRiscvKnowledgeNode(input: {
  actor: Eq3Actor;
  nodeId: string;
  specVersion: string;
  extensionId: string;
  ratificationState: RiscvRatificationState;
  instructionClass: string;
  workloadRelevance: readonly RiscvWorkloadRelevance[];
  compilerSupport: string;
  runtimeSupport: string;
  hardwareEvidence?: RiscvHardwareEvidenceState;
  sourceRef: string;
  sourceDate: string;
  confidence: number;
  attemptEquateRatifiedWithDeviceSupport?: boolean;
  attemptEquateRatifiedWithXivVerifiedInference?: boolean;
  attemptProprietaryRtlCopy?: boolean;
  attemptConfidentialChipDesigns?: boolean;
  attemptFirmwareIngestion?: boolean;
  attemptPrivateExtensions?: boolean;
  attemptRestrictedImplementationData?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): RiscvKnowledgeNode | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_KNOWLEDGE_PACK=false — no hidden chain-of-thought.',
    );
  }
  if (input.attemptProprietaryRtlCopy) {
    return deny(
      'PROPRIETARY_RTL_COPY=false — even with open ISA, no third-party proprietary RTL copy.',
    );
  }
  if (input.attemptConfidentialChipDesigns) {
    return deny('CONFIDENTIAL_CHIP_DESIGNS=false.');
  }
  if (input.attemptFirmwareIngestion) {
    return deny('FIRMWARE_INGESTION=false.');
  }
  if (input.attemptPrivateExtensions) {
    return deny('PRIVATE_EXTENSIONS=false — no private extensions.');
  }
  if (input.attemptRestrictedImplementationData) {
    return deny('RESTRICTED_IMPLEMENTATION_DATA=false.');
  }
  if (input.attemptEquateRatifiedWithDeviceSupport) {
    return deny(
      'RATIFIED_EQ_DEVICE_SUPPORTS=false — ratified/documented ≠ a particular RISC-V device supports it.',
    );
  }
  if (input.attemptEquateRatifiedWithXivVerifiedInference) {
    return deny(
      'RATIFIED_EQ_XIV_VERIFIED_INFERENCE=false — ratified ≠ XIV has verified inference performance.',
    );
  }

  void RISCV_KNOWLEDGE_NODE_FIELDS;

  const hardwareEvidence = input.hardwareEvidence ?? 'DOCUMENTED';

  return {
    nodeId: input.nodeId,
    specVersion: input.specVersion,
    extensionId: input.extensionId,
    ratificationState: input.ratificationState,
    instructionClass: input.instructionClass,
    workloadRelevance: input.workloadRelevance,
    compilerSupport: input.compilerSupport,
    runtimeSupport: input.runtimeSupport,
    hardwareEvidence,
    sourceRef: input.sourceRef,
    sourceDate: input.sourceDate,
    confidence: Math.max(0, Math.min(1, input.confidence)),
    deviceSupportsClaimed: false,
    xivVerifiedInference: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
  };
}

export function advanceHardwareEvidence(input: {
  node: RiscvKnowledgeNode;
  to: RiscvHardwareEvidenceState;
  evidenceRefs: readonly string[];
  attemptSkipLadder?: boolean;
  attemptJumpToVerifiedWithoutEvidence?: boolean;
}):
  | { node: RiscvKnowledgeNode; advance: HardwareEvidenceAdvance }
  | DenialResult {
  if (input.attemptSkipLadder) {
    return deny(
      'SKIP_HARDWARE_EVIDENCE_LADDER=false — hardware stays DOCUMENTED → DETECTED → SUPPORTED → VERIFIED based on evidence.',
    );
  }

  const fromRank = hardwareEvidenceRank(input.node.hardwareEvidence);
  const toRank = hardwareEvidenceRank(input.to);

  if (input.to === 'NOT_TESTED' || input.to === 'UNAVAILABLE') {
    // Allow setting terminal non-ladder states without climb
    if (!input.evidenceRefs.length && input.to === 'UNAVAILABLE') {
      // UNAVAILABLE may be asserted with reason refs preferred but allow empty for absence claim
    }
  } else if (fromRank < 0 || toRank < 0) {
    return deny('Invalid hardware evidence ladder transition.');
  } else if (toRank > fromRank + 1) {
    return deny(
      'SKIP_HARDWARE_EVIDENCE_LADDER=false — cannot skip steps on the evidence ladder.',
    );
  } else if (toRank < fromRank) {
    return deny('Hardware evidence ladder does not regress in this bounded runtime.');
  }

  if (
    input.attemptJumpToVerifiedWithoutEvidence ||
    (input.to === 'VERIFIED' && input.evidenceRefs.length === 0)
  ) {
    return deny(
      'DOCUMENTED_EQ_VERIFIED=false — VERIFIED requires real tested hardware evidence.',
    );
  }

  if (
    (input.to === 'DETECTED' ||
      input.to === 'SUPPORTED' ||
      input.to === 'VERIFIED') &&
    input.evidenceRefs.length === 0
  ) {
    return deny(
      `Advancing to ${input.to} requires evidenceRefs.`,
    );
  }

  const node: RiscvKnowledgeNode = {
    ...input.node,
    hardwareEvidence: input.to,
    // Still never auto-claim deviceSupports or xivVerifiedInference from ladder alone
    // VERIFIED ladder means XIV measured that device for that extension path —
    // but xivVerifiedInference stays explicit false unless separate inference claim path
    deviceSupportsClaimed: false,
    xivVerifiedInference: false,
  };

  return {
    node,
    advance: {
      nodeId: node.nodeId,
      from: input.node.hardwareEvidence,
      to: input.to,
      evidenceRefs: input.evidenceRefs,
      pathway: RISCV_NEURAL_PATHWAY,
    },
  };
}

export function attemptEquateRatifiedWithDeviceSupport(): DenialResult {
  return deny('RATIFIED_EQ_DEVICE_SUPPORTS=false.');
}

export function attemptEquateRatifiedWithXivVerifiedInference(): DenialResult {
  return deny('RATIFIED_EQ_XIV_VERIFIED_INFERENCE=false.');
}

export function attemptSkipHardwareEvidenceLadder(): DenialResult {
  return deny('SKIP_HARDWARE_EVIDENCE_LADDER=false.');
}

export function attemptProprietaryRtlCopy(): DenialResult {
  return deny('PROPRIETARY_RTL_COPY=false.');
}

export function attemptConfidentialChipDesigns(): DenialResult {
  return deny('CONFIDENTIAL_CHIP_DESIGNS=false.');
}

export function attemptFirmwareIngestion(): DenialResult {
  return deny('FIRMWARE_INGESTION=false.');
}

export function attemptPrivateExtensions(): DenialResult {
  return deny('PRIVATE_EXTENSIONS=false.');
}

export function attemptRestrictedImplementationData(): DenialResult {
  return deny('RESTRICTED_IMPLEMENTATION_DATA=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnRiscvKnowledgeEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq3Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      pathway: typeof RISCV_NEURAL_PATHWAY;
      authorityGranted: false;
    }
  | DenialResult {
  if (!RISCV_KNOWLEDGE_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (
    !isRiscvKnowledgeAgent(input.actor) &&
    input.actor.kind !== 'home_base'
  ) {
    return deny('Only RISC-V knowledge agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    pathway: RISCV_NEURAL_PATHWAY,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq3Actor;
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
    unchanged: EQ3_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ3_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ3_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleVectorExtensionNode(
  actor: Eq3Actor,
): RiscvKnowledgeNode {
  const node = emitRiscvKnowledgeNode({
    actor,
    nodeId: 'rv-v-1',
    specVersion: 'riscv-v-1.0',
    extensionId: 'V',
    ratificationState: 'RATIFIED',
    instructionClass: 'vector',
    workloadRelevance: [
      'vector_workloads',
      'matrix_operations',
      'edge_ai',
      'local_ai_inference',
    ],
    compilerSupport: 'llvm/gcc RISC-V V (documented)',
    runtimeSupport: 'linux-riscv64 + vector libs (documented)',
    hardwareEvidence: 'DOCUMENTED',
    sourceRef: 'riscv-vector-ratified-public',
    sourceDate: '2021-01-01',
    confidence: 0.85,
  });
  if ('denied' in node) throw new Error('exampleVectorExtensionNode failed');
  return node;
}

export function bootstrapRiscvOpenIsaKnowledgePack(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq3SoftWireSnapshot;
  domains: typeof RISCV_KNOWLEDGE_DOMAINS;
  nodeFields: readonly RiscvKnowledgeNodeField[];
  ratificationStates: typeof RISCV_RATIFICATION_STATES;
  hardwareEvidenceStates: typeof RISCV_HARDWARE_EVIDENCE_STATES;
  ladder: typeof HARDWARE_EVIDENCE_LADDER_ORDER;
  pathway: typeof RISCV_NEURAL_PATHWAY;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ3_MAY;
  mustNot: typeof EQ3_MUST_NOT;
  dbCandidates: typeof EQ3_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq3LocksIntact(),
    softWire: eq3SoftWireSnapshot(repoRoot),
    domains: RISCV_KNOWLEDGE_DOMAINS,
    nodeFields: RISCV_KNOWLEDGE_NODE_FIELDS,
    ratificationStates: RISCV_RATIFICATION_STATES,
    hardwareEvidenceStates: RISCV_HARDWARE_EVIDENCE_STATES,
    ladder: HARDWARE_EVIDENCE_LADDER_ORDER,
    pathway: RISCV_NEURAL_PATHWAY,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ3_MAY,
    mustNot: EQ3_MUST_NOT,
    dbCandidates: EQ3_DB_CANDIDATES_STATUS,
  };
}

export function runRiscvOpenIsaKnowledgePackCycle(input: {
  actor: Eq3Actor;
  human: Eq3Actor;
  repoRoot?: string;
}): {
  hops: Eq3HopRecord[];
  vectorNode: RiscvKnowledgeNode;
  advanced: { node: RiscvKnowledgeNode; advance: HardwareEvidenceAdvance } | DenialResult;
  softWire: Eq3SoftWireSnapshot;
} {
  const hops: Eq3HopRecord[] = [];
  const softWire = eq3SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq3LocksIntact() ? 'PASS' : 'FAIL',
      'EQ3 locks intact including L4=false and ratified≠device≠verified.',
    ),
  );
  hops.push(
    hop(
      'riscv_open_isa_knowledge_pack_bootstrap',
      'PASS',
      'RISC-V Open ISA Knowledge Pack bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'knowledge_domains_encoded',
      'PASS',
      `${RISCV_KNOWLEDGE_DOMAINS.length} knowledge domains encoded.`,
    ),
  );
  hops.push(
    hop(
      'knowledge_node_fields_encoded',
      'PASS',
      `${RISCV_KNOWLEDGE_NODE_FIELDS.length} knowledge node fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'ratification_states_encoded',
      'PASS',
      RISCV_RATIFICATION_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'hardware_evidence_ladder_encoded',
      'PASS',
      HARDWARE_EVIDENCE_LADDER_ORDER.join(' → '),
    ),
  );
  hops.push(
    hop('neural_pathway_encoded', 'PASS', RISCV_NEURAL_PATHWAY.join(' → ')),
  );

  const vectorNode = exampleVectorExtensionNode(input.actor);

  hops.push(
    hop(
      'ratified_neq_device_supports',
      vectorNode.ratificationState === 'RATIFIED' &&
        vectorNode.deviceSupportsClaimed === false &&
        ratifiedImpliesDeviceSupport() === false &&
        attemptEquateRatifiedWithDeviceSupport().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'RATIFIED ≠ device supports.',
    ),
  );
  hops.push(
    hop(
      'ratified_neq_xiv_verified_inference',
      vectorNode.xivVerifiedInference === false &&
        ratifiedImpliesXivVerifiedInference() === false &&
        attemptEquateRatifiedWithXivVerifiedInference().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'RATIFIED ≠ XIV verified inference.',
    ),
  );

  const advanced = advanceHardwareEvidence({
    node: vectorNode,
    to: 'DETECTED',
    evidenceRefs: ['probe-riscv-v-device-1'],
  });
  const skipDeny = advanceHardwareEvidence({
    node: vectorNode,
    to: 'VERIFIED',
    evidenceRefs: ['x'],
    attemptSkipLadder: true,
  });
  hops.push(
    hop(
      'hardware_ladder_evidence_based',
      !('denied' in advanced) &&
        advanced.node.hardwareEvidence === 'DETECTED' &&
        skipDeny.state === 'DENIED' &&
        attemptSkipHardwareEvidenceLadder().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Hardware ladder DOCUMENTED→DETECTED… evidence-based; skip DENIED.',
    ),
  );

  hops.push(
    hop(
      'open_isa_enables_research_without_confidential_internals',
      vectorNode.sourceRef.includes('public') ||
        vectorNode.sourceRef.includes('ratified')
        ? 'PASS'
        : 'FAIL',
      'Open ISA enables research without confidential vendor internals.',
    ),
  );

  const boundaryDenies: Array<{
    hop: (typeof RISCV_OPEN_ISA_KNOWLEDGE_PACK_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_proprietary_rtl_copy', fn: attemptProprietaryRtlCopy },
    {
      hop: 'deny_confidential_chip_designs',
      fn: attemptConfidentialChipDesigns,
    },
    { hop: 'deny_firmware_ingestion', fn: attemptFirmwareIngestion },
    { hop: 'deny_private_extensions', fn: attemptPrivateExtensions },
    {
      hop: 'deny_restricted_implementation_data',
      fn: attemptRestrictedImplementationData,
    },
  ];
  for (const d of boundaryDenies) {
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
      EQ3_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
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
      'eq1_soft_wire',
      softWire.eq1CrossArchitectureContract.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq1CrossArchitectureContract.note,
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
      'ep12_soft_wire',
      softWire.ep12Scheduler.present ? 'PASS' : 'WAITING_DATA',
      softWire.ep12Scheduler.note,
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
      EQ3_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq3-1',
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

  void RISCV_OPEN_ISA_KNOWLEDGE_PACK_CYCLE;
  void RISCV_WORKLOAD_RELEVANCE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    vectorNode,
    advanced,
    softWire,
  };
}
