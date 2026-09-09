/**
 * 62L-ER33 — Runtime Update Channel denial + honesty tests.
 *
 * Script: npm run test:62ler33
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  COMPATIBILITY_GATE_CHECKS,
  ER33_AGENT_BOUNDS,
  ER33_DB_CANDIDATES_STATUS,
  ER33_LOCKS,
  ER33_MAY,
  ER33_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  ROLLOUT_STAGES,
  ROLLBACK_PRESERVE_FIELDS,
  ROLLBACK_TRIGGERS,
  RUNTIME_UPDATE_CHANNEL_CYCLE,
  SUPPORTED_UPDATE_TYPES,
  UPDATE_CHANNEL_CORE_FLOW,
  UPDATE_PACKAGE_FIELDS,
  assertEr33LocksIntact,
  er33SoftWireSnapshot,
  mayAdvanceRollout,
  type Er33Actor,
} from './runtime-update-channel-types.ts';

import {
  advanceRolloutStage,
  attemptCrossTenantPackageMix,
  attemptFirmwareBiosUpdate,
  attemptForceIncompatibleInstall,
  attemptJumpDraftToAllDevices,
  attemptPermissionExpansion,
  attemptRecommendAsAct,
  attemptStealthInstall,
  attemptUnsignedInstall,
  bootstrapRuntimeUpdateChannel,
  createUpdatePackage,
  evaluateCompatibilityGate,
  exampleCompatRequirements,
  exampleDevice,
  exampleUpdatePackage,
  installUpdateOnDevice,
  offlineReconnectUpdate,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  revokeUpdate,
  attemptDistributeRevoked,
  runRuntimeUpdateChannelCycle,
  runSandboxTests,
  runSecurityReview,
  triggerRollback,
} from './runtime-update-channel-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er33Actor = {
  kind: 'update_channel_agent',
  id: 'uca-1',
  orgId: 'org-er33',
  tenantId: 'ten-er33',
  universeId: 'uni-er33',
  permissions: ['draft'],
};

const human: Er33Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er33',
  tenantId: 'ten-er33',
  universeId: 'uni-er33',
  permissions: ['approve_consequential'],
};

test('SoT label ER33 / #162; Runtime Update Channel; next ER34 Capability Manifest', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER33');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Runtime Update Channel/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER34/);
  assert.match(NEXT_PHASE_TITLE, /Capability Manifest/);
  assert.match(ER_LAYER_TITLE, /Universal Device Distribution/);
});

test('honesty locks: L4 false; signed-only; no firmware/stealth/perm-expand; DB NOT_APPLIED', () => {
  assert.equal(assertEr33LocksIntact(), true);
  assert.equal(ER33_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER33_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER33_LOCKS.SIGNED_ARTIFACTS_ONLY, true);
  assert.equal(ER33_LOCKS.STEALTH_INSTALLATION, false);
  assert.equal(ER33_LOCKS.FIRMWARE_BIOS_UPDATES_VIA_CHANNEL, false);
  assert.equal(ER33_LOCKS.AUTOMATIC_PERMISSION_EXPANSION, false);
  assert.equal(ER33_LOCKS.CROSS_TENANT_PACKAGE_MIXING, false);
  assert.equal(ER33_LOCKS.JUMP_DRAFT_TO_ALL_DEVICES, false);
  assert.equal(ER33_LOCKS.FORCE_INCOMPATIBLE_INSTALL, false);
  assert.equal(ER33_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(ER33_AGENT_BOUNDS.mayJumpDraftToAllDevices, false);
  assert.equal(ER33_AGENT_BOUNDS.automaticAuthority, false);
});

test('package fields + flow + types + stages + gate + rollback encoded', () => {
  assert.equal(UPDATE_PACKAGE_FIELDS.length, 18);
  assert.ok(UPDATE_PACKAGE_FIELDS.includes('updateId'));
  assert.ok(UPDATE_PACKAGE_FIELDS.includes('signedHash'));
  assert.ok(UPDATE_PACKAGE_FIELDS.includes('approvalState'));
  assert.deepEqual([...UPDATE_CHANNEL_CORE_FLOW], [
    'new_candidate',
    'sandbox_tests',
    'compatibility_matrix',
    'security_review',
    'human_approval',
    'staged_rollout',
    'health_checks',
    'continue_or_rollback',
  ]);
  assert.equal(SUPPORTED_UPDATE_TYPES.length, 10);
  assert.ok(SUPPORTED_UPDATE_TYPES.includes('local_runtime'));
  assert.ok(SUPPORTED_UPDATE_TYPES.includes('offline_knowledge_packs'));
  assert.deepEqual([...ROLLOUT_STAGES], [
    'DRAFT',
    'SANDBOX',
    'TEST_DEVICE',
    'LIMITED_COHORT',
    'VERIFIED_CANDIDATE',
    'AUTHORIZED_BROADER_ROLLOUT',
  ]);
  assert.equal(COMPATIBILITY_GATE_CHECKS.length, 8);
  assert.equal(ROLLBACK_TRIGGERS.length, 7);
  assert.deepEqual([...ROLLBACK_PRESERVE_FIELDS], [
    'priorWorkingVersion',
    'rollbackTrigger',
    'healthThreshold',
    'rollbackReceipt',
    'affectedDeviceList',
  ]);
  assert.equal(mayAdvanceRollout('DRAFT', 'AUTHORIZED_BROADER_ROLLOUT'), false);
  assert.equal(mayAdvanceRollout('DRAFT', 'SANDBOX'), true);
  assert.ok(ER33_MAY.includes('block_incompatible_installs_as_UPDATE_BLOCKED'));
  assert.ok(ER33_MUST_NOT.includes('jump_from_DRAFT_to_all_devices'));
});

test('create signed package; deny DRAFT→all; human approval; UPDATE_BLOCKED', () => {
  assert.equal(
    createUpdatePackage({
      actor: agent,
      updateId: 'bad-unsigned',
      packageRuntimeType: 'local_runtime',
      targetPlatform: 'linux',
      targetArchitecture: 'x86_64',
      currentVersion: '1.0.0',
      targetVersion: '1.1.0',
      compatibilityRequirements: exampleCompatRequirements(agent),
      rollbackVersion: '1.0.0',
      signed: false,
    }).state,
    'DENIED',
  );

  let pkg = exampleUpdatePackage(agent);
  assert.equal(pkg.signed, true);
  assert.ok(pkg.signature);
  assert.equal(pkg.deploymentScope, 'DRAFT');

  assert.equal(
    advanceRolloutStage({
      pkg,
      to: 'AUTHORIZED_BROADER_ROLLOUT',
      evidence: ['skip'],
      jumpToAllDevices: true,
    }).state,
    'DENIED',
  );
  assert.equal(attemptJumpDraftToAllDevices().state, 'DENIED');

  const sandboxed = runSandboxTests({
    pkg,
    pass: true,
    evidence: ['sandbox-ok'],
  });
  assert.ok(!('denied' in sandboxed));
  pkg = sandboxed;

  const secured = runSecurityReview({
    pkg,
    pass: true,
    evidence: ['sec-ok'],
  });
  assert.ok(!('denied' in secured));
  pkg = secured;

  assert.equal(
    requireHumanApproval({
      pkg,
      actor: agent,
      approvalId: 'nope',
    }).state,
    'DENIED',
  );

  const approved = requireHumanApproval({
    pkg,
    actor: human,
    approvalId: 'a1',
  });
  assert.ok(!('denied' in approved));
  pkg = approved;
  assert.equal(pkg.approvalState, 'APPROVED');

  const advanced = advanceRolloutStage({
    pkg,
    to: 'TEST_DEVICE',
    evidence: ['device-lab'],
  });
  assert.ok(!('denied' in advanced));
  pkg = advanced;

  const badDevice = {
    ...exampleDevice(agent),
    platform: 'zos',
    architecture: 's390x',
  };
  const blocked = evaluateCompatibilityGate({ pkg, device: badDevice });
  assert.ok(!('denied' in blocked));
  assert.equal(blocked.outcome, 'UPDATE_BLOCKED');
  assert.ok(blocked.failedChecks.includes('platform'));

  assert.equal(
    installUpdateOnDevice({ pkg, device: badDevice }).state,
    'UPDATE_BLOCKED',
  );

  const good = installUpdateOnDevice({
    pkg,
    device: exampleDevice(agent),
  });
  assert.ok(!('denied' in good));
  assert.equal(good.installed, true);
  assert.equal(good.device.installedVersion, '1.1.0');
});

test('rollback preserves fields; offline retain last verified; reconnect compatible only', () => {
  const pkg = exampleUpdatePackage(agent);
  const rb = triggerRollback({
    pkg,
    trigger: 'crash_increase',
    healthThreshold: 'crash_rate<1%',
    affectedDeviceList: ['dev-1', 'dev-2'],
  });
  assert.ok(!('denied' in rb));
  assert.equal(rb.priorWorkingVersion, '1.0.0');
  assert.equal(rb.rollbackTrigger, 'crash_increase');
  assert.ok(rb.rollbackReceipt);
  assert.deepEqual([...rb.affectedDeviceList], ['dev-1', 'dev-2']);

  const offline = exampleDevice(agent);
  offline.online = false;
  offline.packageStale = true;
  const hold = offlineReconnectUpdate({ pkg, device: offline });
  assert.ok(!('denied' in hold));
  assert.equal(hold.delivered, false);
  assert.equal(hold.retainedLastVerified, true);
  assert.equal(hold.treatedAsCurrentBeforeUpdate, false);

  assert.equal(
    offlineReconnectUpdate({
      pkg,
      device: exampleDevice(agent),
      treatStaleAsCurrent: true,
    }).state,
    'DENIED',
  );

  // Unapproved package on reconnect — retain last verified
  const unapproved = offlineReconnectUpdate({
    pkg,
    device: exampleDevice(agent),
  });
  assert.ok(!('denied' in unapproved));
  assert.equal(unapproved.delivered, false);
  assert.equal(unapproved.retainedLastVerified, true);
});

test('security denies + guardian isolation + revoked stops distribution', () => {
  assert.equal(attemptUnsignedInstall().state, 'DENIED');
  assert.equal(attemptStealthInstall().state, 'DENIED');
  assert.equal(attemptFirmwareBiosUpdate().state, 'DENIED');
  assert.equal(attemptPermissionExpansion().state, 'DENIED');
  assert.equal(attemptCrossTenantPackageMix().state, 'DENIED');
  assert.equal(attemptForceIncompatibleInstall().state, 'UPDATE_BLOCKED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');

  assert.equal(
    createUpdatePackage({
      actor: agent,
      updateId: 'fw',
      packageRuntimeType: 'hardware_adapters',
      targetPlatform: 'linux',
      targetArchitecture: 'x86_64',
      currentVersion: '1.0.0',
      targetVersion: '1.0.1',
      compatibilityRequirements: exampleCompatRequirements(agent),
      rollbackVersion: '1.0.0',
      firmwareOrBios: true,
    }).state,
    'DENIED',
  );

  const foreign: Er33Actor = {
    ...agent,
    tenantId: 'other-tenant',
    universeId: 'other-universe',
  };
  const pkg = exampleUpdatePackage(agent);
  const gate = evaluateCompatibilityGate({
    pkg,
    device: { ...exampleDevice(foreign) },
  });
  assert.equal(gate.state, 'DENIED');

  const revoked = revokeUpdate({ pkg });
  assert.equal(revoked.revoked, true);
  assert.equal(attemptDistributeRevoked(revoked).state, 'DENIED');
});

test('bootstrap + soft-wire + cycle; ER28–ER32 WAITING_DATA; ER2 PRESENT', () => {
  const boot = bootstrapRuntimeUpdateChannel(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.packageFields.length, 18);
  assert.equal(boot.updateTypes.length, 10);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');
  assert.equal(boot.sot.issue, 162);
  assert.match(boot.sot.next, /ER34/);

  const soft = er33SoftWireSnapshot(repoRoot);
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.er2Report.present, true);
  assert.equal(soft.er28UniversalRuntimePackageContract.present, false);
  assert.match(soft.er28UniversalRuntimePackageContract.note, /WAITING_DATA/);
  assert.equal(soft.er29WindowsRuntimePackageCandidate.present, false);
  assert.match(soft.er29WindowsRuntimePackageCandidate.note, /WAITING_DATA/);
  assert.equal(soft.er30AndroidArmRuntimePackageCandidate.present, false);
  assert.equal(soft.er31IosAppleRuntimeResearchCandidate.present, false);
  assert.equal(soft.er32EdgeVehicleRuntimeCandidate.present, false);
  assert.match(soft.er32EdgeVehicleRuntimeCandidate.note, /WAITING_DATA/);

  const cycle = runRuntimeUpdateChannelCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, RUNTIME_UPDATE_CHANNEL_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of RUNTIME_UPDATE_CHANNEL_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }

  const er28Hop = cycle.hops.find((h) => h.hop === 'er28_soft_wire');
  assert.ok(er28Hop);
  assert.equal(er28Hop.state, 'WAITING_DATA');

  const er32Hop = cycle.hops.find((h) => h.hop === 'er32_soft_wire');
  assert.ok(er32Hop);
  assert.equal(er32Hop.state, 'WAITING_DATA');

  const er2Hop = cycle.hops.find((h) => h.hop === 'er2_soft_wire');
  assert.ok(er2Hop);
  assert.equal(er2Hop.state, 'PASS');

  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.equal(cycle.receipt.L4_AUTONOMY_ENABLED, false);
  assert.equal(cycle.receipt.jumpedDraftToAllDevices, false);
});
