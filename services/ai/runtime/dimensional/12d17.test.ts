/**
 * 12D-17 -- Device Pathways registry stubs.
 * PHONE|LAPTOP|AUTO|TELECOM|SAT_SIM|EDGE; honesty UNVERIFIED|WAITING_PROVIDER;
 * chipPartners WAITING_PARTNER; quantumSoftwareClaimed=false;
 * liveSatelliteControl=false; liveVehicleControl=false;
 * LOCAL / OFFLINE_PREFER_LOCAL; productionAuto*=false.
 */
import assert from 'node:assert/strict';
import {
  DEVICE_CHIP_PARTNERS,
  DEVICE_PATHWAY_HONESTY_LABELS,
  DEVICE_PATHWAY_KINDS,
  DEVICE_PATHWAYS_GUARDRAILS,
  DEVICE_PATHWAYS_SAFE_ENVIRONMENTS,
  DEVICE_PATHWAYS_SCHEMA_VERSION,
  HIGH_AUTONOMY_TARGETS,
  OFFLINE_PREFER_LOCAL,
  QUANTUM_ADVANTAGE_CLAIM,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  VALUATION_THEATER_ALLOWED,
  applyDevicePathwaysProductionAuto,
  assertChipPartnersWaiting,
  buildDevicePathwaysRegistry,
  claimQuantumSoftwareOnDevicePathways,
  createDevicePathwayStub,
  defaultChipPartnerClaims,
  defaultDevicePathwayStubs,
  dumpDevicePathwaysGuardrails,
  enableLiveSatelliteControl,
  enableLiveVehicleControl,
  enterCloudSandboxViaDevicePathways,
  evidenceHashDevicePathways,
  getDevicePathwaysByHonesty,
  getDevicePathwaysByKind,
  listChipPartnerClaims,
  listDevicePathwayStubs,
  markChipPartnerVerified,
} from './index';
import { BUILDER_GUARDRAILS as POLICY_BUILDER_GUARDRAILS } from '../builder/policy';

// --- Locked Device Pathways contract ---
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.readOnly, true);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.simulationOnly, true);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.OFFLINE_PREFER_LOCAL, true);
assert.equal(OFFLINE_PREFER_LOCAL, true);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.preferredExecution, 'LOCAL');
assert.deepEqual([...DEVICE_PATHWAYS_SAFE_ENVIRONMENTS], ['LOCAL']);
assert.deepEqual([...DEVICE_PATHWAYS_GUARDRAILS.executionAllowList], ['LOCAL']);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.cloudSandboxAllowed, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.productionAllowed, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.productionAutoApply, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.productionAutoMerge, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.productionAutoDeploy, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.autonomousProductionDML, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.destructiveDbAutoApply, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.L4_PRODUCTION_ENABLED, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.quantumSoftwareClaimed, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.quantumAdvantageClaimAllowed, false);
assert.equal(QUANTUM_ADVANTAGE_CLAIM, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.liveSatelliteControl, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.liveVehicleControl, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.liveSatelliteFabricationAllowed, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.liveVehicleFabricationAllowed, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.chipPartnerVerifiedAllowed, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.fakeVerifiedPartnerAllowed, false);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.honestyLabelsOnly, true);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.chipPartnerStatus, 'WAITING_PARTNER');
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.noDdl, true);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.noDml, true);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.noDeploy, true);
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.ticket, '12D-17');
assert.equal(DEVICE_PATHWAYS_GUARDRAILS.devicePathwaysWire, 'WIRED');
assert.equal(DEVICE_PATHWAYS_SCHEMA_VERSION, '12d17.1');
assert.equal(VALUATION_THEATER_ALLOWED, false);
assert.equal(UNIVERSES_ARE_SIMULATION_LAYERS_ONLY, true);
assert.equal(POLICY_BUILDER_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(POLICY_BUILDER_GUARDRAILS.autonomousProductionDML, false);
assert.deepEqual([...HIGH_AUTONOMY_TARGETS], ['LOCAL', 'CLOUD_SANDBOX']);
assert.deepEqual([...DEVICE_PATHWAY_KINDS], [
  'PHONE',
  'LAPTOP',
  'AUTO',
  'TELECOM',
  'SAT_SIM',
  'EDGE',
]);
assert.deepEqual([...DEVICE_PATHWAY_HONESTY_LABELS], ['UNVERIFIED', 'WAITING_PROVIDER']);
assert.deepEqual([...DEVICE_CHIP_PARTNERS], ['apple', 'nvidia', 'amd', 'arm', 'samsung']);

const dump = dumpDevicePathwaysGuardrails();
assert.equal(dump.productionAutoApply, false);
assert.equal(dump.productionAutoMerge, false);
assert.equal(dump.productionAutoDeploy, false);
assert.equal(dump.autonomousProductionDDL, false);
assert.equal(dump.autonomousProductionDML, false);
assert.equal(dump.L4_PRODUCTION_ENABLED, false);
assert.equal(dump.quantumSoftwareClaimed, false);
assert.equal(dump.liveSatelliteControl, false);
assert.equal(dump.liveVehicleControl, false);
assert.equal(dump.chipPartnerVerifiedAllowed, false);
assert.equal(dump.simulationOnly, true);
assert.equal(dump.OFFLINE_PREFER_LOCAL, true);
assert.deepEqual(dump.safeEnvironments, ['LOCAL']);
assert.deepEqual(dump.pathwayKinds, [...DEVICE_PATHWAY_KINDS]);
assert.deepEqual(dump.chipPartners, [...DEVICE_CHIP_PARTNERS]);
assert.equal(dump.chipPartnerStatus, 'WAITING_PARTNER');

assert.throws(() => claimQuantumSoftwareOnDevicePathways(), /quantumSoftwareClaimed/);
assert.throws(() => enableLiveSatelliteControl(), /liveSatelliteControl/);
assert.throws(() => enableLiveVehicleControl(), /liveVehicleControl/);
assert.throws(() => markChipPartnerVerified('nvidia'), /WAITING_PARTNER/);
assert.throws(() => applyDevicePathwaysProductionAuto(), /productionAuto/);
assert.throws(() => enterCloudSandboxViaDevicePathways(), /LOCAL|cloud sandbox/i);

// --- Registry stubs ---
const registry = buildDevicePathwaysRegistry({ seed: 'xiv-12d17-test' });
assert.equal(registry.simulationOnly, true);
assert.equal(registry.preferredExecution, 'LOCAL');
assert.equal(registry.OFFLINE_PREFER_LOCAL, true);
assert.equal(registry.quantumSoftwareClaimed, false);
assert.equal(registry.liveSatelliteControl, false);
assert.equal(registry.liveVehicleControl, false);
assert.equal(registry.productionAutoApply, false);
assert.equal(registry.productionAutoMerge, false);
assert.equal(registry.productionAutoDeploy, false);
assert.equal(registry.L4_PRODUCTION_ENABLED, false);
assert.equal(registry.schemaVersion, '12d17.1');
assert.ok(registry.registryId.includes('device-pathways'));

const stubs = listDevicePathwayStubs(registry);
assert.equal(stubs.length, 6);
assert.ok(stubs.every((s) => s.simulationOnly === true));
assert.ok(stubs.every((s) => s.quantumSoftwareClaimed === false));
assert.ok(stubs.every((s) => s.liveSatelliteControl === false));
assert.ok(stubs.every((s) => s.liveVehicleControl === false));
assert.ok(stubs.every((s) => s.preferredExecution === 'LOCAL'));
assert.ok(stubs.every((s) => s.OFFLINE_PREFER_LOCAL === true));
assert.ok(stubs.every((s) => DEVICE_PATHWAY_HONESTY_LABELS.includes(s.honesty)));

for (const kind of DEVICE_PATHWAY_KINDS) {
  const byKind = getDevicePathwaysByKind(registry, kind);
  assert.equal(byKind.length, 1, 'expected one stub for ' + kind);
  assert.equal(byKind[0].kind, kind);
}

const unverified = getDevicePathwaysByHonesty(registry, 'UNVERIFIED');
const waitingProvider = getDevicePathwaysByHonesty(registry, 'WAITING_PROVIDER');
assert.ok(unverified.length >= 1);
assert.ok(waitingProvider.length >= 1);
assert.ok(unverified.some((s) => s.kind === 'PHONE'));
assert.ok(unverified.some((s) => s.kind === 'LAPTOP'));
assert.ok(unverified.some((s) => s.kind === 'EDGE'));
assert.ok(waitingProvider.some((s) => s.kind === 'AUTO'));
assert.ok(waitingProvider.some((s) => s.kind === 'TELECOM'));
assert.ok(waitingProvider.some((s) => s.kind === 'SAT_SIM'));

const partners = listChipPartnerClaims(registry);
assertChipPartnersWaiting(partners);
assert.equal(partners.length, 5);
assert.ok(partners.every((p) => p.status === 'WAITING_PARTNER'));
for (const name of DEVICE_CHIP_PARTNERS) {
  assert.ok(partners.some((p) => p.partner === name), 'missing partner ' + name);
}

const defaults = defaultDevicePathwayStubs('seed');
assert.equal(defaults.length, 6);
const defaultPartners = defaultChipPartnerClaims();
assert.equal(defaultPartners.length, 5);

const custom = createDevicePathwayStub({
  pathwayId: 'custom:edge',
  kind: 'EDGE',
  honesty: 'UNVERIFIED',
});
assert.equal(custom.kind, 'EDGE');
assert.equal(custom.honesty, 'UNVERIFIED');
assert.equal(custom.liveSatelliteControl, false);

assert.throws(
  () =>
    createDevicePathwayStub({
      pathwayId: 'bad',
      kind: 'PHONE',
      honesty: 'VERIFIED' as never,
    }),
  /honesty|invalid/i,
);

assert.throws(
  () =>
    assertChipPartnersWaiting([
      {
        partner: 'nvidia',
        status: 'VERIFIED_PARTNER' as never,
        notes: 'fake',
      },
    ]),
  /WAITING_PARTNER/,
);

// Evidence hash
const tipSha = '5bbf1d32aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const evidence = evidenceHashDevicePathways({
  tipSha,
  registry,
  testsPassed: ['12d17.test.ts'],
});
assert.equal(typeof evidence, 'string');
assert.ok(evidence.length >= 16);

console.log('12d17.test.ts: OK');
console.log(
  JSON.stringify({
    tipShaPlaceholder: tipSha,
    registryId: registry.registryId,
    pathwayKinds: stubs.map((s) => s.kind),
    honesty: stubs.map((s) => ({ kind: s.kind, honesty: s.honesty })),
    chipPartners: partners.map((p) => ({ partner: p.partner, status: p.status })),
    evidence,
    guardrailDumpKeys: Object.keys(dump).sort(),
  }),
);