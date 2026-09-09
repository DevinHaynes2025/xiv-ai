#!/usr/bin/env tsx
/**
 * 62L-DQ Universal Integration Brain health CLI
 */
import { universalIntegrationBrainHonesty } from './universal-integration-brain';
import { buildUniversalIntegrationBrainHealthReport } from './universal-integration-brain-runtime';
import type { DqActor } from './universal-integration-brain-types';

const actor: DqActor = {
  kind: 'integration_brain_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildUniversalIntegrationBrainHealthReport({
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
      honesty: universalIntegrationBrainHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
