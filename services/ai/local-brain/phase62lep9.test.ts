/**
 * 62L-EP9 — Intel Adapter Research Path denial + honesty tests.
 *
 * Script: npm run test:62lep9
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EP9_DB_CANDIDATES_STATUS,
  EP9_LOCKS,
  EP9_MAY,
  EP9_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  INTEL_ADAPTER_AGENT_BOUNDS,
  INTEL_ADAPTER_CORE_FLOW,
  INTEL_ADAPTER_FIELDS,
  INTEL_ADAPTER_MUST_NOT,
  INTEL_ADAPTER_RESEARCH_CYCLE,
  INTEL_ADAPTER_STATES,
  INTEL_DEVICE_CLASSES,
  INTEL_EXECUTION_DEVICES,
  INTEL_FAILURE_CLASSES,
  INTEL_VERIFIED_PRECONDITIONS,
  NEXT_PHASE_TITLE,
  assertEp9LocksIntact,
  ep9SoftWireSnapshot,
  isSilentCpuFallback,
  type Ep9Actor,
} from './intel-adapter-research-path-types.ts';

import {
  allVerifiedPreconditionsMet,
  attemptAlterBiosFirmware,
  attemptAssumeNpuFromCpuPresence,
  attemptAssumeOpenVinoFromPresence,
  attemptAutoInstallDriversOrRuntimes,
  attemptAutonomousCloudProvisioning,
  attemptClaimVerifiedOnSilentCpuFallback,
  attemptMainMerge,
  attemptOverclock,
  attemptPermissionExpansion,
  attemptPrivilegeEscalation,
  attemptProductionDeploy,
  attemptPromoteToVerified,
  attemptRecommendAsAct,
  bootstrapIntelAdapterResearchPath,
  fullVerifiedPreconditions,
  probeGuardianRlsTenantUniverseIsolation,
  registerIntelAdapter,
  requireHumanApproval,
  returnReceiptToHomeBase,
  runBoundedInference,
  runIntelAdapterResearchCycle,
} from './intel-adapter-research-path-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep9Actor = {
  kind: 'intel_adapter',
  id: 'intel-1',
  orgId: 'org-ep9',
  tenantId: 'ten-ep9',
  universeId: 'uni-ep9',
  permissions: ['draft'],
};

const human: Ep9Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep9',
  tenantId: 'ten-ep9',
  universeId: 'uni-ep9',
  permissions: ['approve_consequential'],
};

test('SoT label EP9 / #160; GitLab mirror not invented; next EP10', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP9');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Intel Adapter Research Path/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP10/);
  assert.match(NEXT_PHASE_TITLE, /Other Accelerator Registry/);
});

test('honesty locks: L4 false; presence ≠ OpenVINO/NPU; DB NOT_APPLIED', () => {
  assert.equal(assertEp9LocksIntact(), true);
  assert.equal(EP9_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP9_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP9_LOCKS.CPU_OR_IGPU_PRESENCE_EQ_OPENVINO_WORKS, false);
  assert.equal(EP9_LOCKS.CPU_PRESENCE_EQ_NPU_ACCELERATION, false);
  assert.equal(EP9_LOCKS.SILENT_CPU_FALLBACK_EQ_VERIFIED, false);
  assert.equal(EP9_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    INTEL_ADAPTER_AGENT_BOUNDS.mayClaimVerifiedOnSilentCpuFallback,
    false,
  );
});

test('core flow + fields + states + device classes encoded', () => {
  assert.deepEqual([...INTEL_ADAPTER_CORE_FLOW], [
    'agent_task',
    'virtual_chip_registry',
    'intel_adapter',
    'runtime_provider_check',
    'bounded_inference',
    'return_receipt',
    'benchmark_memory',
    'xiv_home_base',
  ]);
  assert.equal(INTEL_ADAPTER_FIELDS.length, 19);
  assert.ok(INTEL_ADAPTER_FIELDS.includes('adapterId'));
  assert.ok(INTEL_ADAPTER_FIELDS.includes('openVinoState'));
  assert.ok(INTEL_ADAPTER_FIELDS.includes('oneApiState'));
  assert.ok(INTEL_ADAPTER_FIELDS.includes('fallbackRoute'));

  assert.deepEqual([...INTEL_ADAPTER_STATES], [
    'UNKNOWN',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
    'NOT_TESTED',
    'DEGRADED',
    'UNAVAILABLE',
  ]);
  assert.deepEqual([...INTEL_DEVICE_CLASSES], [
    'intel_cpu',
    'intel_gpu',
    'intel_npu',
  ]);
  assert.ok(INTEL_EXECUTION_DEVICES.includes('CPU_FALLBACK'));
  assert.equal(INTEL_VERIFIED_PRECONDITIONS.length, 6);
  assert.ok(INTEL_FAILURE_CLASSES.includes('silent_cpu_fallback'));
  assert.ok(
    INTEL_ADAPTER_MUST_NOT.includes('automatically_install_drivers_or_runtimes'),
  );
  assert.ok(EP9_MAY.length > 0);
  assert.ok(
    EP9_MUST_NOT.includes('assume_openvino_from_cpu_or_igpu_presence'),
  );
});

test('CPU/iGPU presence ≠ OpenVINO; CPU ≠ NPU acceleration', () => {
  assert.equal(attemptAssumeOpenVinoFromPresence().state, 'DENIED');
  assert.equal(attemptAssumeNpuFromCpuPresence().state, 'DENIED');

  const assume = registerIntelAdapter({
    actor: agent,
    adapterId: 'bad',
    intelDeviceModel: 'CPU',
    deviceClass: 'intel_cpu',
    architectureGeneration: 'g',
    driverRuntimeVersions: 'v',
    openVinoState: 'UNKNOWN',
    oneApiState: 'UNKNOWN',
    onnxCompatibility: 'UNKNOWN',
    supportedPrecisions: 'fp32',
    modelCompatibility: 'unknown',
    memoryRequirements: '1GB',
    requestedDevice: 'INTEL_CPU',
    actualExecutionDevice: 'INTEL_CPU',
    attemptAssumeOpenVinoFromPresence: true,
  });
  assert.equal('denied' in assume && assume.state, 'DENIED');
});

test('CPU fallback recorded; accelerator remains unverified', () => {
  assert.equal(
    isSilentCpuFallback({
      requestedDevice: 'INTEL_GPU',
      actualDevice: 'CPU_FALLBACK',
    }),
    true,
  );
  assert.equal(
    isSilentCpuFallback({
      requestedDevice: 'INTEL_NPU',
      actualDevice: 'INTEL_CPU',
    }),
    true,
  );

  const adapter = registerIntelAdapter({
    actor: agent,
    adapterId: 'a1',
    intelDeviceModel: 'Intel GPU',
    deviceClass: 'intel_gpu',
    architectureGeneration: 'gen',
    driverRuntimeVersions: 'ov',
    openVinoState: 'AVAILABLE',
    oneApiState: 'NOT_TESTED',
    onnxCompatibility: 'COMPATIBLE',
    supportedPrecisions: 'fp16',
    modelCompatibility: 'candidate',
    memoryRequirements: '2GB',
    requestedDevice: 'INTEL_GPU',
    actualExecutionDevice: 'CPU_FALLBACK',
  });
  assert.ok(!('denied' in adapter));
  assert.equal(adapter.silentCpuFallback, true);
  assert.equal(adapter.acceleratorVerified, false);

  const receipt = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r1',
    requestedDevice: 'INTEL_GPU',
    actualDevice: 'CPU_FALLBACK',
    latency: '18ms',
    throughput: '50',
    resourceUsage: 'cpu',
    benchmarkReference: 'bm-1',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
  });
  assert.ok(!('denied' in receipt));
  assert.equal(receipt.fallbackUsed, true);
  assert.equal(receipt.acceleratorRemainsUnverified, true);
  assert.equal(receipt.state, 'NOT_TESTED');
  assert.equal(attemptClaimVerifiedOnSilentCpuFallback().state, 'DENIED');

  const claim = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r-claim',
    requestedDevice: 'INTEL_NPU',
    actualDevice: 'CPU_FALLBACK',
    latency: '18ms',
    throughput: '50',
    resourceUsage: 'cpu',
    benchmarkReference: 'bm-1',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
    attemptClaimVerifiedOnSilentFallback: true,
  });
  assert.equal('denied' in claim && claim.state, 'DENIED');

  const promote = attemptPromoteToVerified({
    receipt,
    preconditions: fullVerifiedPreconditions(),
  });
  assert.equal('denied' in promote && promote.state, 'DENIED');
});

test('VERIFIED requires all 6 preconditions on intended Intel device', () => {
  const adapter = registerIntelAdapter({
    actor: agent,
    adapterId: 'a2',
    intelDeviceModel: 'Intel GPU',
    deviceClass: 'intel_gpu',
    architectureGeneration: 'gen',
    driverRuntimeVersions: 'ov-2024',
    openVinoState: 'AVAILABLE',
    oneApiState: 'AVAILABLE',
    onnxCompatibility: 'COMPATIBLE',
    supportedPrecisions: 'fp16,int8',
    modelCompatibility: 'ok',
    memoryRequirements: '2GB',
    requestedDevice: 'INTEL_GPU',
    actualExecutionDevice: 'INTEL_GPU',
    state: 'SUPPORTED',
  });
  assert.ok(!('denied' in adapter));

  const incomplete = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r-inc',
    requestedDevice: 'INTEL_GPU',
    actualDevice: 'INTEL_GPU',
    latency: '5ms',
    throughput: '200',
    resourceUsage: 'gpu',
    benchmarkReference: '',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
    attemptVerifyWithoutPreconditions: true,
  });
  assert.equal('denied' in incomplete && incomplete.state, 'DENIED');

  const verified = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r-ok',
    requestedDevice: 'INTEL_GPU',
    actualDevice: 'INTEL_GPU',
    latency: '5ms',
    throughput: '200',
    resourceUsage: 'gpu',
    benchmarkReference: 'bm-gpu-1',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
  });
  assert.ok(!('denied' in verified));
  assert.equal(verified.state, 'VERIFIED');
  assert.equal(
    verified.preconditionsMet.length,
    INTEL_VERIFIED_PRECONDITIONS.length,
  );
  assert.equal(allVerifiedPreconditionsMet(fullVerifiedPreconditions()), true);

  const promoted = attemptPromoteToVerified({
    receipt: verified,
    preconditions: fullVerifiedPreconditions(),
  });
  assert.ok(!('denied' in promoted));
  assert.equal(promoted.acceleratorVerified, true);
});

test('safety denies: install/BIOS/overclock/cloud/deploy', () => {
  assert.equal(attemptAutoInstallDriversOrRuntimes().state, 'DENIED');
  assert.equal(attemptAlterBiosFirmware().state, 'DENIED');
  assert.equal(attemptOverclock().state, 'DENIED');
  assert.equal(attemptPrivilegeEscalation().state, 'DENIED');
  assert.equal(attemptAutonomousCloudProvisioning().state, 'DENIED');
  assert.equal(attemptProductionDeploy().state, 'DENIED');
  assert.equal(attemptMainMerge().state, 'DENIED');
  assert.equal(attemptPermissionExpansion().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
});

test('receipt to home base; guardian isolation unchanged', () => {
  const adapter = registerIntelAdapter({
    actor: agent,
    adapterId: 'a3',
    intelDeviceModel: 'Intel CPU',
    deviceClass: 'intel_cpu',
    architectureGeneration: 'gen',
    driverRuntimeVersions: 'ov',
    openVinoState: 'AVAILABLE',
    oneApiState: 'NOT_TESTED',
    onnxCompatibility: 'COMPATIBLE',
    supportedPrecisions: 'fp32',
    modelCompatibility: 'ok',
    memoryRequirements: '1GB',
    requestedDevice: 'INTEL_CPU',
    actualExecutionDevice: 'INTEL_CPU',
  });
  assert.ok(!('denied' in adapter));
  const receipt = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r-home',
    requestedDevice: 'INTEL_CPU',
    actualDevice: 'INTEL_CPU',
    latency: '8ms',
    throughput: '120',
    resourceUsage: 'cpu',
    benchmarkReference: 'bm-cpu-1',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
  });
  assert.ok(!('denied' in receipt));
  const home = returnReceiptToHomeBase({ receipt, actor: agent });
  assert.ok(!('denied' in home));
  assert.equal(home.authorityGranted, false);
  assert.equal(home.flow[2], 'intel_adapter');

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('soft-wire EP8/EP7/EP6/EP5/EP1 present; cycle hops complete', () => {
  const boot = bootstrapIntelAdapterResearchPath(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.fields.length, 19);
  assert.equal(boot.verifiedPreconditions.length, 6);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const soft = ep9SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep8NvidiaAdapter.present, true);
  assert.equal(soft.ep7AmdAdapter.present, true);
  assert.equal(soft.ep6HardwareTruthProbe.present, true);
  assert.equal(soft.ep5BenchmarkMemory.present, true);
  assert.equal(soft.ep1VirtualChipContract.present, true);

  const cycle = runIntelAdapterResearchCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, INTEL_ADAPTER_RESEARCH_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of INTEL_ADAPTER_RESEARCH_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.adapter));
  assert.ok(!('denied' in cycle.receiptFallback));
  assert.equal(cycle.receiptFallback.fallbackUsed, true);
  assert.ok(!('denied' in cycle.receiptVerified));
  assert.equal(cycle.receiptVerified.state, 'VERIFIED');
});
