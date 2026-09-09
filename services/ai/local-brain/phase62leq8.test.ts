/**
 * 62L-EQ8 — ARM Server / Cloud Runtime Research denial + honesty tests.
 *
 * Script: npm run test:62leq8
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ARM_SERVER_CLOUD_CORE_FLOW,
  ARM_SERVER_CLOUD_RESEARCH_DIMENSIONS,
  ARM_SERVER_CLOUD_RUNTIME_CYCLE,
  CLOUD_TRUTH_BOUNDARY,
  COMPARISON_CANDIDATE_CLASSES,
  COMPARISON_METRICS,
  EQ8_AGENT_BOUNDS,
  EQ8_DB_CANDIDATES_STATUS,
  EQ8_LOCKS,
  EQ8_MAY,
  EQ8_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  XIV_ECONOMICS_BRAIN_PATH,
  assertEq8LocksIntact,
  canMarkCloudVerified,
  cloudRegistryImpliesVerified,
  eq8SoftWireSnapshot,
  recommendationImpliesAuthorizedExecution,
  type Eq8Actor,
} from './arm-server-cloud-runtime-types.ts';

import {
  advanceCloudRegistryEvidence,
  attemptAutonomousProvisioning,
  attemptAutonomousPurchasing,
  attemptAutonomousScaling,
  attemptCredentialHarvesting,
  attemptCrossTenantDataPooling,
  attemptEquateRegistryWithVerified,
  attemptHiddenResourceCreation,
  attemptProductionWithoutHumanAuth,
  attemptRecommendAsAct,
  attemptUnrestrictedCloudMovement,
  authorizeExecution,
  bootstrapArmServerCloudRuntime,
  buildComparisonMatrix,
  emitSchedulerRecommendation,
  exampleWorkloadComparisonMatrix,
  probeGuardianRlsTenantUniverseIsolation,
  registerCloudProvider,
  requireHumanApproval,
  returnEq8EvidenceToHomeBase,
  runArmServerCloudRuntimeCycle,
} from './arm-server-cloud-runtime-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq8Actor = {
  kind: 'arm_server_researcher',
  id: 'asr-1',
  orgId: 'org-eq8',
  tenantId: 'ten-eq8',
  universeId: 'uni-eq8',
  permissions: ['draft'],
};

const human: Eq8Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq8',
  tenantId: 'ten-eq8',
  universeId: 'uni-eq8',
  permissions: ['approve_consequential'],
};

test('SoT label EQ8 / #161; GitLab mirror not invented; next EQ9', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ8');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /ARM Server\/Cloud Runtime Research/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ9/);
  assert.match(NEXT_PHASE_TITLE, /RISC-V Accelerator Research/);
});

test('honesty locks: L4 false; cloud registry≠verified; DB NOT_APPLIED', () => {
  assert.equal(assertEq8LocksIntact(), true);
  assert.equal(EQ8_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ8_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ8_LOCKS.CLOUD_REGISTRY_EQ_VERIFIED, false);
  assert.equal(EQ8_LOCKS.AUTONOMOUS_PROVISIONING, false);
  assert.equal(EQ8_LOCKS.RECOMMENDATION_EQ_AUTHORIZED_EXECUTION, false);
  assert.equal(EQ8_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(EQ8_AGENT_BOUNDS.mayAutonomousProvision, false);
  assert.equal(cloudRegistryImpliesVerified(), false);
  assert.equal(CLOUD_TRUTH_BOUNDARY.registryAppearanceMeans, 'DOCUMENTED');
  assert.equal(recommendationImpliesAuthorizedExecution(), false);
});

test('dimensions + flow + comparison matrix + economics path encoded', () => {
  assert.ok(ARM_SERVER_CLOUD_RESEARCH_DIMENSIONS.includes('arm_server_families'));
  assert.ok(ARM_SERVER_CLOUD_RESEARCH_DIMENSIONS.includes('cost_per_workload'));
  assert.ok(ARM_SERVER_CLOUD_RESEARCH_DIMENSIONS.includes('benchmark_freshness'));
  assert.deepEqual([...ARM_SERVER_CLOUD_CORE_FLOW], [
    'workload',
    'capability_requirements',
    'arm_server_candidates',
    'benchmark_cost_comparison',
    'scheduler_recommendation',
    'authorized_execution',
  ]);
  assert.deepEqual([...COMPARISON_CANDIDATE_CLASSES], [
    'arm_cpu_server',
    'x86_cpu_server',
    'gpu_server',
    'local_asus_node',
    'edge_node',
    'authorized_cloud_accelerator',
  ]);
  assert.ok(COMPARISON_METRICS.includes('latency'));
  assert.ok(COMPARISON_METRICS.includes('privacy_locality'));
  assert.deepEqual([...XIV_ECONOMICS_BRAIN_PATH], [
    'workload_profile',
    'best_architecture',
    'best_runtime',
    'best_placement',
    'evidence_backed_route',
  ]);
  assert.ok(EQ8_MAY.includes('keep_cloud_registry_documented_until_actually_tested'));
  assert.ok(EQ8_MUST_NOT.includes('autonomously_provision_scale_or_purchase'));
});

test('cloud registry DOCUMENTED until fully tested; no auto provision', () => {
  const entry = registerCloudProvider({
    actor: agent,
    entryId: 'c1',
    providerLabel: 'arm-cloud-example',
  });
  assert.ok(!('denied' in entry));
  assert.equal(entry.evidenceState, 'DOCUMENTED');
  assert.equal(entry.verified, false);

  assert.equal(attemptEquateRegistryWithVerified().state, 'DENIED');
  assert.equal(attemptAutonomousProvisioning().state, 'DENIED');
  assert.equal(attemptAutonomousScaling().state, 'DENIED');
  assert.equal(attemptAutonomousPurchasing().state, 'DENIED');
  assert.equal(
    registerCloudProvider({
      actor: agent,
      entryId: 'bad',
      providerLabel: 'x',
      attemptEquateRegistryWithVerified: true,
    }).state,
    'DENIED',
  );

  assert.equal(
    canMarkCloudVerified({
      accountTested: true,
      regionTested: true,
      runtimeTested: true,
      quotasTested: false,
      workloadTested: true,
    }),
    false,
  );
  assert.equal(
    advanceCloudRegistryEvidence({
      entry,
      accountTested: true,
      regionTested: true,
      runtimeTested: true,
      quotasTested: false,
      workloadTested: true,
    }).state,
    'DENIED',
  );

  const verified = advanceCloudRegistryEvidence({
    entry,
    accountTested: true,
    regionTested: true,
    runtimeTested: true,
    quotasTested: true,
    workloadTested: true,
  });
  assert.ok(!('denied' in verified));
  assert.equal(verified.entry.evidenceState, 'VERIFIED');
  assert.equal(verified.entry.verified, true);
});

test('comparison matrix + recommendation ≠ authorized execution', () => {
  const matrix = exampleWorkloadComparisonMatrix();
  assert.equal(matrix.rows.length, COMPARISON_CANDIDATE_CLASSES.length);
  assert.equal(matrix.xivOwnedIntelligence, true);
  assert.ok(
    matrix.rows.some(
      (r) =>
        r.candidateClass === 'local_asus_node' && r.evidenceState === 'VERIFIED',
    ),
  );

  const rec = emitSchedulerRecommendation({
    recommendationId: 'r1',
    workloadId: matrix.workloadId,
    preferredCandidate: 'local_asus_node',
  });
  assert.ok(!('denied' in rec));
  assert.equal(rec.authorizedExecution, false);
  assert.equal(rec.evidenceState, 'RECOMMENDATION_ONLY');
  assert.equal(
    emitSchedulerRecommendation({
      recommendationId: 'bad',
      workloadId: 'w',
      preferredCandidate: 'gpu_server',
      attemptTreatAsAuthorizedExecution: true,
    }).state,
    'DENIED',
  );

  assert.equal(
    authorizeExecution({
      approvalId: 'a1',
      recommendationId: 'r1',
      actor: agent,
    }).state,
    'DENIED',
  );
  const auth = authorizeExecution({
    approvalId: 'a1',
    recommendationId: 'r1',
    actor: human,
  });
  assert.ok(!('denied' in auth));
  assert.equal(auth.humanGate, true);

  assert.equal(
    buildComparisonMatrix({
      matrixId: 'm',
      workloadId: 'w',
      rows: [],
      attemptCrossTenantPool: true,
    }).state,
    'DENIED',
  );
});

test('security denies pooling / credentials / hidden resources / prod', () => {
  assert.equal(attemptCrossTenantDataPooling().state, 'DENIED');
  assert.equal(attemptUnrestrictedCloudMovement().state, 'DENIED');
  assert.equal(attemptCredentialHarvesting().state, 'DENIED');
  assert.equal(attemptHiddenResourceCreation().state, 'DENIED');
  assert.equal(attemptProductionWithoutHumanAuth().state, 'DENIED');
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapArmServerCloudRuntime(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(
    boot.dimensions.length,
    ARM_SERVER_CLOUD_RESEARCH_DIMENSIONS.length,
  );
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq8SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq7ArmEdgeAmdAcceleration.present, true);
  assert.equal(soft.eq6ArchitectureCapabilityGraph.present, true);
  assert.equal(soft.eq5CompilerIrTranslationLayer.present, true);
  assert.equal(soft.eq2ArmArchitectureKnowledgePack.present, true);
  assert.equal(soft.eq1CrossArchitectureContract.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnEq8EvidenceToHomeBase({
    evidenceId: 'ev-eq8-1',
    actor: agent,
    summary: 'arm server cloud advisory',
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

  const cycle = runArmServerCloudRuntimeCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, ARM_SERVER_CLOUD_RUNTIME_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of ARM_SERVER_CLOUD_RUNTIME_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.cloudEntry.evidenceState, 'DOCUMENTED');
  assert.equal(cycle.recommendation.authorizedExecution, false);
  assert.equal(cycle.matrix.xivOwnedIntelligence, true);
});
