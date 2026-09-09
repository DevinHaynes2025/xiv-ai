/**
 * 62L-ER34 — Capability Manifest denial + honesty tests.
 *
 * Script: npm run test:62ler34
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  AGENT_ROUTING_PATH,
  BLOCKED_PERSONAL_CONTENT,
  CAPABILITY_EVIDENCE_STATES,
  CAPABILITY_MANIFEST_CYCLE,
  CAPABILITY_MANIFEST_FIELDS,
  CAPABILITY_MANIFEST_TRUTH_BOUNDARY,
  CROSS_DEVICE_CLASSES,
  DEFAULT_HEARTBEAT_STALE_GAP_MS,
  ER34_AGENT_BOUNDS,
  ER34_DB_CANDIDATES_STATUS,
  ER34_LOCKS,
  ER34_MAY,
  ER34_MUST_NOT,
  ER_LAYER_TITLE,
  GITHUB_SOT_FAMILY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  MANIFEST_STALE_TRIGGERS,
  NEXT_PHASE_TITLE,
  aspirationMayBecomeVerified,
  assertEr34LocksIntact,
  canClaimVerified,
  er34SoftWireSnapshot,
  missingCapabilityForcesRoute,
  type Er34Actor,
} from './capability-manifest-types.ts';

import {
  attemptAspirationAsVerified,
  attemptForceRouteWhenMissing,
  attemptHiddenChainOfThought,
  attemptNotTestedAsGpuVerified,
  attemptPersonalContent,
  attemptRecommendAsAct,
  bootstrapCapabilityManifest,
  checkRouteEligibility,
  contributeVerifiedToCrossDeviceBrain,
  exampleAsusWindowsManifest,
  markManifestStale,
  probeGuardianRlsTenantUniverseIsolation,
  publishCapabilityManifest,
  requireHumanApproval,
  returnEvidenceToHomeBase,
  runCapabilityManifestCycle,
} from './capability-manifest-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Er34Actor = {
  kind: 'capability_manifest_publisher',
  id: 'cmp-1',
  orgId: 'org-er34',
  tenantId: 'ten-er34',
  universeId: 'uni-er34',
  permissions: ['draft'],
};

const human: Er34Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-er34',
  tenantId: 'ten-er34',
  universeId: 'uni-er34',
  permissions: ['approve_consequential'],
};

test('SoT label ER34 / #162; Capability Manifest; next ER35 model/data pack', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-ER34');
  assert.equal(GITHUB_SOT_ISSUE, 162);
  assert.equal(GITHUB_SOT_FAMILY, '62L-ER');
  assert.match(GITHUB_SOT_TITLE, /Capability Manifest/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /ER35/);
  assert.match(NEXT_PHASE_TITLE, /Model \/ Data Pack Manifest/);
  assert.match(ER_LAYER_TITLE, /Universal Device Distribution/);
});

test('honesty locks: L4 false; aspirations≠VERIFIED; no force-route; DB NOT_APPLIED', () => {
  assert.equal(assertEr34LocksIntact(), true);
  assert.equal(ER34_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ER34_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(ER34_LOCKS.ASPIRATION_AS_VERIFIED, false);
  assert.equal(ER34_LOCKS.FORCE_ROUTE_WHEN_CAPABILITY_MISSING, false);
  assert.equal(ER34_LOCKS.TREAT_NOT_TESTED_AS_GPU_VERIFIED, false);
  assert.equal(ER34_LOCKS.EXPOSE_PERSONAL_FILES, false);
  assert.equal(ER34_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(aspirationMayBecomeVerified(), false);
  assert.equal(missingCapabilityForcesRoute(), false);
  assert.equal(
    CAPABILITY_MANIFEST_TRUTH_BOUNDARY.reportsEvidenceNotAspirations,
    true,
  );
  assert.equal(ER34_AGENT_BOUNDS.mayTreatAspirationAsVerified, false);
  assert.equal(
    canClaimVerified({
      from: 'SUPPORTED',
      hasBoundedVerificationEvidence: false,
      aspirationOnly: true,
    }),
    false,
  );
});

test('manifest fields + states + routing + stale triggers + privacy encoded', () => {
  assert.equal(CAPABILITY_MANIFEST_FIELDS.length, 22);
  assert.ok(CAPABILITY_MANIFEST_FIELDS.includes('deviceId'));
  assert.ok(CAPABILITY_MANIFEST_FIELDS.includes('heartbeat'));
  assert.ok(CAPABILITY_MANIFEST_FIELDS.includes('revocationState'));
  assert.deepEqual([...CAPABILITY_EVIDENCE_STATES], [
    'DOCUMENTED',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
    'NOT_TESTED',
    'DEGRADED',
    'UNAVAILABLE',
    'STALE',
    'REVOKED',
  ]);
  assert.deepEqual([...AGENT_ROUTING_PATH], [
    'agent',
    'task_envelope',
    'capability_manifest',
    'policy',
    'resource_governor',
    'scheduler',
  ]);
  assert.equal(MANIFEST_STALE_TRIGGERS.length, 6);
  assert.ok(MANIFEST_STALE_TRIGGERS.includes('os_update'));
  assert.ok(MANIFEST_STALE_TRIGGERS.includes('long_heartbeat_gap'));
  assert.deepEqual([...CROSS_DEVICE_CLASSES], [
    'asus_laptop',
    'android_phone',
    'apple_device',
    'server',
    'edge_node',
  ]);
  assert.equal(BLOCKED_PERSONAL_CONTENT.length, 6);
  assert.ok(ER34_MAY.includes(
    'publish_device_capability_manifest_with_per_capability_evidence_states',
  ));
  assert.ok(ER34_MUST_NOT.includes('treat_aspirations_as_VERIFIED'));
  assert.ok(CAPABILITY_MANIFEST_CYCLE.includes('route_check_no_eligible_when_missing'));
});

test('AMD GPU DETECTED + Windows ML SUPPORTED + Model A NOT_TESTED ≠ GPU-verified; NO_ELIGIBLE_ROUTE', () => {
  const manifest = exampleAsusWindowsManifest(agent);
  assert.equal(manifest.gpu.state, 'DETECTED');
  assert.ok(
    manifest.availableRuntimes.some(
      (r) => r.label === 'Windows ML' && r.state === 'SUPPORTED',
    ),
  );
  assert.ok(
    manifest.supportedModels.some(
      (m) => m.capabilityId === 'model-a-gpu' && m.state === 'NOT_TESTED',
    ),
  );
  assert.equal(attemptNotTestedAsGpuVerified().state, 'DENIED');
  assert.equal(attemptAspirationAsVerified().state, 'DENIED');

  const deniedVerified = publishCapabilityManifest({
    actor: agent,
    deviceId: 'bad-asp',
    deviceClass: 'asus_laptop',
    platformOs: 'windows-11',
    architecture: 'x86_64',
    cpu: {
      capabilityId: 'cpu',
      label: 'CPU',
      state: 'DETECTED',
      evidenceRefs: [],
      lastVerifiedAt: null,
      aspirationOnly: false,
    },
    gpu: {
      capabilityId: 'gpu',
      label: 'GPU',
      state: 'VERIFIED',
      evidenceRefs: [],
      lastVerifiedAt: null,
      aspirationOnly: false,
    },
    npuAccelerator: {
      capabilityId: 'npu',
      label: 'NPU',
      state: 'UNAVAILABLE',
      evidenceRefs: [],
      lastVerifiedAt: null,
      aspirationOnly: false,
    },
  });
  assert.ok('denied' in deniedVerified);

  const noRoute = checkRouteEligibility({
    actor: agent,
    manifest,
    task: {
      taskId: 't-gpu',
      requiredCapabilities: ['model-a-gpu'],
      requiredMinState: 'VERIFIED',
      tenantId: agent.tenantId,
      universeId: agent.universeId,
    },
  });
  assert.ok(!('denied' in noRoute));
  assert.equal(noRoute.route, 'NO_ELIGIBLE_ROUTE');
  assert.equal(noRoute.forced, false);

  const force = checkRouteEligibility({
    actor: agent,
    manifest,
    task: {
      taskId: 't-gpu-force',
      requiredCapabilities: ['model-a-gpu'],
      requiredMinState: 'VERIFIED',
      tenantId: agent.tenantId,
      universeId: agent.universeId,
    },
    forceWhenMissing: true,
  });
  assert.ok('denied' in force);
  assert.equal(attemptForceRouteWhenMissing().state, 'NO_ELIGIBLE_ROUTE');
});

test('STALE on os/package/heartbeat gap; privacy denies; cross-device verified only', () => {
  const manifest = exampleAsusWindowsManifest(agent);

  const staleOs = markManifestStale({ manifest, trigger: 'os_update' });
  assert.ok(!('denied' in staleOs));
  assert.equal(staleOs.stale, true);
  assert.equal(staleOs.reVerificationRequested, true);
  assert.ok(staleOs.staleTriggers.includes('os_update'));

  const stalePkg = markManifestStale({ manifest, trigger: 'package_update' });
  assert.ok(!('denied' in stalePkg));
  assert.equal(stalePkg.stale, true);

  const staleHb = markManifestStale({
    manifest,
    trigger: 'long_heartbeat_gap',
    nowMs: Date.parse(manifest.heartbeatAt) + DEFAULT_HEARTBEAT_STALE_GAP_MS + 1,
  });
  assert.ok(!('denied' in staleHb));
  assert.equal(staleHb.stale, true);

  for (const kind of BLOCKED_PERSONAL_CONTENT) {
    assert.equal(attemptPersonalContent(kind).state, 'DENIED');
  }
  assert.equal(attemptHiddenChainOfThought().state, 'DENIED');

  const personalPublish = publishCapabilityManifest({
    actor: agent,
    deviceId: 'bad-privacy',
    deviceClass: 'android_phone',
    platformOs: 'android',
    architecture: 'aarch64',
    cpu: {
      capabilityId: 'cpu',
      label: 'CPU',
      state: 'DETECTED',
      evidenceRefs: ['e1'],
      lastVerifiedAt: null,
      aspirationOnly: false,
    },
    gpu: {
      capabilityId: 'gpu',
      label: 'GPU',
      state: 'DETECTED',
      evidenceRefs: ['e2'],
      lastVerifiedAt: null,
      aspirationOnly: false,
    },
    npuAccelerator: {
      capabilityId: 'npu',
      label: 'NPU',
      state: 'UNAVAILABLE',
      evidenceRefs: [],
      lastVerifiedAt: null,
      aspirationOnly: false,
    },
    includePersonalContent: 'precise_location',
  });
  assert.ok('denied' in personalPublish);

  const cross = contributeVerifiedToCrossDeviceBrain({ actor: agent, manifest });
  assert.ok(!('denied' in cross));
  assert.ok(cross.unverifiedExcluded.includes('model-a-gpu'));
  assert.ok(cross.unverifiedExcluded.includes('gpu-amd'));
  assert.equal(
    contributeVerifiedToCrossDeviceBrain({
      actor: agent,
      manifest,
      allowUnverified: true,
    }).state,
    'DENIED',
  );
});

test('eligible route follows Agent→Task→Manifest→Policy→Governor→Scheduler', () => {
  const manifest = exampleAsusWindowsManifest(agent);
  const route = checkRouteEligibility({
    actor: agent,
    manifest,
    task: {
      taskId: 't-cpu-ok',
      requiredCapabilities: ['cpu-x86', 'rt-windows-ml'],
      requiredMinState: 'DETECTED',
      tenantId: agent.tenantId,
      universeId: agent.universeId,
    },
  });
  assert.ok(!('denied' in route));
  assert.equal(route.eligible, true);
  assert.equal(route.route, 'ELIGIBLE');
  assert.deepEqual([...route.path], [...AGENT_ROUTING_PATH]);
  assert.equal(route.forced, false);
});

test('soft-wires: ER28–ER33 WAITING_DATA or PRESENT; ER2/EQ6/EQ7 when present; cycle PASS', () => {
  const soft = er34SoftWireSnapshot(repoRoot);
  // ER28–ER33 typically absent on ER14 tip → WAITING_DATA (not FAIL)
  for (const key of [
    'er33CrossDeviceRuntimeFederation',
    'er32ServerEdgeRuntimePackage',
    'er31AppleDeviceRuntimePackage',
    'er30AndroidArmRuntimePackage',
    'er29WindowsRuntimePackage',
    'er28UniversalRuntimePackageContract',
  ] as const) {
    if (!soft[key].present) {
      assert.match(soft[key].note, /WAITING_DATA/);
    }
  }
  assert.equal(soft.er2ApiTruthStateMachine.present, true);
  assert.equal(soft.eq6ArchitectureCapabilityGraph.present, true);
  assert.equal(soft.eq7ArmEdgeAmdAcceleration.present, true);

  const boot = bootstrapCapabilityManifest(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const cycle = runCapabilityManifestCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= 40);
  const failHops = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.deepEqual(failHops, []);
  const waiting = cycle.hops.filter((h) => h.state === 'WAITING_DATA');
  assert.ok(waiting.every((h) => h.hop.includes('soft_wire')));
  assert.equal(cycle.receipt.aspirationsAsVerified, false);
  assert.equal(cycle.receipt.personalContent, false);
  assert.equal(cycle.receipt.route, 'ELIGIBLE');
  assert.ok(cycle.cycleEvidenceSha256.length === 64);

  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));

  const manifest = exampleAsusWindowsManifest(agent);
  const route = checkRouteEligibility({
    actor: agent,
    manifest,
    task: {
      taskId: 't-cpu',
      requiredCapabilities: ['cpu-x86'],
      requiredMinState: 'DETECTED',
      tenantId: agent.tenantId,
      universeId: agent.universeId,
    },
  });
  assert.ok(!('denied' in route));
  const home = returnEvidenceToHomeBase({
    actor: agent,
    manifest,
    route,
  });
  assert.equal(home.authorityGranted, false);
});
