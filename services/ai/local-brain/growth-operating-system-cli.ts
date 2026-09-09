#!/usr/bin/env tsx
/**
 * 62L-DT Growth Operating System health CLI
 */
import { growthOperatingSystemHonesty } from './growth-operating-system';
import { buildGrowthOperatingSystemHealthReport } from './growth-operating-system-runtime';
import type { DtActor } from './growth-operating-system-types';

const actor: DtActor = {
  kind: 'growth_os_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildGrowthOperatingSystemHealthReport({
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
      honesty: growthOperatingSystemHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
