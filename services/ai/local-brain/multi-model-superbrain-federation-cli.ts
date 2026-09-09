#!/usr/bin/env tsx
/**
 * 62L-EB Multi-Model Superbrain Federation health CLI
 */
import { multiModelSuperbrainFederationSystemHonesty } from './multi-model-superbrain-federation-system';
import { buildMultiModelSuperbrainFederationHealthReport } from './multi-model-superbrain-federation-runtime';
import type { EbActor } from './multi-model-superbrain-federation-types';

const actor: EbActor = {
  kind: 'multi_model_federation_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildMultiModelSuperbrainFederationHealthReport({
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
      honesty: multiModelSuperbrainFederationSystemHonesty(
        process.env.XIV_REPO_ROOT,
      ),
    },
    null,
    2,
  ),
);
