#!/usr/bin/env tsx
/**
 * 62L-DR Enterprise Nervous System OS + Revenue Command health CLI
 */
import { enterpriseNervousRevenueCommandOsHonesty } from './enterprise-nervous-revenue-command-os';
import { buildEnterpriseNervousRevenueCommandHealthReport } from './enterprise-nervous-revenue-command-runtime';
import type { DrActor } from './enterprise-nervous-revenue-command-types';

const actor: DrActor = {
  kind: 'enterprise_nervous_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildEnterpriseNervousRevenueCommandHealthReport({
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
      honesty: enterpriseNervousRevenueCommandOsHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
