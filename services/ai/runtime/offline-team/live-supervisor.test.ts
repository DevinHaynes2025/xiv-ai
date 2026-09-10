import assert from 'node:assert/strict';
import { discoverOllamaModels, selectCodingModel } from './model-discovery';
import { buildSupervisorSnapshot, buildSupervisorWorkers, restartWorker } from './live-supervisor';
import type { OfflineMission } from './mission-scheduler';

const discovery = await discoverOllamaModels({
  fetchImpl: async () => ({
    ok: true,
    async json() {
      return { models: [{ name: 'qwen2.5-coder:7b', size: 4_700_000_000 }] };
    },
  }),
});

assert.equal(discovery.reachable, true);
assert.equal(selectCodingModel(discovery.models)?.name, 'qwen2.5-coder:7b');

const mission: OfflineMission = {
  missionId: 'mission-12d25',
  tenantId: 'xiv-local',
  objective: 'Build and verify the local offline supervisor',
  priority: 100,
  state: 'RUNNING',
  requestedRoles: ['ARCHITECT', 'CODER', 'QA', 'LEARNING_RECORDER'],
  checkpointRefs: [],
  createdAt: '2026-09-10T00:00:00.000Z',
  updatedAt: '2026-09-10T00:00:00.000Z',
};

const workers = buildSupervisorWorkers({ mission, discovery, now: new Date('2026-09-10T00:00:00.000Z') });
assert.equal(workers.length, 4);
assert.equal(workers.find((worker) => worker.role === 'CODER')?.model, 'qwen2.5-coder:7b');
assert.equal(workers.find((worker) => worker.role === 'CODER')?.state, 'READY');
assert.equal(workers.every((worker) => worker.evidence.length > 0), true);

const restarted = restartWorker({ ...workers[0], state: 'FAILED' }, new Date('2026-09-10T00:01:00.000Z'));
assert.equal(restarted.state, 'READY');
assert.equal(restarted.restartCount, 1);

const snapshot = buildSupervisorSnapshot({ discovery, workers, now: new Date('2026-09-10T00:02:00.000Z') });
assert.equal(snapshot.ollamaReachable, true);
assert.equal(snapshot.selectedCodingModel, 'qwen2.5-coder:7b');
assert.equal(snapshot.productionMutationAllowed, false);

console.log('12D-25 live offline supervisor contracts: OK');
