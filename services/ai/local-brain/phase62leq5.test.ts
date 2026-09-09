/**
 * 62L-EQ5 — Compiler / IR Translation Layer denial + honesty tests.
 *
 * Script: npm run test:62leq5
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

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
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  IR_TRANSLATION_AGENT_BOUNDS,
  NEXT_PHASE_TITLE,
  QUANTUM_IR_KINDS,
  SCHEDULER_CAPABILITY_MAPPING,
  TRANSLATION_COMPATIBILITY_STATES,
  TRANSLATION_RECORD_FIELDS,
  VERIFIED_ROUTE_CHAIN,
  assertEq5LocksIntact,
  canMarkVerified,
  compileImpliesExecute,
  eq5SoftWireSnapshot,
  quantumIrAllowsSilentPromotion,
  simulatedImpliesPhysicalQpu,
  type Eq5Actor,
} from './compiler-ir-translation-layer-types.ts';

import {
  advanceCompatibilityState,
  askCapabilityRequirements,
  attemptEquateCompileWithExecute,
  attemptFirmwareChanges,
  attemptIsaReverseEngineering,
  attemptJumpToVerifiedWithoutReceipt,
  attemptProprietaryCompilerCloning,
  attemptRecommendAsAct,
  attemptSilentSimulatedToPhysicalQpu,
  attemptUnsafeHardwareTuning,
  bootstrapCompilerIrTranslationLayer,
  emitQuantumIrRecord,
  emitTranslationRecord,
  exampleAttentionOnnxTranslation,
  mapSchedulerCapabilityPath,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnIrEvidenceToHomeBase,
  runCompilerIrTranslationCycle,
  runSandboxOptimization,
} from './compiler-ir-translation-layer-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq5Actor = {
  kind: 'ir_translator',
  id: 'ir-1',
  orgId: 'org-eq5',
  tenantId: 'ten-eq5',
  universeId: 'uni-eq5',
  permissions: ['draft'],
};

const human: Eq5Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq5',
  tenantId: 'ten-eq5',
  universeId: 'uni-eq5',
  permissions: ['approve_consequential'],
};

test('SoT label EQ5 / #161; GitLab mirror not invented; next EQ6', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ5');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /Compiler\/IR Translation Layer/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ6/);
  assert.match(NEXT_PHASE_TITLE, /Architecture Capability Graph/);
});

test('honesty locks: L4 false; compile≠execute; DB NOT_APPLIED', () => {
  assert.equal(assertEq5LocksIntact(), true);
  assert.equal(EQ5_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ5_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ5_LOCKS.COMPILE_EQ_EXECUTE, false);
  assert.equal(EQ5_LOCKS.VERIFIED_WITHOUT_FULL_CHAIN, false);
  assert.equal(EQ5_LOCKS.SIMULATED_CIRCUIT_EQ_PHYSICAL_QPU, false);
  assert.equal(EQ5_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(IR_TRANSLATION_AGENT_BOUNDS.mayEquateCompileWithExecute, false);
  assert.equal(compileImpliesExecute(), false);
  assert.equal(simulatedImpliesPhysicalQpu(), false);
});

test('core abstraction + IR concepts + record fields + states encoded', () => {
  assert.deepEqual([...COMPILER_IR_CORE_ABSTRACTION], [
    'agent_mission',
    'workload_genome',
    'intermediate_representation',
    'compiler_runtime_mapping',
    'verified_hardware',
    'execution',
    'return_receipt',
  ]);
  assert.ok(CANDIDATE_IR_RUNTIME_CONCEPTS.includes('onnx_graphs'));
  assert.ok(CANDIDATE_IR_RUNTIME_CONCEPTS.includes('mlir_style_operation_graphs'));
  assert.ok(CANDIDATE_IR_RUNTIME_CONCEPTS.includes('scheduling_metadata'));
  assert.ok(TRANSLATION_RECORD_FIELDS.includes('translationId'));
  assert.ok(TRANSLATION_RECORD_FIELDS.includes('fallbackPath'));
  assert.ok(TRANSLATION_RECORD_FIELDS.includes('compatibilityState'));
  assert.deepEqual([...TRANSLATION_COMPATIBILITY_STATES], [
    'PARSEABLE',
    'TRANSLATABLE',
    'SUPPORTED',
    'VERIFIED',
    'PARTIAL',
    'NOT_SUPPORTED',
    'NOT_TESTED',
  ]);
  assert.deepEqual([...VERIFIED_ROUTE_CHAIN], [
    'translation',
    'load',
    'execution',
    'valid_output',
    'receipt',
  ]);
  assert.deepEqual([...SCHEDULER_CAPABILITY_MAPPING], [
    'attention_workload',
    'tensor_vector_requirements',
    'compatible_runtime',
    'eligible_devices',
    'measured_benchmark',
    'best_verified_route',
  ]);
  assert.ok(ALLOWED_SANDBOX_OPTIMIZATIONS.includes('graph_fusion'));
  assert.ok(BLOCKED_OPTIMIZATION_ACTIONS.includes('proprietary_compiler_cloning'));
  assert.ok(QUANTUM_IR_KINDS.includes('simulated_circuit_ir'));
  assert.ok(EQ5_MAY.includes('require_full_chain_before_verified'));
  assert.ok(EQ5_MUST_NOT.includes('equate_successful_compilation_with_successful_execution'));
});

test('compile ≠ execute; VERIFIED only after full chain on actual target', () => {
  const rec = exampleAttentionOnnxTranslation(agent);
  assert.equal(rec.compiledSuccessfully, true);
  assert.equal(rec.executedSuccessfully, false);
  assert.equal(rec.compatibilityState, 'TRANSLATABLE');

  assert.equal(attemptEquateCompileWithExecute().state, 'DENIED');
  assert.equal(attemptJumpToVerifiedWithoutReceipt().state, 'DENIED');
  assert.equal(
    emitTranslationRecord({
      actor: agent,
      translationId: 'bad',
      sourceWorkload: 'w',
      sourceModelGraph: 'g',
      targetArchitecture: 'arm',
      targetRuntime: 'rt',
      compilerToolchain: 'tc',
      supportedOperations: [],
      unsupportedOperations: [],
      precision: 'fp32',
      memoryRequirements: '1GiB',
      fallbackPath: 'cpu',
      irConcept: 'llvm_ir_concepts',
      attemptEquateCompileWithExecute: true,
    }).state,
    'DENIED',
  );

  assert.equal(
    canMarkVerified({
      translationDone: true,
      loadDone: true,
      executionDone: true,
      validOutput: true,
      receiptDone: false,
      onActualTarget: true,
    }),
    false,
  );

  assert.equal(
    advanceCompatibilityState({
      record: rec,
      to: 'VERIFIED',
      verifiedEvidence: {
        translationDone: true,
        loadDone: true,
        executionDone: true,
        validOutput: true,
        receiptDone: false,
        onActualTarget: true,
      },
    }).state,
    'DENIED',
  );

  const ok = advanceCompatibilityState({
    record: rec,
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
  assert.ok(!('denied' in ok));
  assert.equal(ok.record.compatibilityState, 'VERIFIED');
  assert.equal(ok.record.executedSuccessfully, true);
});

test('capability-first scheduling; sandbox opts; quantum IR typed', () => {
  const cap = askCapabilityRequirements({
    workloadKind: 'attention_workload',
    requiredCapabilities: ['tensor', 'vector'],
  });
  assert.ok(!('denied' in cap));
  assert.equal(cap.vendorChipRequested, false);
  assert.equal(
    askCapabilityRequirements({
      workloadKind: 'attention_workload',
      requiredCapabilities: ['tensor'],
      attemptVendorChipFirst: true,
    }).state,
    'DENIED',
  );

  const plan = mapSchedulerCapabilityPath({
    workload: 'attention_workload',
    tensorVectorRequirements: ['matmul', 'softmax'],
    compatibleRuntime: 'onnxruntime',
    eligibleDevices: ['gpu-a', 'npu-b'],
    measuredBenchmarkRefs: ['bench-1'],
    bestVerifiedRouteId: null,
  });
  assert.ok(!('denied' in plan));
  assert.equal(plan.vendorChipFirst, false);

  const opt = runSandboxOptimization({ optimization: 'quantization' });
  assert.ok(!('denied' in opt));
  assert.equal(opt.sandboxed, true);
  assert.equal(
    runSandboxOptimization({
      optimization: 'graph_fusion',
      attemptUnsafeHardwareTuning: true,
    }).state,
    'DENIED',
  );

  const sim = emitQuantumIrRecord({
    actor: agent,
    irId: 'q1',
    kind: 'simulated_circuit_ir',
  });
  assert.ok(!('denied' in sim));
  assert.equal(sim.claimPhysicalQpu, false);
  assert.equal(
    quantumIrAllowsSilentPromotion('simulated_circuit_ir', 'physical_qpu_ir'),
    false,
  );
  assert.equal(attemptSilentSimulatedToPhysicalQpu().state, 'DENIED');
  assert.equal(
    emitQuantumIrRecord({
      actor: agent,
      irId: 'q2',
      kind: 'physical_qpu_ir',
      attemptPromoteFrom: 'simulated_circuit_ir',
    }).state,
    'DENIED',
  );
});

test('boundary denies proprietary compiler clone / ISA RE / firmware / unsafe tune', () => {
  assert.equal(attemptProprietaryCompilerCloning().state, 'DENIED');
  assert.equal(attemptIsaReverseEngineering().state, 'DENIED');
  assert.equal(attemptFirmwareChanges().state, 'DENIED');
  assert.equal(attemptUnsafeHardwareTuning().state, 'DENIED');

  assert.equal(
    emitTranslationRecord({
      actor: agent,
      translationId: 'rtl-bad',
      sourceWorkload: 'w',
      sourceModelGraph: 'g',
      targetArchitecture: 'x86',
      targetRuntime: 'rt',
      compilerToolchain: 'tc',
      supportedOperations: [],
      unsupportedOperations: [],
      precision: 'fp32',
      memoryRequirements: '1GiB',
      fallbackPath: 'cpu',
      irConcept: 'tensor_operator_dags',
      attemptProprietaryCompilerCloning: true,
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapCompilerIrTranslationLayer(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.irConcepts.length, CANDIDATE_IR_RUNTIME_CONCEPTS.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq5SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq4ProprietaryIsaBoundary.present, true);
  assert.equal(soft.eq3RiscvOpenIsaKnowledgePack.present, true);
  assert.equal(soft.eq2ArmArchitectureKnowledgePack.present, true);
  assert.equal(soft.eq1CrossArchitectureContract.present, true);
  assert.equal(soft.ep12Scheduler.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnIrEvidenceToHomeBase({
    evidenceId: 'ev-eq5-1',
    actor: agent,
    summary: 'ir translation advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runCompilerIrTranslationCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, COMPILER_IR_TRANSLATION_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of COMPILER_IR_TRANSLATION_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.translation.compiledSuccessfully, true);
  assert.equal(cycle.translation.executedSuccessfully, false);
  assert.ok(!('denied' in cycle.verified));
  assert.equal(cycle.verified.record.compatibilityState, 'VERIFIED');
});
