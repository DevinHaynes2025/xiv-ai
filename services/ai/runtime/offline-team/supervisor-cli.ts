import { resolve } from 'node:path';
import { discoverOllamaModels } from './model-discovery';
import { buildSupervisorSnapshot, buildSupervisorWorkers } from './live-supervisor';
import { writeSupervisorSnapshot } from './supervisor-status';
import type { OfflineMission } from './mission-scheduler';

async function main() {
  const discovery = await discoverOllamaModels({
    fetchImpl: async (url) => fetch(url) as unknown as Promise<{ ok: boolean; json(): Promise<unknown> }>,
  });

  const now = new Date();
  const mission: OfflineMission = {
    missionId: process.env.XIV_MISSION_ID ?? 'xiv-local-build',
    tenantId: process.env.XIV_TENANT_ID ?? 'xiv-local',
    objective: process.env.XIV_MISSION_OBJECTIVE ?? 'Build, review, test, and learn from the XIV offline codebase',
    priority: 100,
    state: 'RUNNING',
    requestedRoles: ['ARCHITECT', 'CODER', 'DATABASE_ENGINEER', 'DATA_MINER', 'SECURITY_REVIEWER', 'QA', 'LEARNING_RECORDER'],
    checkpointRefs: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const workers = buildSupervisorWorkers({ mission, discovery, now });
  const snapshot = buildSupervisorSnapshot({ discovery, workers, now });
  const rootDir = resolve(process.cwd(), '..', '..', '..');
  const output = await writeSupervisorSnapshot(rootDir, snapshot);
  console.log(JSON.stringify({ ...snapshot, statusFile: output }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
