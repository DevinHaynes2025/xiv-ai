/**
 * 62L-EQ9 — RISC-V Accelerator Research denial + honesty tests.
 *
 * Script: npm run test:62leq9
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  COMPARISON_PEER_PATHS,
  EQ9_AGENT_BOUNDS,
  EQ9_DB_CANDIDATES_STATUS,
  EQ9_LOCKS,
  EQ9_MAY,
  EQ9_MUST_NOT,
  GITHUB_SOT_FAMILY,
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
  RISCV_RESEARCH_FOCUS_DOMAINS,
  VERIFICATION_LADDER_ORDER,
  assertEq9LocksIntact,
  canMarkVerified,
  eq9SoftWireSnapshot,
  openIsaImpliesChipCopy,
  type Eq9Actor,
} from './riscv-accelerator-research-types.ts';

import {
  advanceVerification,
  attemptConfidentialImplementationDetails,
  attemptFirmwareIngestion,
  attemptFirmwareModification,
  attemptHardwareReprogramming,
  attemptPermissionExpansion,
  attemptPrivateExtensions,
  attemptProductionDeployment,
  attemptProprietaryRtlCopy,
  attemptRecommendAsAct,
  attemptSkipVerificationLadder,
  attemptUnsafePhysicalControl,
  attemptVerifiedWithoutBoundedExecution,
  bootstrapRiscvAcceleratorResearch,
  emitRiscvAcceleratorResearchNode,
  exampleVectorExtensionResearchNode,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnEq9EvidenceToHomeBase,
  runRiscvAcceleratorResearchCycle,
} from './riscv-accelerator-research-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq9Actor = {
  kind: 'riscv_accelerator_researcher',
  id: 'rv-acc-1',
  orgId: 'org-eq9',
  tenantId: 'ten-eq9',
  universeId: 'uni-eq9',
  permissions: ['draft'],
};

const human: Eq9Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq9',
  tenantId: 'ten-eq9',
  universeId: 'uni-eq9',
  permissions: ['approve_consequential'],
};

test('SoT label EQ9 / #161; GitLab mirror not invented; next EQ10', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ9');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /RISC-V Accelerator Research/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ10/);
  assert.match(NEXT_PHASE_TITLE, /Instruction-Semantics Learning/);
});

test('honesty locks: L4 false; DOCUMENTED≠VERIFIED; DB NOT_APPLIED', () => {
  assert.equal(assertEq9LocksIntact(), true);
  assert.equal(EQ9_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ9_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ9_LOCKS.DOCUMENTED_EQ_DETECTED, false);
  assert.equal(EQ9_LOCKS.SUPPORTED_EQ_VERIFIED, false);
  assert.equal(EQ9_LOCKS.PROPRIETARY_RTL_COPY, false);
  assert.equal(EQ9_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(EQ9_AGENT_BOUNDS.mayMarkVerifiedWithoutBoundedExecution, false);
  assert.equal(openIsaImpliesChipCopy(), false);
});

test('dimensions + graph + focus + ladder + learning goal encoded', () => {
  assert.ok(RISCV_ACCELERATOR_RESEARCH_DIMENSIONS.includes('vector_extension_support'));
  assert.ok(RISCV_ACCELERATOR_RESEARCH_DIMENSIONS.includes('onnx_ml_framework_compatibility'));
  assert.deepEqual([...RISCV_ACCELERATOR_CORE_GRAPH], [
    'riscv_isa',
    'extension',
    'toolchain',
    'runtime',
    'device',
    'workload',
    'benchmark',
    'outcome',
  ]);
  assert.ok(RISCV_RESEARCH_FOCUS_DOMAINS.includes('low_power_edge_ai'));
  assert.ok(RISCV_RESEARCH_FOCUS_DOMAINS.includes('robotics'));
  assert.deepEqual([...VERIFICATION_LADDER_ORDER], [
    'DOCUMENTED',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
  ]);
  assert.deepEqual([...OPEN_ISA_LEARNING_GOAL], [
    'xiv_workload_intelligence',
    'portable_runtime_mapping',
    'evidence_based_scheduler',
  ]);
  assert.deepEqual([...COMPARISON_PEER_PATHS], ['arm', 'x86', 'gpu', 'npu']);
  assert.ok(EQ9_MAY.includes('advance_documented_detected_supported_verified_with_evidence'));
  assert.ok(EQ9_MUST_NOT.includes('copy_proprietary_rtl_private_extensions_or_firmware'));
});

test('ladder: DOCUMENTED→DETECTED→SUPPORTED→VERIFIED; skip/no-exec denied', () => {
  const doc = exampleVectorExtensionResearchNode(agent);
  assert.equal(doc.verificationState, 'DOCUMENTED');
  assert.equal(doc.copiesVendorChip, false);

  assert.equal(attemptSkipVerificationLadder().state, 'DENIED');
  assert.equal(
    advanceVerification({
      node: doc,
      to: 'VERIFIED',
      evidenceRefs: ['x'],
      attemptSkipLadder: true,
    }).state,
    'DENIED',
  );

  const detected = advanceVerification({
    node: doc,
    to: 'DETECTED',
    evidenceRefs: ['chip-1'],
    chipExposesExtension: true,
  });
  assert.ok(!('denied' in detected));
  assert.equal(detected.node.verificationState, 'DETECTED');

  assert.equal(
    advanceVerification({
      node: doc,
      to: 'DETECTED',
      evidenceRefs: ['chip-1'],
      chipExposesExtension: false,
    }).state,
    'DENIED',
  );

  const supported = advanceVerification({
    node: detected.node,
    to: 'SUPPORTED',
    evidenceRefs: ['rt-1'],
    runtimeModelPathCompatible: true,
  });
  assert.ok(!('denied' in supported));

  assert.equal(attemptVerifiedWithoutBoundedExecution().state, 'DENIED');
  assert.equal(
    canMarkVerified({
      from: 'SUPPORTED',
      boundedExecutionSucceeded: false,
      evidenceRefs: ['x'],
    }),
    false,
  );
  assert.equal(
    advanceVerification({
      node: supported.node,
      to: 'VERIFIED',
      evidenceRefs: ['x'],
      boundedExecutionSucceeded: false,
    }).state,
    'DENIED',
  );

  const verified = advanceVerification({
    node: supported.node,
    to: 'VERIFIED',
    evidenceRefs: ['bounded-exec-1'],
    boundedExecutionSucceeded: true,
  });
  assert.ok(!('denied' in verified));
  assert.equal(verified.node.verificationState, 'VERIFIED');
});

test('open ISA learn ≠ chip copy; proprietary boundary denies', () => {
  assert.equal(
    emitRiscvAcceleratorResearchNode({
      actor: agent,
      nodeId: 'bad-copy',
      baseIsaVersion: 'RV64',
      extensionId: 'V',
      dimension: 'vector_extension_support',
      focusDomains: ['vector_workloads'],
      publicSourceRef: 'public',
      attemptEquateOpenIsaWithChipCopy: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptProprietaryRtlCopy().state, 'DENIED');
  assert.equal(attemptPrivateExtensions().state, 'DENIED');
  assert.equal(attemptFirmwareIngestion().state, 'DENIED');
  assert.equal(attemptConfidentialImplementationDetails().state, 'DENIED');
  assert.equal(
    emitRiscvAcceleratorResearchNode({
      actor: agent,
      nodeId: 'bad-rtl',
      baseIsaVersion: 'RV64',
      extensionId: 'I',
      dimension: 'riscv_base_isa_version',
      focusDomains: ['embedded_control'],
      publicSourceRef: 'public',
      attemptProprietaryRtlCopy: true,
    }).state,
    'DENIED',
  );
});

test('governance denies firmware mod / reprogram / unsafe / prod / perms', () => {
  assert.equal(attemptFirmwareModification().state, 'DENIED');
  assert.equal(attemptHardwareReprogramming().state, 'DENIED');
  assert.equal(attemptUnsafePhysicalControl().state, 'DENIED');
  assert.equal(attemptProductionDeployment().state, 'DENIED');
  assert.equal(attemptPermissionExpansion().state, 'DENIED');
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapRiscvAcceleratorResearch(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(
    boot.dimensions.length,
    RISCV_ACCELERATOR_RESEARCH_DIMENSIONS.length,
  );
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq9SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq8ArmServerCloudRuntime.present, true);
  assert.equal(soft.eq3RiscvOpenIsaKnowledgePack.present, true);
  assert.equal(soft.eq6ArchitectureCapabilityGraph.present, true);
  assert.equal(soft.eq5CompilerIrTranslationLayer.present, true);
  assert.equal(soft.eq1CrossArchitectureContract.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnEq9EvidenceToHomeBase({
    evidenceId: 'ev-eq9-1',
    actor: agent,
    summary: 'riscv accelerator advisory',
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

  const cycle = runRiscvAcceleratorResearchCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, RISCV_ACCELERATOR_RESEARCH_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of RISCV_ACCELERATOR_RESEARCH_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.documented.verificationState, 'DOCUMENTED');
  assert.equal(cycle.verified.verificationState, 'VERIFIED');
});
