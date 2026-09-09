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
  CROSS_VENDOR_EXAMPLE_SURFACES,
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
  VIRTUAL_CHIP_CONTRACT_CYCLE,
  VIRTUAL_CHIP_CONTRACT_FIELDS,
  VIRTUAL_CHIP_CORE_FLOW,
  VIRTUAL_CHIP_DEVICE_TYPES,
  VIRTUAL_CHIP_SOFTWARE_CAPABILITIES,
  VIRTUAL_CHIP_VENDOR_FAMILIES,
  VIRTUAL_CHIP_VERIFICATION_STATES,
  assertEp1LocksIntact,
  defaultVerificationState,
  ep1SoftWireSnapshot,
  type Ep1Actor,
} from './virtual-chip-contract-types.ts';

import {
  attemptAgentAutoAuthority,
  attemptAutomaticCloudPurchasing,
  attemptAutonomousDeviceControl,
  attemptClaimAlterTransistorFirmwareIsa,
  attemptClaimSiliconModification,
  attemptCrossTenantDataMovement,
  attemptDriverBiosFirmwareChange,
  attemptOverclockOrThermalBypass,
  attemptPermissionInheritance,
  attemptProprietaryChipSecretIngestion,
  attemptRawPrivacyCollectionWithoutOptIn,
  attachSoftwareLayerCapabilities,
  bootstrapVirtualChipContract,
  encodeCrossVendorExamples,
  labelQuantumClaim,
  labelVerificationState,
  linkNeuralComputePathway,
  probeGuardianRlsTenantUniverseIsolation,
  registerVirtualChipContract,
  requireHumanApproval,
  returnAgentEvidenceToHomeBase,
  returnExecutionReceipt,
  runPolicyResourceChecks,
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

test('SoT label EP1 / #160; GitLab mirror not invented; next EP2 Capability Graph', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EP1');
  assert.equal(GITHUB_SOT_ISSUE, 160);
  assert.match(GITHUB_SOT_TITLE, /Virtual Chip Contract/);
  assert.match(GITLAB_MIRROR_NOTE, /no issue number invented/i);
  assert.match(NEXT_PHASE_TITLE, /EP2/);
  assert.match(NEXT_PHASE_TITLE, /Capability Graph/);
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
  assert.equal(EP1_LOCKS.NOT_TESTED_EQ_VERIFIED, false);
  assert.equal(EP1_LOCKS.DRIVER_BIOS_FIRMWARE_CHANGES, false);
  assert.equal(EP1_LOCKS.AUTOMATIC_CLOUD_PURCHASING, false);
  assert.equal(EP1_LOCKS.CROSS_TENANT_DATA_MOVEMENT, false);
  assert.match(HONESTY_BANNER, /DOCUMENTED/);
});

test('vendors + device types + fields + verification states + core flow encoded', () => {
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
    [...VIRTUAL_CHIP_DEVICE_TYPES],
    ['cpu', 'gpu', 'npu', 'accelerator', 'hybrid', 'qpu_path'],
  );

  assert.deepEqual(
    [...VIRTUAL_CHIP_VERIFICATION_STATES],
    [
      'UNKNOWN',
      'DETECTED',
      'SUPPORTED',
      'VERIFIED',
      'DEGRADED',
      'UNAVAILABLE',
      'NOT_TESTED',
    ],
  );

  assert.equal(VIRTUAL_CHIP_SOFTWARE_CAPABILITIES.length, 10);
  assert.ok(VIRTUAL_CHIP_SOFTWARE_CAPABILITIES.includes('workload_placement'));
  assert.ok(VIRTUAL_CHIP_SOFTWARE_CAPABILITIES.includes('accelerator_fallback'));

  assert.equal(VIRTUAL_CHIP_CONTRACT_FIELDS.length, 23);
  for (const field of [
    'virtualChipId',
    'physicalNodeId',
    'vendor',
    'deviceFamily',
    'deviceType',
    'architecture',
    'runtime',
    'executionProvider',
    'supportedModels',
    'supportedPrecisions',
    'memoryCapacity',
    'measuredLatency',
    'measuredThroughput',
    'energyProxy',
    'costProxy',
    'privacyClass',
    'tenantUniverseScope',
    'resourceLimits',
    'heartbeat',
    'verificationState',
    'benchmarkRefs',
    'lastVerifiedAt',
    'rollbackVersion',
  ] as const) {
    assert.ok(VIRTUAL_CHIP_CONTRACT_FIELDS.includes(field), field);
  }

  assert.deepEqual(
    [...VIRTUAL_CHIP_CORE_FLOW],
    [
      'agent_task',
      'virtual_chip_contract',
      'policy_resource_checks',
      'physical_runtime',
      'execution',
      'return_receipt',
      'xiv_home_base',
    ],
  );

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

  assert.equal(defaultVerificationState({ detected: true }), 'DETECTED');
  assert.equal(
    defaultVerificationState({ supportedDocumented: true }),
    'SUPPORTED',
  );
  assert.equal(
    defaultVerificationState({ runtimeEvidencePresent: true }),
    'VERIFIED',
  );
  assert.equal(defaultVerificationState({ notTested: true }), 'NOT_TESTED');
});

test('cross-vendor examples remain distinct (AMD DETECTED/SUPPORTED/NOT_TESTED vs NVIDIA VERIFIED/PASS)', () => {
  assert.equal(CROSS_VENDOR_EXAMPLE_SURFACES.length, 6);
  const examples = encodeCrossVendorExamples();
  assert.equal(examples.length, 6);
  const amdDetected = examples.find((e) => e.surface === 'amd_radeon_gpu_detected');
  const modelNotTested = examples.find(
    (e) => e.surface === 'model_x_inference_not_tested',
  );
  const nvidiaVerified = examples.find((e) => e.surface === 'nvidia_gpu_verified');
  const benchPass = examples.find((e) => e.surface === 'model_x_benchmark_pass');
  assert.equal(amdDetected?.verificationState, 'DETECTED');
  assert.equal(modelNotTested?.verificationState, 'NOT_TESTED');
  assert.equal(nvidiaVerified?.verificationState, 'VERIFIED');
  assert.equal(benchPass?.verificationState, 'PASS');
});

test('virtual chip ≠ silicon modification; transistor/firmware/ISA claims denied', () => {
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

  const isa = attemptClaimAlterTransistorFirmwareIsa();
  assert.equal(isa.state, 'DENIED');
  assert.equal(isa.altered, false);

  const regDenied = registerVirtualChipContract({
    virtualChipId: 'vc-bad',
    vendor: 'nvidia',
    deviceType: 'gpu',
    actor: architect,
    attemptClaimSiliconModification: true,
  });
  assert.equal('denied' in regDenied && regDenied.denied, true);

  assert.ok(EP1_MUST_NOT.includes('claim_silicon_modification'));
  assert.ok(EP1_MAY.includes('register_virtual_chip_contracts'));
});

test('DETECTED ≠ VERIFIED; NOT_TESTED ≠ VERIFIED; VERIFIED requires runtime evidence', () => {
  const denied = labelVerificationState({
    virtualChipId: 'vc-1',
    desiredState: 'VERIFIED',
    runtimeEvidencePresent: false,
  });
  assert.equal('denied' in denied && denied.denied, true);

  const detected = labelVerificationState({
    virtualChipId: 'vc-1',
    desiredState: 'DETECTED',
  });
  assert.equal('denied' in detected, false);

  const notTested = labelVerificationState({
    virtualChipId: 'vc-1',
    desiredState: 'NOT_TESTED',
  });
  assert.equal('denied' in notTested, false);

  const verified = labelVerificationState({
    virtualChipId: 'vc-1',
    desiredState: 'VERIFIED',
    runtimeEvidencePresent: true,
  });
  assert.equal('denied' in verified, false);

  const ok = registerVirtualChipContract({
    virtualChipId: 'vc-ok',
    vendor: 'intel',
    deviceType: 'cpu',
    actor: architect,
    supportedDocumented: true,
  });
  assert.equal('denied' in ok, false);
  if (!('denied' in ok)) {
    assert.equal(ok.verificationState, 'SUPPORTED');
    assert.equal(ok.siliconModificationClaimed, false);
    assert.equal(ok.measuredLatency, null);
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

test('governance denies: driver/BIOS, overclock, permission inherit, cloud buy, cross-tenant, chip secrets', () => {
  assert.equal(attemptDriverBiosFirmwareChange().state, 'DENIED');
  assert.equal(attemptOverclockOrThermalBypass().state, 'DENIED');
  assert.equal(attemptPermissionInheritance().state, 'DENIED');
  assert.equal(attemptAutomaticCloudPurchasing().state, 'DENIED');
  assert.equal(attemptCrossTenantDataMovement().state, 'DENIED');
  assert.equal(attemptProprietaryChipSecretIngestion().state, 'DENIED');

  for (const signal of ['gps', 'camera', 'telemetry', 'trip'] as const) {
    const denied = attemptRawPrivacyCollectionWithoutOptIn(signal);
    assert.equal(denied.state, 'DENIED');
  }

  const control = attemptAutonomousDeviceControl();
  assert.equal(control.state, 'DENIED');

  const policyDenied = runPolicyResourceChecks({
    checkId: 'c-bad',
    virtualChipId: 'vc-1',
    actor: architect,
    attemptCrossTenant: true,
  });
  assert.equal('denied' in policyDenied && policyDenied.denied, true);
});

test('software capabilities + core flow receipt + neural pathway; agent bounds', () => {
  const caps = attachSoftwareLayerCapabilities({
    virtualChipId: 'vc-1',
    capabilities: [...VIRTUAL_CHIP_SOFTWARE_CAPABILITIES],
  });
  assert.equal('denied' in caps, false);
  if (!('denied' in caps)) {
    assert.equal(caps.softwareLayerOnly, true);
  }

  const policy = runPolicyResourceChecks({
    checkId: 'c1',
    virtualChipId: 'vc-1',
    actor: architect,
  });
  assert.equal('denied' in policy, false);

  const receipt = returnExecutionReceipt({
    receiptId: 'rcpt-1',
    virtualChipId: 'vc-1',
    taskId: 'task-1',
    actor: architect,
    outcomeSummary: 'bounded execution candidate',
  });
  assert.equal(receipt.returnedToHomeBase, true);
  assert.equal(receipt.authorityGranted, false);

  const pathway = linkNeuralComputePathway({
    pathwayId: 'np-1',
    virtualChipId: 'vc-1',
  });
  assert.equal(pathway.hops.length, 8);
  assert.equal(pathway.productionAuthorized, false);

  assert.equal(VIRTUAL_CHIP_AGENT_BOUNDS.automaticAuthority, false);
  assert.equal(VIRTUAL_CHIP_AGENT_BOUNDS.mayInheritPermissions, false);
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

  const humanOk = requireHumanApproval({
    approvalId: 'ok',
    virtualChipId: 'vc-1',
    actor: human,
    action: 'authorize_runtime_verification_plan',
  });
  assert.equal('denied' in humanOk, false);
});

test('soft-wire EO11/EO10/EM157 probes present on EO11 tip', () => {
  const snap = ep1SoftWireSnapshot(repoRoot);
  assert.equal(snap.eo11VirtualDataWarehouse.present, true);
  assert.equal(snap.eo11Report.present, true);
  assert.equal(snap.eo10PhysicalProduct.present, true);
  assert.equal(snap.eo10Report.present, true);
  assert.equal(snap.em157HomeBase.present, true);
});

test('cycle covers pack surfaces + bootstrap; register full contract fields', () => {
  for (const required of [
    'vendor_families_encoded',
    'contract_fields_encoded',
    'core_flow_encoded',
    'verification_states_encoded',
    'cross_vendor_examples_encoded',
    'virtual_chip_neq_silicon_modification',
    'no_transistor_firmware_isa_claim_without_evidence',
    'detected_neq_verified',
    'no_driver_bios_firmware_changes',
    'no_automatic_cloud_purchasing',
    'no_cross_tenant_data_movement',
    'no_proprietary_chip_secret_ingestion',
    'l4_autonomy_false',
    'eo11_soft_wire',
  ] as const) {
    assert.ok(VIRTUAL_CHIP_CONTRACT_CYCLE.includes(required), required);
  }

  const boot = bootstrapVirtualChipContract(repoRoot);
  assert.equal(boot.locksIntact, true);
  assert.equal(boot.vendors.length, 8);
  assert.equal(boot.contractFields.length, 23);
  assert.equal(boot.dbCandidates, 'NOT_APPLIED');

  const cycle = runVirtualChipContractCycle({
    actor: architect,
    human,
    repoRoot,
  });
  assert.ok(cycle.hops.length >= 20);
  assert.equal('denied' in cycle.contract, false);
  if (!('denied' in cycle.contract)) {
    assert.equal(cycle.contract.vendor, 'amd');
    assert.equal(cycle.contract.verificationState, 'SUPPORTED');
    assert.equal(cycle.contract.driverBiosFirmwareChanged, false);
  }
});
