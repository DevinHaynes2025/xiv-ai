#!/usr/bin/env tsx
/**
 * 62L-EA Global Operations Intelligence Grid health CLI
 */
import { globalOperationsIntelligenceGridSystemHonesty } from './global-operations-intelligence-grid-system';
import { buildGlobalOperationsIntelligenceGridHealthReport } from './global-operations-intelligence-grid-runtime';
import type { EaActor } from './global-operations-intelligence-grid-types';

const actor: EaActor = {
  kind: 'global_ops_intelligence_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildGlobalOperationsIntelligenceGridHealthReport({
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
      honesty: globalOperationsIntelligenceGridSystemHonesty(
        process.env.XIV_REPO_ROOT,
      ),
    },
    null,
    2,
  ),
);
