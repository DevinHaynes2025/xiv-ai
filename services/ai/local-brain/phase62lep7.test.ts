/**
 * 62L-EP7 — AMD Adapter Research Path denial + honesty tests.
 *
 * Script: npm run test:62lep7
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  AMD_ADAPTER_AGENT_BOUNDS,
  AMD_ADAPTER_CORE_FLOW,
  AMD_ADAPTER_FIELDS,
  AMD_ADAPTER_MUST_NOT,
  AMD_ADAPTER_RESEARCH_CYCLE,
  AMD_ADAPTER_STATES,
  AMD_EXECUTION_DEVICES,
  AMD_FAILURE_CLASSES,
  AMD_VERIFIED_PRECONDITIONS,
  EP7_DB_CANDIDATES_STATUS,
  EP7_LOCKS,
  EP7_MAY,
  EP7_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  assertEp7LocksIntact,
  ep7SoftWireSnapshot,
  isSilentCpuFallback,
  type Ep7Actor,
} from './amd-adapter-research-path-types.ts';

import {
  allVerifiedPreconditionsMet,
  attemptAlterBiosFirmware,
  attemptAutoInstallDrivers,
  attemptBypassWindowsSecurity,
  attemptClaimVerifiedOnSilentCpuFallback,
  attemptCloudPurchasing,
  attemptMainMerge,
  attemptOverclock,
  attemptPermissionExpansion,
  attemptProductionDeploy,
  attemptRecommendAsAct,
  attemptUndervolt,
  bootstrapAmdAdapterResearchPath,
  fullVerifiedPreconditions,
  probeGuardianRlsTenantUniverseIsolation,
  registerAmdAdapter,
  requireHumanApproval,
  returnReceiptToHomeBase,
  runAmdAdapterResearchCycle,
  runBoundedInference,
  attemptPromoteToVerified,
} from './amd-adapter-research-path-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep7Actor = {
  kind: 'amd_adapter',
  id: 'amd-1',
  orgId: 'org-ep7',
  tenantId: 'ten-ep7',
  universeId: 'uni-ep7',
  permissions: ['draft'],
};

const human: Ep7Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep7',
  tenantId: 'ten-ep7',
  universeId: 'uni-ep7',
  permissions: ['approve_consequential'],
};

test('SoT label EP7 / #160; GitLab mirror not invented; next EP8', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP7');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /AMD Adapter Research Path/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP8/);
  assert.match(NEXT_PHASE_TITLE, /NVIDIA Adapter Research Path/);
});

test('honesty locks: L4 false; silent CPU fallback ≠ VERIFIED; DB NOT_APPLIED', () => {
  assert.equal(assertEp7LocksIntact(), true);
  assert.equal(EP7_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP7_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP7_LOCKS.SILENT_CPU_FALLBACK_EQ_VERIFIED, false);
  assert.equal(EP7_LOCKS.ACCELERATOR_VERIFIED_ON_CPU_FALLBACK, false);
  assert.equal(EP7_LOCKS.AUTO_INSTALL_DRIVERS, false);
  assert.equal(EP7_LOCKS.PRODUCTION_DEPLOYMENT, false);
  assert.equal(EP7_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    AMD_ADAPTER_AGENT_BOUNDS.mayClaimVerifiedOnSilentCpuFallback,
    false,
  );
});

test('core flow + fields + states + preconditions encoded', () => {
  assert.deepEqual([...AMD_ADAPTER_CORE_FLOW], [
    'agent_task',
    'virtual_chip_registry',
    'amd_adapter',
    'runtime_provider_check',
    'bounded_inference',
    'return_receipt',
    'benchmark_memory',
    'xiv_home_base',
  ]);
  assert.equal(AMD_ADAPTER_FIELDS.length, 16);
  assert.ok(AMD_ADAPTER_FIELDS.includes('adapterId'));
  assert.ok(AMD_ADAPTER_FIELDS.includes('actualExecutionDevice'));
  assert.ok(AMD_ADAPTER_FIELDS.includes('fallbackPath'));

  assert.deepEqual([...AMD_ADAPTER_STATES], [
    'UNKNOWN',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
    'NOT_TESTED',
    'DEGRADED',
    'UNAVAILABLE',
  ]);
  assert.ok(AMD_EXECUTION_DEVICES.includes('cpu_fallback'));
  assert.equal(AMD_VERIFIED_PRECONDITIONS.length, 8);
  assert.ok(AMD_FAILURE_CLASSES.includes('silent_cpu_fallback'));
  assert.ok(AMD_ADAPTER_MUST_NOT.includes('automatically_install_drivers'));
  assert.ok(EP7_MAY.length > 0);
  assert.ok(EP7_MUST_NOT.includes('claim_verified_after_silent_cpu_fallback'));
});

test('silent CPU fallback recorded; accelerator remains unverified', () => {
  assert.equal(
    isSilentCpuFallback({
      intendedDevice: 'amd_gpu',
      actualExecutionDevice: 'cpu_fallback',
    }),
    true,
  );
  assert.equal(
    isSilentCpuFallback({
      intendedDevice: 'amd_npu',
      actualExecutionDevice: 'amd_cpu',
    }),
    true,
  );
  assert.equal(
    isSilentCpuFallback({
      intendedDevice: 'amd_gpu',
      actualExecutionDevice: 'amd_gpu',
    }),
    false,
  );

  const adapter = registerAmdAdapter({
    actor: agent,
    adapterId: 'a1',
    amdDeviceModel: 'AMD GPU',
    windowsVersion: 'Win11',
    runtimeProvider: 'ort',
    modelCompatibility: 'candidate',
    precision: 'fp16',
    memoryRequirement: '2GB',
    providerInitializationState: 'initialized',
    intendedDevice: 'amd_gpu',
    actualExecutionDevice: 'cpu_fallback',
  });
  assert.ok(!('denied' in adapter));
  assert.equal(adapter.silentCpuFallback, true);
  assert.equal(adapter.acceleratorVerified, false);
  assert.equal(adapter.failureClass, 'silent_cpu_fallback');

  const receipt = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r1',
    intendedDevice: 'amd_gpu',
    actualExecutionDevice: 'cpu_fallback',
    latency: '10ms',
    throughput: '50',
    resourceUsage: 'cpu',
    benchmarkReference: 'bm-1',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
    cpuFallbackTestedSeparately: true,
  });
  assert.ok(!('denied' in receipt));
  assert.equal(receipt.silentCpuFallback, true);
  assert.equal(receipt.fallbackRecorded, true);
  assert.equal(receipt.acceleratorRemainsUnverified, true);
  assert.equal(receipt.state, 'NOT_TESTED');
  assert.equal(attemptClaimVerifiedOnSilentCpuFallback().state, 'DENIED');

  const claim = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r-claim',
    intendedDevice: 'amd_gpu',
    actualExecutionDevice: 'cpu_fallback',
    latency: '10ms',
    throughput: '50',
    resourceUsage: 'cpu',
    benchmarkReference: 'bm-1',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
    cpuFallbackTestedSeparately: true,
    attemptClaimVerifiedOnSilentFallback: true,
  });
  assert.equal('denied' in claim && claim.state, 'DENIED');

  const promote = attemptPromoteToVerified({
    receipt,
    preconditions: fullVerifiedPreconditions(),
  });
  assert.equal('denied' in promote && promote.state, 'DENIED');
});

test('VERIFIED requires all preconditions on intended AMD device', () => {
  const adapter = registerAmdAdapter({
    actor: agent,
    adapterId: 'a2',
    amdDeviceModel: 'AMD GPU',
    windowsVersion: 'Win11',
    runtimeProvider: 'ort-directml',
    modelCompatibility: 'ok',
    precision: 'fp16',
    memoryRequirement: '2GB',
    providerInitializationState: 'initialized',
    intendedDevice: 'amd_gpu',
    actualExecutionDevice: 'amd_gpu',
    state: 'SUPPORTED',
  });
  assert.ok(!('denied' in adapter));

  const incomplete = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r-inc',
    intendedDevice: 'amd_gpu',
    actualExecutionDevice: 'amd_gpu',
    latency: '4ms',
    throughput: '200',
    resourceUsage: 'gpu',
    benchmarkReference: '',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
    cpuFallbackTestedSeparately: false,
    attemptVerifyWithoutPreconditions: true,
  });
  assert.equal('denied' in incomplete && incomplete.state, 'DENIED');

  const verified = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r-ok',
    intendedDevice: 'amd_gpu',
    actualExecutionDevice: 'amd_gpu',
    latency: '4ms',
    throughput: '200',
    resourceUsage: 'gpu',
    benchmarkReference: 'bm-gpu-1',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
    cpuFallbackTestedSeparately: true,
  });
  assert.ok(!('denied' in verified));
  assert.equal(verified.state, 'VERIFIED');
  assert.equal(
    verified.preconditionsMet.length,
    AMD_VERIFIED_PRECONDITIONS.length,
  );
  assert.equal(allVerifiedPreconditionsMet(fullVerifiedPreconditions()), true);

  const promoted = attemptPromoteToVerified({
    receipt: verified,
    preconditions: fullVerifiedPreconditions(),
  });
  assert.ok(!('denied' in promoted));
  assert.equal(promoted.state, 'VERIFIED');
  assert.equal(promoted.acceleratorVerified, true);
});

test('forbidden: drivers/BIOS/overclock/undervolt/security/deploy/cloud', () => {
  assert.equal(attemptAutoInstallDrivers().state, 'DENIED');
  assert.equal(attemptAlterBiosFirmware().state, 'DENIED');
  assert.equal(attemptOverclock().state, 'DENIED');
  assert.equal(attemptUndervolt().state, 'DENIED');
  assert.equal(attemptBypassWindowsSecurity().state, 'DENIED');
  assert.equal(attemptProductionDeploy().state, 'DENIED');
  assert.equal(attemptMainMerge().state, 'DENIED');
  assert.equal(attemptPermissionExpansion().state, 'DENIED');
  assert.equal(attemptCloudPurchasing().state, 'DENIED');
  assert.equal(attemptRecommendAsAct().state, 'DENIED');

  const blocked = registerAmdAdapter({
    actor: agent,
    adapterId: 'bad',
    amdDeviceModel: 'x',
    windowsVersion: 'w',
    runtimeProvider: 'r',
    modelCompatibility: 'c',
    precision: 'fp32',
    memoryRequirement: '1',
    providerInitializationState: 'init',
    intendedDevice: 'amd_cpu',
    actualExecutionDevice: 'amd_cpu',
    attemptOverclock: true,
  });
  assert.equal('denied' in blocked && blocked.state, 'DENIED');
});

test('receipt returns to home base via core flow; guardian isolation', () => {
  const adapter = registerAmdAdapter({
    actor: agent,
    adapterId: 'a3',
    amdDeviceModel: 'AMD CPU',
    windowsVersion: 'Win11',
    runtimeProvider: 'ort',
    modelCompatibility: 'ok',
    precision: 'fp32',
    memoryRequirement: '1GB',
    providerInitializationState: 'initialized',
    intendedDevice: 'amd_cpu',
    actualExecutionDevice: 'amd_cpu',
  });
  assert.ok(!('denied' in adapter));
  const receipt = runBoundedInference({
    actor: agent,
    adapter,
    receiptId: 'r-home',
    intendedDevice: 'amd_cpu',
    actualExecutionDevice: 'amd_cpu',
    latency: '8ms',
    throughput: '100',
    resourceUsage: 'cpu',
    benchmarkReference: 'bm-cpu-1',
    modelLoadSucceeded: true,
    inferenceSucceeded: true,
    executionDeviceConfirmed: true,
    cpuFallbackTestedSeparately: true,
  });
  assert.ok(!('denied' in receipt));
  const home = returnReceiptToHomeBase({ receipt, actor: agent });
  assert.ok(!('denied' in home));
  assert.equal(home.returnedToHomeBase, true);
  assert.equal(home.authorityGranted, false);
  assert.equal(home.flow[0], 'agent_task');
  assert.equal(home.flow[home.flow.length - 1], 'xiv_home_base');

  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
});

test('soft-wire EP6/EP5/EP1 present; cycle hops complete', () => {
  const boot = bootstrapAmdAdapterResearchPath(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.fields.length, 16);
  assert.equal(boot.verifiedPreconditions.length, 8);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const soft = ep7SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep6HardwareTruthProbe.present, true);
  assert.equal(soft.ep5BenchmarkMemory.present, true);
  assert.equal(soft.ep1VirtualChipContract.present, true);

  const cycle = runAmdAdapterResearchCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, AMD_ADAPTER_RESEARCH_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of AMD_ADAPTER_RESEARCH_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.adapter));
  assert.ok(!('denied' in cycle.receiptFallback));
  assert.equal(cycle.receiptFallback.silentCpuFallback, true);
  assert.ok(!('denied' in cycle.receiptVerified));
  assert.equal(cycle.receiptVerified.state, 'VERIFIED');
});
