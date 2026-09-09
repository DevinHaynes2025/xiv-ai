#!/usr/bin/env tsx
/**
 * 62L-ED Data Galaxy & Industry Memory OS health CLI
 */
import { dataGalaxyIndustryMemoryOsSystemHonesty } from './data-galaxy-industry-memory-os-system';
import { buildDataGalaxyIndustryMemoryOsHealthReport } from './data-galaxy-industry-memory-os-runtime';
import type { EdActor } from './data-galaxy-industry-memory-os-types';

const actor: EdActor = {
  kind: 'data_galaxy_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildDataGalaxyIndustryMemoryOsHealthReport({
  orgId: actor.orgId,
  tenantId: actor.tenantId,
  universeId: actor.universeId,
  actor,
  root: process.env.XIV_ROOT ?? process.cwd(),
  repoRoot: process.env.XIV_REPO_ROOT,
});

console.log(
  JSON.stringify(
    {
      report,
      honesty: dataGalaxyIndustryMemoryOsSystemHonesty(
        process.env.XIV_REPO_ROOT,
      ),
    },
    null,
    2,
  ),
);
