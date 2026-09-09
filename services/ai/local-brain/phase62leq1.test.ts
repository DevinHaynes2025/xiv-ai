/**
 * 62L-EQ1 — Cross-Architecture Contract denial + honesty tests.
 *
 * Script: npm run test:62leq1
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ARCHITECTURE_FAMILIES,
  CROSS_ARCHITECTURE_CONTRACT_CYCLE,
  CROSS_ARCH_CONTRACT_FIELDS,
  CROSS_ARCH_POLICY_STATES,
  EQ1_DB_CANDIDATES_STATUS,
  EQ1_LOCKS,
  EQ1_MAY,
  EQ1_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEURAL_COMPUTE_PATHWAY,
  NEXT_PHASE_TITLE,
  TRANSLATION_MODES,
  assertEq1LocksIntact,
  eq1SoftWireSnapshot,
  type Eq1Actor,
} from './cross-architecture-contract-types.ts';

import {
  attemptAutonomousDeviceControl,
  attemptClaimSiliconModification,
  attemptEquatePublicResearchWithVerified,
  attemptImplyQpuPhysicalWithoutEvidence,
  attemptMarkUnverifiedAsVerified,
  attemptPromoteResearchOnlyToProduction,
  attemptRecommendAsAct,
  bootstrapCrossArchitectureContract,
  emitCrossArchitectureContract,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnCrossArchEvidenceToHomeBase,
  runCrossArchitectureContractCycle,
} from './cross-architecture-contract-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq1Actor = {
  kind: 'cross_arch_contract',
  id: 'cac-1',
  orgId: 'org-eq1',
  tenantId: 'ten-eq1',
  universeId: 'uni-eq1',
  permissions: ['draft'],
};

const human: Eq1Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq1',
  tenantId: 'ten-eq1',
  universeId: 'uni-eq1',
  permissions: ['approve_consequential'],
};

test('SoT label EQ1 / #161; GitLab mirror not invented; next EQ2', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ1');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /Cross-Architecture Contract/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ2/);
  assert.match(NEXT_PHASE_TITLE, /ARM\/AArch64/);
});

test('honesty locks: L4 false; public-ISA≠VERIFIED; DB NOT_APPLIED', () => {
  assert.equal(assertEq1LocksIntact(), true);
  assert.equal(EQ1_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ1_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ1_LOCKS.PUBLIC_ISA_RESEARCH_EQ_VERIFIED_EXECUTION, false);
  assert.equal(EQ1_LOCKS.SILICON_MODIFICATION_CLAIMS, false);
  assert.equal(EQ1_LOCKS.AUTONOMOUS_DEVICE_CONTROL, false);
  assert.equal(EQ1_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('architectures + contract fields + neural pathway + policy states encoded', () => {
  assert.ok(ARCHITECTURE_FAMILIES.includes('arm_aarch64'));
  assert.ok(ARCHITECTURE_FAMILIES.includes('riscv'));
  assert.ok(ARCHITECTURE_FAMILIES.includes('x86_64'));
  assert.ok(ARCHITECTURE_FAMILIES.includes('gpu'));
  assert.ok(ARCHITECTURE_FAMILIES.includes('npu'));
  assert.ok(ARCHITECTURE_FAMILIES.includes('qpu_path'));
  assert.ok(CROSS_ARCH_CONTRACT_FIELDS.includes('contractId'));
  assert.ok(CROSS_ARCH_CONTRACT_FIELDS.includes('compilerIrTarget'));
  assert.deepEqual([...CROSS_ARCH_POLICY_STATES], [
    'COMPATIBLE',
    'PARTIAL',
    'TRANSLATION_REQUIRED',
    'UNSUPPORTED',
    'RESEARCH_ONLY',
    'WAITING_PUBLIC_SPEC',
  ]);
  assert.equal(NEURAL_COMPUTE_PATHWAY[0], 'agent_mission');
  assert.equal(NEURAL_COMPUTE_PATHWAY.at(-1), 'xiv_home_base');
  assert.ok(TRANSLATION_MODES.includes('ir_lower'));
  assert.ok(EQ1_MAY.includes('emit_universal_cross_architecture_contracts'));
  assert.ok(
    EQ1_MUST_NOT.includes('equate_public_isa_research_with_verified_execution'),
  );
});

test('ARM DOCUMENTED + RISC-V RESEARCH_ONLY contracts; public≠VERIFIED', () => {
  const arm = emitCrossArchitectureContract({
    actor: agent,
    contractId: 'cac-arm',
    architectureFamily: 'arm_aarch64',
    abiRuntime: 'linux-aarch64',
    compilerIrTarget: 'llvm-aarch64',
    workloadGenomeRef: 'wg-1',
    algorithmRef: 'alg-1',
    runtimeProvider: 'onnx',
    deviceClassCandidate: 'edge_cpu',
    translationMode: 'native',
    verificationState: 'DOCUMENTED',
    publicSpecRefs: ['arm-arm'],
    homeBaseEnvelopeId: 'hb-1',
  });
  assert.ok(!('denied' in arm));
  assert.equal(arm.architectureFamily, 'arm_aarch64');
  assert.equal(arm.siliconModificationClaimed, false);
  assert.notEqual(arm.policyState, 'COMPATIBLE');

  const riscv = emitCrossArchitectureContract({
    actor: agent,
    contractId: 'cac-rv',
    architectureFamily: 'riscv',
    extensionSet: ['V', 'A'],
    abiRuntime: 'linux-riscv64',
    compilerIrTarget: 'llvm-riscv64',
    workloadGenomeRef: 'wg-2',
    algorithmRef: 'alg-2',
    runtimeProvider: 'rv-rt',
    deviceClassCandidate: 'accel',
    translationMode: 'ir_lower',
    verificationState: 'RESEARCH_ONLY',
    publicSpecRefs: ['riscv-spec'],
    homeBaseEnvelopeId: 'hb-1',
  });
  assert.ok(!('denied' in riscv));
  assert.equal(riscv.policyState, 'TRANSLATION_REQUIRED');

  assert.equal(attemptEquatePublicResearchWithVerified().state, 'DENIED');
  assert.equal(
    emitCrossArchitectureContract({
      actor: agent,
      contractId: 'cac-bad',
      architectureFamily: 'arm_aarch64',
      abiRuntime: 'linux-aarch64',
      compilerIrTarget: 'llvm-aarch64',
      workloadGenomeRef: 'wg',
      algorithmRef: 'alg',
      runtimeProvider: 'r',
      deviceClassCandidate: 'cpu',
      translationMode: 'native',
      verificationState: 'DOCUMENTED',
      publicSpecRefs: ['arm'],
      homeBaseEnvelopeId: 'hb',
      attemptEquatePublicResearchWithVerified: true,
    }).state,
    'DENIED',
  );
});

test('silicon mod / device control / VERIFIED without evidence denied', () => {
  assert.equal(attemptClaimSiliconModification().state, 'DENIED');
  assert.equal(attemptAutonomousDeviceControl().state, 'DENIED');
  assert.equal(attemptMarkUnverifiedAsVerified().state, 'DENIED');
  assert.equal(attemptPromoteResearchOnlyToProduction().state, 'DENIED');
  assert.equal(attemptImplyQpuPhysicalWithoutEvidence().state, 'DENIED');

  assert.equal(
    emitCrossArchitectureContract({
      actor: agent,
      contractId: 'cac-v',
      architectureFamily: 'x86_64',
      abiRuntime: 'linux-x64',
      compilerIrTarget: 'llvm-x86_64',
      workloadGenomeRef: 'wg',
      algorithmRef: 'alg',
      runtimeProvider: 'r',
      deviceClassCandidate: 'cpu',
      translationMode: 'native',
      verificationState: 'VERIFIED',
      publicSpecRefs: ['sdm'],
      evidenceRefs: [],
      homeBaseEnvelopeId: 'hb',
    }).state,
    'DENIED',
  );

  assert.equal(
    emitCrossArchitectureContract({
      actor: agent,
      contractId: 'cac-qpu',
      architectureFamily: 'qpu_path',
      abiRuntime: 'qi',
      compilerIrTarget: 'qi-ir',
      workloadGenomeRef: 'wg',
      algorithmRef: 'alg',
      runtimeProvider: 'qi',
      deviceClassCandidate: 'qpu',
      translationMode: 'emulated_research',
      verificationState: 'RESEARCH_ONLY',
      publicSpecRefs: ['qi'],
      homeBaseEnvelopeId: 'hb',
      attemptImplyQpuPhysicalWithoutEvidence: true,
    }).state,
    'DENIED',
  );
});

test('WAITING_PUBLIC_SPEC when no public refs; neural pathway on contract', () => {
  const waiting = emitCrossArchitectureContract({
    actor: agent,
    contractId: 'cac-wait',
    architectureFamily: 'gpu',
    abiRuntime: 'cuda-or-rocm-abstract',
    compilerIrTarget: 'gpu-ir',
    workloadGenomeRef: 'wg',
    algorithmRef: 'alg',
    runtimeProvider: 'gpu-rt',
    deviceClassCandidate: 'gpu',
    translationMode: 'runtime_shim',
    verificationState: 'DOCUMENTED',
    publicSpecRefs: [],
    homeBaseEnvelopeId: 'hb',
  });
  assert.ok(!('denied' in waiting));
  assert.equal(waiting.policyState, 'WAITING_PUBLIC_SPEC');
  assert.deepEqual([...waiting.neuralPathway], [...NEURAL_COMPUTE_PATHWAY]);
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapCrossArchitectureContract(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.architectureFamilies.length, ARCHITECTURE_FAMILIES.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq1SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep18QuantumInspiredComputeLab.present, true);
  assert.equal(soft.ep17ClassicalQuantBaselineLab.present, true);
  assert.equal(soft.ep12Scheduler.present, true);
  assert.equal(soft.ep1VirtualChipContract.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnCrossArchEvidenceToHomeBase({
    evidenceId: 'ev-eq1-1',
    actor: agent,
    summary: 'cross-arch advisory',
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

  const cycle = runCrossArchitectureContractCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, CROSS_ARCHITECTURE_CONTRACT_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of CROSS_ARCHITECTURE_CONTRACT_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.armContract));
  assert.ok(!('denied' in cycle.riscvContract));
});
