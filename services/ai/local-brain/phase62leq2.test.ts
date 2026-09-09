/**
 * 62L-EQ2 — ARM Architecture Knowledge Pack denial + honesty tests.
 *
 * Script: npm run test:62leq2
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ARM_ARCHITECTURE_KNOWLEDGE_PACK_CYCLE,
  ARM_EVIDENCE_CLASSES,
  ARM_KNOWLEDGE_AGENT_BOUNDS,
  ARM_KNOWLEDGE_DOMAINS,
  ARM_KNOWLEDGE_NODE_FIELDS,
  ARM_NEURAL_PATHWAY,
  ARM_RIGHTS_STATES,
  EQ2_DB_CANDIDATES_STATUS,
  EQ2_LOCKS,
  EQ2_MAY,
  EQ2_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  architectureSupportImpliesDeviceVerification,
  assertEq2LocksIntact,
  eq2SoftWireSnapshot,
  type Eq2Actor,
} from './arm-architecture-knowledge-pack-types.ts';

import {
  answerArmResearchQuestion,
  attemptCloneArmSilicon,
  attemptConfidentialCpuCoreInternals,
  attemptEquateSupportWithDeviceVerification,
  attemptFirmwareKeys,
  attemptLeakedRoadmaps,
  attemptPrivateRtl,
  attemptProprietaryVendorDetails,
  attemptRecommendAsAct,
  attemptStrengthenWithoutMeasurement,
  attemptTradeSecrets,
  bootstrapArmArchitectureKnowledgePack,
  emitArmKnowledgeNode,
  exampleNeonNode,
  examplePreferNpuGpuNode,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnArmKnowledgeEvidenceToHomeBase,
  runArmArchitectureKnowledgePackCycle,
  strengthenDevicePerformanceEdge,
} from './arm-architecture-knowledge-pack-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq2Actor = {
  kind: 'arm_research_agent',
  id: 'arm-1',
  orgId: 'org-eq2',
  tenantId: 'ten-eq2',
  universeId: 'uni-eq2',
  permissions: ['draft'],
};

const human: Eq2Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq2',
  tenantId: 'ten-eq2',
  universeId: 'uni-eq2',
  permissions: ['approve_consequential'],
};

test('SoT label EQ2 / #161; GitLab mirror not invented; next EQ3', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ2');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /ARM Architecture Knowledge Pack/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ3/);
  assert.match(NEXT_PHASE_TITLE, /RISC-V/);
});

test('honesty locks: L4 false; support≠device verification; DB NOT_APPLIED', () => {
  assert.equal(assertEq2LocksIntact(), true);
  assert.equal(EQ2_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ2_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ2_LOCKS.ARCHITECTURE_SUPPORT_EQ_DEVICE_VERIFICATION, false);
  assert.equal(EQ2_LOCKS.UNMEASURED_STRENGTHENS_DEVICE_PERFORMANCE_EDGE, false);
  assert.equal(EQ2_LOCKS.CLONING_ARM_SILICON, false);
  assert.equal(EQ2_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    ARM_KNOWLEDGE_AGENT_BOUNDS.mayStrengthenEdgesWithoutMeasurement,
    false,
  );
  assert.equal(architectureSupportImpliesDeviceVerification(), false);
});

test('domains + node fields + pathway + rights/evidence encoded', () => {
  assert.ok(ARM_KNOWLEDGE_DOMAINS.includes('simd_vector_capabilities'));
  assert.ok(ARM_KNOWLEDGE_DOMAINS.includes('compiler_toolchain_support'));
  assert.ok(ARM_KNOWLEDGE_NODE_FIELDS.includes('architectureVersion'));
  assert.ok(ARM_KNOWLEDGE_NODE_FIELDS.includes('rightsState'));
  assert.ok(ARM_KNOWLEDGE_NODE_FIELDS.includes('confidence'));
  assert.deepEqual([...ARM_RIGHTS_STATES], [
    'PUBLIC_DOCUMENTATION',
    'OPEN_TOOLCHAIN',
    'XIV_OWNED_MEASUREMENT',
    'RESTRICTED_DENIED',
  ]);
  assert.ok(ARM_EVIDENCE_CLASSES.includes('DOCUMENTED'));
  assert.ok(ARM_EVIDENCE_CLASSES.includes('MEASURED'));
  assert.deepEqual([...ARM_NEURAL_PATHWAY], [
    'arm_feature',
    'compiler_runtime',
    'workload_capability',
    'device_candidate',
    'benchmark',
    'result',
  ]);
  assert.ok(EQ2_MAY.includes('separate_architecture_support_from_device_verification'));
  assert.ok(EQ2_MUST_NOT.includes('clone_arm_silicon'));
});

test('DOCUMENTED NEON node is not device-verified; research answers advisory', () => {
  const neon = exampleNeonNode(agent);
  assert.equal(neon.evidenceClass, 'DOCUMENTED');
  assert.equal(neon.deviceVerified, false);
  assert.equal(neon.rightsState, 'PUBLIC_DOCUMENTATION');

  const ans = answerArmResearchQuestion({
    questionId: 'q1',
    question: 'Which documented ARM capabilities matter for local AI inference?',
    nodes: [neon, examplePreferNpuGpuNode(agent)],
  });
  assert.ok(!('denied' in ans));
  assert.equal(ans.advisoryOnly, true);
  assert.equal(ans.deviceVerifiedClaimed, false);
  assert.ok(ans.nodeIds.includes('arm-neon-1'));

  assert.equal(attemptEquateSupportWithDeviceVerification().state, 'DENIED');
  assert.equal(
    answerArmResearchQuestion({
      questionId: 'q-bad',
      question: 'phone verified?',
      nodes: [neon],
      attemptClaimDeviceVerified: true,
    }).state,
    'DENIED',
  );
});

test('only measured results strengthen device-performance edge', () => {
  const neon = exampleNeonNode(agent);
  const ok = strengthenDevicePerformanceEdge({
    edgeId: 'e1',
    fromNodeId: neon.nodeId,
    deviceCandidateId: 'dev-1',
    measured: true,
    measurementRefs: ['xiv-m-1'],
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.strengthened, true);
  assert.equal(ok.measured, true);

  assert.equal(attemptStrengthenWithoutMeasurement().state, 'DENIED');
  assert.equal(
    strengthenDevicePerformanceEdge({
      edgeId: 'e-bad',
      fromNodeId: neon.nodeId,
      deviceCandidateId: 'dev-1',
      measured: false,
      attemptUnmeasuredStrengthen: true,
    }).state,
    'DENIED',
  );
});

test('IP boundary denies confidential internals / RTL / keys / secrets', () => {
  assert.equal(attemptConfidentialCpuCoreInternals().state, 'DENIED');
  assert.equal(attemptPrivateRtl().state, 'DENIED');
  assert.equal(attemptFirmwareKeys().state, 'DENIED');
  assert.equal(attemptProprietaryVendorDetails().state, 'DENIED');
  assert.equal(attemptLeakedRoadmaps().state, 'DENIED');
  assert.equal(attemptTradeSecrets().state, 'DENIED');
  assert.equal(attemptCloneArmSilicon().state, 'DENIED');

  assert.equal(
    emitArmKnowledgeNode({
      actor: agent,
      nodeId: 'bad-rtl',
      architectureVersion: 'AArch64',
      featureExtension: 'x',
      instructionSemanticClass: 'x',
      compilerSupport: 'x',
      runtimeSupport: 'x',
      workloadRelevance: ['local_ai_inference'],
      source: 'leak',
      sourceDate: '2026-01-01',
      rightsState: 'PUBLIC_DOCUMENTATION',
      evidenceClass: 'DOCUMENTED',
      confidence: 0.1,
      attemptPrivateRtl: true,
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapArmArchitectureKnowledgePack(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.domains.length, ARM_KNOWLEDGE_DOMAINS.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq2SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq1CrossArchitectureContract.present, true);
  assert.equal(soft.ep18QuantumInspiredComputeLab.present, true);
  assert.equal(soft.ep13RuntimeReturnReceipt.present, true);
  assert.equal(soft.ep12Scheduler.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnArmKnowledgeEvidenceToHomeBase({
    evidenceId: 'ev-eq2-1',
    actor: agent,
    summary: 'arm knowledge advisory',
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

  const cycle = runArmArchitectureKnowledgePackCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, ARM_ARCHITECTURE_KNOWLEDGE_PACK_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of ARM_ARCHITECTURE_KNOWLEDGE_PACK_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.neon.evidenceClass, 'DOCUMENTED');
  assert.ok(!('denied' in cycle.researchAnswer));
});
