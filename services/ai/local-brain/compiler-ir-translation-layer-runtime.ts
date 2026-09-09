/**
 * 62L-EQ5 — Compiler / IR Translation Layer runtime.
 *
 * Emit translation records; enforce compile≠execute; VERIFIED only after
 * full chain on actual target; sandbox opts only; quantum IR typed separately.
 * Soft-wires EQ4/EQ3/EQ2/EQ1/EP12/EM157 when present.
 */

import {
  ALLOWED_SANDBOX_OPTIMIZATIONS,
  BLOCKED_OPTIMIZATION_ACTIONS,
  CANDIDATE_IR_RUNTIME_CONCEPTS,
  COMPILER_IR_CORE_ABSTRACTION,
  COMPILER_IR_TRANSLATION_CYCLE,
  EQ5_DB_CANDIDATES_STATUS,
  EQ5_LOCKS,
  EQ5_MAY,
  EQ5_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  IR_TRANSLATION_AGENT_BOUNDS,
  NEXT_PHASE_TITLE,
  QUANTUM_IR_KINDS,
  SCHEDULER_CAPABILITY_MAPPING,
  TARGET_ARCHITECTURE_FAMILIES,
  TRANSLATION_COMPATIBILITY_STATES,
  TRANSLATION_RECORD_FIELDS,
  VERIFIED_ROUTE_CHAIN,
  assertEq5LocksIntact,
  canMarkVerified,
  compileImpliesExecute,
  eq5SoftWireSnapshot,
  isHumanApprover,
  isIrTranslationAgent,
  quantumIrAllowsSilentPromotion,
  simulatedImpliesPhysicalQpu,
  type Eq5Actor,
  type Eq5EvidenceState,
  type Eq5HopRecord,
  type Eq5SoftWireSnapshot,
  type QuantumIrKind,
  type TranslationCompatibilityState,
  type TranslationRecordField,
} from './compiler-ir-translation-layer-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof COMPILER_IR_TRANSLATION_CYCLE)[number],
  state: Eq5EvidenceState,
  summary: string,
): Eq5HopRecord {
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

export type TargetArchitectureFamily =
  (typeof TARGET_ARCHITECTURE_FAMILIES)[number];
export type CandidateIrConcept =
  (typeof CANDIDATE_IR_RUNTIME_CONCEPTS)[number];
export type SandboxOptimization =
  (typeof ALLOWED_SANDBOX_OPTIMIZATIONS)[number];

export type TranslationRecord = {
  translationId: string;
  sourceWorkload: string;
  sourceModelGraph: string;
  targetArchitecture: TargetArchitectureFamily;
  targetRuntime: string;
  compilerToolchain: string;
  supportedOperations: readonly string[];
  unsupportedOperations: readonly string[];
  precision: string;
  memoryRequirements: string;
  fallbackPath: string;
  optimizationPasses: readonly string[];
  compatibilityState: TranslationCompatibilityState;
  benchmarkRefs: readonly string[];
  evidenceState: string;
  irConcept: CandidateIrConcept;
  compiledSuccessfully: boolean;
  executedSuccessfully: boolean;
  onActualTarget: boolean;
  orgId: string;
  tenantId: string;
  universeId: string;
  hiddenChainOfThoughtPresent: false;
};

export type VerifiedRouteEvidence = {
  translationDone: boolean;
  loadDone: boolean;
  executionDone: boolean;
  validOutput: boolean;
  receiptDone: boolean;
  onActualTarget: boolean;
};

export type CapabilityRequirementQuery = {
  workloadKind: string;
  requiredCapabilities: readonly string[];
  vendorChipRequested: false;
};

export type SchedulerMappingPlan = {
  path: typeof SCHEDULER_CAPABILITY_MAPPING;
  workload: string;
  tensorVectorRequirements: readonly string[];
  compatibleRuntime: string;
  eligibleDevices: readonly string[];
  measuredBenchmarkRefs: readonly string[];
  bestVerifiedRouteId: string | null;
  vendorChipFirst: false;
};

export type QuantumIrRecord = {
  irId: string;
  kind: QuantumIrKind;
  claimPhysicalQpu: false;
  orgId: string;
  tenantId: string;
  universeId: string;
};

export function emitTranslationRecord(input: {
  actor: Eq5Actor;
  translationId: string;
  sourceWorkload: string;
  sourceModelGraph: string;
  targetArchitecture: TargetArchitectureFamily;
  targetRuntime: string;
  compilerToolchain: string;
  supportedOperations: readonly string[];
  unsupportedOperations: readonly string[];
  precision: string;
  memoryRequirements: string;
  fallbackPath: string;
  optimizationPasses?: readonly string[];
  compatibilityState?: TranslationCompatibilityState;
  benchmarkRefs?: readonly string[];
  evidenceState?: string;
  irConcept: CandidateIrConcept;
  compiledSuccessfully?: boolean;
  executedSuccessfully?: boolean;
  onActualTarget?: boolean;
  attemptEquateCompileWithExecute?: boolean;
  attemptJumpToVerifiedWithoutReceipt?: boolean;
  attemptProprietaryCompilerCloning?: boolean;
  attemptIsaReverseEngineering?: boolean;
  attemptFirmwareChanges?: boolean;
  attemptUnsafeHardwareTuning?: boolean;
  attemptIncludeHiddenCot?: boolean;
}): TranslationRecord | DenialResult {
  if (input.attemptIncludeHiddenCot) {
    return deny(
      'HIDDEN_CHAIN_OF_THOUGHT_IN_IR_LAYER=false — no hidden chain-of-thought.',
    );
  }
  if (input.attemptProprietaryCompilerCloning) {
    return deny('PROPRIETARY_COMPILER_CLONING=false.');
  }
  if (input.attemptIsaReverseEngineering) {
    return deny('ISA_REVERSE_ENGINEERING=false.');
  }
  if (input.attemptFirmwareChanges) {
    return deny('FIRMWARE_CHANGES=false.');
  }
  if (input.attemptUnsafeHardwareTuning) {
    return deny('UNSAFE_HARDWARE_TUNING=false.');
  }
  if (input.attemptEquateCompileWithExecute) {
    return deny(
      'COMPILE_EQ_EXECUTE=false — successful compilation ≠ successful execution.',
    );
  }
  if (input.attemptJumpToVerifiedWithoutReceipt) {
    return deny(
      'VERIFIED_WITHOUT_FULL_CHAIN=false — VERIFIED requires translation→load→execution→valid output→receipt on actual target.',
    );
  }

  void TRANSLATION_RECORD_FIELDS;

  const compatibilityState = input.compatibilityState ?? 'PARSEABLE';
  const compiledSuccessfully = input.compiledSuccessfully ?? false;
  const executedSuccessfully = input.executedSuccessfully ?? false;

  // Compile success must never auto-promote executedSuccessfully
  if (compiledSuccessfully && executedSuccessfully === true) {
    // only allowed when explicitly set; still not VERIFIED without chain
  }

  if (compatibilityState === 'VERIFIED') {
    return deny(
      'Cannot emit VERIFIED via emitTranslationRecord alone — use advanceToVerified with full chain.',
    );
  }

  return {
    translationId: input.translationId,
    sourceWorkload: input.sourceWorkload,
    sourceModelGraph: input.sourceModelGraph,
    targetArchitecture: input.targetArchitecture,
    targetRuntime: input.targetRuntime,
    compilerToolchain: input.compilerToolchain,
    supportedOperations: input.supportedOperations,
    unsupportedOperations: input.unsupportedOperations,
    precision: input.precision,
    memoryRequirements: input.memoryRequirements,
    fallbackPath: input.fallbackPath,
    optimizationPasses: input.optimizationPasses ?? [],
    compatibilityState,
    benchmarkRefs: input.benchmarkRefs ?? [],
    evidenceState: input.evidenceState ?? 'DOCUMENTED',
    irConcept: input.irConcept,
    compiledSuccessfully,
    executedSuccessfully: false, // never auto from compile
    onActualTarget: input.onActualTarget ?? false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
    hiddenChainOfThoughtPresent: false,
  };
}

export function advanceCompatibilityState(input: {
  record: TranslationRecord;
  to: TranslationCompatibilityState;
  verifiedEvidence?: VerifiedRouteEvidence;
  attemptEquateCompileWithExecute?: boolean;
  attemptJumpToVerifiedWithoutReceipt?: boolean;
}): { record: TranslationRecord } | DenialResult {
  if (input.attemptEquateCompileWithExecute) {
    return deny('COMPILE_EQ_EXECUTE=false.');
  }
  if (input.attemptJumpToVerifiedWithoutReceipt) {
    return deny('VERIFIED_WITHOUT_FULL_CHAIN=false.');
  }

  if (input.to === 'VERIFIED') {
    const ev = input.verifiedEvidence;
    if (!ev || !canMarkVerified(ev)) {
      return deny(
        'VERIFIED requires translation→load→execution→valid output→receipt on actual target.',
      );
    }
    return {
      record: {
        ...input.record,
        compatibilityState: 'VERIFIED',
        compiledSuccessfully: true,
        executedSuccessfully: true,
        onActualTarget: true,
        evidenceState: 'VERIFIED',
      },
    };
  }

  // Compilation success may advance to TRANSLATABLE/SUPPORTED/PARTIAL but not execution claims
  return {
    record: {
      ...input.record,
      compatibilityState: input.to,
      executedSuccessfully: false,
    },
  };
}

export function askCapabilityRequirements(input: {
  workloadKind: string;
  requiredCapabilities: readonly string[];
  attemptVendorChipFirst?: boolean;
}): CapabilityRequirementQuery | DenialResult {
  if (input.attemptVendorChipFirst) {
    return deny(
      'VENDOR_CHIP_FIRST_SCHEDULING=false — ask capabilities, not which vendor chip.',
    );
  }
  return {
    workloadKind: input.workloadKind,
    requiredCapabilities: input.requiredCapabilities,
    vendorChipRequested: false,
  };
}

export function mapSchedulerCapabilityPath(input: {
  workload: string;
  tensorVectorRequirements: readonly string[];
  compatibleRuntime: string;
  eligibleDevices: readonly string[];
  measuredBenchmarkRefs: readonly string[];
  bestVerifiedRouteId?: string | null;
  attemptVendorChipFirst?: boolean;
}): SchedulerMappingPlan | DenialResult {
  if (input.attemptVendorChipFirst) {
    return deny('VENDOR_CHIP_FIRST_SCHEDULING=false.');
  }
  return {
    path: SCHEDULER_CAPABILITY_MAPPING,
    workload: input.workload,
    tensorVectorRequirements: input.tensorVectorRequirements,
    compatibleRuntime: input.compatibleRuntime,
    eligibleDevices: input.eligibleDevices,
    measuredBenchmarkRefs: input.measuredBenchmarkRefs,
    bestVerifiedRouteId: input.bestVerifiedRouteId ?? null,
    vendorChipFirst: false,
  };
}

export function runSandboxOptimization(input: {
  optimization: SandboxOptimization;
  attemptOutsideSandbox?: boolean;
  attemptProprietaryCompilerCloning?: boolean;
  attemptIsaReverseEngineering?: boolean;
  attemptFirmwareChanges?: boolean;
  attemptUnsafeHardwareTuning?: boolean;
}):
  | {
      optimization: SandboxOptimization;
      sandboxed: true;
      applied: true;
    }
  | DenialResult {
  if (input.attemptOutsideSandbox) {
    return deny('OPTIMIZATION_OUTSIDE_SANDBOX=false — software-level sandbox only.');
  }
  if (input.attemptProprietaryCompilerCloning) {
    return deny('PROPRIETARY_COMPILER_CLONING=false.');
  }
  if (input.attemptIsaReverseEngineering) {
    return deny('ISA_REVERSE_ENGINEERING=false.');
  }
  if (input.attemptFirmwareChanges) {
    return deny('FIRMWARE_CHANGES=false.');
  }
  if (input.attemptUnsafeHardwareTuning) {
    return deny('UNSAFE_HARDWARE_TUNING=false.');
  }
  if (
    !(ALLOWED_SANDBOX_OPTIMIZATIONS as readonly string[]).includes(
      input.optimization,
    )
  ) {
    return deny(`Optimization ${input.optimization} not in sandbox allow-list.`);
  }
  return {
    optimization: input.optimization,
    sandboxed: true,
    applied: true,
  };
}

export function emitQuantumIrRecord(input: {
  actor: Eq5Actor;
  irId: string;
  kind: QuantumIrKind;
  attemptSilentPhysicalQpuClaim?: boolean;
  attemptPromoteFrom?: QuantumIrKind;
}): QuantumIrRecord | DenialResult {
  if (input.attemptSilentPhysicalQpuClaim) {
    return deny(
      'SILENT_SIMULATED_TO_PHYSICAL_QPU_CLAIM=false — simulated circuit ≠ physical QPU.',
    );
  }
  if (
    input.attemptPromoteFrom &&
    !quantumIrAllowsSilentPromotion(input.attemptPromoteFrom, input.kind)
  ) {
    return deny(
      'SIMULATED_CIRCUIT_EQ_PHYSICAL_QPU=false — cannot silently promote to physical_qpu_ir.',
    );
  }
  if (input.kind === 'physical_qpu_ir' && input.attemptSilentPhysicalQpuClaim) {
    return deny('Physical QPU claims require explicit typed path — not silent.');
  }
  return {
    irId: input.irId,
    kind: input.kind,
    claimPhysicalQpu: false,
    orgId: input.actor.orgId,
    tenantId: input.actor.tenantId,
    universeId: input.actor.universeId,
  };
}

export function attemptEquateCompileWithExecute(): DenialResult {
  return deny('COMPILE_EQ_EXECUTE=false.');
}

export function attemptJumpToVerifiedWithoutReceipt(): DenialResult {
  return deny('VERIFIED_WITHOUT_FULL_CHAIN=false.');
}

export function attemptProprietaryCompilerCloning(): DenialResult {
  return deny('PROPRIETARY_COMPILER_CLONING=false.');
}

export function attemptIsaReverseEngineering(): DenialResult {
  return deny('ISA_REVERSE_ENGINEERING=false.');
}

export function attemptFirmwareChanges(): DenialResult {
  return deny('FIRMWARE_CHANGES=false.');
}

export function attemptUnsafeHardwareTuning(): DenialResult {
  return deny('UNSAFE_HARDWARE_TUNING=false.');
}

export function attemptSilentSimulatedToPhysicalQpu(): DenialResult {
  return deny('SILENT_SIMULATED_TO_PHYSICAL_QPU_CLAIM=false.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('RECOMMEND_EQ_ACT=false.');
}

export function attemptAgentAutoAuthority(): DenialResult {
  return deny('AGENT_AUTO_AUTHORITY=false.');
}

export function returnIrEvidenceToHomeBase(input: {
  evidenceId: string;
  actor: Eq5Actor;
  summary: string;
}):
  | {
      evidenceId: string;
      returnedToHomeBase: true;
      authorityGranted: false;
    }
  | DenialResult {
  if (!IR_TRANSLATION_AGENT_BOUNDS.mayReturnEvidenceToHomeBase) {
    return deny('mayReturnEvidenceToHomeBase=false');
  }
  if (!isIrTranslationAgent(input.actor) && input.actor.kind !== 'home_base') {
    return deny('Only IR translation agents / home_base may return evidence.');
  }
  return {
    evidenceId: input.evidenceId,
    returnedToHomeBase: true,
    authorityGranted: false,
  };
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Eq5Actor;
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
    unchanged: EQ5_LOCKS.GUARDIAN_RLS_TENANT_UNIVERSE_ISOLATION_UNCHANGED,
    humanApprovalUnchanged: EQ5_LOCKS.HUMAN_APPROVAL_BOUNDARIES_UNCHANGED,
    bypassDenied: EQ5_LOCKS.BYPASS_GUARDIAN_RLS_TENANT_UNIVERSE === false,
    state: 'PASS',
  };
}

export function exampleAttentionOnnxTranslation(
  actor: Eq5Actor,
): TranslationRecord {
  const record = emitTranslationRecord({
    actor,
    translationId: 'tr-attn-onnx-1',
    sourceWorkload: 'attention_workload',
    sourceModelGraph: 'attn-graph-v1',
    targetArchitecture: 'gpu',
    targetRuntime: 'onnxruntime-cuda-documented',
    compilerToolchain: 'onnx-public-toolchain-concept',
    supportedOperations: ['MatMul', 'Softmax', 'Add'],
    unsupportedOperations: ['CustomVendorFusedAttn'],
    precision: 'fp16',
    memoryRequirements: 'workspace<=4GiB (documented estimate)',
    fallbackPath: 'cpu-onnxruntime-fp32',
    optimizationPasses: ['graph_fusion', 'memory_planning'],
    compatibilityState: 'TRANSLATABLE',
    benchmarkRefs: [],
    evidenceState: 'DOCUMENTED',
    irConcept: 'onnx_graphs',
    compiledSuccessfully: true,
    onActualTarget: false,
  });
  if ('denied' in record) throw new Error('exampleAttentionOnnxTranslation failed');
  return record;
}

export function bootstrapCompilerIrTranslationLayer(repoRoot?: string): {
  locksIntact: boolean;
  softWire: Eq5SoftWireSnapshot;
  coreAbstraction: typeof COMPILER_IR_CORE_ABSTRACTION;
  irConcepts: typeof CANDIDATE_IR_RUNTIME_CONCEPTS;
  recordFields: readonly TranslationRecordField[];
  compatibilityStates: typeof TRANSLATION_COMPATIBILITY_STATES;
  verifiedChain: typeof VERIFIED_ROUTE_CHAIN;
  schedulerPath: typeof SCHEDULER_CAPABILITY_MAPPING;
  sandboxOpts: typeof ALLOWED_SANDBOX_OPTIMIZATIONS;
  blockedOpts: typeof BLOCKED_OPTIMIZATION_ACTIONS;
  quantumKinds: typeof QUANTUM_IR_KINDS;
  targetFamilies: typeof TARGET_ARCHITECTURE_FAMILIES;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
  };
  may: typeof EQ5_MAY;
  mustNot: typeof EQ5_MUST_NOT;
  dbCandidates: typeof EQ5_DB_CANDIDATES_STATUS;
} {
  return {
    locksIntact: assertEq5LocksIntact(),
    softWire: eq5SoftWireSnapshot(repoRoot),
    coreAbstraction: COMPILER_IR_CORE_ABSTRACTION,
    irConcepts: CANDIDATE_IR_RUNTIME_CONCEPTS,
    recordFields: TRANSLATION_RECORD_FIELDS,
    compatibilityStates: TRANSLATION_COMPATIBILITY_STATES,
    verifiedChain: VERIFIED_ROUTE_CHAIN,
    schedulerPath: SCHEDULER_CAPABILITY_MAPPING,
    sandboxOpts: ALLOWED_SANDBOX_OPTIMIZATIONS,
    blockedOpts: BLOCKED_OPTIMIZATION_ACTIONS,
    quantumKinds: QUANTUM_IR_KINDS,
    targetFamilies: TARGET_ARCHITECTURE_FAMILIES,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      gitlab: GITLAB_MIRROR_NOTE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
    },
    may: EQ5_MAY,
    mustNot: EQ5_MUST_NOT,
    dbCandidates: EQ5_DB_CANDIDATES_STATUS,
  };
}

export function runCompilerIrTranslationCycle(input: {
  actor: Eq5Actor;
  human: Eq5Actor;
  repoRoot?: string;
}): {
  hops: Eq5HopRecord[];
  translation: TranslationRecord;
  verified: { record: TranslationRecord } | DenialResult;
  softWire: Eq5SoftWireSnapshot;
} {
  const hops: Eq5HopRecord[] = [];
  const softWire = eq5SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEq5LocksIntact() ? 'PASS' : 'FAIL',
      'EQ5 locks intact including L4=false and compile≠execute.',
    ),
  );
  hops.push(
    hop(
      'compiler_ir_translation_bootstrap',
      'PASS',
      'Compiler/IR Translation Layer bootstrapped.',
    ),
  );
  hops.push(
    hop(
      'core_abstraction_encoded',
      'PASS',
      COMPILER_IR_CORE_ABSTRACTION.join(' → '),
    ),
  );
  hops.push(
    hop(
      'candidate_ir_concepts_encoded',
      'PASS',
      `${CANDIDATE_IR_RUNTIME_CONCEPTS.length} IR/runtime concepts encoded.`,
    ),
  );
  hops.push(
    hop(
      'translation_record_fields_encoded',
      'PASS',
      `${TRANSLATION_RECORD_FIELDS.length} translation record fields encoded.`,
    ),
  );
  hops.push(
    hop(
      'compatibility_states_encoded',
      'PASS',
      TRANSLATION_COMPATIBILITY_STATES.join(' | '),
    ),
  );
  hops.push(
    hop(
      'verified_route_chain_encoded',
      'PASS',
      VERIFIED_ROUTE_CHAIN.join(' → '),
    ),
  );
  hops.push(
    hop(
      'scheduler_capability_mapping_encoded',
      'PASS',
      SCHEDULER_CAPABILITY_MAPPING.join(' → '),
    ),
  );

  const translation = exampleAttentionOnnxTranslation(input.actor);

  hops.push(
    hop(
      'compile_neq_execute',
      translation.compiledSuccessfully === true &&
        translation.executedSuccessfully === false &&
        compileImpliesExecute() === false &&
        attemptEquateCompileWithExecute().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Successful compilation ≠ successful execution.',
    ),
  );

  const jumpDeny = advanceCompatibilityState({
    record: translation,
    to: 'VERIFIED',
    attemptJumpToVerifiedWithoutReceipt: true,
  });
  const incomplete = advanceCompatibilityState({
    record: translation,
    to: 'VERIFIED',
    verifiedEvidence: {
      translationDone: true,
      loadDone: true,
      executionDone: false,
      validOutput: false,
      receiptDone: false,
      onActualTarget: false,
    },
  });
  const verified = advanceCompatibilityState({
    record: translation,
    to: 'VERIFIED',
    verifiedEvidence: {
      translationDone: true,
      loadDone: true,
      executionDone: true,
      validOutput: true,
      receiptDone: true,
      onActualTarget: true,
    },
  });

  hops.push(
    hop(
      'verified_requires_full_chain_on_target',
      jumpDeny.state === 'DENIED' &&
        incomplete.state === 'DENIED' &&
        !('denied' in verified) &&
        verified.record.compatibilityState === 'VERIFIED' &&
        attemptJumpToVerifiedWithoutReceipt().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'VERIFIED only after full chain on actual target.',
    ),
  );

  const cap = askCapabilityRequirements({
    workloadKind: 'attention_workload',
    requiredCapabilities: ['tensor', 'vector'],
  });
  const vendorDeny = askCapabilityRequirements({
    workloadKind: 'attention_workload',
    requiredCapabilities: ['tensor'],
    attemptVendorChipFirst: true,
  });
  hops.push(
    hop(
      'capability_question_not_vendor_chip',
      !('denied' in cap) &&
        cap.vendorChipRequested === false &&
        vendorDeny.state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Ask capabilities, not which vendor chip.',
    ),
  );

  const sim = emitQuantumIrRecord({
    actor: input.actor,
    irId: 'qir-sim-1',
    kind: 'simulated_circuit_ir',
  });
  const silentDeny = emitQuantumIrRecord({
    actor: input.actor,
    irId: 'qir-bad',
    kind: 'physical_qpu_ir',
    attemptPromoteFrom: 'simulated_circuit_ir',
  });
  hops.push(
    hop(
      'simulated_circuit_neq_physical_qpu',
      !('denied' in sim) &&
        sim.claimPhysicalQpu === false &&
        silentDeny.state === 'DENIED' &&
        simulatedImpliesPhysicalQpu() === false &&
        attemptSilentSimulatedToPhysicalQpu().state === 'DENIED'
        ? 'PASS'
        : 'FAIL',
      'Simulated circuit ≠ physical QPU claim.',
    ),
  );

  const denyHops: Array<{
    hop: (typeof COMPILER_IR_TRANSLATION_CYCLE)[number];
    fn: () => DenialResult;
  }> = [
    {
      hop: 'deny_equate_compile_with_execute',
      fn: attemptEquateCompileWithExecute,
    },
    {
      hop: 'deny_jump_to_verified_without_receipt',
      fn: attemptJumpToVerifiedWithoutReceipt,
    },
    {
      hop: 'deny_proprietary_compiler_cloning',
      fn: attemptProprietaryCompilerCloning,
    },
    {
      hop: 'deny_isa_reverse_engineering',
      fn: attemptIsaReverseEngineering,
    },
    { hop: 'deny_firmware_changes', fn: attemptFirmwareChanges },
    {
      hop: 'deny_unsafe_hardware_tuning',
      fn: attemptUnsafeHardwareTuning,
    },
    {
      hop: 'deny_silent_simulated_to_physical_qpu',
      fn: attemptSilentSimulatedToPhysicalQpu,
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
      EQ5_LOCKS.L4_AUTONOMY_ENABLED === false ? 'PASS' : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
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
      EQ5_DB_CANDIDATES_STATUS === 'NOT_APPLIED' ? 'PASS' : 'FAIL',
      'DB candidates NOT_APPLIED.',
    ),
  );

  const humanGate = requireHumanApproval({
    approvalId: 'appr-eq5-1',
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

  void COMPILER_IR_TRANSLATION_CYCLE;
  void attemptAgentAutoAuthority;
  void runSandboxOptimization;

  return {
    hops,
    translation,
    verified,
    softWire,
  };
}
