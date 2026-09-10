import assert from 'node:assert/strict';
import { createAgentsForDemand } from './adaptive-agent-factory';
import { publishPeerLesson, acceptPeerLesson } from './peer-learning-mesh';
import { compileStoragePlan } from './storage-compiler';
import { compileParallelScenarios } from './parallel-scenario-compiler';
import { buildControlTowerSnapshot } from './control-tower';
import { planPublicDataIngest } from './public-data-ingest';

const agents = createAgentsForDemand({
  signals: [
    { id: 'd1', tenantId: 'xiv', kind: 'CODE', urgency: 5, backlog: 10 },
    { id: 'd2', tenantId: 'xiv', kind: 'DATA_MINING', urgency: 4, backlog: 9 },
  ],
  existing: [],
});
assert.equal(agents.length, 2);
assert.equal(agents.every((a) => a.productionAuthority === false), true);

const lesson = publishPeerLesson({
  lesson: {
    lessonId: 'l1', tenantId: 'xiv', authorAgentId: agents[0].id, topic: 'queue', summary: 'lease before execute',
    evidenceRefs: ['test:lease'], confidence: 0.9, createdAt: new Date(0).toISOString(), mutatesModelWeights: false, mutatesAgentCode: false,
  },
  recipientAgentIds: [agents[1].id],
});
assert.equal(acceptPeerLesson('xiv', lesson).lessonId, 'l1');
assert.throws(() => acceptPeerLesson('other', lesson));

const cell = compileStoragePlan({ cellId: 'adc:1', tenantId: 'xiv', checksum: 'abc', bytes: 1024, provenanceRefs: ['src:1'], cloudTargets: ['GOOGLE_CLOUD', 'AZURE'] });
assert.equal(cell.replicas[0].status, 'LOCAL_PRESENT');
assert.equal(cell.replicas.filter((r) => r.status === 'PLANNED').length, 2);

const scenarios = compileParallelScenarios({ tenantId: 'xiv', baseScenarioId: 'base', baseSeed: 7, branches: [{ label: 'a', assumptions: ['x'] }, { label: 'b', assumptions: ['y'] }] });
assert.equal(scenarios.every((s) => s.simulated && !s.mayPromoteToFactAutomatically), true);

const tower = buildControlTowerSnapshot({ tenantId: 'xiv', agents, cells: [cell], scenarios });
assert.equal(tower.logicalAgents, 2);
assert.equal(tower.productionAuthority, false);

const ingest = planPublicDataIngest({ sourceId: 'public:1', url: 'https://example.com', publicOrAuthorized: true, robotsAllowed: true, rateLimitPerMinute: 10, tenantId: 'xiv' });
assert.equal(ingest.allowed, true);
assert.equal(ingest.productionWrite, false);

console.log('12D-22 adaptive mesh contracts: OK');
