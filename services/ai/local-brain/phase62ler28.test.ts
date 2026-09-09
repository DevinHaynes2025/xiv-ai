/**
 * 62L-ER28 — Universal Runtime Package Contract denial + honesty tests.
 *
 * Script: npm run test:62ler28
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ER28_AGENT_BOUNDS,
  ER28_DB_CANDIDATES_STATUS,
  ER28_LOCKS,
  ER28_MAY,
  ER28_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  OFFLINE_TRUTH_STATES,
  PLATFORM_BUILD_TARGETS,
  RUNTIME_PACKAGE_CONTENTS_MAY,
  RUNTIME_PACKAGE_CORE_FLOW,
  RUNTIME_PACKAGE_FIELDS,
  RUNTIME_PACKAGE_STATES,
  UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_CYCLE,
  UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY,
  assertEr28LocksIntact,
  er28SoftWireSnapshot,
  firmwareBiosModificationAllowed,
  mayClaimUniversalCompatWithoutTest,
  oneSpecEqualsOneBinaryEverywhere,
  stealthPersistenceAllowed,
  type Er28Actor,
} from './universal-runtime-package-contract-types.ts';

import {
  advancePackageState,
  attemptAdvanceVerifiedWithoutEvidence,
  attemptFirmwareBiosModification,
  attemptInstallWithoutAuthorization,
  attemptPrivilegeEscalation,
  attemptRecommendAsAct,
  attemptStealthPersistence,
  attemptUniversalCompatClaim,
  attemptUnsignedInstall,
  bootstrapUniversalRuntimePackageContract,
  defineUniversalRuntimePackage,
  emitPackageHeartbeat,
  enrollDevice,
  exampleLinuxX86Package,
  installUniversalRuntimePackage,
  previewPermissions,
  probeGuardianRlsTenantUniverseIsolation,
  recordPlatformTestEvidence,
  registerWithHomeBase,
  requireHumanApproval,
  resolveOfflineTruthState,
  runLocalHardwareProbe,
  runUniversalRuntimePackageContractCycle,
  uninstallAndRevokeEnrollment,
  verifyRuntimeModel,
} from './universal-runtime-package-contract-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er28Actor = {
  kind: 'runtime_package_contract',
  id: 'urpc-1',
  orgId: 'org-er28',
  tenantId: 'ten-er28',
  universeId: 'uni-er28',
  permissions: ['draft'],
};

const human: Er28Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er28',
  tenantId: 'ten-er28',
  universeId: 'uni-er28',
  permissions: ['approve_consequential'],
};

test('SoT label ER28 / #162; Universal Runtime Package Contract; next ER29 Windows candidate', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER28');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Universal Runtime Package Contract/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER29/);
  assert.match(NEXT_PHASE_TITLE, /Windows Runtime Package Candidate/);
  assert.match(ER_LAYER_TITLE, /Universal Device Distribution/);
});

test('honesty locks: L4 false; UNIVERSAL_COMPATIBILITY_CLAIMED_WITHOUT_TEST=false; DB NOT_APPLIED', () => {
  assert.equal(assertEr28LocksIntact(), true);
  assert.equal(ER28_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER28_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER28_LOCKS.UNIVERSAL_COMPATIBILITY_CLAIMED_WITHOUT_TEST, false);
  assert.equal(ER28_LOCKS.ONE_SPEC_EQUALS_ONE_BINARY_EVERYWHERE, false);
  assert.equal(ER28_LOCKS.STEALTH_PERSISTENCE, false);
  assert.equal(ER28_LOCKS.PRIVILEGE_ESCALATION, false);
  assert.equal(ER28_LOCKS.FIRMWARE_BIOS_MODIFICATION, false);
  assert.equal(ER28_LOCKS.INSTALL_WITHOUT_EXPLICIT_AUTHORIZATION, false);
  assert.equal(ER28_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(mayClaimUniversalCompatWithoutTest(), false);
  assert.equal(oneSpecEqualsOneBinaryEverywhere(), false);
  assert.equal(stealthPersistenceAllowed(), false);
  assert.equal(firmwareBiosModificationAllowed(), false);
  assert.equal(ER28_AGENT_BOUNDS.mayClaimUniversalCompatWithoutPerPlatformTests, false);
  assert.equal(
    UNIVERSAL_RUNTIME_PACKAGE_TRUTH_BOUNDARY.eachPlatformBuildIndependentlyTested,
    true,
  );
});

test('package fields + states + flow + platforms + contents + offline truth encoded', () => {
  assert.equal(RUNTIME_PACKAGE_FIELDS.length, 18);
  assert.ok(RUNTIME_PACKAGE_FIELDS.includes('packageId'));
  assert.ok(RUNTIME_PACKAGE_FIELDS.includes('heartbeatContract'));
  assert.ok(RUNTIME_PACKAGE_FIELDS.includes('evidenceState'));
  assert.deepEqual([...RUNTIME_PACKAGE_STATES], [
    'DOCUMENTED',
    'BUILDABLE',
    'INSTALLABLE',
    'SUPPORTED',
    'VERIFIED',
    'DEGRADED',
    'NOT_TESTED',
    'UNAVAILABLE',
  ]);
  assert.deepEqual([...RUNTIME_PACKAGE_CORE_FLOW], [
    'device_enrollment',
    'compatibility_check',
    'permission_preview',
    'user_admin_authorization',
    'signed_package_install',
    'local_hardware_probe',
    'runtime_model_verification',
    'heartbeat',
    'xiv_home_base_registration',
  ]);
  assert.equal(PLATFORM_BUILD_TARGETS.length, 7);
  assert.ok(PLATFORM_BUILD_TARGETS.includes('windows_x86_amd'));
  assert.ok(PLATFORM_BUILD_TARGETS.includes('android_arm'));
  assert.ok(PLATFORM_BUILD_TARGETS.includes('edge_embedded_candidate'));
  assert.equal(RUNTIME_PACKAGE_CONTENTS_MAY.length, 10);
  assert.ok(RUNTIME_PACKAGE_CONTENTS_MAY.includes('virtual_chip_adapter'));
  assert.deepEqual([...OFFLINE_TRUTH_STATES], [
    'OFFLINE_STOPPED',
    'LOCAL_ONLY',
    'RUNNING_VERIFIED',
  ]);
  assert.ok(ER28_MAY.includes('emit_heartbeat_mapping_to_OFFLINE_STOPPED_LOCAL_ONLY_RUNNING_VERIFIED'));
  assert.ok(ER28_MUST_NOT.includes('claim_universal_compatibility_without_per_platform_tests'));
});

test('define contract; deny universal claim; install requires auth+signed; evidence gates VERIFIED', () => {
  assert.equal(
    defineUniversalRuntimePackage({
      actor: agent,
      packageId: 'bad',
      platform: 'linux',
      architecture: 'x86_64',
      buildTarget: 'linux_x86',
      supportedDeviceClasses: ['laptop'],
      minimumOsRuntimeVersion: 'linux-5.15',
      claimUniversalCompatibilityWithoutTest: true,
    }).state,
    'DENIED',
  );

  let pkg = exampleLinuxX86Package(agent);
  assert.equal(pkg.evidenceState, 'DOCUMENTED');
  assert.equal(pkg.signed, true);
  assert.equal(pkg.universalCompatibilityClaimedWithoutTest, false);
  assert.equal(pkg.installUninstallBehavior.stealthPersistence, false);
  assert.equal(pkg.installUninstallBehavior.firmwareBiosModification, false);

  assert.equal(
    advancePackageState({
      pkg,
      nextState: 'VERIFIED',
      evidencePresent: false,
    }).state,
    'DENIED',
  );

  assert.equal(
    recordPlatformTestEvidence({
      pkg,
      buildTarget: 'linux_x86',
      tested: true,
      claimUniversalCompatibility: true,
    }).state,
    'DENIED',
  );

  const enrolled = enrollDevice({
    actor: agent,
    pkg,
    deviceId: 'dev-1',
  });
  assert.ok(!('denied' in enrolled));
  pkg = enrolled;

  const preview = previewPermissions({ pkg });
  assert.equal(preview.leastPrivilege, true);
  assert.equal(preview.stealthPersistence, false);

  assert.equal(
    installUniversalRuntimePackage({
      actor: agent,
      pkg,
      explicitAuthorization: false,
    }).state,
    'DENIED',
  );
  assert.equal(
    installUniversalRuntimePackage({
      actor: agent,
      pkg,
      explicitAuthorization: true,
      signed: false,
    }).state,
    'DENIED',
  );
  assert.equal(
    installUniversalRuntimePackage({
      actor: agent,
      pkg,
      explicitAuthorization: true,
      stealthPersistence: true,
    }).state,
    'DENIED',
  );

  const installed = installUniversalRuntimePackage({
    actor: agent,
    pkg,
    explicitAuthorization: true,
    authorizerId: human.id,
  });
  assert.ok(!('denied' in installed));
  assert.equal(installed.installed, true);
  assert.equal(installed.evidenceState, 'INSTALLABLE');
});

test('probe+verify+heartbeat truth states; Home Base candidate; revoke uninstall rollback', () => {
  let pkg = exampleLinuxX86Package(agent);
  const enrolled = enrollDevice({ actor: agent, pkg, deviceId: 'dev-2' });
  assert.ok(!('denied' in enrolled));
  const installed = installUniversalRuntimePackage({
    actor: agent,
    pkg: enrolled,
    explicitAuthorization: true,
  });
  assert.ok(!('denied' in installed));
  pkg = installed;

  const probed = runLocalHardwareProbe({ pkg, probePassed: true });
  assert.ok(!('denied' in probed));
  assert.equal(probed.hardwareProbePassed, true);

  const verified = verifyRuntimeModel({ pkg: probed, verified: true });
  assert.ok(!('denied' in verified));
  assert.equal(verified.runtimeModelVerified, true);
  pkg = verified;

  assert.equal(
    resolveOfflineTruthState({
      devicePowerState: 'POWERED_OFF',
      connectivityState: 'DISCONNECTED',
    }),
    'OFFLINE_STOPPED',
  );
  assert.equal(
    resolveOfflineTruthState({
      devicePowerState: 'POWERED_ON',
      connectivityState: 'DISCONNECTED',
    }),
    'LOCAL_ONLY',
  );
  assert.equal(
    resolveOfflineTruthState({
      devicePowerState: 'POWERED_ON',
      connectivityState: 'CONNECTED',
      synchronizedHealthy: true,
    }),
    'RUNNING_VERIFIED',
  );

  const hbStopped = emitPackageHeartbeat({
    actor: agent,
    pkg,
    devicePowerState: 'POWERED_OFF',
    connectivityState: 'DISCONNECTED',
  });
  assert.ok(!('denied' in hbStopped));
  assert.equal(hbStopped.heartbeat.offlineTruthState, 'OFFLINE_STOPPED');

  const hbLocal = emitPackageHeartbeat({
    actor: agent,
    pkg,
    devicePowerState: 'POWERED_ON',
    connectivityState: 'DISCONNECTED',
  });
  assert.ok(!('denied' in hbLocal));
  assert.equal(hbLocal.heartbeat.offlineTruthState, 'LOCAL_ONLY');

  const hbRun = emitPackageHeartbeat({
    actor: agent,
    pkg,
    devicePowerState: 'POWERED_ON',
    connectivityState: 'CONNECTED',
    synchronizedHealthy: true,
  });
  assert.ok(!('denied' in hbRun));
  assert.equal(hbRun.heartbeat.offlineTruthState, 'RUNNING_VERIFIED');
  pkg = hbRun.pkg;

  const reg = registerWithHomeBase({ actor: agent, pkg });
  assert.ok(!('denied' in reg));
  assert.equal(reg.registration.status, 'REGISTERED_CANDIDATE');
  assert.equal(reg.registration.productionAuthorized, false);
  assert.equal(reg.registration.authorityGranted, false);

  const revoked = uninstallAndRevokeEnrollment({
    pkg: reg.pkg,
    rollbackToVersion: '0.9.0',
  });
  assert.equal(revoked.installed, false);
  assert.equal(revoked.enrolledDeviceId, null);
  assert.equal(revoked.rollbackVersion, '0.9.0');
  assert.equal(revoked.offlineTruthState, 'OFFLINE_STOPPED');
});

test('security denies + guardian isolation hold', () => {
  assert.equal(attemptStealthPersistence().state, 'DENIED');
  assert.equal(attemptPrivilegeEscalation().state, 'DENIED');
  assert.equal(attemptFirmwareBiosModification().state, 'DENIED');
  assert.equal(attemptUnsignedInstall().state, 'DENIED');
  assert.equal(attemptInstallWithoutAuthorization().state, 'DENIED');
  assert.equal(attemptUniversalCompatClaim().state, 'DENIED');
  assert.equal(attemptAdvanceVerifiedWithoutEvidence().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  const foreign: Er28Actor = {
    ...agent,
    tenantId: 'other-tenant',
    universeId: 'other-universe',
    orgId: 'other-org',
  };
  const pkg = exampleLinuxX86Package(agent);
  assert.equal(
    enrollDevice({
      actor: foreign,
      pkg,
      deviceId: 'dev-x',
    }).state,
    'DENIED',
  );
});

test('bootstrap + soft-wire + cycle; ER27 WAITING_DATA; ER14/EQ7/EQ8/EP1 PRESENT', () => {
  const boot = bootstrapUniversalRuntimePackageContract(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.packageFields.length, 18);
  assert.equal(boot.packageStates.length, 8);
  assert.equal(boot.platformTargets.length, 7);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.equal(boot.sot.label, '62L-ER28');
  assert.match(boot.sot.next, /ER29/);
  assert.equal(boot.locks.UNIVERSAL_COMPATIBILITY_CLAIMED_WITHOUT_TEST, false);
  assert.equal(boot.locks.L4_AUTONOMY_ENABLED, false);

  const soft = er28SoftWireSnapshot(repoRoot);
  assert.equal(soft.er27SpeculativeExtraterrestrialResearchLayer.present, false);
  assert.match(
    soft.er27SpeculativeExtraterrestrialResearchLayer.note,
    /WAITING_DATA/,
  );
  assert.equal(soft.er14OfflineBrainPackager.present, true);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er1RealApiConnectionRegistry.present, true);
  assert.equal(soft.eq7ArmEdgeAmdAcceleration.present, true);
  assert.equal(soft.eq8ArmServerCloudRuntime.present, true);
  assert.equal(soft.eq16SoftwareWormholeRouter.present, true);
  assert.equal(soft.ep1VirtualChipContract.present, true);
  assert.equal(soft.ep15AlgorithmTuningSandbox.present, true);

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const cycle = runUniversalRuntimePackageContractCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of UNIVERSAL_RUNTIME_PACKAGE_CONTRACT_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er27Hop = cycle.hops.find((h) => h.hop === 'er27_soft_wire');
  assert.ok(er27Hop);
  assert.equal(er27Hop.state, 'WAITING_DATA');

  const er14Hop = cycle.hops.find((h) => h.hop === 'er14_soft_wire');
  assert.ok(er14Hop);
  assert.equal(er14Hop.state, 'PASS');

  const eq7Hop = cycle.hops.find((h) => h.hop === 'eq7_soft_wire');
  assert.ok(eq7Hop);
  assert.equal(eq7Hop.state, 'PASS');

  const eq8Hop = cycle.hops.find((h) => h.hop === 'eq8_soft_wire');
  assert.ok(eq8Hop);
  assert.equal(eq8Hop.state, 'PASS');

  const ep1Hop = cycle.hops.find((h) => h.hop === 'ep1_soft_wire');
  assert.ok(ep1Hop);
  assert.equal(ep1Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.receipt.universalCompatibilityClaimedWithoutTest, false);
  assert.equal(cycle.receipt.registeredWithHomeBase, true);
  assert.equal(cycle.receipt.offlineTruthState, 'RUNNING_VERIFIED');
});
