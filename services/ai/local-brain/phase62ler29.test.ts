/**
 * 62L-ER29 — Windows Runtime Package Candidate denial + honesty tests.
 *
 * Script: npm run test:62ler29
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ASUS_MACHINE_TRUTH_RULE,
  ER29_AGENT_BOUNDS,
  ER29_DB_CANDIDATES_STATUS,
  ER29_LOCKS,
  ER29_MAY,
  ER29_MUST_NOT,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  WINDOWS_RUNTIME_BUILD_RECORD_FIELDS,
  WINDOWS_RUNTIME_INSTALL_SAFEGUARDS,
  WINDOWS_RUNTIME_PACKAGE_CANDIDATE_CYCLE,
  WINDOWS_RUNTIME_PACKAGE_CHAIN,
  WINDOWS_RUNTIME_PACKAGE_STATES,
  WINDOWS_RUNTIME_SUCCESS_DEFINITION,
  WINDOWS_RUNTIME_VERIFICATION_SEQUENCE,
  assertEr29LocksIntact,
  er29SoftWireSnapshot,
  type Er29Actor,
} from './windows-runtime-package-candidate-types.ts';

import {
  applyCpuSafeFallback,
  attemptAssumeAsusAmdWithoutProbe,
  attemptAutoVerifyGpu,
  attemptAutoVerifyNpu,
  attemptBiosFirmwareChanges,
  attemptClaimWorkAfterShutdown,
  attemptCredentialCollection,
  attemptMarkAcceleratorVerified,
  attemptOverclocking,
  attemptSilentStartupPersistence,
  bootstrapWindowsRuntimePackageCandidate,
  createBuildCandidate,
  installOnAuthorizedTestDevice,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  runCpuBaselineInference,
  runPrivacyMinimalHardwareProbe,
  runVerificationSequence,
  runWindowsRuntimePackageCandidateCycle,
  verifyRuntimeHeartbeat,
} from './windows-runtime-package-candidate-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er29Actor = {
  kind: 'windows_runtime_packager',
  id: 'win-rt-1',
  orgId: 'org-er29',
  tenantId: 'ten-er29',
  universeId: 'uni-er29',
  permissions: ['draft'],
};

const human: Er29Actor = {
  kind: 'test_device_owner',
  id: 'human-1',
  orgId: 'org-er29',
  tenantId: 'ten-er29',
  universeId: 'uni-er29',
  permissions: ['approve_consequential'],
};

test('SoT label ER29 / #162; GitLab mirror not invented; next ER30', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER29');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Windows Runtime Package Candidate/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER30/);
  assert.match(NEXT_PHASE_TITLE, /Android \/ ARM Runtime Package Candidate/);
});

test('honesty locks: L4 false; no auto GPU/NPU; ASUS assumptions false; DB NOT_APPLIED', () => {
  assert.equal(assertEr29LocksIntact(), true);
  assert.equal(ER29_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER29_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER29_LOCKS.AUTO_VERIFY_GPU, false);
  assert.equal(ER29_LOCKS.AUTO_VERIFY_NPU, false);
  assert.equal(ER29_LOCKS.ASSUME_ASUS_AMD_CPU_WITHOUT_PROBE, false);
  assert.equal(ER29_LOCKS.SILENT_STARTUP_PERSISTENCE, false);
  assert.equal(ER29_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(ASUS_MACHINE_TRUTH_RULE.assumeAmdCpu, false);
  assert.equal(ASUS_MACHINE_TRUTH_RULE.autoVerifyGpu, false);
  assert.equal(ER29_AGENT_BOUNDS.mayAutoVerifyGpu, false);
  assert.equal(WINDOWS_RUNTIME_INSTALL_SAFEGUARDS.noCredentialCollection, true);
  assert.equal(WINDOWS_RUNTIME_SUCCESS_DEFINITION.gpuNpuOnlyWhenMeasured, true);
});

test('build fields + states + chain + verification sequence encoded', () => {
  assert.equal(WINDOWS_RUNTIME_BUILD_RECORD_FIELDS.length, 17);
  assert.ok(WINDOWS_RUNTIME_BUILD_RECORD_FIELDS.includes('packageId'));
  assert.ok(WINDOWS_RUNTIME_BUILD_RECORD_FIELDS.includes('npuState'));
  assert.ok(WINDOWS_RUNTIME_BUILD_RECORD_FIELDS.includes('testEvidence'));
  assert.deepEqual([...WINDOWS_RUNTIME_PACKAGE_STATES], [
    'BUILD_CANDIDATE',
    'INSTALL_NOT_TESTED',
    'INSTALLED',
    'RUNTIME_STARTED',
    'CPU_VERIFIED',
    'GPU_VERIFIED',
    'NPU_VERIFIED',
    'OFFLINE_VERIFIED',
    'SYNC_VERIFIED',
    'DEGRADED',
    'FAILED',
  ]);
  assert.deepEqual([...WINDOWS_RUNTIME_PACKAGE_CHAIN], [
    'windows_runtime',
    'hardware_truth_probe',
    'amd_aware_virtual_chip_adapter',
    'cpu_safe_fallback',
    'local_model_runtime',
    'offline_brain_packs',
    'agent_scheduler',
    'resource_governor',
    'audit_receipts',
    'home_base_sync',
  ]);
  assert.equal(WINDOWS_RUNTIME_VERIFICATION_SEQUENCE.length, 10);
  assert.equal(
    WINDOWS_RUNTIME_VERIFICATION_SEQUENCE[0],
    'install_only_on_explicitly_authorized_test_device',
  );
  assert.equal(
    WINDOWS_RUNTIME_VERIFICATION_SEQUENCE[9],
    'record_all_evidence_and_failures',
  );
  assert.ok(ER29_MAY.includes('run_cpu_baseline_inference_and_cpu_safe_fallback'));
  assert.ok(
    ER29_MUST_NOT.includes('auto_mark_gpu_or_npu_verified_without_measurement'),
  );
});

test('BUILD_CANDIDATE → authorized install → probe; deny ASUS AMD/NPU assume; deny auto GPU/NPU', () => {
  const cand = createBuildCandidate({
    actor: agent,
    packageId: 'win-pkg-1',
    windowsBuildVersion: '10.0.22631',
    architecture: 'x86_64',
    installerVersion: '0.1.0',
  });
  assert.ok(!('denied' in cand));
  assert.equal(cand.packageState, 'BUILD_CANDIDATE');
  assert.equal(cand.gpuState, 'NOT_TESTED');
  assert.equal(cand.npuState, 'NOT_TESTED');

  assert.equal(
    installOnAuthorizedTestDevice({
      actor: agent,
      record: cand,
      authorizedTestDeviceId: 'dev-1',
      explicitAuthorization: false,
    }).state,
    'DENIED',
  );

  const installed = installOnAuthorizedTestDevice({
    actor: agent,
    record: cand,
    authorizedTestDeviceId: 'asus-auth-1',
    explicitAuthorization: true,
    authorizerId: human.id,
  });
  assert.ok(!('denied' in installed));
  assert.equal(installed.packageState, 'INSTALLED');

  assert.equal(
    runPrivacyMinimalHardwareProbe({
      actor: agent,
      record: installed,
      assumeAmdCpu: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptAssumeAsusAmdWithoutProbe().state, 'DENIED');

  const probed = runPrivacyMinimalHardwareProbe({
    actor: agent,
    record: installed,
    observed: { cpuVendor: null, gpuVendor: null, npuPresent: null },
  });
  assert.ok(!('denied' in probed));
  assert.equal(probed.probe.assumedAmdWithoutProbe, false);
  assert.equal(probed.record.packageState, 'RUNTIME_STARTED');

  assert.equal(attemptAutoVerifyGpu().state, 'DENIED');
  assert.equal(attemptAutoVerifyNpu().state, 'DENIED');
  assert.equal(
    attemptMarkAcceleratorVerified({
      kind: 'GPU',
      record: probed.record,
      auto: true,
    }).state,
    'DENIED',
  );
  assert.equal(
    attemptMarkAcceleratorVerified({
      kind: 'NPU',
      record: probed.record,
      compatibleRuntimeModelPathExists: false,
    }).state,
    'WAITING_DATA',
  );
});

test('heartbeat RUNNING_VERIFIED vs OFFLINE_STOPPED; CPU fallback; no post-shutdown claim', () => {
  const cand = createBuildCandidate({
    actor: agent,
    packageId: 'win-pkg-hb',
    windowsBuildVersion: '10.0.22631',
    architecture: 'x86_64',
    installerVersion: '0.1.0',
  });
  assert.ok(!('denied' in cand));
  const installed = installOnAuthorizedTestDevice({
    actor: agent,
    record: cand,
    authorizedTestDeviceId: 'asus-auth-2',
    explicitAuthorization: true,
  });
  assert.ok(!('denied' in installed));
  const probed = runPrivacyMinimalHardwareProbe({
    actor: agent,
    record: installed,
  });
  assert.ok(!('denied' in probed));

  const running = verifyRuntimeHeartbeat({
    record: probed.record,
    freshHeartbeat: true,
    devicePowerState: 'ON',
  });
  assert.ok(!('denied' in running));
  assert.equal(running.status, 'RUNNING_VERIFIED');

  const off = verifyRuntimeHeartbeat({
    record: probed.record,
    freshHeartbeat: false,
    devicePowerState: 'OFF',
  });
  assert.ok(!('denied' in off));
  assert.equal(off.status, 'OFFLINE_STOPPED');

  const asleep = verifyRuntimeHeartbeat({
    record: probed.record,
    freshHeartbeat: true,
    devicePowerState: 'ASLEEP',
  });
  assert.ok(!('denied' in asleep));
  assert.equal(asleep.status, 'WAITING_NODE');

  assert.equal(
    verifyRuntimeHeartbeat({
      record: probed.record,
      freshHeartbeat: true,
      devicePowerState: 'OFF',
      claimContinuedWorkAfterShutdown: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptClaimWorkAfterShutdown().state, 'DENIED');

  const cpu = runCpuBaselineInference({
    record: probed.record,
    measuredSuccess: true,
  });
  assert.ok(!('denied' in cpu));
  assert.equal(cpu.packageState, 'CPU_VERIFIED');
  assert.equal(
    applyCpuSafeFallback({
      record: cpu,
      preferAcceleratorWithoutEvidence: true,
    }).state,
    'DENIED',
  );
  const fallback = applyCpuSafeFallback({ record: cpu });
  assert.ok(!('denied' in fallback));
});

test('install/safety denies + guardian isolation hold', () => {
  assert.equal(attemptSilentStartupPersistence().state, 'DENIED');
  assert.equal(attemptBiosFirmwareChanges().state, 'DENIED');
  assert.equal(attemptOverclocking().state, 'DENIED');
  assert.equal(attemptCredentialCollection().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));
});

test('bootstrap + soft-wire + cycle; ER28/EQ7/EL7/ER14 PRESENT; ASUS WAITING_DATA', () => {
  const boot = bootstrapWindowsRuntimePackageCandidate(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.buildRecordFields.length, 17);
  assert.equal(boot.packageStates.length, 11);
  assert.equal(boot.verificationSequence.length, 10);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER30/);

  const soft = er29SoftWireSnapshot(repoRoot);
  assert.equal(soft.er28UniversalRuntimePackageContract.present, true);
  assert.match(soft.er28UniversalRuntimePackageContract.note, /PRESENT/);
  assert.equal(soft.asusSpecificLocalRuntime.present, false);
  assert.match(soft.asusSpecificLocalRuntime.note, /WAITING_DATA/);
  assert.equal(soft.eq7ArmEdgeAmdAcceleration.present, true);
  assert.equal(soft.el7WindowsLocalRuntime.present, true);
  assert.equal(soft.er14OfflineBrainPackager.present, true);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.ep6LocalHardwareTruthProbe.present, true);

  const seq = runVerificationSequence({
    actor: agent,
    human,
    authorizedTestDeviceId: 'asus-test-1',
    compatibleGpuNpuPath: false,
  });
  assert.ok(!('denied' in seq));
  assert.equal(seq.record.packageState, 'SYNC_VERIFIED');
  assert.equal(seq.record.gpuState, 'NOT_TESTED');
  assert.equal(seq.agentStatus, 'RUNNING_VERIFIED');
  assert.equal(seq.evidence.length, 10);

  const cycle = runWindowsRuntimePackageCandidateCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, WINDOWS_RUNTIME_PACKAGE_CANDIDATE_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of WINDOWS_RUNTIME_PACKAGE_CANDIDATE_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er28Hop = cycle.hops.find((h) => h.hop === 'er28_soft_wire');
  assert.ok(er28Hop);
  assert.equal(er28Hop.state, 'PASS');

  const asusHop = cycle.hops.find(
    (h) => h.hop === 'asus_specific_local_runtime_soft_wire',
  );
  assert.ok(asusHop);
  assert.equal(asusHop.state, 'WAITING_DATA');

  const eq7Hop = cycle.hops.find((h) => h.hop === 'eq7_soft_wire');
  assert.ok(eq7Hop);
  assert.equal(eq7Hop.state, 'PASS');

  const er14Hop = cycle.hops.find((h) => h.hop === 'er14_soft_wire');
  assert.ok(er14Hop);
  assert.equal(er14Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.receipt.gpuAutoVerified, false);
  assert.equal(cycle.receipt.asusAssumptions, false);
  assert.equal(cycle.receipt.packageState, 'SYNC_VERIFIED');
});
