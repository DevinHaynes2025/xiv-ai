/**
 * 62L-ER30 — Android / ARM Runtime Package Candidate denial + honesty tests.
 *
 * Script: npm run test:62ler30
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ANDROID_ARM_CAPABILITY_STATES,
  ANDROID_ARM_PACKAGE_CHAIN,
  ANDROID_ARM_PACKAGE_FIELDS,
  ANDROID_ARM_RUNTIME_PACKAGE_CYCLE,
  ANDROID_ARM_TRUTH_BOUNDARY,
  BATTERY_GOVERNOR_INPUTS,
  ER30_AGENT_BOUNDS,
  ER30_DB_CANDIDATES_STATUS,
  ER30_LOCKS,
  ER30_MAY,
  ER30_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MOBILE_FIRST_WORKLOADS_MAY,
  MOBILE_MUST_NOT_ON_DEVICE,
  NEXT_PHASE_TITLE,
  NPU_VERIFY_CHAIN,
  OFFLINE_BRAIN_PACK_KINDS,
  assertEr30LocksIntact,
  basicAccessCannotRequirePersonalTelemetry,
  batteryLowPausesResearchAgents,
  er30SoftWireSnapshot,
  socSightingIsNotAcceleratorSupport,
  type Er30Actor,
} from './android-arm-runtime-package-types.ts';

import {
  assertBasicAccessWithoutTelemetry,
  attemptAutoVerifyFromSocSighting,
  attemptCovertBackgroundRecording,
  attemptCrossTenantDataPooling,
  attemptHiddenAccessibilityAbuse,
  attemptHiddenChainOfThought,
  attemptLargeTrainingOnDevice,
  attemptPrivateFileScrape,
  attemptRecommendAsAct,
  attemptRequireRoot,
  bootstrapAndroidArmRuntimePackage,
  createAndroidArmPackageCandidate,
  evaluateBatteryGovernor,
  exampleAndroidPackage,
  installOfflineMobilePack,
  probeDeviceCapability,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnEvidenceToHomeBase,
  revokeOfflineMobilePack,
  runAndroidArmRuntimePackageCycle,
  verifyNpuAccelerator,
} from './android-arm-runtime-package-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er30Actor = {
  kind: 'android_arm_runtime_packager',
  id: 'aarp-1',
  orgId: 'org-er30',
  tenantId: 'ten-er30',
  universeId: 'uni-er30',
  permissions: ['draft'],
};

const human: Er30Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er30',
  tenantId: 'ten-er30',
  universeId: 'uni-er30',
  permissions: ['approve_consequential'],
};

test('SoT label ER30 / #162; Android ARM package; next ER31 iOS candidate', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER30');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Android \/ ARM Runtime Package/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER31/);
  assert.match(NEXT_PHASE_TITLE, /iOS \/ Apple Runtime/);
  assert.match(ER_LAYER_TITLE, /Universal Device Distribution/);
});

test('honesty locks: L4 false; SoC≠VERIFY; BATTERY_LOW pauses; no telemetry-as-access; DB NOT_APPLIED', () => {
  assert.equal(assertEr30LocksIntact(), true);
  assert.equal(ER30_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER30_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER30_LOCKS.SOC_SIGHTING_AUTO_VERIFIES_ACCELERATOR, false);
  assert.equal(ER30_LOCKS.TELEMETRY_REQUIRED_FOR_BASIC_ACCESS, false);
  assert.equal(ER30_LOCKS.ROOT_REQUIRED, false);
  assert.equal(ER30_LOCKS.BATTERY_LOW_PAUSES_RESEARCH, true);
  assert.equal(ER30_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(socSightingIsNotAcceleratorSupport(), true);
  assert.equal(batteryLowPausesResearchAgents(), true);
  assert.equal(basicAccessCannotRequirePersonalTelemetry(), true);
  assert.equal(ER30_AGENT_BOUNDS.mayAutoVerifyAcceleratorFromSocSighting, false);
  assert.equal(ANDROID_ARM_TRUTH_BOUNDARY.uninstallRevokePathExplicit, true);
  assert.ok(ER30_MAY.length >= 5);
  assert.ok(ER30_MUST_NOT.includes('treat_soc_sighting_as_accelerator_verified'));
});

test('package fields + capability states + chain + workloads + packs + NPU chain encoded', () => {
  assert.equal(ANDROID_ARM_PACKAGE_FIELDS.length, 16);
  assert.ok(ANDROID_ARM_PACKAGE_FIELDS.includes('packageId'));
  assert.ok(ANDROID_ARM_PACKAGE_FIELDS.includes('socVendor'));
  assert.ok(ANDROID_ARM_PACKAGE_FIELDS.includes('batteryThermalState'));
  assert.ok(ANDROID_ARM_PACKAGE_FIELDS.includes('benchmarkEvidence'));
  assert.deepEqual([...ANDROID_ARM_CAPABILITY_STATES], [
    'DOCUMENTED',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
    'NOT_TESTED',
    'DEGRADED',
    'UNAVAILABLE',
  ]);
  assert.equal(ANDROID_ARM_PACKAGE_CHAIN.length, 11);
  assert.equal(ANDROID_ARM_PACKAGE_CHAIN[0], 'android_app');
  assert.equal(ANDROID_ARM_PACKAGE_CHAIN.at(-1), 'xiv_home_base');
  assert.equal(MOBILE_FIRST_WORKLOADS_MAY.length, 9);
  assert.deepEqual([...MOBILE_MUST_NOT_ON_DEVICE], [
    'large_training',
    'massive_simulation',
    'heavy_research',
  ]);
  assert.deepEqual([...OFFLINE_BRAIN_PACK_KINDS], [
    'CORE',
    'BUSINESS',
    'SUPPLY_CHAIN',
    'GOVERNMENT',
    'HISTORICAL',
    'CHIP_RESEARCH',
  ]);
  assert.equal(BATTERY_GOVERNOR_INPUTS.length, 8);
  assert.deepEqual([...NPU_VERIFY_CHAIN], [
    'detect',
    'runtime_compatibility',
    'model_load',
    'bounded_inference',
    'receipt',
    'verified',
  ]);
});

test('create candidate; probe SoC without auto-VERIFY; NPU needs detect→load→inference→receipt', () => {
  assert.equal(
    createAndroidArmPackageCandidate({
      actor: agent,
      packageId: 'bad',
      androidVersion: '14',
      deviceModel: 'X',
      armArchitecture: 'arm64-v8a',
      socVendor: 'QUALCOMM',
      availableRamMb: 4096,
      availableStorageMb: 8192,
      batteryLevelPercent: 50,
      charging: true,
      autoVerifyFromSoc: true,
    }).state,
    'DENIED',
  );

  const pkg = exampleAndroidPackage(agent);
  assert.equal(pkg.capabilityState, 'DOCUMENTED');
  assert.equal(pkg.socSeenIsNotAcceleratorVerified, true);
  assert.equal(pkg.rootRequired, false);
  assert.equal(pkg.l4AutonomyEnabled, false);

  const probed = probeDeviceCapability({
    pkg,
    detectGpu: true,
    detectNpu: true,
  });
  assert.ok(!('denied' in probed));
  assert.equal(probed.cpuGpuNpuState.npu.capabilityState, 'DETECTED');
  assert.equal(probed.capabilityState, 'DETECTED');

  assert.equal(
    probeDeviceCapability({
      pkg,
      detectNpu: true,
      claimVerifiedFromSoc: true,
    }).state,
    'DENIED',
  );

  const partial = verifyNpuAccelerator({
    pkg: probed,
    detect: true,
    runtimeCompatible: true,
    modelLoad: false,
    boundedInference: false,
  });
  assert.ok(!('denied' in partial));
  assert.notEqual(partial.capabilityState, 'VERIFIED');
  assert.equal(partial.receiptId, null);

  const full = verifyNpuAccelerator({
    pkg: probed,
    detect: true,
    runtimeCompatible: true,
    modelLoad: true,
    boundedInference: true,
  });
  assert.ok(!('denied' in full));
  assert.equal(full.capabilityState, 'VERIFIED');
  assert.ok(full.receiptId);
  assert.equal(full.autoVerifiedFromSocSighting, false);

  assert.equal(
    verifyNpuAccelerator({
      pkg: probed,
      detect: true,
      runtimeCompatible: true,
      modelLoad: true,
      boundedInference: true,
      skipToVerifiedFromSoc: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptAutoVerifyFromSocSighting().state, 'DENIED');
});

test('BATTERY_LOW pauses research; telemetry-as-access denied; packs encrypted/revocable', () => {
  const low = evaluateBatteryGovernor({
    batteryLevelPercent: 15,
    charging: false,
  });
  assert.ok(!('denied' in low));
  assert.equal(low.action, 'PAUSE_RESEARCH_AGENTS');
  assert.equal(low.researchAgentsPaused, true);

  const ok = evaluateBatteryGovernor({
    batteryLevelPercent: 80,
    charging: false,
  });
  assert.ok(!('denied' in ok));
  assert.equal(ok.action, 'ALLOW_BOUNDED');
  assert.equal(ok.researchAgentsPaused, false);

  assert.equal(
    evaluateBatteryGovernor({
      batteryLevelPercent: 10,
      charging: false,
      consumeAggressivelyDespiteLowBattery: true,
    }).state,
    'DENIED',
  );

  const access = assertBasicAccessWithoutTelemetry({});
  assert.ok(!('denied' in access));
  assert.equal(access.telemetryRequired, false);
  assert.equal(
    assertBasicAccessWithoutTelemetry({
      requiredTelemetry: ['GPS', 'CONTACTS', 'DRIVING_HISTORY'],
    }).state,
    'DENIED',
  );

  const pack = installOfflineMobilePack({
    actor: agent,
    packId: 'core-1',
    kind: 'CORE',
    version: '1.0.0',
  });
  assert.ok(!('denied' in pack));
  assert.equal(pack.encrypted, true);
  assert.equal(pack.rightsAware, true);
  assert.equal(pack.revocable, true);
  assert.equal(pack.revocationState, 'ACTIVE');
  assert.equal(
    installOfflineMobilePack({
      actor: agent,
      packId: 'bad',
      kind: 'BUSINESS',
      version: '1.0.0',
      plaintext: true,
    }).state,
    'DENIED',
  );
  const revoked = revokeOfflineMobilePack(pack);
  assert.equal(revoked.revocationState, 'REVOKED');
});

test('security denies: root, covert recording, file scrape, accessibility, cross-tenant, CoT', () => {
  assert.equal(attemptRequireRoot().state, 'DENIED');
  assert.equal(attemptCovertBackgroundRecording().state, 'DENIED');
  assert.equal(attemptPrivateFileScrape().state, 'DENIED');
  assert.equal(attemptHiddenAccessibilityAbuse().state, 'DENIED');
  assert.equal(attemptCrossTenantDataPooling().state, 'DENIED');
  assert.equal(attemptLargeTrainingOnDevice().state, 'DENIED');
  assert.equal(attemptHiddenChainOfThought().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  const pkg = exampleAndroidPackage(agent);
  const home = returnEvidenceToHomeBase({ actor: agent, pkg });
  assert.ok(!('denied' in home));
  assert.equal(home.productionAuthorized, false);
  assert.equal(home.uninstallRevokePathExplicit, true);
});

test('bootstrap + soft-wire + cycle; ER29/ER28 WAITING_DATA; EQ7/ER14 PRESENT', () => {
  const boot = bootstrapAndroidArmRuntimePackage(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.packageFields.length, 16);
  assert.equal(boot.capabilityStates.length, 7);
  assert.equal(boot.offlinePackKinds.length, 6);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER31/);

  const soft = er30SoftWireSnapshot(repoRoot);
  assert.equal(soft.er29IosPrepStub.present, false);
  assert.match(soft.er29IosPrepStub.note, /WAITING_DATA/);
  assert.equal(soft.er28PriorMobileStub.present, false);
  assert.match(soft.er28PriorMobileStub.note, /WAITING_DATA/);
  assert.equal(soft.er14OfflineBrainPackager.present, true);
  assert.equal(soft.eq7ArmEdgeAmdAcceleration.present, true);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runAndroidArmRuntimePackageCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, ANDROID_ARM_RUNTIME_PACKAGE_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of ANDROID_ARM_RUNTIME_PACKAGE_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er29Hop = cycle.hops.find((h) => h.hop === 'er29_soft_wire');
  assert.ok(er29Hop);
  assert.equal(er29Hop.state, 'WAITING_DATA');

  const er28Hop = cycle.hops.find((h) => h.hop === 'er28_soft_wire');
  assert.ok(er28Hop);
  assert.equal(er28Hop.state, 'WAITING_DATA');

  const eq7Hop = cycle.hops.find((h) => h.hop === 'eq7_soft_wire');
  assert.ok(eq7Hop);
  assert.equal(eq7Hop.state, 'PASS');

  const er14Hop = cycle.hops.find((h) => h.hop === 'er14_soft_wire');
  assert.ok(er14Hop);
  assert.equal(er14Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.receipt.productionAuthorized, false);
  assert.equal(cycle.receipt.researchAgentsPausedOnLowBattery, true);
  assert.equal(cycle.receipt.npuVerifiedOnlyWithReceipt, true);
});
