/**
 * 62L-EX4 — Local Quantum Simulator Registry honesty tests.
 * Script: npm run test:62lex4
 * Parent: 62L-EX / GitHub #170
 * L4_AUTONOMY_ENABLED=false. No PR / tip-land.
 */

import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  EX4_LOCKS,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  HONESTY_BANNER,
  NEXT_PHASE_TITLE,
  SIMULATOR_VERIFICATION_LADDER,
  assertEx4LocksIntact,
  buildBellPairIR,
  buildOversizedIR,
  canAdvanceSimulatorLadder,
  compareSimulatorConsensus,
  createDetectedNotVerifiedEntry,
  createDocumentedThirdPartyCandidate,
  createSimulationReceipt,
  createSimulatorRegistry,
  defaultSimulationRequest,
  evaluateReproducibility,
  evaluateWormhole,
  ex4L4AutonomyEnabled,
  ex4SoftWireSnapshot,
  guardianRlsUnchangedByEx4,
  loadQuantumDnaManifest,
  runEx4SimulatorCycle,
  runLocalSimulation,
} from './index.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');

test('SoT EX4 / #170; next EX5 docs-only; honesty banner', () => {
  assert.equal(GITHUB_SOT_LABEL, '62L-EX4');
  assert.equal(GITHUB_SOT_ISSUE, 170);
  assert.match(NEXT_PHASE_TITLE, /EX5.*QPU Provider Truth Registry/);
  assert.match(HONESTY_BANNER, /SIMULATED_QUANTUM/);
  assert.match(HONESTY_BANNER, /PHYSICAL_QPU_VERIFIED/);
});

test('1) simulator execution → SIMULATED_QUANTUM', () => {
  const cycle = runEx4SimulatorCycle({
    request: { requestId: 't1', seed: 7, shots: 128 },
  });
  assert.equal(cycle.ok, true);
  assert.equal(cycle.classification, 'SIMULATED_QUANTUM');
  assert.equal(cycle.receipt?.classification, 'SIMULATED_QUANTUM');
  assert.ok(cycle.receipt?.counts);
});

test('2) simulator never PHYSICAL_QPU_VERIFIED', () => {
  const cycle = runEx4SimulatorCycle({
    request: { requestId: 't2' },
    claimPhysicalQpu: true,
  });
  assert.equal(cycle.ok, false);
  assert.equal(cycle.physicalQpuVerified, false);
  assert.equal(cycle.outcome?.ok, false);
  if (!cycle.outcome?.ok) {
    assert.equal(cycle.outcome.reason, 'DENY_PHYSICAL_QPU_CLAIM');
    assert.equal(cycle.outcome.physicalQpuClaimed, false);
  }
  const okCycle = runEx4SimulatorCycle({ request: { requestId: 't2b' } });
  assert.equal(okCycle.physicalQpuVerified, false);
  assert.notEqual(okCycle.classification, 'PHYSICAL_QPU_VERIFIED');
});

test('3) DOCUMENTED cannot satisfy VERIFIED', () => {
  const reg = createSimulatorRegistry();
  const documented = createDocumentedThirdPartyCandidate();
  reg.register({ ...documented, licenseReviewed: true, adapterEnabled: false });
  assert.equal(documented.verificationState, 'DOCUMENTED');
  const skip = reg.advanceVerification(documented.simulatorId, 'VERIFIED', {
    detected: true,
    initialized: true,
    boundedCircuitCompleted: true,
    validated: true,
    deviceRecorded: true,
    receiptId: 'rcpt-x',
  });
  assert.equal(skip.ok, false);
  if (!skip.ok) assert.match(skip.reason, /TRUTH_LADDER_SKIP_DENIED|VERIFIED_REQUIRES/);
  assert.equal(canAdvanceSimulatorLadder('DOCUMENTED', 'VERIFIED'), false);
  assert.deepEqual([...SIMULATOR_VERIFICATION_LADDER], [
    'DOCUMENTED',
    'DETECTED',
    'SUPPORTED',
    'VERIFIED',
  ]);
});

test('4) DETECTED cannot satisfy VERIFIED', () => {
  const reg = createSimulatorRegistry();
  const detected = createDetectedNotVerifiedEntry();
  reg.register({ ...detected, licenseReviewed: true, adapterEnabled: true });
  assert.equal(detected.verificationState, 'DETECTED');
  const skip = reg.advanceVerification(detected.simulatorId, 'VERIFIED', {
    detected: true,
    initialized: true,
    boundedCircuitCompleted: true,
    validated: true,
    deviceRecorded: true,
    receiptId: 'rcpt-y',
  });
  assert.equal(skip.ok, false);
  if (!skip.ok) assert.match(skip.reason, /TRUTH_LADDER_SKIP_DENIED/);
  assert.equal(canAdvanceSimulatorLadder('DETECTED', 'VERIFIED'), false);
});

test('5) successful bounded local sim may become VERIFIED', () => {
  const reg = createSimulatorRegistry();
  const cycle = runEx4SimulatorCycle({
    registry: reg,
    request: { requestId: 't5', preferredSimulatorId: 'xiv-sv-cpu-v1' },
    verifyAfterSuccess: true,
  });
  assert.equal(cycle.ok, true);
  const entry = reg.get('xiv-sv-cpu-v1');
  assert.ok(entry);
  assert.equal(entry!.verificationState, 'VERIFIED');
  assert.ok(entry!.lastVerifiedAt);
});

test('6) oversized → resource denial', () => {
  const cycle = runEx4SimulatorCycle({
    request: {
      requestId: 't6',
      maxQubits: 8,
      maxMemoryMb: 1,
    },
    circuit: buildOversizedIR(20),
  });
  assert.equal(cycle.ok, false);
  if (!cycle.outcome?.ok) {
    assert.match(String(cycle.outcome?.reason), /DENY_RESOURCE_LIMIT/);
  }
});

test('7) GPU→CPU silent fallback records actual device', () => {
  const reg = createSimulatorRegistry();
  const request = defaultSimulationRequest({
    requestId: 't7',
    preferredSimulatorId: 'xiv-sv-gpu-unproven',
    preferredRuntimeType: 'LOCAL_GPU',
    preferredDeviceClass: 'GPU',
  });
  const outcome = runLocalSimulation({
    request,
    circuit: buildBellPairIR(),
    registry: reg,
  });
  assert.equal(outcome.ok, true);
  if (outcome.ok) {
    assert.equal(outcome.fallbackUsed, true);
    assert.equal(outcome.requestedDevice, 'LOCAL_GPU');
    assert.equal(outcome.actualDevice, 'LOCAL_CPU');
    assert.ok(outcome.fallbackReason);
    assert.match(String(outcome.fallbackReason), /GPU_EXISTS_NE_ACCEL_EXISTS/);
    const receipt = createSimulationReceipt({
      receiptId: 'rcpt-t7',
      request,
      outcome,
    });
    assert.equal(receipt.ok, true);
    if (receipt.ok) {
      assert.equal(receipt.receipt.actualDevice, 'LOCAL_CPU');
      assert.equal(receipt.receipt.fallbackUsed, true);
    }
  }
});

test('8) same circuit/seed reproducible within tolerance', () => {
  const reg = createSimulatorRegistry();
  const req = defaultSimulationRequest({
    requestId: 't8a',
    seed: 99,
    shots: 64,
  });
  const circuit = buildBellPairIR('ir-repro');
  const a = runLocalSimulation({ request: req, circuit, registry: reg });
  const b = runLocalSimulation({
    request: { ...req, requestId: 't8b' },
    circuit,
    registry: reg,
  });
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  if (a.ok && b.ok) {
    const ra = createSimulationReceipt({
      receiptId: 'rcpt-a',
      request: req,
      outcome: a,
    });
    const rb = createSimulationReceipt({
      receiptId: 'rcpt-b',
      request: { ...req, requestId: 't8b' },
      outcome: b,
    });
    assert.equal(ra.ok && rb.ok, true);
    if (ra.ok && rb.ok) {
      const repro = evaluateReproducibility(ra.receipt, rb.receipt);
      assert.equal(repro.reproducibilityState, 'REPRODUCIBLE');
      assert.equal(repro.withinTolerance, true);
      assert.equal(ra.receipt.outputHash, rb.receipt.outputHash);
    }
  }
});

test('9) simulator disagreement → REVIEW_REQUIRED', () => {
  const reg = createSimulatorRegistry();
  const req = defaultSimulationRequest({ requestId: 't9', seed: 1, shots: 32 });
  const circuit = buildBellPairIR('ir-disagree');
  const aOut = runLocalSimulation({ request: req, circuit, registry: reg });
  assert.equal(aOut.ok, true);
  if (!aOut.ok) return;
  const ra = createSimulationReceipt({
    receiptId: 'rcpt-dis-a',
    request: req,
    outcome: aOut,
  });
  assert.equal(ra.ok, true);
  if (!ra.ok) return;

  // Fabricate disagreeing probabilities from a second "simulator" receipt.
  const rb = createSimulationReceipt({
    receiptId: 'rcpt-dis-b',
    request: { ...req, requestId: 't9b' },
    outcome: {
      ...aOut,
      simulatorId: 'xiv-sv-alt',
      probabilities: { '00': 1, '11': 0, '01': 0, '10': 0 },
      counts: { '00': 32 },
      outputHash: 'altered',
    },
  });
  assert.equal(rb.ok, true);
  if (!rb.ok) return;

  const consensus = compareSimulatorConsensus(ra.receipt, rb.receipt, 1e-6);
  assert.equal(consensus.consensusState, 'REVIEW_REQUIRED');
  assert.equal(consensus.averaged, false);
  assert.ok(consensus.reasons.some((r) => /DISAGREEMENT|NO_SILENT_AVERAGE/.test(r)));
});

test('10) cloud sim offline → WAITING_PROVIDER', () => {
  const cycle = runEx4SimulatorCycle({
    request: {
      requestId: 't10',
      preferredSimulatorId: 'cloud-sim-remote',
      offlineDisconnected: true,
      networkAvailable: false,
    },
  });
  assert.equal(cycle.ok, false);
  assert.equal(cycle.outcome?.workState, 'WAITING_PROVIDER');
});

test('11) web-required offline → WAITING_DATA', () => {
  const cycle = runEx4SimulatorCycle({
    request: {
      requestId: 't11',
      preferredSimulatorId: 'web-docs-required',
      offlineDisconnected: true,
      networkAvailable: false,
    },
  });
  assert.equal(cycle.ok, false);
  assert.equal(cycle.outcome?.workState, 'WAITING_DATA');
});

test('12) cross-tenant DENIED', () => {
  const cycle = runEx4SimulatorCycle({
    request: { requestId: 't12', tenantId: 'tenant-a', universeId: 'uni-a' },
    actorTenantId: 'tenant-b',
    actorUniverseId: 'uni-a',
  });
  assert.equal(cycle.ok, false);
  if (!cycle.outcome?.ok) {
    assert.equal(cycle.outcome?.reason, 'DENY_TENANT');
  }
});

test('13) cross-Universe DENIED', () => {
  const cycle = runEx4SimulatorCycle({
    request: { requestId: 't13', tenantId: 'tenant-a', universeId: 'uni-a' },
    actorTenantId: 'tenant-a',
    actorUniverseId: 'uni-b',
  });
  assert.equal(cycle.ok, false);
  if (!cycle.outcome?.ok) {
    assert.equal(cycle.outcome?.reason, 'DENY_UNIVERSE');
  }
});

test('14) expired DENIED', () => {
  const cycle = runEx4SimulatorCycle({
    request: {
      requestId: 't14',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    },
  });
  assert.equal(cycle.ok, false);
  if (!cycle.outcome?.ok) {
    assert.equal(cycle.outcome?.reason, 'DENY_EXPIRED');
  }
});

test('15) L4 false', () => {
  assert.equal(EX4_LOCKS.L4_AUTONOMY_ENABLED, false);
  assert.equal(ex4L4AutonomyEnabled(), false);
  assert.equal(assertEx4LocksIntact(), true);
});

test('16) Guardian/RLS unchanged', () => {
  assert.equal(guardianRlsUnchangedByEx4(), true);
  assert.equal(EX4_LOCKS.WEAKEN_GUARDIAN_RLS, false);
  assert.equal(EX4_LOCKS.BYPASS_AUTH_GUARDIAN_RLS, false);
  const wormhole = evaluateWormhole({
    bypassGuardian: true,
    bypassRls: true,
  });
  assert.equal(wormhole.allowed, false);
  assert.match(wormhole.reason, /WORMHOLE_BYPASS_DENIED/);

  // Soft-wire probe must not mutate guardian paths; presence check only.
  const soft = ex4SoftWireSnapshot(repoRoot);
  assert.equal(soft.guardian.verified, false);
  assert.ok(
    soft.guardian.disposition === 'PRESENT_UNVERIFIED' ||
      soft.guardian.disposition === 'WAITING_DATA',
  );
});

test('soft-wires: presence ≠ VERIFIED; DNA XIV-owned only; no second framework', () => {
  const soft = ex4SoftWireSnapshot(repoRoot);
  assert.equal(soft.agentMesh.verified, false);
  assert.equal(soft.ex1Mission.verified, false);
  assert.equal(soft.ex2ClassicalBaseline.verified, false);
  assert.equal(soft.ex3QiAlgorithmLab.verified, false);
  assert.equal(soft.chipgraph.verified, false);
  assert.equal(EX4_LOCKS.SECOND_ORCHESTRATION_FRAMEWORK, false);
  assert.equal(EX4_LOCKS.PRESENCE_EQ_VERIFIED, false);

  const dna = loadQuantumDnaManifest();
  assert.equal(dna.present, true);
  assert.equal(dna.xivOwnedOnly, true);
  assert.equal(dna.proprietaryClone, false);
});
