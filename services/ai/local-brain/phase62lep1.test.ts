/**
 * 62L-EP1 — Virtual Chip Contract denial + honesty tests.
 *
 * Script: npm run test:62lep1
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EP1_DB_CANDIDATES_STATUS,
  EP1_LOCKS,
  EP1_MAY,
  EP1_MUST_NOT,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEURAL_COMPUTE_PATHWAY,
  NEXT_PHASE_TITLE,
  QUANTUM_CLAIM_STATES,
  VIRTUAL_CHIP_AGENT_BOUNDS,
  VIRTUAL_CHIP_CAPABILITY_STATES,
  VIRTUAL_CHIP_CONTRACT_CYCLE,
  VIRTUAL_CHIP_CONTRACT_FIELDS,
  VIRTUAL_CHIP_DEVICE_CLASSES,
  VIRTUAL_CHIP_SOFTWARE_CAPABILITIES,
  VIRTUAL_CHIP_VENDOR_FAMILIES,
  assertEp1LocksIntact,
  defaultCapabilityState,
  ep1SoftWireSnapshot,
  type Ep1Actor,
} from './virtual-chip-contract-types.ts';

import {
  attemptAgentAutoAuthority,
  attemptAutonomousDeviceControl,
  attemptClaimSiliconModification,
  attemptRawPrivacyCollectionWithoutOptIn,
  attachSoftwareLayerCapabilities,
  bootstrapVirtualChipContract,
  labelCapabilityState,
  labelQuantumClaim,
  linkNeuralComputePathway,
  probeGuardianRlsTenantUniverseIsolation,
  registerVirtualChipContract,
  requireHumanApproval,
  returnAgentEvidenceToHomeBase,
  runVirtualChipContractCycle,
} from './virtual-chip-contract-runtime.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const architect: Ep1Actor = {
  kind: 'virtual_chip_architect',
  id: 'vc-arch-1',
  orgId: 'org-ep1',
  tenantId: 'ten-ep1',
  universeId: 'uni-ep1',
  permissions: ['draft'],
};

const human: Ep1Actor = {
  kind: 'human_approver',
  id: 'human-1',
  orgId: 'org-ep1',
  tenantId: 'ten-ep1',
  universeId: 'uni-ep1',
  permissions: ['approve_consequential', 'authorize_runtime_verification'],
};

test('SoT label EP1 / #160; GitLab mirror not invented; next EP2', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP1');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Virtual Chip Contract/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP2/);
  assert.match(NEXT_PHASE_TITLE, /Cross-Vendor/);
});

test('honesty locks: L4 false + DOCUMENTED≠IMPLEMENTED≠VERIFIED≠PRODUCTION; DB NOT_APPLIED', () => {
  assert.equal(assertEp1LocksIntact(), true);
  assert.equal(EP1_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(EP1_DB_CANDIDATES_STATUS, 'NOT_APPLIED');
  assert.equal(EP1_LOCKS.TIP_LAND, false);
  assert.equal(EP1_LOCKS.PRODUCTION_AUTHORIZATION, false);
  assert.equal(EP1_LOCKS.MANAGE_PULL_REQUEST, false);
  assert.equal(EP1_LOCKS.DOCUMENTED_EQ_IMPLEMENTED, false);
  assert.equal(EP1_LOCKS.IMPLEMENTED_EQ_VERIFIED, false);
  assert.equal(EP1_LOCKS.VERIFIED_EQ_PRODUCTION_AUTHORIZED, false);
  assert.equal(EP1_LOCKS.VIRTUAL_CHIP_EQ_SILICON_MODIFICATION, false);
  assert.equal(EP1_LOCKS.DETECTED_EQ_VERIFIED, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('vendors + device classes + fields + software caps + pathway encoded', () => {
  assert.equal(VIRTUAL_CHIP_VENDOR_FAMILIES.length, 8);
  for (const v of [
    'amd',
    'nvidia',
    'intel',
    'apple',
    'qualcomm',
    'edge_generic',
    'cloud_accelerator',
    'qpu_path_candidate',
  ] as const) {
    assert.ok(VIRTUAL_CHIP_VENDOR_FAMILIES.includes(v), v);
  }

  assert.deepEqual(
    [...VIRTUAL_CHIP_DEVICE_CLASSES],
    ['cpu', 'gpu', 'npu', 'accelerator', 'hybrid', 'qpu_path'],
  );

  assert.deepEqual(
    [...VIRTUAL_CHIP_CAPABILITY_STATES],
    [
      'UNKNOWN',
      'DETECTED',
      'CANDIDATE',
      'SUPPORTED',
      'VERIFIED',
      'NOT_AVAILABLE',
    ],
  );

  assert.equal(VIRTUAL_CHIP_SOFTWARE_CAPABILITIES.length, 8);
  assert.ok(VIRTUAL_CHIP_SOFTWARE_CAPABILITIES.includes('routing'));
  assert.ok(VIRTUAL_CHIP_SOFTWARE_CAPABILITIES.includes('quantization'));

  assert.equal(VIRTUAL_CHIP_CONTRACT_FIELDS.length, 15);
  assert.ok(VIRTUAL_CHIP_CONTRACT_FIELDS.includes('virtualChipId'));
  assert.ok(VIRTUAL_CHIP_CONTRACT_FIELDS.includes('siliconModificationClaimed'));

  assert.deepEqual(
    [...NEURAL_COMPUTE_PATHWAY],
    [
      'workload',
      'model',
      'runtime',
      'device',
      'benchmark',
      'outcome',
      'lesson',
      'updated_routing_policy',
    ],
  );

  assert.equal(defaultCapabilityState({ detected: true }), 'DETECTED');
  assert.equal(
    defaultCapabilityState({ architectureListed: true }),
    'CANDIDATE',
  );
  assert.equal(
    defaultCapabilityState({ runtimeEvidencePresent: true }),
    'VERIFIED',
  );
});

test('virtual chip ≠ silicon modification; vendor silicon claims denied', () => {
  for (const vendor of [
    'amd',
    'nvidia',
    'intel',
    'apple',
    'qualcomm',
  ] as const) {
    const denied = attemptClaimSiliconModification(vendor);
    assert.equal(denied.state, 'DENIED');
    assert.equal(denied.siliconModified, false);
  }

  const regDenied = registerVirtualChipContract({
    virtualChipId: 'vc-bad',
    vendorFamily: 'nvidia',
    deviceClass: 'gpu',
    actor: architect,
    attemptClaimSiliconModification: true,
  });
  assert.equal('denied' in regDenied && regDenied.denied, true);

  const attachDenied = attachSoftwareLayerCapabilities({
    virtualChipId: 'vc-1',
    capabilities: ['routing', 'batching'],
    attemptClaimSiliconModification: true,
  });
  assert.equal('denied' in attachDenied && attachDenied.denied, true);

  assert.ok(EP1_MUST_NOT.includes('claim_silicon_modification'));
  assert.ok(EP1_MAY.includes('register_virtual_chip_contracts'));
});

test('DETECTED ≠ VERIFIED; VERIFIED requires runtime evidence', () => {
  const denied = labelCapabilityState({
    virtualChipId: 'vc-1',
    desiredState: 'VERIFIED',
    runtimeEvidencePresent: false,
  });
  assert.equal('denied' in denied && denied.denied, true);

  const detected = labelCapabilityState({
    virtualChipId: 'vc-1',
    desiredState: 'DETECTED',
  });
  assert.equal('denied' in detected, false);

  const verified = labelCapabilityState({
    virtualChipId: 'vc-1',
    desiredState: 'VERIFIED',
    runtimeEvidencePresent: true,
  });
  assert.equal('denied' in verified, false);

  const regDenied = registerVirtualChipContract({
    virtualChipId: 'vc-v-bad',
    vendorFamily: 'amd',
    deviceClass: 'npu',
    actor: architect,
    claimVerifiedWithoutRuntimeEvidence: true,
  });
  assert.equal('denied' in regDenied && regDenied.denied, true);

  const ok = registerVirtualChipContract({
    virtualChipId: 'vc-ok',
    vendorFamily: 'intel',
    deviceClass: 'cpu',
    actor: architect,
    architectureListed: true,
  });
  assert.equal('denied' in ok, false);
  if (!('denied' in ok)) {
    assert.equal(ok.capabilityState, 'CANDIDATE');
    assert.equal(ok.siliconModificationClaimed, false);
    assert.equal(ok.privacyCollectionEnabled, false);
  }
});

test('quantum ladder; PHYSICAL_QPU_VERIFIED denied without authorized evidence', () => {
  assert.deepEqual(
    [...QUANTUM_CLAIM_STATES],
    ['THEORETICAL', 'SIMULATED', 'QUANTUM_INSPIRED', 'PHYSICAL_QPU_VERIFIED'],
  );

  const theo = labelQuantumClaim({ claimId: 'q1', state: 'THEORETICAL' });
  assert.equal('denied' in theo, false);

  const denied = labelQuantumClaim({
    claimId: 'q2',
    state: 'PHYSICAL_QPU_VERIFIED',
    authorizedPhysicalQpuEvidencePresent: false,
  });
  assert.equal('denied' in denied && denied.denied, true);
});

test('privacy: no raw GPS/camera/telemetry/trip without opt-in; no device control', () => {
  for (const signal of ['gps', 'camera', 'telemetry', 'trip'] as const) {
    const denied = attemptRawPrivacyCollectionWithoutOptIn(signal);
    assert.equal(denied.state, 'DENIED');
    assert.equal(denied.collected, false);
  }

  const control = attemptAutonomousDeviceControl();
  assert.equal(control.state, 'DENIED');
  assert.equal(control.controlled, false);

  const regDenied = registerVirtualChipContract({
    virtualChipId: 'vc-priv',
    vendorFamily: 'edge_generic',
    deviceClass: 'hybrid',
    actor: architect,
    attemptRawPrivacyCollectionWithoutOptIn: true,
  });
  assert.equal('denied' in regDenied && regDenied.denied, true);

  assert.equal(EP1_LOCKS.POOL_RAW_DRIVING_DATA, false);
  assert.equal(EP1_LOCKS.AUTO_STEERING_BRAKING_THROTTLE, false);
  assert.equal(EP1_LOCKS.AUTO_ECU_MODIFICATION, false);
});

test('software capabilities + neural pathway advisory; agent bounds + guardian', () => {
  const caps = attachSoftwareLayerCapabilities({
    virtualChipId: 'vc-1',
    capabilities: [
      'routing',
      'batching',
      'caching',
      'quantization',
      'scheduling',
      'model_selection',
      'benchmarking',
      'simulation',
    ],
  });
  assert.equal('denied' in caps, false);
  if (!('denied' in caps)) {
    assert.equal(caps.softwareLayerOnly, true);
    assert.equal(caps.siliconModificationClaimed, false);
  }

  const pathway = linkNeuralComputePathway({
    pathwayId: 'np-1',
    virtualChipId: 'vc-1',
  });
  assert.equal(pathway.hops.length, 8);
  assert.equal(pathway.productionAuthorized, false);

  assert.equal(VIRTUAL_CHIP_AGENT_BOUNDS.automaticAuthority, false);
  const autoAuth = attemptAgentAutoAuthority(architect);
  assert.equal(autoAuth.state, 'DENIED');

  const evidence = returnAgentEvidenceToHomeBase({
    evidenceId: 'ev-1',
    actor: architect,
    summary: 'Virtual chip contract candidate registered',
  });
  assert.equal('denied' in evidence, false);

  const isolation = probeGuardianRlsTenantUniverseIsolation();
  assert.equal(isolation.unchanged, true);

  const humanDenied = requireHumanApproval({
    approvalId: 'bad',
    virtualChipId: 'vc-1',
    actor: architect,
    action: 'verify',
  });
  assert.equal('denied' in humanDenied && humanDenied.denied, true);

  const humanOk = requireHumanApproval({
    approvalId: 'ok',
    virtualChipId: 'vc-1',
    actor: human,
    action: 'authorize_runtime_verification_plan',
  });
  assert.equal('denied' in humanOk, false);
});

test('soft-wire EO11/EO10/EM157 probes; EO11+EO10+EM157 present on EO11 tip', () => {
  const snap = ep1SoftWireSnapshot(repoRoot);
  assert.equal(snap.eo11VirtualDataWarehouse.present, true);
  assert.equal(snap.eo11Report.present, true);
  assert.equal(snap.eo10PhysicalProduct.present, true);
  assert.equal(snap.eo10Report.present, true);
  assert.equal(snap.em157HomeBase.present, true);
  assert.equal(typeof snap.em157Report.present, 'boolean');
  assert.equal(typeof snap.emLocalRuntimeOnnx.present, 'boolean');
  assert.equal(typeof snap.em1HomeBaseContract.present, 'boolean');
});

test('cycle covers pack surfaces + bootstrap; register contract', () => {
  for (const required of [
    'vendor_families_encoded',
    'contract_fields_encoded',
    'neural_compute_pathway_encoded',
    'virtual_chip_neq_silicon_modification',
    'detected_neq_verified',
    'no_raw_privacy_collection_without_opt_in',
    'no_autonomous_device_control',
    'l4_autonomy_false',
    'eo11_soft_wire',
    'eo10_soft_wire',
    'em157_soft_wire',
  ] as const) {
    assert.ok(VIRTUAL_CHIP_CONTRACT_CYCLE.includes(required), required);
  }

  const boot = bootstrapVirtualChipContract(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.vendors.length, 8);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const cycle = runVirtualChipContractCycle({
    actor: architect,
    human,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= 15);
  assert.equal('denied' in cycle.contract, false);
  assert.equal(cycle.softWire.eo11VirtualDataWarehouse.present, true);
});
