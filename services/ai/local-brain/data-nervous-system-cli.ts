#!/usr/bin/env tsx
/**
 * 62L-EE Data Nervous System health CLI
 */
import { dataNervousSystemOsHonesty } from './data-nervous-system-os';
import { buildDataNervousSystemHealthReport } from './data-nervous-system-runtime';
import type { EeActor } from './data-nervous-system-types';

const actor: EeActor = {
  kind: 'data_nervous_system_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildDataNervousSystemHealthReport({
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
      honesty: dataNervousSystemOsHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
