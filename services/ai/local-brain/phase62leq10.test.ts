/**
 * 62L-EQ10 — Instruction-Semantics Learning denial + honesty tests.
 *
 * Script: npm run test:62leq10
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ALLOWED_SEMANTICS_SOURCES,
  ATTENTION_OPERATION_NEEDS,
  BLOCKED_SEMANTICS_TARGETS,
  EQ10_AGENT_BOUNDS,
  EQ10_DB_CANDIDATES_STATUS,
  EQ10_LOCKS,
  EQ10_MAY,
  EQ10_MUST_NOT,
  GITHUB_SOT_FAMILY,
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
  assertEq10LocksIntact,
  canMarkPathVerified,
  eq10SoftWireSnapshot,
  operationNeedImpliesIsaCopy,
  type Eq10Actor,
} from './instruction-semantics-learning-types.ts';

import {
  attemptConfidentialMicroarchitecture,
  attemptCopyInstructionSet,
  attemptPrivateFirmware,
  attemptProprietaryRtl,
  attemptRecommendAsAct,
  attemptTradeSecretDetails,
  attemptUnreleasedInstructions,
  attemptVerifiedWithoutRuntimeEvidence,
  bootstrapInstructionSemanticsLearning,
  emitStructuredLesson,
  mapAttentionWorkloadNeeds,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnEq10EvidenceToHomeBase,
  runInstructionSemanticsLearningCycle,
  strengthenPathWithMeasurement,
  weakenPath,
} from './instruction-semantics-learning-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq10Actor = {
  kind: 'semantics_learner',
  id: 'sem-1',
  orgId: 'org-eq10',
  tenantId: 'ten-eq10',
  universeId: 'uni-eq10',
  permissions: ['draft'],
};

const human: Eq10Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq10',
  tenantId: 'ten-eq10',
  universeId: 'uni-eq10',
  permissions: ['approve_consequential'],
};

test('SoT label EQ10 / #161; GitLab mirror not invented; next EQ11', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ10');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /Instruction-Semantics Learning/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ11/);
  assert.match(NEXT_PHASE_TITLE, /Device-Neutral Workload Genome/);
});

test('honesty locks: L4 false; operation need≠ISA copy; DB NOT_APPLIED', () => {
  assert.equal(assertEq10LocksIntact(), true);
  assert.equal(EQ10_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ10_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ10_LOCKS.OPERATION_NEED_EQ_ISA_COPY, false);
  assert.equal(EQ10_LOCKS.VERIFIED_WITHOUT_RUNTIME_EVIDENCE, false);
  assert.equal(EQ10_LOCKS.CONFIDENTIAL_MICROARCHITECTURE, false);
  assert.equal(EQ10_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(EQ10_AGENT_BOUNDS.mayCopyInstructionSet, false);
  assert.equal(operationNeedImpliesIsaCopy(), false);
});

test('foci + flow + mapping + pathway + attention needs encoded', () => {
  assert.ok(
    INSTRUCTION_SEMANTICS_LEARNING_FOCI.includes(
      'arithmetic_vector_instruction_classes',
    ),
  );
  assert.ok(INSTRUCTION_SEMANTICS_LEARNING_FOCI.includes('compiler_lowering_patterns'));
  assert.deepEqual([...INSTRUCTION_SEMANTICS_CORE_FLOW], [
    'public_isa_runtime_docs',
    'semantic_classes',
    'workload_requirements',
    'compiler_ir_mapping',
    'device_candidates',
    'benchmarks',
    'structured_lesson',
  ]);
  assert.deepEqual([...OPERATION_NEED_MAPPING], [
    'operation_need',
    'architecture_capability',
    'runtime_support',
    'measured_outcome',
  ]);
  assert.deepEqual([...SEMANTICS_NEURAL_PATHWAY], [
    'workload',
    'operation_class',
    'compiler_ir',
    'architecture_feature',
    'runtime',
    'device',
    'benchmark',
    'lesson',
  ]);
  assert.deepEqual([...ATTENTION_OPERATION_NEEDS], [
    'matrix_vector_operations',
    'efficient_memory_movement',
    'supported_precision',
    'adequate_memory_bandwidth',
    'compatible_runtime_kernels',
  ]);
  assert.ok(ALLOWED_SEMANTICS_SOURCES.includes('public_open_specifications'));
  assert.ok(BLOCKED_SEMANTICS_TARGETS.includes('confidential_microarchitecture'));
  assert.ok(EQ10_MAY.includes('map_operation_need_to_capability_runtime_and_measured_outcome'));
  assert.ok(
    EQ10_MUST_NOT.includes('copy_or_clone_instruction_sets_as_the_learning_object'),
  );
});

test('attention lesson maps needs; VERIFIED needs runtime evidence', () => {
  const lesson = mapAttentionWorkloadNeeds(agent);
  assert.equal(lesson.workloadId, 'attention_workload');
  assert.equal(lesson.copiesInstructionSet, false);
  assert.ok(lesson.operationNeeds.includes('matrix_vector_operations'));
  assert.equal(lesson.pathState, 'CANDIDATE');

  assert.equal(attemptVerifiedWithoutRuntimeEvidence().state, 'DENIED');
  assert.equal(
    canMarkPathVerified({
      hasActualRuntimeEvidence: false,
      evidenceRefs: [],
    }),
    false,
  );
  assert.equal(
    strengthenPathWithMeasurement({
      lesson,
      runtimeEvidenceRefs: [],
    }).state,
    'DENIED',
  );

  const ok = strengthenPathWithMeasurement({
    lesson,
    runtimeEvidenceRefs: ['rt-1'],
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.lesson.pathState, 'VERIFIED');
  assert.ok(ok.lesson.strength > lesson.strength);
});

test('strengthen/weaken neural path; ISA copy denied', () => {
  const lesson = mapAttentionWorkloadNeeds(agent);
  const strong = strengthenPathWithMeasurement({
    lesson,
    runtimeEvidenceRefs: ['m1'],
  });
  assert.ok(!('denied' in strong));
  const weak = weakenPath({ lesson: strong.lesson, reason: 'regression' });
  assert.equal(weak.lesson.pathState, 'REGRESSED');
  const stale = weakenPath({
    lesson: strong.lesson,
    reason: 'stale_evidence',
  });
  assert.equal(stale.lesson.pathState, 'STALE');

  assert.equal(attemptCopyInstructionSet().state, 'DENIED');
  assert.equal(
    emitStructuredLesson({
      actor: agent,
      lessonId: 'bad',
      workloadId: 'w',
      operationNeeds: ['x'],
      source: 'public_open_specifications',
      attemptCopyInstructionSet: true,
    }).state,
    'DENIED',
  );
});

test('boundary denies confidential microarch / RTL / firmware / secrets', () => {
  assert.equal(attemptConfidentialMicroarchitecture().state, 'DENIED');
  assert.equal(attemptProprietaryRtl().state, 'DENIED');
  assert.equal(attemptUnreleasedInstructions().state, 'DENIED');
  assert.equal(attemptPrivateFirmware().state, 'DENIED');
  assert.equal(attemptTradeSecretDetails().state, 'DENIED');
  assert.equal(
    emitStructuredLesson({
      actor: agent,
      lessonId: 'bad-rtl',
      workloadId: 'w',
      operationNeeds: ['x'],
      source: 'documented_compiler_behavior',
      blockedTarget: 'proprietary_rtl',
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapInstructionSemanticsLearning(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(
    boot.foci.length,
    INSTRUCTION_SEMANTICS_LEARNING_FOCI.length,
  );
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq10SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq9RiscvAcceleratorResearch.present, true);
  assert.equal(soft.eq5CompilerIrTranslationLayer.present, true);
  assert.equal(soft.eq4ProprietaryIsaBoundary.present, true);
  assert.equal(soft.eq3RiscvOpenIsaKnowledgePack.present, true);
  assert.equal(soft.eq2ArmArchitectureKnowledgePack.present, true);
  assert.equal(soft.eq1CrossArchitectureContract.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnEq10EvidenceToHomeBase({
    evidenceId: 'ev-eq10-1',
    actor: agent,
    summary: 'semantics learning advisory',
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

  const cycle = runInstructionSemanticsLearningCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, INSTRUCTION_SEMANTICS_LEARNING_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of INSTRUCTION_SEMANTICS_LEARNING_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.verified.pathState, 'VERIFIED');
  assert.equal(cycle.weakened.pathState, 'REGRESSED');
  assert.equal(cycle.lesson.copiesInstructionSet, false);
});
