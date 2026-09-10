import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BUILDER_GUARDRAILS, decideBuilderRequest } from '../builder';
import type { DatabaseNode, HighwayRequest } from '../databasecity';
import { DATABASE_CITY_GUARDRAILS as MULTI_CLOUD_GUARDRAILS } from '../databasecity';
import {
  CURRENT_DIMENSIONAL_MILESTONE,
  PHYSICAL_PORTAL_CAPABILITY,
  PRODUCTION_DIMENSIONAL_FABRIC_ENABLED,
  QUANTUM_ADVANTAGE_CLAIM,
  UNIVERSE_KERNEL_GUARDRAILS,
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  VALUATION_THEATER_ALLOWED,
  addAgentPopulation,
  addCompany,
  addEconomicSignal,
  addSupplyLink,
  applyMemoryHeatToWorldState,
  assertEthicsSafeCopy,
  assertUniverseKernelGuardrails,
  branchScenario,
  buildArchitectureReaderSummary,
  buildOfflineManifest,
  createSimulatedUniverse,
  createSpatialCoordinate,
  emitUniverseBlueprint,
  exportArchitectureArtifacts,
  listPocketMeta,
  openSqliteShardFixture,
  reconcileOfflineManifest,
  renderArchitectureMarkdown,
  routeUniverseThroughCity,
  shardContentChecksum,
  universeFingerprint,
  upsertPocketMeta,
  upsertWorldStateEntity,
} from './index';

assert.equal(CURRENT_DIMENSIONAL_MILESTONE, 12);
assert.equal(PRODUCTION_DIMENSIONAL_FABRIC_ENABLED, false);
assert.equal(PHYSICAL_PORTAL_CAPABILITY, false);
assert.equal(UNIVERSES_ARE_SIMULATION_LAYERS_ONLY, true);
assert.equal(QUANTUM_ADVANTAGE_CLAIM, false);
assert.equal(VALUATION_THEATER_ALLOWED, false);
assertUniverseKernelGuardrails();
assert.equal(UNIVERSE_KERNEL_GUARDRAILS.L4_PRODUCTION_ENABLED, false);
assert.equal(UNIVERSE_KERNEL_GUARDRAILS.autonomousProductionDDL, false);
assert.equal(UNIVERSE_KERNEL_GUARDRAILS.autonomousProductionDML, false);
assert.equal(UNIVERSE_KERNEL_GUARDRAILS.autonomousProductionReplication, false);
assert.equal(UNIVERSE_KERNEL_GUARDRAILS.autonomousCrossTenantReplication, false);
assert.equal(UNIVERSE_KERNEL_GUARDRAILS.autonomousCloudCreation, false);
assert.equal(UNIVERSE_KERNEL_GUARDRAILS.cloudProvidersAreSandboxRoutingOnly, true);
assert.equal(MULTI_CLOUD_GUARDRAILS.autonomousProductionReplication, false);
assert.equal(BUILDER_GUARDRAILS.autonomousDeployment, false);

assert.throws(() => assertEthicsSafeCopy('opens a physical portal to Mars'));
assert.throws(() => assertEthicsSafeCopy('guarantees quantum advantage today'));
assert.throws(() => assertEthicsSafeCopy('trillion-$ valuation theater unlocked'));
assert.doesNotThrow(() =>
  assertEthicsSafeCopy('SIMULATION layer tracks adoption, reliability, security, unit economics, customer value'),
);

let universe = createSimulatedUniverse({
  universeId: 'sim-alpha',
  tenantId: 'xiv',
  label: 'Alpha SIMULATION layer',
});
assert.equal(universe.layerKind, 'SIMULATION');
assert.equal(universe.productionAuthorized, false);
assert.equal(universe.quantumAdvantageClaimed, false);
assert.equal(universe.physicalPortal, false);
assert.equal(universe.cityNodes.length, 5);

universe = addCompany(universe, {
  companyId: 'co-1',
  name: 'North Mill',
  sector: 'manufacturing',
  tenantId: 'xiv',
  location: createSpatialCoordinate({ lon: -87.6, lat: 41.8, localXyz: [0, 0, 0] }),
  memoryHeat: 'hot',
});
universe = addCompany(universe, {
  companyId: 'co-2',
  name: 'South Hub',
  sector: 'logistics',
  tenantId: 'xiv',
  location: createSpatialCoordinate({ lon: -87.7, lat: 41.7 }),
  memoryHeat: 'warm',
});
universe = addSupplyLink(universe, {
  linkId: 'link-1',
  fromCompanyId: 'co-1',
  toCompanyId: 'co-2',
  sku: 'widget-a',
  leadTimeHours: 12,
  reliabilityScore: 0.92,
});
universe = addEconomicSignal(universe, {
  signalId: 'sig-1',
  metric: 'reliability',
  value: 0.92,
  unit: 'ratio',
  stance: 'OBSERVED',
});
universe = addAgentPopulation(universe, {
  populationId: 'pop-1',
  role: 'dispatcher',
  count: 25,
  tenantId: 'xiv',
  offlineCapable: true,
});
universe = upsertWorldStateEntity(universe, {
  entityId: 'ws-1',
  kind: 'facility',
  location: { lon: -87.65, lat: 41.75 },
  memoryHeat: 'hot',
  stance: 'SIMULATION',
  payload: { name: 'Depot A' },
});
universe = applyMemoryHeatToWorldState(universe, 'ws-1', 'warm');
assert.equal(universe.worldState[0].memoryHeat, 'warm');

const branched = branchScenario(universe, {
  branchId: 'br-1',
  stance: 'HYPOTHESIS',
  label: 'Demand spike hypothesis',
});
universe = branched.universe;
assert.equal(universe.branches.length, 1);
assert.equal(universe.branches[0].stance, 'HYPOTHESIS');

assert.throws(() =>
  addCompany(universe, {
    companyId: 'x',
    name: 'Other',
    sector: 'x',
    tenantId: 'other-tenant',
    location: { lon: 0, lat: 0 },
    memoryHeat: 'cold',
  }),
);

const nodes: DatabaseNode[] = [
  {
    id: 'device-1', level: 'DEVICE', provider: 'LOCAL', region: 'device', tier: 'HOT',
    state: 'AVAILABLE', writable: true, vectorCapable: true, graphCapable: true, encrypted: true,
    tenantId: 'xiv', estimatedLatencyMs: 4, estimatedCostPerMillionOps: 1,
  },
  {
    id: 'company-1', level: 'COMPANY', provider: 'GOOGLE_CLOUD', region: 'us-central1', tier: 'WARM',
    state: 'AVAILABLE', writable: true, vectorCapable: true, graphCapable: true, encrypted: true,
    tenantId: 'xiv', estimatedLatencyMs: 35, estimatedCostPerMillionOps: 8,
  },
];
const highway: HighwayRequest = {
  tenantId: 'xiv', requiresWrite: false, requiresVector: true, requiresGraph: false,
  offlinePreferred: true, maxLatencyMs: 100, maxCostPerMillionOps: 20,
  allowedProviders: ['LOCAL', 'GOOGLE_CLOUD', 'AZURE'],
};
const route = routeUniverseThroughCity(universe, nodes, highway, 'LOCAL');
assert.equal(route.productionAuthorized, false);
assert.equal(route.target, 'LOCAL');
assert.equal(route.multiCloudRoute?.nodeIds[0], 'device-1');
assert.ok(route.cityPath);

const fixture = openSqliteShardFixture('memory');
try {
  upsertPocketMeta(fixture, {
    entityId: 'ws-1', kind: 'facility', contentHash: universe.worldState[0].payloadHash,
    heatTier: 'warm', residency: 'us-central', provenance: 'pocket-brain:sim-alpha',
    updatedAt: '2026-09-09T00:00:00.000Z',
  });
  const rows = listPocketMeta(fixture);
  assert.equal(rows.length, 1);
  const checksum = shardContentChecksum(fixture);
  assert.ok(checksum.startsWith('dg1:'));

  const localManifest = buildOfflineManifest({
    manifestId: 'm-local', shardId: 'shard-device-1', tenantId: 'xiv', rows,
    heatTier: 'warm', residency: 'us-central',
    provenance: { source: 'pocket', capturedAt: '2026-09-09T00:00:00.000Z' },
  });
  assert.equal(localManifest.productionMutation, false);
  assert.equal(reconcileOfflineManifest(localManifest, null).status, 'WAITING_SYNC');
  assert.equal(reconcileOfflineManifest(localManifest, { ...localManifest, manifestId: 'm-expected' }).status, 'IN_SYNC');
  assert.equal(
    reconcileOfflineManifest(localManifest, { ...localManifest, manifestId: 'm-diff', contentHash: 'dg1:deadbeefdeadbeef' }).status,
    'CONFLICT',
  );
} finally {
  fixture.close();
}

const tempFixture = openSqliteShardFixture('temp-file');
try {
  upsertPocketMeta(tempFixture, {
    entityId: 'e-temp', kind: 'signal', contentHash: 'dg1:abc', heatTier: 'hot',
    residency: 'edge', provenance: 'test', updatedAt: '2026-09-09T00:00:00.000Z',
  });
  assert.equal(listPocketMeta(tempFixture).length, 1);
  assert.notEqual(tempFixture.path, ':memory:');
} finally {
  tempFixture.close();
}

const summary = buildArchitectureReaderSummary({
  universe, route,
  reconcile: { status: 'WAITING_SYNC', localHash: 'x', expectedHash: null, notes: 'n', productionMutation: false },
});
assert.equal(summary.layerKind, 'SIMULATION');
assert.equal(summary.companyCount, 2);
assert.equal(summary.branchCount, 1);
assert.ok(summary.fingerprint === universeFingerprint(universe));
const md = renderArchitectureMarkdown(summary);
assert.match(md, /SIMULATION/);
assert.doesNotMatch(md, /physical portal/i);

const outDir = mkdtempSync(join(tmpdir(), 'xiv-12d05-arch-'));
try {
  const exported = exportArchitectureArtifacts({ summary, outDir, basename: 'sim-alpha' });
  assert.ok(readFileSync(exported.mdPath, 'utf8').includes('Architecture Reader'));
  assert.ok(JSON.parse(readFileSync(exported.jsonPath, 'utf8')).universeId === 'sim-alpha');

  const emitted = await emitUniverseBlueprint({
    universeId: 'sim-alpha', tenantId: 'xiv', outDir, preferOllama: true,
  });
  assert.equal(emitted.appliedDdl, false);
  assert.equal(emitted.productionDeploy, false);
  assert.ok(['LOCAL_RULES', 'WAITING_PROVIDER', 'OLLAMA'].includes(emitted.providerStatus));
  assert.ok(readFileSync(emitted.artifactPath, 'utf8').includes('REVIEW ONLY'));
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

const blocked = decideBuilderRequest({
  requestId: '12d05-prod', provider: 'LOCAL_RULES', target: 'PRODUCTION',
  artifactKind: 'DATABASE_SCHEMA', objective: 'must block',
  repositoryBranch: 'grok/12d-05-universe-simulation-kernel',
  requiresNetwork: false, touchesProductionData: true, destructive: false,
});
assert.equal(blocked.allowed, false);

console.log('XIV 12D-05 Universe Simulation Kernel contracts hold (SIMULATION-only, L4=false, ethics gates).');