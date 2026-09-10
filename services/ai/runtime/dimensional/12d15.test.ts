/**
 * 12D-15 -- Blue Brain branded LOCAL neural brain READ surface.
 * Pocket Brain ingest stubs; aspirational vs measured ADC scale;
 * Policy Gate in front; SIMULATION honesty; L4/productionAuto* false;
 * OFFLINE_PREFER_LOCAL only.
 */
import assert from 'node:assert/strict';
import {
  BLUE_BRAIN_BRAND,
  BLUE_BRAIN_LOCAL_GUARDRAILS,
  BLUE_BRAIN_LOCAL_SAFE_ENVIRONMENTS,
  BLUE_BRAIN_LOCAL_SCHEMA_VERSION,
  HIGH_AUTONOMY_TARGETS,
  OFFLINE_PREFER_LOCAL,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  allowBlueBrainPolicyGate,
  applyBlueBrainProductionDdl,
  assertBlueBrainAcceleratorsUnverifiedExceptCpu,
  assertScaleClaimsHonest,
  blueBrainLocalAcceleratorClaims,
  buildBlueBrainLocalSurface,
  bypassPolicyGateViaBlueBrain,
  createPocketBrainIngestStub,
  defaultBlueBrainScaleClaims,
  denyBlueBrainPolicyGate,
  dumpBlueBrainLocalGuardrails,
  enterCloudSandboxViaBlueBrain,
  evidenceHashBlueBrainLocal,
  getBlueBrainScaleClaimsByKind,
  labelAspirationalBlueBrainScaleAsMeasured,
  listPocketBrainIngestStubs,
  promoteBlueBrainToGlobalBrain,
  readBlueBrainSurface,
} from './index';
import { BUILDER_GUARDRAILS as POLICY_BUILDER_GUARDRAILS } from '../builder/policy';

// --- Locked Blue Brain LOCAL contract ---
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.readOnly, true);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.simulationOnly, true);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.OFFLINE_PREFER_LOCAL, true);
assert.equal(OFFLINE_PREFER_LOCAL, true);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.preferredExecution, 'LOCAL');
assert.deepEqual([...BLUE_BRAIN_LOCAL_SAFE_ENVIRONMENTS], ['LOCAL']);
assert.deepEqual([...BLUE_BRAIN_LOCAL_GUARDRAILS.executionAllowList], ['LOCAL']);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.cloudSandboxAllowed, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.productionAllowed, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.productionAutoApply, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.productionAutoMerge, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.productionAutoDeploy, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.autonomousProductionDML, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.destructiveDbAutoApply, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.L4_PRODUCTION_ENABLED, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.liveCloudSyncClaimed, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.liveCloudSyncFabricationAllowed, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.policyGateBypassAllowed, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.policyGateInFront, true);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.noDdl, true);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.noDml, true);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.noDeploy, true);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.mayEnterGlobalBrain, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.promoteToGlobalBrainAllowed, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.acceleratorVerifiedAllowed, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.fakeVerifiedAcceleratorAllowed, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.aspirationalScaleAsMeasuredAllowed, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.atomDbClaimAllowed, false);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.pocketIngestStubsOnly, true);
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.ticket, '12D-15');
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.blueBrainLocalWire, 'WIRED');
assert.equal(BLUE_BRAIN_LOCAL_GUARDRAILS.brand, 'Blue Brain');
assert.equal(BLUE_BRAIN_BRAND, 'Blue Brain');
assert.equal(BLUE_BRAIN_LOCAL_SCHEMA_VERSION, '12d15.1');
assert.equal(VALUATION_THEATER_ALLOWED, false);
assert.equal(UNIVERSES_ARE_SIMULATION_LAYERS_ONLY, true);
assert.equal(POLICY_BUILDER_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(POLICY_BUILDER_GUARDRAILS.autonomousProductionDML, false);
assert.deepEqual([...HIGH_AUTONOMY_TARGETS], ['LOCAL', 'CLOUD_SANDBOX']);

const dump = dumpBlueBrainLocalGuardrails();
assert.equal(dump.productionAutoApply, false);
assert.equal(dump.productionAutoMerge, false);
assert.equal(dump.productionAutoDeploy, false);
assert.equal(dump.autonomousProductionDDL, false);
assert.equal(dump.autonomousProductionDML, false);
assert.equal(dump.L4_PRODUCTION_ENABLED, false);
assert.equal(dump.liveCloudSyncClaimed, false);
assert.equal(dump.cloudSandboxAllowed, false);
assert.equal(dump.acceleratorVerifiedAllowed, false);
assert.equal(dump.simulationOnly, true);
assert.equal(dump.aspirationalScaleAsMeasuredAllowed, false);
assert.equal(dump.policyGateInFront, true);
assert.equal(dump.brand, 'Blue Brain');
assert.deepEqual(dump.safeEnvironments, ['LOCAL']);

assert.throws(() => applyBlueBrainProductionDdl(), /DDL/);
assert.throws(() => bypassPolicyGateViaBlueBrain(), /Policy Gate/);
assert.throws(() => labelAspirationalBlueBrainScaleAsMeasured('atomic_data_cell_addressable_scale'), /aspirational/);
assert.throws(() => promoteBlueBrainToGlobalBrain(), /Global|global/);
assert.throws(() => enterCloudSandboxViaBlueBrain(), /LOCAL|cloud sandbox/i);

const accel = blueBrainLocalAcceleratorClaims();
assertBlueBrainAcceleratorsUnverifiedExceptCpu(accel);
assert.equal(accel.find((c) => c.backend === 'cpu')?.status, 'VERIFIED');
assert.equal(accel.find((c) => c.backend === 'gpu')?.status, 'WAITING');
assert.equal(accel.find((c) => c.backend === 'npu')?.status, 'WAITING');
assert.equal(accel.find((c) => c.backend === 'qpu')?.status, 'WAITING');
assert.throws(
  () =>
    assertBlueBrainAcceleratorsUnverifiedExceptCpu([
      { backend: 'gpu', status: 'VERIFIED', notes: 'fake' },
    ]),
  /UNVERIFIED/,
);

// --- Surface: Pocket Brain ingest stubs ---
const surface = buildBlueBrainLocalSurface({ seed: 'xiv-12d15-test' });
assert.equal(surface.brand, 'Blue Brain');
assert.equal(surface.simulationOnly, true);
assert.equal(surface.preferredExecution, 'LOCAL');
assert.equal(surface.OFFLINE_PREFER_LOCAL, true);
assert.equal(surface.liveCloudSyncClaimed, false);
assert.equal(surface.productionAutoApply, false);
assert.equal(surface.L4_PRODUCTION_ENABLED, false);
assert.equal(surface.schemaVersion, '12d15.1');
assert.ok(surface.surfaceId.includes('blue-brain-local'));

const stubs = listPocketBrainIngestStubs(surface);
assert.equal(stubs.length, 3);
assert.ok(stubs.every((s) => s.simulationOnly === true));
assert.ok(stubs.every((s) => s.mayEnterGlobalBrain === false));
assert.ok(stubs.every((s) => s.productionMutation === false));
assert.ok(stubs.every((s) => s.cached === true));
assert.ok(stubs.some((s) => s.relativePath.includes('manifest-index')));
assert.ok(stubs.some((s) => s.relativePath.includes('neural-readout')));
assert.ok(stubs.some((s) => s.classification === 'TENANT_PRIVATE'));

assert.throws(
  () =>
    createPocketBrainIngestStub({
      stubId: 'bad',
      relativePath: '.env/secret',
    }),
  /secret_path_blocked/,
);

// --- Policy Gate in front ---
const allowedGate = allowBlueBrainPolicyGate();
assert.equal(allowedGate.gateId, 'xiv-policy-gate');
assert.equal(allowedGate.allowed, true);
assert.equal(allowedGate.bypassAttempted, false);

const hit = readBlueBrainSurface({
  surface,
  stubId: stubs[0].stubId,
  gate: allowedGate,
});
assert.equal(hit.outcome, 'HIT');
assert.equal(hit.stubId, stubs[0].stubId);
assert.equal(hit.simulationOnly, true);
assert.equal(hit.liveCloudSyncClaimed, false);

const miss = readBlueBrainSurface({
  surface,
  stubId: 'missing-stub',
  gate: allowedGate,
});
assert.equal(miss.outcome, 'MISS');

const waiting = readBlueBrainSurface({
  surface,
  relativePath: 'pocket/unbound.json',
  gate: allowedGate,
  unbound: true,
});
assert.equal(waiting.outcome, 'WAITING_SYNC');

const denied = readBlueBrainSurface({
  surface,
  stubId: stubs[0].stubId,
  gate: denyBlueBrainPolicyGate('test deny'),
});
assert.equal(denied.outcome, 'GATE_DENIED');
assert.equal(denied.stubId, null);

// --- Scale honesty: aspirational vs measured ---
const defaults = defaultBlueBrainScaleClaims();
assertScaleClaimsHonest(defaults);
const measured = getBlueBrainScaleClaimsByKind(surface, 'measured');
const aspirational = getBlueBrainScaleClaimsByKind(surface, 'aspirational');
assert.ok(measured.length >= 2);
assert.ok(aspirational.length >= 2);
assert.ok(aspirational.every((c) => /aspirational/i.test(c.notes)));
assert.ok(aspirational.some((c) => c.metric === 'atomic_data_cell_addressable_scale'));
assert.ok(aspirational.some((c) => c.metric === 'blue_brain_neural_federation_span'));
assert.ok(measured.some((c) => c.metric === 'pocket_brain_ingest_stubs'));

assert.throws(
  () =>
    assertScaleClaimsHonest([
      {
        kind: 'aspirational',
        metric: 'bad',
        value: 1,
        unit: 'x',
        notes: 'this is measured capacity',
      },
    ]),
  /aspirational|measured/,
);

// Evidence hash
const tipSha = '311eef975ec8c0f0e8ed7eff863ba2dec59d60b9';
const evidence = evidenceHashBlueBrainLocal({
  tipSha,
  surface,
  testsPassed: ['12d15.test.ts'],
});
assert.equal(typeof evidence, 'string');
assert.ok(evidence.length >= 16);

console.log('12d15.test.ts: OK');
console.log(
  JSON.stringify({
    tipShaPlaceholder: tipSha,
    brand: surface.brand,
    surfaceId: surface.surfaceId,
    stubs: stubs.length,
    measuredScale: measured.map((c) => c.metric),
    aspirationalScale: aspirational.map((c) => c.metric),
    evidence,
    guardrailDumpKeys: Object.keys(dump).sort(),
  }),
);
