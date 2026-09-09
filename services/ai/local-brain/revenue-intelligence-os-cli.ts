#!/usr/bin/env tsx
/**
 * 62L-DS Revenue Intelligence OS health CLI
 */
import { revenueIntelligenceOsHonesty } from './revenue-intelligence-os';
import { buildRevenueIntelligenceOsHealthReport } from './revenue-intelligence-os-runtime';
import type { DsActor } from './revenue-intelligence-os-types';

const actor: DsActor = {
  kind: 'revenue_intelligence_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildRevenueIntelligenceOsHealthReport({
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
      honesty: revenueIntelligenceOsHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
