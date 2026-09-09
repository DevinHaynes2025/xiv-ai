#!/usr/bin/env tsx
/**
 * 62L-DP Plugin Civilization OS health CLI
 */
import { pluginCivilizationOsHonesty } from './plugin-civilization-os';
import { buildPluginCivilizationOsHealthReport } from './plugin-civilization-os-runtime';
import type { DpActor } from './plugin-civilization-os-types';

const actor: DpActor = {
  kind: 'plugin_civilization_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildPluginCivilizationOsHealthReport({
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
      honesty: pluginCivilizationOsHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
