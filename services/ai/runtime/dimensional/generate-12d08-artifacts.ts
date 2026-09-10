/**
 * Emit artifacts/12d08 local-browse Command Center consumer preview.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  addAgentPopulation,
  addCompany,
  addEconomicSignal,
  addSparseSimulationPathway,
  addSupplyLink,
  buildArchitectureReaderConsumer,
  buildArchitectureReaderSummary,
  createFounderTwinRoster,
  createSimulatedUniverse,
  createSpatialCoordinate,
  planRosterDutyCycle,
  registerTwinReplica,
  upsertWorldStateEntity,
} from './index';
import {
  buildCouncilQueueUxSummary,
  generateBatch,
  reprioritizeStoryQueue,
} from '../storyfactory';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', '..', '..', '..', 'artifacts', '12d08');
mkdirSync(outDir, { recursive: true });

let universe = createSimulatedUniverse({
  universeId: 'demo-cc',
  tenantId: 'xiv',
  label: '12D-08 Command Center consumer demo',
});
universe = addCompany(universe, {
  companyId: 'co-1',
  name: 'North Mill',
  sector: 'manufacturing',
  tenantId: 'xiv',
  location: createSpatialCoordinate({ lon: -87.6, lat: 41.8 }),
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
  count: 18,
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

const archSummary = buildArchitectureReaderSummary({
  universe,
  reconcile: {
    status: 'WAITING_SYNC',
    localHash: 'demo-cc',
    expectedHash: null,
    notes: '12d08 local browse sample',
    productionMutation: false,
  },
});

const batch = generateBatch(9, 8);
const queue = reprioritizeStoryQueue({
  stories: batch.stories,
  availability: [
    { agent: 'LOCAL_RULES', online: true, local: true, canNetwork: false, maxConcurrent: 10 },
    { agent: 'OLLAMA', online: false, local: true, canNetwork: false, maxConcurrent: 5 },
    { agent: 'GROK', online: false, local: false, canNetwork: true, maxConcurrent: 3 },
  ],
});
const councilSummary = buildCouncilQueueUxSummary({ queue, stories: batch.stories });

let roster = createFounderTwinRoster({ tenantId: 'xiv', cycleId: 'cycle-12d08-demo' });
roster = registerTwinReplica(roster, {
  replicaId: 'twin-demo-1',
  kind: 'DIGITAL_TWIN',
  dutyCycle: 0.2,
  energyUsedThisCycle: 35,
  activeShardCount: 6,
});
roster = registerTwinReplica(roster, {
  replicaId: 'twin-demo-2',
  kind: 'COMPRESSED_SHARD_SET',
  dutyCycle: 0.15,
  energyUsedThisCycle: 25,
  activeShardCount: 3,
});
roster = addSparseSimulationPathway(roster);
const dutyPlan = planRosterDutyCycle(roster);

const bundle = buildArchitectureReaderConsumer({
  architectureSummary: archSummary,
  councilSummary,
  roster,
  dutyPlan,
});

const base = 'command-center-consumer-preview';
const htmlPath = join(outDir, base + '.html');
const mdPath = join(outDir, base + '.md');
const jsonPath = join(outDir, base + '.json');
writeFileSync(htmlPath, bundle.html, 'utf8');
writeFileSync(mdPath, bundle.markdown, 'utf8');
writeFileSync(jsonPath, bundle.json, 'utf8');

console.log('Wrote 12d08 artifacts:');
console.log(' ', htmlPath);
console.log(' ', mdPath);
console.log(' ', jsonPath);
