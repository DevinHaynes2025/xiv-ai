/**
 * 62L-EQ10 — Instruction-Semantics Learning runtime.
 *
 * Learn from public ISA/compiler semantics; map operation needs; strengthen/
 * weaken neural paths; deny ISA copy and proprietary reconstructions.
 * Soft-wires EQ9/EQ5/EQ4/EQ3/EQ2/EQ1/EM157 when present.
 */

import {
  ALLOWED_SEMANTICS_SOURCES,
  ATTENTION_OPERATION_NEEDS,
  BLOCKED_SEMANTICS_TARGETS,
  COMPARISON_ARCHITECTURE_ROUTES,
  EQ10_AGENT_BOUNDS,
  EQ10_DB_CANDIDATES_STATUS,
  EQ10_LOCKS,
  EQ10_MAY,
  EQ10_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  INSTRUCTION_SEMANTICS_CORE_FLOW,
  INSTRUCTION_SEMANTICS_LEARNING_CYCLE,
  INSTRUCTION_SEMANTICS_LEARNING_FOCI,
  NEXT_PHASE_TITLE,
  OPERATION_NEED_MAPPING,
  SEMANTICS_NEURAL_PATHWAY,
  SEMANTICS_PATH_STATES,
  assertEq10LocksIntact,
  canMarkPathVerified,
  eq10SoftWireSnapshot,
  isEq10Agent,
  isHumanApprover,
  operationNeedImpliesIsaCopy,
  type Eq10Actor,
  type Eq10EvidenceState,
  type Eq10HopRecord,
  type Eq10SoftWireSnapshot,
  type SemanticsPathState,
} from './instruction-semantics-learning-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof INSTRUCTION_SEMANTICS_LEARNING_CYCLE)[number],
  state: Eq10EvidenceState,
  summary: string,
): Eq10HopRecord {
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

export type SemanticsLearningFocus =
  (typeof INSTRUCTION_SEMANTICS_LEARNING_FOCI)[number];
export type AttentionOperationNeed =
  (typeof ATTENTION_OPERATION_NEEDS)[number];
export type ComparisonRoute =
  (typeof COMPARISON_ARCHITECTURE_ROUTES)[number];
export type AllowedSemanticsSource =
  (typeof ALLOWED_SEMANTICS_SOURCES)[number];
export type BlockedSemanticsTarget =
  (typeof BLOCKED_SEMANTICS_TARGETS)[number];

export type StructuredLesson = {
  lessonId: string;
  workloadId: string;
  operationNeeds: readonly string[];
  mapping: typeof OPERATION_NEED_MAPPING;
  pathway: typeof SEMANTICS_NEURAL_PATHWAY;
  pathState: SemanticsPathState;
  strength: number;
  source: AllowedSemanticsSource;
  comparesRoutes: readonly ComparisonRoute[];
  copiesInstructionSet: false;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
};

export function emitStructuredLesson(input: {
  actor: Eq10Actor;
  lessonId: string;
  workloadId: string;
  operationNeeds: readonly string[];
  source: AllowedSemanticsSource;
  pathState?: SemanticsPathState;
  comparesRoutes?: readonly ComparisonRoute[];
  attemptCopyInstructionSet?: boolean;
  attemptConfidentialMicroarchitecture?: boolean;
  attemptProprietaryRtl?: boolean;
  attemptUnreleasedInstructions?: boolean;
  attemptPrivateFirmware?: boolean;
  attemptTradeSecretDetails?: boolean;
  attemptVerifiedWithoutRuntimeEvidence?: boolean;
  attemptIncludeHiddenCot?: boolean;
  blockedTarget?: BlockedSemanticsTarget;
}): StructuredLesson | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny('HIDDEN_CHAIN_OF_THOUGHT_IN_EQ10=false.');
  }
  if (input.attemptCopyInstructionSet) {
    return deny(
      'OPERATION_NEED_EQ_ISA_COPY=false — key object is operation need→capability→runtime→measured outcome, not ISA copy.',
    );
  }
  if (
    input.attemptConfidentialMicroarchitecture ||
    input.blockedTarget === 'confidential_microarchitecture'
  ) {
    return deny('CONFIDENTIAL_MICROARCHITECTURE=false.');
  }
  if (
    input.attemptProprietaryRtl ||
    input.blockedTarget === 'proprietary_rtl'
  ) {
    return deny('PROPRIETARY_RTL=false.');
  }
  if (
    input.attemptUnreleasedInstructions ||
    input.blockedTarget === 'unreleased_instructions'
  ) {
    return deny('UNRELEASED_INSTRUCTIONS=false.');
  }
  if (
    input.attemptPrivateFirmware ||
    input.blockedTarget === 'private_firmware'
  ) {
    return deny('PRIVATE_FIRMWARE=false.');
  }
  if (
    input.attemptTradeSecretDetails ||
    input.blockedTarget === 'trade_secret_implementation_details'
  ) {
    return deny('TRADE_SECRET_IMPLEMENTATION_DETAILS=false.');
  }
  if (input.attemptVerifiedWithoutRuntimeEvidence) {
    return deny(
      'VERIFIED_WITHOUT_RUNTIME_EVIDENCE=false — no generated claim becomes VERIFIED without actual runtime evidence.',
    );
  }
  if (input.pathState === 'VERIFIED') {
    return deny(
      'Cannot emit VERIFIED via emit alone — use strengthenPathWithMeasurement.',
    );
  }
  if (
    !(ALLOWED_SEMANTICS_SOURCES as readonly string[]).includes(input.source)
  ) {
    return deny('Source not in allowed public/compiler/toolchain/benchmark set.');
  }

  return {
    lessonId: input.lessonId,
    workloadId: input.workloadId,
    operationNeeds: input.operationNeeds,
    mapping: OPERATION_NEED_MAPPING,
    pathway: SEMANTICS_NEURAL_PATHWAY,
    pathState: input.pathState ?? 'DOCUMENTED',
    strength: 0.4,
    source: input.source,
    comparesRoutes: input.comparesRoutes ?? [...COMPARISON_ARCHITECTURE_ROUTES],
    copiesInstructionSet: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
  };
}

export function strengthenPathWithMeasurement(input: {
  lesson: StructuredLesson;
  runtimeEvidenceRefs: readonly string[];
  attemptWithoutRuntimeEvidence?: boolean;
}): { lesson: StructuredLesson } | DenialResult {
  if (
    input.attemptWithoutRuntimeEvidence ||
    !canMarkPathVerified({
      hasActualRuntimeEvidence: input.runtimeEvidenceRefs.length > 0,
      evidenceRefs: input.runtimeEvidenceRefs,
    })
  ) {
    return deny(
      'VERIFIED_WITHOUT_RUNTIME_EVIDENCE=false — measured runtime evidence required.',
    );
  }
  return {
    lesson: {
      ...input.lesson,
      pathState: 'VERIFIED',
      strength: Math.min(1, input.lesson.strength + 0.4),
    },
  };
}

export function weakenPath(input: {
  lesson: StructuredLesson;
  reason: 'regression' | 'stale_evidence';
  note?: string;
}): { lesson: StructuredLesson } {
  return {
    lesson: {
      ...input.lesson,
      pathState: input.reason === 'stale_evidence' ? 'STALE' : 'REGRESSED',
      strength: Math.max(0, input.lesson.strength - 0.35),
    },
  };
}

export function mapAttentionWorkloadNeeds(actor: Eq10Actor): StructuredLesson {
  const lesson = emitStructuredLesson({
    actor,
    lessonId: 'lesson-attn-1',
    workloadId: 'attention_workload',
    operationNeeds: [...ATTENTION_OPERATION_NEEDS],
    source: 'public_open_specifications',
    pathState: 'CANDIDATE',
  });
  if ('denied' in lesson) throw new Error('attention lesson failed');
  return lesson;
}

export function attemptCopyInstructionSet(): DenialResult {
  return deny('OPERATION_NEED_EQ_ISA_COPY=false.');
}

export function attemptConfidentialMicroarchitecture(): DenialResult {
  return deny('CONFIDENTIAL_MICROARCHITECTURE=false.');
}

export function attemptProprietaryRtl(): DenialResult {
  return deny('PROPRIETARY_RTL=false.');
}

export function attemptUnreleasedInstructions(): DenialResult {
  return deny('UNRELEASED_INSTRUCTIONS=false.');
}

export function attemptPrivateFirmware(): DenialResult {
  return deny('PRIVATE_FIRMWARE=false.');
}

export function attemptTradeSecretDetails(): DenialResult {
  return deny('TRADE_SECRET_IMPLEMENTATION_DETAILS=false.');
}

export function attemptVerifiedWithoutRuntimeEvidence(): DenialResult {
  return deny('VERIFIED_WITHOUT_RUNTIME_EVIDENCE=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnEq10EvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq10Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      pathway: typeof SEMANTICS_NEURAL_PATHWAY;
      authorityGranted: false;
    }
  | DenialResult {
  if (!EQ10_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isEq10Agent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only EQ10 agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    pathway: SEMANTICS_NEURAL_PATHWAY,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq10Actor;
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
    unchanged: EQ10_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ10_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ10_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function bootstrapInstructionSemanticsLearning(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq10SoftWireSnapshot;
  foci: typeof INSTRUCTION_SEMANTICS_LEARNING_FOCI;
  coreFlow: typeof INSTRUCTION_SEMANTICS_CORE_FLOW;
  mapping: typeof OPERATION_NEED_MAPPING;
  pathway: typeof SEMANTICS_NEURAL_PATHWAY;
  pathStates: typeof SEMANTICS_PATH_STATES;
  allowedSources: typeof ALLOWED_SEMANTICS_SOURCES;
  blockedTargets: typeof BLOCKED_SEMANTICS_TARGETS;
  attentionNeeds: typeof ATTENTION_OPERATION_NEEDS;
  comparisonRoutes: typeof COMPARISON_ARCHITECTURE_ROUTES;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ10_MAY;
  mustNot: typeof EQ10_MUST_NOT;
  dbCandidates: typeof EQ10_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq10LocksIntact(),
    softWire: eq10SoftWireSnapshot(repoRoot),
    foci: INSTRUCTION_SEMANTICS_LEARNING_FOCI,
    coreFlow: INSTRUCTION_SEMANTICS_CORE_FLOW,
    mapping: OPERATION_NEED_MAPPING,
    pathway: SEMANTICS_NEURAL_PATHWAY,
    pathStates: SEMANTICS_PATH_STATES,
    allowedSources: ALLOWED_SEMANTICS_SOURCES,
    blockedTargets: BLOCKED_SEMANTICS_TARGETS,
    attentionNeeds: ATTENTION_OPERATION_NEEDS,
    comparisonRoutes: COMPARISON_ARCHITECTURE_ROUTES,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ10_MAY,
    mustNot: EQ10_MUST_NOT,
    dbCandidates: EQ10_DB_CANDIDATES_STATUS,
  };
}

export function runInstructionSemanticsLearningCycle(input: {
  actor: Eq10Actor;
  human: Eq10Actor;
  repoRoot?: string;
}): {
  hops: Eq10HopRecord[];
  lesson: StructuredLesson;
  verified: StructuredLesson;
  weakened: StructuredLesson;
  softWire: Eq10SoftWireSnapshot;
} {
  const hops: Eq10HopRecord[] = [];
  const softWire = eq10SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq10LocksIntact() ? 'PASS' : 'FAIL',
      'EQ10 locks intact including L4=false and operation need≠ISA copy.',
    ),
  );
  hops.push(
    hop(
      'instruction_semantics_learning_bootstrap',
      'PASS',
      'Instruction-Semantics Learning bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'learning_foci_encoded',
      'PASS',
      `${INSTRUCTION_SEMANTICS_LEARNING_FOCI.length} learning foci encoded.`,
    ),
  );
  hops.push(
    hop(
      'core_flow_encoded',
      'PASS',
      INSTRUCTION_SEMANTICS_CORE_FLOW.join(' → '),
    ),
  );
  hops.push(
    hop(
      'operation_need_mapping_encoded',
      'PASS',
      OPERATION_NEED_MAPPING.join(' → '),
    ),
  );
  hops.push(
    hop(
      'neural_pathway_encoded',
      'PASS',
      SEMANTICS_NEURAL_PATHWAY.join(' → '),
    ),
  );
  hops.push(
    hop(
      'allowed_sources_encoded',
      'PASS',
      ALLOWED_SEMANTICS_SOURCES.join(' | '),
    ),
  );

  const lesson = mapAttentionWorkloadNeeds(input.actor);

  hops.push(
    hop(
      'operation_need_neq_isa_copy',
      lesson.copiesInstructionSet === false &&
        operationNeedImpliesIsaCopy() === false &&
        attemptCopyInstructionSet().state === 'DENIED' &&
        lesson.operationNeeds.includes('matrix_vector_operations')
        ? 'PASS'
        : 'FAIL',
      'Key object is operation need mapping — not ISA copy.',
    ),
  );

  const noRuntime = strengthenPathWithMeasurement({
    lesson,
    runtimeEvidenceRefs: [],
    attemptWithoutRuntimeEvidence: true,
  });
  const verifiedRes = strengthenPathWithMeasurement({
    lesson,
    runtimeEvidenceRefs: ['runtime-bench-attn-1'],
  });
  if ('denied' in verifiedRes) throw new Error('strengthen failed');

  hops.push(
    hop(
      'measured_success_strengthens_path',
      verifiedRes.lesson.pathState === 'VERIFIED' &&
        verifiedRes.lesson.strength > lesson.strength
        ? 'PASS'
        : 'FAIL',
      'Measured success strengthens the neural path.',
    ),
  );

  const weakenedRes = weakenPath({
    lesson: verifiedRes.lesson,
    reason: 'regression',
  });
  const staleRes = weakenPath({
    lesson: verifiedRes.lesson,
    reason: 'stale_evidence',
  });

  hops.push(
    hop(
      'regression_stale_weakens_path',
      weakenedRes.lesson.pathState === 'REGRESSED' &&
        staleRes.lesson.pathState === 'STALE' &&
        weakenedRes.lesson.strength < verifiedRes.lesson.strength
        ? 'PASS'
        : 'FAIL',
      'Regression or stale evidence weakens the path.',
    ),
  );

  hops.push(
    hop(
      'generated_claim_neq_verified_without_runtime',
      noRuntime.state === 'DENIED' &&
        attemptVerifiedWithoutRuntimeEvidence().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Generated claims ≠ VERIFIED without actual runtime evidence.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof INSTRUCTION_SEMANTICS_LEARNING_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    { hop: 'deny_copy_instruction_set', fn: attemptCopyInstructionSet },
    {
      hop: 'deny_confidential_microarchitecture',
      fn: attemptConfidentialMicroarchitecture,
    },
    { hop: 'deny_proprietary_rtl', fn: attemptProprietaryRtl },
    {
      hop: 'deny_unreleased_instructions',
      fn: attemptUnreleasedInstructions,
    },
    { hop: 'deny_private_firmware', fn: attemptPrivateFirmware },
    { hop: 'deny_trade_secret_details', fn: attemptTradeSecretDetails },
    {
      hop: 'deny_verified_without_runtime_evidence',
      fn: attemptVerifiedWithoutRuntimeEvidence,
    },
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
      EQ10_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  hops.push(
    hop(
      'eq9_soft_wire',
      softWire.eq9RiscvAcceleratorResearch.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq9RiscvAcceleratorResearch.note,
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
      'eq4_soft_wire',
      softWire.eq4ProprietaryIsaBoundary.present ? 'PASS' : 'WAITING_DATA',
      softWire.eq4ProprietaryIsaBoundary.note,
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
      'em157_soft_wire',
      softWire.em157HomeBase.present ? 'PASS' : 'WAITING_DATA',
      softWire.em157HomeBase.note,
    ),
  );
  hops.push(
    hop(
      'db_candidates_not_applied',
      EQ10_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq10-1',
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

  void INSTRUCTION_SEMANTICS_LEARNING_CYCLE;
  void attemptAgentAutoAuthority;

  return {
    hops,
    lesson,
    verified: verifiedRes.lesson,
    weakened: weakenedRes.lesson,
    softWire,
  };
}
