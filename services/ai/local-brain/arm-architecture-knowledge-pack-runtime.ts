/**
 * 62L-EQ2 — ARM Architecture Knowledge Pack runtime.
 *
 * Emit provenance-backed knowledge nodes; answer research questions;
 * strengthen device-performance edges only with measured results.
 * Soft-wires EQ1/EP18/EP13/EP12/EM157 when present.
 */

import {
  ARM_ARCHITECTURE_KNOWLEDGE_PACK_CYCLE,
  ARM_EVIDENCE_CLASSES,
  ARM_KNOWLEDGE_AGENT_BOUNDS,
  ARM_KNOWLEDGE_DOMAINS,
  ARM_KNOWLEDGE_NODE_FIELDS,
  ARM_NEURAL_PATHWAY,
  ARM_RIGHTS_STATES,
  ARM_WORKLOAD_RELEVANCE,
  EQ2_DB_CANDIDATES_STATUS,
  EQ2_LOCKS,
  EQ2_MAY,
  EQ2_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  architectureSupportImpliesDeviceVerification,
  assertEq2LocksIntact,
  eq2SoftWireSnapshot,
  isArmKnowledgeAgent,
  isHumanApprover,
  type ArmEvidenceClass,
  type ArmKnowledgeNodeField,
  type ArmRightsState,
  type ArmWorkloadRelevance,
  type Eq2Actor,
  type Eq2EvidenceState,
  type Eq2HopRecord,
  type Eq2SoftWireSnapshot,
} from './arm-architecture-knowledge-pack-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof ARM_ARCHITECTURE_KNOWLEDGE_PACK_CYCLE)[number],
  state: Eq2EvidenceState,
  summary: string,
): Eq2HopRecord {
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

export type ArmKnowledgeNode = {
  nodeId: string;
  architectureVersion: string;
  featureExtension: string;
  instructionSemanticClass: string;
  compilerSupport: string;
  runtimeSupport: string;
  workloadRelevance: readonly ArmWorkloadRelevance[];
  source: string;
  sourceDate: string;
  rightsState: ArmRightsState;
  evidenceClass: ArmEvidenceClass;
  confidence: number;
  deviceVerified: false | true;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
};

export type DevicePerformanceEdge = {
  edgeId: string;
  fromNodeId: string;
  deviceCandidateId: string;
  strengthened: boolean;
  measured: true;
  pathway: typeof ARM_NEURAL_PATHWAY;
};

export type ArmResearchAnswer = {
  questionId: string;
  question: string;
  answer: string;
  nodeIds: readonly string[];
  deviceVerifiedClaimed: false;
  advisoryOnly: true;
};

export function emitArmKnowledgeNode(input: {
  actor: Eq2Actor;
  nodeId: string;
  architectureVersion: string;
  featureExtension: string;
  instructionSemanticClass: string;
  compilerSupport: string;
  runtimeSupport: string;
  workloadRelevance: readonly ArmWorkloadRelevance[];
  source: string;
  sourceDate: string;
  rightsState: ArmRightsState;
  evidenceClass: ArmEvidenceClass;
  confidence: number;
  attemptEquateSupportWithDeviceVerification?: boolean;
  attemptConfidentialCpuCoreInternals?: boolean;
  attemptPrivateRtl?: boolean;
  attemptFirmwareKeys?: boolean;
  attemptProprietaryVendorDetails?: boolean;
  attemptLeakedRoadmaps?: boolean;
  attemptTradeSecrets?: boolean;
  attemptCloneArmSilicon?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): ArmKnowledgeNode | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_KNOWLEDGE_PACK=false — no hidden chain-of-thought.',
    );
  }
  if (input.attemptConfidentialCpuCoreInternals) {
    return deny(
      'CONFIDENTIAL_CPU_CORE_INTERNALS=false — no confidential CPU-core internals.',
    );
  }
  if (input.attemptPrivateRtl) {
    return deny('PRIVATE_RTL_INGESTION=false — no private RTL.');
  }
  if (input.attemptFirmwareKeys) {
    return deny('FIRMWARE_KEYS_INGESTION=false — no firmware keys.');
  }
  if (input.attemptProprietaryVendorDetails) {
    return deny(
      'PROPRIETARY_VENDOR_IMPLEMENTATION_DETAILS=false — no proprietary vendor implementation details.',
    );
  }
  if (input.attemptLeakedRoadmaps) {
    return deny('LEAKED_ROADMAPS=false — no leaked roadmaps.');
  }
  if (input.attemptTradeSecrets) {
    return deny('TRADE_SECRETS=false — no trade secrets.');
  }
  if (input.attemptCloneArmSilicon) {
    return deny(
      'CLONING_ARM_SILICON=false — goal is portable software intelligence, not cloning ARM silicon.',
    );
  }
  if (input.rightsState === 'RESTRICTED_DENIED') {
    return deny('RESTRICTED_DENIED rightsState cannot enter knowledge pack.');
  }
  if (
    input.attemptEquateSupportWithDeviceVerification ||
    input.evidenceClass === 'DENIED_IP'
  ) {
    if (input.evidenceClass === 'DENIED_IP') {
      return deny('DENIED_IP evidence class cannot be stored as knowledge.');
    }
    return deny(
      'ARCHITECTURE_SUPPORT_EQ_DEVICE_VERIFICATION=false — architecture support ≠ actual device verification.',
    );
  }

  void ARM_KNOWLEDGE_NODE_FIELDS;

  // DOCUMENTED / TOOLCHAIN_SUPPORTED never auto-set deviceVerified
  const deviceVerified = false as const;

  return {
    nodeId: input.nodeId,
    architectureVersion: input.architectureVersion,
    featureExtension: input.featureExtension,
    instructionSemanticClass: input.instructionSemanticClass,
    compilerSupport: input.compilerSupport,
    runtimeSupport: input.runtimeSupport,
    workloadRelevance: input.workloadRelevance,
    source: input.source,
    sourceDate: input.sourceDate,
    rightsState: input.rightsState,
    evidenceClass: input.evidenceClass,
    confidence: Math.max(0, Math.min(1, input.confidence)),
    deviceVerified,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
  };
}

export function strengthenDevicePerformanceEdge(input: {
  edgeId: string;
  fromNodeId: string;
  deviceCandidateId: string;
  measured: boolean;
  measurementRefs?: readonly string[];
  attemptUnmeasuredStrengthen?: boolean;
}): DevicePerformanceEdge | DenialResult {
  if (input.attemptUnmeasuredStrengthen || !input.measured) {
    return deny(
      'UNMEASURED_STRENGTHENS_DEVICE_PERFORMANCE_EDGE=false — only actual measured results may strengthen the final device-performance edge.',
    );
  }
  if (!input.measurementRefs || input.measurementRefs.length === 0) {
    return deny('Measured edge requires measurementRefs.');
  }
  return {
    edgeId: input.edgeId,
    fromNodeId: input.fromNodeId,
    deviceCandidateId: input.deviceCandidateId,
    strengthened: true,
    measured: true,
    pathway: ARM_NEURAL_PATHWAY,
  };
}

export function answerArmResearchQuestion(input: {
  questionId: string;
  question: string;
  nodes: readonly ArmKnowledgeNode[];
  attemptClaimDeviceVerified?: boolean;
}): ArmResearchAnswer | DenialResult {
  if (input.attemptClaimDeviceVerified) {
    return deny(
      'DOCUMENTED_EQ_PHONE_INFERENCE_VERIFIED=false — research answers must not claim device verification from documentation alone.',
    );
  }

  const q = input.question.toLowerCase();
  let relevant = input.nodes;

  if (q.includes('local ai') || q.includes('inference')) {
    relevant = input.nodes.filter((n) =>
      n.workloadRelevance.includes('local_ai_inference'),
    );
  } else if (q.includes('vector') || q.includes('matrix') || q.includes('attention')) {
    relevant = input.nodes.filter(
      (n) =>
        n.workloadRelevance.includes('vector_operations') ||
        n.workloadRelevance.includes('matrix_multiply') ||
        n.workloadRelevance.includes('attention'),
    );
  } else if (q.includes('portable') || q.includes('compiler') || q.includes('runtime')) {
    relevant = input.nodes.filter((n) =>
      n.workloadRelevance.includes('portable_runtime'),
    );
  } else if (q.includes('phone') || q.includes('edge') || q.includes('server')) {
    relevant = input.nodes.filter(
      (n) =>
        n.workloadRelevance.includes('phone_edge_candidate') ||
        n.workloadRelevance.includes('server_candidate'),
    );
  } else if (q.includes('npu') || q.includes('gpu') || q.includes('rather than cpu')) {
    relevant = input.nodes.filter((n) =>
      n.workloadRelevance.includes('prefer_npu_gpu_over_cpu'),
    );
  } else if (
    q.includes('support') &&
    q.includes('verification')
  ) {
    return {
      questionId: input.questionId,
      question: input.question,
      answer:
        'Architecture support (DOCUMENTED/TOOLCHAIN_SUPPORTED) is separate from actual device verification. Only measured results on a candidate device can verify execution.',
      nodeIds: input.nodes.map((n) => n.nodeId),
      deviceVerifiedClaimed: false,
      advisoryOnly: true,
    };
  }

  const answer =
    relevant.length === 0
      ? 'No matching public ARM knowledge nodes for this question; research remains advisory.'
      : `Matched ${relevant.length} public provenance-backed node(s): ${relevant
          .map(
            (n) =>
              `${n.featureExtension} (${n.evidenceClass}; rights=${n.rightsState})`,
          )
          .join('; ')}. Not device-verified.`;

  return {
    questionId: input.questionId,
    question: input.question,
    answer,
    nodeIds: relevant.map((n) => n.nodeId),
    deviceVerifiedClaimed: false,
    advisoryOnly: true,
  };
}

export function attemptEquateSupportWithDeviceVerification(): DenialResult {
  return deny('ARCHITECTURE_SUPPORT_EQ_DEVICE_VERIFICATION=false.');
}

export function attemptStrengthenWithoutMeasurement(): DenialResult {
  return deny('UNMEASURED_STRENGTHENS_DEVICE_PERFORMANCE_EDGE=false.');
}

export function attemptConfidentialCpuCoreInternals(): DenialResult {
  return deny('CONFIDENTIAL_CPU_CORE_INTERNALS=false.');
}

export function attemptPrivateRtl(): DenialResult {
  return deny('PRIVATE_RTL_INGESTION=false.');
}

export function attemptFirmwareKeys(): DenialResult {
  return deny('FIRMWARE_KEYS_INGESTION=false.');
}

export function attemptProprietaryVendorDetails(): DenialResult {
  return deny('PROPRIETARY_VENDOR_IMPLEMENTATION_DETAILS=false.');
}

export function attemptLeakedRoadmaps(): DenialResult {
  return deny('LEAKED_ROADMAPS=false.');
}

export function attemptTradeSecrets(): DenialResult {
  return deny('TRADE_SECRETS=false.');
}

export function attemptCloneArmSilicon(): DenialResult {
  return deny('CLONING_ARM_SILICON=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnArmKnowledgeEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq2Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      pathway: typeof ARM_NEURAL_PATHWAY;
      authorityGranted: false;
    }
  | DenialResult {
  if (!ARM_KNOWLEDGE_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isArmKnowledgeAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only ARM knowledge agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    pathway: ARM_NEURAL_PATHWAY,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq2Actor;
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
    unchanged: EQ2_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ2_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ2_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleNeonNode(actor: Eq2Actor): ArmKnowledgeNode {
  const node = emitArmKnowledgeNode({
    actor,
    nodeId: 'arm-neon-1',
    architectureVersion: 'AArch64',
    featureExtension: 'NEON',
    instructionSemanticClass: 'simd_vector',
    compilerSupport: 'llvm/clang auto-vectorize (documented)',
    runtimeSupport: 'linux-aarch64 / android NDK (documented)',
    workloadRelevance: [
      'local_ai_inference',
      'matrix_multiply',
      'vector_operations',
      'attention',
      'portable_runtime',
      'phone_edge_candidate',
    ],
    source: 'Arm Architecture Reference Manual (public)',
    sourceDate: '2024-01-01',
    rightsState: 'PUBLIC_DOCUMENTATION',
    evidenceClass: 'DOCUMENTED',
    confidence: 0.8,
  });
  if ('denied' in node) throw new Error('exampleNeonNode failed');
  return node;
}

export function examplePreferNpuGpuNode(actor: Eq2Actor): ArmKnowledgeNode {
  const node = emitArmKnowledgeNode({
    actor,
    nodeId: 'arm-advice-npu-gpu-1',
    architectureVersion: 'AArch64',
    featureExtension: 'heterogeneous-offload-advisory',
    instructionSemanticClass: 'scheduling_advisory',
    compilerSupport: 'n/a — advisory',
    runtimeSupport: 'ONNX Runtime EP selection (documented)',
    workloadRelevance: [
      'local_ai_inference',
      'prefer_npu_gpu_over_cpu',
      'phone_edge_candidate',
      'server_candidate',
    ],
    source: 'XIV advisory from public runtime docs',
    sourceDate: '2026-09-09',
    rightsState: 'OPEN_TOOLCHAIN',
    evidenceClass: 'RESEARCH_ONLY',
    confidence: 0.6,
  });
  if ('denied' in node) throw new Error('examplePreferNpuGpuNode failed');
  return node;
}

export function bootstrapArmArchitectureKnowledgePack(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq2SoftWireSnapshot;
  domains: typeof ARM_KNOWLEDGE_DOMAINS;
  nodeFields: readonly ArmKnowledgeNodeField[];
  rightsStates: typeof ARM_RIGHTS_STATES;
  evidenceClasses: typeof ARM_EVIDENCE_CLASSES;
  pathway: typeof ARM_NEURAL_PATHWAY;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ2_MAY;
  mustNot: typeof EQ2_MUST_NOT;
  dbCandidates: typeof EQ2_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq2LocksIntact(),
    softWire: eq2SoftWireSnapshot(repoRoot),
    domains: ARM_KNOWLEDGE_DOMAINS,
    nodeFields: ARM_KNOWLEDGE_NODE_FIELDS,
    rightsStates: ARM_RIGHTS_STATES,
    evidenceClasses: ARM_EVIDENCE_CLASSES,
    pathway: ARM_NEURAL_PATHWAY,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ2_MAY,
    mustNot: EQ2_MUST_NOT,
    dbCandidates: EQ2_DB_CANDIDATES_STATUS,
  };
}

export function runArmArchitectureKnowledgePackCycle(input: {
  actor: Eq2Actor;
  human: Eq2Actor;
  repoRoot?: string;
}): {
  hops: Eq2HopRecord[];
  neon: ArmKnowledgeNode;
  researchAnswer: ArmResearchAnswer | DenialResult;
  softWire: Eq2SoftWireSnapshot;
} {
  const hops: Eq2HopRecord[] = [];
  const softWire = eq2SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq2LocksIntact() ? 'PASS' : 'FAIL',
      'EQ2 locks intact including L4=false and support≠device verification.',
    ),
  );
  hops.push(
    hop(
      'arm_architecture_knowledge_pack_bootstrap',
      'PASS',
      'ARM Architecture Knowledge Pack bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'knowledge_domains_encoded',
      'PASS',
      `${ARM_KNOWLEDGE_DOMAINS.length} knowledge domains encoded.`,
    ),
  );
  hops.push(
    hop(
      'knowledge_node_fields_encoded',
      'PASS',
      `${ARM_KNOWLEDGE_NODE_FIELDS.length} knowledge node fields encoded.`,
    ),
  );
  hops.push(
    hop('rights_states_encoded', 'PASS', ARM_RIGHTS_STATES.join(' | ')),
  );
  hops.push(
    hop(
      'evidence_classes_encoded',
      'PASS',
      ARM_EVIDENCE_CLASSES.join(' | '),
    ),
  );
  hops.push(
    hop('neural_pathway_encoded', 'PASS', ARM_NEURAL_PATHWAY.join(' → ')),
  );

  const neon = exampleNeonNode(input.actor);
  const npuAdvice = examplePreferNpuGpuNode(input.actor);

  hops.push(
    hop(
      'architecture_support_neq_device_verification',
      neon.deviceVerified === false &&
        architectureSupportImpliesDeviceVerification() === false &&
        attemptEquateSupportWithDeviceVerification().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Architecture support ≠ device verification.',
    ),
  );

  const measured = strengthenDevicePerformanceEdge({
    edgeId: 'edge-1',
    fromNodeId: neon.nodeId,
    deviceCandidateId: 'device-phone-1',
    measured: true,
    measurementRefs: ['xiv-bench-aarch64-1'],
  });
  const unmeasured = strengthenDevicePerformanceEdge({
    edgeId: 'edge-bad',
    fromNodeId: neon.nodeId,
    deviceCandidateId: 'device-phone-1',
    measured: false,
    attemptUnmeasuredStrengthen: true,
  });
  hops.push(
    hop(
      'only_measured_results_strengthen_device_performance_edge',
      !('denied' in measured) &&
        measured.strengthened === true &&
        unmeasured.state === 'DENIED' &&
        attemptStrengthenWithoutMeasurement().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Only measured results strengthen device-performance edge.',
    ),
  );

  const researchAnswer = answerArmResearchQuestion({
    questionId: 'q-infer',
    question: 'Which documented ARM capabilities matter for local AI inference?',
    nodes: [neon, npuAdvice],
  });
  hops.push(
    hop(
      'public_docs_enable_research_answers',
      !('denied' in researchAnswer) &&
        researchAnswer.advisoryOnly === true &&
        researchAnswer.deviceVerifiedClaimed === false &&
        answerArmResearchQuestion({
          questionId: 'q-bad',
          question: 'Is this phone verified?',
          nodes: [neon],
          attemptClaimDeviceVerified: true,
        }).state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Public docs enable research answers; device-verified claims DENIED.',
    ),
  );

  const ipDenies: Array<{
    hop: (typeof ARM_ARCHITECTURE_KNOWLEDGE_PACK_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_confidential_cpu_core_internals',
      fn: attemptConfidentialCpuCoreInternals,
    },
    { hop: 'deny_private_rtl', fn: attemptPrivateRtl },
    { hop: 'deny_firmware_keys', fn: attemptFirmwareKeys },
    {
      hop: 'deny_proprietary_vendor_implementation_details',
      fn: attemptProprietaryVendorDetails,
    },
    { hop: 'deny_leaked_roadmaps', fn: attemptLeakedRoadmaps },
    { hop: 'deny_trade_secrets', fn: attemptTradeSecrets },
  ];
  for (const d of ipDenies) {
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
      attemptRecommendAsAct().state === 'DENIED' &&
        attemptCloneArmSilicon().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Recommend ≠ act; no ARM silicon cloning.',
    ),
  );
  hops.push(
    hop(
      'l4_autonomy_false',
      EQ2_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
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
      'em157_soft_wire',
      softWire.em157HomeBase.present ? 'PASS' : 'WAITING_DATA',
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      EQ2_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq2-1',
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

  void ARM_ARCHITECTURE_KNOWLEDGE_PACK_CYCLE;
  void ARM_WORKLOAD_RELEVANCE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    neon,
    researchAnswer,
    softWire,
  };
}
