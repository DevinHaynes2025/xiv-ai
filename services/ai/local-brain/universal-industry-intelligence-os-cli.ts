#!/usr/bin/env tsx
/**
 * 62L-DU Universal Industry Intelligence OS health CLI
 */
import { universalIndustryIntelligenceOsHonesty } from './universal-industry-intelligence-os';
import { buildUniversalIndustryIntelligenceOsHealthReport } from './universal-industry-intelligence-os-runtime';
import type { DuActor } from './universal-industry-intelligence-os-types';

const actor: DuActor = {
  kind: 'industry_os_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildUniversalIndustryIntelligenceOsHealthReport({
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
      honesty: universalIndustryIntelligenceOsHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
