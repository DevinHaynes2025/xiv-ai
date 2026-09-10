/**
 * Emit artifacts/12d07 local-browse samples (Architecture Reader + Council UX).
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  addCompany,
  addEconomicSignal,
  addSupplyLink,
  addAgentPopulation,
  upsertWorldStateEntity,
  branchScenario,
  buildArchitectureReaderSummary,
  createSimulatedUniverse,
  createSpatialCoordinate,
  exportArchitectureArtifacts,
} from './index';
import {
  buildCouncilQueueUxSummary,
  exportCouncilQueueArtifacts,
  generateBatch,
  reprioritizeStoryQueue,
} from '../storyfactory';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', '..', '..', '..', 'artifacts', '12d07');
mkdirSync(outDir, { recursive: true });

let universe = createSimulatedUniverse({
  universeId: 'demo-ux',
  tenantId: 'xiv',
  label: '12D-07 Architecture Reader demo',
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
universe = branchScenario(universe, {
  branchId: 'br-1',
  stance: 'HYPOTHESIS',
  label: 'Demand spike hypothesis',
}).universe;

const archSummary = buildArchitectureReaderSummary({
  universe,
  reconcile: {
    status: 'WAITING_SYNC',
    localHash: 'demo',
    expectedHash: null,
    notes: 'local browse sample',
    productionMutation: false,
  },
});
const arch = exportArchitectureArtifacts({
  summary: archSummary,
  outDir,
  basename: 'architecture-reader-demo-ux',
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
const council = exportCouncilQueueArtifacts({
  summary: councilSummary,
  outDir,
  basename: 'adaptive-council-queue',
});

console.log('Wrote 12d07 artifacts:');
console.log(' ', arch.mdPath);
console.log(' ', arch.jsonPath);
console.log(' ', arch.htmlPath);
console.log(' ', council.mdPath);
console.log(' ', council.jsonPath);
console.log(' ', council.htmlPath);
