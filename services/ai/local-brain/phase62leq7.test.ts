/**
 * 62L-EQ7 — ARM Edge/Phone + AMD XIV Acceleration denial + honesty tests.
 *
 * Script: npm run test:62leq7
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  AMD_XIV_ACCELERATION_PIPELINE,
  ARM_EDGE_AMD_ACCELERATION_CYCLE,
  ARM_EDGE_PHONE_RESEARCH_DIMENSIONS,
  EQ7_AGENT_BOUNDS,
  EQ7_DB_CANDIDATES_STATUS,
  EQ7_LOCKS,
  EQ7_MAY,
  EQ7_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  IMPROVEMENT_EVIDENCE_FIELDS,
  MOBILE_EDGE_ENROLLMENT_RULE,
  NEXT_PHASE_TITLE,
  XIV_PROPRIETARY_SOFTWARE_IMPROVEMENTS,
  assertEq7LocksIntact,
  canClaimVerifiedImprovement,
  eq7SoftWireSnapshot,
  softwareAccelImpliesSiliconMod,
  type Eq7Actor,
} from './arm-edge-amd-acceleration-types.ts';

import {
  attemptBatteryAbuse,
  attemptClaimPhysicalTransistorMod,
  attemptCovertPhoneEnrollment,
  attemptDriverReplacement,
  attemptFirmwareBiosMod,
  attemptHiddenTelemetry,
  attemptImprovementWithoutComparableBenchmark,
  attemptOverclocking,
  attemptPermissionExpansion,
  attemptProductionChanges,
  attemptProprietaryAmdIpCopy,
  attemptRecommendAsAct,
  attemptUnrestrictedUserData,
  bootstrapArmEdgeAmdAcceleration,
  emitArmEdgeResearchNode,
  enrollMobileEdgeDevice,
  exampleAmdLatencyImprovementEvidence,
  probeGuardianRlsTenantUniverseIsolation,
  proposeAmdAccelerationPolicy,
  recordImprovementEvidence,
  requireHumanApproval,
  returnEq7EvidenceToHomeBase,
  runArmEdgeAmdAccelerationCycle,
} from './arm-edge-amd-acceleration-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Eq7Actor = {
  kind: 'amd_accel_policy',
  id: 'amd-1',
  orgId: 'org-eq7',
  tenantId: 'ten-eq7',
  universeId: 'uni-eq7',
  permissions: ['draft'],
};

const human: Eq7Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-eq7',
  tenantId: 'ten-eq7',
  universeId: 'uni-eq7',
  permissions: ['approve_consequential'],
};

test('SoT label EQ7 / #161; GitLab mirror not invented; next EQ8', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EQ7');
  assert.equal(GITHUB_SOT_ISSUE, 161);
  assert.equal(GITHUB_SOT_FAMILY, '62L-EQ');
  assert.match(GITHUB_SOT_TITLE, /ARM Edge\/Phone/);
  assert.match(GITHUB_SOT_TITLE, /AMD XIV Acceleration/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EQ8/);
  assert.match(NEXT_PHASE_TITLE, /ARM Server \/ Cloud Runtime Research/);
});

test('honesty locks: L4 false; software≠silicon; DB NOT_APPLIED', () => {
  assert.equal(assertEq7LocksIntact(), true);
  assert.equal(EQ7_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EQ7_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EQ7_LOCKS.CLAIM_PHYSICAL_TRANSISTOR_MOD, false);
  assert.equal(EQ7_LOCKS.IMPROVEMENT_WITHOUT_COMPARABLE_BENCHMARK, false);
  assert.equal(EQ7_LOCKS.OVERCLOCKING, false);
  assert.equal(EQ7_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(EQ7_AGENT_BOUNDS.mayClaimPhysicalTransistorMod, false);
  assert.equal(softwareAccelImpliesSiliconMod(), false);
  assert.equal(MOBILE_EDGE_ENROLLMENT_RULE.covertBackgroundInstallation, false);
});

test('ARM dimensions + AMD pipeline + improvements + evidence fields encoded', () => {
  assert.ok(ARM_EDGE_PHONE_RESEARCH_DIMENSIONS.includes('android_arm_device_classes'));
  assert.ok(ARM_EDGE_PHONE_RESEARCH_DIMENSIONS.includes('battery_thermal_constraints'));
  assert.ok(ARM_EDGE_PHONE_RESEARCH_DIMENSIONS.includes('app_sandbox_boundaries'));
  assert.deepEqual([...AMD_XIV_ACCELERATION_PIPELINE], [
    'xiv_task',
    'workload_profile',
    'amd_runtime_selection',
    'model_precision_choice',
    'batching_cache_queue_strategy',
    'benchmark',
    'adaptive_policy',
  ]);
  assert.ok(
    XIV_PROPRIETARY_SOFTWARE_IMPROVEMENTS.includes(
      'amd_cpu_gpu_npu_workload_routing',
    ),
  );
  assert.ok(XIV_PROPRIETARY_SOFTWARE_IMPROVEMENTS.includes('cpu_gpu_npu_fallback'));
  assert.ok(IMPROVEMENT_EVIDENCE_FIELDS.includes('baseline'));
  assert.ok(IMPROVEMENT_EVIDENCE_FIELDS.includes('latency'));
  assert.ok(IMPROVEMENT_EVIDENCE_FIELDS.includes('energyProxy'));
  assert.ok(EQ7_MAY.includes('require_comparable_benchmarks_for_improvement_claims'));
  assert.ok(
    EQ7_MUST_NOT.includes('claim_physical_amd_transistor_architecture_modification'),
  );
});

test('120ms→91ms improvement only with comparable benchmark; no silicon claim', () => {
  assert.equal(attemptClaimPhysicalTransistorMod().state, 'DENIED');
  assert.equal(
    proposeAmdAccelerationPolicy({
      actor: agent,
      policyId: 'bad',
      xivPolicyVersion: 'v0',
      improvement: 'adaptive_batching',
      attemptClaimPhysicalTransistorMod: true,
    }).state,
    'DENIED',
  );

  const pol = proposeAmdAccelerationPolicy({
    actor: agent,
    policyId: 'p1',
    xivPolicyVersion: 'xiv-sched-cand-0.1',
    improvement: 'benchmark_driven_routing',
  });
  assert.ok(!('denied' in pol));
  assert.equal(pol.claimsPhysicalTransistorMod, false);
  assert.equal(pol.claimState, 'CANDIDATE');

  assert.equal(attemptImprovementWithoutComparableBenchmark().state, 'DENIED');
  assert.equal(
    recordImprovementEvidence({
      evidenceId: 'x',
      baseline: 120,
      xivPolicyVersion: 'v',
      deviceRuntime: 'd',
      modelWorkload: 'w',
      latency: 91,
      throughput: 1,
      memory: 1,
      energyProxy: 1,
      quality: 1,
      baselineRun: false,
      xivPolicyRun: true,
      comparableWorkload: true,
      comparableDeviceRuntime: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    canClaimVerifiedImprovement({
      baselineRun: true,
      xivPolicyRun: true,
      comparableWorkload: true,
      comparableDeviceRuntime: true,
      metricsRecorded: true,
    }),
    true,
  );

  const ev = exampleAmdLatencyImprovementEvidence();
  assert.equal(ev.baseline, 120);
  assert.equal(ev.latency, 91);
  assert.equal(ev.result, 'VERIFIED_IMPROVEMENT');
  assert.equal(ev.claimsPhysicalTransistorMod, false);
});

test('mobile/edge explicit enrollment; covert/abuse/telemetry denied', () => {
  const ok = enrollMobileEdgeDevice({
    actor: agent,
    enrollmentId: 'e1',
    deviceClass: 'android_arm_phone',
    explicitEnrollment: true,
    supportedPermissions: true,
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.claimState, 'ENROLLED');

  assert.equal(attemptCovertPhoneEnrollment().state, 'DENIED');
  assert.equal(attemptBatteryAbuse().state, 'DENIED');
  assert.equal(attemptHiddenTelemetry().state, 'DENIED');
  assert.equal(attemptUnrestrictedUserData().state, 'DENIED');
  assert.equal(
    enrollMobileEdgeDevice({
      actor: agent,
      enrollmentId: 'bad',
      deviceClass: 'phone',
      explicitEnrollment: false,
      supportedPermissions: true,
    }).state,
    'DENIED',
  );
});

test('governance denies firmware/overclock/driver/IP/permissions/prod', () => {
  assert.equal(attemptFirmwareBiosMod().state, 'DENIED');
  assert.equal(attemptOverclocking().state, 'DENIED');
  assert.equal(attemptDriverReplacement().state, 'DENIED');
  assert.equal(attemptProprietaryAmdIpCopy().state, 'DENIED');
  assert.equal(attemptPermissionExpansion().state, 'DENIED');
  assert.equal(attemptProductionChanges().state, 'DENIED');

  const arm = emitArmEdgeResearchNode({
    actor: agent,
    nodeId: 'n1',
    dimension: 'memory_constraints',
    notes: 'documented',
  });
  assert.ok(!('denied' in arm));
  assert.equal(arm.siliconModified, false);
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapArmEdgeAmdAcceleration(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(
    boot.armDimensions.length,
    ARM_EDGE_PHONE_RESEARCH_DIMENSIONS.length,
  );
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 161);

  const soft = eq7SoftWireSnapshot(repoRoot);
  assert.equal(soft.eq6ArchitectureCapabilityGraph.present, true);
  assert.equal(soft.eq5CompilerIrTranslationLayer.present, true);
  assert.equal(soft.eq2ArmArchitectureKnowledgePack.present, true);
  assert.equal(soft.ep16NoOverclockBiosRule.present, true);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnEq7EvidenceToHomeBase({
    evidenceId: 'ev-eq7-1',
    actor: agent,
    summary: 'amd accel advisory',
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

  const cycle = runArmEdgeAmdAccelerationCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, ARM_EDGE_AMD_ACCELERATION_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of ARM_EDGE_AMD_ACCELERATION_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.evidence.result, 'VERIFIED_IMPROVEMENT');
  assert.equal(cycle.enrollment.claimState, 'ENROLLED');
  assert.equal(cycle.policy.claimsPhysicalTransistorMod, false);
});
