/**
 * 62L-EP6 — Local Hardware Truth Probe v2 denial + honesty tests.
 *
 * Script: npm run test:62lep6
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EP6_DB_CANDIDATES_STATUS,
  EP6_LOCKS,
  EP6_MAY,
  EP6_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HARDWARE_PROBE_AGENT_BOUNDS,
  HARDWARE_PROBE_FIELDS,
  HARDWARE_STATE_PROGRESSION,
  HARDWARE_TRUTH_HOME_BASE_FLOW,
  HARDWARE_TRUTH_STATES,
  HONESTY_BANNER,
  LOCAL_HARDWARE_TRUTH_PROBE_CYCLE,
  MACHINE_EVIDENCE_SURFACES,
  NEXT_PHASE_TITLE,
  NODE_AVAILABILITY_STATES,
  PROBE_MUST_NOT_INSPECT,
  assertEp6LocksIntact,
  canAdvanceHardwareState,
  ep6SoftWireSnapshot,
  type Ep6Actor,
} from './local-hardware-truth-probe-types.ts';

import {
  advanceSurfaceState,
  attemptAmdCpuImpliesNpu,
  attemptAgentAutoAuthority,
  attemptCollectPreciseLocation,
  attemptEquateDetectedWithVerified,
  attemptInspectPersonalFiles,
  attemptJumpUnknownToVerified,
  attemptPackagesImplyCompatibility,
  attemptRadeonImpliesWindowsMl,
  attemptRecommendAsAct,
  attemptVerifyWithoutBoundedRun,
  bootstrapLocalHardwareTruthProbe,
  classifyIndependently,
  evaluateSchedulingEligibility,
  exampleAsusProbeFields,
  generateMachineEvidenceProfile,
  probeGuardianRlsTenantUniverseIsolation,
  requireHumanApproval,
  returnAgentEvidenceToHomeBase,
  runLocalHardwareTruthProbeCycle,
  transitionNodeAvailability,
} from './local-hardware-truth-probe-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep6Actor = {
  kind: 'hardware_probe',
  id: 'probe-1',
  orgId: 'org-ep6',
  tenantId: 'ten-ep6',
  universeId: 'uni-ep6',
  permissions: ['draft'],
};

const human: Ep6Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep6',
  tenantId: 'ten-ep6',
  universeId: 'uni-ep6',
  permissions: ['approve_consequential'],
};

test('SoT label EP6 / #160; GitLab mirror not invented; next EP7', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP6');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Local Hardware Truth Probe/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP7/);
  assert.match(NEXT_PHASE_TITLE, /AMD Adapter Research Path/);
});

test('honesty locks: L4 false; no UNKNOWN→VERIFIED; DB NOT_APPLIED', () => {
  assert.equal(assertEp6LocksIntact(), true);
  assert.equal(EP6_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP6_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP6_LOCKS.UNKNOWN_TO_VERIFIED_JUMP_ALLOWED, false);
  assert.equal(EP6_LOCKS.DETECTED_EQ_VERIFIED, false);
  assert.equal(EP6_LOCKS.AMD_CPU_EQ_AMD_NPU, false);
  assert.equal(EP6_LOCKS.INSPECT_PERSONAL_FILES, false);
  assert.equal(EP6_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(HARDWARE_PROBE_AGENT_BOUNDS.mayJumpUnknownToVerified, false);
});

test('probe fields + states + surfaces + privacy + home base flow encoded', () => {
  assert.equal(HARDWARE_PROBE_FIELDS.length, 13);
  assert.ok(HARDWARE_PROBE_FIELDS.includes('cpuVendorModel'));
  assert.ok(HARDWARE_PROBE_FIELDS.includes('xivRuntimeHeartbeat'));

  assert.deepEqual([...HARDWARE_STATE_PROGRESSION], [
    'UNKNOWN',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
  ]);
  assert.ok(HARDWARE_TRUTH_STATES.includes('NOT_TESTED'));
  assert.ok(HARDWARE_TRUTH_STATES.includes('STALE'));
  assert.ok(HARDWARE_TRUTH_STATES.includes('DEGRADED'));
  assert.ok(HARDWARE_TRUTH_STATES.includes('UNAVAILABLE'));

  assert.equal(MACHINE_EVIDENCE_SURFACES.length, 7);
  assert.deepEqual([...NODE_AVAILABILITY_STATES], [
    'RUNNING_VERIFIED',
    'WAITING_NODE',
    'OFFLINE_STOPPED',
  ]);
  assert.deepEqual([...HARDWARE_TRUTH_HOME_BASE_FLOW], [
    'asus_node',
    'virtual_chip_registry',
    'benchmark_memory',
    'workload_router',
    'agent_compute_decisions',
  ]);
  assert.equal(PROBE_MUST_NOT_INSPECT.length, 9);
  assert.ok(EP6_MAY.length > 0);
  assert.ok(EP6_MUST_NOT.includes('jump_unknown_to_verified'));
});

test('states never jump UNKNOWN → VERIFIED; legal progression works', () => {
  assert.equal(canAdvanceHardwareState('UNKNOWN', 'VERIFIED'), false);
  assert.equal(canAdvanceHardwareState('UNKNOWN', 'DETECTED'), true);
  assert.equal(canAdvanceHardwareState('DETECTED', 'SUPPORTED'), true);
  assert.equal(canAdvanceHardwareState('SUPPORTED', 'VERIFIED'), true);

  const jump = advanceSurfaceState({
    surface: 'cpu',
    from: 'UNKNOWN',
    to: 'VERIFIED',
  });
  assert.equal('denied' in jump && jump.state, 'DENIED');
  assert.equal(attemptJumpUnknownToVerified().state, 'DENIED');
  assert.equal(attemptEquateDetectedWithVerified().state, 'DENIED');

  const ok = advanceSurfaceState({
    surface: 'cpu',
    from: 'UNKNOWN',
    to: 'DETECTED',
  });
  assert.ok(!('denied' in ok));
});

test('VERIFIED requires bounded inference/benchmark on exact path', () => {
  const noRun = advanceSurfaceState({
    surface: 'cpu_inference',
    from: 'SUPPORTED',
    to: 'VERIFIED',
  });
  assert.equal('denied' in noRun && noRun.state, 'DENIED');
  assert.equal(attemptVerifyWithoutBoundedRun().state, 'DENIED');

  const withRun = advanceSurfaceState({
    surface: 'cpu_inference',
    from: 'SUPPORTED',
    to: 'VERIFIED',
    boundedInferenceOrBenchmark: true,
  });
  assert.ok(!('denied' in withRun));
  assert.equal(withRun.to, 'VERIFIED');
});

test('CPU/GPU/NPU independently classified; AMD CPU ≠ NPU; Radeon ≠ WinML', () => {
  const c = classifyIndependently({
    cpu: 'DETECTED',
    amdGpu: 'DETECTED',
    npu: 'UNKNOWN',
    windowsMl: 'SUPPORTED',
    cpuInference: 'NOT_TESTED',
    gpuInference: 'NOT_TESTED',
    npuInference: 'NOT_TESTED',
  });
  assert.ok(!('denied' in c));
  assert.equal(c.surfaces.cpu, 'DETECTED');
  assert.equal(c.surfaces.amd_gpu, 'DETECTED');
  assert.equal(c.surfaces.npu, 'UNKNOWN');
  assert.equal(c.surfaces.windows_ml, 'SUPPORTED');
  assert.equal(c.surfaces.cpu_inference, 'NOT_TESTED');
  assert.equal(c.surfaces.gpu_inference, 'NOT_TESTED');
  assert.equal(c.surfaces.npu_inference, 'NOT_TESTED');

  assert.equal(attemptAmdCpuImpliesNpu().state, 'DENIED');
  assert.equal(attemptRadeonImpliesWindowsMl().state, 'DENIED');
  assert.equal(attemptPackagesImplyCompatibility().state, 'DENIED');
  assert.equal(
    'denied' in
      classifyIndependently({ attemptAmdCpuImpliesNpu: true }) &&
      classifyIndependently({ attemptAmdCpuImpliesNpu: true }).state,
    'DENIED',
  );
});

test('machine profile without secrets; timestamped; fallbacks visible', () => {
  const classified = classifyIndependently({
    cpu: 'DETECTED',
    amdGpu: 'DETECTED',
    npu: 'UNKNOWN',
  });
  assert.ok(!('denied' in classified));

  const secrets = generateMachineEvidenceProfile({
    actor: agent,
    profileId: 'p-bad',
    nodeId: 'n1',
    probeFields: exampleAsusProbeFields(),
    surfaces: classified.surfaces,
    attemptIncludeSecrets: true,
  });
  assert.equal('denied' in secrets && secrets.state, 'DENIED');

  const profile = generateMachineEvidenceProfile({
    actor: agent,
    profileId: 'p1',
    nodeId: 'asus-1',
    probeFields: exampleAsusProbeFields(),
    surfaces: classified.surfaces,
    heartbeatAt: new Date().toISOString(),
    nodeEvent: 'running',
    acceleratorFallbacks: ['cpu_inference', 'gpu_inference'],
  });
  assert.ok(!('denied' in profile));
  assert.equal(profile.secretsPresent, false);
  assert.ok(profile.timestamp);
  assert.equal(profile.heartbeatFresh, true);
  assert.equal(profile.availability, 'RUNNING_VERIFIED');
  assert.ok(profile.acceleratorFallbacks.includes('cpu_inference'));
});

test('fresh heartbeat required; sleep/shutdown; stale stops verified scheduling', () => {
  const classified = classifyIndependently({ cpu: 'DETECTED' });
  assert.ok(!('denied' in classified));

  const fresh = generateMachineEvidenceProfile({
    actor: agent,
    profileId: 'p-fresh',
    nodeId: 'n1',
    probeFields: exampleAsusProbeFields(),
    surfaces: classified.surfaces,
    heartbeatAt: new Date().toISOString(),
    nodeEvent: 'running',
  });
  assert.ok(!('denied' in fresh));
  const elig = evaluateSchedulingEligibility({ profile: fresh });
  assert.ok(!('denied' in elig));
  assert.equal(elig.eligibleForVerifiedScheduling, true);

  assert.equal(
    evaluateSchedulingEligibility({
      profile: fresh,
      attemptAvailableWithoutFreshHeartbeat: true,
    }).state,
    'DENIED',
  );

  const staleSurfaces = {
    ...classified.surfaces,
    cpu: 'STALE' as const,
  };
  const staleProfile = generateMachineEvidenceProfile({
    actor: agent,
    profileId: 'p-stale',
    nodeId: 'n1',
    probeFields: exampleAsusProbeFields(),
    surfaces: staleSurfaces,
    heartbeatAt: new Date().toISOString(),
    nodeEvent: 'running',
  });
  assert.ok(!('denied' in staleProfile));
  const staleElig = evaluateSchedulingEligibility({ profile: staleProfile });
  assert.ok(!('denied' in staleElig));
  assert.equal(staleElig.eligibleForVerifiedScheduling, false);
  assert.equal(
    evaluateSchedulingEligibility({
      profile: staleProfile,
      attemptUseStaleForVerifiedScheduling: true,
    }).state,
    'DENIED',
  );

  assert.equal(
    transitionNodeAvailability({
      from: 'RUNNING_VERIFIED',
      event: 'sleep',
    }).to,
    'WAITING_NODE',
  );
  assert.equal(
    transitionNodeAvailability({
      from: 'RUNNING_VERIFIED',
      event: 'shutdown',
    }).to,
    'OFFLINE_STOPPED',
  );
});

test('privacy denies + agent advisory bounds + guardian isolation', () => {
  assert.equal(attemptInspectPersonalFiles().state, 'DENIED');
  assert.equal(attemptCollectPreciseLocation().state, 'DENIED');
  assert.equal(attemptAgentAutoAuthority().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');

  const emptySurfaces = {
    cpu: 'UNKNOWN' as const,
    amd_gpu: 'UNKNOWN' as const,
    npu: 'UNKNOWN' as const,
    windows_ml: 'NOT_TESTED' as const,
    cpu_inference: 'NOT_TESTED' as const,
    gpu_inference: 'NOT_TESTED' as const,
    npu_inference: 'NOT_TESTED' as const,
  };
  const personal = generateMachineEvidenceProfile({
    actor: agent,
    profileId: 'p-priv',
    nodeId: 'n1',
    probeFields: exampleAsusProbeFields(),
    surfaces: emptySurfaces,
    attemptInspectPersonalFiles: true,
  });
  assert.equal('denied' in personal && personal.state, 'DENIED');
  const priv = generateMachineEvidenceProfile({
    actor: agent,
    profileId: 'p-priv2',
    nodeId: 'n1',
    probeFields: exampleAsusProbeFields(),
    surfaces: emptySurfaces,
    attemptInspectCredentials: true,
  });
  assert.equal('denied' in priv && priv.state, 'DENIED');

  const ev = returnAgentEvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    summary: 'hardware profile advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);
  assert.equal(ev.flow[0], 'asus_node');

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('soft-wire EP5/EP4/EP1 present; cycle hops complete', () => {
  const boot = bootstrapLocalHardwareTruthProbe(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.probeFields.length, 13);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const soft = ep6SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep5BenchmarkMemory.present, true);
  assert.equal(soft.ep4IpFirewall.present, true);
  assert.equal(soft.ep1VirtualChipContract.present, true);

  const cycle = runLocalHardwareTruthProbeCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, LOCAL_HARDWARE_TRUTH_PROBE_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of LOCAL_HARDWARE_TRUTH_PROBE_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.profile));
  assert.equal(cycle.profile.secretsPresent, false);
  assert.equal(cycle.profile.surfaces.cpu, 'DETECTED');
  assert.equal(cycle.profile.surfaces.npu, 'UNKNOWN');
  assert.equal(cycle.profile.surfaces.cpu_inference, 'NOT_TESTED');
});
