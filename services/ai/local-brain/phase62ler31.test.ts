/**
 * 62L-ER31 — iOS / Apple Runtime Research Candidate denial + honesty tests.
 *
 * Script: npm run test:62ler31
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  APPLE_FIRST_CANDIDATE_WORKLOADS,
  APPLE_OFFLINE_FRESHNESS_RULE,
  APPLE_PRIVACY_MODEL,
  APPLE_RUNTIME_ARCHITECTURE,
  APPLE_RUNTIME_PROFILE_FIELDS,
  APPLE_RUNTIME_STATES,
  ER31_AGENT_BOUNDS,
  ER31_DB_CANDIDATES_STATUS,
  ER31_LOCKS,
  ER31_MAY,
  ER31_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  IOS_APPLE_RUNTIME_RESEARCH_CYCLE,
  NEURAL_ENGINE_VERIFICATION_CHAIN,
  NEXT_PHASE_TITLE,
  assertEr31LocksIntact,
  canClaimNeuralEngineVerified,
  er31SoftWireSnapshot,
  mayTreatStaleAsCurrent,
  neuralEngineDocsImplyVerified,
  type Er31Actor,
} from './ios-apple-runtime-research-candidate-types.ts';

import {
  admitAppleWorkload,
  attemptCovertCameraMicrophoneLocation,
  attemptCrossTenantPrivateDataPooling,
  attemptHiddenChainOfThought,
  attemptJailbreakRootAssumptions,
  attemptNeuralEngineVerifiedFromDocsOnly,
  attemptOsSecurityBypass,
  attemptPrivateApiExploitation,
  attemptRecommendAsAct,
  attemptStaleAsCurrent,
  attemptUnauthorizedPersistentBackground,
  attemptUnsignedUnversionedUpdates,
  bootstrapIosAppleRuntimeResearch,
  createAppleRuntimeProfile,
  exampleIphoneNeuralEngineVerified,
  exampleSilentCpuFallback,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  retainOfflinePackFreshness,
  returnEvidenceToHomeBase,
  runIosAppleRuntimeResearchCycle,
  verifyNeuralEngine,
} from './ios-apple-runtime-research-candidate-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er31Actor = {
  kind: 'apple_runtime_researcher',
  id: 'apple-1',
  orgId: 'org-er31',
  tenantId: 'ten-er31',
  universeId: 'uni-er31',
  permissions: ['draft'],
};

const human: Er31Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er31',
  tenantId: 'ten-er31',
  universeId: 'uni-er31',
  permissions: ['approve_consequential'],
};

test('SoT label ER31 / #162; GitLab mirror not invented; next ER32', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER31');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /iOS \/ Apple Runtime Research Candidate/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(ER_LAYER_TITLE, /Universal Device Distribution/);
  assert.match(NEXT_PHASE_TITLE, /ER32/);
  assert.match(NEXT_PHASE_TITLE, /Edge \/ Vehicle Runtime Candidate/);
});

test('honesty locks: L4 false; docs≠verified; DB NOT_APPLIED', () => {
  assert.equal(assertEr31LocksIntact(), true);
  assert.equal(ER31_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER31_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER31_LOCKS.NEURAL_ENGINE_DOCS_EQ_VERIFIED, false);
  assert.equal(ER31_LOCKS.JAILBREAK_ROOT_ASSUMPTIONS, false);
  assert.equal(ER31_LOCKS.PRIVATE_API_EXPLOITATION, false);
  assert.equal(ER31_LOCKS.TIP_LAND, false);
  assert.equal(ER31_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(ER31_AGENT_BOUNDS.mayClaimNeuralEngineVerifiedFromDocsOnly, false);
  assert.equal(neuralEngineDocsImplyVerified(), false);
  assert.equal(APPLE_PRIVACY_MODEL.honorAppSandboxing, true);
  assert.equal(APPLE_OFFLINE_FRESHNESS_RULE.denyStaleAsCurrent, true);
  assert.equal(mayTreatStaleAsCurrent(), false);
});

test('architecture + profile fields + states + workloads + ANE chain encoded', () => {
  assert.ok(APPLE_RUNTIME_ARCHITECTURE.includes('device_capability_profile'));
  assert.ok(APPLE_RUNTIME_ARCHITECTURE.includes('encrypted_storage'));
  assert.ok(APPLE_RUNTIME_ARCHITECTURE.includes('home_base_sync'));
  assert.ok(APPLE_RUNTIME_PROFILE_FIELDS.includes('packageId'));
  assert.ok(APPLE_RUNTIME_PROFILE_FIELDS.includes('neuralEngineCapabilityState'));
  assert.ok(APPLE_RUNTIME_PROFILE_FIELDS.includes('verificationState'));
  assert.deepEqual([...APPLE_RUNTIME_STATES], [
    'DOCUMENTED',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
    'NOT_TESTED',
    'DEGRADED',
    'UNAVAILABLE',
  ]);
  assert.ok(APPLE_FIRST_CANDIDATE_WORKLOADS.includes('embeddings'));
  assert.ok(APPLE_FIRST_CANDIDATE_WORKLOADS.includes('agent_checkpoints'));
  assert.deepEqual([...NEURAL_ENGINE_VERIFICATION_CHAIN], [
    'compatible_model',
    'actual_local_load',
    'actual_device_execution',
    'valid_output',
    'performance_receipt',
  ]);
  assert.ok(ER31_MAY.includes('verify_neural_engine_only_after_full_execution_chain'));
  assert.ok(ER31_MUST_NOT.includes('assume_jailbreak_or_root'));
});

test('Neural Engine VERIFY only after full chain; silent CPU fallback recorded', () => {
  assert.equal(attemptNeuralEngineVerifiedFromDocsOnly().state, 'DENIED');
  assert.equal(
    verifyNeuralEngine({
      actor: agent,
      verificationId: 'docs',
      packageId: 'p',
      compatibleModel: false,
      actualLocalLoad: false,
      actualDeviceExecution: false,
      validOutput: false,
      performanceReceipt: false,
      attemptVerifyFromDocsOnly: true,
    }).state,
    'DENIED',
  );

  assert.equal(
    canClaimNeuralEngineVerified({
      compatibleModel: true,
      actualLocalLoad: true,
      actualDeviceExecution: true,
      validOutput: true,
      performanceReceipt: true,
    }),
    true,
  );
  assert.equal(
    canClaimNeuralEngineVerified({
      compatibleModel: true,
      actualLocalLoad: true,
      actualDeviceExecution: false,
      validOutput: false,
      performanceReceipt: false,
    }),
    false,
  );

  const ok = verifyNeuralEngine({
    actor: agent,
    verificationId: 'ane-ok',
    packageId: 'com.xiv.apple.runtime.research',
    compatibleModel: true,
    actualLocalLoad: true,
    actualDeviceExecution: true,
    validOutput: true,
    performanceReceipt: true,
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.verificationState, 'VERIFIED');
  assert.equal(ok.acceleratorPath, 'neural_engine');

  assert.equal(
    verifyNeuralEngine({
      actor: agent,
      verificationId: 'bad-fb',
      packageId: 'p',
      compatibleModel: true,
      actualLocalLoad: true,
      actualDeviceExecution: true,
      validOutput: true,
      performanceReceipt: true,
      silentFallbackTo: 'cpu',
      attemptUnrecordedFallback: true,
    }).state,
    'DENIED',
  );

  const fb = verifyNeuralEngine({
    actor: agent,
    verificationId: 'fb',
    packageId: 'p',
    compatibleModel: true,
    actualLocalLoad: true,
    actualDeviceExecution: true,
    validOutput: true,
    performanceReceipt: true,
    silentFallbackTo: 'gpu',
    recordSilentFallback: true,
  });
  assert.ok(!('denied' in fb));
  assert.equal(fb.verificationState, 'DEGRADED');
  assert.equal(fb.silentFallbackRecorded, true);
  assert.equal(fb.acceleratorPath, 'gpu_fallback');

  const ex = exampleIphoneNeuralEngineVerified();
  assert.equal(ex.verificationState, 'VERIFIED');
  assert.equal(exampleSilentCpuFallback().acceleratorPath, 'cpu_fallback');
});

test('create profile; deny jailbreak/private-API/covert sensors/background/pooling', () => {
  const profile = createAppleRuntimeProfile({
    actor: agent,
    packageId: 'com.xiv.apple.runtime.research',
    osName: 'iOS',
    osVersion: '18.0',
    deviceFamily: 'iphone',
    appleChipGeneration: 'A17',
    memoryLimitMb: 6144,
    storageLimitMb: 128000,
    packageVersion: '0.1.0-research',
    signatureVersion: 'sig-v1',
  });
  assert.ok(!('denied' in profile));
  assert.equal(profile.jailbreakAssumed, false);
  assert.equal(profile.privateApiUsed, false);
  assert.equal(profile.verificationState, 'NOT_TESTED');

  assert.equal(
    createAppleRuntimeProfile({
      actor: agent,
      packageId: 'bad',
      osName: 'iOS',
      osVersion: '18.0',
      deviceFamily: 'iphone',
      appleChipGeneration: 'A17',
      memoryLimitMb: 1,
      storageLimitMb: 1,
      packageVersion: 'x',
      signatureVersion: 'sig',
      attemptJailbreakAssumption: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptJailbreakRootAssumptions().state, 'DENIED');
  assert.equal(attemptPrivateApiExploitation().state, 'DENIED');
  assert.equal(attemptOsSecurityBypass().state, 'DENIED');
  assert.equal(attemptCovertCameraMicrophoneLocation().state, 'DENIED');
  assert.equal(attemptUnauthorizedPersistentBackground().state, 'DENIED');
  assert.equal(attemptCrossTenantPrivateDataPooling().state, 'DENIED');
  assert.equal(attemptUnsignedUnversionedUpdates().state, 'DENIED');
  assert.equal(attemptHiddenChainOfThought().state, 'DENIED');
});

test('offline freshness retention; heavy workloads route elsewhere', () => {
  assert.equal(attemptStaleAsCurrent().state, 'DENIED');
  assert.equal(
    retainOfflinePackFreshness({
      packId: 'p1',
      freshnessLabel: 'as_of_x',
      isStale: true,
      attemptTreatStaleAsCurrent: true,
    }).state,
    'DENIED',
  );
  const fresh = retainOfflinePackFreshness({
    packId: 'p1',
    freshnessLabel: 'as_of_2026-09-01',
    isStale: true,
  });
  assert.ok(!('denied' in fresh));
  assert.equal(fresh.treatedAsCurrent, false);
  assert.equal(fresh.encrypted, true);

  const light = admitAppleWorkload({
    actor: agent,
    workloadId: 'w1',
    workload: 'local_semantic_search',
  });
  assert.ok(!('denied' in light));
  assert.equal(light.admitted, true);

  const heavy = admitAppleWorkload({
    actor: agent,
    workloadId: 'w2',
    workload: 'heavy_training',
    deviceProvenSuitable: false,
  });
  assert.ok(!('denied' in heavy));
  assert.equal(heavy.admitted, false);

  assert.equal(
    admitAppleWorkload({
      actor: agent,
      workloadId: 'w3',
      workload: 'heavy_training',
      attemptHeavyTrainingOnUnproven: true,
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; home base; guardian unchanged', () => {
  const boot = bootstrapIosAppleRuntimeResearch(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.architecture.length, APPLE_RUNTIME_ARCHITECTURE.length);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);

  const soft = er31SoftWireSnapshot(repoRoot);
  // ER28–ER30 expected WAITING_DATA on ER14 base; EQ7 PRESENT when in tree
  assert.equal(typeof soft.er30AndroidArmRuntimePackage.present, 'boolean');
  assert.equal(typeof soft.er29WindowsRuntimePackageCandidate.present, 'boolean');
  assert.equal(typeof soft.er28UniversalRuntimePackageContract.present, 'boolean');
  assert.equal(soft.eq7ArmEdgeAmdAcceleration.present, true);
  assert.equal(soft.eq7Report.present, true);
  assert.equal(soft.er28UniversalRuntimePackageContract.present, false);
  assert.equal(soft.er29WindowsRuntimePackageCandidate.present, false);
  assert.equal(soft.er30AndroidArmRuntimePackage.present, false);

  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const ev = returnEvidenceToHomeBase({
    evidenceId: 'ev-er31-1',
    actor: agent,
    summary: 'apple runtime advisory',
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

  const cycle = runIosAppleRuntimeResearchCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, IOS_APPLE_RUNTIME_RESEARCH_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of IOS_APPLE_RUNTIME_RESEARCH_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  const waiting = cycle.hops.filter((h) => h.state === 'WAITING_DATA');
  assert.ok(waiting.length >= 3, 'ER28–ER30 should be WAITING_DATA');
  assert.equal(cycle.neuralEngine.verificationState, 'VERIFIED');
  assert.equal(cycle.fallback.silentFallbackRecorded, true);
  assert.equal(cycle.evidence.neuralEngineDocsImplyVerified, false);
  assert.equal(cycle.profile.deviceFamily, 'iphone');
});
