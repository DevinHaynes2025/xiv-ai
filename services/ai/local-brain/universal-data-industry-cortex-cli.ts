#!/usr/bin/env tsx
/**
 * 62L-DV Universal Data & Industry Cortex health CLI
 */
import { universalDataIndustryCortexHonesty } from './universal-data-industry-cortex';
import { buildUniversalDataIndustryCortexHealthReport } from './universal-data-industry-cortex-runtime';
import type { DvActor } from './universal-data-industry-cortex-types';

const actor: DvActor = {
  kind: 'data_industry_cortex_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildUniversalDataIndustryCortexHealthReport({
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
      honesty: universalDataIndustryCortexHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
