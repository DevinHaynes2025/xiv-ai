/**
 * 12D-18 -- Virtual Chip Lab registry v0.
 * CHIP|NPU|GPU; honesty UNVERIFIED|WAITING_PROVIDER|WAITING_DRIVER|DETECTED;
 * never VERIFIED without receipts; Twin soft-confirmed SIMULATION;
 * quantumAdvantageClaimed=false; liveChip/Npu/GpuControl=false;
 * LOCAL / OFFLINE_PREFER_LOCAL; productionAuto*=false.
 */
import assert from 'node:assert/strict';
import {
  HIGH_AUTONOMY_TARGETS,
  OFFLINE_PREFER_LOCAL,
  QUANTUM_ADVANTAGE_CLAIM,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  VALUATION_THEATER_ALLOWED,
  VIRTUAL_CHIP_LAB_FORBIDDEN_HONESTY,
  VIRTUAL_CHIP_LAB_GUARDRAILS,
  VIRTUAL_CHIP_LAB_HONESTY_LABELS,
  VIRTUAL_CHIP_LAB_PATHWAY_KINDS,
  VIRTUAL_CHIP_LAB_SAFE_ENVIRONMENTS,
  VIRTUAL_CHIP_LAB_SCHEMA_VERSION,
  applyVirtualChipLabProductionAuto,
  buildVirtualChipLabRegistry,
  claimQuantumAdvantageOnVirtualChipLab,
  createVirtualChipLabPathwayStub,
  defaultVirtualChipLabPathwayStubs,
  dumpVirtualChipLabGuardrails,
  enableLiveChipControl,
  enableLiveGpuControl,
  enableLiveNpuControl,
  enterCloudSandboxViaVirtualChipLab,
  evidenceHashVirtualChipLab,
  getVirtualChipLabPathwaysByHonesty,
  getVirtualChipLabPathwaysByKind,
  listVirtualChipLabPathwayStubs,
  markVirtualChipLabVerifiedWithoutReceipts,
} from './index';
import { BUILDER_GUARDRAILS as POLICY_BUILDER_GUARDRAILS } from '../builder/policy';

// --- Locked Virtual Chip Lab contract ---
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.readOnly, true);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.simulationOnly, true);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.twinSoftConfirmedSimulation, true);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.OFFLINE_PREFER_LOCAL, true);
assert.equal(OFFLINE_PREFER_LOCAL, true);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.preferredExecution, 'LOCAL');
assert.deepEqual([...VIRTUAL_CHIP_LAB_SAFE_ENVIRONMENTS], ['LOCAL']);
assert.deepEqual([...VIRTUAL_CHIP_LAB_GUARDRAILS.executionAllowList], ['LOCAL']);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.cloudSandboxAllowed, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.productionAllowed, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.productionAutoApply, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.productionAutoMerge, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.productionAutoDeploy, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.autonomousProductionDML, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.destructiveDbAutoApply, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.L4_PRODUCTION_ENABLED, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.quantumAdvantageClaimed, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.quantumAdvantageClaimAllowed, false);
assert.equal(QUANTUM_ADVANTAGE_CLAIM, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.liveChipControl, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.liveNpuControl, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.liveGpuControl, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.liveChipFabricationAllowed, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.verifiedWithoutReceiptsAllowed, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.fakeVerifiedAllowed, false);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.honestyLabelsOnly, true);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.noDdl, true);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.noDml, true);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.noDeploy, true);
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.ticket, '12D-18');
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.virtualChipLabWire, 'WIRED');
assert.equal(VIRTUAL_CHIP_LAB_GUARDRAILS.registryVersion, 'v0');
assert.equal(VIRTUAL_CHIP_LAB_SCHEMA_VERSION, '12d18.vcl0.1');
assert.equal(VALUATION_THEATER_ALLOWED, false);
assert.equal(UNIVERSES_ARE_SIMULATION_LAYERS_ONLY, true);
assert.equal(POLICY_BUILDER_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(POLICY_BUILDER_GUARDRAILS.autonomousProductionDML, false);
assert.deepEqual([...HIGH_AUTONOMY_TARGETS], ['LOCAL', 'CLOUD_SANDBOX']);
assert.deepEqual([...VIRTUAL_CHIP_LAB_PATHWAY_KINDS], ['CHIP', 'NPU', 'GPU']);
assert.deepEqual([...VIRTUAL_CHIP_LAB_HONESTY_LABELS], [
  'UNVERIFIED',
  'WAITING_PROVIDER',
  'WAITING_DRIVER',
  'DETECTED',
]);
assert.deepEqual([...VIRTUAL_CHIP_LAB_FORBIDDEN_HONESTY], ['VERIFIED']);

const dump = dumpVirtualChipLabGuardrails();
assert.equal(dump.productionAutoApply, false);
assert.equal(dump.productionAutoMerge, false);
assert.equal(dump.productionAutoDeploy, false);
assert.equal(dump.autonomousProductionDDL, false);
assert.equal(dump.autonomousProductionDML, false);
assert.equal(dump.L4_PRODUCTION_ENABLED, false);
assert.equal(dump.quantumAdvantageClaimed, false);
assert.equal(dump.liveChipControl, false);
assert.equal(dump.liveNpuControl, false);
assert.equal(dump.liveGpuControl, false);
assert.equal(dump.verifiedWithoutReceiptsAllowed, false);
assert.equal(dump.simulationOnly, true);
assert.equal(dump.twinSoftConfirmedSimulation, true);
assert.equal(dump.OFFLINE_PREFER_LOCAL, true);
assert.deepEqual(dump.safeEnvironments, ['LOCAL']);
assert.deepEqual(dump.pathwayKinds, [...VIRTUAL_CHIP_LAB_PATHWAY_KINDS]);
assert.deepEqual(dump.allowedHonestyLabels, [...VIRTUAL_CHIP_LAB_HONESTY_LABELS]);
assert.deepEqual(dump.forbiddenHonestyLabels, ['VERIFIED']);
assert.equal(dump.registryVersion, 'v0');

assert.throws(() => claimQuantumAdvantageOnVirtualChipLab(), /quantumAdvantageClaimed/);
assert.throws(() => enableLiveChipControl(), /liveChipControl/);
assert.throws(() => enableLiveNpuControl(), /liveNpuControl/);
assert.throws(() => enableLiveGpuControl(), /liveGpuControl/);
assert.throws(() => markVirtualChipLabVerifiedWithoutReceipts('chip-1'), /VERIFIED|receipts/);
assert.throws(() => applyVirtualChipLabProductionAuto(), /productionAuto/);
assert.throws(() => enterCloudSandboxViaVirtualChipLab(), /LOCAL|cloud sandbox/i);

// --- Registry stubs ---
const registry = buildVirtualChipLabRegistry({ seed: 'xiv-12d18-test' });
assert.equal(registry.simulationOnly, true);
assert.equal(registry.twinSoftConfirmedSimulation, true);
assert.equal(registry.preferredExecution, 'LOCAL');
assert.equal(registry.OFFLINE_PREFER_LOCAL, true);
assert.equal(registry.quantumAdvantageClaimed, false);
assert.equal(registry.liveChipControl, false);
assert.equal(registry.liveNpuControl, false);
assert.equal(registry.liveGpuControl, false);
assert.equal(registry.productionAutoApply, false);
assert.equal(registry.productionAutoMerge, false);
assert.equal(registry.productionAutoDeploy, false);
assert.equal(registry.L4_PRODUCTION_ENABLED, false);
assert.equal(registry.schemaVersion, '12d18.vcl0.1');
assert.ok(registry.registryId.includes('virtual-chip-lab'));

const stubs = listVirtualChipLabPathwayStubs(registry);
assert.equal(stubs.length, 3);
assert.ok(stubs.every((s) => s.simulationOnly === true));
assert.ok(stubs.every((s) => s.twinSoftConfirmedSimulation === true));
assert.ok(stubs.every((s) => s.quantumAdvantageClaimed === false));
assert.ok(stubs.every((s) => s.liveChipControl === false));
assert.ok(stubs.every((s) => s.liveNpuControl === false));
assert.ok(stubs.every((s) => s.liveGpuControl === false));
assert.ok(stubs.every((s) => s.preferredExecution === 'LOCAL'));
assert.ok(stubs.every((s) => s.OFFLINE_PREFER_LOCAL === true));
assert.ok(stubs.every((s) => VIRTUAL_CHIP_LAB_HONESTY_LABELS.includes(s.honesty)));
assert.ok(stubs.every((s) => s.honesty !== ('VERIFIED' as never)));

for (const kind of VIRTUAL_CHIP_LAB_PATHWAY_KINDS) {
  const byKind = getVirtualChipLabPathwaysByKind(registry, kind);
  assert.equal(byKind.length, 1, 'expected one stub for ' + kind);
  assert.equal(byKind[0].kind, kind);
}

const unverified = getVirtualChipLabPathwaysByHonesty(registry, 'UNVERIFIED');
const waitingDriver = getVirtualChipLabPathwaysByHonesty(registry, 'WAITING_DRIVER');
const detected = getVirtualChipLabPathwaysByHonesty(registry, 'DETECTED');
assert.ok(unverified.some((s) => s.kind === 'CHIP'));
assert.ok(waitingDriver.some((s) => s.kind === 'NPU'));
assert.ok(detected.some((s) => s.kind === 'GPU'));

const defaults = defaultVirtualChipLabPathwayStubs('seed');
assert.equal(defaults.length, 3);

const custom = createVirtualChipLabPathwayStub({
  pathwayId: 'custom:npu',
  kind: 'NPU',
  honesty: 'WAITING_PROVIDER',
});
assert.equal(custom.kind, 'NPU');
assert.equal(custom.honesty, 'WAITING_PROVIDER');
assert.equal(custom.liveNpuControl, false);
assert.equal(custom.twinSoftConfirmedSimulation, true);

assert.throws(
  () =>
    createVirtualChipLabPathwayStub({
      pathwayId: 'bad',
      kind: 'CHIP',
      honesty: 'VERIFIED' as never,
    }),
  /honesty|invalid|VERIFIED|receipts/i,
);

// Evidence hash
const tipSha = 'ed47be854b68f20b6d6a90777fccc14d07585d90';
const evidence = evidenceHashVirtualChipLab({
  tipSha,
  registry,
  testsPassed: ['12d18.test.ts'],
});
assert.equal(typeof evidence, 'string');
assert.ok(evidence.length >= 16);

console.log('12d18.test.ts: OK');
console.log(
  JSON.stringify({
    tipShaPlaceholder: tipSha,
    registryId: registry.registryId,
    pathwayKinds: stubs.map((s) => s.kind),
    honesty: stubs.map((s) => ({ kind: s.kind, honesty: s.honesty })),
    twinSoftConfirmedSimulation: true,
    evidence,
    guardrailDumpKeys: Object.keys(dump).sort(),
  }),
);