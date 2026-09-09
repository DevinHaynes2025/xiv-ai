/**
 * 62L-EP10 — Other Accelerator Registry denial + honesty tests.
 *
 * Script: npm run test:62lep10
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  ACCELERATOR_CATEGORIES,
  ACCELERATOR_RECORD_FIELDS,
  ACCELERATOR_REGISTRY_AGENT_BOUNDS,
  ACCELERATOR_STATE_PROGRESSION,
  ACCELERATOR_TRUTH_STATES,
  AUTOMOTIVE_CAPABILITY_POSTURES,
  CLOUD_USABILITY_PRECONDITIONS,
  EP10_DB_CANDIDATES_STATUS,
  EP10_LOCKS,
  EP10_MAY,
  EP10_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  OTHER_ACCELERATOR_REGISTRY_CYCLE,
  QUANTUM_LADDER_STATES,
  assertEp10LocksIntact,
  ep10SoftWireSnapshot,
  evidenceTrustRank,
  type Ep10Actor,
} from './other-accelerator-registry-types.ts';

import {
  advanceProviderState,
  allCloudPreconditionsMet,
  attemptAutomotiveVerifiedWithoutAuthorizedTest,
  attemptCloudDataMovementFromRegistry,
  attemptCloudSpendFromRegistry,
  attemptEquateDocumentedWithVerified,
  attemptEquateTheoreticalWithPhysicalQpu,
  attemptFavorManufacturerByName,
  attemptImplyCompatibilityFromRegistry,
  attemptImplyHardwareAccessFromRegistry,
  attemptImplyPartnershipFromRegistry,
  attemptRecommendAsAct,
  bootstrapOtherAcceleratorRegistry,
  compareVendorsByEvidence,
  evaluateCloudUsability,
  probeGuardianRlsTenantUniverseIsolation,
  registerAcceleratorProvider,
  requireHumanApproval,
  returnRegistryEvidenceToHomeBase,
  runOtherAcceleratorRegistryCycle,
} from './other-accelerator-registry-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const agent: Ep10Actor = {
  kind: 'accelerator_registry',
  id: 'reg-1',
  orgId: 'org-ep10',
  tenantId: 'ten-ep10',
  universeId: 'uni-ep10',
  permissions: ['draft'],
};

const human: Ep10Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep10',
  tenantId: 'ten-ep10',
  universeId: 'uni-ep10',
  permissions: ['approve_consequential'],
};

function baseProvider(
  overrides: Partial<Parameters<typeof registerAcceleratorProvider>[0]> & {
    providerId: string;
    category: Parameters<typeof registerAcceleratorProvider>[0]['category'];
    manufacturerName: string;
  },
) {
  return registerAcceleratorProvider({
    actor: agent,
    deviceFamily: 'family',
    deviceModel: 'model',
    deviceType: 'accelerator',
    architecture: 'arch',
    runtimeSdk: 'sdk',
    supportedOs: 'os',
    modelFormats: 'onnx',
    supportedPrecisions: 'fp16',
    memory: '8GB',
    documentedCapabilities: 'docs',
    privacyLocality: 'local',
    ...overrides,
  });
}

test('SoT label EP10 / #160; GitLab mirror not invented; next EP11', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP10');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Other Accelerator Registry/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP11/);
  assert.match(NEXT_PHASE_TITLE, /Virtual Instruction/);
});

test('honesty locks: L4 false; no manufacturer favoritism; DB NOT_APPLIED', () => {
  assert.equal(assertEp10LocksIntact(), true);
  assert.equal(EP10_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP10_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP10_LOCKS.MANUFACTURER_NAME_EQ_TRUST, false);
  assert.equal(EP10_LOCKS.REGISTRY_PRESENCE_EQ_PARTNERSHIP, false);
  assert.equal(EP10_LOCKS.CLOUD_REGISTRY_EQ_SPEND_AUTHORIZED, false);
  assert.equal(EP10_LOCKS.TIP_LAND, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
  assert.equal(
    ACCELERATOR_REGISTRY_AGENT_BOUNDS.mayFavorManufacturerByName,
    false,
  );
});

test('categories + fields + states + quantum + cloud preconditions encoded', () => {
  assert.equal(ACCELERATOR_CATEGORIES.length, 8);
  assert.ok(ACCELERATOR_CATEGORIES.includes('apple_cpu_gpu_neural_engine'));
  assert.ok(ACCELERATOR_CATEGORIES.includes('future_qpu_providers'));
  assert.equal(ACCELERATOR_RECORD_FIELDS.length, 17);
  assert.ok(ACCELERATOR_RECORD_FIELDS.includes('providerId'));
  assert.ok(ACCELERATOR_RECORD_FIELDS.includes('measuredCapabilities'));
  assert.deepEqual([...ACCELERATOR_STATE_PROGRESSION], [
    'UNKNOWN',
    'DOCUMENTED',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
  ]);
  assert.ok(ACCELERATOR_TRUTH_STATES.includes('NOT_TESTED'));
  assert.deepEqual([...QUANTUM_LADDER_STATES], [
    'THEORETICAL',
    'SIMULATED',
    'QUANTUM_INSPIRED',
    'PHYSICAL_QPU_VERIFIED',
  ]);
  assert.equal(CLOUD_USABILITY_PRECONDITIONS.length, 4);
  assert.deepEqual([...AUTOMOTIVE_CAPABILITY_POSTURES], [
    'RESEARCH',
    'SIMULATION',
    'AUTHORIZED_PLATFORM_TESTED',
  ]);
  assert.ok(EP10_MAY.length > 0);
  assert.ok(EP10_MUST_NOT.includes('favor_vendor_by_manufacturer_name'));
});

test('same evidence standard; manufacturer name ignored', () => {
  const apple = baseProvider({
    providerId: 'apple',
    category: 'apple_cpu_gpu_neural_engine',
    manufacturerName: 'Apple',
    verificationState: 'DOCUMENTED',
  });
  const obscure = baseProvider({
    providerId: 'obscure',
    category: 'specialized_inference_asics',
    manufacturerName: 'ObscureXYZ',
    verificationState: 'DOCUMENTED',
  });
  assert.ok(!('denied' in apple));
  assert.ok(!('denied' in obscure));
  assert.equal(
    evidenceTrustRank(apple.verificationState, apple.manufacturerName),
    evidenceTrustRank(obscure.verificationState, obscure.manufacturerName),
  );
  const cmp = compareVendorsByEvidence({ a: apple, b: obscure });
  assert.equal(cmp.manufacturerIgnored, true);
  assert.equal(attemptFavorManufacturerByName().state, 'DENIED');

  const favor = baseProvider({
    providerId: 'fav',
    category: 'qualcomm_cpu_gpu_hexagon_npu',
    manufacturerName: 'Qualcomm',
    attemptFavorManufacturer: true,
  });
  assert.equal('denied' in favor && favor.state, 'DENIED');
});

test('registry presence ≠ partnership/certification/access/compatibility', () => {
  assert.equal(attemptImplyPartnershipFromRegistry().state, 'DENIED');
  assert.equal(attemptImplyHardwareAccessFromRegistry().state, 'DENIED');
  assert.equal(attemptImplyCompatibilityFromRegistry().state, 'DENIED');
  assert.equal(attemptEquateDocumentedWithVerified().state, 'DENIED');

  const r = baseProvider({
    providerId: 'p1',
    category: 'arm_based_edge_accelerators',
    manufacturerName: 'ARM-edge',
    attemptImplyPartnership: true,
  });
  assert.equal('denied' in r && r.state, 'DENIED');
});

test('automotive research/simulation until authorized platform tested', () => {
  const auto = baseProvider({
    providerId: 'auto1',
    category: 'automotive_adas_compute',
    manufacturerName: 'AutoCo',
    automotivePosture: 'RESEARCH',
    verificationState: 'DOCUMENTED',
  });
  assert.ok(!('denied' in auto));
  assert.equal(auto.automotivePosture, 'RESEARCH');
  assert.equal(attemptAutomotiveVerifiedWithoutAuthorizedTest().state, 'DENIED');

  const bad = baseProvider({
    providerId: 'auto-bad',
    category: 'automotive_adas_compute',
    manufacturerName: 'AutoCo',
    automotivePosture: 'SIMULATION',
    verificationState: 'VERIFIED',
  });
  assert.equal('denied' in bad && bad.state, 'DENIED');
});

test('cloud presence ≠ spend/data movement; usability needs preconditions', () => {
  const cloud = baseProvider({
    providerId: 'cloud1',
    category: 'cloud_inference_accelerators',
    manufacturerName: 'CloudCo',
    privacyLocality: 'region-bound',
  });
  assert.ok(!('denied' in cloud));
  assert.equal(attemptCloudSpendFromRegistry().state, 'DENIED');
  assert.equal(attemptCloudDataMovementFromRegistry().state, 'DENIED');

  const spend = evaluateCloudUsability({
    record: cloud,
    preconditions: {},
    attemptSpendFromRegistry: true,
  });
  assert.equal('denied' in spend && spend.state, 'DENIED');

  const incomplete = evaluateCloudUsability({
    record: cloud,
    preconditions: { credentials_present: true },
    attemptUseWithoutPreconditions: true,
  });
  assert.equal('denied' in incomplete && incomplete.state, 'DENIED');

  const full = {
    explicit_organization_authorization: true,
    credentials_present: true,
    region_data_policy_approval: true,
    measured_runtime_evidence: true,
  };
  assert.equal(allCloudPreconditionsMet(full), true);
  const ok = evaluateCloudUsability({ record: cloud, preconditions: full });
  assert.ok(!('denied' in ok));
  assert.equal(ok.usable, true);
  assert.equal(ok.spendAuthorized, false);
});

test('quantum ladder; THEORETICAL ≠ PHYSICAL_QPU_VERIFIED', () => {
  const qpu = baseProvider({
    providerId: 'qpu1',
    category: 'future_qpu_providers',
    manufacturerName: 'QPUCo',
    quantumLadder: 'THEORETICAL',
    verificationState: 'DOCUMENTED',
  });
  assert.ok(!('denied' in qpu));
  assert.equal(qpu.quantumLadder, 'THEORETICAL');
  assert.equal(attemptEquateTheoreticalWithPhysicalQpu().state, 'DENIED');

  const bad = baseProvider({
    providerId: 'qpu-bad',
    category: 'future_qpu_providers',
    manufacturerName: 'QPUCo',
    quantumLadder: 'SIMULATED',
    verificationState: 'VERIFIED',
  });
  assert.equal('denied' in bad && bad.state, 'DENIED');
});

test('advance to VERIFIED needs measured evidence; home base + guardian', () => {
  const rec = baseProvider({
    providerId: 'edge1',
    category: 'industrial_ai_accelerators',
    manufacturerName: 'IndustrialCo',
    verificationState: 'SUPPORTED',
  });
  assert.ok(!('denied' in rec));
  const noMeasure = advanceProviderState({ record: rec, to: 'VERIFIED' });
  assert.equal('denied' in noMeasure && noMeasure.state, 'DENIED');
  const verified = advanceProviderState({
    record: rec,
    to: 'VERIFIED',
    measuredEvidence: true,
  });
  assert.ok(!('denied' in verified));
  assert.equal(verified.verificationState, 'VERIFIED');
  assert.ok(verified.lastVerifiedAt);

  const ev = returnRegistryEvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: agent,
    summary: 'registry advisory',
  });
  assert.ok(!('denied' in ev));
  assert.equal(ev.authorityGranted, false);
  assert.equal(attemptRecommendAsAct().state, 'DENIED');
  assert.equal(probeGuardianRlsTenantUniverseIsolation().state, 'PASS');
  const gate = requireHumanApproval({
    approvalId: 'a1',
    actor: human,
    action: 'approve_consequential',
  });
  assert.ok(!('denied' in gate));
});

test('soft-wire EP9/EP8/EP7/EP5/EP1 present; cycle hops complete', () => {
  const boot = bootstrapOtherAcceleratorRegistry(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.categories.length, 8);
  assert.equal(boot.fields.length, 17);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const soft = ep10SoftWireSnapshot(repoRoot);
  assert.equal(soft.ep9IntelAdapter.present, true);
  assert.equal(soft.ep8NvidiaAdapter.present, true);
  assert.equal(soft.ep7AmdAdapter.present, true);
  assert.equal(soft.ep5BenchmarkMemory.present, true);
  assert.equal(soft.ep1VirtualChipContract.present, true);

  const cycle = runOtherAcceleratorRegistryCycle({
    actor: agent,
    human,
    repoRoot,
  });
  assert.equal(cycle.hops.length, OTHER_ACCELERATOR_REGISTRY_CYCLE.length);
  const hopNames = cycle.hops.map((h) => h.hop);
  for (const expected of OTHER_ACCELERATOR_REGISTRY_CYCLE) {
    assert.ok(hopNames.includes(expected), `missing hop ${expected}`);
  }
  const realFails = cycle.hops.filter((h) => h.state === 'FAIL');
  assert.equal(realFails.length, 0, JSON.stringify(realFails));
  assert.ok(!('denied' in cycle.apple));
  assert.ok(!('denied' in cycle.automotive));
  assert.equal(cycle.automotive.automotivePosture, 'RESEARCH');
  assert.ok(!('denied' in cycle.cloud));
  assert.ok(!('denied' in cycle.qpu));
  assert.equal(cycle.qpu.quantumLadder, 'THEORETICAL');
});
