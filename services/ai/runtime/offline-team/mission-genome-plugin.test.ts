import assert from 'node:assert/strict';
import { decomposeMission } from './mission-scheduler';
import { matureGenome } from './xiv-genome';
import { createVirtualFamily } from './virtual-family';
import { runnableOfflinePlugins } from './offline-plugin-runtime';

const mission = decomposeMission({
  missionId: 'm1', tenantId: 't1', objective: 'build offline brain', priority: 10,
  state: 'QUEUED', requestedRoles: ['ARCHITECT','CODER','DATABASE_ENGINEER','SECURITY_REVIEWER','QA'],
  checkpointRefs: [], createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
});
assert.equal(mission.length, 5);
assert.equal(mission.every((t) => t.productionMutation === false), true);

const genome = matureGenome({
  genomeId: 'g1', tenantId: 't1', generation: 0, stage: 'SEED',
  capabilities: { REASONING: 1, CODING: 1, DATABASE: 0, SECURITY: 0, LOGISTICS: 0, FINANCE: 0, HISTORY: 0, DATA_MINING: 0, SIMULATION: 0, HARDWARE: 0 },
  evidenceRefs: [], immutableBaseHash: 'abc',
}, ['ev1']);
assert.equal(genome.stage, 'LEARNING');

const family = createVirtualFamily({
  familyId: 'f1', tenantId: 't1', dimensionIds: [1,2,3,3],
  members: [{ agentId: 'a1', genomeId: 'g1', role: 'CODER', tenantId: 't1' }],
  sharedLessonRefs: ['lesson1'],
});
assert.deepEqual(family.dimensionIds, [1,2,3]);

const plugins = runnableOfflinePlugins([
  { pluginId: 'local-history', version: '1.0.0', capabilities: ['ANALYZE_HISTORY'], checksum: 'c1', enabled: true, requiresNetwork: false, mayWriteProduction: false },
  { pluginId: 'network-tool', version: '1.0.0', capabilities: ['READ_LOCAL_DATA'], checksum: 'c2', enabled: true, requiresNetwork: true, mayWriteProduction: false },
]);
assert.equal(plugins.length, 1);
console.log('12D-24 mission/genome/family/plugin contracts: OK');
