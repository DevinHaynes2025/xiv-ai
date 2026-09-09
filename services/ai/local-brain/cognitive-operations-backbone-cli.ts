#!/usr/bin/env tsx
/**
 * 62L-EG Cognitive Operations Backbone health CLI
 */
import { cognitiveOperationsBackboneOsHonesty } from './cognitive-operations-backbone-os';
import { buildCognitiveOperationsBackboneHealthReport } from './cognitive-operations-backbone-runtime';
import type { EgActor } from './cognitive-operations-backbone-types';

const actor: EgActor = {
  kind: 'cognitive_ops_curator',
  id: 'cli',
  orgId: process.env.XIV_ORG_ID ?? 'org-local',
  tenantId: process.env.XIV_TENANT_ID ?? 'tenant-local',
  universeId: process.env.XIV_UNIVERSE_ID ?? 'universe-local',
};

const report = await buildCognitiveOperationsBackboneHealthReport({
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
      honesty: cognitiveOperationsBackboneOsHonesty(process.env.XIV_REPO_ROOT),
    },
    null,
    2,
  ),
);
