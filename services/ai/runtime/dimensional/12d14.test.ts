/**
 * 12D-14 — Virtual Mini City registry (SIMULATION-only catalog).
 * LOCAL / OFFLINE_PREFER_LOCAL; virtual servers + DB shards + pathways stubs;
 * no DDL; no PRODUCTION; accelerators UNVERIFIED; ADC scale aspirational vs measured.
 */
import assert from 'node:assert/strict';
import {
  VIRTUAL_MINI_CITY_GUARDRAILS,
  VIRTUAL_MINI_CITY_SAFE_ENVIRONMENTS,
  VIRTUAL_MINI_CITY_SCHEMA_VERSION,
  HIGH_AUTONOMY_TARGETS,
  OFFLINE_PREFER_LOCAL,
  VALUATION_THEATER_ALLOWED,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  applyVirtualMiniCityProductionDdl,
  assertScaleClaimsHonest,
  assertVirtualMiniCityAcceleratorsUnverifiedExceptCpu,
  bypassPolicyGateViaVirtualMiniCity,
  buildVirtualMiniCityCatalog,
  defaultVirtualMiniCityScaleClaims,
  dumpVirtualMiniCityGuardrails,
  evidenceHashVirtualMiniCity,
  findVirtualPathway,
  getScaleClaimsByKind,
  labelAspirationalScaleAsMeasured,
  listVirtualDbShards,
  listVirtualPathways,
  listVirtualServers,
  materializeVirtualMiniCityProductionInfra,
  virtualMiniCityAcceleratorClaims,
} from './index';
import { BUILDER_GUARDRAILS as POLICY_BUILDER_GUARDRAILS } from '../builder/policy';

// --- Locked Virtual Mini City contract ---
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.readOnly, true);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.simulationOnly, true);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.OFFLINE_PREFER_LOCAL, true);
assert.equal(OFFLINE_PREFER_LOCAL, true);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.preferredExecution, 'LOCAL');
assert.deepEqual([...VIRTUAL_MINI_CITY_SAFE_ENVIRONMENTS], ['LOCAL']);
assert.deepEqual([...VIRTUAL_MINI_CITY_GUARDRAILS.executionAllowList], ['LOCAL']);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.cloudSandboxAllowed, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.productionAllowed, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.productionAutoApply, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.productionAutoMerge, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.productionAutoDeploy, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.autonomousProductionDML, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.destructiveDbAutoApply, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.L4_PRODUCTION_ENABLED, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.liveCloudSyncClaimed, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.liveCloudSyncFabricationAllowed, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.policyGateBypassAllowed, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.noDdl, true);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.noDml, true);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.noDeploy, true);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.materializeProductionInfraAllowed, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.acceleratorVerifiedAllowed, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.fakeVerifiedAcceleratorAllowed, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.aspirationalScaleAsMeasuredAllowed, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.atomDbClaimAllowed, false);
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.ticket, '12D-14');
assert.equal(VIRTUAL_MINI_CITY_GUARDRAILS.virtualMiniCityWire, 'WIRED');
assert.equal(VIRTUAL_MINI_CITY_SCHEMA_VERSION, '12d14.1');
assert.equal(VALUATION_THEATER_ALLOWED, false);
assert.equal(UNIVERSES_ARE_SIMULATION_LAYERS_ONLY, true);
assert.equal(POLICY_BUILDER_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(POLICY_BUILDER_GUARDRAILS.autonomousProductionDML, false);
assert.deepEqual([...HIGH_AUTONOMY_TARGETS], ['LOCAL', 'CLOUD_SANDBOX']);

const dump = dumpVirtualMiniCityGuardrails();
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
assert.deepEqual(dump.safeEnvironments, ['LOCAL']);

assert.throws(() => applyVirtualMiniCityProductionDdl(), /DDL/);
assert.throws(() => materializeVirtualMiniCityProductionInfra(), /production infra/);
assert.throws(() => bypassPolicyGateViaVirtualMiniCity(), /Policy Gate/);
assert.throws(() => labelAspirationalScaleAsMeasured('atomic_data_cell_addressable_scale'), /aspirational/);

const accel = virtualMiniCityAcceleratorClaims();
assertVirtualMiniCityAcceleratorsUnverifiedExceptCpu(accel);
assert.equal(accel.find((c) => c.backend === 'cpu')?.status, 'VERIFIED');
assert.equal(accel.find((c) => c.backend === 'gpu')?.status, 'WAITING');
assert.equal(accel.find((c) => c.backend === 'npu')?.status, 'WAITING');
assert.equal(accel.find((c) => c.backend === 'qpu')?.status, 'WAITING');
assert.throws(
  () =>
    assertVirtualMiniCityAcceleratorsUnverifiedExceptCpu([
      { backend: 'gpu', status: 'VERIFIED', notes: 'fake' },
    ]),
  /UNVERIFIED/,
);

// --- Catalog: servers + shards + pathways ---
const catalog = buildVirtualMiniCityCatalog({ seed: 'xiv-12d14-test' });
assert.equal(catalog.simulationOnly, true);
assert.equal(catalog.preferredExecution, 'LOCAL');
assert.equal(catalog.OFFLINE_PREFER_LOCAL, true);
assert.equal(catalog.liveCloudSyncClaimed, false);
assert.equal(catalog.productionAutoApply, false);
assert.equal(catalog.schemaVersion, '12d14.1');
assert.ok(catalog.cityId.includes('virtual-mini-city'));

const servers = listVirtualServers(catalog);
assert.equal(servers.length, 4);
assert.ok(servers.every((s) => s.simulationOnly === true));
assert.ok(servers.every((s) => s.productionAuthorized === false));
assert.ok(servers.every((s) => s.offlineCapable === true));
assert.ok(servers.some((s) => s.role === 'pocket_edge'));
assert.ok(servers.some((s) => s.role === 'local_shard_host'));
assert.ok(servers.some((s) => s.role === 'pathway_relay'));
assert.ok(servers.some((s) => s.role === 'neural_brain_stub'));

const shards = listVirtualDbShards(catalog);
assert.equal(shards.length, 3);
assert.ok(shards.every((s) => s.ddlApplied === false));
assert.ok(shards.every((s) => s.simulationOnly === true));
assert.ok(shards.every((s) => s.offlineEligible === true));
assert.ok(shards.some((s) => s.kind === 'SQLITE'));
assert.ok(shards.some((s) => s.kind === 'OBJECT_STORE'));
assert.ok(shards.some((s) => s.kind === 'VECTOR_STUB'));

const pathways = listVirtualPathways(catalog);
assert.equal(pathways.length, 4);
assert.ok(pathways.every((p) => p.simulationOnly === true));
assert.ok(pathways.every((p) => p.liveCloudSyncClaimed === false));

const path = findVirtualPathway(catalog, servers[0].serverId, servers[3].serverId);
assert.ok(path);
assert.ok(path!.path.length >= 3);
assert.equal(path!.path[0], servers[0].serverId);
assert.equal(path!.path[path!.path.length - 1], servers[3].serverId);

// --- Scale honesty: aspirational vs measured ---
const defaults = defaultVirtualMiniCityScaleClaims();
assertScaleClaimsHonest(defaults);
const measured = getScaleClaimsByKind(catalog, 'measured');
const aspirational = getScaleClaimsByKind(catalog, 'aspirational');
assert.ok(measured.length >= 2);
assert.ok(aspirational.length >= 2);
assert.ok(aspirational.every((c) => /aspirational/i.test(c.notes)));
assert.ok(
  aspirational.some((c) => c.metric === 'atomic_data_cell_addressable_scale'),
);

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
const tipSha = '44d1f428958ea66e7fabb05c814fd22864fecdb4';
const evidence = evidenceHashVirtualMiniCity({
  tipSha,
  catalog,
  testsPassed: ['12d14.test.ts'],
});
assert.equal(typeof evidence, 'string');
assert.ok(evidence.length >= 16);

console.log('12d14.test.ts: OK');
console.log(
  JSON.stringify({
    tipShaPlaceholder: tipSha,
    cityId: catalog.cityId,
    servers: servers.length,
    shards: shards.length,
    pathways: pathways.length,
    measuredScale: measured.map((c) => c.metric),
    aspirationalScale: aspirational.map((c) => c.metric),
    evidence,
    guardrailDumpKeys: Object.keys(dump).sort(),
  }),
);
