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
  ARCHITECTURE_EVIDENCE_STATES,
  ARCHITECTURE_RECORD_FIELDS,
  CROSS_ARCHITECTURE_CONTRACT_CYCLE,
  CROSS_ARCHITECTURE_FLOW,
  CROSS_ARCH_AGENT_BOUNDS,
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
  ISA_FAMILIES,
  NEXT_PHASE_TITLE,
  SAFETY_IP_BOUNDARIES,
  WORKLOAD_CAPABILITIES,
  architectureKnowledgeImpliesMachineVerified,
  assertEq1LocksIntact,
  eq1SoftWireSnapshot,
  type Eq1Actor,
} from './cross-architecture-contract-types.ts';

import {
  attemptConfidentialMicroarchitectureRe,
  attemptDocumentedAarch64AsPhoneVerified,
  attemptEquateKnowledgeWithVerification,
  attemptProprietaryIsaCloning,
  attemptRecommendAsAct,
  attemptRestrictedRtlFirmwareIngestion,
  attemptVerifiedWithoutMachineEvidence,
  bootstrapCrossArchitectureContract,
  emitArchitectureRecord,
  exampleArmAarch64Documented,
  mapCapabilitiesToArchitectures,
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

test('SoT label EQ1 / #161; GitLab mirror not invented; next EQ2 ARM Knowledge Pack', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ1');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /Cross-Architecture Contract/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ2/);
  assert.match(NEXT_PHASE_TITLE, /ARM Architecture Knowledge Pack/);
});

test('honesty locks: L4 false; knowledge≠machine verification; DB NOT_APPLIED', () => {
  assert.equal(assertEq1LocksIntact(), true);
  assert.equal(EQ1_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ1_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(
    EQ1_LOCKS.ARCHITECTURE_KNOWLEDGE_EQ_MACHINE_VERIFICATION,
    false,
  );
  assert.equal(
    EQ1_LOCKS.DOCUMENTED_AARCH64_EQ_PHONE_INFERENCE_VERIFIED,
    false,
  );
  assert.equal(EQ1_LOCKS.PROPRIETARY_ISA_CLONING, false);
  assert.equal(EQ1_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    CROSS_ARCH_AGENT_BOUNDS.mayEquateKnowledgeWithMachineVerification,
    false,
  );
});

test('record fields + evidence states + capabilities + flow encoded', () => {
  assert.ok(ARCHITECTURE_RECORD_FIELDS.includes('architectureId'));
  assert.ok(ARCHITECTURE_RECORD_FIELDS.includes('evidenceState'));
  assert.ok(ARCHITECTURE_RECORD_FIELDS.includes('lastVerifiedAt'));
  assert.deepEqual([...ARCHITECTURE_EVIDENCE_STATES], [
    'DOCUMENTED',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
    'NOT_TESTED',
    'DEGRADED',
    'UNAVAILABLE',
  ]);
  assert.ok(ISA_FAMILIES.includes('arm_aarch64'));
  assert.ok(ISA_FAMILIES.includes('riscv'));
  assert.ok(WORKLOAD_CAPABILITIES.includes('matrix_multiply'));
  assert.ok(WORKLOAD_CAPABILITIES.includes('attention'));
  assert.deepEqual([...CROSS_ARCHITECTURE_FLOW], [
    'agent_task',
    'workload_genome',
    'cross_architecture_contract',
    'runtime_compiler_candidate',
    'verified_device',
    'execution',
    'return_receipt',
    'xiv_home_base',
  ]);
  assert.ok(SAFETY_IP_BOUNDARIES.includes('no_proprietary_isa_cloning'));
  assert.ok(EQ1_MAY.includes('separate_architecture_knowledge_from_machine_verification'));
  assert.ok(
    EQ1_MUST_NOT.includes(
      'equate_documented_semantics_with_verified_machine_execution',
    ),
  );
});

test('DOCUMENTED AArch64 ≠ phone inference VERIFIED; knowledge≠machine', () => {
  const arm = exampleArmAarch64Documented(agent);
  assert.equal(arm.evidenceState, 'DOCUMENTED');
  assert.equal(arm.machineVerified, false);
  assert.equal(arm.lastVerifiedAt, null);
  assert.equal(architectureKnowledgeImpliesMachineVerified('DOCUMENTED'), false);
  assert.equal(attemptEquateKnowledgeWithVerification().state, 'DENIED');
  assert.equal(attemptDocumentedAarch64AsPhoneVerified().state, 'DENIED');

  assert.equal(
    emitArchitectureRecord({
      actor: agent,
      architectureId: 'arch-phone',
      vendor: 'phone-oem',
      isaFamily: 'arm_aarch64',
      architectureVersion: 'AArch64',
      deviceClass: 'phone',
      runtime: 'android',
      compilerToolchain: 'ndk',
      memoryModel: 'arm',
      evidenceState: 'DOCUMENTED',
      sourceRefs: ['arm-public'],
      attemptEquateKnowledgeWithVerification: true,
    }).state,
    'DENIED',
  );
});

test('capability mapping without brand hard-coding', () => {
  const arm = exampleArmAarch64Documented(agent);
  const x86 = emitArchitectureRecord({
    actor: agent,
    architectureId: 'arch-x86',
    vendor: 'generic-x86',
    isaFamily: 'x86_64',
    architectureVersion: 'x86-64',
    deviceClass: 'cpu',
    runtime: 'linux-x64',
    compilerToolchain: 'llvm',
    memoryModel: 'tso-public',
    evidenceState: 'DOCUMENTED',
    sourceRefs: ['sdm-public'],
    capabilityTags: ['graph_search', 'encryption', 'optimization'],
  });
  assert.ok(!('denied' in x86));

  const map = mapCapabilitiesToArchitectures({
    mappingId: 'm1',
    requiredCapabilities: ['matrix_multiply', 'vector_operations'],
    candidates: [arm, x86],
  });
  assert.ok(!('denied' in map));
  assert.equal(map.brandHardCoded, false);
  assert.deepEqual([...map.matchedArchitectureIds], [
    'arch-arm-aarch64-public',
  ]);

  assert.equal(
    mapCapabilitiesToArchitectures({
      mappingId: 'm-brand',
      requiredCapabilities: ['attention'],
      candidates: [arm],
      attemptBrandHardCoding: true,
    }).state,
    'DENIED',
  );
});

test('Safety/IP denies + VERIFIED requires machine evidence', () => {
  assert.equal(attemptProprietaryIsaCloning().state, 'DENIED');
  assert.equal(attemptRestrictedRtlFirmwareIngestion().state, 'DENIED');
  assert.equal(attemptConfidentialMicroarchitectureRe().state, 'DENIED');
  assert.equal(attemptVerifiedWithoutMachineEvidence().state, 'DENIED');

  assert.equal(
    emitArchitectureRecord({
      actor: agent,
      architectureId: 'arch-clone',
      vendor: 'x',
      isaFamily: 'arm_aarch64',
      architectureVersion: 'AArch64',
      deviceClass: 'cpu',
      runtime: 'linux',
      compilerToolchain: 'clang',
      memoryModel: 'arm',
      evidenceState: 'DOCUMENTED',
      sourceRefs: ['public'],
      attemptCloneProprietaryIsa: true,
    }).state,
    'DENIED',
  );

  assert.equal(
    emitArchitectureRecord({
      actor: agent,
      architectureId: 'arch-v-bad',
      vendor: 'x',
      isaFamily: 'x86_64',
      architectureVersion: 'x86-64',
      deviceClass: 'cpu',
      runtime: 'linux',
      compilerToolchain: 'gcc',
      memoryModel: 'tso',
      evidenceState: 'VERIFIED',
      sourceRefs: ['public'],
      machineEvidenceRefs: [],
    }).state,
    'DENIED',
  );

  const verified = emitArchitectureRecord({
    actor: agent,
    architectureId: 'arch-v-ok',
    vendor: 'lab',
    isaFamily: 'x86_64',
    architectureVersion: 'x86-64',
    deviceClass: 'cpu',
    runtime: 'linux',
    compilerToolchain: 'gcc',
    memoryModel: 'tso',
    evidenceState: 'VERIFIED',
    sourceRefs: ['public'],
    machineEvidenceRefs: ['xiv-bench-run-1'],
    lastVerifiedAt: '2026-09-09T00:00:00.000Z',
    capabilityTags: ['simulation'],
  });
  assert.ok(!('denied' in verified));
  assert.equal(verified.machineVerified, true);
  assert.equal(verified.lastVerifiedAt, '2026-09-09T00:00:00.000Z');
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapCrossArchitectureContract(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.recordFields.length, ARCHITECTURE_RECORD_FIELDS.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq1SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep18QuantumInspiredComputeLab.present, true);
  assert.equal(soft.ep17ClassicalQuantBaselineLab.present, true);
  assert.equal(soft.ep13RuntimeReturnReceipt.present, true);
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
  assert.ok(!('denied' in cycle.armDocumented));
  assert.equal(cycle.armDocumented.evidenceState, 'DOCUMENTED');
  assert.ok(!('denied' in cycle.mapping));
});
